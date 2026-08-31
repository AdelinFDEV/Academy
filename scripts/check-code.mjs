/**
 * Guardarraíl de calidad de código.
 *
 *   npm run check
 *
 * No pretende dejar el proyecto sin ningún aviso de ESLint — eso obligaría a
 * arreglar de golpe 26 errores de react-hooks que hoy no molestan a nadie.
 * Lo que hace es impedir que vuelvan a aparecer los problemas que YA se
 * limpiaron, que están a cero y que por tanto se pueden exigir sin excusas.
 *
 * Si alguna comprobación falla, sale con código 1 y dice exactamente dónde.
 */
import { execSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const RED = "\x1b[31m", GREEN = "\x1b[32m", YELLOW = "\x1b[33m", DIM = "\x1b[2m", OFF = "\x1b[0m";

/**
 * Reglas de ESLint con tolerancia CERO. Están a 0 desde la limpieza de agosto
 * de 2026; cualquier aparición nueva es, por definición, código recién escrito.
 */
const ZERO_TOLERANCE = {
  "@typescript-eslint/no-explicit-any":
    "Usa un tipo concreto. Para los joins de Supabase tienes PostCategoryRef, CommentProfileRef y AdminComment en src/lib/types.ts.",
  "@typescript-eslint/no-unused-vars":
    "Borra el import, la variable o el parámetro. Si es un estado del que solo usas el setter: const [, setX] = useState(...).",
};

const problems = [];

// ── 1) Reglas de ESLint a cero ────────────────────────────────────────────
function checkEslint() {
  let raw = "";
  try {
    raw = execSync("npx eslint src -f json", { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  } catch (err) {
    // ESLint sale con código != 0 cuando hay errores; el JSON sigue en stdout.
    raw = err.stdout?.toString() ?? "";
  }
  if (!raw.trim()) {
    problems.push(["ESLint", "No se pudo ejecutar ESLint o no devolvió resultados."]);
    return;
  }

  const results = JSON.parse(raw);
  const hits = {};
  for (const file of results) {
    for (const m of file.messages) {
      if (!(m.ruleId in ZERO_TOLERANCE)) continue;
      (hits[m.ruleId] ??= []).push(`${file.filePath.split(/src[\\/]/)[1]}:${m.line}`);
    }
  }

  for (const [rule, hint] of Object.entries(ZERO_TOLERANCE)) {
    const found = hits[rule] ?? [];
    if (found.length === 0) {
      console.log(`${GREEN}✓${OFF} ${rule} ${DIM}— 0 casos${OFF}`);
    } else {
      console.log(`${RED}✗${OFF} ${rule} ${RED}— ${found.length} caso(s)${OFF}`);
      found.slice(0, 12).forEach((f) => console.log(`    src/${f}`));
      if (found.length > 12) console.log(`    ${DIM}… y ${found.length - 12} más${OFF}`);
      problems.push([rule, hint]);
    }
  }
}

// ── 2) Metadata: títulos y descripciones que Google no corte ──────────────
// El layout raíz añade SUFIJO a cada título con `template`. Tres cosas pueden
// ir mal, y las tres pasaron de verdad en agosto de 2026:
//
//   · Repetir el sufijo en la página lo duplica en la pestaña y en Google. Se
//     busca también el antiguo (" | AdelinBTC Academy"), por si alguien copia
//     el title de una página vieja o de un commit anterior.
//   · Título largo. Google corta el resultado sobre los 60 caracteres, sufijo
//     incluido, así que al title propio le quedan TITULO_MAX. Las 7 guías se
//     cortaban, y la de fiscalidad llegaba a 101.
//   · Descripción larga. Se corta sobre los 160. La de fiscalidad tenía 341.
//
// Solo se miran los campos de `metadata`, indentados a 2 (el valor de una
// description suele caer en la línea siguiente, a 4). Los de `openGraph` van a
// 4 y 6 y quedan fuera a propósito: no llevan sufijo, los leen las redes y
// nadie los corta tan pronto como Google.
const SUFIJO = " | AdelinBTC";
const TITULO_MAX = 60 - SUFIJO.length;
const DESC_MAX = 160;

function checkMetadata() {
  const duplicados = [];
  const titulosLargos = [];
  const descLargas = [];

  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const p = join(dir, entry);
      if (statSync(p).isDirectory()) { walk(p); continue; }
      if (!/\.tsx?$/.test(entry)) continue;

      // El layout raíz define el `template`, así que su title no lleva sufijo y
      // no se le aplican esas dos reglas. Su description sí cuenta: es la de la
      // portada.
      const esLayoutRaiz = p.endsWith(join("src", "app", "layout.tsx"));
      // Se parte con /\r?\n/ y no con "\n": buena parte de los archivos del
      // repo son CRLF, y ese \r superviviente al final de cada línea rompe
      // cualquier ancla `$` que no venga precedida de \s*.
      const lineas = readFileSync(p, "utf8").split(/\r?\n/);

      lineas.forEach((line, i) => {
        const ref = `${p.split(/src[\\/]/)[1]}:${i + 1}`;

        const t = !esLayoutRaiz && line.match(/^  title: "(.*)",?\s*$/);
        if (t) {
          if (/\| AdelinBTC( Academy)?$/.test(t[1])) duplicados.push(ref);
          else if (t[1].length > TITULO_MAX) titulosLargos.push([ref, t[1].length]);
        }

        // En el layout raíz la descripción es una constante suelta que luego se
        // reutiliza en metadata, openGraph y twitter.
        const d = esLayoutRaiz
          ? line.match(/^const description =$/) && lineas[i + 1]?.match(/^  "(.*)";\s*$/)
          : line.match(/^  description: "(.*)",?\s*$/) ||
            (/^  description:\s*$/.test(line) && lineas[i + 1]?.match(/^    "(.*)",?\s*$/));
        if (d && d[1].length > DESC_MAX) descLargas.push([ref, d[1].length]);
      });
    }
  };
  walk(join("src", "app"));

  const informar = (lista, campo, okMsg, koMsg, pista) => {
    if (lista.length === 0) {
      console.log(`${GREEN}✓${OFF} ${okMsg} ${DIM}— 0 casos${OFF}`);
      return;
    }
    console.log(`${RED}✗${OFF} ${koMsg} ${RED}— ${lista.length} caso(s)${OFF}`);
    lista.forEach((x) => {
      const [f, n] = Array.isArray(x) ? x : [x, null];
      console.log(`    src/${f}${n === null ? "" : ` ${DIM}— ${n} caracteres${OFF}`}`);
    });
    problems.push([campo, pista]);
  };

  informar(duplicados, "metadata.title",
    "metadata.title sin sufijo duplicado", "metadata.title con sufijo duplicado",
    `Quita "${SUFIJO}" del title: el layout raíz ya lo añade con \`template\`.`);

  informar(titulosLargos, "metadata.title",
    `metadata.title dentro de ${TITULO_MAX} caracteres`, "metadata.title demasiado largo",
    `Recorta el title a ${TITULO_MAX} caracteres: con el sufijo "${SUFIJO}" Google lo corta pasados los 60.`);

  informar(descLargas, "metadata.description",
    `metadata.description dentro de ${DESC_MAX} caracteres`, "metadata.description demasiado larga",
    `Recorta la description a ${DESC_MAX} caracteres: Google corta ahí el fragmento del resultado.`);
}

// ── 3) Fechas releídas desde texto ────────────────────────────────────────
// `new Date(algo.toLocaleString(...))` escribe una fecha como texto y deja que
// `new Date` la vuelva a leer — y al leerla la interpreta en la zona horaria
// DE LA MÁQUINA, no en la del `timeZone` que se pidió. El resultado sale
// desplazado tantas horas como el offset de quien mira, y en un componente de
// cliente eso es la zona del visitante.
//
// Es traicionero porque en UTC da el resultado correcto: el servidor va en
// UTC, así que en desarrollo y en el render del servidor parece que funciona.
// Pasó en el Radar: el PCE de las 08:30 ET salía a las 17:30 en Rumanía.
//
// La forma correcta es `Intl.DateTimeFormat(...).formatToParts()`, que
// devuelve números y nunca pasa por texto (ver etTimeToMadrid en RadarClient).
function checkDateReparse() {
  // Los comentarios se vacían antes de mirar: si no, el comentario que CITA el
  // antipatrón para explicar por qué no usarlo se marca a sí mismo. Se
  // sustituyen por espacios en vez de borrarse para no mover los números de
  // línea que se enseñan al fallar.
  const sinComentarios = (src) =>
    src
      .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
      .replace(/\/\/[^\n]*/g, (m) => " ".repeat(m.length));

  const offenders = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const p = join(dir, entry);
      if (statSync(p).isDirectory()) { walk(p); continue; }
      if (!/\.tsx?$/.test(entry)) continue;
      const src = sinComentarios(readFileSync(p, "utf8"));
      src.split("\n").forEach((line, i) => {
        if (/new Date\s*\([^)]*\.toLocaleString\s*\(/.test(line)) {
          offenders.push(`${p.split(/src[\\/]/)[1]}:${i + 1}`);
        }
      });
    }
  };
  walk("src");

  if (offenders.length === 0) {
    console.log(`${GREEN}✓${OFF} fechas sin releer desde texto ${DIM}— 0 casos${OFF}`);
  } else {
    console.log(`${RED}✗${OFF} new Date(...toLocaleString(...)) ${RED}— ${offenders.length} caso(s)${OFF}`);
    offenders.forEach((f) => console.log(`    src/${f}`));
    problems.push([
      "Fecha releída desde texto",
      "new Date(x.toLocaleString({timeZone})) se interpreta en la zona de la máquina, " +
        "no en la pedida. Usa Intl.DateTimeFormat(...).formatToParts() y monta la fecha " +
        "con Date.UTC a partir de los números.",
    ]);
  }
}

// ── 4) CSS de guías fuera de su sitio ─────────────────────────────────────
// AGENTS.md: cada guía lleva su propio [slug].css. Si aparece una guía nueva
// sin él, su CSS ha acabado en guias.css o en globals.css.
function checkGuideCss() {
  const guiasDir = join("src", "app", "guias");
  const missing = [];
  for (const entry of readdirSync(guiasDir)) {
    const dir = join(guiasDir, entry);
    if (!statSync(dir).isDirectory()) continue;
    const files = readdirSync(dir);
    if (!files.includes("page.tsx")) continue;
    if (!files.some((f) => f.endsWith(".css"))) missing.push(entry);
  }

  if (missing.length === 0) {
    console.log(`${GREEN}✓${OFF} cada guía tiene su propio CSS ${DIM}— 0 casos${OFF}`);
  } else {
    console.log(`${YELLOW}!${OFF} guías sin CSS propio: ${missing.join(", ")}`);
    console.log(`    ${DIM}(las 3 primeras guías son deuda conocida, ver AGENTS.md)${OFF}`);
  }
}

// ── Ejecución ─────────────────────────────────────────────────────────────
console.log("\nComprobaciones de código\n");
checkEslint();
checkMetadata();
checkDateReparse();
checkGuideCss();

if (problems.length) {
  console.log(`\n${RED}Falla la comprobación.${OFF} Qué hacer:\n`);
  for (const [rule, hint] of problems) console.log(`  · ${rule}\n    ${hint}\n`);
  process.exit(1);
}

console.log(`\n${GREEN}Todo correcto.${OFF}\n`);
