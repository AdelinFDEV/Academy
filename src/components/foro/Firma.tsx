import AvatarUsuario from "@/components/AvatarUsuario";
import type { AutorForo } from "@/lib/foro/tipos";
import { fechaCorta, fechaLarga } from "./fechas";

/**
 * Quién firma un mensaje y cuándo: foto, alias, nivel y fecha.
 *
 * SIN ENLACE a ninguna parte: en el foro no hay perfiles visitables
 * (FORO.md §2). Si la cuenta ya no existe, el mensaje sigue y se firma como
 * «Usuario eliminado».
 */
export default function Firma({ autor, fecha, compacta = false }: { autor: AutorForo; fecha: string; compacta?: boolean }) {
  return (
    <span className={`fo-firma${compacta ? " fo-firma--compacta" : ""}`}>
      <AvatarUsuario
        avatar={autor?.avatar}
        inicial={autor ? autor.alias.slice(0, 1).toUpperCase() : "?"}
        className={`fo-firma-foto${autor ? "" : " es-nadie"}`}
      />
      <span className="fo-firma-texto">
        <span className="fo-firma-alias">
          {autor ? autor.alias : "Usuario eliminado"}
          {autor?.esAdmin && <span className="fo-sello fo-sello--admin">Academia</span>}
        </span>
        <span className="fo-firma-meta">
          {autor && !autor.esAdmin && <span>{autor.nivel}</span>}
          <time dateTime={fecha} title={fechaLarga(fecha)}>{fechaCorta(fecha)}</time>
        </span>
      </span>
    </span>
  );
}
