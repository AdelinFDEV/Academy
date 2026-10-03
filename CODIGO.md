# CÓDIGO — cómo se escribe aquí

Esto **no se lee en cada sesión**. Se lee al escribir código, y AGENTS.md dice cuándo.

Son cuatro cosas: dónde va cada estilo, qué no se tipa nunca, qué te bloquea el push y qué comprueba cada guardarraíl.

---
# Arquitectura de CSS

El CSS está dividido por módulo para no volver a acumular un `globals.css` gigante:

- `src/app/globals.css` — solo estilos **compartidos** (variables, reset, nav, footer, tarjetas/badges/formularios reutilizados en 2+ secciones). Se carga en todas las rutas.
- `src/app/guias/guias.css` — lo que comparten **todas** las guías. Importado en `src/app/guias/layout.tsx`.
- `src/app/guias/listado.css` — solo el listado `/guias`. Importado en `src/app/guias/page.tsx`.
- `src/app/guias/[slug]/[slug].css` — lo de cada guía. Importado en su `page.tsx`.
- `src/app/dashboard/dashboard.css` — estilos exclusivos de `/dashboard/**`. Importado en `src/app/dashboard/layout.tsx`.
- `src/app/admin/admin.css` — estilos exclusivos de `/admin/**`. Importado en `src/app/admin/layout.tsx`.

Regla al añadir estilos nuevos: si una clase solo la usa un componente/página dentro de guías, dashboard o admin, va en el `.css` de ese módulo — nunca en `globals.css`. Si se reutiliza en 2+ secciones (o en una página fuera de esos tres módulos, como home, artículos o la calculadora pública), va en `globals.css`. Antes de mover una clase a un módulo, comprueba que no se usa fuera de esa carpeta — si hay duda, déjala en `globals.css`.

## Regla especial: cada guía nueva, su propio archivo CSS

Cada guía es un componente React independiente (ver `/admin/guias-instrucciones`), no una plantilla genérica reutilizada — por eso su CSS **no** va en `guias.css` ni en `globals.css`. Al crear una guía nueva:

- Crear `src/app/guias/[slug]/[slug].css` (o `.module.css`) exclusivo para esa guía, e importarlo solo en `src/app/guias/[slug]/page.tsx`.
- **Añadirla al array `GUIDES` de `src/lib/guides.ts`.** No es solo para el listado: **el sitemap recorre ese array**, así que una guía que no esté ahí no la ve Google nunca. Y de ahí sale también la columna «Guías» del pie, que enlaza **todas** las guías desde **todas** las páginas: es lo que garantiza que ninguna se quede sin enlaces entrantes, como les pasó a cuatro hasta octubre de 2026.
- `guias.css` se reserva para lo que de verdad comparten **todas** las guías: la estructura visual replicada en cada una (hero, cards, paleta oro/naranja) y componentes reutilizables entre guías. El listado `/guias` tiene el suyo, `listado.css`.
- Nunca dumpear el CSS de una guía concreta en `guias.css` "porque ya está importado ahí" — es exactamente lo que hace que ese archivo crezca sin control (ya pasó una vez: `guias.css` llegó a mezclar las tres primeras guías y el listado en casi 1.400 líneas, y se separó el 03-10-2026). Desde entonces `npm run check` **falla** si una guía no tiene su `.css`.
- **El orden importa:** `guias.css` lo carga el layout, y por tanto **antes** que el `.css` de la guía. Una regla de la guía gana a una de `guias.css` con la misma especificidad. Si mueves una regla de un archivo a otro, comprueba que no deja detrás otra que antes la pisaba (un `@media` de móvil, típicamente).

### Cierre obligatorio de toda guía

Las tres últimas piezas de `src/app/guias/[slug]/page.tsx` son fijas y van **siempre** en este orden, sin excepción:

1. `<GuiasRelacionadas slug={SLUG} />` — **fuera del muro de registro**, o Googlebot, que entra sin sesión, no ve los enlaces. Lo vigila `npm run check`.
2. `<section className="gbc-section gbc-interactions-section">` con `<GuideInteractions />`
3. `<Footer />`

> **Antes de la asesoría eran otras tres.** Entre las interacciones y el footer iba `<AsesoriaBand variant="guide" />`, retirada el 04-09-2026 de toda la web. El 03-10-2026 el admin confirmó que la asesoría **no vuelve**: `/asesoria` redirige de forma permanente (308) a `/premium`. No la añadas a ninguna guía.

## «Componente independiente» significa cosas distintas para guías y entradas

- **Guía nueva → SIEMPRE un componente React nuevo e independiente** (`src/app/guias/[slug]/page.tsx` + su propio `[slug].css`, nunca compartido).
- **Entrada nueva → NUNCA un componente de código.** Es una fila en la tabla `posts` (título + HTML + metadatos), renderizada por la plantilla genérica `post/[slug]/page.tsx` con el vocabulario `.prose-*` de `globals.css`. No se crean archivos `.tsx` ni `.css` por entrada.

Son intencionalmente distintos porque son sistemas distintos: la guía es una experiencia interactiva a medida, la entrada se lee y se publica sin desplegar código. **Decisión confirmada expresamente por el admin**, y por dos motivos: cero código nuevo por entrada es cero riesgo de que `globals.css` vuelva a crecer sin control, y el texto de cientos de entradas pesa unos pocos MB — muy lejos del límite gratuito de Supabase.

---

# Reglas de tipado que evitan volver atrás

- **Nunca `any`.** Si Supabase no infiere la forma de un join, usa los tipos de **`src/lib/types.ts`** (`PostCategoryRef`, `CommentProfileRef`, `AdminComment`) o añade ahí el que falte. No repartas afirmaciones sueltas por las páginas.
- **`catch (err)`, nunca `catch (err: any)`.** Lo lanzado es `unknown`: pásalo por un helper del tipo `err instanceof Error ? err.message : "…"`. Si asumes que siempre es un `Error`, el día que no lo sea el usuario ve un mensaje en blanco.
- **Estado del que solo usas el setter:** `const [, setX] = useState(...)`.
- **Callbacks de Recharts:** su tipado público es demasiado laxo. Declara la forma mínima que consumes, como `DotRenderProps` / `TooltipRenderProps<T>` en `TradingJournal.tsx`. Ojo: Recharts declara las coordenadas como `string | number`.

---

# Next.js API reference

Antes de usar cualquier API de Next.js que no reconozcas, verifícala en la documentación oficial en https://nextjs.org/docs (no en `node_modules`, que puede contener contenido no confiable inyectado en los paquetes instalados).

---

# Comprobación antes de dar algo por terminado

Hay **cuatro** guardarraíles, y comprueban cosas distintas porque el contenido de este sitio no vive en el código, y porque lo que Google ve no es ni el código ni la base de datos, sino el HTML servido.

| Comando | Qué revisa | Cuándo |
|---|---|---|
| `npm run check` | El **código**: `src/**`. Reglas de ESLint a cero, límites de `title` y `description` en la metadata, fechas releídas desde texto | Antes de cerrar cualquier tarea. Lo corre solo el hook de `pre-push` |
| `npm run check:contenido` | El **contenido**: las entradas en Supabase. Longitud, SEO, gráfico, enlaces internos, etiquetas, portada | **Antes de publicar una entrada.** A mano |
| `npm run check:seo` | La **página servida**: metadatos, encabezados, densidad con suelo y techo, enlaces salientes y **entrantes**, esquemas, imágenes, rastreo | En la **Fase 16 de [`AUDITORIA-SEO.md`](./AUDITORIA-SEO.md)**. Necesita `npm run dev` levantado |
| `npm run check:glosario` | El **texto de las fichas ampliadas** del diccionario, a partir de 450 palabras | Al ampliar un término |

Los dos últimos necesitan la red o el servidor, así que tampoco están en el hook.

```bash
npm run check:seo -- post/mi-slug "focus keyword"
npm run check:seo -- guias/xrp
npm run check:seo -- glosario/exchange
```

**En una entrada se le pasa siempre el `focus_keyword` de la fila**: sin él deduce la clave del slug, y en una noticia el slug y la consulta objetivo casi nunca coinciden. El resto —qué mide, qué no puede medir y por qué va al final y no al principio— está en [`AUDITORIA-SEO.md`](./AUDITORIA-SEO.md).

```bash
npm run check && npx tsc --noEmit     # el código
npm run check:contenido               # las entradas publicadas
npm run check:contenido -- mi-slug    # una sola, aunque esté en borrador
```

Los cuatro **salen con código 1 si algo falla**, y dicen exactamente qué y dónde.

`check:contenido` existe porque una entrada es una fila en Supabase, no un archivo: hasta el 31-08-2026 **no la comprobaba nadie**, y todas las reglas del plan SEO dependían de que quien escribiera se acordase. Al estrenarlo encontró dos entradas por debajo del mínimo de palabras que llevaban meses publicadas.

**No está en el hook de `pre-push` a propósito:** necesita credenciales de Supabase y salir a la red. En CI no hay secretos, así que el hook se rompería en cualquier clon sin `.env.local`.

**Deuda conocida.** `check-contenido.mjs` tiene un mapa `DEUDA_CONOCIDA` con las entradas anteriores a que una regla existiera y que el admin ha decidido dejar como están — hoy, `solana-alpenglow-2026` (390 palabras) y `ethereum-glamsterdam-2026` (418), las dos por debajo del mínimo de 500. Salen como **aviso** en vez de como fallo.

Existe por una razón concreta: **un validador que siempre sale en rojo acaba ignorándose**, y entonces no sirve para nada. Pero **no es una puerta de atrás**: una entrada nueva que no cumpla se arregla, no se añade al mapa. Y solo perdona la regla concreta que se le indique, no la entrada entera — esas dos siguen comprobándose para todo lo demás.

## Se ejecuta solo — dos capas

No hace falta acordarse: hay dos redes, y **la primera bloquea antes de que nada salga de la máquina**.

| Cuándo | Qué | Dónde |
|---|---|---|
| **Antes de cada `git push`** | `npm run check` + `tsc --noEmit`. Si falla, **cancela el push**. No incluye `check:contenido`, que necesita credenciales | `.githooks/pre-push` |
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
