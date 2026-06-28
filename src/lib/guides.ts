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
}

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
  },
];

export function getGuide(slug: string): GuideMeta | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
