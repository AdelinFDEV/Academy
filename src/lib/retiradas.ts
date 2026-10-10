/**
 * URLs retiradas para siempre. `src/proxy.ts` les responde **410 Gone**, que
 * es como se le dice a Google «esto se ha ido y no va a volver»: las quita del
 * índice antes que con un 404 y no lo cuenta como un error de la web.
 *
 * El 10-10-2026 la web dejó de publicar noticias y, el mismo día, retiró todo
 * el sistema de entradas: la academia es solo guías. Por eso no hay solo una
 * lista de URLs: **cualquier** `/post/…` o `/categoria/…`, y el RSS, responden
 * 410 (PREFIJOS_RETIRADOS). Las 4 entradas que tenían una guía equivalente se
 * redirigen en next.config.ts, que Next aplica ANTES que el middleware.
 * Copia de lo borrado, en local: backups/.
 *
 * Reglas:
 * - Solo rutas exactas, sin barra final (Next ya la quita con una redirección).
 * - No metas aquí una URL ni un prefijo que pueda volver a existir: si mañana
 *   se publica algo en él, seguiría respondiendo 410 y Google no lo indexaría.
 * - Nunca mandes una retirada al inicio «para no perder tráfico»: Google lo
 *   trata como un 404 encubierto (soft 404).
 */
/** Secciones enteras retiradas: todo lo que empiece así responde 410. */
export const PREFIJOS_RETIRADOS: readonly string[] = ["/post/", "/categoria/"];

/** ¿Está retirada esta ruta? */
export function estaRetirada(pathname: string): boolean {
  return RETIRADAS.has(pathname) || PREFIJOS_RETIRADOS.some((p) => pathname.startsWith(p));
}

export const RETIRADAS: ReadonlySet<string> = new Set([
  "/rss.xml",
  // Entradas sin página equivalente
  "/post/injective-hackeo-2026",
  "/post/zcash-ironwood-etf-zcsh-2026",
  "/post/bitcoin-core-v32-2026",
  "/post/solana-agave-4-2-2026",
  "/post/bnb-chain-pasteur-actualizacion",
  "/post/cardano-van-rossem-actualizacion",
  "/post/solana-alpenglow-2026",
  "/post/ethereum-glamsterdam-2026",
  // Categorías que no son de las 12 criptomonedas que se siguen
  "/categoria/bitcoin",
  "/categoria/regulacion",
  "/categoria/altcoins",
  "/categoria/bnb",
  "/categoria/fiscalidad",
]);

/** La página que ve quien llega a una URL retirada: corta, y con salida a las guías. */
export const PAGINA_RETIRADA = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Esta página ya no existe · AdelinBTC Academy</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0b1424; color: #e8edf5; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { max-width: 440px; padding: 32px 24px; text-align: center; }
  h1 { margin: 0 0 12px; font-size: 24px; }
  p { margin: 0 0 24px; line-height: 1.6; color: #a9b6c9; }
  a { display: inline-block; padding: 12px 22px; border-radius: 10px; background: #f97316; color: #fff; font-weight: 600; text-decoration: none; }
</style>
</head>
<body>
<main>
  <h1>Esta página ya no existe</h1>
  <p>La academia ha dejado de publicar noticias. Ahora todo se explica en guías detalladas de cada criptomoneda.</p>
  <a href="/guias">Ver las guías</a>
</main>
</body>
</html>`;
