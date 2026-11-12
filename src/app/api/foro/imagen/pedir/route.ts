import { esquemaPedirSubida, pedirSubida } from "@/lib/foro/acciones/imagenes";
import { rutaForo } from "@/lib/foro/peticion";

// Recodificar una imagen necesita Node (sharp), no el runtime de Edge.
export const runtime = "nodejs";

/** Pedir una URL firmada para subir una imagen. Sin lógica aquí: todo pasa por `rutaForo` (FORO.md §6.2 y §6.6). */
export const POST = rutaForo(esquemaPedirSubida, pedirSubida);
