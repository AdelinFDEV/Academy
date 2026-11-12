import { esquemaPreguntar, preguntar } from "@/lib/foro/acciones/publicar";
import { rutaForo } from "@/lib/foro/peticion";

/** Publicar una pregunta. Sin lógica aquí: todo pasa por `rutaForo` (FORO.md §6.2). */
export const POST = rutaForo(esquemaPreguntar, preguntar);
