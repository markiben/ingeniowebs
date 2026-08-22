"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import SectionHeading from "./SectionHeading";

const fadeUp = {
  hidden: { opacity: 1, y: 0 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const stagger = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.08 },
  },
};

export default function Portfolio() {
  const { t } = useLanguage();
  const section = t.portfolio;

  return (
    <section id="blog" className="blog-section section-nav section-padding">
      <div className="blog-section-bg" aria-hidden="true" />

      <div className="section-inner relative z-10 mx-auto min-w-0 max-w-[1080px] px-4 sm:px-6">
        <SectionHeading
          label={section.label}
          title={section.title}
          description={section.description}
          spacing="compact"
        />

        <motion.div
          id="blog-feed"
          className="blog-feed"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
          variants={stagger}
        >
          <div className="blog-feed-head">
            <p className="blog-feed-label">{section.feedLabel}</p>
            <Link href="/blog" className="blog-btn-secondary blog-btn-cta-pulse">
              {section.goToBlog}
              <ArrowRight size={16} className="blog-btn-cta-arrow" />
            </Link>
          </div>

          <div className="blog-feed-grid">
            {section.items.map((item) => {
              const photo = item.screenshot ?? item.thumbnail;
              const fit = item.screenshotFit ?? "cover";
              const href = item.href ?? `/casos/${item.id}`;

              return (
                <motion.div key={item.id} variants={fadeUp}>
                  <Link href={href} className="blog-card">
                    <span
                      className="blog-card-media"
                      style={{
                        background: item.screenshotBg ?? item.brandColor ?? "#0e335f",
                      }}
                    >
                      {photo ? (
                        <Image
                          src={photo}
                          alt={item.title}
                          fill
                          unoptimized
                          className={
                            fit === "contain"
                              ? "object-contain object-center"
                              : "object-cover object-center"
                          }
                          sizes="(max-width: 640px) 100vw, 33vw"
                        />
                      ) : null}
                    </span>
                    <span className="blog-card-body">
                      <span className="blog-pill is-soft">{item.category}</span>
                      <span className="blog-card-title">{item.title}</span>
                      <span className="blog-card-excerpt">{item.challenge}</span>
                      <span className="blog-card-more">
                        {item.cta ?? section.readMore}
                        <ArrowRight size={14} />
                      </span>
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
