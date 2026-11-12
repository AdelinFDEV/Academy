import { esquemaLevantar, levantarSancion } from "@/lib/foro/acciones/moderar";
import { rutaForoAdmin } from "@/lib/foro/peticion";

/**
 * Levantar una sanción antes de tiempo.
 * Solo admin, y con la verificación en dos pasos pasada: lo comprueba
 * `rutaForoAdmin` (FORO.md §6.2 y §7). Sin lógica aquí.
 */
export const POST = rutaForoAdmin(esquemaLevantar, levantarSancion);
