import { NEWSLETTER_SOURCE_LABEL } from "./newsletter";
import type {
  NewsletterClickEvent,
  NewsletterSource,
  NewsletterSubscriber,
} from "./types";

export type NewsletterMetricsRange = "7d" | "30d" | "90d" | "year" | "all";

export type NewsletterMetricsFilter = {
  range: NewsletterMetricsRange;
  source: "all" | NewsletterSource;
};

export const NEWSLETTER_RANGE_LABEL: Record<NewsletterMetricsRange, string> = {
  "7d": "Últimos 7 días",
  "30d": "Últimos 30 días",
  "90d": "Últimos 90 días",
  year: "Este año",
  all: "Todo el historial",
};

export const NEWSLETTER_MONTH_LABELS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const ORIGIN_COLORS: Record<NewsletterSource, string> = {
  newsletter: "#7dd3fc",
  contact_form: "#1b75bb",
  chat: "#34d399",
  meeting: "#fbbf24",
  message: "#a78bfa",
  manual: "#94a3b8",
  other: "#64748b",
};

export type NewsletterActivityRow = {
  id: string;
  name: string;
  email: string;
  sources: NewsletterSource[];
  sourceLabels: string;
  date: string;
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function unsubscribeDate(entry: NewsletterSubscriber) {
  return parseDate(entry.unsubscribedAt || entry.updatedAt);
}

function matchesSource(
  entry: NewsletterSubscriber,
  source: NewsletterMetricsFilter["source"],
) {
  if (source === "all") return true;
  return entry.sources.includes(source);
}

function rangeBounds(range: NewsletterMetricsRange, now = new Date()) {
  const end = now;
  if (range === "all") return { start: null as Date | null, end };
  if (range === "year") {
    return { start: new Date(now.getFullYear(), 0, 1), end };
  }
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const start = startOfDay(new Date(now));
  start.setDate(start.getDate() - (days - 1));
  return { start, end };
}

function inBounds(date: Date | null, start: Date | null, end: Date) {
  if (!date) return false;
  if (start && date < start) return false;
  return date <= end;
}

function primarySource(entry: NewsletterSubscriber): NewsletterSource {
  return entry.sources[0] ?? "other";
}

function formatSourceLabels(sources: NewsletterSource[]) {
  return sources.map((source) => NEWSLETTER_SOURCE_LABEL[source]).join(", ");
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function dayLabel(date: Date) {
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

function buildSeries(
  range: NewsletterMetricsRange,
  altas: NewsletterSubscriber[],
  bajas: NewsletterSubscriber[],
  now = new Date(),
) {
  const series: { label: string; altas: number; bajas: number }[] = [];

  if (range === "all" || range === "year") {
    const years = new Set<number>();
    const currentYear = now.getFullYear();
    for (let year = currentYear - 4; year <= currentYear; year += 1) {
      years.add(year);
    }
    for (const entry of [...altas, ...bajas]) {
      const created = parseDate(entry.createdAt);
      if (created) years.add(created.getFullYear());
      const left = unsubscribeDate(entry);
      if (left) years.add(left.getFullYear());
    }
    const ordered = [...years].sort((a, b) => a - b);
    for (const year of ordered) {
      series.push({
        label: String(year),
        altas: altas.filter((entry) => {
          const date = parseDate(entry.createdAt);
          return date?.getFullYear() === year;
        }).length,
        bajas: bajas.filter((entry) => {
          const date = unsubscribeDate(entry);
          return date?.getFullYear() === year;
        }).length,
      });
    }
    return series;
  }

  if (range === "90d") {
    const months: Date[] = [];
    for (let i = 2; i >= 0; i -= 1) {
      months.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
    }
    for (const month of months) {
      const key = monthKey(month);
      series.push({
        label: NEWSLETTER_MONTH_LABELS[month.getMonth()],
        altas: altas.filter((entry) => {
          const date = parseDate(entry.createdAt);
          return date ? monthKey(date) === key : false;
        }).length,
        bajas: bajas.filter((entry) => {
          const date = unsubscribeDate(entry);
          return date ? monthKey(date) === key : false;
        }).length,
      });
    }
    return series;
  }

  const days = range === "7d" ? 7 : 30;
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = startOfDay(new Date(now));
    date.setDate(date.getDate() - i);
    const key = dayKey(date);
    series.push({
      label: dayLabel(date),
      altas: altas.filter((entry) => {
        const created = parseDate(entry.createdAt);
        return created ? dayKey(startOfDay(created)) === key : false;
      }).length,
      bajas: bajas.filter((entry) => {
        const left = unsubscribeDate(entry);
        return left ? dayKey(startOfDay(left)) === key : false;
      }).length,
    });
  }
  return series;
}

export function buildNewsletterMetrics(
  subscribers: NewsletterSubscriber[],
  filter: NewsletterMetricsFilter,
  now = new Date(),
) {
  const scoped = subscribers.filter((entry) =>
    matchesSource(entry, filter.source),
  );
  const { start, end } = rangeBounds(filter.range, now);

  const active = scoped.filter((entry) => entry.status === "active");
  const unsubscribed = scoped.filter(
    (entry) => entry.status === "unsubscribed",
  );

  const altas = scoped.filter((entry) =>
    inBounds(parseDate(entry.createdAt), start, end),
  );
  const bajas = scoped.filter(
    (entry) =>
      entry.status === "unsubscribed" &&
      inBounds(unsubscribeDate(entry), start, end),
  );

  const originCounts = new Map<NewsletterSource, number>();
  for (const entry of altas) {
    for (const source of entry.sources) {
      originCounts.set(source, (originCounts.get(source) ?? 0) + 1);
    }
  }

  const byOrigin = (
    Object.keys(NEWSLETTER_SOURCE_LABEL) as NewsletterSource[]
  )
    .map((source) => {
      const value = originCounts.get(source) ?? 0;
      return {
        name: NEWSLETTER_SOURCE_LABEL[source],
        source,
        value,
        color: ORIGIN_COLORS[source],
      };
    })
    .filter((entry) => entry.value > 0)
    .sort((a, b) => b.value - a.value);

  const originTotal = byOrigin.reduce((sum, entry) => sum + entry.value, 0);
  const byOriginShare = byOrigin.map((entry) => ({
    ...entry,
    percent:
      originTotal > 0 ? Math.round((entry.value / originTotal) * 1000) / 10 : 0,
  }));

  const statusMix = [
    {
      name: "Activos",
      key: "active" as const,
      value: active.length,
      color: "#34d399",
    },
    {
      name: "Bajas",
      key: "unsubscribed" as const,
      value: unsubscribed.length,
      color: "#94a3b8",
    },
  ].filter((entry) => entry.value > 0);

  const unsubscribeRate =
    scoped.length > 0
      ? Math.round((unsubscribed.length / scoped.length) * 1000) / 10
      : 0;

  const recentAltas: NewsletterActivityRow[] = [...altas]
    .sort(
      (a, b) =>
        (parseDate(b.createdAt)?.getTime() ?? 0) -
        (parseDate(a.createdAt)?.getTime() ?? 0),
    )
    .slice(0, 8)
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      email: entry.email,
      sources: entry.sources,
      sourceLabels: formatSourceLabels(entry.sources),
      date: entry.createdAt,
    }));

  const recentBajas: NewsletterActivityRow[] = [...bajas]
    .sort(
      (a, b) =>
        (unsubscribeDate(b)?.getTime() ?? 0) -
        (unsubscribeDate(a)?.getTime() ?? 0),
    )
    .slice(0, 8)
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      email: entry.email,
      sources: entry.sources,
      sourceLabels: formatSourceLabels(entry.sources),
      date: entry.unsubscribedAt || entry.updatedAt,
    }));

  const series = buildSeries(filter.range, altas, bajas, now);
  const topOrigin = byOriginShare[0] ?? null;

  return {
    total: scoped.length,
    active: active.length,
    unsubscribed: unsubscribed.length,
    unsubscribeRate,
    altasPeriod: altas.length,
    bajasPeriod: bajas.length,
    netGrowth: altas.length - bajas.length,
    topOrigin,
    byOrigin: byOriginShare,
    originTotal,
    statusMix,
    series,
    recentAltas,
    recentBajas,
  };
}

export function buildNewsletterClickMetrics(events: NewsletterClickEvent[]) {
  const uniqueEmails = new Set(
    events.map((entry) => entry.email.trim().toLowerCase()).filter(Boolean),
  );
  const linkCounts = new Map<string, number>();
  for (const event of events) {
    const key = event.url || "(sin url)";
    linkCounts.set(key, (linkCounts.get(key) ?? 0) + 1);
  }
  const topLinks = [...linkCounts.entries()]
    .map(([url, value]) => ({ url, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const recent = [...events]
    .sort(
      (a, b) =>
        (parseDate(b.clickedAt)?.getTime() ?? 0) -
        (parseDate(a.clickedAt)?.getTime() ?? 0),
    )
    .slice(0, 10);

  return {
    totalClicks: events.length,
    uniqueClickers: uniqueEmails.size,
    topLinks,
    recent,
  };
}
