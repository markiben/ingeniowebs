"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Header from "./Header";
import Footer from "./Footer";
import { useLanguage } from "./LanguageProvider";
import {
  formatBlogArticleDate,
  formatBlogCardDate,
  type BlogPost,
} from "@/lib/blog-types";
import type { BlogTopicId } from "@/lib/blog-topics";

export type TopicCard = {
  topicId: BlogTopicId;
  post: BlogPost | null;
  cover: string;
  accent: string;
};

function topicLabel(
  topics: Record<BlogTopicId, string>,
  id: BlogTopicId,
) {
  return topics[id];
}

export function BlogIndex({ cards }: { cards: TopicCard[] }) {
  const { t, locale } = useLanguage();
  const blog = t.blog;

  return (
    <>
      <Header />
      <main className="blog-journal-page is-viewport-fit" data-chat-surface="dark">
        <div className="blog-bento">
          <section className="blog-banner">
            <Image
              src="/blog/banner.png"
              alt=""
              fill
              unoptimized
              priority
              className="blog-banner-image"
              sizes="100vw"
            />
            <div className="blog-banner-shade" aria-hidden="true" />
            <Link href="/#blog" className="blog-banner-back">
              <ArrowLeft size={14} strokeWidth={2.25} aria-hidden="true" />
              {blog.back}
            </Link>
            <div className="blog-banner-content">
              <p className="blog-banner-kicker">{blog.label}</p>
              <h1 className="blog-banner-title">{blog.mastheadTitle}</h1>
              <p className="blog-banner-desc">{blog.description}</p>
            </div>
          </section>

          <div className="blog-bento-grid">
            {cards.map((card, index) => {
              const label = topicLabel(blog.topics, card.topicId);
              const post = card.post;
              const dateBits = post
                ? formatBlogCardDate(post.date, locale)
                : null;
              const href = post
                ? `/blog/${post.slug}`
                : "/blog/explorar";
              const exploreHref = "/blog/explorar";
              const topicFilterHref = `/blog/explorar?topic=${card.topicId}`;

              return (
                <article
                  key={card.topicId}
                  className={`blog-bento-card is-slot-${index + 1} is-topic-${card.topicId}`}
                >
                  <div className="blog-bento-media">
                    <Link href={href} className="blog-bento-hit" aria-label={post?.title ?? label}>
                      <Image
                        src={card.cover}
                        alt={post?.title ?? label}
                        fill
                        unoptimized
                        className="object-cover object-center"
                        sizes="(max-width: 900px) 100vw, 50vw"
                      />
                      <span className="blog-bento-media-shade" aria-hidden="true" />
                      <span className="blog-bento-copy">
                        {dateBits ? (
                          <span className="blog-bento-date">
                            {dateBits.weekday} · {dateBits.day}
                          </span>
                        ) : null}
                        <span className="blog-bento-title">
                          {post?.title ?? blog.noPostsInTopic}
                        </span>
                      </span>
                    </Link>

                    <Link
                      href={topicFilterHref}
                      className="blog-bento-chip blog-bento-topic"
                      aria-label={`${blog.filterTopic}: ${label}`}
                    >
                      {label}
                    </Link>
                    <Link href={exploreHref} className="blog-bento-chip blog-bento-more">
                      {blog.seeMore}
                      <ArrowUpRight size={12} strokeWidth={2.25} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}

export function BlogArticle({ post }: { post: BlogPost }) {
  const { t, locale } = useLanguage();
  const blog = t.blog;
  const { weekday, fullDate, time } = formatBlogArticleDate(post.date, locale);

  return (
    <>
      <Header />
      <main className="blog-journal-page" data-chat-surface="dark">
        <article className="blog-article">
          <Link href="/blog" className="blog-banner-back">
            <ArrowLeft size={14} strokeWidth={2.25} aria-hidden="true" />
            {blog.back}
          </Link>

          <header className="blog-article-header">
            <p className="blog-article-date">
              <span>{weekday}</span>
              <span aria-hidden="true">·</span>
              <span>{fullDate}</span>
              {time ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{time}</span>
                </>
              ) : null}
            </p>
            <p className="blog-article-category">{post.category}</p>
            <h1 className="blog-article-title">{post.title}</h1>
            {post.description ? (
              <p className="blog-article-lead">{post.description}</p>
            ) : null}
          </header>

          {post.cover ? (
            <div className="blog-article-hero">
              <Image
                src={post.cover}
                alt={post.title}
                fill
                unoptimized
                priority
                className="object-cover object-center"
                sizes="(max-width: 960px) 100vw, 860px"
              />
            </div>
          ) : null}

          <div className="blog-article-content">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
