export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  cover?: string;
  draft?: boolean;
  content: string;
};

/** Parse blog dates in local time (avoids UTC day-shift on YYYY-MM-DD). */
export function parseBlogDate(input: string): Date | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const withTime = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/,
  );
  if (withTime) {
    const [, y, m, d, hh = "09", mm = "00", ss = "00"] = withTime;
    return new Date(
      Number(y),
      Number(m) - 1,
      Number(d),
      Number(hh),
      Number(mm),
      Number(ss),
    );
  }

  const parsed = Date.parse(trimmed);
  return Number.isFinite(parsed) ? new Date(parsed) : null;
}

function capitalizeWord(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatBlogDate(date: string, locale: "es" | "en" = "es") {
  const value = parseBlogDate(date);
  if (!value) return date;

  const loc = locale === "en" ? "en-US" : "es-AR";
  const dayNum = value.getDate();
  const month = capitalizeWord(
    new Intl.DateTimeFormat(loc, { month: "long" }).format(value),
  );
  const year = value.getFullYear();

  if (locale === "en") return `${month} ${dayNum}, ${year}`;
  return `${dayNum} de ${month} de ${year}`;
}

/** Short card date like 05/08 · weekday */
export function formatBlogCardDate(date: string, locale: "es" | "en" = "es") {
  const value = parseBlogDate(date);
  if (!value) return { day: date, weekday: "" };

  const loc = locale === "en" ? "en-US" : "es-AR";
  const day = new Intl.DateTimeFormat(loc, {
    day: "2-digit",
    month: "2-digit",
  }).format(value);
  const weekday = capitalizeWord(
    new Intl.DateTimeFormat(loc, { weekday: "long" }).format(value),
  );

  return { day, weekday };
}

/** Article header: Domingo · 2 de Agosto de 2026 · 09:30 */
export function formatBlogArticleDate(
  date: string,
  locale: "es" | "en" = "es",
) {
  const value = parseBlogDate(date);
  if (!value) {
    return { weekday: "", fullDate: date, time: "" };
  }

  const weekday = capitalizeWord(
    new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-AR", {
      weekday: "long",
    }).format(value),
  );
  const fullDate = formatBlogDate(date, locale);
  const time = `${String(value.getHours()).padStart(2, "0")}:${String(
    value.getMinutes(),
  ).padStart(2, "0")}`;

  return { weekday, fullDate, time };
}
