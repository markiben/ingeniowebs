"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import Header from "./Header";
import Footer from "./Footer";

type LegalKind = "privacy" | "terms";

export default function LegalDocument({ kind }: { kind: LegalKind }) {
  const { t } = useLanguage();
  const doc = kind === "privacy" ? t.legal.privacy : t.legal.terms;

  return (
    <>
      <Header />
      <main className="legal-page">
        <div className="legal-page-inner">
          <Link href="/" className="legal-back">
            <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
            {t.legal.backHome}
          </Link>

          <header className="legal-header">
            <h1>{doc.title}</h1>
            <p>
              {t.legal.updatedLabel}: {doc.updated}
            </p>
          </header>

          <div className="legal-sections">
            {doc.sections.map((section) => (
              <section key={section.title} className="legal-section">
                <h2>{section.title}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
