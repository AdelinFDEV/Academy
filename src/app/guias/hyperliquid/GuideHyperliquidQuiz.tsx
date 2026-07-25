"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Check, X, Sparkles, RotateCcw } from "lucide-react";
import { saveGuideBadge } from "@/lib/guideBadge";

const QUESTIONS = [
  {
    q: "¿Qué es Hyperliquid, en esencia?",
    opts: [
      "Una wallet para guardar criptomonedas",
      "Un exchange de perpetuos que corre sobre su propia blockchain con un libro de órdenes 100% on-chain",
      "Una stablecoin respaldada por dólares",
      "Una red social para traders",
    ],
    ok: 1,
    exp: "Hyperliquid es un DEX de derivados (perpetuos) construido sobre su propia L1. A diferencia de otros DEX, su libro de órdenes vive entero on-chain, buscando la velocidad de un exchange centralizado sin renunciar a la autocustodia.",
  },
  {
    q: "¿Qué diferencia a Hyperliquid de la mayoría de DEX como Uniswap?",
    opts: [
      "Usa un creador de mercado automático (AMM) con pools de liquidez",
      "Usa un libro de órdenes (order book) donde se cruzan órdenes reales de compra y venta",
      "No permite operar, solo consultar precios",
      "Funciona únicamente sobre Ethereum",
    ],
    ok: 1,
    exp: "La mayoría de DEX usan un AMM (pools y una fórmula matemática). Hyperliquid replica el modelo de los exchanges profesionales: un libro de órdenes con límite central (CLOB) donde compradores y vendedores se cruzan a precios concretos.",
  },
  {
    q: "¿Qué es el vault HLP (Hyperliquidity Provider)?",
    opts: [
      "El equipo fundador de Hyperliquid",
      "Un fondo comunitario que hace de creador de mercado y liquidador, y en el que los usuarios pueden depositar para compartir sus ganancias (y pérdidas)",
      "Una comisión que se paga por cada operación",
      "El nombre de la blockchain de Hyperliquid",
    ],
    ok: 1,
    exp: "HLP es un vault en el que cualquiera puede depositar. Actúa como market maker y liquidador del protocolo, y reparte entre los depositantes las ganancias o pérdidas de esa actividad. Es una forma de participar en el 'lado de la casa'.",
  },
  {
    q: "¿Qué tuvo de especial el airdrop del token HYPE en noviembre de 2024?",
    opts: [
      "Que solo lo recibieron fondos de inversión",
      "Que repartió una gran parte del suministro entre los usuarios reales, sin haber vendido tokens a inversores de capital riesgo (VCs)",
      "Que fue gratuito para cualquier persona del mundo sin haber usado el producto",
      "Que se canceló antes de repartirse",
    ],
    ok: 1,
    exp: "HYPE destacó por repartir una porción muy grande del suministro directamente entre quienes habían usado el protocolo, sin rondas de financiación con VCs. El proyecto se autofinanció, algo poco común en cripto.",
  },
  {
    q: "¿Cuál es uno de los principales riesgos que se le señalan a Hyperliquid?",
    opts: [
      "Que no tiene ningún producto funcionando",
      "La centralización: pocos validadores y decisiones del equipo, como se vio en el incidente del token JELLY, cuestionan hasta qué punto es descentralizado",
      "Que es imposible retirar fondos",
      "Que no cobra comisiones y por eso no es sostenible",
    ],
    ok: 1,
    exp: "Pese a ser on-chain, Hyperliquid ha operado con un conjunto reducido de validadores y decisiones muy ligadas al equipo. El incidente de marzo de 2025 con el token JELLY —donde se intervino para proteger al HLP— reavivó el debate sobre su grado real de descentralización.",
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
      body: JSON.stringify({ guide_slug: "hyperliquid", score, total }),
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

export default function GuideHyperliquidQuiz() {
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
        saveGuideBadge("guide-hyperliquid");
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
          {perfect ? "📖" : "📊"}
        </motion.div>
        <div className="wq-result-title">
          {perfect ? "¡Badge desbloqueado!" : `${score}/${TOTAL} correctas`}
        </div>
        <div className="wq-result-desc">
          {perfect
            ? `Has conseguido el badge "Maestro del Libro de Órdenes" con ${TOTAL}/${TOTAL} respuestas correctas. Ya está en tu panel de Logros.`
            : `Obtuviste ${score}/${TOTAL}. Necesitas las ${TOTAL} correctas para desbloquear el badge. Puedes repasar la guía e intentarlo de nuevo.`}
        </div>
        {perfect && (
          <motion.span
            className="wq-result-pill"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Sparkles size={13} /> Maestro del Libro de Órdenes
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
          <span className="gbc-quiz-reward-name">Maestro del Libro de Órdenes</span>
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
