import { SITE_URL } from "@/lib/site";
import { fechaLarga, formatoNota } from "@/lib/cursos-progreso";
import "./certificado.css";

/**
 * El certificado en sí. Lo pintan el aula, la verificación pública, la vitrina
 * del dashboard y, como muestra, la ficha del curso, el catálogo y `/premium`:
 * un cambio aquí cambia todos a la vez.
 *
 * Diseño «Cuaderno» (17-11-2026, el cuarto): una hoja de cuaderno, papel
 * blanco con renglones tenues y la línea de margen del color del curso. El
 * nombre y el curso en Fraunces, el nombre subrayado con rotulador del color
 * del curso, el logro en un pósit escrito a mano y la nota final en una gran
 * pegatina redonda del color del curso, con su texto en círculo como un
 * tampón. El pie, con la fecha, el emisor y el código, como un formulario.
 * El color del curso entra por `--cq-acento` y sus derivados salen solos.
 *
 * Tres cosas que no se tocan sin pensar:
 *  · **Solo datos reales.** Nombre, curso, logro, las tres notas, la fecha, el
 *    código y su dirección de verificación. Ni firma de persona, ni horas, ni
 *    un organismo que lo avale: nada de eso existe.
 *  · **Ningún encabezado (`<h1>`, `<h2>`).** Las muestras salen en `/premium`
 *    y en `/cursos`, y un `<h1>` aquí les ponía un segundo título.
 *  · **Las clases son `cq-*` y solo se usan aquí.** Cada diseño estrena
 *    prefijo (`cert-*`, `dp-*`, ahora `cq-*`): con el mismo nombre, el servidor
 *    de desarrollo llegó a mezclar trozos del CSS viejo con el nuevo.
 *
 * `.cq` solo fija la proporción y hace de contenedor; todo lo demás va en
 * `.cq-hoja` y se mide en unidades de `--u` (1cqw, el uno por ciento del
 * ancho), así se ve igual de proporcionado en miniatura que impreso en A4
 * apaisado. Con `completo`, en una pantalla estrecha se recompone en vertical.
 */

/**
 * El texto que da la vuelta a la pegatina, letra a letra y a la misma
 * distancia, como en un tampón. Sin `<textPath>`: necesitaría un id, y las
 * muestras de una misma página lo repetirían.
 */
const GIRO = Array.from("CURSO APROBADO · ADELINBTC ACADEMY · ");

/** El nombre y el curso se encogen si son largos, para que nunca desborden. */
function cuerpoSegunLargo(texto: string, tramos: [number, number][], base: number): number {
  const largo = texto.trim().length;
  let cuerpo = base;
  for (const [desde, valor] of tramos) if (largo > desde) cuerpo = valor;
  return cuerpo;
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
  completo = false,
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
  /**
   * La vista a tamaño completo (el aula, la vitrina, la verificación): en una
   * pantalla estrecha se recompone en vertical para que se lea entero. Impreso
   * sale siempre en A4 apaisado. Las miniaturas no lo llevan.
   */
  completo?: boolean;
}) {
  const verificar = `${SITE_URL.replace(/^https?:\/\//, "")}/cursos/verificar/${codigo}`;
  const estilo = {
    "--cq-acento": color,
    "--cq-cn": cuerpoSegunLargo(nombre, [[13, 5.4], [18, 4.7], [24, 4.1], [32, 3.5], [44, 2.9]], 6.2),
    "--cq-cc": cuerpoSegunLargo(curso, [[30, 2.7], [48, 2.3], [70, 2]], 3.2),
  } as React.CSSProperties;
  const nota = formatoNota(notaFinal);

  return (
    <div className={`cq${muestra ? " cq--muestra" : ""}${completo ? " cq--completo" : ""}`} style={estilo}>
      <div className="cq-hoja">
        <div className="cq-cab">
          <span className="cq-marca">AdelinBTC Academy</span>
          <span className="cq-tipo">Certificado de aprovechamiento</span>
        </div>

        {/* ── El texto ── */}
        <div className="cq-texto">
          <p className="cq-rotulo">Se certifica que</p>
          <p className="cq-nombre"><span>{nombre}</span></p>
          <p className="cq-rotulo">ha completado y aprobado el curso</p>
          <p className="cq-curso">{curso}</p>
          <p className="cq-posit">
            <span>Logro obtenido</span>
            <strong>{logro}</strong>
          </p>
        </div>

        {/* ── La pegatina con la nota final, y de dónde sale ── */}
        <div className="cq-placa">
          <div className="cq-sello" role="img" aria-label={`Nota final: ${nota} sobre 10`}>
            <svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">
              <circle cx="100" cy="100" r="96" className="cq-sello-fondo" />
              <circle cx="100" cy="100" r="70" className="cq-sello-aro" />
              <g className="cq-sello-giro">
                {GIRO.map((letra, i) => (
                  <text key={i} x="100" y="21" transform={`rotate(${(i * 360) / GIRO.length} 100 100)`}>
                    {letra}
                  </text>
                ))}
              </g>
              <text x="100" y="78" className="cq-sello-rotulo">Nota final</text>
              <text x="100" y="128" className="cq-sello-nota">{nota}</text>
              <text x="100" y="148" className="cq-sello-rotulo">sobre 10</text>
            </svg>
          </div>

          <div className="cq-parciales">
            <div className="cq-parcial">
              <span>Media de los módulos<i>40 % de la nota</i></span>
              <strong>{formatoNota(notaModulos)}</strong>
            </div>
            <div className="cq-parcial">
              <span>Examen final<i>60 % de la nota</i></span>
              <strong>{formatoNota(notaExamen)}</strong>
            </div>
          </div>
        </div>

        {/* ── El pie: cuándo, quién y cómo se comprueba ── */}
        <div className="cq-pie">
          <div className="cq-dato">
            <span>Fecha de emisión</span>
            <strong>{fechaLarga(new Date(fecha))}</strong>
          </div>
          <div className="cq-dato">
            <span>Emitido por</span>
            <strong>AdelinBTC Academy</strong>
          </div>
          <div className="cq-dato cq-dato--codigo">
            <span>Código de verificación</span>
            <strong>{codigo}</strong>
          </div>
          <p className="cq-url">Compruébalo en {verificar}</p>
        </div>
      </div>
    </div>
  );
}
