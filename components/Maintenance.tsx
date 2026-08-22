"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Check, Shield, CalendarClock, Sparkles, type LucideIcon } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import SectionHeading from "./SectionHeading";
import type { MaintenancePlan } from "@/lib/i18n/types";

const fadeUp = {
  hidden: { opacity: 1, y: 0 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const stagger = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

function PlanContent({
  plan,
  Icon,
}: {
  plan: MaintenancePlan;
  Icon: LucideIcon;
}) {
  return (
    <>
      <div className="maintenance-plan-head">
        <span className="maintenance-plan-icon" aria-hidden="true">
          <Icon size={20} strokeWidth={1.75} />
        </span>
        <div>
          <h3 className="maintenance-plan-title">{plan.name}</h3>
          <p className="maintenance-plan-desc">{plan.description}</p>
        </div>
      </div>

      <ul className="maintenance-plan-features">
        {plan.features.map((feature) => (
          <li key={feature}>
            <span className="maintenance-plan-check" aria-hidden="true">
              <Check size={12} strokeWidth={3} />
            </span>
            {feature}
          </li>
        ))}
      </ul>

      <p className="maintenance-plan-note">{plan.note}</p>
    </>
  );
}

export default function Maintenance() {
  const { t } = useLanguage();
  const section = t.maintenance;

  return (
    <section id="mantenimiento" data-chat-surface="dark" className="maintenance-section section-nav section-padding">
      <div className="maintenance-bg" aria-hidden="true" />
      <div className="maintenance-grid" aria-hidden="true" />

      <div className="section-inner relative z-[1] mx-auto min-w-0 max-w-[1080px] px-4 sm:px-6">
        <SectionHeading
          label={section.label}
          title={section.title}
          description={section.description}
          variant="dark"
        />

        <motion.div
          className="maintenance-warranty"
          initial={{ opacity: 1, y: 0, scale: 1 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.01 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <span className="maintenance-warranty-icon" aria-hidden="true">
            <Shield size={18} strokeWidth={2} />
          </span>
          <p>
            {section.warrantyBefore}{" "}
            <strong>{section.warrantyHighlight}</strong> {section.warrantyAfter}
          </p>
        </motion.div>

        <motion.div
          className="maintenance-plans"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.01 }}
        >
          {section.plans.map((plan) => {
            const featured = Boolean(plan.highlighted);
            const PlanIcon = featured ? Sparkles : CalendarClock;

            return (
              <motion.div
                key={plan.name}
                variants={fadeUp}
                className={
                  featured
                    ? "maintenance-plan-spotlight"
                    : "maintenance-plan-slot"
                }
              >
                <article
                  className={`maintenance-plan ${featured ? "is-featured" : ""}`}
                >
                  {featured && (
                    <span className="maintenance-plan-badge">
                      {section.recommended}
                    </span>
                  )}

                  <div className="maintenance-plan-shell">
                    {featured && (
                      <>
                        <span
                          className="maintenance-plan-neon-glow"
                          aria-hidden="true"
                        />
                        <span
                          className="maintenance-plan-neon"
                          aria-hidden="true"
                        />
                      </>
                    )}

                    <div className="maintenance-plan-body">
                      <PlanContent plan={plan} Icon={PlanIcon} />
                    </div>
                  </div>
                </article>

                {featured ? (
                  <div className="maintenance-super" aria-hidden="true">
                    <Image
                      src="/superingenio.png"
                      alt=""
                      width={420}
                      height={720}
                      unoptimized
                      className="maintenance-super-img"
                    />
                  </div>
                ) : null}
              </motion.div>
            );
          })}
        </motion.div>

        <motion.p
          className="maintenance-footer"
          initial={{ opacity: 1 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25, duration: 0.6 }}
        >
          {section.footerNote}
        </motion.p>
      </div>
    </section>
  );
}
