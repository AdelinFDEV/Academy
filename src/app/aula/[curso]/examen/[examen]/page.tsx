import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Lock, Hourglass, Check, ArrowRight } from "lucide-react";
import AulaShell from "@/components/aula/AulaShell";
import Examen from "@/components/aula/Examen";
import { exigirAula } from "../../../contexto";
import { claveDesdeTexto, estadoDeExamen, moduloDeExamen, preguntasDeIntento } from "@/lib/cursos-examen";
import { fechaLarga, formatoNota } from "@/lib/cursos-progreso";

type Props = { params: Promise<{ curso: string; examen: string }> };

export const metadata: Metadata = { title: "Examen" };

/**
 * Un examen: de módulo (`/examen/2`) o final (`/examen/final`).
 *
 * El estado lo decide `estadoCurso()` —el mismo cálculo que usa la API al
 * empezar y al entregar—, así que esta página solo enseña lo que toca:
 * bloqueado, en espera, aprobado o el examen en sí.
 */
export default async function ExamenPage({ params }: Props) {
  const { curso: slug, examen: texto } = await params;
  const clave = claveDesdeTexto(texto);
  if (!clave) notFound();

  const ctx = await exigirAula(slug, `/aula/${slug}/examen/${texto}`);
  const { curso, datos, estado } = ctx;
  if (!datos.inscripcion) redirect(`/aula/${slug}`);

  const modulo = moduloDeExamen(curso, clave);
  if (modulo === undefined) notFound();
  const examen = estadoDeExamen(estado, clave);
  if (!examen) notFound();

  const titulo = modulo ? `Examen del módulo ${modulo.orden}: ${modulo.titulo}` : `Examen final: ${curso.curso.titulo}`;

  // A dónde se va tras aprobar.
  const siguienteModulo = modulo ? curso.modulos.find((m) => m.orden === modulo.orden + 1) : undefined;
  const siguiente = !modulo
    ? { href: `/aula/${slug}/certificado`, etiqueta: "Ver mi certificado" }
    : siguienteModulo
      ? { href: `/aula/${slug}/${siguienteModulo.lecciones[0]?.slug ?? ""}`, etiqueta: `Empezar el módulo ${siguienteModulo.orden}` }
      : { href: `/aula/${slug}/examen/final`, etiqueta: "Ir al examen final" };

  let cuerpo: React.ReactNode;

  if (examen.tipo === "bloqueado") {
    cuerpo = (
      <div className="aula-cerrada">
        <span className="aula-cerrada-icono"><Lock size={26} strokeWidth={1.8} aria-hidden="true" /></span>
        <h1 className="aula-h1">{titulo}</h1>
        <p className="aula-lead">
          {modulo
            ? `Se abre al completar las ${modulo.lecciones.length} lecciones del módulo.`
            : `Se abre al aprobar los ${curso.modulos.length} módulos del curso.`}
        </p>
        <Link href={`/aula/${slug}`} className="aula-btn aula-btn--grande">Volver al curso</Link>
      </div>
    );
  } else if (examen.tipo === "espera") {
    cuerpo = (
      <div className="aula-cerrada">
        <span className="aula-cerrada-icono"><Hourglass size={26} strokeWidth={1.8} aria-hidden="true" /></span>
        <h1 className="aula-h1">{titulo}</h1>
        <p className="aula-lead">
          Tu último intento sacó un {formatoNota(examen.ultimaNota)}. Podrás repetirlo a partir del{" "}
          <strong>
            {fechaLarga(examen.disponibleEn)} a las{" "}
            {new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" }).format(examen.disponibleEn)}
          </strong>
          , con otras preguntas. Aprovecha para repasar las lecciones que te recomendó la corrección.
        </p>
        <Link href={`/aula/${slug}`} className="aula-btn aula-btn--grande">Volver al curso</Link>
      </div>
    );
  } else if (examen.tipo === "aprobado") {
    cuerpo = (
      <div className="aula-cerrada is-aprobado">
        <span className="aula-cerrada-icono"><Check size={26} strokeWidth={2.4} aria-hidden="true" /></span>
        <h1 className="aula-h1">{titulo}</h1>
        <p className="aula-lead">Aprobado con un <strong>{formatoNota(examen.nota)}</strong>.</p>
        <Link href={siguiente.href} className="aula-btn aula-btn--grande">
          {siguiente.etiqueta} <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </div>
    );
  } else {
    const abierto =
      examen.tipo === "abierto"
        ? await preguntasDeIntento(examen.intentoId, ctx.sesion.userId).then((p) => (p ? { intentoId: examen.intentoId, preguntas: p } : null))
        : null;
    cuerpo = (
      <Examen
        curso={slug}
        examen={clave}
        titulo={titulo}
        numPreguntas={modulo ? modulo.preguntas_examen : curso.curso.preguntas_final}
        notaMinima={modulo ? modulo.nota_minima : 5}
        intentosPrevios={examen.tipo === "disponible" ? examen.intentosPrevios : 0}
        abierto={abierto}
        siguiente={siguiente}
      />
    );
  }

  return (
    <AulaShell ctx={ctx} activo={{ examen: clave }}>
      {cuerpo}
    </AulaShell>
  );
}
