"use client";

import { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion, useTransform, type MotionValue } from "framer-motion";
import type { BotExpression } from "./tjNova";

/*
 * Nova, versión 3: una cabeza que vuela.
 *
 * Diseño: carcasa dorada con brillo y sombra, marco oscuro alrededor de una
 * pantalla con cristal y reflejo, orejeras con anillo de luz, antena con bola
 * luminosa y una hélice que gira mientras vuela, y una estela de propulsión debajo.
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
const SCREEN = "#142a52";
const EYE = "#eef7ff";
const MINT = "#6ee7b7";

const rad = (deg: number) => (deg * Math.PI) / 180;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Estrella de cinco puntas centrada en (cx, cy): los ojos al celebrar. */
function star(cx: number, cy: number, r: number) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(2)},${(cy + Math.sin(a) * rr).toFixed(2)}`);
  }
  return `M${pts.join(" L")} Z`;
}

/** Los ojos y la boca de cada cara. Ojos en (46, 58) y (74, 58); boca hacia y = 76. */
function Face({ face }: { face: NovaFace }) {
  switch (face) {
    case "joy":
      return (
        <>
          <g className="nh-eyes">
            <path d="M38.5 60 Q46 48.5 53.5 60" stroke={EYE} strokeWidth="4.6" fill="none" strokeLinecap="round" />
            <path d="M66.5 60 Q74 48.5 81.5 60" stroke={EYE} strokeWidth="4.6" fill="none" strokeLinecap="round" />
          </g>
          <path d="M47 70 Q60 89 73 70 Z" fill="#2b0f24" stroke={MINT} strokeWidth="2.6" strokeLinejoin="round" />
          <path d="M53 79 Q60 86 67 79 Q60 76 53 79 Z" fill="#ff8fab" />
          <path d="M49.5 71.5 H70.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
        </>
      );
    case "celebrate":
      return (
        <>
          <g className="nh-eyes nh-stars">
            <path d={star(46, 58, 8.6)} fill="#ffd76a" />
            <path d={star(74, 58, 8.6)} fill="#ffd76a" />
            <circle cx="43.5" cy="55.5" r="1.4" fill="#fff" />
            <circle cx="71.5" cy="55.5" r="1.4" fill="#fff" />
          </g>
          <path d="M48 71 Q60 85 72 71 Z" fill={MINT} />
        </>
      );
    case "happy":
      return (
        <>
          <g className="nh-look">
            <g className="nh-eyes">
              <rect x="40" y="49" width="12" height="17" rx="6" fill={EYE} />
              <rect x="68" y="49" width="12" height="17" rx="6" fill={EYE} />
              {/* Mejillas que empujan los ojos hacia arriba: ojos sonrientes. */}
              <ellipse cx="46" cy="69" rx="9" ry="6.5" fill={SCREEN} />
              <ellipse cx="74" cy="69" rx="9" ry="6.5" fill={SCREEN} />
              <circle cx="49" cy="53" r="2.1" fill="#fff" />
              <circle cx="77" cy="53" r="2.1" fill="#fff" />
            </g>
          </g>
          <path className="nh-mouth" d="M49 72 Q60 83 71 72" stroke={MINT} strokeWidth="3.2" fill="none" strokeLinecap="round" />
        </>
      );
    case "worried":
      return (
        <>
          <g className="nh-look">
            <g className="nh-eyes">
              <rect x="41" y="50" width="10" height="17" rx="5" fill={EYE} />
              <rect x="69" y="50" width="10" height="17" rx="5" fill={EYE} />
              <circle cx="47.5" cy="54" r="1.8" fill="#fff" />
              <circle cx="75.5" cy="54" r="1.8" fill="#fff" />
            </g>
          </g>
          <g stroke={EYE} strokeWidth="2.6" strokeLinecap="round">
            <line x1="38.5" y1="45.5" x2="51" y2="42" />
            <line x1="81.5" y1="45.5" x2="69" y2="42" />
          </g>
          <path className="nh-mouth" d="M50.5 77 Q55 73 60 77 Q65 81 69.5 77" stroke={MINT} strokeWidth="2.8" fill="none" strokeLinecap="round" />
          {/* Gota de sudor. */}
          <path className="nh-sweat" d="M86 42 Q83 48 86 50.5 Q89 48 86 42 Z" fill="#8ab8ff" />
        </>
      );
    case "sleepy":
      return (
        <>
          <g>
            <path d="M39.5 59 Q46 65 52.5 59" stroke={EYE} strokeWidth="3.4" fill="none" strokeLinecap="round" />
            <path d="M67.5 59 Q74 65 80.5 59" stroke={EYE} strokeWidth="3.4" fill="none" strokeLinecap="round" />
          </g>
          <ellipse className="nh-snore" cx="60" cy="76" rx="3.4" ry="3" fill="none" stroke={MINT} strokeWidth="2.4" />
        </>
      );
    case "focused":
      return (
        <>
          <g className="nh-look nh-look-prop">
            <g className="nh-eyes">
              <rect x="40" y="51" width="12" height="15" rx="6" fill={EYE} />
              <rect x="68" y="51" width="12" height="15" rx="6" fill={EYE} />
              {/* Párpado de arriba: mirada atenta. */}
              <rect x="38" y="47" width="16" height="8" fill={SCREEN} />
              <rect x="66" y="47" width="16" height="8" fill={SCREEN} />
              <circle cx="49" cy="58" r="2" fill="#fff" />
              <circle cx="77" cy="58" r="2" fill="#fff" />
            </g>
          </g>
          <path d="M53 76 Q60 78.5 67 75.5" stroke={MINT} strokeWidth="2.8" fill="none" strokeLinecap="round" />
        </>
      );
    case "music":
      return (
        <>
          <g>
            <path d="M39.5 60 Q46 53 52.5 60" stroke={EYE} strokeWidth="3.6" fill="none" strokeLinecap="round" />
            <path d="M67.5 60 Q74 53 80.5 60" stroke={EYE} strokeWidth="3.6" fill="none" strokeLinecap="round" />
          </g>
          <path className="nh-hum" d="M51 73 Q60 81 69 73" stroke={MINT} strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      );
    default:
      return (
        <>
          <g className="nh-look">
            <g className="nh-eyes">
              <rect x="40" y="49" width="12" height="18" rx="6" fill={EYE} />
              <rect x="68" y="49" width="12" height="18" rx="6" fill={EYE} />
              <circle cx="49" cy="53.5" r="2.2" fill="#fff" />
              <circle cx="77" cy="53.5" r="2.2" fill="#fff" />
              <circle cx="43" cy="63" r="1.1" fill="#fff" opacity="0.6" />
              <circle cx="71" cy="63" r="1.1" fill="#fff" opacity="0.6" />
            </g>
          </g>
          <path className="nh-mouth" d="M52 74 Q60 80 68 74" stroke={MINT} strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
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
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const gShell = `nh${uid}s`;
  const gScreen = `nh${uid}c`;
  const gGlass = `nh${uid}g`;
  const gBall = `nh${uid}b`;
  const gThrust = `nh${uid}t`;
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

  const cheek = face === "joy" ? 0.85 : face === "worried" || face === "sleepy" ? 0.25 : 0.5;
  const cls = [
    "nh",
    `is-${face}`,
    activity !== "none" && `act-${activity}`,
    flying && "is-flying",
    joy && "is-joy",
    talking && "is-talking",
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
        </defs>

        <g className="nh-float">
          {/* Estela de propulsión bajo la cabeza: más viva al volar. */}
          <ellipse className="nh-thrust" cx="60" cy="110" rx="17" ry="9" fill={`url(#${gThrust})`} />

          <g className="nh-head">
            {/* Antena: tallo, bola de luz y una hélice que gira al volar. */}
            <line x1="60" y1="12" x2="60" y2="24" stroke="#e2ae55" strokeWidth="3.4" strokeLinecap="round" />
            <circle className="nh-antenna-glow" cx="60" cy="9" r="9" fill={GLOW[face]} opacity="0.25" />
            <circle className="nh-antenna" cx="60" cy="9" r="5.6" fill={GLOW[face]} />
            <circle cx="58.2" cy="7.2" r="1.8" fill="#fff" opacity="0.7" />
            <g className="nh-propeller">
              <ellipse cx="51" cy="2.5" rx="8" ry="2" fill="#d79c3e" />
              <ellipse cx="69" cy="2.5" rx="8" ry="2" fill="#d79c3e" />
              <circle cx="60" cy="2.5" r="2" fill="#b97f2c" />
            </g>

            {/* Orejeras: detrás de la carcasa de frente, en el centro de perfil. */}
            <motion.ellipse cx={earL} cy={64} rx={earRx} ry={13} fill="#c48a32" />
            <motion.ellipse cx={earR} cy={64} rx={earRx} ry={13} fill="#c48a32" />

            {/* Carcasa con brillo arriba y sombra abajo. */}
            <rect x="14" y="22" width="92" height="84" rx="38" fill={`url(#${gShell})`} />
            <path d="M30 34 Q44 25 64 26" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.35" fill="none" />
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
              <rect x="23" y="36" width="74" height="58" rx="26" fill={`url(#${gScreen})`} />
              <ellipse cx="34" cy="73" rx="6" ry="3.6" fill="#ff8f8f" opacity={cheek} />
              <ellipse cx="86" cy="73" rx="6" ry="3.6" fill="#ff8f8f" opacity={cheek} />
              <Face face={face} />
              {/* Gafas al estudiar. */}
              {activity === "study" && (
                <g className="nh-glasses" fill="none" stroke="#f0c76e" strokeWidth="2.2">
                  <circle cx="46" cy="58" r="10" />
                  <circle cx="74" cy="58" r="10" />
                  <path d="M56 57 Q60 54 64 57" />
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
