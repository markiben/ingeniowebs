"use client";

import { useEffect } from "react";
import { scrollToSection } from "@/lib/scroll-to-section";

function resolveSectionId(href: string | null): string | null {
  if (!href || href === "#") return null;

  if (href.startsWith("#")) return href.slice(1);

  try {
    const url = new URL(href, window.location.origin);
    if (url.pathname !== "/" && url.pathname !== window.location.pathname) return null;
    if (!url.hash || url.hash === "#") return null;
    return url.hash.slice(1);
  } catch {
    return null;
  }
}

export default function ScrollToHash() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as HTMLElement).closest("a[href]");
      if (!link) return;

      const href = link.getAttribute("href");
      const id = resolveSectionId(href);
      if (!id || !document.getElementById(id)) return;

      event.preventDefault();
      window.history.pushState(null, "", `#${id}`);

      /* Wait for mobile menu collapse so header height is correct */
      window.requestAnimationFrame(() => {
        window.setTimeout(() => scrollToSection(id), 80);
      });
    };

    const onHashChange = () => {
      const id = window.location.hash.slice(1);
      if (id) scrollToSection(id);
    };

    document.addEventListener("click", onClick);
    window.addEventListener("hashchange", onHashChange);

    if (window.location.hash) {
      const id = window.location.hash.slice(1);
      requestAnimationFrame(() => {
        scrollToSection(id, "instant");
      });
    }

    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  return null;
}
