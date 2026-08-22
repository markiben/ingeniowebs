import { NextResponse } from "next/server";
import { splitMrIngenioReply } from "@/lib/platform/chatbot-prompt";
import { generateMrIngenioReply } from "@/lib/platform/grok-chat";
import type { LiveChatMessage } from "@/lib/platform/types";

export const runtime = "nodejs";

type ChatBody = {
  messages?: Array<{
    role?: string;
    body?: string;
    content?: string;
  }>;
  message?: string;
};

/**
 * Endpoint de chatbot (Grok + system prompt Mr. Ingenio).
 * Preferí el live chat del widget; este route sirve para pruebas o integraciones.
 */
export async function POST(request: Request) {
  let body: ChatBody;
  try {
    body = (await request.json()) as ChatBody;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }

  const now = new Date().toISOString();
  let messages: LiveChatMessage[] = [];

  if (Array.isArray(body.messages) && body.messages.length > 0) {
    messages = body.messages
      .map((entry, index) => {
        const roleRaw = String(entry.role ?? "user");
        const text = String(entry.body ?? entry.content ?? "").trim();
        if (!text) return null;
        const role: LiveChatMessage["role"] =
          roleRaw === "assistant" || roleRaw === "admin" ? "admin" : "visitor";
        return {
          id: `api_${index}`,
          role,
          body: text,
          createdAt: now,
        };
      })
      .filter((entry): entry is LiveChatMessage => Boolean(entry));
  } else if (body.message?.trim()) {
    messages = [
      {
        id: "api_0",
        role: "visitor",
        body: body.message.trim(),
        createdAt: now,
      },
    ];
  }

  if (messages.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Enviá message o messages." },
      { status: 400 },
    );
  }

  const reply = await generateMrIngenioReply(messages);
  if (!reply) {
    return NextResponse.json(
      { ok: false, error: "No se pudo generar respuesta." },
      { status: 502 },
    );
  }

  const { visibleBody, quoteSummary } = splitMrIngenioReply(reply);
  return NextResponse.json({
    ok: true,
    reply: visibleBody,
    quoteSummary,
  });
}
