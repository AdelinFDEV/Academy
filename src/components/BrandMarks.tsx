// Logo SVG inline y autocontenido de CoinGecko, la fuente de los datos de
// mercado (sin hotlink ni dependencias externas). Fuente ÚNICA — se usa en el
// footer, la tarjeta premium y la página /premium. No dupliques el path en
// otros sitios: importa el glyph desde aquí.
//
// Va sobre un "chip" del color de marca: verde #8bc53f.
// DefiLlama se retiró el 31-10-2026 con las Liberaciones de tokens, que era lo
// único que tomaba sus datos.

export function CoinGeckoGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="M12 4c4.1 0 6.6 2.6 6.6 6.2 0 4.6-3 8-6.6 8s-6.6-3.4-6.6-8C5.4 6.6 7.9 4 12 4z" fill="#fff" />
      <circle cx="9.1" cy="9.6" r="2.15" fill="#3f5c18" />
      <circle cx="14.9" cy="9.6" r="2.15" fill="#3f5c18" />
      <circle cx="9.1" cy="9.6" r="0.8" fill="#fff" />
      <circle cx="14.9" cy="9.6" r="0.8" fill="#fff" />
    </svg>
  );
}
