#!/usr/bin/env node
/**
 * Baraja las opciones de los bancos de preguntas de un curso y reparte la
 * posición de la correcta entre 0, 1, 2 y 3.
 *
 *   node scripts/barajar-preguntas.mjs <slug>            # baraja y guarda
 *   node scripts/barajar-preguntas.mjs <slug> --probar   # solo enseña el reparto
 *
 * Por qué existe: al escribir un banco, la respuesta buena tiende a acabar
 * siempre en el mismo sitio (CURSOS.md, punto 8). Lo cómodo es escribir cada
 * pregunta con la correcta la primera y pasar esto al final.
 *
 * Es estable: el orden de cada pregunta sale solo de su `clave` y de su
 * posición en el banco, no del orden en que estuvieran las opciones. Ejecutarlo
 * dos veces deja el banco igual. Dentro de cada banco, la posición de la
 * correcta va rotando, así que las cuatro quedan igualadas.
 *
 * Una pregunta con `"fijo": true` no se toca: es para las que tienen las
 * opciones en un orden que significa algo (números de menor a mayor).
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const slug = process.argv[2];
const soloProbar = process.argv.includes("--probar");
if (!slug) {
  console.error("Uso: node scripts/barajar-preguntas.mjs <slug> [--probar]");
  process.exit(1);
}
const dir = join("scripts", "cursos", slug, "preguntas");
if (!existsSync(dir)) {
  console.error(`No existe ${dir}`);
  process.exit(1);
}

/** Un generador de números con semilla (mulberry32), para que sea repetible. */
function generador(semilla) {
  let h = 1779033703 ^ semilla.length;
  for (let i = 0; i < semilla.length; i++) {
    h = Math.imul(h ^ semilla.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let total = 0;
const repartoGlobal = [0, 0, 0, 0];

for (const archivo of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
  const ruta = join(dir, archivo);
  const preguntas = JSON.parse(readFileSync(ruta, "utf8"));
  const cuenta = [0, 0, 0, 0];

  preguntas.forEach((p, n) => {
    if (p.fijo || !Array.isArray(p.opciones) || p.opciones.length !== 4) {
      if (p.correcta < 4) cuenta[p.correcta]++;
      return;
    }
    const buena = p.opciones[p.correcta];
    // Se ordenan antes de barajar: así el resultado no depende del orden en que
    // estuvieran, y volver a ejecutarlo deja el banco exactamente igual.
    const malas = p.opciones.filter((_, i) => i !== p.correcta).sort((x, y) => x.localeCompare(y, "es"));

    // Las tres incorrectas, en un orden que depende solo de la clave.
    const azar = generador(String(p.clave));
    for (let i = malas.length - 1; i > 0; i--) {
      const j = Math.floor(azar() * (i + 1));
      [malas[i], malas[j]] = [malas[j], malas[i]];
    }
    // La posición de la correcta rota con el orden en el banco (0, 1, 2, 3…)
    // desplazada por la clave: reparto parejo y sin patrón evidente.
    const destino = (n + Math.floor(generador(`${archivo}`)() * 4)) % 4;
    const opciones = [...malas];
    opciones.splice(destino, 0, buena);
    p.opciones = opciones;
    p.correcta = destino;
    cuenta[destino]++;
  });

  cuenta.forEach((c, i) => (repartoGlobal[i] += c));
  total += preguntas.length;
  console.log(`${archivo.padEnd(16)} ${preguntas.length} preguntas · correcta en A/B/C/D: ${cuenta.join(" / ")}`);
  if (!soloProbar) writeFileSync(ruta, `${JSON.stringify(preguntas, null, 2)}\n`);
}

console.log(`\nTotal: ${total} preguntas · A/B/C/D: ${repartoGlobal.join(" / ")}${soloProbar ? " (sin guardar)" : ""}`);
