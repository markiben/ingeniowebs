import type { Metadata } from "next";
import BlogExplore from "@/components/BlogExplore";
import { getAllBlogPosts } from "@/lib/blog";
import { es } from "@/lib/i18n/es";

type Props = {
  searchParams: Promise<{ topic?: string }>;
};

export const metadata: Metadata = {
  title: `${es.blog.exploreTitle} | Ingenio Webs`,
  description: es.blog.exploreDescription,
};

export default async function BlogExplorePage({ searchParams }: Props) {
  const { topic = "" } = await searchParams;
  const posts = getAllBlogPosts();
  /* Only a known topic id overrides the default (Todos + Más recientes) */
  const initialTopic = topic.trim();

  return <BlogExplore posts={posts} initialTopic={initialTopic} />;
}
