/**
 * Auditoría SEO de una ficha del diccionario, contra el HTML que se sirve.
 *
 *   npm run dev                       (en otra terminal)
 *   npm run check:ficha -- exchange
 *
 * ── Por qué contra el HTML y no contra el código ───────────────────────────
 *
 * `check:glosario` mira el texto en `glosario.ts`: longitud, enlaces, densidad.
 * Esto mira la PÁGINA: el title que sale de verdad, la jerarquía de
 * encabezados con la cabecera y el pie incluidos, los datos estructurados ya
 * serializados y si algún enlace interno responde 200. Son cosas distintas y
 * ninguna sustituye a la otra.
 *
 * Necesita el servidor de desarrollo levantado, y por eso NO está en el hook
 * de pre-push — igual que `check:contenido`, que necesita credenciales.
 *
 * Cuidado con lo que mide: el cuerpo se acota a lo que hay entre el texto y la
 * primera sección posterior. Sin eso se cuela el pie de página entero y las
 * cifras dejan de describir el artículo — pasó al escribirlo, y daba 5.416
 * palabras en una ficha de 1.445.
 */
const slug = process.argv[2] ?? "exchange";
const BASE = "http://localhost:3000";
const url = `${BASE}/glosario/${slug}`;

const html = await (await fetch(url)).text();
// El cuerpo del artículo, sin la navegación ni los bloques de CTA.
// El cuerpo acaba en lo primero que venga después: la FAQ, el vídeo o los
// términos relacionados. Sin acotarlo, se cuela el pie de página entero y las
// cifras dejan de medir el artículo.
const desde = html.indexOf('class="termino-body');
const finales = ['<section class="termino-faq', '<section class="tvid', '<section class="termino-relacionados', '<footer']
  .map((m) => html.indexOf(m, desde))
  .filter((i) => i > 0);
const cuerpo = desde < 0 ? "" : html.slice(desde, Math.min(...finales));

const sinScripts = html.replace(/<script[\s\S]*?<\/script>/g, " ");
const texto = (h) => h.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim();
const palabras = (h) => texto(h).split(/\s+/).filter(Boolean).length;

let fallos = 0, avisos = 0;
const ok = (c, etiqueta, detalle = "") => { if (!c) fallos++; console.log(`  ${c ? "OK " : "✗  "} ${etiqueta.padEnd(46)} ${detalle}`); };
const nota = (etiqueta, detalle) => { avisos++; console.log(`  !   ${etiqueta.padEnd(46)} ${detalle}`); };

console.log(`\n═══ ${url} ═══\n`);

// ── 1. Metadatos ──
console.log("METADATOS");
const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
const desc = html.match(/name="description" content="([^"]*)"/)?.[1] ?? "";
const canon = html.match(/rel="canonical" href="([^"]*)"/)?.[1] ?? "";
ok(title.length > 0 && title.length <= 60, "title ≤ 60 con sufijo", `${title.length} · ${title}`);
ok(desc.length >= 110 && desc.length <= 160, "description 110-160", `${desc.length}`);
ok(canon.endsWith(`/glosario/${slug}`), "canónica correcta", canon);
ok(!/noindex/i.test(html), "sin noindex");
ok(/lang="es"/.test(html), "idioma declarado");

// ── 2. Encabezados ──
console.log("\nENCABEZADOS");
const enc = [...sinScripts.matchAll(/<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/g)].map((m) => ({ n: Number(m[1][1]), t: texto(m[2]) }));
const h1 = enc.filter((e) => e.n === 1);
ok(h1.length === 1, "exactamente un H1", h1.map((h) => h.t).join(" | "));
let saltos = 0;
for (let i = 1; i < enc.length; i++) if (enc[i].n > enc[i - 1].n + 1) saltos++;
ok(saltos === 0, "sin saltos de nivel (h2→h4)", `${saltos}`);
const h2Cuerpo = [...cuerpo.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => texto(m[1]));
ok(h2Cuerpo.length >= 4, "≥ 4 H2 en el cuerpo", `${h2Cuerpo.length}`);

// ── 3. Longitud y densidad ──
console.log("\nCONTENIDO");
const n = palabras(cuerpo);
ok(n >= 1000, "≥ 1000 palabras para competir", `${n}`);
ok(n <= 2200, "≤ 2200 (por encima suele sobrar)", `${n}`);
const t = texto(cuerpo).toLowerCase();
const term = slug.replace(/-/g, " ");
const veces = (t.match(new RegExp(`\\b${term}\\b`, "g")) ?? []).length;
const densidad = (veces / n) * 100;
ok(densidad < 2.5, "densidad del término < 2,5 %", `${veces} veces · ${densidad.toFixed(2)} %`);
ok(densidad > 0.25, "el término aparece lo suficiente", `${densidad.toFixed(2)} %`);

// ¿Está la keyword donde Google la busca?
const primerParrafo = texto(cuerpo.match(/<p[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? "").toLowerCase();
ok(title.toLowerCase().includes(term), "keyword en el title");
ok(texto(h1[0]?.t ?? "").toLowerCase().includes(term), "keyword en el H1");
ok(desc.toLowerCase().includes(term), "keyword en la description");
const enH2 = h2Cuerpo.filter((h) => h.toLowerCase().includes(term)).length;
enH2 > 0 ? ok(true, "keyword en algún H2", `${enH2}`) : nota("keyword en algún H2", "0 — natural si los H2 son buenos");

// Frases largas: el público es principiante.
// Se miden SOLO los <p>, uno a uno. Todo lo demás —etiquetas de gráfico,
// cifras destacadas, puntos de la comparativa— vive en <span> y <li> sin punto
// final, y al concatenarlo salían «frases» de cien palabras que no existen.
// Medir párrafo a párrafo también evita que una frase se parta entre dos.
const frases = [...cuerpo.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)]
  .flatMap((m) => texto(m[1]).split(/(?<=[.!?])\s+/))
  .filter((f) => f.split(/\s+/).length > 3);
const largas = frases.filter((f) => f.split(/\s+/).length > 40).length;
const media = Math.round(frases.reduce((a, f) => a + f.split(/\s+/).length, 0) / frases.length);
ok(media <= 24, "frase media ≤ 24 palabras", `${media}`);
ok(largas === 0, "sin frases de más de 40 palabras", `${largas}`);

// ── 4. Enlaces ──
console.log("\nENLACES");
const internos = [...new Set([...cuerpo.matchAll(/href="(\/[^"#]*)"/g)].map((m) => m[1]))];
ok(internos.length >= 5, "≥ 5 enlaces internos en el cuerpo", `${internos.length}`);
let rotos = 0;
for (const h of internos) {
  const c = (await fetch(BASE + h, { redirect: "manual" })).status;
  if (c !== 200) { rotos++; console.log(`        ✗ ${c} ${h}`); }
}
ok(rotos === 0, "ningún enlace interno roto", `${internos.length} comprobados`);
const externos = [...cuerpo.matchAll(/href="(https?:[^"]*)"/g)].length;
ok(externos === 0, "sin enlaces externos en el cuerpo", `${externos}`);

// ── 5. Imágenes ──
console.log("\nIMÁGENES");
const imgs = [...sinScripts.matchAll(/<img[^>]*>/g)].map((m) => m[0]);
const sinAlt = imgs.filter((i) => !/alt=/.test(i)).length;
ok(sinAlt === 0, "todas las imágenes con alt", `${imgs.length} imágenes`);

// ── 6. Datos estructurados ──
console.log("\nDATOS ESTRUCTURADOS");
const bloques = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
const tipos = [];
for (const b of bloques) {
  try {
    const j = JSON.parse(b[1].replace(/\\u003c/g, "<"));
    for (const nodo of j["@graph"] ?? [j]) tipos.push(nodo["@type"]);
  } catch (e) { console.log("        ✗ JSON-LD no parsea:", e.message.slice(0, 50)); fallos++; }
}
ok(tipos.includes("DefinedTerm"), "DefinedTerm presente");
ok(tipos.includes("BreadcrumbList"), "BreadcrumbList presente");
tipos.includes("FAQPage")
  ? ok(true, "FAQPage presente")
  : nota("FAQPage", "no hay — es la oportunidad más clara que queda");

// ── 7. Apoyos visuales ──
console.log("\nLECTURA");
const piezas = ["prose-resumen", "prose-vs", "prose-chart", "prose-dato", "prose-hitos", "prose-pasos", "prose-callout", "prose-table"]
  .filter((c) => cuerpo.includes(c));
ok(piezas.length >= 5, "≥ 5 tipos de bloque visual", piezas.join(" "));
const parrafos = (cuerpo.match(/<p[^>]*>/g) ?? []).length;
ok(n / Math.max(1, piezas.length) < 300, "un bloque visual cada < 300 palabras", `${Math.round(n / piezas.length)}`);

console.log(`\n  ${fallos === 0 ? "SIN FALLOS" : fallos + " FALLO(S)"} · ${avisos} aviso(s)\n`);
process.exit(fallos ? 1 : 0);
