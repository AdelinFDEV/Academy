import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock, Lock, CalendarCheck } from "lucide-react";
import AulaShell from "@/components/aula/AulaShell";
import BotonCompletar from "@/components/aula/BotonCompletar";
import Bloque from "@/components/aula/Bloque";
import { exigirAula } from "../../contexto";
import { contenidoLeccion, cursoPorSlug } from "@/lib/cursos";
import { leccionAbierta, fechaLarga } from "@/lib/cursos-progreso";
import { trocear } from "@/lib/aula-bloques";

type Props = { params: Promise<{ curso: string; leccion: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { curso, leccion } = await params;
  const c = await cursoPorSlug(curso, true);
  const l = c?.modulos.flatMap((m) => m.lecciones).find((x) => x.slug === leccion);
  return { title: (l?.titulo ?? "Lección").slice(0, 48) };
}

/**
 * Una lección. **El texto solo se lee de la base de datos después de
 * comprobar que está abierta**: si el módulo sigue bloqueado, al navegador no
 * llega ni una línea, aunque se escriba la URL a mano.
 */
export default async function LeccionPage({ params }: Props) {
  const { curso: slug, leccion: leccionSlug } = await params;
  const ctx = await exigirAula(slug, `/aula/${slug}/${leccionSlug}`);
  const { curso, datos, estado, sesion } = ctx;

  // Sin ritmo elegido no hay cronograma: primero la portada del aula.
  if (!datos.inscripcion) redirect(`/aula/${slug}`);

  const modulo = curso.modulos.find((m) => m.lecciones.some((l) => l.slug === leccionSlug));
  const leccion = modulo?.lecciones.find((l) => l.slug === leccionSlug);
  if (!modulo || !leccion) notFound();

  const indice = modulo.lecciones.findIndex((l) => l.id === leccion.id);

  if (!leccionAbierta(estado, leccion.id)) {
    const previo = curso.modulos.find((m) => m.orden === modulo.orden - 1);
    return (
      <AulaShell ctx={ctx} activo={{ leccion: leccionSlug }}>
        <div className="aula-cerrada">
          <span className="aula-cerrada-icono"><Lock size={26} strokeWidth={1.8} aria-hidden="true" /></span>
          <span className="aula-kicker">Módulo {modulo.orden} · {modulo.titulo}</span>
          <h1 className="aula-h1">{leccion.titulo}</h1>
          <p className="aula-lead">
            Esta lección se abre al aprobar el examen del módulo {previo?.orden}
            {previo ? ` («${previo.titulo}»)` : ""}. Así cada módulo se apoya en el anterior, y el examen final
            no te pilla con huecos.
          </p>
          {previo && (
            <Link href={`/aula/${slug}/examen/${previo.orden}`} className="aula-btn aula-btn--grande">
              Ir al examen del módulo {previo.orden}
            </Link>
          )}
        </div>
      </AulaShell>
    );
  }

  const contenido = await contenidoLeccion(leccion.id);
  const trozos = trocear(contenido);
  const hecha = datos.completadas.has(leccion.id);

  const anterior = modulo.lecciones[indice - 1];
  const siguiente = modulo.lecciones[indice + 1];
  const destino = siguiente
    ? { href: `/aula/${slug}/${siguiente.slug}`, etiqueta: "Seguir" }
    : { href: `/aula/${slug}/examen/${modulo.orden}`, etiqueta: "Ir al examen" };

  return (
    <AulaShell ctx={ctx} activo={{ leccion: leccionSlug }}>
      <article className="aula-leccion">
        <header className="aula-leccion-cab">
          <span className="aula-kicker">
            Módulo {modulo.orden} · Lección {indice + 1} de {modulo.lecciones.length}
          </span>
          <h1 className="aula-h1">{leccion.titulo}</h1>
          {leccion.resumen && <p className="aula-lead">{leccion.resumen}</p>}
          <div className="aula-leccion-meta">
            <span><Clock size={14} aria-hidden="true" /> {leccion.minutos} min</span>
            {curso.curso.revisado && (
              <span><CalendarCheck size={14} aria-hidden="true" /> Revisado el {fechaLarga(new Date(curso.curso.revisado))}</span>
            )}
            {hecha && <span className="aula-leccion-hecha">Completada</span>}
          </div>
        </header>

        <div className="aula-leccion-cuerpo">
          {trozos.map((t, i) =>
            t.tipo === "html" ? (
              <div key={i} className="prose-content aula-prose" dangerouslySetInnerHTML={{ __html: t.html }} />
            ) : (
              <Bloque key={i} bloque={t.bloque} datos={t.datos} error={t.error} esAdmin={sesion.esAdmin} />
            ),
          )}
          {trozos.length === 0 && sesion.esAdmin && (
            <p className="aula-bloque-roto">Esta lección todavía no tiene contenido. (Solo lo ves tú, como admin.)</p>
          )}
        </div>

        <footer className="aula-leccion-pie">
          {anterior ? (
            <Link href={`/aula/${slug}/${anterior.slug}`} className="aula-btn aula-btn--ghost">
              <ArrowLeft size={15} aria-hidden="true" /> {anterior.titulo}
            </Link>
          ) : (
            <span />
          )}
          <BotonCompletar curso={slug} leccion={leccion.slug} hecha={hecha} destino={destino.href} etiqueta={destino.etiqueta} />
        </footer>
      </article>
    </AulaShell>
  );
}
