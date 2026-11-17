// Uso: node texto-visible.mjs <archivo.html> → texto visible, sin script/style/comentarios
// y sin nada que esté dentro de un elemento aria-hidden="true".
import { readFileSync } from "node:fs";
let html = readFileSync(process.argv[2], "utf8");
html = html.replace(/<!--[\s\S]*?-->/g, "")
  .replace(/<script[\s\S]*?<\/script>/gi, "")
  .replace(/<style[\s\S]*?<\/style>/gi, "")
  .replace(/<template[\s\S]*?<\/template>/gi, "");
const VACIOS = new Set(["area","base","br","col","embed","hr","img","input","link","meta","source","track","wbr"]);
const re = /<\/?([a-zA-Z][\w:-]*)([^>]*)>|([^<]+)/g;
const pila = []; // cada entrada: {tag, oculto}
let out = "";
let m;
const oculto = () => pila.some((p) => p.oculto);
while ((m = re.exec(html))) {
  if (m[3] !== undefined) { if (!oculto()) out += m[3]; continue; }
  const tag = m[1].toLowerCase();
  const attrs = m[2] || "";
  const cierre = m[0].startsWith("</");
  if (cierre) {
    for (let i = pila.length - 1; i >= 0; i--) if (pila[i].tag === tag) { pila.length = i; break; }
    continue;
  }
  const autocierre = /\/\s*$/.test(attrs) || VACIOS.has(tag);
  if (autocierre) continue;
  pila.push({ tag, oculto: /aria-hidden="true"/.test(attrs) });
}
const dec = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, "\u00a0");
console.log(dec(out).replace(/\s+/g, " ").trim().replace(/([.:!?»]) /g, "$1\n"));
