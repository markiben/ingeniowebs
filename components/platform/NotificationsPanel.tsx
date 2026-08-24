"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  Archive,
  ArchiveRestore,
  Bell,
  CheckCheck,
  FileText,
  Inbox,
  MessageCircle,
  MessageSquare,
  Users,
  X,
} from "lucide-react";
import { inboxPath } from "@/lib/platform/inbox";
import { setNotificationStatusAction } from "@/lib/platform/actions";
import type {
  PlatformNotification,
  PlatformNotificationBucket,
  PlatformNotificationKind,
} from "@/lib/platform/notifications";

const MENU_ID = "notifications";

type ScopeTab = "inbox" | "system";
type FilterPill = "all" | "unread" | "archived";

const KIND_ICON: Record<
  PlatformNotificationKind,
  typeof Bell
> = {
  form: FileText,
  message: MessageSquare,
  livechat: MessageCircle,
  client: Users,
};

const INBOX_KINDS = new Set<PlatformNotificationKind>([
  "form",
  "message",
  "livechat",
]);

function formatRelative(value: string) {
  const then = new Date(value).getTime();
  if (!Number.isFinite(then)) return value;
  const diffSec = Math.round((Date.now() - then) / 1000);
  const rtf = new Intl.RelativeTimeFormat("es-AR", { numeric: "auto" });
  if (Math.abs(diffSec) < 60) return rtf.format(-diffSec, "second");
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(-diffMin, "minute");
  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 24) return rtf.format(-diffHour, "hour");
  const diffDay = Math.round(diffHour / 24);
  if (Math.abs(diffDay) < 30) return rtf.format(-diffDay, "day");
  const diffMonth = Math.round(diffDay / 30);
  return rtf.format(-diffMonth, "month");
}

function actionLabel(kind: PlatformNotificationKind) {
  if (kind === "form") return "Ver formulario";
  if (kind === "message") return "Ver mensaje";
  if (kind === "livechat") return "Abrir chat";
  if (kind === "client") return "Ver cliente";
  return "Ver detalle";
}

export default function NotificationsPanel({
  notifications,
}: {
  notifications: PlatformNotification[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<ScopeTab>("inbox");
  const [filter, setFilter] = useState<FilterPill>("all");
  const [pending, startTransition] = useTransition();
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const scoped = useMemo(
    () =>
      notifications.filter((item) =>
        scope === "inbox"
          ? INBOX_KINDS.has(item.kind)
          : !INBOX_KINDS.has(item.kind),
      ),
    [notifications, scope],
  );

  const counts = useMemo(() => {
    const inbox = notifications.filter((item) => INBOX_KINDS.has(item.kind));
    const system = notifications.filter((item) => !INBOX_KINDS.has(item.kind));
    const pool = scope === "inbox" ? inbox : system;
    return {
      inboxNew: inbox.filter((item) => item.status === "new").length,
      systemNew: system.filter((item) => item.status === "new").length,
      all: pool.filter((item) => item.status !== "archived").length,
      unread: pool.filter((item) => item.status === "new").length,
      archived: pool.filter((item) => item.status === "archived").length,
      badge:
        notifications.filter((item) => item.status === "new").length,
    };
  }, [notifications, scope]);

  const visible = useMemo(() => {
    return scoped
      .filter((item) => {
        if (filter === "unread") return item.status === "new";
        if (filter === "archived") return item.status === "archived";
        return item.status !== "archived";
      })
      .slice(0, 14);
  }, [scoped, filter]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!open) return;
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    function onOpenOther(event: Event) {
      const id = (event as CustomEvent<string>).detail;
      if (id === MENU_ID) return;
      setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("plat-header-menu-open", onOpenOther);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("plat-header-menu-open", onOpenOther);
    };
  }, [open]);

  function toggle() {
    if (!open) {
      window.dispatchEvent(
        new CustomEvent("plat-header-menu-open", { detail: MENU_ID }),
      );
    }
    setOpen((value) => !value);
  }

  function setStatus(id: string, status: PlatformNotificationBucket) {
    const formData = new FormData();
    formData.set("id", id);
    formData.set("status", status);
    startTransition(async () => {
      await setNotificationStatusAction(formData);
      router.refresh();
    });
  }

  function markAllRead() {
    const targets = scoped.filter((item) => item.status === "new");
    if (targets.length === 0) return;
    startTransition(async () => {
      for (const item of targets) {
        const formData = new FormData();
        formData.set("id", item.id);
        formData.set("status", "read");
        await setNotificationStatusAction(formData);
      }
      router.refresh();
    });
  }

  return (
    <div className="plat-messages-quick" ref={wrapRef}>
      <button
        type="button"
        className="plat-icon-chip"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Centro de notificaciones"
        onClick={toggle}
      >
        <Bell size={18} strokeWidth={1.75} />
        {counts.badge > 0 ? (
          <span className="plat-badge-dot">
            {counts.badge > 9 ? "9+" : counts.badge}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="plat-notify-backdrop"
            aria-label="Cerrar notificaciones"
            onClick={() => setOpen(false)}
          />
          <div
            className="plat-messages-panel plat-notify-center"
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label="Notificaciones"
          >
          <div className="plat-notify-center-top">
            <h2>Notificaciones</h2>
            <div className="plat-notify-center-tools">
              <button
                type="button"
                className="plat-notify-center-link"
                disabled={pending || counts.unread === 0}
                onClick={markAllRead}
              >
                Marcar todo como leído
              </button>
              <button
                type="button"
                className="plat-notify-center-icon"
                aria-label="Cerrar"
                onClick={() => setOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="plat-notify-center-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={scope === "inbox"}
              className={scope === "inbox" ? "is-active" : undefined}
              onClick={() => setScope("inbox")}
            >
              Inbox
              {counts.inboxNew > 0 ? <span>{counts.inboxNew}</span> : null}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={scope === "system"}
              className={scope === "system" ? "is-active" : undefined}
              onClick={() => setScope("system")}
            >
              Sistema
              {counts.systemNew > 0 ? <span>{counts.systemNew}</span> : null}
            </button>
          </div>

          <div className="plat-notify-center-filters">
            {(
              [
                ["all", "Todas", counts.all],
                ["unread", "Sin leer", counts.unread],
                ["archived", "Archivadas", counts.archived],
              ] as const
            ).map(([id, label, count]) => (
              <button
                key={id}
                type="button"
                className={`plat-notify-pill${filter === id ? " is-active" : ""}`}
                onClick={() => setFilter(id)}
              >
                {label}
                <em>{count}</em>
              </button>
            ))}
          </div>

          <ul className="plat-notify-center-list">
            {visible.map((item) => {
              const Icon = KIND_ICON[item.kind] ?? Bell;
              return (
                <li
                  key={item.id}
                  className={`plat-notify-card${item.status === "new" ? " is-unread" : ""}`}
                >
                  <span className={`plat-notify-card-icon is-${item.kind}`}>
                    <Icon size={16} />
                  </span>
                  <div className="plat-notify-card-body">
                    <p className="plat-notify-card-title">
                      <strong>{item.title}</strong>
                      <span>{item.preview}</span>
                    </p>
                    <div className="plat-notify-card-row">
                      <Link
                        href={item.href}
                        className="plat-notify-card-cta"
                        onClick={() => {
                          if (item.status === "new") setStatus(item.id, "read");
                          setOpen(false);
                        }}
                      >
                        {actionLabel(item.kind)}
                      </Link>
                      <div className="plat-notify-card-actions">
                        {item.status === "new" ? (
                          <button
                            type="button"
                            title="Marcar como leída"
                            disabled={pending}
                            onClick={() => setStatus(item.id, "read")}
                          >
                            <CheckCheck size={14} />
                          </button>
                        ) : null}
                        {item.status !== "archived" ? (
                          <button
                            type="button"
                            title="Archivar"
                            disabled={pending}
                            onClick={() => setStatus(item.id, "archived")}
                          >
                            <Archive size={14} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            title="Restaurar"
                            disabled={pending}
                            onClick={() => setStatus(item.id, "read")}
                          >
                            <ArchiveRestore size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    <time dateTime={item.createdAt}>
                      {item.meta} · {formatRelative(item.createdAt)}
                    </time>
                  </div>
                </li>
              );
            })}
            {visible.length === 0 ? (
              <li className="plat-notify-center-empty">
                <span className="plat-messages-panel-empty-icon" aria-hidden>
                  {filter === "archived" ? (
                    <Archive size={18} />
                  ) : (
                    <Inbox size={18} />
                  )}
                </span>
                {filter === "unread"
                  ? "No hay notificaciones sin leer."
                  : filter === "archived"
                    ? "No hay notificaciones archivadas."
                    : "No hay notificaciones por ahora."}
              </li>
            ) : null}
          </ul>

          <div className="plat-notify-center-footer">
            <Link href={inboxPath("chat")} onClick={() => setOpen(false)}>
              Webchat
            </Link>
            <Link href={inboxPath("mensajes")} onClick={() => setOpen(false)}>
              Mensajes
            </Link>
            <Link
              href={inboxPath("formularios")}
              onClick={() => setOpen(false)}
            >
              Formularios
            </Link>
          </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
