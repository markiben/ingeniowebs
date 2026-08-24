export type UserRole = "admin" | "client";

export type ProjectStatus =
  | "in_progress"
  | "review"
  | "completed"
  | "cancelled";

export type PricingType = "fixed" | "hourly";

export type PlatformUser = {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  country?: string;
  /** Vacío si la cuenta solo usa Google Sign-In. */
  passwordHash: string;
  /** ID de Google (sub) cuando la cuenta está vinculada a OAuth. */
  googleId?: string | null;
  role: UserRole;
  projectId: string | null;
  phone?: string;
  company?: string;
  avatarUrl?: string | null;
  /** Si es true, el cliente no puede ingresar a la plataforma. */
  accessBlocked?: boolean;
  /** Si es true, el cliente está archivado y no aparece en la lista activa. */
  archived?: boolean;
  createdAt: string;
  updatedAt: string;
  resetToken?: string | null;
  resetTokenExpiresAt?: string | null;
};

export type ProjectPaymentStatus =
  | "unpaid"
  | "deposit_paid"
  | "paid_in_full";

export type ClientProjectUpdateKind = "observation" | "extra_request";

export type ClientProjectUpdate = {
  id: string;
  kind: ClientProjectUpdateKind;
  body: string;
  createdAt: string;
  /** open = pendiente de revisión del equipo */
  status: "open" | "seen" | "done";
};

export type ClientCancelRequest = {
  requestedAt: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  resolvedAt?: string | null;
};

export type ProjectService = {
  id: string;
  name: string;
  description: string;
  hours: number;
  amount: number;
  createdAt: string;
};

export type PlatformProject = {
  id: string;
  code: string;
  name: string;
  clientName: string;
  clientEmail: string;
  value: number;
  currency: "ARS" | "USD";
  status: ProjectStatus;
  progress: number;
  description: string;
  pricingType: PricingType;
  hoursEstimated: number;
  hoursInvested: number;
  /** Costo interno por hora para estimar margen (misma moneda del proyecto). */
  hourlyCost: number;
  maintenancePlan: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  accessEnabled: boolean;
  /** Cliente de este proyecto archivado en el listado de clientes. */
  clientArchived?: boolean;
  /** Cotización de origen (si se aprobó desde el Cotizador). */
  quoteId?: string | null;
  quoteCode?: string | null;
  /** Servicios adicionales cargados después de aprobar la cotización. */
  services?: ProjectService[];
  /** Estado de pagos del proyecto (vista cliente). */
  paymentStatus?: ProjectPaymentStatus;
  /** Monto abonado (adelanto o total). */
  amountPaid?: number | null;
  /** % de devolución aplicado. */
  refundPercent?: number | null;
  /** Monto a devolver. */
  refundAmount?: number | null;
  cancelledAt?: string | null;
  /** Observaciones y pedidos adicionales del cliente. */
  clientUpdates?: ClientProjectUpdate[];
  /** Solicitud de cancelación / devolución del cliente. */
  cancelRequest?: ClientCancelRequest | null;
};

export type PlatformLead = {
  id: string;
  source: "contact_form" | "chat" | "meeting" | "newsletter" | "other";
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  meta?: Record<string, string>;
  createdAt: string;
  read: boolean;
};

export type PlatformMessage = {
  id: string;
  channel: "chat" | "whatsapp" | "email" | "other";
  name: string;
  email?: string;
  phone?: string;
  body: string;
  createdAt: string;
  read: boolean;
};

export type PlatformBlogDraft = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  cover?: string;
  content: string;
  status: "draft" | "published";
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LiveChatAttachment = {
  url: string;
  name: string;
  mimeType: string;
  size: number;
  kind: "image" | "file";
};

export type LiveChatMessage = {
  id: string;
  role: "visitor" | "admin" | "system";
  body: string;
  attachment?: LiveChatAttachment;
  /** Nombre visible del emisor (admin humano o Mr. Ingenio). */
  senderName?: string;
  /** Quién envió el mensaje admin: bot o operador humano. */
  senderKind?: "bot" | "human";
  /** Avatar del operador humano (si aplica). */
  senderAvatarUrl?: string | null;
  createdAt: string;
};

export type LiveChatSession = {
  id: string;
  visitorToken: string;
  name: string;
  email: string;
  phone?: string;
  status: "open" | "closed";
  messages: LiveChatMessage[];
  visitorLastReadAt?: string;
  adminLastReadAt?: string;
  /** Última señal de presencia del visitante (heartbeat). */
  visitorLastSeenAt?: string | null;
  /** Última señal de presencia del admin (heartbeat). */
  adminLastSeenAt?: string | null;
  /** Última vez que el visitante indicó que está escribiendo. */
  visitorTypingAt?: string | null;
  /** Última vez que el admin indicó que está escribiendo. */
  adminTypingAt?: string | null;
  /** Nombre visible del agente de Ingenio Webs. */
  adminDisplayName?: string;
  /** Momento en que se lanzó la alerta “¿seguís ahí?”. */
  idlePromptAt?: string | null;
  /** Quién disparó la alerta de inactividad. */
  idlePromptReason?: "visitor_offline" | "admin_offline" | null;
  /** Cuándo se cerró (para borrar a los 3 días). */
  closedAt?: string | null;
  /** Motivo del cierre: inactividad, atención, o el visitante cerró. */
  closedReason?: "idle" | "manual" | "visitor_left" | null;
  /** Último resumen de cotización generado por el bot (bloque backend). */
  botQuoteSummary?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NewsletterSource =
  | "newsletter"
  | "contact_form"
  | "chat"
  | "meeting"
  | "message"
  | "manual"
  | "other";

export type NewsletterStatus = "active" | "unsubscribed";

export type NewsletterSubscriber = {
  id: string;
  email: string;
  name: string;
  sources: NewsletterSource[];
  status: NewsletterStatus;
  unsubscribedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Click rastreado de una campaña (fase 2; vacío hasta activar tracking). */
export type NewsletterClickEvent = {
  id: string;
  subscriberId?: string | null;
  email: string;
  campaignLabel?: string | null;
  url: string;
  clickedAt: string;
  meta?: Record<string, string> | null;
};

export type QuoteStatus = "draft" | "sent" | "approved" | "rejected" | "cancelled";

export type QuotePaymentSchedule =
  | "full_upfront"
  | "fifty_fifty"
  | "forty_forty_twenty";

export type QuotePaymentChannel =
  | "usd_transfer"
  | "ars_transfer"
  | "crypto_usdt";

export type QuotePhase = {
  name: string;
  description: string;
  deliverables: string[];
  estimatedHours: number;
};

export type QuotePayload = {
  version: string;
  client: {
    name: string;
    company: string;
    email: string;
  };
  project: {
    title: string;
    summary: string;
    objectives: string[];
    scope: string[];
    outOfScope: string[];
    phases: QuotePhase[];
    timelineNote: string;
    assumptions: string[];
    notes: string;
  };
};

export type PlatformQuote = {
  id: string;
  code: string;
  createdAt: string;
  updatedAt: string;
  status: QuoteStatus;
  clientName: string;
  clientEmail: string;
  hours: number;
  hourlyRate: number;
  currency: "ARS" | "USD";
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  paymentSchedule: QuotePaymentSchedule;
  paymentChannel: QuotePaymentChannel;
  paymentNote: string;
  sourceJson: string;
  normalized: QuotePayload;
  pdfFileName: string;
  /** Proyecto generado al aprobar esta cotización. */
  projectId?: string | null;
  projectCode?: string | null;
  approvedAt?: string | null;
  cancelledAt?: string | null;
  /** Lo abonado al cancelar (total o parcial según esquema). */
  amountPaid?: number | null;
  refundPercent?: number | null;
  refundAmount?: number | null;
};

export type PlatformNotificationState = {
  id: string;
  status: "read" | "archived";
  updatedAt: string;
};

export type PlatformDatabase = {
  users: PlatformUser[];
  projects: PlatformProject[];
  leads: PlatformLead[];
  messages: PlatformMessage[];
  blogDrafts: PlatformBlogDraft[];
  liveChats: LiveChatSession[];
  newsletterSubscribers: NewsletterSubscriber[];
  /** Clicks de campañas rastreadas (vacío hasta activar tracking). */
  newsletterClicks: NewsletterClickEvent[];
  quotes: PlatformQuote[];
  /** Estado de notificaciones del centro (leídas / archivadas). */
  notificationStates: PlatformNotificationState[];
  /** Si true, Mr. Ingenio (Grok) responde aunque el admin esté online. */
  liveChatBotMode?: boolean;
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  projectId: string | null;
  avatarUrl?: string | null;
};
