import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import "@/app/foro/foro.css";

/**
 * El marco de todas las pantallas del foro: la barra, el fondo técnico (una
 * rejilla que se desvanece y dos luces fijas) y el pie.
 *
 * El fondo es un degradado quieto, sin desenfoque ni animación: se pinta una
 * vez y no cuesta nada al desplazarse.
 *
 * `acento` tiñe las luces del fondo: el naranja de la marca en el foro, y el
 * color de su categoría dentro de un hilo.
 */
export default function MarcoForo({
  conSesion,
  ancho = "normal",
  acento,
  children,
}: {
  conSesion: boolean;
  /** `lectura` para un texto que se lee entero; `ancho` para una rejilla. */
  ancho?: "normal" | "lectura" | "ancho";
  acento?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="blog-page fo-pagina" style={acento ? ({ "--cat": acento } as React.CSSProperties) : undefined}>
      <SiteNav user={conSesion} />
      <div className="fo-fondo" aria-hidden="true">
        <span className="fo-fondo-rejilla" />
        <span className="fo-fondo-luz fo-fondo-luz--1" />
        <span className="fo-fondo-luz fo-fondo-luz--2" />
      </div>
      <main className={`fo-main fo-main--${ancho}`}>{children}</main>
      <Footer />
    </div>
  );
}
