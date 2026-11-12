import { esquemaMeGusta, meGusta } from "@/lib/foro/acciones/valorar";
import { rutaForo } from "@/lib/foro/peticion";

/** Poner o quitar un me gusta. Sin lógica aquí: todo pasa por `rutaForo` (FORO.md §6.2). */
export const POST = rutaForo(esquemaMeGusta, meGusta);
