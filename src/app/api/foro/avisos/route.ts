import { esquemaLeerAvisos, leerAvisos } from "@/lib/foro/acciones/cuenta";
import { misAvisos } from "@/lib/foro/datos/mio";
import { rutaForo, rutaForoLectura } from "@/lib/foro/peticion";

/** Los avisos del usuario de la sesión. Nunca se cachea. */
export const GET = rutaForoLectura(misAvisos);

/** Marcarlos como leídos: los que diga, o todos. Sin lógica aquí (FORO.md §6.2). */
export const POST = rutaForo(esquemaLeerAvisos, leerAvisos);
