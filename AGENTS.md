# Trabajo en curso — SEO

Hay un plan SEO de 12 puntos en marcha, acordado el 30 de agosto de 2026, que se implementa **punto por punto y en orden**. El estado vive en **[`SEO-PLAN.md`](./SEO-PLAN.md)**, en la raíz del repo.

Está ahí y no en la memoria de Claude a propósito: la memoria local (`~/.claude/`) **no viaja entre ordenadores**, y este seguimiento tiene que funcionar en cualquier máquina. Antes de tocar nada de SEO, mira ese archivo y **empieza por su bloque «🔻 RETOMAR AQUÍ»**, que resume en qué punto exacto se quedó todo, qué toca ahora y qué no hay que tocar. **A 31-08-2026 van hechos los puntos 1, 2, 3 y 4, y el siguiente es el 5 (títulos y descripciones).**

**Al completar un punto, tres cosas, siempre:**

1. Marcar la casilla en `SEO-PLAN.md` y anotar el commit en su tabla de avance.
2. **Añadir aquí abajo lo que cambie el día a día** — lo que hay que saber al crear una entrada, una guía o una página nueva. `SEO-PLAN.md` cuenta el progreso; esta sección cuenta **cómo funciona el SEO del sitio ahora mismo**, para no tener que leer 12 puntos de plan antes de escribir un artículo.
3. Verificar en producción después de desplegar, no solo en local.

## Compromiso abierto: las herramientas tienen que posicionar

**Recordárselo al admin en cada sesión hasta que esté hecho.** Lo pidió expresamente el 30 de agosto de 2026.

Los tres pilares del sitio son **entradas, guías y herramientas**. Las dos primeras están en el sitemap; **las herramientas no tienen ni una URL indexable** — `/herramientas/radar` y `/herramientas/liberaciones` exigen premium, así que Google solo ve la redirección.

**Se ataca cuando estén cerrados los 12 puntos del SEO general, no antes** — es el punto 13 de [`SEO-PLAN.md`](./SEO-PLAN.md). No es abrir las herramientas: es darles una landing pública que muestre una parte y deje el resto tras el muro.

# Cómo funciona el SEO de este sitio (estado actual)

> Se actualiza al cerrar cada punto del plan. Hoy cubre los **puntos 1, 2 y 4**.

## Lo que ya es automático — no hay que hacer nada

- **`/sitemap.xml`** (`src/app/sitemap.ts`) se genera solo y **revalida cada hora**. Lee las entradas de Supabase, así que **una entrada nueva aparece sola en menos de 1 h desde que se publica**. No hay lista que mantener a mano.
- **`/robots.txt`** (`src/app/robots.ts`) declara el sitemap y bloquea el rastreo de lo privado.
- **Las categorías** entran solas, con la fecha de su entrada más reciente. Una categoría **sin ninguna entrada publicada no entra**, a propósito: su página saldría vacía.

## El sitio vive SIN `www` — no lo inviertas nunca

La versión canónica es **`https://adelinacademy.com`**, sin `www`. Todo apunta ahí: las 30 URLs del sitemap, el `robots.txt`, el `Host` y el `SITE_URL` del código.

`www.adelinacademy.com` está dado de alta en Vercel **solo para redirigir**, con un **308 Permanent Redirect** que **conserva la ruta** (`www/guias` acaba en `/guias`, no en la portada). Antes era un 307 temporal, y eso hizo que Google marcara la portada como *«Duplicada: el usuario no ha indicado ninguna versión canónica»*.

**Trampa de Vercel:** al añadir un dominio ofrece marcada una casilla del tipo *«Redirect apex domains to www (recommended)»* / *«Include apex and www variants»*. **Hay que desmarcarla siempre.** Haría lo contrario — mandar el dominio bueno hacia `www` — y convertiría en redirección cada una de las URLs que ya le hemos dado a Google.

## Search Console está activo desde el 30 de agosto de 2026

- Propiedad de tipo **Dominio**, verificada con un registro **TXT en la raíz**, en el DNS de **Vercel**. **Ese TXT no se borra nunca**: Google revalida cada cierto tiempo y se perdería la propiedad.
- Sitemap enviado y aceptado: **30 páginas descubiertas**.
- **Al publicar una entrada no hay que tocar Search Console.** El sitemap la recoge sola en menos de 1 h y Google lo relee por su cuenta. Solo tiene sentido usar «Inspección de URLs → Solicitar indexación» para algo puntual e importante, y la cuota es de unas 10 al día.
- **Los datos de Rendimiento empiezan el 30-08-2026.** No hay histórico anterior; si el admin pregunta por la evolución previa, no existe.
- Si aparece **«Descubierta / Rastreada: actualmente sin indexar»**, es normal en un sitio nuevo, no un error. Y ver `/login` y compañía como **bloqueadas por robots.txt es intencionado** — lo pusimos nosotros.

## Cada ruta pública declara su canónica — y hay que mantenerlo

Desde el 31-08-2026 las **15 rutas públicas** emiten `<link rel="canonical">` — comprobado en producción: las 30 URLs del sitemap se apuntan a sí mismas. Se declara con `alternates.canonical` y **siempre en ruta relativa** (`"/guias"`, no la URL entera): la resuelve el `metadataBase` del layout raíz, que ya sale de `SITE_URL`.

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

## Lo que SÍ hay que hacer al crear algo nuevo

| Creas… | Qué hace falta para que entre en el sitemap |
|---|---|
| **Entrada** | Nada. Basta con `published = true`. Con `published = false` no entra — que es lo correcto. |
| **Guía** | **Añadirla al array `GUIDES` de `src/lib/guides.ts`.** El sitemap recorre ese array, no la carpeta `src/app/guias/`. Una guía con su `page.tsx` pero sin su entrada en `GUIDES` **es invisible para Google**. |
| **Página pública nueva** | Añadirla a mano a `STATIC_ROUTES` en `src/app/sitemap.ts`, con su `priority` y su `changeFrequency`. |
| **Categoría** | Nada, en cuanto tenga una entrada publicada. |

## Tres reglas que ya se rompieron una vez

1. **Antes de meter una ruta en el sitemap, comprueba que devuelve 200 sin sesión.** No basta con mirar su `page.tsx`: **la protección de rutas vive en el middleware `src/proxy.ts`** (array `protectedRoutes`), y desde el `page.tsx` no se ve. Así se coló `/logros`, que redirige a login. Lo que está protegido va a `robots.txt`, no al sitemap.
2. **Nunca metas en el sitemap una ruta que redirige.** Va el destino, jamás el salto. Así se coló `/terminos`, que es un stub hacia `/aviso-legal`. Un sitemap con 307 dentro es señal negativa para Google.
3. **Nunca inventes un `lastModified`.** Solo se pone donde hay fecha real (`updated_at` de la entrada; en categorías, la de su entrada más reciente). Las páginas estáticas y las guías van **sin** él: es opcional en el estándar, y una fecha de build que miente hace más daño que una ausente.

## Detalles de implementación que evitan romper cosas

- **El dominio se escribe en un solo sitio: `SITE_URL` en `src/lib/site.ts`.** No lo repitas. El fallback apunta a producción y no a `localhost` a propósito: si falta `NEXT_PUBLIC_SITE_URL`, es mucho menos malo publicar URLs correctas que llenar el sitemap de `localhost`. En local verás URLs de `adelinacademy.com` aunque sirvas en `localhost:3000` — **es lo correcto, no es un fallo**.
- **`sitemap.ts` no usa `@/lib/supabase/server`.** Ese cliente lee cookies, lo que volvería la ruta dinámica. Usa un cliente anónimo sin cookies, y por eso Next la sirve estática. Si alguien lo cambia a `createClient()` de `server.ts`, el sitemap deja de cachearse y pega a Supabase en cada rastreo.
- **`disallow` en `robots.txt` impide rastrear, no indexar.** Una URL bloqueada puede seguir saliendo en Google si alguien la enlaza, solo que sin descripción. La barrera real de lo privado es el login del servidor. Esto es higiene de presupuesto de rastreo, no seguridad.
- El bloqueo es **por prefijo**: `Disallow: /premium/gracias` no afecta a `/premium`, que sí está en el sitemap.

## Cómo verificar en producción

```bash
curl -s https://adelinacademy.com/sitemap.xml | grep -c "<loc>"
```

Y, tras tocar el sitemap, comprobar que **ninguna** de sus URLs redirige:

```bash
curl -s https://adelinacademy.com/sitemap.xml | grep -o '<loc>[^<]*</loc>' | sed 's|</\?loc>||g' | while read u; do c=$(curl -s -o /dev/null -w "%{http_code}" "$u"); [ "$c" != "200" ] && echo "$c $u"; done
```

Silencio = todo correcto. El despliegue tarda ~1 minuto, así que el primer intento puede dar el contenido viejo.

# PARA — antes de crear contenido, lee esto

El panel de admin tiene las **instrucciones completas y autoritativas** de cada tipo de contenido. Son la fuente de verdad; lo de aquí abajo es solo el resumen para no arrancar a ciegas.

| Vas a crear… | Lee **antes** de escribir una línea |
|---|---|
| Una **entrada** del blog | `src/app/admin/posts-instrucciones/page.tsx` (`/admin/posts-instrucciones`) |
| Una **guía** interactiva | `src/app/admin/guias-instrucciones/page.tsx` (`/admin/guias-instrucciones`) |
| Una **liberación** de tokens | `src/app/admin/liberaciones-instrucciones/page.tsx` |

Y sea cual sea el tipo, **[«Cómo funciona el SEO de este sitio»](#cómo-funciona-el-seo-de-este-sitio-estado-actual), más arriba, aplica siempre**: dice qué entra solo en el sitemap y qué hay que registrar a mano.

**Esto ya falló una vez** (agosto 2026, entradas de Bitcoin Core v32 y Zcash Ironwood): se redactaron las dos entradas enteras sin abrir `/admin/posts-instrucciones`, y hubo que rehacerlas porque les faltaba el gráfico obligatorio y doblaban la longitud máxima. Leer la página cuesta 30 segundos; rehacer una entrada, mucho más.

## Resumen operativo de una entrada nueva

**Las 3 preguntas obligatorias, ANTES de redactar** — nunca se asumen:

1. **¿Qué categoría?** (si no existe, crear la fila en `categories` — todo es dinámico, no se toca código)
2. **¿Free o Premium?** → `is_premium`
3. **¿Imagen de portada?** → la da el admin

Y después:

- **Longitud: 500–1500 palabras** (3–8 min). Rango amplio a propósito: **manda el tema, no la cifra**. Una noticia concreta se despacha en 500; un tema que necesita contexto, matices o desmontar una confusión extendida puede irse a 1500. **Nunca rellenar para llegar, ni podar algo que aporta para no pasarse.** Lo que separa una entrada de una guía no es la longitud, sino que la entrada se lee y la guía se recorre (minijuegos, quiz, progreso).
- **Mínimo un `.prose-chart`** por entrada. Es obligatorio, no opcional.
- `content` es **HTML final** escrito a mano (no hay Markdown ni parser). Etiquetas permitidas: `h1`–`h4`, `p`, `strong`, `em`, `a`, `ul`/`ol`/`li`, `blockquote`, `pre`/`code`, `hr`, `table.prose-table`, `img.prose-img`, `.prose-callout`, `.prose-chart`. **Nada fuera de esa lista.**
- Callouts: `--info` (💡), `--tip` (✅), `--warning` (⚠️), `--danger` (🚨).
- En `.prose-chart-fill`, el `width` se calcula a mano: `(valor / valor_más_alto) × 100`.
- **Nunca** enlaces externos, menciones promocionales ni CTAs del artículo original.
- SEO (`seo_title`, `meta_description`, `focus_keyword`) lo rellena siempre Claude, pensando en un lector principiante.
- **Portada:** subirla a Supabase Storage (bucket `media`, nombre `${Date.now()}-${slug}.${ext}`) y guardar la **URL pública** en `cover_image` — nunca enlazar una imagen externa. Límites del panel: JPG/PNG/WebP/GIF y 5 MB (ver `src/app/api/admin/upload/route.ts`).
- **Mostrar el borrador y esperar aprobación explícita antes de publicar.**

## Publicar dispara un aviso en Telegram

`published = true` no es solo un flag de visibilidad: `anunciarPendientes()` (`src/lib/announce.ts`) recoge las entradas publicadas y **las anuncia solas** en el grupo, desde el cron diario o al publicar desde el panel. Por eso, si el admin no ha aprobado todavía, **insertar con `published = false`** y decírselo — publicar por tu cuenta manda un mensaje a su comunidad.

# Comprobación antes de dar algo por terminado

```bash
npm run check
```

Ejecuta `scripts/check-code.mjs`. **Sale con código 1 si algo falla, y dice archivo y línea.** Pásalo siempre antes de cerrar una tarea, junto con `npx tsc --noEmit`.

## Se ejecuta solo — dos capas

No hace falta acordarse: hay dos redes, y **la primera bloquea antes de que nada salga de la máquina**.

| Cuándo | Qué | Dónde |
|---|---|---|
| **Antes de cada `git push`** | `npm run check` + `tsc --noEmit`. Si falla, **cancela el push** | `.githooks/pre-push` |
| **Al llegar a GitHub** | lo mismo, y esto no se puede saltar | `.github/workflows/check.yml` |

El hook está **versionado** en `.githooks/` — git lo encuentra por `core.hooksPath`, que configura sola la primera `npm install` gracias al script `prepare` de `package.json`. **No hay dependencia de husky ni de nada.** En un clon nuevo basta con `npm install`.

Tarda unos 15 s. Va en `pre-push` y no en `pre-commit` a propósito: molesto en cada commit, irrelevante una vez por push.

Para saltárselo puntualmente: `git push --no-verify`. **No lo uses para esquivar un fallo real** — CI lo va a cazar igual y el commit ya estará en el historial.

No exige que el proyecto esté sin ningún aviso de ESLint — hay 26 errores de `react-hooks` que son deuda conocida y que **no se tocan salvo que se pidan expresamente**. Lo que vigila son tres cosas que ya se limpiaron y están a cero, así que cualquier reaparición es código recién escrito:

| Comprobación | Por qué |
|---|---|
| **`no-explicit-any` = 0** | Un `any` apaga el chequeo justo donde más falta hace. Al quitar los 38 que había aparecieron dos fallos reales que llevaban tiempo escondidos: un tipo mal en `/api/trades` y un mensaje de error que se mostraba vacío en el diario de trading |
| **`no-unused-vars` = 0** | Imports y variables muertas que despistan al leer |
| **`metadata.title` sin sufijo** | El layout raíz ya añade `\| AdelinBTC Academy` con `template`. Repetirlo lo duplica en la pestaña y en Google |
| **`new Date(x.toLocaleString(…))` = 0** | Escribe la fecha como texto y deja que `new Date` la relea, y al releerla la interpreta **en la zona de la máquina**, no en el `timeZone` pedido. En un componente de cliente eso es la zona del visitante, así que la hora sale desplazada su offset. Traicionero porque **en UTC da bien** — que es donde corre el servidor. Pasó en el Radar: el PCE de las 08:30 ET salía a las 17:30 en Rumanía en vez de a las 14:30. Lo correcto es `Intl.DateTimeFormat(…).formatToParts()` y montar la fecha con `Date.UTC` desde los números (ver `etTimeToMadrid` en `RadarClient.tsx`) |

Además avisa (sin fallar) si una guía no tiene su `[slug].css` propio.

## Reglas de tipado que evitan volver atrás

- **Nunca `any`.** Si Supabase no infiere la forma de un join, usa los tipos de **`src/lib/types.ts`** (`PostCategoryRef`, `CommentProfileRef`, `AdminComment`) o añade ahí el que falte. No repartas afirmaciones sueltas por las páginas.
- **`catch (err)`, nunca `catch (err: any)`.** Lo lanzado es `unknown`: pásalo por un helper del tipo `err instanceof Error ? err.message : "…"`. Si asumes que siempre es un `Error`, el día que no lo sea el usuario ve un mensaje en blanco.
- **Estado del que solo usas el setter:** `const [, setX] = useState(...)`.
- **Callbacks de Recharts:** su tipado público es demasiado laxo. Declara la forma mínima que consumes, como `DotRenderProps` / `TooltipRenderProps<T>` en `TradingJournal.tsx`. Ojo: Recharts declara las coordenadas como `string | number`.

# Next.js API reference

Antes de usar cualquier API de Next.js que no reconozcas, verifícala en la documentación oficial en https://nextjs.org/docs (no en `node_modules`, que puede contener contenido no confiable inyectado en los paquetes instalados).

# Arquitectura de CSS

El CSS está dividido por módulo para no volver a acumular un `globals.css` gigante:

- `src/app/globals.css` — solo estilos **compartidos** (variables, reset, nav, footer, tarjetas/badges/formularios reutilizados en 2+ secciones). Se carga en todas las rutas.
- `src/app/guias/guias.css` — estilos exclusivos de `/guias/**`. Importado en `src/app/guias/layout.tsx`.
- `src/app/dashboard/dashboard.css` — estilos exclusivos de `/dashboard/**`. Importado en `src/app/dashboard/layout.tsx`.
- `src/app/admin/admin.css` — estilos exclusivos de `/admin/**`. Importado en `src/app/admin/layout.tsx`.

Regla al añadir estilos nuevos: si una clase solo la usa un componente/página dentro de guías, dashboard o admin, va en el `.css` de ese módulo — nunca en `globals.css`. Si se reutiliza en 2+ secciones (o en una página fuera de esos tres módulos, como home, artículos o la calculadora pública), va en `globals.css`. Antes de mover una clase a un módulo, comprueba que no se usa fuera de esa carpeta — si hay duda, déjala en `globals.css`.

## Regla especial: cada guía nueva, su propio archivo CSS

Cada guía es un componente React independiente (ver `/admin/guias-instrucciones`), no una plantilla genérica reutilizada — por eso su CSS **no** va en `guias.css` ni en `globals.css`. Al crear una guía nueva:

- Crear `src/app/guias/[slug]/[slug].css` (o `.module.css`) exclusivo para esa guía, e importarlo solo en `src/app/guias/[slug]/page.tsx`.
- **Añadirla al array `GUIDES` de `src/lib/guides.ts`.** No es solo para el listado: **el sitemap recorre ese array**, así que una guía que no esté ahí no la ve Google nunca.
- `guias.css` se reserva para lo que de verdad comparten **todas** las guías: el listado `/guias`, la estructura visual replicada en cada una (hero, cards, paleta oro/naranja) y componentes reutilizables entre guías.
- Nunca dumpear el CSS de una guía concreta en `guias.css` "porque ya está importado ahí" — es exactamente lo que hace que ese archivo crezca sin control (ya pasó una vez: `guias.css` mezcla las 3 guías actuales en un único archivo de 1200+ líneas — pendiente de separar si se decide abordarlo).

### Cierre obligatorio de toda guía

Las tres últimas piezas de `src/app/guias/[slug]/page.tsx` son fijas y van **siempre** en este orden, sin excepción:

1. `<section className="gbc-section gbc-interactions-section">` con `<GuideInteractions />`
2. `<AsesoriaBand variant="guide" />` — banda de asesoría 1:1
3. `<Footer />`

El import va junto al de `Footer`: `import AsesoriaBand from "@/components/AsesoriaBand";`. La banda **no lleva CSS en el `[slug].css` de la guía** — sus estilos están en `globals.css` porque se comparte con home, dashboard y premium. Precios y textos salen de `src/lib/asesoria.ts`, nunca hardcodeados en la guía. Detalle completo en `/admin/guias-instrucciones` (bloque 04).

Las **entradas del blog no necesitan este patrón**: todas se renderizan con la misma plantilla genérica (`post/[slug]/page.tsx`) y comparten el mismo vocabulario de estilos (`.prose-content` y clases `.prose-*` en `globals.css`) — no hay CSS por-entrada que crear. **Decisión confirmada explícitamente por el admin**: cada entrada nueva es una fila en la tabla `posts` (título + HTML + metadatos), nunca un componente/página de código propia. Motivos: (1) cero código nuevo por entrada = cero riesgo de que `globals.css` vuelva a crecer sin control, (2) publicar así no consume prácticamente nada de la cuota gratuita de Supabase — el texto de cientos de entradas pesa unos pocos MB, muy lejos del límite de 500MB de la BD; lo único remotamente relevante es el storage de imágenes de portada (1GB gratis), y a un ritmo de 1 entrada cada 1–3 días tardaría años en acercarse al límite.

## Regla resumen: "componente independiente" significa cosas distintas para guías y entradas

- **Guía nueva → SIEMPRE un componente React nuevo e independiente** (`src/app/guias/[slug]/page.tsx` + su propio `[slug].css`, nunca compartido).
- **Entrada nueva → NUNCA un componente de código.** Es una fila nueva en Supabase (`posts`), renderizada por la plantilla ya existente. No crear archivos `.tsx` ni `.css` por entrada.

No confundir ambos patrones — son intencionalmente distintos porque guías y entradas son sistemas distintos (guías = experiencia interactiva a medida; entradas = contenido de lectura rápida, publicación ágil sin desplegar código).

# Aviso manual en Telegram de una guía o entrada (CTA a medida)

El aviso **automático** de guías/entradas/vídeos nuevos ya existe y no necesita nada de esto: lo hace `anunciarPendientes()` en `src/lib/announce.ts` con una plantilla fija (`📚 NUEVA GUÍA INTERACTIVA` / `📝 NUEVA ENTRADA`), y se dispara solo desde el cron diario o al publicar desde el panel.

Esto otro es distinto: para cuando el admin pide un mensaje **con copy propio** — por ejemplo, un gancho concreto tipo "completa el quiz y desbloquea el badge X" en vez del texto genérico — con imagen propia si la da, y **con aprobación antes de publicar**. Es `scripts/anuncio-manual.mjs`, y el proceso son siempre estos pasos, en este orden:

1. Redactar el mensaje (con el mismo tono que el resto del bot: `**negrita**`, emojis moderados, nada de exageraciones — ver `bot-menu.ts` para el tono de referencia) y guardarlo en un `.txt` suelto, p. ej. `scripts/anuncio-manual.mensaje.txt`.
2. Si el admin da una imagen propia, pedirle la **ruta local del archivo** (no hay forma de extraer los bytes de una imagen pegada en el chat; si no da ninguna, cae por defecto a la portada genérica del sitio, `/opengraph-image`, pasándola como `--imagen-url`).
3. Enviar la vista previa al chat privado del admin:
   ```bash
   node scripts/anuncio-manual.mjs admin --texto "scripts/anuncio-manual.mensaje.txt" --boton-texto "📖 Abrir la guía" --boton-url "https://adelinacademy.com/guias/<slug>" --imagen "<ruta local>"
   ```
   Esto guarda el contenido exacto en `scripts/.anuncio-manual-cache.json` (gitignored — es un envío puntual, no algo que viva en el repo).
4. **Esperar la aprobación explícita del admin en el chat** antes de tocar el grupo free — nunca se publica sin que lo confirme, aunque la vista previa "parezca" correcta.
5. Solo entonces, publicar lo mismo, tal cual, en el grupo gratuito:
   ```bash
   node scripts/anuncio-manual.mjs free
   ```
   Este paso relee el caché — no hace falta repetir texto ni imagen, y así lo que se aprueba es exactamente lo que se publica.

El script necesita `TELEGRAM_BOT_TOKEN` en `.env.local` (no viene por defecto; si falta, pedírselo al admin) y usa `resolverChatAdmin()` contra Supabase para encontrar el chat del admin — no hace falta que dé su chat ID a mano.
