import { createId } from "./id";
import type {
  NewsletterSource,
  NewsletterStatus,
  NewsletterSubscriber,
  PlatformDatabase,
} from "./types";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizeNewsletterSubscriber(
  entry: Partial<NewsletterSubscriber> & {
    id: string;
    email: string;
  },
): NewsletterSubscriber {
  // Legacy: "bounced" se trata como baja.
  const rawStatus = entry.status as string | undefined;
  const status: NewsletterStatus =
    rawStatus === "unsubscribed" || rawStatus === "bounced"
      ? "unsubscribed"
      : "active";

  const sources = Array.isArray(entry.sources)
    ? (entry.sources.filter(Boolean) as NewsletterSource[])
    : [];

  return {
    id: entry.id,
    email: normalizeEmail(entry.email),
    name: (entry.name ?? "").trim() || entry.email.split("@")[0] || "Suscriptor",
    sources: sources.length > 0 ? sources : ["other"],
    status,
    unsubscribedAt:
      status === "unsubscribed" ? entry.unsubscribedAt ?? null : null,
    createdAt: entry.createdAt ?? new Date().toISOString(),
    updatedAt: entry.updatedAt ?? entry.createdAt ?? new Date().toISOString(),
  };
}

export function upsertNewsletterSubscriber(
  db: PlatformDatabase,
  input: {
    email: string;
    name?: string;
    source: NewsletterSource;
    /** Solo true cuando el usuario se suscribe otra vez de forma explícita. */
    reactivate?: boolean;
  },
) {
  const email = normalizeEmail(input.email);
  if (!email || !email.includes("@")) return null;

  const name = (input.name ?? "").trim();
  const now = new Date().toISOString();
  const existing = db.newsletterSubscribers.find(
    (entry) => entry.email === email,
  );

  if (existing) {
    const normalized = normalizeNewsletterSubscriber(existing);
    Object.assign(existing, normalized);

    if (name && (!existing.name || existing.name === existing.email)) {
      existing.name = name;
    }
    if (!existing.sources.includes(input.source)) {
      existing.sources.push(input.source);
    }

    const shouldReactivate = input.reactivate === true;
    if (shouldReactivate && existing.status === "unsubscribed") {
      existing.status = "active";
      existing.unsubscribedAt = null;
    }

    existing.updatedAt = now;
    return existing;
  }

  const subscriber = normalizeNewsletterSubscriber({
    id: createId("news"),
    email,
    name: name || email.split("@")[0] || "Suscriptor",
    sources: [input.source],
    status: "active",
    unsubscribedAt: null,
    createdAt: now,
    updatedAt: now,
  });
  db.newsletterSubscribers.unshift(subscriber);
  return subscriber;
}

export function setNewsletterSubscriberStatus(
  db: PlatformDatabase,
  id: string,
  status: NewsletterStatus,
) {
  const entry = db.newsletterSubscribers.find((item) => item.id === id);
  if (!entry) return null;

  const now = new Date().toISOString();
  entry.status = status;
  entry.unsubscribedAt = status === "unsubscribed" ? now : null;
  entry.updatedAt = now;
  return entry;
}

export function unsubscribeNewsletterByEmail(
  db: PlatformDatabase,
  emailInput: string,
) {
  const email = normalizeEmail(emailInput);
  if (!email || !email.includes("@")) return { ok: false as const, reason: "invalid" };

  const entry = db.newsletterSubscribers.find((item) => item.email === email);
  if (!entry) return { ok: false as const, reason: "missing" };

  const now = new Date().toISOString();
  entry.status = "unsubscribed";
  entry.unsubscribedAt = now;
  entry.updatedAt = now;
  return { ok: true as const, entry };
}

export function deleteNewsletterSubscriber(db: PlatformDatabase, id: string) {
  const index = db.newsletterSubscribers.findIndex((item) => item.id === id);
  if (index < 0) return false;
  db.newsletterSubscribers.splice(index, 1);
  return true;
}

/** Une leads/mensajes históricos a la base de newsletter (dedupe por email). */
export function syncNewsletterFromSources(db: PlatformDatabase) {
  db.newsletterSubscribers = db.newsletterSubscribers.map((entry) =>
    normalizeNewsletterSubscriber(entry),
  );

  for (const lead of db.leads) {
    if (!lead.email) continue;
    upsertNewsletterSubscriber(db, {
      email: lead.email,
      name: lead.name,
      source:
        lead.source === "newsletter"
          ? "newsletter"
          : lead.source === "contact_form"
            ? "contact_form"
            : lead.source === "meeting"
              ? "meeting"
              : lead.source === "chat"
                ? "chat"
                : "other",
      reactivate: false,
    });
  }

  for (const message of db.messages) {
    if (!message.email) continue;
    upsertNewsletterSubscriber(db, {
      email: message.email,
      name: message.name,
      source: "message",
      reactivate: false,
    });
  }
}

export function newsletterStats(subscribers: NewsletterSubscriber[]) {
  const active = subscribers.filter((entry) => entry.status === "active").length;
  const unsubscribed = subscribers.filter(
    (entry) => entry.status === "unsubscribed",
  ).length;
  const bySource = subscribers.reduce(
    (acc, entry) => {
      for (const source of entry.sources) {
        acc[source] = (acc[source] ?? 0) + 1;
      }
      return acc;
    },
    {} as Partial<Record<NewsletterSource, number>>,
  );

  return {
    total: subscribers.length,
    active,
    unsubscribed,
    bySource,
  };
}

export function newsletterToCsv(
  subscribers: NewsletterSubscriber[],
  mode: "full" | "sheets" = "full",
) {
  const escape = (value: string) => {
    const safe = value.replace(/"/g, '""');
    return `"${safe}"`;
  };

  if (mode === "sheets") {
    const header = ["Nombre", "Email"];
    const rows = subscribers.map((entry) => [entry.name, entry.email]);
    return [header, ...rows]
      .map((row) => row.map((cell) => escape(String(cell ?? ""))).join(","))
      .join("\r\n");
  }

  const header = [
    "email",
    "name",
    "status",
    "sources",
    "createdAt",
    "updatedAt",
    "unsubscribedAt",
  ];
  const rows = subscribers.map((entry) => [
    entry.email,
    entry.name,
    entry.status,
    entry.sources.join("|"),
    entry.createdAt,
    entry.updatedAt,
    entry.unsubscribedAt ?? "",
  ]);

  return [header, ...rows]
    .map((row) => row.map((cell) => escape(String(cell ?? ""))).join(","))
    .join("\r\n");
}

export const NEWSLETTER_SOURCE_LABEL: Record<NewsletterSource, string> = {
  newsletter: "Newsletter",
  contact_form: "Formulario web",
  chat: "Chat",
  meeting: "Reunión",
  message: "Mensaje",
  manual: "Alta manual",
  other: "Otro",
};

export const NEWSLETTER_STATUS_LABEL: Record<NewsletterStatus, string> = {
  active: "Activo",
  unsubscribed: "Baja",
};
