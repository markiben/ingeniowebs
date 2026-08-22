import type { LiveChatMessage, LiveChatSession } from "./types";

const QUOTE_INTENT_RE =
  /\b(cotiz|presupuesto|propuesta|armame|arme|quiero\s+avanzar|sigamos|dale\s+con|confirm[oa]|si\s*,?\s*ese\s*(es\s*)?(el\s*)?mail|ese\s*mail|este\s*mail)\b/i;

const PROJECT_HINT_RE =
  /\b(landing|sitio|web|app|aplicaci[oó]n|sistema|crm|erp|bot|ea\b|mt5|redise[nñ]o|plataforma|software|ecommerce|tienda|corporativ|membres[ií]a|instagram|reels?)\b/i;

/** Colectillas / afirmaciones que no aportan requisitos. */
const FILLER_RE =
  /^(ok|dale|listo|perfecto|genial|excelente|espectacular|gracias|thanks|si|sí|no|exacto|claro|joya|bárbaro|buen[oa]s?|hola|chau|adios|bye)[\s!.?]*$/i;

const CHAT_NOISE_RE =
  /\b(dale|espectacular|jajaja|jaja|xd+|gracias!?|porfa|por favor)\b/i;

/** ¿Conviene generar / exigir resumen de cotización en este turno? */
export function shouldGenerateQuoteSummary(
  session: Pick<LiveChatSession, "messages" | "name" | "email" | "phone">,
): boolean {
  const visitorMsgs = session.messages.filter(
    (message) => message.role === "visitor" && message.body.trim(),
  );
  if (visitorMsgs.length === 0) return false;

  const last = visitorMsgs[visitorMsgs.length - 1]?.body ?? "";
  if (QUOTE_INTENT_RE.test(last)) return true;

  const allVisitor = visitorMsgs.map((message) => message.body).join("\n");
  const hasProjectHint = PROJECT_HINT_RE.test(allVisitor);
  const hasDetail =
    visitorMsgs.some((message) => message.body.trim().length >= 40) ||
    visitorMsgs.length >= 3;

  return hasProjectHint && hasDetail;
}

function inferProjectType(text: string): string {
  const lower = text.toLowerCase();
  if (/\b(bot|ea\b|mt5|expert\s*advisor)\b/.test(lower)) {
    return "Bot / Software a medida";
  }
  if (/\b(app|aplicaci[oó]n\s*m[oó]vil|android|ios)\b/.test(lower)) {
    return "App";
  }
  if (
    /\b(sistema|crm|erp|intranet|panel|dashboard|membres[ií]a)\b/.test(lower)
  ) {
    return "Sistema";
  }
  if (/\b(redise[nñ]o|migraci[oó]n)\b/.test(lower)) {
    return "Rediseño";
  }
  if (/\b(landing)\b/.test(lower)) return "Landing";
  if (/\b(sitio|web|corporativ|ecommerce|tienda)\b/.test(lower)) {
    return "Sitio web";
  }
  return "Proyecto digital";
}

function visitorRequirementTexts(session: Pick<LiveChatSession, "messages">) {
  return session.messages
    .filter(
      (message: LiveChatMessage) =>
        message.role === "visitor" && message.body.trim(),
    )
    .map((message) => message.body.trim())
    .filter((text) => !FILLER_RE.test(text));
}

/** Extrae viñetas de requisitos a partir del chat (heurística local). */
function synthesizePedidoBullets(visitorTexts: string[]): string[] {
  const blob = visitorTexts.join("\n").toLowerCase();
  const bullets: string[] = [];

  const wantsLanding = /\blanding\b/.test(blob);
  const wantsWeb = /\b(web|sitio|p[aá]gina)\b/.test(blob);
  const gymLifestyle =
    /\b(gym|fitness|lifestyle|crecimiento\s+personal)\b/.test(blob);
  const instagram = /\binstagram\b/.test(blob);
  const reels = /\breels?\b/.test(blob);
  const membership = /\bmembres[ií]a(s)?\b/.test(blob);
  const programs = /\b(programa|programas|cursos?|suscripci[oó]n)\b/.test(blob);
  const sales = /\b(venta|vender|pagos?|checkout|stripe|mercadopago)\b/.test(
    blob,
  );

  if (wantsLanding || wantsWeb) {
    let line = wantsLanding
      ? "Landing / sitio web"
      : "Sitio web";
    if (gymLifestyle) {
      line += " orientado a crecimiento personal / gym lifestyle";
    }
    bullets.push(`${line}.`);
  } else if (gymLifestyle) {
    bullets.push("Proyecto digital orientado a gym / lifestyle / crecimiento personal.");
  }

  if (instagram || reels) {
    const parts: string[] = [];
    if (instagram) parts.push("contenido e integración con Instagram");
    if (reels) parts.push("vista de Reels embebidos en la web");
    bullets.push(`${parts.join("; ").replace(/^./, (c) => c.toUpperCase())}.`);
  }

  if (membership || programs || sales) {
    const parts: string[] = [];
    if (membership) parts.push("sistema de membresía");
    if (programs) parts.push("venta/gestión de programas");
    if (sales && !programs) parts.push("flujo de venta/pagos");
    bullets.push(
      `${parts.join(" + ").replace(/^./, (c) => c.toUpperCase())}.`,
    );
  }

  // Frases útiles del cliente (limpias), sin filler
  for (const text of visitorTexts) {
    const cleaned = text
      .replace(/\b(dale|espectacular|jajaja|jaja|xd+|gracias!?|porfa|por favor)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (cleaned.length < 24) continue;
    if (FILLER_RE.test(cleaned)) continue;
    // Evitar duplicar si ya capturamos por keywords
    const lower = cleaned.toLowerCase();
    if (
      bullets.some((bullet) =>
        lower
          .split(/\s+/)
          .filter((word) => word.length > 4)
          .some((word) => bullet.toLowerCase().includes(word)),
      )
    ) {
      continue;
    }
    if (PROJECT_HINT_RE.test(cleaned) || cleaned.length >= 50) {
      bullets.push(
        cleaned.endsWith(".") || cleaned.endsWith("!") || cleaned.endsWith("?")
          ? cleaned
          : `${cleaned}.`,
      );
    }
  }

  if (bullets.length === 0) {
    const fallback = visitorTexts
      .map((text) =>
        text
          .replace(
            /\b(dale|espectacular|jajaja|jaja|xd+|gracias!?|porfa|por favor)\b/gi,
            " ",
          )
          .replace(/\s+/g, " ")
          .trim(),
      )
      .filter((text) => text.length >= 16)
      .slice(-3);
    if (fallback.length > 0) {
      return [
        "Requisitos detectados en la conversación:",
        ...fallback.map((text) =>
          text.endsWith(".") ? text : `${text}.`,
        ),
      ];
    }
    return ["Sin detalle suficiente aún para armar alcance."];
  }

  const pending: string[] = [];
  if (!/\b(plazo|tiempo|semana|mes)\b/i.test(blob)) {
    pending.push("plazos deseados");
  }
  if (!/\b(stack|tecnolog|next|wordpress|react)\b/i.test(blob)) {
    pending.push("preferencias técnicas / stack");
  }
  if (pending.length > 0) {
    bullets.push(`Pendiente: ${pending.join(", ")}.`);
  }

  return bullets;
}

/** True si el resumen parece un pegado literal del chat (no sirve al cotizador). */
export function isRawChatPasteSummary(summary: string): boolean {
  const text = summary.trim();
  if (!text) return true;

  const pedidoMatch = text.match(
    /Pedido para cotizar:\s*([\s\S]*?)(?:\nNotas:|$)/i,
  );
  const pedido = (pedidoMatch?.[1] ?? text).trim();

  if (!pedido || pedido.length < 12) return true;
  if ((pedido.match(/ · /g) ?? []).length >= 2) return true;
  if (CHAT_NOISE_RE.test(pedido) && !pedido.includes("\n-")) return true;
  if (
    /^(quiero|hola|dale|si|sí)\b/i.test(pedido) &&
    !pedido.includes("\n-") &&
    pedido.split(/\s+/).length < 40
  ) {
    return true;
  }
  return false;
}

/** Resumen local sintetizado (no pega el chat crudo). */
export function buildFallbackQuoteSummary(
  session: Pick<LiveChatSession, "messages" | "name" | "email" | "phone">,
): string {
  const visitorTexts = visitorRequirementTexts(session);
  const blob = visitorTexts.join(" | ");
  const name = session.name?.trim() || "No especificado";
  const email = session.email?.trim() || "No especificado";
  const phone = session.phone?.trim() || "No especificado";
  const project = inferProjectType(blob);

  const bullets = synthesizePedidoBullets(visitorTexts);
  const pedido = bullets.map((bullet) =>
    bullet.startsWith("-") || bullet.startsWith("Requisitos")
      ? bullet
      : `- ${bullet}`,
  );

  const askedQuote = QUOTE_INTENT_RE.test(blob);
  const askedTime =
    /\b(tiempo|plazo|cu[aá]nto\s+tarda|demora|semanas|meses)\b/i.test(blob);

  return [
    `Cliente: ${name} | Email: ${email} | Tel: ${phone}`,
    `Proyecto: ${project}`,
    `Pedido para cotizar:`,
    ...pedido,
    `Notas: ${askedQuote ? "Pidió cotización." : "Aún no pidió cotización explícita."} ${
      askedTime ? "Consultó tiempos." : "Tiempos no consultados."
    }`,
  ].join("\n");
}
