import { redirect } from "next/navigation";

// La asesoría 1:1 se retiró de la web el 04-09-2026: no se está ofreciendo de
// momento. La URL estaba indexada, así que en vez de dejar un 404 se redirige
// a /premium, que es la oferta viva. Mismo patrón que /terminos → /aviso-legal.
//
// Para reactivarla: el componente de la banda y la página completa están en el
// historial de git, y los planes siguen en src/lib/asesoria.ts.
export default function AsesoriaPage() {
  redirect("/premium");
}
