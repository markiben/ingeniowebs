export type BlogTopicId =
  | "diseno"
  | "desarrollo"
  | "proyectos"
  | "negocios"
  | "novedades";

export type BlogTopic = {
  id: BlogTopicId;
  /** Matches post.category (case-insensitive) */
  aliases: string[];
  cover: string;
  accent: string;
};

/** Fixed topics shown on the blog home bento */
export const BLOG_TOPICS: BlogTopic[] = [
  {
    id: "diseno",
    aliases: ["diseño", "diseno", "design", "ui", "ux"],
    cover: "/portfolio/novastudio-presentacion.png",
    accent: "#f9a8d4",
  },
  {
    id: "desarrollo",
    aliases: ["desarrollo", "development", "fullstack", "full stack", "código", "codigo"],
    cover: "/portfolio/liquifaster-detail.png",
    accent: "#7dd3fc",
  },
  {
    id: "proyectos",
    aliases: ["proyectos", "projects", "casos", "cases", "portfolio"],
    cover: "/portfolio/trading-miami-detail.png",
    accent: "#fcd34d",
  },
  {
    id: "negocios",
    aliases: ["negocios", "business", "tips", "estrategia"],
    cover: "/portfolio/capital-flow-3d.png",
    accent: "#86efac",
  },
  {
    id: "novedades",
    aliases: ["novedades", "news", "novedad", "anuncios", "general"],
    cover: "/portfolio/mls-capital.png",
    accent: "#c4b5fd",
  },
];

export function resolveTopicId(category: string): BlogTopicId {
  const normalized = category.trim().toLowerCase();
  const match = BLOG_TOPICS.find((topic) =>
    topic.aliases.some((alias) => alias === normalized),
  );
  return match?.id ?? "novedades";
}

export function getTopicById(id: string): BlogTopic | undefined {
  return BLOG_TOPICS.find((topic) => topic.id === id);
}
