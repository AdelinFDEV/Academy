export interface GuideMeta {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  difficulty: "básico" | "intermedio" | "avanzado";
  type: "free" | "premium";
  sections: number;
  badge: string;
  readTime: string;
  color: string;
  topics: string[];
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
    readTime: "25 min",
    color: "#e6b455",
    topics: ["Origen e historia", "Cómo funciona", "Estado actual 2026", "Amenaza cuántica"],
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
    readTime: "15 min",
    color: "#e6b455",
    topics: ["El ciclo de 4 años", "Dónde estamos ahora", "Señales de compra", "Estrategia de entrada"],
  },
];

export function getGuide(slug: string): GuideMeta | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
