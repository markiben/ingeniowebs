"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, CheckCheck, ChevronDown, Mail, Trash2 } from "lucide-react";
import PlatformConfirmDialog from "@/components/platform/PlatformConfirmDialog";
import InboxMobileBack from "@/components/platform/InboxMobileBack";
import useIsMobile from "@/components/platform/useIsMobile";
import {
  deleteMessageAction,
  markMessageReadAction,
  markMessageUnreadAction,
} from "@/lib/platform/actions";
import { inboxPath } from "@/lib/platform/inbox";
import type { PlatformMessage } from "@/lib/platform/types";

type MessageFilter = "unread" | "read" | "all";

function preview(body: string) {
  const text = body.trim().replace(/\s+/g, " ");
  return text.length > 90 ? `${text.slice(0, 90)}…` : text;
}

/** Fecha estilo WhatsApp: hora / Ayer / día / d/m/aaaa */
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
    "Hola, me comunico de Ingenio Webs en respuesta a tu mensaje.";
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

function toGmailUrl(email: string) {
  const value = email.trim();
  if (!value) return null;
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: value,
    su: "[ Ingenio Webs ] En respuesta a tu mensaje",
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

export default function MessageCenter({
  messages,
}: {
  messages: PlatformMessage[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState<MessageFilter>("unread");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [menuMessageId, setMenuMessageId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!menuMessageId) return;
    function onPointerDown(event: MouseEvent) {
      if (!listRef.current?.contains(event.target as Node)) {
        setMenuMessageId(null);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuMessageId(null);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuMessageId]);

  const sorted = useMemo(
    () =>
      [...messages].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [messages],
  );

  const filtered = useMemo(() => {
    if (filter === "unread") return sorted.filter((message) => !message.read);
    if (filter === "read") return sorted.filter((message) => message.read);
    return sorted;
  }, [sorted, filter]);

  const unreadCount = useMemo(
    () => sorted.filter((message) => !message.read).length,
    [sorted],
  );

  useEffect(() => {
    const fromQuery = searchParams.get("id");
    if (fromQuery && messages.some((message) => message.id === fromQuery)) {
      setSelectedId(fromQuery);
      return;
    }
    // See LiveChatCenter: this has to win over "keep the current selection"
    // — isMobile starts false until the media-query effect resolves, so an
    // earlier run of this same effect may have already auto-picked one
    // before we knew we were on mobile.
    if (isMobile) {
      setSelectedId(null);
      return;
    }
    setSelectedId((current) => {
      if (current && filtered.some((message) => message.id === current)) {
        return current;
      }
      return filtered[0]?.id ?? null;
    });
  }, [searchParams, messages, filtered, isMobile]);

  const selected =
    filtered.find((message) => message.id === selectedId) ??
    sorted.find((message) => message.id === selectedId) ??
    null;

  const gmailUrl = selected?.email ? toGmailUrl(selected.email) : null;
  const whatsappUrl = selected?.phone ? toWhatsAppUrl(selected.phone) : null;

  function setRead(id: string, read: boolean) {
    startTransition(async () => {
      if (read) await markMessageReadAction(id);
      else await markMessageUnreadAction(id);
      router.refresh();
    });
  }

  return (
    <div className={`plat-inbox${selected ? " has-mobile-selection" : ""}`}>
      <aside className="plat-inbox-list">
        <div className="plat-inbox-filters">
          <button
            type="button"
            className={`plat-chip${filter === "unread" ? " is-active" : ""}`}
            onClick={() => setFilter("unread")}
          >
            No leídos
            {unreadCount > 0 ? (
              <span
                className="plat-chip-count"
                aria-label={`${unreadCount} no leídos`}
              >
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
          {filtered.map((message) => {
            const unread = !message.read;
            const menuOpen = menuMessageId === message.id;
            return (
              <li
                key={message.id}
                className={`plat-chat-row${menuOpen ? " is-menu-open" : ""}${
                  selected?.id === message.id ? " is-active" : ""
                }${unread ? " is-unread" : ""}`}
              >
                <button
                  type="button"
                  className="plat-inbox-item"
                  onClick={() => {
                    setMenuMessageId(null);
                    setSelectedId(message.id);
                    router.replace(inboxPath("mensajes", message.id), {
                      scroll: false,
                    });
                  }}
                >
                  <div className="plat-inbox-item-main">
                    <div className="plat-inbox-item-top">
                      <strong>{message.name}</strong>
                    </div>
                    <p>{preview(message.body)}</p>
                  </div>
                </button>

                <div className="plat-chat-row-side">
                  <span
                    className={`plat-chat-time${unread ? " is-unread" : ""}`}
                  >
                    {formatListTime(message.createdAt)}
                  </span>
                  <div className="plat-chat-menu-wrap">
                    <button
                      type="button"
                      className={`plat-chat-menu-trigger${menuOpen ? " is-open" : ""}`}
                      aria-label="Opciones del mensaje"
                      aria-expanded={menuOpen}
                      aria-haspopup="menu"
                      onClick={(event) => {
                        event.stopPropagation();
                        setMenuMessageId((current) =>
                          current === message.id ? null : message.id,
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
                          disabled={pending || message.read}
                          onClick={(event) => {
                            event.stopPropagation();
                            setMenuMessageId(null);
                            setRead(message.id, true);
                          }}
                        >
                          <CheckCheck size={15} />
                          Leído
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className="plat-chat-menu-item"
                          disabled={pending || !message.read}
                          onClick={(event) => {
                            event.stopPropagation();
                            setMenuMessageId(null);
                            setRead(message.id, false);
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
                            setMenuMessageId(null);
                            setDeleteTarget({
                              id: message.id,
                              name: message.name,
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
            <li className="plat-inbox-empty">No hay mensajes en este filtro.</li>
          ) : null}
        </ul>
      </aside>

      <section className="plat-inbox-detail">
        {selected ? (
          <>
            <header className="plat-inbox-detail-head">
              <InboxMobileBack
                onClick={() => {
                  setSelectedId(null);
                  router.replace(inboxPath("mensajes"), { scroll: false });
                }}
              />
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
                      <span className="plat-inbox-sep" aria-hidden="true">
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
                </div>
                <p className="plat-inbox-meta">
                  <CalendarDays size={14} aria-hidden />
                  {formatFullDate(selected.createdAt)}
                </p>
              </div>
            </header>

            <p className="plat-inbox-body">{selected.body}</p>
          </>
        ) : (
          <div className="plat-inbox-empty-detail">
            Seleccioná un mensaje para ver el detalle.
          </div>
        )}
      </section>

      <PlatformConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar mensaje"
        description={
          deleteTarget
            ? `Se va a eliminar el mensaje de ${deleteTarget.name}. Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        pending={pending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          const formData = new FormData();
          formData.set("messageId", deleteTarget.id);
          startTransition(async () => {
            const result = await deleteMessageAction(formData);
            if (!result.ok) return;
            setDeleteTarget(null);
            setSelectedId(null);
            router.replace(inboxPath("mensajes"), { scroll: false });
            router.refresh();
          });
        }}
      />
    </div>
  );
}
