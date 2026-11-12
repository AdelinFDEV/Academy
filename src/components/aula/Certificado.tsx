import { useId } from "react";
import { SITE_URL } from "@/lib/site";
import { fechaLarga, formatoNota } from "@/lib/cursos-progreso";
import "./certificado.css";

/**
 * El certificado en sí. Lo pintan el aula, la verificación pública, la vitrina
 * del dashboard y, como muestra, la ficha del curso, el catálogo, `/premium` y
 * el slider de la portada: un cambio aquí cambia todos a la vez.
 *
 * Rehecho el 12-11-2026 («Grabado»): una hoja marfil con una roseta guilloché
 * de fondo y un filete fino, el texto centrado en serif, y abajo una franja
 * azul noche con los datos de emisión. Entre las dos, el sello, que lleva la
 * NOTA FINAL en el centro y a sus lados las dos notas que la componen. Todo lo
 * que no es papel ni tinta sale del color del curso (`--cert-acento`).
 *
 * Dos cosas que no se tocan sin pensar:
 *  · **Solo datos reales.** Nombre, curso, logro, las tres notas, la fecha, el
 *    código y su dirección de verificación. Ni firma de persona, ni número de
 *    horas, ni un organismo que lo avale: nada de eso existe.
 *  · **Ningún encabezado (`<h1>`, `<h2>`).** Las muestras salen en la portada,
 *    en `/premium` y en `/cursos`, y un `<h1>` aquí le ponía a esas páginas un
 *    segundo título que decía «Tu nombre aquí».
 *
 * Se mide todo en cqw (por ciento del ancho del certificado), así que se ve
 * igual de proporcionado en miniatura que impreso en A4 apaisado.
 */

// El borde dentado del sello: una estrella de muchas puntas muy cortas.
const PUNTAS = 56;
const CONTORNO_SELLO = Array.from({ length: PUNTAS * 2 }, (_, i) => {
  const r = i % 2 === 0 ? 99 : 94.5;
  const a = (Math.PI * i) / PUNTAS;
  return `${(100 + r * Math.sin(a)).toFixed(2)},${(100 - r * Math.cos(a)).toFixed(2)}`;
}).join(" ");

// La roseta del fondo: la misma elipse girada, como el guilloché de un billete.
const GIROS = Array.from({ length: 30 }, (_, i) => i * 6);

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
  // Varios certificados conviven en una página (la vitrina): cada sello
  // necesita sus propios id para el degradado y el texto en círculo.
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const verificar = `${SITE_URL.replace(/^https?:\/\//, "")}/cursos/verificar/${codigo}`;
  const estilo = {
    "--cert-acento": color,
    "--cert-cuerpo-nombre": cuerpoSegunLargo(nombre, [[20, 5.4], [28, 4.5], [38, 3.7], [52, 3]], 6.6),
    "--cert-cuerpo-curso": cuerpoSegunLargo(curso, [[34, 2.7], [52, 2.3], [72, 1.95]], 3.2),
  } as React.CSSProperties;

  return (
    <div className={`cert${muestra ? " cert--muestra" : ""}`} style={estilo}>
      <div className="cert-marco">
        {/* ── La hoja ── */}
        <div className="cert-papel">
          <svg className="cert-guilloche" viewBox="0 0 400 400" aria-hidden="true" focusable="false">
            {GIROS.map((g) => (
              <ellipse key={g} cx="200" cy="200" rx="192" ry="74" transform={`rotate(${g} 200 200)`} />
            ))}
            <circle cx="200" cy="200" r="74" />
            <circle cx="200" cy="200" r="192" />
          </svg>
          <span className="cert-esquina cert-esquina--1" aria-hidden="true" />
          <span className="cert-esquina cert-esquina--2" aria-hidden="true" />
          <span className="cert-esquina cert-esquina--3" aria-hidden="true" />
          <span className="cert-esquina cert-esquina--4" aria-hidden="true" />

          <p className="cert-marca">
            <i aria-hidden="true" />AdelinBTC Academy<i aria-hidden="true" />
          </p>
          <p className="cert-titulo">Certificado de aprovechamiento</p>

          <div className="cert-cuerpo">
            <p className="cert-otorga">Se certifica que</p>
            <p className="cert-nombre">{nombre}</p>
            <span className="cert-floron" aria-hidden="true" />
            <p className="cert-otorga">ha completado y aprobado el curso</p>
            <p className="cert-curso">{curso}</p>
            <p className="cert-logro">
              <span>Logro obtenido</span>
              <strong>{logro}</strong>
            </p>
          </div>

          {/* Las dos notas que componen la final, a los lados del sello. */}
          <div className="cert-desglose">
            <div className="cert-parcial cert-parcial--i">
              <span>Media de los módulos · 40 %</span>
              <strong>{formatoNota(notaModulos)}</strong>
            </div>
            <div className="cert-parcial cert-parcial--d">
              <strong>{formatoNota(notaExamen)}</strong>
              <span>Examen final · 60 %</span>
            </div>
          </div>
        </div>

        {/* ── La franja: cuándo, quién y cómo se comprueba ── */}
        <div className="cert-franja">
          <div className="cert-datos">
            <div className="cert-dato">
              <span>Fecha de emisión</span>
              <strong>{fechaLarga(new Date(fecha))}</strong>
            </div>
            <div className="cert-dato">
              <span>Emitido por</span>
              <strong>AdelinBTC Academy</strong>
            </div>
          </div>
          <div className="cert-dato cert-verif">
            <span>Código de verificación</span>
            <strong className="cert-codigo">{codigo}</strong>
            <span className="cert-url">{verificar}</span>
          </div>
        </div>

        {/* ── El sello, a caballo entre la hoja y la franja ── */}
        <svg
          className="cert-sello"
          viewBox="0 0 200 200"
          role="img"
          aria-label={`Nota final: ${formatoNota(notaFinal)} sobre 10`}
        >
          <defs>
            <radialGradient id={`${id}-metal`} cx="34%" cy="26%" r="90%">
              <stop offset="0%" className="cert-sello-luz" />
              <stop offset="48%" className="cert-sello-medio" />
              <stop offset="100%" className="cert-sello-sombra" />
            </radialGradient>
            <path id={`${id}-aro`} d="M100,100 m-73,0 a73,73 0 1,1 146,0 a73,73 0 1,1 -146,0" />
          </defs>
          <polygon points={CONTORNO_SELLO} fill={`url(#${id}-metal)`} />
          <circle cx="100" cy="100" r="87" className="cert-sello-filete" />
          <text className="cert-sello-leyenda">
            <textPath href={`#${id}-aro`} textLength="452" lengthAdjust="spacing">
              ADELINBTC ACADEMY · CERTIFICADO VERIFICABLE ·
            </textPath>
          </text>
          <circle cx="100" cy="100" r="61" className="cert-sello-disco" />
          <circle cx="100" cy="100" r="56.5" className="cert-sello-aro" />
          <text x="100" y="74" textAnchor="middle" className="cert-sello-etiqueta">NOTA FINAL</text>
          <text x="100" y="118" textAnchor="middle" className="cert-sello-nota">{formatoNota(notaFinal)}</text>
          <text x="100" y="136" textAnchor="middle" className="cert-sello-etiqueta">SOBRE 10</text>
        </svg>
      </div>
    </div>
  );
}
