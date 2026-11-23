import { esquemaSeguir, seguir } from "@/lib/foro/acciones/valorar";
import { rutaForo } from "@/lib/foro/peticion";

/** Seguir un hilo o dejar de seguirlo. Sin lógica aquí: todo pasa por `rutaForo` (FORO.md §6.2). */
export const POST = rutaForo(esquemaSeguir, seguir);
