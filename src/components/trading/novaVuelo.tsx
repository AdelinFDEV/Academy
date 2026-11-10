"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { animate, motion, useMotionValue, useSpring, type MotionValue } from "framer-motion";
import NovaHead from "./NovaHead";

/*
 * El viaje de Nova entre la barra de arriba y el Diario de Trading.
 *
 * Nova vive en dos sitios: dentro del Diario (TjBot, en su habitación) y, en
 * el resto de la web, en la barra, pegada a «Diario de Trading» (NovaNav).
 *   · Al entrar al Diario, TjBot busca su hueco en la barra y la hace volar
 *     desde allí hasta la habitación.
 *   · Al salir, TjBot deja apuntado dónde estaba (`dejarSalida`) y NovaNav, al
 *     montarse en la página siguiente, la hace volar desde ahí hasta la barra.
 * Lo apuntado vive en el módulo: sobrevive a la navegación de cliente y no a
 * una recarga, que es justo lo que se quiere (al recargar no hay viaje).
 *
 * Desde el 10-11-2026 todos los vuelos llevan ESTELA (NovaEstela): cinco luces
 * que siguen a Nova con muelles cada vez más perezosos y dibujan su trayectoria.
 */

/** El hueco de Nova en la barra. Lo pinta NovaNav. */
export const NOVA_NAV_SELECTOR = "[data-nova-nav]";

/** Tamaño de Nova en la barra (px). Tiene que coincidir con `.nova-nav .nh` en nova.css. */
export const NOVA_NAV_SIZE = 34;

/** Tamaño de la cabeza tal cual la dibuja el CSS (`.nh`). */
const HEAD = 112;

/** Dónde está Nova en la pantalla: esquina superior izquierda y lado. */
export interface CajaNova {
  x: number;
  y: number;
  size: number;
}

let salida: { caja: CajaNova; t: number } | null = null;
let enDiario = false;

/** TjBot, al desmontarse: «estaba aquí». */
export function dejarSalida(caja: CajaNova) {
  salida = { caja, t: Date.now() };
}

/** NovaNav, al montarse: de dónde viene Nova, si acaba de salir del Diario. Se consume. */
export function tomarSalida(): CajaNova | null {
  const s = salida;
  salida = null;
  return s && Date.now() - s.t < 3000 ? s.caja : null;
}

/**
 * TjBot, al montarse: ¿tiene que llegar volando desde la barra? Solo la
 * primera vez en cada visita al Diario; cambiar de vista dentro de él y volver
 * al Resumen no la hace viajar otra vez.
 */
export function llegarAlDiario(): boolean {
  const primera = !enDiario;
  enDiario = true;
  return primera;
}

/** NovaNav, fuera del Diario: la próxima entrada vuelve a ser un viaje. */
export function salirDelDiario() {
  enDiario = false;
}

/** El hueco de Nova en la barra, si se ve (en el móvil la barra central no se pinta). */
export function cajaDeLaBarra(): CajaNova | null {
  const hueco = document.querySelector<HTMLElement>(NOVA_NAV_SELECTOR);
  if (!hueco || hueco.getClientRects().length === 0) return null;
  const r = hueco.getBoundingClientRect();
  // Nova va centrada en su muelle. En el Diario el muelle está recogido (ancho 0):
  // sale de donde estaría.
  const ancho = r.width || NOVA_NAV_SIZE + 10;
  return { x: r.left + (ancho - NOVA_NAV_SIZE) / 2, y: r.top + (r.height - NOVA_NAV_SIZE) / 2, size: NOVA_NAV_SIZE };
}

export function cajaDe(el: Element | null | undefined): CajaNova | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width > 0 ? { x: r.left, y: r.top, size: r.width } : null;
}

export function sinAnimaciones() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// ─────────────────────────── La estela ───────────────────────────

/*
 * Cinco luces que siguen la posición de Nova con muelles cada vez más
 * perezosos: se quedan atrás y dibujan la trayectoria. Son cajas del tamaño
 * de la cabeza (112 px) con una luz en el centro, así comparten origen con
 * ella y la escala las acompaña. Quien vuela le pasa sus valores de movimiento.
 */
const ESTELA = [
  { stiffness: 420, damping: 30, size: 22, opacity: 0.55 },
  { stiffness: 300, damping: 28, size: 18, opacity: 0.42 },
  { stiffness: 210, damping: 26, size: 14, opacity: 0.3 },
  { stiffness: 150, damping: 24, size: 11, opacity: 0.2 },
  { stiffness: 105, damping: 22, size: 8, opacity: 0.12 },
];

function Luz({ x, y, scale, cfg }: { x: MotionValue<number>; y: MotionValue<number>; scale: MotionValue<number>; cfg: (typeof ESTELA)[number] }) {
  const sx = useSpring(x, { stiffness: cfg.stiffness, damping: cfg.damping });
  const sy = useSpring(y, { stiffness: cfg.stiffness, damping: cfg.damping });
  const ss = useSpring(scale, { stiffness: cfg.stiffness, damping: cfg.damping });
  return (
    <motion.span className="nova-estela" style={{ x: sx, y: sy, scale: ss, width: HEAD, height: HEAD }} aria-hidden="true">
      <i style={{ width: cfg.size, height: cfg.size, opacity: cfg.opacity }} />
    </motion.span>
  );
}

export function NovaEstela({ x, y, scale }: { x: MotionValue<number>; y: MotionValue<number>; scale: MotionValue<number> }) {
  return (
    <motion.span className="nova-estelas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.35 } }}>
      {ESTELA.map((cfg, i) => <Luz key={i} x={x} y={y} scale={scale} cfg={cfg} />)}
    </motion.span>
  );
}

// ─────────────────────────── El viaje ───────────────────────────

/**
 * Nova volando de una caja a otra, en arco, por encima de todo. Coge impulso,
 * se agranda o se encoge por el camino, se inclina hacia donde va y se gira de
 * lado al volar; al llegar se pone de frente y se asienta con un rebote. Lleva
 * su estela. Quien la usa esconde a la Nova de destino mientras tanto y la
 * enseña en `onFin`.
 */
export function NovaVuelo({ desde, hasta, onFin }: { desde: CajaNova; hasta: CajaNova; onFin: () => void }) {
  const theta = useMotionValue(0);
  const x = useMotionValue(desde.x);
  const y = useMotionValue(desde.y);
  const scale = useMotionValue(desde.size / HEAD);
  const dir = hasta.x >= desde.x ? 1 : -1;
  const s0 = desde.size / HEAD;
  const s1 = hasta.size / HEAD;
  // El punto alto del arco: por encima de los dos extremos, sin salirse mucho de la pantalla.
  const cimaY = Math.max(-10, Math.min(desde.y, hasta.y) - 60);
  const mitadX = (desde.x + hasta.x) / 2;

  useEffect(() => {
    const giro = animate(theta, dir * 65, { type: "spring", stiffness: 60, damping: 14, delay: 0.1 });
    const frente = window.setTimeout(() => animate(theta, 0, { type: "spring", stiffness: 70, damping: 14 }), 850);
    return () => {
      giro.stop();
      window.clearTimeout(frente);
    };
  }, [theta, dir]);

  return createPortal(
    <>
      <NovaEstela x={x} y={y} scale={scale} />
      <motion.div
        className="nova-vuelo"
        style={{ x, y, scale }}
        initial={{ x: desde.x, y: desde.y, scale: s0, rotate: 0 }}
        animate={{
          x: [desde.x, desde.x, mitadX, hasta.x],
          y: [desde.y, desde.y + 6, cimaY, hasta.y],
          scale: [s0, s0 * 0.9, Math.max(s0, s1) * 1.08, s1 * 1.08, s1 * 0.97, s1],
          rotate: [0, -dir * 5, dir * 14, -dir * 5, dir * 2, 0],
        }}
        transition={{
          x: { duration: 1.2, times: [0, 0.12, 0.5, 1], ease: ["easeOut", "easeOut", "easeInOut"] },
          y: { duration: 1.2, times: [0, 0.12, 0.45, 1], ease: ["easeOut", "easeOut", "easeIn"] },
          scale: { duration: 1.32, times: [0, 0.12, 0.5, 0.86, 0.94, 1], ease: "easeInOut" },
          rotate: { duration: 1.28, times: [0, 0.12, 0.45, 0.82, 0.92, 1], ease: "easeInOut" },
        }}
        onAnimationComplete={onFin}
        aria-hidden="true"
      >
        <NovaHead theta={theta} face="joy" activity="none" flying joy={false} talking={false} track={false} />
      </motion.div>
    </>,
    document.body,
  );
}
