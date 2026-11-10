"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Check, X, Sparkles, RotateCcw } from "lucide-react";
import { saveGuideBadge } from "@/lib/guideBadge";

const QUESTIONS = [
  {
    q: "¿Qué es lo que más se olvida apuntar en un diario de trading, y más información da?",
    opts: [
      "El precio de entrada",
      "Por qué entraste y cómo te sentías al hacerlo",
      "La hora exacta al segundo",
      "El nombre del exchange",
    ],
    ok: 1,
    exp: "El resultado dice qué pasó, pero no por qué. Sin el motivo de la entrada no puedes saber si seguiste tu plan o improvisaste y tuviste suerte, y sin el ánimo no ves si operas peor eufórico, cansado o con ganas de revancha.",
  },
  {
    q: "Arriesgas 50 € en una operación (la distancia hasta tu stop) y la cierras ganando 125 €. ¿Cuánto es en múltiplos de R?",
    opts: ["+1,25 R", "+2,5 R", "+125 R", "No se puede saber sin el win rate"],
    ok: 1,
    exp: "R es lo que arriesgabas: 50 €. Ganar 125 € es ganar 2,5 veces lo arriesgado, +2,5 R. Medir en R permite comparar operaciones de tamaños distintos y saber si las ganadoras compensan a las perdedoras.",
  },
  {
    q: "Tu win rate es del 70 %, pero tu ganancia media es de 20 € y tu pérdida media de 80 €. ¿Qué te dice el diario?",
    opts: [
      "Que el método es bueno, porque aciertas casi siempre",
      "Que pierdes dinero: de cada 10 operaciones ganas 140 € y pierdes 240 €",
      "Que estás en tablas",
      "Nada, el win rate es lo único que importa",
    ],
    ok: 1,
    exp: "7 × 20 € = 140 € ganados y 3 × 80 € = 240 € perdidos: −100 € cada diez operaciones. Un win rate alto con pérdidas grandes es el patrón típico de quien cierra pronto las ganadoras y aguanta las perdedoras.",
  },
  {
    q: "¿A partir de cuántas operaciones apuntadas empiezan a significar algo las estadísticas del diario?",
    opts: ["Con 5 basta", "Unas 30, como referencia mínima", "Hacen falta 1.000", "Desde la primera"],
    ok: 1,
    exp: "Por debajo de treinta casi nada es concluyente: con diez operaciones, un 70 % de acierto puede ser pura suerte. A partir de ahí las medias y las rachas empiezan a describir tu forma de operar, y cuantas más, mejor.",
  },
  {
    q: "Llevas tres pérdidas seguidas. ¿Qué es lo más útil que puedes hacer con el diario?",
    opts: [
      "Dejar de apuntar hasta que vuelvan las ganancias",
      "Seguir apuntando y revisar si las pérdidas respetaron tu plan y tu riesgo",
      "Borrar las pérdidas para que no estropeen las estadísticas",
      "Doblar el tamaño para recuperar rápido",
    ],
    ok: 1,
    exp: "Una mala racha es cuando más información da el diario: te dice si son pérdidas normales de un método que funciona o si te has saltado el plan. Dejar de apuntar o borrar las malas falsea los números, y doblar el tamaño es revenge trading.",
  },
];

const TOTAL = QUESTIONS.length;
const GOLD = "#e6b455";
const ORANGE = "#ff6b2b";
const GREEN = "#4ade80";
const RED = "#f87171";

function fireConfetti(originX: number, originY: number, big = false) {
  const colors = [GOLD, ORANGE, GREEN, "#ffffff"];
  confetti({
    particleCount: big ? 60 : 32,
    spread: big ? 100 : 65,
    startVelocity: big ? 55 : 40,
    origin: { x: originX, y: originY },
    colors,
    zIndex: 20000,
    scalar: big ? 1.1 : 0.9,
  });
  if (big) {
    confetti({ particleCount: 40, spread: 120, startVelocity: 45, origin: { x: 0.15, y: 0.6 }, colors, zIndex: 20000 });
    confetti({ particleCount: 40, spread: 120, startVelocity: 45, origin: { x: 0.85, y: 0.6 }, colors, zIndex: 20000 });
  }
}

async function saveCompletion(score: number, total: number) {
  try {
    await fetch("/api/guide-quiz-completion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guide_slug: "como-hacer-un-diario-de-trading", score, total }),
    });
  } catch {}
}

function ScoreRing({ score, total }: { score: number; total: number }) {
  const [display, setDisplay] = useState(0);
  const pct = score / total;
  const r = 54;
  const circ = 2 * Math.PI * r;
  const perfect = score === total;
  const color = perfect ? GOLD : pct >= 0.6 ? GREEN : RED;

  useEffect(() => {
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
  }, [score]);

  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(240,244,255,0.08)" strokeWidth="10" />
      <motion.circle
        cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={circ}
        style={{ transform: "rotate(-90deg)", transformOrigin: "70px 70px" }}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - pct * circ }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      />
      <text x="70" y="65" textAnchor="middle" fontSize="30" fontWeight="800" fill="#fff">{display}</text>
      <text x="70" y="86" textAnchor="middle" fontSize="12" fill="#8fa3b8">de {total}</text>
    </svg>
  );
}

export default function GuideDiarioQuiz() {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);
  const [shake, setShake] = useState(false);
  const optsRef = useRef<HTMLDivElement>(null);

  const q = QUESTIONS[current];
  const score = answers.filter(Boolean).length;

  const confirm = () => {
    if (selected === null) return;
    const correct = selected === q.ok;
    setConfirmed(true);
    setAnswers((prev) => [...prev, correct]);

    const btn = optsRef.current?.querySelectorAll("button")[selected];
    const rect = btn?.getBoundingClientRect();
    const ox = rect ? (rect.left + rect.width / 2) / window.innerWidth : 0.5;
    const oy = rect ? rect.top / window.innerHeight : 0.5;

    if (correct) {
      fireConfetti(ox, oy);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const next = () => {
    if (current + 1 >= TOTAL) {
      const finalScore = answers.filter(Boolean).length + (selected === q.ok ? 1 : 0);
      setDone(true);
      saveCompletion(finalScore, TOTAL);
      if (finalScore === TOTAL) {
        saveGuideBadge("guide-diario-trading");
        setTimeout(() => fireConfetti(0.5, 0.4, true), 300);
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

  if (done) {
    const perfect = score === TOTAL;
    return (
      <motion.div
        className="wq-result"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ScoreRing score={score} total={TOTAL} />
        <motion.div
          initial={{ scale: 0, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.3 }}
          className="wq-result-badge-icon"
        >
          {perfect ? "📓" : "📈"}
        </motion.div>
        <div className="wq-result-title">
          {perfect ? "¡Badge desbloqueado!" : `${score}/${TOTAL} correctas`}
        </div>
        <div className="wq-result-desc">
          {perfect
            ? `Has conseguido el badge "Bitácora al Día" con ${TOTAL}/${TOTAL} respuestas correctas. Ya está en tu panel de Logros.`
            : `Obtuviste ${score}/${TOTAL}. Necesitas las ${TOTAL} correctas para desbloquear el badge. Puedes repasar la guía e intentarlo de nuevo.`}
        </div>
        {perfect && (
          <motion.span
            className="wq-result-pill"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Sparkles size={13} /> Bitácora al Día
          </motion.span>
        )}
        <button className="gbc-quiz-btn" style={{ marginTop: 20 }} onClick={reset}>
          <RotateCcw size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
          {perfect ? "Repetir quiz" : "Intentarlo de nuevo"}
        </button>
      </motion.div>
    );
  }

  return (
    <div className="wq-wrap">
      {/* Reward banner */}
      <div className="gbc-quiz-reward-cta">
        <div className="gbc-quiz-reward-left">
          <div className="gbc-quiz-reward-icon-wrap">
            <Sparkles size={26} />
            <span className="gbc-quiz-reward-lock" aria-hidden="true">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
            </span>
          </div>
        </div>
        <div className="gbc-quiz-reward-body">
          <span className="gbc-quiz-reward-eyebrow">Badge exclusivo en juego</span>
          <span className="gbc-quiz-reward-name">Bitácora al Día</span>
          <span className="gbc-quiz-reward-req">Responde <strong>{TOTAL} de {TOTAL}</strong> preguntas correctamente para desbloquearlo</span>
        </div>
        <div className="gbc-quiz-reward-arrow" aria-hidden="true">›</div>
      </div>

      {/* Animated progress bar */}
      <div className="wq-progress-track">
        <motion.div
          className="wq-progress-fill"
          initial={false}
          animate={{ width: `${(current / TOTAL) * 100}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <div className="wq-progress-label">Pregunta {current + 1} de {TOTAL}</div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="gbc-quiz-q">{q.q}</div>

          <motion.div
            ref={optsRef}
            className="gbc-quiz-opts"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.06 } } }}
          >
            {q.opts.map((o, i) => {
              let cls = "gbc-quiz-opt wq-opt";
              if (confirmed) {
                if (i === q.ok) cls += " ok";
                else if (i === selected) cls += " ko";
              } else if (i === selected) {
                cls += " sel";
              }
              return (
                <motion.button
                  key={i}
                  className={cls}
                  onClick={() => !confirmed && setSelected(i)}
                  disabled={confirmed}
                  variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
                  whileTap={!confirmed ? { scale: 0.97 } : undefined}
                  animate={
                    confirmed && i === selected && i !== q.ok && shake
                      ? { x: [0, -9, 9, -7, 7, -4, 4, 0] }
                      : confirmed && i === q.ok
                      ? { boxShadow: ["0 0 0px rgba(74,222,128,0)", "0 0 24px rgba(74,222,128,0.55)", "0 0 10px rgba(74,222,128,0.25)"] }
                      : undefined
                  }
                  transition={{ duration: 0.5 }}
                >
                  <span className="wq-opt-marker">
                    {confirmed && i === q.ok && <Check size={15} />}
                    {confirmed && i === selected && i !== q.ok && <X size={15} />}
                  </span>
                  {o}
                </motion.button>
              );
            })}
          </motion.div>

          <AnimatePresence>
            {confirmed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className={`gbc-box ${selected === q.ok ? "gbc-box--green" : "gbc-box--red"}`}
                style={{ marginBottom: 16, overflow: "hidden" }}
              >
                <div className="gbc-box-title">{selected === q.ok ? "¡Correcto!" : "No exactamente"}</div>
                <div className="gbc-box-body">{q.exp}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {!confirmed ? (
        <button className="gbc-quiz-btn" onClick={confirm} disabled={selected === null}>
          Confirmar respuesta
        </button>
      ) : (
        <button className="gbc-quiz-btn" onClick={next}>
          {current + 1 >= TOTAL ? "Ver resultado" : "Siguiente pregunta"}
        </button>
      )}
    </div>
  );
}
