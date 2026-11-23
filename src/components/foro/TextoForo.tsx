import "server-only";
import TextoBloques from "@/components/foro/TextoBloques";
import { estructuraDe } from "@/lib/foro/texto/formato";

/**
 * El texto de un mensaje, tal como lo escribió el usuario.
 *
 * Es TEXTO PLANO y se pinta como texto: React lo escapa, y aquí no hay
 * `dangerouslySetInnerHTML`. El servidor lo convierte en una estructura
 * (`estructuraDe`: párrafos, listas, negritas, enlaces a los dominios
 * permitidos con `rel="nofollow ugc noopener noreferrer"` y menciones) y
 * `TextoBloques` la pinta con elementos de React: una marca nunca puede
 * meter HTML.
 *
 * Los enlaces se vuelven a pasar por la lista blanca AL PINTAR, no solo al
 * guardar: si un dominio sale de la lista, deja de ser un enlace en todos los
 * mensajes viejos sin tocar la base de datos.
 *
 * `menciones`: los alias del hilo que existen (en minúsculas). Solo esos se
 * pintan como mención; un «@loquesea» que no es nadie se queda en texto.
 */
export default function TextoForo({
  texto,
  menciones = [],
  className = "",
}: {
  texto: string;
  menciones?: string[];
  className?: string;
}) {
  return <TextoBloques bloques={estructuraDe(texto, menciones)} className={className} />;
}
