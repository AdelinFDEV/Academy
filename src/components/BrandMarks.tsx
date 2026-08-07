// Logos SVG inline y autocontenidos de los colaboradores (sin hotlink ni
// dependencias externas). Fuente ÚNICA — reutilizados en el footer, los heros,
// la watchlist, la tarjeta premium y la página /premium. No dupliques estos
// paths en otros sitios: importa el glyph desde aquí.
//
// Cada glyph está pensado para ir sobre un "chip" del color de marca:
//   DefiLlama → azul  #2172E5   ·  CoinGecko → verde #8bc53f

export function DefiLlamaGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="M8.4 3.4c.62 0 1 .82 1 2.05v2.1h-2v-2.1c0-1.23.38-2.05 1-2.05z" fill="#fff" />
      <path d="M15.6 3.4c.62 0 1 .82 1 2.05v2.1h-2v-2.1c0-1.23.38-2.05 1-2.05z" fill="#fff" />
      <rect x="6.8" y="6" width="10.4" height="9" rx="4.6" fill="#fff" />
      <rect x="9.4" y="12" width="5.2" height="7.4" rx="2.6" fill="#fff" />
      <circle cx="10.2" cy="9.3" r="1" fill="#2172E5" />
      <circle cx="13.8" cy="9.3" r="1" fill="#2172E5" />
    </svg>
  );
}

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
