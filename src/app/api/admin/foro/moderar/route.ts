import { esquemaModerar, moderar } from "@/lib/foro/acciones/moderar";
import { rutaForoAdmin } from "@/lib/foro/peticion";

/**
 * Ocultar, restaurar, borrar, desestimar, cerrar, fijar o mover.
 * Solo admin, y con la verificación en dos pasos pasada: lo comprueba
 * `rutaForoAdmin` (FORO.md §6.2 y §7). Sin lógica aquí.
 */
export const POST = rutaForoAdmin(esquemaModerar, moderar);
