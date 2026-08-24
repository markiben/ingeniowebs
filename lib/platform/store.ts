import fs from "fs";
import path from "path";
import {
  isQuotePaymentChannel,
  isQuotePaymentSchedule,
} from "./quote-commerce";
import { normalizeProjectStatus } from "./project-status";
import type {
  NewsletterClickEvent,
  NewsletterSubscriber,
  PlatformDatabase,
  PlatformProject,
  PlatformQuote,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "platform");
const DB_PATH = path.join(DATA_DIR, "db.json");

const emptyDb = (): PlatformDatabase => ({
  users: [],
  projects: [],
  leads: [],
  messages: [],
  blogDrafts: [],
  liveChats: [],
  newsletterSubscribers: [],
  newsletterClicks: [],
  quotes: [],
  notificationStates: [],
  liveChatBotMode: false,
});

function normalizeQuote(
  quote: PlatformQuote & { subtotal?: number; discountPercent?: number },
): PlatformQuote {
  const hours = Number(quote.hours) || 0;
  const hourlyRate = Number(quote.hourlyRate) || 0;
  const subtotal =
    Number(quote.subtotal) ||
    Math.round(hours * hourlyRate * 100) / 100;
  const discountPercent = Number(quote.discountPercent) || 0;
  const discountAmount =
    Number(quote.discountAmount) ||
    Math.round(subtotal * (discountPercent / 100) * 100) / 100;
  const total =
    Number(quote.total) ||
    Math.round((subtotal - discountAmount) * 100) / 100;

  return {
    ...quote,
    subtotal,
    discountPercent,
    discountAmount,
    total,
    paymentSchedule: isQuotePaymentSchedule(String(quote.paymentSchedule ?? ""))
      ? (quote.paymentSchedule as PlatformQuote["paymentSchedule"])
      : "fifty_fifty",
    paymentChannel: isQuotePaymentChannel(String(quote.paymentChannel ?? ""))
      ? (quote.paymentChannel as PlatformQuote["paymentChannel"])
      : "usd_transfer",
    paymentNote: quote.paymentNote ?? "",
    projectId: quote.projectId ?? null,
    projectCode: quote.projectCode ?? null,
    approvedAt: quote.approvedAt ?? null,
    cancelledAt: quote.cancelledAt ?? null,
    amountPaid: quote.amountPaid ?? null,
    refundPercent: quote.refundPercent ?? null,
    refundAmount: quote.refundAmount ?? null,
  };
}

function normalizeProject(
  project: Partial<PlatformProject> &
    Pick<
      PlatformProject,
      | "id"
      | "code"
      | "name"
      | "clientName"
      | "clientEmail"
      | "value"
      | "currency"
      | "status"
      | "progress"
      | "description"
      | "createdAt"
      | "updatedAt"
      | "accessEnabled"
    >,
): PlatformProject {
  return {
    ...project,
    status: normalizeProjectStatus(project.status),
    completedAt: project.completedAt ?? null,
    pricingType: project.pricingType ?? "fixed",
    hoursEstimated: Number(project.hoursEstimated) || 0,
    hoursInvested: Number(project.hoursInvested) || 0,
    hourlyCost: Number(project.hourlyCost) || 0,
    maintenancePlan: Boolean(project.maintenancePlan),
    quoteId: project.quoteId ?? null,
    quoteCode: project.quoteCode ?? null,
    services: Array.isArray(project.services) ? project.services : [],
    paymentStatus:
      project.paymentStatus === "unpaid" ||
      project.paymentStatus === "deposit_paid" ||
      project.paymentStatus === "paid_in_full"
        ? project.paymentStatus
        : "unpaid",
    amountPaid: project.amountPaid ?? null,
    refundPercent: project.refundPercent ?? null,
    refundAmount: project.refundAmount ?? null,
    cancelledAt: project.cancelledAt ?? null,
    clientUpdates: Array.isArray(project.clientUpdates)
      ? project.clientUpdates
      : [],
    cancelRequest: project.cancelRequest ?? null,
  };
}

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(emptyDb(), null, 2), "utf8");
  }
}

export function readDb(): PlatformDatabase {
  ensureStore();
  try {
    const raw = fs.readFileSync(/* turbopackIgnore: true */ DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<PlatformDatabase>;
    return {
      users: parsed.users ?? [],
      projects: (parsed.projects ?? []).map((project) =>
        normalizeProject(project as PlatformProject),
      ),
      leads: parsed.leads ?? [],
      messages: parsed.messages ?? [],
      blogDrafts: parsed.blogDrafts ?? [],
      liveChats: parsed.liveChats ?? [],
      newsletterSubscribers: (parsed.newsletterSubscribers ?? []).map((entry) => {
        const item = entry as NewsletterSubscriber;
        return {
          ...item,
          sources: Array.isArray(item.sources) ? item.sources : ["other"],
          status:
            item.status === "unsubscribed" ||
            (item.status as string) === "bounced"
              ? "unsubscribed"
              : "active",
          unsubscribedAt: item.unsubscribedAt ?? null,
        } satisfies NewsletterSubscriber;
      }),
      newsletterClicks: Array.isArray(parsed.newsletterClicks)
        ? (parsed.newsletterClicks as NewsletterClickEvent[])
        : [],
      quotes: (parsed.quotes ?? []).map((quote) =>
        normalizeQuote(quote as PlatformQuote),
      ),
      notificationStates: Array.isArray(parsed.notificationStates)
        ? parsed.notificationStates
        : [],
      liveChatBotMode: Boolean(parsed.liveChatBotMode),
    };
  } catch (error) {
    // Nunca pisar el archivo ante un parse fallido (p. ej. lectura a mitad
    // de un write concurrente). Preferir fallar en caliente a borrar datos.
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`No se pudo leer data/platform/db.json: ${message}`);
  }
}

export function writeDb(db: PlatformDatabase) {
  ensureStore();
  const payload = JSON.stringify(db, null, 2);
  // Nombre único evita choques si hay dos escrituras casi juntas (chat + typing).
  const tmpPath = `${DB_PATH}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(/* turbopackIgnore: true */ tmpPath, payload, "utf8");

  const maxAttempts = 8;
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      try {
        fs.renameSync(/* turbopackIgnore: true */ tmpPath, DB_PATH);
      } catch (error) {
        const code =
          error && typeof error === "object" && "code" in error
            ? String((error as { code?: string }).code)
            : "";
        // En Windows el rename falla si otro proceso tiene el archivo abierto.
        if (code === "EPERM" || code === "EACCES" || code === "EBUSY") {
          fs.copyFileSync(/* turbopackIgnore: true */ tmpPath, DB_PATH);
          try {
            fs.unlinkSync(/* turbopackIgnore: true */ tmpPath);
          } catch {
            /* ignore */
          }
        } else {
          throw error;
        }
      }
      return;
    } catch (error) {
      lastError = error;
      const code =
        error && typeof error === "object" && "code" in error
          ? String((error as { code?: string }).code)
          : "";
      if (
        (code === "EPERM" || code === "EACCES" || code === "EBUSY") &&
        attempt < maxAttempts - 1
      ) {
        const waitMs = 25 * (attempt + 1);
        const until = Date.now() + waitMs;
        while (Date.now() < until) {
          /* busy wait corto: writeDb es sync */
        }
        continue;
      }
      break;
    }
  }

  try {
    fs.unlinkSync(/* turbopackIgnore: true */ tmpPath);
  } catch {
    /* ignore */
  }
  const message =
    lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`No se pudo guardar data/platform/db.json: ${message}`);
}

/** Serializa updates para evitar EPERM por escrituras concurrentes en Windows. */
let dbLocked = false;

function withDbLock<T>(fn: () => T): T {
  const started = Date.now();
  while (dbLocked) {
    if (Date.now() - started > 5000) {
      throw new Error("Timeout esperando escritura de db.json");
    }
    const until = Date.now() + 5;
    while (Date.now() < until) {
      /* spin */
    }
  }
  dbLocked = true;
  try {
    return fn();
  } finally {
    dbLocked = false;
  }
}

export function updateDb(
  mutator: (db: PlatformDatabase) => void,
): PlatformDatabase {
  return withDbLock(() => {
    const db = readDb();
    const before = JSON.stringify(db);
    mutator(db);
    const after = JSON.stringify(db);
    // Evita reescribir el archivo si no cambió nada (en dev el watch
    // de data/ remonta el sitio y saca el foco del chat).
    if (before !== after) writeDb(db);
    return db;
  });
}

export { createId } from "./id";

