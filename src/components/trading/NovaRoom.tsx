/**
 * La habitación de Nova: un fondo fijo y sencillo para su espacio bajo el saludo.
 * Una sala de trader de noche: ventana con la ciudad, estantería con libros y un
 * bitcoin, reloj, un monitor con velas en la pared y un escritorio con portátil,
 * café y una planta. Tonos apagados a propósito: el protagonista es Nova.
 *
 * Un solo SVG que cubre el espacio (slice): en pantallas estrechas se recortan
 * los lados, nunca se deforma.
 */
export default function NovaRoom() {
  return (
    <div className="tjbot-room" aria-hidden="true">
      <svg viewBox="0 0 800 172" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="nr-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14254c" />
            <stop offset="100%" stopColor="#101e3e" />
          </linearGradient>
          <linearGradient id="nr-floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f1b37" />
            <stop offset="100%" stopColor="#0a142a" />
          </linearGradient>
          <linearGradient id="nr-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0b1530" />
            <stop offset="100%" stopColor="#1d2f5e" />
          </linearGradient>
          <radialGradient id="nr-lamp" cx="0.5" cy="0" r="0.9">
            <stop offset="0%" stopColor="#f0c76e" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#f0c76e" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Pared, suelo y rodapié. */}
        <rect width="800" height="172" fill="url(#nr-wall)" />
        <rect y="138" width="800" height="34" fill="url(#nr-floor)" />
        <rect y="136" width="800" height="3" fill="#1c2c55" />
        {/* Luz cálida de una lámpara sobre el escritorio. */}
        <ellipse cx="700" cy="70" rx="150" ry="110" fill="url(#nr-lamp)" />

        {/* Ventana con la ciudad de noche. */}
        <g>
          <rect x="34" y="20" width="118" height="86" rx="6" fill="url(#nr-sky)" stroke="#2a3d6e" strokeWidth="3" />
          <circle cx="126" cy="40" r="8" fill="#e9e3c8" opacity="0.85" />
          <circle cx="130" cy="37" r="7" fill="#132650" opacity="0.9" />
          <g fill="#c9d6f5" opacity="0.7">
            <circle cx="52" cy="34" r="1" /><circle cx="78" cy="28" r="1.2" /><circle cx="98" cy="44" r="0.9" /><circle cx="64" cy="50" r="0.8" />
          </g>
          <path d="M37 103 V82 H48 V74 H58 V86 H66 V68 H78 V80 H86 V72 H96 V88 H106 V64 H118 V84 H128 V76 H140 V90 H149 V103 Z" fill="#0a1328" />
          <g fill="#f0c76e" opacity="0.55">
            <rect x="70" y="72" width="2" height="2" /><rect x="74" y="78" width="2" height="2" /><rect x="110" y="70" width="2" height="2" />
            <rect x="113" y="78" width="2" height="2" /><rect x="51" y="80" width="2" height="2" /><rect x="132" y="82" width="2" height="2" />
          </g>
          <line x1="93" y1="21" x2="93" y2="105" stroke="#2a3d6e" strokeWidth="2.5" />
          <line x1="35" y1="63" x2="151" y2="63" stroke="#2a3d6e" strokeWidth="2.5" />
          <rect x="28" y="104" width="130" height="5" rx="2" fill="#24376a" />
        </g>

        {/* Estantería con libros y un bitcoin. */}
        <g>
          <rect x="208" y="70" width="104" height="4" rx="2" fill="#2a3d6e" />
          <rect x="216" y="44" width="9" height="26" rx="1.5" fill="#3b5394" />
          <rect x="227" y="48" width="8" height="22" rx="1.5" fill="#6a4fb0" opacity="0.8" />
          <rect x="237" y="41" width="10" height="29" rx="1.5" fill="#c48a32" opacity="0.75" />
          <rect x="249" y="50" width="7" height="20" rx="1.5" fill="#2f7a68" opacity="0.85" />
          <rect x="258" y="52" width="22" height="7" rx="1.5" fill="#3b5394" transform="rotate(-8 269 55)" />
          <circle cx="295" cy="59" r="10" fill="#d79c3e" />
          <circle cx="295" cy="59" r="7.5" fill="none" stroke="#f5d48a" strokeWidth="1.2" />
          <text x="295" y="63" textAnchor="middle" fontSize="11" fontWeight="800" fill="#7a4d12">₿</text>
        </g>

        {/* Reloj de pared. */}
        <g>
          <circle cx="388" cy="46" r="17" fill="#162a55" stroke="#2a3d6e" strokeWidth="3" />
          <line x1="388" y1="46" x2="388" y2="35" stroke="#c9d6f5" strokeWidth="2" strokeLinecap="round" />
          <line x1="388" y1="46" x2="396" y2="50" stroke="#f0c76e" strokeWidth="2" strokeLinecap="round" />
          <circle cx="388" cy="46" r="2" fill="#f0c76e" />
        </g>

        {/* Monitor en la pared con velas y precio. */}
        <g>
          <rect x="462" y="22" width="150" height="82" rx="7" fill="#0a1328" stroke="#2a3d6e" strokeWidth="3" />
          <g stroke="#1b2a4f" strokeWidth="1">
            <line x1="470" y1="44" x2="604" y2="44" /><line x1="470" y1="64" x2="604" y2="64" /><line x1="470" y1="84" x2="604" y2="84" />
          </g>
          <g>
            <line x1="482" y1="62" x2="482" y2="90" stroke="#5fd39a" strokeWidth="1.2" /><rect x="478" y="68" width="8" height="16" rx="1" fill="#5fd39a" />
            <line x1="498" y1="56" x2="498" y2="84" stroke="#ff5c5c" strokeWidth="1.2" /><rect x="494" y="62" width="8" height="14" rx="1" fill="#ff5c5c" />
            <line x1="514" y1="50" x2="514" y2="78" stroke="#5fd39a" strokeWidth="1.2" /><rect x="510" y="56" width="8" height="16" rx="1" fill="#5fd39a" />
            <line x1="530" y1="44" x2="530" y2="70" stroke="#5fd39a" strokeWidth="1.2" /><rect x="526" y="50" width="8" height="14" rx="1" fill="#5fd39a" />
            <line x1="546" y1="48" x2="546" y2="74" stroke="#ff5c5c" strokeWidth="1.2" /><rect x="542" y="54" width="8" height="12" rx="1" fill="#ff5c5c" />
            <line x1="562" y1="38" x2="562" y2="66" stroke="#5fd39a" strokeWidth="1.2" /><rect x="558" y="42" width="8" height="18" rx="1" fill="#5fd39a" />
            <line x1="578" y1="32" x2="578" y2="58" stroke="#5fd39a" strokeWidth="1.2" /><rect x="574" y="36" width="8" height="15" rx="1" fill="#5fd39a" />
          </g>
          <path d="M470 86 L486 76 L500 72 L516 64 L532 57 L548 60 L564 50 L580 43 L604 36" stroke="#f0c76e" strokeWidth="1.5" fill="none" opacity="0.8" />
          <text x="470" y="34" fontSize="8" fontWeight="800" fill="#f5d48a" opacity="0.85">BTC/USDT</text>
          <rect x="530" y="104" width="14" height="10" fill="#22335f" />
        </g>

        {/* Escritorio con portátil, café, lámpara y una planta. */}
        <g>
          <rect x="628" y="112" width="152" height="6" rx="2" fill="#2a3d6e" />
          <rect x="640" y="118" width="5" height="20" fill="#22335f" />
          <rect x="763" y="118" width="5" height="20" fill="#22335f" />
          <path d="M664 112 L668 92 H712 L716 112 Z" fill="#1b2a4f" stroke="#33477c" strokeWidth="1.5" />
          <path d="M674 106 L682 100 L690 103 L698 96 L706 98" stroke="#5fd39a" strokeWidth="1.3" fill="none" />
          <rect x="660" y="111" width="60" height="3" rx="1.5" fill="#33477c" />
          <rect x="730" y="100" width="12" height="12" rx="2" fill="#c9d6f5" opacity="0.85" />
          <path d="M742 103 Q747 106 742 109" stroke="#c9d6f5" strokeWidth="1.5" fill="none" opacity="0.85" />
          <path d="M734 96 Q732 92 735 88 M739 96 Q737 91 740 87" stroke="#c9d6f5" strokeWidth="1" fill="none" opacity="0.35" />
          <line x1="700" y1="112" x2="700" y2="60" stroke="#33477c" strokeWidth="2" />
          <path d="M688 60 H712 L706 50 H694 Z" fill="#c48a32" opacity="0.8" />
          <rect x="784" y="122" width="16" height="16" rx="2" fill="#7a4d2a" opacity="0.8" />
          <path d="M792 122 Q780 108 786 96 M792 122 Q800 104 796 92 M792 122 Q790 110 792 100" stroke="#2f7a68" strokeWidth="4" strokeLinecap="round" fill="none" />
        </g>
      </svg>
    </div>
  );
}
