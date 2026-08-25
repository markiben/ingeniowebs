import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogPost from "@/components/BlogPost";
import { es } from "@/lib/i18n/es";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return es.portfolio.items
    .filter((item) => !item.href)
    .map((item) => ({ slug: item.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = es.portfolio.items.find((entry) => entry.id === slug);
  if (!item) return { title: "Casos | Ingenio Webs" };

  return {
    title: `${item.title} | Ingenio Webs`,
    description: item.challenge,
    alternates: { canonical: `/casos/${slug}` },
    openGraph: {
      type: "article",
      title: item.title,
      description: item.challenge,
      url: `/casos/${slug}`,
      images: item.screenshot ? [{ url: item.screenshot }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: item.title,
      description: item.challenge,
      images: item.screenshot ? [item.screenshot] : undefined,
    },
  };
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
  const exists = es.portfolio.items.some(
    (entry) => entry.id === slug && !entry.href,
  );
  if (!exists) notFound();

  return <BlogPost slug={slug} />;
}
