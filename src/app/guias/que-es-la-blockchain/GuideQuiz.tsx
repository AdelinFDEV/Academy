"use client";
import { useState } from "react";

const QUESTIONS = [
  {
    q: "¿Qué característica hace que la blockchain sea resistente a la manipulación?",
    opts: [
      "Está almacenada en un servidor central muy seguro",
      "Cada bloque contiene el hash del bloque anterior, haciendo que cualquier alteración sea detectable",
      "Usa contraseñas muy largas para proteger los datos",
      "Solo los administradores pueden leer los datos",
    ],
    ok: 1,
    exp: "El encadenamiento criptográfico es clave: modificar un bloque cambia su hash, rompiendo la cadena entera.",
  },
  {
    q: "¿Cuál es la diferencia entre Proof of Work y Proof of Stake?",
    opts: [
      "PoW usa mineros con hardware; PoS usa validadores que bloquean tokens como garantía",
      "Son exactamente lo mismo, solo cambia el nombre",
      "PoS requiere más energía que PoW",
      "PoW es más reciente que PoS",
    ],
    ok: 0,
    exp: "PoW (Bitcoin) gasta energía computacional; PoS (Ethereum post-Merge) requiere depositar tokens como colateral.",
  },
  {
    q: "Un smart contract es...",
    opts: [
      "Un contrato PDF firmado digitalmente",
      "Un acuerdo legal entre dos partes revisado por abogados",
      "Código auto-ejecutable en la blockchain que opera sin intermediarios",
      "Una app móvil para gestionar contratos",
    ],
    ok: 2,
    exp: "Los smart contracts son programas inmutables en blockchain que se ejecutan automáticamente cuando se cumplen las condiciones.",
  },
  {
    q: "¿Cuánto vale aproximadamente la capitalización total del mercado crypto en junio de 2026?",
    opts: [
      "$450 millones",
      "$21 billones",
      "$2.17 billones",
      "$780 mil millones",
    ],
    ok: 2,
    exp: "En junio de 2026 la capitalización global crypto rondaba los $2.17 billones (trillion en inglés).",
  },
  {
    q: "¿Qué amenaza representa la computación cuántica para la blockchain?",
    opts: [
      "Ninguna, la blockchain es inherentemente cuántica",
      "Podría romper las claves criptográficas actuales (ECDSA), haciendo wallets vulnerables",
      "Solo afecta a Bitcoin, no a otras blockchains",
      "La computación cuántica haría las transacciones más lentas",
    ],
    ok: 1,
    exp: "Algoritmos cuánticos como Shor podrían resolver la criptografía de curva elíptica. La respuesta es migrar a criptografía post-cuántica (PQC).",
  },
];

const TOTAL = QUESTIONS.length;

// Partículas de confeti para la celebración de respuesta correcta (burst radial).
const CONFETTI_COLORS = ["#4ade80", "#22c55e", "#86efac", "#e6b455", "#f5c842", "#ffffff"];
const CONFETTI = Array.from({ length: 18 }, (_, i) => {
  const angle = (Math.PI * 2 * i) / 18 + (i % 2 ? 0.25 : 0);
  const dist = 64 + (i % 3) * 26;
  return {
    dx: `${Math.round(Math.cos(angle) * dist)}px`,
    dy: `${Math.round(Math.sin(angle) * dist) - 12}px`,
    rot: `${(i % 2 ? 1 : -1) * (200 + i * 18)}deg`,
    delay: `${(i % 5) * 25}ms`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    round: i % 2 === 0,
  };
});

async function saveBadge() {
  try {
    await fetch("/api/guide-badge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ badge_id: "guide-blockchain" }),
    });
  } catch {}
}

async function saveCompletion(score: number, total: number) {
  try {
    await fetch("/api/guide-quiz-completion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guide_slug: "que-es-la-blockchain", score, total }),
    });
  } catch {}
}

export default function GuideQuiz() {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);
  const [showBurst, setShowBurst] = useState(false);

  const q = QUESTIONS[current];
  const score = answers.filter(Boolean).length;

  const confirm = () => {
    if (selected === null) return;
    const correct = selected === q.ok;
    setConfirmed(true);
    setAnswers((prev) => [...prev, correct]);
    if (correct) {
      setShowBurst(true);
      setTimeout(() => setShowBurst(false), 1300);
    }
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
    return (
      <div className="gbc-badge">
        <div className="gbc-badge-icon">{perfect ? "🔗" : "📖"}</div>
        <div className="gbc-badge-t">
          {perfect ? "¡Badge desbloqueado!" : `${score}/${TOTAL} correctas`}
        </div>
        <div className="gbc-badge-d">
          {perfect
            ? `Has conseguido el badge "Arquitecto de Cadenas" con ${TOTAL}/${TOTAL} respuestas correctas. Aparece ya en tu panel de Logros.`
            : `Obtuviste ${score}/${TOTAL}. Necesitas las ${TOTAL} respuestas correctas para desbloquear el badge. ¡Inténtalo de nuevo!`}
        </div>
        {perfect && <span className="gbc-badge-lbl">Arquitecto de Cadenas</span>}
        <button className="gbc-quiz-btn" style={{ marginTop: 20 }} onClick={reset}>
          {perfect ? "Repetir quiz" : "Intentarlo de nuevo"}
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Badge reward CTA */}
      <div className="gbc-quiz-reward-cta">
        <div className="gbc-quiz-reward-left">
          <div className="gbc-quiz-reward-icon-wrap">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="1" y="8.5" width="6" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="8.5" y="1" width="7" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="8.5" y="17" width="7" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="17" y="8.5" width="6" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 12h1.5M15.5 12H17M12 7v1.5M12 15.5V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.7"/>
            </svg>
            <span className="gbc-quiz-reward-lock" aria-hidden="true">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
            </span>
          </div>
        </div>
        <div className="gbc-quiz-reward-body">
          <span className="gbc-quiz-reward-eyebrow">Badge exclusivo en juego</span>
          <span className="gbc-quiz-reward-name">Arquitecto de Cadenas</span>
          <span className="gbc-quiz-reward-req">Responde <strong>5 de 5</strong> preguntas correctamente para desbloquearlo</span>
        </div>
        <div className="gbc-quiz-reward-arrow" aria-hidden="true">›</div>
      </div>

      {/* Progress dots */}
      <div className="gbc-quiz-nav">
        {QUESTIONS.map((_, i) => (
          <div
            key={i}
            className={`gbc-q-dot${i === current ? " active" : i < current ? (answers[i] ? " done" : " done-ko") : ""}`}
          />
        ))}
      </div>

      {/* Question */}
      <div className="gbc-quiz-q">
        <span style={{ color: "var(--gold)", fontSize: 13, fontWeight: 700, marginRight: 8 }}>
          {current + 1}/{TOTAL}
        </span>
        {q.q}
      </div>

      {/* Options */}
      <div className="gbc-quiz-opts">
        {q.opts.map((o, i) => {
          let cls = "gbc-quiz-opt";
          if (confirmed) {
            if (i === q.ok) cls += " ok";
            else if (i === selected) cls += " ko";
          } else if (i === selected) {
            cls += " sel";
          }
          return (
            <button
              key={i}
              className={cls}
              onClick={() => !confirmed && setSelected(i)}
              disabled={confirmed}
              style={{ position: "relative" }}
            >
              {o}
              {confirmed && i === q.ok && showBurst && (
                <span className="gbc-confetti" aria-hidden="true">
                  {CONFETTI.map((c, k) => (
                    <span
                      key={k}
                      className={`gbc-confetti-piece${c.round ? " round" : ""}`}
                      style={{
                        ["--dx" as string]: c.dx,
                        ["--dy" as string]: c.dy,
                        ["--rot" as string]: c.rot,
                        ["--delay" as string]: c.delay,
                        background: c.color,
                      }}
                    />
                  ))}
                  <span className="gbc-correct-check">✓</span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {confirmed && (
        <div className={`gbc-box ${selected === q.ok ? "gbc-box--green" : "gbc-box--red"}`} style={{ marginBottom: 16 }}>
          <div className="gbc-box-title">{selected === q.ok ? "Correcto" : "Incorrecto"}</div>
          <div className="gbc-box-body">{q.exp}</div>
        </div>
      )}

      {/* Actions */}
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
