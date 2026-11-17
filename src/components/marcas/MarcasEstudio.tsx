"use client";

import { useEffect, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { annotate } from "rough-notation";
import type { RoughAnnotationConfig } from "rough-notation/lib/model";
import { alVerse } from "@/lib/alVerse";
import SimboloEstudio, { Llave, type TipoSimbolo } from "@/components/cuaderno/SimboloEstudio";
import type { ColorCuaderno } from "@/components/cuaderno/colores";
import "@/components/cuaderno/postit.css";
import "./marcas-estudio.css";

/**
 * Las marcas de estudio de un texto que llega ya escrito en HTML (ESTILO.md,
 * «Las marcas de estudio en TODOS los textos explicativos»): las fichas del
 * diccionario y las lecciones de los cursos.
 *
 * En una guía las marcas se ponen a mano en el JSX (la de Ethereum es la
 * referencia). Aquí el texto sale de datos —230 fichas, decenas de lecciones—,
 * así que se ponen POR ESTRUCTURA, con las mismas piezas del cuaderno y el
 * mismo código de colores:
 *
 *  · la primera idea en negrita de cada apartado → rotulador amarillo;
 *    en un apartado de errores («El error típico…») → subrayado coral, y el
 *    «!» coral al margen;
 *  · el primer párrafo, la entrada → estrella al margen;
 *  · el resumen y los avisos (pósits desde el servidor, `vestirTexto`) → su
 *    símbolo en la esquina: NB, «!», asterisco o check;
 *  · la cifra de `prose-dato` → recuadro lila (lo que entra en el examen);
 *  · los pasos de `prose-pasos` → el número rodeado a boli;
 *  · los dos lados de `prose-vs` → su título subrayado (azul y menta);
 *  · la primera lista suelta → la llave «}» que la agrupa;
 *  · los `<mark>` → rotulador amarillo de verdad;
 *  · con `conclusion`, el último párrafo → corchete menta al margen.
 *
 * Nada de esto cambia el texto: los trazos son SVG que pinta rough-notation y
 * los símbolos van con `aria-hidden`, en el navegador. Moderación: solo los
 * dos primeros trazos y los dos primeros símbolos se animan; el resto aparece
 * ya dibujado. Con «reducir movimiento», todo quieto.
 *
 * No pinta nada: busca su texto con `selector` (cada trozo de HTML, en orden)
 * y lo marca al montarse. `clave` vuelve a marcar cuando cambia el texto (al
 * pasar de una lección a otra sin recargar).
 */

const RE_ERROR = /error|fallo|equivoc|trampa|mito|malentendido|confusi|cuidado|peligro|riesgo|estafa/i;

const ESQUINA: Record<string, { tipo: TipoSimbolo; color: ColorCuaderno }> = {
  resumen: { tipo: "nb", color: "naranja" },
  warning: { tipo: "exclamacion", color: "coral" },
  danger: { tipo: "exclamacion", color: "coral" },
  info: { tipo: "asterisco", color: "cielo" },
  tip: { tipo: "check", color: "menta" },
};

type Trazo = Pick<RoughAnnotationConfig, "type" | "padding" | "brackets" | "multiline"> & {
  /** Variable CSS de la paleta, sin `var()`: `--amarillo`. */
  color: string;
  grosor?: number;
  iteraciones?: number;
};

export default function MarcasEstudio({
  selector,
  clave,
  conclusion = false,
}: {
  /** Los trozos de HTML a marcar, p. ej. `.termino-body`. */
  selector: string;
  /** Cambia cuando cambia el texto: vuelve a marcar. */
  clave?: string;
  /** Corchete menta en el último párrafo, que cierra el texto. */
  conclusion?: boolean;
}) {
  useEffect(() => {
    const raices = Array.from(document.querySelectorAll<HTMLElement>(selector));
    if (raices.length === 0) return;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const deshacer: (() => void)[] = [];
    let trazosAnimados = 0;
    let simbolosAnimados = 0;

    /** Un gesto de rough-notation sobre un elemento que ya existe. */
    const trazar = (el: Element, t: Trazo, alDibujar?: () => void) => {
      const animar = !quieto && trazosAnimados < 2;
      if (animar) trazosAnimados++;
      const color = getComputedStyle(el).getPropertyValue(t.color).trim() || "#ff8a1f";
      const anotacion = annotate(el as HTMLElement, {
        type: t.type,
        color,
        strokeWidth: t.grosor ?? 2,
        iterations: t.iteraciones ?? 1,
        padding: t.padding ?? (t.type === "box" ? [2, 6] : 3),
        multiline: t.multiline ?? t.type !== "bracket",
        animate: animar,
        animationDuration: 900,
        ...(t.brackets ? { brackets: t.brackets } : {}),
      });
      // Cuando se ve de verdad, no cuando roza la pantalla (src/lib/alVerse.ts).
      // La espera de 300 ms ya la pone alVerse: aquí no hace falta otra.
      const cancelar = alVerse(el, () => {
        anotacion.show();
        alDibujar?.();
      });
      deshacer.push(() => {
        cancelar();
        anotacion.remove();
      });
    };

    /**
     * Un símbolo dibujado (o la llave), en un ancla `aria-hidden` dentro de
     * `padre`. Solo los dos primeros `animable` se trazan solos.
     */
    const dibujar = (
      padre: Element,
      contenido: (animar: boolean) => ReactNode,
      { clase = "", alFinal = false, animable = false }: { clase?: string; alFinal?: boolean; animable?: boolean } = {},
    ) => {
      const animar = animable && !quieto && simbolosAnimados < 2;
      if (animar) simbolosAnimados++;
      const ancla = document.createElement("span");
      ancla.className = ["me-ancla", clase].filter(Boolean).join(" ");
      ancla.setAttribute("aria-hidden", "true");
      if (alFinal) padre.append(ancla);
      else padre.prepend(ancla);
      const raiz: Root = createRoot(ancla);
      raiz.render(contenido(animar));
      deshacer.push(() => {
        // Desmontar en el mismo ciclo en que React desmonta este componente
        // le hace protestar: se deja para justo después.
        window.setTimeout(() => {
          raiz.unmount();
          ancla.remove();
        });
      });
    };

    const simbolo = (padre: Element, tipo: TipoSimbolo, color: ColorCuaderno, semillaS: number, animable = false) =>
      dibujar(padre, (animar) => <SimboloEstudio tipo={tipo} color={color} margen semilla={semillaS} animar={animar} />, { animable });

    /**
     * Un trazo de rough-notation mide las cajas de lo que marca: en un bloque
     * (un título de `prose-vs`, la cifra de `prose-dato`) mediría el ancho
     * entero de la columna. Se envuelve su contenido en un <span> —el mismo
     * texto, sin tocarlo— y se desenvuelve al desmontar.
     */
    const envolver = (el: Element): HTMLElement => {
      const envoltura = document.createElement("span");
      envoltura.className = "me-envoltura";
      while (el.firstChild) envoltura.append(el.firstChild);
      el.append(envoltura);
      deshacer.push(() => {
        if (envoltura.parentNode !== el) return;
        while (envoltura.firstChild) el.insertBefore(envoltura.firstChild, envoltura);
        envoltura.remove();
      });
      return envoltura;
    };

    /** Una clase que se quita al desmontar: el CSS la usa para soltar el adorno que sustituye el trazo. */
    const marcarClase = (el: Element, clase: string) => {
      el.classList.add(clase);
      deshacer.push(() => el.classList.remove(clase));
    };

    let estrella = false;
    let llave = false;
    let ultimoParrafo: HTMLElement | null = null;
    let seccion = { error: false, marcada: false, simbolo: false };
    let semilla = 30;

    for (const raiz of raices) {
      for (const hijo of Array.from(raiz.children)) {
        const el = hijo as HTMLElement;
        const etiqueta = el.tagName;
        const clases = el.classList;

        if (etiqueta === "H2") {
          seccion = { error: RE_ERROR.test(el.textContent ?? ""), marcada: false, simbolo: false };
          continue;
        }

        if (etiqueta === "P" && clases.length === 0) {
          ultimoParrafo = el;
          // La entrada: la estrella de «esto es lo importante», al margen.
          if (!estrella) {
            estrella = true;
            simbolo(el, "estrella", "naranja", 3, true);
          } else if (seccion.error && !seccion.simbolo) {
            seccion.simbolo = true;
            simbolo(el, "exclamacion", "coral", semilla++);
          }
          // La idea clave del apartado: su primera negrita.
          const negrita = seccion.marcada ? null : el.querySelector("strong");
          if (negrita) {
            seccion.marcada = true;
            trazar(
              negrita,
              seccion.error
                ? { type: "underline", color: "--coral", grosor: 2.5, padding: 2 }
                : { type: "highlight", color: "--amarillo", grosor: 2 },
            );
          }
          continue;
        }

        if (clases.contains("prose-resumen")) {
          dibujar(el, (animar) => <SimboloEstudio tipo="nb" color="naranja" className="postit-esquina" animar={animar} />, { animable: true });
          continue;
        }

        if (clases.contains("prose-callout")) {
          const tipo = ["warning", "danger", "info", "tip"].find((t) => clases.contains(`prose-callout--${t}`));
          const s = tipo ? ESQUINA[tipo] : null;
          if (s) dibujar(el, () => <SimboloEstudio tipo={s.tipo} color={s.color} className="postit-esquina" semilla={semilla++} animar={false} />);
          continue;
        }

        if (clases.contains("prose-dato")) {
          const cifra = el.querySelector(".prose-dato-cifra");
          if (cifra) trazar(envolver(cifra), { type: "box", color: "--lila", grosor: 2, iteraciones: 2, multiline: false }, () => marcarClase(cifra, "me-recuadrada"));
          continue;
        }

        if (clases.contains("prose-pasos")) {
          for (const li of Array.from(el.children)) {
            if (li.tagName !== "LI") continue;
            marcarClase(li, "me-con-aro");
            dibujar(li, () => <SimboloEstudio tipo="aro" color="naranja" className="me-aro" semilla={semilla++} animar={false} />);
          }
          continue;
        }

        if (clases.contains("prose-vs")) {
          const titulos = el.querySelectorAll(".prose-vs-title");
          titulos.forEach((t, i) =>
            trazar(envolver(t), { type: "underline", color: i === 0 ? "--azul" : "--menta", grosor: 2.5, padding: 1 }),
          );
          continue;
        }

        if (etiqueta === "UL" && clases.length === 0 && !llave && el.children.length >= 3) {
          llave = true;
          marcarClase(el, "me-con-llave");
          dibujar(el, () => <Llave color="azul" semilla={7}>{null}</Llave>, { clase: "me-llave", alFinal: true });
        }
      }

      // Los `<mark>` de una lección: el rotulador de CSS, cambiado por el trazo.
      raiz.querySelectorAll("mark").forEach((m) =>
        trazar(m, { type: "highlight", color: "--amarillo", grosor: 2 }, () => marcarClase(m, "me-marcado")),
      );
    }

    // El cierre: el último párrafo, con su corchete menta al margen.
    if (conclusion && ultimoParrafo) {
      trazar(ultimoParrafo, { type: "bracket", color: "--menta", grosor: 2.5, brackets: ["right"], padding: [2, 8, 2, 8] });
    }

    return () => {
      for (const d of deshacer) d();
    };
  }, [selector, clave, conclusion]);

  return null;
}
