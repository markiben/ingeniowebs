"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb,
  Globe,
  Building2,
  RefreshCw,
  ChevronRight,
  Activity,
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import SectionHeading from "./SectionHeading";
import TypewriterTerminal from "./TypewriterTerminal";

const TYPEWRITER_SPEED = 22;

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

const iconMap: Record<string, LucideIcon> = {
  lightbulb: Lightbulb,
  globe: Globe,
  building: Building2,
  refresh: RefreshCw,
};

function PanelAtmosphere() {
  return (
    <div className="help-panel-atmosphere pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="help-panel-atmosphere-glow" />
      <div className="help-panel-atmosphere-grid" />
      <div className="help-panel-atmosphere-beam" />
      <div className="help-panel-atmosphere-fade" />
    </div>
  );
}

export default function HelpSection() {
  const { t } = useLanguage();
  const section = t.helpSection;
  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);

  const card = section.cards[active];
  const Icon = iconMap[card.icon] ?? Lightbulb;
  const signalDelay = 350 + card.description.length * TYPEWRITER_SPEED;

  return (
    <section
      className="help-section relative overflow-hidden section-padding"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="help-blueprint-bg absolute inset-0" aria-hidden="true" />
      <div className="help-section-glow absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-iw-blue/5 blur-3xl" />

      <div className="relative mx-auto min-w-0 max-w-[980px] px-4 sm:px-6">
        <SectionHeading
          label={section.label}
          title={section.title}
          description={section.description}
        />

        <div className="grid min-w-0 items-stretch gap-4 sm:gap-6 lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-8">
          <motion.div
            className="flex min-w-0 flex-col gap-2"
            role="tablist"
            aria-label={section.scenarioLabel}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.01 }}
            variants={staggerList}
          >
            {section.cards.map((item, i) => {
              const ItemIcon = iconMap[item.icon] ?? Lightbulb;
              const isActive = active === i;

              return (
                <motion.button
                  key={item.title}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(i)}
                  variants={fadeUp}
                  className="help-scenario group relative w-full text-left"
                >
                  {isActive && (
                    <motion.span
                      layoutId="help-scenario-active"
                      className="help-scenario-glow absolute inset-0 rounded-2xl"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative flex items-center gap-3 p-3.5 sm:gap-3.5 sm:p-5">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                        isActive
                          ? "bg-white text-iw-blue shadow-[0_4px_16px_rgba(0,0,0,0.25)]"
                          : "bg-iw-blue text-white shadow-sm group-hover:bg-iw-blue-dark"
                      }`}
                    >
                      <ItemIcon size={20} strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 pt-0.5">
                      <span
                        className={`block text-sm font-semibold leading-snug transition-colors sm:text-[15px] ${
                          isActive ? "text-white" : "text-foreground/80 group-hover:text-foreground"
                        }`}
                      >
                        {item.title}
                      </span>
                      <span
                        className={`mt-0.5 block font-mono text-[10px] leading-snug sm:mt-1 ${
                          isActive ? "text-iw-blue-light/80" : "text-iw-blue/70"
                        }`}
                      >
                        {item.signal.split("→")[0].trim()}
                      </span>
                    </span>
                  </span>
                </motion.button>
              );
            })}
          </motion.div>

          <motion.div
            className="help-panel relative min-w-0 overflow-hidden rounded-2xl sm:rounded-3xl"
            initial={{ opacity: 1, y: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.01 }}
            transition={{ duration: 0.7, delay: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <PanelAtmosphere />

            <div className="help-panel-chrome relative z-10 flex min-w-0 items-center gap-2 border-b border-white/10 px-4 py-2.5 sm:px-5 sm:py-3">
              <span className="flex shrink-0 gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              </span>
              <span className="ml-1 min-w-0 truncate font-mono text-[10px] text-white/50 sm:ml-2 sm:text-[11px]">
                {section.panelTitle}
              </span>
              <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] text-emerald-400/90">
                <Activity size={12} className={hovering ? "animate-pulse" : ""} />
                online
              </span>
            </div>

            <div className="help-panel-body relative z-10 p-4 sm:p-6 lg:p-8">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active}
                  className="help-panel-content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <div className="help-panel-head mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:gap-4">
                    <div className="help-panel-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:h-14 sm:w-14">
                      <Icon size={24} strokeWidth={1.75} className="text-iw-blue sm:hidden" />
                      <Icon size={28} strokeWidth={1.75} className="hidden text-iw-blue sm:block" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-iw-blue-light/70 sm:tracking-[0.2em]">
                        {section.scenarioLabel}
                      </p>
                      <h3 className="help-panel-title mt-1 text-lg font-semibold tracking-tight text-white sm:text-xl lg:text-2xl">
                        {card.title}
                      </h3>
                    </div>
                  </div>

                  <TypewriterTerminal
                    key={`desc-${active}`}
                    text={card.description}
                    prefix="> "
                    speed={TYPEWRITER_SPEED}
                    delay={200}
                    showCursor
                    keepCursorWhenDone={false}
                    className="help-panel-desc max-w-none text-sm sm:max-w-lg sm:text-base"
                  />

                  <TypewriterTerminal
                    key={`signal-${active}`}
                    text={card.signal}
                    prefix="$ "
                    speed={TYPEWRITER_SPEED}
                    delay={signalDelay}
                    showCursor
                    hideUntilStart
                    className="help-panel-signal mt-3 break-all text-xs sm:mt-5 sm:break-normal sm:text-sm"
                  />

                  <div className="help-panel-tags mt-6 flex flex-wrap gap-2">
                    {card.tags.map((tag) => (
                      <span key={tag} className="help-tag rounded-full px-3 py-1 text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <a
                    href={card.href}
                    className="help-panel-cta group mt-auto inline-flex items-center gap-2 pt-8 text-sm font-medium text-iw-blue-light transition-colors hover:text-white"
                  >
                    {section.exploreCta}
                    <ChevronRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </a>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="help-panel-scan absolute inset-0 z-[1] pointer-events-none" aria-hidden="true" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
