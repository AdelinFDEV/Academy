/**
 * Limitador de peticiones por IP para TODA la web, no solo para `/api`.
 *
 * Vive aquí y no en `proxy.ts` para que el middleware siga leyéndose de un
 * vistazo: allí queda la decisión (limitar o no), aquí el cómo.
 *
 * ────────────────────────────────────────────────────────────────────────
 * QUÉ PUEDE Y QUÉ NO PUEDE HACER ESTO — leer antes de confiarle nada
 * ────────────────────────────────────────────────────────────────────────
 * El contador vive en memoria del proceso. En serverless cada instancia tiene
 * la suya, así que un atacante repartido entre varias instancias consigue N
 * veces el límite, y un arranque en frío pone el contador a cero. Es un freno
 * REAL contra el abuso trivial (un script, un bucle, un bot tonto), que es la
 * inmensa mayoría, pero NO es una barrera dura.
 *
 * La barrera dura contra un flood de verdad es el Firewall de Vercel, porque
 * corta la petición ANTES de que exista la función y por tanto antes de que
 * cueste dinero. Cuando esto devuelve un 429 la función YA se ha invocado.
 * Por eso las dos capas se complementan y ninguna sustituye a la otra.
 *
 * Ver `SEGURIDAD-RATE-LIMIT.md` para el reparto entre ambas capas.
 */

/** Ventana contada para una IP dentro de un tramo. */
interface Ventana {
  count: number;
  resetAt: number;
}

export interface Tramo {
  /** Nombre corto, usado como prefijo de la clave y en la cabecera de aviso. */
  nombre: string;
  /** Peticiones permitidas dentro de la ventana. */
  max: number;
  /** Duración de la ventana, en milisegundos. */
  ventanaMs: number;
}

/**
 * Los tramos, de más estricto a más laxo.
 *
 * Los números salen de lo que cuesta cada ruta, no de una cifra redonda:
 * cuanto más cara es una petición (dinero, cuota de un tercero, escritura en
 * base de datos), menos se permiten.
 */
export const TRAMOS = {
  /**
   * Pago y cuenta. Aquí no hay uso legítimo intensivo: quien paga pulsa una
   * vez. Un límite bajo con ventana larga corta el sondeo sin molestar a nadie.
   */
  pago: { nombre: "pago", max: 10, ventanaMs: 15 * 60 * 1000 },

  /**
   * Proxies a APIs de terceros (CoinGecko, DefiLlama). Son las peticiones que
   * pueden quemar una cuota gratuita ajena y dejar sin precios a todo el mundo,
   * así que van más apretadas que el resto de la API aunque tengan caché.
   */
  externo: { nombre: "externo", max: 40, ventanaMs: 60 * 1000 },

  /**
   * Escritura pública: comentarios, likes, contadores de visitas. Escriben en
   * la base de datos sin que haga falta ser nadie, que es justo lo que atrae al
   * spam. Generoso para el uso normal, corto para un bucle.
   */
  escritura: { nombre: "escritura", max: 80, ventanaMs: 60 * 1000 },

  /** Resto de la API: lectura autenticada, estado, badges. */
  api: { nombre: "api", max: 150, ventanaMs: 60 * 1000 },

  /**
   * Navegación real: el visitante pide una página.
   *
   * Una IP puede ser un colegio entero detrás del mismo router, así que va
   * holgado. Aquí un falso positivo es peor que dejar pasar un abuso, porque
   * del abuso volumétrico ya se encarga el Firewall.
   */
  paginas: { nombre: "paginas", max: 300, ventanaMs: 60 * 1000 },

  /**
   * Precargas de Next (`Next-Router-Prefetch`), en su propio contador.
   *
   * Tienen que ir aparte o rompen la web para gente real: Next precarga cada
   * enlace que asoma por la pantalla, y la portada pinta 8 enlaces POR entrada,
   * así que una sola visita dispara del orden de 35-55 precargas de golpe.
   * Metidas en el contador de navegación, un visitante normal agotaba el cupo
   * en 6-8 páginas y empezaba a comerse 429 sin haber hecho nada raro.
   *
   * Son baratas (payload RSC cacheado), así que el límite es alto.
   *
   * Que la cabecera se pueda falsificar solo permite usar este cupo en vez del
   * otro: ambos están acotados, así que lo peor que se consigue es sumar los
   * dos. No es un agujero, es un reparto.
   */
  prefetch: { nombre: "prefetch", max: 900, ventanaMs: 60 * 1000 },
} as const satisfies Record<string, Tramo>;

/**
 * Rutas que NUNCA se limitan.
 *
 * No es una comodidad: limitar cualquiera de estas rompe el sitio de formas
 * que además tardan en notarse.
 *  · Los webhooks los llama Stripe y Telegram desde SUS servidores, con lo que
 *    todas las llamadas llegan de unas pocas IPs. Un 429 aquí significa perder
 *    el aviso de un pago o un mensaje del bot.
 *  · El cron lo llama Vercel, y ya va autenticado con CRON_SECRET.
 *  · `robots.txt` y `sitemap.xml` son lo que lee Google. Un 429 ahí no lo ve
 *    ningún visitante, pero le dice al rastreador que se vaya justo cuando
 *    venía a indexar. Cuestan una lectura cacheada: no hay nada que proteger.
 */
const EXENTAS = [
  "/api/stripe/webhook",
  "/api/telegram/webhook",
  "/api/cron/",
  "/robots.txt",
  "/sitemap.xml",
  "/rss.xml",
];

const RUTAS_PAGO = ["/api/checkout", "/api/stripe/portal", "/api/account/delete"];

const RUTAS_EXTERNAS = [
  "/api/crypto/",
  "/api/market-data",
  "/api/portfolio/prices",
  "/api/unlocks",
  "/api/radar",
];

const RUTAS_ESCRITURA = [
  "/api/guide-shares",
  "/api/guide-visit",
  "/api/site-visit",
  "/api/guide-likes",
  "/api/guide-saves",
  "/api/guide-quiz-completion",
  "/api/guide-badge",
  "/api/comments",
  "/api/likes",
  "/api/shares",
  "/api/user-posts",
  // El aula: progreso, exámenes y ritmo. Escrituras propias, sin terceros.
  "/api/cursos",
];

/**
 * Decide qué tramo le toca a una ruta. `null` = no se limita.
 *
 * El orden importa: de lo más específico a lo más general, porque
 * `/api/portfolio/prices` también empieza por `/api`.
 *
 * `esPrefetch` solo desvía las páginas: la API no se precarga nunca, así que
 * una petición a `/api` con esa cabecera es de todo menos una precarga y se
 * queda en el tramo que le toca por ruta.
 */
export function tramoDe(pathname: string, esPrefetch = false): Tramo | null {
  if (EXENTAS.some((r) => pathname.startsWith(r))) return null;

  if (RUTAS_PAGO.some((r) => pathname.startsWith(r))) return TRAMOS.pago;
  if (RUTAS_EXTERNAS.some((r) => pathname.startsWith(r))) return TRAMOS.externo;
  if (RUTAS_ESCRITURA.some((r) => pathname.startsWith(r))) return TRAMOS.escritura;
  if (pathname.startsWith("/api")) return TRAMOS.api;

  return esPrefetch ? TRAMOS.prefetch : TRAMOS.paginas;
}

/**
 * ¿Es una precarga del router de Next?
 *
 * Se miran las DOS cabeceras y por presencia, no por valor exacto: Next precarga
 * la ruta entera (`Next-Router-Prefetch`) o solo un segmento
 * (`Next-Router-Segment-Prefetch`), y el valor de la segunda es el segmento, no
 * un "1". Quedarse solo con la primera dejaría precargas contando como
 * navegación real, que es justo el fallo que este tramo viene a evitar.
 */
export function esPrefetchDe(headers: Headers): boolean {
  return (
    headers.get("Next-Router-Prefetch") !== null ||
    headers.get("Next-Router-Segment-Prefetch") !== null
  );
}

// ── Almacén ───────────────────────────────────────────────────────────────
// Una sola tabla para todos los tramos, con la clave "tramo:ip". Antes había
// un Map por tramo y ninguno se limpiaba nunca: cada IP nueva dejaba su
// entrada para siempre, así que en una instancia con días de vida el Map
// crecía sin tope. Ahora se barren las caducadas.

const contadores = new Map<string, Ventana>();

/** Tope de seguridad: si se desborda, se vacía entero antes que hincharse. */
const MAX_CLAVES = 20_000;
const BARRIDO_CADA_MS = 60 * 1000;
let ultimoBarrido = 0;

function barrer(ahora: number): void {
  if (ahora - ultimoBarrido < BARRIDO_CADA_MS) return;
  ultimoBarrido = ahora;

  for (const [clave, ventana] of contadores) {
    if (ahora > ventana.resetAt) contadores.delete(clave);
  }

  // Si tras barrer sigue desbordado, es que hay un ataque con muchísimas IPs
  // distintas. Vaciar es preferible a quedarse sin memoria: el peor caso es
  // que los atacantes recuperen su cupo, y de eso ya se encarga el Firewall.
  if (contadores.size > MAX_CLAVES) contadores.clear();
}

export interface Resultado {
  limitado: boolean;
  /** Segundos que faltan para que se libere el cupo. Para `Retry-After`. */
  reintentarEn: number;
  restantes: number;
}

/** Apunta una petición de `ip` en `tramo` y dice si se pasa del límite. */
export function registrar(ip: string, tramo: Tramo): Resultado {
  const ahora = Date.now();
  barrer(ahora);

  const clave = `${tramo.nombre}:${ip}`;
  const ventana = contadores.get(clave);

  if (!ventana || ahora > ventana.resetAt) {
    contadores.set(clave, { count: 1, resetAt: ahora + tramo.ventanaMs });
    return { limitado: false, reintentarEn: 0, restantes: tramo.max - 1 };
  }

  const reintentarEn = Math.max(1, Math.ceil((ventana.resetAt - ahora) / 1000));

  if (ventana.count >= tramo.max) {
    return { limitado: true, reintentarEn, restantes: 0 };
  }

  ventana.count++;
  return { limitado: false, reintentarEn, restantes: tramo.max - ventana.count };
}

/**
 * IP de quien pide.
 *
 * En Vercel llega en `x-forwarded-for`, donde el PRIMER valor es el cliente y
 * los siguientes los proxies intermedios. Cualquiera puede inventarse esa
 * cabecera, pero en Vercel la reescribe el edge antes de llegar aquí, así que
 * el primer valor es de fiar. Fuera de Vercel esto no lo sería.
 */
export function ipDe(headers: Headers): string {
  const reenviada = headers.get("x-forwarded-for");
  if (reenviada) {
    const primera = reenviada.split(",")[0]?.trim();
    if (primera) return primera;
  }
  return headers.get("x-real-ip") ?? "desconocida";
}
