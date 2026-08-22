import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { parseBlogDate, type BlogPost } from "./blog-types";
import { BLOG_TOPICS, resolveTopicId, type BlogTopicId } from "./blog-topics";

export type { BlogPost } from "./blog-types";
export { formatBlogDate } from "./blog-types";
export type { BlogTopicId } from "./blog-topics";
export { filterBlogPosts } from "./blog-client";

export type TopicCard = {
  topicId: BlogTopicId;
  post: BlogPost | null;
  cover: string;
  accent: string;
};

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function ensureBlogDir() {
  if (!fs.existsSync(BLOG_DIR)) {
    fs.mkdirSync(BLOG_DIR, { recursive: true });
  }
}

function readPostFile(filename: string): BlogPost | null {
  const slug = filename.replace(/\.md$/i, "");
  const fullPath = path.join(BLOG_DIR, filename);
  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);

  const title = typeof data.title === "string" ? data.title.trim() : "";
  if (!title) return null;

  return {
    slug,
    title,
    description:
      typeof data.description === "string" ? data.description.trim() : "",
    date: typeof data.date === "string" ? data.date : "",
    category:
      typeof data.category === "string" ? data.category.trim() : "Novedades",
    cover: typeof data.cover === "string" ? data.cover : undefined,
    draft: Boolean(data.draft),
    content: content.trim(),
  };
}

export function getAllBlogPosts({ includeDrafts = false } = {}): BlogPost[] {
  ensureBlogDir();

  const files = fs
    .readdirSync(BLOG_DIR)
    .filter((name) => name.endsWith(".md"));

  return files
    .map(readPostFile)
    .filter((post): post is BlogPost => {
      if (!post) return false;
      if (!includeDrafts && post.draft) return false;
      return true;
    })
    .sort((a, b) => {
      const da = parseBlogDate(a.date)?.getTime() || 0;
      const db = parseBlogDate(b.date)?.getTime() || 0;
      return db - da;
    });
}

export function getBlogPost(slug: string): BlogPost | null {
  ensureBlogDir();
  const fullPath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(fullPath)) return null;
  const post = readPostFile(`${slug}.md`);
  if (!post || post.draft) return null;
  return post;
}

export function getBlogSlugs(): string[] {
  return getAllBlogPosts().map((post) => post.slug);
}

/** Latest post per fixed topic for the home bento */
export function getTopicCards(posts = getAllBlogPosts()): TopicCard[] {
  return BLOG_TOPICS.map((topic) => {
    const latest =
      posts.find((post) => resolveTopicId(post.category) === topic.id) ?? null;

    return {
      topicId: topic.id,
      post: latest,
      cover: latest?.cover || topic.cover,
      accent: topic.accent,
    };
  });
}

