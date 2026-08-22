"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDownWideNarrow,
  ArrowLeft,
  ArrowUpWideNarrow,
  CalendarDays,
  ListFilter,
  Search,
} from "lucide-react";
import Header from "./Header";
import Footer from "./Footer";
import { useLanguage } from "./LanguageProvider";
import { formatBlogCardDate, type BlogPost } from "@/lib/blog-types";
import {
  BLOG_TOPICS,
  getTopicById,
  resolveTopicId,
  type BlogTopicId,
} from "@/lib/blog-topics";
import { filterBlogPosts, type BlogSortOrder } from "@/lib/blog-client";

type DateMode = "desc" | "asc" | "day";

function normalizeTopic(value: string): BlogTopicId | "" {
  return getTopicById(value)?.id ?? "";
}

export default function BlogExplore({
  posts,
  initialTopic = "",
}: {
  posts: BlogPost[];
  initialTopic?: string;
}) {
  const { t, locale } = useLanguage();
  const blog = t.blog;
  /* Default filters: Todos + Más recientes */
  const [topic, setTopic] = useState<BlogTopicId | "">(() =>
    normalizeTopic(initialTopic),
  );
  const [query, setQuery] = useState("");
  const [dateMode, setDateMode] = useState<DateMode>("desc");
  const [day, setDay] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTopic(normalizeTopic(initialTopic));
    setDateMode("desc");
    setDay("");
  }, [initialTopic]);

  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target)) setMenuOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const sort: BlogSortOrder = dateMode === "asc" ? "asc" : "desc";

  const filtered = useMemo(
    () =>
      filterBlogPosts(posts, {
        topic,
        query,
        day: dateMode === "day" ? day : "",
        sort,
      }),
    [posts, topic, query, dateMode, day, sort],
  );

  const topicLabel = topic
    ? blog.topics[topic as BlogTopicId]
    : blog.filterAll;

  const dateLabel =
    dateMode === "asc"
      ? blog.sortOldest
      : dateMode === "day" && day
        ? day
        : blog.sortNewest;

  const searchDetail = query.trim();
  const hasExtraFilters =
    Boolean(topic) || dateMode !== "desc" || Boolean(day) || Boolean(searchDetail);

  return (
    <>
      <Header />
      <main className="blog-journal-page" data-chat-surface="dark">
        <div className="blog-explore">
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
            <Link href="/blog" className="blog-banner-back">
              <ArrowLeft size={14} strokeWidth={2.25} aria-hidden="true" />
              {blog.back}
            </Link>
            <div className="blog-banner-content">
              <p className="blog-banner-kicker">{blog.label}</p>
              <h1 className="blog-banner-title">{blog.mastheadTitle}</h1>
              <p className="blog-banner-desc">{blog.description}</p>
            </div>
          </section>

          <div className="blog-explore-controls" ref={menuRef}>
            <div className="blog-explore-controls-bar">
              <label className="blog-filter-search">
                <Search size={16} strokeWidth={2} aria-hidden="true" />
                <span className="sr-only">{blog.searchLabel}</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={blog.searchPlaceholder}
                  autoComplete="off"
                  enterKeyHint="search"
                />
              </label>

              <button
                type="button"
                className={`blog-filter-menu-trigger${
                  menuOpen ? " is-open" : ""
                }${hasExtraFilters ? " has-active" : ""}`}
                aria-expanded={menuOpen}
                aria-controls="blog-filter-panel"
                aria-label={blog.filtersLabel}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <ListFilter size={18} strokeWidth={2.25} aria-hidden="true" />
              </button>
            </div>

            {menuOpen ? (
              <div
                id="blog-filter-panel"
                className="blog-filter-menu-panel"
                role="dialog"
                aria-label={blog.filtersLabel}
              >
                <div className="blog-filter-menu-section">
                  <p className="blog-filter-menu-heading">{blog.filtersLabel}</p>
                  <div className="blog-filter-menu-detail">
                    {searchDetail ? (
                      <p>
                        <span>{blog.searchLabel}</span>
                        <strong>“{searchDetail}”</strong>
                      </p>
                    ) : null}
                    <p>
                      <span>{blog.filterTopic}</span>
                      <strong>{topicLabel}</strong>
                    </p>
                    <p>
                      <span>{blog.filterDate}</span>
                      <strong>{dateLabel}</strong>
                    </p>
                  </div>
                </div>

                <div className="blog-filter-menu-section">
                  <p className="blog-filter-menu-heading">{blog.filterTopic}</p>
                  <div className="blog-explore-filters" role="group">
                    <button
                      type="button"
                      className={`blog-filter-chip is-topic-all${
                        topic ? "" : " is-active"
                      }`}
                      onClick={() => setTopic("")}
                    >
                      {blog.filterAll}
                    </button>
                    {BLOG_TOPICS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`blog-filter-chip is-topic-${item.id}${
                          topic === item.id ? " is-active" : ""
                        }`}
                        onClick={() => setTopic(item.id)}
                      >
                        {blog.topics[item.id as BlogTopicId]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="blog-filter-menu-section">
                  <p className="blog-filter-menu-heading">{blog.filterDate}</p>
                  <div className="blog-explore-date-filters" role="group">
                    <button
                      type="button"
                      className={`blog-date-chip${
                        dateMode === "desc" ? " is-active" : ""
                      }`}
                      onClick={() => {
                        setDateMode("desc");
                        setDay("");
                      }}
                    >
                      <ArrowDownWideNarrow
                        size={14}
                        strokeWidth={2.25}
                        aria-hidden="true"
                      />
                      {blog.sortNewest}
                    </button>
                    <button
                      type="button"
                      className={`blog-date-chip${
                        dateMode === "asc" ? " is-active" : ""
                      }`}
                      onClick={() => {
                        setDateMode("asc");
                        setDay("");
                      }}
                    >
                      <ArrowUpWideNarrow
                        size={14}
                        strokeWidth={2.25}
                        aria-hidden="true"
                      />
                      {blog.sortOldest}
                    </button>
                    <label
                      className={`blog-date-chip blog-date-picker${
                        dateMode === "day" ? " is-active" : ""
                      }`}
                    >
                      <CalendarDays
                        size={14}
                        strokeWidth={2.25}
                        aria-hidden="true"
                      />
                      <span>{day || blog.pickDate}</span>
                      <input
                        type="date"
                        value={day}
                        onChange={(event) => {
                          const next = event.target.value;
                          setDay(next);
                          setDateMode(next ? "day" : "desc");
                        }}
                        aria-label={blog.pickDate}
                      />
                    </label>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {filtered.length === 0 ? (
            <p className="blog-journal-empty">{blog.noResults}</p>
          ) : (
            <div className="blog-explore-grid">
              {filtered.map((post) => {
                const { day: dayLabel, weekday } = formatBlogCardDate(
                  post.date,
                  locale,
                );
                const topicId = resolveTopicId(post.category);
                const topicName = blog.topics[topicId];
                return (
                  <article
                    key={post.slug}
                    className={`blog-explore-card is-topic-${topicId}`}
                  >
                    <div className="blog-explore-media">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="blog-explore-hit"
                        aria-label={post.title}
                      >
                        {post.cover ? (
                          <Image
                            src={post.cover}
                            alt={post.title}
                            fill
                            unoptimized
                            className="object-cover object-center"
                            sizes="(max-width: 720px) 100vw, 33vw"
                          />
                        ) : (
                          <span className="blog-journal-card-fallback" />
                        )}
                        <span className="blog-bento-media-shade" aria-hidden="true" />
                        <span className="blog-bento-copy">
                          <span className="blog-bento-date">
                            {weekday} · {dayLabel}
                          </span>
                          <span className="blog-bento-title">{post.title}</span>
                        </span>
                      </Link>
                      <span className="blog-bento-chip blog-bento-topic">
                        {topicName}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
