import { Bitcoin, CandlestickChart, Coins, GraduationCap, Landmark, MessagesSquare, Shapes, ShieldCheck, type LucideIcon } from "lucide-react";

/**
 * El color y el icono de cada categoría del foro.
 *
 * Es solo presentación: qué categorías existen lo dice la base de datos
 * (`foro_categorias`, las crea el admin). Una categoría nueva que no esté
 * aquí sale con el coral del foro y el icono genérico, sin romper nada;
 * para darle los suyos, se añade una línea.
 *
 * Desde el 17-11-2026 los colores son los del estilo «Cuaderno de estudio»
 * (ESTILO.md): cada categoría toma uno de los siete, con sus tres tonos.
 * Entran en la página por cuatro variables: `--cat` (la base: la pestaña de
 * la tarjeta, el icono), `--cat-o` (el lateral: el canto y el texto sobre su
 * tono suave), `--cat-s` (el suave: fondos de chips) y `--cat-t` (la letra
 * sobre la base: tinta sobre menta, cielo y amarillo, que con blanco no pasan
 * el contraste; blanco sobre los demás).
 */
type Tono = "naranja" | "azul" | "menta" | "lila" | "amarillo" | "coral" | "cielo";

const CATEGORIAS: Record<string, { tono: Tono; Icono: LucideIcon }> = {
  bitcoin: { tono: "naranja", Icono: Bitcoin },
  altcoins: { tono: "azul", Icono: Coins },
  trading: { tono: "menta", Icono: CandlestickChart },
  seguridad: { tono: "lila", Icono: ShieldCheck },
  impuestos: { tono: "amarillo", Icono: Landmark },
  academia: { tono: "cielo", Icono: GraduationCap },
  otras: { tono: "coral", Icono: Shapes },
};

const GENERICA: { tono: Tono; Icono: LucideIcon } = { tono: "coral", Icono: MessagesSquare };

/** Los tonos claros: sobre ellos la letra va en tinta (regla del sistema del 17-11-2026). */
const CLAROS: readonly Tono[] = ["menta", "amarillo", "cielo"];

export function aspectoDe(slug: string): { color: string; lateral: string; suave: string; letra: string; Icono: LucideIcon } {
  const { tono, Icono } = CATEGORIAS[slug] ?? GENERICA;
  return {
    color: `var(--${tono})`,
    lateral: `var(--${tono}-o)`,
    suave: `var(--${tono}-s)`,
    letra: CLAROS.includes(tono) ? "var(--tinta)" : "#fff",
    Icono,
  };
}

/** El estilo en línea que le pasa sus tonos a un elemento y a lo que lleva dentro. */
export function colorDe(slug: string): React.CSSProperties {
  const a = aspectoDe(slug);
  return { "--cat": a.color, "--cat-o": a.lateral, "--cat-s": a.suave, "--cat-t": a.letra } as React.CSSProperties;
}
