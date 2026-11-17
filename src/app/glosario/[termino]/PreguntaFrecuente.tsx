/**
 * Una pregunta frecuente de la ficha: un `<details>` de siempre, con su texto
 * en el HTML desde el principio (lo lee Google aunque esté plegada).
 *
 * La animación y el sonido de abrir y cerrar los pone `AcordeonesSuaves`
 * (layout raíz) para todos los `<details>` de la web: aquí no se añade nada,
 * o sonaría dos veces.
 */
export default function PreguntaFrecuente({ pregunta, respuesta }: { pregunta: string; respuesta: string }) {
  return (
    <details className="fe-faq-item">
      <summary>
        <span className="fe-faq-q">{pregunta}</span>
        <span className="fe-faq-signo" aria-hidden="true" />
      </summary>
      <p>{respuesta}</p>
    </details>
  );
}
