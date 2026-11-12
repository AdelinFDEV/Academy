import { esquemaReportar, reportar } from "@/lib/foro/acciones/valorar";
import { rutaForo } from "@/lib/foro/peticion";

/** Reportar un mensaje. Sin lógica aquí: todo pasa por `rutaForo` (FORO.md §6.2). */
export const POST = rutaForo(esquemaReportar, reportar);
