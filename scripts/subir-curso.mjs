#!/usr/bin/env node
/**
 * Sube un curso a Supabase desde sus archivos.
 *
 *   node --env-file=.env.local scripts/subir-curso.mjs <slug>            # comprueba y sube
 *   node --env-file=.env.local scripts/subir-curso.mjs <slug> --probar   # solo comprueba
 *
 * El contenido de un curso vive en la BASE DE DATOS (decisión del admin: la
 * web no crece con cada curso). Estos archivos son su copia con historial en
 * git y la forma cómoda de escribirlo, porque meter HTML largo en un INSERT es
 * pedir errores de comillas:
 *
 *   scripts/cursos/<slug>/curso.json          ← datos del curso, módulos y lecciones
 *   scripts/cursos/<slug>/lecciones/*.html    ← el texto de cada lección
 *   scripts/cursos/<slug>/preguntas/*.json    ← un banco por módulo y el del final
 *
 * Qué hace, en este orden:
 *   1. COMPRUEBA todo antes de tocar nada: JSON válido, cada lección con su
 *      archivo, cada bloque interactivo con un nombre que existe y JSON que se
 *      lee, cada pregunta con su solución dentro de rango y su lección, y que
 *      cada banco tenga al menos tantas preguntas como salen en el examen. Si
 *      algo falla, sale con código 1 y NO sube nada.
 *   2. Sube: curso por `slug`, módulos por (curso, orden), lecciones por
 *      `slug` y preguntas por (curso, clave). Actualiza lo que ya existe en vez
 *      de borrarlo — borrar una lección se llevaría el progreso de los alumnos.
 *   3. Avisa (sin borrar) de lo que está en la base de datos y ya no en los
 *      archivos. Las preguntas retiradas SÍ se borran: no tienen progreso.
 *
 * `published` se sube tal como está en curso.json. **Publicar es decisión del
 * admin**: no lo pongas a `true` sin su «sí».
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const slug = process.argv[2];
const soloProbar = process.argv.includes("--probar");
if (!slug) {
  console.error("Uso: node --env-file=.env.local scripts/subir-curso.mjs <slug> [--probar]");
  process.exit(1);
}

const dir = join("scripts", "cursos", slug);
if (!existsSync(dir)) {
  console.error(`No existe la carpeta ${dir}`);
  process.exit(1);
}

// Los nombres válidos de `data-bloque`. Tiene que coincidir con el switch de
// src/components/aula/Bloque.tsx: si añades un bloque allí, añádelo aquí.
const BLOQUES = new Set(["grafico", "pregunta", "verdadero-falso", "clasificar", "ordenar", "tramos", "fifo"]);
const PATRON_BLOQUE =
  /<div\s+data-bloque="([a-z0-9-]+)"\s*>\s*(?:<script\s+type="application\/json"\s*>([\s\S]*?)<\/script>)?\s*<\/div>/g;

const errores = [];
const avisos = [];
const leerJson = (ruta) => {
  try {
    return JSON.parse(readFileSync(ruta, "utf8"));
  } catch (e) {
    errores.push(`${ruta}: ${e.message}`);
    return null;
  }
};

// ── 1. Comprobar ──────────────────────────────────────────────────────────

const curso = leerJson(join(dir, "curso.json"));
if (!curso) finalizar();
if (curso.slug !== slug) errores.push(`curso.json: el slug es "${curso.slug}" y la carpeta "${slug}"`);
for (const campo of ["titulo", "logro", "modulos"]) if (!curso[campo]) errores.push(`curso.json: falta "${campo}"`);
if (["verificar"].includes(slug)) errores.push(`"${slug}" no vale como slug: es una ruta reservada de /cursos`);

const lecciones = new Map(); // slug → { modulo, html }
const RESERVADOS = new Set(["examen", "certificado"]);
for (const m of curso.modulos ?? []) {
  for (const l of m.lecciones ?? []) {
    if (RESERVADOS.has(l.slug)) errores.push(`Lección "${l.slug}": ese slug está reservado en /aula`);
    if (lecciones.has(l.slug)) errores.push(`Lección "${l.slug}" repetida`);
    if (!(l.minutos > 0)) errores.push(`Lección "${l.slug}": "minutos" tiene que ser mayor que 0`);
    const ruta = join(dir, "lecciones", l.archivo ?? `${l.slug}.html`);
    if (!existsSync(ruta)) {
      // En un borrador se sube vacía: el temario se ve entero mientras se escribe.
      (curso.published === true ? errores : avisos).push(`Lección "${l.slug}": todavía no existe ${ruta}`);
      lecciones.set(l.slug, { modulo: m.orden, html: "" });
      continue;
    }
    const html = readFileSync(ruta, "utf8");
    for (const b of html.matchAll(PATRON_BLOQUE)) {
      if (!BLOQUES.has(b[1])) errores.push(`${ruta}: no existe el bloque "${b[1]}"`);
      if (b[2]?.trim()) {
        try {
          JSON.parse(b[2]);
        } catch (e) {
          errores.push(`${ruta}: el JSON del bloque "${b[1]}" no es válido — ${e.message}`);
        }
      }
    }
    if (/data-bloque=/.test(html.replace(PATRON_BLOQUE, ""))) {
      errores.push(`${ruta}: hay un data-bloque mal cerrado (tiene que ser <div data-bloque="…"><script type="application/json">…</script></div>)`);
    }
    if (/href="\/glosario\//.test(html) === false) avisos.push(`${ruta}: no enlaza ningún término del diccionario`);
    lecciones.set(l.slug, { modulo: m.orden, html });
  }
}

const bancos = new Map(); // "1".."n" | "final" → preguntas
const dirPreguntas = join(dir, "preguntas");
const claves = new Set();
if (existsSync(dirPreguntas)) {
  for (const archivo of readdirSync(dirPreguntas).filter((f) => f.endsWith(".json"))) {
    const clave = archivo === "final.json" ? "final" : archivo.match(/^modulo-(\d+)\.json$/)?.[1];
    if (!clave) {
      errores.push(`${archivo}: el nombre tiene que ser modulo-<n>.json o final.json`);
      continue;
    }
    const preguntas = leerJson(join(dirPreguntas, archivo)) ?? [];
    for (const p of preguntas) {
      const donde = `${archivo} · ${p.clave ?? "(sin clave)"}`;
      if (!p.clave) errores.push(`${donde}: falta "clave"`);
      if (claves.has(p.clave)) errores.push(`${donde}: clave repetida`);
      claves.add(p.clave);
      if (!p.enunciado) errores.push(`${donde}: falta "enunciado"`);
      if (!Array.isArray(p.opciones) || p.opciones.length < 2) errores.push(`${donde}: hacen falta al menos 2 opciones`);
      else if (!(Number.isInteger(p.correcta) && p.correcta >= 0 && p.correcta < p.opciones.length)) {
        errores.push(`${donde}: "correcta" fuera de rango`);
      }
      if (!p.explicacion) avisos.push(`${donde}: sin explicación`);
      if (p.leccion && !lecciones.has(p.leccion)) errores.push(`${donde}: la lección "${p.leccion}" no existe`);
      if (!p.leccion) avisos.push(`${donde}: sin lección que repasar`);
    }
    bancos.set(clave, preguntas);
  }
}

// Un banco corto impide publicar, pero no subir un borrador: así el curso se
// puede ir subiendo y probando módulo a módulo mientras se escribe.
const incompleto = (texto) => (curso.published === true ? errores : avisos).push(texto);
for (const m of curso.modulos ?? []) {
  const banco = bancos.get(String(m.orden)) ?? [];
  const salen = m.preguntas_examen ?? 10;
  if (banco.length < salen) incompleto(`Módulo ${m.orden}: el banco tiene ${banco.length} preguntas y el examen pide ${salen}`);
  else if (banco.length === salen) avisos.push(`Módulo ${m.orden}: el banco tiene justo ${salen} — todos los intentos tendrán las mismas preguntas`);
}
const final = bancos.get("final") ?? [];
if (final.length < (curso.preguntas_final ?? 20)) {
  incompleto(`Examen final: el banco tiene ${final.length} preguntas y el examen pide ${curso.preguntas_final ?? 20}`);
}

function finalizar() {
  for (const a of avisos) console.log(`\x1b[33m!\x1b[0m ${a}`);
  for (const e of errores) console.log(`\x1b[31m✗\x1b[0m ${e}`);
  if (errores.length) {
    console.log(`\n\x1b[31m${errores.length} errores. No se ha subido nada.\x1b[0m`);
    process.exit(1);
  }
}
finalizar();

const minutos = [...(curso.modulos ?? [])].flatMap((m) => m.lecciones).reduce((t, l) => t + l.minutos, 0);
console.log(
  `\x1b[32m✓\x1b[0m ${curso.titulo}: ${curso.modulos.length} módulos, ${lecciones.size} lecciones, ${minutos} min de lectura, ` +
    `${[...bancos.values()].reduce((t, b) => t + b.length, 0)} preguntas.`,
);
if (soloProbar) process.exit(0);

// ── 2. Subir ──────────────────────────────────────────────────────────────

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !clave) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY (¿falta --env-file=.env.local?)");
  process.exit(1);
}
const db = createClient(url, clave, { auth: { persistSession: false } });
const fallar = (que, error) => {
  console.error(`\x1b[31m✗\x1b[0m ${que}: ${error.message}`);
  process.exit(1);
};

const { data: filaCurso, error: eCurso } = await db
  .from("cursos")
  .upsert(
    {
      slug: curso.slug,
      titulo: curso.titulo,
      subtitulo: curso.subtitulo ?? null,
      descripcion: curso.descripcion ?? null,
      objetivos: curso.objetivos ?? [],
      nivel: curso.nivel ?? "básico",
      portada: curso.portada ?? null,
      color: curso.color ?? "#e6b455",
      aviso: curso.aviso ?? "general",
      logro: curso.logro,
      preguntas_final: curso.preguntas_final ?? 20,
      revisado: curso.revisado ?? null,
      orden: curso.orden ?? 0,
      published: curso.published === true,
    },
    { onConflict: "slug" },
  )
  .select("id")
  .single();
if (eCurso) fallar("curso", eCurso);
const cursoId = filaCurso.id;

const idModulo = new Map();
const idLeccion = new Map();
for (const m of curso.modulos) {
  const { data, error } = await db
    .from("curso_modulos")
    .upsert(
      {
        curso_id: cursoId,
        orden: m.orden,
        titulo: m.titulo,
        descripcion: m.descripcion ?? null,
        nota_minima: m.nota_minima ?? 5,
        preguntas_examen: m.preguntas_examen ?? 10,
      },
      { onConflict: "curso_id,orden" },
    )
    .select("id")
    .single();
  if (error) fallar(`módulo ${m.orden}`, error);
  idModulo.set(m.orden, data.id);

  for (const [i, l] of m.lecciones.entries()) {
    const { data: fl, error: el } = await db
      .from("curso_lecciones")
      .upsert(
        {
          modulo_id: data.id,
          orden: i + 1,
          slug: l.slug,
          titulo: l.titulo,
          resumen: l.resumen ?? null,
          contenido: lecciones.get(l.slug).html,
          minutos: l.minutos,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();
    if (el) fallar(`lección ${l.slug}`, el);
    idLeccion.set(l.slug, fl.id);
  }
}

for (const [banco, preguntas] of bancos) {
  const filas = preguntas.map((p) => ({
    curso_id: cursoId,
    modulo_id: banco === "final" ? null : idModulo.get(Number(banco)) ?? null,
    leccion_id: p.leccion ? idLeccion.get(p.leccion) ?? null : null,
    clave: p.clave,
    enunciado: p.enunciado,
    opciones: p.opciones,
    correcta: p.correcta,
    explicacion: p.explicacion ?? null,
  }));
  const { error } = await db.from("curso_preguntas").upsert(filas, { onConflict: "curso_id,clave" });
  if (error) fallar(`preguntas de ${banco}`, error);
}

// ── 3. Lo que sobra en la base de datos ───────────────────────────────────

const { data: enDb } = await db.from("curso_preguntas").select("id, clave").eq("curso_id", cursoId);
const sobran = (enDb ?? []).filter((p) => !claves.has(p.clave));
if (sobran.length) {
  await db.from("curso_preguntas").delete().in("id", sobran.map((p) => p.id));
  console.log(`  Retiradas ${sobran.length} preguntas que ya no están en los archivos.`);
}

const { data: modsDb } = await db.from("curso_modulos").select("orden, curso_lecciones(slug)").eq("curso_id", cursoId);
for (const m of modsDb ?? []) {
  if (!idModulo.has(m.orden)) console.log(`\x1b[33m!\x1b[0m El módulo ${m.orden} está en la base de datos y no en curso.json. No se borra: hazlo a mano si es lo que quieres.`);
  for (const l of m.curso_lecciones ?? []) {
    if (!idLeccion.has(l.slug)) console.log(`\x1b[33m!\x1b[0m La lección "${l.slug}" está en la base de datos y no en curso.json. No se borra: se llevaría el progreso de los alumnos.`);
  }
}

console.log(`\x1b[32m✓\x1b[0m Subido. ${curso.published ? "Publicado." : "Sigue como BORRADOR: solo lo ve el admin."}`);
