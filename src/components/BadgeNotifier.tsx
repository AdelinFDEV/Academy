"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { bloquearScroll } from "@/lib/bloquearScroll";
import confetti from "canvas-confetti";
import Tecla from "@/components/cuaderno/Tecla";
import { sonar } from "@/lib/sonidos";
import { BADGE_DEFS, GUIDE_BADGE_DEFS_TODAS } from "@/lib/logros";
import "./badge-notifier.css";

/**
 * Lo que el aviso necesita para pintarse. Un logro de `logros.tsx` ya lo cumple;
 * otras partes de la web (los hitos del diario) mandan el suyo completo en
 * `detail.notices`, con su propio encabezado y su enlace.
 */
export interface UnlockNotice {
  id: string;
  label: string;
  condition: string;
  reward?: string;
  bigIcon: React.ReactNode;
  special?: boolean;
  eyebrow?: string;
  link?: { href: string; label: string };
}

export interface UnlockEventDetail {
  ids?: string[];
  notices?: UnlockNotice[];
}

const ALL_BADGE_DEFS: UnlockNotice[] = [...BADGE_DEFS, ...GUIDE_BADGE_DEFS_TODAS];

/** Los colores del confeti: la paleta del cuaderno, con el amarillo de los logros delante. */
const COLORES_CONFETI = ["#ffd23f", "#ff8a1f", "#2fc488", "#8f7cff", "#2fbff5", "#ff6b81"];

/**
 * La celebración: la fanfarria `logro` y confeti por encima del aviso (y, si
 * el logro es especial, también desde los dos lados). Solo en un momento
 * ganado (ESTILO.md); el confeti, nunca con «reducir movimiento»
 * (`disableForReducedMotion`).
 */
function celebrar(especial: boolean) {
  // El sonido va al compás de la animación: el «toc» suena cuando la pegatina
  // se estampa (0,42 s) y el confeti sale justo entonces.
  sonar("logro", especial ? 2 : 1);
  const comun = { colors: COLORES_CONFETI, zIndex: 10001, disableForReducedMotion: true } as const;
  const reloj = window.setTimeout(() => {
    void confetti({ ...comun, particleCount: especial ? 110 : 70, spread: 90, startVelocity: 46, scalar: 1.05, origin: { x: 0.5, y: 0.36 } });
    void confetti({ ...comun, particleCount: 26, spread: 360, startVelocity: 22, gravity: 0.6, shapes: ["star"], scalar: 1.3, origin: { x: 0.5, y: 0.3 } });
    if (especial) {
      void confetti({ ...comun, particleCount: 55, angle: 60, spread: 70, origin: { x: 0, y: 0.75 } });
      void confetti({ ...comun, particleCount: 55, angle: 120, spread: 70, origin: { x: 1, y: 0.75 } });
    }
  }, 420);
  return () => window.clearTimeout(reloj);
}

/**
 * El aviso de logro, estilo «Cuaderno de estudio» (17-11-2026): una tarjeta de
 * papel sobre la que cae una PEGATINA redonda (amarillo, el color de los
 * logros; naranja de marca si es especial) que se estampa girando, con la
 * fanfarria `logro`. Al cerrarlo suena `cerrar`.
 */
function Popup({ badge, onClose }: { badge: UnlockNotice; onClose: () => void }) {
  const link = badge.link ?? { href: "/logros", label: "Ver Logros" };

  const cerrar = useCallback(() => {
    sonar("cerrar");
    onClose();
  }, [onClose]);

  useEffect(() => celebrar(!!badge.special), [badge]);

  // Solo se cierra con «¡Genial!» (23-11-2026, pedido por el admin): ni
  // tocando fuera ni con Escape, para que un doble clic sin querer no corte la
  // animación. Y los botones no responden hasta que la animación ha entrado
  // (1,4 s; al momento con «reducir movimiento»).
  const [listo, setListo] = useState(false);
  useEffect(() => {
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const reloj = window.setTimeout(() => setListo(true), quieto ? 0 : 1400);
    return () => window.clearTimeout(reloj);
  }, [badge]);

  // Con el aviso a la vista, la página de detrás no se desplaza: una sola
  // barra de desplazamiento, la del propio aviso (si no cabe, en el móvil
  // apaisado). Se bloquea el <html> y no solo el <body>: con `overflow-x`
  // en los dos (globals.css), bloquear solo el body dejaba dos barras.
  useEffect(() => bloquearScroll(), []);

  return (
    <div className={`bn-fondo${badge.special ? " is-especial" : ""}`}>
      {/* Detrás de la tarjeta: rayos que giran y una onda que sale al estamparse. */}
      <span className="bn-rayos" aria-hidden="true" />
      <div
        className={`bn-tarjeta${badge.special ? " bn-tarjeta--especial" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bn-titulo"
      >
        <div className="bn-escena" aria-hidden="true">
          <span className="bn-onda" />
          <span className="bn-onda bn-onda--2" />
          <span className="bn-chispas">
            {Array.from({ length: 10 }, (_, i) => <i key={i} style={{ "--i": i } as React.CSSProperties} />)}
          </span>
          <div className="bn-pegatina">
            <span className="bn-pegatina-icono">{badge.bigIcon}</span>
            {badge.special && <span className="bn-estrella">★</span>}
          </div>
        </div>

        <p className="bn-antetitulo">{badge.eyebrow ?? "¡Logro desbloqueado!"}</p>
        <h3 id="bn-titulo" className="bn-titulo">{badge.label}</h3>
        <p className="bn-desc">{badge.condition}</p>
        {badge.reward && (
          <p className="bn-premio">
            <span aria-hidden="true">★</span> {badge.reward}
          </p>
        )}

        <div className={`bn-acciones${listo ? " is-lista" : ""}`}>
          <Tecla color={badge.special ? "naranja" : "amarillo"} ancho autoFocus onClick={cerrar}>¡Genial!</Tecla>
          {/* Un enlace de solo hash no puede ir por Link (no dispara
              "hashchange"): se cambia el hash a mano. */}
          {link.href.startsWith("#") ? (
            <Tecla
              color="blanca"
              tamano="peq"
              ancho
              onClick={() => {
                cerrar();
                window.location.hash = link.href.slice(1);
              }}
            >
              {link.label}
            </Tecla>
          ) : (
            <Tecla href={link.href} color="blanca" tamano="peq" ancho onClick={cerrar}>
              {link.label}
            </Tecla>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * La cola de avisos. Vive en refs y no en estado: el oyente se registra una
 * sola vez y no hay efectos dentro de un `setState`. Antes, con dos logros en
 * cola a la vez, al cerrar el primero se saltaba el segundo (repaso del
 * 17-11-2026).
 */
export default function BadgeNotifier() {
  const [current, setCurrent] = useState<UnlockNotice | null>(null);
  const cola = useRef<UnlockNotice[]>([]);
  const ocupado = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mostrar = useCallback((aviso: UnlockNotice | null) => {
    ocupado.current = aviso !== null;
    setCurrent(aviso);
  }, []);

  const dismiss = useCallback(() => {
    mostrar(null);
    const siguiente = cola.current.shift();
    if (!siguiente) return;
    // Una pausa corta entre aviso y aviso, para que se note que es otro.
    ocupado.current = true;
    timer.current = setTimeout(() => {
      timer.current = null;
      mostrar(siguiente);
    }, 300);
  }, [mostrar]);

  useEffect(() => {
    function onBadge(e: Event) {
      const { ids = [], notices = [] } = (e as CustomEvent<UnlockEventDetail>).detail;
      const badges = [
        ...ids.map((id) => ALL_BADGE_DEFS.find((b) => b.id === id)).filter((b): b is UnlockNotice => !!b),
        ...notices,
      ];
      if (badges.length === 0) return;
      cola.current.push(...badges);
      if (!ocupado.current) mostrar(cola.current.shift() ?? null);
    }

    window.addEventListener("badge-unlocked", onBadge);
    return () => {
      window.removeEventListener("badge-unlocked", onBadge);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [mostrar]);

  if (!current) return null;
  return <Popup badge={current} onClose={dismiss} />;
}
