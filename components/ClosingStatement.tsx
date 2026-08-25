"use client";

import Image from "next/image";
import { useLanguage } from "./LanguageProvider";

export default function ClosingStatement() {
  const { t } = useLanguage();
  const section = t.closing;

  return (
    <section className="closing-statement" data-chat-surface="dark" aria-label={section.ariaLabel}>
      <div className="closing-statement-scene" aria-hidden="true">
        <Image
          src="/ingenio-volando.png"
          alt=""
          width={720}
          height={720}
          unoptimized
          className="closing-statement-ingenio"
          sizes="(max-width: 768px) 40vw, (max-width: 1200px) 30vw, 420px"
        />
      </div>

      <div className="closing-statement-inner">
        <div className="closing-statement-author">
          <div className="closing-statement-avatar-wrap">
            <div className="closing-statement-avatar-ring" aria-hidden="true" />
            <div className="closing-statement-avatar">
              <Image
                src="/marco-bretschneider.jpg"
                alt={section.name}
                width={112}
                height={112}
                className="closing-statement-avatar-img"
                sizes="(min-width: 768px) 112px, 96px"
              />
            </div>
          </div>
          <div className="closing-statement-meta">
            <p className="closing-statement-name">{section.name}</p>
            <p className="closing-statement-role">{section.role}</p>
          </div>
        </div>

        <blockquote className="closing-statement-quote">
          <div className="closing-statement-emerge">
            <span className="closing-statement-mark closing-statement-mark--open" aria-hidden="true">
              {"\u201C"}
            </span>
            <p className="closing-statement-text">
              {section.quoteLines.map((line, index) => (
                <span key={line} className="closing-statement-line">
                  {line}
                  {index < section.quoteLines.length - 1 ? <br /> : null}
                </span>
              ))}
            </p>
            <span className="closing-statement-mark closing-statement-mark--close" aria-hidden="true">
              {"\u201D"}
            </span>
          </div>
        </blockquote>
      </div>
    </section>
  );
}
