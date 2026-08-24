"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { daysInMonth, MONTH_LABELS } from "@/lib/platform/analytics";

export type PlatformDateValue = {
  year: number;
  month: number; // 0-11
  day: number;
};

type Props = {
  value: PlatformDateValue;
  onChange: (next: PlatformDateValue) => void;
  years?: number[];
  label?: string;
  hideLabel?: boolean;
  className?: string;
};

const WEEKDAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

function clampDay(year: number, month: number, day: number) {
  return Math.min(day, daysInMonth(year, month));
}

function formatLabel(value: PlatformDateValue) {
  const date = new Date(value.year, value.month, value.day);
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function sameDay(a: PlatformDateValue, b: PlatformDateValue) {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

export default function PlatformDatePicker({
  value,
  onChange,
  years,
  label = "Fecha",
  hideLabel = false,
  className,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(value.year);
  const [viewMonth, setViewMonth] = useState(value.month);

  useEffect(() => {
    if (!open) return;
    setViewYear(value.year);
    setViewMonth(value.month);
  }, [open, value.year, value.month]);

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

  const minYear = years?.length ? Math.min(...years) : undefined;
  const maxYear = years?.length ? Math.max(...years) : undefined;

  const cells = useMemo(() => {
    const total = daysInMonth(viewYear, viewMonth);
    const first = new Date(viewYear, viewMonth, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const items: Array<PlatformDateValue | null> = [];
    for (let i = 0; i < startOffset; i += 1) items.push(null);
    for (let day = 1; day <= total; day += 1) {
      items.push({ year: viewYear, month: viewMonth, day });
    }
    while (items.length % 7 !== 0) items.push(null);
    return items;
  }, [viewYear, viewMonth]);

  function shiftMonth(delta: number) {
    const date = new Date(viewYear, viewMonth + delta, 1);
    const nextYear = date.getFullYear();
    if (minYear !== undefined && nextYear < minYear) return;
    if (maxYear !== undefined && nextYear > maxYear) return;
    setViewYear(nextYear);
    setViewMonth(date.getMonth());
  }

  const today = new Date();
  const todayValue: PlatformDateValue = {
    year: today.getFullYear(),
    month: today.getMonth(),
    day: today.getDate(),
  };

  return (
    <div
      className={`plat-date-picker${className ? ` ${className}` : ""}`}
      ref={rootRef}
    >
      {hideLabel ? null : (
        <span className="plat-date-picker-label">{label}</span>
      )}
      <div className="plat-date-picker-shell">
        <button
          type="button"
          className={`plat-date-trigger${open ? " is-open" : ""}`}
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpen((current) => !current)}
        >
          <CalendarDays size={15} />
          <span>{formatLabel(value)}</span>
        </button>
        {open ? (
          <div className="plat-date-panel" role="dialog" aria-label="Elegir fecha">
            <div className="plat-date-nav">
              <button
                type="button"
                className="plat-date-nav-btn"
                aria-label="Mes anterior"
                onClick={() => shiftMonth(-1)}
              >
                <ChevronLeft size={16} />
              </button>
              <p className="plat-date-nav-label">
                {MONTH_LABELS[viewMonth]} {viewYear}
              </p>
              <button
                type="button"
                className="plat-date-nav-btn"
                aria-label="Mes siguiente"
                onClick={() => shiftMonth(1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div
              className="plat-date-weekdays"
              aria-hidden
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                gap: "0.2rem",
              }}
            >
              {WEEKDAYS.map((day) => (
                <span key={day} className="plat-date-weekday">
                  {day}
                </span>
              ))}
            </div>

            <div
              className="plat-date-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                gap: "0.2rem",
              }}
            >
              {cells.map((cell, index) => {
                if (!cell) {
                  return (
                    <span
                      key={`empty-${index}`}
                      className="plat-date-empty"
                      aria-hidden
                    />
                  );
                }
                const selected = sameDay(cell, value);
                const isToday = sameDay(cell, todayValue);
                return (
                  <button
                    key={`${cell.year}-${cell.month}-${cell.day}`}
                    type="button"
                    className={`plat-date-day${selected ? " is-selected" : ""}${isToday ? " is-today" : ""}`}
                    onClick={() => {
                      onChange({
                        year: cell.year,
                        month: cell.month,
                        day: clampDay(cell.year, cell.month, cell.day),
                      });
                      setOpen(false);
                    }}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="plat-date-today"
              onClick={() => {
                onChange(todayValue);
                setViewYear(todayValue.year);
                setViewMonth(todayValue.month);
                setOpen(false);
              }}
            >
              Hoy
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
