import { esquemaEditar, editar } from "@/lib/foro/acciones/publicar";
import { rutaForo } from "@/lib/foro/peticion";

/** Editar lo propio, durante 30 minutos. Sin lógica aquí: todo pasa por `rutaForo` (FORO.md §6.2). */
export const POST = rutaForo(esquemaEditar, editar);
