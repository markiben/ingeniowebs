export type QuotePaymentSchedule =
  | "full_upfront"
  | "fifty_fifty"
  | "forty_forty_twenty";

export type QuotePaymentChannel =
  | "usd_transfer"
  | "ars_transfer"
  | "crypto_usdt";

export const QUOTE_PAYMENT_SCHEDULES: {
  id: QuotePaymentSchedule;
  label: string;
  pdfLines: string[];
}[] = [
  {
    id: "full_upfront",
    label: "100% por adelantado",
    pdfLines: ["Pago del 100% por adelantado para iniciar el proyecto."],
  },
  {
    id: "fifty_fifty",
    label: "50% adelanto + 50% al finalizar",
    pdfLines: [
      "50% por adelantado al confirmar la propuesta.",
      "50% restante al finalizar y antes de la entrega final.",
    ],
  },
  {
    id: "forty_forty_twenty",
    label: "40% adelanto + 40% avance + 20% cierre",
    pdfLines: [
      "40% por adelantado al confirmar la propuesta.",
      "40% al aprobar el avance intermedio acordado.",
      "20% al finalizar y antes de la entrega final.",
    ],
  },
];

export const QUOTE_PAYMENT_CHANNELS: {
  id: QuotePaymentChannel;
  label: string;
  pdfLabel: string;
}[] = [
  {
    id: "usd_transfer",
    label: "Dólares (físicos / transferencia)",
    pdfLabel:
      "Pago en dólares estadounidenses (USD), en físico o por transferencia.",
  },
  {
    id: "ars_transfer",
    label: "Pesos ARS (físicos / transferencia)",
    pdfLabel:
      "Pago en pesos argentinos (ARS), en físico o por transferencia.",
  },
  {
    id: "crypto_usdt",
    label: "Criptomonedas (USDT)",
    pdfLabel: "Pago en criptomonedas USDT (red a coordinar).",
  },
];

export const DEFAULT_QUOTE_PAYMENT_NOTE =
  "Cuentas Bancarias, billeteras virtuales";

/** Cancelación dentro de este plazo (días corridos). */
export const QUOTE_CANCEL_WITHIN_DAYS = 15;
/** Porcentaje de devolución sobre lo abonado. */
export const QUOTE_REFUND_PERCENT = 50;

export const QUOTE_CANCEL_POLICY_LINES = [
  `La cancelacion del proyecto puede solicitarse dentro de los ${QUOTE_CANCEL_WITHIN_DAYS} dias corridos desde la aceptacion de la propuesta.`,
  `Politica de devolucion: se reintegra el ${QUOTE_REFUND_PERCENT}% de lo abonado (pago total o parcial, segun el esquema acordado).`,
];

export function isQuotePaymentSchedule(
  value: string,
): value is QuotePaymentSchedule {
  return QUOTE_PAYMENT_SCHEDULES.some((entry) => entry.id === value);
}

export function isQuotePaymentChannel(
  value: string,
): value is QuotePaymentChannel {
  return QUOTE_PAYMENT_CHANNELS.some((entry) => entry.id === value);
}

export function paymentScheduleLabel(id: QuotePaymentSchedule) {
  return (
    QUOTE_PAYMENT_SCHEDULES.find((entry) => entry.id === id)?.label ?? id
  );
}

export function paymentChannelLabel(id: QuotePaymentChannel) {
  return (
    QUOTE_PAYMENT_CHANNELS.find((entry) => entry.id === id)?.label ?? id
  );
}

/** Estimación de lo abonado al cancelar (primera cuota del esquema). */
export function expectedAmountPaid(input: {
  total: number;
  paymentSchedule: QuotePaymentSchedule;
}) {
  const total = Math.max(0, Number(input.total) || 0);
  if (input.paymentSchedule === "fifty_fifty") {
    return Math.round(total * 0.5 * 100) / 100;
  }
  if (input.paymentSchedule === "forty_forty_twenty") {
    return Math.round(total * 0.4 * 100) / 100;
  }
  return Math.round(total * 100) / 100;
}

export function computeRefundAmount(
  amountPaid: number,
  percent = QUOTE_REFUND_PERCENT,
) {
  const paid = Math.max(0, Number(amountPaid) || 0);
  const rate = Math.min(100, Math.max(0, Number(percent) || 0));
  return Math.round(paid * (rate / 100) * 100) / 100;
}

export const PROJECT_PAYMENT_STATUS_OPTIONS = [
  { value: "unpaid" as const, label: "Pendiente de pago" },
  { value: "deposit_paid" as const, label: "Adelanto recibido" },
  { value: "paid_in_full" as const, label: "Pagado completo" },
];

export function isProjectPaymentStatus(
  value: string,
): value is (typeof PROJECT_PAYMENT_STATUS_OPTIONS)[number]["value"] {
  return PROJECT_PAYMENT_STATUS_OPTIONS.some((entry) => entry.value === value);
}

export function projectPaymentStatusLabel(
  status: (typeof PROJECT_PAYMENT_STATUS_OPTIONS)[number]["value"] | null | undefined,
) {
  return (
    PROJECT_PAYMENT_STATUS_OPTIONS.find((entry) => entry.value === status)
      ?.label ?? "Pendiente de pago"
  );
}

/** Días restantes para solicitar cancelación (desde aceptación / creación). */
export function cancelWindowInfo(acceptedAt: string | null | undefined, now = Date.now()) {
  if (!acceptedAt) {
    return {
      eligible: false,
      daysRemaining: 0,
      daysElapsed: 0,
      deadlineAt: null as string | null,
    };
  }
  const start = new Date(acceptedAt).getTime();
  if (!Number.isFinite(start)) {
    return {
      eligible: false,
      daysRemaining: 0,
      daysElapsed: 0,
      deadlineAt: null as string | null,
    };
  }
  const deadline = start + QUOTE_CANCEL_WITHIN_DAYS * 24 * 60 * 60_000;
  const daysElapsed = Math.max(0, Math.floor((now - start) / 86_400_000));
  const daysRemaining = Math.max(0, Math.ceil((deadline - now) / 86_400_000));
  return {
    eligible: now <= deadline,
    daysRemaining,
    daysElapsed,
    deadlineAt: new Date(deadline).toISOString(),
  };
}

export function computeQuoteTotals(input: {
  hours: number;
  hourlyRate: number;
  discountPercent?: number;
}) {
  const hours = Math.max(0, Number(input.hours) || 0);
  const hourlyRate = Math.max(0, Number(input.hourlyRate) || 0);
  const discountPercent = Math.min(
    100,
    Math.max(0, Number(input.discountPercent) || 0),
  );
  const subtotal = Math.round(hours * hourlyRate * 100) / 100;
  const discountAmount =
    Math.round(subtotal * (discountPercent / 100) * 100) / 100;
  const total = Math.round((subtotal - discountAmount) * 100) / 100;
  return { hours, hourlyRate, discountPercent, subtotal, discountAmount, total };
}
