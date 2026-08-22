"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ListFilter,
} from "lucide-react";
import ClientQuickView from "@/components/platform/ClientQuickView";
import ProjectAdminActions from "@/components/platform/ProjectAdminActions";
import type {
  PlatformProject,
  PlatformUser,
  ProjectStatus,
} from "@/lib/platform/types";

type ColumnId =
  | "code"
  | "project"
  | "client"
  | "startedAt"
  | "value"
  | "hours"
  | "progress"
  | "status"
  | "actions";

type SortDir = "asc" | "desc";

const STATUS_ORDER: ProjectStatus[] = [
  "in_progress",
  "review",
  "completed",
  "cancelled",
];

const COLUMNS: {
  id: ColumnId;
  label: string;
  defaultVisible: boolean;
  sortable: boolean;
}[] = [
  { id: "code", label: "Código", defaultVisible: true, sortable: true },
  { id: "project", label: "Proyecto", defaultVisible: true, sortable: true },
  { id: "client", label: "Cliente", defaultVisible: true, sortable: true },
  {
    id: "startedAt",
    label: "Inicio",
    defaultVisible: true,
    sortable: true,
  },
  { id: "value", label: "Valor", defaultVisible: true, sortable: true },
  { id: "hours", label: "Horas", defaultVisible: true, sortable: true },
  { id: "progress", label: "Avance", defaultVisible: true, sortable: true },
  { id: "status", label: "Estado", defaultVisible: true, sortable: true },
  { id: "actions", label: "Acciones", defaultVisible: true, sortable: false },
];

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

function compareText(a: string, b: string) {
  return a.localeCompare(b, "es", { sensitivity: "base", numeric: true });
}

export default function ProjectsTable({
  projects,
  clients = [],
  showActions = true,
  title,
  emptyLabel = "Sin proyectos para ese filtro.",
  focusCode,
}: {
  projects: PlatformProject[];
  clients?: PlatformUser[];
  showActions?: boolean;
  title?: string;
  emptyLabel?: string;
  focusCode?: string;
}) {
  const availableColumns = COLUMNS.filter(
    (column) => showActions || column.id !== "actions",
  );

  const [visible, setVisible] = useState<Record<ColumnId, boolean>>(() =>
    Object.fromEntries(
      COLUMNS.map((column) => [column.id, column.defaultVisible]),
    ) as Record<ColumnId, boolean>,
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState(focusCode?.trim() || "");
  const [sortKey, setSortKey] = useState<ColumnId>("startedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const focusNormalized = focusCode?.trim().toUpperCase() || "";

  useEffect(() => {
    if (!focusNormalized) return;
    setQuery(focusNormalized);
    const timer = window.setTimeout(() => {
      const row = document.getElementById(`plat-project-${focusNormalized}`);
      row?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
    return () => window.clearTimeout(timer);
  }, [focusNormalized, projects]);

  const clientsByEmail = useMemo(() => {
    const map = new Map<string, PlatformUser>();
    for (const client of clients) {
      map.set(client.email.toLowerCase(), client);
    }
    return map;
  }, [clients]);

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
        project.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });

    const sorted = [...filtered].sort((a, b) => {
      let result = 0;

      switch (sortKey) {
        case "code":
          result = compareText(a.code, b.code);
          break;
        case "project":
          result = compareText(a.name, b.name);
          break;
        case "client":
          result = compareText(a.clientName, b.clientName);
          break;
        case "startedAt":
          result =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "value":
          result = (a.value || 0) - (b.value || 0);
          if (result === 0) result = compareText(a.currency, b.currency);
          break;
        case "hours":
          result =
            (a.hoursInvested || 0) - (a.hoursEstimated || 0) -
            ((b.hoursInvested || 0) - (b.hoursEstimated || 0));
          break;
        case "progress":
          result = a.progress - b.progress;
          break;
        case "status":
          result =
            STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
          break;
        default:
          result = 0;
      }

      return sortDir === "asc" ? result : -result;
    });

    return sorted;
  }, [projects, query, statusFilter, sortKey, sortDir]);

  const activeColumns = availableColumns.filter((column) => visible[column.id]);

  function toggleSort(columnId: ColumnId) {
    if (sortKey === columnId) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(columnId);
    setSortDir(
      columnId === "startedAt" ||
        columnId === "value" ||
        columnId === "hours" ||
        columnId === "progress"
        ? "desc"
        : "asc",
    );
  }

  function renderSortIcon(columnId: ColumnId) {
    if (sortKey !== columnId) {
      return <ArrowUpDown size={12} className="plat-sort-icon" />;
    }
    return sortDir === "asc" ? (
      <ArrowUp size={12} className="plat-sort-icon is-active" />
    ) : (
      <ArrowDown size={12} className="plat-sort-icon is-active" />
    );
  }

  return (
    <div className="plat-card" style={{ marginTop: "1rem" }}>
      <div className="plat-table-toolbar">
        {title ? <h3 style={{ margin: 0, flex: "1 1 100%" }}>{title}</h3> : null}

        <div className="plat-table-filters">
          <label className="plat-filter-select">
            Buscar
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Código, cliente, proyecto..."
            />
          </label>
          <label className="plat-filter-select">
            Estado
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">Todos</option>
              <option value="in_progress">En curso</option>
              <option value="review">En revisión</option>
              <option value="completed">Finalizado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </label>
        </div>

        <div className="plat-columns-menu">
          <button
            type="button"
            className="plat-btn is-ghost plat-icon-btn"
            aria-label="Filtrar columnas"
            title="Filtrar columnas"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <ListFilter size={16} />
          </button>
          {menuOpen ? (
            <div className="plat-columns-panel">
              {availableColumns.map((column) => (
                <label key={column.id}>
                  <input
                    type="checkbox"
                    checked={visible[column.id]}
                    onChange={() =>
                      setVisible((current) => ({
                        ...current,
                        [column.id]: !current[column.id],
                      }))
                    }
                  />
                  {column.label}
                </label>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="plat-table">
          <thead>
            <tr>
              {activeColumns.map((column) => (
                <th key={column.id}>
                  {column.sortable ? (
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
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((project) => {
              const client =
                clientsByEmail.get(project.clientEmail.toLowerCase()) ?? null;

              const isFocused =
                focusNormalized.length > 0 &&
                project.code.toUpperCase() === focusNormalized;

              return (
                <tr
                  key={project.id}
                  id={`plat-project-${project.code.toUpperCase()}`}
                  className={isFocused ? "is-focused" : undefined}
                >
                  {visible.code ? (
                    <td className="plat-code">{project.code}</td>
                  ) : null}
                  {visible.project ? (
                    <td>
                      <strong>{project.name}</strong>
                      {project.quoteCode ? (
                        <div>
                          <small className="plat-quote-muted">
                            Cotización {project.quoteCode}
                          </small>
                        </div>
                      ) : null}
                    </td>
                  ) : null}
                  {visible.client ? (
                    <td>
                      <ClientQuickView project={project} client={client} />
                    </td>
                  ) : null}
                  {visible.startedAt ? (
                    <td>{formatDate(project.createdAt)}</td>
                  ) : null}
                  {visible.value ? (
                    <td>{money(project.value, project.currency)}</td>
                  ) : null}
                  {visible.hours ? (
                    <td>
                      <div className="plat-hours-cell">
                        <span>
                          {project.hoursInvested || 0}/{project.hoursEstimated || 0}h
                        </span>
                        {project.pricingType === "fixed" &&
                        project.hoursEstimated > 0 &&
                        project.hoursInvested > project.hoursEstimated ? (
                          <span className="plat-badge is-warn">over</span>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                  {visible.progress ? (
                    <td>
                      <div className="plat-progress-cell">
                        <div className="plat-progress is-compact">
                          <span style={{ width: `${project.progress}%` }} />
                        </div>
                        <small>{project.progress}%</small>
                      </div>
                    </td>
                  ) : null}
                  {visible.status ? (
                    <td>
                      <span
                        className={`plat-badge${
                          project.status === "completed" ? " is-done" : ""
                        }`}
                      >
                        {project.status}
                      </span>
                    </td>
                  ) : null}
                  {showActions && visible.actions ? (
                    <td>
                      <ProjectAdminActions project={project} />
                    </td>
                  ) : null}
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={Math.max(activeColumns.length, 1)}>
                  {emptyLabel}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
