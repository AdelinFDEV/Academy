/**
 * La página no se desplaza mientras haya un menú, desplegable o ventana
 * abierto, en el ordenador y en el móvil (regla del admin, 18-11-2026: «cuando
 * un popup o menú, incluido el secundario, esté abierto, no se puede hacer
 * scroll en la web hasta cerrarlo»).
 *
 * Una sola pieza para toda la web, con CONTADOR: cada cosa que se abre pide un
 * bloqueo y, al cerrarse, lo suelta; la página solo vuelve a moverse cuando se
 * suelta el último. Antes cada menú lo hacía a su manera y, con dos abiertos a
 * la vez, el primero en cerrarse desbloqueaba la página aunque el otro
 * siguiera abierto.
 *
 * Se fija en <html> Y en <body>: globals.css pone `overflow-x: hidden` en
 * <html>, y con eso el scroll es el de <html>; un `overflow: hidden` solo en
 * <body> no paraba nada. `overscroll-behavior: none` evita, además, que en el
 * móvil el gesto de arrastrar «empuje» la página al llegar al final de un
 * menú que se desliza.
 *
 * Devuelve la función que suelta el bloqueo (se puede llamar más de una vez
 * sin descontar dos veces).
 */
let abiertos = 0;
let antes: { raiz: string; cuerpo: string; rebote: string } | null = null;

export function bloquearScroll(): () => void {
  if (typeof document === "undefined") return () => {};
  const raiz = document.documentElement;
  if (abiertos === 0) {
    antes = {
      raiz: raiz.style.overflow,
      cuerpo: document.body.style.overflow,
      rebote: raiz.style.overscrollBehavior,
    };
    raiz.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    raiz.style.overscrollBehavior = "none";
  }
  abiertos++;

  let soltado = false;
  return () => {
    if (soltado) return;
    soltado = true;
    abiertos = Math.max(0, abiertos - 1);
    if (abiertos === 0 && antes) {
      raiz.style.overflow = antes.raiz;
      document.body.style.overflow = antes.cuerpo;
      raiz.style.overscrollBehavior = antes.rebote;
      antes = null;
    }
  };
}
