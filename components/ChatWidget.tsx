"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  MessageCircle,
  MessagesSquare,
  X,
  ArrowLeft,
  CheckCircle,
  MessageSquareText,
  Minus,
} from "lucide-react";
import ChatComposer from "@/components/chat/ChatComposer";
import ChatMessageBody from "@/components/chat/ChatMessageBody";
import { useLanguage } from "./LanguageProvider";
import { getTelegramUrl, getWhatsAppUrl } from "@/lib/site";
import type { LiveChatMessage } from "@/lib/platform/types";

const LIVE_BRAND_AVATAR = "/chat/soporte-ingenio.png";
const LIVE_AGENT_AVATAR = "/chat/mr-ingenio.png";

type View = "menu" | "form" | "success" | "live-start" | "live-thread";

const LIVE_CHAT_STORAGE_KEY = "ingenio-live-chat";

type StoredLiveChat = {
  sessionId: string;
  visitorToken: string;
};

const DARK_SURFACE_SELECTOR = "[data-chat-surface='dark']";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

export default function ChatWidget() {
  const { t } = useLanguage();
  const chat = t.chatWidget;
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("menu");
  const [loading, setLoading] = useState(false);
  const [lifted, setLifted] = useState(false);
  const [onDarkSurface, setOnDarkSurface] = useState(false);
  const [ready, setReady] = useState(false);
  const [touchUi, setTouchUi] = useState(false);
  const [liveSession, setLiveSession] = useState<StoredLiveChat | null>(null);
  const [liveMessages, setLiveMessages] = useState<LiveChatMessage[]>([]);
  const [liveStatus, setLiveStatus] = useState<"open" | "closed">("open");
  const [liveError, setLiveError] = useState("");
  const [liveDraft, setLiveDraft] = useState("");
  const [adminTyping, setAdminTyping] = useState(false);
  const [adminDisplayName, setAdminDisplayName] = useState("Mr. Ingenio");
  const [closedReason, setClosedReason] = useState<
    "idle" | "manual" | "visitor_left" | null
  >(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const parkedRef = useRef(false);
  const liveThreadRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<number | null>(null);
  const lastTypingSentRef = useRef(0);
  const liveSessionRef = useRef<StoredLiveChat | null>(null);
  const liveStatusRef = useRef<"open" | "closed">("open");

  liveSessionRef.current = liveSession;
  liveStatusRef.current = liveStatus;

  function applyLiveSession(session: {
    messages: LiveChatMessage[];
    status: "open" | "closed";
    adminTyping?: boolean;
    adminDisplayName?: string;
    closedReason?: "idle" | "manual" | "visitor_left" | null;
  }) {
    setLiveMessages((prev) => {
      if (
        prev.length === session.messages.length &&
        prev.every((message, index) => message.id === session.messages[index]?.id)
      ) {
        return prev;
      }
      return session.messages;
    });
    setLiveStatus(session.status);
    setAdminTyping(Boolean(session.adminTyping));
    setAdminDisplayName(session.adminDisplayName || "Mr. Ingenio");
    setClosedReason(session.closedReason ?? null);
  }

  async function signalVisitorTyping(typing: boolean) {
    if (!liveSession || liveStatus === "closed") return;
    const { setVisitorTypingAction } = await import("@/lib/platform/live-chat");
    await setVisitorTypingAction({
      sessionId: liveSession.sessionId,
      visitorToken: liveSession.visitorToken,
      typing,
    });
  }

  function onVisitorDraftChange(value: string) {
    setLiveDraft(value);
    if (!liveSession || liveStatus === "closed") return;

    const now = Date.now();
    if (value.trim() && now - lastTypingSentRef.current > 1200) {
      lastTypingSentRef.current = now;
      void signalVisitorTyping(true);
    }

    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => {
      void signalVisitorTyping(false);
    }, 1400);
  }

  const whatsappUrl = getWhatsAppUrl(chat.whatsappPrefill);
  const telegramUrl = getTelegramUrl(chat.whatsappPrefill);

  const closePanel = () => {
    setOpen(false);
    window.setTimeout(() => {
      // Si el chat sigue abierto, no volvemos al menú: al reabrir el FAB
      // retoma el hilo y el heartbeat sigue mientras haya sesión.
      if (liveSessionRef.current && liveStatusRef.current === "open") return;
      setView("menu");
      setLiveError("");
    }, 280);
  };

  /** Cierra la conversación en vivo (visitante salió / cerró el chat). */
  async function endLiveChatSession() {
    const session = liveSessionRef.current;
    if (!session || liveStatusRef.current === "closed") return;
    try {
      const { closeVisitorLiveChatAction } = await import(
        "@/lib/platform/live-chat"
      );
      await closeVisitorLiveChatAction({
        sessionId: session.sessionId,
        visitorToken: session.visitorToken,
      });
      setLiveStatus("closed");
      setClosedReason("visitor_left");
      liveStatusRef.current = "closed";
    } catch {
      /* ignore */
    }
  }

  const closeLiveAndPanel = () => {
    void endLiveChatSession().finally(() => {
      setOpen(false);
      window.setTimeout(() => {
        setView("menu");
        setLiveError("");
      }, 280);
    });
  };

  const openForm = () => setView("form");

  const clearLiveSession = () => {
    try {
      localStorage.removeItem(LIVE_CHAT_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setLiveSession(null);
  };

  const startNewLiveChat = () => {
    clearLiveSession();
    setLiveMessages([]);
    setLiveStatus("open");
    liveStatusRef.current = "open";
    setClosedReason(null);
    setAdminTyping(false);
    setAdminDisplayName("Mr. Ingenio");
    setLiveDraft("");
    setLiveError("");
    setView("live-start");
  };

  const openLiveStart = () => {
    setLiveError("");
    if (!liveSession) {
      setView("live-start");
      return;
    }
    // Retoma la conversación (abierta o cerrada: el admin puede reabrirla).
    setView("live-thread");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const { captureChatMessageAction } = await import("@/lib/platform/actions");
    await captureChatMessageAction({
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      body: String(form.get("message") ?? ""),
    });
    setLoading(false);
    setView("success");
  };

  const handleLiveStart = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setLiveError("");
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "");
    const { startLiveChatAction } = await import("@/lib/platform/live-chat");
    const result = await startLiveChatAction({
      name,
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      body: String(form.get("message") ?? ""),
      welcomeMessage: chat.liveWelcome.replaceAll("{name}", name.trim()),
    });
    setLoading(false);
    if (!result.ok) {
      setLiveError(result.error);
      return;
    }
    const stored = {
      sessionId: result.sessionId,
      visitorToken: result.visitorToken,
    };
    try {
      localStorage.setItem(LIVE_CHAT_STORAGE_KEY, JSON.stringify(stored));
    } catch {
      /* ignore */
    }
    setLiveSession(stored);
    applyLiveSession(result.session);
    setView("live-thread");
  };

  const handleLiveSend = async (payload: {
    body: string;
    attachment: File | null;
  }) => {
    if (!liveSession || liveStatus === "closed") return;
    if (!payload.body.trim() && !payload.attachment) return;
    setLoading(true);
    setLiveError("");
    const { sendVisitorLiveChatMessageAction } = await import(
      "@/lib/platform/live-chat"
    );
    const result = await sendVisitorLiveChatMessageAction({
      sessionId: liveSession.sessionId,
      visitorToken: liveSession.visitorToken,
      body: payload.body,
      attachment: payload.attachment,
    });
    setLoading(false);
    if (!result.ok) {
      setLiveError(result.error);
      throw new Error(result.error);
    }
    setLiveDraft("");
    void signalVisitorTyping(false);
    applyLiveSession(result.session);
  };

  useEffect(() => {
    let cancelled = false;
    async function restoreSession() {
      try {
        const raw = localStorage.getItem(LIVE_CHAT_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as StoredLiveChat;
        if (!parsed?.sessionId || !parsed?.visitorToken) return;

        const { getLiveChatThreadAction } = await import(
          "@/lib/platform/live-chat"
        );
        const result = await getLiveChatThreadAction({
          sessionId: parsed.sessionId,
          visitorToken: parsed.visitorToken,
        });
        if (cancelled) return;
        if (!result.ok) {
          clearLiveSession();
          return;
        }
        setLiveSession(parsed);
        applyLiveSession(result.session);
        setView("live-thread");
      } catch {
        /* ignore */
      }
    }
    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!liveSession) return;
    // Solo polling agresivo con el hilo abierto; si no, no saturar el server.
    if (liveStatus === "closed") return;

    let cancelled = false;
    const activeThread = open && view === "live-thread";
    // Más frecuente con hilo abierto para ver respuestas del bot sin esperar tanto.
    const intervalMs = activeThread ? 2000 : 30000;

    async function pull() {
      const { getLiveChatThreadAction } = await import(
        "@/lib/platform/live-chat"
      );
      const result = await getLiveChatThreadAction({
        sessionId: liveSession!.sessionId,
        visitorToken: liveSession!.visitorToken,
      });
      if (cancelled) return;
      if (!result.ok) {
        setLiveError(result.error);
        if (result.error.includes("no encontrada")) {
          clearLiveSession();
        }
        return;
      }
      applyLiveSession(result.session);
    }

    void pull();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void pull();
    }, intervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [liveSession, liveStatus, open, view]);

  useEffect(() => {
    const onPageHide = () => {
      const session = liveSessionRef.current;
      if (!session || liveStatusRef.current === "closed") return;
      void import("@/lib/platform/live-chat").then(
        ({ closeVisitorLiveChatAction }) => {
          void closeVisitorLiveChatAction({
            sessionId: session.sessionId,
            visitorToken: session.visitorToken,
          });
        },
      );
    };
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, []);

  useEffect(() => {
    if (!open || view !== "live-thread") return;
    const el = liveThreadRef.current;
    if (!el) return;
    const stickBottom = () => {
      el.scrollTop = el.scrollHeight;
    };
    stickBottom();
    // After layout/images settle (new bubble), stick again.
    const frame = window.requestAnimationFrame(stickBottom);
    const timer = window.setTimeout(stickBottom, 50);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [liveMessages, open, view, adminTyping, liveStatus, closedReason]);

  const isTouchUi = () =>
    window.matchMedia("(hover: none) and (pointer: coarse)").matches ||
    window.matchMedia("(max-width: 1023px)").matches;

  /* Touch: pin with `top` once — `bottom`/`safe-area` jump when Chrome's toolbar shows/hides */
  useEffect(() => {
    const touch = isTouchUi();
    setTouchUi(touch);
    setReady(true);
    if (!touch) return;

    const root = panelRef.current;
    if (!root) return;

    const pinTop = () => {
      const height = root.offsetHeight || 56;
      const gapFromBottom = 20;
      const vh = document.documentElement.clientHeight;
      root.style.top = `${Math.max(8, vh - gapFromBottom - height)}px`;
      root.style.bottom = "auto";
    };

    pinTop();
    const ro = new ResizeObserver(pinTop);
    ro.observe(root);

    const onOrient = () => window.setTimeout(pinTop, 350);
    window.addEventListener("orientationchange", onOrient);

    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", onOrient);
      root.style.top = "";
      root.style.bottom = "";
    };
  }, [open]);

  useEffect(() => {
    const hero = document.querySelector<HTMLElement>(".hero-section");
    const marquee = document.getElementById("hero-marquee");
    const fab = fabRef.current;
    const touch = isTouchUi();

    const detectDarkSurface = () => {
      if (!fab) return false;

      const rect = fab.getBoundingClientRect();
      const samplePoints: [number, number][] = [
        [rect.left + rect.width / 2, rect.top + rect.height / 2],
        [rect.left - 10, rect.top + rect.height / 2],
        [rect.left + rect.width / 2, rect.top - 8],
      ];

      for (const section of document.querySelectorAll<HTMLElement>(DARK_SURFACE_SELECTOR)) {
        const sectionRect = section.getBoundingClientRect();
        for (const [x, y] of samplePoints) {
          if (
            x >= sectionRect.left &&
            x <= sectionRect.right &&
            y >= sectionRect.top &&
            y <= sectionRect.bottom
          ) {
            return true;
          }
        }
      }

      for (const [x, y] of samplePoints) {
        if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) continue;

        for (const el of document.elementsFromPoint(x, y)) {
          if (el.closest(".chat-widget")) continue;
          if (el.closest(DARK_SURFACE_SELECTOR)) return true;
        }
      }

      return false;
    };

    /* Desktop only: raise over hero marquee, then park */
    const shouldLiftForMarquee = () => {
      if (touch) return false;
      if (!hero || !marquee) return false;

      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      const heroBottom = hero.offsetTop + hero.offsetHeight;

      if (scrollY < 24) parkedRef.current = false;
      if (parkedRef.current) return false;

      if (scrollY >= heroBottom - marquee.offsetHeight - 32) {
        parkedRef.current = true;
        return false;
      }

      return true;
    };

    const updateWidget = () => {
      if (!touch) setLifted(shouldLiftForMarquee());
      setOnDarkSurface(detectDarkSurface());
    };

    updateWidget();
    requestAnimationFrame(updateWidget);

    // Touch: no scroll listener for position — only refresh dark/light colors
    window.addEventListener("scroll", updateWidget, { passive: true });
    if (!touch) window.addEventListener("resize", updateWidget);

    return () => {
      window.removeEventListener("scroll", updateWidget);
      window.removeEventListener("resize", updateWidget);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onPointer = (e: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        closePanel();
      }
    };

    window.setTimeout(() => document.addEventListener("pointerdown", onPointer), 0);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  return (
    <div
      ref={panelRef}
      className={`chat-widget${touchUi ? " is-touch-fixed" : ""}${ready && lifted && !touchUi ? " is-lifted" : ""}${onDarkSurface ? " is-on-dark" : ""}`}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
            className={`chat-widget-panel${
              view === "live-thread" ? " is-live-room" : ""
            }${view === "menu" ? " is-menu" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label={chat.panelLabel}
          >
            {view !== "live-thread" ? (
              <div
                className={`chat-widget-header${
                  view === "menu" ? " is-menu-brand" : ""
                }`}
              >
                {view === "menu" ? (
                  <>
                    <div className="chat-widget-menu-brand">
                      <Image
                        src="/logobarrasuperior.png"
                        alt="Ingenio Webs"
                        width={120}
                        height={28}
                        className="chat-widget-menu-logo"
                        priority
                      />
                    </div>
                    <div className="chat-widget-menu-head-actions">
                      <span
                        className="chat-widget-menu-agent"
                        title={chat.liveAgent}
                      >
                        <Image
                          src={LIVE_AGENT_AVATAR}
                          alt={chat.liveAgent}
                          width={34}
                          height={34}
                        />
                      </span>
                      <button
                        type="button"
                        onClick={closePanel}
                        className="chat-widget-icon-btn"
                        aria-label={chat.close}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </>
                ) : view === "success" ? (
                  <>
                    <span className="chat-widget-header-spacer" />
                    <button
                      type="button"
                      onClick={closePanel}
                      className="chat-widget-icon-btn"
                      aria-label={chat.close}
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setLiveError("");
                        setView("menu");
                      }}
                      className="chat-widget-icon-btn"
                      aria-label={chat.back}
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={closePanel}
                      className="chat-widget-icon-btn"
                      aria-label={chat.close}
                    >
                      <X size={16} />
                    </button>
                  </>
                )}
              </div>
            ) : null}

            <AnimatePresence mode="wait">
              {view === "menu" && (
                <motion.div
                  key="menu"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.22 }}
                  className="chat-widget-body is-menu"
                >
                  <div className="chat-widget-menu-hero">
                    <p className="chat-widget-greeting">{chat.greeting}</p>
                    <h3 className="chat-widget-title">{chat.title}</h3>
                    <p className="chat-widget-subtitle">{chat.subtitle}</p>
                  </div>

                  <div className="chat-widget-options">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="chat-widget-option is-whatsapp"
                      onClick={closePanel}
                    >
                      <span className="chat-widget-option-icon">
                        <WhatsAppIcon className="h-5 w-5" />
                      </span>
                      <span className="chat-widget-option-text">
                        <span className="chat-widget-option-label">{chat.whatsappTitle}</span>
                        <span className="chat-widget-option-desc">{chat.whatsappDesc}</span>
                      </span>
                    </a>

                    <a
                      href={telegramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="chat-widget-option is-telegram"
                      onClick={closePanel}
                    >
                      <span className="chat-widget-option-icon">
                        <TelegramIcon className="h-5 w-5" />
                      </span>
                      <span className="chat-widget-option-text">
                        <span className="chat-widget-option-label">{chat.telegramTitle}</span>
                        <span className="chat-widget-option-desc">{chat.telegramDesc}</span>
                      </span>
                    </a>

                    <button
                      type="button"
                      onClick={openLiveStart}
                      className="chat-widget-option is-live"
                    >
                      <span className="chat-widget-option-icon">
                        <MessagesSquare size={20} strokeWidth={1.75} />
                      </span>
                      <span className="chat-widget-option-text">
                        <span className="chat-widget-option-label">
                          {liveSession ? chat.liveResume : chat.liveTitle}
                        </span>
                        <span className="chat-widget-option-desc">
                          {chat.liveDesc}
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={openForm}
                      className="chat-widget-option is-form"
                    >
                      <span className="chat-widget-option-icon">
                        <MessageSquareText size={20} strokeWidth={1.75} />
                      </span>
                      <span className="chat-widget-option-text">
                        <span className="chat-widget-option-label">{chat.formTitle}</span>
                        <span className="chat-widget-option-desc">{chat.formDesc}</span>
                      </span>
                    </button>
                  </div>
                </motion.div>
              )}

              {view === "form" && (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.22 }}
                  onSubmit={handleSubmit}
                  className="chat-widget-body"
                >
                  <h3 className="chat-widget-title !mt-0">{chat.formHeading}</h3>
                  <p className="chat-widget-subtitle">{chat.formSubtitle}</p>

                  <div className="chat-widget-fields">
                    <div>
                      <label htmlFor="chat-name" className="chat-widget-label">
                        {chat.name}
                      </label>
                      <input
                        id="chat-name"
                        name="name"
                        required
                        className="input-apple !py-2.5 !text-sm"
                        placeholder={chat.namePlaceholder}
                      />
                    </div>
                    <div>
                      <label htmlFor="chat-email" className="chat-widget-label">
                        {chat.email}
                      </label>
                      <input
                        id="chat-email"
                        name="email"
                        type="email"
                        required
                        className="input-apple !py-2.5 !text-sm"
                        placeholder={chat.emailPlaceholder}
                      />
                    </div>
                    <div>
                      <label htmlFor="chat-phone" className="chat-widget-label">
                        {chat.phone}
                      </label>
                      <input
                        id="chat-phone"
                        name="phone"
                        type="tel"
                        required
                        autoComplete="tel"
                        className="input-apple !py-2.5 !text-sm"
                        placeholder={chat.phonePlaceholder}
                      />
                    </div>
                    <div>
                      <label htmlFor="chat-message" className="chat-widget-label">
                        {chat.message}
                      </label>
                      <textarea
                        id="chat-message"
                        name="message"
                        required
                        rows={3}
                        className="input-apple resize-none !py-2.5 !text-sm"
                        placeholder={chat.messagePlaceholder}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary mt-4 w-full !py-2.5 text-sm disabled:opacity-60"
                  >
                    {loading ? chat.submitting : chat.submit}
                  </button>
                </motion.form>
              )}

              {view === "live-start" && (
                <motion.form
                  key="live-start"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.22 }}
                  onSubmit={handleLiveStart}
                  className="chat-widget-body"
                >
                  <h3 className="chat-widget-title !mt-0">{chat.liveHeading}</h3>
                  <p className="chat-widget-subtitle">{chat.liveSubtitle}</p>

                  <div className="chat-widget-fields">
                    <div>
                      <label htmlFor="live-name" className="chat-widget-label">
                        {chat.name}
                      </label>
                      <input
                        id="live-name"
                        name="name"
                        required
                        className="input-apple !py-2.5 !text-sm"
                        placeholder={chat.namePlaceholder}
                      />
                    </div>
                    <div>
                      <label htmlFor="live-email" className="chat-widget-label">
                        {chat.email}
                      </label>
                      <input
                        id="live-email"
                        name="email"
                        type="email"
                        required
                        className="input-apple !py-2.5 !text-sm"
                        placeholder={chat.emailPlaceholder}
                      />
                    </div>
                    <div>
                      <label htmlFor="live-phone" className="chat-widget-label">
                        {chat.phone}
                      </label>
                      <input
                        id="live-phone"
                        name="phone"
                        type="tel"
                        required
                        autoComplete="tel"
                        className="input-apple !py-2.5 !text-sm"
                        placeholder={chat.phonePlaceholder}
                      />
                    </div>
                    <div>
                      <label htmlFor="live-message" className="chat-widget-label">
                        {chat.message}
                      </label>
                      <textarea
                        id="live-message"
                        name="message"
                        required
                        rows={3}
                        className="input-apple resize-none !py-2.5 !text-sm"
                        placeholder={chat.messagePlaceholder}
                      />
                    </div>
                  </div>

                  {liveError ? (
                    <p className="chat-widget-live-error">{liveError}</p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary mt-4 w-full !py-2.5 text-sm disabled:opacity-60"
                  >
                    {loading ? chat.liveStarting : chat.liveStart}
                  </button>
                </motion.form>
              )}

              {view === "live-thread" && (
                <motion.div
                  key="live-thread"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.22 }}
                  className="chat-widget-live-room"
                >
                  <header className="chat-widget-live-support-head">
                    <div className="chat-widget-live-brand">
                      <span className="chat-widget-live-brand-mark">
                        <Image
                          src={LIVE_BRAND_AVATAR}
                          alt=""
                          width={40}
                          height={40}
                        />
                      </span>
                      <div className="chat-widget-live-brand-text">
                        <strong>{chat.liveSupportTitle}</strong>
                        <span
                          className={`chat-widget-live-status${
                            liveStatus === "open" ? " is-online" : " is-offline"
                          }`}
                        >
                          <span className="chat-widget-presence-dot" />
                          {liveStatus === "open"
                            ? chat.liveOnline
                            : chat.liveOffline}
                        </span>
                      </div>
                    </div>
                    <div className="chat-widget-live-support-actions">
                      <button
                        type="button"
                        onClick={closePanel}
                        className="chat-widget-icon-btn"
                        aria-label={chat.liveMinimize}
                      >
                        <Minus size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={closeLiveAndPanel}
                        className="chat-widget-icon-btn"
                        aria-label={chat.close}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </header>

                  <div className="chat-widget-live-thread" ref={liveThreadRef}>
                    {liveMessages.map((message) => {
                      const agentName = adminDisplayName || chat.liveAgent;
                      if (message.role === "visitor") {
                        return (
                          <div
                            key={message.id}
                            className="chat-widget-live-row is-visitor"
                          >
                            <div className="chat-widget-live-col">
                              <div className="chat-widget-live-bubble is-visitor">
                                <ChatMessageBody message={message} />
                              </div>
                            </div>
                          </div>
                        );
                      }
                      if (message.role === "system") {
                        return (
                          <div
                            key={message.id}
                            className="chat-widget-live-row is-system"
                          >
                            <span className="chat-widget-live-avatar">
                              <Image
                                src={LIVE_BRAND_AVATAR}
                                alt=""
                                width={32}
                                height={32}
                              />
                            </span>
                            <div className="chat-widget-live-col">
                              <span className="chat-widget-live-name">
                                {chat.liveSystem}
                              </span>
                              <div className="chat-widget-live-bubble is-system">
                                <ChatMessageBody message={message} />
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div
                          key={message.id}
                          className="chat-widget-live-row is-admin"
                        >
                          <span className="chat-widget-live-avatar is-agent">
                            <Image
                              src={(
                                message.senderKind === "human" ||
                                (message.senderName &&
                                  message.senderName !== chat.liveAgent)
                                  ? message.senderAvatarUrl ||
                                    "/marco-bretschneider.jpg"
                                  : LIVE_AGENT_AVATAR
                              ).split("?")[0]}
                              alt={
                                message.senderName ||
                                agentName
                              }
                              width={32}
                              height={32}
                            />
                          </span>
                          <div className="chat-widget-live-col">
                            <span className="chat-widget-live-name">
                              {message.senderName || agentName}
                            </span>
                            <div className="chat-widget-live-bubble is-admin">
                              <ChatMessageBody message={message} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {adminTyping && liveStatus === "open" ? (
                      <div className="chat-widget-live-row is-admin is-typing">
                        <span className="chat-widget-live-avatar is-agent">
                          <Image
                            src={
                              (adminDisplayName || chat.liveAgent) ===
                              chat.liveAgent
                                ? LIVE_AGENT_AVATAR
                                : "/marco-bretschneider.jpg"
                            }
                            alt={adminDisplayName || chat.liveAgent}
                            width={32}
                            height={32}
                          />
                        </span>
                        <div className="chat-widget-live-col">
                          <span className="chat-widget-live-name">
                            {adminDisplayName || chat.liveAgent}
                          </span>
                          <div className="chat-widget-live-bubble is-admin is-typing">
                            <p className="chat-widget-typing">
                              <span />
                              <span />
                              <span />
                            </p>
                            <small>
                              {adminDisplayName || chat.liveAgent}{" "}
                              {chat.liveTyping}
                            </small>
                          </div>
                        </div>
                      </div>
                    ) : null}
                    {liveStatus === "closed" ? (
                      <div className="chat-widget-live-row is-system">
                        <span className="chat-widget-live-avatar">
                          <Image
                            src={LIVE_BRAND_AVATAR}
                            alt=""
                            width={32}
                            height={32}
                          />
                        </span>
                        <div className="chat-widget-live-col">
                          <span className="chat-widget-live-name">
                            {chat.liveSystem}
                          </span>
                          <div className="chat-widget-live-bubble is-system is-closed">
                            <p>
                              {closedReason === "manual"
                                ? chat.liveClosed
                                : closedReason === "visitor_left"
                                  ? chat.liveClosedLeft
                                  : chat.liveClosedIdle}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {liveStatus === "closed" ? (
                    <div className="chat-widget-live-restart">
                      <p>{chat.liveNewChatHint}</p>
                      <button
                        type="button"
                        className="btn-primary w-full !py-2.5 text-sm"
                        onClick={startNewLiveChat}
                      >
                        {chat.liveNewChat}
                      </button>
                    </div>
                  ) : (
                    <ChatComposer
                      variant="widget"
                      value={liveDraft}
                      onChange={onVisitorDraftChange}
                      onSubmit={handleLiveSend}
                      placeholder={chat.liveReplyPlaceholder}
                      disabled={loading}
                      sendLabel={chat.liveSend}
                      emojiTitle="Emojis"
                      attachTitle="Adjuntar archivo o imagen"
                    />
                  )}

                  {liveError ? (
                    <p className="chat-widget-live-error">{liveError}</p>
                  ) : null}
                </motion.div>
              )}

              {view === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="chat-widget-body chat-widget-success"
                >
                  <CheckCircle size={40} className="chat-widget-success-icon" strokeWidth={1.5} />
                  <h3 className="chat-widget-title !mt-4">{chat.successTitle}</h3>
                  <p className="chat-widget-subtitle">{chat.successMessage}</p>
                  <button
                    type="button"
                    onClick={closePanel}
                    className="btn-primary mt-5 w-full !py-2.5 text-sm"
                  >
                    {chat.close}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        ref={fabRef}
        type="button"
        onClick={() => (open ? closePanel() : setOpen(true))}
        className="chat-widget-fab"
        aria-expanded={open}
        aria-label={open ? chat.close : chat.open}
        whileHover={touchUi ? undefined : { scale: 1.05 }}
        whileTap={touchUi ? undefined : { scale: 0.95 }}
      >
        <span className="chat-widget-fab-ring" aria-hidden />
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.18 }}
            >
              <X size={22} strokeWidth={2} />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ opacity: 0, rotate: 90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: -90 }}
              transition={{ duration: 0.18 }}
            >
              <MessageCircle size={22} strokeWidth={2} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
