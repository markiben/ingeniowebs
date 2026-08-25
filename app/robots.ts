import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ingeniowebs.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      /* La plataforma es privada y /baja es el enlace de desuscripción que
         llega por mail: ninguna de las dos aporta nada en un buscador, y
         que aparezcan en resultados sólo genera confusión. */
      disallow: ["/plataforma", "/plataforma/", "/api/", "/baja"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
