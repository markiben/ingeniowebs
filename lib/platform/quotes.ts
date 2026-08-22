import { createId, readDb, updateDb } from "./store";
import { createProject } from "./projects";
import {
  computeQuoteTotals,
  computeRefundAmount,
  expectedAmountPaid,
  QUOTE_REFUND_PERCENT,
} from "./quote-commerce";
import type {
  PlatformProject,
  PlatformQuote,
  QuotePayload,
  QuotePaymentChannel,
  QuotePaymentSchedule,
} from "./types";

export function generateQuoteCode(date = new Date()) {
  const year = date.getFullYear();
  const db = readDb();
  const prefix = `IQ-${year}-`;
  const sameYear = (db.quotes ?? [])
    .map((quote) => quote.code)
    .filter((code) => code.startsWith(prefix))
    .map((code) => Number(code.slice(prefix.length)))
    .filter((value) => Number.isFinite(value));

  const next = (sameYear.length ? Math.max(...sameYear) : 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export function listQuotes() {
  return [...(readDb().quotes ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getQuoteById(id: string) {
  return (readDb().quotes ?? []).find((quote) => quote.id === id) ?? null;
}

export function createQuote(input: {
  clientName: string;
  clientEmail: string;
  hours: number;
  hourlyRate: number;
  currency?: "ARS" | "USD";
  discountPercent?: number;
  paymentSchedule: QuotePaymentSchedule;
  paymentChannel: QuotePaymentChannel;
  paymentNote?: string;
  sourceJson: string;
  normalized: QuotePayload;
}): PlatformQuote {
  const now = new Date().toISOString();
  const code = generateQuoteCode();
  const currency = input.currency === "ARS" ? "ARS" : "USD";
  const totals = computeQuoteTotals({
    hours: input.hours,
    hourlyRate: input.hourlyRate,
    discountPercent: input.discountPercent,
  });

  const quote: PlatformQuote = {
    id: createId("quote"),
    code,
    createdAt: now,
    updatedAt: now,
    status: "sent",
    clientName: input.clientName.trim(),
    clientEmail: input.clientEmail.trim().toLowerCase(),
    hours: totals.hours,
    hourlyRate: totals.hourlyRate,
    currency,
    subtotal: totals.subtotal,
    discountPercent: totals.discountPercent,
    discountAmount: totals.discountAmount,
    total: totals.total,
    paymentSchedule: input.paymentSchedule,
    paymentChannel: input.paymentChannel,
    paymentNote: (input.paymentNote ?? "").trim(),
    sourceJson: input.sourceJson,
    normalized: input.normalized,
    pdfFileName: `cotizacion-${code}.pdf`,
    projectId: null,
    projectCode: null,
    approvedAt: null,
  };

  updateDb((db) => {
    if (!Array.isArray(db.quotes)) db.quotes = [];
    db.quotes.unshift(quote);
  });

  return quote;
}

export function markQuoteSent(id: string) {
  return updateDb((db) => {
    const quote = (db.quotes ?? []).find((entry) => entry.id === id);
    if (!quote) return;
    if (
      quote.status === "approved" ||
      quote.status === "rejected" ||
      quote.status === "cancelled"
    ) {
      return;
    }
    quote.status = "sent";
    quote.updatedAt = new Date().toISOString();
  });
}

export function rejectQuote(quoteId: string): PlatformQuote | null {
  const existing = getQuoteById(quoteId);
  if (!existing) return null;
  if (existing.status === "approved" || existing.status === "cancelled") {
    return existing;
  }

  updateDb((db) => {
    const quote = (db.quotes ?? []).find((entry) => entry.id === quoteId);
    if (!quote) return;
    if (quote.status === "approved" || quote.status === "cancelled") return;
    quote.status = "rejected";
    quote.updatedAt = new Date().toISOString();
  });

  return getQuoteById(quoteId);
}

function buildProjectDescriptionFromQuote(quote: PlatformQuote) {
  const payload = quote.normalized;
  const parts = [
    `Cotización aprobada: ${quote.code}`,
    payload.project.summary?.trim() || "",
    payload.project.scope?.length
      ? `Alcance:\n- ${payload.project.scope.join("\n- ")}`
      : "",
    payload.project.timelineNote?.trim()
      ? `Plazo: ${payload.project.timelineNote.trim()}`
      : "",
    quote.paymentNote?.trim()
      ? `Detalle de pago: ${quote.paymentNote.trim()}`
      : "",
    payload.project.notes?.trim() ? `Notas: ${payload.project.notes.trim()}` : "",
  ].filter(Boolean);

  return parts.join("\n\n");
}

/** Aprueba la cotización y crea el proyecto IW para registro del cliente. */
export function approveQuote(quoteId: string): {
  quote: PlatformQuote;
  project: PlatformProject;
} | null {
  const existing = getQuoteById(quoteId);
  if (!existing) return null;
  if (existing.status === "cancelled") return null;

  if (existing.status === "approved" && existing.projectId) {
    const project =
      readDb().projects.find((entry) => entry.id === existing.projectId) ?? null;
    if (project) return { quote: existing, project };
  }

  const project = createProject({
    name: existing.normalized.project.title || `Proyecto ${existing.code}`,
    clientName: existing.clientName,
    clientEmail: existing.clientEmail,
    value: existing.total,
    currency: existing.currency,
    description: buildProjectDescriptionFromQuote(existing),
    pricingType: "hourly",
    hoursEstimated: existing.hours,
    hoursInvested: 0,
    hourlyCost: existing.hourlyRate,
    maintenancePlan: false,
    quoteId: existing.id,
    quoteCode: existing.code,
  });

  const now = new Date().toISOString();
  updateDb((db) => {
    const quote = (db.quotes ?? []).find((entry) => entry.id === quoteId);
    if (!quote) return;
    quote.status = "approved";
    quote.projectId = project.id;
    quote.projectCode = project.code;
    quote.approvedAt = now;
    quote.updatedAt = now;

    const created = db.projects.find((entry) => entry.id === project.id);
    if (created) {
      // El pago se confirma después desde Proyectos (admin).
      created.amountPaid = 0;
      created.paymentStatus = "unpaid";
      created.updatedAt = now;
    }
  });

  const quote = getQuoteById(quoteId);
  if (!quote) return null;
  const refreshed =
    readDb().projects.find((entry) => entry.id === project.id) ?? project;
  return { quote, project: refreshed };
}

/** Cancela el proyecto de una cotización aprobada y registra devolución 50%.
 *  La cotización permanece aprobada; la cancelación aplica al proyecto en curso. */
export function cancelApprovedQuote(
  quoteId: string,
  amountPaidInput?: number,
): {
  quote: PlatformQuote;
  project: PlatformProject | null;
  amountPaid: number;
  refundAmount: number;
} | null {
  const existing = getQuoteById(quoteId);
  if (!existing) return null;
  if (existing.status !== "approved" && existing.status !== "cancelled") {
    return null;
  }
  if (!existing.projectId) return null;

  const amountPaid =
    Number.isFinite(amountPaidInput) && (amountPaidInput as number) >= 0
      ? Math.round((amountPaidInput as number) * 100) / 100
      : expectedAmountPaid({
          total: existing.total,
          paymentSchedule: existing.paymentSchedule,
        });
  const refundAmount = computeRefundAmount(amountPaid, QUOTE_REFUND_PERCENT);
  const now = new Date().toISOString();

  updateDb((db) => {
    const quote = (db.quotes ?? []).find((entry) => entry.id === quoteId);
    if (!quote) return;
    if (quote.status !== "approved" && quote.status !== "cancelled") return;
    if (!quote.projectId) return;

    quote.status = "approved";
    quote.updatedAt = now;

    const project = db.projects.find((entry) => entry.id === quote.projectId);
    if (!project) return;

    project.status = "cancelled";
    project.accessEnabled = false;
    project.amountPaid = amountPaid;
    project.refundPercent = QUOTE_REFUND_PERCENT;
    project.refundAmount = refundAmount;
    project.cancelledAt = now;
    project.updatedAt = now;
    project.description = [
      project.description?.trim(),
      `Cancelado ${now.slice(0, 10)}. Abonado: ${amountPaid}. Devolucion ${QUOTE_REFUND_PERCENT}%: ${refundAmount}.`,
    ]
      .filter(Boolean)
      .join("\n\n");
  });

  const quote = getQuoteById(quoteId);
  if (!quote) return null;
  const project = quote.projectId
    ? readDb().projects.find((entry) => entry.id === quote.projectId) ?? null
    : null;

  return { quote, project, amountPaid, refundAmount };
}
