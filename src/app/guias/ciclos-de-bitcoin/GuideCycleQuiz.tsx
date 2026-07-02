"use client";
import { useState } from "react";
import { Trophy, BookOpen, Check, X } from "lucide-react";

const QUESTIONS = [
  {
    q: "¿Qué es el halving de Bitcoin?",
    opts: [
      "Una actualización de seguridad de la red",
      "El evento que reduce a la mitad la recompensa por bloque cada ~4 años, frenando la nueva oferta",
      "El momento en que Bitcoin se divide en dos monedas distintas",
      "Un impuesto que se aplica a las transacciones",
    ],
    ok: 1,
    exp: "Cada ~210.000 bloques (~4 años), la recompensa que reciben los mineros se reduce a la mitad. Menos oferta nueva entrando al mercado ha coincidido, históricamente, con subidas de precio en los meses siguientes.",
  },
  {
    q: "Según el patrón histórico que sigue esta guía, ¿en qué fase del ciclo estamos aproximadamente a mediados de 2026?",
    opts: [
      "En pleno pico del mercado alcista",
      "En la fase bajista, cerca de su final",
      "Justo el día del halving",
      "En la fase de distribución final antes del próximo halving",
    ],
    ok: 1,
    exp: "El ciclo actual tuvo su pico tras el halving de abril de 2024. A mediados de 2026 estimamos que la corrección posterior (fase bajista) está llegando a su fin, alrededor de octubre de 2026.",
  },
  {
    q: "¿Por qué esta guía recomienda posicionarse en altcoins ANTES del próximo halving y no después?",
    opts: [
      "Porque las altcoins no suben nunca después del halving",
      "Porque, históricamente, las altcoins tienden a moverse con fuerza en los meses previos al halving, antes de que el impulso sea evidente para todos",
      "Porque después del halving las altcoins desaparecen del mercado",
      "Porque el halving elimina las altcoins de los exchanges",
    ],
    ok: 1,
    exp: "El patrón histórico muestra rotación de capital hacia altcoins en la fase pre-halving, antes de que la subida de Bitcoin sea noticia mainstream. Llegar tarde suele significar comprar más caro.",
  },
  {
    q: "¿Qué rango de precio se plantea en esta guía como posible suelo de este ciclo para Bitcoin?",
    opts: [
      "$5.000 - $10.000",
      "$40.000 - $50.000",
      "$100.000 - $110.000",
      "$300.000 - $400.000",
    ],
    ok: 1,
    exp: "El rango de $40.000-$50.000 se plantea como zona de suelo estimada para este ciclo, no como un precio garantizado — el mercado puede no llegar a tocarlo o superarlo a la baja.",
  },
  {
    q: "¿Cuál es la actitud correcta ante estas estimaciones de precio y fechas de ciclo?",
    opts: [
      "Tratarlas como una certeza absoluta y apostarlo todo de una vez a una fecha exacta",
      "Ignorarlas por completo, no aportan ningún valor",
      "Usarlas como un marco de referencia probabilístico, combinado con gestión de riesgo y entradas escalonadas (DCA)",
      "Esperar a que se cumplan al 100% antes de comprar nada",
    ],
    ok: 2,
    exp: "Ningún modelo de ciclos acierta con precisión de calendario. Son útiles como marco de referencia para gestionar el riesgo con cabeza — no como una promesa de resultado.",
  },
];

const TOTAL = QUESTIONS.length;

async function saveBadge() {
  try {
    await fetch("/api/guide-badge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ badge_id: "guide-ciclos-bitcoin" }),
    });
  } catch {}
}

async function saveCompletion(score: number, total: number) {
  try {
    await fetch("/api/guide-quiz-completion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guide_slug: "ciclos-de-bitcoin", score, total }),
    });
  } catch {}
}

export default function GuideCycleQuiz() {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);

  const q = QUESTIONS[current];
  const score = answers.filter(Boolean).length;

  const confirm = () => {
    if (selected === null) return;
    setConfirmed(true);
    setAnswers((prev) => [...prev, selected === q.ok]);
  };

  const next = () => {
    if (current + 1 >= TOTAL) {
      setDone(true);
      const finalScore = answers.filter(Boolean).length + (selected === q.ok ? 1 : 0);
      saveCompletion(finalScore, TOTAL);
      if (finalScore === TOTAL) saveBadge();
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
    const R = 44;
    const C = 2 * Math.PI * R;
    const ringColor = perfect ? "#e6b455" : score >= 3 ? "#ff8552" : "#8fa3b8";
    return (
      <div className="gbc-badge">
        <div className="gbc-score-wrap">
          <svg viewBox="0 0 120 120" className="gbc-score-ring" aria-label={`Puntuación: ${score} de ${TOTAL}`}>
            <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="9" />
            <circle
              cx="60" cy="60" r={R} fill="none"
              stroke={ringColor} strokeWidth="9" strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - score / TOTAL)}
              transform="rotate(-90 60 60)"
              className="gbc-score-arc"
            />
          </svg>
          <div className="gbc-score-center" style={{ color: ringColor }}>
            {perfect ? <Trophy size={26} strokeWidth={1.8} aria-hidden="true" /> : <BookOpen size={24} strokeWidth={1.8} aria-hidden="true" />}
            <span className="gbc-score-num">{score}/{TOTAL}</span>
          </div>
        </div>
        <div className="gbc-badge-t">
          {perfect ? "¡Badge desbloqueado!" : `${score}/${TOTAL} correctas`}
        </div>
        <div className="gbc-badge-d">
          {perfect
            ? `Has conseguido el badge "Cazador de Ciclos" con ${TOTAL}/${TOTAL} respuestas correctas. Aparece ya en tu panel de Logros.`
            : `Obtuviste ${score}/${TOTAL}. Necesitas las ${TOTAL} respuestas correctas para desbloquear el badge. ¡Inténtalo de nuevo!`}
        </div>
        {perfect && <span className="gbc-badge-lbl">Cazador de Ciclos</span>}
        <button className="gbc-quiz-btn" style={{ marginTop: 20 }} onClick={reset}>
          {perfect ? "Repetir quiz" : "Intentarlo de nuevo"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="gbc-quiz-reward-cta">
        <div className="gbc-quiz-reward-body">
          <span className="gbc-quiz-reward-eyebrow">Badge exclusivo en juego</span>
          <span className="gbc-quiz-reward-name">Cazador de Ciclos</span>
          <span className="gbc-quiz-reward-req">Responde <strong>{TOTAL} de {TOTAL}</strong> preguntas correctamente para desbloquearlo</span>
        </div>
        <div className="gbc-quiz-reward-arrow" aria-hidden="true">›</div>
      </div>

      <div className="gbc-quiz-bar" aria-hidden="true">
        <div
          className="gbc-quiz-bar-fill"
          style={{ width: `${((current + (confirmed ? 1 : 0)) / TOTAL) * 100}%` }}
        />
      </div>

      <div className="gbc-quiz-nav">
        {QUESTIONS.map((_, i) => (
          <div
            key={i}
            className={`gbc-q-dot${i === current ? " active" : i < current ? (answers[i] ? " done" : " done-ko") : ""}`}
          />
        ))}
      </div>

      <div key={current} className="gbc-quiz-step">
        <div className="gbc-quiz-q">
          <span style={{ color: "var(--gold)", fontSize: 13, fontWeight: 700, marginRight: 8 }}>
            {current + 1}/{TOTAL}
          </span>
          {q.q}
        </div>

        <div className="gbc-quiz-opts">
          {q.opts.map((o, i) => {
            let cls = "gbc-quiz-opt gbc-quiz-opt--lettered";
            if (confirmed) {
              if (i === q.ok) cls += " ok";
              else if (i === selected) cls += " ko";
            } else if (i === selected) {
              cls += " sel";
            }
            return (
              <button key={i} className={cls} onClick={() => !confirmed && setSelected(i)} disabled={confirmed}>
                <span className="gbc-opt-letter" aria-hidden="true">
                  {confirmed && i === q.ok ? <Check size={13} strokeWidth={3} />
                    : confirmed && i === selected ? <X size={13} strokeWidth={3} />
                    : String.fromCharCode(65 + i)}
                </span>
                <span className="gbc-opt-text">{o}</span>
              </button>
            );
          })}
        </div>

        {confirmed && (
          <div className={`gbc-box ${selected === q.ok ? "gbc-box--green" : "gbc-box--red"}`} style={{ marginBottom: 16 }}>
            <div className="gbc-box-title">{selected === q.ok ? "Correcto" : "Incorrecto"}</div>
            <div className="gbc-box-body">{q.exp}</div>
          </div>
        )}
      </div>

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
