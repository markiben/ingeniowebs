"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { requireSession } from "./auth";
import { generateMrIngenioReply, generateQuoteBriefForCotizador } from "./grok-chat";
import { splitMrIngenioReply } from "./chatbot-prompt";
import {
  farewellReplyForVisitor,
  isVisitorFarewell,
} from "./live-chat-farewell";
import {
  buildFallbackQuoteSummary,
  isRawChatPasteSummary,
  shouldGenerateQuoteSummary,
} from "./live-chat-quote-summary";
import {
  isLiveChatOnline,
  isLiveChatTyping,
  LIVE_CHAT_AGENT_NAME,
} from "./live-chat-utils";
import { createId, readDb, updateDb } from "./store";
import { saveLiveChatAttachment, asUploadFile } from "./live-chat-attachments";
import type { LiveChatAttachment, LiveChatMessage, LiveChatSession, PlatformDatabase } from "./types";
import {
  closeLiveChatSession,
  maintainLiveChats,
} from "./live-chat-maintenance";

/** True si el bot debe responder (modo bot ON, o admin offline). */
function shouldBotReply(session: LiveChatSession) {
  if (readDb().liveChatBotMode) return true;
  return !isLiveChatOnline(session.adminLastSeenAt);
}

/** Responde con Grok si modo bot está activo o no hay operador online. */
async function appendBotReplyIfNeeded(
  sessionId: string,
  visitorToken: string,
) {
  const current = findSession(sessionId, visitorToken);
  if (!current || current.status === "closed") return;

  if (!shouldBotReply(current)) return;

  const last = current.messages[current.messages.length - 1];
  if (!last || last.role !== "visitor" || !last.body.trim()) return;

  const reply = await generateMrIngenioReply(current.messages, {
    name: current.name,
    email: current.email,
    phone: current.phone,
  });
  if (!reply) {
    withMaintenance((db) => {
      const session = db.liveChats.find((entry) => entry.id === sessionId);
      if (session) session.adminTypingAt = null;
    });
    return;
  }

  const { visibleBody, quoteSummary } = splitMrIngenioReply(reply);
  let summary = quoteSummary;
  const needsSummary =
    shouldGenerateQuoteSummary(current) || Boolean(quoteSummary);

  if (needsSummary && (!summary || isRawChatPasteSummary(summary))) {
    const brief = await generateQuoteBriefForCotizador(current.messages, {
      name: current.name,
      email: current.email,
      phone: current.phone,
    });
    if (brief && !isRawChatPasteSummary(brief)) {
      summary = brief;
    } else if (!summary || isRawChatPasteSummary(summary)) {
      summary = buildFallbackQuoteSummary(current);
    }
  }

  const now = new Date().toISOString();

  withMaintenance((db) => {
    const session = db.liveChats.find((entry) => entry.id === sessionId);
    if (!session || session.visitorToken !== visitorToken) return;
    if (session.status === "closed") return;
    if (!shouldBotReply(session)) {
      session.adminTypingAt = null;
      return;
    }

    const latest = session.messages[session.messages.length - 1];
    if (!latest || latest.role !== "visitor") {
      session.adminTypingAt = null;
      return;
    }

    if (visibleBody) {
      session.messages.push({
        id: createId("lcm"),
        role: "admin",
        body: visibleBody,
        senderName: LIVE_CHAT_AGENT_NAME,
        senderKind: "bot",
        createdAt: now,
      });
    }

    if (summary) {
      session.messages = session.messages.filter(
        (message) =>
          !(
            message.role === "system" &&
            (message.body.startsWith("📋 COPIAR PARA COTIZADOR") ||
              message.body.startsWith("Resumen para cotización"))
          ),
      );
      session.messages.push({
        id: createId("lcm"),
        role: "system",
        body: `📋 COPIAR PARA COTIZADOR\n${summary}`,
        createdAt: now,
      });
      session.botQuoteSummary = summary;
    }
    session.adminDisplayName = LIVE_CHAT_AGENT_NAME;
    session.adminTypingAt = null;
    session.idlePromptAt = null;
    session.idlePromptReason = null;
    session.updatedAt = now;
  });
}

/** Marca “escribiendo…” y genera en background (no bloquea 15–40s la UI). */
function scheduleBotReply(sessionId: string, visitorToken: string) {
  const current = findSession(sessionId, visitorToken);
  if (!current || current.status === "closed") return;
  const last = current.messages[current.messages.length - 1];
  if (!last || last.role !== "visitor" || !last.body.trim()) return;

  // Despedida: una sola respuesta corta y se cierra (sin Grok ni loops).
  if (isVisitorFarewell(last.body)) {
    const now = new Date().toISOString();
    withMaintenance((db) => {
      const session = db.liveChats.find((entry) => entry.id === sessionId);
      if (!session || session.visitorToken !== visitorToken) return;
      if (session.status === "closed") return;
      session.messages.push({
        id: createId("lcm"),
        role: "admin",
        body: farewellReplyForVisitor(session.name),
        senderName: LIVE_CHAT_AGENT_NAME,
        senderKind: "bot",
        createdAt: now,
      });
      session.adminDisplayName = LIVE_CHAT_AGENT_NAME;
      session.adminTypingAt = null;
      closeLiveChatSession(session, now, "visitor_left");
    });
    revalidateLiveChat();
    return;
  }

  if (!shouldBotReply(current)) return;

  const typingAt = new Date().toISOString();
  withMaintenance((db) => {
    const session = db.liveChats.find((entry) => entry.id === sessionId);
    if (!session || session.visitorToken !== visitorToken) return;
    session.adminTypingAt = typingAt;
    session.adminDisplayName = LIVE_CHAT_AGENT_NAME;
  });

  after(async () => {
    try {
      await appendBotReplyIfNeeded(sessionId, visitorToken);
    } catch (error) {
      console.error("[live-chat] bot reply failed", error);
      withMaintenance((db) => {
        const session = db.liveChats.find((entry) => entry.id === sessionId);
        if (session) session.adminTypingAt = null;
      });
    }
  });
}

type ActionFail = { ok: false; error: string };
type ActionOk<T extends object = object> = { ok: true } & T;

function fail(message: string): ActionFail {
  return { ok: false, error: message };
}

function ok(): ActionOk;
function ok<T extends object>(data: T): ActionOk<T>;
function ok<T extends object>(data?: T): ActionOk | ActionOk<T> {
  return { ok: true, ...(data ?? {}) } as ActionOk | ActionOk<T>;
}

function createVisitorToken() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}${Math.random().toString(36).slice(2, 12)}`;
}

function findSession(
  sessionId: string,
  visitorToken?: string,
): LiveChatSession | null {
  const db = readDb();
  const session = db.liveChats.find((entry) => entry.id === sessionId) ?? null;
  if (!session) return null;
  if (visitorToken && session.visitorToken !== visitorToken) return null;
  return session;
}

function publicSession(
  session: LiveChatSession,
  options?: { forVisitor?: boolean },
) {
  const now = Date.now();
  const adminName = session.adminDisplayName || LIVE_CHAT_AGENT_NAME;
  const messages = options?.forVisitor
    ? session.messages.filter(
        (message) =>
          !(
            message.role === "system" &&
            (message.body.startsWith("Resumen para cotización") ||
              message.body.startsWith("📋 COPIAR PARA COTIZADOR"))
          ),
      )
    : session.messages;
  return {
    id: session.id,
    name: session.name,
    email: session.email,
    phone: session.phone,
    status: session.status,
    messages,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    closedAt: session.closedAt ?? null,
    closedReason: session.closedReason ?? null,
    visitorOnline: isLiveChatOnline(session.visitorLastSeenAt, now),
    adminOnline: isLiveChatOnline(session.adminLastSeenAt, now),
    visitorTyping: isLiveChatTyping(session.visitorTypingAt, now),
    adminTyping: isLiveChatTyping(session.adminTypingAt, now),
    adminDisplayName: adminName,
    visitorLastSeenAt: session.visitorLastSeenAt ?? null,
    adminLastSeenAt: session.adminLastSeenAt ?? null,
  };
}

function revalidateLiveChat() {
  revalidatePath("/plataforma");
  revalidatePath("/plataforma/chat");
  revalidatePath("/plataforma/inbox");
}

function withMaintenance<T>(
  mutator: (db: PlatformDatabase, now: string) => T,
): T {
  let result!: T;
  updateDb((db) => {
    const nowMs = Date.now();
    maintainLiveChats(db, nowMs);
    result = mutator(db, new Date(nowMs).toISOString());
  });
  return result;
}

export async function startLiveChatAction(input: {
  name: string;
  email: string;
  phone?: string;
  body: string;
  welcomeMessage?: string;
}) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone?.trim();
  const body = input.body.trim();
  const welcomeBody = (
    input.welcomeMessage?.trim() ||
    `¡Hola ${name}! Soy ${LIVE_CHAT_AGENT_NAME} de soporte.\n¿En qué podemos ayudarte hoy?`
  ).replaceAll("{name}", name);

  if (!name || !email || body.length < 1) {
    return fail("Completá nombre, email y mensaje.");
  }

  const nowMs = Date.now();
  const now = new Date(nowMs).toISOString();
  const firstMessage: LiveChatMessage = {
    id: createId("lcm"),
    role: "visitor",
    body,
    createdAt: now,
  };

  const session: LiveChatSession = {
    id: createId("live"),
    visitorToken: createVisitorToken(),
    name,
    email,
    phone: phone || undefined,
    status: "open",
    messages: [firstMessage],
    visitorLastReadAt: now,
    visitorLastSeenAt: now,
    adminLastSeenAt: null,
    visitorTypingAt: null,
    adminTypingAt: null,
    adminDisplayName: LIVE_CHAT_AGENT_NAME,
    idlePromptAt: null,
    idlePromptReason: null,
    closedAt: null,
    closedReason: null,
    createdAt: now,
    updatedAt: now,
  };

  withMaintenance((db) => {
    db.liveChats.unshift(session);
  });

  scheduleBotReply(session.id, session.visitorToken);

  // Fallback corto si Grok no está configurado: saludo clásico tras un instante.
  after(async () => {
    await new Promise((resolve) => setTimeout(resolve, 12_000));
    const live = findSession(session.id, session.visitorToken);
    if (!live || live.status === "closed") return;
    if (live.messages.some((message) => message.role === "admin")) return;
    const greetAt = new Date().toISOString();
    withMaintenance((db) => {
      const entry = db.liveChats.find((item) => item.id === session.id);
      if (!entry) return;
      if (entry.messages.some((message) => message.role === "admin")) return;
      entry.messages.push({
        id: createId("lcm"),
        role: "admin",
        body: welcomeBody,
        senderName: LIVE_CHAT_AGENT_NAME,
        senderKind: "bot",
        createdAt: greetAt,
      });
      entry.adminDisplayName = LIVE_CHAT_AGENT_NAME;
      entry.adminTypingAt = null;
      entry.updatedAt = greetAt;
    });
  });

  revalidateLiveChat();
  const finalSession = findSession(session.id, session.visitorToken);
  if (!finalSession) return fail("No se pudo iniciar el chat.");
  return ok({
    sessionId: finalSession.id,
    visitorToken: finalSession.visitorToken,
    session: publicSession(finalSession, { forVisitor: true }),
  });
}

export async function sendVisitorLiveChatMessageAction(input: {
  sessionId: string;
  visitorToken: string;
  body?: string;
  attachment?: File | null;
}) {
  const body = String(input.body ?? "").trim();
  let attachment: LiveChatAttachment | undefined;

  const upload = asUploadFile(input.attachment);
  if (upload) {
    const saved = await saveLiveChatAttachment(upload, input.sessionId);
    if (!saved.ok) return fail(saved.error);
    attachment = saved.attachment;
  }

  if (!body && !attachment) return fail("Escribí un mensaje o adjuntá un archivo.");

  let error = "";
  let sessionId = "";

  withMaintenance((db, now) => {
    const session = db.liveChats.find((entry) => entry.id === input.sessionId);
    if (!session || session.visitorToken !== input.visitorToken) {
      error = "Conversación no encontrada.";
      return;
    }
    if (session.status === "closed") {
      error = "Esta conversación está cerrada.";
      return;
    }
    session.messages.push({
      id: createId("lcm"),
      role: "visitor",
      body,
      attachment,
      createdAt: now,
    });
    session.visitorLastReadAt = now;
    session.visitorLastSeenAt = now;
    session.visitorTypingAt = null;
    session.idlePromptAt = null;
    session.idlePromptReason = null;
    session.updatedAt = now;
    session.status = "open";
    sessionId = session.id;
  });

  if (error) return fail(error);

  if (body) {
    scheduleBotReply(sessionId, input.visitorToken);
  }

  revalidateLiveChat();
  const session = findSession(sessionId, input.visitorToken);
  if (!session) return fail("Conversación no encontrada.");
  return ok({ session: publicSession(session, { forVisitor: true }) });
}

export async function setVisitorTypingAction(input: {
  sessionId: string;
  visitorToken: string;
  typing: boolean;
}) {
  let error = "";
  let sessionId = "";

  withMaintenance((db, now) => {
    const session = db.liveChats.find((entry) => entry.id === input.sessionId);
    if (!session || session.visitorToken !== input.visitorToken) {
      error = "Conversación no encontrada.";
      return;
    }
    if (session.status === "closed") {
      error = "Esta conversación está cerrada.";
      return;
    }
    session.visitorLastSeenAt = now;
    if (input.typing) {
      const prev = session.visitorTypingAt
        ? new Date(session.visitorTypingAt).getTime()
        : 0;
      if (Date.now() - prev >= 2_000) {
        session.visitorTypingAt = now;
      } else if (!session.visitorTypingAt) {
        session.visitorTypingAt = now;
      }
    } else if (session.visitorTypingAt) {
      session.visitorTypingAt = null;
    }
    sessionId = session.id;
  });

  if (error) return fail(error);
  const session = findSession(sessionId, input.visitorToken);
  if (!session) return fail("Conversación no encontrada.");
  return ok({ session: publicSession(session, { forVisitor: true }) });
}

export async function getLiveChatThreadAction(input: {
  sessionId: string;
  visitorToken: string;
}) {
  let error = "";
  let sessionId = "";

  withMaintenance((db, now) => {
    const session = db.liveChats.find((entry) => entry.id === input.sessionId);
    if (!session || session.visitorToken !== input.visitorToken) {
      error = "Conversación no encontrada.";
      return;
    }
    // No actualizar lastSeen en cada poll (cada 2s): evita escrituras
    // constantes a db.json que en dev remontan el widget y sacan el foco.
    const lastSeenMs = session.visitorLastSeenAt
      ? new Date(session.visitorLastSeenAt).getTime()
      : 0;
    // Throttle alto: menos writes a db.json → menos Compiling en Turbopack.
    if (Date.now() - lastSeenMs >= 25_000) {
      session.visitorLastSeenAt = now;
      session.visitorLastReadAt = now;
    }
    sessionId = session.id;
  });

  if (error) return fail(error);
  const session = findSession(sessionId, input.visitorToken);
  if (!session) return fail("Conversación no encontrada.");
  return ok({ session: publicSession(session, { forVisitor: true }) });
}

export async function confirmVisitorStillThereAction(input: {
  sessionId: string;
  visitorToken: string;
}) {
  let error = "";
  let sessionId = "";

  withMaintenance((db, now) => {
    const session = db.liveChats.find((entry) => entry.id === input.sessionId);
    if (!session || session.visitorToken !== input.visitorToken) {
      error = "Conversación no encontrada.";
      return;
    }
    if (session.status === "closed") {
      error = "Esta conversación está cerrada.";
      return;
    }
    session.idlePromptAt = null;
    session.idlePromptReason = null;
    session.visitorLastSeenAt = now;
    session.updatedAt = now;
    sessionId = session.id;
  });

  if (error) return fail(error);
  revalidateLiveChat();
  const session = findSession(sessionId, input.visitorToken);
  if (!session) return fail("Conversación no encontrada.");
  return ok({ session: publicSession(session, { forVisitor: true }) });
}

export async function heartbeatAdminLiveChatAction(formData: FormData) {
  const admin = await requireSession("admin");
  if (!admin) return fail("No autorizado.");

  const sessionId = String(formData.get("sessionId") ?? "").trim();
  if (!sessionId) return fail("Conversación no encontrada.");

  let error = "";
  withMaintenance((db, now) => {
    const session = db.liveChats.find((entry) => entry.id === sessionId);
    if (!session) {
      error = "Conversación no encontrada.";
      return;
    }
    const nowMs = Date.parse(now);
    const lastSeen = session.adminLastSeenAt
      ? Date.parse(session.adminLastSeenAt)
      : 0;
    // Evita reescribir db.json en cada poll (traba el server en dev).
    if (Number.isFinite(lastSeen) && nowMs - lastSeen < 8_000) {
      return;
    }
    session.adminLastSeenAt = now;
    if (session.status === "open") {
      session.adminLastReadAt = now;
    }
  });

  if (error) return fail(error);
  const session = findSession(sessionId);
  if (!session) return fail("Conversación no encontrada.");
  return ok({ session: publicSession(session) });
}

export async function confirmAdminStillThereAction(formData: FormData) {
  const admin = await requireSession("admin");
  if (!admin) return fail("No autorizado.");

  const sessionId = String(formData.get("sessionId") ?? "").trim();
  if (!sessionId) return fail("Conversación no encontrada.");

  let error = "";
  withMaintenance((db, now) => {
    const session = db.liveChats.find((entry) => entry.id === sessionId);
    if (!session) {
      error = "Conversación no encontrada.";
      return;
    }
    if (session.status === "closed") {
      error = "Esta conversación está cerrada.";
      return;
    }
    // Reinicia la espera: el admin decide seguir atento al cliente.
    session.idlePromptAt = null;
    session.idlePromptReason = null;
    session.adminLastSeenAt = now;
    session.visitorLastSeenAt = now;
    session.updatedAt = now;
  });

  if (error) return fail(error);
  revalidateLiveChat();
  return ok({ message: "Chat mantenido abierto." });
}

export async function sendAdminLiveChatReplyAction(formData: FormData) {
  const admin = await requireSession("admin");
  if (!admin) return fail("No autorizado.");

  const sessionId = String(formData.get("sessionId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!sessionId) return fail("Conversación no encontrada.");

  let attachment: LiveChatAttachment | undefined;
  const upload = asUploadFile(formData.get("attachment"));
  if (upload) {
    const saved = await saveLiveChatAttachment(upload, sessionId);
    if (!saved.ok) return fail(saved.error);
    attachment = saved.attachment;
  }

  if (!body && !attachment) return fail("Escribí una respuesta o adjuntá un archivo.");

  let error = "";
  withMaintenance((db, now) => {
    const session = db.liveChats.find((entry) => entry.id === sessionId);
    if (!session) {
      error = "Conversación no encontrada.";
      return;
    }
    if (session.status === "closed") {
      error = "Esta conversación está cerrada.";
      return;
    }
    session.messages.push({
      id: createId("lcm"),
      role: "admin",
      body,
      attachment,
      senderName: admin.name,
      senderKind: "human",
      senderAvatarUrl: admin.avatarUrl ?? null,
      createdAt: now,
    });
    session.adminLastReadAt = now;
    session.adminLastSeenAt = now;
    session.adminTypingAt = null;
    session.adminDisplayName = admin.name;
    session.idlePromptAt = null;
    session.idlePromptReason = null;
    session.updatedAt = now;
  });

  if (error) return fail(error);
  revalidateLiveChat();
  return ok({ message: "Respuesta enviada." });
}

export async function setAdminTypingAction(formData: FormData) {
  const admin = await requireSession("admin");
  if (!admin) return fail("No autorizado.");

  const sessionId = String(formData.get("sessionId") ?? "").trim();
  const typing = String(formData.get("typing") ?? "") === "1";
  if (!sessionId) return fail("Conversación no encontrada.");

  let error = "";
  withMaintenance((db, now) => {
    const session = db.liveChats.find((entry) => entry.id === sessionId);
    if (!session) {
      error = "Conversación no encontrada.";
      return;
    }
    if (session.status === "closed") {
      error = "Esta conversación está cerrada.";
      return;
    }
    session.adminLastSeenAt = now;
    session.adminTypingAt = typing ? now : null;
    session.adminDisplayName = admin.name;
  });

  if (error) return fail(error);
  return ok();
}

export async function markLiveChatReadAction(formData: FormData) {
  const admin = await requireSession("admin");
  if (!admin) return fail("No autorizado.");

  const sessionId = String(formData.get("sessionId") ?? "").trim();
  if (!sessionId) return fail("Conversación no encontrada.");

  let error = "";
  withMaintenance((db, now) => {
    const session = db.liveChats.find((entry) => entry.id === sessionId);
    if (!session) {
      error = "Conversación no encontrada.";
      return;
    }
    session.adminLastReadAt = now;
    session.adminLastSeenAt = now;
  });

  if (error) return fail(error);
  revalidateLiveChat();
  return ok();
}

export async function closeLiveChatAction(formData: FormData) {
  const admin = await requireSession("admin");
  if (!admin) return fail("No autorizado.");

  const sessionId = String(formData.get("sessionId") ?? "").trim();
  if (!sessionId) return fail("Conversación no encontrada.");

  let error = "";
  withMaintenance((db, now) => {
    const session = db.liveChats.find((entry) => entry.id === sessionId);
    if (!session) {
      error = "Conversación no encontrada.";
      return;
    }
    closeLiveChatSession(session, now, "manual");
  });

  if (error) return fail(error);
  revalidateLiveChat();
  return ok({ message: "Chat cerrado." });
}

export async function closeVisitorLiveChatAction(input: {
  sessionId: string;
  visitorToken: string;
}) {
  let error = "";
  withMaintenance((db, now) => {
    const session = db.liveChats.find((entry) => entry.id === input.sessionId);
    if (!session || session.visitorToken !== input.visitorToken) {
      error = "Conversación no encontrada.";
      return;
    }
    if (session.status === "closed") return;
    closeLiveChatSession(session, now, "visitor_left");
  });

  if (error) return fail(error);
  revalidateLiveChat();
  return ok({ message: "Chat cerrado." });
}

export async function reopenLiveChatAction(formData: FormData) {
  const admin = await requireSession("admin");
  if (!admin) return fail("No autorizado.");

  const sessionId = String(formData.get("sessionId") ?? "").trim();
  if (!sessionId) return fail("Conversación no encontrada.");

  let error = "";
  withMaintenance((db, now) => {
    const session = db.liveChats.find((entry) => entry.id === sessionId);
    if (!session) {
      error = "Conversación no encontrada.";
      return;
    }
    session.status = "open";
    session.closedAt = null;
    session.closedReason = null;
    session.idlePromptAt = null;
    session.idlePromptReason = null;
    session.adminLastSeenAt = now;
    session.visitorLastSeenAt = now;
    session.updatedAt = now;
  });

  if (error) return fail(error);
  revalidateLiveChat();
  return ok({ message: "Chat reabierto." });
}

export async function deleteLiveChatAction(formData: FormData) {
  const admin = await requireSession("admin");
  if (!admin) return fail("No autorizado.");

  const sessionId = String(formData.get("sessionId") ?? "").trim();
  if (!sessionId) return fail("Conversación no encontrada.");

  let error = "";
  withMaintenance((db) => {
    const index = db.liveChats.findIndex((entry) => entry.id === sessionId);
    if (index < 0) {
      error = "Conversación no encontrada.";
      return;
    }
    db.liveChats.splice(index, 1);
  });

  if (error) return fail(error);
  revalidateLiveChat();
  return ok({ message: "Chat eliminado." });
}

/** Activa/desactiva respuestas de Mr. Ingenio aunque el admin esté online. */
export async function setLiveChatBotModeAction(enabled: boolean) {
  const admin = await requireSession("admin");
  if (!admin) return fail("No autorizado.");

  updateDb((db) => {
    db.liveChatBotMode = Boolean(enabled);
  });
  revalidateLiveChat();
  return ok({ liveChatBotMode: Boolean(enabled) });
}
