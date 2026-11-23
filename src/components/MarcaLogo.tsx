import Image from "next/image";

/**
 * El logo de la web (23-11-2026, generado por el admin): «Adelin» con la gorra
 * de Bitcoin sobre la «A» y la tecla amarilla «BTC». Son dos imágenes del
 * mismo tamaño y encuadre, una encima de otra: al pasar el ratón por el
 * enlace que lo lleva, la de reposo se cambia por la de «hover» (la tecla
 * hundida y la gorra levantada, saludando). Sin parpadeos: las dos cargan a
 * la vez. Los estilos, en globals.css («La marca»).
 *
 * Mide 1,75 veces la letra de quien lo contiene, así que se adapta solo a la
 * barra, el pie y las páginas de acceso con los tamaños que ya tenían.
 */
export default function MarcaLogo({ prioridad = false }: { prioridad?: boolean }) {
  return (
    <span className="marca-logo">
      <Image src="/cuaderno/logo.webp" alt="AdelinBTC" width={720} height={240} priority={prioridad} className="marca-logo-img" draggable={false} />
      <Image src="/cuaderno/logo-hover.webp" alt="" aria-hidden="true" width={720} height={240} priority={prioridad} className="marca-logo-img marca-logo-hover" draggable={false} />
    </span>
  );
}
