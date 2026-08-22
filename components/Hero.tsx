"use client";

import { useEffect, useRef } from "react";
import { ChevronRight } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import Logo from "./Logo";
import HeroMarquee from "./HeroMarquee";

export default function Hero() {
  const { t } = useLanguage();
  const frameRef = useRef<HTMLElement>(null);

  /* Side gap shrinks on scroll — panel widens to cover more width */
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    let raf = 0;

    const syncInset = () => {
      raf = 0;
      const rect = frame.getBoundingClientRect();
      /* Full width almost immediately on the first scroll */
      const travel = 36;
      const raw = Math.min(1, Math.max(0, -rect.top) / travel);
      const progress = raw >= 1 ? 1 : 1 - (1 - raw) ** 2;
      frame.style.setProperty("--hero-inset-progress", progress.toFixed(4));
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(syncInset);
    };

    syncInset();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section data-chat-surface="dark" ref={frameRef} className="hero-frame">
      <div className="hero-panel">
        <div className="hero-section relative flex flex-col">
          <div className="hero-atmosphere" aria-hidden="true">
            <div className="hero-atmosphere-wash" />
            <div className="hero-atmosphere-grid" />
            <div className="hero-atmosphere-glow" />
            <div className="hero-atmosphere-line" />
          </div>

          <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
            <div className="mx-auto w-full max-w-[980px] text-center">
              <div className="hero-logo-wrap mb-6 sm:mb-9">
                <Logo variant="hero" className="hero-logo" />
              </div>

              <p className="hero-tagline mb-3 text-sm font-medium tracking-wide sm:mb-4">
                {t.hero.tagline}
              </p>

              <h1 className="hero-title mx-auto max-w-4xl text-[1.65rem] font-semibold leading-[1.15] tracking-tight sm:text-4xl md:text-5xl lg:text-[3.75rem] lg:leading-[1.05]">
                {t.hero.titleBefore}{" "}
                <span className="text-gradient-blue">{t.hero.titleHighlight}</span>{" "}
                {t.hero.titleAfter.trimStart()}
              </h1>

              <p className="hero-subtitle mx-auto mt-4 max-w-2xl text-[0.95rem] leading-relaxed sm:mt-6 sm:text-lg md:text-xl">
                {t.hero.subtitle}
              </p>

              <div className="mt-7 flex w-full flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row sm:items-center sm:gap-4">
                <a
                  href="#contacto"
                  className="btn-primary btn-primary-pulse w-full text-base !px-8 !py-3.5 sm:w-auto"
                >
                  {t.hero.ctaPrimary}
                </a>
                <a
                  href="/blog"
                  className="btn-secondary hero-cta-secondary text-base"
                >
                  {t.hero.ctaSecondary}
                  <ChevronRight size={18} />
                </a>
              </div>
            </div>
          </div>

          <HeroMarquee words={t.hero.marquee} />
        </div>
      </div>
    </section>
  );
}
