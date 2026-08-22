import { isLiveChatUnreadForAdmin, liveChatPreview } from "./live-chat-utils";
import { inboxPath } from "./inbox";
import type {
  LiveChatSession,
  PlatformLead,
  PlatformMessage,
  PlatformNotificationState,
  PlatformProposal,
  PlatformSupportTicket,
  PlatformUser,
} from "./types";

export type PlatformNotificationKind =
  | "form"
  | "message"
  | "livechat"
  | "client"
  | "proposal"
  | "ticket";

export type PlatformNotificationBucket = "new" | "read" | "archived";

export type PlatformNotification = {
  id: string;
  kind: PlatformNotificationKind;
  title: string;
  preview: string;
  href: string;
  createdAt: string;
  meta: string;
  /** Fuente: sin leer en el origen. */
  sourceUnread: boolean;
  status: PlatformNotificationBucket;
};

const KIND_LABEL: Record<PlatformNotificationKind, string> = {
  form: "Formulario",
  message: "Mensaje",
  livechat: "Webchat",
  client: "Cliente",
  proposal: "Propuesta",
  ticket: "Soporte",
};

function daysAgo(days: number) {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

function preview(text: string, max = 72) {
  const value = text.trim().replace(/\s+/g, " ");
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function resolveStatus(
  id: string,
  sourceUnread: boolean,
  states: PlatformNotificationState[],
): PlatformNotificationBucket {
  const saved = states.find((entry) => entry.id === id);
  if (saved?.status === "archived") return "archived";
  if (saved?.status === "read") return "read";
  return sourceUnread ? "new" : "read";
}

export function buildPlatformNotifications(input: {
  leads: PlatformLead[];
  messages: PlatformMessage[];
  liveChats?: LiveChatSession[];
  clients: PlatformUser[];
  proposals: PlatformProposal[];
  tickets: PlatformSupportTicket[];
  notificationStates?: PlatformNotificationState[];
}): PlatformNotification[] {
  const items: PlatformNotification[] = [];
  const states = input.notificationStates ?? [];
  const recentFrom = daysAgo(30);
  const recentClientFrom = daysAgo(7);
  const recentProposalFrom = daysAgo(14);

  const push = (
    item: Omit<PlatformNotification, "status"> & {
      status?: PlatformNotificationBucket;
    },
  ) => {
    const status =
      item.status ??
      resolveStatus(item.id, item.sourceUnread, states);
    items.push({ ...item, status });
  };

  for (const lead of input.leads) {
    const id = `form_${lead.id}`;
    const created = new Date(lead.createdAt).getTime();
    const kept = states.some(
      (entry) => entry.id === id && entry.status === "archived",
    );
    if (lead.read && created < recentFrom && !kept) continue;
    push({
      id,
      kind: "form",
      title: lead.name,
      preview: preview(lead.message || "Nuevo formulario recibido"),
      href: inboxPath("formularios", lead.id),
      createdAt: lead.createdAt,
      meta: KIND_LABEL.form,
      sourceUnread: !lead.read,
    });
  }

  for (const message of input.messages) {
    const id = `message_${message.id}`;
    const created = new Date(message.createdAt).getTime();
    const kept = states.some(
      (entry) => entry.id === id && entry.status === "archived",
    );
    if (message.read && created < recentFrom && !kept) continue;
    push({
      id,
      kind: "message",
      title: message.name,
      preview: preview(message.body || "Nuevo mensaje"),
      href: inboxPath("mensajes", message.id),
      createdAt: message.createdAt,
      meta: KIND_LABEL.message,
      sourceUnread: !message.read,
    });
  }

  for (const chat of input.liveChats ?? []) {
    if (chat.status === "closed") continue;
    const id = `livechat_${chat.id}`;
    const unread = isLiveChatUnreadForAdmin(chat);
    const updated = new Date(chat.updatedAt).getTime();
    const kept = states.some(
      (entry) => entry.id === id && entry.status === "archived",
    );
    if (!unread && updated < recentFrom && !kept) continue;
    const lastVisitor = [...chat.messages]
      .reverse()
      .find((message) => message.role === "visitor");
    push({
      id,
      kind: "livechat",
      title: chat.name,
      preview: preview(liveChatPreview(chat)),
      href: inboxPath("chat", chat.id),
      createdAt: lastVisitor?.createdAt || chat.updatedAt,
      meta: KIND_LABEL.livechat,
      sourceUnread: unread,
    });
  }

  for (const client of input.clients) {
    if (client.archived) continue;
    const id = `client_${client.id}`;
    const kept = states.some(
      (entry) => entry.id === id && entry.status === "archived",
    );
    if (new Date(client.createdAt).getTime() < recentClientFrom && !kept) {
      continue;
    }
    push({
      id,
      kind: "client",
      title: client.name,
      preview: `Nuevo registro · ${client.email}`,
      href: "/plataforma/clientes",
      createdAt: client.createdAt,
      meta: KIND_LABEL.client,
      sourceUnread: !states.some((entry) => entry.id === id),
    });
  }

  for (const proposal of input.proposals) {
    if (proposal.status !== "approved") continue;
    const id = `proposal_${proposal.id}`;
    const when = proposal.decidedAt || proposal.updatedAt || proposal.createdAt;
    const kept = states.some(
      (entry) => entry.id === id && entry.status === "archived",
    );
    if (new Date(when).getTime() < recentProposalFrom && !kept) continue;
    push({
      id,
      kind: "proposal",
      title: proposal.title,
      preview: `Aceptada por ${proposal.clientName}`,
      href: "/plataforma/propuestas",
      createdAt: when,
      meta: KIND_LABEL.proposal,
      sourceUnread: !states.some((entry) => entry.id === id),
    });
  }

  for (const ticket of input.tickets) {
    if (ticket.status !== "open" && ticket.status !== "in_progress") continue;
    const id = `ticket_${ticket.id}`;
    const statusLabel =
      ticket.status === "open" ? "abierto" : "en progreso";
    push({
      id,
      kind: "ticket",
      title: ticket.title,
      preview: preview(
        `${ticket.clientName} · ${ticket.description || ticket.category}`,
      ),
      href: "/plataforma/soporte",
      createdAt: ticket.createdAt,
      meta: `${KIND_LABEL.ticket} · ${statusLabel}`,
      sourceUnread: !states.some((entry) => entry.id === id),
    });
  }

  return items.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
