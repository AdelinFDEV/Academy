"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Award, Check, ChevronRight } from "lucide-react";
import { herramienta } from "@/lib/herramientas";

export type PiezaPremium = {
  id: "diario" | "portfolio" | "cursos";
  titulo: string;
  linea: string;
  dato: { valor: string; key: string } | null;
  puntos: string[];
  href: string;
};

/* ── Ilustraciones ──────────────────────────────────────────────────────────
   Una por pieza, dibujada en SVG: enseñan el producto en vez de describirlo.
   Son decorativas y no llevan cifras: los números de verdad van debajo, en
   el dato de cada tarjeta. Se animan al pasar el ratón por la tarjeta. */

const CURVA =
  "M0 74 C14 70 20 62 32 64 C46 66 50 72 62 68 C78 63 82 48 96 45 " +
  "C110 42 116 52 130 49 C146 45 150 30 166 27 C180 24 186 33 200 30 " +
  "C216 26 220 14 236 11 C250 8 256 14 270 9";

/** Velas detrás de la curva: [x, apertura, cierre, máximo, mínimo] en px. */
const VELAS: [number, number, number, number, number][] = [
  [18, 66, 58, 54, 70], [44, 60, 68, 56, 72], [70, 64, 52, 48, 68], [96, 52, 44, 40, 56],
  [122, 46, 54, 42, 58], [148, 50, 36, 32, 54], [174, 34, 30, 26, 40], [200, 32, 38, 28, 42],
  [226, 30, 18, 14, 34], [252, 20, 12, 8, 24],
];

function VisualDiario() {
  return (
    <svg className="pz-svg pz-svg--diario" viewBox="0 0 270 84" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="pzDiarioArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--c)", stopOpacity: 0.35 }} />
          <stop offset="1" style={{ stopColor: "var(--c)", stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      {VELAS.map(([x, o, c, h, l]) => (
        <g key={x} className={c < o ? "pz-vela is-sube" : "pz-vela"}>
          <line x1={x} x2={x} y1={h} y2={l} />
          <rect x={x - 4} y={Math.min(o, c)} width={8} height={Math.max(Math.abs(o - c), 2)} rx={1.5} />
        </g>
      ))}
      <path d={`${CURVA} L270 84 L0 84 Z`} fill="url(#pzDiarioArea)" />
      <path className="pz-curva" d={CURVA} pathLength={1} />
      <circle className="pz-punta" cx="270" cy="9" r="4" />
    </svg>
  );
}

/** Alturas fijas, de menos a más: una cartera que crece. */
const BARRAS = [34, 46, 40, 58, 52, 70, 64, 82, 76, 94];

function VisualPortfolio() {
  return (
    <div className="pz-barras" aria-hidden="true">
      {BARRAS.map((alto, i) => (
        <span key={i} style={{ "--alto": `${alto}%`, "--i": i } as React.CSSProperties} />
      ))}
    </div>
  );
}

function VisualCursos() {
  return (
    <div className="pz-ruta" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span key={i} className="pz-ruta-tramo" style={{ "--i": i } as React.CSSProperties}>
          <span className="pz-ruta-nodo"><Check size={12} strokeWidth={3.2} /></span>
          <span className="pz-ruta-linea" />
        </span>
      ))}
      <span className="pz-sello">
        <Award size={26} strokeWidth={1.8} />
      </span>
    </div>
  );
}

const VISUAL = { diario: VisualDiario, portfolio: VisualPortfolio, cursos: VisualCursos };

/* ── Una tarjeta ───────────────────────────────────────────────────────── */

function Tarjeta({ p }: { p: PiezaPremium }) {
  const h = herramienta(p.id);
  const Icono = h.icon;
  const Visual = VISUAL[p.id];
  const pronto = h.acceso === "proximamente";
  const reduceMotion = useReducedMotion();

  // Inclinación: la posición del ratón, de -0,5 a 0,5, suavizada con un muelle.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 200, damping: 20 });
  const sy = useSpring(my, { stiffness: 200, damping: 20 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [-7, 7]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [6, -6]);

  function mover(e: React.PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    // El foco de luz va por CSS, con la posición en px.
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
    if (reduceMotion || e.pointerType !== "mouse") return;
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }

  function salir() {
    mx.set(0);
    my.set(0);
  }

  return (
    <li className="pz" style={{ "--c": h.color } as React.CSSProperties}>
      <motion.div
        className="pz-tarjeta"
        style={reduceMotion ? undefined : { rotateX, rotateY, transformPerspective: 900 }}
        onPointerMove={mover}
        onPointerLeave={salir}
      >
        <span className="pz-foco" aria-hidden="true" />

        <div className="pz-escena">
          <Visual />
          <span className="pz-icono" aria-hidden="true"><Icono size={18} strokeWidth={2.1} /></span>
          {pronto && <span className="pz-pronto">Próximamente</span>}
        </div>

        <div className="pz-cuerpo">
          <h3 className="pz-titulo">{p.titulo}</h3>
          <p className="pz-linea">{p.linea}</p>

          {p.dato && (
            <p className="pz-dato">
              <strong>{p.dato.valor}</strong>
              <span>{p.dato.key}</span>
            </p>
          )}

          <ul className="pz-puntos">
            {p.puntos.map((t) => (
              <li key={t}><Check size={13} strokeWidth={2.8} aria-hidden="true" /> {t}</li>
            ))}
          </ul>

          {/* A la explicación de la herramienta: su ficha pública. */}
          <Link href={p.href} className="pz-mas">
            Cómo funciona <ArrowRight size={14} strokeWidth={2.4} aria-hidden="true" />
          </Link>
        </div>
      </motion.div>
    </li>
  );
}

/**
 * Las tres piezas de la sección Premium del home. Cada tarjeta lleva arriba
 * una ilustración de su producto, se inclina un poco hacia el ratón y tiene un
 * foco de luz que lo sigue. Con movimiento reducido, ni inclinación ni
 * animaciones: solo el contenido.
 */
export default function PremiumPiezas({ piezas }: { piezas: PiezaPremium[] }) {
  const lista = useRef<HTMLOListElement>(null);
  const [actual, setActual] = useState(0);
  const [deslizado, setDeslizado] = useState(false);
  const [alFinal, setAlFinal] = useState(false);
  // Mientras dura el empujón de bienvenida, el desplazamiento no es del
  // usuario: no debe esconder la pista.
  const empujando = useRef(false);

  // Un empujón la primera vez que el carrusel entra en pantalla: se desliza un
  // poco y vuelve, para que se vea que se puede deslizar. Solo en el móvil
  // (donde es carrusel), una vez, y nunca con el movimiento reducido.
  useEffect(() => {
    const el = lista.current;
    if (!el) return;
    if (!window.matchMedia("(max-width: 760px)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let vuelta = 0;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      empujando.current = true;
      el.scrollBy({ left: 70, behavior: "smooth" });
      vuelta = window.setTimeout(() => {
        el.scrollTo({ left: 0, behavior: "smooth" });
        window.setTimeout(() => { empujando.current = false; }, 600);
      }, 650);
    }, { threshold: 0.6 });
    obs.observe(el);
    return () => {
      obs.disconnect();
      window.clearTimeout(vuelta);
    };
  }, []);

  // En el móvil la lista es un carrusel horizontal (ver home.css): los puntos
  // de debajo dicen qué tarjeta se ve y llevan a cada una. En escritorio la
  // lista no desplaza y los puntos no se pintan.
  function alDesplazar() {
    const el = lista.current;
    if (!el || !el.children.length) return;
    // Por la proporción desplazada y no por el ancho de una tarjeta: la última
    // nunca llega a alinearse a la izquierda, y así su punto también se enciende.
    const max = el.scrollWidth - el.clientWidth;
    const ratio = max > 0 ? el.scrollLeft / max : 0;
    setActual(Math.round(ratio * (piezas.length - 1)));
    setAlFinal(max > 0 && el.scrollLeft >= max - 4);
    if (!empujando.current && el.scrollLeft > 8) setDeslizado(true);
  }

  function irA(i: number) {
    const el = lista.current;
    const tarjeta = el?.children[i] as HTMLElement | undefined;
    if (el && tarjeta) el.scrollTo({ left: tarjeta.offsetLeft - el.offsetLeft - parseFloat(getComputedStyle(el).paddingLeft), behavior: "smooth" });
  }

  return (
    <>
      {/* Solo en el móvil (home.css): se va en cuanto el usuario desliza. */}
      <p className={`pz-pista${deslizado ? " is-oculta" : ""}`} aria-hidden="true">
        Desliza para ver las {piezas.length}
        <span className="pz-pista-flechas"><ChevronRight size={14} /><ChevronRight size={14} /></span>
      </p>
      <ol className={`pz-lista${alFinal ? " is-final" : ""}`} ref={lista} onScroll={alDesplazar}>
        {piezas.map((p) => <Tarjeta key={p.id} p={p} />)}
      </ol>
      <div className="pz-puntos-nav" aria-hidden="true">
        {piezas.map((p, i) => (
          <button
            key={p.id}
            type="button"
            tabIndex={-1}
            className={`pz-punto${i === actual ? " is-activo" : ""}`}
            style={{ "--c": herramienta(p.id).color } as React.CSSProperties}
            onClick={() => irA(i)}
          />
        ))}
      </div>
    </>
  );
}
