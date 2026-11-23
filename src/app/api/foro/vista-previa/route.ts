import { esquemaVistaPrevia, vistaPrevia } from "@/lib/foro/acciones/previa";
import { rutaForo } from "@/lib/foro/peticion";

/** La vista previa de un mensaje: su estructura, nunca HTML. Sin lógica aquí (FORO.md §6.2). */
export const POST = rutaForo(esquemaVistaPrevia, vistaPrevia);
