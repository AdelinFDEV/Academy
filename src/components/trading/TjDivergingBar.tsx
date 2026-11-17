import { pnlStr, toneOf } from "./tjFormat";

/**
 * Barra que nace en el centro: a la derecha lo que suma, a la izquierda lo que
 * resta. Así una tabla de pares o de meses se lee como un balance, no como una lista.
 * El verde y el rojo son los de las cifras con signo (estilo «Cuaderno de estudio»).
 */
export default function DivergingBar({ value, max }: { value: number; max: number }) {
  const width = max > 0 ? (Math.abs(value) / max) * 50 : 0;
  const tone = toneOf(value);
  return (
    <span className={`dja-div tone-${tone}`}>
      <span className="dja-div-pista" aria-hidden="true">
        <i className={value < 0 ? "is-neg" : undefined} style={{ width: `${width}%` }} />
      </span>
      <strong>{pnlStr(value)}</strong>
    </span>
  );
}
