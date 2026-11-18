"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info, Plus } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import { sonar } from "@/lib/sonidos";
import { WEEKDAYS, MONTHS } from "./tjFormat";
import { useSonidoVentana } from "./useSonidoVentana";

function useClickOutside<T extends HTMLElement = HTMLDivElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!open) return;
    // pointerdown y no mousedown: con el dedo, mousedown llega tarde (tras
    // soltar) y a veces no llega; así un toque fuera cierra igual que un clic.
    function onDocClick(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("pointerdown", onDocClick);
    return () => document.removeEventListener("pointerdown", onDocClick);
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
  const pop = useRef<HTMLSpanElement>(null);
  const id = useId();
  useSonidoVentana(open);

  // El papelito va centrado sobre la tecla; si la tecla está cerca de un borde
  // de la pantalla (en el móvil, casi siempre), se corre lo justo para no
  // salirse. La flecha sigue apuntando a la tecla (--dx en diario.css).
  useLayoutEffect(() => {
    const el = pop.current;
    if (!el) return;
    if (!open) { el.style.removeProperty("--dx"); return; }
    el.style.removeProperty("--dx");
    const r = el.getBoundingClientRect();
    const margen = 12;
    const ancho = document.documentElement.clientWidth;
    const dx = r.left < margen ? margen - r.left : r.right > ancho - margen ? ancho - margen - r.right : 0;
    if (dx) el.style.setProperty("--dx", `${Math.round(dx)}px`);
  }, [open]);

  return (
    <span className={`dj-info${open ? " is-abierta" : ""}`} ref={ref} onKeyDown={e => e.key === "Escape" && setOpen(false)}>
      <Tecla
        color="blanca" icono className="dj-mini" aria-label={`Qué significa: ${label}`}
        aria-expanded={open} aria-describedby={id} onClick={() => setOpen(o => !o)}
      >
        <Info size={12} strokeWidth={2.6} aria-hidden="true" />
      </Tecla>
      <span role="tooltip" id={id} className="dj-info-pop" ref={pop}>{children}</span>
    </span>
  );
}

// ─────────────────────────── Segmented ───────────────────────────

/**
 * Opciones en fila con una sola activa: una tecla cada una (estilo «Cuaderno
 * de estudio», 17-11-2026). La activa es azul, el color del Diario; las demás,
 * blancas. Sin pastilla deslizante: ya no hay nada que framer-motion tenga que
 * medir al cambiar de vista.
 */
export function TjSegmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
  className?: string;
}) {
  return (
    <div className={`dj-seg${className ? ` ${className}` : ""}`} role="tablist" aria-label={label}>
      {options.map(o => (
        <Tecla
          key={o.value}
          role="tab"
          tamano="peq"
          sonido={o.value === value ? undefined : "pestana"}
          color={o.value === value ? "azul" : "blanca"}
          aria-selected={o.value === value}
          className={o.value === value ? "is-activa" : undefined}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </Tecla>
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
  useSonidoVentana(open);

  const lista = useRef<HTMLUListElement>(null);

  // Al abrir, el foco pasa a la opción elegida: así el menú se maneja también
  // con el teclado (flechas, Intro y Escape), no solo con el ratón.
  useEffect(() => {
    if (!open) return;
    const activa = lista.current?.querySelector<HTMLElement>('[aria-selected="true"]') ?? lista.current?.querySelector<HTMLElement>("li");
    activa?.focus({ preventScroll: true });
  }, [open]);

  function elegir(v: string) {
    onChange(v);
    setOpen(false);
    ref.current?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
  }

  function conTeclado(e: React.KeyboardEvent<HTMLLIElement>, v: string) {
    const li = e.currentTarget;
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); elegir(v); }
    else if (e.key === "ArrowDown") { e.preventDefault(); (li.nextElementSibling as HTMLElement | null)?.focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); (li.previousElementSibling as HTMLElement | null)?.focus(); }
    else if (e.key === "Escape" || e.key === "Tab") {
      // Escape cierra el menú, no la ventana en la que esté.
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); }
      setOpen(false);
      if (e.key === "Escape") ref.current?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
    }
  }

  return (
    <div className={`dj-select${compact ? " is-compacto" : ""}`} ref={ref}>
      <Tecla
        color="blanca" tamano="peq" aria-haspopup="listbox" aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <span>{selected?.label ?? value}</span>
        <ChevronDown size={15} strokeWidth={2.6} className={`dj-select-flecha${open ? " is-abierta" : ""}`} aria-hidden="true" />
      </Tecla>
      {open && (
        <ul className="dj-menu" role="listbox" ref={lista}>
          {options.map(opt => (
            <li
              key={opt.value}
              role="option"
              tabIndex={-1}
              aria-selected={opt.value === value}
              className={`dj-menu-op${opt.value === value ? " is-activa" : ""}`}
              onClick={() => { sonar("elegir"); elegir(opt.value); }}
              onKeyDown={e => conTeclado(e, opt.value)}
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
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(open, () => setOpen(false));

  const filtered = (value
    ? options.filter(o => o.toLowerCase().includes(value.toLowerCase()) && o !== value)
    : options
  ).slice(0, 8);
  // La lista son sugerencias, no un cerrojo: lo que se escribe vale aunque no
  // esté en ella. Si no está, la primera fila del menú lo dice con todas las
  // letras (13-11-2026: el campo parecía un desplegable y no se veía que
  // admitía cualquier par).
  const escrito = value.trim();
  const esNuevo = escrito !== "" && !options.some(o => o.toLowerCase() === escrito.toLowerCase());

  return (
    <div className="dj-select" ref={ref}>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === "Escape" && open) { e.stopPropagation(); setOpen(false); } }}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        required={required}
        maxLength={maxLength}
      />
      {open && (filtered.length > 0 || esNuevo) && (
        <ul className="dj-menu" role="listbox">
          {esNuevo && (
            <li
              role="option"
              aria-selected="true"
              className="dj-menu-op is-nueva"
              onClick={() => { onChange(escrito); setOpen(false); }}
            >
              <Plus size={14} aria-hidden="true" />
              <span>Usar <strong>{escrito}</strong></span>
              <small>no está en la lista</small>
            </li>
          )}
          {filtered.map(opt => (
            <li
              key={opt}
              role="option"
              aria-selected={opt === value}
              className={`dj-menu-op${opt === value ? " is-activa" : ""}`}
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
  useSonidoVentana(open);

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
    <div className="dj-select" ref={ref}>
      <Tecla color="blanca" className="dj-llana" aria-expanded={open} onClick={() => (open ? setOpen(false) : openPicker())}>
        <CalendarIcon size={16} strokeWidth={2.4} aria-hidden="true" />
        <span>{formatDisplay(selected)}</span>
      </Tecla>

      {open && (
        <div
          className="dj-fecha-panel"
          onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); setOpen(false); } }}
        >
          <div className="dj-fecha-cab">
            <Tecla color="blanca" tamano="peq" icono sonido="pestana" onClick={() => shiftMonth(-1)} aria-label="Mes anterior">
              <ChevronLeft size={16} strokeWidth={2.6} />
            </Tecla>
            <span>{MONTHS[viewMonth]} {viewYear}</span>
            <Tecla color="blanca" tamano="peq" icono sonido="pestana" onClick={() => shiftMonth(1)} aria-label="Mes siguiente">
              <ChevronRight size={16} strokeWidth={2.6} />
            </Tecla>
          </div>

          <div className="dj-fecha-semana">
            {WEEKDAYS.map(w => <span key={w}>{w}</span>)}
          </div>

          <div className="dj-fecha-dias">
            {cells.map((day, i) => day == null ? (
              <span key={i} className="dj-fecha-hueco" aria-hidden="true" />
            ) : (
              <Tecla
                key={i}
                color={isSelectedDay(day) ? "azul" : "blanca"}
                className="dj-mini"
                sonido="elegir"
                aria-pressed={isSelectedDay(day)}
                onClick={() => pickDay(day)}
              >
                {day}
              </Tecla>
            ))}
          </div>

          <div className="dj-fecha-hora">
            <label>
              Hora
              <input
                type="number" inputMode="numeric" min={0} max={23} value={selected.getHours()}
                onChange={(e) => setHour(Math.min(23, Math.max(0, Number(e.target.value) || 0)))}
              />
            </label>
            <label>
              Min.
              <input
                type="number" inputMode="numeric" min={0} max={59} value={selected.getMinutes()}
                onChange={(e) => setMinute(Math.min(59, Math.max(0, Number(e.target.value) || 0)))}
              />
            </label>
            <Tecla color="blanca" tamano="peq" onClick={goToday}>Ahora</Tecla>
            {/* Cerrar a la vista: en el móvil no hay «fuera» cómodo que tocar. */}
            <Tecla color="azul" tamano="peq" className="dj-fecha-listo" onClick={() => setOpen(false)}>Listo</Tecla>
          </div>
        </div>
      )}
    </div>
  );
}
