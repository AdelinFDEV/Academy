import type { ResultadoForo } from "@/lib/foro/tipos";

/**
 * La única forma en que el navegador habla con el foro: un POST con JSON a
 * una ruta de `/api/foro/*` o de `/api/admin/foro/*`.
 *
 * Devuelve siempre un `ResultadoForo`: o los datos, o un código con su frase
 * en español, lista para enseñar. Si la red falla o la respuesta no es la
 * esperada, también: quien llama no tiene que distinguir casos.
 */
export async function pedirForo<T extends Record<string, unknown> = Record<string, never>>(
  ruta: string,
  cuerpo: Record<string, unknown>,
): Promise<ResultadoForo<T>> {
  const sinRed = { ok: false as const, error: "red", mensaje: "No se ha podido conectar. Comprueba tu conexión e inténtalo de nuevo." };
  let respuesta: Response;
  try {
    respuesta = await fetch(ruta, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
      cache: "no-store",
    });
  } catch {
    return sinRed;
  }
  try {
    const datos: unknown = await respuesta.json();
    if (datos && typeof datos === "object" && "ok" in datos) {
      const r = datos as { ok: unknown; error?: unknown; mensaje?: unknown };
      if (r.ok === true) return datos as ResultadoForo<T>;
      return {
        ok: false,
        error: typeof r.error === "string" ? r.error : "interno",
        mensaje: typeof r.mensaje === "string" ? r.mensaje : "No se ha podido completar. Inténtalo de nuevo en unos minutos.",
      };
    }
  } catch {
    // Cae al genérico de abajo.
  }
  return { ok: false, error: "interno", mensaje: "No se ha podido completar. Inténtalo de nuevo en unos minutos." };
}
