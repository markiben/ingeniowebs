"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  Circle,
  ClipboardList,
  Download,
  FileText,
  MessageSquarePlus,
  PackagePlus,
  Wallet,
} from "lucide-react";
import {
  submitClientExtraRequestAction,
  submitClientObservationAction,
  requestClientProjectCancelAction,
} from "@/lib/platform/actions";
import {
  clientStatusHint,
  clientStatusLabel,
} from "@/lib/platform/project-flow";
import {
  cancelWindowInfo,
  computeRefundAmount,
  expectedAmountPaid,
  paymentChannelLabel,
  paymentScheduleLabel,
  projectPaymentStatusLabel,
  QUOTE_CANCEL_POLICY_LINES,
  QUOTE_CANCEL_WITHIN_DAYS,
  QUOTE_REFUND_PERCENT,
} from "@/lib/platform/quote-commerce";
import { refreshPlatform } from "@/lib/platform/client-refresh";
import type { PlatformProject, PlatformQuote } from "@/lib/platform/types";

function money(value: number, currency: string) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function ClientProjectView({
  project,
  quote = null,
  preview = false,
}: {
  project: PlatformProject;
  quote?: PlatformQuote | null;
  /** Vista de solo lectura para admin (cómo lo ve el cliente). */
  preview?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [observation, setObservation] = useState("");
  const [extraRequest, setExtraRequest] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  const services = project.services ?? [];
  const updates = project.clientUpdates ?? [];
  const hoursInvested = project.hoursInvested || 0;
  const hoursEstimated = project.hoursEstimated || 0;
  const projectClosed =
    project.status === "completed" || project.status === "cancelled";
  const formsDisabled = preview || projectClosed;

  const acceptedAt = quote?.approvedAt || project.createdAt;
  const cancelWindow = useMemo(
    () => cancelWindowInfo(acceptedAt),
    [acceptedAt],
  );

  const amountPaid =
    Number(project.amountPaid) > 0
      ? Number(project.amountPaid)
      : quote
        ? expectedAmountPaid({
            total: quote.total,
            paymentSchedule: quote.paymentSchedule,
          })
        : Number(project.value) || 0;

  const refundEstimate = computeRefundAmount(amountPaid, QUOTE_REFUND_PERCENT);
  const paymentPending =
    !projectClosed && (project.paymentStatus ?? "unpaid") === "unpaid";
  const canRequestCancel =
    !formsDisabled &&
    cancelWindow.eligible &&
    project.cancelRequest?.status !== "pending";
  const showCancelAction =
    canRequestCancel ||
    (preview && !projectClosed && cancelWindow.eligible);

  function runAction(
    action: (
      formData: FormData,
    ) => Promise<{ ok: boolean; error?: string; message?: string }>,
    formData: FormData,
    onOk?: () => void,
  ) {
    setFeedback(null);
    startTransition(async () => {
      const result = await action(formData);
      if (!result.ok) {
        setFeedback({ ok: false, text: result.error || "No se pudo enviar." });
        return;
      }
      setFeedback({
        ok: true,
        text:
          "message" in result && typeof result.message === "string"
            ? result.message
            : "Enviado correctamente.",
      });
      onOk?.();
      refreshPlatform(router);
    });
  }

  return (
    <div className="plat-hub">
      {preview ? (
        <div className="plat-hub-banner" role="status">
          <strong>Vista previa</strong>
          <span>
            Así lo ve el cliente en Mi proyecto. Los envíos están desactivados.
          </span>
        </div>
      ) : null}

      <section className="plat-hub-hero">
        <div className="plat-hub-hero-top">
          <div>
            <p className="plat-hub-kicker">Tu proyecto</p>
            <h2>{project.name}</h2>
            <p className="plat-hub-meta">
              <span className="plat-code">{project.code}</span>
              {project.quoteCode ? (
                <>
                  <span aria-hidden>·</span>
                  <span className="plat-code">{project.quoteCode}</span>
                </>
              ) : null}
            </p>
          </div>
          <span
            className={`plat-badge${
              paymentPending
                ? " is-warn"
                : project.status === "completed"
                  ? " is-done"
                  : project.status === "cancelled"
                    ? " is-danger"
                    : project.status === "review"
                      ? " is-warn"
                      : ""
            }`}
          >
            {paymentPending
              ? "Pendiente de pago"
              : clientStatusLabel(project.status)}
          </span>
        </div>

        <p className="plat-hub-hint">
          {paymentPending
            ? "Estamos aguardando el pago para poder iniciar el proyecto."
            : clientStatusHint(project.status)}
        </p>

        {paymentPending ? (
          <div className="plat-hub-paywall" role="status">
            <strong>Pendiente de pago</strong>
            <span>
              Cuando confirmemos la recepción del pago, el proyecto pasa a
              desarrollo y vas a ver el avance acá.
            </span>
          </div>
        ) : null}

        <div className="plat-hub-progress">
          <div className="plat-hub-progress-meta">
            <strong>{paymentPending ? "0%" : `${project.progress}%`}</strong>
            <span>
              {paymentPending
                ? "Aguardando inicio"
                : `${hoursInvested}/${hoursEstimated || "—"} h invertidas`}
            </span>
          </div>
          <div className="plat-progress">
            <span
              style={{
                width: `${
                  paymentPending
                    ? 0
                    : Math.max(0, Math.min(100, project.progress))
                }%`,
              }}
            />
          </div>
        </div>

        <div className="plat-hub-stats">
          <div className="plat-hub-stat">
            <span>Valor</span>
            <strong>{money(project.value, project.currency)}</strong>
          </div>
          <div className="plat-hub-stat">
            <span>Abonado</span>
            <strong>
              {paymentPending
                ? money(0, project.currency)
                : money(amountPaid, project.currency)}
            </strong>
          </div>
          <div className="plat-hub-stat">
            <span>Pago</span>
            <strong
              className={
                paymentPending
                  ? "is-warn"
                  : project.paymentStatus === "paid_in_full"
                    ? "is-ok"
                    : undefined
              }
            >
              {projectPaymentStatusLabel(project.paymentStatus)}
            </strong>
          </div>
          <div className="plat-hub-stat plat-hub-stat-docs">
            <span>Documentos</span>
            <div className="plat-hub-docs">
              {project.quoteId ? (
                <a
                  className="plat-btn is-ghost is-compact"
                  href={`/api/plataforma/quotes/${project.quoteId}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileText size={14} />
                  Cotización
                </a>
              ) : null}
              <a
                className="plat-btn is-ghost is-compact"
                href={`/api/plataforma/projects/${project.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download size={14} />
                Resumen
              </a>
            </div>
          </div>
        </div>

        <ol className="plat-hub-steps" aria-label="Estado del flujo">
          <li className="is-done">
            <Check size={14} />
            <span>Cotización aprobada</span>
          </li>
          <li className={paymentPending ? "is-current" : "is-done"}>
            {paymentPending ? <Circle size={14} /> : <Check size={14} />}
            <span>Pago confirmado</span>
          </li>
          <li
            className={
              paymentPending
                ? ""
                : project.progress > 0 || projectClosed
                  ? "is-done"
                  : "is-current"
            }
          >
            {!paymentPending && (project.progress > 0 || projectClosed) ? (
              <Check size={14} />
            ) : (
              <Circle size={14} />
            )}
            <span>Desarrollo en curso</span>
          </li>
          <li className={projectClosed ? "is-done" : ""}>
            {projectClosed ? <Check size={14} /> : <Circle size={14} />}
            <span>Entrega final</span>
          </li>
        </ol>
      </section>

      <div className="plat-hub-grid">
        <section className="plat-hub-card">
          <header className="plat-hub-card-head">
            <Wallet size={18} />
            <div>
              <h3>Pagos</h3>
              <p>Según la propuesta aprobada</p>
            </div>
          </header>
          <div className="plat-hub-kv">
            <div>
              <span>Estado</span>
              <strong>{projectPaymentStatusLabel(project.paymentStatus)}</strong>
            </div>
            <div>
              <span>Abonado</span>
              <strong>
                {paymentPending
                  ? money(0, project.currency)
                  : money(amountPaid, project.currency)}
              </strong>
            </div>
            {quote ? (
              <>
                <div>
                  <span>Esquema</span>
                  <strong>{paymentScheduleLabel(quote.paymentSchedule)}</strong>
                </div>
                <div>
                  <span>Canal</span>
                  <strong>{paymentChannelLabel(quote.paymentChannel)}</strong>
                </div>
              </>
            ) : null}
          </div>
          {project.status === "cancelled" && project.refundAmount != null ? (
            <p className="plat-hub-note">
              Cancelado el{" "}
              {project.cancelledAt ? formatDate(project.cancelledAt) : "—"}.
              Devolución:{" "}
              <strong>
                {money(Number(project.refundAmount), project.currency)}
              </strong>{" "}
              ({project.refundPercent ?? QUOTE_REFUND_PERCENT}%).
            </p>
          ) : null}
        </section>

        {project.description ? (
          <section className="plat-hub-card">
            <header className="plat-hub-card-head">
              <ClipboardList size={18} />
              <div>
                <h3>Alcance</h3>
                <p>Lo acordado en la cotización</p>
              </div>
            </header>
            <p className="plat-hub-body">{project.description}</p>
          </section>
        ) : (
          <section className="plat-hub-card">
            <header className="plat-hub-card-head">
              <ClipboardList size={18} />
              <div>
                <h3>Servicios adicionales</h3>
                <p>
                  {services.length
                    ? `${services.length} incorporado${services.length === 1 ? "" : "s"}`
                    : "Todavía no hay extras"}
                </p>
              </div>
            </header>
            {services.length === 0 ? (
              <p className="plat-hub-empty">
                Cuando pidas un adicional y se apruebe, aparece acá.
              </p>
            ) : (
              <ul className="plat-hub-list">
                {services.map((service) => {
                  const rate =
                    service.hours > 0
                      ? Math.round((service.amount / service.hours) * 100) / 100
                      : project.hourlyCost || 0;
                  return (
                    <li key={service.id}>
                      <div>
                        <strong>{service.name}</strong>
                        {service.description ? (
                          <small>{service.description}</small>
                        ) : null}
                        <small>
                          {service.hours}h × {money(rate, project.currency)}/h
                        </small>
                      </div>
                      <span>{money(service.amount, project.currency)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}
      </div>

      {project.description && services.length > 0 ? (
        <section className="plat-hub-card">
          <header className="plat-hub-card-head">
            <ClipboardList size={18} />
            <div>
              <h3>Servicios adicionales</h3>
              <p>Extras ya incorporados al proyecto</p>
            </div>
          </header>
          <ul className="plat-hub-list">
            {services.map((service) => {
              const rate =
                service.hours > 0
                  ? Math.round((service.amount / service.hours) * 100) / 100
                  : project.hourlyCost || 0;
              return (
                <li key={service.id}>
                  <div>
                    <strong>{service.name}</strong>
                    {service.description ? (
                      <small>{service.description}</small>
                    ) : null}
                    <small>
                      {service.hours}h × {money(rate, project.currency)}/h
                    </small>
                  </div>
                  <span>{money(service.amount, project.currency)}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {!projectClosed && !paymentPending ? (
        <div className="plat-hub-grid">
          <section className="plat-hub-card">
            <header className="plat-hub-card-head">
              <PackagePlus size={18} />
              <div>
                <h3>Pedido adicional</h3>
                <p>Cambio o servicio extra para cotizar</p>
              </div>
            </header>
            <form
              className="plat-hub-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (formsDisabled) return;
                const formData = new FormData(event.currentTarget);
                runAction(submitClientExtraRequestAction, formData, () =>
                  setExtraRequest(""),
                );
              }}
            >
              <textarea
                name="body"
                rows={4}
                value={extraRequest}
                onChange={(event) => setExtraRequest(event.target.value)}
                placeholder="Ej: sumar un panel de reportes / integrar WhatsApp…"
                required
                disabled={formsDisabled}
              />
              <button
                type="submit"
                className="plat-btn is-primary"
                disabled={
                  formsDisabled || pending || extraRequest.trim().length < 8
                }
              >
                Enviar pedido
              </button>
            </form>
          </section>

          <section className="plat-hub-card">
            <header className="plat-hub-card-head">
              <MessageSquarePlus size={18} />
              <div>
                <h3>Observaciones</h3>
                <p>Feedback para el equipo</p>
              </div>
            </header>
            <form
              className="plat-hub-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (formsDisabled) return;
                const formData = new FormData(event.currentTarget);
                runAction(submitClientObservationAction, formData, () =>
                  setObservation(""),
                );
              }}
            >
              <textarea
                name="body"
                rows={4}
                value={observation}
                onChange={(event) => setObservation(event.target.value)}
                placeholder="Ej: el logo debería ir más grande en mobile…"
                required
                disabled={formsDisabled}
              />
              <button
                type="submit"
                className="plat-btn is-primary"
                disabled={
                  formsDisabled || pending || observation.trim().length < 5
                }
              >
                Enviar observación
              </button>
            </form>
          </section>
        </div>
      ) : null}

      {updates.length > 0 ? (
        <section className="plat-hub-card">
          <header className="plat-hub-card-head">
            <ClipboardList size={18} />
            <div>
              <h3>Tu historial</h3>
              <p>Pedidos y observaciones enviados</p>
            </div>
          </header>
          <ul className="plat-hub-list is-stack">
            {updates.map((item) => (
              <li key={item.id}>
                <div>
                  <div className="plat-hub-list-top">
                    <strong>
                      {item.kind === "extra_request"
                        ? "Pedido adicional"
                        : "Observación"}
                    </strong>
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                  <p>{item.body}</p>
                  <small>
                    {item.status === "open"
                      ? "Pendiente de revisión"
                      : item.status === "done"
                        ? "Resuelto"
                        : "Visto por el equipo"}
                  </small>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="plat-hub-card is-danger">
        <header className="plat-hub-card-head">
          <AlertTriangle size={18} />
          <div>
            <h3>Cancelación y devolución</h3>
            <p>
              {QUOTE_CANCEL_WITHIN_DAYS} días desde la aceptación ·{" "}
              {QUOTE_REFUND_PERCENT}% de lo abonado
            </p>
          </div>
        </header>

        <div className="plat-hub-kv">
          <div>
            <span>Plazo</span>
            <strong>
              {projectClosed
                ? "No aplica"
                : cancelWindow.eligible
                  ? `${cancelWindow.daysRemaining} día${
                      cancelWindow.daysRemaining === 1 ? "" : "s"
                    } restantes`
                  : "Plazo vencido"}
            </strong>
          </div>
          <div>
            <span>Devolución estimada ({QUOTE_REFUND_PERCENT}%)</span>
            <strong>{money(refundEstimate, project.currency)}</strong>
          </div>
        </div>

        <ul className="plat-hub-policy">
          {QUOTE_CANCEL_POLICY_LINES.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        {project.cancelRequest?.status === "pending" ? (
          <p className="plat-hub-note">
            Solicitud enviada el {formatDate(project.cancelRequest.requestedAt)}.
            El equipo la está revisando.
          </p>
        ) : null}

        {project.cancelRequest?.status === "rejected" ? (
          <p className="plat-hub-error">
            Tu última solicitud de cancelación fue rechazada.
          </p>
        ) : null}

        {showCancelAction ? (
          <>
            {!confirmCancel || preview ? (
              <button
                type="button"
                className="plat-btn is-danger"
                disabled={pending || preview}
                onClick={() => {
                  if (preview) return;
                  setConfirmCancel(true);
                }}
              >
                Solicitar cancelación y devolución
              </button>
            ) : (
              <form
                className="plat-hub-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);
                  runAction(requestClientProjectCancelAction, formData, () => {
                    setCancelReason("");
                    setConfirmCancel(false);
                  });
                }}
              >
                <p className="plat-hub-warn">
                  Si se aprueba, se gestiona la devolución del{" "}
                  {QUOTE_REFUND_PERCENT}% (
                  {money(refundEstimate, project.currency)}).
                </p>
                <textarea
                  name="reason"
                  rows={3}
                  value={cancelReason}
                  onChange={(event) => setCancelReason(event.target.value)}
                  placeholder="Motivo de la cancelación…"
                  required
                />
                <div className="plat-hub-form-actions">
                  <button
                    type="button"
                    className="plat-btn is-ghost"
                    onClick={() => setConfirmCancel(false)}
                    disabled={pending}
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    className="plat-btn is-danger"
                    disabled={pending || cancelReason.trim().length < 8}
                  >
                    Confirmar solicitud
                  </button>
                </div>
              </form>
            )}
          </>
        ) : null}

        {!projectClosed && !cancelWindow.eligible && !project.cancelRequest ? (
          <p className="plat-hub-empty">
            El plazo de {QUOTE_CANCEL_WITHIN_DAYS} días ya venció.
          </p>
        ) : null}

        {projectClosed ? (
          <p className="plat-hub-empty">
            Este proyecto ya está{" "}
            {project.status === "completed" ? "finalizado" : "cancelado"}. No se
            pueden enviar nuevos pedidos ni cancelaciones.
          </p>
        ) : null}
      </section>

      {feedback ? (
        <p className={feedback.ok ? "plat-quote-ok" : "plat-quote-error"}>
          {feedback.text}
        </p>
      ) : null}
    </div>
  );
}
