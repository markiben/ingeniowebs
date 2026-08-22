"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  Download,
  ExternalLink,
  Search,
  Sheet,
  Trash2,
} from "lucide-react";
import PlatformConfirmDialog from "@/components/platform/PlatformConfirmDialog";
import NewsletterMetrics from "@/components/platform/NewsletterMetrics";
import PlatformSectionHero from "@/components/platform/PlatformSectionHero";
import {
  deleteNewsletterSubscriberAction,
  resendNewsletterWelcomeAction,
  setNewsletterStatusAction,
} from "@/lib/platform/actions";
import { refreshPlatform } from "@/lib/platform/client-refresh";
import {
  NEWSLETTER_SOURCE_LABEL,
  NEWSLETTER_STATUS_LABEL,
  newsletterStats,
} from "@/lib/platform/newsletter";
import type {
  NewsletterClickEvent,
  NewsletterSource,
  NewsletterStatus,
  NewsletterSubscriber,
} from "@/lib/platform/types";
import { useRouter } from "next/navigation";

type Props = {
  subscribers: NewsletterSubscriber[];
  clicks?: NewsletterClickEvent[];
};

type MenuId = "status" | "source" | string;
type SortKey = "name" | "email" | "status" | "origin" | "createdAt";
type SortDir = "asc" | "desc";

const SORT_COLUMNS: { id: SortKey; label: string }[] = [
  { id: "name", label: "Nombre" },
  { id: "email", label: "Email" },
  { id: "status", label: "Estado" },
  { id: "origin", label: "Origen" },
  { id: "createdAt", label: "Alta" },
];

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return date.toLocaleString("es-AR");
}

function toGmailUrl(email: string) {
  const value = email.trim();
  if (!value) return null;
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(value)}`;
}

function statusBadgeClass(status: NewsletterStatus) {
  if (status === "active") return "plat-badge is-done";
  if (status === "unsubscribed") return "plat-badge is-danger";
  return "plat-badge";
}

function originLabel(entry: NewsletterSubscriber) {
  return entry.sources
    .map((source) => NEWSLETTER_SOURCE_LABEL[source] ?? source)
    .join(", ");
}

function compareText(a: string, b: string) {
  return a.localeCompare(b, "es", { sensitivity: "base" });
}

function MenuSelect({
  label,
  valueLabel,
  open,
  onToggle,
  children,
}: {
  label: string;
  valueLabel: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="plat-filter-select">
      <span>{label}</span>
      <div className="plat-menu">
        <button
          type="button"
          className={`plat-menu-trigger${open ? " is-open" : ""}`}
          aria-expanded={open}
          aria-haspopup="listbox"
          onClick={onToggle}
        >
          <span>{valueLabel}</span>
          <ChevronDown size={14} />
        </button>
        {open ? (
          <div className="plat-menu-panel" role="listbox">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function NewsletterPanel({
  subscribers,
  clicks = [],
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"list" | "metrics">("list");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | NewsletterStatus>(
    "all",
  );
  const [sourceFilter, setSourceFilter] = useState<"all" | NewsletterSource>(
    "all",
  );
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [error, setError] = useState("");
  const [actionOk, setActionOk] = useState("");
  const [pending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenu) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenMenu(null);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openMenu]);

  const stats = useMemo(() => newsletterStats(subscribers), [subscribers]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = subscribers.filter((entry) => {
      if (statusFilter !== "all" && entry.status !== statusFilter) return false;
      if (sourceFilter !== "all" && !entry.sources.includes(sourceFilter)) {
        return false;
      }
      if (!needle) return true;
      return (
        entry.name.toLowerCase().includes(needle) ||
        entry.email.toLowerCase().includes(needle)
      );
    });

    return [...rows].sort((a, b) => {
      let result = 0;
      switch (sortKey) {
        case "name":
          result = compareText(a.name, b.name);
          break;
        case "email":
          result = compareText(a.email, b.email);
          break;
        case "status":
          result = compareText(
            NEWSLETTER_STATUS_LABEL[a.status],
            NEWSLETTER_STATUS_LABEL[b.status],
          );
          break;
        case "origin":
          result = compareText(originLabel(a), originLabel(b));
          break;
        case "createdAt":
        default:
          result =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDir === "asc" ? result : -result;
    });
  }, [subscribers, query, statusFilter, sourceFilter, sortKey, sortDir]);

  function toggleSort(columnId: SortKey) {
    if (sortKey === columnId) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(columnId);
    setSortDir(columnId === "createdAt" ? "desc" : "asc");
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

  const sheetsExportHref = "/api/plataforma/newsletter/export?format=sheets";
  const fullExportHref =
    statusFilter === "all"
      ? "/api/plataforma/newsletter/export"
      : `/api/plataforma/newsletter/export?status=${statusFilter}`;

  const statusLabel =
    statusFilter === "all"
      ? "Todos"
      : NEWSLETTER_STATUS_LABEL[statusFilter];

  const sourceLabel =
    sourceFilter === "all"
      ? "Todos"
      : NEWSLETTER_SOURCE_LABEL[sourceFilter];

  const sourceOptions = (
    Object.keys(NEWSLETTER_SOURCE_LABEL) as NewsletterSource[]
  ).filter((source) => source !== "manual");

  function runStatus(id: string, status: NewsletterStatus) {
    setOpenMenu(null);
    const formData = new FormData();
    formData.set("id", id);
    formData.set("status", status);
    startTransition(async () => {
      setError("");
      setActionOk("");
      const result = await setNewsletterStatusAction(formData);
      if (result && !result.ok) {
        setError(result.error ?? "No se pudo completar la acción.");
        return;
      }
      refreshPlatform(router);
    });
  }

  function runResendWelcome(id: string) {
    setOpenMenu(null);
    const formData = new FormData();
    formData.set("id", id);
    startTransition(async () => {
      setError("");
      setActionOk("");
      const result = await resendNewsletterWelcomeAction(formData);
      if (result && !result.ok) {
        setError(result.error ?? "No se pudo reenviar el email.");
        return;
      }
      setActionOk(
        (result && "message" in result && result.message) ||
          "Email de descuento reenviado.",
      );
    });
  }

  return (
    <div className="plat-newsletter-hub" ref={rootRef}>
      <PlatformSectionHero
        title="Newsletter"
        subtitle="Base de contactos para campañas en Google Workspace (Sheets + Gmail)."
        tabs={
          <div className="plat-tabs" role="tablist" aria-label="Newsletter">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "list"}
              className={`plat-tab${tab === "list" ? " is-active" : ""}`}
              onClick={() => setTab("list")}
            >
              Listado
              <span className="plat-tab-count is-active-count">
                {stats.active}
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "metrics"}
              className={`plat-tab${tab === "metrics" ? " is-active" : ""}`}
              onClick={() => {
                setOpenMenu(null);
                setTab("metrics");
              }}
            >
              Métricas
            </button>
          </div>
        }
      />

      {tab === "metrics" ? (
        <section className="plat-card plat-quote-panel plat-quote-list plat-newsletter-metrics-board">
          <NewsletterMetrics subscribers={subscribers} clicks={clicks} />
        </section>
      ) : (
        <section className="plat-card plat-quote-panel plat-quote-list plat-newsletter-board">
          <div className="plat-projects-filters">
            <div className="plat-quote-search plat-quote-list-filter">
              <Search size={15} aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nombre o email…"
                autoComplete="off"
              />
            </div>

            <MenuSelect
              label="Estado"
              valueLabel={statusLabel}
              open={openMenu === "status"}
              onToggle={() =>
                setOpenMenu((current) =>
                  current === "status" ? null : "status",
                )
              }
            >
              <button
                type="button"
                className={`plat-menu-item${statusFilter === "all" ? " is-active" : ""}`}
                onClick={() => {
                  setStatusFilter("all");
                  setOpenMenu(null);
                }}
              >
                Todos
              </button>
              {(Object.keys(NEWSLETTER_STATUS_LABEL) as NewsletterStatus[]).map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    className={`plat-menu-item${statusFilter === status ? " is-active" : ""}`}
                    onClick={() => {
                      setStatusFilter(status);
                      setOpenMenu(null);
                    }}
                  >
                    {NEWSLETTER_STATUS_LABEL[status]}
                  </button>
                ),
              )}
            </MenuSelect>

            <MenuSelect
              label="Origen"
              valueLabel={sourceLabel}
              open={openMenu === "source"}
              onToggle={() =>
                setOpenMenu((current) =>
                  current === "source" ? null : "source",
                )
              }
            >
              <button
                type="button"
                className={`plat-menu-item${sourceFilter === "all" ? " is-active" : ""}`}
                onClick={() => {
                  setSourceFilter("all");
                  setOpenMenu(null);
                }}
              >
                Todos
              </button>
              {sourceOptions.map((source) => (
                <button
                  key={source}
                  type="button"
                  className={`plat-menu-item${sourceFilter === source ? " is-active" : ""}`}
                  onClick={() => {
                    setSourceFilter(source);
                    setOpenMenu(null);
                  }}
                >
                  {NEWSLETTER_SOURCE_LABEL[source]}
                </button>
              ))}
            </MenuSelect>

            <div className="plat-newsletter-export">
              <a
                className="plat-btn"
                href={sheetsExportHref}
                download
                title="CSV con Nombre y Email (activos) para importar en Google Sheets"
                onClick={() =>
                  setActionOk(
                    "Descargá el CSV e importalo en Sheets: Archivo → Importar → Subir.",
                  )
                }
              >
                <Sheet size={16} />
                Exportar a Sheets
              </a>
              <a
                className="plat-btn is-ghost"
                href="https://sheets.google.com/create"
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir una planilla nueva en Google Sheets"
              >
                <ExternalLink size={15} />
                Abrir Sheets
              </a>
            </div>
          </div>

          <p className="plat-newsletter-hint">
            Contactos de web, cotizador y plataforma. Para campañas en Google
            Workspace exportá <strong>Nombre + Email</strong> (solo activos) e
            importá el CSV en Sheets. Baja pública:{" "}
            <a href="/baja">/baja</a>
            {" · "}
            <a className="plat-contact-link" href={fullExportHref} download>
              <Download size={12} style={{ display: "inline", verticalAlign: "-2px" }} />{" "}
              CSV completo
            </a>
          </p>

          {error ? <p className="plat-quote-error">{error}</p> : null}
          {actionOk ? <p className="plat-quote-ok">{actionOk}</p> : null}

          <div className="plat-quote-list-scroll">
            <table className="plat-table">
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
                {filtered.map((entry) => {
                  const gmailUrl = toGmailUrl(entry.email);
                  const menuKey = `row-${entry.id}`;
                  const menuOpen = openMenu === menuKey;

                  return (
                    <tr key={entry.id}>
                      <td>{entry.name}</td>
                      <td>
                        {gmailUrl ? (
                          <a
                            className="plat-contact-link"
                            href={gmailUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Escribir por Gmail"
                          >
                            {entry.email}
                          </a>
                        ) : (
                          entry.email
                        )}
                      </td>
                      <td>
                        <span className={statusBadgeClass(entry.status)}>
                          {NEWSLETTER_STATUS_LABEL[entry.status]}
                        </span>
                      </td>
                      <td>{originLabel(entry)}</td>
                      <td>{formatDate(entry.createdAt)}</td>
                      <td className="plat-quote-actions-cell">
                        <div className="plat-row-actions">
                          <div className="plat-menu">
                            <button
                              type="button"
                              className={`plat-menu-trigger is-compact${menuOpen ? " is-open" : ""}`}
                              disabled={pending}
                              aria-expanded={menuOpen}
                              aria-haspopup="menu"
                              onClick={() =>
                                setOpenMenu(menuOpen ? null : menuKey)
                              }
                            >
                              Acciones
                              <ChevronDown size={14} />
                            </button>
                            {menuOpen ? (
                              <div
                                className="plat-menu-panel is-right"
                                role="menu"
                              >
                                {entry.status === "active" ? (
                                  <>
                                    <button
                                      type="button"
                                      className="plat-menu-item"
                                      disabled={pending}
                                      onClick={() => runResendWelcome(entry.id)}
                                    >
                                      Reenviar descuento
                                    </button>
                                    <button
                                      type="button"
                                      className="plat-menu-item"
                                      disabled={pending}
                                      onClick={() =>
                                        runStatus(entry.id, "unsubscribed")
                                      }
                                    >
                                      Dar de baja
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    className="plat-menu-item"
                                    disabled={pending}
                                    onClick={() =>
                                      runStatus(entry.id, "active")
                                    }
                                  >
                                    Reactivar
                                  </button>
                                )}
                              </div>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            className="plat-btn is-danger plat-icon-btn"
                            disabled={pending}
                            title="Eliminar"
                            onClick={() => {
                              setOpenMenu(null);
                              setDeleteId(entry.id);
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No hay contactos con esos filtros.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <PlatformConfirmDialog
        open={Boolean(deleteId)}
        title="Eliminar contacto"
        description="Se borra de la base de newsletter. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        pending={pending}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return;
          const formData = new FormData();
          formData.set("id", deleteId);
          setDeleteId(null);
          startTransition(async () => {
            setError("");
            const result = await deleteNewsletterSubscriberAction(formData);
            if (result && !result.ok) {
              setError(result.error ?? "No se pudo eliminar.");
              return;
            }
            refreshPlatform(router);
          });
        }}
      />
    </div>
  );
}
