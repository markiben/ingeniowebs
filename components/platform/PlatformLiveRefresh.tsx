"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { PLATFORM_REFRESH_EVENT } from "@/lib/platform/client-refresh";

function isEditingField() {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return (el as HTMLElement).isContentEditable;
}

/**
 * Mantiene la plataforma al día sin F5:
 * - refresh periódico (solo pestaña visible)
 * - al volver a la pestaña / focus
 * - al disparar `plat:refresh` tras mutaciones
 */
export default function PlatformLiveRefresh({
  intervalMs = 20000,
  enabled = true,
}: {
  intervalMs?: number;
  enabled?: boolean;
}) {
  const router = useRouter();
  const lastRefreshAt = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const refresh = (force = false) => {
      if (document.visibilityState !== "visible") return;
      if (!force && isEditingField()) return;
      const now = Date.now();
      // Evita ráfagas (doble evento + focus).
      if (!force && now - lastRefreshAt.current < 1200) return;
      if (force && now - lastRefreshAt.current < 350) return;
      lastRefreshAt.current = now;
      router.refresh();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh(true);
    };
    const onFocus = () => refresh(true);
    const onRequest = () => refresh(true);

    const id = window.setInterval(() => refresh(false), intervalMs);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    window.addEventListener(PLATFORM_REFRESH_EVENT, onRequest);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(PLATFORM_REFRESH_EVENT, onRequest);
    };
  }, [enabled, intervalMs, router]);

  return null;
}
