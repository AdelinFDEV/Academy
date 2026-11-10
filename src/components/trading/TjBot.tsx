"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, animate, motion, useMotionValue, useTransform, useVelocity, type AnimationPlaybackControls, type TargetAndTransition, type Variants } from "framer-motion";
import NovaHead, { type NovaActivity, type NovaFace } from "./NovaHead";
import NovaRoom from "./NovaRoom";
import { NovaVuelo, cajaDe, cajaDeLaBarra, dejarSalida, llegarAlDiario, sinAnimaciones, type CajaNova } from "./novaVuelo";
import { X, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import {
  BOT_NAME, IMPORTANT, NOVA_FIRMA, SECTION_LABEL,
  type BotActionKind, type BotMessage, type BotPulse, type BotReport, type BotSection,
} from "./tjNova";

/*
 * Nova, versión 3. Dos piezas:
 *   · El personaje (NovaHead), una cabeza que vuela por su espacio bajo el
 *     saludo. Vuela a un sitio girándose en continuo hacia donde va y allí se
 *     pone a hacer algo (dormir, pelota, trading, estudiar, música) durante
 *     10 minutos, o hasta que el usuario le interrumpa. Al pasarle el ratón deja
 *     lo que hace, se gira hacia ti y brinca de alegría; cuando te vas, vuela a
 *     otro sitio y empieza otra actividad distinta, al azar.
 *   · El bocadillo: capítulos (el primero, «Tu pulso»), una sección cada vez,
 *     con mensajes priorizados y botones que llevan a hacer lo que proponen.
 * La frase corta junto al personaje está quitada de momento (el motor sigue
 * calculando `teasers` por si vuelve).
 */

const SEEN_KEY = "tj-bot-visto";
const SEEN_EVENT = "tj-bot-visto";

// ─────────────────────────── «Visto» ───────────────────────────
/*
 * La huella de los últimos mensajes que el usuario abrió, en localStorage. Con
 * useSyncExternalStore el servidor (y la hidratación) dan «visto» y el navegador
 * decide después: el punto de aviso nunca parpadea al cargar.
 */
function subscribeSeen(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(SEEN_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(SEEN_EVENT, cb);
  };
}

const readSeen = () => {
  try {
    return localStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
};

function markSeen(signature: string) {
  try {
    localStorage.setItem(SEEN_KEY, signature);
  } catch {
    // Sin almacenamiento (modo privado estricto): el aviso volverá a salir, sin más.
  }
  window.dispatchEvent(new Event(SEEN_EVENT));
}

/**
 * Al reiniciar el diario: Nova olvida lo que guarda el navegador (qué mensajes
 * viste y la huella para el aviso de la barra) y vuelve a saludar como nueva.
 */
export function reiniciarNova() {
  try {
    localStorage.removeItem(SEEN_KEY);
    localStorage.removeItem(NOVA_FIRMA);
  } catch {
    // Sin almacenamiento no hay nada que olvidar.
  }
  window.dispatchEvent(new Event(SEEN_EVENT));
}

// ─────────────────────────── Animaciones ───────────────────────────

// El popup grande: entra cuando Nova ya está llegando al centro.
const modalVariants: Variants = {
  hidden: { opacity: 0, y: 26, scale: 0.94 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 28, delay: 0.32 } },
  exit: { opacity: 0, y: 18, scale: 0.96, transition: { duration: 0.18 } },
};

/** Punto en la pantalla (coordenadas de la ventana). */
interface Pt {
  x: number;
  y: number;
}

// Los mensajes de una sección entran uno a uno; la primera vez, después del «escribiendo…».
const listVariants: Variants = {
  hidden: {},
  show: (first: boolean) => ({ transition: { delayChildren: first ? 0.6 : 0.1, staggerChildren: 0.09 } }),
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 420, damping: 32 } },
};

// Cada sección entra deslizándose desde el lado hacia el que se avanza.
const slideVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 44 }),
  center: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 340, damping: 32 } },
  leave: (dir: number) => ({ opacity: 0, x: dir * -44, transition: { duration: 0.15 } }),
};

const ORDER: BotSection[] = ["pulso", "hoy", "animo", "operaciones", "hitos", "consejos"];

/** El icono de cada capítulo, en la barra de arriba y en el botón «siguiente». */
const SECTION_EMOJI: Record<BotSection, string> = {
  pulso: "💓",
  hoy: "📍",
  animo: "💭",
  operaciones: "📋",
  hitos: "🏆",
  consejos: "💡",
};

/** Arrastrar más que esto (px) en el móvil pasa de sección. */
const SWIPE = 60;

/*
 * La vida de Nova en su espacio:
 *   1. Vuela a un sitio al azar: se gira (con un muelle, por el camino más
 *      corto) hacia donde va y avanza muy despacio (unos 18 px/s, 4-12 s).
 *   2. Allí hace una actividad durante ACTIVITY_MS, o hasta que le interrumpan
 *      (ratón encima o bocadillo abierto).
 *   3. Interrumpido, espera a que el usuario se vaya, vuela a otro sitio y
 *      empieza otra actividad distinta de la anterior.
 */
const FLY_SPEED = 18;
const FLY_EASE = [0.45, 0, 0.55, 1] as const;
const ACTIVITY_MS = 10 * 60 * 1000;
/** Tamaño de la cabeza en pantalla, y lo que asoman los objetos a su derecha. */
const HEAD = 112;
const PROP_W = 50;
const ACTIVITIES: NovaActivity[] = ["trade", "study", "ball", "sleep", "music"];

/** Otra actividad distinta de la anterior; la pelota solo si hay sitio por encima. */
function pickActivity(last: NovaActivity, top: number): NovaActivity {
  const options = ACTIVITIES.filter(a => a !== last && (a !== "ball" || top >= 40));
  return options[Math.floor(Math.random() * options.length)] ?? "trade";
}

// ─────────────────────────── Vuelo al centro ───────────────────────────

interface Escena {
  from: Pt;
  to: Pt;
  scale: number;
}

/** Escritorio: en arco, inclinándose hacia donde va y agrandándose. */
function vueloEscritorio(st: Escena, dir: number): TargetAndTransition {
  return {
    x: [st.from.x, (st.from.x + st.to.x) / 2, st.to.x],
    y: [st.from.y, Math.max(0, (st.from.y + st.to.y) / 2 - 70), st.to.y],
    scale: [1, (1 + st.scale) / 2, st.scale * 1.08, st.scale],
    rotate: [0, dir * 14, -dir * 5, 0],
    transition: {
      x: { duration: 0.8, times: [0, 0.5, 1], ease: ["easeOut", "easeInOut"] },
      y: { duration: 0.8, times: [0, 0.45, 1], ease: ["easeOut", "easeIn"] },
      scale: { duration: 0.95, times: [0, 0.45, 0.82, 1], ease: "easeInOut" },
      rotate: { duration: 0.9, times: [0, 0.4, 0.82, 1], ease: "easeInOut" },
    },
  };
}

function vueltaEscritorio(st: Escena, p: Pt, dir: number): TargetAndTransition {
  return {
    x: [st.to.x, (st.to.x + p.x) / 2, p.x],
    y: [st.to.y, Math.max(0, (st.to.y + p.y) / 2 - 50), p.y],
    scale: [st.scale, st.scale * 0.75, 1.06, 1],
    rotate: [0, -dir * 12, dir * 4, 0],
    transition: {
      delay: 0.12,
      x: { duration: 0.75, times: [0, 0.5, 1], ease: ["easeIn", "easeOut"] },
      y: { duration: 0.75, times: [0, 0.4, 1], ease: ["easeOut", "easeIn"] },
      scale: { duration: 0.8, times: [0, 0.45, 0.85, 1], ease: "easeInOut" },
      rotate: { duration: 0.8, times: [0, 0.4, 0.85, 1], ease: "easeInOut" },
    },
  };
}

/*
 * Móvil: un acercamiento corto y con intención. Primero coge impulso (baja un
 * poco y se encoge), luego sale disparada casi en línea recta hacia arriba
 * creciendo, se pasa un pelín de tamaño y se asienta con un rebote suave. Sin
 * arco grande: en una pantalla estrecha el arco se sale por arriba.
 */
const EASE_DASH: [number, number, number, number] = [0.2, 0.9, 0.25, 1];

function vueloMovil(st: Escena): TargetAndTransition {
  const s = st.scale;
  return {
    x: [st.from.x, st.from.x, st.to.x, st.to.x],
    y: [st.from.y, st.from.y + 10, st.to.y - 6, st.to.y],
    scale: [1, 0.86, s * 1.14, s * 0.96, s],
    rotate: [0, -4, 3, 0],
    transition: {
      x: { duration: 0.62, times: [0, 0.16, 0.78, 1], ease: ["easeOut", EASE_DASH, "easeOut"] },
      y: { duration: 0.62, times: [0, 0.16, 0.78, 1], ease: ["easeOut", EASE_DASH, "easeOut"] },
      scale: { duration: 0.78, times: [0, 0.16, 0.62, 0.84, 1], ease: "easeInOut" },
      rotate: { duration: 0.62, times: [0, 0.16, 0.7, 1], ease: "easeInOut" },
    },
  };
}

function vueltaMovil(st: Escena, p: Pt): TargetAndTransition {
  const s = st.scale;
  return {
    x: [st.to.x, st.to.x, p.x],
    y: [st.to.y, st.to.y - 8, p.y],
    scale: [s, s * 1.06, 1.04, 1],
    rotate: [0, 3, 0],
    transition: {
      delay: 0.1,
      x: { duration: 0.55, times: [0, 0.18, 1], ease: ["easeOut", EASE_DASH] },
      y: { duration: 0.55, times: [0, 0.18, 1], ease: ["easeOut", EASE_DASH] },
      scale: { duration: 0.6, times: [0, 0.18, 0.85, 1], ease: "easeInOut" },
      rotate: { duration: 0.55, times: [0, 0.3, 1], ease: "easeInOut" },
    },
  };
}

// ─────────────────────────── El análisis ───────────────────────────

const horaLocal = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" });

/**
 * Con qué y cuándo se hizo el análisis, en la hora del usuario. Se pinta solo
 * con el popup abierto (en el navegador): no hay desajuste de hidratación.
 */
function textoAnalisis(report: BotReport): string {
  const ops = report.operaciones === 1 ? "tu operación" : `tus ${report.operaciones} operaciones`;
  return `🔄 Analizado a las ${horaLocal.format(new Date(report.analizado))} con ${ops} y tus sensaciones · me pongo al día cada vez que apuntas algo`;
}

// ─────────────────────────── Pulso ───────────────────────────

/** Anillo con la nota de 0 a 100: el trazo y el número suben a la vez. */
function PulseGauge({ pulse }: { pulse: BotPulse }) {
  const value = useMotionValue(0);
  const shown = useTransform(value, v => Math.round(v));
  const R = 46;
  const C = 2 * Math.PI * R;
  const offset = useTransform(value, v => C - (v / 100) * C);

  useEffect(() => {
    const controls = animate(value, pulse.score, { duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 });
    return () => controls.stop();
  }, [pulse.score, value]);

  const tone = pulse.score >= 65 ? "win" : pulse.score >= 40 ? "accent" : "loss";
  return (
    <div className={`tjbot-gauge is-${tone}`}>
      <svg viewBox="0 0 110 110" aria-hidden="true">
        <circle cx="55" cy="55" r={R} className="tjbot-gauge-track" />
        <motion.circle cx="55" cy="55" r={R} className="tjbot-gauge-arc" strokeDasharray={C} style={{ strokeDashoffset: offset }} />
      </svg>
      <span className="tjbot-gauge-value">
        <motion.strong>{shown}</motion.strong>
        <small>/100</small>
      </span>
    </div>
  );
}

/** Icono de cada parte del pulso. */
const PART_EMOJI: Record<string, string> = { riesgo: "🛡️", resultados: "📈", emociones: "💭", constancia: "📅" };

/** Cómo va una parte (vale de 0 a 25), en una palabra y con su tono. */
function estadoParte(v: number | null): { txt: string; tone: "win" | "accent" | "loss" | "none" } {
  if (v == null) return { txt: "Sin datos", tone: "none" };
  const r = v / 25;
  return r >= 0.7 ? { txt: "Bien", tone: "win" } : r >= 0.4 ? { txt: "Mejorable", tone: "accent" } : { txt: "Flojo", tone: "loss" };
}

/** Una frase bajo la nota: lo que mejor va y lo que más pesa. */
function resumenPulso(pulse: BotPulse): string {
  const medidas = pulse.parts.filter(p => p.value != null);
  if (medidas.length < 2) return "Cuantos más datos apuntes, más fino te leo.";
  const orden = [...medidas].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  const mejor = orden[0];
  const peor = orden[orden.length - 1];
  if ((peor.value ?? 0) / 25 >= 0.7) return `Todo en verde. Lo más fuerte: ${mejor.label.toLowerCase()}.`;
  return `Lo más fuerte: ${mejor.label.toLowerCase()} · A mejorar: ${peor.label.toLowerCase()}`;
}

function PulseView({ pulse, highlights, renderMsg }: {
  pulse: BotPulse;
  highlights: BotMessage[];
  renderMsg: (m: BotMessage) => React.ReactNode;
}) {
  return (
    <>
      {/* La nota y lo que significa. */}
      <motion.div className="tjbot-pulse" variants={itemVariants}>
        <PulseGauge pulse={pulse} />
        <div className="tjbot-pulse-text">
          <span className="tjbot-kicker">Así te veo ahora</span>
          <strong>{pulse.label}</strong>
          <p>{resumenPulso(pulse)}</p>
        </div>
      </motion.div>

      {/* Las cuatro piezas de la nota, cada una en su tarjeta. */}
      <motion.ul className="tjbot-parts" variants={itemVariants}>
        {pulse.parts.map((p, i) => {
          const est = estadoParte(p.value);
          return (
            <li key={p.id} className={`tjbot-part is-${est.tone}`}>
              <div className="tjbot-part-top">
                <span className="tjbot-part-ic" aria-hidden="true">{PART_EMOJI[p.id] ?? "•"}</span>
                <span className="tjbot-part-label">{p.label}</span>
                <span className="tjbot-part-state">{est.txt}</span>
              </div>
              <span className={`tjbot-part-bar${p.value == null ? " is-empty" : ""}`} aria-hidden="true">
                <motion.i
                  initial={{ width: 0 }}
                  animate={{ width: `${((p.value ?? 0) / 25) * 100}%` }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                />
              </span>
              <span className="tjbot-part-hint">{p.hint}</span>
            </li>
          );
        })}
      </motion.ul>

      <motion.span className="tjbot-kicker tjbot-kicker-row" variants={itemVariants}>Lo más importante</motion.span>
      {highlights.length
        ? highlights.map(renderMsg)
        : (
          <motion.div variants={itemVariants} className="tjbot-msg is-win">
            <span className="tjbot-emoji" aria-hidden="true">🙌</span>
            <span className="tjbot-msg-body"><span className="tjbot-msg-text">Nada urgente por ahora. ¡Buen trabajo! Repasa los demás apartados cuando quieras.</span></span>
          </motion.div>
        )}
    </>
  );
}

// ─────────────────────────── Nova ───────────────────────────

export default function TjBot({ report, onAction }: {
  report: BotReport;
  /** Lo que hace cada botón de los mensajes (abrir el formulario, ir a hitos…). */
  onAction: (kind: BotActionKind) => void;
}) {
  const [open, setOpen] = useState(false);
  // Sección abierta y hacia dónde se movió (para la animación): una sección cada vez.
  const [[step, dir], setStep] = useState<[number, number]>([0, 1]);
  const [visited, setVisited] = useState(false);
  const [hover, setHover] = useState(false);
  const [flying, setFlying] = useState(false);
  // La escena del diálogo: desde dónde sale Nova, adónde vuela y cuánto se agranda;
  // `home` es adónde vuelve al cerrar; `arrived`, si ya está en el centro hablando.
  // `movil`: pantalla estrecha; vuelo corto y bocadillo sencillo, solo con flechas.
  const [stage, setStage] = useState<{ from: Pt; to: Pt; scale: number; movil: boolean } | null>(null);
  const [home, setHome] = useState<Pt | null>(null);
  const [arrived, setArrived] = useState(false);
  // Al entrar al Diario, Nova llega volando desde su sitio en la barra de arriba.
  const [aterrizaje, setAterrizaje] = useState<{ desde: CajaNova; hasta: CajaNova } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const aterrizandoRef = useRef(false);
  const flyerTheta = useMotionValue(0);
  const [activity, setActivity] = useState<NovaActivity>("none");
  // Posición en su espacio, ángulo de giro (0 de frente, 90 perfil, 180 de espaldas)
  // y una inclinación leve según la velocidad al volar.
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const theta = useMotionValue(0);
  const tilt = useTransform(useVelocity(x), [-36, 0, 36], [-7, 0, 7]);
  const habitatRef = useRef<HTMLDivElement>(null);
  const flightRef = useRef<AnimationPlaybackControls[]>([]);
  const turnRef = useRef<AnimationPlaybackControls | null>(null);
  const timerRef = useRef(0);
  const pausedRef = useRef(false);
  const interruptedRef = useRef(false);
  const lastActivityRef = useRef<NovaActivity>("none");
  const flyRef = useRef<() => void>(() => {});
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const seen = useSyncExternalStore(subscribeSeen, readSeen, () => report.signature);
  const unseen = seen !== report.signature;

  const sections = ORDER
    .map(s => ({
      s,
      items: s === "pulso" ? report.highlights : report.messages.filter(m => m.section === s).sort((a, b) => b.priority - a.priority),
    }))
    .filter(g => (g.s === "pulso" ? report.pulse != null : g.items.length > 0));
  const at = Math.min(step, sections.length - 1);
  const current = sections[at];
  const next = sections[at + 1];
  const isLast = at >= sections.length - 1;

  /** Girarse con un muelle suave, siempre por el camino más corto. */
  function turnTo(target: number) {
    const cur = theta.get();
    const delta = ((((target - cur) % 360) + 540) % 360) - 180;
    turnRef.current?.stop();
    turnRef.current = animate(theta, cur + delta, { type: "spring", stiffness: 40, damping: 14, mass: 1.1 });
  }

  /*
   * Llegar al Diario: la primera vez en cada visita, Nova vuela desde su hueco en
   * la barra de arriba hasta aquí (en el móvil esa barra no se pinta y aparece
   * sin más). Y al irse deja apuntado dónde estaba, para que la barra la reciba
   * volando. Es de layout para medir antes de que React la quite de la página.
   */
  useLayoutEffect(() => {
    const trigger = triggerRef.current;
    if (llegarAlDiario() && !sinAnimaciones()) {
      const desde = cajaDeLaBarra();
      const hasta = cajaDe(trigger?.querySelector(".nh"));
      if (desde && hasta) {
        aterrizandoRef.current = true;
        setAterrizaje({ desde, hasta });
      }
    }
    return () => {
      const caja = cajaDe(trigger?.querySelector(".nh"));
      if (caja) dejarSalida(caja);
    };
  }, []);

  // Su vida: volar y hacer cosas. Sin animaciones (preferencia del sistema), se queda quieto.
  useEffect(() => {
    if (sinAnimaciones()) return;

    const startActivity = () => {
      if (pausedRef.current) return;
      const chosen = pickActivity(lastActivityRef.current, y.get());
      lastActivityRef.current = chosen;
      turnTo(0);
      setActivity(chosen);
      // Diez minutos con lo suyo; luego vuela a otro sitio y cambia.
      timerRef.current = window.setTimeout(() => {
        setActivity("none");
        fly();
      }, ACTIVITY_MS);
    };

    const fly = () => {
      const habitat = habitatRef.current;
      if (pausedRef.current || !habitat) return;
      const maxX = Math.max(0, habitat.clientWidth - HEAD - PROP_W);
      const maxY = Math.max(0, habitat.clientHeight - HEAD);
      const tx = Math.random() * maxX;
      const ty = Math.random() * maxY;
      const dx = tx - x.get();
      const dy = ty - y.get();
      const duration = Math.min(12, Math.max(4, Math.hypot(dx, dy) / FLY_SPEED));
      // Se gira hacia donde va: de tres cuartos a los lados, de espaldas si sube mucho.
      turnTo(Math.abs(dy) > Math.abs(dx) * 1.6 ? (dy < 0 ? 180 : 0) : dx < 0 ? -72 : 72);
      setFlying(true);
      // Arranca cuando ya ha empezado a girarse: más natural que girar y avanzar a la vez.
      const delay = 0.45;
      flightRef.current = [
        animate(x, tx, { duration, ease: FLY_EASE, delay }),
        animate(y, ty, { duration, ease: FLY_EASE, delay }),
      ];
      timerRef.current = window.setTimeout(() => {
        setFlying(false);
        turnTo(0);
        timerRef.current = window.setTimeout(startActivity, 900);
      }, (duration + delay) * 1000);
    };

    flyRef.current = fly;
    // Si acaba de llegar volando desde la barra, descansa un poco más antes de echar a volar.
    timerRef.current = window.setTimeout(fly, aterrizandoRef.current ? 2600 : 1200);
    return () => {
      window.clearTimeout(timerRef.current);
      flightRef.current.forEach(c => c.stop());
      turnRef.current?.stop();
    };
    // turnTo solo usa refs y valores de movimiento: estable.
  }, [x, y]); // eslint-disable-line react-hooks/exhaustive-deps

  // Si el espacio se estrecha (ventana más pequeña), Nova vuelve dentro.
  useEffect(() => {
    const habitat = habitatRef.current;
    if (!habitat) return;
    const ro = new ResizeObserver(() => {
      const maxX = Math.max(0, habitat.clientWidth - HEAD - PROP_W);
      if (x.get() > maxX) x.set(maxX);
    });
    ro.observe(habitat);
    return () => ro.disconnect();
  }, [x]);

  // Quieto mientras tiene el ratón encima o el bocadillo abierto. Cuando el usuario
  // se va tras interrumpirle, al rato vuela a otro sitio y empieza otra cosa.
  useEffect(() => {
    pausedRef.current = open || hover;
    if (!open && !hover && interruptedRef.current) {
      interruptedRef.current = false;
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => flyRef.current(), 1800);
    }
  }, [open, hover]);

  /** Interrumpirle: deja lo que hacía, se para donde esté y se gira hacia ti. */
  function interrupt() {
    pausedRef.current = true;
    interruptedRef.current = true;
    window.clearTimeout(timerRef.current);
    flightRef.current.forEach(c => c.stop());
    setFlying(false);
    setActivity("none");
    turnTo(0);
  }

  // Abierto: el foco va al popup (para las flechas) y Esc cierra desde cualquier sitio.
  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Con la escena delante, la página de detrás no se desplaza.
  useEffect(() => {
    if (!stage) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prev;
    };
  }, [stage]);

  /** Abrir: Nova vuela rápido a lo alto del centro de la pantalla, agrandándose, y se abre el popup. */
  function openDialog() {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const vw = window.innerWidth;
    const movil = vw < 640;
    // En el móvil Nova se queda algo más pequeña arriba: el bocadillo necesita la pantalla.
    const scale = movil ? 0.78 : window.innerHeight < 860 ? 1.2 : 1.6;
    markSeen(report.signature);
    setStep([0, 1]);
    setVisited(false);
    interrupt();
    setHover(false);
    setArrived(false);
    setHome(null);
    setStage({
      from: { x: r.left, y: r.top },
      to: { x: vw / 2 - (HEAD * scale) / 2, y: movil ? 10 : Math.max(12, window.innerHeight * 0.03) },
      scale,
      movil,
    });
    setOpen(true);
  }

  /** Cerrar: el popup se recoge y Nova vuelve volando a su sitio, a su tamaño. */
  function close() {
    if (!open) return;
    const r = triggerRef.current?.getBoundingClientRect();
    if (r) setHome({ x: r.left, y: r.top });
    setArrived(false);
    setOpen(false);
  }

  function go(to: number) {
    if (to < 0 || to >= sections.length || to === at) return;
    setVisited(true);
    setStep([to, to > at ? 1 : -1]);
  }

  /*
   * Teclado dentro del bocadillo: ← → cambian de sección y Esc cierra. Se para
   * aquí la propagación: el calendario también escucha las flechas (cambia de mes).
   */
  function onPanelKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") go(at + 1);
    else if (e.key === "ArrowLeft") go(at - 1);
    else if (e.key === "Escape") close();
    else return;
    e.preventDefault();
    e.stopPropagation();
  }

  function act(kind: BotActionKind) {
    close();
    onAction(kind);
  }

  function renderMsg(m: BotMessage) {
    return (
      <motion.div key={m.id} variants={itemVariants} className={`tjbot-msg is-${m.tone}${m.priority >= IMPORTANT ? " is-important" : ""}`}>
        <span className="tjbot-emoji" aria-hidden="true">{m.emoji}</span>
        <span className="tjbot-msg-body">
          {m.priority >= IMPORTANT && <span className="tjbot-flag">Importante</span>}
          <span className="tjbot-msg-text">{m.text}</span>
          {m.action && (
            <button type="button" className="tjbot-action" onClick={() => act(m.action!.kind)}>
              {m.action.label} <ArrowRight size={13} aria-hidden="true" />
            </button>
          )}
        </span>
      </motion.div>
    );
  }

  const flightDir = stage ? (stage.to.x >= stage.from.x ? 1 : -1) : 1;

  // La cara del momento: alegría con el ratón encima; si no, la de lo que esté haciendo; si no, la del informe.
  const face: NovaFace = hover
    ? "joy"
    : activity === "sleep" ? "sleepy"
    : activity === "trade" || activity === "study" ? "focused"
    : activity === "music" ? "music"
    : activity === "ball" ? "happy"
    : report.expression;

  return (
    <div className="tjbot">
      {/* El espacio de Nova: vive y se pasea por todo el hueco bajo el saludo. */}
      <div className="tjbot-habitat" ref={habitatRef}>
        {/* Su habitación: un fondo fijo. Va aparte para recortar solo el fondo, no a Nova (la pelota y los corazones salen por arriba). */}
        <NovaRoom />
        <motion.div className="tjbot-walker" style={{ x, y }}>
          <motion.button
            ref={triggerRef}
            type="button"
            className={`tjbot-trigger${open ? " is-open" : ""}${hover ? " is-hover" : ""}${stage || aterrizaje ? " is-away" : ""}`}
            onClick={() => (open ? close() : openDialog())}
            onMouseEnter={() => { setHover(true); interrupt(); }}
            onMouseLeave={() => setHover(false)}
            whileTap={{ scale: 0.93 }}
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={`${BOT_NAME}, tu asistente de trading.${unseen ? " Tiene mensajes nuevos." : ""} ${open ? "Cerrar" : "Abrir"} sus mensajes`}
            title={`${BOT_NAME} · pulsa para hablar con él`}
          >
            <motion.span className="tjbot-avatar-wrap" style={{ rotate: tilt }}>
              <NovaHead
                theta={theta}
                face={face}
                activity={activity}
                flying={flying}
                joy={hover}
                talking={open}
                track={activity === "none" && !flying}
              />
              {unseen && !open && <span className="tjbot-ping" aria-hidden="true" />}
              <span className="tjbot-shadow" aria-hidden="true" />
            </motion.span>
          </motion.button>
        </motion.div>
      </div>

      {aterrizaje && <NovaVuelo desde={aterrizaje.desde} hasta={aterrizaje.hasta} onFin={() => setAterrizaje(null)} />}

      {stage && createPortal(
        <div className="tjbot-stage">
          <motion.div
            className="tjbot-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: open ? 1 : 0 }}
            transition={{ duration: 0.35 }}
            onClick={close}
            aria-hidden="true"
          />

          {/*
            Nova volando EN ARCO: sube y baja describiendo una curva, se inclina hacia
            donde va, se agranda («se acerca») y al llegar rebota un poco y deja un
            anillo de luz. La vuelta, el arco contrario, encogiéndose.
          */}
          <AnimatePresence custom={home ?? stage.from} onExitComplete={() => setStage(null)}>
            {open && (
              <motion.div
                key="nova"
                className="tjbot-flyer"
                custom={home ?? stage.from}
                initial={{ x: stage.from.x, y: stage.from.y, scale: 1, rotate: 0 }}
                animate={stage.movil ? vueloMovil(stage) : vueloEscritorio(stage, flightDir)}
                exit="back"
                variants={{
                  back: (p: Pt) => (stage.movil ? vueltaMovil(stage, p) : vueltaEscritorio(stage, p, flightDir)),
                }}
                onAnimationComplete={def => { if (def !== "back") setArrived(true); }}
              >
                <AnimatePresence>
                  {arrived && (
                    <motion.span
                      key="ring"
                      className="tjbot-arrive-ring"
                      initial={{ opacity: 0.8, scale: 0.5 }}
                      animate={{ opacity: 0, scale: 1.6 }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      aria-hidden="true"
                    />
                  )}
                </AnimatePresence>
                <NovaHead
                  theta={flyerTheta}
                  face={arrived ? report.expression : "joy"}
                  activity="none"
                  flying={!arrived}
                  joy={!arrived}
                  talking={arrived}
                  track={arrived}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* El popup, bajo Nova, con el piquito hacia ella. */}
          <div className={`tjbot-dialog${stage.movil ? " is-movil" : ""}`} style={{ "--dlg-top": `${Math.round(stage.to.y + HEAD * stage.scale * 0.92)}px` } as React.CSSProperties}>
            <AnimatePresence>
              {open && current && (
                <motion.div
                  id={panelId}
                  ref={panelRef}
                  tabIndex={-1}
                  className="tjbot-panel is-modal"
                  role="dialog"
                  aria-label={`Mensajes de ${BOT_NAME}`}
                  variants={modalVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  onKeyDown={onPanelKey}
                >
                  <span className="tjbot-tail" aria-hidden="true" />

                  {/* Cabecera: lo que Nova te dice al llegar. */}
                  <header className="tjbot-modal-head">
                    <div className="tjbot-greet">
                      <span className="tjbot-greet-kicker">{BOT_NAME} · tu asistente de trading</span>
                      <h2>{report.teasers[0]}</h2>
                      {!stage.movil && <p>
                        {report.messages.length === 1 ? "Tengo una cosa que contarte" : `Tengo ${report.messages.length} cosas que contarte`}
                        {report.highlights.length ? ` · ${report.highlights.length} ${report.highlights.length === 1 ? "es importante" : "son importantes"}` : " · nada urgente"}
                      </p>}
                      {!stage.movil && <p className="tjbot-corte">{textoAnalisis(report)}</p>}
                    </div>
                    <button type="button" className="tj-icon-btn tjbot-close" onClick={close} aria-label="Cerrar" title="Cerrar (Esc)">
                      <X size={16} />
                    </button>
                  </header>

                  <div className="tjbot-modal-grid">
                    {/* Índice: las secciones, con cuántas cosas tiene cada una; el resalte se desliza a la activa. */}
                    {!stage.movil && <nav className="tjbot-index" aria-label="Secciones">
                      {sections.map((g, i) => {
                        const urgent = g.s !== "pulso" && g.items.some(m => m.priority >= IMPORTANT);
                        const count = g.s === "pulso" && report.pulse ? `${report.pulse.score}` : String(g.items.length);
                        return (
                          <button
                            key={g.s}
                            type="button"
                            className={`tjbot-index-item${i === at ? " is-on" : ""}`}
                            onClick={() => go(i)}
                            aria-current={i === at ? "step" : undefined}
                          >
                            {i === at && <motion.span layoutId="tjbot-index-on" className="tjbot-index-on" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                            <span className="tjbot-index-emoji" aria-hidden="true">{SECTION_EMOJI[g.s]}</span>
                            <span className="tjbot-index-label">{SECTION_LABEL[g.s]}</span>
                            {urgent && <span className="tjbot-index-dot" title="Tiene algo importante" />}
                            <span className="tjbot-index-count">{count}</span>
                          </button>
                        );
                      })}
                    </nav>}

                    {/* La sección abierta. En el móvil, arrastrar a un lado pasa de sección. */}
                    <div className="tjbot-main">
                      <div className="tjbot-body">
                        {!visited && (
                          <motion.div
                            className="tjbot-typing"
                            initial={{ opacity: 1, height: "auto" }}
                            animate={{ opacity: 0, height: 0, marginBottom: 0 }}
                            transition={{ delay: 0.5, duration: 0.2 }}
                            aria-hidden="true"
                          >
                            <i /><i /><i />
                          </motion.div>
                        )}
                        <AnimatePresence mode="wait" custom={dir} initial={false}>
                          <motion.section
                            key={current.s}
                            className="tjbot-section"
                            custom={dir}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="leave"
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.25}
                            onDragEnd={(_, info) => {
                              if (info.offset.x < -SWIPE) go(at + 1);
                              else if (info.offset.x > SWIPE) go(at - 1);
                            }}
                            aria-live="polite"
                          >
                            {!stage.movil && <header className="tjbot-section-head">
                              <span aria-hidden="true">{SECTION_EMOJI[current.s]}</span>
                              <h3>{SECTION_LABEL[current.s]}</h3>
                            </header>}
                            <motion.div className="tjbot-list" variants={listVariants} custom={!visited} initial="hidden" animate="show">
                              {current.s === "pulso" && report.pulse
                                ? <PulseView pulse={report.pulse} highlights={current.items} renderMsg={renderMsg} />
                                : current.items.map(renderMsg)}
                            </motion.div>
                          </motion.section>
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  {/* Pie del móvil: solo flechas y, entre ellas, dónde estás. */}
                  {stage.movil ? (
                    <footer className="tjbot-foot tjbot-foot-movil">
                      <button type="button" className="tjbot-arrow" onClick={() => go(at - 1)} disabled={at === 0} aria-label="Sección anterior">
                        <ChevronLeft size={20} />
                      </button>
                      <div className="tjbot-where">
                        <strong><span aria-hidden="true">{SECTION_EMOJI[current.s]}</span> {SECTION_LABEL[current.s]}</strong>
                        <span className="tjbot-dots" aria-label={`Sección ${at + 1} de ${sections.length}`}>
                          {sections.map((g, i) => (
                            <motion.i key={g.s} className={i === at ? "is-on" : i < at ? "is-done" : undefined} animate={{ width: i === at ? 18 : 6 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                          ))}
                        </span>
                      </div>
                      {isLast ? (
                        <button type="button" className="tjbot-arrow is-done" onClick={close} aria-label="Entendido, cerrar">
                          <span aria-hidden="true">👍</span>
                        </button>
                      ) : (
                        <button type="button" className="tjbot-arrow is-next" onClick={() => go(at + 1)} aria-label={`Siguiente: ${SECTION_LABEL[next.s]}`}>
                          <ChevronRight size={20} />
                        </button>
                      )}
                    </footer>
                  ) : (
                  <footer className="tjbot-foot">
                    <button type="button" className="tjbot-back" onClick={() => go(at - 1)} disabled={at === 0} aria-label="Sección anterior">
                      <ChevronLeft size={16} />
                    </button>
                    <span className="tjbot-dots" aria-label={`Sección ${at + 1} de ${sections.length}`}>
                      {sections.map((g, i) => (
                        <motion.i key={g.s} className={i === at ? "is-on" : i < at ? "is-done" : undefined} animate={{ width: i === at ? 22 : 7 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                      ))}
                    </span>
                    {isLast ? (
                      <button type="button" className="tjbot-next is-done" onClick={close}>
                        <span className="tjbot-next-label">¡Entendido!</span>
                        <span className="tjbot-next-icon" aria-hidden="true">👍</span>
                      </button>
                    ) : (
                      <button type="button" className="tjbot-next" onClick={() => go(at + 1)}>
                        <span className="tjbot-next-kicker">Ahora</span>
                        <span className="tjbot-next-label">{SECTION_LABEL[next.s]}</span>
                        <span className="tjbot-next-icon" aria-hidden="true">{SECTION_EMOJI[next.s]}</span>
                        <ChevronRight size={16} className="tjbot-next-arrow" aria-hidden="true" />
                      </button>
                    )}
                  </footer>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
