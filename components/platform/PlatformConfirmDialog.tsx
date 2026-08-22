"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { AlertTriangle, Plus, X } from "lucide-react";

export default function PlatformConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Eliminar",
  cancelLabel = "Cancelar",
  pendingLabel,
  pending = false,
  tone = "danger",
  children,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  pendingLabel?: string;
  pending?: boolean;
  tone?: "danger" | "primary";
  children?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useEffect(() => {
    if (!open) return;

    const frame = window.requestAnimationFrame(() => {
      const root = dialogRef.current;
      const preferred = root?.querySelector<HTMLElement>(
        "input:not([type='hidden']), textarea, select",
      );
      (preferred ?? cancelRef.current)?.focus();
    });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancelRef.current();
    }

    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="plat-modal-root" role="presentation">
      <button
        type="button"
        className="plat-modal-backdrop"
        aria-label="Cerrar"
        onClick={onCancel}
      />
      <div
        ref={dialogRef}
        className="plat-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        <button
          type="button"
          className="plat-modal-close"
          aria-label="Cerrar"
          onClick={onCancel}
          disabled={pending}
        >
          <X size={16} />
        </button>

        <div
          className={`plat-modal-icon${tone === "danger" ? " is-danger" : " is-primary"}`}
          aria-hidden="true"
        >
          {tone === "danger" ? <AlertTriangle size={22} /> : <Plus size={22} />}
        </div>

        <h2 id={titleId}>{title}</h2>
        <p id={descId}>{description}</p>

        {children ? <div className="plat-modal-body">{children}</div> : null}

        <div className="plat-modal-actions">
          <button
            ref={cancelRef}
            type="button"
            className="plat-btn is-ghost"
            onClick={onCancel}
            disabled={pending}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`plat-btn${tone === "danger" ? " is-danger" : ""}`}
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? pendingLabel || "Procesando…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
