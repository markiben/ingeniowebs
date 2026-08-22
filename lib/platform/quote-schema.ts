import type { QuotePayload, QuotePhase } from "./types";

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [] as string[];
  return value
    .map((entry) => asString(entry))
    .filter(Boolean);
}

function asNumber(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function normalizePhase(value: unknown): QuotePhase | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const name = asString(raw.name);
  if (!name) return null;
  return {
    name,
    description: asString(raw.description),
    deliverables: asStringArray(raw.deliverables),
    estimatedHours: asNumber(raw.estimatedHours),
  };
}

export function suggestedHoursFromPayload(payload: QuotePayload) {
  return payload.project.phases.reduce(
    (total, phase) => total + (Number(phase.estimatedHours) || 0),
    0,
  );
}

export function parseQuoteJson(raw: string):
  | { ok: true; payload: QuotePayload; sourceJson: string }
  | { ok: false; error: string } {
  const text = raw.trim();
  if (!text) return { ok: false, error: "Pegá el JSON generado por el Gem." };

  let parsed: unknown;
  try {
    // Permite bloques ```json ... ``` pegados desde el Gem.
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    parsed = JSON.parse(fenced ? fenced[1].trim() : text);
  } catch {
    return { ok: false, error: "El JSON no es válido. Revisá comas y llaves." };
  }

  if (!parsed || typeof parsed !== "object") {
    return { ok: false, error: "El JSON debe ser un objeto." };
  }

  const root = parsed as Record<string, unknown>;
  const clientRaw =
    root.client && typeof root.client === "object"
      ? (root.client as Record<string, unknown>)
      : {};
  const projectRaw =
    root.project && typeof root.project === "object"
      ? (root.project as Record<string, unknown>)
      : {};

  const phases = Array.isArray(projectRaw.phases)
    ? projectRaw.phases
        .map((phase) => normalizePhase(phase))
        .filter((phase): phase is QuotePhase => Boolean(phase))
    : [];

  const title = asString(projectRaw.title);
  if (!title) {
    return { ok: false, error: "Falta project.title en el JSON." };
  }
  if (phases.length === 0) {
    return {
      ok: false,
      error: "El JSON debe incluir al menos una fase en project.phases.",
    };
  }

  const payload: QuotePayload = {
    version: asString(root.version, "1.0") || "1.0",
    client: {
      name: asString(clientRaw.name),
      company: asString(clientRaw.company),
      email: asString(clientRaw.email).toLowerCase(),
    },
    project: {
      title,
      summary: asString(projectRaw.summary),
      objectives: asStringArray(projectRaw.objectives),
      scope: asStringArray(projectRaw.scope),
      outOfScope: asStringArray(projectRaw.outOfScope),
      phases,
      timelineNote: asString(projectRaw.timelineNote),
      assumptions: asStringArray(projectRaw.assumptions),
      notes: asString(projectRaw.notes),
    },
  };

  return {
    ok: true,
    payload,
    sourceJson: JSON.stringify(payload, null, 2),
  };
}
