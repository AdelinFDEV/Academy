"use client";

import { useEffect, useRef } from "react";

/**
 * Constante de seguimiento, en "unidades por segundo".
 *
 * Cuanto más alta, más pegado va el indicador al scroll. Por debajo de ~8 se
 * nota blando y parece que llega tarde; por encima de ~20 vuelven los saltos
 * que precisamente venimos a quitar. Con 14 alcanza un salto de rueda en unos
 * 200 ms: bastante rápido para sentirse conectado al gesto, bastante suave para
 * que el ojo no vea el escalón.
 */
const SEGUIMIENTO = 14;

/** Por debajo de esto la diferencia no llega a un píxel: se cierra y se para. */
const UMBRAL = 0.0004;

interface Props {
  /** Selector del elemento que se mide. Si no aparece, se mide el documento. */
  target?: string;
  /** Minutos de lectura de la entrada, para calcular los que quedan. */
  minutos?: number;
}

/**
 * Indicador de progreso de lectura.
 *
 * En móvil es una línea fina arriba; en escritorio, una cápsula flotante del
 * ancho de la columna de texto con los minutos que quedan. El porqué de cada
 * decisión visual está en `globals.css`, junto a las reglas.
 *
 * Cuatro decisiones que no son de estilo:
 *
 * 1 · **Mide el ARTÍCULO, no el documento.** La primera versión dividía por el
 *     `scrollHeight` entero, así que contaba la portada, los relacionados y el
 *     hilo completo de comentarios: iba por el 60 % justo cuando terminabas de
 *     leer. Un indicador que miente sobre lo que queda es peor que ninguno.
 *
 * 2 · **No usa estado de React.** Escribe una variable CSS —`--lectura`, de 0 a
 *     1— en el `<html>`, y los minutos los pone tocando el `textContent` a
 *     pelo. Desplazarse por una entrada larga no provoca ni un render. Esa
 *     misma variable la leen la cabeza con halo y el relleno de la guía del
 *     índice lateral: un solo cálculo alimenta las tres cosas.
 *
 * 3 · **Anima con `transform`, no con `width`.** El ancho recalcula el diseño
 *     en cada fotograma; la transformación la resuelve el compositor.
 *
 * 4 · **Persigue al scroll, no lo copia.** Ver `paso()`.
 */
export default function ReadingProgress({ target, minutos }: Props) {
  const texto = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const raiz = document.documentElement;
    // Si el selector no encuentra nada —una entrada tras el muro no tiene
    // cuerpo— se mide el documento, que es el comportamiento de siempre.
    const articulo = target ? document.querySelector<HTMLElement>(target) : null;
    const sinAnimacion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let objetivo = 0; // dónde está el scroll ahora mismo
    let mostrado = 0; // dónde está el indicador, que va detrás
    let animando = false;
    let ultimo = 0;
    let ultimoTexto = "";

    /** Cuánto del artículo queda por encima del borde inferior de la ventana. */
    function medir(): number {
      const ventana = window.innerHeight;

      if (articulo) {
        const caja = articulo.getBoundingClientRect();
        // Se da por leído cuando el FINAL del artículo llega al final de la
        // ventana, no cuando su principio llega arriba. Con lo segundo se
        // completaba quedando todavía una pantalla entera por leer.
        const recorrido = caja.height - ventana;
        if (recorrido > 0) return -caja.top / recorrido;
        return caja.top <= 0 ? 1 : 0;
      }

      const recorrido = raiz.scrollHeight - ventana;
      return recorrido > 0 ? window.scrollY / recorrido : 0;
    }

    function pintar(valor: number) {
      raiz.style.setProperty("--lectura", valor.toFixed(4));

      const nodo = texto.current;
      if (!nodo || !minutos) return;

      // Se redondea hacia arriba: quedando 3,2 minutos, decir «3» es prometer
      // de menos. Y solo se toca el DOM cuando el rótulo cambia de verdad, no
      // sesenta veces por segundo.
      const restantes = Math.max(0, Math.ceil(minutos * (1 - valor)));
      const nuevo =
        valor >= 0.999
          ? "Final del artículo"
          : restantes <= 1
            ? "Menos de 1 min"
            : `${restantes} min restantes`;

      if (nuevo !== ultimoTexto) {
        ultimoTexto = nuevo;
        nodo.textContent = nuevo;
      }
    }

    /*
     * El paso amortiguado.
     *
     * El indicador no salta al valor nuevo: recorre una fracción de lo que le
     * falta en cada fotograma. Eso da justo lo que se busca —arranca deprisa
     * cuando te alejas de un tirón y frena al acercarse—, y resuelve el
     * problema de origen: la rueda del ratón mueve la página a saltos de ~100
     * px, así que copiar el scroll tal cual daba escalones visibles por muchos
     * fotogramas por segundo que hubiera.
     *
     * La fracción sale de una exponencial sobre el tiempo transcurrido y NO de
     * un porcentaje fijo por fotograma: con un porcentaje fijo, el mismo
     * indicador correría al doble de velocidad en una pantalla de 120 Hz que en
     * una de 60.
     *
     * `dt` se limita a 100 ms: al volver de otra pestaña el navegador entrega
     * un salto enorme, y sin el tope el indicador pegaría un latigazo.
     */
    function paso(ahora: number) {
      const dt = Math.min((ahora - ultimo) / 1000, 0.1);
      ultimo = ahora;

      const diferencia = objetivo - mostrado;

      if (Math.abs(diferencia) < UMBRAL) {
        mostrado = objetivo;
        pintar(mostrado);
        animando = false;
        return;
      }

      mostrado += diferencia * (1 - Math.exp(-SEGUIMIENTO * dt));
      pintar(mostrado);
      requestAnimationFrame(paso);
    }

    function arrancar() {
      objetivo = Math.min(1, Math.max(0, medir()));

      // Quien ha pedido menos movimiento no quiere nada persiguiendo nada.
      if (sinAnimacion) {
        mostrado = objetivo;
        pintar(mostrado);
        return;
      }

      if (animando) return; // el bucle en marcha ya usará el objetivo nuevo
      animando = true;
      ultimo = performance.now();
      requestAnimationFrame(paso);
    }

    // Primer pintado sin animación: al cargar, el indicador debe estar ya en su
    // sitio, no venir deslizándose desde cero.
    objetivo = Math.min(1, Math.max(0, medir()));
    mostrado = objetivo;
    pintar(mostrado);

    window.addEventListener("scroll", arrancar, { passive: true });
    window.addEventListener("resize", arrancar, { passive: true });

    return () => {
      window.removeEventListener("scroll", arrancar);
      window.removeEventListener("resize", arrancar);
      animando = false;
      raiz.style.removeProperty("--lectura");
    };
  }, [target, minutos]);

  return (
    // Decorativo para lectores de pantalla: repite información que ya está en
    // la cabecera («3 min de lectura») y anunciar un progreso que cambia sesenta
    // veces por segundo sería insoportable.
    <div className="reading-progress-bar" aria-hidden="true">
      <span className="lectura-pista">
        <span className="lectura-relleno" />
      </span>
      <span className="lectura-texto" ref={texto} />
    </div>
  );
}
