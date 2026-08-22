"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ChevronDown,
  MousePointerClick,
  TrendingDown,
  TrendingUp,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { usePlatformTheme } from "@/components/platform/PlatformThemeContext";
import { NEWSLETTER_SOURCE_LABEL } from "@/lib/platform/newsletter";
import {
  NEWSLETTER_RANGE_LABEL,
  buildNewsletterClickMetrics,
  buildNewsletterMetrics,
  type NewsletterMetricsRange,
} from "@/lib/platform/newsletter-analytics";
import { chartTheme } from "@/lib/platform/chart-theme";
import type {
  NewsletterClickEvent,
  NewsletterSource,
  NewsletterSubscriber,
} from "@/lib/platform/types";

type MenuKey = "range" | "source" | null;

function MenuSelect({
  label,
  valueLabel,
  open,
  onToggle,
  children,
}: {
  label: string;
  valueLabel: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="plat-filter-select">
      <span>{label}</span>
      <div className="plat-menu">
        <button
          type="button"
          className={`plat-menu-trigger${open ? " is-open" : ""}`}
          aria-expanded={open}
          aria-haspopup="listbox"
          onClick={onToggle}
        >
          <span>{valueLabel}</span>
          <ChevronDown size={14} />
        </button>
        {open ? (
          <div className="plat-menu-panel" role="listbox">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function formatShortDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function KpiCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: ReactNode;
}) {
  return (
    <div className="plat-news-kpi">
      <div className="plat-news-kpi-top">
        <p className="plat-metric-sub">{label}</p>
        <span className="plat-news-kpi-icon" aria-hidden>
          {icon}
        </span>
      </div>
      <p className="plat-metric">{value}</p>
      {hint ? <small className="plat-news-kpi-hint">{hint}</small> : null}
    </div>
  );
}

export default function NewsletterMetrics({
  subscribers,
  clicks = [],
}: {
  subscribers: NewsletterSubscriber[];
  clicks?: NewsletterClickEvent[];
}) {
  const chart = chartTheme(usePlatformTheme());
  const [range, setRange] = useState<NewsletterMetricsRange>("30d");
  const [source, setSource] = useState<"all" | NewsletterSource>("all");
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenu) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpenMenu(null);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenMenu(null);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openMenu]);

  const metrics = useMemo(
    () => buildNewsletterMetrics(subscribers, { range, source }),
    [subscribers, range, source],
  );
  const clickMetrics = useMemo(
    () => buildNewsletterClickMetrics(clicks),
    [clicks],
  );

  const sourceLabel =
    source === "all" ? "Todos" : NEWSLETTER_SOURCE_LABEL[source];

  return (
    <div ref={rootRef} className="plat-newsletter-metrics">
      <div className="plat-news-kpi-grid">
        <KpiCard
          label="Total"
          value={metrics.total}
          icon={<Users size={15} />}
        />
        <KpiCard
          label="Activos"
          value={metrics.active}
          icon={<UserPlus size={15} />}
        />
        <KpiCard
          label="Bajas"
          value={metrics.unsubscribed}
          hint={`${metrics.unsubscribeRate}% del total`}
          icon={<UserMinus size={15} />}
        />
        <KpiCard
          label="Altas del período"
          value={metrics.altasPeriod}
          icon={<TrendingUp size={15} />}
        />
        <KpiCard
          label="Bajas del período"
          value={metrics.bajasPeriod}
          icon={<TrendingDown size={15} />}
        />
        <KpiCard
          label="Crecimiento neto"
          value={
            metrics.netGrowth > 0
              ? `+${metrics.netGrowth}`
              : String(metrics.netGrowth)
          }
          hint={NEWSLETTER_RANGE_LABEL[range]}
          icon={<TrendingUp size={15} />}
        />
        <KpiCard
          label="Origen top"
          value={metrics.topOrigin?.name ?? "—"}
          hint={
            metrics.topOrigin
              ? `${metrics.topOrigin.value} · ${metrics.topOrigin.percent}%`
              : "Sin altas en el período"
          }
          icon={<Users size={15} />}
        />
        <KpiCard
          label="Clics campaña"
          value={clickMetrics.totalClicks}
          hint={
            clickMetrics.totalClicks
              ? `${clickMetrics.uniqueClickers} personas`
              : "Tracking aún no activo"
          }
          icon={<MousePointerClick size={15} />}
        />
      </div>

      <div className="plat-news-metrics-toolbar">
        <MenuSelect
          label="Período"
          valueLabel={NEWSLETTER_RANGE_LABEL[range]}
          open={openMenu === "range"}
          onToggle={() =>
            setOpenMenu((current) => (current === "range" ? null : "range"))
          }
        >
          {(Object.keys(NEWSLETTER_RANGE_LABEL) as NewsletterMetricsRange[]).map(
            (value) => (
              <button
                key={value}
                type="button"
                className={`plat-menu-item${range === value ? " is-active" : ""}`}
                onClick={() => {
                  setRange(value);
                  setOpenMenu(null);
                }}
              >
                {NEWSLETTER_RANGE_LABEL[value]}
              </button>
            ),
          )}
        </MenuSelect>

        <MenuSelect
          label="Origen"
          valueLabel={sourceLabel}
          open={openMenu === "source"}
          onToggle={() =>
            setOpenMenu((current) => (current === "source" ? null : "source"))
          }
        >
          <button
            type="button"
            className={`plat-menu-item${source === "all" ? " is-active" : ""}`}
            onClick={() => {
              setSource("all");
              setOpenMenu(null);
            }}
          >
            Todos
          </button>
          {(Object.keys(NEWSLETTER_SOURCE_LABEL) as NewsletterSource[]).map(
            (entry) => (
              <button
                key={entry}
                type="button"
                className={`plat-menu-item${source === entry ? " is-active" : ""}`}
                onClick={() => {
                  setSource(entry);
                  setOpenMenu(null);
                }}
              >
                {NEWSLETTER_SOURCE_LABEL[entry]}
              </button>
            ),
          )}
        </MenuSelect>
      </div>

      <div className="plat-news-metrics-charts">
        <div className="plat-card plat-chart-card">
          <h3>Altas y bajas en el tiempo</h3>
          <div className="plat-chart-wrap">
            {metrics.series.some((entry) => entry.altas || entry.bajas) ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={metrics.series}>
                  <CartesianGrid stroke={chart.grid} vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: chart.tick, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: chart.tick, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: chart.cursorFill, radius: 8 }}
                    contentStyle={{
                      background: chart.tooltipBg,
                      border: `1px solid ${chart.tooltipBorder}`,
                      color: chart.tooltipColor,
                      borderRadius: 12,
                    }}
                    labelStyle={{ color: chart.tooltipColor }}
                    itemStyle={{ color: chart.tooltipColor }}
                  />
                  <Legend wrapperStyle={{ color: chart.legend }} />
                  <Bar
                    dataKey="altas"
                    name="Altas"
                    fill="#7dd3fc"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="bajas"
                    name="Bajas"
                    fill="#94a3b8"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="plat-chart-empty">Sin datos para este período.</p>
            )}
          </div>
        </div>

        <div className="plat-card plat-chart-card">
          <h3>Captación por origen</h3>
          <div className="plat-chart-wrap">
            {metrics.originTotal > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={metrics.byOrigin}
                  layout="vertical"
                  margin={{ left: 8, right: 12 }}
                >
                  <CartesianGrid stroke={chart.grid} horizontal={false} />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fill: chart.tick, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={108}
                    tick={{ fill: chart.tick, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: chart.cursorFill, radius: 8 }}
                    formatter={(value: number | string) => [
                      String(value),
                      "Altas",
                    ]}
                    contentStyle={{
                      background: chart.tooltipBg,
                      border: `1px solid ${chart.tooltipBorder}`,
                      color: chart.tooltipColor,
                      borderRadius: 12,
                    }}
                    labelStyle={{ color: chart.tooltipColor }}
                    itemStyle={{ color: chart.tooltipColor }}
                  />
                  <Bar dataKey="value" name="Altas" radius={[0, 6, 6, 0]}>
                    {metrics.byOrigin.map((entry) => (
                      <Cell key={entry.source} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="plat-chart-empty">
                Sin captaciones en este período.
              </p>
            )}
          </div>
        </div>

        <div className="plat-card plat-chart-card">
          <h3>Estado de la base</h3>
          <div className="plat-chart-wrap">
            {metrics.statusMix.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={metrics.statusMix}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={88}
                    paddingAngle={3}
                  >
                    {metrics.statusMix.map((entry) => (
                      <Cell key={entry.key} fill={entry.color} />
                    ))}
                  </Pie>
                  <text
                    x="50%"
                    y="46%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={chart.tick}
                    fontSize="11"
                  >
                    Total
                  </text>
                  <text
                    x="50%"
                    y="56%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={chart.pieLabel}
                    fontSize="20"
                    fontWeight="700"
                  >
                    {metrics.total}
                  </text>
                  <Tooltip
                    contentStyle={{
                      background: chart.tooltipBg,
                      border: `1px solid ${chart.tooltipBorder}`,
                      color: chart.tooltipColor,
                      borderRadius: 12,
                    }}
                    labelStyle={{ color: chart.tooltipColor }}
                    itemStyle={{ color: chart.tooltipColor }}
                  />
                  <Legend wrapperStyle={{ color: chart.legend }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="plat-chart-empty">Sin contactos en la base.</p>
            )}
          </div>
        </div>

        <div className="plat-card plat-chart-card plat-news-clicks-card">
          <h3>Clics de campaña</h3>
          {clickMetrics.totalClicks > 0 ? (
            <div className="plat-news-clicks-body">
              <div className="plat-news-clicks-stats">
                <div>
                  <p className="plat-metric-sub">Clics</p>
                  <p className="plat-metric">{clickMetrics.totalClicks}</p>
                </div>
                <div>
                  <p className="plat-metric-sub">Personas</p>
                  <p className="plat-metric">{clickMetrics.uniqueClickers}</p>
                </div>
              </div>
              <ul className="plat-news-clicks-links">
                {clickMetrics.topLinks.map((link) => (
                  <li key={link.url}>
                    <span title={link.url}>{link.url}</span>
                    <strong>{link.value}</strong>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="plat-news-clicks-empty">
              <MousePointerClick size={22} aria-hidden />
              <p>
                Todavía no hay campañas rastreadas. Cuando actives el tracking,
                acá verás quién hizo click y desde qué link.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="plat-news-activity-grid">
        <section className="plat-card plat-news-activity">
          <header>
            <h3>Altas recientes</h3>
            <span>{metrics.recentAltas.length}</span>
          </header>
          {metrics.recentAltas.length === 0 ? (
            <p className="plat-chart-empty">Sin altas en este período.</p>
          ) : (
            <div className="plat-quote-list-scroll plat-news-activity-scroll">
              <table className="plat-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Origen</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.recentAltas.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name}</td>
                      <td>{row.email}</td>
                      <td>{row.sourceLabels}</td>
                      <td>{formatShortDate(row.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="plat-card plat-news-activity">
          <header>
            <h3>Bajas recientes</h3>
            <span>{metrics.recentBajas.length}</span>
          </header>
          {metrics.recentBajas.length === 0 ? (
            <p className="plat-chart-empty">Sin bajas en este período.</p>
          ) : (
            <div className="plat-quote-list-scroll plat-news-activity-scroll">
              <table className="plat-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Origen</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.recentBajas.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name}</td>
                      <td>{row.email}</td>
                      <td>{row.sourceLabels}</td>
                      <td>{formatShortDate(row.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
