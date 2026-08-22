"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette,
  Code2,
  Blocks,
  Rocket,
  ArrowUpRight,
  Pause,
  Play,
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import SectionHeading from "./SectionHeading";
import HeroBackground from "./HeroBackground";

const AUTO_INTERVAL = 5500;

const fadeUp = {
  hidden: { opacity: 1, y: 0 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const staggerList = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.12 },
  },
};

const serviceMeta: Record<
  string,
  { Icon: LucideIcon; gradient: string; glow: string; dot: string }
> = {
  diseno: {
    Icon: Palette,
    gradient: "linear-gradient(135deg, #4db8ff 0%, #1b75bb 100%)",
    glow: "rgba(77, 184, 255, 0.45)",
    dot: "#4db8ff",
  },
  fullstack: {
    Icon: Code2,
    gradient: "linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)",
    glow: "rgba(139, 92, 246, 0.45)",
    dot: "#a78bfa",
  },
  plataformas: {
    Icon: Blocks,
    gradient: "linear-gradient(135deg, #34d399 0%, #14b8a6 100%)",
    glow: "rgba(52, 211, 153, 0.4)",
    dot: "#34d399",
  },
  apps: {
    Icon: Rocket,
    gradient: "linear-gradient(135deg, #fb923c 0%, #f59e0b 100%)",
    glow: "rgba(251, 146, 60, 0.42)",
    dot: "#fb923c",
  },
};

export default function Services() {
  const { t } = useLanguage();
  const section = t.services;
  const [active, setActive] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);

  const paused = userPaused || hoverPaused;
  const service = section.items[active];
  const meta = serviceMeta[service.id] ?? serviceMeta.diseno;
  const Icon = meta.Icon;

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % section.items.length);
      setProgressKey((k) => k + 1);
    }, AUTO_INTERVAL);
    return () => clearInterval(timer);
  }, [paused, section.items.length]);

  const selectService = (index: number) => {
    setActive(index);
    setProgressKey((k) => k + 1);
  };

  return (
    <section
      id="servicios"
      data-chat-surface="dark"
      className="services-section section-nav relative overflow-hidden section-padding"
    >
      <HeroBackground variant="dark" />
      <div className="section-inner relative mx-auto min-w-0 max-w-[980px] px-4 sm:px-6">
        <SectionHeading
          label={section.label}
          title={section.title}
          description={section.description}
          variant="dark"
        />

        <motion.div
          className="services-rail mb-3 grid min-w-0 grid-cols-2 gap-2 lg:grid-cols-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.01 }}
          variants={staggerList}
        >
          {section.items.map((item, i) => {
            const itemMeta = serviceMeta[item.id] ?? serviceMeta.diseno;
            const ItemIcon = itemMeta.Icon;
            const isActive = active === i;

            return (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => selectService(i)}
                variants={fadeUp}
                className="services-rail-item group relative w-full min-w-0 cursor-pointer text-left"
              >
                {isActive && (
                  <motion.span
                    layoutId="services-rail-active"
                    className="services-rail-active absolute inset-0 rounded-xl backdrop-blur-md"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative flex items-center gap-2 px-2.5 py-2.5 sm:gap-2.5 sm:px-3.5">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white shadow-md transition-transform duration-300 group-hover:scale-110 sm:h-8 sm:w-8"
                    style={{ background: itemMeta.gradient }}
                  >
                    <ItemIcon size={14} strokeWidth={2} className="sm:hidden" />
                    <ItemIcon size={15} strokeWidth={2} className="hidden sm:block" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-[11px] font-semibold leading-tight sm:text-xs lg:text-[13px] ${
                        isActive ? "text-white" : "text-white/65 group-hover:text-white/85"
                      }`}
                    >
                      {item.title.split(" &")[0].split(" /")[0]}
                    </span>
                  </span>
                </span>
                {isActive && (
                  <span
                    key={progressKey}
                    className={`services-rail-progress absolute bottom-0 h-0.5 rounded-full ${paused ? "is-paused" : ""}`}
                    style={
                      {
                        "--auto-interval": `${AUTO_INTERVAL}ms`,
                        background: itemMeta.gradient,
                      } as CSSProperties
                    }
                  />
                )}
              </motion.button>
            );
          })}
        </motion.div>

        <motion.div
          className="services-showcase relative min-w-0 overflow-hidden rounded-2xl"
          initial={{ opacity: 1, y: 0 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.01 }}
          transition={{ duration: 0.7, delay: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
          onMouseEnter={() => setHoverPaused(true)}
          onMouseLeave={() => setHoverPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={service.id}
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="services-showcase-grid">
                <div className="services-showcase-copy">
                  <div className="mb-5 flex min-w-0 items-start gap-3.5">
                    <div className="relative h-12 w-12 shrink-0">
                      <span
                        className="services-icon-ring absolute -inset-1 rounded-2xl opacity-60"
                        style={{
                          background: `conic-gradient(from 0deg, transparent, ${meta.glow}, transparent)`,
                        }}
                        aria-hidden="true"
                      />
                      <span
                        className="relative flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg"
                        style={{ background: meta.gradient }}
                      >
                        <Icon size={22} strokeWidth={1.75} />
                      </span>
                    </div>
                    <div className="min-w-0">
                      <motion.span
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="services-showcase-kicker block font-mono text-[10px] uppercase leading-snug tracking-[0.12em] sm:tracking-[0.16em]"
                      >
                        {service.subtitle}
                      </motion.span>
                      <h3 className="services-showcase-title mt-1.5 text-lg font-semibold tracking-tight sm:text-xl lg:text-[1.35rem]">
                        {service.title}
                      </h3>
                    </div>
                  </div>

                  <motion.p
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                    className="services-showcase-desc text-[0.95rem] leading-relaxed"
                  >
                    {service.description}
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 }}
                    className="services-showcase-ideal mt-4 text-sm leading-relaxed"
                  >
                    <strong>{section.idealFor}</strong> {service.idealFor}
                  </motion.p>
                </div>

                <div className="services-showcase-list">
                  <ul className="services-include-list">
                    {service.includes.map((item, i) => (
                      <motion.li
                        key={item}
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: 0.06 + i * 0.05,
                          type: "spring",
                          stiffness: 260,
                          damping: 22,
                        }}
                        className="services-include-item flex items-start gap-3 rounded-xl px-3.5 py-3 text-sm sm:text-[0.95rem]"
                      >
                        <span
                          className="services-include-dot mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: meta.dot }}
                        />
                        {item}
                      </motion.li>
                    ))}
                  </ul>
                </div>

                <motion.a
                  href="#contacto"
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.16 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="services-showcase-cta"
                  style={{ background: meta.gradient }}
                >
                  {section.requestQuote}
                  <ArrowUpRight size={14} />
                </motion.a>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <motion.div
          className="mt-4 flex items-center justify-center gap-3"
          initial={{ opacity: 1, y: 0 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.01 }}
          transition={{ duration: 0.5, delay: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <button
            type="button"
            onClick={() => setUserPaused((p) => !p)}
            aria-label={userPaused ? section.resumeAutoplay : section.pauseAutoplay}
            aria-pressed={userPaused}
            className="services-autoplay-btn flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80 backdrop-blur-sm transition hover:border-white/35 hover:bg-white/15 hover:text-white"
          >
            {userPaused ? <Play size={13} fill="currentColor" /> : <Pause size={13} />}
          </button>
          <div className="flex items-center gap-2">
            {section.items.map((item, i) => {
              const color = (serviceMeta[item.id] ?? serviceMeta.diseno).dot;
              const isActive = active === i;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Servicio ${i + 1}`}
                  onClick={() => selectService(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isActive ? "w-6" : "w-1.5 hover:opacity-90"
                  }`}
                  style={{
                    background: color,
                    opacity: isActive ? 1 : 0.45,
                  }}
                />
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
