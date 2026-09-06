import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * La vista previa de un borrador, solo para el admin.
 *
 * ── Por qué existe ─────────────────────────────────────────────────────────
 *
 * Una entrada con `published = false` daba **404 para todo el mundo, admin
 * incluido**, así que no había forma de ver cómo quedaba antes de publicarla.
 * Y publicar para mirarla no es una opción: `published = true` **manda un aviso
 * al grupo de Telegram** desde `anunciarPendientes()`. O lo veías después de
 * anunciarlo, o no lo veías.
 *
 * ── La regla que NO se rompe ───────────────────────────────────────────────
 *
 * **`.eq("published", true)` sigue en su sitio, intacto, en todas las
 * consultas.** Esto no lo quita: solo añade un segundo intento cuando la
 * primera consulta no devuelve nada Y quien mira es admin.
 *
 * Es a propósito, y tiene dos ventajas sobre quitar el filtro y decidir
 * después:
 *
 * 1. **El camino normal no cambia ni cuesta nada.** Una entrada publicada se
 *    resuelve con la misma consulta de siempre; la segunda solo ocurre en lo
 *    que de todas formas iba a ser un 404.
 * 2. **Si esto se rompe, se rompe hacia el lado seguro.** Un fallo aquí
 *    devuelve 404, que es exactamente lo que pasaba antes. Quitando el filtro,
 *    un fallo enseñaría borradores a cualquiera.
 *
 * ── Lo que sigue sin ver un borrador ───────────────────────────────────────
 *
 * El sitemap, el RSS, `/articulos`, la portada y las páginas de categoría
 * mantienen su `.eq("published", true)` y **no se tocan**. Un borrador se ve
 * únicamente escribiendo su URL, y solo si eres admin.
 *
 * Y la página se marca `noindex` mientras sea borrador: aunque Google llegara
 * al enlace, no lo indexa. Eso lo hace `metadataDeBorrador()`.
 */

/** El rol se lee de la BASE DE DATOS a partir de la sesión, nunca de la petición. */
export async function esAdmin(
  supabase: SupabaseClient,
  userId: string | undefined,
): Promise<boolean> {
  if (!userId) return false;
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).single();
  return data?.role === "admin";
}

/**
 * Metadatos de una entrada en borrador.
 *
 * `noindex, nofollow` y **sin canónica**: una canónica en un borrador le diría
 * a Google que esa URL es la buena versión de algo que aún no existe.
 */
export const metadataDeBorrador = (titulo: string) => ({
  title: `[Borrador] ${titulo}`,
  robots: { index: false, follow: false },
});
