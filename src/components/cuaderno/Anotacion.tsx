"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { annotate } from "rough-notation";
import type { BracketType, RoughAnnotationType, RoughPadding } from "rough-notation/lib/model";
import { alVerse } from "@/lib/alVerse";
import { prepararTrazo } from "@/lib/anclarTrazo";
import "./anotacion.css";

/**
 * Un gesto de rotulador o de boli sobre el texto (rough-notation): rodear,
 * subrayar, marcar, tachar, recuadrar o poner un corchete al margen. Se dibuja
 * solo, una vez, cuando el texto entra en pantalla. Con «reducir movimiento»,
 * aparece ya dibujado.
 *
 * Uno por titular como mucho (ESTILO.md): si todo está subrayado, nada destaca.
 * Dentro del texto de una guía, dos o tres animados por pantalla como mucho;
 * los demás, con `animar={false}`.
 *
 * El texto no cambia: el gesto es un SVG que se pinta encima en el navegador,
 * así que ni Google ni un lector de pantalla lo ven.
 *
 * Colores con significado en las guías (pruebas en la de Ethereum, 17-11-2026):
 * amarillo `highlight` la idea clave · naranja `circle` lo que no te puedes
 * saltar · azul `underline` un concepto · coral un error o un riesgo · menta lo
 * que está bien o la conclusión · lila lo que entra en el quiz · `bracket` al
 * margen para un párrafo que lo resume.
 */
export default function Anotacion({
  children,
  tipo = "circle",
  color = "var(--naranja)",
  grosor = 3,
  retraso = 0,
  lados,
  relleno,
  iteraciones = 2,
  multilinea,
  animar = true,
  duracion,
  umbral = 0.6,
  junta = false,
  className,
}: {
  children: ReactNode;
  tipo?: RoughAnnotationType;
  /** Un color CSS. Admite variables: se resuelve al dibujar. */
  color?: string;
  grosor?: number;
  /** Milisegundos de espera tras entrar en pantalla. */
  retraso?: number;
  /** Solo para `bracket`: en qué lados va el corchete. Por defecto, a la derecha. */
  lados?: BracketType | BracketType[];
  /** Separación entre el texto y el trazo, en px (rough-notation). */
  relleno?: RoughPadding;
  /** Pasadas del trazo: 1 es un gesto limpio; 2, el de rotulador repasado. */
  iteraciones?: number;
  /**
   * Un trazo por línea si el texto se parte (por defecto). Con `false`, uno
   * solo alrededor de todo el fragmento: lo que pide un corchete sobre un
   * párrafo entero.
   */
  multilinea?: boolean;
  /** Con `false`, aparece ya dibujado al entrar en pantalla (marcas secundarias). */
  animar?: boolean;
  /**
   * Duración del trazo, en milisegundos. Sin ella (lo normal) sale de lo largo
   * que es el trazo: una palabra, cerca de un segundo; un párrafo, más.
   */
  duracion?: number;
  /** Qué parte del texto tiene que verse para empezar a dibujar (0 a 1). */
  umbral?: number;
  /** Que el fragmento no se parta de línea: para rodear dos o tres palabras. */
  junta?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  // Los lados se comparan por valor, no por referencia: un array nuevo en cada
  // render no tiene que volver a dibujar el gesto.
  const ladosClave = lados === undefined ? "" : ([] as BracketType[]).concat(lados).join(",");
  const rellenoClave = relleno === undefined ? "" : JSON.stringify(relleno);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // rough-notation pinta un SVG con el color tal cual: una variable CSS no
    // la entendería, así que se lee su valor real.
    const real = color.startsWith("var(")
      ? getComputedStyle(el).getPropertyValue(color.slice(4, -1).trim()).trim() || "#ff8a1f"
      : color;
    const brackets = ladosClave ? (ladosClave.split(",") as BracketType[]) : undefined;
    const padding: RoughPadding = rellenoClave
      ? (JSON.parse(rellenoClave) as RoughPadding)
      : tipo === "circle"
        ? [6, 12]
        : 4;
    const porLinea = multilinea ?? tipo !== "bracket";
    const anotacion = annotate(el, {
      type: tipo,
      color: real,
      strokeWidth: grosor,
      padding,
      iterations: iteraciones,
      multiline: porLinea,
      animate: animar && !quieto,
      ...(brackets ? { brackets } : {}),
    });

    // Que quepa, que siga a su palabra y que se dibuje a su ritmo (src/lib/anclarTrazo.ts).
    const trazo = prepararTrazo(el, anotacion, {
      tipo, relleno: padding, grosor, iteraciones, porLinea, animar: animar && !quieto, duracion,
    });

    let espera = 0;
    // Cuando se ve de verdad, no cuando roza la pantalla (src/lib/alVerse.ts).
    const cancelar = alVerse(
      el,
      () => {
        espera = window.setTimeout(() => trazo.mostrar(), animar ? retraso : 0);
      },
      { umbral },
    );

    return () => {
      cancelar();
      window.clearTimeout(espera);
      trazo.soltar();
      anotacion.remove();
    };
  }, [tipo, color, grosor, retraso, ladosClave, rellenoClave, iteraciones, multilinea, animar, duracion, umbral]);

  const clases = ["anotacion", junta ? "anotacion--junta" : "", className ?? ""].filter(Boolean).join(" ");
  return (
    <span ref={ref} className={clases}>
      {children}
    </span>
  );
}
