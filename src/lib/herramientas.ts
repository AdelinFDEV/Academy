/**
 * Catálogo de las herramientas de la academia. **Fuente única.**
 *
 * Lo consumen dos sitios con propósitos distintos, y por eso cada herramienta
 * lleva dos textos:
 *
 *  · El **hero** de la portada (`HeroSpotlight`) pinta solo tres, las que
 *    convierten suscripción, con `desc` — copy corto y comercial.
 *  · La **landing pública** `/herramientas` las pinta todas con `resumen` —
 *    más largo y escrito para buscar: es contenido indexable, no un eslogan.
 *
 * Vivía dentro de `HeroSpotlight.tsx`, donde la landing no podía leerlo. Al
 * separarse en dos listas acabarían discrepando, que es como se llega a que la
 * web prometa una herramienta que ya no existe.
 *
 * `acceso` es lo que ve alguien SIN cuenta, y manda sobre `href`:
 *  · "gratis"        → se usa sin registrarse.
 *  · "cuenta"        → basta una cuenta gratuita.
 *  · "premium"       → requiere suscripción.
 *  · "proximamente"  → todavía no existe; no se enlaza.
 */
import {
  NotebookPen, Radio, Unlock, Wallet, Target, Scale, Eye, Radar, PieChart, Medal,
  Trophy, ClipboardCheck, BadgeCheck, Sparkles, CalendarDays, CandlestickChart,
  type LucideIcon,
} from "lucide-react";

export type Acceso = "gratis" | "cuenta" | "premium" | "proximamente";

export interface Herramienta {
  id: string;
  icon: LucideIcon;
  label: string;
  /** Etiqueta corta que se pinta sobre la tarjeta. */
  tag: string;
  color: string;
  /** Copy comercial, para el hero. */
  desc: string;
  /** Copy largo e indexable, para /herramientas. */
  resumen: string;
  acceso: Acceso;
  chips: { icon: LucideIcon; label: string }[];
  /** Destino público. Ausente si hace falta cuenta o suscripción. */
  href?: string;
  /** Destino real una vez dentro, para quien ya tiene acceso. */
  premiumGate?: boolean;
  premiumHref?: string;
  soon?: boolean;
  collab?: "defillama";
  /** Microvisual que pinta el hero. Solo lo usan las tres del hero. */
  viz?: string;
  note?: string;
  /**
   * Página pública propia donde se explica la herramienta, si la tiene.
   *
   * Ojo con no confundirla con `premiumHref`: esa es la herramienta en sí y
   * está tras el muro. Esta es la que puede ver cualquiera y la que se indexa.
   * La tienen las tres del hero; a `radar` y `liberaciones` les falta la suya,
   * y hasta entonces caen en su ficha de /herramientas (punto 13 del plan SEO).
   */
  paginaPublica?: string;
}

/**
 * Dónde se explica una herramienta a alguien que aún no la tiene.
 *
 * Si tiene página propia, ahí. Si no, a su ficha dentro de la landing del
 * catálogo, que existe y está anclada — nunca a un destino inventado.
 */
export function detalleDe(h: Herramienta): string {
  return h.paginaPublica ?? `/herramientas#${h.id}`;
}

export const HERRAMIENTAS: Herramienta[] = [
  {
    id: "portfolio",
    icon: Wallet,
    label: "Portfolio Adelin",
    tag: "Premium",
    color: "#4f9dff",
    desc: "Todas mis compras en spot de este ciclo, publicadas con precio de entrada y rentabilidad en tiempo real.",
    resumen:
      "El portfolio real de este ciclo, publicado posición a posición: qué compré, a qué precio entré y cuánto lleva ganado o perdido cada moneda, actualizado con precios en vivo. No es una cartera de ejemplo ni una captura antigua — es la cartera con la que opero, y se actualiza cuando la muevo.",
    acceso: "premium",
    chips: [
      { icon: BadgeCheck, label: "PnL real" },
      { icon: ClipboardCheck, label: "Posiciones en vivo" },
    ],
    premiumGate: true,
    premiumHref: "/portfolio",
    paginaPublica: "/herramientas/portfolio",
    viz: "folio",
  },
  {
    id: "directo",
    icon: Radio,
    label: "Trading en Directo",
    tag: "Premium",
    color: "#a3a3ff",
    desc: "Solo futuros de NASDAQ, solo en gráficos de 5 minutos y solo martes y jueves, operados en directo: cada entrada y cada salida, en el momento en que se toman.",
    resumen:
      "Dos sesiones por semana, solo martes y jueves, operando únicamente futuros de NASDAQ en gráficos de 5 minutos. Se comenta cada decisión mientras se toma y hay chat de preguntas. La diferencia con un vídeo grabado es que no hay edición: las operaciones que salen mal se ven igual. Quedan grabadas para los suscriptores.",
    acceso: "premium",
    chips: [
      { icon: CandlestickChart, label: "Solo NASDAQ · 5 min" },
      { icon: CalendarDays, label: "Martes y jueves" },
    ],
    premiumGate: true,
    premiumHref: "/trading-en-directo",
    // Aquí la ficha pública y la herramienta son la MISMA URL: la página
    // explica las sesiones a cualquiera y solo la sala queda tras el muro.
    paginaPublica: "/trading-en-directo",
    viz: "live",
  },
  {
    id: "diario",
    icon: NotebookPen,
    label: "Diario de Trading",
    tag: "Premium",
    color: "#ff9a4d",
    desc: "Cada operación con su riesgo, su resultado real y por qué la tomaste, y diez estadísticas que te dicen cómo operas de verdad.",
    resumen:
      "Un diario donde anotas cada operación con su riesgo, su objetivo, lo que de verdad pasó y por qué la tomaste, y que te devuelve las estadísticas que importan: acierto, esperanza en R, profit factor, drawdown y rachas. Incluye curva de capital, rendimiento por mes, trimestre y año, calendario, desglose por par, estrategia, día y hora, e hitos con niveles que premian la disciplina.",
    acceso: "premium",
    chips: [
      { icon: ClipboardCheck, label: "Registro de operaciones" },
      { icon: Trophy, label: "Hitos con niveles" },
    ],
    premiumGate: true,
    premiumHref: "/dashboard/trading",
    paginaPublica: "/herramientas/diario",
    viz: "spark",
  },
  {
    id: "prediccion",
    icon: Target,
    label: "Predicción de Precio",
    tag: "Gratis",
    color: "#22d3ee",
    desc: "Calcula qué market cap necesita un token para llegar a tu precio objetivo, comparado con BTC, ETH y SOL en tiempo real.",
    resumen:
      "Responde a la pregunta que todo el mundo se hace mal: «¿puede esta moneda llegar a X euros?». En vez de mirar el precio, calcula qué capitalización de mercado haría falta para ese precio y la compara con la de Bitcoin, Ethereum y Solana en tiempo real. Casi siempre la respuesta es evidente en cuanto ves el número al lado del de Bitcoin.",
    acceso: "gratis",
    chips: [
      { icon: Sparkles, label: "Market cap objetivo" },
      { icon: BadgeCheck, label: "Datos en tiempo real" },
    ],
    href: "/calculadora",
    viz: "readout",
  },
  {
    id: "liberaciones",
    icon: Unlock,
    label: "Liberaciones de Tokens",
    tag: "Premium",
    color: "#34d399",
    desc: "El calendario de desbloqueos del mercado, para no comprar justo antes de que entren millones de monedas nuevas.",
    resumen:
      "El calendario de desbloqueos del mercado: qué tokens liberan monedas nuevas, cuándo y cuántas. Sirve para no comprar justo antes de que entren en circulación millones de monedas que llevaban años bloqueadas, una de las formas más comunes de perder dinero en cripto. Se rastrean 10 tokens con datos en vivo de DefiLlama, con la fecha del próximo unlock, la cantidad y el reparto entre equipo, inversores y comunidad.",
    // `acceso` decía "cuenta" y era falso: `herramientas/liberaciones/page.tsx`
    // manda a /premium a cualquiera que no lo sea. El cliente tiene lista la
    // vista parcial con dos tokens abiertos (`FREE_TOKEN_IDS`), pero hoy no se
    // llega a ella. Si algún día se abre el muro, esto vuelve a "cuenta".
    acceso: "premium",
    chips: [
      { icon: ClipboardCheck, label: "Calendario en vivo" },
      { icon: BadgeCheck, label: "10 tokens, con reparto" },
    ],
    collab: "defillama",
    premiumGate: true,
    premiumHref: "/herramientas/liberaciones",
    paginaPublica: "/calendario-de-liberaciones",
    viz: "vest",
  },
  {
    id: "radar",
    icon: Radar,
    label: "Radar Diario",
    tag: "Premium",
    color: "#f472b6",
    desc: "Lo que mueve el mercado hoy, filtrado y con la hora exacta en tu zona horaria.",
    resumen:
      "Los eventos que pueden mover el mercado en el día: datos macro, vencimientos y citas señaladas, con la hora ya convertida a tu huso horario. Está pensado para mirarlo un minuto antes de abrir posiciones y saber si hay algo en la agenda que conviene esquivar.",
    acceso: "premium",
    chips: [
      { icon: Eye, label: "Agenda del día" },
      { icon: BadgeCheck, label: "Hora en tu zona" },
    ],
    premiumGate: true,
    premiumHref: "/herramientas/radar",
    paginaPublica: "/radar-diario",
  },
  {
    id: "riesgo",
    icon: Scale,
    label: "Calculadora de Riesgo",
    tag: "Cuenta gratuita",
    color: "#facc15",
    desc: "Cuánto puedes arriesgar en una operación sin que una mala racha te saque del mercado.",
    resumen:
      "Calcula el tamaño de la posición a partir de lo que estás dispuesto a perder y de dónde pones el stop, en vez de al revés. Es la herramienta más aburrida de la academia y la que más cuentas ha salvado: casi nadie revienta por elegir mal la moneda, revienta por meter demasiado en una sola.",
    acceso: "cuenta",
    chips: [
      { icon: Scale, label: "Tamaño de posición" },
      { icon: BadgeCheck, label: "Riesgo por operación" },
    ],
    premiumHref: "/dashboard/calculadora-riesgo",
  },
  {
    id: "watchlist",
    icon: Eye,
    label: "Watchlist",
    tag: "Cuenta gratuita",
    color: "#c084fc",
    desc: "Las monedas que vigilas, con su precio y lo que llevas invertido, en una sola pantalla.",
    resumen:
      "Tu lista de seguimiento: las monedas que estás vigilando con su precio en vivo y el importe que tienes puesto en cada una. Evita el ir y venir entre cinco pestañas y una hoja de cálculo, que es donde se pierden las ideas que sí tenías bien pensadas.",
    acceso: "cuenta",
    chips: [
      { icon: Eye, label: "Seguimiento propio" },
      { icon: BadgeCheck, label: "Precios en vivo" },
    ],
    premiumHref: "/dashboard/watchlist",
  },
  {
    id: "mi-portfolio",
    icon: PieChart,
    label: "Mi Portfolio",
    tag: "Premium",
    color: "#a78bfa",
    desc: "Tu propia cartera: cada compra y cada venta, con precio medio, valor actual y resultado.",
    resumen:
      "Tu cartera, no la mía. Registras cada compra y cada venta y la herramienta calcula el precio medio ponderado de cada moneda, lo que llevas invertido, lo que vale hoy y el resultado, con precios en vivo. Es el paso siguiente a la watchlist: esta no vigila precios, lleva tus cuentas.",
    acceso: "premium",
    chips: [
      { icon: ClipboardCheck, label: "Compras y ventas" },
      { icon: BadgeCheck, label: "Precio medio ponderado" },
    ],
    premiumGate: true,
    premiumHref: "/dashboard/mi-portfolio",
  },
  {
    id: "logros",
    icon: Medal,
    label: "Logros y XP",
    tag: "Cuenta gratuita",
    color: "#fbbf24",
    desc: "Insignias y progreso por lo que vas completando en la academia.",
    resumen:
      "El progreso de tu paso por la academia, en insignias: primer paso, explorador, lector, constante, coleccionista… Se desbloquean solas según lo que vas leyendo y completando. No es una herramienta de mercado, es lo que hace que volver tenga un poco de premio.",
    acceso: "cuenta",
    chips: [
      { icon: Trophy, label: "Insignias por actividad" },
      { icon: BadgeCheck, label: "Progreso guardado" },
    ],
    premiumHref: "/logros",
  },
];

/** Busca una herramienta por su id. Lanza si no existe: sería un fallo de código. */
export function herramienta(id: string): Herramienta {
  const encontrada = HERRAMIENTAS.find((h) => h.id === id);
  if (!encontrada) throw new Error(`Herramienta desconocida: ${id}`);
  return encontrada;
}

/**
 * Nivel de acceso de la herramienta que vive en `ruta`, o `null` si esa ruta no
 * está en el catálogo (p. ej. `/logros`, que no es una herramienta pública).
 *
 * Existe para que los menús no vuelvan a escribir la regla por su cuenta. El
 * 04-09-2026 la calculadora se abrió al público y siguió saliendo un modal de
 * registro al pulsarla, porque `SidebarTools` y `BlogMobileMenu` llevaban su
 * propia copia de quién puede entrar y nadie las tocó.
 */
export function accesoPorRuta(ruta: string): Acceso | null {
  const h = HERRAMIENTAS.find((x) => x.href === ruta || x.premiumHref === ruta);
  return h?.acceso ?? null;
}

/**
 * A dónde debe llevar el enlace de una herramienta según quién esté mirando.
 *
 * Si la ruta no está en el catálogo se devuelve tal cual: quien la use se
 * comporta como antes, sin sorpresas.
 */
export function destinoPorRuta(
  ruta: string,
  { logueado, premium }: { logueado: boolean; premium: boolean },
): string {
  const h = HERRAMIENTAS.find((x) => x.href === ruta || x.premiumHref === ruta);
  if (!h) return ruta;

  if (h.acceso === "gratis") return ruta;

  const tieneAcceso =
    h.acceso === "cuenta" ? logueado : h.acceso === "premium" ? premium : false;
  if (tieneAcceso) return ruta;

  /*
   * Sin acceso, y aquí está el cambio del 06-09-2026: si la herramienta tiene
   * ficha pública, se va a la ficha.
   *
   * Antes se iba directo a `/premium` o a `/register`, que es pedir la cartera
   * a alguien que todavía no sabe qué le estás vendiendo. Y dejaba las cinco
   * fichas que existen —portfolio, diario, directo, radar y liberaciones—
   * inalcanzables desde los menús, que es justo donde la gente pulsa.
   *
   * La ficha explica la herramienta y ya lleva sus propios botones de «Ver qué
   * incluye Premium» y «Ya tengo cuenta», así que no se pierde la conversión:
   * se retrasa un paso y se gana el argumento.
   */
  if (h.paginaPublica) return h.paginaPublica;

  if (h.acceso === "cuenta") return "/register";
  if (h.acceso === "premium") return logueado ? "/premium" : "/register";
  return ruta; // "proximamente": no debería enlazarse, pero no rompemos nada
}

/**
 * ¿Es un callejón sin salida para quien mira?
 *
 * Una herramienta con ficha pública **nunca lo es**, aunque sea de pago: se
 * puede entrar a leer qué hace. Por eso los menús no le ponen candado ni la
 * apagan — el candado dice «no puedes pasar», y sí se puede.
 */
export function sinSalida(h: Herramienta, { logueado, premium }: { logueado: boolean; premium: boolean }): boolean {
  if (h.paginaPublica) return false;
  if (h.acceso === "gratis") return false;
  if (h.acceso === "cuenta") return !logueado;
  if (h.acceso === "premium") return !premium;
  return true;
}

/** Texto que se le enseña a quien todavía no tiene acceso. */
export const ETIQUETA_ACCESO: Record<Acceso, string> = {
  gratis: "Gratis, sin registro",
  cuenta: "Con cuenta gratuita",
  premium: "Incluida en Premium",
  proximamente: "En preparación",
};
