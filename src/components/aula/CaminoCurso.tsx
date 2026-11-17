import Link from "next/link";
import { Award, Check, Hourglass, Lock } from "lucide-react";
import type { ContextoAula } from "@/lib/cursos";
import { fechaLarga, formatoNota, type Cronograma, type EstadoExamen } from "@/lib/cursos-progreso";

/**
 * EL CAMINO del curso, tipo Duolingo, con el progreso REAL del alumno
 * (estilo «Cuaderno de estudio», 17-11-2026; referencia: «El camino de un
 * curso» en disenos/sistema.html). Es la portada del aula.
 *
 * Todo sale de `estadoCurso()` —el mismo cálculo que decide si se puede entrar
 * a cada sitio—, así que lo que se ve con candado es lo que el servidor no deja
 * abrir. Aquí no se calcula nada nuevo: solo se pinta.
 *
 * · Cada módulo es una «unidad»: su cabecera (título, fecha prevista o nota,
 *   barra de lecciones) y debajo sus paradas en zigzag: una por lección y,
 *   al final, su examen.
 * · Estados: hecho en menta, lo siguiente en naranja que late, examen en lila,
 *   bloqueado en gris. Al final, el examen final y el certificado como meta
 *   en amarillo.
 * · El trazo que une las paradas se pinta en menta hasta donde ha llegado el
 *   alumno y a trazos grises desde ahí.
 */

/** Por dónde serpentea el camino: la posición horizontal de cada parada, en %. */
const ZIGZAG = [50, 66, 74, 66, 50, 34, 26, 34];
/** Alto de cada fila, en píxeles. */
const PASO = 104;
/** Margen arriba y abajo de cada tramo, para el bocadillo y las sombras. */
const MARGEN = 78;

type EstadoParada = "hecho" | "actual" | "abierta" | "bloqueada" | "examen" | "espera" | "meta";

interface Parada {
  clave: string;
  tipo: "leccion" | "examen" | "final" | "meta";
  estado: EstadoParada;
  /** El número o el signo de la cara del nodo, si no lleva icono. */
  cara: string;
  etiqueta: string;
  detalle?: string;
  href?: string;
  x: number;
  /** Solo la meta: el certificado ya es del alumno. */
  ganada?: boolean;
}

function etiquetaExamen(e: EstadoExamen): string {
  switch (e.tipo) {
    case "aprobado": return `Aprobado · ${formatoNota(e.nota)}`;
    case "disponible": return "Disponible";
    case "abierto": return "En curso";
    case "espera": return `Repetir desde el ${fechaLarga(e.disponibleEn)}`;
    default: return "Se abre al completar las lecciones";
  }
}

function estadoExamen(e: EstadoExamen, esSiguiente: boolean): EstadoParada {
  if (e.tipo === "aprobado") return "hecho";
  if (e.tipo === "bloqueado") return "bloqueada";
  if (e.tipo === "espera") return "espera";
  return esSiguiente ? "actual" : "examen";
}

function Cara({ p }: { p: Parada }) {
  if (p.estado === "hecho") return <Check size={p.tipo === "leccion" ? 28 : 30} strokeWidth={3.4} />;
  if (p.estado === "bloqueada" && p.tipo === "leccion") return <Lock size={22} strokeWidth={2.6} />;
  if (p.estado === "espera") return <Hourglass size={24} strokeWidth={2.6} />;
  if (p.tipo === "meta") return <Award size={34} strokeWidth={2.2} />;
  return <>{p.cara}</>;
}

/** Un tramo del camino: las paradas en zigzag, unidas por su trazo. */
function Tramo({ paradas, bocadillo, nombre }: { paradas: Parada[]; bocadillo: string; nombre: string }) {
  const y = (i: number) => MARGEN + i * PASO;
  const alto = y(paradas.length - 1) + MARGEN;

  return (
    <div className="aula-tramo" style={{ height: `${alto}px` }}>
      <svg className="aula-tramo-trazo" viewBox={`0 0 100 ${alto}`} preserveAspectRatio="none" aria-hidden="true">
        {paradas.slice(1).map((p, i) => {
          const a = paradas[i];
          const medio = PASO / 2;
          return (
            <path
              key={p.clave}
              className={a.estado === "hecho" ? "is-andado" : undefined}
              d={`M ${a.x} ${y(i)} C ${a.x} ${y(i) + medio}, ${p.x} ${y(i + 1) - medio}, ${p.x} ${y(i + 1)}`}
            />
          );
        })}
      </svg>

      <ol className="aula-tramo-paradas" aria-label={nombre}>
        {paradas.map((p, i) => {
          const lado = p.x > 50 ? " is-izq" : "";
          const clase = `aula-nodo aula-nodo--${p.tipo} is-${p.estado}${p.ganada ? " is-ganada" : ""}`;
          const texto = `${p.etiqueta}${p.detalle ? `. ${p.detalle}` : ""}`;
          const nodo = p.href ? (
            <Link href={p.href} className={clase} aria-label={texto} aria-current={p.estado === "actual" ? "step" : undefined}>
              <Cara p={p} />
            </Link>
          ) : (
            <span className={clase} role="img" aria-label={texto}>
              <Cara p={p} />
            </span>
          );
          return (
            <li
              key={p.clave}
              className="aula-parada"
              style={{ top: `${y(i)}px`, "--x": `${p.x}%` } as React.CSSProperties}
            >
              {nodo}
              {p.estado === "actual" && (
                <span className="aula-bocadillo" aria-hidden="true">{bocadillo}</span>
              )}
              <span className={`aula-parada-texto${lado}`} aria-hidden="true">
                <span className="aula-parada-titulo">{p.etiqueta}</span>
                {p.detalle && <span className="aula-parada-detalle">{p.detalle}</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function CaminoCurso({ ctx, plan }: { ctx: ContextoAula; plan: Cronograma }) {
  const { curso, datos, estado } = ctx;
  const slug = curso.curso.slug;
  const s = estado.siguiente;
  const bocadillo = estado.leccionesHechas === 0 ? "Empieza aquí" : "Sigue aquí";

  // Un contador para todo el curso: el zigzag sigue de un módulo al siguiente.
  let n = 0;
  const x = () => ZIGZAG[n++ % ZIGZAG.length];

  const unidades = estado.modulos.map(({ modulo, desbloqueado, hechas, examen }) => {
    const paradas: Parada[] = modulo.lecciones.map((l, i) => {
      const hecha = datos.completadas.has(l.id);
      const esSiguiente = s?.tipo === "leccion" && s.slug === l.slug;
      return {
        clave: l.id,
        tipo: "leccion",
        estado: hecha ? "hecho" : esSiguiente ? "actual" : desbloqueado ? "abierta" : "bloqueada",
        cara: String(i + 1),
        etiqueta: l.titulo,
        detalle: `${l.minutos} min`,
        href: desbloqueado ? `/aula/${slug}/${l.slug}` : undefined,
        x: x(),
      };
    });
    paradas.push({
      clave: `examen-${modulo.id}`,
      tipo: "examen",
      estado: estadoExamen(examen, s?.tipo === "examen" && s.moduloOrden === modulo.orden),
      cara: "?",
      etiqueta: "Examen del módulo",
      detalle: etiquetaExamen(examen),
      href: examen.tipo === "bloqueado" ? undefined : `/aula/${slug}/examen/${modulo.orden}`,
      x: x(),
    });
    return { modulo, desbloqueado, hechas, examen, paradas, fecha: plan.hitos.find((h) => h.moduloOrden === modulo.orden)?.fecha };
  });

  const finalAprobado = estado.final.tipo === "aprobado";
  const metas: Parada[] = [
    {
      clave: "final",
      tipo: "final",
      estado: estadoExamen(estado.final, s?.tipo === "final"),
      cara: "?",
      etiqueta: "Examen final",
      detalle: estado.final.tipo === "bloqueado" ? `Aprueba los ${estado.modulos.length} módulos` : etiquetaExamen(estado.final),
      href: estado.final.tipo === "bloqueado" ? undefined : `/aula/${slug}/examen/final`,
      x: x(),
    },
    {
      clave: "meta",
      tipo: "meta",
      estado: "meta",
      ganada: !!datos.certificado,
      cara: "",
      etiqueta: datos.certificado ? "Tu certificado" : "Certificado y logro",
      detalle: datos.certificado ? `Nota final · ${formatoNota(datos.certificado.nota_final)}` : `«${curso.curso.logro}»`,
      href: datos.certificado ? `/aula/${slug}/certificado` : undefined,
      x: 50,
    },
  ];

  return (
    <div className="aula-camino">
      {unidades.map(({ modulo, desbloqueado, hechas, examen, paradas, fecha }) => {
        const aprobado = examen.tipo === "aprobado";
        const pct = modulo.lecciones.length ? (hechas / modulo.lecciones.length) * 100 : 0;
        return (
          <section
            key={modulo.id}
            className={`aula-unidad${aprobado ? " is-hecho" : desbloqueado ? " is-abierta" : " is-bloqueada"}`}
            aria-labelledby={`aula-unidad-${modulo.orden}`}
          >
            <header className="aula-unidad-cab">
              <span className="aula-unidad-num" aria-hidden="true">
                {aprobado ? <Check size={22} strokeWidth={3.2} /> : desbloqueado ? modulo.orden : <Lock size={18} strokeWidth={2.6} />}
              </span>
              <div className="aula-unidad-texto">
                <span className="aula-unidad-rotulo">Módulo {modulo.orden}</span>
                <h3 id={`aula-unidad-${modulo.orden}`} className="aula-unidad-titulo">{modulo.titulo}</h3>
                {modulo.descripcion && <p className="aula-unidad-desc">{modulo.descripcion}</p>}
                <div className="aula-unidad-pie">
                  <span className="aula-barra aula-barra--mini"><i style={{ width: `${aprobado ? 100 : pct}%` }} /></span>
                  <span>
                    {hechas}/{modulo.lecciones.length} lecciones
                    {examen.tipo === "disponible" && " · examen disponible"}
                    {examen.tipo === "abierto" && " · examen en curso"}
                    {examen.tipo === "espera" && " · examen en espera"}
                  </span>
                </div>
              </div>
              <span className={`aula-chip${aprobado ? " aula-chip--menta" : ""}`}>
                {aprobado ? `Aprobado · ${formatoNota(examen.nota)}` : fecha ? `Previsto: ${fechaLarga(fecha)}` : desbloqueado ? "Abierto" : "Bloqueado"}
              </span>
            </header>
            <Tramo paradas={paradas} bocadillo={bocadillo} nombre={`Lecciones y examen del módulo ${modulo.orden}`} />
          </section>
        );
      })}

      <section className={`aula-unidad aula-unidad--final${finalAprobado ? " is-hecho" : ""}`} aria-labelledby="aula-unidad-final">
        <header className="aula-unidad-cab">
          <span className="aula-unidad-num" aria-hidden="true"><Award size={22} strokeWidth={2.4} /></span>
          <div className="aula-unidad-texto">
            <span className="aula-unidad-rotulo">La meta</span>
            <h3 id="aula-unidad-final" className="aula-unidad-titulo">Examen final y certificado</h3>
            <p className="aula-unidad-desc">
              Al aprobarlo ganas el logro «{curso.curso.logro}». La nota del certificado es un 40 % la media de los
              módulos y un 60 % el examen final.
            </p>
          </div>
          <span className={`aula-chip${datos.certificado ? " aula-chip--menta" : ""}`}>
            {datos.certificado ? `Nota final · ${formatoNota(datos.certificado.nota_final)}` : `Previsto: ${fechaLarga(plan.finPlaneado)}`}
          </span>
        </header>
        <Tramo paradas={metas} bocadillo={bocadillo} nombre="El examen final y el certificado" />
      </section>

      <ul className="aula-leyenda" aria-label="Qué es cada parada">
        <li><i className="aula-punto aula-punto--hecho" />Hecho</li>
        <li><i className="aula-punto aula-punto--actual" />Lo siguiente</li>
        <li><i className="aula-punto aula-punto--examen" />Examen</li>
        <li><i className="aula-punto aula-punto--bloq" />Bloqueado</li>
        <li><i className="aula-punto aula-punto--meta" />Certificado</li>
      </ul>
    </div>
  );
}
