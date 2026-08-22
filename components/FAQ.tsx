"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import SectionHeading from "./SectionHeading";

export default function FAQ() {
  const { t } = useLanguage();
  const section = t.faq;
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="section-nav section-padding section-surface">
      <div className="section-inner mx-auto max-w-[680px] px-6">
        <SectionHeading
          label={section.label}
          title={section.title}
          description={section.description}
        />

        <div className="faq-list">
          {section.items.map((faq, i) => {
            const isOpen = openIndex === i;

            return (
            <motion.div
              key={faq.question}
              initial={{ opacity: 1, y: 0 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className={`faq-item${isOpen ? " is-open" : ""}`}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="faq-trigger"
              >
                <span className="faq-question">{faq.question}</span>
                <span className="faq-icon" aria-hidden="true">
                  {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                </span>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="faq-answer-wrap"
                  >
                    <p className="faq-answer">{faq.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
