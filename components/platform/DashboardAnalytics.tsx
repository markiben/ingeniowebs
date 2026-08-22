"use client";

import { useEffect, useMemo, useState } from "react";
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
  PlatformAcquisitionSpend,
  PlatformLead,
  PlatformMessage,
  PlatformProject,
  PlatformProposal,
  PlatformSupportTicket,
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

export default function DashboardAnalytics({
  projects,
  leads,
  messages,
  clients,
  proposals,
  tickets,
  spends,
}: {
  projects: PlatformProject[];
  leads: PlatformLead[];
  messages: PlatformMessage[];
  clients: PlatformUser[];
  proposals: PlatformProposal[];
  tickets: PlatformSupportTicket[];
  spends: PlatformAcquisitionSpend[];
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
        proposals,
        tickets,
        spends,
        filter,
      ),
    [
      projects,
      leads,
      messages,
      clients,
      proposals,
      tickets,
      spends,
      range,
      year,
      month,
      day,
    ],
  );

  return (
    <div className="plat-analytics plat-dashboard-metrics">
      <div className="plat-filter-bar plat-dashboard-metrics-filters">
        <div className="plat-filter-group" role="group" aria-label="Periodo">
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
              className={`plat-filter-chip${range === value ? " is-active" : ""}`}
              onClick={() => setRange(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {range === "year" ? (
          <label className="plat-filter-select">
            Año
            <select
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
            >
              {analytics.availableYears.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {range === "month" ? (
          <>
            <label className="plat-filter-select">
              Año
              <select
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
              >
                {analytics.availableYears.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </label>
            <label className="plat-filter-select">
              Mes
              <select
                value={month}
                onChange={(event) => setMonth(Number(event.target.value))}
              >
                {MONTH_LABELS.map((label, index) => (
                  <option key={label} value={index}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}

        {range === "day" ? (
          <PlatformDatePicker
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

      <div className="plat-grid stats plat-dashboard-metrics-grid">
        <div className="plat-dash-metric">
          <p className="plat-metric-sub">Clientes</p>
          <p className="plat-metric">{analytics.cards.clients}</p>
        </div>
        <div className="plat-dash-metric">
          <p className="plat-metric-sub">Facturado USD</p>
          <p className="plat-metric">
            {money(analytics.cards.billedUsd, "USD")}
          </p>
          <p className="plat-metric-sub">
            {money(analytics.cards.billedArs, "ARS")}
          </p>
        </div>
        <div className="plat-dash-metric">
          <p className="plat-metric-sub">Devuelto</p>
          <p className="plat-metric">
            {money(analytics.cards.refundedUsd, "USD")}
          </p>
          <p className="plat-metric-sub">
            {money(analytics.cards.refundedArs, "ARS")}
          </p>
        </div>
        <div className="plat-dash-metric">
          <p className="plat-metric-sub">Neto</p>
          <p className="plat-metric">
            {money(analytics.cards.netUsd, "USD")}
          </p>
          <p className="plat-metric-sub">
            {money(analytics.cards.netArs, "ARS")}
          </p>
        </div>
        <div className="plat-dash-metric">
          <p className="plat-metric-sub">Ticket promedio</p>
          <p className="plat-metric">
            {money(analytics.cards.avgTicketUsd, "USD")}
          </p>
        </div>
        <div className="plat-dash-metric">
          <p className="plat-metric-sub">Horas estimadas</p>
          <p className="plat-metric">
            {analytics.cards.hoursEstimated.toFixed(0)}h
          </p>
          <p className="plat-metric-sub">
            {analytics.cards.hoursInvested.toFixed(0)}h invertidas
          </p>
        </div>
        <div className="plat-dash-metric">
          <p className="plat-metric-sub">Sobre horas (fijo)</p>
          <p className="plat-metric">{analytics.cards.fixedOverBudget}</p>
          <p className="plat-metric-sub">
            Riesgo {money(analytics.cards.marginAtRiskUsd, "USD")}
          </p>
        </div>
        <div className="plat-dash-metric">
          <p className="plat-metric-sub">Formularios → clientes</p>
          <p className="plat-metric">
            {percent(analytics.cards.leadConversion)}
          </p>
        </div>
      </div>

      <div className="plat-charts">
        <div className="plat-card plat-quote-panel plat-chart-card">
          <h3>Volumen y neto</h3>
          <div className="plat-chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={analytics.volumeSeries}>
                <CartesianGrid stroke={chart.grid} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: chart.tick, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: chart.tick, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
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
                  contentStyle={{
                    background: chart.tooltipBg,
                    border: `1px solid ${chart.tooltipBorder}`,
                    color: chart.tooltipColor,
                    borderRadius: 12,
                  }}
                  formatter={(value, name) => {
                    const numeric =
                      typeof value === "number" ? value : Number(value) || 0;
                    if (name === "valor") return [money(numeric), "Neto"];
                    return [numeric, "Proyectos"];
                  }}
                />
                <Legend wrapperStyle={{ color: chart.legend }} />
                <Bar
                  yAxisId="left"
                  dataKey="proyectos"
                  name="Proyectos"
                  fill="#7dd3fc"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  yAxisId="right"
                  dataKey="valor"
                  name="Neto"
                  fill="#1b75bb"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="plat-card plat-quote-panel plat-chart-card">
          <h3>Estado de proyectos</h3>
          <div className="plat-chart-wrap">
            {analytics.statusTotal > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={240}>
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
      </div>

      <div className="plat-card plat-quote-panel plat-chart-card">
        <h3>Horas estimadas vs. invertidas</h3>
        <div className="plat-chart-wrap">
          {analytics.hoursSeries.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={analytics.hoursSeries}>
                <CartesianGrid stroke={chart.grid} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: chart.tick, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: chart.tick, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: chart.tooltipBg,
                    border: `1px solid ${chart.tooltipBorder}`,
                    color: chart.tooltipColor,
                    borderRadius: 12,
                  }}
                />
                <Legend wrapperStyle={{ color: chart.legend }} />
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
  );
}
