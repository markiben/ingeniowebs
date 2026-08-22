import type { ProjectStatus } from "./types";

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  in_progress: "En curso",
  review: "En revisión",
  completed: "Finalizado",
  cancelled: "Cancelado",
};

const LEGACY_TO_CURRENT: Record<string, ProjectStatus> = {
  draft: "in_progress",
  active: "in_progress",
  in_progress: "in_progress",
  review: "review",
  completed: "completed",
  cancelled: "cancelled",
};

export function normalizeProjectStatus(value: unknown): ProjectStatus {
  if (typeof value === "string" && value in LEGACY_TO_CURRENT) {
    return LEGACY_TO_CURRENT[value];
  }
  return "in_progress";
}

export function isProjectStatus(value: string): value is ProjectStatus {
  return value in PROJECT_STATUS_LABELS;
}
