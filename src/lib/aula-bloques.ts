/**
 * Trocea el HTML de una lección en texto y bloques interactivos.
 *
 * Una lección es HTML guardado en Supabase. Para meter un gráfico animado o
 * un minijuego se escribe, en mitad del texto:
 *
 *   <div data-bloque="clasificar">
 *   <script type="application/json">{ …los datos del bloque… }</script>
 *   </div>
 *
 * Los datos van en un <script type="application/json"> y no en un atributo
 * porque así se escriben con comillas normales y saltos de línea, sin
 * escapar nada. El catálogo de bloques y lo que pide cada uno: CURSOS.md.
 *
 * Sin dependencias de servidor: lo usa la página de la lección para partir el
 * texto, y cada trozo de HTML se pinta tal cual, con el vocabulario `.prose-*`.
 */

export type Trozo =
  | { tipo: "html"; html: string }
  | { tipo: "bloque"; bloque: string; datos: unknown; error?: string };

const PATRON =
  /<div\s+data-bloque="([a-z0-9-]+)"\s*>\s*(?:<script\s+type="application\/json"\s*>([\s\S]*?)<\/script>)?\s*<\/div>/g;

export function trocear(contenido: string): Trozo[] {
  const trozos: Trozo[] = [];
  let desde = 0;

  for (const m of contenido.matchAll(PATRON)) {
    const antes = contenido.slice(desde, m.index);
    if (antes.trim()) trozos.push({ tipo: "html", html: antes });

    let datos: unknown = {};
    let error: string | undefined;
    if (m[2]?.trim()) {
      try {
        datos = JSON.parse(m[2]);
      } catch (e) {
        error = e instanceof Error ? e.message : "JSON no válido";
      }
    }
    trozos.push({ tipo: "bloque", bloque: m[1], datos, error });
    desde = (m.index ?? 0) + m[0].length;
  }

  const resto = contenido.slice(desde);
  if (resto.trim()) trozos.push({ tipo: "html", html: resto });
  return trozos;
}
