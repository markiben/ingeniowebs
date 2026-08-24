"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Inbox,
  MessageCircle,
  MessageSquareText,
} from "lucide-react";
import DashboardAnalytics from "@/components/platform/DashboardAnalytics";
import PlatformSectionHero from "@/components/platform/PlatformSectionHero";
import { buildDashboardOps } from "@/lib/platform/dashboard-ops";
import { inboxPath } from "@/lib/platform/inbox";
import type {
  LiveChatSession,
  PlatformLead,
  PlatformMessage,
  PlatformProject,
  PlatformQuote,
  PlatformUser,
} from "@/lib/platform/types";

type Props = {
  name: string;
  quotes: PlatformQuote[];
  projects: PlatformProject[];
  clients: PlatformUser[];
  leads: PlatformLead[];
  messages: PlatformMessage[];
  liveChats: LiveChatSession[];
};

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name || "equipo";
}

function toneClass(tone: "urgent" | "warn" | "info") {
  if (tone === "urgent") return "is-urgent";
  if (tone === "warn") return "is-warn";
  return "is-info";
}

export default function AdminDashboard({
  name,
  quotes,
  projects,
  clients,
  leads,
  messages,
  liveChats,
}: Props) {
  const [tab, setTab] = useState<"ops" | "metrics">("metrics");
  const [feedTab, setFeedTab] = useState<"attention" | "recent">("attention");

  const ops = useMemo(
    () =>
      buildDashboardOps({
        quotes,
        projects,
        clients,
        leads,
        messages,
        liveChats,
      }),
    [quotes, projects, clients, leads, messages, liveChats],
  );

  const greeting = firstName(name);
  const urgentTotal = ops.counts.inbox + ops.counts.pendingRegister;

  const inboxRows = [
    {
      href: inboxPath("formularios"),
      icon: FileText,
      value: ops.counts.forms,
      label: "Formularios nuevos",
    },
    {
      href: inboxPath("mensajes"),
      icon: MessageSquareText,
      value: ops.counts.messages,
      label: "Mensajes sin leer",
    },
    {
      href: inboxPath("chat"),
      icon: MessageCircle,
      value: ops.counts.chats,
      label: "Chats pendientes",
    },
  ] as const;

  return (
    <div className="plat-dashboard-hub">
      <PlatformSectionHero
        title={`Hola, ${greeting}`}
        subtitle="Control del flujo: inbox, cotizaciones, proyectos y clientes."
        tabs={
          <div className="plat-tabs" role="tablist" aria-label="Dashboard">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "metrics"}
              className={`plat-tab${tab === "metrics" ? " is-active" : ""}`}
              onClick={() => setTab("metrics")}
            >
              Métricas
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "ops"}
              className={`plat-tab${tab === "ops" ? " is-active" : ""}`}
              onClick={() => setTab("ops")}
            >
              Operación
              {urgentTotal > 0 ? (
                <span className="plat-tab-count is-active-count">{urgentTotal}</span>
              ) : null}
            </button>
          </div>
        }
      />

      {tab === "metrics" ? (
        <DashboardAnalytics
          projects={projects}
          leads={leads}
          messages={messages}
          clients={clients}
        />
      ) : (
        <div className="plat-ops">
          <section className="plat-card plat-quote-panel plat-ops-inbox">
            <header className="plat-ops-inbox-head">
              <h3>
                <Inbox size={17} strokeWidth={2} />
                Inbox
              </h3>
              <Link href={inboxPath()} className="plat-ops-inbox-link">
                Ver todo
                <ArrowRight size={14} />
              </Link>
            </header>
            <div className="plat-ops-inbox-rows">
              {inboxRows.map((row) => {
                const Icon = row.icon;
                return (
                  <Link
                    key={row.label}
                    href={row.href}
                    className={`plat-ops-inbox-row${row.value > 0 ? " has-count" : ""}`}
                  >
                    <span className="plat-ops-inbox-row-icon">
                      <Icon size={16} strokeWidth={2} />
                    </span>
                    <span className="plat-ops-inbox-row-label">{row.label}</span>
                    <strong className="plat-ops-inbox-row-value">{row.value}</strong>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="plat-card plat-quote-panel plat-ops-feed-panel">
            <div className="plat-ops-feed-tabs" role="tablist" aria-label="Actividad">
              <button
                type="button"
                role="tab"
                aria-selected={feedTab === "attention"}
                className={`plat-ops-feed-tab${feedTab === "attention" ? " is-active" : ""}`}
                onClick={() => setFeedTab("attention")}
              >
                Requiere atención
                {ops.attention.length > 0 ? (
                  <span className="plat-ops-feed-tab-count">{ops.attention.length}</span>
                ) : null}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={feedTab === "recent"}
                className={`plat-ops-feed-tab${feedTab === "recent" ? " is-active" : ""}`}
                onClick={() => setFeedTab("recent")}
              >
                Actividad reciente
              </button>
            </div>

            <div className="plat-ops-feed-scroll">
              {feedTab === "attention" ? (
                ops.attention.length === 0 ? (
                  <p className="plat-ops-empty">Sin pendientes críticos.</p>
                ) : (
                  <ul className="plat-ops-feed">
                    {ops.attention.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          className={`plat-ops-feed-item ${toneClass(item.tone)}`}
                        >
                          <span className="plat-ops-feed-main">
                            <strong>{item.title}</strong>
                            <span>{item.detail}</span>
                          </span>
                          {item.when ? (
                            <time className="plat-ops-feed-when">{item.when}</time>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )
              ) : ops.recent.length === 0 ? (
                <p className="plat-ops-empty">Todavía no hay actividad registrada.</p>
              ) : (
                <ul className="plat-ops-feed">
                  {ops.recent.map((item) => (
                    <li key={item.id}>
                      <Link href={item.href} className="plat-ops-feed-item">
                        <span className="plat-ops-feed-main">
                          <strong>{item.title}</strong>
                          <span>{item.meta}</span>
                        </span>
                        {item.when ? (
                          <time className="plat-ops-feed-when">{item.when}</time>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
