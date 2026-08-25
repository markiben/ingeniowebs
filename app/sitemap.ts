import type { MetadataRoute } from "next";
import { getAllBlogPosts } from "@/lib/blog";
import { es } from "@/lib/i18n/es";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ingeniowebs.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const ahora = new Date();

  const fijas: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: ahora, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/blog`, lastModified: ahora, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/blog/explorar`, lastModified: ahora, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/privacidad`, lastModified: ahora, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terminos`, lastModified: ahora, changeFrequency: "yearly", priority: 0.3 },
  ];

  const articulos: MetadataRoute.Sitemap = getAllBlogPosts().map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.date ? new Date(post.date) : ahora,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  /* Los casos con `href` apuntan a un sitio externo del cliente: la ruta
     /casos/<id> no existe para ellos, así que se excluyen. */
  const casos: MetadataRoute.Sitemap = es.portfolio.items
    .filter((item) => !item.href)
    .map((item) => ({
      url: `${SITE_URL}/casos/${item.id}`,
      lastModified: ahora,
      changeFrequency: "monthly",
      priority: 0.7,
    }));

  return [...fijas, ...articulos, ...casos];
}
