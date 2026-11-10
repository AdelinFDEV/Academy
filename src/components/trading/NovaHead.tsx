"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useTransform, type MotionValue } from "framer-motion";
import type { BotExpression } from "./tjNova";
// Sus estilos van con ella: Nova sale en el Diario, en la barra de toda la web y en NovaMini.
import "./nova.css";

/*
 * Nova, versión 4 (10-11-2026): la cabeza rehecha de cero.
 *
 * Sigue siendo SOLO una cabeza robot que vuela: casco dorado pulido, visor
 * panorámico de cristal oscuro con la cara dibujada en luz, antena con esfera
 * luminosa, cápsulas a los lados con su anillo de luz, una barra de estado en
 * la barbilla y una estela de propulsión debajo. Lo que cambia frente a la
 * versión 3 es el acabado: bisel con luz y sombra, destello que recorre el
 * casco de vez en cuando, reflejo del cristal que se desplaza al girar,
 * rejillas en la barbilla y en la nuca, pupilas con iris y microsacadas, y
 * la boca que al hablar se convierte en un ecualizador de voz.
 *
 * Giro CONTINUO, como un modelo en 3D: `theta` es el ángulo en grados (0 de
 * frente, 90 de perfil derecho, 180 de espaldas, −90 perfil izquierdo). La cara
 * se desliza y se estrecha, las cápsulas se recolocan, el reflejo del cristal
 * se corre y la nuca aparece al dar la vuelta. Quien mueve `theta` es quien
 * la usa (TjBot, NovaNav, NovaVuelo…), siempre con un muelle.
 *
 * Ocho caras: calm, happy, joy (ratón encima), celebrate, worried, sleepy,
 * focused (trading y estudio) y music. Cinco actividades con sus accesorios y
 * objetos: dormir (gorro), pelota, trading (tableta), estudiar (gafas y libro)
 * y música (auriculares). Y nueve gestos al azar cuando está tranquila.
 *
 * Todo lo que flota alrededor (corazones, destellos, notas, zetas) es SVG
 * propio, nunca emoji: se ve igual en cualquier sistema.
 *
 * El contrato con quien la usa no cambia: las mismas props, la clase raíz
 * `.nh` (la miden desde fuera NovaNav, TjBot y las fichas) y `.nh-hearts`.
 */

export type NovaActivity = "none" | "sleep" | "ball" | "trade" | "study" | "music";
export type NovaFace = BotExpression | "joy" | "sleepy" | "focused" | "music";

/*
 * Gestos que hace por su cuenta cuando está tranquila (sin actividad, sin volar,
 * sin ratón encima): uno al azar cada 4-8 s. Cada uno es una animación en
 * nova.css (.nh.q-<gesto>), y dura lo que dice aquí.
 */
const QUIRKS: [string, number][] = [
  ["tilt", 1700], ["nod", 1300], ["spin", 1300], ["wiggle", 1000],
  ["hop", 1100], ["wink", 900], ["look", 2200], ["surprise", 1200], ["scan", 1600],
];

/** Color de la luz (antena, anillos de las cápsulas y barra de estado) según la cara. */
const GLOW: Record<NovaFace, string> = {
  calm: "#8ab8ff",
  happy: "#6ee7b7",
  joy: "#ff9fc4",
  celebrate: "#ffd76a",
  worried: "#ff9b7a",
  sleepy: "#9aa6ff",
  focused: "#8ab8ff",
  music: "#c9a2ff",
};

/** El cristal a la altura de los ojos: los párpados se pintan con él para «cortar» el ojo. */
const SCREEN = "#132652";
/** La luz de la cara: ojos, boca y voz brillan con el mismo cian, como una sola pantalla. */
const FACE = "#a6edff";
/** Dorados del casco, para los detalles que no llevan degradado. */
const GOLD = { light: "#f7dfa6", mid: "#e2ae55", deep: "#b97f2c", shade: "#8a5a1c" };

const rad = (deg: number) => (deg * Math.PI) / 180;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Destello de cuatro puntas centrado en (cx, cy): el brillo de los ojos al celebrar. */
function glint(cx: number, cy: number, r: number) {
  const k = r * 0.28;
  return `M${cx} ${cy - r} Q${cx + k} ${cy - k} ${cx + r} ${cy} Q${cx + k} ${cy + k} ${cx} ${cy + r} Q${cx - k} ${cy + k} ${cx - r} ${cy} Q${cx - k} ${cy - k} ${cx} ${cy - r} Z`;
}

// ─────────────────────────── Lo que flota alrededor (SVG, no emoji) ───────────────────────────

const HEART = "M8 14.2C8 14.2 1.6 9.9 1.6 5.5 1.6 3.3 3.3 1.7 5.3 1.7 6.5 1.7 7.5 2.3 8 3.2 8.5 2.3 9.5 1.7 10.7 1.7 12.7 1.7 14.4 3.3 14.4 5.5 14.4 9.9 8 14.2 8 14.2Z";
const STAR = "M8 0C8.7 4.9 11.1 7.3 16 8 11.1 8.7 8.7 11.1 8 16 7.3 11.1 4.9 8.7 0 8 4.9 7.3 7.3 4.9 8 0Z";
const NOTE = "M6.6 2h1.7v8.3a2.8 2.8 0 1 1-1.7-2.6V2Zm1.7 0c2.6.6 4.3 2.3 4.5 5.1-1-1.4-2.6-2.1-4.5-2.2V2Z";

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d={d} fill="currentColor" />
    </svg>
  );
}

// ─────────────────────────── La cara ───────────────────────────

/*
 * SOLO dos ojos y una boca, luminosos. Cada emoción se dice con la forma de los
 * ojos y de la boca; nada más. Ojos en (45, 61) y (75, 61); boca hacia y = 78.
 * Toda la cara va recortada al cristal (clip), así que los párpados y los
 * gestos que agrandan los ojos nunca se salen del visor.
 */

/**
 * Un ojo: el blanco luminoso y, dentro (recortada por el propio ojo), una pupila
 * azul oscura con iris, brillo y dos reflejos. Tres capas de movimiento:
 * `.nh-pupil` sigue al cursor, `.nh-pupil-q` hace los gestos y `.nh-pupil-s`
 * las microsacadas (los saltitos involuntarios de una mirada viva).
 */
function Eye({ cx, cy, rx = 7, ry = 8.8, pupil = 3.9, eye, uid, side }: {
  cx: number; cy: number; rx?: number; ry?: number; pupil?: number; eye: string; uid: string; side: "l" | "r";
}) {
  const clip = `${uid}${side}`;
  const py = cy + 0.6;
  return (
    <g className={`nh-eye nh-eye-${side}`}>
      <clipPath id={clip}><ellipse cx={cx} cy={cy} rx={rx} ry={ry} /></clipPath>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${eye})`} />
      <g clipPath={`url(#${clip})`}>
        <g className="nh-pupil">
          <g className="nh-pupil-q">
            <g className="nh-pupil-s">
              <circle cx={cx} cy={py} r={pupil} fill="#0d1f4a" />
              <circle cx={cx} cy={py} r={pupil * 0.74} fill="none" stroke="#3a62b4" strokeWidth={pupil * 0.16} opacity="0.55" />
              <circle cx={cx} cy={py} r={pupil * 0.46} fill="#06112c" />
              <circle cx={cx + pupil * 0.42} cy={py - pupil * 0.36} r={pupil * 0.34} fill="#fff" />
              <circle cx={cx - pupil * 0.38} cy={py + pupil * 0.46} r={pupil * 0.15} fill="#fff" opacity="0.85" />
            </g>
          </g>
        </g>
      </g>
    </g>
  );
}

/** Al hablar, la boca es un ecualizador de voz: cinco barras que laten. */
function Voice({ y = 78 }: { y?: number }) {
  return (
    <g className="nh-voice" fill={FACE}>
      {[50, 55, 60, 65, 70].map(x => (
        <rect key={x} x={x - 1.4} y={y - 3} width="2.8" height="6" rx="1.4" />
      ))}
    </g>
  );
}

function Face({ face, talking, eye, glow, uid }: { face: NovaFace; talking: boolean; eye: string; glow: string; uid: string }) {
  const line = { stroke: FACE, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const mouth = (d: string, w: number, cls = "nh-mouth") => (talking ? <Voice /> : <path className={cls} d={d} {...line} strokeWidth={w} />);
  switch (face) {
    case "joy":
      return (
        <g filter={`url(#${glow})`}>
          <g className="nh-eyes">
            <path d="M37.5 63 Q45 51.5 52.5 63" {...line} strokeWidth="5" />
            <path d="M67.5 63 Q75 51.5 82.5 63" {...line} strokeWidth="5" />
          </g>
          {talking ? <Voice /> : <path d="M49 74 Q60 89.5 71 74 Z" fill={FACE} />}
        </g>
      );
    case "celebrate":
      return (
        <>
          <g filter={`url(#${glow})`}>
            <g className="nh-eyes">
              <Eye cx={45} cy={60} rx={8.2} ry={9.8} pupil={4.8} eye={eye} uid={uid} side="l" />
              <Eye cx={75} cy={60} rx={8.2} ry={9.8} pupil={4.8} eye={eye} uid={uid} side="r" />
            </g>
            {talking ? <Voice /> : <path d="M50 75 Q60 87.5 70 75 Z" fill={FACE} />}
          </g>
          <path className="nh-glint" d={glint(38.5, 49.5, 4.2)} fill="#fff4c4" />
          <path className="nh-glint nh-glint-2" d={glint(82, 50.5, 3.4)} fill="#fff4c4" />
        </>
      );
    case "happy":
      return (
        <g filter={`url(#${glow})`}>
          <g className="nh-look">
            <g className="nh-eyes">
              <Eye cx={45} cy={60} ry={7.4} eye={eye} uid={uid} side="l" />
              <Eye cx={75} cy={60} ry={7.4} eye={eye} uid={uid} side="r" />
            </g>
          </g>
          {mouth("M50.5 75.5 Q60 85.5 69.5 75.5", 3.4)}
        </g>
      );
    case "worried":
      return (
        <>
          <g filter={`url(#${glow})`}>
            <g className="nh-look">
              <g className="nh-eyes">
                <Eye cx={45} cy={62} rx={6.4} ry={8.2} pupil={3} eye={eye} uid={uid} side="l" />
                <Eye cx={75} cy={62} rx={6.4} ry={8.2} pupil={3} eye={eye} uid={uid} side="r" />
              </g>
            </g>
            {mouth("M52.5 80.5 Q56.5 77 60 79.5 Q63.5 82 67.5 78.5", 3)}
          </g>
          {/* Párpados de arriba caídos hacia fuera: cara de apuro. */}
          <path d="M35 50 L56 50 L56 54.5 Q46 54 35 58 Z" fill={SCREEN} />
          <path d="M85 50 L64 50 L64 54.5 Q74 54 85 58 Z" fill={SCREEN} />
        </>
      );
    case "sleepy":
      return (
        <g filter={`url(#${glow})`}>
          <path d="M38.5 62 Q45 67.5 51.5 62" {...line} strokeWidth="3.4" />
          <path d="M68.5 62 Q75 67.5 81.5 62" {...line} strokeWidth="3.4" />
          <circle className="nh-snore" cx="60" cy="79" r="2.8" {...line} strokeWidth="2.4" />
        </g>
      );
    case "focused":
      return (
        <>
          <g filter={`url(#${glow})`}>
            <g className="nh-look nh-look-prop">
              <g className="nh-eyes">
                <Eye cx={45} cy={62} rx={6.8} ry={8} eye={eye} uid={uid} side="l" />
                <Eye cx={75} cy={62} rx={6.8} ry={8} eye={eye} uid={uid} side="r" />
              </g>
            </g>
            {mouth("M54.5 79 Q60 81 65.5 79", 2.8)}
          </g>
          {/* Párpado de arriba entornado: mirada atenta. */}
          <rect x="35" y="48" width="21" height="10.5" fill={SCREEN} />
          <rect x="64" y="48" width="21" height="10.5" fill={SCREEN} />
        </>
      );
    case "music":
      return (
        <g filter={`url(#${glow})`}>
          <path d="M38.5 63 Q45 56 51.5 63" {...line} strokeWidth="3.6" />
          <path d="M68.5 63 Q75 56 81.5 63" {...line} strokeWidth="3.6" />
          {mouth("M52 76 Q60 83.5 68 76", 3, "nh-hum")}
        </g>
      );
    default:
      return (
        <g filter={`url(#${glow})`}>
          <g className="nh-look">
            <g className="nh-eyes">
              <Eye cx={45} cy={61} eye={eye} uid={uid} side="l" />
              <Eye cx={75} cy={61} eye={eye} uid={uid} side="r" />
            </g>
          </g>
          {mouth("M53.5 77.5 Q60 82 66.5 77.5", 3)}
        </g>
      );
  }
}

// ─────────────────────────── La cabeza ───────────────────────────

export default function NovaHead({
  theta,
  face,
  activity,
  flying,
  joy,
  talking,
  track,
}: {
  theta: MotionValue<number>;
  face: NovaFace;
  activity: NovaActivity;
  flying: boolean;
  /** Ratón encima: brinca de alegría y le salen corazones. */
  joy: boolean;
  talking: boolean;
  /** Los ojos siguen al cursor (de frente y sin actividad). */
  track: boolean;
}) {
  // Con nada que hacer, de vez en cuando un gesto (ladear la cabeza, guiñar, voltereta…).
  const idle = activity === "none" && !flying && !joy && !talking;
  const [quirk, setQuirk] = useState<string | null>(null);
  useEffect(() => {
    if (!idle || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0;
    let end = 0;
    const next = () => {
      timer = window.setTimeout(() => {
        const [name, ms] = QUIRKS[Math.floor(Math.random() * QUIRKS.length)];
        setQuirk(name);
        end = window.setTimeout(() => {
          setQuirk(null);
          next();
        }, ms);
      }, 4000 + Math.random() * 4000);
    };
    next();
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(end);
      setQuirk(null);
    };
  }, [idle]);

  // Ids únicos por cabeza: en una misma página hay varias (barra, ficha, minis).
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (k: string) => `nh${uid}${k}`;
  const gShell = id("s");
  const gBevel = id("bv");
  const gShine = id("sh");
  const gScreen = id("c");
  const gGlass = id("g");
  const gBand = id("bd");
  const gVig = id("v");
  const gScan = id("sc");
  const gOrb = id("o");
  const gBall = id("b");
  const gThrust = id("t");
  const gEye = id("e");
  const fGlow = id("w");
  const cShell = id("cs");
  const cScreen = id("cc");
  const ref = useRef<HTMLSpanElement>(null);

  // ── El giro: todo sale de theta ──
  const faceX = useTransform(theta, t => Math.sin(rad(t)) * 22);
  const backX = useTransform(theta, t => -Math.sin(rad(t)) * 22);
  const faceScale = useTransform(theta, t => 0.28 + 0.72 * Math.abs(Math.cos(rad(t))));
  const frontOp = useTransform(theta, t => clamp01(Math.cos(rad(t)) * 2.6));
  const backOp = useTransform(theta, t => clamp01(-Math.cos(rad(t)) * 2.6));
  const earL = useTransform(theta, t => 60 - 47 * Math.cos(rad(t)));
  const earR = useTransform(theta, t => 60 + 47 * Math.cos(rad(t)));
  const earRx = useTransform(theta, t => 5 + 4.5 * Math.abs(Math.sin(rad(t))));
  const ringRx = useTransform(theta, t => 2.4 + 2.4 * Math.abs(Math.sin(rad(t))));
  // El reflejo del cristal se corre al contrario que la cara: la luz viene de fuera.
  const glassX = useTransform(theta, t => -Math.sin(rad(t)) * 14);
  // Los auriculares siguen a las cápsulas; la diadema se estrecha al girar.
  const bandScale = useTransform(theta, t => 0.35 + 0.65 * Math.abs(Math.cos(rad(t))));
  const phoneL = useTransform(earL, v => v - 8);
  const phoneR = useTransform(earR, v => v - 8);

  // ── Mirar al cursor ──
  useEffect(() => {
    if (!track || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, d / 300);
        el.style.setProperty("--look-x", `${(dx / d) * 4 * k}px`);
        el.style.setProperty("--look-y", `${(dy / d) * 3 * k}px`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, [track]);

  const glow = GLOW[face];
  const cls = [
    "nh",
    `is-${face}`,
    activity !== "none" && `act-${activity}`,
    flying && "is-flying",
    joy && "is-joy",
    talking && "is-talking",
    idle && quirk && `q-${quirk}`,
  ].filter(Boolean).join(" ");

  return (
    <span ref={ref} className={cls} aria-hidden="true">
      <svg viewBox="0 0 120 120">
        <defs>
          {/* Casco: dorado pulido, con la luz arriba a la izquierda. */}
          <linearGradient id={gShell} x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#fff1cc" />
            <stop offset="30%" stopColor="#f2c86f" />
            <stop offset="68%" stopColor="#d99e3f" />
            <stop offset="100%" stopColor="#b27a28" />
          </linearGradient>
          {/* Bisel: claro arriba, oscuro abajo, como un canto biselado. */}
          <linearGradient id={gBevel} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff8e6" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#fff8e6" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#5e3a0e" stopOpacity="0.55" />
          </linearGradient>
          {/* El destello que recorre el casco. */}
          <linearGradient id={gShine} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fff" stopOpacity="0" />
            <stop offset="50%" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          {/* Cristal del visor: azul profundo, más claro arriba. */}
          <linearGradient id={gScreen} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1f3a70" />
            <stop offset="55%" stopColor={SCREEN} />
            <stop offset="100%" stopColor="#0a1530" />
          </linearGradient>
          <linearGradient id={gGlass} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.16" />
            <stop offset="45%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          {/* Banda de reflejo, en diagonal, que se desplaza al girar. */}
          <linearGradient id={gBand} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fff" stopOpacity="0" />
            <stop offset="50%" stopColor="#fff" stopOpacity="0.09" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={gVig} cx="0.5" cy="0.45" r="0.7">
            <stop offset="62%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.4" />
          </radialGradient>
          <linearGradient id={gScan} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={FACE} stopOpacity="0" />
            <stop offset="50%" stopColor={FACE} stopOpacity="0.55" />
            <stop offset="100%" stopColor={FACE} stopOpacity="0" />
          </linearGradient>
          {/* Sombra de la esfera de la antena: el color lo pone la cara; esto le da volumen. */}
          <radialGradient id={gOrb} cx="0.35" cy="0.3" r="0.85">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.7" />
            <stop offset="40%" stopColor="#fff" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.45" />
          </radialGradient>
          <radialGradient id={gBall} cx="0.35" cy="0.3" r="0.8">
            <stop offset="0%" stopColor="#ffe0bd" />
            <stop offset="55%" stopColor="#ff8a4c" />
            <stop offset="100%" stopColor="#d9561f" />
          </radialGradient>
          <radialGradient id={gThrust} cx="0.5" cy="0.2" r="0.7">
            <stop offset="0%" stopColor="#c7ecff" stopOpacity="0.9" />
            <stop offset="55%" stopColor="#6ab8ff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#6ab8ff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={gEye} cx="0.45" cy="0.35" r="0.75">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#d9f7ff" />
            <stop offset="100%" stopColor="#7fdcff" />
          </radialGradient>
          {/* Halo: la luz de ojos y boca se derrama un poco sobre el cristal. */}
          <filter id={fGlow} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="blur" />
            <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.9  0 0 0 0 1  0 0 0 0.75 0" result="halo" />
            <feMerge><feMergeNode in="halo" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <clipPath id={cShell}><rect x="14" y="22" width="92" height="84" rx="38" /></clipPath>
          <clipPath id={cScreen}><rect x="23" y="36" width="74" height="58" rx="26" /></clipPath>
        </defs>

        <g className="nh-float">
          {/* Estela de propulsión bajo la cabeza, con un anillo de salida: más viva al volar. */}
          <ellipse className="nh-thrust" cx="60" cy="110" rx="17" ry="9" fill={`url(#${gThrust})`} />
          <ellipse className="nh-thrust-ring" cx="60" cy="107.5" rx="11" ry="3" fill="none" stroke="#bfe6ff" strokeWidth="0.9" />

          <g className="nh-head">
            {/* Antena: tallo con su luz, halo que respira, un pulso que se expande y la esfera. */}
            <line x1="60" y1="24" x2="60" y2="13" stroke={GOLD.mid} strokeWidth="3.4" strokeLinecap="round" />
            <line x1="59.1" y1="23" x2="59.1" y2="14" stroke="#fff" strokeWidth="0.9" strokeLinecap="round" opacity="0.45" />
            <circle className="nh-antenna-glow" cx="60" cy="9" r="9" fill={glow} opacity="0.25" />
            <circle className="nh-antenna-ping" cx="60" cy="9" r="6" fill="none" stroke={glow} strokeWidth="1" />
            <circle className="nh-antenna" cx="60" cy="9" r="5.6" fill={glow} />
            <circle cx="60" cy="9" r="5.6" fill={`url(#${gOrb})`} />
            <circle cx="58.2" cy="7.1" r="1.7" fill="#fff" opacity="0.8" />

            {/* Cápsulas laterales: detrás del casco de frente, en el centro de perfil. */}
            <motion.ellipse cx={earL} cy={64} rx={earRx} ry={13} fill="#c48a32" />
            <motion.ellipse cx={earR} cy={64} rx={earRx} ry={13} fill="#c48a32" />

            {/* ── El casco ── */}
            <rect x="14" y="22" width="92" height="84" rx="38" fill={`url(#${gShell})`} />
            {/* Sombra de abajo y luz de arriba: volumen de plástico pulido. */}
            <path d="M22 86 Q60 110 98 86" stroke={GOLD.shade} strokeWidth="3.5" strokeLinecap="round" opacity="0.16" fill="none" />
            <path d="M30 34 Q44 25 64 26" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" opacity="0.32" fill="none" />
            <ellipse cx="74" cy="27.5" rx="6" ry="2.4" fill="#fff" opacity="0.38" />
            {/* El destello que recorre el casco de vez en cuando (recortado a él). */}
            <g clipPath={`url(#${cShell})`}>
              <rect className="nh-shine" x="20" y="14" width="22" height="100" fill={`url(#${gShine})`} transform="skewX(-22)" />
            </g>
            {/* Bisel: el canto del casco, claro arriba y oscuro abajo. */}
            <rect x="15" y="23" width="90" height="82" rx="37" fill="none" stroke={`url(#${gBevel})`} strokeWidth="1.6" />

            {/* La barbilla: dos rejillas y la barra de estado, que late con lo que siente. Gira con la cara. */}
            <motion.g style={{ x: faceX, scaleX: faceScale, opacity: frontOp }}>
              <g fill={GOLD.shade} opacity="0.35">
                <rect x="31" y="99.3" width="10" height="2.4" rx="1.2" />
                <rect x="79" y="99.3" width="10" height="2.4" rx="1.2" />
              </g>
              <rect x="52" y="99.3" width="16" height="2.4" rx="1.2" fill="#3a2608" opacity="0.5" />
              <rect className="nh-led" x="52" y="99.3" width="16" height="2.4" rx="1.2" fill={glow} />
            </motion.g>

            {/* ── La nuca: panel con rejilla, tornillos y el monograma ── */}
            <motion.g style={{ x: backX, scaleX: faceScale, opacity: backOp }}>
              <rect x="30" y="36" width="60" height="54" rx="20" fill="#c48a32" opacity="0.8" />
              <rect x="31" y="37" width="58" height="52" rx="19" fill="none" stroke={GOLD.shade} strokeWidth="0.9" opacity="0.5" />
              <g stroke={GOLD.shade} strokeWidth="2.6" strokeLinecap="round" opacity="0.85">
                <line x1="42" y1="48" x2="78" y2="48" />
                <line x1="42" y1="56" x2="78" y2="56" />
                <line x1="42" y1="64" x2="78" y2="64" />
              </g>
              <g fill={GOLD.shade}>
                <circle cx="37" cy="43" r="1.8" /><circle cx="83" cy="43" r="1.8" />
                <circle cx="37" cy="83" r="1.8" /><circle cx="83" cy="83" r="1.8" />
              </g>
              <g stroke={GOLD.light} strokeWidth="0.7" strokeLinecap="round" opacity="0.7">
                <line x1="35.8" y1="43" x2="38.2" y2="43" /><line x1="81.8" y1="43" x2="84.2" y2="43" />
                <line x1="37" y1="81.8" x2="37" y2="84.2" /><line x1="83" y1="81.8" x2="83" y2="84.2" />
              </g>
              <circle cx="60" cy="77" r="6.5" fill={GOLD.shade} opacity="0.9" />
              <text x="60" y="80" textAnchor="middle" fontSize="8.5" fontWeight="800" fill={GOLD.light}>N</text>
            </motion.g>

            {/* ── El visor: bisel, cristal, la cara, el reflejo ── */}
            <motion.g style={{ x: faceX, scaleX: faceScale, opacity: frontOp }}>
              <rect x="20" y="33" width="80" height="64" rx="29" fill="#0a1426" />
              <rect x="20.7" y="33.7" width="78.6" height="62.6" rx="28.3" fill="none" stroke={GOLD.light} strokeWidth="0.8" opacity="0.5" />
              <rect x="23" y="36" width="74" height="58" rx="26" fill={`url(#${gScreen})`} />
              <g clipPath={`url(#${cScreen})`}>
                <rect x="23" y="36" width="74" height="58" fill={`url(#${gVig})`} />
                <Face face={face} talking={talking} eye={gEye} glow={fGlow} uid={uid} />
                {/* Gafas al estudiar. */}
                {activity === "study" && (
                  <g className="nh-glasses" fill="none" stroke={GOLD.mid} strokeWidth="2.2">
                    <circle cx="45" cy="61" r="10.5" />
                    <circle cx="75" cy="61" r="10.5" />
                    <path d="M55.5 60 Q60 57 64.5 60" />
                    <path d="M39 55 Q45 53 51 55" stroke="#fff" strokeWidth="1" opacity="0.35" />
                    <path d="M69 55 Q75 53 81 55" stroke="#fff" strokeWidth="1" opacity="0.35" />
                  </g>
                )}
                {/* Dormida, el cristal se apaga a medias. */}
                <rect className="nh-dim" x="23" y="36" width="74" height="58" fill="#060d20" />
                {/* La línea que barre el visor en el gesto «scan». */}
                <rect className="nh-scan" x="23" y="34" width="74" height="4" fill={`url(#${gScan})`} />
                {/* Reflejo del cristal: una banda en diagonal que se corre al girar y deriva despacio. */}
                <motion.g style={{ x: glassX }}>
                  <rect className="nh-band" x="40" y="30" width="26" height="72" fill={`url(#${gBand})`} transform="skewX(-24)" />
                </motion.g>
              </g>
              <rect x="23" y="36" width="74" height="58" rx="26" fill={`url(#${gGlass})`} pointerEvents="none" />
              <path d="M34 40.5 Q60 35.5 86 40.5" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" opacity="0.16" fill="none" />
            </motion.g>

            {/* Anillo de luz en cada cápsula, del color de la antena. */}
            <motion.ellipse className="nh-ring" cx={earL} cy={64} rx={ringRx} ry={5} fill={glow} opacity={0.8} />
            <motion.ellipse className="nh-ring" cx={earR} cy={64} rx={ringRx} ry={5} fill={glow} opacity={0.8} />

            {/* ── Accesorios ── */}
            {activity === "sleep" && (
              <g className="nh-cap">
                <path d="M30 34 Q46 6 84 14 Q76 24 72 34 Z" fill="#5b6fd6" />
                <path d="M34 30 Q50 12 76 15" stroke="#7d8ee6" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.6" />
                <path d="M28 33 Q60 24 76 33" stroke="#eef2ff" strokeWidth="6" strokeLinecap="round" fill="none" />
                <circle className="nh-pompom" cx="86" cy="15" r="5.5" fill="#eef2ff" />
              </g>
            )}
            {activity === "music" && (
              <g className="nh-phones">
                <motion.path d="M22 60 Q22 14 60 14 Q98 14 98 60" stroke="#2a3552" strokeWidth="5.5" fill="none" strokeLinecap="round" style={{ scaleX: bandScale }} />
                <motion.rect x={phoneL} y={50} width={16} height={28} rx={8} fill="#c9a2ff" />
                <motion.rect x={phoneR} y={50} width={16} height={28} rx={8} fill="#c9a2ff" />
                <motion.rect x={phoneL} y={50} width={16} height={28} rx={8} fill="none" stroke="#fff" strokeWidth="1" opacity="0.3" />
                <motion.rect x={phoneR} y={50} width={16} height={28} rx={8} fill="none" stroke="#fff" strokeWidth="1" opacity="0.3" />
              </g>
            )}
          </g>

          {/* ── Lo que hace con su «telequinesis», flotando a su lado ── */}
          {activity === "trade" && (
            <g className="nh-prop nh-tablet">
              <rect x="104" y="44" width="44" height="34" rx="6" fill="#0b1730" stroke={GOLD.mid} strokeWidth="1.8" />
              <rect x="105.5" y="45.5" width="41" height="31" rx="4.8" fill="none" stroke="#fff" strokeWidth="0.6" opacity="0.12" />
              <text x="109" y="53" fontSize="6" fontWeight="800" fill="#f5d48a">BTC</text>
              <g stroke="#223561" strokeWidth="0.6">
                <line x1="108" y1="60" x2="144" y2="60" /><line x1="108" y1="68" x2="144" y2="68" />
              </g>
              <g className="nh-candles">
                <rect x="110" y="62" width="4.5" height="10" rx="1" fill="#5fd39a" />
                <rect x="118" y="58" width="4.5" height="11" rx="1" fill="#ff5c5c" />
                <rect x="126" y="60" width="4.5" height="8" rx="1" fill="#5fd39a" />
                <rect x="134" y="54" width="4.5" height="13" rx="1" fill="#5fd39a" />
              </g>
              <path className="nh-price" d="M108 73 L116 66 L124 69 L132 60 L144 56" stroke="#f5d48a" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            </g>
          )}
          {activity === "study" && (
            <g className="nh-prop nh-book">
              <path d="M126 50 Q116 45 106 47 V74 Q116 72 126 76 Z" fill="#f4f7ff" />
              <path d="M126 50 Q136 45 146 47 V74 Q136 72 126 76 Z" fill="#e3e9f7" />
              <g stroke="#93a3c4" strokeWidth="1.1" strokeLinecap="round">
                <line x1="110" y1="53" x2="122" y2="54" /><line x1="110" y1="58" x2="122" y2="59" /><line x1="110" y1="63" x2="120" y2="64" />
                <line x1="130" y1="54" x2="142" y2="53" /><line x1="130" y1="59" x2="142" y2="58" />
              </g>
              <path className="nh-page" d="M126 50 Q136 45 146 47 V74 Q136 72 126 76 Z" fill="#fbfcff" />
              <rect x="125.3" y="49" width="1.4" height="27" fill={GOLD.deep} />
            </g>
          )}
          {activity === "ball" && (
            <g className="nh-prop nh-ball">
              <circle cx="60" cy="-6" r="9" fill={`url(#${gBall})`} />
              <path d="M51.5 -8 Q60 -2.5 68.5 -8" stroke="#fff" strokeWidth="1.4" fill="none" opacity="0.7" />
              <path d="M53 -12 Q60 -16 67 -12" stroke="#fff" strokeWidth="1" fill="none" opacity="0.35" />
            </g>
          )}
        </g>
      </svg>

      {/* Lo que flota alrededor: zetas, notas, corazones, destellos. */}
      {activity === "sleep" && <span className="nh-fx nh-zzz"><i>z</i><i>z</i><i>Z</i></span>}
      {activity === "music" && (
        <span className="nh-fx nh-notes"><i><Icon d={NOTE} /></i><i><Icon d={NOTE} /></i><i><Icon d={NOTE} /></i></span>
      )}
      <AnimatePresence>
        {joy && (
          <motion.span className="nh-fx nh-hearts" initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.3 } }}>
            <i><Icon d={HEART} /></i><i><Icon d={HEART} /></i><i><Icon d={HEART} /></i><i><Icon d={HEART} /></i>
          </motion.span>
        )}
      </AnimatePresence>
      {face === "celebrate" && !joy && (
        <span className="nh-fx nh-sparkles"><i><Icon d={STAR} /></i><i><Icon d={STAR} /></i><i><Icon d={STAR} /></i></span>
      )}
    </span>
  );
}
