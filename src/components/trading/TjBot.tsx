"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, animate, motion, useMotionValue, useTransform, useVelocity, type AnimationPlaybackControls, type Variants } from "framer-motion";
import NovaHead, { type NovaActivity, type NovaFace } from "./NovaHead";
import { X, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import {
  BOT_NAME, IMPORTANT, SECTION_LABEL,
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

function PulseView({ pulse, highlights, renderMsg }: {
  pulse: BotPulse;
  highlights: BotMessage[];
  renderMsg: (m: BotMessage) => React.ReactNode;
}) {
  return (
    <>
      <motion.div className="tjbot-pulse" variants={itemVariants}>
        <PulseGauge pulse={pulse} />
        <div className="tjbot-pulse-text">
          <span className="tjbot-kicker">Así te veo ahora</span>
          <strong>{pulse.label}</strong>
          <ul className="tjbot-parts">
            {pulse.parts.map((p, i) => (
              <li key={p.id} title={p.hint}>
                <span className="tjbot-part-label">{p.label}</span>
                <span className={`tjbot-part-bar${p.value == null ? " is-empty" : ""}`}>
                  <motion.i
                    initial={{ width: 0 }}
                    animate={{ width: `${((p.value ?? 0) / 25) * 100}%` }}
                    transition={{ delay: 0.3 + i * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  />
                </span>
                <span className="tjbot-part-hint">{p.hint}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
      <motion.span className="tjbot-kicker tjbot-kicker-row" variants={itemVariants}>Lo más importante</motion.span>
      {highlights.length
        ? highlights.map(renderMsg)
        : (
          <motion.div variants={itemVariants} className="tjbot-msg is-win">
            <span className="tjbot-emoji" aria-hidden="true">🙌</span>
            <span className="tjbot-msg-body"><span>Nada urgente por ahora. ¡Buen trabajo! Repasa los capítulos cuando quieras.</span></span>
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
  const [stage, setStage] = useState<{ from: Pt; to: Pt; scale: number } | null>(null);
  const [home, setHome] = useState<Pt | null>(null);
  const [arrived, setArrived] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
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

  // Su vida: volar y hacer cosas. Sin animaciones (preferencia del sistema), se queda quieto.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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
    timerRef.current = window.setTimeout(fly, 1200);
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
    const scale = vw < 640 ? 1.25 : 1.6;
    markSeen(report.signature);
    setStep([0, 1]);
    setVisited(false);
    interrupt();
    setHover(false);
    setArrived(false);
    setHome(null);
    setStage({
      from: { x: r.left, y: r.top },
      to: { x: vw / 2 - (HEAD * scale) / 2, y: Math.max(12, window.innerHeight * 0.03) },
      scale,
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
          <span>{m.text}</span>
          {m.action && (
            <button type="button" className="tjbot-action" onClick={() => act(m.action!.kind)}>
              {m.action.label} <ArrowRight size={13} aria-hidden="true" />
            </button>
          )}
        </span>
      </motion.div>
    );
  }

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
        <motion.div className="tjbot-walker" style={{ x, y }}>
          <motion.button
            ref={triggerRef}
            type="button"
            className={`tjbot-trigger${open ? " is-open" : ""}${hover ? " is-hover" : ""}${stage ? " is-away" : ""}`}
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

      {stage && createPortal(
        <div className="tjbot-stage">
          <motion.div
            className="tjbot-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: open ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            onClick={close}
            aria-hidden="true"
          />

          {/* Nova volando: de su sitio al centro (agrandándose, «se acerca») y de vuelta al cerrar. */}
          <AnimatePresence custom={home ?? stage.from} onExitComplete={() => setStage(null)}>
            {open && (
              <motion.div
                key="nova"
                className="tjbot-flyer"
                custom={home ?? stage.from}
                initial={{ x: stage.from.x, y: stage.from.y, scale: 1 }}
                animate={{
                  x: stage.to.x,
                  y: stage.to.y,
                  scale: stage.scale,
                  transition: { type: "spring", stiffness: 150, damping: 19, mass: 0.85 },
                }}
                exit="back"
                variants={{
                  back: (p: Pt) => ({
                    x: p.x,
                    y: p.y,
                    scale: 1,
                    transition: { type: "spring", stiffness: 160, damping: 21, delay: 0.1 },
                  }),
                }}
                onAnimationComplete={def => { if (def !== "back") setArrived(true); }}
              >
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
          <div className="tjbot-dialog" style={{ "--dlg-top": `${Math.round(stage.to.y + HEAD * stage.scale * 0.92)}px` } as React.CSSProperties}>
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

                {/* Capítulos: un chip por sección; el activo se despliega con su nombre y la línea avanza. */}
                <header className="tjbot-panel-head">
                  <nav className="tjbot-chapters" aria-label="Secciones">
                    {sections.map((g, i) => {
                      const urgent = g.s !== "pulso" && g.items.some(m => m.priority >= IMPORTANT);
                      return (
                        <button
                          key={g.s}
                          type="button"
                          className={`tjbot-chapter${i === at ? " is-on" : ""}${i < at ? " is-done" : ""}`}
                          onClick={() => go(i)}
                          aria-current={i === at ? "step" : undefined}
                          aria-label={`${SECTION_LABEL[g.s]}${urgent ? " (tiene algo importante)" : ""}`}
                          title={SECTION_LABEL[g.s]}
                        >
                          <span aria-hidden="true">{SECTION_EMOJI[g.s]}</span>
                          {i === at && (
                            <motion.span
                              className="tjbot-chapter-label"
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: "auto" }}
                              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                            >
                              {SECTION_LABEL[g.s]}
                            </motion.span>
                          )}
                          {urgent && i !== at && <span className="tjbot-chapter-dot" aria-hidden="true" />}
                        </button>
                      );
                    })}
                  </nav>
                  <button type="button" className="tj-icon-btn" onClick={close} aria-label="Cerrar" title="Cerrar (Esc)">
                    <X size={15} />
                  </button>
                  <span className="tjbot-progress" aria-hidden="true">
                    <motion.i
                      initial={false}
                      animate={{ width: `${((at + 1) / sections.length) * 100}%` }}
                      transition={{ type: "spring", stiffness: 260, damping: 30 }}
                    />
                  </span>
                </header>

                {/* La sección abierta. En el móvil, arrastrar a un lado pasa de sección. */}
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
                      <motion.div className="tjbot-list" variants={listVariants} custom={!visited} initial="hidden" animate="show">
                        {current.s === "pulso" && report.pulse
                          ? <PulseView pulse={report.pulse} highlights={current.items} renderMsg={renderMsg} />
                          : current.items.map(renderMsg)}
                      </motion.div>
                    </motion.section>
                  </AnimatePresence>
                </div>

                {/* Pie: atrás discreto y un «siguiente» que enseña qué viene. */}
                <footer className="tjbot-foot">
                  <button type="button" className="tjbot-back" onClick={() => go(at - 1)} disabled={at === 0} aria-label="Sección anterior">
                    <ChevronLeft size={16} />
                  </button>
                  <span className="tjbot-count">{at + 1} de {sections.length}</span>
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
