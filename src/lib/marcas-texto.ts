/**
 * Las cajas de un texto explicativo, vestidas de pósit (ESTILO.md, «Las marcas
 * de estudio en TODOS los textos explicativos»).
 *
 * Las fichas del diccionario (`extended` de glosario.ts) y las lecciones de los
 * cursos (Supabase) llegan como HTML ya escrito con el vocabulario `.prose-*`.
 * Aquí no se toca ni una palabra: solo se AÑADEN clases a las cajas que ya
 * existen, para que se pinten con la pieza `Postit` del cuaderno
 * (src/components/cuaderno/postit.css):
 *
 *  · el resumen («En veinte segundos», «En esta lección») → pósit amarillo;
 *  · los avisos de riesgo (`--warning`, `--danger`) → pósit coral;
 *  · los de información (`--info`) → pósit amarillo, una nota;
 *  · los de lo que está bien (`--tip`, el «Quédate con esto:») → pósit menta.
 *
 * Cada pósit va un poco torcido, alternando el lado, como pegados a mano.
 * Funciona sin JavaScript: es HTML del servidor. Los símbolos y los trazos de
 * rotulador los pone después `MarcasEstudio`, en el navegador.
 */

const COLOR_AVISO: Record<string, string> = {
  warning: "coral",
  danger: "coral",
  info: "amarillo",
  tip: "menta",
};

const GIROS = ["-1.2deg", "1deg", "-0.8deg", "1.3deg"];

export function vestirTexto(html: string): string {
  let n = 0;
  const giro = () => GIROS[n++ % GIROS.length];
  return html
    .replace(
      /<div class="prose-resumen">/g,
      () => `<div class="prose-resumen postit postit--amarillo" style="--postit-giro:-0.8deg">`,
    )
    .replace(
      /<div class="prose-callout prose-callout--(info|tip|warning|danger)">/g,
      (_, tipo: string) =>
        `<div class="prose-callout prose-callout--${tipo} postit postit--${COLOR_AVISO[tipo]}" style="--postit-giro:${giro()}">`,
    );
}
