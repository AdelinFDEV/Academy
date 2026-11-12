import { mioEnHilo } from "@/lib/foro/datos/mio";
import { rutaForoLectura } from "@/lib/foro/peticion";

/**
 * Lo que el usuario de la sesión ha hecho en un hilo (`?pregunta=<id>`): sus
 * me gusta, sus etiquetas, sus mensajes. La página del hilo es igual para
 * todos; esto se pide aparte y nunca se cachea (FORO.md §6.0).
 */
export const GET = rutaForoLectura(mioEnHilo);
