import { createId } from "./id";
import {
  LIVE_CHAT_BUSY_MESSAGE,
  LIVE_CHAT_BUSY_WAIT_MS,
  LIVE_CHAT_CLOSED_TTL_MS,
} from "./live-chat-utils";
import type { LiveChatSession, PlatformDatabase } from "./types";

export function closeLiveChatSession(
  session: LiveChatSession,
  now: string,
  reason: "idle" | "manual" | "visitor_left" = "manual",
) {
  session.status = "closed";
  session.closedAt = now;
  session.closedReason = reason;
  session.idlePromptAt = null;
  session.idlePromptReason = null;
  session.updatedAt = now;
  session.adminLastReadAt = now;
}

/**
 * Si el visitante espera respuesta del operador más de 5 minutos,
 * deja un aviso (sin cerrar el chat).
 */
function maybeInjectBusyNotice(
  session: LiveChatSession,
  nowMs: number,
  nowIso: string,
) {
  if (session.status !== "open") return;

  let lastVisitorAt: number | null = null;
  let answeredAfterVisitor = false;
  let busyAfterVisitor = false;

  for (const message of session.messages) {
    if (message.role === "visitor") {
      lastVisitorAt = new Date(message.createdAt).getTime();
      answeredAfterVisitor = false;
      busyAfterVisitor = false;
      continue;
    }
    if (lastVisitorAt == null) continue;
    if (message.role === "admin") answeredAfterVisitor = true;
    if (message.role === "system") busyAfterVisitor = true;
  }

  if (
    lastVisitorAt == null ||
    answeredAfterVisitor ||
    busyAfterVisitor ||
    nowMs - lastVisitorAt < LIVE_CHAT_BUSY_WAIT_MS
  ) {
    return;
  }

  session.messages.push({
    id: createId("lcm"),
    role: "system",
    body: LIVE_CHAT_BUSY_MESSAGE,
    createdAt: nowIso,
  });
  session.updatedAt = nowIso;
}

/** Limpia chats cerrados viejos y avisa si el operador tarda en responder. */
export function maintainLiveChats(db: PlatformDatabase, nowMs = Date.now()) {
  const nowIso = new Date(nowMs).toISOString();

  db.liveChats = db.liveChats.filter((session) => {
    if (session.status !== "closed") return true;
    const closedAt = session.closedAt || session.updatedAt;
    return nowMs - new Date(closedAt).getTime() <= LIVE_CHAT_CLOSED_TTL_MS;
  });

  for (const session of db.liveChats) {
    if (session.status !== "open") continue;
    // Ya no se cierra por demora: solo aviso de operadores ocupados.
    if (session.idlePromptAt) session.idlePromptAt = null;
    if (session.idlePromptReason) session.idlePromptReason = null;
    maybeInjectBusyNotice(session, nowMs, nowIso);
  }
}
