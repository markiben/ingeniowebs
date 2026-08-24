"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronDown,
  FolderKanban,
  KeyRound,
  Lock,
  LockOpen,
  Mail,
  MessageCircle,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import PlatformConfirmDialog from "@/components/platform/PlatformConfirmDialog";
import PlatformSectionHero from "@/components/platform/PlatformSectionHero";
import {
  deleteClientAction,
  requestPasswordResetAction,
  resendProjectInviteAction,
  setClientAccessAction,
  setClientArchivedAction,
  updateClientAction,
} from "@/lib/platform/actions";
import type { PlatformProject, PlatformUser } from "@/lib/platform/types";
import {
  copyProjectRegisteredEmailBody,
  toProjectRegisteredGmailUrl,
} from "@/lib/platform/project-email";

type ColumnId =
  | "name"
  | "email"
  | "phone"
  | "registeredAt"
  | "actions";

type SortDir = "asc" | "desc";

type ClientRow = {
  key: string;
  clientId: string | null;
  projectId: string | null;
  projectCode: string;
  projectCount: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  registered: boolean;
  registeredAt: string | null;
  accessBlocked: boolean;
  archived: boolean;
};

function toSupportGmailUrl(email: string) {
  const value = email.trim();
  if (!value) return null;
  const params = new URLSearchParams({
    fs: "1",
    tf: "cm",
    to: value,
  });
  return `https://mail.google.com/mail/u/0/?${params.toString()}`;
}

const COLUMNS: {
  id: ColumnId;
  label: string;
  defaultVisible: boolean;
  sortable: boolean;
}[] = [
  {
    id: "registeredAt",
    label: "Registro",
    defaultVisible: true,
    sortable: true,
  },
  { id: "name", label: "Nombre", defaultVisible: true, sortable: true },
  { id: "email", label: "Email", defaultVisible: true, sortable: true },
  { id: "phone", label: "Teléfono", defaultVisible: true, sortable: true },
  { id: "actions", label: "Acciones", defaultVisible: true, sortable: false },
];

function compareText(a: string, b: string) {
  return a.localeCompare(b, "es", { sensitivity: "base", numeric: true });
}

function toWhatsAppUrl(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

function pickPrimaryProject(
  list: PlatformProject[],
  preferredProjectId?: string | null,
) {
  if (!list.length) return null;
  const sorted = [...list].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  if (preferredProjectId) {
    const preferred = sorted.find((entry) => entry.id === preferredProjectId);
    if (preferred) return preferred;
  }
  return (
    sorted.find(
      (entry) =>
        entry.status !== "completed" && entry.status !== "cancelled",
    ) ?? sorted[0]
  );
}

function buildRows(
  clients: PlatformUser[],
  projects: PlatformProject[],
): ClientRow[] {
  type Bucket = {
    client: PlatformUser | null;
    projects: PlatformProject[];
  };

  const byEmail = new Map<string, Bucket>();

  for (const client of clients) {
    if (client.role !== "client") continue;
    const email = client.email.trim().toLowerCase();
    if (!email) continue;
    const bucket = byEmail.get(email) ?? { client: null, projects: [] };
    bucket.client = client;
    byEmail.set(email, bucket);
  }

  for (const project of projects) {
    const email = project.clientEmail.trim().toLowerCase();
    if (!email) continue;
    const bucket = byEmail.get(email) ?? { client: null, projects: [] };
    bucket.projects.push(project);
    byEmail.set(email, bucket);
  }

  const rows: ClientRow[] = [];

  for (const [email, bucket] of byEmail) {
    const client = bucket.client;
    const list = bucket.projects;
    const primary = pickPrimaryProject(list, client?.projectId);
    const archived = client
      ? Boolean(client.archived)
      : list.length > 0 && list.every((entry) => entry.clientArchived);
    const openProjects = list.filter(
      (entry) =>
        entry.status !== "completed" && entry.status !== "cancelled",
    );
    const accessBlocked = client
      ? Boolean(client.accessBlocked)
      : openProjects.length > 0
        ? openProjects.every((entry) => !entry.accessEnabled)
        : list.length > 0 && list.every((entry) => !entry.accessEnabled);

    rows.push({
      key: client ? `user_${client.id}` : `email_${email}`,
      clientId: client?.id ?? null,
      projectId: primary?.id ?? null,
      projectCode: primary?.code ?? "",
      projectCount: list.length,
      name: client?.name || primary?.clientName || email,
      email: client?.email || primary?.clientEmail || email,
      phone: client?.phone || "",
      company: client?.company || "",
      registered: Boolean(client),
      registeredAt: client?.createdAt ?? null,
      accessBlocked,
      archived,
    });
  }

  return rows;
}

export default function ClientsTable({
  clients,
  projects,
}: {
  clients: PlatformUser[];
  projects: PlatformProject[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [listTab, setListTab] = useState<"active" | "archived">("active");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<ColumnId>("registeredAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [openActionsId, setOpenActionsId] = useState<string | null>(null);
  const [actionsMenuPos, setActionsMenuPos] = useState<{
    top: number;
    right: number;
  } | null>(null);
  const [mailPreparedKey, setMailPreparedKey] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
  });
  const [error, setError] = useState("");
  const [actionOk, setActionOk] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    clientId: string | null;
    projectId: string | null;
    name: string;
    registered: boolean;
  } | null>(null);
  const [visible] = useState<Record<ColumnId, boolean>>(() =>
    Object.fromEntries(
      COLUMNS.map((column) => [column.id, column.defaultVisible]),
    ) as Record<ColumnId, boolean>,
  );
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openActionsId) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenActionsId(null);
        setActionsMenuPos(null);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openActionsId]);
  useEffect(() => {
    if (!openActionsId) return;

    function closeActions() {
      setOpenActionsId(null);
      setActionsMenuPos(null);
    }

    function onPointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".plat-menu")) return;
      closeActions();
    }

    window.addEventListener("scroll", closeActions, true);
    window.addEventListener("resize", closeActions);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("scroll", closeActions, true);
      window.removeEventListener("resize", closeActions);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [openActionsId]);

  function toggleActionsMenu(
    rowKey: string,
    event: ReactMouseEvent<HTMLButtonElement>,
  ) {
    if (openActionsId === rowKey) {
      setOpenActionsId(null);
      setActionsMenuPos(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    setActionsMenuPos({
      top: rect.bottom + 6,
      right: Math.max(8, window.innerWidth - rect.right),
    });
    setOpenActionsId(rowKey);
  }

  function startEditing(row: ClientRow) {
    setOpenActionsId(null);
    setActionsMenuPos(null);
    setEditingKey(row.key);
    setDraft({
      name: row.name,
      email: row.email,
      phone: row.phone,
      company: row.company,
    });
    setError("");
    setActionOk("");
  }

  function cancelEditing() {
    setEditingKey(null);
    setError("");
  }

  function saveEditing(row: ClientRow) {
    const formData = new FormData();
    if (row.clientId) formData.set("clientId", row.clientId);
    if (row.projectId) formData.set("projectId", row.projectId);
    formData.set("name", draft.name);
    formData.set("email", draft.email);
    formData.set("phone", draft.phone);
    formData.set("company", draft.company);
    runAction(updateClientAction, formData, () => setEditingKey(null));
  }

  const allRows = useMemo(
    () => buildRows(clients, projects),
    [clients, projects],
  );

  const activeCount = useMemo(
    () => allRows.filter((row) => !row.archived).length,
    [allRows],
  );
  const archivedCount = useMemo(
    () => allRows.filter((row) => row.archived).length,
    [allRows],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = allRows.filter((row) => {
      if (listTab === "archived" ? !row.archived : row.archived) return false;
      if (!q) return true;
      return [row.name, row.email, row.phone, row.company, row.projectCode]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });

    return [...filtered].sort((a, b) => {
      let result = 0;
      switch (sortKey) {
        case "name":
          result = compareText(a.name, b.name);
          break;
        case "email":
          result = compareText(a.email, b.email);
          break;
        case "phone":
          result = compareText(a.phone || "", b.phone || "");
          break;
        case "registeredAt":
          result = Number(a.registered) - Number(b.registered);
          break;
        default:
          result = 0;
      }
      return sortDir === "asc" ? result : -result;
    });
  }, [allRows, listTab, query, sortKey, sortDir]);

  const activeColumns = COLUMNS.filter((column) => visible[column.id]);

  function toggleSort(columnId: ColumnId) {
    if (sortKey === columnId) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(columnId);
    setSortDir(columnId === "registeredAt" ? "desc" : "asc");
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

  function runAction(
    action: (formData: FormData) => Promise<{
      ok: boolean;
      error?: string;
      message?: string;
      gmailBody?: string;
      gmailUrl?: string | null;
    }>,
    formData: FormData,
    onSuccess?: () => void,
  ) {
    startTransition(async () => {
      setError("");
      setActionOk("");
      const result = await action(formData);
      if (!result.ok) {
        setError(result.error || "No se pudo completar la acción.");
        return;
      }
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
      if (result.message) setActionOk(result.message);
      router.refresh();
      onSuccess?.();
    });
  }

  async function openInviteMail(row: ClientRow) {
    setOpenActionsId(null);
    setActionsMenuPos(null);
    setError("");
    setActionOk("");
    if (!row.projectId) {
      setError("Este cliente no tiene un proyecto para invitar.");
      return;
    }
    const formData = new FormData();
    formData.set("projectId", row.projectId);
    runAction(resendProjectInviteAction, formData);
  }

  async function openSupportMail(row: ClientRow) {
    setOpenActionsId(null);
    setActionsMenuPos(null);
    const url = toSupportGmailUrl(row.email);
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function sendPasswordReset(row: ClientRow) {
    setOpenActionsId(null);
    setActionsMenuPos(null);
    const formData = new FormData();
    formData.set("email", row.email);
    runAction(requestPasswordResetAction, formData);
  }

  return (
    <>
      <div className="plat-clients-hub">
        <PlatformSectionHero
          title="Clientes"
          subtitle="Contacto, registro y acceso a la plataforma."
          tabs={
            <div className="plat-tabs" role="tablist" aria-label="Listado">
              <button
                type="button"
                role="tab"
                aria-selected={listTab === "active"}
                className={`plat-tab${listTab === "active" ? " is-active" : ""}`}
                onClick={() => {
                  setListTab("active");
                }}
              >
                Activos
                <span className="plat-tab-count is-active-count">
                  {activeCount}
                </span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={listTab === "archived"}
                className={`plat-tab${listTab === "archived" ? " is-active" : ""}`}
                onClick={() => {
                  setListTab("archived");
                }}
              >
                Archivados
                <span className="plat-tab-count is-archived-count">
                  {archivedCount}
                </span>
              </button>
            </div>
          }
        />

        <section
          className="plat-card plat-quote-panel plat-quote-list plat-clients-board"
          ref={rootRef}
        >
        <div className="plat-projects-filters">
          <div className="plat-quote-search plat-quote-list-filter">
            <Search size={15} aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre, email o teléfono…"
              autoComplete="off"
            />
          </div>
        </div>

        {error ? <p className="plat-quote-error">{error}</p> : null}
        {actionOk ? <p className="plat-quote-ok">{actionOk}</p> : null}

        <div className="plat-quote-list-scroll">
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
            {rows.map((row) => {
              const isEditing = editingKey === row.key;
              const gmailUrl = row.projectCode
                ? toProjectRegisteredGmailUrl(row.email, row.projectCode)
                : null;
              const whatsappUrl = row.phone ? toWhatsAppUrl(row.phone) : null;
              const mailPrepared = mailPreparedKey === row.key;

              return (
                <tr key={row.key} className={isEditing ? "is-editing" : undefined}>
                  {visible.registeredAt ? (
                    <td>
                      <span
                        className={`plat-badge${
                          row.registered ? " is-done" : " is-warn"
                        }`}
                      >
                        {row.registered ? "Registrado" : "Sin registrar"}
                      </span>
                    </td>
                  ) : null}
                  {visible.name ? (
                    <td>
                      {isEditing ? (
                        <div className="plat-client-name is-stack">
                          <div className="plat-cell-stack">
                            <input
                              className="plat-cell-input"
                              value={draft.name}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  name: event.target.value,
                                }))
                              }
                              aria-label="Nombre"
                              placeholder="Nombre"
                            />
                            <input
                              className="plat-cell-input is-soft"
                              value={draft.company}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  company: event.target.value,
                                }))
                              }
                              disabled={!row.clientId}
                              aria-label="Empresa"
                              placeholder={
                                row.clientId
                                  ? "Empresa"
                                  : "Empresa · al registrarse"
                              }
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="plat-client-block">
                          <div className="plat-client-name">
                            <span>{row.name}</span>
                          </div>
                          {row.company ? (
                            <div className="plat-client-company">
                              {row.company}
                            </div>
                          ) : null}
                        </div>
                      )}
                      {/* Sibling of .plat-client-block rather than a child:
                          renders identically here (both are stacked block
                          divs), but on mobile the card lays this cell out
                          with `display: contents`, and being a sibling lets
                          the project count sit on its own grid row beside
                          the actions menu instead of being trapped under
                          the name. */}
                      {!isEditing && row.projectCount > 0 ? (
                        <div className="plat-client-company plat-client-projects">
                          <Link
                            className="plat-contact-link"
                            href={`/plataforma/proyectos?codigo=${encodeURIComponent(row.email)}`}
                            title="Ver proyectos"
                          >
                            {row.projectCount} proyecto
                            {row.projectCount === 1 ? "" : "s"}
                          </Link>
                        </div>
                      ) : null}
                    </td>
                  ) : null}
                  {visible.email ? (
                    <td>
                      {isEditing ? (
                        <input
                          className="plat-cell-input"
                          type="email"
                          value={draft.email}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              email: event.target.value,
                            }))
                          }
                          aria-label="Email"
                        />
                      ) : gmailUrl ? (
                        <a
                          className="plat-contact-link"
                          href={gmailUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={
                            mailPrepared
                              ? "Mensaje copiado — pegalo con Ctrl+V arriba de tu firma"
                              : "Abrir Gmail (copia el mensaje para pegarlo)"
                          }
                          onClick={() => {
                            void copyProjectRegisteredEmailBody(
                              row.name,
                              row.projectCode,
                            )
                              .then(() => {
                                setMailPreparedKey(row.key);
                                window.setTimeout(() => {
                                  setMailPreparedKey((current) =>
                                    current === row.key ? null : current,
                                  );
                                }, 4000);
                              })
                              .catch(() => {
                                /* ignore */
                              });
                          }}
                        >
                          {row.email}
                        </a>
                      ) : (
                        row.email
                      )}
                    </td>
                  ) : null}
                  {visible.phone ? (
                    <td>
                      {isEditing ? (
                        <input
                          className="plat-cell-input"
                          value={draft.phone}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              phone: event.target.value,
                            }))
                          }
                          disabled={!row.clientId}
                          aria-label="Teléfono"
                          /* Names the field first, then explains why it's
                             disabled. The bare "Disponible al registrarse"
                             was identical to the Empresa placeholder, so
                             two adjacent fields read the same and neither
                             said which was which. */
                          placeholder={
                            row.clientId ? "" : "Teléfono · al registrarse"
                          }
                        />
                      ) : whatsappUrl ? (
                        <a
                          className="plat-contact-link is-whatsapp"
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Abrir WhatsApp"
                        >
                          {row.phone}
                        </a>
                      ) : (
                        <span className="plat-cell-empty">—</span>
                      )}
                    </td>
                  ) : null}
                  {visible.actions ? (
                    <td className="plat-quote-actions-cell">
                      {isEditing ? (
                        <div className="plat-row-actions">
                          <button
                            type="button"
                            className="plat-btn plat-icon-btn"
                            title="Guardar"
                            aria-label="Guardar cambios"
                            disabled={pending}
                            onClick={() => saveEditing(row)}
                          >
                            <Check size={14} />
                          </button>
                          <button
                            type="button"
                            className="plat-btn is-ghost plat-icon-btn"
                            title="Cancelar"
                            aria-label="Cancelar edición"
                            disabled={pending}
                            onClick={cancelEditing}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="plat-menu">
                          <button
                            type="button"
                            className={`plat-menu-trigger is-compact${
                              openActionsId === row.key ? " is-open" : ""
                            }`}
                            disabled={pending}
                            aria-expanded={openActionsId === row.key}
                            aria-haspopup="menu"
                            onClick={(event) =>
                              toggleActionsMenu(row.key, event)
                            }
                          >
                            Acciones
                            <ChevronDown size={14} />
                          </button>
                          {openActionsId === row.key && actionsMenuPos ? (
                            <div
                              className="plat-menu-panel is-right is-quote-actions"
                              role="menu"
                              style={{
                                top: actionsMenuPos.top,
                                right: actionsMenuPos.right,
                              }}
                            >
                              <button
                                type="button"
                                className="plat-menu-item"
                                disabled={pending}
                                onClick={() => startEditing(row)}
                              >
                                <Pencil size={14} />
                                Editar datos
                              </button>
                              {!row.registered && row.projectId ? (
                                <button
                                  type="button"
                                  className="plat-menu-item"
                                  disabled={pending}
                                  onClick={() => void openInviteMail(row)}
                                >
                                  <Mail size={14} />
                                  Reenviar invitación
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="plat-menu-item"
                                  disabled={pending || !row.email}
                                  onClick={() => void openSupportMail(row)}
                                >
                                  <Mail size={14} />
                                  Escribir email
                                </button>
                              )}
                              {whatsappUrl ? (
                                <a
                                  className="plat-menu-item"
                                  href={whatsappUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  role="menuitem"
                                  onClick={() => {
                                    setOpenActionsId(null);
                                    setActionsMenuPos(null);
                                  }}
                                >
                                  <MessageCircle size={14} />
                                  WhatsApp
                                </a>
                              ) : null}
                              {row.projectCount > 0 ? (
                                <Link
                                  className="plat-menu-item"
                                  href={`/plataforma/proyectos?codigo=${encodeURIComponent(row.email)}`}
                                  role="menuitem"
                                  onClick={() => {
                                    setOpenActionsId(null);
                                    setActionsMenuPos(null);
                                  }}
                                >
                                  <FolderKanban size={14} />
                                  Ver proyectos ({row.projectCount})
                                </Link>
                              ) : null}
                              {row.clientId || row.projectId ? (
                                <button
                                  type="button"
                                  className="plat-menu-item"
                                  disabled={pending}
                                  onClick={() => {
                                    setOpenActionsId(null);
                                    setActionsMenuPos(null);
                                    const formData = new FormData();
                                    if (row.clientId) {
                                      formData.set("clientId", row.clientId);
                                    }
                                    if (row.projectId) {
                                      formData.set("projectId", row.projectId);
                                    }
                                    formData.set(
                                      "blocked",
                                      row.accessBlocked ? "0" : "1",
                                    );
                                    runAction(setClientAccessAction, formData);
                                  }}
                                >
                                  {row.accessBlocked ? (
                                    <LockOpen size={14} />
                                  ) : (
                                    <Lock size={14} />
                                  )}
                                  {row.accessBlocked
                                    ? "Desbloquear acceso"
                                    : "Bloquear acceso"}
                                </button>
                              ) : null}
                              {row.clientId ? (
                                <button
                                  type="button"
                                  className="plat-menu-item"
                                  disabled={pending}
                                  onClick={() => sendPasswordReset(row)}
                                >
                                  <KeyRound size={14} />
                                  Restablecer acceso
                                </button>
                              ) : null}
                              <button
                                type="button"
                                className="plat-menu-item"
                                disabled={pending}
                                onClick={() => {
                                  setOpenActionsId(null);
                                  setActionsMenuPos(null);
                                  const formData = new FormData();
                                  if (row.clientId) {
                                    formData.set("clientId", row.clientId);
                                  }
                                  if (row.projectId) {
                                    formData.set("projectId", row.projectId);
                                  }
                                  formData.set(
                                    "archived",
                                    row.archived ? "0" : "1",
                                  );
                                  runAction(setClientArchivedAction, formData);
                                }}
                              >
                                {row.archived ? (
                                  <ArchiveRestore size={14} />
                                ) : (
                                  <Archive size={14} />
                                )}
                                {row.archived
                                  ? "Restaurar cliente"
                                  : "Archivar cliente"}
                              </button>
                              <button
                                type="button"
                                className="plat-menu-item is-danger"
                                disabled={
                                  pending || (!row.clientId && !row.projectId)
                                }
                                onClick={() => {
                                  setOpenActionsId(null);
                                  setActionsMenuPos(null);
                                  setDeleteTarget({
                                    clientId: row.clientId,
                                    projectId: row.projectId,
                                    name: row.name,
                                    registered: row.registered,
                                  });
                                }}
                              >
                                <Trash2 size={14} />
                                Eliminar
                              </button>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </td>
                  ) : null}
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={Math.max(activeColumns.length, 1)}>
                  {listTab === "archived"
                    ? "No hay clientes archivados."
                    : "No hay clientes para ese filtro."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        </div>
      </section>
      </div>

      <PlatformConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar cliente"
        description={
          deleteTarget
            ? deleteTarget.registered
              ? `Se va a eliminar el registro de ${deleteTarget.name}. Los proyectos asociados se mantienen.`
              : `Se va a eliminar el cliente pendiente ${deleteTarget.name} y sus proyectos asociados, porque todavía no se registró.`
            : ""
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        pending={pending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          const formData = new FormData();
          if (deleteTarget.clientId) {
            formData.set("clientId", deleteTarget.clientId);
          }
          if (deleteTarget.projectId) {
            formData.set("projectId", deleteTarget.projectId);
          }
          runAction(deleteClientAction, formData, () => setDeleteTarget(null));
        }}
      />
    </>
  );
}
