import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import type { ColorCuaderno } from "./colores";
import "./postit.css";

/**
 * El pósit del «Cuaderno de estudio» (sistema.html, «Etiquetas, notas y
 * pegatinas»): una nota pegada con cinta, un poco torcida, para lo que en una
 * guía es una nota lateral, un aviso o un dato curioso. Al pasar el ratón se
 * endereza.
 *
 * Es solo la hoja: el texto lo pone quien lo usa, tal cual. Dentro, el título
 * va en `.postit-titulo` (a mano, en Caveat) y el cuerpo en `.postit-cuerpo`.
 * Para que vaya al margen de una sección en escritorio, se coloca con el CSS
 * de la página (rejilla), sin moverlo de su sitio en el HTML: el orden de
 * lectura no cambia.
 *
 * Colores: amarillo para una nota o un dato; coral para un riesgo; menta para
 * lo que está bien; el resto, si la sección lo pide.
 */
export default function Postit({
  children,
  color = "amarillo",
  giro = -1.5,
  cinta = true,
  className,
  style,
  ...resto
}: {
  children: ReactNode;
  color?: ColorCuaderno;
  /** Grados de giro. Entre -3 y 3: más, y cuesta leerlo. */
  giro?: number;
  /** La tira de cinta que lo sujeta, arriba. */
  cinta?: boolean;
} & HTMLAttributes<HTMLDivElement>) {
  const clases = ["postit", `postit--${color}`, cinta ? "" : "postit--sin-cinta", className ?? ""].filter(Boolean).join(" ");
  return (
    <div className={clases} style={{ ...style, "--postit-giro": `${giro}deg` } as CSSProperties} {...resto}>
      {children}
    </div>
  );
}
