"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info } from "lucide-react";
import { WEEKDAYS, MONTHS } from "./tjFormat";

function useClickOutside<T extends HTMLElement = HTMLDivElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, onClose]);

  return ref;
}

// ─────────────────────────── Ayuda ───────────────────────────

/**
 * Explicación de una métrica. En PC se abre al pasar el ratón; en el móvil,
 * al tocar el botón (y se cierra tocando fuera o con Escape).
 */
export function TjInfo({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLSpanElement>(open, () => setOpen(false));
  const id = useId();

  return (
    <span className={`tj-info${open ? " open" : ""}`} ref={ref} onKeyDown={e => e.key === "Escape" && setOpen(false)}>
      <button
        type="button" className="tj-info-btn" aria-label={`Qué significa: ${label}`}
        aria-expanded={open} aria-describedby={id} onClick={() => setOpen(o => !o)}
      >
        <Info size={12} aria-hidden="true" />
      </button>
      <span role="tooltip" id={id} className="tj-info-pop">{children}</span>
    </span>
  );
}

// ─────────────────────────── Segmented ───────────────────────────

export function TjSegmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <div className="tj-seg" role="tablist" aria-label={label}>
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          className={o.value === value ? "active" : undefined}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ───────────────────────────── Select ─────────────────────────────

export function TjSelect({
  value,
  onChange,
  options,
  compact = false,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(open, () => setOpen(false));
  const selected = options.find(o => o.value === value);

  return (
    <div className={`tj-select${compact ? " compact" : ""}`} ref={ref}>
      <button type="button" className={`tj-select-btn${open ? " open" : ""}`} onClick={() => setOpen(o => !o)}>
        <span>{selected?.label ?? value}</span>
        <ChevronDown size={15} className={`tj-select-chevron${open ? " open" : ""}`} />
      </button>
      {open && (
        <ul className="tj-select-menu" role="listbox">
          {options.map(opt => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={`tj-select-option${opt.value === value ? " active" : ""}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─────────────────────────── Combobox ───────────────────────────

export function TjCombobox({
  value,
  onChange,
  options,
  placeholder,
  required = false,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(open, () => setOpen(false));

  const filtered = (value
    ? options.filter(o => o.toLowerCase().includes(value.toLowerCase()) && o !== value)
    : options
  ).slice(0, 8);

  return (
    <div className="tj-select" ref={ref}>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
        required={required}
      />
      {open && filtered.length > 0 && (
        <ul className="tj-select-menu" role="listbox">
          {filtered.map(opt => (
            <li
              key={opt}
              role="option"
              aria-selected={opt === value}
              className={`tj-select-option${opt === value ? " active" : ""}`}
              onClick={() => { onChange(opt); setOpen(false); }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ───────────────────────────── Date & time ─────────────────────────────

function pad(n: number) { return n.toString().padStart(2, "0"); }

function parseValue(value: string): Date {
  const d = value ? new Date(value) : new Date();
  return isNaN(d.getTime()) ? new Date() : d;
}

function toValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDisplay(d: Date): string {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TjDateTimePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = parseValue(value);
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());
  const ref = useClickOutside(open, () => setOpen(false));

  function openPicker() {
    setViewYear(selected.getFullYear());
    setViewMonth(selected.getMonth());
    setOpen(true);
  }

  function pickDay(day: number) {
    const d = new Date(selected);
    d.setFullYear(viewYear, viewMonth, day);
    onChange(toValue(d));
  }

  function setHour(h: number) {
    const d = new Date(selected);
    d.setHours(h);
    onChange(toValue(d));
  }

  function setMinute(m: number) {
    const d = new Date(selected);
    d.setMinutes(m);
    onChange(toValue(d));
  }

  function goToday() {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    onChange(toValue(now));
  }

  function shiftMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  }

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // lunes = 0
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const isSelectedDay = (day: number) =>
    day === selected.getDate() && viewMonth === selected.getMonth() && viewYear === selected.getFullYear();

  return (
    <div className="tj-select" ref={ref}>
      <button type="button" className={`tj-select-btn is-date${open ? " open" : ""}`} onClick={() => (open ? setOpen(false) : openPicker())}>
        <CalendarIcon size={14} />
        <span>{formatDisplay(selected)}</span>
      </button>

      {open && (
        <div className="tj-datepicker-panel">
          <div className="tj-datepicker-head">
            <button type="button" onClick={() => shiftMonth(-1)} aria-label="Mes anterior">
              <ChevronLeft size={16} />
            </button>
            <span>{MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" onClick={() => shiftMonth(1)} aria-label="Mes siguiente">
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="tj-datepicker-weekdays">
            {WEEKDAYS.map(w => <span key={w}>{w}</span>)}
          </div>

          <div className="tj-datepicker-grid">
            {cells.map((day, i) => (
              <button
                type="button"
                key={i}
                disabled={day == null}
                className={`tj-datepicker-day${day != null && isSelectedDay(day) ? " active" : ""}`}
                onClick={() => day != null && pickDay(day)}
              >
                {day ?? ""}
              </button>
            ))}
          </div>

          <div className="tj-datepicker-time">
            <label>
              Hora
              <input
                type="number" min={0} max={23} value={selected.getHours()}
                onChange={(e) => setHour(Math.min(23, Math.max(0, Number(e.target.value) || 0)))}
              />
            </label>
            <label>
              Min.
              <input
                type="number" min={0} max={59} value={selected.getMinutes()}
                onChange={(e) => setMinute(Math.min(59, Math.max(0, Number(e.target.value) || 0)))}
              />
            </label>
            <button type="button" className="tj-datepicker-today" onClick={goToday}>Ahora</button>
          </div>
        </div>
      )}
    </div>
  );
}
