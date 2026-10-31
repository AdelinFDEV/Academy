/**
 * Catálogo de las herramientas de la academia. **Fuente única.**
 *
 * Cada herramienta lleva su texto corto y comercial (`desc`) para el hero de
 * la portada (`HeroSlider`); lo largo vive en su ficha pública.
 *
 * Desde el 31-10-2026 la web se queda con Portfolio Adelin, Diario de Trading,
 * Predicción de Precio, Logros y los Cursos. Se retiraron Watchlist,
 * Liberaciones de Tokens, Radar Diario, Mi Portfolio, la Calculadora de
 * Riesgo, la landing `/herramientas` que las listaba y el Trading en Directo.
 *
 * Una sola lista a propósito: cuando hubo varias escritas a mano acabaron
 * discrepando, que es como se llega a que la web prometa una herramienta que
 * ya no existe.
 *
 * `acceso` es lo que ve alguien SIN cuenta, y manda sobre `href`:
 *  · "gratis"        → se usa sin registrarse.
 *  · "cuenta"        → basta una cuenta gratuita.
 *  · "premium"       → requiere suscripción.
 *  · "proximamente"  → todavía no existe; no se enlaza. Si ya tiene ficha
 *                      pública (`paginaPublica`), los enlaces van a la ficha.
 */
import {
  NotebookPen, Wallet, Target, Medal,
  Trophy, ClipboardCheck, BadgeCheck, Sparkles,
  GraduationCap, type LucideIcon,
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
  acceso: Acceso;
  chips: { icon: LucideIcon; label: string }[];
  /** Destino público. Ausente si hace falta cuenta o suscripción. */
  href?: string;
  /** Destino real una vez dentro, para quien ya tiene acceso. */
  premiumGate?: boolean;
  premiumHref?: string;
  /**
   * Página pública propia donde se explica la herramienta, si la tiene.
   *
   * Ojo con no confundirla con `premiumHref`: esa es la herramienta en sí y
   * está tras el muro. Esta es la que puede ver cualquiera y la que se indexa.
   * La tienen el Portfolio, el Diario y los Cursos.
   */
  paginaPublica?: string;
}

/**
 * Dónde se explica una herramienta a alguien que aún no la tiene.
 *
 * Si tiene página propia, ahí. Si no, a la herramienta misma (la calculadora
 * se usa sin cuenta; Logros pide una) — nunca a un destino inventado.
 */
export function detalleDe(h: Herramienta): string {
  return h.paginaPublica ?? h.href ?? h.premiumHref ?? "/";
}

export const HERRAMIENTAS: Herramienta[] = [
  {
    id: "portfolio",
    icon: Wallet,
    label: "Portfolio Adelin",
    tag: "Premium",
    color: "#4f9dff",
    desc: "Todas mis compras en spot de este ciclo, publicadas con precio de entrada y rentabilidad en tiempo real.",
    acceso: "premium",
    chips: [
      { icon: BadgeCheck, label: "PnL real" },
      { icon: ClipboardCheck, label: "Posiciones en vivo" },
    ],
    premiumGate: true,
    premiumHref: "/portfolio",
    paginaPublica: "/herramientas/portfolio",
  },
  {
    id: "diario",
    icon: NotebookPen,
    label: "Diario de Trading",
    tag: "Premium",
    color: "#ff9a4d",
    desc: "Cada operación con su riesgo, su resultado real y por qué la tomaste, y diez estadísticas que te dicen cómo operas de verdad.",
    acceso: "premium",
    chips: [
      { icon: ClipboardCheck, label: "Registro de operaciones" },
      { icon: Trophy, label: "Hitos con niveles" },
    ],
    premiumGate: true,
    premiumHref: "/dashboard/trading",
    paginaPublica: "/herramientas/diario",
  },
  {
    id: "prediccion",
    icon: Target,
    label: "Predicción de Precio",
    tag: "Gratis",
    color: "#22d3ee",
    desc: "Calcula qué market cap necesita un token para llegar a tu precio objetivo, comparado con BTC, ETH y SOL en tiempo real.",
    acceso: "gratis",
    chips: [
      { icon: Sparkles, label: "Market cap objetivo" },
      { icon: BadgeCheck, label: "Datos en tiempo real" },
    ],
    href: "/calculadora",
  },
  {
    id: "logros",
    icon: Medal,
    label: "Logros y XP",
    tag: "Cuenta gratuita",
    color: "#fbbf24",
    desc: "Insignias y progreso por lo que vas completando en la academia.",
    acceso: "cuenta",
    chips: [
      { icon: Trophy, label: "Insignias por actividad" },
      { icon: BadgeCheck, label: "Progreso guardado" },
    ],
    premiumHref: "/logros",
  },
  {
    id: "cursos",
    icon: GraduationCap,
    label: "Cursos",
    tag: "Próximamente",
    color: "#e6b455",
    desc: "Cursos por módulos, a tu ritmo, con examen en cada módulo y certificado al aprobar el final.",
    // "proximamente" mientras no haya ningún curso publicado: el menú, el
    // slider y la sección de Premium le ponen la etiqueta «Próximamente». Al
    // publicar el primero pasa a "premium", y con él cambia el `tag`.
    acceso: "proximamente",
    chips: [
      { icon: ClipboardCheck, label: "Examen por módulo" },
      { icon: BadgeCheck, label: "Certificado" },
    ],
    premiumHref: "/cursos",
    paginaPublica: "/cursos",
  },
];

/** Busca una herramienta por su id. Lanza si no existe: sería un fallo de código. */
export function herramienta(id: string): Herramienta {
  const encontrada = HERRAMIENTAS.find((h) => h.id === id);
  if (!encontrada) throw new Error(`Herramienta desconocida: ${id}`);
  return encontrada;
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
   * a alguien que todavía no sabe qué le estás vendiendo. Y dejaba las fichas
   * que existen inalcanzables desde los menús, que es justo donde la gente
   * pulsa.
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
