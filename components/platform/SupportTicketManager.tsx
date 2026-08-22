"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createSupportTicketAction,
  updateSupportTicketStatusAction,
} from "@/lib/platform/actions";
import { refreshPlatform } from "@/lib/platform/client-refresh";
import type {
  PlatformProject,
  PlatformSupportTicket,
  SupportTicketStatus,
} from "@/lib/platform/types";

const STATUSES: SupportTicketStatus[] = [
  "open",
  "in_progress",
  "resolved",
  "closed",
];

export default function SupportTicketManager({
  tickets,
  projects,
}: {
  tickets: PlatformSupportTicket[];
  projects: PlatformProject[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const maintenanceProjects = projects.filter(
    (project) => project.maintenancePlan,
  );

  return (
    <div className="plat-analytics">
      <form
        className="plat-card plat-form"
        action={(formData) => {
          startTransition(async () => {
            setError("");
            const result = await createSupportTicketAction(formData);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            refreshPlatform(router);
          });
        }}
      >
        <h3>Nuevo ticket de soporte</h3>
        <div
          style={{
            display: "grid",
            gap: "0.85rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))",
          }}
        >
          <label>
            Título
            <input
              name="title"
              required
              placeholder="Actualizar plugin / Cambiar banner"
            />
          </label>
          <label>
            Cliente
            <input name="clientName" required />
          </label>
          <label>
            Email
            <input type="email" name="clientEmail" />
          </label>
          <label>
            Proyecto
            <select name="projectId" defaultValue="">
              <option value="">Sin proyecto</option>
              {maintenanceProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.code} · {project.name}
                </option>
              ))}
              {projects
                .filter((project) => !project.maintenancePlan)
                .map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.code} · {project.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Categoría
            <input name="category" defaultValue="mantenimiento" />
          </label>
          <label>
            Prioridad
            <select name="priority" defaultValue="medium">
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </label>
        </div>
        <label>
          Descripción
          <textarea name="description" placeholder="Detalle del pedido..." />
        </label>
        {error ? <p className="plat-error">{error}</p> : null}
        <button className="plat-btn" type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Crear ticket"}
        </button>
      </form>

      <div className="plat-card">
        <div style={{ overflowX: "auto" }}>
          <table className="plat-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Cliente</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td>
                    <strong>{ticket.title}</strong>
                    <div style={{ opacity: 0.45, fontSize: "0.75rem" }}>
                      {ticket.category}
                    </div>
                  </td>
                  <td>{ticket.clientName}</td>
                  <td>
                    <span
                      className={`plat-badge${
                        ticket.priority === "high" ? " is-warn" : ""
                      }`}
                    >
                      {ticket.priority}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`plat-badge${
                        ticket.status === "resolved" ||
                        ticket.status === "closed"
                          ? " is-done"
                          : ""
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {STATUSES.map((status) => (
                        <button
                          key={status}
                          type="button"
                          className="plat-btn is-ghost"
                          disabled={pending || ticket.status === status}
                          onClick={() =>
                            startTransition(async () => {
                              await updateSupportTicketStatusAction(
                                ticket.id,
                                status,
                              );
                              refreshPlatform(router);
                            })
                          }
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={5}>No hay tickets de soporte todavía.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
