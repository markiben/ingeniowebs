import type { LiveChatSession } from "./types";

/** Considerado online si hubo heartbeat en esta ventana. */
export const LIVE_CHAT_ONLINE_MS = 20_000;
/** Chats cerrados se borran después de este TTL. */
export const LIVE_CHAT_CLOSED_TTL_MS = 3 * 24 * 60 * 60_000;
/** Ventana para mostrar “está escribiendo…”. */
export const LIVE_CHAT_TYPING_MS = 3_500;
/** Sin respuesta del operador tras el último mensaje del visitante. */
export const LIVE_CHAT_BUSY_WAIT_MS = 5 * 60_000;

export const LIVE_CHAT_AGENT_NAME = "Mr. Ingenio";

export const LIVE_CHAT_BUSY_MESSAGE =
  "En este momento todos nuestros operadores están ocupados. Si deseás esperar en línea, te responderemos en cuanto nos liberemos. También podés dejar un mensaje y nos pondremos en contacto.";

export function isLiveChatUnreadForAdmin(session: LiveChatSession) {
  return liveChatUnreadCountForAdmin(session) > 0;
}

/** Mensajes del visitante pendientes de lectura del admin. */
export function liveChatUnreadCountForAdmin(session: LiveChatSession) {
  const lastRead = session.adminLastReadAt
    ? new Date(session.adminLastReadAt).getTime()
    : 0;
  return session.messages.filter(
    (message) =>
      message.role === "visitor" &&
      new Date(message.createdAt).getTime() > lastRead,
  ).length;
}

export function liveChatOpenPendingCount(sessions: LiveChatSession[]) {
  return sessions
    .filter((session) => session.status === "open")
    .reduce((total, session) => total + liveChatUnreadCountForAdmin(session), 0);
}

export function liveChatPreview(session: LiveChatSession, max = 72) {
  const last = [...session.messages]
    .reverse()
    .find((message) => message.role !== "system");
  if (!last) return "Sin mensajes";
  const text = last.body.trim().replace(/\s+/g, " ");
  if (text) return text.length > max ? `${text.slice(0, max)}…` : text;
  if (last.attachment?.kind === "image") return "📷 Imagen";
  if (last.attachment) return `📎 ${last.attachment.name}`;
  return "Sin mensajes";
}

export function isLiveChatOnline(
  lastSeenAt?: string | null,
  now = Date.now(),
) {
  if (!lastSeenAt) return false;
  return now - new Date(lastSeenAt).getTime() <= LIVE_CHAT_ONLINE_MS;
}

export function isLiveChatTyping(
  typingAt?: string | null,
  now = Date.now(),
) {
  if (!typingAt) return false;
  return now - new Date(typingAt).getTime() <= LIVE_CHAT_TYPING_MS;
}
