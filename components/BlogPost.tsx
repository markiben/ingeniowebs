"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import Header from "./Header";
import Footer from "./Footer";

export default function BlogPost({ slug }: { slug: string }) {
  const { t } = useLanguage();
  const section = t.portfolio;
  const item = section.items.find((entry) => entry.id === slug);

  if (!item) {
    return (
      <>
        <Header />
        <main className="blog-journal-page" data-chat-surface="dark">
          <article className="blog-article">
            <Link href="/#blog" className="blog-banner-back">
              <ArrowLeft size={14} strokeWidth={2.25} aria-hidden="true" />
              {section.backToBlog}
            </Link>
            <h1 className="blog-article-title">404</h1>
          </article>
        </main>
        <Footer />
      </>
    );
  }

  const photo = item.screenshot ?? item.thumbnail;
  const fit = item.screenshotFit ?? "cover";

  return (
    <>
      <Header />
      <main className="blog-journal-page" data-chat-surface="dark">
        <article className="blog-article">
          <Link href="/#blog" className="blog-banner-back">
            <ArrowLeft size={14} strokeWidth={2.25} aria-hidden="true" />
            {section.backToBlog}
          </Link>

          <header className="blog-article-header">
            <p className="blog-article-category">{item.category}</p>
            <h1 className="blog-article-title">{item.title}</h1>
            {item.previewUrl ? (
              <p className="blog-article-lead">{item.previewUrl}</p>
            ) : null}
          </header>

          {photo ? (
            <div
              className="blog-article-hero"
              style={
                fit === "contain"
                  ? { background: item.screenshotBg ?? "#151920" }
                  : undefined
              }
            >
              <Image
                src={photo}
                alt={item.title}
                fill
                unoptimized
                priority
                className={
                  fit === "contain"
                    ? "object-contain object-center"
                    : "object-cover object-center"
                }
                sizes="(max-width: 960px) 100vw, 860px"
              />
            </div>
          ) : null}

          <div className="blog-article-content">
            <h2>{section.challenge}</h2>
            <p>{item.challenge}</p>

            <h2>{section.solution}</h2>
            <p>{item.solution}</p>

            <h2>{section.result}</h2>
            <p>{item.result}</p>
          </div>

          {item.siteUrl ? (
            <div className="blog-case-actions">
              <a
                href={item.siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="blog-case-cta"
              >
                {section.viewCase}
                <ArrowUpRight size={16} strokeWidth={2.25} />
              </a>
            </div>
          ) : null}
        </article>
      </main>
      <Footer />
    </>
  );
}
