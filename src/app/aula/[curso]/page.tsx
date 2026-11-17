import type { Metadata } from "next";
import { ArrowRight, Clock, CalendarCheck, TrendingUp, TrendingDown, Gauge, Award } from "lucide-react";
import AulaShell from "@/components/aula/AulaShell";
import BotonRehacer from "@/components/aula/BotonRehacer";
import CaminoCurso from "@/components/aula/CaminoCurso";
import RitmoSelector from "@/components/aula/RitmoSelector";
import Tecla from "@/components/cuaderno/Tecla";
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
 * La portada del curso para el alumno: el mapa del curso.
 *
 * Primera vez: elegir el ritmo. Desde ahí, arriba lo que toca ahora y cuánto
 * lleva (la barra gruesa, cuánto le queda, si va por delante o por detrás de
 * su plan y cuándo terminará a este paso), y debajo EL CAMINO (CaminoCurso):
 * cada lección y cada examen como una parada, con su estado real.
 */
export default async function AulaCursoPage({ params }: Props) {
  const { curso: slug } = await params;
  const ctx = await exigirAula(slug, `/aula/${slug}`);
  const { curso, datos, estado, sesion } = ctx;
  const total = minutosTotales(curso.modulos);

  if (!datos.inscripcion) {
    return (
      <AulaShell ctx={ctx} activo={{ inicio: true }}>
        <section className="aula-hoja aula-bienvenida">
          <p className="aula-nota-mano">Antes de empezar</p>
          <h1 className="aula-h1">
            ¿A qué <span className="fluor">ritmo</span> quieres hacer el curso?
          </h1>
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
  // Con certificado pero sin el final aprobado en los intentos: lo está
  // REHACIENDO para mejorar la nota (api/cursos/rehacer borra los intentos y
  // conserva el certificado). Entonces se le guía como a quien empieza.
  const rehaciendo = !!datos.certificado && estado.final.tipo !== "aprobado" && !sesion.esAdmin;
  const terminado = !!datos.certificado && !rehaciendo;
  const desfase = plan.desfaseDias;

  const continuar =
    s?.tipo === "leccion" ? { href: `/aula/${slug}/${s.slug}`, titulo: s.titulo, tipo: `Módulo ${s.moduloOrden} · Lección` }
      : s?.tipo === "examen" ? { href: `/aula/${slug}/examen/${s.moduloOrden}`, titulo: `Examen: ${s.titulo}`, tipo: `Módulo ${s.moduloOrden}` }
        : s?.tipo === "final" ? { href: `/aula/${slug}/examen/final`, titulo: "Examen final", tipo: "Último paso" }
          : null;

  const examenesTotales = estado.modulos.length + 1;
  const examenesAprobados =
    estado.modulos.filter((m) => m.examen.tipo === "aprobado").length + (estado.final.tipo === "aprobado" ? 1 : 0);

  return (
    <AulaShell ctx={ctx} activo={{ inicio: true }}>
      <section className="aula-hoja aula-portada">
        <div className="aula-portada-texto">
          <p className="aula-nota-mano">{curso.curso.titulo}</p>
          <h1 className="aula-h1">
            {terminado ? (
              <>Curso <span className="fluor">terminado</span></>
            ) : rehaciendo ? (
              <>Rehaciendo <span className="fluor">el curso</span></>
            ) : estado.leccionesHechas === 0 ? (
              <>Todo listo para <span className="fluor">empezar</span></>
            ) : (
              <>Sigue donde <span className="fluor">lo dejaste</span></>
            )}
          </h1>
          {rehaciendo && datos.certificado && (
            <p className="aula-lead">
              Tu certificado sigue vigente con su nota actual ({formatoNota(datos.certificado.nota_final)}). Cuando
              apruebes de nuevo el examen final, se actualizará con la nueva nota, aunque sea más baja, y conservará el
              mismo código.
            </p>
          )}

          {continuar && (
            <div className="aula-siguiente">
              <span className="aula-siguiente-tipo">{continuar.tipo}</span>
              <span className="aula-siguiente-titulo">{continuar.titulo}</span>
              <Tecla href={continuar.href} tamano="grande">
                {estado.leccionesHechas === 0 ? "Empezar" : "Continuar"} <ArrowRight size={20} strokeWidth={2.6} aria-hidden="true" />
              </Tecla>
            </div>
          )}
          {terminado && datos.certificado && (
            <div className="aula-siguiente aula-siguiente--cert">
              <span className="aula-siguiente-tipo">Nota final {formatoNota(datos.certificado.nota_final)}</span>
              <span className="aula-siguiente-titulo">Tu certificado y el logro «{curso.curso.logro}»</span>
              <Tecla href={`/aula/${slug}/certificado`} color="amarillo" tamano="grande">
                <Award size={20} aria-hidden="true" /> Ver tu certificado
              </Tecla>
            </div>
          )}
          {terminado && datos.certificado && (
            <BotonRehacer curso={slug} notaActual={formatoNota(datos.certificado.nota_final)} />
          )}
        </div>

        <div className="aula-avance">
          <p className="aula-avance-cifra">
            <strong>{estado.porcentaje} %</strong>
            <span>completado</span>
          </p>
          <span className="aula-barra aula-barra--gruesa" role="img" aria-label={`${estado.porcentaje} % del curso completado`}>
            <i style={{ width: `${estado.porcentaje}%` }} />
          </span>
          <ul className="aula-avance-cuentas">
            <li><b>{estado.leccionesHechas}</b> de {estado.leccionesTotales} lecciones</li>
            <li><b>{examenesAprobados}</b> de {examenesTotales} exámenes aprobados</li>
          </ul>
        </div>
      </section>

      {!terminado && (
        <section className="aula-stats" aria-label="Tu ritmo">
          <div className="aula-stat">
            <span className="aula-stat-ic aula-stat-ic--cielo"><Clock size={18} aria-hidden="true" /></span>
            <span className="aula-stat-valor">{duracion(plan.minutosRestantes)}</span>
            <span className="aula-stat-label">te quedan</span>
          </div>
          <div className={`aula-stat${desfase < 0 ? " is-retraso" : desfase > 0 ? " is-adelanto" : ""}`}>
            <span className={`aula-stat-ic ${desfase < 0 ? "aula-stat-ic--coral" : "aula-stat-ic--menta"}`}>
              {desfase < 0 ? <TrendingDown size={18} aria-hidden="true" /> : <TrendingUp size={18} aria-hidden="true" />}
            </span>
            <span className="aula-stat-valor">
              {desfase === 0 ? "Al día" : `${desfase > 0 ? "+" : "−"}${Math.abs(desfase)} ${Math.abs(desfase) === 1 ? "día" : "días"}`}
            </span>
            <span className="aula-stat-label">{desfase < 0 ? "por detrás de tu plan" : desfase > 0 ? "por delante de tu plan" : "con tu plan"}</span>
          </div>
          <div className="aula-stat">
            <span className="aula-stat-ic aula-stat-ic--lila"><CalendarCheck size={18} aria-hidden="true" /></span>
            <span className="aula-stat-valor">{fechaLarga(plan.finEstimado)}</span>
            <span className="aula-stat-label">terminarás a este paso</span>
          </div>
          <div className="aula-stat">
            <span className="aula-stat-ic aula-stat-ic--naranja"><Gauge size={18} aria-hidden="true" /></span>
            <span className="aula-stat-valor">{duracion(datos.inscripcion.minutos_semana)}</span>
            <span className="aula-stat-label">por semana</span>
          </div>
        </section>
      )}

      <section className="aula-seccion" aria-labelledby="aula-camino-titulo">
        <h2 id="aula-camino-titulo" className="aula-h2">Tu camino</h2>
        <p className="aula-seccion-sub">
          Empezaste el {fechaLarga(new Date(datos.inscripcion.created_at))}. A tu ritmo, el plan termina el {fechaLarga(plan.finPlaneado)}.
        </p>
        <CaminoCurso ctx={ctx} plan={plan} />
      </section>

      <details className="aula-hoja aula-cambiar-ritmo">
        <summary className="tecla tecla--blanca tecla--peq">Cambiar mi ritmo</summary>
        <RitmoSelector curso={slug} minutosTotales={plan.minutosRestantes} actual={datos.inscripcion.minutos_semana} textoBoton="Guardar el nuevo ritmo" />
      </details>

      <DisclaimerRiesgo variante={curso.curso.aviso} />
    </AulaShell>
  );
}
