"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useTransform, type MotionValue } from "framer-motion";
import type { BotExpression } from "./tjNova";
// Sus estilos van con ella: Nova sale en el Diario y en la barra de toda la web.
import "./nova.css";

/*
 * Nova, versión 3: una cabeza que vuela.
 *
 * Diseño: carcasa dorada con brillo y sombra, marco oscuro alrededor de una
 * pantalla con cristal y reflejo, orejeras con anillo de luz, antena con bola
 * luminosa, y una estela de propulsión debajo (vuela sin hélice).
 *
 * Giro CONTINUO, como un modelo en 3D: `theta` es el ángulo en grados (0 de
 * frente, 90 de perfil derecho, 180 de espaldas, −90 perfil izquierdo). La cara
 * se desliza y se estrecha, las orejeras se recolocan y el panel trasero aparece
 * al dar la vuelta. Quien mueve `theta` (con un muelle) es TjBot.
 *
 * Ocho caras dibujadas a mano: calm, happy, joy (ratón encima), celebrate,
 * worried, sleepy, focused (trading y estudio) y music.
 */

export type NovaActivity = "none" | "sleep" | "ball" | "trade" | "study" | "music";
export type NovaFace = BotExpression | "joy" | "sleepy" | "focused" | "music";

/*
 * Gestos que hace por su cuenta cuando está tranquilo (sin actividad, sin volar,
 * sin ratón encima): uno al azar cada 4-8 s. Cada uno es una animación en
 * trading.css (.nh.q-<gesto>), y dura lo que dice aquí.
 */
const QUIRKS: [string, number][] = [
  ["tilt", 1700], ["nod", 1300], ["spin", 1300], ["wiggle", 1000],
  ["hop", 1100], ["wink", 900], ["look", 2200], ["surprise", 1200],
];

/** Color de la luz de la antena (y de las orejeras) según la cara. */
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

/** Color de la pantalla a la altura de los ojos: los párpados se pintan con él. */
/** Pantalla a la altura de los ojos: los párpados se pintan con él para «cortar» el ojo. */
const SCREEN = "#16295a";
/** Luz de la cara: ojos y boca brillan con el mismo cian, como una sola pantalla. */
const GLOW_FACE = "#9feaff";


const rad = (deg: number) => (deg * Math.PI) / 180;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Destello de cuatro puntas centrado en (cx, cy): el brillo de los ojos al celebrar. */
function glint(cx: number, cy: number, r: number) {
  const k = r * 0.28;
  return `M${cx} ${cy - r} Q${cx + k} ${cy - k} ${cx + r} ${cy} Q${cx + k} ${cy + k} ${cx} ${cy + r} Q${cx - k} ${cy + k} ${cx - r} ${cy} Q${cx - k} ${cy - k} ${cx} ${cy - r} Z`;
}

/*
 * La cara: SOLO dos ojos y una boca, sencillos y luminosos (degradado blanco-cian,
 * un halo suave y un brillo). Cada emoción se dice con la forma de los ojos y de
 * la boca; nada más en la cara. Ojos en (45, 61) y (75, 61); boca hacia y = 78.
 * `eye` y `glow` son los ids del degradado y del halo (únicos por cabeza).
 */
/**
 * Un ojo: el blanco luminoso y, dentro (recortada por el propio ojo), una pupila
 * azul oscura con su brillo. La que se mueve para mirar es la pupila (.nh-pupil),
 * no el ojo entero. `side` permite guiñar solo uno.
 */
function Eye({ cx, cy, rx = 7, ry = 8.8, eye, uid, side, pupil = 3.9 }: {
  cx: number; cy: number; rx?: number; ry?: number; eye: string; uid: string; side: "l" | "r"; pupil?: number;
}) {
  const clip = `${uid}${side}`;
  return (
    <g className={`nh-eye nh-eye-${side}`}>
      <clipPath id={clip}><ellipse cx={cx} cy={cy} rx={rx} ry={ry} /></clipPath>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${eye})`} />
      <g clipPath={`url(#${clip})`}>
        <g className="nh-pupil">
          <g className="nh-pupil-q">
            <circle cx={cx} cy={cy + 0.6} r={pupil} fill="#0f2250" />
            <circle cx={cx} cy={cy + 0.6} r={pupil * 0.55} fill="#081537" />
            <circle cx={cx + pupil * 0.42} cy={cy - pupil * 0.32} r={pupil * 0.36} fill="#fff" />
            <circle cx={cx - pupil * 0.4} cy={cy + pupil * 0.5} r={pupil * 0.16} fill="#fff" opacity="0.8" />
          </g>
        </g>
      </g>
    </g>
  );
}

function Face({ face, eye, glow, uid }: { face: NovaFace; eye: string; glow: string; uid: string }) {
  const line = { stroke: GLOW_FACE, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (face) {
    case "joy":
      return (
        <g filter={`url(#${glow})`}>
          <g className="nh-eyes">
            <path d="M37.5 63 Q45 51.5 52.5 63" {...line} strokeWidth="5" />
            <path d="M67.5 63 Q75 51.5 82.5 63" {...line} strokeWidth="5" />
          </g>
          <path d="M49 74 Q60 89 71 74 Z" fill={GLOW_FACE} />
        </g>
      );
    case "celebrate":
      return (
        <>
          <g filter={`url(#${glow})`}>
            <g className="nh-eyes">
              <Eye cx={45} cy={60} rx={8.2} ry={9.8} eye={eye} uid={uid} side="l" pupil={4.8} />
              <Eye cx={75} cy={60} rx={8.2} ry={9.8} eye={eye} uid={uid} side="r" pupil={4.8} />
            </g>
            <path d="M50 75 Q60 87 70 75 Z" fill={GLOW_FACE} />
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
          <path className="nh-mouth" d="M50.5 75.5 Q60 85.5 69.5 75.5" {...line} strokeWidth="3.4" />
        </g>
      );
    case "worried":
      return (
        <>
          <g filter={`url(#${glow})`}>
            <g className="nh-look">
              <g className="nh-eyes">
                <Eye cx={45} cy={62} rx={6.4} ry={8.2} eye={eye} uid={uid} side="l" pupil={3} />
                <Eye cx={75} cy={62} rx={6.4} ry={8.2} eye={eye} uid={uid} side="r" pupil={3} />
              </g>
            </g>
            <path className="nh-mouth" d="M53 80 Q60 76 67 80" {...line} strokeWidth="3" />
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
          <ellipse className="nh-snore" cx="60" cy="79" rx="3" ry="2.6" {...line} strokeWidth="2.4" />
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
            <path d="M54.5 79 Q60 81 65.5 79" {...line} strokeWidth="2.8" />
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
          <path className="nh-hum" d="M52 76 Q60 83.5 68 76" {...line} strokeWidth="3" />
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
          <path className="nh-mouth" d="M53.5 77.5 Q60 82 66.5 77.5" {...line} strokeWidth="3" />
        </g>
      );
  }
}

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
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const gShell = `nh${uid}s`;
  const gScreen = `nh${uid}c`;
  const gGlass = `nh${uid}g`;
  const gBall = `nh${uid}b`;
  const gThrust = `nh${uid}t`;
  const gEye = `nh${uid}e`;
  const fGlow = `nh${uid}w`;
  const gVig = `nh${uid}v`;
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
  // Los auriculares siguen a las orejeras; la diadema se estrecha al girar.
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
          <linearGradient id={gShell} x1="0.15" y1="0" x2="0.85" y2="1">
            <stop offset="0%" stopColor="#fdeec4" />
            <stop offset="35%" stopColor="#f0c76e" />
            <stop offset="75%" stopColor="#d79c3e" />
            <stop offset="100%" stopColor="#b97f2c" />
          </linearGradient>
          <linearGradient id={gScreen} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1d3564" />
            <stop offset="55%" stopColor={SCREEN} />
            <stop offset="100%" stopColor="#0b1730" />
          </linearGradient>
          <linearGradient id={gGlass} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.16" />
            <stop offset="45%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={gBall} cx="0.35" cy="0.3" r="0.8">
            <stop offset="0%" stopColor="#ffe0bd" />
            <stop offset="55%" stopColor="#ff8a4c" />
            <stop offset="100%" stopColor="#d9561f" />
          </radialGradient>
          <radialGradient id={gThrust} cx="0.5" cy="0.2" r="0.7">
            <stop offset="0%" stopColor="#bfe9ff" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#6ab8ff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#6ab8ff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={gEye} cx="0.45" cy="0.35" r="0.75">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#d6f6ff" />
            <stop offset="100%" stopColor="#7fdcff" />
          </radialGradient>
          {/* Halo: la luz de ojos y boca se derrama un poco sobre la pantalla. */}
          <filter id={fGlow} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="blur" />
            <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.9  0 0 0 0 1  0 0 0 0.75 0" result="halo" />
            <feMerge><feMergeNode in="halo" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id={gVig} cx="0.5" cy="0.45" r="0.7">
            <stop offset="65%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.35" />
          </radialGradient>
        </defs>

        <g className="nh-float">
          {/* Estela de propulsión bajo la cabeza: más viva al volar. */}
          <ellipse className="nh-thrust" cx="60" cy="110" rx="17" ry="9" fill={`url(#${gThrust})`} />

          <g className="nh-head">
            {/* Antena: tallo y bola de luz. */}
            <line x1="60" y1="12" x2="60" y2="24" stroke="#e2ae55" strokeWidth="3.4" strokeLinecap="round" />
            <circle className="nh-antenna-glow" cx="60" cy="9" r="9" fill={GLOW[face]} opacity="0.25" />
            <circle className="nh-antenna" cx="60" cy="9" r="5.6" fill={GLOW[face]} />
            <circle cx="58.2" cy="7.2" r="1.8" fill="#fff" opacity="0.7" />

            {/* Orejeras: detrás de la carcasa de frente, en el centro de perfil. */}
            <motion.ellipse cx={earL} cy={64} rx={earRx} ry={13} fill="#c48a32" />
            <motion.ellipse cx={earR} cy={64} rx={earRx} ry={13} fill="#c48a32" />

            {/* Carcasa con brillo arriba y sombra abajo. */}
            <rect x="14" y="22" width="92" height="84" rx="38" fill={`url(#${gShell})`} />
            {/* Brillo de arriba: una franja suave y un punto de luz, como plástico pulido. */}
            <path d="M30 34 Q44 25 64 26" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" opacity="0.3" fill="none" />
            <ellipse cx="74" cy="27.5" rx="6" ry="2.4" fill="#fff" opacity="0.35" />
            <path d="M24 88 Q60 108 96 88" stroke="#8a5a1c" strokeWidth="3" strokeLinecap="round" opacity="0.18" fill="none" />

            {/* La espalda: panel con rejillas, tornillos y una pequeña N. */}
            <motion.g style={{ x: backX, scaleX: faceScale, opacity: backOp }}>
              <rect x="30" y="36" width="60" height="54" rx="20" fill="#c48a32" opacity="0.75" />
              <g stroke="#94631f" strokeWidth="3" strokeLinecap="round">
                <line x1="42" y1="50" x2="78" y2="50" />
                <line x1="42" y1="60" x2="78" y2="60" />
                <line x1="42" y1="70" x2="78" y2="70" />
              </g>
              <g fill="#94631f">
                <circle cx="36" cy="42" r="2" /><circle cx="84" cy="42" r="2" />
                <circle cx="36" cy="84" r="2" /><circle cx="84" cy="84" r="2" />
              </g>
              <text x="60" y="84" textAnchor="middle" fontSize="8" fontWeight="800" fill="#94631f">N</text>
            </motion.g>

            {/* La cara: marco, pantalla, ojos, boca, mejillas y reflejo del cristal. */}
            <motion.g style={{ x: faceX, scaleX: faceScale, opacity: frontOp }}>
              <rect x="20" y="33" width="80" height="64" rx="29" fill="#0a1426" />
              <rect x="20.8" y="33.8" width="78.4" height="62.4" rx="28.2" fill="none" stroke="#f7dfa6" strokeWidth="0.8" opacity="0.45" />
              <rect x="23" y="36" width="74" height="58" rx="26" fill={`url(#${gScreen})`} />
              <rect x="23" y="36" width="74" height="58" rx="26" fill={`url(#${gVig})`} />
              <Face face={face} eye={gEye} glow={fGlow} uid={uid} />
              {/* Gafas al estudiar. */}
              {activity === "study" && (
                <g className="nh-glasses" fill="none" stroke="#f0c76e" strokeWidth="2.2">
                  <circle cx="45" cy="61" r="10.5" />
                  <circle cx="75" cy="61" r="10.5" />
                  <path d="M55.5 60 Q60 57 64.5 60" />
                </g>
              )}
              <rect x="23" y="36" width="74" height="58" rx="26" fill={`url(#${gGlass})`} pointerEvents="none" />
            </motion.g>

            {/* Anillo de luz en cada orejera, del color de la antena. */}
            <motion.ellipse cx={earL} cy={64} rx={ringRx} ry={5} fill={GLOW[face]} opacity={0.75} />
            <motion.ellipse cx={earR} cy={64} rx={ringRx} ry={5} fill={GLOW[face]} opacity={0.75} />

            {/* ── Accesorios ── */}
            {activity === "sleep" && (
              <g className="nh-cap">
                <path d="M30 34 Q46 6 84 14 Q76 24 72 34 Z" fill="#5b6fd6" />
                <path d="M28 33 Q60 24 76 33" stroke="#eef2ff" strokeWidth="6" strokeLinecap="round" fill="none" />
                <circle className="nh-pompom" cx="86" cy="15" r="5.5" fill="#eef2ff" />
              </g>
            )}
            {activity === "music" && (
              <g className="nh-phones">
                <motion.path d="M22 60 Q22 14 60 14 Q98 14 98 60" stroke="#2a3552" strokeWidth="5.5" fill="none" strokeLinecap="round" style={{ scaleX: bandScale }} />
                <motion.rect x={phoneL} y={50} width={16} height={28} rx={8} fill="#c9a2ff" />
                <motion.rect x={phoneR} y={50} width={16} height={28} rx={8} fill="#c9a2ff" />
              </g>
            )}
          </g>

          {/* ── Lo que hace con su «telequinesis», flotando a su lado ── */}
          {activity === "trade" && (
            <g className="nh-prop nh-tablet">
              <rect x="104" y="44" width="44" height="34" rx="6" fill="#0b1730" stroke="#f0c76e" strokeWidth="1.8" />
              <text x="109" y="53" fontSize="6" fontWeight="800" fill="#f5d48a">BTC</text>
              <g className="nh-candles">
                <rect x="110" y="62" width="4.5" height="10" rx="1" fill="#5fd39a" />
                <rect x="118" y="58" width="4.5" height="11" rx="1" fill="#ff5c5c" />
                <rect x="126" y="60" width="4.5" height="8" rx="1" fill="#5fd39a" />
                <rect x="134" y="54" width="4.5" height="13" rx="1" fill="#5fd39a" />
              </g>
              <path className="nh-price" d="M108 73 L116 66 L124 69 L132 60 L144 56" stroke="#f5d48a" strokeWidth="1.4" fill="none" />
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
              <rect x="125.3" y="49" width="1.4" height="27" fill="#d79c3e" />
            </g>
          )}
          {activity === "ball" && (
            <g className="nh-prop nh-ball">
              <circle cx="60" cy="-6" r="9" fill={`url(#${gBall})`} />
              <path d="M51.5 -8 Q60 -2.5 68.5 -8" stroke="#fff" strokeWidth="1.4" fill="none" opacity="0.7" />
            </g>
          )}
        </g>
      </svg>

      {/* Lo que flota alrededor: «z», notas, corazones, destellos. */}
      {activity === "sleep" && <span className="nh-zzz"><i>z</i><i>z</i><i>Z</i></span>}
      {activity === "music" && <span className="nh-notes"><i>♪</i><i>♫</i><i>♪</i></span>}
      <AnimatePresence>
        {joy && (
          <motion.span className="nh-hearts" initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.3 } }}>
            <i>💛</i><i>💖</i><i>💛</i><i>💖</i>
          </motion.span>
        )}
      </AnimatePresence>
      {face === "celebrate" && !joy && <span className="nh-sparkles"><i>✦</i><i>✦</i><i>✦</i></span>}
    </span>
  );
}
