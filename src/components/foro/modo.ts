/**
 * Lo que se le dice arriba a quien ve el foro sin estar abierto del todo:
 * al admin mientras está cerrado, y a todos en solo lectura.
 */
export function avisoDeModo(modo: string): string | null {
  if (modo === "cerrado") return "El foro está cerrado al público. Solo lo ves tú, como admin, hasta que lo abras en el panel.";
  if (modo === "lectura") return "El foro está en modo de solo lectura: se puede leer, pero ahora mismo no se puede publicar ni valorar.";
  return null;
}
