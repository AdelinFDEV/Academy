import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { bd } from "./bd";

/**
 * Quién hace la petición y si puede participar (FORO.md §3 y §6.2).
 *
 * Todo se lee EN ESE MOMENTO y en el servidor: la sesión, el rol, la sanción.
 * Nada de lo que mande el navegador ni de lo calculado al cargar la página.
 *
 * Esta es la primera comprobación. La segunda, y la que manda, la hace cada
 * función de Postgres dentro de su transacción (`foro_puede_participar`): si
 * una ruta nueva se olvidara de llamar aquí, la base de datos se niega igual.
 */

export type Sesion = { ok: true; usuarioId: string } | { ok: false; error: "sin_sesion" | "falta_2fa" };

/**
 * El usuario de la sesión, comprobado contra Supabase (`getUser`, nunca
 * `getSession`, que se fía de la cookie sin verificarla).
 *
 * Si la cuenta tiene verificación en dos pasos, la sesión tiene que haberla
 * pasado. `src/proxy.ts` solo lo exige en las páginas protegidas, no en
 * `/api`: sin esto, con la contraseña robada se podría publicar llamando a
 * la API directamente, sin pasar por el reto.
 */
export async function sesion(): Promise<Sesion> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin_sesion" };

  const { data: aal, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  // Cerrado por defecto: si no se puede saber, es que no.
  if (error || !aal) return { ok: false, error: "falta_2fa" };
  if (aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") return { ok: false, error: "falta_2fa" };

  return { ok: true, usuarioId: user.id };
}

/**
 * Quién MIRA una página, sin exigirle nada: el id de su sesión, o null. Para
 * decidir si el foro existe para él y qué botones enseñarle. No sirve para
 * autorizar ninguna acción: eso es `sesion()` y lo que comprueba cada función.
 */
export async function quienMira(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * La sesión de quien modera. Tres cosas, y las tres en el servidor:
 *   · hay sesión;
 *   · HA PASADO la verificación en dos pasos en esta sesión (`aal2`). Aquí no
 *     vale «si la tiene»: quien puede ocultar, borrar y sancionar tiene que
 *     tenerla activada. Con solo la contraseña del admin robada no se modera;
 *   · su rol es `admin`, leído de la base de datos en ese momento.
 * Las funciones de Postgres vuelven a comprobar el rol por su cuenta.
 */
export async function sesionAdmin(): Promise<{ ok: true; usuarioId: string } | { ok: false; error: "sin_sesion" | "falta_2fa_admin" | "no_admin" }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin_sesion" };

  const { data: perfil } = await bd().from("profiles").select("role").eq("id", user.id).maybeSingle();
  // Antes que el 2FA: a quien no es admin no se le dice ni que existe el requisito.
  if (perfil?.role !== "admin") return { ok: false, error: "no_admin" };

  const { data: aal, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || !aal || aal.currentLevel !== "aal2") return { ok: false, error: "falta_2fa_admin" };

  return { ok: true, usuarioId: user.id };
}

/**
 * ¿Puede participar ahora mismo? Devuelve null si sí, o el código del motivo.
 * Es la misma función que usan por dentro todas las acciones: una sola regla,
 * escrita una vez, en la base de datos.
 */
export async function motivoParaNoParticipar(usuarioId: string): Promise<string | null> {
  const { data, error } = await bd().rpc("foro_puede_participar", { p_usuario: usuarioId });
  if (error) {
    console.error(`[foro] foro_puede_participar falló: ${error.code ?? "sin código"}`);
    return "interno";
  }
  return typeof data === "string" ? data : null;
}

/** El modo del foro y si quien mira es admin: decide si las páginas existen para él. */
export async function accesoAlForo(usuarioId: string | null): Promise<{ visible: boolean; modo: string; esAdmin: boolean }> {
  const cliente = bd();
  const [{ data: ajustes }, { data: perfil }] = await Promise.all([
    cliente.from("foro_ajustes").select("modo").maybeSingle(),
    usuarioId ? cliente.from("profiles").select("role").eq("id", usuarioId).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const modo = typeof ajustes?.modo === "string" ? ajustes.modo : "cerrado";
  const esAdmin = perfil?.role === "admin";
  // Cerrado = solo el admin lo ve. Para los demás, el foro no existe (404).
  return { visible: modo !== "cerrado" || esAdmin, modo, esAdmin };
}

/**
 * Lo que necesita saber cualquier página del foro antes de pintar nada: quién
 * mira y si el foro existe para él. `cache()` de React hace que el layout y
 * la página compartan la misma respuesta dentro de una petición.
 *
 * Con el foro en modo `cerrado`, `visible` es false para todos menos el admin
 * y la página tiene que responder 404: no «acceso denegado», sino que no hay
 * nada (FORO.md §16).
 */
export const entradaAlForo = cache(async () => {
  const usuarioId = await quienMira();
  const acceso = await accesoAlForo(usuarioId);
  return { usuarioId, ...acceso };
});

/**
 * ¿Se enseña el foro en los menús y en la portada a quien está mirando?
 *
 * Solo a quien puede entrar: a todos con el foro abierto o en solo lectura, y
 * solo al admin mientras está cerrado. Un enlace a `/foro` que da 404 es peor
 * que no tener enlace.
 *
 * Sin sesión NO se leen cookies (solo el modo): la barra sale en casi todas
 * las páginas, y leerlas aquí volvería dinámica a cualquiera que hoy no lo
 * sea. Si algo falla, es que no: la barra no se puede caer por el foro.
 */
export async function foroALaVista(conSesion: boolean): Promise<boolean> {
  try {
    if (conSesion) return (await entradaAlForo()).visible;
    const { data } = await bd().from("foro_ajustes").select("modo").maybeSingle();
    return typeof data?.modo === "string" && data.modo !== "cerrado";
  } catch {
    return false;
  }
}
