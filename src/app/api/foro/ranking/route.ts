import { esquemaRanking, salirDelRanking } from "@/lib/foro/acciones/cuenta";
import { rutaForo } from "@/lib/foro/peticion";

/** No aparecer en el ranking, o volver a él. Sin lógica aquí: todo pasa por `rutaForo` (FORO.md §6.2). */
export const POST = rutaForo(esquemaRanking, salirDelRanking);
