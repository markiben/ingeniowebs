"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bot,
  Check,
  ChevronDown,
  ClipboardList,
  Copy,
  Lock,
  LockOpen,
  Trash2,
  X,
} from "lucide-react";
import ChatComposer from "@/components/chat/ChatComposer";
import ChatMessageBody from "@/components/chat/ChatMessageBody";
import PlatformConfirmDialog from "@/components/platform/PlatformConfirmDialog";
import InboxMobileBack from "@/components/platform/InboxMobileBack";
import useIsMobile from "@/components/platform/useIsMobile";
import {
  closeLiveChatAction,
  deleteLiveChatAction,
  heartbeatAdminLiveChatAction,
  markLiveChatReadAction,
  reopenLiveChatAction,
  sendAdminLiveChatReplyAction,
  setAdminTypingAction,
  setLiveChatBotModeAction,
} from "@/lib/platform/live-chat";
import {
  isLiveChatOnline,
  isLiveChatTyping,
  LIVE_CHAT_AGENT_NAME,
  isLiveChatUnreadForAdmin,
  liveChatPreview,
  liveChatUnreadCountForAdmin,
} from "@/lib/platform/live-chat-utils";
import { inboxPath } from "@/lib/platform/inbox";
import type { LiveChatMessage, LiveChatSession } from "@/lib/platform/types";

const MR_INGENIO_AVATAR = "/chat/mr-ingenio.png";
const OPERATOR_FALLBACK_AVATAR = "/marco-bretschneider.png";

type ChatFilter = "open" | "closed" | "all";

type OperatorProfile = {
  name: string;
  avatarUrl?: string | null;
};

function isQuoteSystemMessage(message: LiveChatMessage) {
  return (
    message.role === "system" &&
    (message.body.startsWith("📋 COPIAR PARA COTIZADOR") ||
      message.body.startsWith("Resumen para cotización"))
  );
}

function cleanQuoteSummary(body: string) {
  return body
    .replace(/^📋 COPIAR PARA COTIZADOR\n?/i, "")
    .replace(/^Resumen para cotización:\n?/i, "")
    .trim();
}

function quoteSummaryForSession(session: LiveChatSession) {
  if (session.botQuoteSummary?.trim()) return session.botQuoteSummary.trim();
  const latest = [...session.messages].reverse().find(isQuoteSystemMessage);
  return latest ? cleanQuoteSummary(latest.body) : null;
}

function resolveAdminSender(
  message: LiveChatMessage,
  operator: OperatorProfile,
) {
  const isHuman =
    message.senderKind === "human" ||
    (Boolean(message.senderName) &&
      message.senderName !== LIVE_CHAT_AGENT_NAME);

  if (isHuman) {
    return {
      kind: "human" as const,
      name: message.senderName || operator.name,
      avatar:
        message.senderAvatarUrl ||
        operator.avatarUrl ||
        OPERATOR_FALLBACK_AVATAR,
    };
  }

  return {
    kind: "bot" as const,
    name: LIVE_CHAT_AGENT_NAME,
    avatar: MR_INGENIO_AVATAR,
  };
}

/** Fecha estilo WhatsApp: hora / Ayer / día / d/m/aaaa */
function formatChatListTime(value: string, now = new Date()) {
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

function formatTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function toWhatsAppUrl(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

function toGmailUrl(email: string) {
  const value = email.trim();
  if (!value) return null;
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(value)}`;
}

export default function LiveChatCenter({
  chats,
  botMode = false,
  operator,
}: {
  chats: LiveChatSession[];
  botMode?: boolean;
  operator: OperatorProfile;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState<ChatFilter>("open");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [botEnabled, setBotEnabled] = useState(botMode);
  const [quotePopupOpen, setQuotePopupOpen] = useState(false);
  const [quoteCopied, setQuoteCopied] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [menuChatId, setMenuChatId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [threadEl, setThreadEl] = useState<HTMLDivElement | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const typingTimerRef = useRef<number | null>(null);
  const lastTypingSentRef = useRef(0);
  const listRef = useRef<HTMLUListElement>(null);
  const nearBottomRef = useRef(true);
  const lastSelectedIdRef = useRef<string | null>(null);
  const lastMessageCountRef = useRef(0);
  const lastThreadElRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setBotEnabled(botMode);
  }, [botMode]);

  useEffect(() => {
    if (!menuChatId) return;
    function onPointerDown(event: MouseEvent) {
      if (!listRef.current?.contains(event.target as Node)) {
        setMenuChatId(null);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuChatId(null);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuChatId]);

  const sorted = useMemo(
    () =>
      [...chats].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [chats],
  );

  const filtered = useMemo(() => {
    if (filter === "open") return sorted.filter((chat) => chat.status === "open");
    if (filter === "closed") {
      return sorted.filter((chat) => chat.status === "closed");
    }
    return sorted;
  }, [sorted, filter]);

  useEffect(() => {
    const fromQuery = searchParams.get("id");
    if (fromQuery && chats.some((chat) => chat.id === fromQuery)) {
      setSelectedId(fromQuery);
      return;
    }
    // Mobile is a list/detail view: no selection means "show the list", so
    // auto-picking a chat here would undo the back button (and skip the
    // list on first load). This has to win over "keep the current
    // selection" too — `isMobile` starts false until the media-query
    // effect resolves, so an earlier run of this same effect may have
    // already auto-picked one before we knew we were on mobile. Desktop
    // shows both panes at once, so it still auto-picks one for the detail
    // pane and is allowed to keep the current selection across refreshes.
    if (isMobile) {
      setSelectedId(null);
      return;
    }
    setSelectedId((current) => {
      if (current && filtered.some((chat) => chat.id === current)) {
        return current;
      }
      return filtered[0]?.id ?? null;
    });
  }, [searchParams, chats, filtered, isMobile]);

  const selected =
    filtered.find((chat) => chat.id === selectedId) ??
    sorted.find((chat) => chat.id === selectedId) ??
    null;

  // Track how close to the bottom the reader is, so a poll refresh (chats
  // resync every few seconds) doesn't yank them back to "now" while they're
  // scrolled up reading older messages.
  useEffect(() => {
    if (!threadEl) return;
    function syncNearBottom() {
      if (!threadEl) return;
      const distance =
        threadEl.scrollHeight - threadEl.scrollTop - threadEl.clientHeight;
      const nearBottom = distance < 120;
      nearBottomRef.current = nearBottom;
      setShowJumpToLatest(!nearBottom);
    }
    syncNearBottom();
    threadEl.addEventListener("scroll", syncNearBottom, { passive: true });
    return () => threadEl.removeEventListener("scroll", syncNearBottom);
  }, [threadEl, selected?.id]);

  useEffect(() => {
    if (!threadEl || !selected) return;
    // A fresh DOM node (re-opening the pane on mobile unmounts/remounts it)
    // always starts scrolled to the top, regardless of whether it's
    // logically "the same chat" as last time — treat that as a change too.
    const chatChanged =
      lastSelectedIdRef.current !== selected.id ||
      lastThreadElRef.current !== threadEl;
    const messageCount = selected.messages.length;
    const hasNewMessage = !chatChanged && messageCount > lastMessageCountRef.current;
    lastSelectedIdRef.current = selected.id;
    lastMessageCountRef.current = messageCount;
    lastThreadElRef.current = threadEl;

    // Opening a chat always jumps to its latest message. Once open, only
    // auto-follow new messages if the reader was already at the bottom —
    // otherwise leave their scroll position alone (see effect above) and
    // let the "jump to latest" button handle it.
    if (chatChanged || (hasNewMessage && nearBottomRef.current)) {
      threadEl.scrollTop = threadEl.scrollHeight;
      nearBottomRef.current = true;
      setShowJumpToLatest(false);
    }
  }, [selected?.messages, threadEl, selected?.id, selected?.visitorTypingAt]);

  const scrollToLatest = () => {
    if (!threadEl) return;
    threadEl.scrollTo({ top: threadEl.scrollHeight, behavior: "smooth" });
  };

  const selectedUnread = selected
    ? isLiveChatUnreadForAdmin(selected)
    : false;

  useEffect(() => {
    if (!selected || !selectedUnread) return;
    const formData = new FormData();
    formData.set("sessionId", selected.id);
    startTransition(async () => {
      await markLiveChatReadAction(formData);
      router.refresh();
    });
  }, [selected?.id, selectedUnread, router, selected]);

  useEffect(() => {
    if (!selected || selected.status !== "open") return;
    const formData = new FormData();
    formData.set("sessionId", selected.id);

    async function beat() {
      await heartbeatAdminLiveChatAction(formData);
    }

    void beat();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void beat();
    }, 8000);
    return () => window.clearInterval(id);
  }, [selected?.id, selected?.status, router]);

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const visitorTyping = selected
    ? isLiveChatTyping(selected.visitorTypingAt, nowTick)
    : false;
  const selectedOnline = Boolean(
    selected &&
      selected.status === "open" &&
      isLiveChatOnline(selected.visitorLastSeenAt, nowTick),
  );
  const selectedQuoteSummary = selected
    ? quoteSummaryForSession(selected)
    : null;

  useEffect(() => {
    setQuotePopupOpen(false);
    setQuoteCopied(false);
  }, [selected?.id]);
  const openCount = chats.filter((chat) => chat.status === "open").length;

  const gmailUrl = selected ? toGmailUrl(selected.email) : null;
  const whatsappUrl = selected?.phone ? toWhatsAppUrl(selected.phone) : null;

  function runForm(
    action: (formData: FormData) => Promise<{ ok: boolean }>,
    formData: FormData,
    onSuccess?: () => void,
  ) {
    startTransition(async () => {
      const result = await action(formData);
      if (!result.ok) return;
      onSuccess?.();
      router.refresh();
    });
  }

  function signalAdminTyping(typing: boolean) {
    if (!selected || selected.status !== "open") return;
    const formData = new FormData();
    formData.set("sessionId", selected.id);
    formData.set("typing", typing ? "1" : "0");
    void setAdminTypingAction(formData);
  }

  function onAdminDraftChange(value: string) {
    setDraft(value);
    if (!selected || selected.status !== "open") return;

    const now = Date.now();
    if (value.trim() && now - lastTypingSentRef.current > 1200) {
      lastTypingSentRef.current = now;
      signalAdminTyping(true);
    }

    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => {
      signalAdminTyping(false);
    }, 1400);
  }

  return (
    <div className={`plat-inbox plat-live-chat${selected ? " has-mobile-selection" : ""}`}>
      <aside className="plat-inbox-list">
        <div className="plat-inbox-filters">
          <button
            type="button"
            className={`plat-chip plat-chip-open${filter === "open" ? " is-active" : ""}`}
            onClick={() => setFilter("open")}
          >
            Abiertos
            {openCount > 0 ? (
              <span
                className="plat-chip-count"
                aria-label={`${openCount} abiertos`}
              >
                {openCount > 99 ? "99+" : openCount}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            className={`plat-chip plat-chip-closed${filter === "closed" ? " is-active" : ""}`}
            onClick={() => setFilter("closed")}
          >
            Cerrados
          </button>
          <button
            type="button"
            className={`plat-chip${filter === "all" ? " is-active" : ""}`}
            onClick={() => setFilter("all")}
          >
            Todos
          </button>
          <button
            type="button"
            className={`plat-chip plat-bot-mode-chip${botEnabled ? " is-active" : ""}`}
            aria-pressed={botEnabled}
            title={
              botEnabled
                ? "Modo bot activo: responde aunque estés online"
                : "Activar modo bot (responde aunque estés online)"
            }
            disabled={pending}
            onClick={() => {
              const next = !botEnabled;
              setBotEnabled(next);
              startTransition(async () => {
                const result = await setLiveChatBotModeAction(next);
                if (!result.ok) {
                  setBotEnabled(!next);
                  return;
                }
                router.refresh();
              });
            }}
          >
            <Bot size={14} aria-hidden />
            Modo bot
          </button>
        </div>

        <ul ref={listRef}>
          {filtered.map((chat) => {
            const unreadCount = liveChatUnreadCountForAdmin(chat);
            const unread = unreadCount > 0;
            const menuOpen = menuChatId === chat.id;
            return (
              <li
                key={chat.id}
                className={`plat-chat-row${menuOpen ? " is-menu-open" : ""}${
                  selected?.id === chat.id ? " is-active" : ""
                }${chat.status === "open" ? " is-open" : ""}${
                  unread ? " is-unread" : ""
                }`}
              >
                <button
                  type="button"
                  className="plat-inbox-item"
                  onClick={() => {
                    setMenuChatId(null);
                    setSelectedId(chat.id);
                    setDraft("");
                    router.replace(inboxPath("chat", chat.id), {
                      scroll: false,
                    });
                  }}
                >
                  <div className="plat-inbox-item-main">
                    <div className="plat-inbox-item-top">
                      <strong>{chat.name}</strong>
                    </div>
                    <p>{liveChatPreview(chat)}</p>
                  </div>
                </button>

                <div className="plat-chat-row-side">
                  <span
                    className={`plat-chat-time${unread ? " is-unread" : ""}`}
                  >
                    {formatChatListTime(chat.updatedAt, new Date(nowTick))}
                  </span>
                  <div className="plat-chat-row-meta">
                    {unread ? (
                      <span
                        className="plat-chat-unread"
                        aria-label={`${unreadCount} mensajes sin leer`}
                      >
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    ) : (
                      <span className="plat-chat-unread-spacer" aria-hidden />
                    )}
                    <div className="plat-chat-menu-wrap">
                      <button
                        type="button"
                        className={`plat-chat-menu-trigger${menuOpen ? " is-open" : ""}`}
                        aria-label="Opciones del chat"
                        aria-expanded={menuOpen}
                        aria-haspopup="menu"
                        onClick={(event) => {
                          event.stopPropagation();
                          setMenuChatId((current) =>
                            current === chat.id ? null : chat.id,
                          );
                        }}
                      >
                        <ChevronDown size={16} />
                      </button>
                      {menuOpen ? (
                        <div className="plat-chat-menu" role="menu">
                          {chat.status === "open" ? (
                            <button
                              type="button"
                              role="menuitem"
                              className="plat-chat-menu-item"
                              disabled={pending}
                              onClick={(event) => {
                                event.stopPropagation();
                                setMenuChatId(null);
                                const formData = new FormData();
                                formData.set("sessionId", chat.id);
                                runForm(closeLiveChatAction, formData);
                              }}
                            >
                              <Lock size={15} />
                              Cerrar
                            </button>
                          ) : (
                            <button
                              type="button"
                              role="menuitem"
                              className="plat-chat-menu-item"
                              disabled={pending}
                              onClick={(event) => {
                                event.stopPropagation();
                                setMenuChatId(null);
                                const formData = new FormData();
                                formData.set("sessionId", chat.id);
                                runForm(reopenLiveChatAction, formData);
                              }}
                            >
                              <LockOpen size={15} />
                              Reabrir
                            </button>
                          )}
                          <button
                            type="button"
                            role="menuitem"
                            className="plat-chat-menu-item is-danger"
                            disabled={pending}
                            onClick={(event) => {
                              event.stopPropagation();
                              setMenuChatId(null);
                              setDeleteTarget({
                                id: chat.id,
                                name: chat.name,
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
                </div>
              </li>
            );
          })}
          {filtered.length === 0 ? (
            <li className="plat-inbox-empty">No hay chats en este filtro.</li>
          ) : null}
        </ul>
      </aside>

      <section className="plat-inbox-detail plat-live-detail">
        {selected ? (
          <>
            <header className="plat-inbox-detail-head">
              <InboxMobileBack
                onClick={() => {
                  setSelectedId(null);
                  router.replace(inboxPath("chat"), { scroll: false });
                }}
              />
              <div className="plat-inbox-detail-main">
                <div className="plat-inbox-detail-title">
                  <h2>
                    {selected.name}
                    {selectedOnline ? (
                      <span
                        className="plat-presence-dot is-online"
                        title="En línea"
                        aria-label="En línea"
                      />
                    ) : null}
                  </h2>
                  <span
                    className={`plat-badge${
                      selected.status === "open" ? " is-done" : " is-danger"
                    }`}
                  >
                    {selected.status === "open" ? "Abierto" : "Cerrado"}
                  </span>
                  {botEnabled ? (
                    <span
                      className="plat-badge is-warn"
                      title="Mr. Ingenio responde automáticamente"
                    >
                      Bot ON
                    </span>
                  ) : null}
                  {isLiveChatUnreadForAdmin(selected) ? (
                    <span className="plat-badge is-done">Nuevo</span>
                  ) : null}
                  {selectedQuoteSummary ? (
                    <button
                      type="button"
                      className={`plat-quote-summary-chip${
                        quotePopupOpen ? " is-open" : ""
                      }`}
                      onClick={() => setQuotePopupOpen((open) => !open)}
                      aria-expanded={quotePopupOpen}
                      title="Ver resumen para cotizador"
                    >
                      <ClipboardList size={14} strokeWidth={2} />
                      <span className="plat-quote-summary-chip-full">
                        Resumen cotizador
                      </span>
                      <span className="plat-quote-summary-chip-short">
                        Resumen
                      </span>
                    </button>
                  ) : null}
                </div>
                <div className="plat-inbox-contacts">
                  {gmailUrl ? (
                    <a
                      className="plat-contact-link"
                      href={gmailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {selected.email}
                    </a>
                  ) : (
                    <span className="plat-inbox-muted">{selected.email}</span>
                  )}
                  {whatsappUrl ? (
                    <>
                      <span className="plat-inbox-sep">·</span>
                      <a
                        className="plat-contact-link is-whatsapp"
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {selected.phone}
                      </a>
                    </>
                  ) : null}
                </div>
              </div>
              {quotePopupOpen && selectedQuoteSummary ? (
                <div
                  className="plat-quote-summary-pop"
                  role="dialog"
                  aria-label="Resumen para cotizador"
                >
                  <div className="plat-quote-summary-pop-top">
                    <strong>📋 Copiar para cotizador</strong>
                    <div className="plat-quote-summary-pop-actions">
                      <button
                        type="button"
                        className={`plat-quote-copy-icon${
                          quoteCopied ? " is-copied" : ""
                        }`}
                        aria-label={quoteCopied ? "Copiado" : "Copiar"}
                        title={quoteCopied ? "Copiado" : "Copiar"}
                        onClick={() => {
                          void navigator.clipboard
                            .writeText(selectedQuoteSummary)
                            .then(() => {
                              setQuoteCopied(true);
                              window.setTimeout(
                                () => setQuoteCopied(false),
                                1800,
                              );
                            });
                        }}
                      >
                        {quoteCopied ? (
                          <Check size={14} strokeWidth={2.5} />
                        ) : (
                          <Copy size={14} strokeWidth={2} />
                        )}
                      </button>
                      <button
                        type="button"
                        className="plat-quote-summary-close"
                        aria-label="Cerrar"
                        onClick={() => setQuotePopupOpen(false)}
                      >
                        <X size={14} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                  <pre className="plat-quote-summary-pop-body">
                    {selectedQuoteSummary}
                  </pre>
                </div>
              ) : null}
            </header>

            <div className="plat-live-thread-wrap">
            <div className="plat-live-thread" ref={setThreadEl}>
              {selected.messages.map((message) => {
                if (isQuoteSystemMessage(message)) return null;

                if (message.role === "system") {
                  return (
                    <div key={message.id} className="plat-live-row is-system">
                      <div className="plat-live-bubble is-system">
                        <span>Sistema</span>
                        <ChatMessageBody message={message} />
                        <small>{formatTime(message.createdAt)}</small>
                      </div>
                    </div>
                  );
                }

                if (message.role === "visitor") {
                  return (
                    <div
                      key={message.id}
                      className="plat-live-row is-visitor"
                    >
                      <span
                        className="plat-live-avatar is-visitor"
                        aria-hidden
                      >
                        {selected.name.trim().charAt(0).toUpperCase() || "?"}
                      </span>
                      <div className="plat-live-col">
                        <span className="plat-live-name">{selected.name}</span>
                        <div className="plat-live-bubble is-visitor">
                          <ChatMessageBody message={message} />
                          <small>{formatTime(message.createdAt)}</small>
                        </div>
                      </div>
                    </div>
                  );
                }

                const sender = resolveAdminSender(message, operator);
                return (
                  <div key={message.id} className="plat-live-row is-admin">
                    <div className="plat-live-col">
                      <span className="plat-live-name">{sender.name}</span>
                      <div className="plat-live-bubble is-admin">
                        <ChatMessageBody message={message} />
                        <small>{formatTime(message.createdAt)}</small>
                      </div>
                    </div>
                    <span className="plat-live-avatar is-agent">
                      {/* eslint-disable-next-line @next/next/no-img-element -- avatar URLs may include ?v= cache bust */}
                      <img src={sender.avatar} alt={sender.name} width={32} height={32} />
                    </span>
                  </div>
                );
              })}
              {visitorTyping && selected.status === "open" ? (
                <div className="plat-live-row is-visitor">
                  <span className="plat-live-avatar is-visitor" aria-hidden>
                    {selected.name.trim().charAt(0).toUpperCase() || "?"}
                  </span>
                  <div className="plat-live-col">
                    <span className="plat-live-name">{selected.name}</span>
                    <div className="plat-live-bubble is-visitor is-typing">
                      <p className="plat-live-typing">
                        <span />
                        <span />
                        <span />
                      </p>
                      <small>{selected.name} está escribiendo…</small>
                    </div>
                  </div>
                </div>
              ) : null}
              {selected.status === "closed" ? (
                <div className="plat-live-row is-system">
                  <div className="plat-live-bubble is-system is-closed">
                    <span>Sistema</span>
                    <p>
                      {selected.closedReason === "manual"
                        ? "Esta conversación fue cerrada."
                        : selected.closedReason === "visitor_left"
                          ? "El visitante cerró el chat."
                          : "Esta conversación fue cerrada por inactividad."}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
            {showJumpToLatest ? (
              <button
                type="button"
                className="plat-live-jump-latest"
                onClick={scrollToLatest}
                aria-label="Ir al último mensaje"
              >
                <ChevronDown size={16} strokeWidth={2.5} />
              </button>
            ) : null}
            </div>

            {selected.status === "open" ? (
              <ChatComposer
                variant="platform"
                value={draft}
                onChange={onAdminDraftChange}
                placeholder="Escribe un mensaje..."
                disabled={pending}
                sendLabel="Enviar"
                emojiTitle="Emojis"
                attachTitle="Adjuntar archivo o imagen"
                onSubmit={async ({ body, attachment }) => {
                  signalAdminTyping(false);
                  const formData = new FormData();
                  formData.set("sessionId", selected.id);
                  formData.set("body", body);
                  if (attachment) formData.set("attachment", attachment);
                  const result = await sendAdminLiveChatReplyAction(formData);
                  if (!result.ok) {
                    throw new Error(result.error || "No se pudo enviar.");
                  }
                  setDraft("");
                  router.refresh();
                }}
              />
            ) : (
              <p className="plat-inbox-muted">
                {selected.closedReason === "manual"
                  ? "Este chat está cerrado. Reabrilo para seguir respondiendo."
                  : selected.closedReason === "visitor_left"
                    ? "El visitante cerró el chat. Reabrilo para seguir respondiendo."
                    : "Cerrado por inactividad. Reabrilo para seguir respondiendo."}
              </p>
            )}
          </>
        ) : (
          <div className="plat-inbox-empty-detail">
            Seleccioná un chat para responder en directo.
          </div>
        )}
      </section>

      <PlatformConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar chat"
        description={
          deleteTarget
            ? `Se va a eliminar la conversación con ${deleteTarget.name}. Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        pending={pending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          const formData = new FormData();
          formData.set("sessionId", deleteTarget.id);
          runForm(deleteLiveChatAction, formData, () => {
            setDeleteTarget(null);
            setSelectedId(null);
            router.replace(inboxPath("chat"), { scroll: false });
          });
        }}
      />
    </div>
  );
}
