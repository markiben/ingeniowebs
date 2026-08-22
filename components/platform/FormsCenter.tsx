"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  CheckCheck,
  ChevronDown,
  Mail,
  Trash2,
} from "lucide-react";
import PlatformConfirmDialog from "@/components/platform/PlatformConfirmDialog";
import {
  deleteLeadAction,
  markLeadReadAction,
  markLeadUnreadAction,
} from "@/lib/platform/actions";
import { inboxPath } from "@/lib/platform/inbox";
import type { PlatformLead } from "@/lib/platform/types";

type LeadFilter = "unread" | "read" | "all";

function formatListTime(value: string, now = new Date()) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";

  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startThat = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const dayDiff = Math.round(
    (startToday.getTime() - startThat.getTime()) / 86_400_000,
  );

  if (dayDiff === 0) {
    return new Intl.DateTimeFormat("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  }
  if (dayDiff === 1) return "Ayer";
  if (dayDiff > 1 && dayDiff < 7) {
    return new Intl.DateTimeFormat("es-AR", { weekday: "long" }).format(date);
  }
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

function formatFullDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function toWhatsAppUrl(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const text =
    "Hola, me comunico de Ingenio Webs en respuesta a tu solicitud de proyecto.";
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

function toGmailUrl(email: string) {
  const value = email.trim();
  if (!value) return null;
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: value,
    su: "[ Ingenio Webs ] En respuesta a tu solicitud de proyecto",
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

function parseLeadMessage(message: string) {
  const lines = message
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const fields: { label: string; value: string }[] = [];
  const bodyLines: string[] = [];

  for (const line of lines) {
    const match = line.match(/^(Tipo de cliente|Tipo de proyecto|Presupuesto)\s*:\s*(.+)$/i);
    if (match) {
      fields.push({ label: match[1], value: match[2].trim() });
      continue;
    }
    bodyLines.push(line);
  }

  return {
    body: bodyLines.join("\n").trim() || message.trim(),
    fields,
  };
}

function leadPreview(lead: PlatformLead) {
  const { body } = parseLeadMessage(lead.message);
  const text = body.replace(/\s+/g, " ").trim();
  return text.length > 72 ? `${text.slice(0, 72)}…` : text || "Sin mensaje";
}

export default function FormsCenter({ leads }: { leads: PlatformLead[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [filter, setFilter] = useState<LeadFilter>("unread");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [menuLeadId, setMenuLeadId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!menuLeadId) return;
    function onPointerDown(event: MouseEvent) {
      if (!listRef.current?.contains(event.target as Node)) {
        setMenuLeadId(null);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuLeadId(null);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuLeadId]);

  const sorted = useMemo(
    () =>
      [...leads].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [leads],
  );

  const unreadCount = useMemo(
    () => sorted.filter((lead) => !lead.read).length,
    [sorted],
  );

  const filtered = useMemo(() => {
    if (filter === "unread") return sorted.filter((lead) => !lead.read);
    if (filter === "read") return sorted.filter((lead) => lead.read);
    return sorted;
  }, [sorted, filter]);

  useEffect(() => {
    const fromQuery = searchParams.get("id");
    if (fromQuery && leads.some((lead) => lead.id === fromQuery)) {
      setSelectedId(fromQuery);
      return;
    }
    setSelectedId((current) => {
      if (current && filtered.some((lead) => lead.id === current)) {
        return current;
      }
      return filtered[0]?.id ?? null;
    });
  }, [searchParams, leads, filtered]);

  const selected =
    filtered.find((lead) => lead.id === selectedId) ??
    sorted.find((lead) => lead.id === selectedId) ??
    null;

  const selectedParsed = selected ? parseLeadMessage(selected.message) : null;
  const gmailUrl = selected?.email ? toGmailUrl(selected.email) : null;
  const whatsappUrl = selected?.phone ? toWhatsAppUrl(selected.phone) : null;

  function setRead(id: string, read: boolean) {
    startTransition(async () => {
      if (read) await markLeadReadAction(id);
      else await markLeadUnreadAction(id);
      router.refresh();
    });
  }

  function selectLead(id: string) {
    setMenuLeadId(null);
    setSelectedId(id);
    router.replace(inboxPath("formularios", id), { scroll: false });
    const lead = leads.find((entry) => entry.id === id);
    if (lead && !lead.read) setRead(id, true);
  }

  return (
    <div className="plat-inbox plat-forms">
      <aside className="plat-inbox-list">
        <div className="plat-inbox-filters">
          <button
            type="button"
            className={`plat-chip${filter === "unread" ? " is-active" : ""}`}
            onClick={() => setFilter("unread")}
          >
            No leídos
            {unreadCount > 0 ? (
              <span className="plat-chip-count" aria-label={`${unreadCount} no leídos`}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            className={`plat-chip${filter === "read" ? " is-active" : ""}`}
            onClick={() => setFilter("read")}
          >
            Leídos
          </button>
          <button
            type="button"
            className={`plat-chip${filter === "all" ? " is-active" : ""}`}
            onClick={() => setFilter("all")}
          >
            Todos
          </button>
        </div>

        <ul ref={listRef}>
          {filtered.map((lead) => {
            const unread = !lead.read;
            const menuOpen = menuLeadId === lead.id;
            return (
              <li
                key={lead.id}
                className={`plat-chat-row${menuOpen ? " is-menu-open" : ""}${
                  selected?.id === lead.id ? " is-active" : ""
                }${unread ? " is-unread" : ""}`}
              >
                <button
                  type="button"
                  className="plat-inbox-item"
                  onClick={() => selectLead(lead.id)}
                >
                  <div className="plat-inbox-item-main">
                    <div className="plat-inbox-item-top">
                      <strong>{lead.name}</strong>
                    </div>
                    <p>{leadPreview(lead)}</p>
                  </div>
                </button>

                <div className="plat-chat-row-side">
                  <span className={`plat-chat-time${unread ? " is-unread" : ""}`}>
                    {formatListTime(lead.createdAt)}
                  </span>
                  <div className="plat-chat-menu-wrap">
                    <button
                      type="button"
                      className={`plat-chat-menu-trigger${menuOpen ? " is-open" : ""}`}
                      aria-label="Opciones del formulario"
                      aria-expanded={menuOpen}
                      aria-haspopup="menu"
                      onClick={(event) => {
                        event.stopPropagation();
                        setMenuLeadId((current) =>
                          current === lead.id ? null : lead.id,
                        );
                      }}
                    >
                      <ChevronDown size={16} />
                    </button>
                    {menuOpen ? (
                      <div className="plat-chat-menu" role="menu">
                        <button
                          type="button"
                          role="menuitem"
                          className="plat-chat-menu-item"
                          disabled={pending || lead.read}
                          onClick={(event) => {
                            event.stopPropagation();
                            setMenuLeadId(null);
                            setRead(lead.id, true);
                          }}
                        >
                          <CheckCheck size={15} />
                          Leído
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className="plat-chat-menu-item"
                          disabled={pending || !lead.read}
                          onClick={(event) => {
                            event.stopPropagation();
                            setMenuLeadId(null);
                            setRead(lead.id, false);
                          }}
                        >
                          <Mail size={15} />
                          No leído
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className="plat-chat-menu-item is-danger"
                          disabled={pending}
                          onClick={(event) => {
                            event.stopPropagation();
                            setMenuLeadId(null);
                            setDeleteTarget({
                              id: lead.id,
                              name: lead.name,
                            });
                          }}
                        >
                          <Trash2 size={15} />
                          Eliminar
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
          {filtered.length === 0 ? (
            <li className="plat-inbox-empty">
              No hay formularios en este filtro.
            </li>
          ) : null}
        </ul>
      </aside>

      <section className="plat-inbox-detail plat-forms-detail">
        {selected && selectedParsed ? (
          <>
            <header className="plat-inbox-detail-head">
              <div className="plat-inbox-detail-main">
                <div className="plat-inbox-detail-title">
                  <h2>{selected.name}</h2>
                  <span
                    className={`plat-badge${
                      selected.read ? " is-danger" : " is-done"
                    }`}
                  >
                    {selected.read ? "Leído" : "Nuevo"}
                  </span>
                </div>

                <div className="plat-inbox-contacts">
                  {gmailUrl ? (
                    <a
                      className="plat-contact-link"
                      href={gmailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Escribir por Gmail"
                    >
                      {selected.email}
                    </a>
                  ) : (
                    <span className="plat-inbox-muted">Sin email</span>
                  )}
                  {whatsappUrl ? (
                    <>
                      <span className="plat-inbox-sep" aria-hidden>
                        ·
                      </span>
                      <a
                        className="plat-contact-link is-whatsapp"
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Abrir WhatsApp"
                      >
                        {selected.phone}
                      </a>
                    </>
                  ) : null}
                  {selected.company &&
                  !selectedParsed.fields.some(
                    (field) =>
                      field.value.toLowerCase() ===
                      selected.company!.trim().toLowerCase(),
                  ) ? (
                    <>
                      <span className="plat-inbox-sep" aria-hidden>
                        ·
                      </span>
                      <span className="plat-inbox-muted">{selected.company}</span>
                    </>
                  ) : null}
                  {selectedParsed.fields.map((field) => (
                    <span key={field.label} className="plat-forms-inline-fact">
                      <span className="plat-inbox-sep" aria-hidden>
                        ·
                      </span>
                      <span className="plat-inbox-muted" title={field.label}>
                        {field.value || "—"}
                      </span>
                    </span>
                  ))}
                </div>
                <p className="plat-inbox-meta">
                  <CalendarDays size={14} aria-hidden />
                  {formatFullDate(selected.createdAt)}
                </p>
              </div>
            </header>

            <p className="plat-inbox-body">{selectedParsed.body}</p>
          </>
        ) : (
          <div className="plat-inbox-empty-detail">
            Seleccioná un formulario para ver el detalle.
          </div>
        )}
      </section>

      <PlatformConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar formulario"
        description={
          deleteTarget
            ? `Se va a eliminar el envío de ${deleteTarget.name}. Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        pending={pending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          const formData = new FormData();
          formData.set("leadId", deleteTarget.id);
          startTransition(async () => {
            const result = await deleteLeadAction(formData);
            if (!result.ok) return;
            setDeleteTarget(null);
            setSelectedId(null);
            router.replace(inboxPath("formularios"), { scroll: false });
            router.refresh();
          });
        }}
      />
    </div>
  );
}
