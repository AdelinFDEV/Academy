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
];

export function getGuide(slug: string): GuideMeta | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
