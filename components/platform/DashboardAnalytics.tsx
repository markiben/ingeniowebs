"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartLegend from "@/components/platform/ChartLegend";
import PlatformDatePicker from "@/components/platform/PlatformDatePicker";
import { usePlatformTheme } from "@/components/platform/PlatformThemeContext";
import {
  MONTH_LABELS,
  buildAnalytics,
  daysInMonth,
  type AnalyticsFilter,
  type AnalyticsRange,
} from "@/lib/platform/analytics";
import { chartTheme } from "@/lib/platform/chart-theme";
import type {
  PlatformLead,
  PlatformMessage,
  PlatformProject,
  PlatformUser,
} from "@/lib/platform/types";

function money(value: number, currency: "USD" | "ARS" = "USD") {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function percent(value: number) {
  return `${value.toFixed(1)}%`;
}

/**
 * Secondary ARS line under a USD headline figure.
 *
 * es-AR formats ARS as a bare "$", so under a "Facturado USD" label the
 * second line read as an unlabelled "$ 0" that looked like a broken USD
 * value rather than pesos. Prefix the currency explicitly, and drop the
 * line altogether when there's nothing in pesos to report — an empty
 * row is noise on a phone, not information.
 */
function ArsSubtotal({ value }: { value: number }) {
  if (!value) return null;
  return <p className="plat-metric-sub">AR{money(value, "ARS")}</p>;
}

function MetricsMenuSelect({
  ariaLabel,
  value,
  options,
  onChange,
}: {
  ariaLabel: string;
  value: number;
  options: { value: number; label: string }[];
  onChange: (value: number) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="plat-filter-select is-label-hidden plat-metrics-menu"
    >
      <div className="plat-menu">
        <button
          type="button"
          className={`plat-menu-trigger is-compact${open ? " is-open" : ""}`}
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-haspopup="listbox"
          onClick={() => setOpen((current) => !current)}
        >
          <span>{selected?.label ?? "—"}</span>
          <ChevronDown size={14} />
        </button>
        {open ? (
          <div className="plat-menu-panel" role="listbox" aria-label={ariaLabel}>
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                className={`plat-menu-item${option.value === value ? " is-active" : ""}`}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function DashboardAnalytics({
  projects,
  leads,
  messages,
  clients,
}: {
  projects: PlatformProject[];
  leads: PlatformLead[];
  messages: PlatformMessage[];
  clients: PlatformUser[];
}) {
  const chart = chartTheme(usePlatformTheme());
  const now = new Date();
  const [range, setRange] = useState<AnalyticsRange>("general");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [day, setDay] = useState(now.getDate());

  const maxDay = daysInMonth(year, month);

  useEffect(() => {
    if (day > maxDay) setDay(maxDay);
  }, [day, maxDay]);

  const filter: AnalyticsFilter = { range, year, month, day };

  const analytics = useMemo(
    () =>
      buildAnalytics(
        projects,
        leads,
        messages,
        clients,
        filter,
      ),
    [
      projects,
      leads,
      messages,
      clients,
      range,
      year,
      month,
      day,
    ],
  );

  return (
    <div className="plat-analytics plat-dashboard-metrics">
      <div className="plat-section-hero-tabs plat-dashboard-metrics-filters">
        <div className="plat-dashboard-metrics-filters-row">
          <div
            className="plat-tabs plat-dashboard-metrics-tabs"
            role="tablist"
            aria-label="Periodo"
          >
            {(
              [
                ["general", "General"],
                ["year", "Por año"],
                ["month", "Por mes"],
                ["day", "Por fecha"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={range === value}
                className={`plat-tab${range === value ? " is-active" : ""}`}
                onClick={() => setRange(value)}
              >
                {label}
              </button>
            ))}
          </div>

          {range !== "general" ? (
            <div className="plat-dashboard-metrics-controls">
              {range === "year" ? (
                <MetricsMenuSelect
                  ariaLabel="Año"
                  value={year}
                  options={analytics.availableYears.map((entry) => ({
                    value: entry,
                    label: String(entry),
                  }))}
                  onChange={setYear}
                />
              ) : null}

              {range === "month" ? (
                <>
                  <MetricsMenuSelect
                    ariaLabel="Año"
                    value={year}
                    options={analytics.availableYears.map((entry) => ({
                      value: entry,
                      label: String(entry),
                    }))}
                    onChange={setYear}
                  />
                  <MetricsMenuSelect
                    ariaLabel="Mes"
                    value={month}
                    options={MONTH_LABELS.map((label, index) => ({
                      value: index,
                      label,
                    }))}
                    onChange={setMonth}
                  />
                </>
              ) : null}

              {range === "day" ? (
                <PlatformDatePicker
                  className="plat-metrics-date"
                  hideLabel
                  value={{ year, month, day: Math.min(day, maxDay) }}
                  years={analytics.availableYears}
                  onChange={(next) => {
                    setYear(next.year);
                    setMonth(next.month);
                    setDay(next.day);
                  }}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="plat-dashboard-metrics-body">
      <div className="plat-news-kpi-grid plat-dashboard-metrics-grid">
        <div className="plat-news-kpi">
          <p className="plat-metric-sub">Clientes</p>
          <p className="plat-metric">{analytics.cards.clients}</p>
        </div>
        <div className="plat-news-kpi">
          <p className="plat-metric-sub">Facturado USD</p>
          <p className="plat-metric">
            {money(analytics.cards.billedUsd, "USD")}
          </p>
          <ArsSubtotal value={analytics.cards.billedArs} />
        </div>
        <div className="plat-news-kpi">
          <p className="plat-metric-sub">Devuelto</p>
          <p className="plat-metric">
            {money(analytics.cards.refundedUsd, "USD")}
          </p>
          <ArsSubtotal value={analytics.cards.refundedArs} />
        </div>
        <div className="plat-news-kpi">
          <p className="plat-metric-sub">Neto</p>
          <p className="plat-metric">
            {money(analytics.cards.netUsd, "USD")}
          </p>
          <ArsSubtotal value={analytics.cards.netArs} />
        </div>
        <div className="plat-news-kpi">
          <p className="plat-metric-sub">Ticket promedio</p>
          <p className="plat-metric">
            {money(analytics.cards.avgTicketUsd, "USD")}
          </p>
        </div>
        <div className="plat-news-kpi">
          <p className="plat-metric-sub">Horas estimadas</p>
          <p className="plat-metric">
            {analytics.cards.hoursEstimated.toFixed(0)}h
          </p>
          <p className="plat-metric-sub">
            {analytics.cards.hoursInvested.toFixed(0)}h invertidas
          </p>
        </div>
        <div className="plat-news-kpi">
          <p className="plat-metric-sub">Sobre horas (fijo)</p>
          <p className="plat-metric">{analytics.cards.fixedOverBudget}</p>
          <p className="plat-metric-sub">
            Riesgo {money(analytics.cards.marginAtRiskUsd, "USD")}
          </p>
        </div>
        <div className="plat-news-kpi">
          <p className="plat-metric-sub">Formularios → clientes</p>
          <p className="plat-metric">
            {percent(analytics.cards.leadConversion)}
          </p>
        </div>
      </div>

      <div className="plat-charts plat-dashboard-metrics-charts">
        <div className="plat-card plat-quote-panel plat-chart-card">
          <h3>Volumen y neto</h3>
          <div className="plat-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.volumeSeries}>
                <CartesianGrid stroke={chart.grid} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: chart.tick, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  width={26}
                  tick={{ fill: chart.tick, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  width={52}
                  tick={{ fill: chart.tick, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) =>
                    `$${Number(value).toLocaleString("es-AR", {
                      maximumFractionDigits: 0,
                    })}`
                  }
                />
                <Tooltip
                  cursor={{ fill: chart.cursorFill }}
                  contentStyle={{
                    background: chart.tooltipBg,
                    border: `1px solid ${chart.tooltipBorder}`,
                    color: chart.tooltipColor,
                    borderRadius: 12,
                  }}
                  labelStyle={{ color: chart.tooltipColor }}
                  itemStyle={{ color: chart.tooltipColor }}
                  formatter={(value, name) => {
                    const numeric =
                      typeof value === "number" ? value : Number(value) || 0;
                    if (name === "Neto" || name === "valor") {
                      return [money(numeric), "Neto"];
                    }
                    return [numeric, "Proyectos"];
                  }}
                />
                <Legend
                  content={<ChartLegend />}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="proyectos"
                  name="Proyectos"
                  stroke="#7dd3fc"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#7dd3fc", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="valor"
                  name="Neto"
                  stroke="#1b75bb"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#1b75bb", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="plat-card plat-quote-panel plat-chart-card">
          <h3>Estado de proyectos</h3>
          <div className="plat-chart-wrap">
            {analytics.statusTotal > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.statusSeries.filter(
                        (entry) => entry.value > 0,
                      )}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={95}
                      paddingAngle={3}
                    >
                      {analytics.statusSeries
                        .filter((entry) => entry.value > 0)
                        .map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
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
                      y="58%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={chart.pieLabel}
                      fontSize="22"
                      fontWeight="650"
                    >
                      {analytics.statusTotal}
                    </text>
                    <Tooltip
                      contentStyle={{
                        background: chart.tooltipBg,
                        border: `1px solid ${chart.tooltipBorder}`,
                        color: chart.tooltipColor,
                        borderRadius: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="plat-status-legend">
                  {analytics.statusSeries.map((entry) => (
                    <li key={entry.name}>
                      <span style={{ background: entry.color }} />
                      {entry.name}
                      <strong>{entry.value}</strong>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="plat-chart-empty">Sin datos para este período.</p>
            )}
          </div>
        </div>

        <div className="plat-card plat-quote-panel plat-chart-card">
          <h3>Horas estimadas vs. invertidas</h3>
          <div className="plat-chart-wrap">
            {analytics.hoursSeries.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.hoursSeries}>
                  <CartesianGrid stroke={chart.grid} vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: chart.tick, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    width={30}
                    tick={{ fill: chart.tick, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
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
                  <Legend content={<ChartLegend />} />
                  <Bar
                    dataKey="estimadas"
                    name="Estimadas"
                    fill="#7dd3fc"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="invertidas"
                    name="Invertidas"
                    fill="#fcd34d"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="plat-chart-empty">
                Cargá horas estimadas/invertidas en los proyectos para ver este
                gráfico.
              </p>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
