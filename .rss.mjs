const B = "http://localhost:3119";
for (let i = 0; i < 25; i++) { try { if ((await fetch(B + "/")).ok) break; } catch {} await new Promise(r => setTimeout(r, 2000)); }

console.log("=== 1. El enlace de descubrimiento, ruta por ruta ===");
const rutas = ["/", "/articulos", "/guias", "/glosario", "/premium",
  "/post/modelo-721-criptomonedas", "/glosario/staking", "/guias/xrp", "/categoria/fiscalidad"];
let sin = 0;
for (const r of rutas) {
  const html = await (await fetch(B + r)).text();
  const tiene = /rel="alternate"[^>]*application\/rss\+xml|application\/rss\+xml[^>]*rel="alternate"/.test(html)
    || /type="application\/rss\+xml"/.test(html);
  const canon = /<link rel="canonical"/.test(html);
  if (!tiene) sin++;
  console.log(`  ${tiene ? "feed ok" : "SIN FEED"}   ${canon ? "canonica ok" : "sin canonica"}   ${r}`);
}
console.log(sin === 0 ? "  todas anuncian el feed" : `  ** ${sin} rutas sin el enlace al feed`);
