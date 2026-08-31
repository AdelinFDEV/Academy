/**
 * Guardarraíl del CONTENIDO.
 *
 *   npm run check:contenido            → revisa todas las entradas publicadas
 *   npm run check:contenido -- <slug>  → revisa una sola, publicada o borrador
 *
 * `npm run check` valida el código. Pero una entrada del blog no es código: es
 * una fila en Supabase, y hasta el 31-08-2026 **no la comprobaba nadie**. Todas
 * las reglas que salieron de los 12 puntos del plan SEO —longitud, límites de
 * título y descripción, gráfico obligatorio, enlaces internos, portada en
 * WebP— dependían de que quien escribiera se acordara. Este script las convierte
 * en una comprobación mecánica.
 *
 * Por qué NO va en el hook de `pre-push` como `npm run check`: necesita
 * credenciales de Supabase y salir a la red. En CI no hay secretos y el hook
 * dejaría de funcionar en cualquier clon sin `.env.local`. Se ejecuta a mano,
 * y es obligatorio **antes de publicar** (ver `/admin/posts-instrucciones`).
 *
 * Sale con código 1 si algo falla, y dice qué entrada y qué regla.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const RED = "\x1b[31m", GREEN = "\x1b[32m", YELLOW = "\x1b[33m", DIM = "\x1b[2m", OFF = "\x1b[0m";

// ── Las reglas, en un solo sitio ────────────────────────────────────────────
// Si alguna cambia, se cambia aquí y en /admin/posts-instrucciones, que es lo
// que lee quien escribe.
const R = {
  PALABRAS_MIN: 500,
  PALABRAS_MAX: 1500,
  TITULO_MAX: 48,        // 60 que muestra Google − 12 del sufijo " | AdelinBTC"
  DESC_MAX: 160,
  ENLACES_MIN: 2,
  ENLACES_MAX: 4,
  GRAFICOS_MIN: 1,
  PORTADA_MAX_KB: 500,
};

/**
 * Deuda conocida: entradas anteriores a que la regla existiera, que el admin ha
 * decidido dejar como están (31-08-2026).
 *
 * Salen como aviso en vez de como fallo. **Esto no es una puerta de atrás para
 * saltarse una regla**: una entrada nueva que no cumpla tiene que arreglarse, no
 * añadirse aquí. Existe porque un validador que siempre sale en rojo acaba
 * ignorándose, y entonces no sirve para nada.
 */
const DEUDA_CONOCIDA = {
  "solana-alpenglow-2026": ["palabras"],
  "ethereum-glamsterdam-2026": ["palabras"],
};

/** Vocabulario permitido en `content` (ver bloque 06 de las instrucciones). */
const ETIQUETAS = new Set([
  "h1", "h2", "h3", "h4", "p", "strong", "em", "a", "ul", "ol", "li",
  "blockquote", "pre", "code", "hr", "table", "thead", "tbody", "tr", "th", "td",
  "img", "div", "span", "br",
]);

/** Rutas públicas sin slug dinámico a las que sí se puede enlazar. */
const RUTAS_FIJAS = new Set([
  "/", "/articulos", "/guias", "/glosario", "/premium", "/asesoria",
  "/aviso-legal", "/privacidad", "/cookies",
]);

function cargarEnv() {
  try {
    for (const linea of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
      const m = linea.match(/^([A-Z_]+)=(.*)$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // En CI no hay .env.local; se avisa más abajo y se sale sin fallar.
  }
}

/** Destinos internos válidos: términos con página, guías dadas de alta y entradas. */
function destinosValidos(slugsEntradas) {
  const validos = new Set(RUTAS_FIJAS);

  const glosario = readFileSync("src/lib/glosario.ts", "utf8");
  // Solo los términos con `extended`: sin él la ruta devuelve 404.
  for (const bloque of glosario.split("  {").slice(1)) {
    const slug = bloque.match(/slug: "([^"]*)"/)?.[1];
    if (slug && bloque.includes("extended:")) validos.add(`/glosario/${slug}`);
  }

  const guias = readFileSync("src/lib/guides.ts", "utf8");
  for (const m of guias.matchAll(/slug: "([^"]*)"/g)) validos.add(`/guias/${m[1]}`);

  for (const s of slugsEntradas) validos.add(`/post/${s}`);
  return validos;
}

const problemas = [];

async function revisar(post, validos) {
  const fallos = [];
  const avisos = [];
  const perdonadas = DEUDA_CONOCIDA[post.slug] ?? [];

  /**
   * `regla` es la etiqueta con la que se puede perdonar el fallo desde
   * DEUDA_CONOCIDA. Sin ella, el fallo no se puede perdonar nunca.
   */
  const mal = (m, regla) => {
    if (regla && perdonadas.includes(regla)) {
      avisos.push(`${m} ${DIM}— deuda conocida, aceptada por el admin${OFF}`);
      return;
    }
    fallos.push(m);
  };

  const contenido = post.content ?? "";
  const texto = contenido.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const palabras = texto ? texto.split(" ").length : 0;

  // ── Longitud ──────────────────────────────────────────────────────────────
  if (palabras < R.PALABRAS_MIN || palabras > R.PALABRAS_MAX) {
    mal(`${palabras} palabras, fuera del rango ${R.PALABRAS_MIN}-${R.PALABRAS_MAX}`, "palabras");
  }

  // ── SEO ───────────────────────────────────────────────────────────────────
  const titulo = post.seo_title || post.title || "";
  if (!post.seo_title) avisos.push("sin seo_title propio: se usa el título de la entrada");
  if ([...titulo].length > R.TITULO_MAX) {
    mal(`título de ${[...titulo].length} caracteres, el máximo es ${R.TITULO_MAX} (Google corta en 60 y el sufijo ocupa 12)`);
  }
  const desc = post.meta_description || "";
  if (!desc) mal("sin meta_description");
  else if ([...desc].length > R.DESC_MAX) mal(`meta_description de ${[...desc].length} caracteres, el máximo es ${R.DESC_MAX}`);
  if (!post.focus_keyword) mal("sin focus_keyword");
  if (!post.excerpt) mal("sin excerpt: es lo que se ve en las tarjetas del listado");
  if (!post.category_id) mal("sin categoría asignada");

  // ── Gráfico obligatorio ───────────────────────────────────────────────────
  const graficos = contenido.split('<div class="prose-chart">').slice(1);
  if (graficos.length < R.GRAFICOS_MIN) mal("sin ningún .prose-chart, y es obligatorio");
  graficos.forEach((g, i) => {
    const anchos = [...g.matchAll(/width:\s*(\d+)%/g)].map((m) => Number(m[1]));
    if (anchos.length && Math.max(...anchos) !== 100) {
      mal(`gráfico ${i + 1}: ninguna barra llega al 100% (la mayor es ${Math.max(...anchos)}%). El ancho es (valor / valor_más_alto) × 100`);
    }
  });

  // ── Enlaces ───────────────────────────────────────────────────────────────
  const enlaces = [...contenido.matchAll(/<a\s+href="([^"]*)"/g)].map((m) => m[1]);
  const externos = enlaces.filter((h) => /^https?:/i.test(h));
  const internos = enlaces.filter((h) => h.startsWith("/"));
  if (externos.length) mal(`${externos.length} enlace(s) externo(s), y no se permiten: ${externos.join(", ")}`);
  if (internos.length < R.ENLACES_MIN) mal(`${internos.length} enlaces internos, el mínimo es ${R.ENLACES_MIN}`);
  if (internos.length > R.ENLACES_MAX) avisos.push(`${internos.length} enlaces internos, lo recomendado son ${R.ENLACES_MIN}-${R.ENLACES_MAX}`);
  for (const h of internos) {
    if (!validos.has(h.split("#")[0])) mal(`enlace a "${h}", que no existe (un término sin \`extended\` da 404, y una guía fuera de GUIDES tampoco existe)`);
  }
  if (/pincha aquí|haz clic aquí|clic aquí|más información aquí/i.test(contenido)) {
    mal('ancla genérica tipo "pincha aquí": el texto del enlace tiene que decir de qué va el destino');
  }

  // ── HTML ──────────────────────────────────────────────────────────────────
  const usadas = new Set([...contenido.matchAll(/<\/?([a-z0-9]+)[^>]*>/gi)].map((m) => m[1].toLowerCase()));
  const prohibidas = [...usadas].filter((t) => !ETIQUETAS.has(t));
  if (prohibidas.length) mal(`etiquetas fuera de la lista permitida: ${prohibidas.join(", ")}`);
  const p1 = (contenido.match(/<p[ >]/g) || []).length, p2 = (contenido.match(/<\/p>/g) || []).length;
  if (p1 !== p2) mal(`${p1} <p> y ${p2} </p>`);
  const d1 = (contenido.match(/<div[ >]/g) || []).length, d2 = (contenido.match(/<\/div>/g) || []).length;
  if (d1 !== d2) mal(`${d1} <div> y ${d2} </div>`);
  if (/<script|onerror=|onclick=|javascript:/i.test(contenido)) mal("contiene algo ejecutable, y el HTML se inyecta con dangerouslySetInnerHTML");

  // ── Portada ───────────────────────────────────────────────────────────────
  if (!post.cover_image) {
    mal("sin cover_image");
  } else if (!/^https?:\/\/[^/]*supabase\.co\//.test(post.cover_image)) {
    mal("la portada no está en Supabase Storage: nunca se enlaza una imagen externa");
  } else if (!post.cover_image.toLowerCase().endsWith(".webp")) {
    mal("la portada no es WebP. Regla desde el 31-08-2026: 1600 px de ancho y calidad 82");
  } else {
    try {
      const res = await fetch(post.cover_image, { method: "HEAD" });
      if (!res.ok) mal(`la portada devuelve ${res.status}`);
      else {
        const kb = Math.round((Number(res.headers.get("content-length")) || 0) / 1024);
        if (kb > R.PORTADA_MAX_KB) mal(`la portada pesa ${kb} KB, el máximo son ${R.PORTADA_MAX_KB}`);
      }
    } catch {
      avisos.push("no se pudo comprobar el peso de la portada (¿sin red?)");
    }
  }

  return { fallos, avisos, palabras, enlaces: internos.length, graficos: graficos.length };
}

// ── Main ────────────────────────────────────────────────────────────────────
cargarEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("\nComprobaciones de contenido\n");

if (!url || !key) {
  console.log(`${YELLOW}!${OFF} Sin credenciales de Supabase en .env.local: no se puede revisar el contenido.`);
  console.log(`  ${DIM}Es lo esperado en CI. En local, copia .env.local.example y rellénalo.${OFF}\n`);
  process.exit(0);
}

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const soloSlug = process.argv[2];
let query = supabase
  .from("posts")
  .select("slug, title, excerpt, content, cover_image, category_id, published, seo_title, meta_description, focus_keyword")
  .order("created_at", { ascending: false });
query = soloSlug ? query.eq("slug", soloSlug) : query.eq("published", true);

const { data: posts, error } = await query;
if (error) { console.error(error); process.exit(1); }
if (!posts.length) {
  console.log(`${RED}✗${OFF} No hay ninguna entrada${soloSlug ? ` con slug "${soloSlug}"` : " publicada"}.\n`);
  process.exit(1);
}

const validos = destinosValidos(posts.map((p) => p.slug));
// Los destinos se calculan con las entradas devueltas; al revisar una sola,
// hacen falta también las demás para validar enlaces entre entradas.
if (soloSlug) {
  const { data: todas } = await supabase.from("posts").select("slug").eq("published", true);
  for (const p of todas ?? []) validos.add(`/post/${p.slug}`);
}

let conFallos = 0;
for (const post of posts) {
  const r = await revisar(post, validos);
  const etiqueta = post.published ? "" : ` ${DIM}(borrador)${OFF}`;

  if (r.fallos.length === 0) {
    console.log(`${GREEN}✓${OFF} ${post.slug}${etiqueta} ${DIM}— ${r.palabras} palabras, ${r.enlaces} enlaces, ${r.graficos} gráfico(s)${OFF}`);
  } else {
    conFallos++;
    console.log(`${RED}✗${OFF} ${post.slug}${etiqueta}`);
    r.fallos.forEach((f) => console.log(`    ${RED}·${OFF} ${f}`));
    problemas.push(post.slug);
  }
  r.avisos.forEach((a) => console.log(`    ${YELLOW}!${OFF} ${DIM}${a}${OFF}`));
}

console.log();
if (conFallos === 0) {
  console.log(`${GREEN}Todo correcto.${OFF} ${DIM}${posts.length} entrada(s) revisada(s).${OFF}\n`);
  process.exit(0);
}
console.log(`${RED}Falla la comprobación.${OFF} ${conFallos} de ${posts.length} entrada(s) con problemas.`);
console.log(`${DIM}Las reglas completas están en /admin/posts-instrucciones y en AGENTS.md.${OFF}\n`);
process.exit(1);
