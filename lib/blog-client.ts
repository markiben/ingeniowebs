import { parseBlogDate, type BlogPost } from "./blog-types";
import { getTopicById, resolveTopicId } from "./blog-topics";

export type BlogSortOrder = "asc" | "desc";

/** Normalize post dates to YYYY-MM-DD for day filtering. */
export function toBlogDayKey(date: string) {
  const match = date.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];

  const value = parseBlogDate(date);
  if (!value) return "";

  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function filterBlogPosts(
  posts: BlogPost[],
  {
    topic,
    query,
    day,
    sort = "desc",
  }: {
    topic?: string | null;
    query?: string | null;
    day?: string | null;
    sort?: BlogSortOrder;
  },
) {
  const topicId = topic?.trim() || "";
  const q = query?.trim().toLowerCase() || "";
  const dayKey = day?.trim() || "";
  const knownTopic = topicId ? getTopicById(topicId) : undefined;

  const filtered = posts.filter((post) => {
    if (knownTopic && resolveTopicId(post.category) !== knownTopic.id) {
      return false;
    }
    if (dayKey && toBlogDayKey(post.date) !== dayKey) {
      return false;
    }
    if (!q) return true;
    const haystack = [post.title, post.description, post.category, post.content]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });

  const direction = sort === "asc" ? 1 : -1;
  return [...filtered].sort((a, b) => {
    const ta = parseBlogDate(a.date)?.getTime() || 0;
    const tb = parseBlogDate(b.date)?.getTime() || 0;
    return (ta - tb) * direction;
  });
}
