import { esquemaEtiquetar, etiquetar } from "@/lib/foro/acciones/valorar";
import { rutaForo } from "@/lib/foro/peticion";

/** Poner o quitar una etiqueta en una pregunta. Sin lógica aquí: todo pasa por `rutaForo` (FORO.md §6.2). */
export const POST = rutaForo(esquemaEtiquetar, etiquetar);
