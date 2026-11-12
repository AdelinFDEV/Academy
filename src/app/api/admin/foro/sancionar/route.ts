import { esquemaSancionar, sancionarAutor } from "@/lib/foro/acciones/moderar";
import { rutaForoAdmin } from "@/lib/foro/peticion";

/**
 * Sancionar al autor de un mensaje.
 * Solo admin, y con la verificación en dos pasos pasada: lo comprueba
 * `rutaForoAdmin` (FORO.md §6.2 y §7). Sin lógica aquí.
 */
export const POST = rutaForoAdmin(esquemaSancionar, sancionarAutor);
