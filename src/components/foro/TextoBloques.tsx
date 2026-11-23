import { Fragment } from "react";
import type { BloqueForo, TrozoForo } from "@/lib/foro/tipos";

/**
 * Pinta el texto de un mensaje del foro a partir de su ESTRUCTURA
 * (`BloqueForo[]`, que hace el servidor en `texto/formato.ts`).
 *
 * Aquí no se interpreta nada ni se toca HTML: cada trozo es un elemento de
 * React y su texto se escapa solo. Lo usan el hilo (`TextoForo`, en el
 * servidor) y la vista previa del formulario (en el navegador), así que lo
 * que se ve antes de publicar es exactamente lo que se verá después.
 *
 * Un enlace solo se pinta si es `https://`: aunque la estructura viniera
 * manipulada, de aquí no sale un `javascript:`.
 */
export default function TextoBloques({ bloques, className = "" }: { bloques: BloqueForo[]; className?: string }) {
  return (
    <div className={`fo-texto ${className}`}>
      {bloques.map((b, i) =>
        b.tipo === "parrafo" ? (
          <p key={i}>{b.trozos.map(trozo)}</p>
        ) : b.numerada ? (
          <ol key={i} className="fo-lista">
            {b.puntos.map((punto, j) => <li key={j}>{punto.map(trozo)}</li>)}
          </ol>
        ) : (
          <ul key={i} className="fo-lista">
            {b.puntos.map((punto, j) => <li key={j}>{punto.map(trozo)}</li>)}
          </ul>
        ),
      )}
    </div>
  );
}

function trozo(t: TrozoForo, i: number): React.ReactNode {
  let nodo: React.ReactNode;
  if (t.tipo === "enlace" && t.url.startsWith("https://")) {
    nodo = (
      <a href={t.url} rel="nofollow ugc noopener noreferrer" target="_blank">
        {t.texto}
      </a>
    );
  } else if (t.tipo === "mencion") {
    // Sin enlace: en el foro no hay perfiles visitables (FORO.md §2).
    nodo = <span className="fo-mencion">{t.texto}</span>;
  } else {
    nodo = t.texto;
  }
  return t.negrita ? <strong key={i}>{nodo}</strong> : <Fragment key={i}>{nodo}</Fragment>;
}
