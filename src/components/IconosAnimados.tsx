/**
 * Iconos animados de las tres piezas de pago, para la barra (NavPrincipal).
 *
 * Son SVG dibujados aquí y animados con CSS (globals.css, «Iconos animados»),
 * no GIF: un GIF pesa, se ve pixelado en pantallas nítidas y no puede tomar
 * el color de cada pieza. Estos heredan el color con `currentColor`, se ven
 * igual a cualquier tamaño y casi no pesan.
 *
 * Se mueven despacio siempre, más rápido con el ratón encima, y nada si el
 * visitante tiene activado el movimiento reducido.
 */

/** Cursos: el birrete se mece y la borla se balancea. */
export function IconoCursos({ size = 16 }: { size?: number }) {
  return (
    <svg className="ia ia--cursos" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g className="ia-birrete">
        <path d="M2 9.2 12 4.5l10 4.7-10 4.7z" fill="currentColor" />
        <path d="M6.2 11.4v3.9c0 1.4 2.6 2.9 5.8 2.9s5.8-1.5 5.8-2.9v-3.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </g>
      <g className="ia-borla">
        <path d="M20 9.6v5.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="20" cy="16.2" r="1.4" fill="currentColor" />
      </g>
    </svg>
  );
}

/** Portfolio: las barras de un gráfico que suben y bajan, desfasadas. */
export function IconoPortfolio({ size = 16 }: { size?: number }) {
  return (
    <svg className="ia ia--portfolio" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect className="ia-barra" x="4" y="12" width="3.6" height="8" rx="1.2" fill="currentColor" />
      <rect className="ia-barra" x="10.2" y="7" width="3.6" height="13" rx="1.2" fill="currentColor" />
      <rect className="ia-barra" x="16.4" y="3.5" width="3.6" height="16.5" rx="1.2" fill="currentColor" />
      <path d="M2.5 21.2h19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Diario: una libreta cuyas líneas se escriben una tras otra. */
export function IconoDiario({ size = 16 }: { size?: number }) {
  return (
    <svg className="ia ia--diario" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="2.6" stroke="currentColor" strokeWidth="1.8" />
      <path className="ia-linea" d="M8 8.5h8" pathLength={1} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path className="ia-linea" d="M8 12h8" pathLength={1} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path className="ia-linea" d="M8 15.5h5" pathLength={1} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
