/**
 * Enlaces públicos de contacto y redes.
 *
 * Están aquí y no repartidos por las páginas porque aparecen en la home, el
 * footer, las entradas, la asesoría y las herramientas: cambiar un handle
 * obligaba a buscarlo por media web.
 *
 * Son constantes y no variables de entorno a propósito: un handle público no
 * es un secreto, y las páginas que los usan son componentes de cliente, donde
 * process.env no llega si la variable no lleva el prefijo NEXT_PUBLIC_.
 */

export const INSTAGRAM_URL = "https://www.instagram.com/adelinbtc/";
export const YOUTUBE_URL = "https://www.youtube.com/@AdelinBTC";

/** Chat privado con Adelin (la persona). Para dudas y trato directo. */
export const TELEGRAM_ADELIN_URL = "https://t.me/AdelinBTC";

/** El bot. Gestiona el acceso al canal Premium y hace de relé de soporte. */
export const TELEGRAM_BOT_URL = "https://t.me/AdelinBTC_Bot";
