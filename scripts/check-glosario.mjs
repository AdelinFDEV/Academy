/**
 * Guardarraíl de las fichas PROFUNDAS del diccionario.
 *
 *   npm run check:glosario
 *
 * ── Por qué existe ─────────────────────────────────────────────────────────
 *
 * El diccionario tiene 50 términos de ~205 palabras cada uno. Para competir en
 * «qué es un exchange» hay que ir a 800-1500, y ahí aparece el peligro real:
 * **rellenar**. Google detecta el texto inflado y lo penaliza, así que una
 * ficha larga y hueca posiciona PEOR que la corta de hoy.
 *
 * Este script no puede juzgar si un texto es bueno. Lo que sí puede es medir
 * las señales objetivas que separan una página trabajada de una inflada, y
 * negarse a dar por buena una ficha que no las tenga. La calidad la pone quien
 * escribe; esto solo impide autoengañarse.
 *
 * ── Qué considera «profunda» ───────────────────────────────────────────────
 *
 * Una ficha entra en el examen cuando pasa de UMBRAL palabras. Las 50 actuales
 * quedan fuera y no dan error: no se está exigiendo reescribirlas todas de
 * golpe, solo que la que se amplíe se amplíe bien.
 *
 * Sale con código 1 si alguna ficha profunda incumple.
 */
import { readFileSync } from "node:fs";

const RED = "\x1b[31m", GREEN = "\x1b[32m", YELLOW = "\x1b[33m", DIM = "\x1b[2m", OFF = "\x1b[0m";

/** A partir de aquí se considera que la ficha se está ampliando en serio. */
const UMBRAL = 450;
/** Mínimo para plantarle cara a una web grande. */
const MINIMO = 800;
/** Por encima de esto casi siempre sobra texto. */
const MAXIMO = 2000;

// Se normalizan los finales de línea: el repo tiene CRLF en Windows y las
// expresiones de abajo se escribieron contra `\n`. Sin esto el parser no
// encuentra ni un término y el guardarraíl pasa en verde sin mirar nada, que
// es la peor forma de fallar.
const fuente = readFileSync("src/lib/glosario.ts", "utf8").replace(/\r\n/g, "\n");

/** Extrae los términos del archivo sin ejecutarlo (es TypeScript). */
function leerTerminos() {
  const bloques = fuente.split(/\n  \{\n/).slice(1);
  const salida = [];
  for (const b of bloques) {
    const term = b.match(/term: "((?:[^"\\]|\\.)*)"/)?.[1];
    const slug = b.match(/slug: "([a-z0-9-]+)"/)?.[1];
    const definition = b.match(/definition: "((?:[^"\\]|\\.)*)"/)?.[1] ?? "";
    const extended = b.match(/extended: "((?:[^"\\]|\\.)*)"/)?.[1];
    const seeAlso = (b.match(/seeAlso: \[([^\]]*)\]/)?.[1] ?? "")
      .split(",")
      .map((s) => s.trim().replace(/^"|"$/g, ""))
      .filter(Boolean);
    if (slug && term) salida.push({ term, slug, definition, extended, seeAlso });
  }
  return salida;
}

const decodificar = (s) => (s ?? "").replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
const soloTexto = (html) => decodificar(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const palabras = (html) => soloTexto(html).split(/\s+/).filter(Boolean).length;

const terminos = leerTerminos().filter((t) => t.extended);
const profundas = terminos.filter((t) => palabras(t.extended) >= UMBRAL);

const fallos = [];
const avisos = [];

/** Frases repetidas entre fichas distintas: la huella del relleno copiado. */
function frasesDe(html) {
  return soloTexto(html)
    .split(/(?<=[.!?])\s+/)
    .map((f) => f.trim().toLowerCase())
    .filter((f) => f.split(/\s+/).length >= 8);
}

// Un Set por frase, no una lista: si una ficha repite la misma frase veinte
// veces dentro de sí misma eso es otro problema (y lo caza la densidad), no
// «copiada de otra». Aquí solo interesa la frase que aparece en DOS fichas.
const vistas = new Map();
for (const t of terminos) {
  for (const f of frasesDe(t.extended)) {
    if (!vistas.has(f)) vistas.set(f, new Set());
    vistas.get(f).add(t.slug);
  }
}

for (const t of profundas) {
  const html = decodificar(t.extended);
  const texto = soloTexto(t.extended);
  const n = palabras(t.extended);
  const falla = (motivo) => fallos.push([t.slug, motivo]);

  // 1) Longitud dentro de rango.
  if (n < MINIMO) falla(`${n} palabras: por debajo de ${MINIMO}. O se amplía de verdad o se deja corta.`);
  if (n > MAXIMO) falla(`${n} palabras: por encima de ${MAXIMO}. Casi siempre significa que sobra texto.`);

  // 2) Estructura. Un muro de párrafos no lo lee nadie y Google tampoco lo
  //    entiende: los <h2> son los que le dicen de qué va cada parte.
  const h2 = (html.match(/<h2[\s>]/g) ?? []).length;
  if (h2 < 3) falla(`solo ${h2} subtítulos <h2>. Una ficha larga sin estructura es un muro.`);

  // 3) Un dato o ejemplo con números. Es lo que no tiene el texto genérico:
  //    cualquiera puede definir «apalancamiento», pocos ponen la cuenta.
  if (!/\d/.test(texto.replace(/\d{4}/g, ""))) {
    falla("ni un número. Sin un ejemplo con cifras es indistinguible de cualquier otra definición.");
  }

  // 4) Enlaces internos: es lo que convierte 50 fichas sueltas en un cuerpo.
  const enlaces = (html.match(/href="\/(glosario|guias|post)\//g) ?? []).length;
  if (enlaces < 3) falla(`${enlaces} enlaces internos. Mínimo 3 al diccionario, una guía o una entrada.`);

  // 5) Apoyo visual, la misma regla que ya tienen las entradas del blog.
  if (!/class="prose-(chart|table|callout)/.test(html) && !/<table/.test(html)) {
    falla("sin gráfico, tabla ni aviso. Una pantalla de texto seguido no se lee.");
  }

  // 6) No repetir la definición corta palabra por palabra: eso es duplicado
  //    dentro de la propia página, que ya muestra las dos.
  const corta = t.definition.trim().toLowerCase().replace(/\s+/g, " ");
  if (corta.length > 40 && texto.toLowerCase().includes(corta)) {
    falla("repite la definición corta literalmente. Reformúlala.");
  }

  // 7) Densidad del término. Repetirlo en cada frase es la señal de relleno
  //    más vieja del manual, y hoy penaliza en vez de ayudar.
  const veces = (texto.toLowerCase().match(new RegExp(`\\b${t.term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g")) ?? []).length;
  const densidad = (veces / n) * 100;
  if (densidad > 2.5) {
    falla(`«${t.term}» aparece ${veces} veces en ${n} palabras (${densidad.toFixed(1)} %). Por encima del 2,5 % suena a relleno.`);
  }

  // 8) Frases calcadas de OTRA ficha. Reciclar párrafos entre términos es el
  //    atajo evidente al ampliar cincuenta, y es exactamente lo que Google lee
  //    como contenido duplicado dentro del propio dominio.
  const otras = new Set();
  for (const f of frasesDe(t.extended)) {
    for (const s of vistas.get(f) ?? []) if (s !== t.slug) otras.add(s);
  }
  if (otras.size) falla(`tiene frases idénticas a: ${[...otras].join(", ")}`);

  // 8 bis) Frases repetidas dentro de la propia ficha.
  const propias = frasesDe(t.extended);
  if (propias.length - new Set(propias).size > 0) {
    falla(`${propias.length - new Set(propias).size} frase(s) repetidas dentro de la propia ficha.`);
  }

  // 9) `seeAlso` con sus tres. No es fallo, pero son enlaces internos gratis.
  if (t.seeAlso.length < 3) {
    avisos.push([t.slug, `solo ${t.seeAlso.length} en \`seeAlso\`: pierde enlaces internos gratis.`]);
  }
}

// ── Salida ────────────────────────────────────────────────────────────────
console.log(`\n${DIM}Diccionario — fichas profundas${OFF}\n`);
console.log(`  ${terminos.length} términos · ${profundas.length} en profundidad (≥ ${UMBRAL} palabras)\n`);

if (!profundas.length) {
  console.log(`${YELLOW}!${OFF} Todavía no hay ninguna ficha ampliada.`);
  console.log(`${DIM}    Empieza por las de TAREAS.md, que son las que ya reciben búsquedas.${OFF}\n`);
  process.exit(0);
}

for (const t of profundas) {
  const suyos = fallos.filter(([s]) => s === t.slug);
  const n = palabras(t.extended);
  if (suyos.length) {
    console.log(`${RED}✗${OFF} ${t.slug} ${DIM}(${n} palabras)${OFF}`);
    for (const [, motivo] of suyos) console.log(`    ${motivo}`);
  } else {
    console.log(`${GREEN}✓${OFF} ${t.slug} ${DIM}(${n} palabras)${OFF}`);
  }
}

for (const [slug, aviso] of avisos) console.log(`${YELLOW}!${OFF} ${slug}: ${aviso}`);

if (fallos.length) {
  console.log(`\n${RED}${fallos.length} problema(s).${OFF} Una ficha larga y hueca posiciona peor que la corta de hoy.\n`);
  process.exit(1);
}

console.log(`\n${GREEN}Todo correcto.${OFF}\n`);
