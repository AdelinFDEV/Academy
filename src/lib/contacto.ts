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

/**
 * Canal gratuito de Telegram. **Es el destino por defecto de la web.**
 *
 * Un icono de Telegram junto a los de Instagram y YouTube promete un sitio
 * donde mirar, no escribirle por privado a alguien a quien no conoces. El canal
 * enseña contenido al instante, deja mirar sin comprometerse y atiende a todo
 * el mundo a la vez; un privado se atiende de uno en uno y lo paga el admin con
 * su tiempo. Hasta el 06-09-2026 todo apuntaba al privado, incluido el botón de
 * la portada cuyo propio comentario decía «es donde está la comunidad».
 *
 * Se escribe aquí, y no se lee de `getFreeChannelUrl()` (en `lib/telegram.ts`),
 * porque aquella lee `process.env` sin prefijo `NEXT_PUBLIC_` y estos enlaces
 * salen en componentes de cliente, donde no llegaría.
 */
export const TELEGRAM_CANAL_FREE_URL = "https://t.me/FreeAdelinBTC";

/**
 * Chat privado con Adelin (la persona, NO el bot).
 *
 * Se reserva para donde el trato directo es justo lo que se ofrece: después de
 * pagar y dentro de las herramientas Premium. En lo público va el canal.
 */
export const TELEGRAM_ADELIN_URL = "https://t.me/AdelinBTC";

/**
 * El bot. Gestiona el acceso al canal Premium y hace de relé de soporte.
 *
 * No se enlaza desde la web a propósito: a quien paga se le lleva al bot desde
 * el propio flujo de la suscripción, y a un visitante un bot no le dice nada.
 */
export const TELEGRAM_BOT_URL = "https://t.me/AdelinBTC_Bot";
