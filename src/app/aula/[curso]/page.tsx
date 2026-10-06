import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, CalendarCheck, TrendingUp, TrendingDown, Gauge, Award, Check, Lock, ClipboardCheck, Hourglass } from "lucide-react";
import AulaShell from "@/components/aula/AulaShell";
import RitmoSelector from "@/components/aula/RitmoSelector";
import DisclaimerRiesgo from "@/components/DisclaimerRiesgo";
import { exigirAula } from "../contexto";
import { cursoPorSlug } from "@/lib/cursos";
import { cronograma, duracion, fechaLarga, formatoNota, minutosTotales } from "@/lib/cursos-progreso";

type Props = { params: Promise<{ curso: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { curso } = await params;
  const c = await cursoPorSlug(curso, true);
  return { title: c ? `Aula · ${c.curso.titulo}`.slice(0, 48) : "Aula" };
}

/**
 * La portada del curso para el alumno.
 *
 * Primera vez: elegir el ritmo. Desde ahí: cuánto lleva, cuánto le queda, si
 * va por delante o por detrás de su plan, la fecha en que terminará a este
 * paso y el cronograma módulo a módulo.
 */
export default async function AulaCursoPage({ params }: Props) {
  const { curso: slug } = await params;
  const ctx = await exigirAula(slug, `/aula/${slug}`);
  const { curso, datos, estado } = ctx;
  const total = minutosTotales(curso.modulos);

  if (!datos.inscripcion) {
    return (
      <AulaShell ctx={ctx} activo={{ inicio: true }}>
        <section className="aula-bienvenida">
          <span className="aula-kicker">Antes de empezar</span>
          <h1 className="aula-h1">¿A qué ritmo quieres hacer el curso?</h1>
          <p className="aula-lead">
            {curso.modulos.length} módulos, {estado.leccionesTotales} lecciones y {duracion(total)} en total, exámenes
            incluidos. Elige cuántas horas a la semana le dedicas y te armamos un cronograma. Si te adelantas o te
            retrasas, se recalcula solo.
          </p>
          <RitmoSelector curso={slug} minutosTotales={total} />
        </section>
      </AulaShell>
    );
  }

  const plan = cronograma(curso.modulos, datos.completadas, estado, {
    inicio: datos.inscripcion.created_at,
    minutosSemana: datos.inscripcion.minutos_semana,
  });
  const s = estado.siguiente;
  const terminado = !!datos.certificado;
  const desfase = plan.desfaseDias;

  const continuar =
    s?.tipo === "leccion" ? { href: `/aula/${slug}/${s.slug}`, titulo: s.titulo, tipo: `Módulo ${s.moduloOrden} · Lección` }
      : s?.tipo === "examen" ? { href: `/aula/${slug}/examen/${s.moduloOrden}`, titulo: `Examen: ${s.titulo}`, tipo: `Módulo ${s.moduloOrden}` }
        : s?.tipo === "final" ? { href: `/aula/${slug}/examen/final`, titulo: "Examen final", tipo: "Último paso" }
          : null;

  return (
    <AulaShell ctx={ctx} activo={{ inicio: true }}>
      <section className="aula-portada">
        <div className="aula-anillo-grande" style={{ "--pct": estado.porcentaje } as React.CSSProperties}>
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r="52" className="pista" />
            <circle cx="60" cy="60" r="52" className="relleno" pathLength={100} strokeDasharray="100" strokeDashoffset={100 - estado.porcentaje} />
          </svg>
          <div><strong>{estado.porcentaje}%</strong><span>completado</span></div>
        </div>
        <div className="aula-portada-texto">
          <span className="aula-kicker">{curso.curso.titulo}</span>
          <h1 className="aula-h1">
            {terminado ? "Curso terminado" : estado.leccionesHechas === 0 ? "Todo listo para empezar" : "Sigue donde lo dejaste"}
          </h1>
          {continuar && (
            <Link href={continuar.href} className="aula-continuar">
              <span>
                <span className="aula-continuar-tipo">{continuar.tipo}</span>
                <span className="aula-continuar-titulo">{continuar.titulo}</span>
              </span>
              <ArrowRight size={20} aria-hidden="true" />
            </Link>
          )}
          {terminado && datos.certificado && (
            <Link href={`/aula/${slug}/certificado`} className="aula-continuar is-cert">
              <span>
                <span className="aula-continuar-tipo">Nota final {formatoNota(datos.certificado.nota_final)}</span>
                <span className="aula-continuar-titulo">Ver tu certificado</span>
              </span>
              <Award size={20} aria-hidden="true" />
            </Link>
          )}
        </div>
      </section>

      {!terminado && (
        <section className="aula-stats">
          <div className="aula-stat">
            <Clock size={17} aria-hidden="true" />
            <span className="aula-stat-valor">{duracion(plan.minutosRestantes)}</span>
            <span className="aula-stat-label">te quedan</span>
          </div>
          <div className={`aula-stat${desfase < 0 ? " is-retraso" : desfase > 0 ? " is-adelanto" : ""}`}>
            {desfase < 0 ? <TrendingDown size={17} aria-hidden="true" /> : <TrendingUp size={17} aria-hidden="true" />}
            <span className="aula-stat-valor">
              {desfase === 0 ? "Al día" : `${Math.abs(desfase)} ${Math.abs(desfase) === 1 ? "día" : "días"}`}
            </span>
            <span className="aula-stat-label">{desfase < 0 ? "por detrás de tu plan" : desfase > 0 ? "por delante de tu plan" : "con tu plan"}</span>
          </div>
          <div className="aula-stat">
            <CalendarCheck size={17} aria-hidden="true" />
            <span className="aula-stat-valor">{fechaLarga(plan.finEstimado)}</span>
            <span className="aula-stat-label">terminarás a este paso</span>
          </div>
          <div className="aula-stat">
            <Gauge size={17} aria-hidden="true" />
            <span className="aula-stat-valor">{duracion(datos.inscripcion.minutos_semana)}</span>
            <span className="aula-stat-label">por semana</span>
          </div>
        </section>
      )}

      <section className="aula-seccion">
        <h2 className="aula-h2">Tu cronograma</h2>
        <p className="aula-seccion-sub">
          Empezaste el {fechaLarga(new Date(datos.inscripcion.created_at))}. A tu ritmo, el plan termina el {fechaLarga(plan.finPlaneado)}.
        </p>
        <ol className="aula-crono">
          {estado.modulos.map(({ modulo, desbloqueado, hechas, examen }) => {
            const fecha = plan.hitos.find((h) => h.moduloOrden === modulo.orden)?.fecha;
            const aprobado = examen.tipo === "aprobado";
            const pct = modulo.lecciones.length ? (hechas / modulo.lecciones.length) * 100 : 0;
            return (
              <li key={modulo.id} className={`aula-crono-mod${aprobado ? " is-hecho" : desbloqueado ? " is-actual" : " is-bloqueado"}`}>
                <span className="aula-crono-punto" aria-hidden="true">
                  {aprobado ? <Check size={13} strokeWidth={3} /> : desbloqueado ? modulo.orden : <Lock size={11} />}
                </span>
                <div className="aula-crono-cuerpo">
                  <div className="aula-crono-cab">
                    <span className="aula-crono-titulo">{modulo.titulo}</span>
                    <span className="aula-crono-fecha">
                      {aprobado ? `Aprobado · ${formatoNota(examen.nota)}` : fecha ? `Previsto: ${fechaLarga(fecha)}` : ""}
                    </span>
                  </div>
                  {modulo.descripcion && <p className="aula-crono-desc">{modulo.descripcion}</p>}
                  <div className="aula-crono-pie">
                    <span className="aula-barra"><i style={{ width: `${aprobado ? 100 : pct}%` }} /></span>
                    <span>
                      {hechas}/{modulo.lecciones.length} lecciones
                      {examen.tipo === "disponible" && " · examen disponible"}
                      {examen.tipo === "abierto" && " · examen en curso"}
                      {examen.tipo === "espera" && " · examen en espera"}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
          <li className={`aula-crono-mod aula-crono-final${datos.certificado ? " is-hecho" : estado.final.tipo !== "bloqueado" ? " is-actual" : " is-bloqueado"}`}>
            <span className="aula-crono-punto" aria-hidden="true">
              {datos.certificado ? <Award size={13} /> : estado.final.tipo === "espera" ? <Hourglass size={12} /> : <ClipboardCheck size={13} />}
            </span>
            <div className="aula-crono-cuerpo">
              <div className="aula-crono-cab">
                <span className="aula-crono-titulo">Examen final y certificado</span>
                <span className="aula-crono-fecha">
                  {datos.certificado ? `Nota final · ${formatoNota(datos.certificado.nota_final)}` : `Previsto: ${fechaLarga(plan.finPlaneado)}`}
                </span>
              </div>
              <p className="aula-crono-desc">
                Al aprobarlo ganas el logro «{curso.curso.logro}». La nota del certificado es un 40 % la media de los
                módulos y un 60 % el examen final.
              </p>
            </div>
          </li>
        </ol>
      </section>

      <details className="aula-seccion aula-cambiar-ritmo">
        <summary>Cambiar mi ritmo</summary>
        <RitmoSelector curso={slug} minutosTotales={plan.minutosRestantes} actual={datos.inscripcion.minutos_semana} textoBoton="Guardar el nuevo ritmo" />
      </details>

      <DisclaimerRiesgo variante={curso.curso.aviso} />
    </AulaShell>
  );
}
