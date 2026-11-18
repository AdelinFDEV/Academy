import type { FullPadding, RoughAnnotation, RoughAnnotationType, RoughPadding } from "rough-notation/lib/model";

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

// ─────────────────────────── El trazo entero: sitio, momento y ritmo ───────────────────────────

/**
 * Las tres reglas de TODO trazo de la web (pedidas por el admin el 18-11-2026),
 * en un solo sitio para que `Anotacion` y `MarcasEstudio` no puedan saltárselas:
 *
 *  1. NUNCA SE SALE. Un círculo o un corchete llevan aire alrededor de la
 *     palabra; en una pantalla estrecha ese aire puede no caber y el trazo se
 *     cortaría contra el borde o contra la tarjeta que lo contiene. Aquí se
 *     recorta el aire de los lados a lo que de verdad hay, y se vuelve a medir
 *     si cambia el ancho de la ventana.
 *  2. NUNCA SE DIBUJA ANTES DE VERSE. De eso se encarga `alVerse`; aquí solo se
 *     garantiza que el trazo no está a la vista hasta que se pide.
 *  3. NUNCA VA CON PRISA. La librería reparte un tiempo fijo, así que rodeaba
 *     una palabra y subrayaba tres líneas en lo mismo. Aquí el tiempo sale de
 *     lo largo que es el trazo, como una mano: `duracionTrazo`. Y los que no
 *     se animan no aparecen de golpe: entran con un fundido corto.
 *
 * El pulso (arrancar suave, seguir sin frenazos entre tramos y posar al final)
 * está en globals.css, «El pulso de los trazos».
 */

const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Las cajas del texto marcado: una por línea, o una sola si el trazo lo envuelve todo. */
function cajas(el: HTMLElement, porLinea: boolean): DOMRect[] {
  const lineas = porLinea ? Array.from(el.getClientRects()).filter((c) => c.width > 0) : [];
  return lineas.length ? lineas : [el.getBoundingClientRect()];
}

/** Lo que recorre el boli en una pasada, en píxeles. */
function largoTrazo(el: HTMLElement, tipo: RoughAnnotationType, porLinea: boolean): number {
  return cajas(el, porLinea).reduce((suma, c) => {
    if (tipo === "circle") return suma + (Math.PI * (c.width + c.height)) / 2;
    if (tipo === "box") return suma + 2 * (c.width + c.height);
    if (tipo === "bracket") return suma + c.height + 24;
    if (tipo === "crossed-off") return suma + 2 * Math.hypot(c.width, c.height);
    return suma + c.width;
  }, 0);
}

/**
 * Cuánto tarda en dibujarse un trazo, en milisegundos: un arranque fijo y, a
 * partir de ahí, a unos 600 px por segundo, que es el ritmo de quien subraya
 * con calma. Nunca menos de 0,9 s (una palabra suelta se vería como un
 * latigazo) ni más de 2,6 s (un párrafo entero no puede hacer esperar). Con
 * dos pasadas, un poco más. El rotulador gordo va algo más ligero.
 */
export function duracionTrazo(el: HTMLElement, tipo: RoughAnnotationType, iteraciones: number, porLinea: boolean): number {
  const base = limitar(600 + largoTrazo(el, tipo, porLinea) * 1.7, 900, 2600);
  return Math.round(base * (iteraciones > 1 ? 1.25 : 1) * (tipo === "highlight" ? 0.85 : 1));
}

const completo = (r: RoughPadding): FullPadding =>
  typeof r === "number" ? [r, r, r, r] : r.length === 2 ? [r[0], r[1], r[0], r[1]] : [r[0], r[1], r[2], r[3]];

/**
 * El aire de los lados, recortado a lo que cabe: hasta el borde de la pantalla
 * o hasta la primera caja que recorta lo que se sale (una tarjeta con
 * `overflow: hidden`, una tabla con scroll). Arriba y abajo no se toca.
 */
export function rellenoQueCabe(el: HTMLElement, relleno: RoughPadding, grosor: number, porLinea: boolean): FullPadding {
  const [arriba, derecha, abajo, izquierda] = completo(relleno);
  let izq = 0;
  let der = document.documentElement.clientWidth;
  for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
    if (getComputedStyle(n).overflowX === "visible") continue;
    const r = n.getBoundingClientRect();
    izq = Math.max(izq, r.left);
    der = Math.min(der, r.right);
  }
  const todas = cajas(el, porLinea);
  const minIzq = Math.min(...todas.map((c) => c.left));
  const maxDer = Math.max(...todas.map((c) => c.right));
  // El trazo es irregular y tiene grosor: se le deja ese margen de más.
  const holgura = grosor + 2;
  return [
    arriba,
    limitar(Math.floor(der - maxDer - holgura), 0, derecha),
    abajo,
    limitar(Math.floor(minIzq - izq - holgura), 0, izquierda),
  ];
}

export interface OpcionesTrazo {
  tipo: RoughAnnotationType;
  relleno: RoughPadding;
  grosor: number;
  iteraciones: number;
  /** Un trazo por línea (lo normal) o uno solo alrededor de todo. */
  porLinea: boolean;
  /** Se dibuja solo. Con `false`, entra con un fundido. */
  animar: boolean;
  /** Milisegundos fijos, si no se quiere el ritmo calculado. */
  duracion?: number;
}

/**
 * Deja un trazo listo y devuelve cómo mostrarlo y cómo soltarlo. Es lo único
 * que tienen que llamar `Anotacion` y `MarcasEstudio` después de `annotate()`.
 */
export function prepararTrazo(el: HTMLElement, anotacion: RoughAnnotation, o: OpcionesTrazo): { mostrar: () => void; soltar: () => void } {
  const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const desanclar = anclarTrazo(el);

  // 1 · Que quepa, ahora y cuando cambie el ancho de la ventana.
  const ajustar = () => {
    const cabe = rellenoQueCabe(el, o.relleno, o.grosor, o.porLinea);
    if (JSON.stringify(cabe) !== JSON.stringify(anotacion.padding)) anotacion.padding = cabe;
  };
  ajustar();
  let ancho = window.innerWidth;
  let espera = 0;
  const alCambiar = () => {
    // `anclarTrazo` lanza avisos de `resize` sin que cambie la ventana: esos no cuentan.
    if (window.innerWidth === ancho) return;
    ancho = window.innerWidth;
    window.clearTimeout(espera);
    espera = window.setTimeout(ajustar, 180);
  };
  window.addEventListener("resize", alCambiar);

  // 3 · Los que no se animan entran con un fundido, no de golpe.
  const vecino = o.tipo === "highlight" ? el.previousElementSibling : el.nextElementSibling;
  const fundir = !o.animar && !quieto && vecino instanceof SVGElement && vecino.classList.contains("rough-annotation") ? vecino : null;
  if (fundir) {
    fundir.style.opacity = "0";
    fundir.style.transition = "opacity 0.5s ease";
  }

  let fotograma = 0;
  return {
    mostrar: () => {
      ajustar();
      if (o.animar) anotacion.animationDuration = o.duracion ?? duracionTrazo(el, o.tipo, o.iteraciones, o.porLinea);
      anotacion.show();
      if (fundir) {
        fotograma = window.requestAnimationFrame(() => {
          fundir.style.opacity = "1";
        });
      }
    },
    soltar: () => {
      window.removeEventListener("resize", alCambiar);
      window.clearTimeout(espera);
      window.cancelAnimationFrame(fotograma);
      desanclar();
    },
  };
}
