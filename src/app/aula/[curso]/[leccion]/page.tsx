import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Check, Clock, ClipboardCheck, Lock, CalendarCheck } from "lucide-react";
import AulaShell from "@/components/aula/AulaShell";
import BotonCompletar from "@/components/aula/BotonCompletar";
import Bloque from "@/components/aula/Bloque";
import GlosarioPopup, { type TerminoCorto } from "@/components/aula/GlosarioPopup";
import ProgresoLectura from "@/components/aula/ProgresoLectura";
import { buscarTermino } from "@/lib/glosario";
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

  // Las definiciones cortas de los términos del diccionario que enlaza esta
  // lección, para el popup: así el alumno los entiende sin salir del curso.
  // Solo los que existen y tienen página propia (si no, el «ver más» daría 404).
  const terminos: Record<string, TerminoCorto> = {};
  for (const [, slugTermino] of contenido.matchAll(/href="\/glosario\/([a-z0-9-]+)"/g)) {
    const t = buscarTermino(slugTermino);
    if (t?.extended) terminos[slugTermino] = { term: t.term, definition: t.definition };
  }
  const hecha = datos.completadas.has(leccion.id);

  const anterior = modulo.lecciones[indice - 1];
  const siguiente = modulo.lecciones[indice + 1];
  const destino = siguiente
    ? { href: `/aula/${slug}/${siguiente.slug}`, etiqueta: "Seguir", rotulo: "Siguiente lección", titulo: siguiente.titulo }
    : { href: `/aula/${slug}/examen/${modulo.orden}`, etiqueta: "Ir al examen", rotulo: "Has llegado al final del módulo", titulo: `Examen del módulo ${modulo.orden}` };
  const examenModulo = estado.modulos.find((e) => e.modulo.id === modulo.id)?.examen;

  return (
    <AulaShell ctx={ctx} activo={{ leccion: leccionSlug }}>
      <ProgresoLectura objetivo=".aula-leccion" />
      <article className="aula-leccion">
        <header className="aula-leccion-cab">
          <div className="aula-leccion-ruta">
            <span className="aula-chip aula-chip--acento">Módulo {modulo.orden}</span>
            <span className="aula-leccion-modtit">{modulo.titulo}</span>
          </div>
          <h1 className="aula-h1">{leccion.titulo}</h1>
          {leccion.resumen && <p className="aula-lead">{leccion.resumen}</p>}
          <div className="aula-leccion-meta">
            <span className="aula-chip"><Clock size={13} aria-hidden="true" /> {leccion.minutos} min</span>
            {curso.curso.revisado && (
              <span className="aula-chip"><CalendarCheck size={13} aria-hidden="true" /> Revisado el {fechaLarga(new Date(curso.curso.revisado))}</span>
            )}
            {hecha && <span className="aula-chip aula-chip--hecho"><Check size={13} strokeWidth={3} aria-hidden="true" /> Completada</span>}
          </div>

          {/* Las paradas del módulo: en cuál estás, cuáles llevas y el examen al final. */}
          <ol className="aula-pasos" aria-label={`Lecciones del módulo ${modulo.orden}`}>
            <li className="aula-pasos-rotulo">Lección {indice + 1} de {modulo.lecciones.length}</li>
            {modulo.lecciones.map((l, i) => (
              <li key={l.id} className={datos.completadas.has(l.id) ? (i === indice ? "is-hecho is-actual" : "is-hecho") : i === indice ? "is-actual" : undefined}>
                <Link
                  href={`/aula/${slug}/${l.slug}`}
                  className="aula-pasos-punto"
                  title={l.titulo}
                  aria-label={`Lección ${i + 1}: ${l.titulo}`}
                  aria-current={i === indice ? "page" : undefined}
                >
                  {datos.completadas.has(l.id) && i !== indice ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : i + 1}
                </Link>
              </li>
            ))}
            <li className={`is-examen${examenModulo?.tipo === "aprobado" ? " is-hecho" : examenModulo?.tipo === "bloqueado" ? " is-bloqueado" : ""}`}>
              {examenModulo && examenModulo.tipo !== "bloqueado" ? (
                <Link href={`/aula/${slug}/examen/${modulo.orden}`} className="aula-pasos-punto" title="Examen del módulo" aria-label="Examen del módulo">
                  <ClipboardCheck size={14} aria-hidden="true" />
                </Link>
              ) : (
                <span className="aula-pasos-punto" title="El examen se abre al completar las lecciones" aria-label="Examen del módulo, bloqueado">
                  <ClipboardCheck size={14} aria-hidden="true" />
                </span>
              )}
            </li>
          </ol>
        </header>

        <GlosarioPopup terminos={terminos}>
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
        </GlosarioPopup>

        <footer className="aula-leccion-pie">
          <div className="aula-leccion-pie-texto">
            <span>{destino.rotulo}</span>
            <strong>{destino.titulo}</strong>
          </div>
          <BotonCompletar curso={slug} leccion={leccion.slug} hecha={hecha} destino={destino.href} etiqueta={destino.etiqueta} />
        </footer>
        {anterior && (
          <Link href={`/aula/${slug}/${anterior.slug}`} className="aula-leccion-anterior">
            <ArrowLeft size={15} aria-hidden="true" /> Lección anterior: {anterior.titulo}
          </Link>
        )}
      </article>
    </AulaShell>
  );
}
