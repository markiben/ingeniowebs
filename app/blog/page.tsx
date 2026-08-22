import type { Metadata } from "next";
import { BlogIndex } from "@/components/BlogJournal";
import { getTopicCards } from "@/lib/blog";
import { es } from "@/lib/i18n/es";

export const metadata: Metadata = {
  title: `${es.blog.title} | Ingenio Webs`,
  description: es.blog.description,
};

export default function BlogPage() {
  const cards = getTopicCards();
  return <BlogIndex cards={cards} />;
}
