import { permanentRedirect } from "next/navigation";

// La asesoría 1:1 se retiró de la web el 04-09-2026, y el 03-10-2026 el admin
// confirmó que no vuelve. La URL estaba indexada, así que en vez de dejar un
// 404 se redirige a /premium, que es la oferta viva.
//
// Redirección PERMANENTE (308) a propósito. Con la temporal (307) que tuvo
// mientras se pensaba reactivar, Google conservaba /asesoria en el índice:
// seguía recibiendo impresiones en septiembre de 2026. La permanente le dice
// que la sustituya por /premium.
export default function AsesoriaPage() {
  permanentRedirect("/premium");
}
