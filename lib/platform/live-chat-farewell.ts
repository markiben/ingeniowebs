/** Detecta despedidas del visitante para cerrar el chat sin alargar la charla. */
const FAREWELL_RE =
  /^(ok\s*)?(adios|adiós|chau|chao|bye|goodbye|hasta\s+luego|hasta\s+pronto|nos\s+vemos|me\s+despido|eso\s+es\s+todo|nada\s+mas|nada\s+más|listo\s+gracias|gracias\s+por\s+todo|que\s+tengas\s+buen\s+dia|que\s+tengas\s+buen\s+día)[!!.\s]*$/i;

export function isVisitorFarewell(body: string): boolean {
  const text = String(body ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (!text || text.length > 80) return false;
  if (FAREWELL_RE.test(text)) return true;
  // Frases cortas que solo despiden
  const lower = text.toLowerCase();
  if (
    /^(adios|adiós|chau|bye)\b/.test(lower) &&
    text.split(/\s+/).length <= 6
  ) {
    return true;
  }
  return false;
}

export function farewellReplyForVisitor(name?: string): string {
  const who = name?.trim() ? `, ${name.trim().split(/\s+/)[0]}` : "";
  return `¡Hasta luego${who}! Cualquier cosa, acá estamos.`;
}
