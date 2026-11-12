import { esquemaBorrar, borrar } from "@/lib/foro/acciones/publicar";
import { rutaForo } from "@/lib/foro/peticion";

/** Borrar lo propio. Sin lógica aquí: todo pasa por `rutaForo` (FORO.md §6.2). */
export const POST = rutaForo(esquemaBorrar, borrar);
