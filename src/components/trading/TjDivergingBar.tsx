import { pnlStr } from "./tjFormat";

/**
 * Barra que nace en el centro: a la derecha lo que suma, a la izquierda lo que
 * resta. Así una tabla de pares o de meses se lee como un balance, no como una lista.
 */
export default function DivergingBar({ value, max }: { value: number; max: number }) {
  const width = max > 0 ? (Math.abs(value) / max) * 50 : 0;
  return (
    <span className="tj-div">
      <span className="tj-div-track" aria-hidden="true">
        <i className={value < 0 ? "is-neg" : undefined} style={{ width: `${width}%` }} />
      </span>
      <strong>{pnlStr(value)}</strong>
    </span>
  );
}
