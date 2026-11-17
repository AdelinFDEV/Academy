import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import "@/app/foro/foro.css";

/**
 * El marco de todas las pantallas del foro: la barra, la hoja y el pie.
 *
 * Estilo «Cuaderno de estudio» desde el 17-11-2026 (ESTILO.md): el fondo
 * lavanda de la casa con una cuadrícula de cuaderno que se desvanece hacia
 * abajo, quieta (un degradado que se pinta una vez), y el coral del foro.
 *
 * `tono` cambia el color de acento de la pantalla (las variables `--cat`,
 * `--cat-o` y `--cat-s`): el de su categoría dentro de un hilo o de un
 * listado filtrado, el amarillo de los logros en el ranking. Sin él, coral.
 */
export default function MarcoForo({
  conSesion,
  tono,
  children,
}: {
  conSesion: boolean;
  tono?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div className="blog-page fo-pagina" style={tono}>
      <SiteNav user={conSesion} />
      <div className="fo-cuadricula" aria-hidden="true" />
      <main className="fo-main">{children}</main>
      <Footer />
    </div>
  );
}
