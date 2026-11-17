import Link from "next/link";
import { ArrowRight, Award, BookOpenText, Check, Clock3, Layers, Lock } from "lucide-react";
import Tecla, { type ColorTecla } from "@/components/cuaderno/Tecla";
import Certificado from "@/components/aula/Certificado";
import type { Certificado as CertificadoAlumno, Curso, CursoResumen, Sesion } from "@/lib/cursos";
import { duracion, formatoNota, type ModuloBase } from "@/lib/cursos-progreso";
import { iconoCurso } from "@/lib/logros";
import type { Camino } from "./camino";
import PortadaCurso from "./PortadaCurso";

/**
 * La tarjeta de un curso en el catálogo (/cursos), estilo «Cuaderno de
 * estudio» (17-11-2026). El mismo formato para todos los cursos (CURSOS.md §4):
 *
 *  1. La «foto» de la portada, pegada con cinta del color del curso, con su
 *     nivel y su estado. Si el alumno aprobó, su certificado real asoma y
 *     lleva a su vitrina.
 *  2. El sello con el icono del logro (`iconoCurso`).
 *  3. Título (enlaza a la ficha), subtítulo y tres datos.
 *  4. Según cómo lo lleve el alumno: sin empezar, los módulos; empezado, la
 *     barra y el siguiente paso; aprobado, la nota y el logro. Siempre, el
 *     camino en pequeño: un nodo por módulo, su examen, el final y la meta.
 *  5. Las teclas: la principal según el caso y «Ver temario».
 *
 * Todo sale de los datos (`page.tsx` los lee): ni una cifra de adorno.
 */

export type Avance =
  | { tipo: "nuevo"; camino: Camino }
  | { tipo: "empezado"; camino: Camino; porcentaje: number; hechas: number; total: number; siguiente: string | null }
  | { tipo: "aprobado"; camino: Camino; nota: number; cert: CertificadoAlumno };

/** El botón principal de un curso según quién mire y cómo lo lleva. */
function ctaDe(slug: string, sesion: Sesion | null, avance: Avance): { href: string; texto: string; color: ColorTecla; bloqueado?: boolean } {
  if (avance.tipo === "aprobado" && sesion && !sesion.esPremium) {
    return { href: "/dashboard/certificados", texto: "Ver tu certificado", color: "amarillo" };
  }
  // Directo al pago (10-11-2026, pedido por el admin): /api/checkout manda
  // antes al registro si no hay sesión y vuelve solo a Stripe.
  if (!sesion || !sesion.esPremium) return { href: "/api/checkout", texto: "Desbloquear con Premium", color: "naranja", bloqueado: true };
  if (avance.tipo === "aprobado") return { href: `/aula/${slug}`, texto: "Entrar al curso", color: "lila" };
  if (avance.tipo === "empezado") return { href: `/aula/${slug}`, texto: "Continuar el curso", color: "lila" };
  return { href: `/aula/${slug}`, texto: "Empezar el curso", color: "lila" };
}

/** El camino en pequeño: decorativo, lo que cuenta ya lo dice el texto de la tarjeta. */
function MiniCamino({ camino }: { camino: Camino }) {
  return (
    <ol className="cu-mini" aria-hidden="true">
      {camino.modulos.map((p) => (
        <li key={p.modulo.id} className="cu-mini-tramo">
          <span className={`cu-mini-nodo is-${p.nodo}`}>
            {p.nodo === "hecho" ? <Check size={14} strokeWidth={3.4} /> : p.modulo.orden}
          </span>
          <span className={`cu-mini-examen is-${p.examen.nodo}`} />
        </li>
      ))}
      <li className="cu-mini-tramo">
        <span className={`cu-mini-nodo cu-mini-nodo--final is-${camino.final.nodo}`}>
          {camino.final.nodo === "hecho" ? <Check size={14} strokeWidth={3.4} /> : "?"}
        </span>
      </li>
      <li className="cu-mini-tramo">
        <span className={`cu-mini-meta is-${camino.meta}`}>
          <Award size={16} strokeWidth={2.4} />
        </span>
      </li>
    </ol>
  );
}

export default function TarjetaCurso({
  curso,
  resumen,
  modulos,
  numero,
  reciente,
  sesion,
  avance,
}: {
  curso: Curso;
  resumen: CursoResumen | undefined;
  modulos: ModuloBase[];
  /** Su posición en el catálogo, desde 1. */
  numero: number;
  /** El último del catálogo, si hay más de uno: lleva el pósit. */
  reciente: boolean;
  sesion: Sesion | null;
  avance: Avance;
}) {
  const cta = ctaDe(curso.slug, sesion, avance);
  const premium = !!sesion?.esPremium;
  const nModulos = resumen?.modulos ?? modulos.length;
  const nLecciones = resumen?.lecciones ?? modulos.reduce((t, m) => t + m.lecciones.length, 0);

  return (
    <li className={`cu-curso cu-curso--${avance.tipo}`} style={{ "--c": curso.color } as React.CSSProperties}>
      {/* La foto de la portada, pegada con cinta. */}
      <div className="cu-curso-foto">
        <span className="cu-cinta cu-cinta--izq" aria-hidden="true" />
        <div className="cu-curso-portada">
          <PortadaCurso slug={curso.slug} titulo={curso.titulo} />
        </div>
        <span className="cu-curso-chips">
          <span className="cu-chip cu-chip--papel">{curso.nivel}</span>
          {avance.tipo === "aprobado" && (
            <span className="cu-chip cu-chip--menta"><Check size={12} strokeWidth={3} aria-hidden="true" /> Aprobado</span>
          )}
          {avance.tipo === "empezado" && <span className="cu-chip cu-chip--naranja">En curso</span>}
          {!premium && avance.tipo !== "aprobado" && (
            <span className="cu-chip cu-chip--tinta"><Lock size={11} strokeWidth={2.8} aria-hidden="true" /> Premium</span>
          )}
        </span>
        {reciente && avance.tipo === "nuevo" && <span className="cu-postit">El más reciente</span>}
        {avance.tipo === "aprobado" && (
          /* El certificado del alumno, asomando: premia al que termina. */
          <Link href="/dashboard/certificados" className="cu-curso-cert" aria-label={`Ver tu certificado de ${curso.titulo}`}>
            <Certificado
              nombre={avance.cert.nombre}
              curso={curso.titulo}
              logro={curso.logro}
              notaFinal={avance.cert.nota_final}
              notaModulos={avance.cert.nota_modulos}
              notaExamen={avance.cert.nota_examen}
              fecha={avance.cert.created_at}
              codigo={avance.cert.codigo}
              color={curso.color}
            />
          </Link>
        )}
      </div>

      <div className="cu-curso-cuerpo">
        <div className="cu-curso-cab">
          <span className="cu-curso-sello" aria-hidden="true">{iconoCurso(curso.slug, 26)}</span>
          <span className="cu-curso-num">curso {String(numero).padStart(2, "0")}</span>
        </div>
        <h2 className="cu-curso-titulo">
          <Link href={`/cursos/${curso.slug}`}>{curso.titulo}</Link>
        </h2>
        {curso.subtitulo && <p className="cu-curso-sub">{curso.subtitulo}</p>}

        <ul className="cu-curso-datos">
          <li><Layers size={14} aria-hidden="true" /> {nModulos} {nModulos === 1 ? "módulo" : "módulos"}</li>
          <li><BookOpenText size={14} aria-hidden="true" /> {nLecciones} {nLecciones === 1 ? "lección" : "lecciones"}</li>
          <li><Clock3 size={14} aria-hidden="true" /> {duracion(resumen?.minutos ?? 0)}</li>
        </ul>

        {avance.tipo === "nuevo" ? (
          /* Sin empezar: lo que se aprende, módulo a módulo. */
          <ol className="cu-curso-temario" aria-label={`Módulos de ${curso.titulo}`}>
            {modulos.map((m) => (
              <li key={m.id}>
                <span>{String(m.orden).padStart(2, "0")}</span>
                {m.titulo}
              </li>
            ))}
          </ol>
        ) : (
          <div className="cu-curso-avance">
            <div className="cu-curso-avance-fila">
              <strong>
                {avance.tipo === "aprobado"
                  ? `Completado con un ${formatoNota(avance.nota)}`
                  : `${avance.hechas} de ${avance.total} lecciones`}
              </strong>
              <span className="cu-curso-pct">{avance.tipo === "aprobado" ? 100 : avance.porcentaje} %</span>
            </div>
            <span
              className="cu-barra"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={avance.tipo === "aprobado" ? 100 : avance.porcentaje}
              aria-label={`Progreso en ${curso.titulo}`}
            >
              <i style={{ width: `${avance.tipo === "aprobado" ? 100 : avance.porcentaje}%` }} />
            </span>
            <p className="cu-curso-siguiente">
              {avance.tipo === "aprobado" ? (
                <><Award size={14} aria-hidden="true" /> Logro «{curso.logro}» conseguido</>
              ) : avance.siguiente ? (
                <>Siguiente: <b>{avance.siguiente}</b></>
              ) : (
                <><Award size={14} aria-hidden="true" /> Al aprobar: certificado y logro «{curso.logro}»</>
              )}
            </p>
          </div>
        )}

        <MiniCamino camino={avance.camino} />

        <div className="cu-curso-acciones">
          <Tecla href={cta.href} color={cta.color} prefetch={cta.href.startsWith("/api/") ? false : undefined}>
            {cta.bloqueado && <Lock size={15} strokeWidth={2.6} aria-hidden="true" />}
            {cta.texto}
            <ArrowRight size={16} strokeWidth={2.6} aria-hidden="true" />
          </Tecla>
          <Tecla href={`/cursos/${curso.slug}`} color="blanca">Ver temario</Tecla>
        </div>
      </div>
    </li>
  );
}
