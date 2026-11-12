/**
 * Lo que el foro enseña al navegador, campo a campo (FORO.md §6.0, regla 3).
 *
 * NADA sale del servidor sin ser uno de estos tipos, y `datos/` los construye
 * a mano, sin `select *` ni `...fila`. Por eso aquí NO HAY, ni habrá:
 *   · ningún id de usuario (`autor_id`, `usuario_id`…): sin perfiles visitables
 *     no hace falta, y con él se podría cruzar la actividad de alguien;
 *   · huellas, motivos internos, reportes ni nada de moderación.
 * Si un tipo de aquí necesita un campo nuevo, se añade aquí primero y luego
 * en su lectura: el día que la tabla gane una columna privada, no sale sola.
 *
 * Es uno de los dos archivos del módulo que puede importar el navegador.
 */
import type { EtiquetaId } from "./limites";

/** Quien firma un mensaje. `null` = la cuenta ya no existe («usuario eliminado»). */
export type AutorForo = {
  alias: string;
  /** Id de la foto en `AVATARES` (`src/lib/perfilPublico.ts`), o null. */
  avatar: string | null;
  nivel: string;
  esAdmin: boolean;
} | null;

/** El resultado de cualquier acción del foro, tal cual llega al navegador. */
export type ResultadoForo<T extends Record<string, unknown> = Record<string, never>> =
  | ({ ok: true } & T)
  | { ok: false; error: string; mensaje: string };

/** Lo que el propio usuario ha hecho en un hilo. Se pide aparte y nunca se cachea. */
export type MioEnHilo = {
  /** Puede participar ahora mismo; si no, por qué (código de `errores.ts`). */
  puede: boolean;
  motivo: string | null;
  esAutorDeLaPregunta: boolean;
  /** Ids de las respuestas y réplicas con su me gusta. */
  meGusta: string[];
  etiquetas: EtiquetaId[];
  /** Ids de los mensajes suyos en el hilo (para editar o borrar). */
  mios: string[];
  /** Lo que ya ha reportado: "pregunta" o el id de la respuesta. */
  reportados: string[];
};

export type AvisoForo = {
  id: string;
  tipo: string;
  cuantos: number;
  leido: boolean;
  /** Solo en los de moderación: el motivo que ve el afectado. */
  motivo: string;
  fecha: string;
  /** A dónde lleva. null si el hilo ya no existe. */
  hilo: { id: number; slug: string; titulo: string } | null;
  respuestaId: string | null;
};
