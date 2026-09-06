# Rate limiting: quién frena qué

Hay **dos capas**, y hacen cosas distintas. Ninguna sustituye a la otra.

| Capa | Dónde | Qué corta | Cuándo actúa | Coste |
|---|---|---|---|---|
| **Firewall de Vercel** | Antes de que exista la función | Floods de verdad, volumétricos | Antes de gastar un céntimo | Por volumen (medido) |
| **`src/lib/rate-limit.ts`** | Middleware (`src/proxy.ts`) | Abuso trivial: bucles, scripts, bots tontos | La función **ya se ha invocado** | Cero |

**La frase que hay que entender antes de tocar nada:** cuando el código devuelve un 429, la petición ya ha costado una invocación. El código protege la **lógica** (que no te llenen la base de datos, que no te quemen la cuota de CoinGecko); el que protege la **factura** es el Firewall.

## Capa 1 — Firewall de Vercel (actual)

Regla activa desde el 12-07-2026: **«Rate limit API global»** — `Request Path` empieza por `/api/`, **100 req / 60 s por IP**, Fixed Window, acción 429.

Datos del plan Pro que condicionan cualquier cambio:

- Caben **40 reglas** por proyecto: el número de reglas **no es lo que cuesta**.
- El precio es **por volumen de peticiones evaluadas**, y se contabiliza **por región**.
- El contador es por región: una misma IP repartida entre regiones puede pasarse del límite en cada una.

**Por eso NO se pone una regla de firewall sobre toda la web.** Cubrir `/` metería cada visita normal en el contador de pago. Las páginas se limitan en código, que es gratis, y el firewall se reserva para lo que de verdad cuesta dinero.

### Si algún día hay un ataque real

1. **Attack Challenge Mode** (Firewall → toggle): reta a todo el tráfico. Es la palanca de emergencia.
2. Mirar Firewall → overview, agrupar por la regla y ver qué IP o ruta está machacando.
3. Solo entonces, valorar una regla `Deny` para ese patrón concreto.

## Capa 2 — El limitador del código

Vive en [`src/lib/rate-limit.ts`](./src/lib/rate-limit.ts) y lo llama `src/proxy.ts` **lo primero de todo**, antes de crear el cliente de Supabase: a quien se pasa del cupo no se le monta sesión.

Cubre **toda la web**, no solo `/api`. Los tramos salen de lo que cuesta cada ruta:

| Tramo | Límite | Rutas | Por qué ese número |
|---|---|---|---|
| `pago` | 10 / 15 min | `/api/checkout`, `/api/stripe/portal`, `/api/account/delete` | Nadie paga dos veces seguidas; no hay uso legítimo intensivo |
| `externo` | 40 / 60 s | `/api/crypto/*`, `/api/market-data`, `/api/portfolio/prices`, `/api/unlocks`, `/api/radar` | Queman cuota de una API gratuita ajena: si se agota, nadie ve precios |
| `escritura` | 80 / 60 s | comentarios, likes, shares, visitas, badges, `user-posts` | Escriben en la BD sin necesidad de sesión: es lo que atrae al spam |
| `api` | 150 / 60 s | resto de `/api` | Lectura autenticada |
| `paginas` | 300 / 60 s | navegación real | Una IP puede ser una oficina entera |
| `prefetch` | 900 / 60 s | precargas de Next (`Next-Router-Prefetch`) | Van aparte o rompen la web (ver abajo) |

### En desarrollo el limitador está apagado

`src/proxy.ts` solo llama a `tramoDe()` cuando `NODE_ENV === "production"`. No es
comodidad: **en localhost no existe `x-forwarded-for`**, así que `ipDe()` devuelve
`"desconocida"` para todo el tráfico y el navegador, cada pestaña, cada recarga y
cada hot reload comparten **un mismo cubo**.

Con el tramo `externo` en 40/60 s, eso significaba que unas veinte recargas de la
portada dejaban `/api/radar` en 429, y los dos widgets del mercado salían «Sin
datos» a la vez —el `fetch` del cliente no distingue un 429 de un fallo de
CoinGecko—. En producción no pasaba nunca, porque allí cada visitante trae su IP
de verdad. Se perdió una sesión entera buscando el fallo en el sitio equivocado.

Limitar tu propia máquina no protege ninguna cuota ajena ni ninguna factura.
**Contrapartida**: el limitador no se puede probar con `npm run dev`. Para
comprobarlo hay que levantar `npm run build && npm start`, o mirarlo en
producción.

### Rutas exentas — no añadir ni quitar a la ligera

| Ruta | Por qué nunca se limita |
|---|---|
| `/api/stripe/webhook` | Lo llama Stripe desde sus IPs. Un 429 = **pago perdido** sin enterarte |
| `/api/telegram/webhook` | Igual con el bot: se pierde el mensaje |
| `/api/cron/*` | Lo llama Vercel y ya va autenticado con `CRON_SECRET` |
| `/robots.txt`, `/sitemap.xml`, `/rss.xml` | Los lee Google. Un 429 aquí no lo ve ningún visitante, pero echa al rastreador justo cuando venía a indexar |

### Por qué las precargas van en un contador aparte

Next precarga **cada enlace que asoma por la pantalla**, y la portada pinta 8 enlaces *por entrada*: una sola visita dispara del orden de **35-55 precargas de golpe**. Metidas en el mismo contador que la navegación, un visitante normal agotaba el cupo **en 6-8 páginas** y empezaba a comerse 429 sin haber hecho nada raro. En una IP compartida (oficina, colegio, móvil con CGNAT), antes.

Por eso van a su propio tramo, detectadas por la cabecera `Next-Router-Prefetch`. Son baratas (payload RSC cacheado), así que el límite es alto.

Que la cabecera se pueda falsificar solo permite usar ese cupo en vez del otro: ambos están acotados, así que lo peor que se consigue es sumar los dos. Es un reparto, no un agujero.

### El vídeo de la portada no pasa por el middleware

`/hero.webm` y `/hero-opt.mp4` pesan ~2 MB, y el navegador los pide **por trozos, con peticiones de rango**: cada reproducción daba varias pasadas por el middleware. Ahora el matcher excluye vídeo, audio, fuentes e iconos además de las imágenes. Aparte de no gastar cupo, **ahorra invocaciones**.

Aquí un falso positivo (echar a un usuario real) es peor que dejar pasar un abuso, porque del abuso volumétrico ya se encarga el firewall.

## Lo que este limitador NO puede hacer

El contador vive **en memoria del proceso**. En serverless:

- Cada instancia tiene su propio contador → repartido entre varias, un atacante consigue N veces el límite.
- Un arranque en frío lo pone a cero.

Es un freno real contra el abuso trivial, que es la inmensa mayoría. **No es una barrera dura, y no debe usarse como si lo fuera.**

Se descartaron a propósito las alternativas con estado compartido: una tabla en Supabase añade latencia y riesgo en la ruta crítica (el middleware corre en **cada** petición), y Redis externo mete otra dependencia y otra factura. Para el tamaño de este sitio, el reparto firewall + memoria es el punto correcto.

## Al añadir una ruta nueva

No hay que hacer nada: lo no listado cae en `api` o en `paginas` automáticamente. Solo hay que tocar `rate-limit.ts` si la ruta nueva es de **pago**, llama a una **API de terceros**, es de **escritura pública**, o la llama **un sistema externo** (y entonces va a `EXENTAS`).
