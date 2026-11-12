import "server-only";
import { buscarEnlaces } from "@/lib/foro/texto/enlaces";

/**
 * El texto de un mensaje, tal como lo escribió el usuario.
 *
 * Es TEXTO PLANO y se pinta como texto: React lo escapa, y aquí no hay
 * `dangerouslySetInnerHTML` ni se interpreta ningún formato. Lo único que se
 * transforma son los enlaces a los dominios permitidos, que se convierten en
 * `<a>` con `rel="nofollow ugc noopener noreferrer"`.
 *
 * Los enlaces se vuelven a pasar por la lista blanca AL PINTAR, no solo al
 * guardar: si un dominio sale de la lista, deja de ser un enlace en todos los
 * mensajes viejos sin tocar la base de datos.
 */
export default function TextoForo({ texto, className = "" }: { texto: string; className?: string }) {
  const parrafos = texto.split(/\n{2,}/);
  return (
    <div className={`fo-texto ${className}`}>
      {parrafos.map((p, i) => (
        <p key={i}>{conEnlaces(p)}</p>
      ))}
    </div>
  );
}

function conEnlaces(parrafo: string): React.ReactNode[] {
  const nodos: React.ReactNode[] = [];
  let resto = parrafo;
  let clave = 0;
  for (const enlace of buscarEnlaces(parrafo)) {
    const en = resto.indexOf(enlace.texto);
    if (en === -1) continue;
    if (en > 0) nodos.push(resto.slice(0, en));
    nodos.push(
      enlace.permitido && enlace.url ? (
        <a key={clave++} href={enlace.url} rel="nofollow ugc noopener noreferrer" target="_blank">
          {enlace.texto}
        </a>
      ) : (
        // Ya no está permitido: se queda como texto.
        enlace.texto
      ),
    );
    resto = resto.slice(en + enlace.texto.length);
  }
  if (resto) nodos.push(resto);
  return nodos;
}
