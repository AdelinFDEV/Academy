import "./nova-room.css";

/**
 * La habitación de Nova (versión 2, 10-11-2026): el fondo de su espacio bajo
 * el saludo del Diario y de la cabecera de la ficha del Diario.
 *
 * Una sala de trader de noche, con profundidad y vida pero en tonos apagados:
 * el protagonista es Nova. De izquierda a derecha: una ventana con la luna y
 * la ciudad (estrellas que titilan y ventanas que se encienden), la estantería
 * con libros y un bitcoin, el reloj de pared (el segundero anda de verdad), el
 * monitor con velas y el precio dibujándose, y el escritorio con el portátil,
 * el café humeando, la lámpara y una planta. Arriba, una tira de luz dorada
 * que respira; abajo, el reflejo del monitor en el suelo.
 *
 * Está dibujada A LA MEDIDA DE SU HUECO (640 × 172, lo que mide el espacio de
 * Nova en el Diario) y se encaja entera (meet), alineada abajo: nunca se
 * recorta. Si el hueco es más ancho o más alto, el CSS de .tjbot-room pinta
 * la misma pared y el mismo suelo alrededor. Las animaciones viven en
 * nova-room.css (clases nr-*), todas de opacidad o transform: baratas, y se
 * apagan con prefers-reduced-motion.
 */
export default function NovaRoom() {
  return (
    <div className="tjbot-room" aria-hidden="true">
      <svg viewBox="0 0 640 172" preserveAspectRatio="xMidYMax meet">
        <defs>
          <linearGradient id="nr-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#172c58" />
            <stop offset="100%" stopColor="#0f1d3c" />
          </linearGradient>
          <linearGradient id="nr-floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d1933" />
            <stop offset="100%" stopColor="#080f22" />
          </linearGradient>
          <linearGradient id="nr-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#070f26" />
            <stop offset="60%" stopColor="#15285a" />
            <stop offset="100%" stopColor="#2a3f78" />
          </linearGradient>
          <radialGradient id="nr-lamp" cx="0.5" cy="0" r="0.9">
            <stop offset="0%" stopColor="#f0c76e" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#f0c76e" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="nr-monitor-glow" cx="0.5" cy="0.5" r="0.6">
            <stop offset="0%" stopColor="#6ab8ff" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#6ab8ff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="nr-screen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d1a36" />
            <stop offset="100%" stopColor="#070f22" />
          </linearGradient>
          <linearGradient id="nr-glass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.07" />
            <stop offset="50%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="nr-desk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2f4578" />
            <stop offset="100%" stopColor="#1f3360" />
          </linearGradient>
          <radialGradient id="nr-moon" cx="0.4" cy="0.35" r="0.7">
            <stop offset="0%" stopColor="#fff8e0" />
            <stop offset="100%" stopColor="#e5dcb8" />
          </radialGradient>
          <radialGradient id="nr-moon-halo" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#fff3c4" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#fff3c4" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="nr-price-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0c76e" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#f0c76e" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="nr-coin" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0%" stopColor="#ffe6a8" />
            <stop offset="55%" stopColor="#e0a94a" />
            <stop offset="100%" stopColor="#a8712a" />
          </radialGradient>
          <clipPath id="nr-window-clip"><rect x="34" y="18" width="126" height="90" rx="6" /></clipPath>
          <clipPath id="nr-screen-clip"><rect x="470" y="24" width="150" height="74" rx="3" /></clipPath>
        </defs>

        {/* ── Pared y suelo ── */}
        <rect width="640" height="172" fill="url(#nr-wall)" />
        {/* Paneles de la pared: juntas muy tenues. */}
        <g stroke="#ffffff" strokeOpacity="0.035" strokeWidth="1">
          <line x1="160" y1="0" x2="160" y2="136" /><line x1="340" y1="0" x2="340" y2="136" /><line x1="512" y1="0" x2="512" y2="136" />
        </g>
        {/* Suelo con rodapié y el reflejo del monitor. */}
        <rect y="138" width="640" height="34" fill="url(#nr-floor)" />
        <rect y="136" width="640" height="3" fill="#1d2e5a" />
        <ellipse cx="430" cy="150" rx="110" ry="14" fill="url(#nr-monitor-glow)" />
        <ellipse cx="575" cy="60" rx="130" ry="120" fill="url(#nr-lamp)" />

        {/* ── Ventana con la luna y la ciudad (dibujada en 30..164, corrida a la izquierda) ── */}
        <g transform="translate(-8 0)">
          <rect x="30" y="14" width="134" height="98" rx="8" fill="#0b162e" />
          <g clipPath="url(#nr-window-clip)">
            <rect x="34" y="18" width="126" height="90" fill="url(#nr-sky)" />
            <circle className="nr-moon-halo" cx="128" cy="40" r="22" fill="url(#nr-moon-halo)" />
            <circle cx="128" cy="40" r="8" fill="url(#nr-moon)" />
            <circle cx="131.5" cy="37.5" r="7.2" fill="#132650" opacity="0.92" />
            <g className="nr-stars" fill="#dfe8ff">
              <circle className="nr-star" cx="52" cy="30" r="1" />
              <circle className="nr-star" cx="78" cy="25" r="1.3" />
              <circle className="nr-star" cx="98" cy="42" r="0.9" />
              <circle className="nr-star" cx="64" cy="48" r="0.8" />
              <circle className="nr-star" cx="110" cy="27" r="0.8" />
              <circle className="nr-star" cx="44" cy="56" r="0.7" />
              <circle className="nr-star" cx="88" cy="58" r="0.7" />
              <circle className="nr-star" cx="146" cy="60" r="0.9" />
            </g>
            {/* Ciudad al fondo y ciudad cerca. */}
            <path d="M34 108 V86 H42 V78 H50 V90 H58 V72 H66 V84 H74 V76 H82 V92 H92 V70 H100 V86 H108 V80 H118 V94 H128 V74 H138 V88 H148 V82 H160 V108 Z" fill="#132452" />
            <path d="M34 108 V90 H46 V80 H56 V94 H64 V74 H76 V88 H84 V78 H96 V96 H106 V68 H118 V90 H128 V82 H140 V98 H150 V108 Z" fill="#0a1328" />
            <g fill="#f0c76e">
              <rect className="nr-lit" x="68" y="78" width="2" height="2" /><rect className="nr-lit" x="72" y="84" width="2" height="2" />
              <rect className="nr-lit" x="108" y="74" width="2" height="2" /><rect className="nr-lit" x="111" y="82" width="2" height="2" />
              <rect className="nr-lit" x="49" y="84" width="2" height="2" /><rect className="nr-lit" x="131" y="86" width="2" height="2" />
              <rect className="nr-lit" x="88" y="82" width="2" height="2" /><rect className="nr-lit" x="143" y="100" width="2" height="2" />
              <rect className="nr-lit" x="58" y="98" width="2" height="2" /><rect className="nr-lit" x="120" y="92" width="2" height="2" />
            </g>
            <rect x="34" y="18" width="126" height="90" fill="url(#nr-glass)" />
          </g>
          <g stroke="#2a3d6e" strokeWidth="3" strokeLinecap="round">
            <line x1="97" y1="18" x2="97" y2="108" /><line x1="34" y1="62" x2="160" y2="62" />
          </g>
          <rect x="34" y="18" width="126" height="90" rx="6" fill="none" stroke="#33477c" strokeWidth="3" />
          <rect x="26" y="108" width="142" height="6" rx="2" fill="#2a3d6e" />
          <rect x="26" y="108" width="142" height="1.5" fill="#fff" opacity="0.08" />
        </g>

        {/* ── Estantería con libros y un bitcoin (dibujada en 206..318) ── */}
        <g transform="translate(-36 0)">
          <rect x="206" y="72" width="112" height="5" rx="2" fill="#2a3d6e" />
          <rect x="206" y="77" width="112" height="3" fill="#0a1328" opacity="0.45" />
          <rect x="214" y="44" width="9" height="28" rx="1.5" fill="#3b5394" />
          <rect x="225" y="49" width="8" height="23" rx="1.5" fill="#6a4fb0" opacity="0.85" />
          <rect x="235" y="42" width="10" height="30" rx="1.5" fill="#c48a32" opacity="0.8" />
          <rect x="247" y="51" width="7" height="21" rx="1.5" fill="#2f7a68" opacity="0.9" />
          <rect x="256" y="46" width="8" height="26" rx="1.5" fill="#8ab8ff" opacity="0.55" />
          <rect x="266" y="54" width="24" height="7" rx="1.5" fill="#3b5394" transform="rotate(-8 278 57)" />
          <g fill="#fff" opacity="0.14">
            <rect x="216" y="48" width="5" height="1" /><rect x="237" y="46" width="6" height="1" /><rect x="258" y="50" width="4" height="1" />
          </g>
          <g className="nr-coin">
            <circle cx="302" cy="60" r="11" fill="url(#nr-coin)" />
            <circle cx="302" cy="60" r="8" fill="none" stroke="#f7dfa6" strokeWidth="1.2" opacity="0.8" />
            <text x="302" y="64.5" textAnchor="middle" fontSize="12" fontWeight="800" fill="#7a4d12">₿</text>
            <ellipse className="nr-coin-shine" cx="297" cy="54" rx="3" ry="1.6" fill="#fff" opacity="0.5" transform="rotate(-30 297 54)" />
          </g>
        </g>

        {/* ── Reloj de pared: el segundero anda (dibujado en 392, 46) ── */}
        <g transform="translate(-80 0)">
          <circle cx="392" cy="46" r="19" fill="#13254d" stroke="#2f4478" strokeWidth="3" />
          <circle cx="392" cy="46" r="19" fill="none" stroke="#fff" strokeWidth="1" opacity="0.06" />
          <g stroke="#9fb3d9" strokeWidth="1.2" strokeLinecap="round" opacity="0.7">
            <line x1="392" y1="30" x2="392" y2="33" /><line x1="392" y1="59" x2="392" y2="62" />
            <line x1="376" y1="46" x2="379" y2="46" /><line x1="405" y1="46" x2="408" y2="46" />
          </g>
          <line x1="392" y1="46" x2="392" y2="36" stroke="#dfe8ff" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="392" y1="46" x2="401" y2="50" stroke="#dfe8ff" strokeWidth="2" strokeLinecap="round" />
          <line className="nr-second" x1="392" y1="49" x2="392" y2="33" stroke="#f0c76e" strokeWidth="1" strokeLinecap="round" />
          <circle cx="392" cy="46" r="2" fill="#f0c76e" />
        </g>

        {/* ── Monitor con velas y el precio dibujándose (dibujado en 462..628) ── */}
        <g transform="translate(-112 0)">
          <rect x="462" y="16" width="166" height="90" rx="7" fill="#0a1328" stroke="#2f4478" strokeWidth="3" />
          <rect x="470" y="24" width="150" height="74" rx="3" fill="url(#nr-screen)" />
          <g clipPath="url(#nr-screen-clip)">
            <g stroke="#1b2d57" strokeWidth="1">
              <line x1="470" y1="44" x2="620" y2="44" /><line x1="470" y1="62" x2="620" y2="62" /><line x1="470" y1="80" x2="620" y2="80" />
              <line x1="508" y1="24" x2="508" y2="98" /><line x1="546" y1="24" x2="546" y2="98" /><line x1="584" y1="24" x2="584" y2="98" />
            </g>
            <g>
              <line x1="482" y1="66" x2="482" y2="92" stroke="#5fd39a" strokeWidth="1.2" /><rect x="478.5" y="72" width="7" height="14" rx="1" fill="#5fd39a" />
              <line x1="494" y1="58" x2="494" y2="86" stroke="#ff5c5c" strokeWidth="1.2" /><rect x="490.5" y="64" width="7" height="14" rx="1" fill="#ff5c5c" />
              <line x1="506" y1="54" x2="506" y2="80" stroke="#5fd39a" strokeWidth="1.2" /><rect x="502.5" y="60" width="7" height="14" rx="1" fill="#5fd39a" />
              <line x1="518" y1="48" x2="518" y2="72" stroke="#5fd39a" strokeWidth="1.2" /><rect x="514.5" y="54" width="7" height="12" rx="1" fill="#5fd39a" />
              <line x1="530" y1="52" x2="530" y2="76" stroke="#ff5c5c" strokeWidth="1.2" /><rect x="526.5" y="58" width="7" height="12" rx="1" fill="#ff5c5c" />
              <line x1="542" y1="44" x2="542" y2="70" stroke="#5fd39a" strokeWidth="1.2" /><rect x="538.5" y="48" width="7" height="16" rx="1" fill="#5fd39a" />
              <line x1="554" y1="38" x2="554" y2="62" stroke="#5fd39a" strokeWidth="1.2" /><rect x="550.5" y="42" width="7" height="14" rx="1" fill="#5fd39a" />
              <line x1="566" y1="42" x2="566" y2="64" stroke="#ff5c5c" strokeWidth="1.2" /><rect x="562.5" y="46" width="7" height="12" rx="1" fill="#ff5c5c" />
              <line x1="578" y1="34" x2="578" y2="58" stroke="#5fd39a" strokeWidth="1.2" /><rect x="574.5" y="38" width="7" height="14" rx="1" fill="#5fd39a" />
              <line x1="590" y1="30" x2="590" y2="52" stroke="#5fd39a" strokeWidth="1.2" /><rect x="586.5" y="33" width="7" height="13" rx="1" fill="#5fd39a" />
              <line x1="602" y1="34" x2="602" y2="54" stroke="#ff5c5c" strokeWidth="1.2" /><rect x="598.5" y="37" width="7" height="11" rx="1" fill="#ff5c5c" />
            </g>
            <path d="M474 88 L486 80 L498 76 L510 68 L522 60 L534 64 L546 54 L558 48 L570 50 L582 42 L594 36 L606 38 L620 30 V98 H474 Z" fill="url(#nr-price-fill)" />
            <path className="nr-price" d="M474 88 L486 80 L498 76 L510 68 L522 60 L534 64 L546 54 L558 48 L570 50 L582 42 L594 36 L606 38 L620 30" stroke="#f0c76e" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <circle className="nr-tick" cx="620" cy="30" r="2.4" fill="#f0c76e" />
            <circle className="nr-tick-halo" cx="620" cy="30" r="5" fill="#f0c76e" opacity="0.3" />
            <line x1="470" y1="30" x2="620" y2="30" stroke="#f0c76e" strokeWidth="0.8" strokeDasharray="2 3" opacity="0.5" />
            <text x="476" y="35" fontSize="7.5" fontWeight="800" fill="#f5d48a" opacity="0.9">BTC/USDT</text>
            <text x="614" y="93" textAnchor="end" fontSize="6" fontWeight="700" fill="#9fb3d9" opacity="0.7">1D</text>
            <rect x="470" y="24" width="150" height="74" fill="url(#nr-glass)" />
          </g>
          <circle cx="545" cy="102" r="1.4" fill="#5fd39a" className="nr-led" />
          <rect x="535" y="106" width="20" height="10" fill="#1d2e5a" />
          <rect x="520" y="114" width="50" height="4" rx="2" fill="#2a3d6e" />
        </g>

        {/* ── Escritorio: portátil, café, lámpara, planta y libreta (dibujado en 624..788, encogido al 72 % con el suelo fijo) ── */}
        <g transform="translate(634 172) scale(0.72) translate(-788 -172)">
          <rect x="624" y="116" width="164" height="7" rx="2" fill="url(#nr-desk)" />
          <rect x="624" y="116" width="164" height="1.5" fill="#fff" opacity="0.12" />
          <rect x="632" y="123" width="6" height="15" fill="#1d2e5a" />
          <rect x="774" y="123" width="6" height="15" fill="#1d2e5a" />
          <rect x="740" y="123" width="44" height="15" fill="#1a2b52" />
          <rect x="748" y="128" width="28" height="2" rx="1" fill="#2f4478" />
          {/* Portátil abierto, con su gráfica dibujándose. */}
          <path d="M660 116 L664 92 H712 L716 116 Z" fill="#17284f" stroke="#33477c" strokeWidth="1.5" />
          <path d="M665.5 114 L669 94.5 H707.5 L710.5 114 Z" fill="#0b1730" />
          <path className="nr-laptop-line" d="M672 108 L679 102 L686 105 L693 98 L700 100 L706 95" stroke="#5fd39a" strokeWidth="1.3" fill="none" strokeLinecap="round" />
          <rect x="654" y="115" width="68" height="3.5" rx="1.75" fill="#33477c" />
          <ellipse cx="688" cy="124" rx="34" ry="3" fill="#6ab8ff" opacity="0.1" />
          {/* Café humeante. */}
          <g>
            <rect x="730" y="104" width="13" height="12" rx="2.5" fill="#dfe8ff" opacity="0.9" />
            <path d="M743 107 Q749 110 743 113" stroke="#dfe8ff" strokeWidth="1.8" fill="none" opacity="0.9" />
            <rect x="731.5" y="105.5" width="10" height="2" fill="#5a3a1c" opacity="0.7" />
            <g className="nr-steam" stroke="#dfe8ff" strokeWidth="1.1" strokeLinecap="round" fill="none">
              <path d="M734 100 Q731 96 734 92 Q737 88 734 84" />
              <path d="M739 101 Q736 97 739 93 Q742 89 739 85" />
            </g>
          </g>
          {/* Lámpara de brazo. */}
          <line x1="700" y1="116" x2="700" y2="62" stroke="#33477c" strokeWidth="2.5" />
          <line x1="700" y1="62" x2="722" y2="52" stroke="#33477c" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M710 50 H734 L728 40 H716 Z" fill="#c48a32" />
          <path d="M712 50 L706 66 H738 L732 50 Z" className="nr-lamp-cone" fill="#f0c76e" opacity="0.08" />
          {/* Planta. */}
          <rect x="756" y="98" width="18" height="18" rx="3" fill="#7a4d2a" />
          <rect x="754" y="96" width="22" height="4" rx="1.5" fill="#8f5a32" />
          <g className="nr-plant" stroke="#2f7a68" strokeWidth="4" strokeLinecap="round" fill="none">
            <path d="M765 97 Q752 84 758 70" /><path d="M765 97 Q776 80 772 66" /><path d="M765 97 Q764 84 766 74" />
          </g>
          <g fill="#3d9a84">
            <ellipse cx="757" cy="70" rx="4" ry="2.6" transform="rotate(-40 757 70)" /><ellipse cx="772" cy="66" rx="4" ry="2.6" transform="rotate(35 772 66)" /><ellipse cx="766" cy="74" rx="3.4" ry="2.2" />
          </g>
          {/* Libreta y bolígrafo. */}
          <rect x="636" y="108" width="22" height="8" rx="1.5" fill="#dfe8ff" opacity="0.85" transform="rotate(-6 647 112)" />
          <line x1="638" y1="113" x2="652" y2="111" stroke="#9fb3d9" strokeWidth="0.8" opacity="0.7" />
          <line x1="660" y1="107" x2="668" y2="114" stroke="#f0c76e" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}
