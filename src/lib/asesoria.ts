// Fuente única de verdad de las asesorías 1:1.
//
// Precio, duración y contenidos viven SOLO aquí: la página /asesoria, la banda
// del hero, el dashboard, la página Premium y el cierre de cada guía leen de
// este archivo. Cambiar una tarifa es tocar una línea, no diez plantillas.
//
// La reserva se hace por Instagram: el CTA abre directamente el DM contigo
// (ig.me/m/<usuario>), no el perfil, para que el cliente no tenga que buscar
// el botón de mensaje.

export const INSTAGRAM_USER = "adelinbtc";
export const INSTAGRAM_DM_URL = `https://ig.me/m/${INSTAGRAM_USER}`;
export const INSTAGRAM_PROFILE_URL = `https://www.instagram.com/${INSTAGRAM_USER}`;

export interface AsesoriaPlan {
  id: string;
  name: string;
  /** Gancho corto — se usa en las bandas de entrada, no en la página. */
  tagline: string;
  /** Precio ya formateado para mostrar. */
  price: string;
  /** Precio anterior tachado (opcional) — comunica el descuento. */
  oldPrice?: string;
  /** El precio anterior como número, para calcular el % de ahorro. */
  oldPriceValue?: number;
  /** El mismo precio como número, para ordenar y calcular el "desde". */
  priceValue: number;
  /** Texto bajo el precio: duración o formato. */
  priceNote: string;
  /** Para quién es. Evita solicitudes que no encajan. */
  audience: string;
  summary: string;
  /** Lo que incluye. En el pack, cada bloque de trabajo. */
  includes: string[];
  /** Color de acento de la tarjeta. */
  color: string;
  /** El plan destacado se pinta con más peso visual. */
  featured?: boolean;
  /** Texto que se preescribe en el DM de Instagram. */
  dmIntent: string;
}

export const ASESORIA_PLANS: AsesoriaPlan[] = [
  {
    id: "general",
    name: "Asesoría General",
    tagline: "Una hora, tus dudas, respuestas directas",
    price: "199€",
    priceValue: 199,
    priceNote: "1 hora · sesión individual",
    audience:
      "Para quien ya opera y necesita desatascar algo concreto: una estrategia que no termina de funcionar, un patrón de errores que se repite o una decisión que no sabe cómo tomar.",
    summary:
      "Una sesión individual de una hora, en directo y solo tú y yo. Traes tus dudas, tus operaciones y tu forma de operar, y las revisamos sin rodeos.",
    includes: [
      "Revisión de tu operativa actual y de tus últimas operaciones",
      "Estrategias de trading adaptadas a tu perfil y a tu tiempo disponible",
      "Gestión de riesgo: tamaño de posición, stops y exposición máxima",
      "Psicología de trading: miedo, avaricia y disciplina para seguir tu plan",
      "Resumen de conclusiones y siguientes pasos al terminar",
    ],
    color: "#e6b455",
    dmIntent: "Hola Adelin, me interesa la Asesoría General de 1 hora.",
  },
  {
    id: "pack-trader",
    name: "Conviértete en Trader",
    tagline: "El programa completo, de cero a operativa propia",
    price: "1.499€",
    oldPrice: "3.499€",
    oldPriceValue: 3499,
    priceValue: 1499,
    priceNote: "programa completo · seguimiento 30 días",
    audience:
      "Para quien no quiere resolver una duda suelta, sino construir un método completo y tener a alguien encima mientras lo pone en práctica.",
    summary:
      "El programa entero: las tres estrategias con las que opero, la gestión de riesgo que las sostiene y un mes de seguimiento para que no te quedes solo cuando llegue el momento de ejecutarlas.",
    includes: [
      "Todas las ventajas de la Asesoría General",
      "Estrategia Spot en mercado alcista",
      "Estrategia Spot en mercado bajista",
      "Estrategia de DayTrading rentable en futuros",
      "Gestión de riesgo aplicada a las tres estrategias",
      "Seguimiento personalizado durante 30 días",
    ],
    color: "#ff6b2b",
    featured: true,
    dmIntent: "Hola Adelin, me interesa el pack Conviértete en Trader.",
  },
];

/** Los cuatro pilares que se trabajan. Se usan en la página y en las bandas. */
export const ASESORIA_PILLARS = [
  {
    id: "trading",
    title: "Trading",
    desc: "Cómo leer el mercado y ejecutar sin improvisar en cada vela.",
  },
  {
    id: "estrategias",
    title: "Estrategias",
    desc: "Un método concreto para spot y futuros, no teoría genérica.",
  },
  {
    id: "riesgo",
    title: "Gestión de riesgo",
    desc: "Cuánto arriesgas por operación y dónde está tu límite real.",
  },
  {
    id: "psicologia",
    title: "Psicología",
    desc: "El motivo por el que sabes qué hacer y aun así no lo haces.",
  },
];

/**
 * Enlace al DM de Instagram. Instagram no admite prerrellenar el mensaje desde
 * un enlace, así que el `intent` no viaja en la URL — se muestra en la página
 * para que el cliente sepa qué escribir, y así te llega ya identificado.
 */
export const asesoriaDmUrl = () => INSTAGRAM_DM_URL;
