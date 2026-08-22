"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createProposalAction,
  updateProposalStatusAction,
} from "@/lib/platform/actions";
import { refreshPlatform } from "@/lib/platform/client-refresh";
import type { PlatformProposal, ProposalStatus } from "@/lib/platform/types";

function money(value: number, currency: string) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

const STATUSES: ProposalStatus[] = [
  "draft",
  "sent",
  "approved",
  "rejected",
  "expired",
];

export default function ProposalManager({
  proposals,
}: {
  proposals: PlatformProposal[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="plat-analytics">
      <form
        className="plat-card plat-form"
        action={(formData) => {
          startTransition(async () => {
            setError("");
            const result = await createProposalAction(formData);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            refreshPlatform(router);
          });
        }}
      >
        <h3>Nueva propuesta</h3>
        <div
          style={{
            display: "grid",
            gap: "0.85rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))",
          }}
        >
          <label>
            Título
            <input name="title" required placeholder="Propuesta web + branding" />
          </label>
          <label>
            Cliente
            <input name="clientName" required />
          </label>
          <label>
            Email
            <input type="email" name="clientEmail" required />
          </label>
          <label>
            Valor
            <input type="number" name="value" min={0} defaultValue={0} />
          </label>
          <label>
            Moneda
            <select name="currency" defaultValue="USD">
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
            </select>
          </label>
          <label>
            Estado
            <select name="status" defaultValue="sent">
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Notas
          <textarea name="notes" placeholder="Alcance, condiciones..." />
        </label>
        {error ? <p className="plat-error">{error}</p> : null}
        <button className="plat-btn" type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Registrar propuesta"}
        </button>
      </form>

      <div className="plat-card">
        <div style={{ overflowX: "auto" }}>
          <table className="plat-table">
            <thead>
              <tr>
                <th>Propuesta</th>
                <th>Cliente</th>
                <th>Valor</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {proposals.map((proposal) => (
                <tr key={proposal.id}>
                  <td>
                    <strong>{proposal.title}</strong>
                  </td>
                  <td>
                    {proposal.clientName}
                    <div style={{ opacity: 0.45, fontSize: "0.75rem" }}>
                      {proposal.clientEmail}
                    </div>
                  </td>
                  <td>{money(proposal.value, proposal.currency)}</td>
                  <td>
                    <span
                      className={`plat-badge${
                        proposal.status === "approved" ? " is-done" : ""
                      }`}
                    >
                      {proposal.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {STATUSES.map((status) => (
                        <button
                          key={status}
                          type="button"
                          className="plat-btn is-ghost"
                          disabled={pending || proposal.status === status}
                          onClick={() =>
                            startTransition(async () => {
                              await updateProposalStatusAction(
                                proposal.id,
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
              {proposals.length === 0 ? (
                <tr>
                  <td colSpan={5}>Todavía no hay propuestas registradas.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
