import { Lock } from "lucide-react";
import "./pegatina-logro.css";

/**
 * Un logro como pegatina (sistema.html, «Etiquetas, notas y pegatinas»):
 * redonda, con su borde blanco de pegatina y un poco torcida, del color de su
 * categoría. Sin conseguir, se queda gris, recta y con su candado: se ve qué
 * se ganará, pero no se confunde con lo ganado.
 *
 * La usan el panel (/dashboard), /dashboard/logros y la página pública /logros.
 */

export type ColorPegatina = "naranja" | "azul" | "menta" | "lila" | "amarillo" | "coral" | "cielo";

/** Giros fijos, para que la colección parezca pegada a mano sin cambiar en cada render. */
const GIROS = [-8, 6, -3, 9, -6, 4, -10, 3];

export default function PegatinaLogro({
  icono,
  color,
  conseguida,
  indice = 0,
  tamano = "normal",
  especial = false,
}: {
  icono: React.ReactNode;
  color: ColorPegatina;
  conseguida: boolean;
  /** Su posición en la lista: decide cuánto se tuerce. */
  indice?: number;
  tamano?: "peq" | "normal" | "grande";
  /** Los logros especiales llevan un halo de rotulador. */
  especial?: boolean;
}) {
  const cls = [
    "pgl",
    `pgl--${color}`,
    tamano !== "normal" && `pgl--${tamano}`,
    conseguida ? "is-conseguida" : "is-bloqueada",
    especial && "is-especial",
  ].filter(Boolean).join(" ");
  return (
    <span className={cls} style={{ "--giro": `${GIROS[indice % GIROS.length]}deg` } as React.CSSProperties} aria-hidden="true">
      <span className="pgl-icono">{icono}</span>
      {!conseguida && (
        <span className="pgl-candado"><Lock size={11} strokeWidth={3} /></span>
      )}
    </span>
  );
}

/**
 * El color de un logro: el de su categoría (ESTILO.md). Guías cielo, cursos
 * lila, Diario azul; los de actividad (racha y Premium), naranja de marca.
 */
export function colorDeLogro(b: { guideSlug?: string; cursoSlug?: string; diario?: unknown }): ColorPegatina {
  if (b.guideSlug) return "cielo";
  if (b.cursoSlug) return "lila";
  if (b.diario) return "azul";
  return "naranja";
}
