/** Evento para forzar refresh de datos RSC en la plataforma. */
export const PLATFORM_REFRESH_EVENT = "plat:refresh";

/** Pedí un refresh inmediato (misma pestaña u otras con el listener activo). */
export function requestPlatformRefresh() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PLATFORM_REFRESH_EVENT));
}

/** Refresco inmediato vía router de Next + evento global. */
export function refreshPlatform(router: { refresh: () => void }) {
  router.refresh();
  requestPlatformRefresh();
}
