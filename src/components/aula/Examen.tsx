"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, X, ClipboardCheck, AlertTriangle, BookOpen, Award, RotateCcw } from "lucide-react";

/**
 * El examen, del lado del alumno. **Aquí no hay ninguna respuesta correcta**:
 * las preguntas llegan sin ella y la nota la pone el servidor al entregar.
 *
 * Una pregunta por pantalla, con los puntos de arriba para saltar a cualquiera.
 * Todas son obligatorias: «Entregar» no se activa hasta tenerlas contestadas.
 * Las respuestas se guardan en el navegador mientras tanto, así que recargar
 * o cerrar la pestaña no las pierde (el intento sigue abierto en el servidor
 * con las mismas preguntas).
 */

interface PreguntaVisible {
  id: string;
  enunciado: string;
  opciones: string[];
}

interface Correccion {
  nota: number;
  aciertos: number;
  fallos: number;
  aprobado: boolean;
  notaMinima: number;
  detalle: {
    id: string;
    acertada: boolean;
    elegida: number;
    correcta?: number;
    explicacion?: string | null;
    repasar?: { slug: string; titulo: string } | null;
  }[];
  certificado?: { codigo: string; notaFinal: number };
}

export interface PropsExamen {
  curso: string;
  examen: number | "final";
  titulo: string;
  numPreguntas: number;
  notaMinima: number;
  intentosPrevios: number;
  abierto: { intentoId: string; preguntas: PreguntaVisible[] } | null;
  /** A dónde se sigue tras aprobar: el módulo siguiente, el final o el certificado. */
  siguiente: { href: string; etiqueta: string };
}

const nota = (n: number) => n.toFixed(2).replace(/\.?0+$/, "").replace(".", ",");

export default function Examen(props: PropsExamen) {
  const [intento, setIntento] = useState(props.abierto);
  const [respuestas, setRespuestas] = useState<Record<string, number>>({});
  const [actual, setActual] = useState(0);
  const [confirmar, setConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [correccion, setCorreccion] = useState<Correccion | null>(null);

  const clave = intento ? `aula-examen-${intento.intentoId}` : null;

  // Recupera lo contestado si se recargó a mitad.
  useEffect(() => {
    if (!clave) return;
    try {
      const guardado = localStorage.getItem(clave);
      if (guardado) setRespuestas(JSON.parse(guardado) as Record<string, number>);
    } catch {
      /* sin almacenamiento: se empieza en blanco */
    }
  }, [clave]);

  useEffect(() => {
    if (!clave || correccion) return;
    try {
      localStorage.setItem(clave, JSON.stringify(respuestas));
    } catch {
      /* sin almacenamiento: no pasa nada */
    }
  }, [clave, respuestas, correccion]);

  const preguntas = intento?.preguntas ?? [];
  const contestadas = preguntas.filter((p) => respuestas[p.id] !== undefined).length;
  const completo = preguntas.length > 0 && contestadas === preguntas.length;

  async function empezar() {
    setEnviando(true);
    setError(null);
    try {
      const r = await fetch("/api/cursos/examen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ curso: props.curso, examen: props.examen }),
      });
      const d: { error?: string; intentoId?: string; preguntas?: PreguntaVisible[] } = await r.json();
      if (!r.ok || !d.intentoId || !d.preguntas) throw new Error(d.error ?? "No se pudo abrir el examen.");
      setIntento({ intentoId: d.intentoId, preguntas: d.preguntas });
      setActual(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo abrir el examen.");
    } finally {
      setEnviando(false);
    }
  }

  async function entregar() {
    if (!intento) return;
    setEnviando(true);
    setError(null);
    try {
      const r = await fetch("/api/cursos/examen/entregar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ curso: props.curso, intentoId: intento.intentoId, respuestas }),
      });
      const d: Correccion & { error?: string } = await r.json();
      if (!r.ok) throw new Error(d.error ?? "No se pudo entregar.");
      setCorreccion(d);
      setConfirmar(false);
      try {
        if (clave) localStorage.removeItem(clave);
      } catch {
        /* nada */
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
      // Sin router.refresh(): repintaría la página en el servidor, que ya ve el
      // examen entregado, y el resultado desaparecería de la pantalla. El
      // temario se pone al día en la siguiente navegación.
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo entregar.");
      setConfirmar(false);
    } finally {
      setEnviando(false);
    }
  }

  // ── Resultado ──
  if (correccion && intento) {
    return <Resultado correccion={correccion} preguntas={intento.preguntas} props={props} />;
  }

  // ── Portada, antes de empezar ──
  if (!intento) {
    return (
      <div className="aula-examen-intro">
        <span className="aula-examen-icono"><ClipboardCheck size={28} strokeWidth={1.8} aria-hidden="true" /></span>
        <h1 className="aula-h1">{props.titulo}</h1>
        <ul className="aula-examen-reglas">
          <li><strong>{props.numPreguntas} preguntas</strong>, sacadas al azar de un banco más grande: cada intento es distinto.</li>
          <li><strong>Todas son obligatorias.</strong> No se puede entregar con ninguna en blanco.</li>
          <li><strong>Las respuestas incorrectas restan</strong>: cada fallo quita una parte de un acierto, así que contestar al azar no sale a cuenta.</li>
          <li>Nota de 0 a 10. <strong>Apruebas con un {nota(props.notaMinima)}</strong>{props.examen === "final" ? " y ganas el certificado y el logro del curso." : " y se abre el módulo siguiente."}</li>
          <li>Si suspendes, puedes repetirlo <strong>pasadas 24 horas</strong>, con otras preguntas.</li>
          <li>Puedes cerrar y volver: el examen sigue abierto y tus respuestas se guardan.</li>
        </ul>
        {props.intentosPrevios > 0 && (
          <p className="aula-examen-previos">Este será tu intento número {props.intentosPrevios + 1}.</p>
        )}
        {error && <p className="aula-error" role="alert">{error}</p>}
        <button type="button" className="aula-btn aula-btn--grande" onClick={empezar} disabled={enviando}>
          {enviando ? "Preparando el examen…" : "Empezar el examen"}
          {!enviando && <ArrowRight size={17} strokeWidth={2.4} aria-hidden="true" />}
        </button>
      </div>
    );
  }

  // ── Haciendo el examen ──
  const p = preguntas[actual];
  return (
    <div className="aula-examen">
      <header className="aula-examen-cab">
        <span className="aula-kicker">{props.titulo}</span>
        <span className="aula-examen-contador">{contestadas} de {preguntas.length} contestadas</span>
      </header>

      <nav className="aula-examen-puntos" aria-label="Preguntas">
        {preguntas.map((q, i) => (
          <button
            key={q.id}
            type="button"
            className={`${respuestas[q.id] !== undefined ? "is-contestada" : ""}${i === actual ? " is-actual" : ""}`}
            onClick={() => setActual(i)}
            aria-label={`Pregunta ${i + 1}${respuestas[q.id] !== undefined ? ", contestada" : ""}`}
            aria-current={i === actual}
          >
            {i + 1}
          </button>
        ))}
      </nav>

      <AnimatePresence mode="wait">
        <motion.div
          key={p.id}
          className="aula-examen-pregunta"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2 }}
        >
          <span className="aula-examen-num">Pregunta {actual + 1}</span>
          <h2 className="aula-examen-enunciado">{p.enunciado}</h2>
          <div className="aula-opciones" role="radiogroup" aria-label={p.enunciado}>
            {p.opciones.map((o, i) => (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={respuestas[p.id] === i}
                className={`aula-opcion${respuestas[p.id] === i ? " is-elegida" : ""}`}
                onClick={() => setRespuestas((r) => ({ ...r, [p.id]: i }))}
              >
                <span className="aula-opcion-letra">{String.fromCharCode(65 + i)}</span>
                <span className="aula-opcion-texto">{o}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="aula-examen-nav">
        <button type="button" className="aula-btn aula-btn--ghost" onClick={() => setActual((a) => a - 1)} disabled={actual === 0}>
          <ArrowLeft size={15} aria-hidden="true" /> Anterior
        </button>
        {actual < preguntas.length - 1 ? (
          <button type="button" className="aula-btn" onClick={() => setActual((a) => a + 1)}>
            Siguiente <ArrowRight size={15} aria-hidden="true" />
          </button>
        ) : (
          <button type="button" className="aula-btn" onClick={() => setConfirmar(true)} disabled={!completo}>
            Entregar <Check size={15} aria-hidden="true" />
          </button>
        )}
      </div>

      {!completo && actual === preguntas.length - 1 && (
        <p className="aula-examen-aviso">
          Te faltan {preguntas.length - contestadas} por contestar. Toca los números de arriba para ir a ellas.
        </p>
      )}
      {error && <p className="aula-error" role="alert">{error}</p>}

      <AnimatePresence>
        {confirmar && (
          <motion.div className="aula-modal-velo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="aula-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="aula-modal-titulo"
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
            >
              <AlertTriangle size={22} aria-hidden="true" />
              <h2 id="aula-modal-titulo">¿Entregar el examen?</h2>
              <p>Una vez entregado no se puede cambiar ninguna respuesta. Si suspendes, podrás repetirlo dentro de 24 horas.</p>
              <div className="aula-modal-acciones">
                <button type="button" className="aula-btn aula-btn--ghost" onClick={() => setConfirmar(false)} disabled={enviando}>
                  Revisar antes
                </button>
                <button type="button" className="aula-btn" onClick={entregar} disabled={enviando}>
                  {enviando ? "Corrigiendo…" : "Sí, entregar"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Anillo({ valor, aprobado }: { valor: number; aprobado: boolean }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  return (
    <div className={`aula-nota-anillo${aprobado ? " is-aprobado" : " is-suspenso"}`}>
      <svg viewBox="0 0 160 160" aria-hidden="true">
        <circle cx="80" cy="80" r={r} className="pista" />
        <motion.circle
          cx="80"
          cy="80"
          r={r}
          className="relleno"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - valor / 10) }}
          transition={{ duration: 1.3, ease: "easeOut" }}
        />
      </svg>
      <div className="aula-nota-centro">
        <strong>{nota(valor)}</strong>
        <span>sobre 10</span>
      </div>
    </div>
  );
}

function Resultado({ correccion: c, preguntas, props }: { correccion: Correccion; preguntas: PreguntaVisible[]; props: PropsExamen }) {
  const porId = useMemo(() => new Map(preguntas.map((p) => [p.id, p])), [preguntas]);
  const repasar = useMemo(() => {
    const vistas = new Map<string, string>();
    for (const d of c.detalle) if (d.repasar) vistas.set(d.repasar.slug, d.repasar.titulo);
    return [...vistas];
  }, [c.detalle]);

  return (
    <div className="aula-resultado">
      <motion.div className="aula-resultado-cab" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Anillo valor={c.nota} aprobado={c.aprobado} />
        <div>
          <span className={`aula-resultado-sello${c.aprobado ? " is-aprobado" : " is-suspenso"}`}>
            {c.aprobado ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : <X size={14} strokeWidth={3} aria-hidden="true" />}
            {c.aprobado ? "Aprobado" : "Suspendido"}
          </span>
          <h1 className="aula-h1">
            {c.aprobado
              ? props.examen === "final" ? "Has terminado el curso" : "Módulo superado"
              : `Te faltó llegar al ${nota(c.notaMinima)}`}
          </h1>
          <p className="aula-resultado-cifras">
            {c.aciertos} {c.aciertos === 1 ? "acierto" : "aciertos"} · {c.fallos} {c.fallos === 1 ? "fallo" : "fallos"}
            {c.fallos > 0 && " (cada fallo resta)"}
          </p>
          {c.certificado && (
            <p className="aula-resultado-cert">
              <Award size={16} aria-hidden="true" /> Nota final del curso: <strong>{nota(c.certificado.notaFinal)}</strong>. Tu certificado y tu logro ya están listos.
            </p>
          )}
          <div className="aula-resultado-acciones">
            {c.aprobado ? (
              <Link href={props.siguiente.href} className="aula-btn aula-btn--grande">
                {props.siguiente.etiqueta} <ArrowRight size={17} aria-hidden="true" />
              </Link>
            ) : (
              <Link href={`/aula/${props.curso}`} className="aula-btn aula-btn--grande">
                <RotateCcw size={16} aria-hidden="true" /> Volver al curso y repasar
              </Link>
            )}
          </div>
          {!c.aprobado && (
            <p className="aula-resultado-espera">Podrás repetirlo dentro de 24 horas, con otras preguntas del banco.</p>
          )}
        </div>
      </motion.div>

      {!c.aprobado && repasar.length > 0 && (
        <section className="aula-repaso">
          <h2><BookOpen size={17} aria-hidden="true" /> Lo que conviene repasar</h2>
          <ul>
            {repasar.map(([slug, titulo]) => (
              <li key={slug}><Link href={`/aula/${props.curso}/${slug}`}>{titulo}</Link></li>
            ))}
          </ul>
        </section>
      )}

      <section className="aula-revision">
        <h2>{c.aprobado ? "La corrección, pregunta a pregunta" : "Qué acertaste y qué no"}</h2>
        {!c.aprobado && (
          <p className="aula-revision-nota">Con un suspenso no se enseña la respuesta buena: verías el examen, no la materia. Al aprobar sí sale entera, con su explicación.</p>
        )}
        <ol>
          {c.detalle.map((d, i) => {
            const p = porId.get(d.id);
            if (!p) return null;
            return (
              <li key={d.id} className={d.acertada ? "is-buena" : "is-mala"}>
                <span className="aula-revision-icono">{d.acertada ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}</span>
                <div>
                  <p className="aula-revision-enunciado">{i + 1}. {p.enunciado}</p>
                  <p className="aula-revision-resp">Contestaste: <strong>{p.opciones[d.elegida]}</strong></p>
                  {d.correcta !== undefined && !d.acertada && (
                    <p className="aula-revision-resp">La correcta: <strong>{p.opciones[d.correcta]}</strong></p>
                  )}
                  {d.explicacion && <p className="aula-revision-expl">{d.explicacion}</p>}
                  {d.repasar && !c.aprobado && (
                    <Link href={`/aula/${props.curso}/${d.repasar.slug}`} className="aula-revision-link">
                      Repasar: {d.repasar.titulo}
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
