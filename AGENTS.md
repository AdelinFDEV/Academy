# Comprobación antes de dar algo por terminado

```bash
npm run check
```

Ejecuta `scripts/check-code.mjs`. **Sale con código 1 si algo falla, y dice archivo y línea.** Pásalo siempre antes de cerrar una tarea, junto con `npx tsc --noEmit`.

No exige que el proyecto esté sin ningún aviso de ESLint — hay 26 errores de `react-hooks` que son deuda conocida y que **no se tocan salvo que se pidan expresamente**. Lo que vigila son tres cosas que ya se limpiaron y están a cero, así que cualquier reaparición es código recién escrito:

| Comprobación | Por qué |
|---|---|
| **`no-explicit-any` = 0** | Un `any` apaga el chequeo justo donde más falta hace. Al quitar los 38 que había aparecieron dos fallos reales que llevaban tiempo escondidos: un tipo mal en `/api/trades` y un mensaje de error que se mostraba vacío en el diario de trading |
| **`no-unused-vars` = 0** | Imports y variables muertas que despistan al leer |
| **`metadata.title` sin sufijo** | El layout raíz ya añade `\| AdelinBTC Academy` con `template`. Repetirlo lo duplica en la pestaña y en Google |

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
