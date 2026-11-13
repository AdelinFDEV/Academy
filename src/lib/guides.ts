/**
 * Una guía. Desde el 31-10-2026 TODAS se leen enteras sin cuenta ni pago; lo
 * único que pide una cuenta gratuita es su quiz (`GuideQuizCuenta`), porque
 * guarda el resultado y desbloquea el logro.
 */
export interface GuideMeta {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  difficulty: "básico" | "intermedio" | "avanzado";
  sections: number;
  badge: string;
  badgeId: string;
  readTime: string;
  color: string;
  topics: string[];
  tags: string[];
  /**
   * Foto de portada, en `public/` (p. ej. `/guias/xrp.webp`). WebP a 1.600 px
   * de ancho y calidad 82, como toda portada. Sin ella, las tarjetas pintan
   * el color de la guía con su título corto.
   */
  portada?: string;
  /** Tiene su propio `opengraph-image.tsx` en su carpeta. */
  imagenPropia?: boolean;
}

// El último elemento del array es siempre la guía más reciente —
// GuidesHomeSection la usa como "guía destacada" en la home automáticamente.
export const GUIDES: GuideMeta[] = [
  {
    slug: "que-es-la-blockchain",
    title: "¿Qué es la Blockchain?",
    shortTitle: "Blockchain",
    description: "De Satoshi al presente: historia, funcionamiento, estado actual y amenaza cuántica.",
    difficulty: "básico",
    sections: 8,
    badge: "Arquitecto de Cadenas",
    badgeId: "guide-blockchain",
    readTime: "25 min",
    color: "#e6b455",
    topics: ["Origen e historia", "Cómo funciona", "Estado actual 2026", "Amenaza cuántica"],
    tags: ["EXPLICACIONES"],
    portada: "/guias/que-es-la-blockchain.webp",
  },
  {
    slug: "worldcoin",
    title: "¿Qué es Worldcoin? La Criptomoneda que Escanea tu Iris",
    shortTitle: "Worldcoin",
    description: "El proyecto de Sam Altman que reparte criptomoneda a cambio de escanear tu iris: cómo funciona el Orb, qué es World ID y por qué ha sido prohibido en varios países.",
    difficulty: "intermedio",
    sections: 8,
    badge: "Prueba de Humanidad",
    badgeId: "guide-worldcoin",
    readTime: "18 min",
    color: "#e6b455",
    topics: ["El Orb y World ID", "Proof of Personhood", "Tokenomics de WLD", "Controversias y prohibiciones"],
    tags: ["CRIPTOMONEDAS"],
    portada: "/guias/worldcoin.webp",
  },
  {
    slug: "render",
    title: "¿Qué es Render (RENDER)? La Red que Alquila la Potencia de tu GPU",
    shortTitle: "Render",
    description: "El proyecto que conecta a artistas 3D con GPUs ociosas de todo el mundo: cómo funciona el renderizado descentralizado, su tokenomics Burn-and-Mint, la migración a Solana y por qué es la estrella del sector DePIN.",
    difficulty: "intermedio",
    sections: 8,
    badge: "Nodo Verificado",
    badgeId: "guide-render",
    readTime: "18 min",
    color: "#e6b455",
    topics: ["GPUs ociosas en red", "Proof of Render", "Burn-and-Mint Equilibrium", "DePIN e IA"],
    tags: ["CRIPTOMONEDAS"],
    portada: "/guias/render.webp",
  },
  {
    slug: "hyperliquid",
    title: "¿Qué es Hyperliquid? El Exchange de Perpetuos que Vive On-Chain",
    shortTitle: "Hyperliquid",
    description: "El DEX de perpetuos que corre sobre su propia blockchain con un libro de órdenes 100% on-chain: cómo logra velocidad de exchange centralizado sin custodia, qué son HyperBFT y HyperEVM, el vault HLP y el token HYPE del airdrop sin fondos de inversores.",
    difficulty: "intermedio",
    sections: 8,
    badge: "Maestro del Libro de Órdenes",
    badgeId: "guide-hyperliquid",
    readTime: "20 min",
    color: "#e6b455",
    topics: ["Libro de órdenes on-chain", "HyperBFT y HyperEVM", "El vault HLP", "Token HYPE y buybacks"],
    tags: ["CRIPTOMONEDAS"],
    portada: "/guias/hyperliquid.webp",
  },
  {
    slug: "xrp",
    title: "¿Qué es XRP y Ripple? El Activo Puente para Pagos Globales",
    shortTitle: "XRP y Ripple",
    description: "XRP, Ripple y el XRP Ledger explicados a fondo: la diferencia entre la empresa y el activo, cómo funciona el consenso sin minería del XRPL (RPCA y la UNL), su papel como moneda puente en pagos internacionales, el juicio con la SEC, el escrow y los riesgos de centralización. Con simulador de consenso, quiz y badge.",
    difficulty: "avanzado",
    sections: 8,
    badge: "Validador de Confianza",
    badgeId: "guide-xrp",
    readTime: "22 min",
    color: "#e6b455",
    topics: ["Ripple vs XRP vs XRPL", "Consenso sin minería (RPCA/UNL)", "Moneda puente y ODL", "El caso SEC y el escrow"],
    tags: ["CRIPTOMONEDAS"],
    portada: "/guias/xrp.webp",
  },
  {
    slug: "fiscalidad-cripto-espana",
    title: "Fiscalidad Cripto en España: Modelo 721, Staking, FIFO y Ganancias",
    shortTitle: "Fiscalidad cripto",
    description: "Qué tributa y qué no, el método FIFO obligatorio, la escala del ahorro del 19% al 30%, cómo declarar staking, airdrops y minería, el modelo 721 de criptomonedas en el extranjero, el Impuesto sobre el Patrimonio y la compensación de pérdidas. Con simulador FIFO y calculadora de impuestos por tramos.",
    difficulty: "avanzado",
    sections: 9,
    badge: "Cuentas Claras",
    badgeId: "guide-fiscalidad-cripto",
    readTime: "28 min",
    color: "#e6b455",
    topics: ["Hechos imponibles", "FIFO y tramos del ahorro", "Staking, airdrops y minería", "Modelo 721 y Patrimonio"],
    tags: ["EXPLICACIONES"],
    portada: "/guias/fiscalidad-cripto-espana.webp",
    imagenPropia: true,
  },
  {
    slug: "como-hacer-un-diario-de-trading",
    title: "Cómo hacer un diario de trading",
    shortTitle: "Diario de trading",
    description: "Qué apuntar en cada operación, las cuatro cifras que dicen si tu método gana dinero, cómo registrar las emociones y la rutina para revisarlo. Con calculadora de R y esperanza.",
    difficulty: "básico",
    sections: 8,
    badge: "Bitácora al Día",
    badgeId: "guide-diario-trading",
    readTime: "16 min",
    color: "#e6b455",
    topics: ["Qué apuntar", "Win rate, R y esperanza", "Emociones", "Rutina de revisión"],
    tags: ["EXPLICACIONES"],
    portada: "/guias/como-hacer-un-diario-de-trading.webp",
  },
];

/**
 * Las guías de la MÁS NUEVA a la más antigua — el orden en que se le muestran
 * al usuario en cualquier listado.
 *
 * `GUIDES` se mantiene en orden cronológico (la más antigua primero) a
 * propósito, porque la home toma la guía destacada con
 * `GUIDES[GUIDES.length - 1]`. Invertir el array original romperia eso, así
 * que aquí se expone una copia invertida y los listados usan esta.
 */
export const GUIDES_NEWEST_FIRST: GuideMeta[] = [...GUIDES].reverse();

/**
 * Una guía terminada que espera en /admin/acciones a que el admin la publique.
 *
 * Tiene su carpeta, su CSS y su quiz como cualquier otra, y está desplegada,
 * pero nadie la ve salvo el admin: no sale en listados, ni en el sitemap, y su
 * URL responde 404 a los demás. El admin la publica con un botón, que apunta
 * su slug en la tabla `guias_publicadas`; desde ese momento es pública sin
 * desplegar nada (`src/lib/guiasVisibles.ts`).
 */
export interface GuiaBorrador extends GuideMeta {
  /** Día en que quedó lista («AAAA-MM-DD»). */
  lista: string;
  /** La consulta de Google a la que responde. */
  consulta: string;
  /** Día de su auditoría SEO («AAAA-MM-DD»), o null si el admin dijo que no. */
  auditada: string | null;
}

/**
 * Las guías construidas y sin publicar. **Una guía nueva se da de alta AQUÍ,
 * nunca directamente en `GUIDES`**: así desplegar no la publica, y publicar es
 * siempre un gesto del admin.
 *
 * Cuando el admin ya la ha publicado, en la siguiente sesión se «asciende»: su
 * objeto se mueve al final de `GUIDES` (sin `lista`, `consulta` ni `auditada`)
 * y se borra de aquí. Hasta entonces ya es pública, indexable y con su quiz;
 * lo que le falta son el buscador de guías y la vitrina de Logros, que leen
 * `GUIDES` desde el navegador.
 */
export const BORRADORES: GuiaBorrador[] = [
  {
    slug: "ethereum",
    title: "Qué es Ethereum y cómo funciona",
    shortTitle: "Ethereum",
    description: "Ethereum sin jerga: qué son los contratos inteligentes, cuánto cuesta el gas con una calculadora, cómo funciona el staking, por qué existen las capas 2 y los tres errores que más dinero cuestan.",
    difficulty: "básico",
    sections: 9,
    badge: "Ordenador Mundial",
    badgeId: "guide-ethereum",
    readTime: "14 min",
    color: "#e6b455",
    topics: ["Contratos inteligentes", "El gas, con números", "Staking y capas 2", "Errores caros"],
    tags: ["CRIPTOMONEDAS"],
    lista: "2026-11-13",
    consulta: "qué es ethereum",
    auditada: "2026-11-13",
  },
  {
    slug: "solana",
    title: "Qué es Solana y qué ha pagado por ser tan rápida",
    shortTitle: "Solana",
    description: "Por qué Solana es tan rápida y barata, lo que cuesta de verdad usarla, las seis caídas de la red con fecha y causa, cuánto rinde el staking de SOL descontando la inflación y sus riesgos.",
    difficulty: "intermedio",
    sections: 9,
    badge: "A Contrarreloj",
    badgeId: "guide-solana",
    readTime: "13 min",
    color: "#e6b455",
    topics: ["Por qué es tan rápida", "Comisiones y depósitos", "Las caídas, una a una", "El staking de SOL"],
    tags: ["CRIPTOMONEDAS"],
    lista: "2026-11-13",
    consulta: "qué es solana",
    auditada: "2026-11-13",
  },
  {
    slug: "cardano",
    title: "Qué es Cardano (ADA) y cuánto rinde su staking",
    shortTitle: "Cardano",
    description: "Cardano y ADA explicados con las preguntas que se hace la gente: por qué avanza despacio, cuánto rinde el staking con calculadora, cómo elegir un pool y qué se le critica al proyecto.",
    difficulty: "básico",
    sections: 8,
    badge: "Delegador Paciente",
    badgeId: "guide-cardano",
    readTime: "13 min",
    color: "#e6b455",
    topics: ["Por qué va despacio", "Staking sin bloqueo", "Cómo elegir un pool", "Quién decide"],
    tags: ["CRIPTOMONEDAS"],
    lista: "2026-11-13",
    consulta: "qué es cardano",
    auditada: "2026-11-13",
  },
  {
    slug: "chainlink",
    title: "Qué es Chainlink (LINK) y para qué sirve",
    shortTitle: "Chainlink",
    description: "Chainlink explicado con un solo ejemplo: cómo llega un precio a una blockchain, un simulador para intentar engañar a la red, para qué sirve LINK, qué cubre su staking y un fallo real.",
    difficulty: "intermedio",
    sections: 8,
    badge: "Mensajero Fiable",
    badgeId: "guide-chainlink",
    readTime: "12 min",
    color: "#e6b455",
    topics: ["El problema del oráculo", "Un precio, paso a paso", "El token LINK", "Cuando falla"],
    tags: ["CRIPTOMONEDAS"],
    lista: "2026-11-13",
    consulta: "qué es chainlink",
    auditada: "2026-11-13",
  },
  {
    slug: "bnb",
    title: "Qué es BNB y para qué sirve sin Binance",
    shortTitle: "BNB",
    description: "BNB explicada desde España: sus dos vidas, la del exchange y la de su red, las quemas de 2026 una a una con calculadora, qué cambia tras la salida de Binance de la UE y sus riesgos.",
    difficulty: "básico",
    sections: 8,
    badge: "Combustible de la Casa",
    badgeId: "guide-bnb",
    readTime: "13 min",
    color: "#e6b455",
    topics: ["Sus dos vidas", "Las quemas, con cifras", "Sin Binance en España", "Errores caros"],
    tags: ["CRIPTOMONEDAS"],
    lista: "2026-11-13",
    consulta: "qué es bnb",
    auditada: "2026-11-13",
  },
  {
    slug: "tron",
    title: "Qué es TRON (TRX) y por qué mueve el USDT",
    shortTitle: "TRON",
    description: "TRON contada desde un envío de 500 USDT: qué son la energía y el ancho de banda, cuánto cuesta de verdad un envío TRC-20 con calculadora, quién controla la red y lo que casi nadie explica.",
    difficulty: "básico",
    sections: 8,
    badge: "Peaje Pagado",
    badgeId: "guide-tron",
    readTime: "12 min",
    color: "#e6b455",
    topics: ["La red del USDT", "El coste de un envío", "Quién manda", "El USDT se puede congelar"],
    tags: ["CRIPTOMONEDAS"],
    lista: "2026-11-13",
    consulta: "qué es tron",
    auditada: "2026-11-13",
  },
  {
    slug: "monero",
    title: "Qué es Monero (XMR) y si es legal en España",
    shortTitle: "Monero",
    description: "Monero sin mitos: qué ve un observador en Bitcoin y qué ve en Monero, siete afirmaciones con su veredicto, la norma europea que llega en julio de 2027 y cómo se declara en España.",
    difficulty: "intermedio",
    sections: 8,
    badge: "Sobre Cerrado",
    badgeId: "guide-monero",
    readTime: "13 min",
    color: "#e6b455",
    topics: ["Qué oculta y cómo", "Verdadero o falso", "Situación legal en la UE", "Monero y Hacienda"],
    tags: ["CRIPTOMONEDAS"],
    lista: "2026-11-13",
    consulta: "qué es monero",
    auditada: "2026-11-13",
  },
  {
    slug: "stellar",
    title: "Qué es Stellar (XLM) y en qué difiere de XRP",
    shortTitle: "Stellar",
    description: "Stellar de lo práctico a lo teórico: la reserva mínima con calculadora, las líneas de confianza y el memo, sus diferencias con XRP, la historia de sus 50.000 millones de XLM y quién la usa.",
    difficulty: "básico",
    sections: 8,
    badge: "Línea de Confianza",
    badgeId: "guide-stellar",
    readTime: "12 min",
    color: "#e6b455",
    topics: ["Tres sorpresas al empezar", "La reserva, con números", "Stellar frente a XRP", "Cuántos XLM hay"],
    tags: ["CRIPTOMONEDAS"],
    lista: "2026-11-13",
    consulta: "qué es stellar",
    auditada: "2026-11-13",
  },
];

/** Publicadas y borradores: para validar un slug o un logro, exista como exista. */
export const TODAS_LAS_GUIAS: GuideMeta[] = [...GUIDES, ...BORRADORES];

export function getGuide(slug: string): GuideMeta | undefined {
  return [...GUIDES, ...BORRADORES].find((g) => g.slug === slug);
}
