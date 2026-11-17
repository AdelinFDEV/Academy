"use client";

import { useEffect, useRef, useState, type ComponentPropsWithoutRef, type ReactNode, type RefObject } from "react";
import { motion } from "framer-motion";
import { BarChart3, Gamepad2, HelpCircle, Calculator, Check, X, type LucideIcon } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import { sonar } from "@/lib/sonidos";

/**
 * Piezas compartidas por todos los bloques del aula: el marco de tarjeta, las
 * opciones-tecla con su letra, las letras del teclado físico, el «¿está a la
 * vista?» que dispara las animaciones y los formatos de número.
 *
 * Estilo «Cuaderno de estudio» (17-11-2026): cada bloque es una ficha lavanda
 * sobre la hoja de la lección, con una pestaña del color de su familia
 * (comprobar en lila, minijuego en naranja, calculadora en azul, gráfico en
 * cielo). Las respuestas son teclas con su letra: acierto en menta, fallo en
 * coral, como «Quiz» en disenos/sistema.html.
 */

export type Clase = "grafico" | "juego" | "pregunta" | "calculadora";

const CLASES: Record<Clase, { icono: LucideIcon; etiqueta: string }> = {
  grafico: { icono: BarChart3, etiqueta: "Gráfico" },
  juego: { icono: Gamepad2, etiqueta: "Minijuego" },
  pregunta: { icono: HelpCircle, etiqueta: "Comprueba" },
  calculadora: { icono: Calculator, etiqueta: "Calculadora" },
};

export function Marco({
  clase,
  titulo,
  subtitulo,
  children,
}: {
  clase: Clase;
  titulo?: string;
  subtitulo?: string;
  children: ReactNode;
}) {
  const { icono: Icono, etiqueta } = CLASES[clase];
  return (
    <motion.section
      className={`aula-bloque aula-bloque--${clase}`}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      <header className="aula-bloque-head">
        <span className="aula-bloque-kicker">
          <Icono size={14} strokeWidth={2.4} aria-hidden="true" />
          {etiqueta}
        </span>
        {titulo && <h3 className="aula-bloque-titulo">{titulo}</h3>}
        {subtitulo && <p className="aula-bloque-sub">{subtitulo}</p>}
      </header>
      {children}
    </motion.section>
  );
}

// ── Las respuestas: teclas con su letra ──────────────────────────────────────

export type EstadoOpcion = "buena" | "mala" | "neutra" | "elegida" | undefined;

/** La letra de una opción: A, B, C, D… */
export const letra = (i: number) => String.fromCharCode(65 + i);

/**
 * Una respuesta: una tecla blanca con su letra en una teclita. Al contestar,
 * la buena pasa a menta y la fallada a coral; las demás se quedan legibles
 * (`neutra`), nunca transparentes.
 */
export function Opcion({
  marca,
  estado,
  pulsada,
  children,
  ...boton
}: {
  marca: string;
  estado?: EstadoOpcion;
  pulsada?: boolean;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"button">, "className" | "children" | "color">) {
  return (
    <Tecla
      color="blanca"
      ancho
      className={`aula-opcion${estado ? ` is-${estado}` : ""}${pulsada ? " is-pulsada" : ""}`}
      {...boton}
    >
      <kbd className="aula-opcion-letra" aria-hidden="true">{marca}</kbd>
      <span className="aula-opcion-texto">{children}</span>
      {estado === "buena" && <Check className="aula-opcion-ic" size={18} strokeWidth={3} aria-hidden="true" />}
      {estado === "mala" && <X className="aula-opcion-ic" size={18} strokeWidth={3} aria-hidden="true" />}
    </Tecla>
  );
}

// ── El teclado físico ────────────────────────────────────────────────────────

/**
 * Los bloques que escuchan letras ahora mismo. Con varias preguntas en una
 * lección, la letra va a la que tiene el foco dentro o, si no lo tiene
 * ninguna, a la que está más cerca del centro de la pantalla.
 */
const oyentes = new Set<HTMLElement>();

function duenoDeLaLetra(): HTMLElement | null {
  const foco = document.activeElement;
  if (foco && foco !== document.body) {
    for (const el of oyentes) if (el.contains(foco)) return el;
  }
  const centro = window.innerHeight / 2;
  let mejor: HTMLElement | null = null;
  let distancia = Infinity;
  for (const el of oyentes) {
    const r = el.getBoundingClientRect();
    if (r.bottom <= 0 || r.top >= window.innerHeight) continue;
    const d = Math.abs((r.top + r.bottom) / 2 - centro);
    if (d < distancia) {
      distancia = d;
      mejor = el;
    }
  }
  return mejor;
}

/**
 * Las respuestas se pulsan también con el teclado físico (ESTILO.md): cada
 * tecla de `teclas` («A», «B»… o «V», «F») elige su opción. La opción se hunde
 * un instante, como si se hubiera pulsado con el dedo, y suena.
 *
 * No escucha mientras se escribe en un campo, con Ctrl/Cmd/Alt, ni con una
 * ventana abierta encima (el diccionario, la confirmación del examen).
 */
export function useLetras<T extends HTMLElement>(
  ref: RefObject<T | null>,
  teclas: string[],
  alElegir: (i: number) => void,
  activo = true,
) {
  const [pulsada, setPulsada] = useState<number | null>(null);
  const espera = useRef(0);
  const elegir = useRef(alElegir);
  useEffect(() => {
    elegir.current = alElegir;
  });
  const clave = teclas.join("");

  useEffect(() => {
    const el = ref.current;
    if (!el || !activo) return;
    oyentes.add(el);
    const lista = clave.split("");
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || e.key.length !== 1) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      const i = lista.indexOf(e.key.toUpperCase());
      if (i < 0) return;
      const modal = document.querySelector('[aria-modal="true"]');
      if (modal && !el.contains(modal)) return;
      if (duenoDeLaLetra() !== el) return;
      e.preventDefault();
      sonar("tecla");
      setPulsada(i);
      window.clearTimeout(espera.current);
      espera.current = window.setTimeout(() => setPulsada(null), 140);
      elegir.current(i);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      oyentes.delete(el);
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(espera.current);
    };
  }, [ref, clave, activo]);

  return pulsada;
}

// ── Utilidades ───────────────────────────────────────────────────────────────

/** `true` en cuanto el elemento entra en pantalla, y ya no vuelve a `false`. */
export function useEnVista<T extends Element>() {
  const ref = useRef<T>(null);
  const [visto, setVisto] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || visto) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisto(true);
          obs.disconnect();
        }
      },
      { rootMargin: "-40px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [visto]);
  return { ref, visto };
}

export type Formato = "eur" | "pct" | "num";

export function formatear(valor: number, formato: Formato = "num"): string {
  if (formato === "eur") {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: valor % 1 ? 2 : 0 }).format(valor);
  }
  if (formato === "pct") return `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(valor)} %`;
  return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 8 }).format(valor);
}

/**
 * Baraja SIEMPRE igual para la misma semilla. Con `Math.random` el servidor y
 * el navegador pintarían órdenes distintos y React se quejaría al hidratar.
 */
export function barajarFijo<T>(lista: T[], semilla: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < semilla.length; i++) h = Math.imul(h ^ semilla.charCodeAt(i), 16777619);
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    const j = h % (i + 1);
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Recuadro que ve el admin cuando un bloque está mal escrito. El alumno no lo ve. */
export function BloqueRoto({ bloque, motivo, esAdmin }: { bloque: string; motivo: string; esAdmin: boolean }) {
  if (!esAdmin) return null;
  return (
    <div className="aula-bloque-roto" role="alert">
      <strong>Bloque «{bloque}» no se puede pintar.</strong> {motivo}
      <span> (Solo lo ves tú, como admin.)</span>
    </div>
  );
}
