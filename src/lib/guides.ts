export interface GuideMeta {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  difficulty: "básico" | "intermedio" | "avanzado";
  type: "free" | "premium";
  sections: number;
  badge: string;
  badgeId: string;
  readTime: string;
  color: string;
  topics: string[];
  tags: string[];
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
    type: "free",
    sections: 8,
    badge: "Arquitecto de Cadenas",
    badgeId: "guide-blockchain",
    readTime: "25 min",
    color: "#e6b455",
    topics: ["Origen e historia", "Cómo funciona", "Estado actual 2026", "Amenaza cuántica"],
    tags: ["EXPLICACIONES"],
  },
  {
    slug: "ciclos-de-bitcoin",
    title: "¿Por Qué Ahora Es el Momento de Comprar Bitcoin?",
    shortTitle: "Ciclos de Bitcoin",
    description: "El ciclo de 4 años del halving: por qué la fase bajista está terminando y qué esperar del próximo mercado alcista.",
    difficulty: "intermedio",
    type: "free",
    sections: 5,
    badge: "Cazador de Ciclos",
    badgeId: "guide-ciclos-bitcoin",
    readTime: "15 min",
    color: "#e6b455",
    topics: ["El ciclo de 4 años", "Dónde estamos ahora", "Señales de compra", "Estrategia de entrada"],
    tags: ["EXPLICACIONES"],
  },
  {
    slug: "worldcoin",
    title: "¿Qué es Worldcoin? La Criptomoneda que Escanea tu Iris",
    shortTitle: "Worldcoin",
    description: "El proyecto de Sam Altman que reparte criptomoneda a cambio de escanear tu iris: cómo funciona el Orb, qué es World ID y por qué ha sido prohibido en varios países.",
    difficulty: "intermedio",
    type: "free",
    sections: 8,
    badge: "Prueba de Humanidad",
    badgeId: "guide-worldcoin",
    readTime: "18 min",
    color: "#e6b455",
    topics: ["El Orb y World ID", "Proof of Personhood", "Tokenomics de WLD", "Controversias y prohibiciones"],
    tags: ["CRIPTOMONEDAS"],
  },
  {
    slug: "render",
    title: "¿Qué es Render (RENDER)? La Red que Alquila la Potencia de tu GPU",
    shortTitle: "Render",
    description: "El proyecto que conecta a artistas 3D con GPUs ociosas de todo el mundo: cómo funciona el renderizado descentralizado, su tokenomics Burn-and-Mint, la migración a Solana y por qué es la estrella del sector DePIN.",
    difficulty: "intermedio",
    type: "free",
    sections: 8,
    badge: "Nodo Verificado",
    badgeId: "guide-render",
    readTime: "18 min",
    color: "#e6b455",
    topics: ["GPUs ociosas en red", "Proof of Render", "Burn-and-Mint Equilibrium", "DePIN e IA"],
    tags: ["CRIPTOMONEDAS"],
  },
  {
    slug: "hyperliquid",
    title: "¿Qué es Hyperliquid? El Exchange de Perpetuos que Vive On-Chain",
    shortTitle: "Hyperliquid",
    description: "El DEX de perpetuos que corre sobre su propia blockchain con un libro de órdenes 100% on-chain: cómo logra velocidad de exchange centralizado sin custodia, qué son HyperBFT y HyperEVM, el vault HLP y el token HYPE del airdrop sin fondos de inversores.",
    difficulty: "intermedio",
    type: "free",
    sections: 8,
    badge: "Maestro del Libro de Órdenes",
    badgeId: "guide-hyperliquid",
    readTime: "20 min",
    color: "#e6b455",
    topics: ["Libro de órdenes on-chain", "HyperBFT y HyperEVM", "El vault HLP", "Token HYPE y buybacks"],
    tags: ["CRIPTOMONEDAS"],
  },
  {
    slug: "xrp",
    title: "¿Qué es XRP y Ripple? El Activo Puente para Pagos Globales",
    shortTitle: "XRP y Ripple",
    description: "XRP, Ripple y el XRP Ledger explicados a fondo: la diferencia entre la empresa y el activo, cómo funciona el consenso sin minería del XRPL (RPCA y la UNL), su papel como moneda puente en pagos internacionales, el juicio con la SEC, el escrow y los riesgos de centralización. Con simulador de consenso, quiz y badge.",
    difficulty: "avanzado",
    type: "free",
    sections: 8,
    badge: "Validador de Confianza",
    badgeId: "guide-xrp",
    readTime: "22 min",
    color: "#e6b455",
    topics: ["Ripple vs XRP vs XRPL", "Consenso sin minería (RPCA/UNL)", "Moneda puente y ODL", "El caso SEC y el escrow"],
    tags: ["CRIPTOMONEDAS"],
  },
  {
    slug: "fiscalidad-cripto-espana",
    title: "Fiscalidad Cripto en España: Modelo 721, Staking, FIFO y Ganancias",
    shortTitle: "Fiscalidad cripto",
    description: "Qué tributa y qué no, el método FIFO obligatorio, la escala del ahorro del 19% al 30%, cómo declarar staking, airdrops y minería, el modelo 721 de criptomonedas en el extranjero, el Impuesto sobre el Patrimonio y la compensación de pérdidas. Con simulador FIFO y calculadora de impuestos por tramos.",
    difficulty: "avanzado",
    type: "premium",
    sections: 9,
    badge: "Cuentas Claras",
    badgeId: "guide-fiscalidad-cripto",
    readTime: "28 min",
    color: "#e6b455",
    topics: ["Hechos imponibles", "FIFO y tramos del ahorro", "Staking, airdrops y minería", "Modelo 721 y Patrimonio"],
    tags: ["EXPLICACIONES"],
  },
];

export function getGuide(slug: string): GuideMeta | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
