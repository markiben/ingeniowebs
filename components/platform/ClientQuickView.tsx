"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { UserRound } from "lucide-react";
import { toProjectRegisteredGmailUrl, copyProjectRegisteredEmailBody } from "@/lib/platform/project-email";
import type { PlatformProject, PlatformUser } from "@/lib/platform/types";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function toWhatsAppUrl(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

type PanelPos = {
  top: number;
  left: number;
};

export default function ClientQuickView({
  project,
  client,
}: {
  project: PlatformProject;
  client?: PlatformUser | null;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<PanelPos>({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const displayName = client?.name || project.clientName;
  const email = client?.email || project.clientEmail || "";
  const phone = client?.phone || "";
  const gmailUrl = email
    ? toProjectRegisteredGmailUrl(email, project.code)
    : null;
  const whatsappUrl = phone ? toWhatsAppUrl(phone) : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;

    function updatePosition() {
      const button = buttonRef.current;
      const panel = panelRef.current;
      if (!button || !panel) return;

      const rect = button.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const gap = 8;
      const padding = 12;

      let top = rect.top - panelRect.height - gap;
      let left = rect.left;

      if (top < padding) {
        top = rect.bottom + gap;
      }

      const maxLeft = window.innerWidth - panelRect.width - padding;
      left = Math.max(padding, Math.min(left, maxLeft));

      setPos({ top, left });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="plat-client-cell">
      <span>{displayName}</span>
      <button
        ref={buttonRef}
        type="button"
        className="plat-client-icon"
        aria-label={`Ver datos de ${displayName}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <UserRound size={14} />
      </button>

      {mounted && open
        ? createPortal(
            <div
              ref={panelRef}
              className="plat-client-panel"
              id={panelId}
              role="dialog"
              style={{ top: pos.top, left: pos.left }}
            >
              <p className="plat-client-panel-title">{displayName}</p>
              <dl>
                <div>
                  <dt>Email</dt>
                  <dd>
                    {gmailUrl ? (
                      <a
                        className="plat-contact-link"
                        href={gmailUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Abrir Gmail (copia el mensaje para pegarlo arriba de tu firma)"
                        onClick={() => {
                          void copyProjectRegisteredEmailBody(
                            displayName,
                            project.code,
                          ).catch(() => {
                            /* ignore */
                          });
                        }}
                      >
                        {email}
                      </a>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Teléfono</dt>
                  <dd>
                    {whatsappUrl ? (
                      <a
                        className="plat-contact-link is-whatsapp"
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {phone}
                      </a>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Empresa</dt>
                  <dd>{client?.company || "—"}</dd>
                </div>
                <div>
                  <dt>Alta</dt>
                  <dd>{formatDate(client?.createdAt)}</dd>
                </div>
              </dl>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
