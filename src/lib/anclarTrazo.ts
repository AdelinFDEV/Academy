/**
 * Que un trazo de rough-notation (subrayado, círculo, corchete…) esté
 * SIEMPRE sobre su palabra, en cualquier pantalla (18-11-2026).
 *
 * rough-notation mete su SVG en el padre de la palabra con `position:
 * absolute` y calcula el dibujo midiendo desde ahí. Solo se recoloca si cambia
 * la ventana o el tamaño de la propia palabra. Dos cosas lo descolocaban:
 *
 *  1. El ancla lejana. Si el padre no estaba posicionado, el SVG se medía
 *     desde el contenedor posicionado más cercano (la cabecera de una
 *     sección, por ejemplo). Cualquier cosa que cambiara de alto entre ese
 *     contenedor y la palabra la movía y dejaba el trazo atrás: en el móvil,
 *     el subrayado de «a fondo» acababa encima del párrafo de debajo.
 *     → Se posiciona el padre (`relative`), si no lo estaba ya: palabra y
 *       trazo se mueven juntos.
 *  2. Lo que se reacomoda sin cambiar la ventana: una letra que termina de
 *     cargar, un bloque que pasa de tres líneas a dos.
 *     → Se vigila el bloque de texto y la carga de letras, y se le avisa a la
 *       librería como si hubiera cambiado la ventana (un solo aviso por
 *       fotograma, aunque haya cien trazos en la página).
 *
 * Lo usan los dos sitios que dibujan trazos: `Anotacion` y `MarcasEstudio`.
 * Devuelve la función que lo deshace.
 */

/** Cuántos trazos tienen anclado cada padre: se desancla con el último. */
const anclados = new WeakMap<HTMLElement, { trazos: number; previo: string }>();

/** Los bloques vigilados, con cuántos trazos dependen de cada uno. */
const vigilados = new Map<Element, number>();
let vigia: ResizeObserver | null = null;
let avisoPendiente = 0;
let letrasEscuchadas = false;

/** Un solo aviso por fotograma: rough-notation recoloca todos sus trazos. */
function avisar() {
  if (avisoPendiente) return;
  avisoPendiente = window.requestAnimationFrame(() => {
    avisoPendiente = 0;
    window.dispatchEvent(new Event("resize"));
  });
}

function vigiaCompartido(): ResizeObserver | null {
  if (vigia || !("ResizeObserver" in window)) return vigia;
  // Al empezar a vigilar un bloque llega un primer aviso con su tamaño de
  // entonces; avisar de más no rompe nada (la librería solo redibuja si algo
  // se movió de verdad).
  vigia = new ResizeObserver(avisar);
  return vigia;
}

export function anclarTrazo(el: HTMLElement): () => void {
  const padre = el.parentElement;
  const deshacer: (() => void)[] = [];

  // 1 · El padre, posicionado.
  if (padre) {
    const ya = anclados.get(padre);
    if (ya) {
      ya.trazos++;
    } else if (getComputedStyle(padre).position === "static") {
      anclados.set(padre, { trazos: 1, previo: padre.style.position });
      padre.style.position = "relative";
    }
    if (anclados.has(padre)) {
      deshacer.push(() => {
        const a = anclados.get(padre);
        if (!a) return;
        a.trazos--;
        if (a.trazos === 0) {
          padre.style.position = a.previo;
          anclados.delete(padre);
        }
      });
    }
  }

  // 2 · El bloque de texto que la contiene, vigilado.
  const bloque = el.closest("h1, h2, h3, h4, h5, h6, p, li, blockquote, td, dd") ?? padre;
  const observador = vigiaCompartido();
  if (bloque && observador) {
    const n = vigilados.get(bloque) ?? 0;
    if (n === 0) observador.observe(bloque);
    vigilados.set(bloque, n + 1);
    deshacer.push(() => {
      const quedan = (vigilados.get(bloque) ?? 1) - 1;
      if (quedan <= 0) {
        vigilados.delete(bloque);
        observador.unobserve(bloque);
      } else {
        vigilados.set(bloque, quedan);
      }
    });
  }

  // 3 · Las letras que terminan de cargar (una vez para toda la página).
  if (!letrasEscuchadas && document.fonts) {
    letrasEscuchadas = true;
    document.fonts.addEventListener("loadingdone", avisar);
  }

  return () => deshacer.forEach((f) => f());
}
