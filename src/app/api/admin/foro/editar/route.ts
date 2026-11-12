import { esquemaEditarAdmin, editarComoAdmin } from "@/lib/foro/acciones/moderar";
import { rutaForoAdmin } from "@/lib/foro/peticion";

/** El admin corrige un mensaje ajeno. Queda marcado y en el registro. Sin lógica aquí: todo pasa por `rutaForoAdmin` (FORO.md §6.2). */
export const POST = rutaForoAdmin(esquemaEditarAdmin, editarComoAdmin);
