import { PASOS } from "@/components/aula/ComoFunciona";

/** El color de cada parada: tres de estudio y la meta en amarillo. */
const COLORES = ["lila", "cielo", "coral", "amarillo"] as const;

/**
 * «Pensado para que termines lo que empiezas», en cuatro paradas, para el
 * catálogo y la ficha. Rehecho el 19-11-2026 (pedido por el admin): más
 * simple y más ilustrado. Cada parada, su número a mano en un círculo de su
 * color, unidas por una raya discontinua; el icono en una teclita, el título y
 * una sola línea (`corto`).
 *
 * El texto sale de `PASOS` (ComoFunciona.tsx), que describe lo que hace el
 * aula de verdad: si cambia una regla, se cambia allí y esto la sigue.
 * Estilos en cursos.css (`cu-ruta`).
 */
export default function PasosCurso() {
  return (
    <ol className="cu-ruta">
      {PASOS.map((p, i) => {
        const Icono = p.icon;
        return (
          <li key={p.titulo} className={`cu-ruta-paso cu-ruta-paso--${COLORES[i % COLORES.length]}`}>
            <span className="cu-ruta-num" aria-hidden="true">{i + 1}</span>
            <span className="cu-ruta-cuerpo">
              <strong className="cu-ruta-titulo">
                <span className="cu-ruta-icono" aria-hidden="true"><Icono size={16} strokeWidth={2.4} /></span>
                {p.titulo}
              </strong>
              <span className="cu-ruta-texto">{p.corto}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
