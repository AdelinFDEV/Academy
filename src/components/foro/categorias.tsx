import { Bitcoin, CandlestickChart, Coins, GraduationCap, Landmark, MessagesSquare, ShieldCheck, type LucideIcon } from "lucide-react";

/**
 * El color y el icono de cada categoría del foro.
 *
 * Es solo presentación: qué categorías existen lo dice la base de datos
 * (`foro_categorias`, las crea el admin). Una categoría nueva que no esté
 * aquí sale con el naranja de la marca y el icono genérico, sin romper nada;
 * para darle los suyos, se añade una línea.
 *
 * El color entra en la página por la variable `--cat`: tiñe el lomo de cada
 * pregunta, su etiqueta y la cabecera de su hilo.
 */
const CATEGORIAS: Record<string, { color: string; Icono: LucideIcon }> = {
  bitcoin: { color: "#f7931a", Icono: Bitcoin },
  altcoins: { color: "#7ea6ff", Icono: Coins },
  trading: { color: "#5fd39a", Icono: CandlestickChart },
  seguridad: { color: "#a78bfa", Icono: ShieldCheck },
  impuestos: { color: "#e6b455", Icono: Landmark },
  academia: { color: "#22d3ee", Icono: GraduationCap },
};

const GENERICA = { color: "#ff8552", Icono: MessagesSquare };

export function aspectoDe(slug: string): { color: string; Icono: LucideIcon } {
  return CATEGORIAS[slug] ?? GENERICA;
}

/** El estilo en línea que le pasa su color a un elemento y a lo que lleva dentro. */
export function colorDe(slug: string): React.CSSProperties {
  return { "--cat": aspectoDe(slug).color } as React.CSSProperties;
}
