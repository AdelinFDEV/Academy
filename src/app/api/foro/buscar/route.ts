import { sugerenciasDelForo } from "@/lib/foro/datos/hilos";
import { rutaForoPublica } from "@/lib/foro/peticion";

/**
 * Sugerencias del buscador y «¿es alguna de estas?» (`?q=…&modo=buscar|parecidas`).
 * Solo lo publicado, igual para todos. Sin lógica aquí (FORO.md §6.2).
 */
export const GET = rutaForoPublica(sugerenciasDelForo);
