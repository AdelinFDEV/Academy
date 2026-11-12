import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { SITE_URL } from "@/lib/site";
import { errorForo } from "./errores";
import { LIMITES } from "./limites";
import { sesion } from "./permisos";

/**
 * La puerta de TODA ruta de `/api/foro/*` (FORO.md §6.2).
 *
 * Las rutas no tienen lógica: declaran qué forma tiene su petición y a qué
 * acción llaman, y esto hace siempre lo mismo, en este orden, cortando en el
 * primer fallo:
 *
 *   0. la petición viene de la propia web (cabecera `Origin`) y es JSON;
 *   1. hay sesión, y con la verificación en dos pasos pasada si la tiene;
 *   2. el cuerpo no pasa de 16 KB y tiene EXACTAMENTE la forma esperada;
 *   3. la acción (que comprueba el permiso, filtra y llama a Postgres);
 *   4. la respuesta: los datos, o un código con su frase en español.
 *
 * Una regla nueva se escribe aquí una vez, no en cada ruta.
 */

/** Lo que devuelve una acción. `mensaje` solo cuando la frase no es la del código. */
export type ResultadoAccion =
  | { ok: true; datos: Record<string, unknown> }
  | { ok: false; error: string; mensaje?: string };

const SIN_CACHE = { "Cache-Control": "private, no-store" };

function fallo(codigo: string, mensaje?: string): NextResponse {
  // «rechazado» es el filtro de contenido: lleva su propia frase, que le dice
  // al usuario qué tiene que quitar.
  if (codigo === "rechazado" && mensaje) {
    return NextResponse.json({ ok: false, error: codigo, mensaje }, { status: 422, headers: SIN_CACHE });
  }
  const e = errorForo(codigo);
  return NextResponse.json({ ok: false, error: e.codigo, mensaje: e.mensaje }, { status: e.status, headers: SIN_CACHE });
}

/**
 * ¿Viene la petición de la propia web?
 *
 * La cookie de sesión viaja sola con cualquier petición al dominio, también
 * con la que lanza un formulario escondido en otra web. La cabecera `Origin`
 * la pone el navegador y la página no puede falsearla: si no es la nuestra,
 * la petición no la ha hecho el usuario desde aquí. Sin `Origin`, tampoco.
 */
function esDeLaWeb(request: Request): boolean {
  const origen = request.headers.get("origin");
  if (!origen) return false;
  let propio: string;
  try {
    propio = new URL(request.url).origin;
  } catch {
    return false;
  }
  return origen === propio || origen === new URL(SITE_URL).origin;
}

/** Lee el cuerpo sin fiarse de `Content-Length`, y lo corta si se pasa. */
async function leerJson(request: Request): Promise<{ ok: true; valor: unknown } | { ok: false; error: string }> {
  const tipo = request.headers.get("content-type") ?? "";
  if (!/^application\/json\b/i.test(tipo)) return { ok: false, error: "formato" };

  const declarado = Number(request.headers.get("content-length") ?? "0");
  if (declarado > LIMITES.peticionBytes) return { ok: false, error: "demasiado_grande" };

  let texto: string;
  try {
    texto = await request.text();
  } catch {
    return { ok: false, error: "formato" };
  }
  if (new TextEncoder().encode(texto).length > LIMITES.peticionBytes) return { ok: false, error: "demasiado_grande" };

  try {
    return { ok: true, valor: JSON.parse(texto) };
  } catch {
    return { ok: false, error: "formato" };
  }
}

/**
 * Una ruta que CAMBIA algo. `esquema` tiene que ser un `z.strictObject`: un
 * campo que no se espera (`autor_id`, `estado`, `puntos`…) invalida la
 * petición entera en vez de ignorarse.
 *
 * La acción recibe el id del usuario DE LA SESIÓN. No hay forma de pasarle
 * otro: ninguna ruta acepta un id de usuario en el cuerpo.
 */
export function rutaForo<E extends z.ZodType>(
  esquema: E,
  accion: (usuarioId: string, datos: z.infer<E>) => Promise<ResultadoAccion>,
) {
  return async function POST(request: Request): Promise<NextResponse> {
    if (!esDeLaWeb(request)) return fallo("origen");

    const quien = await sesion();
    if (!quien.ok) return fallo(quien.error);

    const cuerpo = await leerJson(request);
    if (!cuerpo.ok) return fallo(cuerpo.error);
    const datos = esquema.safeParse(cuerpo.valor);
    if (!datos.success) return fallo("formato");

    let resultado: ResultadoAccion;
    try {
      resultado = await accion(quien.usuarioId, datos.data);
    } catch (err) {
      // Solo el tipo del error: el mensaje puede llevar texto del usuario.
      console.error(`[foro] acción falló: ${err instanceof Error ? err.name : "desconocido"}`);
      return fallo("interno");
    }
    if (!resultado.ok) return fallo(resultado.error, resultado.mensaje);
    return NextResponse.json({ ok: true, ...resultado.datos }, { headers: SIN_CACHE });
  };
}

/**
 * Una ruta que solo LEE lo del propio usuario (sus avisos, lo que ha hecho en
 * un hilo). Pide sesión y responde siempre con `private, no-store`: lo
 * personal no se mezcla con lo público ni pasa por ninguna caché (§6.0).
 */
export function rutaForoLectura(
  lectura: (usuarioId: string, parametros: URLSearchParams) => Promise<ResultadoAccion>,
) {
  return async function GET(request: Request): Promise<NextResponse> {
    const quien = await sesion();
    if (!quien.ok) return fallo(quien.error);
    let resultado: ResultadoAccion;
    try {
      resultado = await lectura(quien.usuarioId, new URL(request.url).searchParams);
    } catch (err) {
      console.error(`[foro] lectura falló: ${err instanceof Error ? err.name : "desconocido"}`);
      return fallo("interno");
    }
    if (!resultado.ok) return fallo(resultado.error, resultado.mensaje);
    return NextResponse.json({ ok: true, ...resultado.datos }, { headers: SIN_CACHE });
  };
}
