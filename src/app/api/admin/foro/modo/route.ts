import { esquemaModo, cambiarModo } from "@/lib/foro/acciones/moderar";
import { rutaForoAdmin } from "@/lib/foro/peticion";

/**
 * El interruptor del foro: cerrado, lectura o abierto.
 * Solo admin, y con la verificación en dos pasos pasada: lo comprueba
 * `rutaForoAdmin` (FORO.md §6.2 y §7). Sin lógica aquí.
 */
export const POST = rutaForoAdmin(esquemaModo, cambiarModo);
