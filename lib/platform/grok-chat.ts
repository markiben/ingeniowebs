import {
  MR_INGENIO_SYSTEM_PROMPT,
  buildVisitorContextBlock,
  type VisitorChatContext,
} from "./chatbot-prompt";
import type { LiveChatMessage } from "./types";

const XAI_CHAT_URL = "https://api.x.ai/v1/chat/completions";

type GrokChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function historyForGrok(messages: LiveChatMessage[]): GrokChatMessage[] {
  const out: GrokChatMessage[] = [];
  for (const message of messages) {
    const text = message.body.trim();
    if (!text) continue;
    if (message.role === "visitor") {
      out.push({ role: "user", content: text });
      continue;
    }
    if (message.role === "admin") {
      out.push({ role: "assistant", content: text });
    }
  }
  return out.slice(-20);
}

async function callGrok(options: {
  system: string;
  messages: GrokChatMessage[];
  temperature?: number;
  maxTokens?: number;
}): Promise<string | null> {
  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey) {
    console.error("[grok-chat] Missing XAI_API_KEY");
    return null;
  }

  const model = process.env.XAI_MODEL?.trim() || "grok-4.20-0309-non-reasoning";
  if (options.messages.length === 0) return null;

  const payload = {
    model,
    temperature: options.temperature ?? 0.6,
    max_tokens: options.maxTokens ?? 700,
    messages: [
      { role: "system" as const, content: options.system },
      ...options.messages,
    ],
  };

  try {
    const response = await fetch(XAI_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("[grok-chat] API error", response.status, detail);
      return null;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch (error) {
    console.error("[grok-chat] Request failed", error);
    return null;
  }
}

export async function generateMrIngenioReply(
  messages: LiveChatMessage[],
  visitor?: VisitorChatContext,
): Promise<string | null> {
  const conversation = historyForGrok(messages);
  if (conversation.length === 0) return null;

  const systemContent = visitor
    ? `${MR_INGENIO_SYSTEM_PROMPT}\n\n${buildVisitorContextBlock(visitor)}`
    : MR_INGENIO_SYSTEM_PROMPT;

  return callGrok({
    system: systemContent,
    messages: conversation,
    temperature: 0.6,
    maxTokens: 700,
  });
}

const QUOTE_BRIEF_SYSTEM = `Sos un analista comercial de Ingenio Webs. A partir del historial de chat, generás un BRIEF profesional para el agente de cotización (que luego arma JSON/código de propuesta).

REGLAS:
- NO pegues el chat literal ni frases unidas con "·".
- NO incluyas coletillas del cliente (dale, exacto, espectacular, gracias, jajaja).
- Reescribí requisitos en español claro y accionable.
- Respondé SOLO con este formato exacto (sin markdown extra):

Cliente: [Nombre] | Email: [email] | Tel: [teléfono o No especificado]
Proyecto: [Landing / Sitio / Sistema / App / Bot-Software / Rediseño / Proyecto digital]
Pedido para cotizar:
- [requisito 1]
- [requisito 2]
- [requisito 3]
Pendiente: [lo que falta, o "Nada crítico"]
Notas: [pidió cotización sí/no; tiempos consultados sí/no; otro detalle útil]

Máximo 6 viñetas en Pedido. Sé concreto (objetivo, audiencia, funciones, integraciones, contenidos especiales).`;

/** Brief estructurado para el cotizador (no transcript del chat). */
export async function generateQuoteBriefForCotizador(
  messages: LiveChatMessage[],
  visitor?: VisitorChatContext,
): Promise<string | null> {
  const conversation = historyForGrok(messages);
  if (conversation.length === 0) return null;

  const visitorBlock = visitor
    ? `\nDatos del visitante:\n${buildVisitorContextBlock(visitor)}\n`
    : "";

  const text = await callGrok({
    system: `${QUOTE_BRIEF_SYSTEM}${visitorBlock}`,
    messages: [
      ...conversation,
      {
        role: "user",
        content:
          "Con ese historial, generá ahora el brief de cotización. Solo el bloque Cliente/Proyecto/Pedido/Pendiente/Notas. Sin transcript literal.",
      },
    ],
    temperature: 0.2,
    maxTokens: 500,
  });

  if (!text) return null;

  // Si el modelo envolvió en etiquetas, limpiamos
  return text
    .replace(/\[RESUMEN_COTIZACION_BACKEND\]/gi, "")
    .replace(/\[\/RESUMEN_COTIZACION_BACKEND\]/gi, "")
    .replace(/^📋\s*COPIAR PARA COTIZADOR\s*/i, "")
    .trim();
}
