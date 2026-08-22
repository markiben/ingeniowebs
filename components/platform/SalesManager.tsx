"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAcquisitionSpendAction } from "@/lib/platform/actions";
import { refreshPlatform } from "@/lib/platform/client-refresh";
import type { PlatformAcquisitionSpend } from "@/lib/platform/types";

function money(value: number, currency: string) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function SalesManager({
  spends,
}: {
  spends: PlatformAcquisitionSpend[];
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
            const result = await createAcquisitionSpendAction(formData);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            refreshPlatform(router);
          });
        }}
      >
        <h3>Gasto de adquisición (CAC)</h3>
        <p style={{ margin: "0 0 0.85rem", color: "inherit", opacity: 0.72 }}>
          Registrá ads, herramientas o campañas. El CAC del dashboard = gasto /
          clientes nuevos del período.
        </p>
        <div
          style={{
            display: "grid",
            gap: "0.85rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))",
          }}
        >
          <label>
            Concepto
            <input name="label" required placeholder="Meta Ads / Google Ads" />
          </label>
          <label>
            Importe
            <input type="number" name="amount" min={1} required />
          </label>
          <label>
            Moneda
            <select name="currency" defaultValue="USD">
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
            </select>
          </label>
          <label>
            Fecha
            <input
              type="date"
              name="spentAt"
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
          </label>
        </div>
        {error ? <p className="plat-error">{error}</p> : null}
        <button className="plat-btn" type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Registrar gasto"}
        </button>
      </form>

      <div className="plat-card">
        <div style={{ overflowX: "auto" }}>
          <table className="plat-table">
            <thead>
              <tr>
                <th>Concepto</th>
                <th>Importe</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {spends.map((spend) => (
                <tr key={spend.id}>
                  <td>{spend.label}</td>
                  <td>{money(spend.amount, spend.currency)}</td>
                  <td>
                    {new Date(spend.spentAt).toLocaleDateString("es-AR")}
                  </td>
                </tr>
              ))}
              {spends.length === 0 ? (
                <tr>
                  <td colSpan={3}>Todavía no hay gastos de adquisición.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
