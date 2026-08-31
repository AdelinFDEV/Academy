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

**Van hechos los puntos 1 a 8 de 12. Los ocho verificados en producción, no solo en local.** Cada uno tiene su commit en la tabla de avance del final de este archivo.

| # | Punto | Comprobado en producción |
|---|---|---|
| 1 | Sitemap | `/sitemap.xml` sirve **73 URLs**, todas responden 200 |
| 2 | Robots | `/robots.txt` declara el sitemap y bloquea lo privado |
| 3 | Search Console | Propiedad de **Dominio** verificada; sitemap aceptado |
| 4 | Canónicas | Cada URL del sitemap se apunta a sí misma; ninguna ruta privada hereda canónica |
| 5 | Títulos y descripciones | Sufijo de 20 → 12 caracteres; **ningún título pasa de 60 ni ninguna descripción de 160** |
| 6 | Datos estructurados | `Organization` + `WebSite` en todas las rutas, `Article` + `BreadcrumbList` en entradas, `BreadcrumbList` en guías. Todos parsean |
| 7 | Glosario con URL por término | **43 páginas nuevas** con `DefinedTerm`, canónica y ~200 palabras cada una |
| 8 | Enlazado interno | Las 8 entradas pasan de 1 enlace en total a **24**; los 14 destinos responden 200 |
| 9 | Página pilar | Verificado en **producción**: `/guias` pasa de **80 a 932 palabras** indexables, un solo `h1`, 10 enlaces internos que responden 200 e `ItemList` con las 7 guías |
| — | Extra | `www` → **308 permanente** → dominio sin `www`, conservando la ruta |

El resultado medible de todo esto: **el sitio ha pasado de 30 URLs indexables a 73**.

## Lo siguiente es el punto 10 — generación estática con revalidación

**Es el único punto que no es de contenido sino de velocidad**, y por eso conviene medir antes de tocar: la home tardaba 2,44 s el 30-08-2026.

La causa está diagnosticada: **casi todas las páginas públicas son dinámicas porque leen cookies de Supabase en servidor** para pintar la barra de navegación con el nombre del usuario. Eso obliga a renderizar en cada visita, incluso para quien no ha entrado nunca. En el `build` se ve claro: casi todo sale marcado con `ƒ` (dinámico) en vez de `○`.

La idea es separar lo público de lo personalizado, de modo que el contenido se genere estático con revalidación y solo la parte que depende del usuario se resuelva en cliente. Es el punto de más riesgo de romper algo de los que quedan: afecta a todas las páginas, no a una.

Detrás vienen el **11** (contenido gratuito de fiscalidad — son entradas nuevas, con las 3 preguntas obligatorias de `/admin/posts-instrucciones`) y el **12** (RSS).

## Cómo se trabaja esto — el ciclo, punto por punto

Se implementa **en orden y de uno en uno**. Para cada punto:

1. Medir el estado real antes de tocar nada. Las cifras de este plan se han equivocado ya dos veces (eran 43 términos y no 45; las guías también tenían los títulos cortados y no solo las entradas).
2. Implementar, y pasar `npm run check` y `npx tsc --noEmit`.
3. **Enseñar al admin lo que sea contenido suyo y esperar aprobación** antes de escribir en Supabase o publicar.
4. Commit y push. El hook de `pre-push` corre las comprobaciones y cancela el push si fallan.
5. **Verificar en producción tras el despliegue** (~1 minuto), no solo en local. Aquí han aparecido fallos reales que en local no se veían.
6. Marcar la casilla, anotar el commit en la tabla de avance, y **llevar a `AGENTS.md` lo que cambie el día a día**. Este archivo cuenta el progreso; aquel cuenta cómo funciona el SEO hoy, y es el que se lee al abrir sesión.

## ⛔ Pendiente del admin

Del plan SEO, **nada**. Las tres peticiones de indexación en Search Console (portada, `/articulos`, `/guias`) se hicieron el 31-08-2026, y no hay que pedir indexación de las 43 páginas nuevas del glosario: el sitemap las recoge solo en menos de una hora y la cuota es de unas 10 al día.

Fuera del plan SEO sí queda una cosa, y es legal, no de posicionamiento: **`LEGAL.titularNombre` en `src/lib/legal.ts` sigue con el texto de relleno `[Nombre y apellidos del titular]`**, y se ve así en producción en `/aviso-legal` y `/privacidad`. La LSSI obliga a identificar al titular con su nombre real. Hay que pedírselo al admin y sustituirlo; no se inventa.

## No tocar nunca

- **El registro TXT `google-site-verification=...`** en la raíz del DNS de Vercel. Google revalida cada cierto tiempo; si desaparece, se pierde la propiedad de Search Console.
- **La fila de `adelinacademy.com`** en Vercel → Project → Settings → Domains. Debe seguir en «Connect to an environment → Production». Solo la de `www` redirige.
- **La casilla de Vercel «Redirect apex domains to www» / «Include apex and www variants»**: viene marcada por defecto y hay que dejarla **desmarcada**. Invertiría el sitio y convertiría en redirección las 73 URLs que ya tiene Google.
- **El campo `term` de `src/lib/glosario.ts`**: es la clave con la que los usuarios guardan sus términos favoritos (tabla `saved_terms`). Cambiar ese texto deja huérfanos los guardados de todo el mundo.

## Comprobar en dos minutos que todo sigue en pie

Cuántas URLs sirve el sitemap — debe decir **73**:

```bash
curl -s https://adelinacademy.com/sitemap.xml | grep -c "<loc>"
```

Que ninguna de ellas redirija ni falle (silencio = correcto):

```bash
curl -s https://adelinacademy.com/sitemap.xml | grep -o '<loc>[^<]*</loc>' | sed 's|</\?loc>||g' | while read u; do c=$(curl -s -o /dev/null -w "%{http_code}" "$u"); [ "$c" != "200" ] && echo "$c $u"; done
```

Que la portada declara su canónica:

```bash
curl -s https://adelinacademy.com/ | grep -o '<link rel="canonical"[^>]*>'
```

Que un término del glosario existe y lleva sus datos estructurados:

```bash
curl -s https://adelinacademy.com/glosario/staking | grep -o 'DefinedTerm'
```

Que un término **sin** ampliar sigue devolviendo 404 — la salvaguarda contra el contenido escaso:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://adelinacademy.com/glosario/no-existe
```

## Dónde está cada cosa

| Archivo | Qué gobierna |
|---|---|
| `src/app/sitemap.ts` | Las 73 URLs. Revalida cada hora |
| `src/app/robots.ts` | Qué se rastrea y qué no |
| `src/lib/site.ts` | `SITE_URL` — el dominio, escrito **una sola vez** |
| `src/lib/schema.ts` | Los constructores de JSON-LD |
| `src/lib/glosario.ts` | Los 43 términos. Sin `extended` no hay URL |
| `src/lib/guides.ts` | El array `GUIDES`. Una guía que no esté aquí es invisible para Google |
| `scripts/check-code.mjs` | Los límites de 48 y 160 caracteres, entre otras reglas |
| `AGENTS.md` | **Cómo funciona el SEO del sitio hoy.** Lo que hay que leer antes de escribir nada |
| `/admin/posts-instrucciones` | Las reglas de una entrada nueva, incluido el enlazado interno (bloque 10) |

---

## Bloque 1 — Críticos (~1 día, desbloquean todo lo demás)

- [x] **1. Sitemap** — crear `src/app/sitemap.ts` leyendo entradas y guías de Supabase con su `lastModified`.
- [x] **2. Robots** — crear `src/app/robots.ts` con referencia al sitemap y bloqueo de `/admin`, `/dashboard`, `/api` y rutas de auth.
- [x] **3. Search Console** — verificar el dominio y enviar el sitemap. **Lo hace el admin**, Claude no tiene acceso. Hacerlo justo después de los puntos 1 y 2.
- [x] **4. Canónicas** — `alternates.canonical` en el `generateMetadata` de cada ruta pública. Ya existe `metadataBase`, así que basta la ruta relativa.
- [x] **5. Títulos y descripciones** — el sufijo `" | AdelinBTC Academy"` del layout raíz son 20 caracteres fijos y hace que **las 8 entradas se corten en Google** (la peor, 92 caracteres). Acortar el sufijo, reescribir los 8 títulos y las 6 descripciones que pasan de 160, y fijar los límites en `/admin/posts-instrucciones`. **Al medirlo aparecieron también las 7 guías cortadas** (fiscalidad, 101) y entraron en el mismo punto.
- [x] **6. Datos estructurados** — `Article` en entradas, `BreadcrumbList` en entradas y guías, `Organization` y `WebSite` en el layout raíz.

## Bloque 2 — Construcción (este trimestre)

- [x] **7. Glosario con URL por término** — `/glosario/[termino]` renderizado en servidor con esquema `DefinedTerm`. **Los 43 términos publicados** (son 43, no 45: el plan traía mal la cifra), en cuatro tandas aprobadas una a una por el admin.
- [x] **8. Enlazado interno** — 2-4 enlaces contextuales por entrada, y convertirlo en regla de `/admin/posts-instrucciones` para que las nuevas nazcan enlazadas.
- [x] **9. Página pilar de formación gratuita** — agrupa las 7 guías y compite por «aprender criptomonedas gratis». Se montó **sobre `/guias`**, no en una URL nueva, para no partir la fuerza entre dos páginas que compiten por lo mismo.
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
| 2026-08-31 | 6 | `8b6306f` | JSON-LD en todo el sitio. `src/lib/schema.ts` (constructores) + `src/components/JsonLd.tsx` (renderizador). `Organization` y `WebSite` en el layout raíz, una sola vez y con `@id` estable al que apunta todo lo demás. `Article` + `BreadcrumbList` en `/post/[slug]`, replicando escalón a escalón las migas visibles. `BreadcrumbList` en las 7 guías vía `<GuideBreadcrumbJsonLd>`, con el nombre sacado de `GUIDES` para que coincida con `/guias`. Sin `SearchAction` (no hay buscador), sin autor inventado (la tabla `posts` no guarda autor: firma la organización) y sin valoraciones. Validado sobre el build de producción: los 17 bloques parsean, ningún `headline` pasa de 110 y las rutas privadas solo llevan las dos entidades globales. |
| 2026-08-31 | 7 (1/4) | `d9a123e` | Infraestructura del glosario + tanda **Básicos** (12 términos). Los 43 términos salen de `GlosarioClient.tsx` a `src/lib/glosario.ts`, que ya sí pueden leer el sitemap y las páginas de servidor. Ruta `/glosario/[termino]` con `DefinedTerm` + `BreadcrumbList`, canónica y migas visibles. **Un término sin `extended` no existe como URL**: `dynamicParams = false` lo convierte en 404 y no entra en el sitemap, para no publicar 31 páginas escasas de golpe. Los `term` no se tocan — son la clave de `saved_terms`. Sitemap de 30 a 42 URLs. |
| 2026-08-31 | 7 (2/4) | `3cb0000` | Tanda **Trading**: 19 términos a 197 palabras de media. Tono deliberadamente cauto, porque todos rozan decisiones con dinero: DCA aclara que reduce el riesgo de elegir mal el momento y no el activo; FUD explica que la etiqueta se usa más para silenciar críticas legítimas que para señalar manipulación; HODL no se presenta como virtud; pump-and-dump desmonta que se pueda salir a tiempo. Verificados los 57 slugs de `seeAlso` contra la lista real. El glosario pasa a 31 de 43 términos publicados y el sitemap a 61 URLs. |
| 2026-08-31 | 7 (3-4/4) | `8e05edc` | Tandas **DeFi** (6) y **Seguridad** (6), a 213 palabras de media. En Seguridad el criterio cambia a propósito: son los términos donde el malentendido cuesta el dinero entero y sin vuelta atrás, así que cada uno dice explícitamente qué NO hacer — nadie legítimo pide la seed phrase, el 2FA por SMS es vulnerable a SIM swapping, el phishing moderno solo necesita una firma, la cold wallet se compra al fabricante. Cierra el punto 7: **43 de 43**, 8.734 palabras, 129 referencias cruzadas todas válidas y ningún término sin enlaces entrantes. |
| 2026-08-31 | 8 | `5c45875` | Enlazado interno. Las 8 entradas pasan de **1 enlace en total** a **24**, entre 2 y 4 cada una, repartidos entre el diccionario, las guías y otras entradas. Todas las anclas son palabras que **ya estaban en el texto**: no se ha reescrito ni una frase, y el script lo verifica comparando el texto sin etiquetas antes y después. Enlaces recíprocos entre Alpenglow y Agave, y entre Glamsterdam y Pasteur, que son las parejas de entradas que ya se citaban. La regla queda en `/admin/posts-instrucciones` (bloque 10 nuevo) y en la checklist, para que las entradas nuevas nazcan enlazadas. |
| 2026-08-31 | 9 | `e3ca28f` | Página pilar montada **sobre `/guias`**, no en una URL nueva: dos páginas compitiendo por las mismas búsquedas se quitan fuerza entre sí. La página pasa de **80 a 932 palabras** indexables. Se añaden un texto de entrada, un itinerario por nivel y cinco preguntas frecuentes. El `h1` de marca («Aprende crypto como nunca antes») **se conserva** por decisión del admin, y la keyword entra por el `title`, la `description` y los `h2`. Los nombres y tiempos del itinerario salen de `GUIDES`, no escritos a mano. Esquema `ItemList` con las 7 guías, en el mismo orden en que se ven. **Sin datos estructurados de FAQ a propósito**: Google dejó de mostrar ese resultado enriquecido salvo a sitios oficiales. |
` en vez de `/?
/`, y el `` de los archivos CRLF rompía cualquier ancla `$`. |

**Siguiente:** punto 7 — glosario con URL por término. Arranca el bloque 2 y es la acción con mejor retorno de la auditoría.
