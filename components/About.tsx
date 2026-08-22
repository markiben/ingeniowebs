"use client";

import { motion } from "framer-motion";
import { useLanguage } from "./LanguageProvider";
import SectionHeading from "./SectionHeading";
import AboutLayers from "./AboutLayers";

export default function About() {
  const { t } = useLanguage();
  const section = t.about;

  return (
    <section id="sobre-nosotros" className="about-section section-padding overflow-hidden">
      <div className="relative mx-auto max-w-[980px] px-4 sm:px-6">
        <div className="about-layout">
          <motion.div
            className="about-copy"
            initial={{ opacity: 1, y: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.01 }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <SectionHeading
              label={section.heading.label}
              title={section.heading.title}
              align="left"
              spacing="compact"
            />
            <div className="about-copy-body">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 32)}>{paragraph}</p>
              ))}
            </div>
          </motion.div>

          <div className="about-visual">
            <AboutLayers
              stackTitle={section.stackTitle}
              stackNote={section.stackNote}
              stats={section.stats}
              technologies={section.technologies}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
