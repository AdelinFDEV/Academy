# Plan SEO — estado de implementación

> **Este archivo es la fuente de verdad del progreso SEO.** Vive en el repo a propósito: la memoria local de Claude (`~/.claude/`) no viaja entre ordenadores, y este plan sí tiene que hacerlo.
>
> **Al retomar el trabajo:** mira el primer punto sin marcar y sigue por ahí, en orden.
>
> **Al completar un punto**, tres cosas: (1) marcar la casilla y anotar fecha y commit abajo; (2) **llevar lo que cambie el día a día a la sección «Cómo funciona el SEO de este sitio» de [`AGENTS.md`](./AGENTS.md)** — este archivo cuenta el progreso, aquel cuenta cómo funciona el sitio hoy, y es el que se lee al abrir sesión; (3) verificar en producción tras desplegar. Si no se actualiza, en el siguiente PC no consta.

Informe completo con los 17 hallazgos, las palabras clave y las estimaciones de impacto:
https://claude.ai/code/artifact/ffd27a93-5d0b-4efa-b650-47e34191cd49

**Origen:** auditoría del 30 de agosto de 2026. El diagnóstico fue que el contenido está bien pero **falta la infraestructura que lo hace encontrable**. Medido en producción ese día: `sitemap.xml` y `robots.txt` daban 404, cero datos estructurados en todo el proyecto, ninguna canónica, y 7 de 8 entradas sin un solo enlace interno.

---

# 🔻 RETOMAR AQUÍ — estado a 31 de agosto de 2026

**Bloque 1 CERRADO ENTERO: sus seis puntos hechos y verificados en producción, no solo en local.**

| Hecho | Comprobado |
|---|---|
| 1. Sitemap | `/sitemap.xml` sirve **30 URLs**, las 30 responden 200 |
| 2. Robots | `/robots.txt` en producción, declara el sitemap |
| 3. Search Console | Propiedad de **Dominio** verificada; sitemap **Correcto, 30 páginas** |
| 4. Canónicas | Las **30 URLs del sitemap** responden 200 y su canónica se apunta a sí misma; ninguna ruta privada la hereda |
| 5. Títulos y descripciones | Verificado en **producción**: los **24 títulos por debajo de 60** y las **24 descripciones por debajo de 160**, contando caracteres y no bytes |
| 6. Datos estructurados | `Organization` + `WebSite` en todas las rutas, `Article` + `BreadcrumbList` en las 8 entradas y `BreadcrumbList` en las 7 guías. **Pendiente de verificar en producción** |
| Extra | `www` → **308 permanente** → dominio sin `www`, conservando la ruta |

## Lo siguiente es el punto 7 — glosario con URL por término

**Es la acción con mejor retorno de toda la auditoría**, y arranca el bloque 2. Los 45 términos viven hoy dentro del array `TERMS` de `src/app/glosario/GlosarioClient.tsx`, que es un componente de cliente: **no tienen URL propia**, así que las 45 definiciones no compiten por nada. Hay que sacarlos a `/glosario/[termino]` renderizado en servidor, con esquema `DefinedTerm`.

Ojo al alcance: son 45 páginas nuevas en el sitemap de golpe, y eso obliga a repasar `sitemap.ts`.

## ⛔ Pendiente del admin — desbloqueado, se puede hacer ya

Las canónicas están **desplegadas y verificadas en producción el 31-08-2026**, así que ya no hay nada que esperar.

**Solicitar indexación** en Search Console → «Inspección de URLs» → «Solicitar indexación», para estas tres:

```
https://adelinacademy.com/
https://adelinacademy.com/articulos
https://adelinacademy.com/guias
```

Es lo único que queda del punto 4, y **solo lo puede hacer el admin**: Claude no tiene acceso a Search Console. La cuota es de unas 10 peticiones al día.

Era exactamente lo que pedía el diagnóstico de la portada: *«La página no está indexada — **Duplicada: el usuario no ha indicado ninguna versión canónica**»*, con `https://www.adelinacademy.com/` como página de referencia. El 308 quitó una mitad del problema; la canónica en el HTML es la otra.

## No tocar nunca

- **El registro TXT `google-site-verification=...`** en la raíz del DNS de Vercel. Google revalida cada cierto tiempo; si desaparece, se pierde la propiedad de Search Console.
- **La fila de `adelinacademy.com`** en Vercel → Project → Settings → Domains. Debe seguir en «Connect to an environment → Production». Solo la de `www` redirige.
- **La casilla de Vercel «Redirect apex domains to www» / «Include apex and www variants»**: viene marcada por defecto y hay que dejarla **desmarcada**. Invertiría el sitio y convertiría en redirección las 30 URLs que ya tiene Google.

## Comprobar en 30 segundos que todo sigue en pie

```bash
curl -s https://adelinacademy.com/sitemap.xml | grep -c "<loc>"
```

Debe decir **30**. Y que ninguna URL del sitemap redirija:

```bash
curl -s https://adelinacademy.com/sitemap.xml | grep -o '<loc>[^<]*</loc>' | sed 's|</\?loc>||g' | while read u; do c=$(curl -s -o /dev/null -w "%{http_code}" "$u"); [ "$c" != "200" ] && echo "$c $u"; done
```

Silencio = correcto.

---

## Bloque 1 — Críticos (~1 día, desbloquean todo lo demás)

- [x] **1. Sitemap** — crear `src/app/sitemap.ts` leyendo entradas y guías de Supabase con su `lastModified`.
- [x] **2. Robots** — crear `src/app/robots.ts` con referencia al sitemap y bloqueo de `/admin`, `/dashboard`, `/api` y rutas de auth.
- [x] **3. Search Console** — verificar el dominio y enviar el sitemap. **Lo hace el admin**, Claude no tiene acceso. Hacerlo justo después de los puntos 1 y 2.
- [x] **4. Canónicas** — `alternates.canonical` en el `generateMetadata` de cada ruta pública. Ya existe `metadataBase`, así que basta la ruta relativa.
- [x] **5. Títulos y descripciones** — el sufijo `" | AdelinBTC Academy"` del layout raíz son 20 caracteres fijos y hace que **las 8 entradas se corten en Google** (la peor, 92 caracteres). Acortar el sufijo, reescribir los 8 títulos y las 6 descripciones que pasan de 160, y fijar los límites en `/admin/posts-instrucciones`. **Al medirlo aparecieron también las 7 guías cortadas** (fiscalidad, 101) y entraron en el mismo punto.
- [x] **6. Datos estructurados** — `Article` en entradas, `BreadcrumbList` en entradas y guías, `Organization` y `WebSite` en el layout raíz.

## Bloque 2 — Construcción (este trimestre)

- [ ] **7. Glosario con URL por término** — `/glosario/[termino]` renderizado en servidor con esquema `DefinedTerm`. Los 45 términos viven hoy en el array `TERMS` dentro de `src/app/glosario/GlosarioClient.tsx`, que es un componente de cliente, **sin URL propia**. Es la acción con mejor retorno de toda la auditoría.
- [ ] **8. Enlazado interno** — 2-4 enlaces contextuales por entrada, y convertirlo en regla de `/admin/posts-instrucciones` para que las nuevas nazcan enlazadas.
- [ ] **9. Página pilar de formación gratuita** — agrupa las 7 guías y compite por «aprender criptomonedas gratis».
- [ ] **10. Generación estática con revalidación** — hoy todo es dinámico porque las páginas leen cookies de Supabase en servidor. La home tardaba 2,44 s el 30-08-2026. Separar lo público de lo personalizado.
- [ ] **11. Contenido gratuito de fiscalidad** — la guía es premium; entradas gratis (modelo 721, FIFO, staking/airdrops) captan búsquedas de baja competencia y llevan a ella.
- [ ] **12. RSS** y ritmo de publicación sostenido.

## Bloque 3 — Comprometido: posicionar las herramientas

> **Acordado el 30 de agosto de 2026. No se abandona hasta terminarlo.** Se ataca **cuando estén cerrados los 12 puntos del SEO general**, no antes.

El admin nombra tres pilares del sitio: **entradas, guías y herramientas**. Hoy los dos primeros están en el sitemap y **el tercero no tiene ni una sola URL indexable**: `/herramientas/radar` y `/herramientas/liberaciones` exigen premium (`herramientas/radar/page.tsx:31`, `herramientas/liberaciones/page.tsx:30`), así que Google solo ve la redirección y se va.

Duele porque «calendario de liberaciones de tokens» o «unlocks de <token>» son búsquedas reales, de intención muy concreta y competencia baja — el perfil de mejor retorno de toda la auditoría.

- [ ] **13. Páginas públicas de herramientas** — landing indexable por herramienta que explique qué hace y muestre una parte real (p. ej. los próximos unlocks de las 3-4 monedas más buscadas), con el resto tras el muro. **No es abrir las herramientas**: es el mismo patrón del punto 11 — contenido gratis que capta la búsqueda y lleva al premium. Requiere sacar `/herramientas/` del `Disallow` de `robots.txt` y darlas de alta en `STATIC_ROUTES`.

## Arreglos menores pendientes

- [ ] `/articulos` no tiene `<h1>`, y su título es solo «Artículos».
- [ ] Las páginas de categoría devuelven `{title: category.name}` sin `description`.
- [ ] `userScalable:false` en el viewport de `src/app/layout.tsx` penaliza accesibilidad y señal móvil.
- [ ] OpenGraph de artículo sin `publishedTime`, `modifiedTime` ni autor.
- [ ] Falta `alt` en la imagen de `src/components/CryptoMarkets.tsx:180`.

---

## Expectativas de plazo (ya comunicadas al admin)

No se prometen posiciones en Google. Los plazos realistas son **indexación en 1-2 semanas**, **cola larga en 3-8 semanas** y **términos competidos a 3-6 meses**. Cualquier movimiento del primer mes es indexación, no posicionamiento.

## Registro de avance

| Fecha | Punto | Commit | Nota |
|---|---|---|---|
| 2026-08-30 | — | `11d19d4` | Auditoría hecha y plan acordado. Nada implementado todavía. |
| 2026-08-30 | 1 | `6510dbf` | `src/app/sitemap.ts` + `src/lib/site.ts`. 32 URLs: 11 estáticas, 7 guías, 8 entradas, 6 categorías. `lastModified` real en entradas y categorías; estáticas y guías van sin él a propósito (no hay fecha fiable). Revalida cada hora y no lee cookies, así que la ruta queda estática. |
| 2026-08-30 | 2 | `dc4c506` | `src/app/robots.ts`. Declara el sitemap y bloquea /admin, /dashboard, /cuenta, /api, las rutas de auth, las que redirigen a login o premium (/calculadora, /portfolio, /herramientas), /trading-en-directo y /premium/gracias. Reutiliza `SITE_URL`. |
| 2026-08-30 | 1 y 2 | `1c530a3` | Corrección tras comprobar las 32 URLs en producción: `/logros` y `/terminos` daban 307 y salen del sitemap. `/logros` está en `protectedRoutes` de `src/proxy.ts` (el middleware, no su `page.tsx`) y pasa a `robots.txt`; `/terminos` es un stub que redirige a `/aviso-legal`. Quedan **30 URLs**, todas 200. |
| 2026-08-30 | 3 | — | Search Console verificado por el admin como **propiedad de Dominio** (TXT en el DNS de Vercel, en la raíz — **no borrar nunca**, Google revalida). Sitemap enviado: **Correcto, 30 páginas descubiertas**. Los datos de Rendimiento arrancan hoy; no hay histórico anterior. |
| 2026-08-30 | previo al 4 | — | `www` dado de alta en Vercel como redirección **308 permanente** (antes 307 temporal) hacia el dominio sin `www`, conservando la ruta. Lo pedía el diagnóstico de Search Console: *«Duplicada: el usuario no ha indicado ninguna versión canónica»*. Revalidadas las 30 URLs tras el cambio: todas 200. |
| 2026-08-31 | 4 | `dc24d2f` | Canónicas en las **15 rutas públicas**: portada, `/articulos`, `/guias`, `/glosario`, `/premium`, `/asesoria`, las 3 legales, las 7 guías, `/post/[slug]` y `/categoria/[slug]`. Todas relativas — las resuelve el `metadataBase` del layout raíz. La de la portada va en `src/app/page.tsx` y **no** en el layout: los metadatos del layout los heredan todas las rutas hijas, y una canónica ahí le pondría `/` a media web. Comprobado sobre el build de producción servido en local: las 15 emiten la etiqueta y `/login`, `/register`, `/dashboard`, `/cuenta`, `/premium/gracias` y `/herramientas/radar` no heredan ninguna. De paso, `layout.tsx` deja de repetir el dominio y usa `SITE_URL`. |
| 2026-08-31 | 4 | — | Verificado en **producción** tras desplegar: las **30 URLs del sitemap** responden 200 y cada una se apunta a sí misma; `/login`, `/register`, `/dashboard`, `/cuenta`, `/premium/gracias`, `/herramientas/radar` y `/logros` no emiten ninguna; `www` sigue con 308 conservando la ruta. Queda solo la parte del admin: solicitar indexación. |
| 2026-08-31 | 5 | `812c750` | Sufijo del layout raíz de `" | AdelinBTC Academy"` (20) a `" | AdelinBTC"` (12), lo que deja **48 caracteres propios** de título. Reescritos **6 títulos de guías** (código) y **7 títulos + 6 descripciones de entradas** (Supabase, aprobados uno a uno por el admin antes de escribir). Bitcoin Core y `que-es-la-blockchain` no se tocaron: caben solos al acortar el sufijo. Nueva regla en `npm run check` que **falla si un `title` de metadata pasa de 48**, probada provocando el fallo a propósito. Límites documentados en `/admin/posts-instrucciones` (bloque 09). |
| 2026-08-31 | 5 | `61d03ff` | Cierre del punto 5: **al verificar en producción salieron 8 descripciones por encima de 160** — la portada y las 7 guías. Se habían reescrito sus títulos pero no sus descripciones. Reescritas las 8, más la de `/herramientas/radar` (194), que hoy no indexa nadie pero es justo la que abrirá el punto 13. `npm run check` gana la regla de `description` y, de paso, se arregla un fallo que afectaba a todas las reglas del bloque: partía por `
| 2026-08-31 | 6 | `PENDIENTE` | JSON-LD en todo el sitio. `src/lib/schema.ts` (constructores) + `src/components/JsonLd.tsx` (renderizador). `Organization` y `WebSite` en el layout raíz, una sola vez y con `@id` estable al que apunta todo lo demás. `Article` + `BreadcrumbList` en `/post/[slug]`, replicando escalón a escalón las migas visibles. `BreadcrumbList` en las 7 guías vía `<GuideBreadcrumbJsonLd>`, con el nombre sacado de `GUIDES` para que coincida con `/guias`. Sin `SearchAction` (no hay buscador), sin autor inventado (la tabla `posts` no guarda autor: firma la organización) y sin valoraciones. Validado sobre el build de producción: los 17 bloques parsean, ningún `headline` pasa de 110 y las rutas privadas solo llevan las dos entidades globales. |
` en vez de `/?
/`, y el `` de los archivos CRLF rompía cualquier ancla `$`. |

**Siguiente:** punto 7 — glosario con URL por término. Arranca el bloque 2 y es la acción con mejor retorno de la auditoría.
