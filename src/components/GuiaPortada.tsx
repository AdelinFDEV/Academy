import Image from "next/image";
import type { GuideMeta } from "@/lib/guides";

interface Props {
  guia: GuideMeta;
  className?: string;
  /** El ancho al que se pinta, para que Next sirva el tamaño justo. */
  sizes?: string;
}

/**
 * La foto de portada de una guía. La pintan la portada de la web y el listado
 * /guias; el encuadre lo pone quien la usa.
 *
 * Desde el 31-10-2026 cada guía va a llevar su foto (`portada` en
 * `src/lib/guides.ts`). Mientras no la tenga, se pinta una portada abstracta
 * con el color de la guía y su inicial: decorativa a propósito, sin repetir
 * el título, que ya está escrito al lado.
 *
 * Va con `alt` vacío por lo mismo: un lector de pantalla leería dos veces el
 * título.
 */
export default function GuiaPortada({ guia, className, sizes = "(max-width: 760px) 100vw, 360px" }: Props) {
  return (
    <span
      className={`guia-portada${className ? ` ${className}` : ""}`}
      style={{ "--guia-color": guia.color } as React.CSSProperties}
    >
      {guia.portada ? (
        <Image src={guia.portada} alt="" fill sizes={sizes} className="guia-portada-img" />
      ) : (
        <span className="guia-portada-arte" aria-hidden="true">
          <span className="guia-portada-letra">{guia.shortTitle.charAt(0)}</span>
        </span>
      )}
    </span>
  );
}
