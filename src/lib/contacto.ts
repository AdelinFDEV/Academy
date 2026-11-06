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

/**
 * Los mensajes directos de Instagram. `ig.me/m/…` es el enlace oficial de
 * Meta para abrir una conversación: en el móvil abre la app de Instagram si
 * está instalada, y en el ordenador la bandeja de entrada de la web.
 */
export const INSTAGRAM_DM_URL = "https://ig.me/m/adelinbtc";
export const YOUTUBE_URL = "https://www.youtube.com/@AdelinBTC";

// Telegram (canal, chat y bot) estuvo aquí hasta el 05-11-2026, cuando el admin
// lo retiró de toda la web. Las redes son Instagram y YouTube.

