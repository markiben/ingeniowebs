"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  FolderKanban,
  Inbox,
  MessageCircle,
  MessageSquareText,
  FileText,
  Users,
  AlertCircle,
  Clock3,
} from "lucide-react";
import DashboardAnalytics from "@/components/platform/DashboardAnalytics";
import PlatformSectionHero from "@/components/platform/PlatformSectionHero";
import { buildDashboardOps } from "@/lib/platform/dashboard-ops";
import { inboxPath } from "@/lib/platform/inbox";
import type {
  LiveChatSession,
  PlatformAcquisitionSpend,
  PlatformLead,
  PlatformMessage,
  PlatformProject,
  PlatformProposal,
  PlatformQuote,
  PlatformSupportTicket,
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
  proposals: PlatformProposal[];
  tickets: PlatformSupportTicket[];
  spends: PlatformAcquisitionSpend[];
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
  proposals,
  tickets,
  spends,
}: Props) {
  const [tab, setTab] = useState<"ops" | "metrics">("ops");

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
              aria-selected={tab === "ops"}
              className={`plat-tab${tab === "ops" ? " is-active" : ""}`}
              onClick={() => setTab("ops")}
            >
              Operación
              {ops.counts.inbox + ops.counts.pendingRegister > 0 ? (
                <span className="plat-tab-count is-active-count">
                  {ops.counts.inbox + ops.counts.pendingRegister}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "metrics"}
              className={`plat-tab${tab === "metrics" ? " is-active" : ""}`}
              onClick={() => setTab("metrics")}
            >
              Métricas
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
          proposals={proposals}
          tickets={tickets}
          spends={spends}
        />
      ) : (
        <div className="plat-dashboard-ops">
          <section className="plat-card plat-quote-panel plat-dashboard-hero">
            <div className="plat-dashboard-hero-copy">
              <h2>Hola {greeting}</h2>
              <p>
                {ops.counts.inbox + ops.counts.pendingRegister === 0
                  ? "Nada urgente por ahora. El flujo está al día."
                  : `${ops.counts.inbox + ops.counts.pendingRegister} pendiente${ops.counts.inbox + ops.counts.pendingRegister === 1 ? "" : "s"} de atención inmediata.`}
              </p>
            </div>
            <div className="plat-dashboard-quick">
              <Link href={inboxPath()} className="plat-btn is-ghost">
                <Inbox size={15} />
                Inbox
                {ops.counts.inbox > 0 ? (
                  <span className="plat-dashboard-pill">{ops.counts.inbox}</span>
                ) : null}
              </Link>
              <Link href="/plataforma/cotizador" className="plat-btn is-ghost">
                <Calculator size={15} />
                Cotizador
              </Link>
              <Link href="/plataforma/proyectos" className="plat-btn is-ghost">
                <FolderKanban size={15} />
                Proyectos
              </Link>
              <Link href="/plataforma/clientes" className="plat-btn is-ghost">
                <Users size={15} />
                Clientes
              </Link>
            </div>
          </section>

          <section
            className="plat-dashboard-attention-grid"
            aria-label="Atención inmediata"
          >
            <Link href={inboxPath("formularios")} className="plat-dashboard-kpi">
              <span className="plat-dashboard-kpi-icon">
                <FileText size={16} />
              </span>
              <span className="plat-dashboard-kpi-body">
                <strong>{ops.counts.forms}</strong>
                <span>Formularios nuevos</span>
              </span>
            </Link>
            <Link href={inboxPath("mensajes")} className="plat-dashboard-kpi">
              <span className="plat-dashboard-kpi-icon">
                <MessageSquareText size={16} />
              </span>
              <span className="plat-dashboard-kpi-body">
                <strong>{ops.counts.messages}</strong>
                <span>Mensajes sin leer</span>
              </span>
            </Link>
            <Link href={inboxPath("chat")} className="plat-dashboard-kpi">
              <span className="plat-dashboard-kpi-icon">
                <MessageCircle size={16} />
              </span>
              <span className="plat-dashboard-kpi-body">
                <strong>{ops.counts.chats}</strong>
                <span>Chats pendientes</span>
              </span>
            </Link>
            <Link href="/plataforma/clientes" className="plat-dashboard-kpi">
              <span className="plat-dashboard-kpi-icon">
                <Users size={16} />
              </span>
              <span className="plat-dashboard-kpi-body">
                <strong>{ops.counts.pendingRegister}</strong>
                <span>Sin registro</span>
              </span>
            </Link>
          </section>

          <div className="plat-dashboard-main">
            <section className="plat-card plat-quote-panel plat-dashboard-pipeline">
              <div className="plat-dashboard-section-head">
                <h3>Flujo de trabajo</h3>
                <p>Cotización → proyecto → cliente en plataforma</p>
              </div>
              <ol className="plat-dashboard-pipeline-track">
                <li>
                  <span className="plat-dashboard-pipeline-value">
                    {ops.pipeline.quotesSent}
                  </span>
                  <span className="plat-dashboard-pipeline-label">Enviadas</span>
                </li>
                <li aria-hidden className="plat-dashboard-pipeline-arrow">
                  <ArrowRight size={14} />
                </li>
                <li>
                  <span className="plat-dashboard-pipeline-value">
                    {ops.pipeline.quotesApproved}
                  </span>
                  <span className="plat-dashboard-pipeline-label">Aprobadas</span>
                </li>
                <li aria-hidden className="plat-dashboard-pipeline-arrow">
                  <ArrowRight size={14} />
                </li>
                <li>
                  <span className="plat-dashboard-pipeline-value">
                    {ops.pipeline.inProgress}
                  </span>
                  <span className="plat-dashboard-pipeline-label">En curso</span>
                </li>
                <li aria-hidden className="plat-dashboard-pipeline-arrow">
                  <ArrowRight size={14} />
                </li>
                <li>
                  <span className="plat-dashboard-pipeline-value">
                    {ops.pipeline.inReview}
                  </span>
                  <span className="plat-dashboard-pipeline-label">Revisión</span>
                </li>
                <li aria-hidden className="plat-dashboard-pipeline-arrow">
                  <ArrowRight size={14} />
                </li>
                <li>
                  <span className="plat-dashboard-pipeline-value">
                    {ops.pipeline.completed}
                  </span>
                  <span className="plat-dashboard-pipeline-label">
                    Finalizados
                  </span>
                </li>
              </ol>
              {ops.pipeline.pendingRegister > 0 ? (
                <p className="plat-dashboard-pipeline-note">
                  {ops.pipeline.pendingRegister} proyecto
                  {ops.pipeline.pendingRegister === 1 ? "" : "s"} abierto
                  {ops.pipeline.pendingRegister === 1 ? "" : "s"} sin cliente
                  registrado.
                </p>
              ) : null}
            </section>

            <aside className="plat-card plat-quote-panel plat-dashboard-attention">
              <div className="plat-dashboard-section-head">
                <h3>
                  <AlertCircle size={16} /> Requiere atención
                </h3>
                <p>Lo que bloquea o espera tu acción</p>
              </div>
              {ops.attention.length === 0 ? (
                <p className="plat-dashboard-empty">Sin pendientes críticos.</p>
              ) : (
                <ul className="plat-dashboard-feed">
                  {ops.attention.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        className={`plat-dashboard-feed-item ${toneClass(item.tone)}`}
                      >
                        <span className="plat-dashboard-feed-main">
                          <strong>{item.title}</strong>
                          <span>{item.detail}</span>
                        </span>
                        {item.when ? (
                          <time className="plat-dashboard-feed-when">
                            {item.when}
                          </time>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </aside>

            <section className="plat-card plat-quote-panel plat-dashboard-recent">
              <div className="plat-dashboard-section-head">
                <h3>
                  <Clock3 size={16} /> Actividad reciente
                </h3>
                <p>Últimos movimientos de cotizaciones y proyectos</p>
              </div>
              {ops.recent.length === 0 ? (
                <p className="plat-dashboard-empty">
                  Todavía no hay actividad registrada.
                </p>
              ) : (
                <ul className="plat-dashboard-feed">
                  {ops.recent.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        className="plat-dashboard-feed-item"
                      >
                        <span className="plat-dashboard-feed-main">
                          <strong>{item.title}</strong>
                          <span>{item.meta}</span>
                        </span>
                        {item.when ? (
                          <time className="plat-dashboard-feed-when">
                            {item.when}
                          </time>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
