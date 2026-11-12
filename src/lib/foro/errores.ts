import "server-only";

/**
 * Cada código de error del foro, con lo que ve el usuario y el estado HTTP.
 *
 * Los códigos salen de las funciones de Postgres (`scripts/create-foro-
 * funciones.sql`) y de `permisos.ts` y `peticion.ts`. Al navegador le llega
 * el código y esta frase: NUNCA el error de Postgres, que enseña nombres de
 * tablas y de restricciones (FORO.md §6.2).
 *
 * Un código que no esté aquí se convierte en el genérico: si una función
 * nueva devuelve algo que nadie previó, el usuario ve «inténtalo más tarde»,
 * no un texto interno.
 */

type Entrada = { status: number; mensaje: string };

const E = (status: number, mensaje: string): Entrada => ({ status, mensaje });

const ERRORES: Record<string, Entrada> = {
  // ── La petición ──
  origen: E(403, "Petición no permitida."),
  formato: E(400, "Petición no válida."),
  demasiado_grande: E(413, "El mensaje es demasiado grande."),

  // ── Quién eres ──
  sin_sesion: E(401, "Tienes que iniciar sesión."),
  falta_2fa: E(401, "Completa la verificación en dos pasos para seguir."),
  no_premium: E(403, "Participar en el foro es parte de Premium."),
  sin_alias: E(403, "Antes de participar, elige tu alias en «Mi perfil»."),
  sin_normas: E(403, "Antes de participar tienes que aceptar las normas de la comunidad."),
  sancionado: E(403, "Ahora mismo no puedes participar en el foro."),
  foro_cerrado: E(404, "No encontrado."),
  solo_lectura: E(503, "El foro está en modo de solo lectura en este momento. Vuelve a intentarlo más tarde."),
  no_admin: E(403, "Acceso denegado."),
  falta_2fa_admin: E(403, "Para moderar el foro tienes que tener activada la verificación en dos pasos y haberla pasado en esta sesión. Actívala en «Mi perfil»."),

  // ── Lo que pides ──
  // Lo que no existe y lo que no puedes ver responden IGUAL (FORO.md §6.2).
  no_existe: E(404, "No encontrado."),
  no_es_tuya: E(403, "Solo puede hacerlo quien lo escribió."),
  propio: E(400, "No puedes valorar ni reportar lo que has escrito tú."),
  hilo_cerrado: E(409, "Este hilo ya está resuelto y no admite más respuestas."),
  ya_elegida: E(409, "Este hilo ya tiene una respuesta elegida."),
  respuesta_no_valida: E(400, "Esa respuesta no se puede elegir."),
  es_ganadora: E(409, "La respuesta elegida no se puede editar ni borrar."),
  tiene_respuestas: E(409, "La pregunta ya tiene respuestas. Si necesitas retirarla, pídelo a la academia."),
  tiene_ganadora: E(409, "El hilo tiene una respuesta elegida."),
  fuera_de_plazo: E(409, "Ya ha pasado el plazo para editar este mensaje."),
  ya_reportado: E(409, "Ya habías reportado este mensaje."),
  sin_reportar: E(403, "Ahora mismo no puedes reportar mensajes."),
  sin_cambios: E(409, "No hay nada que cambiar."),
  duplicado: E(409, "Ese mismo texto ya está publicado en el foro."),
  categoria_no_valida: E(400, "Esa categoría no existe."),
  etiqueta_no_valida: E(400, "Esa etiqueta no existe."),
  imagen_no_valida: E(400, "Alguna de las imágenes no es válida. Vuelve a subirlas."),
  contenido_no_valido: E(400, "El mensaje no cumple los requisitos de longitud."),
  version_antigua: E(409, "Las normas han cambiado. Recarga la página y vuelve a aceptarlas."),
  falta_motivo: E(400, "Falta el motivo."),
  accion_no_valida: E(400, "Acción no válida."),

  // ── Límites ──
  limite_preguntas: E(429, "Has llegado al máximo de preguntas por hoy."),
  limite_respuestas: E(429, "Has llegado al máximo de respuestas por ahora. Vuelve a intentarlo más tarde."),
  limite_me_gusta: E(429, "Has llegado al máximo de «me gusta» por hoy."),
  limite_etiquetas: E(429, "Has llegado al máximo de etiquetas por hoy."),
  limite_reportes: E(429, "Has llegado al máximo de reportes por hoy."),
  limite_imagenes: E(429, "Has llegado al máximo de imágenes por hoy."),
  demasiados_rechazos: E(429, "Has enviado demasiados mensajes que no cumplen las normas. Podrás volver a publicar mañana."),
  nuevo_sin_enlaces: E(403, "Durante tus primeros 7 días en el foro no puedes publicar enlaces."),

  // ── El genérico ──
  interno: E(500, "No se ha podido completar. Inténtalo de nuevo en unos minutos."),
};

export function errorForo(codigo: string): { codigo: string; status: number; mensaje: string } {
  const e = ERRORES[codigo];
  return e ? { codigo, ...e } : { codigo: "interno", ...ERRORES.interno };
}
