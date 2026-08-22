"use client";

import { Fragment } from "react";
import { motion } from "framer-motion";
import {
  MessageCircle,
  Map,
  Code2,
  Rocket,
  ChevronRight,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import SectionHeading from "./SectionHeading";
import type { ProcessStep } from "@/lib/i18n/types";

const iconMap: Record<ProcessStep["icon"], LucideIcon> = {
  discover: MessageCircle,
  plan: Map,
  build: Code2,
  launch: Rocket,
};

const fadeUp = {
  hidden: { opacity: 1, y: 0 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const stagger = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.14, delayChildren: 0.1 },
  },
};

export default function Process() {
  const { t } = useLanguage();
  const section = t.process;
  const lastIndex = section.steps.length - 1;

  return (
    <section id="proceso" data-chat-surface="dark" className="process-section section-nav section-padding">
      <div className="process-glow" aria-hidden="true" />

      <div className="process-inner section-inner relative mx-auto flex min-h-0 min-w-0 max-w-[1080px] flex-col px-4 sm:px-6">
        <SectionHeading
          label={section.label}
          title={section.title}
          description={section.description}
          variant="dark"
        />

        <motion.div
          className="process-map"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.01 }}
        >
          {section.steps.map((item, index) => {
            const Icon = iconMap[item.icon];

            return (
              <Fragment key={item.step}>
                <motion.article variants={fadeUp} className="process-map-step">
                  <div className="process-map-pin">
                    <span className="process-map-num">{item.step}</span>
                    <span className="process-map-icon" aria-hidden="true">
                      <Icon size={22} strokeWidth={1.75} />
                    </span>
                  </div>

                  <div className="process-map-body">
                    <h3 className="process-map-title">{item.title}</h3>
                    <p className="process-map-desc">{item.description}</p>
                  </div>
                </motion.article>

                {index < lastIndex && (
                  <motion.div
                    variants={fadeUp}
                    className="process-map-connector"
                    aria-hidden="true"
                  >
                    <ChevronRight className="process-map-arrow-h" size={22} strokeWidth={2} />
                    <ChevronDown className="process-map-arrow-v" size={22} strokeWidth={2} />
                  </motion.div>
                )}
              </Fragment>
            );
          })}
        </motion.div>

        <motion.div
          className="process-slogan"
          initial={{ opacity: 1, y: 0 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.01 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="process-slogan-glow" aria-hidden="true" />
          <blockquote className="process-slogan-frame">
            <span className="process-slogan-mark" aria-hidden="true">
              “
            </span>
            <span className="process-slogan-brand">{section.slogan.brand}</span>
            <p className="process-slogan-line">
              {section.slogan.before}
              <span className="process-slogan-highlight">{section.slogan.highlight}</span>
              {section.slogan.after}
            </p>
          </blockquote>
        </motion.div>
      </div>
    </section>
  );
}
