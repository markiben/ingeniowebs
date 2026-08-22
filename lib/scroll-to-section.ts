export function getHeaderOffset(): number {
  const header = document.querySelector("header");
  const measured = header?.getBoundingClientRect().height ?? 48;
  /* Extra air under the fixed bar so the section title isn't glued to it */
  const gap = window.matchMedia("(max-width: 1023px)").matches ? 12 : 8;
  return measured + gap;
}

export function scrollToSection(id: string, behavior: ScrollBehavior = "smooth"): void {
  const section = document.getElementById(id);
  if (!section) return;

  const headerOffset = getHeaderOffset();
  const sectionTop = section.getBoundingClientRect().top + window.scrollY;
  const top = Math.max(0, sectionTop - headerOffset);

  window.scrollTo({ top, behavior });
}

/** `#contacto` / `/#contacto` → always `/#contacto` (works from /blog/...) */
export function toHomeSectionHref(href: string): string {
  if (href.startsWith("/#")) return href;
  if (href.startsWith("#") && href.length > 1) return `/${href}`;
  return href;
}

/**
 * From the home page: smooth-scroll to the section.
 * From any other route (/blog, etc.): hard-navigate to `/#section`
 * so the hash never sticks to the current path.
 */
export function goToHomeSection(href: string, event?: { preventDefault: () => void }) {
  const target = toHomeSectionHref(href);
  if (!target.startsWith("/#")) return;

  const id = target.slice(2);
  const onHome =
    window.location.pathname === "/" || window.location.pathname === "";

  if (onHome && document.getElementById(id)) {
    event?.preventDefault();
    window.history.pushState(null, "", target);
    window.requestAnimationFrame(() => {
      window.setTimeout(() => scrollToSection(id), 80);
    });
    return;
  }

  event?.preventDefault();
  window.location.assign(target);
}
