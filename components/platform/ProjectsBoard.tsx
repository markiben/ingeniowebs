"use client";

import {
  Fragment,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type MouseEvent,
} from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  Mail,
  Plus,
  Search,
  Undo2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PlatformConfirmDialog from "@/components/platform/PlatformConfirmDialog";
import PlatformSectionHero from "@/components/platform/PlatformSectionHero";
import {
  addProjectServiceAction,
  cancelProjectFromBoardAction,
  finishProjectAction,
  resendProjectInviteAction,
  updateProjectBoardAction,
  updateProjectPaymentAction,
} from "@/lib/platform/actions";
import { refreshPlatform } from "@/lib/platform/client-refresh";
import {
  computeRefundAmount,
  expectedAmountPaid,
  isProjectPaymentStatus,
  PROJECT_PAYMENT_STATUS_OPTIONS,
  QUOTE_CANCEL_WITHIN_DAYS,
  QUOTE_REFUND_PERCENT,
} from "@/lib/platform/quote-commerce";
import { isClientRegistered } from "@/lib/platform/project-flow";
import {
  PROJECT_STATUS_LABELS,
  isProjectStatus,
} from "@/lib/platform/project-status";
import type {
  PlatformProject,
  PlatformQuote,
  PlatformUser,
  ProjectPaymentStatus,
  ProjectStatus,
} from "@/lib/platform/types";

const STATUS_OPTIONS = Object.entries(PROJECT_STATUS_LABELS) as [
  ProjectStatus,
  string,
][];

type SortKey = "project" | "client" | "progress" | "status" | "payment";
type SortDir = "asc" | "desc";

const SORT_COLUMNS: { id: SortKey; label: string }[] = [
  { id: "project", label: "Proyecto" },
  { id: "client", label: "Cliente" },
  { id: "progress", label: "Avance" },
  { id: "status", label: "Estado" },
  { id: "payment", label: "Pago" },
];

const PAYMENT_LABEL = Object.fromEntries(
  PROJECT_PAYMENT_STATUS_OPTIONS.map((option) => [option.value, option.label]),
) as Record<ProjectPaymentStatus, string>;

function compareText(a: string, b: string) {
  return a.localeCompare(b, "es", { sensitivity: "base" });
}

function money(value: number, currency: string) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function daysSinceProjectCreated(project: PlatformProject) {
  const created = new Date(project.createdAt).getTime();
  if (!Number.isFinite(created)) return 0;
  const ms = Date.now() - created;
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

function isCancelOutsidePolicyWindow(project: PlatformProject) {
  return daysSinceProjectCreated(project) > QUOTE_CANCEL_WITHIN_DAYS;
}

function projectHourlyRate(
  project: PlatformProject,
  quote: PlatformQuote | null | undefined,
) {
  const fromQuote = Number(quote?.hourlyRate) || 0;
  if (fromQuote > 0) return fromQuote;
  return Math.max(0, Number(project.hourlyCost) || 0);
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function progressFromHours(hoursInvested: number, hoursEstimated: number) {
  if (hoursEstimated <= 0) return 0;
  return Math.max(
    0,
    Math.min(
      100,
      Math.round((Math.max(0, hoursInvested) / hoursEstimated) * 100),
    ),
  );
}

export default function ProjectsBoard({
  projects,
  quotes = [],
  clients = [],
  focusCode,
  title = "Proyectos",
  subtitle = "Entrega: horas, avance, servicios e invitación al cliente. Nacen al aprobar una cotización.",
}: {
  projects: PlatformProject[];
  quotes?: PlatformQuote[];
  clients?: PlatformUser[];
  focusCode?: string;
  title?: string;
  subtitle?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(focusCode?.trim() || "");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("project");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [actionError, setActionError] = useState("");
  const [actionOk, setActionOk] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(
    null,
  );
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [hoursDraft, setHoursDraft] = useState<Record<string, string>>({});
  const [hoursEditingId, setHoursEditingId] = useState<string | null>(null);
  const [serviceTarget, setServiceTarget] = useState<PlatformProject | null>(
    null,
  );
  const [serviceName, setServiceName] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [serviceHours, setServiceHours] = useState("1");
  const [finishTarget, setFinishTarget] = useState<PlatformProject | null>(null);
  const [cancelTarget, setCancelTarget] = useState<PlatformProject | null>(null);
  const [cancelAmount, setCancelAmount] = useState("");
  const [cancelQuote, setCancelQuote] = useState<PlatformQuote | null>(null);
  const [lateCancelWarning, setLateCancelWarning] =
    useState<PlatformProject | null>(null);

  const focusNormalized = focusCode?.trim().toUpperCase() || "";

  const quotesById = useMemo(() => {
    const map = new Map<string, PlatformQuote>();
    for (const quote of quotes) map.set(quote.id, quote);
    return map;
  }, [quotes]);

  useEffect(() => {
    if (!focusNormalized) return;
    setQuery(focusNormalized);
    const timer = window.setTimeout(() => {
      const row = document.getElementById(`plat-project-${focusNormalized}`);
      row?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
    return () => window.clearTimeout(timer);
  }, [focusNormalized, projects]);

  useEffect(() => {
    setHoursDraft((current) => {
      const next = { ...current };
      for (const project of projects) {
        if (hoursEditingId === project.id) continue;
        next[project.id] = String(project.hoursInvested || 0);
      }
      return next;
    });
  }, [projects, hoursEditingId]);

  useEffect(() => {
    if (!openMenuId) return;

    function closeMenu() {
      setOpenMenuId(null);
      setMenuPos(null);
    }

    function onPointerDown(event: globalThis.MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".plat-menu")) return;
      closeMenu();
    }

    window.addEventListener("scroll", closeMenu, true);
    window.addEventListener("resize", closeMenu);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("scroll", closeMenu, true);
      window.removeEventListener("resize", closeMenu);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [openMenuId]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: projects.length };
    for (const [value] of STATUS_OPTIONS) counts[value] = 0;
    for (const project of projects) {
      counts[project.status] = (counts[project.status] || 0) + 1;
    }
    return counts;
  }, [projects]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = projects.filter((project) => {
      if (statusFilter !== "all" && project.status !== statusFilter) return false;
      if (!q) return true;
      return [
        project.code,
        project.name,
        project.clientName,
        project.clientEmail,
        project.quoteCode,
        project.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });

    return [...filtered].sort((a, b) => {
      const progressOf = (project: PlatformProject) =>
        project.status === "completed"
          ? 100
          : progressFromHours(
              Math.max(0, Number(project.hoursInvested) || 0),
              project.hoursEstimated || 0,
            );

      let result = 0;
      switch (sortKey) {
        case "project":
          result =
            compareText(a.code, b.code) || compareText(a.name, b.name);
          break;
        case "client":
          result =
            compareText(a.clientName, b.clientName) ||
            compareText(a.clientEmail, b.clientEmail);
          break;
        case "progress":
          result = progressOf(a) - progressOf(b);
          break;
        case "status":
          result = compareText(
            PROJECT_STATUS_LABELS[a.status],
            PROJECT_STATUS_LABELS[b.status],
          );
          break;
        case "payment":
          result = compareText(
            PAYMENT_LABEL[(a.paymentStatus ?? "unpaid") as ProjectPaymentStatus] ??
              a.paymentStatus ??
              "",
            PAYMENT_LABEL[(b.paymentStatus ?? "unpaid") as ProjectPaymentStatus] ??
              b.paymentStatus ??
              "",
          );
          break;
        default:
          result = 0;
      }
      return sortDir === "asc" ? result : -result;
    });
  }, [projects, query, statusFilter, sortKey, sortDir]);

  function toggleSort(columnId: SortKey) {
    if (sortKey === columnId) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(columnId);
    setSortDir(columnId === "progress" ? "desc" : "asc");
  }

  function renderSortIcon(columnId: SortKey) {
    if (sortKey !== columnId) {
      return <ArrowUpDown size={12} className="plat-sort-icon" />;
    }
    return sortDir === "asc" ? (
      <ArrowUp size={12} className="plat-sort-icon is-active" />
    ) : (
      <ArrowDown size={12} className="plat-sort-icon is-active" />
    );
  }

  function toggleExpand(projectId: string) {
    setExpandedIds((current) => ({
      ...current,
      [projectId]: !current[projectId],
    }));
  }

  function toggleActionsMenu(
    projectId: string,
    event: MouseEvent<HTMLButtonElement>,
  ) {
    if (openMenuId === projectId) {
      setOpenMenuId(null);
      setMenuPos(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 6,
      right: Math.max(8, window.innerWidth - rect.right),
    });
    setOpenMenuId(projectId);
  }

  function saveProject(
    project: PlatformProject,
    patch: { status?: ProjectStatus; hoursInvested?: number },
  ) {
    setActionError("");
    setActionOk("");
    const formData = new FormData();
    formData.set("projectId", project.id);
    if (patch.status) formData.set("status", patch.status);
    if (typeof patch.hoursInvested === "number") {
      formData.set("hoursInvested", String(patch.hoursInvested));
    }
    startTransition(async () => {
      const result = await updateProjectBoardAction(formData);
      if (!result.ok) {
        setActionError(result.error);
        return;
      }
      setActionOk(`Actualizado ${project.code}`);
      refreshPlatform(router);
    });
  }

  function savePayment(
    project: PlatformProject,
    paymentStatus: ProjectPaymentStatus,
  ) {
    setActionError("");
    setActionOk("");
    const formData = new FormData();
    formData.set("projectId", project.id);
    formData.set("paymentStatus", paymentStatus);
    startTransition(async () => {
      const result = await updateProjectPaymentAction(formData);
      if (!result.ok) {
        setActionError(result.error);
        return;
      }
      setActionOk(`Pago actualizado · ${project.code}`);
      refreshPlatform(router);
    });
  }

  function commitHours(project: PlatformProject, rawValue?: string) {
    if (project.status === "completed" || project.status === "cancelled") {
      setHoursEditingId(null);
      return;
    }
    const raw = (
      rawValue ??
      hoursDraft[project.id] ??
      String(project.hoursInvested || 0)
    ).trim();
    const hoursInvested =
      raw === "" ? project.hoursInvested || 0 : Math.max(0, Number(raw) || 0);

    setHoursDraft((current) => ({
      ...current,
      [project.id]: String(hoursInvested),
    }));
    setHoursEditingId(null);

    if (hoursInvested === (project.hoursInvested || 0)) return;
    saveProject(project, { hoursInvested });
  }

  function openServiceModal(project: PlatformProject) {
    setOpenMenuId(null);
    setMenuPos(null);
    setActionError("");
    setServiceName("");
    setServiceDescription("");
    setServiceHours("1");
    setServiceTarget(project);
  }

  const serviceQuote = serviceTarget?.quoteId
    ? quotesById.get(serviceTarget.quoteId) ?? null
    : null;
  const serviceRate = serviceTarget
    ? projectHourlyRate(serviceTarget, serviceQuote)
    : 0;
  const serviceHoursValue = Math.max(
    0,
    Number(String(serviceHours).replace(",", ".")) || 0,
  );
  const serviceSubtotal = roundMoney(serviceHoursValue * serviceRate);

  function submitService() {
    if (!serviceTarget) return;
    setActionError("");
    setActionOk("");
    if (!serviceName.trim()) {
      setActionError("Indicá el nombre del servicio adicional.");
      return;
    }
    if (serviceRate <= 0) {
      setActionError(
        "Este proyecto no tiene tarifa horaria. Revisá la cotización de origen.",
      );
      return;
    }
    if (serviceHoursValue <= 0) {
      setActionError("Indicá las horas del servicio adicional.");
      return;
    }
    const formData = new FormData();
    formData.set("projectId", serviceTarget.id);
    formData.set("name", serviceName.trim());
    formData.set("description", serviceDescription);
    formData.set("hours", String(serviceHoursValue));
    formData.set("amount", String(serviceSubtotal));
    startTransition(async () => {
      const result = await addProjectServiceAction(formData);
      if (!result.ok) {
        setActionError(result.error);
        return;
      }
      setActionOk(
        `Servicio adicional agregado a ${serviceTarget.code}`,
      );
      setExpandedIds((current) => ({ ...current, [serviceTarget.id]: true }));
      setServiceTarget(null);
      refreshPlatform(router);
    });
  }

  function confirmFinish() {
    if (!finishTarget) return;
    setActionError("");
    setActionOk("");
    startTransition(async () => {
      const result = await finishProjectAction(finishTarget.id);
      if (!result.ok) {
        setActionError(result.error);
        return;
      }
      setActionOk(result.message ?? "Proyecto finalizado.");
      setFinishTarget(null);
      refreshPlatform(router);
    });
  }

  function resendInvite(project: PlatformProject) {
    setOpenMenuId(null);
    setMenuPos(null);
    setActionError("");
    setActionOk("");
    const formData = new FormData();
    formData.set("projectId", project.id);
    startTransition(async () => {
      const result = await resendProjectInviteAction(formData);
      if (!result.ok) {
        setActionError(result.error);
        return;
      }
      setActionOk(result.message);
      if (result.gmailBody) {
        try {
          await navigator.clipboard.writeText(result.gmailBody);
        } catch {
          /* ignore */
        }
      }
      if (result.gmailUrl) {
        window.open(result.gmailUrl, "_blank", "noopener,noreferrer");
      }
      refreshPlatform(router);
    });
  }

  function prepareCancelDraft(project: PlatformProject) {
    const quote = project.quoteId
      ? quotesById.get(project.quoteId) ?? null
      : null;
    setCancelQuote(quote);
    const suggested = quote
      ? expectedAmountPaid({
          total: quote.total,
          paymentSchedule: quote.paymentSchedule,
        })
      : project.value;
    setCancelAmount(String(suggested));
  }

  function openCancelModal(project: PlatformProject) {
    setOpenMenuId(null);
    setMenuPos(null);
    setActionError("");
    prepareCancelDraft(project);

    if (isCancelOutsidePolicyWindow(project)) {
      setLateCancelWarning(project);
      return;
    }

    setCancelTarget(project);
  }

  function confirmLateCancelWarning() {
    if (!lateCancelWarning) return;
    setCancelTarget(lateCancelWarning);
    setLateCancelWarning(null);
  }

  function confirmCancelProject() {
    if (!cancelTarget) return;
    setActionError("");
    setActionOk("");
    const amountPaid = Number(String(cancelAmount).replace(",", "."));
    if (!Number.isFinite(amountPaid) || amountPaid < 0) {
      setActionError("Monto abonado inválido.");
      return;
    }
    const formData = new FormData();
    formData.set("projectId", cancelTarget.id);
    formData.set("amountPaid", String(amountPaid));
    startTransition(async () => {
      const result = await cancelProjectFromBoardAction(formData);
      if (!result.ok) {
        setActionError(result.error);
        return;
      }
      setActionOk(result.message);
      setCancelTarget(null);
      setCancelQuote(null);
      setCancelAmount("");
      setLateCancelWarning(null);
      refreshPlatform(router);
    });
  }

  return (
    <>
      <PlatformSectionHero
        title={title}
        subtitle={subtitle}
        tabs={
          <div
            className="plat-tabs"
            role="tablist"
            aria-label="Estado del proyecto"
          >
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === "all"}
              className={`plat-tab${statusFilter === "all" ? " is-active" : ""}`}
              onClick={() => setStatusFilter("all")}
            >
              Todos
              <span className="plat-tab-count">{statusCounts.all}</span>
            </button>
            {STATUS_OPTIONS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={statusFilter === value}
                className={`plat-tab${statusFilter === value ? " is-active" : ""}`}
                onClick={() => setStatusFilter(value)}
              >
                {label}
                <span className="plat-tab-count">{statusCounts[value] || 0}</span>
              </button>
            ))}
          </div>
        }
      />

      <section className="plat-card plat-quote-panel plat-quote-list plat-projects-board">
        <div className="plat-projects-filters">
          <div className="plat-quote-search plat-quote-list-filter">
            <Search size={15} aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por código IW/IQ, cliente o proyecto…"
              autoComplete="off"
            />
          </div>
        </div>

        {actionError ? <p className="plat-quote-error">{actionError}</p> : null}
        {actionOk ? <p className="plat-quote-ok">{actionOk}</p> : null}

        <div className="plat-quote-list-scroll">
          <table className="plat-table plat-projects-table">
            <thead>
              <tr>
                {SORT_COLUMNS.map((column) => (
                  <th key={column.id}>
                    <button
                      type="button"
                      className={`plat-th-sort${
                        sortKey === column.id ? " is-active" : ""
                      }`}
                      onClick={() => toggleSort(column.id)}
                    >
                      <span>{column.label}</span>
                      {renderSortIcon(column.id)}
                    </button>
                  </th>
                ))}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((project) => {
                const quote = project.quoteId
                  ? quotesById.get(project.quoteId)
                  : null;
                const isFocused =
                  focusNormalized.length > 0 &&
                  project.code.toUpperCase() === focusNormalized;
                const locked =
                  project.status === "completed" ||
                  project.status === "cancelled";
                const services = project.services ?? [];
                const serviceCount = services.length;
                const expanded = Boolean(expandedIds[project.id]);
                const registered = isClientRegistered(project, clients);
                const hoursInvested = Math.max(
                  0,
                  Number(hoursDraft[project.id] ?? project.hoursInvested) || 0,
                );
                const progress =
                  project.status === "completed"
                    ? 100
                    : progressFromHours(
                        hoursInvested,
                        project.hoursEstimated || 0,
                      );

                return (
                  <Fragment key={project.id}>
                    <tr
                      id={`plat-project-${project.code.toUpperCase()}`}
                      className={isFocused ? "is-focused" : undefined}
                    >
                      <td>
                        <div className="plat-project-title-row">
                          <button
                            type="button"
                            className="plat-project-expand"
                            aria-expanded={expanded}
                            aria-label={
                              expanded
                                ? "Ocultar detalle del proyecto"
                                : "Ver detalle del proyecto"
                            }
                            onClick={() => toggleExpand(project.id)}
                          >
                            {expanded ? (
                              <ChevronDown size={15} />
                            ) : (
                              <ChevronRight size={15} />
                            )}
                          </button>
                          <div className="plat-project-title-copy">
                            <strong>{project.name}</strong>
                            <div className="plat-project-meta-line">
                              <small className="plat-quote-muted">
                                <span className="plat-code">{project.code}</span>
                              </small>
                              <small className="plat-quote-muted">
                                · +{serviceCount} adicional
                                {serviceCount === 1 ? "" : "es"}
                              </small>
                              <small
                                className={`plat-quote-reg-badge${
                                  registered ? " is-ok" : " is-pending"
                                }`}
                              >
                                {registered
                                  ? "· Registrado"
                                  : "· Pendiente registro"}
                              </small>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>{project.clientName}</div>
                        <small className="plat-quote-muted">
                          {project.clientEmail}
                        </small>
                      </td>
                      <td>
                        <div className="plat-project-progress-view">
                          <div className="plat-progress is-compact">
                            <span style={{ width: `${progress}%` }} />
                          </div>
                          <small>{progress}%</small>
                        </div>
                      </td>
                      <td>
                        <select
                          className="plat-project-status-select"
                          value={project.status}
                          disabled={pending || locked}
                          onChange={(event) => {
                            const value = event.target.value;
                            if (!isProjectStatus(value)) return;
                            saveProject(project, { status: value });
                          }}
                          aria-label={`Estado de ${project.code}`}
                        >
                          {STATUS_OPTIONS.map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className={`plat-project-payment-select${
                            (project.paymentStatus ?? "unpaid") === "unpaid"
                              ? " is-unpaid"
                              : (project.paymentStatus ?? "unpaid") ===
                                  "paid_in_full"
                                ? " is-paid"
                                : " is-deposit"
                          }`}
                          value={project.paymentStatus ?? "unpaid"}
                          disabled={pending || project.status === "cancelled"}
                          onChange={(event) => {
                            const value = event.target.value;
                            if (!isProjectPaymentStatus(value)) return;
                            savePayment(project, value);
                          }}
                          aria-label={`Estado de pago de ${project.code}`}
                        >
                          {PROJECT_PAYMENT_STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="plat-quote-actions-cell">
                        {project.status === "cancelled" ? (
                          <div className="plat-quote-cancel-meta">
                            <span className="plat-quote-muted">Cancelado</span>
                            {typeof (project.refundAmount ?? quote?.refundAmount) ===
                            "number" ? (
                              <small>
                                Devolución{" "}
                                {project.refundPercent ??
                                  quote?.refundPercent ??
                                  QUOTE_REFUND_PERCENT}
                                %:{" "}
                                {money(
                                  (project.refundAmount ??
                                    quote?.refundAmount) as number,
                                  project.currency,
                                )}
                              </small>
                            ) : null}
                          </div>
                        ) : (
                        <div className="plat-menu">
                          <button
                            type="button"
                            className={`plat-menu-trigger is-compact${
                              openMenuId === project.id ? " is-open" : ""
                            }`}
                            disabled={pending}
                            aria-expanded={openMenuId === project.id}
                            aria-haspopup="menu"
                            onClick={(event) =>
                              toggleActionsMenu(project.id, event)
                            }
                          >
                            Acciones
                            <ChevronDown size={14} />
                          </button>
                          {openMenuId === project.id &&
                          menuPos &&
                          !serviceTarget &&
                          !finishTarget &&
                          !cancelTarget &&
                          !lateCancelWarning ? (
                            <div
                              className="plat-menu-panel is-right is-quote-actions"
                              role="menu"
                              style={{
                                top: menuPos.top,
                                right: menuPos.right,
                              }}
                            >
                              {!registered &&
                              project.status !== "completed" ? (
                                <button
                                  type="button"
                                  className="plat-menu-item"
                                  disabled={pending}
                                  onClick={() => resendInvite(project)}
                                >
                                  <Mail size={14} />
                                  Reenviar invitación
                                </button>
                              ) : null}
                              <button
                                type="button"
                                className="plat-menu-item"
                                disabled={pending || locked}
                                onClick={() => openServiceModal(project)}
                              >
                                <Plus size={14} />
                                Agregar servicio adicional
                              </button>
                              {project.status !== "completed" ? (
                                <>
                                  <button
                                    type="button"
                                    className="plat-menu-item"
                                    disabled={pending}
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      setMenuPos(null);
                                      setFinishTarget(project);
                                    }}
                                  >
                                    <CheckCircle2 size={14} />
                                    Terminar proyecto
                                  </button>
                                  <button
                                    type="button"
                                    className="plat-menu-item is-danger"
                                    disabled={pending}
                                    onClick={() => openCancelModal(project)}
                                  >
                                    <Undo2 size={14} />
                                    Cancelar proyecto
                                  </button>
                                </>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                        )}
                      </td>
                    </tr>
                    {expanded ? (
                      <tr className="plat-project-detail-row">
                        <td colSpan={6}>
                          <div className="plat-project-detail">
                            <div className="plat-project-detail-grid">
                              <div>
                                <span className="plat-project-detail-label">
                                  Código
                                </span>
                                <strong className="plat-code">
                                  {project.code}
                                </strong>
                              </div>
                              <div>
                                <span className="plat-project-detail-label">
                                  Inicio
                                </span>
                                <strong>{formatDate(project.createdAt)}</strong>
                              </div>
                              <div>
                                <span className="plat-project-detail-label">
                                  Cotización
                                </span>
                                <strong>
                                  {project.quoteCode || "Sin cotización"}
                                </strong>
                              </div>
                              <div>
                                <span className="plat-project-detail-label">
                                  Valor
                                </span>
                                <strong className="plat-project-value-cell">
                                  {money(project.value, project.currency)}
                                </strong>
                              </div>
                              <div>
                                <span className="plat-project-detail-label">
                                  Horas
                                </span>
                                <div className="plat-project-hours-edit">
                                  <input
                                    type="number"
                                    min={0}
                                    step={0.5}
                                    value={
                                      hoursDraft[project.id] ??
                                      String(project.hoursInvested || 0)
                                    }
                                    disabled={pending || locked}
                                    onFocus={() =>
                                      setHoursEditingId(project.id)
                                    }
                                    onChange={(event) => {
                                      const value = event.target.value;
                                      setHoursEditingId(project.id);
                                      setHoursDraft((current) => ({
                                        ...current,
                                        [project.id]: value,
                                      }));
                                    }}
                                    onBlur={(event) =>
                                      commitHours(project, event.target.value)
                                    }
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter") {
                                        event.currentTarget.blur();
                                      }
                                    }}
                                    aria-label={`Horas invertidas de ${project.code}`}
                                  />
                                  <small className="plat-quote-muted">
                                    / {project.hoursEstimated || 0}h
                                  </small>
                                </div>
                              </div>
                              <div>
                                <span className="plat-project-detail-label">
                                  PDF
                                </span>
                                <div className="plat-project-pdf-row">
                                  <a
                                    className="plat-btn is-ghost is-compact"
                                    href={`/api/plataforma/projects/${project.id}/pdf`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Resumen del proyecto"
                                  >
                                    <Download size={14} />
                                    Proyecto
                                  </a>
                                  {quote ? (
                                    <a
                                      className="plat-btn is-ghost is-compact"
                                      href={`/api/plataforma/quotes/${quote.id}/pdf`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Cotización comercial"
                                    >
                                      <FileText size={14} />
                                      Cotización
                                    </a>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            {(project.cancelRequest?.status === "pending" ||
                              (project.clientUpdates ?? []).some(
                                (item) => item.status === "open",
                              )) && (
                              <div className="plat-project-client-requests">
                                <h4>Solicitudes del cliente</h4>
                                {project.cancelRequest?.status === "pending" ? (
                                  <p className="plat-quote-error">
                                    Cancelación pendiente (
                                    {new Date(
                                      project.cancelRequest.requestedAt,
                                    ).toLocaleDateString("es-AR")}
                                    ): {project.cancelRequest.reason}
                                  </p>
                                ) : null}
                                <ul>
                                  {(project.clientUpdates ?? [])
                                    .filter((item) => item.status === "open")
                                    .slice(0, 5)
                                    .map((item) => (
                                      <li key={item.id}>
                                        <strong>
                                          {item.kind === "extra_request"
                                            ? "Pedido adicional"
                                            : "Observación"}
                                        </strong>
                                        <span>{item.body}</span>
                                      </li>
                                    ))}
                                </ul>
                              </div>
                            )}

                            <div className="plat-project-detail-services">
                              <div className="plat-project-services-head">
                                <h4>Servicios adicionales</h4>
                                {serviceCount > 0 ? (
                                  <span className="plat-service-chip">
                                    {serviceCount} adicional
                                    {serviceCount === 1 ? "" : "es"}
                                  </span>
                                ) : null}
                              </div>
                              {serviceCount === 0 ? (
                                <p className="plat-project-services-empty">
                                  Todavía no hay servicios adicionales. Usá
                                  Acciones → Agregar servicio adicional.
                                </p>
                              ) : (
                                <div className="plat-project-services-panel">
                                  <ul className="plat-project-services-items">
                                    {services.map((service) => {
                                      const rate =
                                        service.hours > 0
                                          ? roundMoney(
                                              service.amount / service.hours,
                                            )
                                          : projectHourlyRate(
                                              project,
                                              quote,
                                            );
                                      return (
                                        <li key={service.id}>
                                          <div className="plat-project-service-main">
                                            <span className="plat-service-chip is-soft">
                                              Adicional
                                            </span>
                                            <div>
                                              <strong>{service.name}</strong>
                                              {service.description ? (
                                                <p>{service.description}</p>
                                              ) : null}
                                            </div>
                                          </div>
                                          <div className="plat-project-service-math">
                                            <span>
                                              {service.hours}h ×{" "}
                                              {money(rate, project.currency)}
                                              /h
                                            </span>
                                            <strong>
                                              {money(
                                                service.amount,
                                                project.currency,
                                              )}
                                            </strong>
                                          </div>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                  <div className="plat-project-services-total">
                                    <span>Total adicionales</span>
                                    <strong>
                                      {money(
                                        services.reduce(
                                          (sum, entry) =>
                                            sum + (entry.amount || 0),
                                          0,
                                        ),
                                        project.currency,
                                      )}
                                    </strong>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    No hay proyectos. Aprobá una cotización en Cotizador para
                    crear el primero.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <PlatformConfirmDialog
        open={Boolean(serviceTarget)}
        title="Agregar servicio adicional"
        description={
          serviceTarget
            ? `Sumá un servicio adicional a ${serviceTarget.code}. El monto se calcula con la tarifa horaria del proyecto.`
            : ""
        }
        confirmLabel="Agregar adicional"
        cancelLabel="Cerrar"
        pending={pending}
        pendingLabel="Guardando…"
        tone="primary"
        onConfirm={submitService}
        onCancel={() => setServiceTarget(null)}
      >
        <div className="plat-project-service-form">
          <label className="plat-field">
            Nombre del servicio adicional
            <input
              value={serviceName}
              onChange={(event) => setServiceName(event.target.value)}
              placeholder="Ej. Branding logo, integración API…"
              autoComplete="off"
              name="project-service-name"
            />
          </label>
          <label className="plat-field">
            Detalle
            <textarea
              value={serviceDescription}
              onChange={(event) => setServiceDescription(event.target.value)}
              placeholder="Alcance breve (opcional)"
              rows={3}
              autoComplete="off"
              name="project-service-detail"
            />
          </label>
          <label className="plat-field">
            Horas
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={serviceHours}
              onChange={(event) => setServiceHours(event.target.value)}
              autoComplete="off"
              name="project-service-hours"
            />
          </label>

          <div className="plat-service-breakdown" aria-live="polite">
            <div className="plat-service-breakdown-row">
              <span>Precio por hora</span>
              <strong>
                {serviceTarget
                  ? money(serviceRate, serviceTarget.currency)
                  : "—"}
              </strong>
            </div>
            <div className="plat-service-breakdown-row">
              <span>Horas</span>
              <strong>{serviceHoursValue || 0}h</strong>
            </div>
            <div className="plat-service-breakdown-row">
              <span>Subtotal</span>
              <strong>
                {serviceHoursValue || 0}h ×{" "}
                {serviceTarget
                  ? money(serviceRate, serviceTarget.currency)
                  : "—"}
                /h
              </strong>
            </div>
            <div className="plat-service-breakdown-row is-total">
              <span>Total del adicional</span>
              <strong>
                {serviceTarget
                  ? money(serviceSubtotal, serviceTarget.currency)
                  : "—"}
              </strong>
            </div>
          </div>
        </div>
      </PlatformConfirmDialog>

      <PlatformConfirmDialog
        open={Boolean(finishTarget)}
        title="Terminar proyecto"
        description={
          finishTarget
            ? `¿Marcar ${finishTarget.code} como finalizado? El cliente perderá el acceso a la plataforma.`
            : ""
        }
        confirmLabel="Terminar"
        cancelLabel="Volver"
        pending={pending}
        pendingLabel="Cerrando…"
        onConfirm={confirmFinish}
        onCancel={() => setFinishTarget(null)}
      />

      <PlatformConfirmDialog
        open={Boolean(lateCancelWarning)}
        title="Reembolso fuera de plazo"
        description={
          lateCancelWarning
            ? `¿Estás seguro de realizar la devolución? El cliente solicitó el reembolso pasados los ${QUOTE_CANCEL_WITHIN_DAYS} días corridos desde la creación del proyecto ${lateCancelWarning.code} (inicio: ${formatDate(lateCancelWarning.createdAt)}).`
            : ""
        }
        confirmLabel="Sí, continuar"
        cancelLabel="Volver"
        pending={false}
        onConfirm={confirmLateCancelWarning}
        onCancel={() => {
          setLateCancelWarning(null);
          setCancelQuote(null);
          setCancelAmount("");
        }}
      />

      <PlatformConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancelar proyecto"
        description={
          cancelTarget
            ? `Vas a cancelar ${cancelTarget.code}. Se registra una devolución del ${QUOTE_REFUND_PERCENT}% sobre lo abonado.`
            : ""
        }
        confirmLabel="Cancelar proyecto"
        cancelLabel="Volver"
        pending={pending}
        pendingLabel="Cancelando…"
        onConfirm={confirmCancelProject}
        onCancel={() => {
          if (pending) return;
          setCancelTarget(null);
          setCancelQuote(null);
          setCancelAmount("");
        }}
      >
        <label className="plat-field">
          Monto abonado
          <input
            type="number"
            min={0}
            step={1}
            value={cancelAmount}
            onChange={(event) => setCancelAmount(event.target.value)}
          />
        </label>
        {cancelTarget ? (
          <p className="plat-modal-hint">
            Devolución estimada:{" "}
            {money(
              computeRefundAmount(
                Number(String(cancelAmount).replace(",", ".")) || 0,
                QUOTE_REFUND_PERCENT,
              ),
              cancelTarget.currency,
            )}
            {cancelQuote ? ` · Cotización ${cancelQuote.code}` : null}
          </p>
        ) : null}
      </PlatformConfirmDialog>
    </>
  );
}
