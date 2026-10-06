import Link from "next/link";
import { ArrowLeft, Check, Lock, Circle, ClipboardCheck, Award, Hourglass, PlayCircle } from "lucide-react";
import TemarioMovil from "@/components/aula/TemarioMovil";
import type { ContextoAula } from "@/lib/cursos";
import { formatoNota, type EstadoExamen } from "@/lib/cursos-progreso";

/**
 * El esqueleto de todas las pantallas del aula: barra superior con el
 * progreso y el temario a la izquierda (en móvil, en un panel).
 *
 * El temario dice en cada fila si está hecha, abierta o cerrada, y es el
 * mismo cálculo que decide si se puede entrar (`estadoCurso`): lo que se ve
 * con candado es lo que el servidor no deja abrir.
 */

export type Activo = { leccion: string } | { examen: number | "final" } | { certificado: true } | { inicio: true };

function etiquetaExamen(e: EstadoExamen): { texto: string; clase: string } {
  switch (e.tipo) {
    case "aprobado": return { texto: `Aprobado · ${formatoNota(e.nota)}`, clase: "is-hecho" };
    case "disponible": return { texto: "Disponible", clase: "is-disponible" };
    case "abierto": return { texto: "En curso", clase: "is-disponible" };
    case "espera": return { texto: "Repetir en 24 h", clase: "is-espera" };
    default: return { texto: "Bloqueado", clase: "is-bloqueado" };
  }
}

function IconoExamen({ e }: { e: EstadoExamen }) {
  if (e.tipo === "aprobado") return <Check size={13} strokeWidth={3} />;
  if (e.tipo === "bloqueado") return <Lock size={12} strokeWidth={2.6} />;
  if (e.tipo === "espera") return <Hourglass size={12} strokeWidth={2.4} />;
  return <ClipboardCheck size={13} strokeWidth={2.4} />;
}

function Temario({ ctx, activo }: { ctx: ContextoAula; activo: Activo }) {
  const { curso, datos, estado } = ctx;
  const slug = curso.curso.slug;
  const final = etiquetaExamen(estado.final);

  return (
    <div className="aula-temario-cuerpo">
      <Link href={`/aula/${slug}`} className={`aula-temario-inicio${"inicio" in activo ? " is-activo" : ""}`}>
        <span className="aula-temario-curso">{curso.curso.titulo}</span>
        <span className="aula-temario-pct">{estado.porcentaje} % completado</span>
        <span className="aula-barra"><i style={{ width: `${estado.porcentaje}%` }} /></span>
      </Link>

      <ol className="aula-temario-modulos">
        {estado.modulos.map(({ modulo, desbloqueado, hechas, examen }) => {
          const ex = etiquetaExamen(examen);
          const contieneActivo =
            ("leccion" in activo && modulo.lecciones.some((l) => l.slug === activo.leccion)) ||
            ("examen" in activo && activo.examen === modulo.orden);
          return (
            <li key={modulo.id} className={`aula-temario-modulo${desbloqueado ? "" : " is-bloqueado"}`}>
              <details open={contieneActivo || (desbloqueado && examen.tipo !== "aprobado")}>
                <summary>
                  <span className="aula-temario-modnum">{String(modulo.orden).padStart(2, "0")}</span>
                  <span className="aula-temario-modtit">{modulo.titulo}</span>
                  <span className="aula-temario-modcuenta">
                    {examen.tipo === "aprobado" ? <Check size={13} strokeWidth={3} aria-label="Aprobado" /> : desbloqueado ? `${hechas}/${modulo.lecciones.length}` : <Lock size={12} aria-label="Bloqueado" />}
                  </span>
                </summary>
                <ul>
                  {modulo.lecciones.map((l) => {
                    const hecha = datos.completadas.has(l.id);
                    const es = "leccion" in activo && activo.leccion === l.slug;
                    const clase = `aula-temario-item${hecha ? " is-hecho" : ""}${es ? " is-activo" : ""}${desbloqueado ? "" : " is-bloqueado"}`;
                    const icono = hecha ? <Check size={12} strokeWidth={3} /> : desbloqueado ? <Circle size={10} strokeWidth={2.4} /> : <Lock size={11} strokeWidth={2.6} />;
                    return (
                      <li key={l.id}>
                        {desbloqueado ? (
                          <Link href={`/aula/${slug}/${l.slug}`} className={clase} aria-current={es ? "page" : undefined}>
                            <span className="aula-temario-icono" aria-hidden="true">{icono}</span>
                            <span className="aula-temario-texto">{l.titulo}</span>
                            <span className="aula-temario-min">{l.minutos}′</span>
                          </Link>
                        ) : (
                          <span className={clase}>
                            <span className="aula-temario-icono" aria-hidden="true">{icono}</span>
                            <span className="aula-temario-texto">{l.titulo}</span>
                            <span className="aula-temario-min">{l.minutos}′</span>
                          </span>
                        )}
                      </li>
                    );
                  })}
                  <li>
                    {examen.tipo === "bloqueado" ? (
                      <span className={`aula-temario-item aula-temario-examen ${ex.clase}`}>
                        <span className="aula-temario-icono" aria-hidden="true"><IconoExamen e={examen} /></span>
                        <span className="aula-temario-texto">Examen del módulo</span>
                        <span className="aula-temario-estado">{ex.texto}</span>
                      </span>
                    ) : (
                      <Link
                        href={`/aula/${slug}/examen/${modulo.orden}`}
                        className={`aula-temario-item aula-temario-examen ${ex.clase}${"examen" in activo && activo.examen === modulo.orden ? " is-activo" : ""}`}
                      >
                        <span className="aula-temario-icono" aria-hidden="true"><IconoExamen e={examen} /></span>
                        <span className="aula-temario-texto">Examen del módulo</span>
                        <span className="aula-temario-estado">{ex.texto}</span>
                      </Link>
                    )}
                  </li>
                </ul>
              </details>
            </li>
          );
        })}
      </ol>

      <div className="aula-temario-cierre">
        {estado.final.tipo === "bloqueado" ? (
          <span className={`aula-temario-item aula-temario-examen ${final.clase}`}>
            <span className="aula-temario-icono" aria-hidden="true"><Lock size={12} strokeWidth={2.6} /></span>
            <span className="aula-temario-texto">Examen final</span>
            <span className="aula-temario-estado">Aprueba los {estado.modulos.length} módulos</span>
          </span>
        ) : (
          <Link
            href={`/aula/${slug}/examen/final`}
            className={`aula-temario-item aula-temario-examen ${final.clase}${"examen" in activo && activo.examen === "final" ? " is-activo" : ""}`}
          >
            <span className="aula-temario-icono" aria-hidden="true"><IconoExamen e={estado.final} /></span>
            <span className="aula-temario-texto">Examen final</span>
            <span className="aula-temario-estado">{final.texto}</span>
          </Link>
        )}
        {datos.certificado ? (
          <Link href={`/aula/${slug}/certificado`} className={`aula-temario-item aula-temario-cert${"certificado" in activo ? " is-activo" : ""}`}>
            <span className="aula-temario-icono" aria-hidden="true"><Award size={13} strokeWidth={2.4} /></span>
            <span className="aula-temario-texto">Tu certificado</span>
          </Link>
        ) : (
          <span className="aula-temario-item aula-temario-cert is-bloqueado">
            <span className="aula-temario-icono" aria-hidden="true"><Award size={13} strokeWidth={2.4} /></span>
            <span className="aula-temario-texto">Certificado y logro</span>
          </span>
        )}
      </div>
    </div>
  );
}

export default function AulaShell({ ctx, activo, children }: { ctx: ContextoAula; activo: Activo; children: React.ReactNode }) {
  const { curso, estado } = ctx;
  const siguiente = estado.siguiente;
  const hrefSiguiente =
    siguiente?.tipo === "leccion" ? `/aula/${curso.curso.slug}/${siguiente.slug}`
      : siguiente?.tipo === "examen" ? `/aula/${curso.curso.slug}/examen/${siguiente.moduloOrden}`
        : siguiente?.tipo === "final" ? `/aula/${curso.curso.slug}/examen/final` : null;

  return (
    <div className="aula" style={{ "--aula-acento": curso.curso.color } as React.CSSProperties}>
      <header className="aula-barra-sup">
        <Link href={`/cursos/${curso.curso.slug}`} className="aula-volver">
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Ficha del curso</span>
        </Link>
        <div className="aula-barra-progreso" aria-label={`${estado.porcentaje} % del curso completado`}>
          <span className="aula-barra"><i style={{ width: `${estado.porcentaje}%` }} /></span>
          <span className="aula-barra-pct">{estado.porcentaje} %</span>
        </div>
        {hrefSiguiente && !("inicio" in activo) && (
          <Link href={hrefSiguiente} className="aula-barra-seguir">
            <PlayCircle size={15} aria-hidden="true" /> <span>Seguir donde lo dejé</span>
          </Link>
        )}
        {ctx.sesion.esAdmin && <span className="aula-admin-chip" title="Ves todo abierto y sin esperas para revisar el curso">Modo admin</span>}
      </header>

      <div className="aula-cuerpo">
        <TemarioMovil>
          <Temario ctx={ctx} activo={activo} />
        </TemarioMovil>
        <main className="aula-principal">{children}</main>
      </div>
    </div>
  );
}
