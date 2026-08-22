const OVERRIDE_STYLE_ID = "calendly-overrides";

/*
 * Calendly widget.css fija max-height: 700px en el popup.
 * La UI (info + calendario + horarios) suele necesitar ~820–880px,
 * por eso aparece scroll extra fuera del iframe.
 */
const CALENDLY_OVERRIDE_CSS = `
.calendly-overlay .calendly-popup {
  height: min(90svh, 880px) !important;
  max-height: min(90svh, 880px) !important;
  width: min(96vw, 1040px) !important;
  min-width: 0 !important;
}

@media (max-width: 975px) {
  .calendly-overlay .calendly-popup {
    top: 0 !important;
    bottom: 0 !important;
    height: 100svh !important;
    max-height: 100svh !important;
    width: 100% !important;
  }
}

.calendly-overlay .calendly-popup-content {
  height: 100% !important;
  overflow: hidden !important;
}

.calendly-overlay .calendly-popup-content iframe {
  height: 100% !important;
}

.calendly-overlay .calendly-spinner {
  display: none !important;
}

.calendly-overlay {
  backdrop-filter: blur(14px) saturate(1.06) !important;
  -webkit-backdrop-filter: blur(14px) saturate(1.06) !important;
  background-color: rgba(0, 0, 0, 0.45) !important;
  overflow: hidden !important;
}

html.calendly-open,
body.calendly-open {
  overflow: hidden !important;
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

html.calendly-open::-webkit-scrollbar,
body.calendly-open::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
}
`;

let savedScrollY = 0;
let isLocked = false;

export function injectCalendlyOverrides() {
  let style = document.getElementById(OVERRIDE_STYLE_ID) as HTMLStyleElement | null;

  if (!style) {
    style = document.createElement("style");
    style.id = OVERRIDE_STYLE_ID;
    style.textContent = CALENDLY_OVERRIDE_CSS;
  }

  document.head.appendChild(style);
}

export function lockPageForCalendly() {
  if (isLocked) return;

  savedScrollY = window.scrollY;
  isLocked = true;
  injectCalendlyOverrides();

  document.documentElement.classList.add("calendly-open");
  document.body.classList.add("calendly-open");
  /* Avoid position:fixed — blanks iOS Safari when combined with overlays/filters. */
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  document.body.style.touchAction = "none";
}

export function unlockPageForCalendly() {
  if (!isLocked) return;

  isLocked = false;
  document.documentElement.classList.remove("calendly-open");
  document.body.classList.remove("calendly-open");
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
  document.body.style.touchAction = "";
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";
  window.scrollTo(0, savedScrollY);
}

export function syncCalendlyPageState() {
  const isOpen = Boolean(document.querySelector(".calendly-overlay"));
  if (isOpen) lockPageForCalendly();
  else unlockPageForCalendly();
}

export function initCalendlyUi() {
  injectCalendlyOverrides();

  const observer = new MutationObserver(() => {
    syncCalendlyPageState();
    if (document.querySelector(".calendly-overlay")) injectCalendlyOverrides();
  });
  observer.observe(document.body, { childList: true });

  return () => {
    observer.disconnect();
    unlockPageForCalendly();
  };
}

export function ensureCalendlyStylesheet() {
  injectCalendlyOverrides();

  if (document.getElementById("calendly-widget-css")) return;

  const link = document.createElement("link");
  link.id = "calendly-widget-css";
  link.rel = "stylesheet";
  link.href = "https://assets.calendly.com/assets/external/widget.css";
  link.onload = () => injectCalendlyOverrides();
  document.head.appendChild(link);
}
