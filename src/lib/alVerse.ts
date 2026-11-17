/**
 * Avisa UNA vez cuando un elemento se ve de verdad, no cuando el navegador
 * calcula que ha rozado la pantalla. Lo usan todas las marcas que se dibujan
 * solas (Anotacion, MarcasEstudio, TrazoVisible): si el trazo se pinta antes de
 * que la persona mire, la animación se pierde (pasaba en el móvil, avisado por
 * el admin el 17-11-2026).
 *
 * Un IntersectionObserver a pelo dispara demasiado pronto por cinco motivos, y
 * aquí se cubre cada uno:
 *
 *  1. **El borde de la pantalla.** Un texto pequeño cumple el umbral en cuanto
 *     asoma por abajo, que en el móvil es justo donde están la barra del
 *     navegador y el pulgar. Solo cuenta la franja central de la pantalla
 *     (`rootMargin` negativo arriba y abajo).
 *  2. **El scroll rápido.** Pasar de largo por encima no es verlo: tiene que
 *     quedarse en la franja un momento (`permanencia`). Si sale antes, se
 *     espera a la siguiente vez.
 *  3. **Lo transparente o escondido.** El observador no sabe de `opacity` ni de
 *     `visibility`: un texto dentro de un bloque que aún está apareciendo (o de
 *     un desplegable cerrado) cuenta como visible. Se mira el elemento y sus
 *     antepasados, y se espera a que se vea (a medio aparecer ya vale). Si
 *     sigue atenuado tras 2,5 s a la vista, es que lo está a propósito, y se
 *     dibuja.
 *  4. **La pestaña de fondo.** Si la página carga sin estar delante, se espera
 *     a que la persona vuelva a ella.
 *  5. **Las fuentes.** Dibujar antes de que lleguen Fraunces y Nunito mide el
 *     texto con la letra de reserva y el trazo queda torcido o corto.
 *
 * Un elemento más alto que la franja nunca llegaría a su umbral: para esos
 * basta con que ocupe buena parte de ella. Y lo que está al final de la página
 * (o arriba del todo) nunca entra en la franja porque la página no se mueve
 * más: ahí vale con que se vea en pantalla.
 *
 * Devuelve la función que lo cancela todo (para el desmontaje de React).
 */

export interface OpcionesAlVerse {
  /** Qué parte del elemento tiene que estar dentro de la franja (0 a 1). */
  umbral?: number;
  /** Milisegundos que tiene que seguir a la vista antes de avisar. */
  permanencia?: number;
}

/**
 * La franja que cuenta como «mirando»: fuera quedan arriba los 72 px de la
 * barra fija (que tapa lo que pasa por debajo) y abajo el 18 % de la pantalla.
 */
const FRANJA = "-72px 0px -18% 0px";
/** La pantalla entera, menos la barra: para los dos extremos de la página. */
const PANTALLA = "-72px 0px 0px 0px";
/** Avisos del observador cada 10 %: así se sabe en todo momento cuánto se ve. */
const UMBRALES = Array.from({ length: 11 }, (_, i) => i / 10);

/** Se ve: ni transparente ni escondido, ni él ni nadie por encima. */
function seVe(el: Element): boolean {
  const conCheck = el as Element & {
    checkVisibility?: (o: { opacityProperty?: boolean; visibilityProperty?: boolean }) => boolean;
  };
  if (conCheck.checkVisibility && !conCheck.checkVisibility({ opacityProperty: true, visibilityProperty: true })) {
    return false;
  }
  // checkVisibility solo descarta la opacidad 0 exacta: un bloque a medio
  // aparecer (0,3) también es «aún no». Se multiplica la de toda la cadena.
  let opacidad = 1;
  for (let n: Element | null = el; n && n !== document.documentElement; n = n.parentElement) {
    const estilo = getComputedStyle(n);
    if (estilo.visibility === "hidden" || estilo.display === "none") return false;
    opacidad *= Number.parseFloat(estilo.opacity) || 0;
    if (opacidad < 0.5) return false;
  }
  return true;
}

export function alVerse(el: Element, alAparecer: () => void, { umbral = 0.6, permanencia = 300 }: OpcionesAlVerse = {}): () => void {
  let dentro = false;
  let hecho = false;
  let espera = 0;
  /** Cuándo entró en la franja por última vez. */
  let desde = 0;
  let fuentes = typeof document.fonts === "undefined" || document.fonts.status === "loaded";

  let enFranja = false;
  let enPantalla = false;

  const terminar = () => {
    hecho = true;
    observador.disconnect();
    pantalla.disconnect();
    window.clearTimeout(espera);
    document.removeEventListener("visibilitychange", comprobar);
    window.removeEventListener("scroll", decidir);
  };

  /**
   * Lo que está al final de la página nunca sube hasta la franja: la página
   * no da más de sí. Ahí (y arriba del todo, sin haber bajado) basta con que
   * se vea en la pantalla.
   */
  const enUnExtremo = () => {
    const raiz = document.documentElement;
    return window.scrollY <= 0 || window.innerHeight + window.scrollY >= raiz.scrollHeight - 4;
  };

  function decidir() {
    if (hecho) return;
    const ahora = enFranja || (enPantalla && enUnExtremo());
    if (ahora === dentro) return;
    dentro = ahora;
    window.clearTimeout(espera);
    if (dentro) {
      desde = performance.now();
      espera = window.setTimeout(comprobar, permanencia);
    }
  }

  /** Si sigue dentro y todo está listo, avisa; si no, vuelve a mirar en un momento. */
  function comprobar() {
    window.clearTimeout(espera);
    if (hecho || !dentro) return;
    // Un antepasado atenuado a propósito (opacidad fija por diseño) no puede
    // dejar la marca sin dibujar para siempre: tras un rato a la vista, vale.
    const atenuadoAdrede = performance.now() - desde > 2500;
    if (document.visibilityState !== "visible" || !fuentes || (!seVe(el) && !atenuadoAdrede)) {
      // Lo que falta (la pestaña, las fuentes o un bloque que aún aparece) no
      // avisa al observador: se vuelve a mirar mientras siga en la franja.
      espera = window.setTimeout(comprobar, 120);
      return;
    }
    terminar();
    alAparecer();
  }

  /** Si se ve lo bastante: su umbral, o media zona si es más alto que eso. */
  const cumple = (e: IntersectionObserverEntry) => {
    const zona = e.rootBounds?.height ?? window.innerHeight;
    const necesario = Math.min(e.boundingClientRect.height * umbral, zona * 0.5);
    return e.isIntersecting && e.intersectionRect.height >= Math.max(1, necesario - 0.5);
  };

  const observador = new IntersectionObserver(
    ([e]) => {
      if (!e) return;
      enFranja = cumple(e);
      decidir();
    },
    { rootMargin: FRANJA, threshold: UMBRALES },
  );
  const pantalla = new IntersectionObserver(
    ([e]) => {
      if (!e) return;
      enPantalla = cumple(e);
      // Llegar al final de la página no avisa a ningún observador: mientras
      // esté en pantalla, se mira también al hacer scroll.
      if (enPantalla) window.addEventListener("scroll", decidir, { passive: true });
      else window.removeEventListener("scroll", decidir);
      decidir();
    },
    { rootMargin: PANTALLA, threshold: UMBRALES },
  );
  observador.observe(el);
  pantalla.observe(el);
  document.addEventListener("visibilitychange", comprobar);

  if (!fuentes) {
    document.fonts.ready.then(() => {
      fuentes = true;
    });
  }

  return terminar;
}
