import "server-only";
import { buscarEnlaces } from "@/lib/foro/texto/enlaces";
import { bloquesDe, NEGRITA } from "@/lib/foro/texto/formato";

/**
 * El texto de un mensaje, tal como lo escribió el usuario.
 *
 * Es TEXTO PLANO y se pinta como texto: React lo escapa, y aquí no hay
 * `dangerouslySetInnerHTML`. Lo único que se transforma:
 *   · los enlaces a los dominios permitidos, que se convierten en `<a>` con
 *     `rel="nofollow ugc noopener noreferrer"`;
 *   · el formato del foro (23-11-2026, `texto/formato.ts`): **negrita**,
 *     listas con «- » y listas numeradas con «1. ». Se construye con
 *     elementos de React, así que una marca nunca puede meter HTML.
 *
 * Los enlaces se vuelven a pasar por la lista blanca AL PINTAR, no solo al
 * guardar: si un dominio sale de la lista, deja de ser un enlace en todos los
 * mensajes viejos sin tocar la base de datos.
 */
export default function TextoForo({ texto, className = "" }: { texto: string; className?: string }) {
  const parrafos = texto.split(/\n{2,}/);
  let clave = 0;
  return (
    <div className={`fo-texto ${className}`}>
      {parrafos.flatMap((p) =>
        bloquesDe(p).map((b) =>
          b.tipo === "parrafo" ? (
            <p key={clave++}>{enLinea(b.texto)}</p>
          ) : b.numerada ? (
            <ol key={clave++} className="fo-lista">
              {b.puntos.map((x, i) => <li key={i}>{enLinea(x)}</li>)}
            </ol>
          ) : (
            <ul key={clave++} className="fo-lista">
              {b.puntos.map((x, i) => <li key={i}>{enLinea(x)}</li>)}
            </ul>
          ),
        ),
      )}
    </div>
  );
}

/** Enlaces y negritas de un trozo de texto. */
function enLinea(texto: string): React.ReactNode[] {
  return conEnlaces(texto).flatMap((n, i) => (typeof n === "string" ? conNegrita(n, i) : [n]));
}

function conNegrita(texto: string, trozo: number): React.ReactNode[] {
  let clave = 0;
  const nodos: React.ReactNode[] = [];
  let desde = 0;
  for (const m of texto.matchAll(NEGRITA)) {
    const en = m.index ?? 0;
    if (en > desde) nodos.push(texto.slice(desde, en));
    nodos.push(<strong key={`n${trozo}-${clave++}`}>{m[1]}</strong>);
    desde = en + m[0].length;
  }
  if (desde < texto.length) nodos.push(texto.slice(desde));
  return nodos;
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
        <a key={`e${clave++}`} href={enlace.url} rel="nofollow ugc noopener noreferrer" target="_blank">
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
