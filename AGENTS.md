# AdelinBTC Academy — lo que hay que saber siempre

Este archivo **se carga en todas las sesiones**, así que solo contiene dos cosas:

1. **El enrutador** — qué vas a hacer y dónde están sus instrucciones.
2. **Los intocables** — las decisiones que se rompen solas si nadie las recuerda. Una línea cada una, con su puntero.

Todo lo demás vive en archivos que **se leen cuando tocan**. Es deliberado: un documento que lo cuenta todo se paga en cada petición, y acaba contando cosas que ya no son verdad.

---

## 1 · EL ENRUTADOR — antes de escribir una línea, abre lo que te toque

| Vas a hacer… | Lee **antes** de empezar |
|---|---|
| Una **guía** interactiva | `/admin/guias-instrucciones` |
| Una **liberación** de tokens | `/admin/liberaciones-instrucciones` |
| Un **término del diccionario**, corto o ampliado | [`PLANTILLA-DICCIONARIO.md`](./PLANTILLA-DICCIONARIO.md) |
| La **auditoría SEO** de lo que acabas de montar | [`AUDITORIA-SEO.md`](./AUDITORIA-SEO.md) · ver el punto 2 |
| Tocar el **bot de Telegram** | [`BOT.md`](./BOT.md) |
| Tocar el **limitador por IP**, el middleware (`src/proxy.ts`) o **añadir un webhook** | [`SEGURIDAD-RATE-LIMIT.md`](./SEGURIDAD-RATE-LIMIT.md) |
| Tocar **muro de pago, portfolios, legal, analítica, sitemap, robots, canónicas, JSON-LD o el catálogo de herramientas** | [`PLATAFORMA.md`](./PLATAFORMA.md) |
| Escribir **código**: CSS, tipos, hooks, guardarraíles | [`CODIGO.md`](./CODIGO.md) |
| Un **anuncio de Telegram con copy propio** | [`ANUNCIO-TELEGRAM.md`](./ANUNCIO-TELEGRAM.md) |
| Saber **qué toca ahora** · y **actualizarlo siempre** al cerrar algo | [`TAREAS.md`](./TAREAS.md) |

Las dos primeras filas son **la fuente de verdad** de su tipo de contenido: lo que diga el panel manda, y este archivo no las repite a propósito — repetirlas es cómo se desincronizan.

**Desde el 10-10-2026 la web es solo guías.** No hay entradas, noticias, categorías ni comentarios: se retiró todo el sistema, con sus tablas. `/post/…` y `/categoria/…` responden **410** (`src/lib/retiradas.ts`). No lo vuelvas a crear sin que el admin lo pida.

---

## 2 · 🔴 LA AUDITORÍA SEO SE OFRECE SIEMPRE

**No hay que recordárselo a nadie. Es parte de montar una guía, igual que las preguntas del principio.**

Al terminar de montar el contenido, **antes** de pedir la aprobación para publicar, se pregunta con estas palabras o equivalentes:

> ¿Empiezo la auditoría SEO de la guía?

En cuanto el admin diga que sí, se ejecuta **[`AUDITORIA-SEO.md`](./AUDITORIA-SEO.md) entero**, línea por línea, de la Fase 0 a la Fase 17, sobre esa guía. Son 18 fases —intención de búsqueda, hueco frente a los rivales, snippet, respuesta arriba del todo, encabezados, palabra clave con suelo y techo, legibilidad, E-E-A-T, enlazado saliente y entrante, datos estructurados, imágenes, rastreo, apoyos visuales y conversión— y **cada fase se corrige antes de pasar a la siguiente**.

Cuatro reglas del disparador:

1. **Se pregunta siempre**, aunque la guía sea corta o urgente. Una guía corta compite en Google igual que una de 3.000 palabras.
2. Si el admin dice que no, **se anota en el cierre que queda sin auditar**, para que conste.
3. Aplica también a **contenido existente que se reescriba a fondo**: cambiar la mitad del cuerpo es publicar otra página en la misma URL.
4. Los scripts van **al final** de la auditoría, no al principio. Confirman lo que ya has arreglado; **no lo descubren por ti**.

Por qué es más severo que en una web normal: Google clasifica el contenido sobre dinero, inversión e impuestos como **YMYL**, y le aplica el listón más alto de su sistema de evaluación. Aquí **todo** el contenido es YMYL.

---

## 3 · LOS INTOCABLES

Ninguno lo caza el compilador y todos se han roto, o han estado a punto, al menos una vez. **El detalle está en el archivo de la derecha; lo que no puede faltar es el aviso.**

### Contenido

| Regla | Detalle |
|---|---|
| **Nunca publiques una guía sin aprobación explícita.** Darla de alta en `GUIDES` y desplegar **la publica**, y el cron diario **la anuncia en el canal de Telegram**: no hay paso intermedio para echarse atrás | [`BOT.md`](./BOT.md) |
| **Todo término técnico va enlazado al diccionario en su primera aparición**, en toda guía. Si no existe, **se crea antes de publicar**. Es la que más se olvida, porque el texto «se entiende igual» | [`PLANTILLA-DICCIONARIO.md`](./PLANTILLA-DICCIONARIO.md) |
| **`term` no se cambia jamás**: es la clave de `saved_terms`, y tocarlo deja huérfanos los favoritos de todos los usuarios | [`PLANTILLA-DICCIONARIO.md`](./PLANTILLA-DICCIONARIO.md) |
| **Comprueba el destino antes de enlazarlo.** Un término sin `extended` da **404** y una guía que no esté en `GUIDES` no existe | paneles de `/admin` |

### Plataforma

| Regla | Detalle |
|---|---|
| **El catálogo y el temario públicos de los cursos se leen con `createAdminClientOpcional()`.** Si alguien lo «arregla», lo de pago vuelve a ser **404 e invisible** para Google y para los listados | [`PLATAFORMA.md`](./PLATAFORMA.md) |
| **En `portfolio_positions` y `dca_compras` no se añade ninguna policy de escritura.** El admin escribe con la clave de servicio desde la API. La clave anónima va en el navegador de cualquiera | [`PLATAFORMA.md`](./PLATAFORMA.md) |
| **El marco legal es RUMANO**, no español. El RGPD no cambia; las leyes nacionales sí | [`PLATAFORMA.md`](./PLATAFORMA.md) |
| **Ningún script de terceros con cookies fuera de `src/lib/consent.ts`.** Nada de Google se carga hasta que el visitante acepta | [`PLATAFORMA.md`](./PLATAFORMA.md) |
| **El sitio vive SIN `www`, y nunca al revés.** Vercel ofrece marcada una casilla que hace justo lo contrario | [`PLATAFORMA.md`](./PLATAFORMA.md) |
| **`robots.txt` bloquea POR PREFIJO.** Antes de elegir la URL de una página pública nueva, compárala con cada `Disallow`: que no coincida exactamente no basta, tiene que **no empezar igual** | [`PLATAFORMA.md`](./PLATAFORMA.md) |
| **Nunca una canónica en un `layout.tsx`.** En Next la heredan todas las rutas hijas, y le pone la misma URL a media web | [`PLATAFORMA.md`](./PLATAFORMA.md) |
| **No declares en JSON-LD nada que el visitante no pueda ver.** Google lo llama spam de datos estructurados | [`PLATAFORMA.md`](./PLATAFORMA.md) |
| **Nunca metas en el sitemap una ruta que redirige o exige sesión.** La protección vive en `src/proxy.ts`, así que mirar el `page.tsx` no basta | [`PLATAFORMA.md`](./PLATAFORMA.md) |
| **El catálogo de herramientas es fuente única** (`src/lib/herramientas.ts`). No hagas una segunda lista | [`PLATAFORMA.md`](./PLATAFORMA.md) |
| **Un solo descargo de responsabilidad**: `DisclaimerRiesgo.tsx`. Nunca escribas un aviso legal a mano en una página | [`PLATAFORMA.md`](./PLATAFORMA.md) |
| **Toda ruta que llame un sistema externo se da de alta en `EXENTAS`** (`src/lib/rate-limit.ts`). Si no, cae en el tramo normal y algún día devuelve 429 a Stripe, a Telegram o a Google: se pierde el pago o el mensaje, y no lo ve nadie | [`SEGURIDAD-RATE-LIMIT.md`](./SEGURIDAD-RATE-LIMIT.md) |
| **No prometas lo que el producto no hace.** Abre su código y compruébalo antes de escribirlo | [`PLATAFORMA.md`](./PLATAFORMA.md) |

### Código

| Regla | Detalle |
|---|---|
| **Nunca `any`, nunca `catch (err: any)`** | [`CODIGO.md`](./CODIGO.md) |
| **Nunca `new Date(x.toLocaleString(…))`** — relee la fecha en la zona de la máquina y la desplaza. Traicionero porque en UTC da bien | [`CODIGO.md`](./CODIGO.md) |
| **CSS por módulo.** Si una clase solo la usa una sección, va en el `.css` de esa sección, no en `globals.css` | [`CODIGO.md`](./CODIGO.md) |
| **Cada guía nueva, su propio `[slug].css`** — y su alta en `GUIDES`, o es invisible para Google | [`CODIGO.md`](./CODIGO.md) |
| Antes de usar una API de Next que no reconozcas, verifícala en https://nextjs.org/docs — **no en `node_modules`** | — |

### Proceso

| Regla | Detalle |
|---|---|
| **Al cerrar una tarea, bórrala de `TAREAS.md` en el MISMO commit.** No se marca la casilla: se borra, porque el historial ya lo guarda `git log -- TAREAS.md` y una tarea cerrada compite por la atención con las abiertas. Dejarlo «para luego» es no hacerlo | [`TAREAS.md`](./TAREAS.md) |
| **El SQL para Supabase se da COMPLETO, en un solo bloque en el chat**, listo para copiar y ejecutar entero. Nunca «ejecuta los bloques X e Y de tal archivo»: el admin copia y ejecuta siempre todo lo que se le da. Por eso ese SQL tiene que poder lanzarse entero y más de una vez sin romper nada (`if not exists`, `drop … if exists` antes de `add`, `on conflict do nothing`). Al script del repo se añade igual, como historial | — |
| **`TAREAS.md` es el estado real del proyecto, no un archivo de solo lectura.** Si está desactualizado manda a trabajar en cosas ya hechas — pasó el 07-09-2026 con la ficha de `exchange`, ya escrita y aún listada como «Primero» | [`TAREAS.md`](./TAREAS.md) |

---

## 4 · LOS TRES GUARDARRAÍLES

```bash
npm run check && npx tsc --noEmit        # el código. Lo corre solo el hook de pre-push
npm run check:seo -- guias/<slug> "<kw>" # la página servida. Fase 16 de la auditoría
npm run check:glosario                   # el texto de las fichas ampliadas
```

Los tres salen con código 1 si algo falla, y dicen qué y dónde. **Solo el primero está en el hook**: los otros necesitan credenciales o el servidor levantado, y en CI no hay secretos.

Dos advertencias que valen por todo lo demás:

- **Pásale a `check:seo` la palabra clave objetivo de la guía.** Sin ella la deduce del slug, y el slug y la consulta que se quiere ganar rara vez coinciden.
- **Salir en verde no es haber acabado.** `check:seo` mide lo que se puede contar, y **aprueba una página que cumple todas las métricas y no responde a nada**. El criterio está en las fases de [`AUDITORIA-SEO.md`](./AUDITORIA-SEO.md).

Lo que está hecho y cómo se hizo: [`SEO-PLAN.md`](./SEO-PLAN.md) — los 13 puntos, cerrados y verificados en producción. No hace falta abrirlo para trabajar.

---

## 5 · CÓMO SE MANTIENE ESTE ARCHIVO

**Solo entra aquí lo que se aplica en todas las sesiones.** Todo lo demás va a su archivo y aquí se queda una línea diciendo cuándo abrirlo.

Y una lección que costó una limpieza entera el 07-09-2026: **las cifras envejecen y se contradicen**. Este archivo llegó a decir 43, 49 y 50 términos del diccionario en tres párrafos distintos, y 30 URLs de sitemap cuando ya había 90. Donde puedas, **escribe el comando que da el número en vez del número**:

```bash
curl -s https://adelinacademy.com/sitemap.xml | grep -c "<loc>"
grep -c '  slug: "' src/lib/glosario.ts
```
