import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogArticle } from "@/components/BlogJournal";
import { getBlogPost, getBlogSlugs } from "@/lib/blog";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "Blog | Ingenio Webs" };

  const descripcion = post.description || post.title;

  return {
    title: `${post.title} | Blog Ingenio Webs`,
    description: descripcion,
    /* Sin esto cada artículo heredaba el canonical de la raíz y se
       declaraba a sí mismo como duplicado de la portada. */
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: descripcion,
      url: `/blog/${slug}`,
      publishedTime: post.date,
      images: post.cover ? [{ url: post.cover }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: descripcion,
      images: post.cover ? [post.cover] : undefined,
    },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  return <BlogArticle post={post} />;
}
