import { esquemaGanadora, elegirGanadora } from "@/lib/foro/acciones/valorar";
import { rutaForo } from "@/lib/foro/peticion";

/** Elegir la respuesta ganadora. Sin lógica aquí: todo pasa por `rutaForo` (FORO.md §6.2). */
export const POST = rutaForo(esquemaGanadora, elegirGanadora);
