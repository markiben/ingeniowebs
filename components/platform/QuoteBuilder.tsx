"use client";

import {
  useEffect,
  useMemo,
  useState,
  useTransition,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createQuoteAction,
  markQuoteSentAction,
  approveQuoteAction,
  rejectQuoteAction,
  resendProjectInviteAction,
} from "@/lib/platform/actions";
import { refreshPlatform } from "@/lib/platform/client-refresh";
import PlatformSectionHero from "@/components/platform/PlatformSectionHero";
import {
  computeQuoteTotals,
  DEFAULT_QUOTE_PAYMENT_NOTE,
  paymentChannelLabel,
  paymentScheduleLabel,
  QUOTE_CANCEL_WITHIN_DAYS,
  QUOTE_PAYMENT_CHANNELS,
  QUOTE_PAYMENT_SCHEDULES,
  QUOTE_REFUND_PERCENT,
  type QuotePaymentChannel,
  type QuotePaymentSchedule,
} from "@/lib/platform/quote-commerce";
import {
  parseQuoteJson,
  suggestedHoursFromPayload,
} from "@/lib/platform/quote-schema";
import {
  isClientRegistered,
} from "@/lib/platform/project-flow";
import type {
  NewsletterSubscriber,
  PlatformProject,
  PlatformQuote,
  PlatformUser,
  QuotePayload,
} from "@/lib/platform/types";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardPaste,
  Copy,
  Download,
  Eraser,
  FileCheck2,
  FileJson,
  FileX2,
  Mail,
  Search,
} from "lucide-react";

type QuoteSortKey =
  | "code"
  | "client"
  | "total"
  | "date"
  | "status"
  | "project"
  | "actions";

type SortDir = "asc" | "desc";

/** Canceladas legacy se tratan como aprobadas; orden: rechazada → enviada → aprobada. */
const QUOTE_STATUS_ORDER: PlatformQuote["status"][] = [
  "rejected",
  "draft",
  "sent",
  "cancelled",
  "approved",
];

const QUOTE_SORT_COLUMNS: {
  id: QuoteSortKey;
  label: string;
}[] = [
  { id: "code", label: "Código" },
  { id: "client", label: "Cliente" },
  { id: "total", label: "Total" },
  { id: "date", label: "Fecha" },
  { id: "status", label: "Estado" },
  { id: "project", label: "Proyecto" },
];

function money(value: number, currency: "ARS" | "USD") {
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
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function compareText(a: string, b: string) {
  return a.localeCompare(b, "es", { sensitivity: "base", numeric: true });
}

function quoteRegistrationRank(
  quote: PlatformQuote,
  projects: PlatformProject[],
  clients: PlatformUser[],
): number {
  const linked =
    projects.find((entry) => entry.id === quote.projectId) ??
    projects.find((entry) => entry.code === quote.projectCode) ??
    null;
  if (!linked) return 0;
  return isClientRegistered(linked, clients) ? 2 : 1;
}

/** Estados visibles del cotizador: enviada / rechazada / aprobada. */
function quoteDisplayStatus(
  status: PlatformQuote["status"],
): "sent" | "rejected" | "approved" {
  if (status === "rejected") return "rejected";
  if (status === "approved" || status === "cancelled") return "approved";
  return "sent";
}

function QuoteSelect({
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
    <div className="plat-field plat-quote-select-field">
      <span>{label}</span>
      <div className="plat-menu plat-quote-select">
        <button
          type="button"
          className={`plat-menu-trigger${open ? " is-open" : ""}`}
          aria-expanded={open}
          aria-haspopup="listbox"
          onClick={onToggle}
        >
          <span className="plat-quote-select-value">{valueLabel}</span>
          <ChevronDown size={15} />
        </button>
        {open ? (
          <div className="plat-menu-panel plat-quote-select-panel" role="listbox">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function QuoteBuilder({
  subscribers,
  quotes: initialQuotes,
  projects = [],
  clients = [],
}: {
  subscribers: NewsletterSubscriber[];
  quotes: PlatformQuote[];
  projects?: PlatformProject[];
  clients?: PlatformUser[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab =
    searchParams.get("tab") === "cotizaciones" ? "cotizaciones" : "cotizar";
  const [pending, startTransition] = useTransition();
  const [jsonText, setJsonText] = useState("");
  const [jsonExpanded, setJsonExpanded] = useState(false);
  const [parseError, setParseError] = useState("");
  const [payload, setPayload] = useState<QuotePayload | null>(null);
  const [hours, setHours] = useState(40);
  const [hourlyRate, setHourlyRate] = useState(35);
  const [currency, setCurrency] = useState<"ARS" | "USD">("USD");
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(10);
  const [paymentSchedule, setPaymentSchedule] =
    useState<QuotePaymentSchedule>("fifty_fifty");
  const [paymentChannel, setPaymentChannel] =
    useState<QuotePaymentChannel>("usd_transfer");
  const [paymentNote, setPaymentNote] = useState(DEFAULT_QUOTE_PAYMENT_NOTE);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [contactQuery, setContactQuery] = useState("");
  const [saveToNewsletter, setSaveToNewsletter] = useState(true);
  const [actionError, setActionError] = useState("");
  const [actionOk, setActionOk] = useState("");
  const [quotes, setQuotes] = useState(initialQuotes);
  const [quoteQuery, setQuoteQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(
    null,
  );
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<QuoteSortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [registrationFilter, setRegistrationFilter] = useState("all");
  const [openSelect, setOpenSelect] = useState<
    | null
    | "currency"
    | "schedule"
    | "channel"
    | "statusFilter"
    | "registrationFilter"
  >(null);

  useEffect(() => {
    if (!openMenuId) return;

    function closeMenu() {
      setOpenMenuId(null);
      setMenuPos(null);
    }

    function onPointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".plat-menu")) return;
      closeMenu();
    }

    window.addEventListener("scroll", closeMenu, true);
    window.addEventListener("resize", closeMenu);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("scroll", closeMenu, true);
      window.removeEventListener("resize", closeMenu);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [openMenuId]);

  useEffect(() => {
    if (!openSelect) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".plat-quote-select")) return;
      setOpenSelect(null);
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [openSelect]);

  function toggleSelect(
    id:
      | "currency"
      | "schedule"
      | "channel"
      | "statusFilter"
      | "registrationFilter",
  ) {
    setOpenSelect((current) => (current === id ? null : id));
  }

  function toggleActionsMenu(
    quoteId: string,
    event: ReactMouseEvent<HTMLButtonElement>,
  ) {
    if (openMenuId === quoteId) {
      setOpenMenuId(null);
      setMenuPos(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 6,
      right: Math.max(8, window.innerWidth - rect.right),
    });
    setOpenMenuId(quoteId);
  }

  const totals = useMemo(
    () =>
      computeQuoteTotals({
        hours,
        hourlyRate,
        discountPercent: discountEnabled ? discountPercent : 0,
      }),
    [hours, hourlyRate, discountEnabled, discountPercent],
  );

  const quoteStatusCounts = useMemo(() => {
    const counts = { all: quotes.length, sent: 0, approved: 0, rejected: 0 };
    for (const quote of quotes) {
      const display = quoteDisplayStatus(quote.status);
      if (display === "sent" || display === "approved" || display === "rejected") {
        counts[display] += 1;
      }
    }
    return counts;
  }, [quotes]);

  const filteredQuotes = useMemo(() => {
    const q = quoteQuery.trim().toLowerCase();

    const filtered = quotes.filter((quote) => {
      if (statusFilter !== "all") {
        if (quoteDisplayStatus(quote.status) !== statusFilter) return false;
      }

      if (registrationFilter !== "all") {
        const rank = quoteRegistrationRank(quote, projects, clients);
        if (registrationFilter === "none" && rank !== 0) return false;
        if (registrationFilter === "pending" && rank !== 1) return false;
        if (registrationFilter === "registered" && rank !== 2) return false;
      }

      if (!q) return true;

      const statusLabel =
        quoteDisplayStatus(quote.status) === "approved"
          ? "aprobada"
          : quoteDisplayStatus(quote.status) === "rejected"
            ? "rechazada"
            : "enviada";

      return (
        quote.code.toLowerCase().includes(q) ||
        quote.clientName.toLowerCase().includes(q) ||
        quote.clientEmail.toLowerCase().includes(q) ||
        (quote.projectCode ?? "").toLowerCase().includes(q) ||
        statusLabel.includes(q) ||
        String(quote.total).includes(q)
      );
    });

    return [...filtered].sort((a, b) => {
      let result = 0;

      switch (sortKey) {
        case "code":
          result = compareText(a.code, b.code);
          break;
        case "client":
          result = compareText(a.clientName, b.clientName);
          if (result === 0) {
            result = compareText(a.clientEmail, b.clientEmail);
          }
          break;
        case "total":
          result = a.total - b.total;
          if (result === 0) result = compareText(a.currency, b.currency);
          break;
        case "date":
          result =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "status":
        case "actions":
          result =
            QUOTE_STATUS_ORDER.indexOf(a.status) -
            QUOTE_STATUS_ORDER.indexOf(b.status);
          break;
        case "project":
          result =
            quoteRegistrationRank(a, projects, clients) -
            quoteRegistrationRank(b, projects, clients);
          if (result === 0) {
            result = compareText(a.projectCode ?? "", b.projectCode ?? "");
          }
          break;
        default:
          result = 0;
      }

      return sortDir === "asc" ? result : -result;
    });
  }, [
    quotes,
    quoteQuery,
    statusFilter,
    registrationFilter,
    sortKey,
    sortDir,
    projects,
    clients,
  ]);

  function toggleSort(columnId: QuoteSortKey) {
    if (sortKey === columnId) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(columnId);
    setSortDir(
      columnId === "code" ||
        columnId === "total" ||
        columnId === "date"
        ? "desc"
        : "asc",
    );
  }

  function renderSortIcon(columnId: QuoteSortKey) {
    if (sortKey !== columnId) {
      return <ArrowUpDown size={12} className="plat-sort-icon" />;
    }
    return sortDir === "asc" ? (
      <ArrowUp size={12} className="plat-sort-icon is-active" />
    ) : (
      <ArrowDown size={12} className="plat-sort-icon is-active" />
    );
  }

  const filteredContacts = useMemo(() => {
    const q = contactQuery.trim().toLowerCase();
    if (q.length < 2) return null;
    return subscribers
      .filter((entry) => entry.status === "active")
      .filter(
        (entry) =>
          entry.name.toLowerCase().includes(q) ||
          entry.email.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [subscribers, contactQuery]);

  const contactQueryTrimmed = contactQuery.trim();

  function applyPayload(next: QuotePayload, source?: string) {
    setPayload(next);
    setParseError("");
    const suggested = suggestedHoursFromPayload(next);
    if (suggested > 0) setHours(suggested);
    if (next.client.name) setClientName(next.client.name);
    if (next.client.email) setClientEmail(next.client.email);
    if (source) setJsonText(source);
  }

  function validateJson(raw = jsonText) {
    const parsed = parseQuoteJson(raw);
    if (!parsed.ok) {
      setPayload(null);
      setParseError(parsed.error);
      return null;
    }
    applyPayload(parsed.payload, parsed.sourceJson);
    return parsed;
  }

  useEffect(() => {
    const trimmed = jsonText.trim();
    if (!trimmed) {
      setPayload(null);
      setParseError("");
      return;
    }

    const timer = window.setTimeout(() => {
      const parsed = parseQuoteJson(jsonText);
      if (!parsed.ok) {
        setPayload(null);
        setParseError(parsed.error);
        return;
      }
      applyPayload(parsed.payload);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [jsonText]);

  function selectContact(entry: NewsletterSubscriber) {
    setClientName(entry.name);
    setClientEmail(entry.email);
    setContactQuery("");
  }

  async function pasteJson() {
    setActionError("");
    setActionOk("");
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        setActionError("El portapapeles está vacío.");
        return;
      }
      setJsonText(text);
      const parsed = validateJson(text);
      if (parsed) {
        setJsonExpanded(false);
        setActionOk("JSON pegado y validado.");
      } else {
        setJsonExpanded(true);
      }
    } catch {
      setJsonExpanded(true);
      setActionError(
        "No se pudo leer el portapapeles. Pegá con Ctrl+V en el campo.",
      );
    }
  }

  function clearJson() {
    setJsonText("");
    setPayload(null);
    setParseError("");
    setActionOk("");
    setActionError("");
    setJsonExpanded(false);
  }

  function approve(quote: PlatformQuote) {
    setOpenMenuId(null);
    setMenuPos(null);
    setActionError("");
    setActionOk("");
    const formData = new FormData();
    formData.set("quoteId", quote.id);

    startTransition(async () => {
      const result = await approveQuoteAction(formData);
      if (!result.ok) {
        setActionError(result.error);
        return;
      }

      setQuotes((current) =>
        current.map((entry) =>
          entry.id === result.quote.id ? result.quote : entry,
        ),
      );
      setActionOk(result.message);

      if (result.gmailBody) {
        try {
          await navigator.clipboard.writeText(result.gmailBody);
        } catch {
          /* ignore */
        }
      }
      if (result.gmailUrl) {
        window.open(result.gmailUrl, "_blank", "noopener,noreferrer");
      }
      refreshPlatform(router);
    });
  }

  function reject(quote: PlatformQuote) {
    setOpenMenuId(null);
    setMenuPos(null);
    setActionError("");
    setActionOk("");
    const formData = new FormData();
    formData.set("quoteId", quote.id);

    startTransition(async () => {
      const result = await rejectQuoteAction(formData);
      if (!result.ok) {
        setActionError(result.error);
        return;
      }

      setQuotes((current) =>
        current.map((entry) =>
          entry.id === result.quote.id ? result.quote : entry,
        ),
      );
      setActionOk(result.message);
      refreshPlatform(router);
    });
  }

  function resendInvite(quote: PlatformQuote) {
    if (!quote.projectId) return;
    setOpenMenuId(null);
    setMenuPos(null);
    setActionError("");
    setActionOk("");
    const formData = new FormData();
    formData.set("projectId", quote.projectId);
    startTransition(async () => {
      const result = await resendProjectInviteAction(formData);
      if (!result.ok) {
        setActionError(result.error);
        return;
      }
      setActionOk(result.message);
      if (result.gmailBody) {
        try {
          await navigator.clipboard.writeText(result.gmailBody);
        } catch {
          /* ignore */
        }
      }
      if (result.gmailUrl) {
        window.open(result.gmailUrl, "_blank", "noopener,noreferrer");
      }
      refreshPlatform(router);
    });
  }

  async function copyProjectCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => {
        setCopiedCode((current) => (current === code ? null : current));
      }, 1600);
    } catch {
      /* ignore */
    }
  }

  function quoteStatusLabel(status: PlatformQuote["status"]) {
    const display = quoteDisplayStatus(status);
    if (display === "approved") return "Aprobada";
    if (display === "rejected") return "Rechazada";
    return "Enviada";
  }

  function quoteStatusClass(status: PlatformQuote["status"]) {
    const display = quoteDisplayStatus(status);
    if (display === "approved") return " is-done";
    if (display === "rejected") return " is-danger";
    return " is-warn";
  }

  function generate() {
    setActionError("");
    setActionOk("");
    const parsed = validateJson();
    if (!parsed) return;

    const formData = new FormData();
    formData.set("sourceJson", parsed.sourceJson);
    formData.set("clientName", clientName);
    formData.set("clientEmail", clientEmail);
    formData.set("hours", String(hours));
    formData.set("hourlyRate", String(hourlyRate));
    formData.set("currency", currency);
    formData.set(
      "discountPercent",
      String(discountEnabled ? discountPercent : 0),
    );
    formData.set("paymentSchedule", paymentSchedule);
    formData.set("paymentChannel", paymentChannel);
    formData.set("paymentNote", paymentNote);
    formData.set("saveToNewsletter", saveToNewsletter ? "1" : "0");

    startTransition(async () => {
      const result = await createQuoteAction(formData);
      if (!result.ok) {
        setActionError(result.error);
        return;
      }

      setQuotes((current) => [result.quote, ...current]);
      setActionOk(
        `Cotización ${result.quote.code} generada. Se descarga el PDF y se abre Gmail: adjuntá el archivo a mano.`,
      );
      refreshPlatform(router);
      router.replace("/plataforma/cotizador?tab=cotizaciones", { scroll: false });

      if (result.pdfPath) {
        window.open(result.pdfPath, "_blank", "noopener,noreferrer");
      }

      if (result.gmailBody) {
        try {
          await navigator.clipboard.writeText(result.gmailBody);
        } catch {
          /* ignore */
        }
      }
      if (result.gmailUrl) {
        window.open(result.gmailUrl, "_blank", "noopener,noreferrer");
      }

      const sentData = new FormData();
      sentData.set("quoteId", result.quote.id);
      void markQuoteSentAction(sentData).then((sent) => {
        if (!sent.ok) return;
        setQuotes((current) =>
          current.map((quote) =>
            quote.id === result.quote.id
              ? { ...quote, status: "sent" }
              : quote,
          ),
        );
        refreshPlatform(router);
      });
    });
  }

  return (
    <div className="plat-quote-hub">
      <PlatformSectionHero
        title="Cotizador"
        subtitle="Armá la cotización (IQ), enviala y al aprobarla nace el proyecto (IW) para el registro del cliente."
        tabs={
          <div className="plat-tabs" role="tablist" aria-label="Cotizador">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "cotizar"}
              className={`plat-tab${tab === "cotizar" ? " is-active" : ""}`}
              onClick={() =>
                router.replace("/plataforma/cotizador", { scroll: false })
              }
            >
              Cotizar
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "cotizaciones"}
              className={`plat-tab${tab === "cotizaciones" ? " is-active" : ""}`}
              onClick={() =>
                router.replace("/plataforma/cotizador?tab=cotizaciones", {
                  scroll: false,
                })
              }
            >
              Cotizaciones
              <span className="plat-tab-count">
                {quotes.length > 99 ? "99+" : quotes.length}
              </span>
            </button>
          </div>
        }
      />

      {tab === "cotizar" ? (
        <div className="plat-quote-layout">
      <section className="plat-card plat-quote-panel">
        <div className="plat-quote-panel-head">
          <div>
            <h2>
              <FileJson size={18} /> JSON del Gem
            </h2>
            <p>
              Pegá el JSON del agente y validalo antes de cotizar. El editor
              queda oculto hasta que lo expandas.
            </p>
          </div>
          <div className="plat-quote-json-tools">
            <button
              type="button"
              className="plat-btn is-ghost"
              onClick={() => setJsonExpanded((open) => !open)}
              aria-expanded={jsonExpanded}
            >
              {jsonExpanded ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
              {jsonExpanded ? "Ocultar JSON" : "Ver JSON"}
            </button>
            <button
              type="button"
              className="plat-btn"
              onClick={() => void pasteJson()}
              disabled={pending}
            >
              <ClipboardPaste size={14} />
              Pegar JSON
            </button>
            <button
              type="button"
              className="plat-btn is-ghost"
              onClick={clearJson}
              disabled={pending || (!jsonText && !payload)}
            >
              <Eraser size={14} />
              Limpiar
            </button>
          </div>
        </div>

        {!jsonExpanded ? (
          <button
            type="button"
            className="plat-quote-json-collapsed"
            onClick={() => setJsonExpanded(true)}
          >
            <span>
              {payload
                ? `JSON listo · ${payload.project.title}`
                : parseError
                  ? "JSON con error — expandí para corregir"
                  : jsonText.trim()
                    ? "JSON cargado — expandí para verlo"
                    : "Editor oculto — Pegar JSON o expandí para editar"}
            </span>
            <ChevronRight size={16} />
          </button>
        ) : (
          <textarea
            className="plat-quote-json"
            value={jsonText}
            onChange={(event) => {
              setJsonText(event.target.value);
              setActionOk("");
            }}
            placeholder='Pegá aquí el JSON { "version": "1.0", ... }'
            spellCheck={false}
          />
        )}

        {payload && jsonExpanded ? (
          <div className="plat-quote-actions-row">
            <span className="plat-quote-ok">
              <Check size={14} /> Listo · {payload.project.title}
            </span>
          </div>
        ) : null}
        {parseError ? <p className="plat-quote-error">{parseError}</p> : null}

        {payload ? (
          <div className="plat-quote-preview">
            <strong>{payload.project.phases.length} fases</strong>
            <span>
              Horas sugeridas por el Gem:{" "}
              {suggestedHoursFromPayload(payload) || "—"} h
            </span>
          </div>
        ) : null}
      </section>

      <section className="plat-card plat-quote-panel plat-quote-commerce">
        <div className="plat-quote-panel-head">
          <div>
            <h2>Comercial</h2>
            <p>
              Horas, tarifa, descuento opcional y condiciones de pago se
              incorporan al PDF.
            </p>
          </div>
        </div>

        <div className="plat-quote-commerce-stack">
          <div className="plat-quote-commerce-group">
            <span className="plat-quote-commerce-label">Tarifa</span>
            <div className="plat-quote-grid is-pricing">
              <label className="plat-field">
                Horas de trabajo
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={hours}
                  onChange={(event) =>
                    setHours(Number(event.target.value) || 0)
                  }
                />
              </label>
              <label className="plat-field">
                Costo por hora
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={hourlyRate}
                  onChange={(event) =>
                    setHourlyRate(Number(event.target.value) || 0)
                  }
                />
              </label>
              <QuoteSelect
                label="Moneda"
                valueLabel={currency}
                open={openSelect === "currency"}
                onToggle={() => toggleSelect("currency")}
              >
                {(
                  [
                    ["USD", "USD"],
                    ["ARS", "ARS"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="option"
                    aria-selected={currency === value}
                    className={`plat-menu-item${
                      currency === value ? " is-active" : ""
                    }`}
                    onClick={() => {
                      setCurrency(value);
                      setOpenSelect(null);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </QuoteSelect>
            </div>
          </div>

          <div
            className={`plat-quote-commerce-group is-discount${
              discountEnabled ? " is-on" : ""
            }`}
          >
            <label className="plat-quote-discount-toggle">
              <input
                type="checkbox"
                checked={discountEnabled}
                onChange={(event) => setDiscountEnabled(event.target.checked)}
              />
              <span>
                <strong>Descuento</strong>
                <small>Opcional · se muestra en el PDF</small>
              </span>
            </label>
            {discountEnabled ? (
              <div className="plat-quote-discount-input" aria-label="Descuento en porcentaje">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={discountPercent}
                  onChange={(event) =>
                    setDiscountPercent(Number(event.target.value) || 0)
                  }
                />
                <span>%</span>
              </div>
            ) : (
              <p className="plat-quote-commerce-hint">Sin descuento</p>
            )}
          </div>

          <div className="plat-quote-commerce-group">
            <span className="plat-quote-commerce-label">Condiciones de pago</span>
            <div className="plat-quote-grid is-payment">
              <QuoteSelect
                label="Esquema de pago"
                valueLabel={paymentScheduleLabel(paymentSchedule)}
                open={openSelect === "schedule"}
                onToggle={() => toggleSelect("schedule")}
              >
                {QUOTE_PAYMENT_SCHEDULES.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    role="option"
                    aria-selected={paymentSchedule === entry.id}
                    className={`plat-menu-item${
                      paymentSchedule === entry.id ? " is-active" : ""
                    }`}
                    onClick={() => {
                      setPaymentSchedule(entry.id);
                      setOpenSelect(null);
                    }}
                  >
                    {entry.label}
                  </button>
                ))}
              </QuoteSelect>
              <QuoteSelect
                label="Medio de pago"
                valueLabel={paymentChannelLabel(paymentChannel)}
                open={openSelect === "channel"}
                onToggle={() => toggleSelect("channel")}
              >
                {QUOTE_PAYMENT_CHANNELS.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    role="option"
                    aria-selected={paymentChannel === entry.id}
                    className={`plat-menu-item${
                      paymentChannel === entry.id ? " is-active" : ""
                    }`}
                    onClick={() => {
                      setPaymentChannel(entry.id);
                      setOpenSelect(null);
                    }}
                  >
                    {entry.label}
                  </button>
                ))}
              </QuoteSelect>
              <label className="plat-field is-full">
                Detalle del pago
                <input
                  value={paymentNote}
                  onChange={(event) => setPaymentNote(event.target.value)}
                  placeholder={DEFAULT_QUOTE_PAYMENT_NOTE}
                />
              </label>
            </div>
          </div>
        </div>

        <p className="plat-quote-policy">
          Cancelación del proyecto: dentro de {QUOTE_CANCEL_WITHIN_DAYS} días
          corridos desde la aceptación, con devolución del {QUOTE_REFUND_PERCENT}
          % de lo abonado. Se gestiona en Proyectos y queda indicada en el PDF.
        </p>

        <div className="plat-quote-total">
          <div>
            <span className="plat-quote-total-label">Total de la propuesta</span>
            <span>Subtotal {money(totals.subtotal, currency)}</span>
            {discountEnabled && totals.discountPercent > 0 ? (
              <small>
                Descuento {totals.discountPercent}% (−
                {money(totals.discountAmount, currency)})
              </small>
            ) : null}
          </div>
          <strong>{money(totals.total, currency)}</strong>
        </div>
      </section>

      <section className="plat-card plat-quote-panel">
        <div className="plat-quote-panel-head">
          <div>
            <h2>Destinatario</h2>
            <p>
              Buscá un contacto existente o cargá uno nuevo para la cotización.
            </p>
          </div>
        </div>

        <label className="plat-field">
          Buscar contacto
          <div className="plat-quote-search">
            <Search size={15} aria-hidden />
            <input
              type="search"
              value={contactQuery}
              onChange={(event) => setContactQuery(event.target.value)}
              placeholder="Escribí nombre o email…"
              autoComplete="off"
            />
          </div>
        </label>

        {contactQueryTrimmed.length > 0 && contactQueryTrimmed.length < 2 ? (
          <p className="plat-quote-muted">Escribí al menos 2 caracteres.</p>
        ) : null}

        {filteredContacts && filteredContacts.length > 0 ? (
          <ul className="plat-quote-contacts">
            {filteredContacts.map((entry) => (
              <li key={entry.id}>
                <button type="button" onClick={() => selectContact(entry)}>
                  <strong>{entry.name}</strong>
                  <span>{entry.email}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {filteredContacts && filteredContacts.length === 0 ? (
          <p className="plat-quote-search-empty">
            No existe un contacto con ese nombre o email. Podés cargarlo abajo.
          </p>
        ) : null}

        <div className="plat-quote-grid is-recipient">
          <label className="plat-field">
            Nombre
            <input
              value={clientName}
              onChange={(event) => setClientName(event.target.value)}
              placeholder="Nombre del cliente"
            />
          </label>
          <label className="plat-field">
            Email
            <input
              type="email"
              value={clientEmail}
              onChange={(event) => setClientEmail(event.target.value)}
              placeholder="cliente@empresa.com"
            />
          </label>
        </div>

        <label className="plat-quote-check">
          <input
            type="checkbox"
            checked={saveToNewsletter}
            onChange={(event) => setSaveToNewsletter(event.target.checked)}
          />
          Guardar / actualizar este contacto en newsletter
        </label>
      </section>

      <section className="plat-card plat-quote-panel">
        <div className="plat-quote-panel-head">
          <div>
            <h2>Generar</h2>
            <p>
              Crea el ID, descarga el PDF y abre Gmail. El cuerpo del mail queda
              copiado: pegalo (Ctrl+V) y adjuntá el PDF.
            </p>
          </div>
        </div>

        <div className="plat-quote-generate-row">
          <button
            type="button"
            className="plat-btn"
            disabled={pending || !payload}
            onClick={generate}
          >
            <Mail size={15} />
            {pending ? "Generando…" : "Generar cotización + PDF + Gmail"}
          </button>

          {actionError ? (
            <p className="plat-quote-error">{actionError}</p>
          ) : null}
          {actionOk ? <p className="plat-quote-ok">{actionOk}</p> : null}
        </div>
      </section>
        </div>
      ) : null}

      {tab === "cotizaciones" ? (
        <div className="plat-quote-layout">
      <section className="plat-card plat-quote-panel plat-quote-list">
        <div className="plat-quote-panel-head">
          <div>
            <h2>Cotizaciones</h2>
            <p>
              Flujo: generar IQ → enviar → aprobar (crea IW) → invitar al cliente
              → seguimiento en Proyectos.
            </p>
          </div>
        </div>

        <div className="plat-quote-list-toolbar">
          <div className="plat-quote-search plat-quote-list-filter">
            <Search size={15} aria-hidden />
            <input
              type="search"
              value={quoteQuery}
              onChange={(event) => setQuoteQuery(event.target.value)}
              placeholder="Buscar por código IQ/IW, cliente o email…"
              autoComplete="off"
            />
          </div>

          <div className="plat-filter-select">
            <span>Proyecto</span>
            <div className="plat-menu plat-quote-select">
              <button
                type="button"
                className={`plat-menu-trigger${
                  openSelect === "registrationFilter" ? " is-open" : ""
                }`}
                aria-expanded={openSelect === "registrationFilter"}
                aria-haspopup="listbox"
                onClick={() => toggleSelect("registrationFilter")}
              >
                <span className="plat-quote-select-value">
                  {registrationFilter === "pending"
                    ? "Pendiente de registro"
                    : registrationFilter === "registered"
                      ? "Registrados"
                      : registrationFilter === "none"
                        ? "Sin proyecto"
                        : "Todos"}
                </span>
                <ChevronDown size={14} />
              </button>
              {openSelect === "registrationFilter" ? (
                <div
                  className="plat-menu-panel plat-quote-select-panel"
                  role="listbox"
                >
                  {(
                    [
                      ["all", "Todos"],
                      ["pending", "Pendiente de registro"],
                      ["registered", "Registrados"],
                      ["none", "Sin proyecto"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      role="option"
                      aria-selected={registrationFilter === value}
                      className={`plat-menu-item${
                        registrationFilter === value ? " is-active" : ""
                      }`}
                      onClick={() => {
                        setRegistrationFilter(value);
                        setOpenSelect(null);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div
          className="plat-tabs plat-quote-status-tabs"
          role="tablist"
          aria-label="Estado de cotización"
        >
          {(
            [
              ["all", "Todos"],
              ["sent", "Enviadas"],
              ["approved", "Aprobadas"],
              ["rejected", "Rechazadas"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={statusFilter === value}
              className={`plat-tab${statusFilter === value ? " is-active" : ""}`}
              onClick={() => setStatusFilter(value)}
            >
              {label}
              <span className="plat-tab-count">
                {quoteStatusCounts[value]}
              </span>
            </button>
          ))}
        </div>

        <div className="plat-quote-list-scroll">
          <table className="plat-table">
            <thead>
              <tr>
                {QUOTE_SORT_COLUMNS.map((column) => (
                  <th key={column.id}>
                    <button
                      type="button"
                      className={`plat-th-sort${
                        sortKey === column.id ? " is-active" : ""
                      }`}
                      onClick={() => toggleSort(column.id)}
                    >
                      <span>{column.label}</span>
                      {renderSortIcon(column.id)}
                    </button>
                  </th>
                ))}
                <th>Cotización</th>
                <th>
                  <button
                    type="button"
                    className={`plat-th-sort${
                      sortKey === "actions" ? " is-active" : ""
                    }`}
                    onClick={() => toggleSort("actions")}
                    title="Ordenar por estado de la cotización"
                  >
                    <span>Acciones</span>
                    {renderSortIcon("actions")}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotes.map((quote) => {
                const linkedProject =
                  projects.find((entry) => entry.id === quote.projectId) ??
                  projects.find((entry) => entry.code === quote.projectCode) ??
                  null;
                const registered = linkedProject
                  ? isClientRegistered(linkedProject, clients)
                  : false;

                return (
                <tr key={quote.id}>
                  <td>
                    <span className="plat-code">{quote.code}</span>
                  </td>
                  <td>
                    <div>{quote.clientName}</div>
                    <small className="plat-quote-muted">{quote.clientEmail}</small>
                  </td>
                  <td>{money(quote.total, quote.currency)}</td>
                  <td>{formatDate(quote.createdAt)}</td>
                  <td>
                    <span className={`plat-badge${quoteStatusClass(quote.status)}`}>
                      {quoteStatusLabel(quote.status)}
                    </span>
                  </td>
                  <td>
                    {quote.projectCode ? (
                      <div className="plat-quote-project-cell">
                        <div className="plat-code-row">
                          <a
                            className="plat-code plat-code-link"
                            href={`/plataforma/proyectos?codigo=${encodeURIComponent(quote.projectCode)}`}
                          >
                            {quote.projectCode}
                          </a>
                          <button
                            type="button"
                            className={`plat-code-copy${
                              copiedCode === quote.projectCode ? " is-copied" : ""
                            }`}
                            title={
                              copiedCode === quote.projectCode
                                ? "Código copiado"
                                : "Copiar código de proyecto"
                            }
                            aria-label={
                              copiedCode === quote.projectCode
                                ? "Código copiado"
                                : "Copiar código de proyecto"
                            }
                            onClick={() =>
                              void copyProjectCode(quote.projectCode!)
                            }
                          >
                            {copiedCode === quote.projectCode ? (
                              <Check size={14} />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                        <small
                          className={`plat-quote-reg-badge${
                            registered ? " is-ok" : " is-pending"
                          }`}
                        >
                          {registered
                            ? "Cliente registrado"
                            : "Pendiente de registro"}
                        </small>
                      </div>
                    ) : (
                      <span className="plat-quote-muted">—</span>
                    )}
                  </td>
                  <td>
                    <a
                      className="plat-btn is-ghost plat-icon-btn"
                      href={`/api/plataforma/quotes/${quote.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Descargar PDF"
                      aria-label="Descargar PDF"
                    >
                      <Download size={14} />
                    </a>
                  </td>
                  <td className="plat-quote-actions-cell">
                      <div className="plat-menu">
                        <button
                          type="button"
                          className={`plat-menu-trigger is-compact${
                            openMenuId === quote.id ? " is-open" : ""
                          }`}
                          disabled={pending}
                          aria-expanded={openMenuId === quote.id}
                          aria-haspopup="menu"
                          onClick={(event) =>
                            toggleActionsMenu(quote.id, event)
                          }
                        >
                          Acciones
                          <ChevronDown size={14} />
                        </button>
                        {openMenuId === quote.id && menuPos ? (
                          <div
                            className="plat-menu-panel is-right is-quote-actions"
                            role="menu"
                            style={{
                              top: menuPos.top,
                              right: menuPos.right,
                            }}
                          >
                            {quoteDisplayStatus(quote.status) === "approved" ? (
                              <>
                                {!registered ? (
                                  <button
                                    type="button"
                                    className="plat-menu-item"
                                    disabled={pending || !quote.projectId}
                                    onClick={() => resendInvite(quote)}
                                  >
                                    <Mail size={14} />
                                    Reenviar invitación
                                  </button>
                                ) : null}
                                <a
                                  className="plat-menu-item"
                                  href={`/plataforma/proyectos?codigo=${encodeURIComponent(
                                    quote.projectCode || "",
                                  )}`}
                                  role="menuitem"
                                >
                                  <FileCheck2 size={14} />
                                  Ir a proyecto
                                </a>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="plat-menu-item"
                                  disabled={pending}
                                  onClick={() => approve(quote)}
                                >
                                  <FileCheck2 size={14} />
                                  Aprobar
                                </button>
                                {quoteDisplayStatus(quote.status) !==
                                "rejected" ? (
                                  <button
                                    type="button"
                                    className="plat-menu-item is-danger"
                                    disabled={pending}
                                    onClick={() => reject(quote)}
                                  >
                                    <FileX2 size={14} />
                                    Rechazar
                                  </button>
                                ) : null}
                              </>
                            )}
                          </div>
                        ) : null}
                      </div>
                  </td>
                </tr>
                );
              })}
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan={8}>Todavía no hay cotizaciones.</td>
                </tr>
              ) : null}
              {quotes.length > 0 && filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    No hay cotizaciones que coincidan con la búsqueda o los
                    filtros.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
        </div>
      ) : null}
    </div>
  );
}
