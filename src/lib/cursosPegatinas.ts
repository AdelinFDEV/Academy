/**
 * La pegatina de cada curso: el dibujo cuadrado, con fondo transparente, que
 * va en el hueco de la «foto» de su ficha en la portada (CursosHome.tsx). Se
 * genera con el prompt base de las pegatinas (ESTILO.md) y se guarda en
 * `public/cursos/<slug>/pegatina.webp`, recortada y a unos 330 px.
 *
 * Un curso sin entrada enseña en ese hueco su color y su número grande.
 * Se van añadiendo curso a curso (18-11-2026, pedido por el admin).
 */
export const PEGATINA_CURSO: Record<string, string> = {
  "psicologia-del-trading": "/cursos/psicologia-del-trading/pegatina.webp",
  "seguridad-cripto": "/cursos/seguridad-cripto/pegatina.webp",
  "coinmarketcap-y-coingecko": "/cursos/coinmarketcap-y-coingecko/pegatina.webp",
  "bitcoin-y-dca": "/cursos/bitcoin-y-dca/pegatina.webp",
  "futuros-y-apalancamiento": "/cursos/futuros-y-apalancamiento/pegatina.webp",
  "analisis-tecnico-sin-humo": "/cursos/analisis-tecnico-sin-humo/pegatina.webp",
  "defi-y-stablecoins": "/cursos/defi-y-stablecoins/pegatina.webp",
  "fiscalidad-cripto-espana": "/cursos/fiscalidad-cripto-espana/pegatina.webp",
};
