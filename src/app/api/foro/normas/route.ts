import { esquemaNormas, aceptarNormas } from "@/lib/foro/acciones/cuenta";
import { rutaForo } from "@/lib/foro/peticion";

/** Aceptar las normas de la comunidad. Sin lógica aquí: todo pasa por `rutaForo` (FORO.md §6.2). */
export const POST = rutaForo(esquemaNormas, aceptarNormas);
