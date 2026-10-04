import PestanasObjetivos from "./PestanasObjetivos";
import "./objetivos.css";

/**
 * Cabecera y pestañas de /admin/objetivos: Objetivos, Calendario, Ideas,
 * Diario y Crecimiento. Cada pestaña es su propia ruta, así que se puede
 * enlazar y el navegador recuerda dónde estabas.
 *
 * Sin metadata a propósito (y nunca una canónica en un layout, PLATAFORMA.md):
 * esto es /admin, que no se indexa.
 *
 * Esta sección es privada y usa emojis y colores vivos porque el admin lo pidió
 * expresamente; la web pública sigue sin emojis.
 */
export default function ObjetivosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-page obj-pagina">
      <header className="obj-cabecera">
        <div className="obj-cabecera-brillo" aria-hidden="true" />
        <span className="obj-cabecera-ey">Tu espacio · solo lo ves tú</span>
        <h1 className="obj-cabecera-titulo">Objetivos y proyecto</h1>
        <p className="obj-cabecera-sub">
          Lo que quieres conseguir, si lo vas cumpliendo, qué publicas y cómo te sientes construyendo esto.
        </p>
      </header>
      <PestanasObjetivos />
      <div className="obj-contenido">{children}</div>
    </div>
  );
}
