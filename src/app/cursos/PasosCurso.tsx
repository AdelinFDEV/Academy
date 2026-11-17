import { PASOS } from "@/components/aula/ComoFunciona";

/**
 * «Cómo funciona un curso», en cuatro paradas, para el catálogo y la ficha
 * (estilo «Cuaderno de estudio», 17-11-2026). El texto sale de `PASOS`
 * (ComoFunciona.tsx), que describe lo que hace el aula de verdad: si cambia
 * una regla, se cambia allí y esto la sigue.
 *
 * Las tres primeras paradas son lila (Cursos y exámenes); la última, amarilla:
 * es la meta, el certificado y el logro. Estilos en cursos.css (`cu-pasos`).
 */
export default function PasosCurso() {
  return (
    <ol className="cu-pasos">
      {PASOS.map((p, i) => {
        const Icono = p.icon;
        return (
          <li key={p.titulo} className={`cu-paso${i === PASOS.length - 1 ? " cu-paso--meta" : ""}`}>
            <span className="cu-paso-nodo" aria-hidden="true">
              <Icono size={24} strokeWidth={2.2} />
            </span>
            <span className="cu-paso-num">Paso {i + 1}</span>
            <strong className="cu-paso-titulo">{p.titulo}</strong>
            <span className="cu-paso-texto">{p.texto}</span>
          </li>
        );
      })}
    </ol>
  );
}
