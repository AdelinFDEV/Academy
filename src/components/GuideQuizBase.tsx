"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import confetti from "canvas-confetti";
import { BookOpen, Check, RotateCcw, Trophy, X } from "lucide-react";
import { saveGuideBadge } from "@/lib/guideBadge";
import { sonar } from "@/lib/sonidos";
import Tecla from "@/components/cuaderno/Tecla";

/**
 * El motor del quiz de una guía, común a todas (13-11-2026).
 *
 * Cada guía solo escribe sus preguntas en su propio `Guide…Quiz.tsx` y se las
 * pasa a este componente, que hace lo demás: el recorrido pregunta a pregunta,
 * guardar la nota y, con todas acertadas, dar el logro de la guía.
 *
 * Estilo «Cuaderno de estudio» (17-11-2026, disenos/sistema.html → «Quiz»):
 *  · cada respuesta es una tecla con su letra, y se pulsa también con el
 *    teclado físico (A, B, C, D; Intro para comprobar y seguir);
 *  · al comprobar, la correcta pasa a menta y la fallada a coral;
 *  · con el quiz entero acertado, confeti (solo entonces: es el momento ganado).
 * Sonidos (ESTILO.md, «Los sonidos»): las teclas hacen su clic; al comprobar,
 * `acierto` o `fallo`; con el quiz perfecto, `logro` junto al confeti.
 * El CSS vive en src/app/guias/guias.css (bloque «Quiz»).
 */
export interface PreguntaQuiz {
  q: string;
  opts: string[];
  /** Posición de la opción correcta, empezando en 0. */
  ok: number;
  /** Por qué es esa: se enseña al confirmar, se acierte o no. */
  exp: string;
}

/** Los textos del quiz. Una guía antigua puede conservar los suyos. */
export interface TextosQuiz {
  acierto: string;
  fallo: string;
  perfecto: (badge: string, total: number) => string;
  incompleto: (score: number, total: number) => string;
}

const TEXTOS: TextosQuiz = {
  acierto: "¡Correcto!",
  fallo: "No exactamente",
  perfecto: (badge, total) =>
    `Has conseguido el logro «${badge}» con ${total}/${total} respuestas correctas. Ya está en tu panel de Logros.`,
  incompleto: (score, total) =>
    `Obtuviste ${score}/${total}. Necesitas las ${total} correctas para desbloquear el badge. Puedes repasar la guía e intentarlo de nuevo.`,
};

const LETRAS = ["A", "B", "C", "D", "E", "F"];

/** Los colores del cuaderno: el confeti es de la casa, no dorado. */
const COLORES_CONFETI = ["#2fbff5", "#ff8a1f", "#2fc488", "#ffd23f", "#8f7cff", "#ff6b81"];

function celebrar() {
  const base = { colors: COLORES_CONFETI, zIndex: 20000, disableForReducedMotion: true };
  confetti({ ...base, particleCount: 70, spread: 100, startVelocity: 52, origin: { x: 0.5, y: 0.45 }, scalar: 1.05 });
  confetti({ ...base, particleCount: 40, spread: 120, startVelocity: 45, origin: { x: 0.15, y: 0.6 } });
  confetti({ ...base, particleCount: 40, spread: 120, startVelocity: 45, origin: { x: 0.85, y: 0.6 } });
}

async function saveCompletion(slug: string, score: number, total: number) {
  try {
    await fetch("/api/guide-quiz-completion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guide_slug: slug, score, total }),
    });
  } catch {}
}

/** La nota: un anillo grueso que se llena con rebote, como la barra de progreso. */
function ScoreRing({ score, total, quieto }: { score: number; total: number; quieto: boolean }) {
  const [display, setDisplay] = useState(quieto ? score : 0);
  const pct = score / total;
  const r = 54;
  const circ = 2 * Math.PI * r;
  const perfect = score === total;
  const color = perfect ? "var(--menta)" : pct >= 0.6 ? "var(--cielo)" : "var(--coral)";

  useEffect(() => {
    if (quieto) return;
    const duration = 1200;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setDisplay(Math.round((1 - Math.pow(1 - p, 3)) * score));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score, quieto]);

  return (
    <svg className="qz-anillo" width="140" height="140" viewBox="0 0 140 140" aria-hidden="true">
      <circle cx="70" cy="70" r={r} fill="none" stroke="var(--gris)" strokeWidth="14" />
      <motion.circle
        cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
        strokeDasharray={circ}
        style={{ transform: "rotate(-90deg)", transformOrigin: "70px 70px" }}
        initial={{ strokeDashoffset: quieto ? circ - pct * circ : circ }}
        animate={{ strokeDashoffset: circ - pct * circ }}
        transition={{ duration: quieto ? 0 : 1.2, ease: [0.3, 1.3, 0.5, 1] }}
      />
      <text x="70" y="72" textAnchor="middle" className="qz-anillo-n">{display}</text>
      <text x="70" y="94" textAnchor="middle" className="qz-anillo-de">de {total}</text>
    </svg>
  );
}

export default function GuideQuizBase({ slug, badgeId, badgeName, preguntas, textos }: {
  slug: string;
  badgeId: string;
  /** El nombre del logro, tal como está en `guides.ts`. */
  badgeName: string;
  preguntas: PreguntaQuiz[];
  /** Solo para conservar los textos de una guía antigua. */
  textos?: Partial<TextosQuiz>;
}) {
  const T = { ...TEXTOS, ...textos };
  const QUESTIONS = preguntas;
  const TOTAL = QUESTIONS.length;
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);
  /** La opción que se acaba de pulsar con el teclado físico: se hunde un instante. */
  const [pulsada, setPulsada] = useState<number | null>(null);
  const raiz = useRef<HTMLDivElement>(null);
  const quieto = useReducedMotion() ?? false;

  const q = QUESTIONS[current];
  const score = answers.filter(Boolean).length;

  const confirm = () => {
    if (selected === null || confirmed) return;
    setConfirmed(true);
    setAnswers((prev) => [...prev, selected === q.ok]);
    sonar(selected === q.ok ? "acierto" : "fallo");
  };

  const next = () => {
    if (!confirmed) return;
    if (current + 1 >= TOTAL) {
      const finalScore = answers.filter(Boolean).length;
      setDone(true);
      saveCompletion(slug, finalScore, TOTAL);
      if (finalScore === TOTAL) {
        saveGuideBadge(badgeId);
        // El momento ganado: la fanfarria del logro, junto al confeti.
        window.setTimeout(() => {
          sonar("logro");
          celebrar();
        }, 350);
      }
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setConfirmed(false);
    }
  };

  const reset = () => {
    setCurrent(0);
    setSelected(null);
    setConfirmed(false);
    setAnswers([]);
    setDone(false);
  };

  // El teclado físico: A-D eligen, Intro comprueba y pasa a la siguiente.
  // Solo cuando el quiz está a la vista y nadie escribe en un campo. Se vuelve
  // a enganchar en cada render para leer siempre el estado del momento.
  useEffect(() => {
    if (done) return;
    const alPulsar = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      const el = raiz.current;
      if (!el) return;
      const caja = el.getBoundingClientRect();
      if (caja.bottom < 0 || caja.top > window.innerHeight) return;

      const i = LETRAS.indexOf(e.key.toUpperCase());
      if (i >= 0 && i < q.opts.length) {
        if (confirmed) return;
        e.preventDefault();
        setSelected(i);
        setPulsada(i);
        sonar("tecla");
        window.setTimeout(() => setPulsada((p) => (p === i ? null : p)), 140);
        return;
      }
      if (e.key === "Enter" && t?.tagName !== "BUTTON" && t?.tagName !== "A") {
        if (!confirmed && selected !== null) {
          e.preventDefault();
          sonar("tecla");
          confirm();
        } else if (confirmed) {
          e.preventDefault();
          sonar("tecla");
          next();
        }
      }
    };
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  });

  if (done) {
    const perfect = score === TOTAL;
    return (
      <motion.div
        className={`qz-resultado${perfect ? " is-perfecto" : ""}`}
        initial={quieto ? false : { opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
      >
        <ScoreRing score={score} total={TOTAL} quieto={quieto} />
        <motion.div
          initial={quieto ? false : { scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: perfect ? 8 : -4 }}
          transition={{ type: "spring", stiffness: 300, damping: 12, delay: 0.3 }}
          className="qz-resultado-ic"
          aria-hidden="true"
        >
          {perfect ? <Trophy size={34} strokeWidth={2.2} /> : <BookOpen size={34} strokeWidth={2.2} />}
        </motion.div>
        <div className="qz-resultado-t">
          {perfect ? "¡Badge desbloqueado!" : `${score}/${TOTAL} correctas`}
        </div>
        <div className="qz-resultado-d">
          {perfect ? T.perfecto(badgeName, TOTAL) : T.incompleto(score, TOTAL)}
        </div>
        {perfect && (
          <motion.span
            className="qz-pegatina"
            initial={quieto ? false : { opacity: 0, scale: 0.4, rotate: -30 }}
            animate={{ opacity: 1, scale: 1, rotate: -6 }}
            transition={{ type: "spring", stiffness: 280, damping: 11, delay: 0.6 }}
          >
            {badgeName}
          </motion.span>
        )}
        <Tecla color={perfect ? "blanca" : "naranja"} onClick={reset} className="qz-repetir">
          <RotateCcw size={16} strokeWidth={2.6} aria-hidden="true" />
          {perfect ? "Repetir quiz" : "Intentarlo de nuevo"}
        </Tecla>
      </motion.div>
    );
  }

  const acerto = selected === q.ok;

  return (
    <div className="qz" ref={raiz}>
      {/* El logro que se juega: una pegatina con candado */}
      <div className="qz-premio">
        <span className="qz-premio-ic" aria-hidden="true">
          <Trophy size={26} strokeWidth={2.2} />
          <span className="qz-premio-candado">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2.8"/><path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"/></svg>
          </span>
        </span>
        <span className="qz-premio-cuerpo">
          <span className="qz-premio-ey">Badge exclusivo en juego</span>
          <span className="qz-premio-nombre">{badgeName}</span>
          <span className="qz-premio-req">Responde <strong>{TOTAL} de {TOTAL}</strong> preguntas correctamente para desbloquearlo</span>
        </span>
      </div>

      <div className="qz-hoja">
        {/* La barra de progreso del sistema, gruesa y en cielo */}
        <div className="qz-cabeza">
          <span className="qz-cuenta">Pregunta {current + 1} de {TOTAL}</span>
          <ol className="qz-puntos" aria-hidden="true">
            {QUESTIONS.map((_, i) => (
              <li
                key={i}
                className={
                  i < answers.length ? (answers[i] ? "is-bien" : "is-mal") : i === current ? "is-actual" : ""
                }
              />
            ))}
          </ol>
        </div>
        <div className="qz-barra" aria-hidden="true">
          <motion.i
            initial={false}
            animate={{ width: `${((current + (confirmed ? 1 : 0)) / TOTAL) * 100}%` }}
            transition={quieto ? { duration: 0 } : { duration: 0.6, ease: [0.3, 1.3, 0.5, 1] }}
          />
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current}
            initial={quieto ? false : { opacity: 0, x: 36 }}
            animate={{ opacity: 1, x: 0 }}
            exit={quieto ? { opacity: 0 } : { opacity: 0, x: -36 }}
            transition={{ duration: 0.3, ease: [0.34, 1.4, 0.64, 1] }}
          >
            <p className="qz-pregunta" id={`qz-p-${slug}-${current}`}>{q.q}</p>

            {/* Cada respuesta es una tecla con su letra. Botones normales, visibles
                sin animación: la animación de entrada solo añade (guias.css). */}
            <div className="qz-opciones" role="group" aria-labelledby={`qz-p-${slug}-${current}`}>
              {q.opts.map((o, i) => {
                let estado = "";
                if (confirmed) {
                  if (i === q.ok) estado = " is-ok";
                  else if (i === selected) estado = " is-mal";
                  else estado = " is-apagada";
                } else if (i === selected) {
                  estado = " is-sel";
                }
                return (
                  <Tecla
                    key={i}
                    color="blanca"
                    ancho
                    className={`qz-opcion${estado}${pulsada === i ? " is-pulsada" : ""}`}
                    style={{ "--i": i } as React.CSSProperties}
                    aria-pressed={i === selected}
                    aria-disabled={confirmed || undefined}
                    tabIndex={confirmed ? -1 : undefined}
                    onClick={() => !confirmed && setSelected(i)}
                  >
                    <kbd className="qz-letra" aria-hidden="true">{LETRAS[i]}</kbd>
                    <span className="qz-opcion-texto">{o}</span>
                    {confirmed && i === q.ok && <Check className="qz-marca" size={20} strokeWidth={3} aria-hidden="true" />}
                    {confirmed && i === selected && i !== q.ok && <X className="qz-marca" size={20} strokeWidth={3} aria-hidden="true" />}
                  </Tecla>
                );
              })}
            </div>

            <AnimatePresence>
              {confirmed && (
                <motion.div
                  initial={quieto ? false : { opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  className={`qz-explica ${acerto ? "qz-explica--bien" : "qz-explica--mal"}`}
                  role="status"
                >
                  <span className="qz-explica-ic" aria-hidden="true">
                    {acerto ? <Check size={20} strokeWidth={3} /> : <X size={20} strokeWidth={3} />}
                  </span>
                  <span>
                    <b>{acerto ? T.acierto : T.fallo}</b>
                    {q.exp}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>

        <div className="qz-accion">
          {!confirmed ? (
            <Tecla color="menta" ancho onClick={confirm} disabled={selected === null}>
              Confirmar respuesta
            </Tecla>
          ) : (
            <Tecla color="naranja" ancho onClick={next}>
              {current + 1 >= TOTAL ? "Ver resultado" : "Siguiente pregunta"}
            </Tecla>
          )}
          <p className="qz-teclado" aria-hidden="true">
            también con el teclado: <kbd>A</kbd> <kbd>B</kbd> <kbd>C</kbd> <kbd>D</kbd> e <kbd>Intro</kbd>
          </p>
        </div>
      </div>
    </div>
  );
}
