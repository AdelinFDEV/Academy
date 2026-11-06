/**
 * Iconos animados. Los tres de las piezas de pago van en la barra
 * (NavPrincipal) y en el slider de la portada; el resto, solo en el slider.
 *
 * Son SVG dibujados aquí y animados con CSS, no GIF: un GIF pesa, se ve
 * pixelado en pantallas nítidas y no puede tomar el color de cada pieza.
 * Estos heredan el color con `currentColor`, se ven igual a cualquier tamaño
 * y casi no pesan. La animación de los tres de la barra vive en globals.css
 * («Iconos animados»); la de los del slider, en home.css, que es donde se
 * usan.
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

/* ── Los del slider de la portada (animados en home.css) ─────────────────── */

/** En vivo: un punto con una onda que se expande. */
export function IconoPulso({ size = 18 }: { size?: number }) {
  return (
    <svg className="ia ia--pulso" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="ia-onda" cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4" fill="currentColor" />
    </svg>
  );
}

/** Dos carteras: dos capas que se separan y se vuelven a juntar. */
export function IconoCapas({ size = 18 }: { size?: number }) {
  return (
    <svg className="ia ia--capas" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path className="ia-capa-baja" d="M3 14.5 12 19l9-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path className="ia-capa-alta" d="M12 4 3 8.5 12 13l9-4.5z" fill="currentColor" />
    </svg>
  );
}

/** Hitos: un trofeo que da un pequeño salto y suelta un destello. */
export function IconoTrofeo({ size = 18 }: { size?: number }) {
  return (
    <svg className="ia ia--trofeo" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g className="ia-copa">
        <path d="M7 4h10v5a5 5 0 0 1-10 0z" fill="currentColor" />
        <path d="M7 6H4.5a2.5 2.5 0 0 0 2.6 4.4M17 6h2.5a2.5 2.5 0 0 1-2.6 4.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M12 14v3.5M8.5 20h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </g>
      <path className="ia-destello" d="M20.5 2.5v3M19 4h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** Privado: un candado cuyo arco se abre un poco y vuelve a cerrar. */
export function IconoCandado({ size = 18 }: { size?: number }) {
  return (
    <svg className="ia ia--candado" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path className="ia-arco" d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <rect x="5" y="11" width="14" height="10" rx="2.6" fill="currentColor" />
    </svg>
  );
}

/** Estadísticas: un anillo que se rellena y se vacía. */
export function IconoAnillo({ size = 18 }: { size?: number }) {
  return (
    <svg className="ia ia--anillo" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.4" />
      <circle className="ia-arco-anillo" cx="12" cy="12" r="8.5" pathLength={1} stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/** Examen: una marca de aprobado que se dibuja. */
export function IconoAprobado({ size = 18 }: { size?: number }) {
  return (
    <svg className="ia ia--aprobado" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path className="ia-marca" d="m8 12.3 2.7 2.7L16.2 9.4" pathLength={1} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Certificado: una medalla que se balancea desde la cinta. */
export function IconoMedalla({ size = 18 }: { size?: number }) {
  return (
    <svg className="ia ia--medalla" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g className="ia-colgante">
        <path d="M7.5 2.5 12 9.5l4.5-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="15" r="6" fill="currentColor" />
      </g>
    </svg>
  );
}

/** A tu ritmo: la aguja de un reloj que da la vuelta. */
export function IconoReloj({ size = 18 }: { size?: number }) {
  return (
    <svg className="ia ia--reloj" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 12V8.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path className="ia-aguja" d="M12 12h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** Diccionario: un libro con su «A»; el marcapáginas baja y sube. */
export function IconoDiccionario({ size = 18 }: { size?: number }) {
  return (
    <svg className="ia ia--diccionario" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9.5 13.5 12 7l2.5 6.5M10.4 11.3h3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path className="ia-cinta" d="M16 3v5.5l-1.2-1-1.2 1V3" fill="currentColor" />
    </svg>
  );
}

/** Guías: un mapa plegado; la ruta se dibuja y la chincheta bota al llegar. */
export function IconoGuias({ size = 18 }: { size?: number }) {
  return (
    <svg className="ia ia--guias" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 6.5 8.5 4l7 2.5L21 4v13.5L15.5 20l-7-2.5L3 20z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" opacity=".55" />
      <path className="ia-ruta" d="M5.5 16.5c2-1 3-3.5 5.5-3.5s3-2.5 4.5-4" pathLength={1} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="0.12 0.08" />
      <g className="ia-chincheta">
        <path d="M17 3.2a2.6 2.6 0 0 0-2.6 2.6c0 2 2.6 4.2 2.6 4.2s2.6-2.2 2.6-4.2A2.6 2.6 0 0 0 17 3.2z" fill="currentColor" />
        <circle cx="17" cy="5.8" r=".9" fill="#0b1224" />
      </g>
    </svg>
  );
}

/** Predicción de Precio: una diana; las ondas salen del centro. */
export function IconoPrediccion({ size = 18 }: { size?: number }) {
  return (
    <svg className="ia ia--prediccion" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" opacity=".45" />
      <circle className="ia-diana" cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.7" />
      <circle className="ia-diana ia-diana--2" cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" />
    </svg>
  );
}
