"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import LanguageSwitcher from "./LanguageSwitcher";
import Logo from "./Logo";
import { goToHomeSection, toHomeSectionHref } from "@/lib/scroll-to-section";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLanguage();
  const menuRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target)) setMobileOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  /*
   * Keep page padding in sync with the real header height (safe-area + bar),
   * so blog/hero content never sits under the fixed menu on tablets.
   */
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const syncOffset = () => {
      const styles = getComputedStyle(header);
      const padTop = parseFloat(styles.paddingTop) || 0;
      const row = header.querySelector(".nav-bar > div");
      const rowHeight =
        row instanceof HTMLElement ? row.offsetHeight : 48;
      const height = Math.ceil(padTop + rowHeight);
      if (height > 0) {
        document.documentElement.style.setProperty(
          "--header-offset",
          `${height}px`,
        );
      }
    };

    syncOffset();
    const observer = new ResizeObserver(syncOffset);
    observer.observe(header);
    window.addEventListener("orientationchange", syncOffset);
    window.visualViewport?.addEventListener("resize", syncOffset);

    return () => {
      observer.disconnect();
      window.removeEventListener("orientationchange", syncOffset);
      window.visualViewport?.removeEventListener("resize", syncOffset);
    };
  }, []);

  /*
   * On phone/tablet Chrome, scrolling moves the visual viewport while
   * position:fixed stays on the layout viewport — the bar appears to vanish.
   * Pin it to visualViewport.offsetTop so it stays glued like on desktop.
   */
  useEffect(() => {
    const header = headerRef.current;
    const vv = window.visualViewport;
    if (!header || !vv) return;

    const isTouch =
      window.matchMedia("(hover: none) and (pointer: coarse)").matches ||
      window.matchMedia("(max-width: 1023px)").matches;

    if (!isTouch) return;

    const pin = () => {
      header.style.transform = `translate3d(0, ${vv.offsetTop}px, 0)`;
    };

    pin();
    vv.addEventListener("resize", pin);
    vv.addEventListener("scroll", pin);
    window.addEventListener("orientationchange", pin);

    return () => {
      vv.removeEventListener("resize", pin);
      vv.removeEventListener("scroll", pin);
      window.removeEventListener("orientationchange", pin);
      header.style.transform = "";
    };
  }, []);

  return (
    <header ref={headerRef} className="site-header">
      <div ref={menuRef} className={`nav-bar relative ${mobileOpen ? "is-menu-open" : ""}`}>
        <div className="flex h-12 items-center justify-between gap-2 px-3 sm:gap-3 sm:px-5 lg:px-8">
          <a
            href="/"
            className="flex min-w-0 shrink-0 items-center"
            onClick={(event) => {
              /* Stay on hero — avoid / navigation + smooth-scroll fighting the inset */
              if (window.location.pathname !== "/") return;
              event.preventDefault();
              setMobileOpen(false);
              if (window.location.hash) {
                window.history.pushState(null, "", window.location.pathname);
              }
              const hero = document.querySelector(".hero-frame");
              if (hero instanceof HTMLElement) {
                hero.style.setProperty("--hero-inset-progress", "0");
              }
              window.scrollTo({ top: 0, left: 0, behavior: "auto" });
            }}
          >
            <Logo variant="navbar" height={34} />
          </a>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 lg:flex">
            {t.navLinks.map((link) => {
              const href = toHomeSectionHref(link.href);
              return (
                <a
                  key={link.href}
                  href={href}
                  className="nav-link whitespace-nowrap"
                  onClick={(event) => goToHomeSection(href, event)}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            <a href="/plataforma/login" className="nav-cta nav-cta-compact">
              {t.header.signIn}
            </a>
            <div className="hidden lg:block">
              <LanguageSwitcher />
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label={t.header.menu}
              aria-expanded={mobileOpen}
              aria-controls="nav-mobile-menu"
              className="nav-menu-trigger inline-flex lg:hidden"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              id="nav-mobile-menu"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
              className="nav-mobile-menu lg:hidden"
            >
              <nav className="nav-mobile-nav" aria-label={t.header.menu}>
                {t.navLinks.map((link) => {
                  const href = toHomeSectionHref(link.href);
                  return (
                    <a
                      key={link.href}
                      href={href}
                      className="nav-mobile-link"
                      onClick={(event) => {
                        setMobileOpen(false);
                        goToHomeSection(href, event);
                      }}
                    >
                      {link.label}
                    </a>
                  );
                })}
              </nav>
              <div className="nav-mobile-lang">
                <span className="nav-mobile-lang-label">{t.header.language}</span>
                <LanguageSwitcher />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
