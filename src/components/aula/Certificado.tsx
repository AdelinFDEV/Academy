import { SITE_URL } from "@/lib/site";
import { fechaLarga, formatoNota } from "@/lib/cursos-progreso";
import "./certificado.css";

/**
 * El certificado en sí. Lo pintan el aula, la verificación pública, la vitrina
 * del dashboard y, como muestra, la ficha del curso, el catálogo, `/premium` y
 * el slider de la portada: un cambio aquí cambia todos a la vez.
 *
 * Diseño «Noche» (12-11-2026, el tercero): el mismo lenguaje que la web. Fondo
 * azul noche con un resplandor del color del curso, el texto a la izquierda en
 * marfil y a la derecha una placa con la nota final en un anillo y las dos
 * notas que la componen. Todo lo que tiene color sale de `--dp-acento`.
 *
 * Tres cosas que no se tocan sin pensar:
 *  · **Solo datos reales.** Nombre, curso, logro, las tres notas, la fecha, el
 *    código y su dirección de verificación. Ni firma de persona, ni horas, ni
 *    un organismo que lo avale: nada de eso existe.
 *  · **Ningún encabezado (`<h1>`, `<h2>`).** Las muestras salen en la portada,
 *    en `/premium` y en `/cursos`, y un `<h1>` aquí les ponía un segundo título.
 *  · **Las clases son `dp-*` y solo se usan aquí.** El diseño anterior usaba
 *    `cert-*`; al cambiarlo, el servidor de desarrollo siguió sirviendo trozos
 *    del CSS viejo con los mismos nombres y las dos rejillas se mezclaron. Si
 *    se rehace otra vez, se cambia el prefijo.
 *
 * `.dp` solo fija la proporción y hace de contenedor; todo lo demás va en
 * `.dp-hoja` y se mide en cqw (por ciento del ancho), así se ve igual de
 * proporcionado en miniatura que impreso en A4 apaisado.
 */

// Los arcos del fondo, detrás de la placa.
const ARCOS = Array.from({ length: 9 }, (_, i) => 44 + i * 20);

/** El nombre y el curso se encogen si son largos, para que nunca desborden. */
function cuerpoSegunLargo(texto: string, tramos: [number, number][], base: number): string {
  const largo = texto.trim().length;
  let cuerpo = base;
  for (const [desde, valor] of tramos) if (largo > desde) cuerpo = valor;
  return `${cuerpo}cqw`;
}

export default function Certificado({
  nombre,
  curso,
  logro,
  notaFinal,
  notaModulos,
  notaExamen,
  fecha,
  codigo,
  color,
  muestra = false,
}: {
  nombre: string;
  curso: string;
  logro: string;
  notaFinal: number;
  notaModulos: number;
  notaExamen: number;
  fecha: string;
  codigo: string;
  color: string;
  /** En las muestras: lleva la marca de agua «Muestra». */
  muestra?: boolean;
}) {
  const verificar = `${SITE_URL.replace(/^https?:\/\//, "")}/cursos/verificar/${codigo}`;
  const estilo = {
    "--dp-acento": color,
    "--dp-cuerpo-nombre": cuerpoSegunLargo(nombre, [[13, 5.8], [18, 5], [24, 4.3], [32, 3.6], [44, 3]], 6.8),
    "--dp-cuerpo-curso": cuerpoSegunLargo(curso, [[30, 2.6], [48, 2.2], [70, 1.9]], 3),
  } as React.CSSProperties;
  // Cuánto del anillo se rellena: la nota sobre 10.
  const lleno = Math.max(0, Math.min(100, notaFinal * 10));

  return (
    <div className={`dp${muestra ? " dp--muestra" : ""}`} style={estilo}>
      <div className="dp-hoja">
        <svg className="dp-arcos" viewBox="0 0 400 400" aria-hidden="true" focusable="false">
          {ARCOS.map((r) => (
            <circle key={r} cx="200" cy="200" r={r} />
          ))}
        </svg>

        {/* ── El texto ── */}
        <div className="dp-texto">
          <div className="dp-cab">
            <span className="dp-marca">AdelinBTC Academy</span>
            <span className="dp-tipo">Certificado de aprovechamiento</span>
          </div>

          <div className="dp-centro">
            <p className="dp-rotulo">Se certifica que</p>
            <p className="dp-nombre">{nombre}</p>
            <span className="dp-raya" aria-hidden="true" />
            <p className="dp-rotulo">ha completado y aprobado el curso</p>
            <p className="dp-curso">{curso}</p>
            <p className="dp-logro">
              <span>Logro obtenido</span>
              <strong>{logro}</strong>
            </p>
          </div>

          <div className="dp-pie">
            <div className="dp-dato">
              <span>Fecha de emisión</span>
              <strong>{fechaLarga(new Date(fecha))}</strong>
            </div>
            <div className="dp-dato">
              <span>Emitido por</span>
              <strong>AdelinBTC Academy</strong>
            </div>
            <div className="dp-dato dp-dato--codigo">
              <span>Código de verificación</span>
              <strong>{codigo}</strong>
            </div>
            <p className="dp-url">Compruébalo en {verificar}</p>
          </div>
        </div>

        {/* ── La placa: la nota final y de dónde sale ── */}
        <div className="dp-placa">
          <div className="dp-anillo" role="img" aria-label={`Nota final: ${formatoNota(notaFinal)} sobre 10`}>
            <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
              <circle cx="60" cy="60" r="52" className="dp-anillo-pista" />
              <circle cx="60" cy="60" r="52" className="dp-anillo-relleno" pathLength={100} strokeDasharray="100" strokeDashoffset={100 - lleno} />
            </svg>
            <div className="dp-anillo-centro" aria-hidden="true">
              <span>Nota final</span>
              <strong>{formatoNota(notaFinal)}</strong>
              <span>sobre 10</span>
            </div>
          </div>

          <div className="dp-parciales">
            <div className="dp-parcial">
              <span>Media de los módulos<i>40 % de la nota</i></span>
              <strong>{formatoNota(notaModulos)}</strong>
            </div>
            <div className="dp-parcial">
              <span>Examen final<i>60 % de la nota</i></span>
              <strong>{formatoNota(notaExamen)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
