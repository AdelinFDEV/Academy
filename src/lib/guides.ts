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
  /**
   * Día en que se publicó («AAAA-MM-DD», hora de Rumanía). Lo usa el resumen
   * mensual de /admin/objetivos (Crecimiento). Hasta el 05-11-2026 esa fecha
   * salía del aviso del bot de Telegram; las guías anteriores no la tienen
   * porque sus avisos se sembraron todos el mismo día y no eran su fecha real.
   * Ponla en cada guía nueva al publicarla.
   */
  publicada?: string;
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

export function getGuide(slug: string): GuideMeta | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
