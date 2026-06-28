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

export default function GuideQuiz() {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);

  const q = QUESTIONS[current];
  const score = answers.filter(Boolean).length;

  const confirm = () => {
    if (selected === null) return;
    const correct = selected === q.ok;
    setConfirmed(true);
    setAnswers((prev) => [...prev, correct]);
  };

  const next = () => {
    if (current + 1 >= QUESTIONS.length) {
      setDone(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setConfirmed(false);
    }
  };

  if (done) {
    const pass = score >= 4;
    return (
      <div className="gbc-badge">
        <div className="gbc-badge-icon">🔗</div>
        <div className="gbc-badge-t">{pass ? "¡Badge desbloqueado!" : `${score}/5 correctas`}</div>
        <div className="gbc-badge-d">
          {pass
            ? `Has conseguido el badge "Arquitecto de Cadenas" con ${score}/5 respuestas correctas. Ya entiendes los fundamentos de la blockchain.`
            : `Casi. Obtuviste ${score}/5. Repasa las secciones y vuelve a intentarlo — necesitas 4/5 para desbloquear el badge.`}
        </div>
        {pass && <span className="gbc-badge-lbl">Arquitecto de Cadenas</span>}
        {!pass && (
          <button
            className="gbc-quiz-btn"
            style={{ marginTop: 16 }}
            onClick={() => { setCurrent(0); setSelected(null); setConfirmed(false); setAnswers([]); setDone(false); }}
          >
            Repetir quiz
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="gbc-quiz-nav">
        {QUESTIONS.map((_, i) => (
          <div
            key={i}
            className={`gbc-q-dot${i === current ? " active" : i < current ? " done" : ""}`}
          />
        ))}
      </div>
      <div className="gbc-quiz-q">
        <span style={{ color: "var(--gold)", fontSize: 13, fontWeight: 700, marginRight: 8 }}>
          {current + 1}/{QUESTIONS.length}
        </span>
        {q.q}
      </div>
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
            >
              {o}
            </button>
          );
        })}
      </div>
      {confirmed && (
        <div className="gbc-box gbc-box--gold" style={{ marginBottom: 16 }}>
          <div className="gbc-box-title">{selected === q.ok ? "Correcto" : "Incorrecto"}</div>
          <div className="gbc-box-body">{q.exp}</div>
        </div>
      )}
      {!confirmed ? (
        <button className="gbc-quiz-btn" onClick={confirm} disabled={selected === null}>
          Confirmar respuesta
        </button>
      ) : (
        <button className="gbc-quiz-btn" onClick={next}>
          {current + 1 >= QUESTIONS.length ? "Ver resultado" : "Siguiente pregunta"}
        </button>
      )}
    </div>
  );
}
