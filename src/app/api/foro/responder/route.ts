import { esquemaResponder, responder } from "@/lib/foro/acciones/publicar";
import { rutaForo } from "@/lib/foro/peticion";

/** Responder a una pregunta o replicar a un mensaje. Sin lógica aquí: todo pasa por `rutaForo` (FORO.md §6.2). */
export const POST = rutaForo(esquemaResponder, responder);
