/**
 * Auditoría SEO de una página publicada, contra el HTML que se sirve de verdad.
 *
 *   npm run dev                              (en otra terminal)
 *   npm run check:seo -- /post/mi-slug
 *   npm run check:seo -- /guias/xrp
 *   npm run check:seo -- /glosario/exchange
 *
 * ── Qué es y qué no es ─────────────────────────────────────────────────────
 *
 * Es la parte MECÁNICA de la auditoría descrita en `AUDITORIA-SEO.md`: todo lo
 * que se puede contar. El criterio —si el texto responde de verdad a lo que se
 * busca, si el ejemplo aporta, si el título invita a pulsar— no lo mide ningún
 * script y va en el protocolo, paso a paso.
 *
 * Ejecutarlo NO sustituye a leer el documento. Sale en verde una página que
 * cumple todas las métricas y no responde a nada.
 *
 * ── Por qué contra el HTML servido ─────────────────────────────────────────
 *
 * Porque es lo que ve Google. Un `title` puede estar perfecto en el código y
 * salir duplicado por el `template` del layout; un enlace puede existir y
 * responder 307; un dato estructurado puede compilar y no describir lo que se
 * ve. Nada de eso se detecta leyendo el código.
 *
 * Necesita el servidor levantado, y por eso NO está en el hook de `pre-push`
 * —igual que `check:contenido`, que necesita credenciales.
 */
import { readFileSync } from "node:fs";

const RED = "\x1b[31m", GREEN = "\x1b[32m", YELLOW = "\x1b[33m", DIM = "\x1b[2m", OFF = "\x1b[0m";
const BASE = process.env.SEO_BASE || "http://localhost:3000";

/**
 * Se acepta con barra inicial y sin ella, y no es un capricho: Git Bash en
 * Windows convierte `/post/mi-slug` en `C:/Program Files/post/mi-slug` antes de
 * que el script lo vea. Escribiéndolo sin la barra no lo toca.
 */
let ruta = (process.argv[2] ?? "").trim();
// Por si aun así llega manglada.
const manglada = ruta.match(/^[A-Za-z]:[\\/].*?[\\/]((?:post|guias|glosario)[\\/].+)$/);
if (manglada) ruta = "/" + manglada[1].replace(/\\/g, "/");
if (ruta && !ruta.startsWith("/")) ruta = "/" + ruta;

if (!ruta || !/^\/(post|guias|glosario)\/[a-z0-9-]+$/.test(ruta)) {
  console.log(`
Uso:  npm run check:seo -- post/mi-slug
      npm run check:seo -- guias/xrp
      npm run check:seo -- glosario/exchange

  Sin la barra inicial: Git Bash la convierte en una ruta de Windows.
`);
  process.exit(1);
}

/** Umbrales por tipo. Una guía se recorre y una entrada se lee: no piden lo mismo. */
const PERFILES = {
  post: { min: 500, max: 1800, h2: 3, enlaces: 2, visuales: 1, nombre: "entrada" },
  guias: { min: 800, max: 6000, h2: 4, enlaces: 2, visuales: 1, nombre: "guía" },
  glosario: { min: 1200, max: 2200, h2: 4, enlaces: 5, visuales: 5, nombre: "ficha del diccionario" },
};
const tipo = ruta.split("/")[1];
const P = PERFILES[tipo] ?? PERFILES.post;

/**
 * Deuda aceptada por el admin, por ruta y por etiqueta de regla.
 *
 * Un fallo perdonado sale en amarillo y no cuenta: la pagina sigue diciendo
 * la verdad, pero deja de pedir una correccion que no va a llegar. Sin la
 * etiqueta en la llamada a `ok()`, un fallo no se puede perdonar nunca — que
 * es lo que evita que esto se convierta en la puerta de atras del auditor.
 */
const DEUDA_CONOCIDA = {
  // Decision del admin, 10-09-2026: el muro de registro de las guias no se
  // toca. Googlebot entra sin sesion, asi que ve las dos secciones abiertas
  // mas el reclamo: exactamente 3 H2, y de ahi no pasa mientras el muro este.
  // Ver TAREAS.md. La unica guia sin muro, fiscalidad, mide 9 H2 sin ayuda.
  "/guias/ciclos-de-bitcoin": ["h2", "palabras"],
  "/guias/que-es-la-blockchain": ["h2"],
  "/guias/hyperliquid": ["h2"],
  "/guias/render": ["h2"],
  "/guias/worldcoin": ["h2", "palabras"],
  "/guias/xrp": ["h2"],
};
const perdonadas = DEUDA_CONOCIDA[ruta] ?? [];

let fallos = 0, avisos = 0;
/** `regla` es la etiqueta con la que se perdona desde DEUDA_CONOCIDA. */
const ok = (c, etiqueta, detalle = "", regla = "") => {
  if (!c && regla && perdonadas.includes(regla)) {
    avisos++;
    console.log(`  ${YELLOW}!  ${OFF} ${etiqueta.padEnd(44)} ${DIM}${detalle} — deuda aceptada por el admin${OFF}`);
    return;
  }
  if (!c) fallos++;
  console.log(`  ${c ? GREEN + "OK " + OFF : RED + "✗  " + OFF} ${etiqueta.padEnd(44)} ${DIM}${detalle}${OFF}`);
};
const aviso = (etiqueta, detalle = "") => {
  avisos++;
  console.log(`  ${YELLOW}!  ${OFF} ${etiqueta.padEnd(44)} ${DIM}${detalle}${OFF}`);
};
const seccion = (t) => console.log(`\n${DIM}── ${t} ${"─".repeat(Math.max(0, 60 - t.length))}${OFF}`);

const texto = (h) => h.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim();

/**
 * Auditar un BORRADOR, iniciando sesión como admin.
 *
 * El sitio deja al admin ver una entrada sin publicar (`src/lib/borradores.ts`)
 * porque publicar manda un aviso a Telegram y auditar después de anunciar no
 * sirve de nada. Pero esa vista previa necesita una sesión, y este script pide
 * la página a pelo — así que sobre un borrador daba 404 y no se podía auditar
 * nada hasta publicarlo, que es justo lo que queríamos evitar.
 *
 * Esto abre una sesión real con un enlace mágico, usando la clave de servicio
 * que ya está en `.env.local`. Tres límites, y los tres importan:
 *
 * 1. **Solo contra localhost.** Contra producción no se intenta siquiera.
 * 2. **Solo si la página ha dado 404**, nunca en el camino normal.
 * 3. **No concede nada nuevo.** Quien puede correr esto ya tiene la clave de
 *    servicio delante, que da mucho más que ver un borrador.
 *
 * Lo que sale por pantalla lleva el aviso de que se está mirando un borrador:
 * una auditoría no puede confundirse sobre qué página está midiendo.
 */
/** Mismo cargador que `check:contenido`: aquí no hay Next que lea `.env.local`. */
function cargarEnv() {
  try {
    for (const linea of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
      const m = linea.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // En CI no hay `.env.local`. Sin él simplemente no se auditan borradores.
  }
}

async function sesionDeAdmin() {
  cargarEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !BASE.includes("localhost")) return null;

  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { data: perfiles } = await sb.from("profiles").select("id").eq("role", "admin").limit(1);
  if (!perfiles?.length) return null;
  const { data: cuenta } = await sb.auth.admin.getUserById(perfiles[0].id);
  if (!cuenta?.user?.email) return null;

  /**
   * No se sigue el enlace mágico por HTTP, se canjea su token.
   *
   * Seguirlo no funciona: `generateLink` devuelve el enlace apuntando a la
   * «Site URL» del proyecto —producción— porque `localhost` no está en la lista
   * de redirecciones permitidas de Supabase. La cookie acabaría puesta para
   * adelinacademy.com, que no sirve de nada aquí.
   *
   * Así que se canjea el `hashed_token` con la clave anónima, y con la sesión
   * resultante se arma a mano la cookie que espera `@supabase/ssr`:
   * `sb-<ref>-auth-token` = `base64-` + la sesión en JSON, en base64url.
   */
  const { data: enlace, error } = await sb.auth.admin.generateLink({
    type: "magiclink",
    email: cuenta.user.email,
  });
  if (error || !enlace?.properties?.hashed_token) return null;

  const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  const { data: sesion } = await anon.auth.verifyOtp({
    token_hash: enlace.properties.hashed_token,
    type: "email",
  });
  if (!sesion?.session) return null;

  const ref = new URL(url).hostname.split(".")[0];
  const valor = "base64-" + Buffer.from(JSON.stringify(sesion.session)).toString("base64url");
  return `sb-${ref}-auth-token=${valor}`;
}

let res = await fetch(BASE + ruta, { redirect: "manual" });
let enBorrador = false;

if (res.status === 404) {
  const cookie = await sesionDeAdmin();
  if (cookie) {
    const conSesion = await fetch(BASE + ruta, { redirect: "manual", headers: { cookie } });
    if (conSesion.status === 200) {
      res = conSesion;
      enBorrador = true;
    }
  }
}

if (res.status !== 200) {
  console.log(`\n${RED}La página devuelve ${res.status}.${OFF} Sin sesión tiene que dar 200 o no la indexa nadie.`);
  console.log(`${DIM}Si es un borrador, esto debería haber entrado con una sesión de admin: comprueba que hay servidor en localhost y clave de servicio en .env.local.${OFF}\n`);
  process.exit(1);
}
const html = await res.text();
const sinScripts = html.replace(/<script[\s\S]*?<\/script>/g, " ");

/**
 * El cuerpo del artículo, sin cabecera, CTA ni pie.
 *
 * Acotarlo importa más de lo que parece: sin esto se cuela el pie de página
 * entero y las cifras dejan de describir el artículo — daba 5.416 palabras en
 * una ficha de 1.445.
 */
const INICIOS = ['class="post-content', 'class="termino-body', 'class="gbc-wrap', "<main"];
const FINALES = ['<section class="termino-faq', '<section class="tvid', '<section class="termino-relacionados',
  'class="post-cierre', "<footer"];
const desde = INICIOS.map((m) => html.indexOf(m)).filter((i) => i >= 0)[0] ?? 0;
const finales = FINALES.map((m) => html.indexOf(m, desde)).filter((i) => i > 0);
const cuerpo = html.slice(desde, finales.length ? Math.min(...finales) : html.length);

console.log(`\n${DIM}Auditoría SEO · ${P.nombre}${OFF}\n  ${BASE}${ruta}`);
if (enBorrador) {
  console.log(`  ${YELLOW}BORRADOR${OFF} ${DIM}· leído con sesión de admin. Los metadatos de indexación`);
  console.log(`           no se comprueban aquí: un borrador lleva noindex y no lleva`);
  console.log(`           canónica a propósito. Vuelve a pasarlo tras publicar.${OFF}`);
}

// ── 1. Metadatos ──────────────────────────────────────────────────────────
seccion("METADATOS");
// El «[Borrador] » que antepone la vista previa no viaja a la página publicada,
// así que no cuenta para el límite de 60: dejarlo daba un fallo falso de 64.
const title = (html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "").replace(/^\[Borrador\]\s*/, "");
const desc = html.match(/name="description" content="([^"]*)"/)?.[1] ?? "";
const canon = html.match(/rel="canonical" href="([^"]*)"/)?.[1] ?? "";
const og = html.match(/property="og:title" content="([^"]*)"/)?.[1] ?? "";

ok(title.length > 0 && title.length <= 60, "title ≤ 60 (se corta ahí en Google)", `${title.length} · ${title}`);
ok(!/\|\s*AdelinBTC[\s\S]*\|\s*AdelinBTC/.test(title), "sufijo de marca sin duplicar");
ok(desc.length >= 110 && desc.length <= 160, "description entre 110 y 160", `${desc.length}`);

/**
 * Estas tres solo tienen sentido sobre la página publicada.
 *
 * Un borrador lleva `noindex, nofollow` y **no** lleva canónica, y las dos
 * cosas son correctas —ver `src/lib/borradores.ts`—. Darlas por fallo aquí
 * enseñaría a ignorar dos fallos que sobre una página publicada son graves,
 * que es la peor cosa que puede hacer un validador.
 */
if (enBorrador) {
  aviso("canónica · noindex · description", "no se miden en un borrador");
} else {
  ok(canon.startsWith("https://") && canon.endsWith(ruta), "canónica apunta a sí misma", canon);
  ok(!/noindex/i.test(html), "sin noindex");
}
ok(/<html[^>]*lang="es"/.test(html), "idioma declarado");
og ? ok(true, "openGraph con título propio", `${og.length} car`) : aviso("openGraph", "sin og:title propio");

// ── 2. Estructura semántica ───────────────────────────────────────────────
seccion("ESTRUCTURA");
const enc = [...sinScripts.matchAll(/<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/g)].map((m) => ({ n: +m[1][1], t: texto(m[2]) }));
const h1 = enc.filter((e) => e.n === 1);
ok(h1.length === 1, "exactamente un H1", h1.map((h) => h.t).join(" | ") || "ninguno");
let saltos = 0;
for (let i = 1; i < enc.length; i++) if (enc[i].n > enc[i - 1].n + 1) saltos++;
ok(saltos === 0, "sin saltos de nivel (h2 → h4)", `${saltos}`);
const h2 = [...cuerpo.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => texto(m[1]));
ok(h2.length >= P.h2, `≥ ${P.h2} H2 en el cuerpo`, `${h2.length}`, "h2");
const h2Vacios = h2.filter((h) => h.split(/\s+/).length < 2).length;
ok(h2Vacios === 0, "ningún H2 de una sola palabra", `${h2Vacios}`);

// ── 3. Contenido ──────────────────────────────────────────────────────────
seccion("CONTENIDO");
const n = texto(cuerpo).split(/\s+/).filter(Boolean).length;
ok(n >= P.min, `≥ ${P.min} palabras`, `${n}`, "palabras");
ok(n <= P.max, `≤ ${P.max} palabras`, `${n}`);

/**
 * La palabra clave que se mide.
 *
 * Sale del SLUG, no del title, y esto costó tres fallos falsos. El title lleva
 * coletillas —«qué es un», «de criptomonedas»— y deducirla de ahí devolvía la
 * frase entera, que no aparece literal en ningún párrafo: la primera ficha
 * auditada marcaba 0,00 % de densidad estando bien optimizada. El slug es lo
 * más parecido a la consulta por la que se quiere posicionar.
 *
 * Dos cosas más, y las dos salieron de auditar entradas reales:
 *
 * 1. **Se compara sin tildes.** El slug dice `metodo-fifo` y el texto escribe
 *    «método FIFO». Para Google son la misma consulta; para una expresión
 *    regular no, y la densidad salía a cero.
 * 2. **Si la frase entera no aparece, se acorta por el final.** De
 *    `metodo-fifo-criptomonedas` se prueba «metodo fifo criptomonedas», luego
 *    «metodo fifo», luego «metodo»: se mide la más larga que exista de verdad,
 *    que es la que describe la página. La línea de abajo dice cuál se midió.
 *
 * Y siempre manda la que se imponga a mano — obligatorio cuando el slug y la
 * consulta objetivo no coinciden, que es lo normal en una entrada de noticia:
 *
 *   npm run check:seo -- post/mi-slug "market cap"
 */
const VACIAS = new Set(["el", "la", "los", "las", "un", "una", "de", "del", "y", "o", "en",
  "que", "es", "como", "para", "por", "con", "sin", "su", "sus", "al", "lo"]);
/**
 * Sin tildes: para Google «método» y «metodo» son la misma consulta, y sin esto
 * la densidad de una entrada bien escrita salía a cero. El rango del replace es
 * el bloque de marcas diacríticas combinantes (U+0300 a U+036F), que es lo que
 * deja suelto el normalize("NFD") — se ve vacío porque no se pintan solas.
 */
const plano = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const t = plano(texto(cuerpo));
const cuenta = (k) => (k ? (t.match(new RegExp(`\\b${plano(k).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g")) ?? []).length : 0);

/**
 * Todo lo que venga después de la ruta es la palabra clave, junto.
 *
 * No es `argv[3]` a secas porque **npm se come las comillas**: al escribir
 *   npm run check:seo -- post/mi-slug "market cap"
 * el script recibe «market» y «cap» como dos argumentos sueltos, y medía solo
 * el primero. Con el join da igual cómo sobrevivan las comillas.
 */
const impuesta = process.argv.slice(3).join(" ").trim();
const palabrasSlug = ruta.split("/").pop().split("-");
/**
 * Todas las frases seguidas que caben en el slug, no solo los principios.
 *
 * Recortar solo por el final no basta: `metodo-fifo-criptomonedas` daba
 * «metodo fifo» y «metodo», y el texto de esa entrada dice «FIFO» ocho veces
 * sin escribir «método» ni una. La que describe la página está en medio.
 *
 * Se queda con la más larga que aparezca de verdad, y a igual longitud con la
 * más repetida. Si no aparece ninguna, se mide la frase entera: el fallo es
 * real —la página no nombra aquello por lo que quiere posicionar— y tiene que
 * verse en rojo, no taparse con un sucedáneo.
 */
const trozos = [];
for (let i = 0; i < palabrasSlug.length; i++)
  for (let j = i + 1; j <= palabrasSlug.length; j++) {
    const p = palabrasSlug.slice(i, j);
    if (VACIAS.has(p[0]) || VACIAS.has(p.at(-1))) continue;
    trozos.push({ frase: p.join(" "), largo: p.length });
  }
const candidatas = impuesta
  ? [{ frase: impuesta, largo: 99 }]
  : trozos
      .map((c) => ({ ...c, veces: cuenta(c.frase) }))
      .filter((c) => c.veces > 0)
      .sort((a, b) => b.largo - a.largo || b.veces - a.veces);

const entera = palabrasSlug.join(" ");
const keyword = candidatas[0]?.frase ?? entera;

/**
 * Una consulta de varias palabras NO se mide como frase literal.
 *
 * En español el orden cambia: el `focus_keyword` es «injective hackeo» y el
 * texto dice «el hackeo de Injective». Buscando la frase exacta salía 0,00 % en
 * una entrada perfectamente optimizada, y con ella tres fallos más —no está en
 * el title, ni en el H1, ni en la description—, todos falsos. Google no exige
 * ese orden, así que este script tampoco.
 *
 * Cuando la frase entera no aparece literal, se miden **sus palabras con peso,
 * una a una**, y manda la más floja: la consulta se cubre si están todas, no si
 * están en fila. Lo mismo para el title, el H1 y la description.
 */
const partes = keyword.split(" ").filter((p) => p.length > 2 && !VACIAS.has(p));
const porPalabras = cuenta(keyword) === 0 && partes.length > 1;
const veces = porPalabras ? Math.min(...partes.map(cuenta)) : cuenta(keyword);
const origen = impuesta ? "impuesta a mano" : keyword === entera ? "del slug" : "del slug, ajustada a lo que el texto usa";
const densidad = n ? (veces / n) * 100 : 0;

/** ¿Están todas las palabras de la consulta en este trozo de texto? */
const cubre = (s) => (porPalabras ? partes.every((p) => plano(s).includes(p)) : plano(s).includes(plano(keyword)));

console.log(`  ${DIM}    palabra clave medida (${origen}): «${keyword}»${OFF}`);
if (porPalabras) {
  console.log(`  ${DIM}    la frase exacta no aparece; se mide por palabras: ${partes.map((p) => `${p} ${cuenta(p)}`).join(" · ")}${OFF}`);
}
ok(densidad >= 0.4, "SUELO de densidad ≥ 0,4 %", `${veces} veces · ${densidad.toFixed(2)} %${porPalabras ? " (la más floja)" : ""}`);
ok(densidad <= 2.5, "TECHO de densidad ≤ 2,5 %", `${densidad.toFixed(2)} %`);
ok(keyword && cubre(title), "keyword en el title");
ok(keyword && cubre(h1[0]?.t ?? ""), "keyword en el H1");
ok(keyword && cubre(desc), "keyword en la description");
const primer = texto(cuerpo.match(/<p(?:s[^>]*)?>([\s\S]*?)<\/p>/)?.[1] ?? "");
cubre(primer) ? ok(true, "keyword en el primer párrafo") : aviso("keyword en el primer párrafo", "no aparece entera");

// Ojo con la expresion: `<p(?:s...)?>` y no `<p[^>]*>`. La segunda tambien
// casa con los <path> de los iconos SVG del menu, y entonces el «parrafo» iba
// desde un icono hasta el primer </p> de la pagina, tragandose el menu entero.
// Daba por malos un parrafo de 123 palabras y una frase de 45 que no existian.
// Lo cazo la auditoria de la guia de fiscalidad.
// Legibilidad. Se mide párrafo a párrafo: las listas y las etiquetas de los
// gráficos no llevan punto y al concatenarlas salen «frases» que no existen.
const frases = [...cuerpo.matchAll(/<p(?:s[^>]*)?>([\s\S]*?)<\/p>/g)]
  .flatMap((m) => texto(m[1]).split(/(?<=[.!?])\s+/))
  .filter((f) => f.split(/\s+/).length > 3);
const media = frases.length ? Math.round(frases.reduce((a, f) => a + f.split(/\s+/).length, 0) / frases.length) : 0;
const largas = frases.filter((f) => f.split(/\s+/).length > 40).length;
ok(media <= 24, "frase media ≤ 24 palabras", `${media}`);
ok(largas === 0, "sin frases de más de 40 palabras", `${largas}`);
const parrafosLargos = [...cuerpo.matchAll(/<p(?:s[^>]*)?>([\s\S]*?)<\/p>/g)]
  .filter((m) => texto(m[1]).split(/\s+/).length > 120).length;
ok(parrafosLargos === 0, "sin párrafos de más de 120 palabras", `${parrafosLargos}`);

// ── 4. Enlazado ───────────────────────────────────────────────────────────
seccion("ENLAZADO");
const salientes = [...new Set([...cuerpo.matchAll(/href="(\/[^"#]+)"/g)].map((m) => m[1]))];
ok(salientes.length >= P.enlaces, `≥ ${P.enlaces} enlaces internos salientes`, `${salientes.length}`);
let rotos = 0;
for (const h of salientes) {
  const c = (await fetch(BASE + h, { redirect: "manual" })).status;
  if (c !== 200) { rotos++; console.log(`      ${RED}✗${OFF} ${c} ${h}`); }
}
ok(rotos === 0, "ningún enlace saliente roto", `${salientes.length} comprobados`);
const externos = [...cuerpo.matchAll(/href="https?:\/\/([^/"]+)/g)].map((m) => m[1])
  .filter((d) => !d.includes("adelinacademy"));
ok(externos.length === 0, "sin enlaces externos en el cuerpo", externos.join(" "));

/**
 * ENLACES ENTRANTES. El paso que casi nadie da y el que más pesa: una página a
 * la que no apunta nada es huérfana, y Google la trata como tal por buena que
 * sea. Se recorre el sitemap y se cuenta quién la enlaza.
 */
const sitemap = await (await fetch(BASE + "/sitemap.xml")).text();
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => m[1].replace(/^https?:\/\/[^/]+/, ""))
  .filter((u) => u !== ruta);
let entrantes = 0;
const quien = [];
for (const u of urls) {
  const r = await fetch(BASE + u).catch(() => null);
  if (!r?.ok) continue;
  const h = await r.text();
  const cuerpoOtro = h.slice(h.indexOf("<main"), h.indexOf("<footer") > 0 ? h.indexOf("<footer") : undefined);
  if (new RegExp(`href="${ruta}"`).test(cuerpoOtro)) { entrantes++; quien.push(u); }
}
// En un borrador, cero entrantes es lo normal y no es un fallo todavía: nadie
// puede enlazar a una URL que da 404. Pero se avisa, porque los enlaces hay que
// dejarlos escritos y aplicarlos EN EL MISMO MINUTO en que se publica.
if (enBorrador && entrantes < 2) {
  aviso("≥ 2 enlaces internos ENTRANTES", `${entrantes} — créalos al publicar o nace huérfana`);
} else {
  entrantes >= 2
    ? ok(true, "≥ 2 enlaces internos ENTRANTES", `${entrantes} · ${quien.slice(0, 3).join(" ")}`)
    : ok(false, "≥ 2 enlaces internos ENTRANTES", `${entrantes} — es una página huérfana`);
}

// ── 5. Datos estructurados ────────────────────────────────────────────────
seccion("DATOS ESTRUCTURADOS");
const tipos = [];
let jsonRoto = 0;
for (const b of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
  try {
    const j = JSON.parse(b[1].replace(/\\u003c/g, "<"));
    for (const nodo of j["@graph"] ?? [j]) tipos.push(nodo["@type"]);
  } catch { jsonRoto++; }
}
ok(jsonRoto === 0, "todo el JSON-LD parsea", `${jsonRoto} roto(s)`);
ok(tipos.includes("BreadcrumbList"), "BreadcrumbList", tipos.join(" · "));
if (tipo === "post") ok(tipos.includes("Article"), "Article");
if (tipo === "glosario") ok(tipos.includes("DefinedTerm"), "DefinedTerm");
// Un esquema que declara algo que el visitante no ve es spam estructurado.
if (tipos.includes("FAQPage")) {
  const preguntas = (html.match(/"@type":"Question"/g) ?? []).length;
  const visibles = (html.match(/<summary/g) ?? []).length;
  ok(visibles >= preguntas, "las preguntas del esquema se ven", `${preguntas} en esquema · ${visibles} visibles`);
}

// ── 6. Imágenes y rendimiento ─────────────────────────────────────────────
seccion("IMÁGENES Y CARGA");
const imgs = [...sinScripts.matchAll(/<img[^>]*>/g)].map((m) => m[0]);
ok(imgs.filter((i) => !/alt=/.test(i)).length === 0, "todas las imágenes con alt", `${imgs.length} imágenes`);
const sinLazy = imgs.filter((i) => !/loading="lazy"|priority/.test(i)).length;
sinLazy > 1 ? aviso("imágenes sin lazy ni priority", `${sinLazy}`) : ok(true, "carga de imágenes declarada");
ok(html.length < 400_000, "HTML por debajo de 400 KB", `${Math.round(html.length / 1024)} KB`);

// ── 7. Rastreo ────────────────────────────────────────────────────────────
seccion("RASTREO E INDEXACIÓN");
const robots = await (await fetch(BASE + "/robots.txt")).text();
const bloqueada = robots.split(/\r?\n/)
  .filter((l) => l.startsWith("Disallow:"))
  .map((l) => l.replace("Disallow:", "").trim())
  .filter((p) => p && ruta.startsWith(p));
ok(bloqueada.length === 0, "robots.txt no la bloquea (por PREFIJO)", bloqueada.join(" "));
// Un borrador NO tiene que estar en el sitemap — de hecho, que estuviera sería
// el fallo. Se comprueba lo contrario.
enBorrador
  ? ok(!sitemap.includes(ruta + "<"), "un borrador NO está en el sitemap", "correcto")
  : ok(sitemap.includes(ruta + "<"), "está en el sitemap", ruta);

// ── Resultado ─────────────────────────────────────────────────────────────
console.log(
  `\n  ${fallos === 0 ? GREEN + "SIN FALLOS" + OFF : RED + fallos + " FALLO(S)" + OFF}` +
  ` · ${avisos} aviso(s)\n` +
  `  ${DIM}Esto es solo la parte mecánica. El criterio va en AUDITORIA-SEO.md.${OFF}\n`
);
process.exit(fallos ? 1 : 0);
