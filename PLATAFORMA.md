# PLATAFORMA — las decisiones que ya están tomadas

Esto **no se lee en cada sesión**. Se lee cuando vas a tocar la zona que describe, y [`AGENTS.md`](./AGENTS.md) dice cuándo.

Todo lo de aquí tiene la misma forma: **una decisión que costó trabajo, y la manera exacta de volver a romperla sin darse cuenta.** No son preferencias de estilo. Cada una salió de un fallo real en producción o de una auditoría hecha con datos, no leyendo el código.

La regla que las gobierna a todas: **si vas a cambiar algo de aquí, primero entiende por qué está así.** El motivo está escrito debajo de cada una, y casi nunca es el evidente.

---

## Índice

| Vas a tocar… | Lee |
|---|---|
| Entradas premium, la RLS de `posts`, por qué una premium no da 404 | [El muro de pago](#el-muro-de-pago-de-las-entradas-dónde-está-de-verdad) |
| `portfolio_positions`, `dca_compras`, `/api/portfolio`, `/api/dca` | [Portfolio Adelin](#portfolio-adelin-solo-el-admin-escribe-y-hay-dos-barreras) |
| Aviso legal, privacidad, cookies, `src/lib/legal.ts` | [El marco legal es rumano](#el-marco-legal-es-rumano--no-vuelvas-a-escribir-normativa-española) |
| Cualquier script de terceros, el banner de cookies, GA4 | [Analítica y consentimiento](#analítica-dos-capas-y-el-banner-manda-sobre-una-de-ellas) |
| El dominio, el DNS, una redirección | [El sitio vive SIN www](#el-sitio-vive-sin-www--no-lo-inviertas-nunca) |
| `sitemap.ts`, `robots.ts`, canónicas, JSON-LD, Search Console | [Rastreo e indexación](#rastreo-e-indexación) |
| `src/lib/herramientas.ts`, una ficha de herramienta, `detalle.css` | [Las herramientas](#las-herramientas-el-catálogo-sus-fichas-y-sus-trampas) |

---

# El muro de pago de las entradas: dónde está de verdad

Comprobado el 06-09-2026 creando una entrada premium real y consultándola con cada rol, no leyendo el código.

**La policy de `posts` en Supabase esconde la fila entera** de una entrada premium a quien no lo sea. Eso suena a lo correcto, y protege de verdad: con la clave anónima —la que va en el navegador de cualquiera— no se puede sacar el texto de pago. Pero tenía un efecto que nadie había visto porque **todavía no hay ninguna entrada premium publicada**: la entrada era un **404** para Google y para cualquier usuario free que recibiera el enlace, no entraba en el sitemap, ni en el RSS, ni en los listados. El muro de pago de `/post/[slug]` y el badge «Premium» de los listados eran **código inalcanzable**.

Contenido de pago perfectamente protegido y perfectamente invisible.

**La solución: las páginas públicas leen las entradas con `createAdminClientOpcional()`**, que devuelve el cliente de servicio si hay clave y `null` si no. El patrón, en las cinco:

```ts
const lector = createAdminClientOpcional() ?? supabase;
```

Está en `/post/[slug]` (metadata y página), `/articulos`, la portada, `/categoria/[slug]`, `sitemap.ts` y `rss.xml`.

Tres reglas al tocar esto:

1. **`.eq("published", true)` no se quita nunca.** Es lo único que separa un borrador de una publicación, y saltando RLS ya no hay red debajo.
2. **En los listados no se pide `content`.** Solo título, extracto, portada y categoría — lo que ya se enseña. El RSS tampoco lleva cuerpo, por eso anunciar una entrada premium ahí no abre nada.
3. **En `/post/[slug]` el contenido se retira en cuanto se sabe que no toca** (`if (!hasAccess) post.content = null`), antes de renderizar. Al ser un componente de servidor, lo que no se pinta no llega al navegador.

**Cómo comprobar que sigue bien.** Crear una entrada con `is_premium: true, published: true`, pedir su URL sin sesión y verificar: **200**, con título y extracto, **sin** el cuerpo; y que aparece en `/articulos`, la portada, el sitemap y el RSS. Borrarla después.

## La vista previa de un borrador

Añadida el 07-09-2026. Una entrada con `published = false` daba **404 para todo el mundo, admin incluido**, así que no había forma de ver cómo quedaba antes de publicarla. Y publicar para mirarla no es una opción: `published = true` **manda un aviso al grupo de Telegram**.

**Lo que NO se tocó: `.eq("published", true)` sigue en su sitio, intacto, en todas las consultas.** La vista previa solo añade un **segundo intento**, cuando la primera consulta no devuelve nada **y** quien mira es admin. Dos ventajas sobre quitar el filtro y decidir después:

1. **El camino normal no cambia ni cuesta una consulta.** La segunda solo ocurre sobre lo que iba a ser un 404 de todas formas.
2. **Si esto se rompe, se rompe hacia el lado seguro.** Un fallo aquí devuelve 404 — lo que pasaba antes. Quitando el filtro, un fallo enseñaría borradores a cualquiera.

El rol se lee de la **base de datos** a partir de la sesión, nunca de la petición. La lógica y su porqué viven en `src/lib/borradores.ts`.

**Un borrador sigue sin aparecer en ningún sitio**: el sitemap, el RSS, `/articulos`, la portada y las categorías mantienen su filtro y no se tocaron. Se ve escribiendo su URL, y solo siendo admin. Además la página sale con `noindex, nofollow` y **sin canónica** — una canónica en un borrador le diría a Google que esa URL es la buena versión de algo que todavía no existe.

**Cómo comprobar que sigue bien**, sin sesión y con un borrador cualquiera:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://adelinacademy.com/post/SLUG   # tiene que dar 404
curl -s https://adelinacademy.com/sitemap.xml | grep -c "SLUG"                 # tiene que dar 0
```

---

# Portfolio Adelin: SOLO el admin escribe, y hay dos barreras

Auditado el 07-09-2026 con un usuario premium real, no leyendo el código: se creó una cuenta, se le dio premium, se inició sesión de verdad y se intentó escribir por las dos puertas. Repetible con el guion de esa sesión.

**Las dos carteras son de solo lectura para todo el mundo salvo el admin.** Un suscriptor paga por *ver* qué compra AdelinBTC; si pudiera añadir o editar posiciones, lo que se publica dejaría de ser la cartera de nadie.

| Puerta | Qué la cierra |
|---|---|
| **La API** (`/api/portfolio`, `/api/portfolio/[id]`, `/api/dca`) | Toda escritura llama a `getAdminUser()` / `isAdmin`, que lee el **rol en la base de datos** a partir de la sesión. No se puede falsificar desde el cliente: lo que llega en la petición nunca decide el rol |
| **La base de datos** | `portfolio_positions` y `dca_compras` **no tienen ninguna policy de escritura**. Insertar da `42501`; actualizar y borrar afectan a **0 filas** porque RLS ni siquiera deja ver la fila que se quiere tocar |

Esa segunda barrera es la que importa de verdad: **la clave anónima va en el navegador de cualquiera**, así que un premium puede hablar con Supabase desde la consola sin pasar por la API. Comprobado también que no puede ascenderse a admin (`profiles` está blindada desde la auditoría de julio).

**Al tocar estas tablas:**

1. **No añadas una policy de escritura** «para que el admin pueda». El admin escribe con la clave de servicio desde la API, que es donde además se valida lo que entra.
2. **Ocultar el botón en la interfaz no es una barrera.** `isAdmin` en el componente evita enseñar el formulario; quien quiera saltárselo no usa el formulario.
3. Antes de dar por buena cualquier cosa aquí, **pruébalo con una sesión premium de verdad**. Leer el código no vale: el fallo de esta clase no está en el código, está en lo que la base de datos permite por debajo.

---

# Objetivos y diario del negocio (/admin/objetivos): solo el admin, ni para leer

Desde el 04-10-2026. Once tablas —`objetivos`, `objetivo_registros`, `objetivo_marcas`, `contenido_plan`, `ideas`, `diario_notas`, `diario_intenciones`, `metricas_diarias`, `dias_balance`, `ingresos_dia` y `gastos`— con **RLS activado y cero policies**, más el bucket **privado** `diario` para las fotos (se sirven con URLs firmadas de una hora). Todo lo crea `scripts/create-objetivos.sql`, que es idempotente: se puede volver a ejecutar entero. A diferencia del portfolio, aquí **ni siquiera se lee** con la clave anónima: el diario guarda cómo se siente el admin con su negocio, y no lo ve nadie más.

- **Leer:** la página de servidor, con `createAdminClient()`, detrás del layout de `/admin` que exige rol admin.
- **Escribir:** `/api/admin/plan/[recurso]` y `/api/admin/plan/[recurso]/[id]`, con `requireAdmin()` y los validadores de `src/lib/objetivosValidar.ts`, que solo dejan pasar las columnas que conocen.
- **El progreso de los objetivos automáticos no se guarda**: se calcula al leer en `src/lib/objetivosServidor.ts` (`src/lib/objetivos.ts` es la parte pura, que también importa el cliente). Sale de `posts`, `content_announcements`, `profiles` (sin administradores), `telegram_channel_stats` y `metricas_diarias`. Los vídeos cuentan los que anuncia el bot, que son solo los largos; los ingresos son la **misma estimación** que `/admin/premium`.
- **El progreso manual sí se guarda, uno por periodo** en `objetivo_registros`: es lo que da historial a los objetivos que se repiten cada semana o cada mes. `objetivos.progreso_manual` queda por compatibilidad y ya no se lee.
- **Suscriptores de YouTube**: necesitan `YOUTUBE_API_KEY`. El cron de las 04:00 (`telegram-sync`) guarda una foto diaria en `metricas_diarias`; sin clave no guarda nada y el objetivo se queda en 0.
- **No añadas una policy** «para que el admin pueda». Mismo error que en el portfolio, y aquí con datos más personales.
- **Cierre del día** (`/api/admin/plan/dia`): productividad (1-3), una nota que sale como aviso en el calendario y el dinero por fuente. Guardar el cierre completo **sustituye el día entero**; el marcado rápido del calendario manda `parcial: true` y **no toca el dinero**. Si quitas `parcial`, marcar ✅ desde el calendario borra lo ganado ese día.
- **Series largas, siempre con `todasLasFilas()`** (`src/lib/supabase/todasLasFilas.ts`). Supabase corta en 1.000 filas sin dar error, y en una serie ordenada de antigua a reciente lo que se pierde es lo último: la gráfica se congela. Las fotos diarias, el dinero y el diario ya pasan por ahí.
- **Pestaña Crecimiento** (`/admin/objetivos/crecimiento`, lógica en `src/lib/crecimiento.ts`): miembros de Telegram (fotos de `telegram_channel_stats` + dato en vivo), suscriptores de YouTube (`metricas_diarias` + API) e ingresos de Premium. Los ingresos usan `contarCuotas()` de `objetivosServidor.ts`, la misma cuenta que los objetivos de ingresos: no dupliques la estimación. El canal Premium solo aparece donde existe `TELEGRAM_CHANNEL_ID` (Vercel).

---

# El marco legal es RUMANO — no vuelvas a escribir normativa española

Cambiado el **6 de septiembre de 2026**. El sitio nació citando normativa española porque apunta a público español, pero **el titular reside y opera desde Rumanía**, así que las leyes nacionales aplicables son las rumanas:

| Antes (España) | Ahora (Rumanía) |
|---|---|
| LSSI-CE, Ley 34/2002 | Ley 365/2002, comercio electrónico |
| art. 22.2 LSSI (cookies) | art. 4 de la Ley 506/2004 |
| LOPDGDD 3/2018 | Ley 190/2018 |
| AEPD | ANSPDCP (dataprotection.ro) |

**El RGPD no cambia.** Es un reglamento europeo y rige igual en los dos países, así que toda referencia a sus artículos se queda como está. Confundir «norma nacional» con «RGPD» es el error fácil aquí.

**Las leyes se nombran desde `src/lib/legal.ts`**, nunca a mano en una página. Es el mismo patrón de fuente única que el catálogo de herramientas, y por el mismo motivo: el dato estaba repetido en cuatro sitios.

**Dos cosas que NO se tocan al redactar, porque protegen al cliente español:**

1. El aviso legal deja escrito que elegir ley rumana **no priva al consumidor** de las disposiciones imperativas de su país de residencia (art. 6 del Reglamento Roma I), y la jurisdicción sigue siendo la del domicilio del usuario.
2. La política de privacidad **mantiene el enlace a la AEPD**: el art. 77 RGPD permite reclamar ante la autoridad del propio país, no solo ante la del responsable.

⚠️ **Pendiente y visible en producción**: `titularNombre`, `formaJuridica` (PFA o SRL), `identificadorFiscal` y `domicilio` siguen con texto de relleno en `/aviso-legal` y `/privacidad`. Identificar al titular es una obligación legal.

⚠️ **No es asesoramiento jurídico.** El cambio de marco, el IVA de vender suscripciones a consumidores españoles desde Rumanía (régimen OSS) y la promoción de criptoactivos —MiCA y ASF en Rumanía, pero reglas de la CNMV por dirigirse a público español— los tiene que revisar un abogado.

---

# Analítica: dos capas, y el banner manda sobre una de ellas

| Herramienta | Cookies | ¿Consentimiento? | Qué da |
|---|---|---|---|
| **Cloudflare Web Analytics** | No | No lo necesita | Visitas, páginas, referentes. Mide al 100 % |
| **Google Analytics 4** (`G-G74GVKVZRY`) | Sí | **Obligatorio** | Embudos, conversiones, retención. Solo mide a quien acepta |

Las dos conviven a propósito: Cloudflare da el recuento real, GA4 el comportamiento.

**La regla que no se puede romper: el banner de cookies gobierna qué scripts se cargan.** Hasta el 06-09-2026 el banner era decorativo —guardaba la elección y no la leía nadie— porque no había nada opcional. Ahora `src/lib/consent.ts` es la fuente única del consentimiento, y **cualquier script de terceros que use cookies se engancha ahí**, igual que `GoogleAnalytics.tsx`: nada de `<Script>` sueltos en el layout.

**No se carga NADA de Google hasta que el visitante acepta.** Google ofrece un «modo de consentimiento» que carga la etiqueta con el almacenamiento denegado; aquí no se usa, porque la política de cookies promete por escrito consentimiento **previo** y la AEPD es estricta con eso. La comprobación de que sigue bien cuesta un `curl`:

```bash
curl -s https://adelinacademy.com/ | grep -c "G-G74GVKVZRY"
```

**Tiene que dar 0.** Si da 1, alguien ha metido la etiqueta fuera del componente y se está cargando sin permiso.

Tres detalles que ahorran un rato de depuración:

- **`NEXT_PUBLIC_GA_ID` solo está en Production.** Ni en Preview ni en local: las pruebas ensuciarían los informes reales. Por eso en `localhost` GA4 nunca aparece, y **es lo correcto**.
- Las variables `NEXT_PUBLIC_*` **se incrustan al compilar**. Cambiarla en Vercel exige redesplegar.
- **La CSP tiene que listar los tres dominios**: `googletagmanager.com` para el script, y `google-analytics.com` + `analytics.google.com` para los envíos. Faltando cualquiera, GA4 se ve «instalado» y no registra nada.

**Si algún día cambia lo que se pide en el banner, sube la versión de `CONSENT_KEY`** (hoy `cookie_consent_v2`). El consentimiento del RGPD tiene que ser informado: quien aceptó leyendo otra cosa no ha consentido esto. Cuesta que todo el mundo vuelva a ver el banner una vez, y no hay alternativa.

---

# El sitio vive SIN `www` — no lo inviertas nunca


La versión canónica es **`https://adelinacademy.com`**, sin `www`. Todo apunta ahí: cada URL del sitemap, el `robots.txt`, el `Host` y el `SITE_URL` del código.

`www.adelinacademy.com` está dado de alta en Vercel **solo para redirigir**, con un **308 Permanent Redirect** que **conserva la ruta** (`www/guias` acaba en `/guias`, no en la portada). Antes era un 307 temporal, y eso hizo que Google marcara la portada como *«Duplicada: el usuario no ha indicado ninguna versión canónica»*.

**Trampa de Vercel:** al añadir un dominio ofrece marcada una casilla del tipo *«Redirect apex domains to www (recommended)»* / *«Include apex and www variants»*. **Hay que desmarcarla siempre.** Haría lo contrario — mandar el dominio bueno hacia `www` — y convertiría en redirección cada una de las URLs que ya le hemos dado a Google.

---

# Rastreo e indexación

Cómo llega Google a una página y qué la hace desaparecer. Lo que hay que **hacer** al crear contenido está en los paneles de `/admin`; esto es la maquinaria de debajo.

### Lo que ya es automático — no hay que hacer nada

- **`/sitemap.xml`** (`src/app/sitemap.ts`) se genera solo y **revalida cada hora**. Lee las entradas de Supabase, así que **una entrada nueva aparece sola en menos de 1 h desde que se publica**. No hay lista que mantener a mano.
- **`/robots.txt`** (`src/app/robots.ts`) declara el sitemap y bloquea el rastreo de lo privado.
- **Las categorías** entran solas, con la fecha de su entrada más reciente. Una categoría **sin ninguna entrada publicada no entra**, a propósito: su página saldría vacía.

### Cada ruta pública declara su canónica — y hay que mantenerlo

Desde el 31-08-2026 **todas las rutas públicas** emiten `<link rel="canonical">`, y cada URL del sitemap se apunta a sí misma. Se declara con `alternates.canonical` y **siempre en ruta relativa** (`"/guias"`, no la URL entera): la resuelve el `metadataBase` del layout raíz, que ya sale de `SITE_URL`.

**Nunca pongas la canónica en un `layout.tsx`, y menos en el raíz.** En Next.js los metadatos del layout **los heredan todas las rutas hijas**, así que una canónica ahí le pondría la misma URL a media web — que es justo el problema que veníamos a arreglar. Por eso la de la portada vive en `src/app/page.tsx`, que antes no tenía `metadata` propia y ahora la tiene solo para esto.

| Creas… | Qué hace falta |
|---|---|
| **Entrada** | Nada. `/post/[slug]` la genera sola en su `generateMetadata`. |
| **Categoría** | Nada. `/categoria/[slug]` la genera sola. |
| **Guía** | **Añadir `alternates: { canonical: "/guias/<slug>" }` a su `metadata`**, además de darla de alta en `GUIDES`. No hay plantilla que lo haga por ti: cada guía es un componente propio. |
| **Página pública nueva** | Añadir su `alternates.canonical` a mano, además de meterla en `STATIC_ROUTES`. |

Comprobar una ruta cuesta un `curl`:

```bash
curl -s https://adelinacademy.com/guias/xrp | grep -o "<link rel=\"canonical\"[^>]*>"
```

Y al revés: **una ruta privada no debe emitir ninguna**. Si `/dashboard` o `/login` empiezan a devolver una canónica, es que alguien la ha metido en un layout.

### Datos estructurados: qué sale solo y qué hay que añadir

Desde el 31-08-2026 el sitio emite JSON-LD. Todo pasa por dos piezas: los constructores de **`src/lib/schema.ts`** y el componente **`<JsonLd>`**, que es quien lo mete en el HTML. No escribas un `<script type="application/ld+json">` a mano en una página.

| Dónde | Qué emite | ¿Hay que hacer algo? |
|---|---|---|
| **Todas las rutas** | `Organization` + `WebSite` | No. Van en el layout raíz, una sola vez |
| **Entrada** | `Article` + `BreadcrumbList` | No. `/post/[slug]` los genera solos |
| **Guía** | `Article` (con su muro) + `BreadcrumbList` | **Sí: añadir `<GuideBreadcrumbJsonLd slug={SLUG} />`** dentro del `return`, junto al `<GuideVisitTracker>`, y rellenar `muro` en `GUIDES` |
| **Página pública nueva** | Nada por defecto | Solo si el tipo aporta algo real. Una página sin tipo propio no necesita ninguno |

**La organización y el sitio se declaran SOLO en el layout raíz**, con un `@id` fijo (`.../#organization` y `.../#website`), y los demás esquemas apuntan a ese `@id` en vez de repetir el objeto. Si copias el bloque entero en otra página tendrás dos definiciones que se pueden desincronizar.

**La regla que no se puede romper: no declares nada que el visitante no pueda ver.** Google llama a eso spam de datos estructurados y lo penaliza. Por eso aquí no hay valoraciones inventadas, ni autor con nombre falso, ni `SearchAction` (el sitio no tiene buscador con URL de resultados).

Dos consecuencias prácticas al tocar contenido:

- **Las migas de pan del JSON-LD replican las visibles.** En una entrada son Inicio › Artículos › Categoría › Título, y están escritas dos veces en `/post/[slug]`: en el `<nav className="post-breadcrumb">` y en el `breadcrumbSchema`. Si cambias una, cambia la otra.
- **El nombre de la guía en las migas sale de `GUIDES`**, no del `title` de su metadata — que es más corto a propósito por el límite de 48. Es intencionado: el de `GUIDES` es el que se ve en `/guias`, y es con lo visible con lo que tiene que coincidir.

`isAccessibleForFree` sale de `is_premium` en una entrada, y del campo `muro` de `GUIDES` en una guía (`null` = se lee entera sin cuenta). Es lo que evita que Google interprete el muro de pago como *cloaking* — enseñarle a él una cosa y al visitante otra.

### Lo que SÍ hay que hacer al crear algo nuevo

| Creas… | Qué hace falta para que entre en el sitemap |
|---|---|
| **Entrada** | Nada. Basta con `published = true`. Con `published = false` no entra — que es lo correcto. |
| **Guía** | **Añadirla al array `GUIDES` de `src/lib/guides.ts`.** El sitemap recorre ese array, no la carpeta `src/app/guias/`. Una guía con su `page.tsx` pero sin su entrada en `GUIDES` **es invisible para Google**. |
| **Página pública nueva** | Añadirla a mano a `STATIC_ROUTES` en `src/app/sitemap.ts`, con su `priority` y su `changeFrequency`. |
| **Término del diccionario** | Nada, en cuanto tenga `extended` en `src/lib/glosario.ts`. Sin ese campo no existe como URL. |
| **Categoría** | Nada, en cuanto tenga una entrada publicada. |

### Tres reglas que ya se rompieron una vez

1. **Antes de meter una ruta en el sitemap, comprueba que devuelve 200 sin sesión.** No basta con mirar su `page.tsx`: **la protección de rutas vive en el middleware `src/proxy.ts`** (array `protectedRoutes`), y desde el `page.tsx` no se ve. Así se coló `/logros`, que redirige a login. Lo que está protegido va a `robots.txt`, no al sitemap.
2. **Nunca metas en el sitemap una ruta que redirige.** Va el destino, jamás el salto. Así se coló `/terminos`, que es un stub hacia `/aviso-legal`. Un sitemap con 307 dentro es señal negativa para Google.
3. **Nunca inventes un `lastModified`.** Solo se pone donde hay fecha real (`updated_at` de la entrada; en categorías, la de su entrada más reciente). Las páginas estáticas y las guías van **sin** él: es opcional en el estándar, y una fecha de build que miente hace más daño que una ausente.

### Detalles de implementación que evitan romper cosas

- **El dominio se escribe en un solo sitio: `SITE_URL` en `src/lib/site.ts`.** No lo repitas. El fallback apunta a producción y no a `localhost` a propósito: si falta `NEXT_PUBLIC_SITE_URL`, es mucho menos malo publicar URLs correctas que llenar el sitemap de `localhost`. En local verás URLs de `adelinacademy.com` aunque sirvas en `localhost:3000` — **es lo correcto, no es un fallo**.
- **`sitemap.ts` no usa `@/lib/supabase/server`.** Ese cliente lee cookies, lo que volvería la ruta dinámica. Usa un cliente anónimo sin cookies, y por eso Next la sirve estática. Si alguien lo cambia a `createClient()` de `server.ts`, el sitemap deja de cachearse y pega a Supabase en cada rastreo.
- **`disallow` en `robots.txt` impide rastrear, no indexar.** Una URL bloqueada puede seguir saliendo en Google si alguien la enlaza, solo que sin descripción. La barrera real de lo privado es el login del servidor. Esto es higiene de presupuesto de rastreo, no seguridad.
- El bloqueo es **por prefijo**: `Disallow: /premium/gracias` no afecta a `/premium`, que sí está en el sitemap.

### Search Console está activo desde el 30 de agosto de 2026

- Propiedad de tipo **Dominio**, verificada con un registro **TXT en la raíz**, en el DNS de **Vercel**. **Ese TXT no se borra nunca**: Google revalida cada cierto tiempo y se perdería la propiedad.
- Sitemap enviado y aceptado. Lo que hay dentro hoy, sin salir de la terminal:
  ```bash
  curl -s https://adelinacademy.com/sitemap.xml | grep -c "<loc>"
  ```
- **Al publicar una entrada no hay que tocar Search Console.** El sitemap la recoge sola en menos de 1 h y Google lo relee por su cuenta. Solo tiene sentido usar «Inspección de URLs → Solicitar indexación» para algo puntual e importante, y la cuota es de unas 10 al día.
- **Los datos de Rendimiento empiezan el 30-08-2026.** No hay histórico anterior; si el admin pregunta por la evolución previa, no existe.
- Si aparece **«Descubierta / Rastreada: actualmente sin indexar»**, es normal en un sitio nuevo, no un error. Ver `/auth/` y compañía como **bloqueadas por robots.txt es intencionado** — lo pusimos nosotros.
- **Para sacar una página del índice, `noindex` y NO `disallow`.** Con la ruta bloqueada en `robots.txt` Google no entra, no ve el `noindex` y la indexa igual si alguien la enlaza: pasó con `/login` y `/forgot-password` en septiembre de 2026. Desde el 03-10-2026 esas dos y `/register` llevan `noindex` en su `layout.tsx` y ya no están en el `disallow`.

### Cómo verificar en producción

```bash
curl -s https://adelinacademy.com/sitemap.xml | grep -c "<loc>"
```

Y, tras tocar el sitemap, comprobar que **ninguna** de sus URLs redirige:

```bash
curl -s https://adelinacademy.com/sitemap.xml | grep -o '<loc>[^<]*</loc>' | sed 's|</\?loc>||g' | while read u; do c=$(curl -s -o /dev/null -w "%{http_code}" "$u"); [ "$c" != "200" ] && echo "$c $u"; done
```

Silencio = todo correcto. El despliegue tarda ~1 minuto, así que el primer intento puede dar el contenido viejo.

---

### Las herramientas: el catálogo, sus fichas y sus trampas

Salió del punto 13 (landings públicas de las herramientas, cerrado el 07-09-2026). Lo que queda aquí son las reglas que siguen mandando al tocar cualquier cosa de esta zona.

#### La trampa de la URL: robots.txt bloquea POR PREFIJO

Las fichas del radar y de las liberaciones **no** están bajo `/herramientas/`, y no es un descuido:

| Herramienta (de pago, en robots.txt) | Su ficha pública |
|---|---|
| `/herramientas/radar` | **`/radar-diario`** |
| `/herramientas/liberaciones` | **`/calendario-de-liberaciones`** |

`Disallow: /herramientas/radar` bloquea **todo lo que empiece igual**, así que `/herramientas/radar-diario` habría nacido sin poder rastrearse. Es exactamente el fallo que dejó las fichas de portfolio y diario bloqueadas el 06-09-2026, y que solo se vio al inspeccionarlas en Search Console.

**Antes de elegir la URL de una página pública nueva, compárala con cada `Disallow` de `src/app/robots.ts`.** Que no coincida exactamente no basta: tiene que no empezar igual.

#### El catálogo de herramientas es FUENTE ÚNICA

Vive en **`src/lib/herramientas.ts`** y lo consumen el hero de la portada, la landing, el sidebar, la tarjeta de Premium y las fichas. **No hagas una segunda lista.**

No es preferencia de estilo: cuatro listas escritas a mano causaron tres fallos reales a la vez — la calculadora ya abierta que seguía enseñando el modal de registro, el trading en directo anunciado como «próximamente» cuando ya había sesiones, y la web diciendo ocho herramientas en un sitio y nueve en otro.

Al añadir una herramienta al catálogo aparece sola en los cinco sitios, con el recuento actualizado. Campos que mandan:

| Campo | Para qué |
|---|---|
| `acceso` | `"gratis"`, `"cuenta"`, `"premium"` o `"proximamente"`. **Manda sobre `href`**: de aquí salen las etiquetas, los muros y a dónde va cada botón |
| `desc` | Copy corto y comercial, para el hero |
| `resumen` | Copy largo e indexable, para la landing |
| `paginaPublica` | Ficha pública propia, si la tiene. Si falta, «Ver detalles» cae en su ancla de `/herramientas` |
| `premiumHref` | La herramienta en sí, tras el muro. **No confundir con `paginaPublica`** |

Los helpers `accesoPorRuta()`, `destinoPorRuta()` y `detalleDe()` deciden el destino según quién mire. Úsalos en vez de escribir ternarios por tu cuenta.

#### El sistema visual de las fichas

**`src/app/herramientas/detalle.css`** define el lenguaje de las páginas de herramienta y del diccionario: fondo técnico con rejilla y orbes, cabeceras de sección numeradas, marcas de agua, tarjetas con cuerpo y el cierre con halo. Hereda de la antigua página de asesoría, que era la mejor resuelta del sitio.

Para una página nueva de este tipo: importa `detalle.css`, envuélvela en `.det-main` con su `--det-accent` y usa las piezas ya existentes. **Ojo con los fallbacks claros**: la primera versión de `/herramientas` usaba `var(--surface-card, #fff)` y las tarjetas salían en blanco sobre el fondo oscuro.

#### Un solo descargo de responsabilidad

**`src/components/DisclaimerRiesgo.tsx`** es el único sitio donde vive ese texto, con cuatro variantes (`portfolio`, `directo`, `diario`, `general`). Todas cierran con el mismo bloque de responsabilidad, que es innegociable: deja por escrito que la decisión es de quien lee y que esto **no es un grupo de señales**.

No escribas avisos legales a mano en una página: si el texto vive en dos sitios acaban diciendo cosas distintas, y entonces no protege — la defensa de «lo advertí» se cae si en una página lo advertiste y en otra no. Había dos avisos sueltos de una línea (Mi Portfolio y Radar) que decían mucho menos; ahora todos pasan por el componente. El pie de página lleva la misma cláusula, y es el único sitio que cubre también entradas y guías.

⚠️ **No es asesoramiento jurídico.** Cubre lo evidente pero **debe revisarlo un abogado**, sobre todo por la normativa española y europea de promoción de criptoactivos.

#### No prometas lo que el producto no hace

Al escribir sobre una herramienta, **abre su código y comprueba que hace lo que vas a decir**. En una sola sesión aparecieron tres textos que prometían de más, los tres en la página de pago: unos «retos y niveles» que no existen, un descuento del «−60 %» olvidado tras subir el precio, y un «para siempre» que la propia FAQ desmentía dos párrafos más abajo.

Ninguno se buscó: salieron al ir a documentar cada herramienta. Es el tipo de cosa que acaba en una reclamación.
