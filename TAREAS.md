# Tareas pendientes

Lo que está por hacer y no cabe en `SEO-PLAN.md`, que va solo de posicionamiento.

Vive en el repo **a propósito**, igual que el plan de SEO: la memoria local de Claude (`~/.claude/`) no viaja entre ordenadores, así que lo que solo esté ahí se pierde en cuanto se cambia de máquina.

Al cerrar una tarea: marcar la casilla, anotar el commit, y llevar a `AGENTS.md` lo que cambie el día a día.

---

## 🔴 Bloqueante — está mal en producción ahora mismo

- [ ] **Datos del titular en `src/lib/legal.ts`.** Siguen con texto de relleno (`[Nombre y apellidos del titular]`, `[PFA o SRL…]`, `[CUI…]`, `[Domicilio…]`) y **se publican tal cual** en `/aviso-legal` y `/privacidad`. Identificar al prestador es una obligación legal, no un adorno. Lo tiene que dar el admin.

---

## Funcionalidades pedidas

### 1. Foro de preguntas y respuestas

Un espacio donde los usuarios pregunten y se respondan entre ellos, con el admin arbitrando.

**Por qué interesa, más allá de la comunidad:** es el único tipo de contenido que **crece sin que nadie lo escriba**. Cada pregunta bien titulada es una URL que responde a una búsqueda real, y Google tiene un tipo de dato estructurado propio para esto (`QAPage`). Es la vía más barata de multiplicar las URLs indexables del sitio, hoy 90.

**Con qué se conecta:**
- Los comentarios ya resuelven media infraestructura: aprobación por el admin, el trigger anti-spam de «un pendiente por persona» (`scripts/comments-one-pending.sql`) y las políticas de RLS. Conviene leerlo antes de empezar de cero.
- El rate limiting del tramo `escritura` ya cubriría los envíos (`src/lib/rate-limit.ts`).

**Preguntas para el admin, antes de escribir código:**
- ¿Preguntar es de Premium, de cuenta gratuita, o abierto? ¿Y leer?
- ¿Responde solo el admin o también otros usuarios?
- ¿Las preguntas pasan por aprobación antes de publicarse, como los comentarios?

⚠️ Si el foro es público e indexable, **modera antes de publicar**: una pregunta con spam o con un enlace a una estafa, indexada bajo tu dominio, hace más daño que las 90 URLs que ganas.

---

### 2. Niveles de usuarios

**Ojo: esto ya está prometido en la web.** El 05-09-2026 se encontró que nueve sitios anunciaban «retos y niveles» del Diario de Trading como si existieran; se cambiaron a «próximamente», pero la promesa sigue en pie, incluida la tabla comparativa de `/premium`. Cerrar esta tarea es lo que permite quitar ese «próximamente».

**Con qué se conecta:**
- Ya existe medio sistema: **16 logros** en `src/lib/logros.tsx` (ocho de actividad, uno de pago y uno por guía, derivados de `GUIDES`), rachas diarias, y la tabla `user_badges`. Los niveles serían la capa de encima, no algo nuevo.
- La tarjeta del dashboard y `/dashboard/logros` ya pintan esa lista: un nivel visible saldría en los dos sitios sin duplicar nada.

**Preguntas para el admin:**
- ¿El nivel sale de los logros, de la racha, de artículos leídos, o de una mezcla?
- ¿Da algo material (acceso, descuento) o es solo estatus? Si da algo material, hay que pensarlo con la suscripción delante.
- ¿Se ve entre usuarios —en los comentarios, por ejemplo— o es privado?

---

### 3. Fotos de perfil

Que cada usuario pueda subir su avatar.

**Dónde se vería, ya montado:** la barra superior enseña hoy la **inicial en una moneda naranja** (`src/components/NavSaludo.tsx`); ese es el hueco exacto donde entraría la foto, con la inicial como reserva para quien no suba ninguna. También en los comentarios, que hoy salen sin cara.

**Lo que hay que resolver sí o sí:**
- **Moderación.** Un avatar es contenido público bajo tu dominio. Hace falta decidir qué pasa con una foto inapropiada y cómo se retira.
- **Optimización.** Regla del sitio: WebP siempre, y aquí además recortado a un cuadrado pequeño (~256 px). Una foto de móvil sin tocar son varios MB por usuario.
- ⚠️ **La extensión del archivo se deriva hoy del nombre que manda el cliente**, cosa que ya señaló la auditoría de seguridad. Antes de abrir subidas a todos los usuarios hay que validar el tipo real del archivo, no fiarse de cómo se llame.
- Storage de Supabase: 1 GB en el plan gratuito. A 30 KB por avatar da de sobra, pero solo si se optimizan.

**Preguntas para el admin:**
- ¿Pueden subir foto todos o solo Premium?
- ¿Se aprueba antes de que se vea, o se publica y se retira si hay problema?

---

## Menor, y ya identificado

- [ ] **Fichas públicas que faltan.** Cuatro herramientas siguen sin página propia: calculadora de riesgo, watchlist, Mi Portfolio y Logros. Son las únicas que aún salen con candado en `/herramientas` y apagadas en el sidebar. La plantilla existe (`src/app/herramientas/detalle.css`) y el catálogo solo necesita su `paginaPublica`.
- [ ] **`BlogMobileMenu`** es la última lista de herramientas escrita a mano; debería salir del catálogo como el resto.
- [ ] **La tabla `rutina_diaria`** quedó huérfana al retirar la rutina diaria. Borrarla es opcional: `scripts/drop-rutina-diaria.sql`.
- [ ] **Separar `guias.css`**, que mezcla las tres primeras guías en 1200+ líneas (deuda conocida, ver `AGENTS.md`).
