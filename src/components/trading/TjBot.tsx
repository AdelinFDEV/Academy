"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence, animate, motion, useMotionValue, useTransform, useVelocity,
  type AnimationPlaybackControls, type TargetAndTransition, type Variants,
} from "framer-motion";
import NovaHead, { type NovaActivity, type NovaFace } from "./NovaHead";
import NovaRoom from "./NovaRoom";
import { NovaEstela, NovaVuelo, cajaDe, cajaDeLaBarra, dejarSalida, llegarAlDiario, sinAnimaciones, type CajaNova } from "./novaVuelo";
import { X, ChevronLeft, ChevronRight, ArrowRight, Check } from "lucide-react";
import {
  BOT_NAME, IMPORTANT, NOVA_FIRMA, NOVA_RESUMEN, SECTION_LABEL,
  type BotActionKind, type BotMessage, type BotReport, type BotSection, type Objetivo,
} from "./tjNova";

/*
 * Nova, versión 3. Dos piezas:
 *   · El personaje (NovaHead), una cabeza que vuela por su espacio bajo el
 *     saludo. Vuela a un sitio girándose en continuo hacia donde va y allí se
 *     pone a hacer algo (dormir, pelota, trading, estudiar, música) durante
 *     10 minutos, o hasta que el usuario le interrumpa. Al pasarle el ratón deja
 *     lo que hace, se gira hacia ti y brinca de alegría; cuando te vas, vuela a
 *     otro sitio y empieza otra actividad distinta, al azar.
 *   · El bocadillo: capítulos (el primero, «Lo más importante»), una sección
 *     cada vez, con mensajes priorizados y botones que llevan a hacer lo que
 *     proponen. Sin scroll: cada capítulo lleva pocos mensajes (TOPE en tjNova).
 *
 * Desde el 10-11-2026, cuando el análisis cambia (apuntaste algo), Nova lo
 * ANUNCIA: deja lo que hace, se gira hacia ti y saca un bocadillo corto con lo
 * que ha visto; el punto rojo dice cuántas cosas nuevas tiene.
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

/*
 * Además de «visto» (se abrió el bocadillo), se apunta qué SECCIONES de este
 * análisis se han leído ya: el punto rojo de una sección con algo importante se
 * va en cuanto se entra en ella, y no vuelve al cerrar y abrir. Se guarda junto
 * a la huella del análisis: con un análisis nuevo, la lista empieza vacía.
 */
const LEIDAS_KEY = "tj-bot-leidas";

const readLeidas = () => {
  try {
    return localStorage.getItem(LEIDAS_KEY);
  } catch {
    return null;
  }
};

function seccionesLeidas(guardado: string | null, firma: string): string[] {
  if (!guardado) return [];
  try {
    const dato: unknown = JSON.parse(guardado);
    if (typeof dato !== "object" || dato === null) return [];
    const { firma: f, secciones } = dato as { firma?: unknown; secciones?: unknown };
    return f === firma && Array.isArray(secciones) ? secciones.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function marcarLeida(firma: string, secciones: string[]) {
  try {
    localStorage.setItem(LEIDAS_KEY, JSON.stringify({ firma, secciones }));
  } catch {
    // Sin almacenamiento: el punto volverá a salir al abrir de nuevo, sin más.
  }
  window.dispatchEvent(new Event(SEEN_EVENT));
}

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
    localStorage.removeItem(LEIDAS_KEY);
    localStorage.removeItem(NOVA_FIRMA);
    localStorage.removeItem(NOVA_RESUMEN);
  } catch {
    // Sin almacenamiento no hay nada que olvidar.
  }
  window.dispatchEvent(new Event(SEEN_EVENT));
}

// ─────────────────────────── Animaciones ───────────────────────────

// El popup grande: entra cuando Nova ya está llegando al centro.
const modalVariants: Variants = {
  hidden: { opacity: 0, y: 26, scale: 0.94 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 28, delay: 0.38 } },
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

const ORDER: BotSection[] = ["importante", "semana", "hoy", "animo", "operaciones", "hitos", "consejos"];

/** El icono de cada capítulo, en la barra de arriba y en el botón «siguiente». */
const SECTION_EMOJI: Record<BotSection, string> = {
  importante: "⭐",
  semana: "🎯",
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
/** Tamaño al que está dibujada la cabeza, y lo que asoman los objetos a su derecha. */
const HEAD = 112;
const PROP_W = 50;
/**
 * A qué escala vive Nova en su habitación (pedido por el admin el 13-11-2026:
 * a tamaño completo era demasiado grande). El CSS la pinta a HEAD × REPOSO
 * (`.tjbot-habitat .nh`), y su copia voladora sale y vuelve a esa misma escala
 * para que no dé un salto. Si cambias este número, cambia el CSS con él.
 */
const REPOSO = 0.75;
const ACTIVITIES: NovaActivity[] = ["trade", "study", "ball", "sleep", "music", "coffee", "coins", "zen"];
/** Cuánto dura el bocadillo con el que Nova anuncia lo nuevo. */
const ANUNCIO_MS = 7000;

/** Otra actividad distinta de la anterior; la pelota solo si hay sitio por encima. */
function pickActivity(last: NovaActivity, top: number): NovaActivity {
  // La pelota y las monedas suben por encima de la cabeza: necesitan sitio arriba.
  const options = ACTIVITIES.filter(a => a !== last && ((a !== "ball" && a !== "coins") || top >= 40));
  return options[Math.floor(Math.random() * options.length)] ?? "trade";
}

// ─────────────────────────── Vuelo al centro ───────────────────────────

interface Escena {
  from: Pt;
  to: Pt;
  scale: number;
}

/**
 * Escritorio: coge impulso (se encoge y baja un pelo), sale en arco inclinándose
 * hacia donde va y creciendo, se pasa un poco de tamaño al llegar y se asienta
 * con un rebote. La estela (NovaEstela) sigue estos mismos valores con retraso.
 */
function vueloEscritorio(st: Escena, dir: number): TargetAndTransition {
  const s = st.scale;
  const midX = (st.from.x + st.to.x) / 2;
  const apex = Math.max(0, Math.min(st.from.y, st.to.y) - 90);
  return {
    x: [st.from.x, st.from.x, midX, st.to.x],
    y: [st.from.y, st.from.y + 12, apex, st.to.y],
    scale: [REPOSO, REPOSO * 0.86, (REPOSO + s) / 2 * 1.05, s * 1.1, s * 0.96, s],
    rotate: [0, -dir * 7, dir * 16, -dir * 6, dir * 2, 0],
    transition: {
      x: { duration: 1.05, times: [0, 0.14, 0.56, 1], ease: ["easeOut", "easeOut", "easeInOut"] },
      y: { duration: 1.05, times: [0, 0.14, 0.5, 1], ease: ["easeOut", "easeOut", "easeIn"] },
      scale: { duration: 1.2, times: [0, 0.14, 0.5, 0.84, 0.93, 1], ease: "easeInOut" },
      rotate: { duration: 1.15, times: [0, 0.14, 0.45, 0.8, 0.92, 1], ease: "easeInOut" },
    },
  };
}

/** La vuelta: un salto corto hacia arriba, el arco contrario encogiéndose y un rebote en su sitio. */
function vueltaEscritorio(st: Escena, p: Pt, dir: number): TargetAndTransition {
  const s = st.scale;
  const midX = (st.to.x + p.x) / 2;
  const apex = Math.max(0, Math.min(st.to.y, p.y) - 60);
  return {
    x: [st.to.x, st.to.x, midX, p.x],
    y: [st.to.y, st.to.y - 14, apex, p.y],
    scale: [s, s * 1.06, s * 0.7, REPOSO * 1.08, REPOSO * 0.96, REPOSO],
    rotate: [0, dir * 4, -dir * 14, dir * 5, -dir * 2, 0],
    transition: {
      delay: 0.1,
      x: { duration: 0.95, times: [0, 0.16, 0.55, 1], ease: ["easeOut", "easeIn", "easeOut"] },
      y: { duration: 0.95, times: [0, 0.16, 0.45, 1], ease: ["easeOut", "easeOut", "easeIn"] },
      scale: { duration: 1.1, times: [0, 0.16, 0.5, 0.84, 0.93, 1], ease: "easeInOut" },
      rotate: { duration: 1.05, times: [0, 0.16, 0.45, 0.8, 0.92, 1], ease: "easeInOut" },
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
    scale: [REPOSO, REPOSO * 0.86, s * 1.14, s * 0.96, s],
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
    scale: [s, s * 1.06, REPOSO * 1.04, REPOSO],
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

// ─────────────────────────── Objetivo de la semana ───────────────────────────

const OBJ_EMOJI: Record<Objetivo["id"], string> = { riesgo: "🛡️", resultados: "📈", emociones: "💭", constancia: "✏️", muestra: "✍️" };

function ObjetivoView({ objetivo }: { objetivo: Objetivo }) {
  const R = 40;
  const C = 2 * Math.PI * R;
  const desde = new Date(`${objetivo.desde}T12:00:00`);
  return (
    <>
      <motion.div className={`tjbot-obj${objetivo.cumplido ? " is-done" : ""}`} variants={itemVariants}>
        <div className="tjbot-obj-ring" aria-hidden="true">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={R} className="tjbot-obj-track" />
            <motion.circle
              cx="50" cy="50" r={R} className="tjbot-obj-arc" strokeDasharray={C}
              initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C - (objetivo.progreso / 100) * C }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            />
          </svg>
          <span className="tjbot-obj-ring-value">
            {objetivo.cumplido ? <Check size={26} /> : <><strong>{objetivo.hecho}</strong><small>/{objetivo.meta}</small></>}
          </span>
        </div>
        <div className="tjbot-obj-text">
          <span className="tjbot-kicker">{objetivo.cumplido ? "Cumplido" : "Esta semana"} · desde el lunes {desde.getDate()}</span>
          <strong><span aria-hidden="true">{OBJ_EMOJI[objetivo.id]}</span> {objetivo.titulo}</strong>
          <p>{objetivo.porque}</p>
          <span className={`tjbot-obj-estado${objetivo.cumplido ? " is-done" : ""}`}>{objetivo.estado}</span>
        </div>
      </motion.div>
      <motion.div className="tjbot-msg is-be" variants={itemVariants}>
        <span className="tjbot-emoji" aria-hidden="true">🧠</span>
        <span className="tjbot-msg-body">
          <span className="tjbot-msg-text">
            Cada lunes miro cómo vas en riesgo, resultados, emociones y constancia, y te pongo UN objetivo para la semana: lo que más te cueste entonces. Lo mido con lo que apuntas desde ese día: {objetivo.hecho} de {objetivo.meta} {objetivo.unidad} por ahora.
          </span>
        </span>
      </motion.div>
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
  // Lo que Nova anuncia sobre su cabeza cuando el análisis cambia.
  const [anuncio, setAnuncio] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const aterrizandoRef = useRef(false);
  const flyerTheta = useMotionValue(0);
  // Los valores del vuelo al centro: los anima el flyer y los sigue la estela.
  const fx = useMotionValue(0);
  const fy = useMotionValue(0);
  const fscale = useMotionValue(REPOSO);
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
  const anuncioRef = useRef(0);
  const pausedRef = useRef(false);
  const interruptedRef = useRef(false);
  const lastActivityRef = useRef<NovaActivity>("none");
  const flyRef = useRef<() => void>(() => {});
  const primeraFirma = useRef(true);
  const panelRef = useRef<HTMLDivElement>(null);
  // El ajuste al alto de la pantalla: el hueco del popup, su cuerpo y lo que lleva dentro.
  const dialogRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const fitRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<{ s: number; h: number | null; scroll: boolean }>({ s: 1, h: null, scroll: false });
  const panelId = useId();
  const seen = useSyncExternalStore(subscribeSeen, readSeen, () => report.signature);
  const unseen = seen !== report.signature;

  const sections = ORDER
    .map(s => ({
      s,
      items: s === "importante" ? report.highlights : s === "semana" ? [] : report.messages.filter(m => m.section === s).sort((a, b) => b.priority - a.priority),
    }))
    .filter(g => (g.s === "semana" ? report.objetivo != null : g.items.length > 0));
  const at = Math.min(step, sections.length - 1);

  // Qué secciones de este análisis se han leído ya (ver LEIDAS_KEY).
  const leidasGuardadas = useSyncExternalStore(subscribeSeen, readLeidas, () => null);
  const leidas = useMemo(() => seccionesLeidas(leidasGuardadas, report.signature), [leidasGuardadas, report.signature]);
  const seccionAbierta = sections[at]?.s;

  // Leer es estar delante de la sección con el bocadillo abierto: se apunta y
  // su punto rojo desaparece.
  useEffect(() => {
    if (!open || !seccionAbierta || leidas.includes(seccionAbierta)) return;
    marcarLeida(report.signature, [...leidas, seccionAbierta]);
  }, [open, seccionAbierta, leidas, report.signature]);

  // Si el análisis cambia con el bocadillo abierto (se acaba de hacer lo que
  // Nova pedía), lo nuevo se está leyendo en ese momento: también cuenta como
  // visto, y el punto rojo de Nova no reaparece al cerrar.
  useEffect(() => {
    if (open && unseen) markSeen(report.signature);
  }, [open, unseen, report.signature]);
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
      const maxX = Math.max(0, habitat.clientWidth - (HEAD + PROP_W) * REPOSO);
      const maxY = Math.max(0, habitat.clientHeight - HEAD * REPOSO);
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
      const maxX = Math.max(0, habitat.clientWidth - (HEAD + PROP_W) * REPOSO);
      if (x.get() > maxX) x.set(maxX);
    });
    ro.observe(habitat);
    return () => ro.disconnect();
  }, [x]);

  // Quieto mientras tiene el ratón encima, el bocadillo abierto o algo que anunciar.
  // Cuando el usuario se va tras interrumpirle, al rato vuela a otro sitio y empieza otra cosa.
  useEffect(() => {
    pausedRef.current = open || hover || anuncio != null;
    if (!open && !hover && anuncio == null && interruptedRef.current) {
      interruptedRef.current = false;
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => flyRef.current(), 1800);
    }
  }, [open, hover, anuncio]);

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

  /*
   * ANUNCIAR LO NUEVO. Cuando el análisis cambia y el usuario aún no lo ha
   * abierto, Nova deja lo que hace, se gira y saca un bocadillo con la frase
   * más importante unos segundos. Al entrar con novedades pendientes, también:
   * espera a aterrizar. Con el popup abierto no hace falta.
   */
  useEffect(() => {
    if (!unseen || open || sinAnimaciones()) return;
    const espera = primeraFirma.current ? (aterrizandoRef.current ? 2200 : 900) : 250;
    primeraFirma.current = false;
    window.clearTimeout(anuncioRef.current);
    anuncioRef.current = window.setTimeout(() => {
      interrupt();
      setAnuncio(report.resumen.frase);
      anuncioRef.current = window.setTimeout(() => setAnuncio(null), ANUNCIO_MS);
    }, espera);
    return () => window.clearTimeout(anuncioRef.current);
    // Solo cuando cambia la huella del análisis: es el momento en que hay algo nuevo.
  }, [report.signature, unseen]); // eslint-disable-line react-hooks/exhaustive-deps

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

  /*
   * QUE QUEPA SIEMPRE (10-11-2026). El popup no lleva scroll: si lo de dentro
   * es más alto que el hueco que queda en la pantalla, se reduce lo justo
   * (escala, con el ancho compensado para que el texto se recoloque) hasta
   * caber. Se mide el hueco del popup (fijo: de debajo de Nova al borde de
   * abajo) menos lo que ocupan la cabecera y el pie, y el alto natural del
   * contenido. Solo si haría falta bajar del 72 % se deja desplazar, como
   * último recurso en pantallas diminutas.
   */
  useLayoutEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const panel = panelRef.current;
    const body = bodyRef.current;
    const inner = fitRef.current;
    if (!dialog || !panel || !body || !inner) return;
    const MIN = 0.72;
    let frame = 0;
    const medir = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const cs = getComputedStyle(body);
        const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
        const resto = panel.offsetHeight - body.offsetHeight;
        const hueco = dialog.clientHeight - resto - pad;
        const natural = inner.offsetHeight;
        if (hueco <= 0 || natural <= 0) return;
        setFit(prev => {
          const s = Math.min(1, hueco / natural);
          const next = s >= MIN ? { s, h: s < 1 ? natural * s : null, scroll: false } : { s: MIN, h: hueco, scroll: true };
          return Math.abs(next.s - prev.s) < 0.005 && next.scroll === prev.scroll && Math.abs((next.h ?? 0) - (prev.h ?? 0)) < 1 ? prev : next;
        });
      });
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(inner);
    ro.observe(dialog);
    window.addEventListener("resize", medir);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("resize", medir);
    };
  }, [open, at]);

  /** Abrir: Nova vuela rápido a lo alto del centro de la pantalla, agrandándose, y se abre el popup. */
  function openDialog() {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const vw = window.innerWidth;
    const movil = vw < 640;
    // En el móvil Nova se queda algo más pequeña arriba: el bocadillo necesita la pantalla.
    const vh = window.innerHeight;
    const scale = movil ? (vh < 640 ? 0.6 : 0.78) : vh < 700 ? 0.85 : vh < 860 ? 1.1 : 1.45;
    markSeen(report.signature);
    window.clearTimeout(anuncioRef.current);
    setAnuncio(null);
    setStep([0, 1]);
    setVisited(false);
    setFit({ s: 1, h: null, scroll: false });
    interrupt();
    setHover(false);
    setArrived(false);
    setHome(null);
    fx.set(r.left);
    fy.set(r.top);
    fscale.set(REPOSO);
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
      <motion.div key={m.id} variants={itemVariants} className={`tjbot-msg is-${m.tone}${m.priority >= IMPORTANT ? " is-important" : ""}${m.persistente ? " is-persistente" : ""}`}>
        <span className="tjbot-emoji" aria-hidden="true">{m.emoji}</span>
        <span className="tjbot-msg-body">
          {(m.priority >= IMPORTANT || m.persistente) && (
            <span className="tjbot-flags">
              {m.priority >= IMPORTANT && <span className="tjbot-flag">Importante</span>}
              {m.persistente && <span className="tjbot-flag is-memoria" title="Nova ya lo vio hace una semana">Sigue igual</span>}
            </span>
          )}
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
    : activity === "ball" || activity === "coffee" || activity === "coins" ? "happy"
    : activity === "zen" ? "sleepy"
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
            aria-label={`${BOT_NAME}, tu asistente de trading.${unseen ? ` Tiene ${report.resumen.total === 1 ? "un mensaje nuevo" : `${report.resumen.total} mensajes nuevos`}.` : ""} ${open ? "Cerrar" : "Abrir"} sus mensajes`}
            title={`${BOT_NAME} · pulsa para hablar con ella`}
          >
            <motion.span className="tjbot-avatar-wrap" style={{ rotate: tilt }}>
              <NovaHead
                theta={theta}
                face={face}
                activity={activity}
                flying={flying}
                joy={hover}
                talking={open || (anuncio != null && unseen)}
                track={activity === "none" && !flying}
              />
              {unseen && !open && (
                <span className="tjbot-ping" aria-hidden="true">
                  <b>{report.resumen.total > 9 ? "9+" : report.resumen.total}</b>
                </span>
              )}
              <span className="tjbot-shadow" aria-hidden="true" />
            </motion.span>
          </motion.button>

          {/* El bocadillo corto con el que anuncia lo nuevo, sobre su cabeza. */}
          <AnimatePresence>
            {/* Leído (aquí o en otra pestaña), el bocadillo se va aunque su tiempo no haya acabado. */}
            {anuncio && unseen && !hover && (
              <motion.span
                key="anuncio"
                className="tjbot-anuncio"
                aria-hidden="true"
                initial={{ opacity: 0, y: 8, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 420, damping: 24 } }}
                exit={{ opacity: 0, y: 6, scale: 0.9, transition: { duration: 0.2 } }}
              >
                <b>{anuncio}</b>
                <span>Pulsa y te lo cuento</span>
              </motion.span>
            )}
          </AnimatePresence>
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
            Nova volando EN ARCO: coge impulso, sube y baja describiendo una curva,
            se inclina hacia donde va, se agranda («se acerca») y al llegar rebota
            un poco y deja un anillo de luz. Detrás, su estela. La vuelta, el arco
            contrario, encogiéndose.
          */}
          <AnimatePresence custom={home ?? stage.from} onExitComplete={() => setStage(null)}>
            {open && (
              <motion.div
                key="nova"
                className="tjbot-flyer"
                custom={home ?? stage.from}
                style={{ x: fx, y: fy, scale: fscale }}
                initial={{ x: stage.from.x, y: stage.from.y, scale: REPOSO, rotate: 0 }}
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
          <AnimatePresence>
            {!arrived && <NovaEstela key="estela" x={fx} y={fy} scale={fscale} />}
          </AnimatePresence>

          {/* El popup, bajo Nova, con el piquito hacia ella. */}
          <div ref={dialogRef} className={`tjbot-dialog${stage.movil ? " is-movil" : ""}`} style={{ "--dlg-top": `${Math.round(stage.to.y + HEAD * stage.scale * 0.92)}px` } as React.CSSProperties}>
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
                  {/* La barra de progreso por capítulos, en el borde de arriba. */}
                  <span className="tjbot-progress" aria-hidden="true">
                    <motion.i animate={{ width: `${((at + 1) / sections.length) * 100}%` }} transition={{ type: "spring", stiffness: 260, damping: 30 }} />
                  </span>

                  {/* Cabecera: lo que Nova te dice al llegar. */}
                  <header className="tjbot-modal-head">
                    <div className="tjbot-greet">
                      <span className="tjbot-greet-kicker"><i className="tjbot-greet-dot" aria-hidden="true" />{BOT_NAME} · tu asistente de trading</span>
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
                        const urgent = g.s !== "importante" && g.items.some(m => m.priority >= IMPORTANT);
                        const count = g.s === "semana" && report.objetivo
                          ? report.objetivo.cumplido ? "✓" : `${Math.round(report.objetivo.progreso)} %`
                          : String(g.items.length);
                        return (
                          <button
                            key={g.s}
                            type="button"
                            className={`tjbot-index-item${i === at ? " is-on" : ""}${i < at ? " is-done" : ""}`}
                            onClick={() => go(i)}
                            aria-current={i === at ? "step" : undefined}
                          >
                            {i === at && <motion.span layoutId="tjbot-index-on" className="tjbot-index-on" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                            <span className="tjbot-index-emoji" aria-hidden="true">{SECTION_EMOJI[g.s]}</span>
                            <span className="tjbot-index-label">{SECTION_LABEL[g.s]}</span>
                            {urgent && !leidas.includes(g.s) && <span className="tjbot-index-dot" title="Tiene algo importante sin leer" />}
                            <span className="tjbot-index-count">{count}</span>
                          </button>
                        );
                      })}
                    </nav>}

                    {/* La sección abierta. En el móvil, arrastrar a un lado pasa de sección. */}
                    <div className="tjbot-main">
                      <div ref={bodyRef} className={`tjbot-body${fit.scroll ? " is-scroll" : ""}`}>
                      {/* El ajuste: la caja de fuera mide lo que se ve; la de dentro se reduce si hace falta. */}
                      <div className="tjbot-fit" style={fit.h != null ? { height: fit.h } : undefined}>
                      <div
                        ref={fitRef}
                        className="tjbot-fit-inner"
                        style={fit.s < 1 ? { transform: `scale(${fit.s})`, width: `${100 / fit.s}%` } : undefined}
                      >
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
                              <small>{at + 1} de {sections.length}</small>
                            </header>}
                            <motion.div
                              className={`tjbot-list${current.s !== "semana" && current.items.length >= 2 ? " is-grid" : ""}`}
                              variants={listVariants} custom={!visited} initial="hidden" animate="show"
                            >
                              {current.s === "semana" && report.objetivo
                                ? <ObjetivoView objetivo={report.objetivo} />
                                : current.items.map(renderMsg)}
                            </motion.div>
                          </motion.section>
                        </AnimatePresence>
                      </div>
                      </div>
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
