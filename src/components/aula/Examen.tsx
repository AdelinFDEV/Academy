"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { formatoNota } from "@/lib/cursos-progreso";
import { ArrowLeft, ArrowRight, Check, X, ClipboardCheck, AlertTriangle, BookOpen, Award, RotateCcw } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import { sonar } from "@/lib/sonidos";
import { bloquearScroll } from "@/components/trading/useVentanaMovil";
import { Opcion, letra, useLetras } from "./bloques/comun";

/**
 * El examen, del lado del alumno. **Aquí no hay ninguna respuesta correcta**:
 * las preguntas llegan sin ella y la nota la pone el servidor al entregar.
 *
 * Una pregunta por pantalla, con los puntos de arriba para saltar a cualquiera.
 * Todas son obligatorias: «Entregar» no se activa hasta tenerlas contestadas.
 * Las respuestas se guardan en el navegador mientras tanto, así que recargar
 * o cerrar la pestaña no las pierde (el intento sigue abierto en el servidor
 * con las mismas preguntas).
 *
 * Estilo «Cuaderno de estudio» (17-11-2026): el color del examen es el lila.
 * Las respuestas son teclas con su letra y se pulsan también con el teclado
 * físico (A, B, C, D); las flechas ← y → pasan de pregunta. Al aprobar, confeti
 * (nunca con «reducir movimiento») y el sonido `logro`; al suspender, `fallo`.
 * La ventana de «¿Entregar?» suena al abrirse y al cerrarse, y se cierra
 * también con Escape.
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

// La misma función que usan el certificado y el aula: una sola forma de escribir una nota.
const nota = formatoNota;

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
      sonar("error");
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
      // El resultado llega por la entrega de la persona: es el momento de sonar.
      sonar(d.aprobado ? "logro" : "fallo");
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
      sonar("error");
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
      <div className="aula-hoja aula-examen-intro">
        <span className="aula-examen-icono"><ClipboardCheck size={30} strokeWidth={2.2} aria-hidden="true" /></span>
        <h1 className="aula-h1">{props.titulo}</h1>
        <div className="aula-examen-cifras">
          <div><strong>{props.numPreguntas}</strong><span>preguntas, todas obligatorias</span></div>
          <div><strong>{nota(props.notaMinima)}</strong><span>sobre 10 para aprobar</span></div>
          <div><strong>24 h</strong><span>de espera si suspendes</span></div>
        </div>
        <ul className="aula-examen-reglas">
          <li>Las preguntas salen <strong>al azar de un banco más grande</strong>: cada intento es distinto.</li>
          <li><strong>Las respuestas incorrectas restan</strong>: cada fallo quita una parte de un acierto, así que contestar al azar no sale a cuenta.</li>
          <li>Al aprobar{props.examen === "final" ? " ganas el certificado y el logro del curso." : " se abre el módulo siguiente."}</li>
          <li>Puedes cerrar y volver: el examen sigue abierto y tus respuestas se guardan.</li>
        </ul>
        {props.intentosPrevios > 0 && (
          <p className="aula-examen-previos">Este será tu intento número {props.intentosPrevios + 1}.</p>
        )}
        {error && <p className="aula-error" role="alert">{error}</p>}
        <Tecla color="lila" tamano="grande" onClick={empezar} disabled={enviando}>
          {enviando ? "Preparando el examen…" : "Empezar el examen"}
          {!enviando && <ArrowRight size={20} strokeWidth={2.6} aria-hidden="true" />}
        </Tecla>
      </div>
    );
  }

  // ── Haciendo el examen ──
  return (
    <Haciendo
      props={props}
      preguntas={preguntas}
      respuestas={respuestas}
      elegir={(id, i) => setRespuestas((r) => ({ ...r, [id]: i }))}
      actual={actual}
      setActual={setActual}
      contestadas={contestadas}
      completo={completo}
      confirmar={confirmar}
      setConfirmar={setConfirmar}
      enviando={enviando}
      error={error}
      entregar={entregar}
    />
  );
}

function Haciendo({
  props,
  preguntas,
  respuestas,
  elegir,
  actual,
  setActual,
  contestadas,
  completo,
  confirmar,
  setConfirmar,
  enviando,
  error,
  entregar,
}: {
  props: PropsExamen;
  preguntas: PreguntaVisible[];
  respuestas: Record<string, number>;
  elegir: (id: string, i: number) => void;
  actual: number;
  setActual: React.Dispatch<React.SetStateAction<number>>;
  contestadas: number;
  completo: boolean;
  confirmar: boolean;
  setConfirmar: (v: boolean) => void;
  enviando: boolean;
  error: string | null;
  entregar: () => void;
}) {
  const p = preguntas[actual];
  const caja = useRef<HTMLDivElement>(null);
  const ventana = useRef<HTMLDivElement>(null);

  const abrirConfirmar = () => {
    sonar("abrir");
    setConfirmar(true);
  };
  const cerrarConfirmar = () => {
    sonar("cerrar");
    setConfirmar(false);
  };

  // La ventana de entregar: el foco entra en ella («Revisar antes»), Escape la
  // cierra y, mientras está abierta, la página de detrás no hace scroll.
  useEffect(() => {
    if (!confirmar) return;
    ventana.current?.querySelector<HTMLElement>("button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || enviando) return;
      sonar("cerrar");
      setConfirmar(false);
    };
    window.addEventListener("keydown", onKey);
    const soltar = bloquearScroll();
    return () => {
      window.removeEventListener("keydown", onKey);
      soltar();
    };
  }, [confirmar, enviando, setConfirmar]);
  const pulsada = useLetras(caja, p.opciones.map((_, i) => letra(i)), (i) => elegir(p.id, i), !confirmar);
  const total = preguntas.length;

  // Las flechas del teclado pasan de pregunta (no con una ventana abierta encima).
  useEffect(() => {
    if (confirmar) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (document.querySelector('[aria-modal="true"]')) return;
      if (e.key === "ArrowRight") setActual((a) => Math.min(total - 1, a + 1));
      if (e.key === "ArrowLeft") setActual((a) => Math.max(0, a - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmar, total, setActual]);

  return (
    <div className="aula-examen">
      <header className="aula-examen-cab">
        {/* El único título de la pantalla mientras se hace el examen. */}
        <h1 className="aula-kicker">{props.titulo}</h1>
        <span className="aula-examen-contador">{contestadas} de {total} contestadas</span>
      </header>

      <div className="aula-examen-avance" aria-hidden="true">
        <span className="aula-barra aula-barra--gruesa"><i style={{ width: `${total ? (contestadas / total) * 100 : 0}%` }} /></span>
      </div>

      <nav className="aula-examen-puntos" aria-label="Preguntas">
        {preguntas.map((q, i) => (
          <Tecla
            key={q.id}
            color={i === actual ? "naranja" : respuestas[q.id] !== undefined ? "lila" : "blanca"}
            tamano="peq"
            icono
            className="aula-examen-punto"
            onClick={() => setActual(i)}
            aria-label={`Pregunta ${i + 1}${respuestas[q.id] !== undefined ? ", contestada" : ""}`}
            aria-current={i === actual}
          >
            {i + 1}
          </Tecla>
        ))}
      </nav>

      <AnimatePresence mode="wait">
        <motion.div
          key={p.id}
          ref={caja}
          className="aula-examen-pregunta"
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -28 }}
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
        >
          <span className="aula-examen-num">Pregunta {actual + 1}</span>
          <h2 className="aula-examen-enunciado">{p.enunciado}</h2>
          <div className="aula-opciones" role="radiogroup" aria-label={p.enunciado}>
            {p.opciones.map((o, i) => (
              <Opcion
                key={i}
                marca={letra(i)}
                role="radio"
                aria-checked={respuestas[p.id] === i}
                estado={respuestas[p.id] === i ? "elegida" : undefined}
                pulsada={pulsada === i}
                onClick={() => elegir(p.id, i)}
              >
                {o}
              </Opcion>
            ))}
          </div>
          <p className="aula-examen-pista" aria-hidden="true">
            también con el teclado: {letra(0)}–{letra(p.opciones.length - 1)} para contestar, ← → para moverte
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="aula-examen-nav">
        <Tecla color="blanca" onClick={() => setActual((a) => a - 1)} disabled={actual === 0}>
          <ArrowLeft size={17} strokeWidth={2.6} aria-hidden="true" /> Anterior
        </Tecla>
        {actual < total - 1 ? (
          <Tecla onClick={() => setActual((a) => a + 1)}>
            Siguiente <ArrowRight size={17} strokeWidth={2.6} aria-hidden="true" />
          </Tecla>
        ) : (
          <Tecla color="menta" onClick={abrirConfirmar} disabled={!completo}>
            Entregar <Check size={17} strokeWidth={3} aria-hidden="true" />
          </Tecla>
        )}
      </div>

      {!completo && actual === total - 1 && (
        <p className="aula-examen-aviso">
          Te faltan {total - contestadas} por contestar. Toca los números de arriba para ir a ellas.
        </p>
      )}
      {error && <p className="aula-error" role="alert">{error}</p>}

      <AnimatePresence>
        {confirmar && (
          <motion.div
            className="aula-modal-velo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            // Tocar fuera de la ficha la cierra, como Escape (no mientras corrige).
            onClick={() => !enviando && cerrarConfirmar()}
          >
            <motion.div
              ref={ventana}
              onClick={(e) => e.stopPropagation()}
              className="aula-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="aula-modal-titulo"
              initial={{ scale: 0.9, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 24 }}
            >
              <span className="aula-modal-ic"><AlertTriangle size={22} strokeWidth={2.4} aria-hidden="true" /></span>
              <h2 id="aula-modal-titulo">¿Entregar el examen?</h2>
              <p>Una vez entregado no se puede cambiar ninguna respuesta. Si suspendes, podrás repetirlo dentro de 24 horas.</p>
              <div className="aula-modal-acciones">
                <Tecla color="blanca" onClick={cerrarConfirmar} disabled={enviando}>
                  Revisar antes
                </Tecla>
                <Tecla color="menta" onClick={entregar} disabled={enviando}>
                  {enviando ? "Corrigiendo…" : "Sí, entregar"}
                </Tecla>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** La celebración de aprobar: confeti con los colores del cuaderno. */
function celebrar(grande: boolean) {
  const colors = ["#8f7cff", "#ff8a1f", "#2fc488", "#ffd23f", "#2fbff5", "#ff6b81"];
  const base = { colors, zIndex: 20000, disableForReducedMotion: true };
  void confetti({ ...base, particleCount: grande ? 90 : 60, spread: grande ? 110 : 80, startVelocity: 48, origin: { x: 0.5, y: 0.35 } });
  if (grande) {
    window.setTimeout(() => {
      void confetti({ ...base, particleCount: 50, spread: 120, startVelocity: 45, angle: 60, origin: { x: 0.1, y: 0.6 } });
      void confetti({ ...base, particleCount: 50, spread: 120, startVelocity: 45, angle: 120, origin: { x: 0.9, y: 0.6 } });
    }, 250);
  }
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
          transition={{ duration: 1.3, ease: [0.3, 1.3, 0.5, 1] }}
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

  // Aprobar se celebra una vez, al llegar el resultado: es un momento ganado.
  useEffect(() => {
    if (c.aprobado) celebrar(props.examen === "final");
  }, [c.aprobado, props.examen]);

  return (
    <div className="aula-resultado">
      <motion.div
        className={`aula-hoja aula-resultado-cab${c.aprobado ? " is-aprobado" : " is-suspenso"}`}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      >
        <Anillo valor={c.nota} aprobado={c.aprobado} />
        <div>
          <motion.span
            className={`aula-resultado-sello${c.aprobado ? " is-aprobado" : " is-suspenso"}`}
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: c.aprobado ? -6 : 4 }}
            transition={{ type: "spring", stiffness: 380, damping: 14, delay: 0.5 }}
          >
            {c.aprobado ? <Check size={16} strokeWidth={3.2} aria-hidden="true" /> : <X size={16} strokeWidth={3.2} aria-hidden="true" />}
            {c.aprobado ? "Aprobado" : "Suspendido"}
          </motion.span>
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
              <Award size={18} aria-hidden="true" /> Nota final del curso: <strong>{nota(c.certificado.notaFinal)}</strong>. Tu certificado y tu logro ya están listos.
            </p>
          )}
          <div className="aula-resultado-acciones">
            {c.aprobado ? (
              <Tecla href={props.siguiente.href} tamano="grande">
                {props.siguiente.etiqueta} <ArrowRight size={20} strokeWidth={2.6} aria-hidden="true" />
              </Tecla>
            ) : (
              <Tecla href={`/aula/${props.curso}`} color="blanca" tamano="grande">
                <RotateCcw size={18} strokeWidth={2.6} aria-hidden="true" /> Volver al curso y repasar
              </Tecla>
            )}
          </div>
          {!c.aprobado && (
            <p className="aula-resultado-espera">Podrás repetirlo dentro de 24 horas, con otras preguntas del banco.</p>
          )}
        </div>
      </motion.div>

      {!c.aprobado && repasar.length > 0 && (
        <section className="aula-hoja aula-repaso">
          <h2><BookOpen size={18} aria-hidden="true" /> Lo que conviene repasar</h2>
          <ul>
            {repasar.map(([slug, titulo]) => (
              <li key={slug}>
                <Tecla href={`/aula/${props.curso}/${slug}`} color="blanca" tamano="peq">
                  <BookOpen size={14} strokeWidth={2.6} aria-hidden="true" /> {titulo}
                </Tecla>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="aula-hoja aula-revision">
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
                <span className="aula-revision-icono">{d.acertada ? <Check size={15} strokeWidth={3.2} /> : <X size={15} strokeWidth={3.2} />}</span>
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
