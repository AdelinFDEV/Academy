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

## Bloque 1 — Críticos (~1 día, desbloquean todo lo demás)

- [x] **1. Sitemap** — crear `src/app/sitemap.ts` leyendo entradas y guías de Supabase con su `lastModified`.
- [x] **2. Robots** — crear `src/app/robots.ts` con referencia al sitemap y bloqueo de `/admin`, `/dashboard`, `/api` y rutas de auth.
- [x] **3. Search Console** — verificar el dominio y enviar el sitemap. **Lo hace el admin**, Claude no tiene acceso. Hacerlo justo después de los puntos 1 y 2.
- [ ] **4. Canónicas** — `alternates.canonical` en el `generateMetadata` de cada ruta pública. Ya existe `metadataBase`, así que basta la ruta relativa.
- [ ] **5. Títulos y descripciones** — el sufijo `" | AdelinBTC Academy"` del layout raíz son 20 caracteres fijos y hace que **las 8 entradas se corten en Google** (la peor, 92 caracteres). Acortar el sufijo, reescribir los 8 títulos y las 6 descripciones que pasan de 160, y fijar los límites en `/admin/posts-instrucciones`.
- [ ] **6. Datos estructurados** — `Article` en entradas, `BreadcrumbList` en entradas y guías, `Organization` y `WebSite` en el layout raíz.

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

**Siguiente:** punto 4 — canónicas. Es todo código, lo hace Claude.
