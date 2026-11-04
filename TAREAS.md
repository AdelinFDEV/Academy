# Tareas pendientes

Lo que está por hacer y no cabe en `SEO-PLAN.md`, que va solo de posicionamiento.

Vive en el repo **a propósito**, igual que el plan de SEO: la memoria local de Claude (`~/.claude/`) no viaja entre ordenadores, así que lo que solo esté ahí se pierde en cuanto se cambia de máquina.

**Cómo se mantiene, y es lo que decide si sirve de algo:**

- **Al cerrar una tarea se BORRA de aquí**, no se marca. El historial ya lo guarda git (`git log -- TAREAS.md`); este archivo responde a una sola pregunta, «¿qué toca ahora?», y una tarea cerrada compite por la atención con las que siguen abiertas.
- Al borrarla, **su resultado tiene que quedar en algún sitio**: el commit, y si cambia el día a día, la línea que toque en `AGENTS.md` o en el documento de su área.
- **Nunca escribas aquí una cifra que envejece.** Escribe el comando que la calcula. Es la misma lección que costó una limpieza entera en `AGENTS.md`, donde llegó a haber tres recuentos distintos del diccionario en tres párrafos.

Y lo que obliga a lo anterior: **este archivo se mantiene al día siempre**. Si está desactualizado no es neutro —manda a trabajar en cosas ya hechas—, que es exactamente lo que pasó el 07-09-2026 con la ficha de `exchange`.

---

## 🔴 Bloqueante — está mal en producción ahora mismo

- [ ] **Datos del titular en `src/lib/legal.ts`.** Siguen con texto de relleno (`[Nombre y apellidos del titular]`, `[PFA o SRL…]`, `[CUI…]`, `[Domicilio…]`) y **se publican tal cual** en `/aviso-legal` y `/privacidad`. Identificar al prestador es una obligación legal, no un adorno. Lo tiene que dar el admin.
- [ ] **El bot se saltó un vídeo largo sin anunciarlo.** «¿Qué es Ondo Finance?» (`j9dd3d38fY0`, 10:38, subido el 07-10-2026 a las 15:00 UTC) no tiene fila en `content_announcements` ni salió en el canal gratuito, mientras que el anterior (`TBzOukSkW2g`, del 06-10) sí se anunció en el cron del 07-10 a las 04:54 UTC. El cron del 08-10 debía cogerlo y no lo hizo, y nada avisó. Mirar en los logs de Vercel la ejecución de `/api/cron/telegram-sync` del 08-10 y, en `anunciarVideos` (`src/lib/announce.ts`), qué lo descartó: `getLatestVideos(3)` (feed con caché, duración por API o raspando, corte en `MIN_DURATION_SECONDS`), la ventana de `esReciente` o un fallo al enviar. Para ver qué vídeos faltan por anunciar, comparar `select ref, announced_at from content_announcements where kind = 'video' order by announced_at desc limit 10;` con la lista de subidas del canal. Ya no afecta a los objetivos ni al calendario, que desde el 10-10-2026 cuentan desde la API de YouTube: solo al aviso en Telegram.

---

## Funcionalidades pedidas

### 00d. El bot inteligente del Diario de Trading (04-11-2026)

🔴 **Ya está anunciado y todavía no existe.** El admin pidió el 04-11-2026 que el slider de la portada diga del Diario «Con bot inteligente, hitos y registro completo» (`remate` de la diapositiva `diario` en `src/components/HeroSlider.tsx`), y que el bot se haga después. Hoy el diario no tiene ningún bot: calcula las estadísticas, el análisis y los hitos (`src/components/trading/`), y el bot de Telegram no se conecta con él.

- [ ] **Decidir con el admin qué hace el bot** antes de escribir código: si analiza las operaciones y da observaciones, si responde preguntas sobre ellas, si vive dentro del diario o en Telegram, y qué modelo usa.
- [ ] **Construirlo.**
- [ ] **Hasta que exista**, ningún otro texto (fichas `/herramientas/diario`, `/premium`, catálogo, bot de Telegram) debe prometerlo. Si se decide no hacerlo, quitar «bot inteligente» del slider.

### 00b. Un vídeo explicativo de cada herramienta, para el home (31-10-2026)

Pedido por el admin el 31-10-2026: grabar un vídeo corto de cada herramienta que enseñe cómo se usa, y colocarlo en el home.

- [ ] **Grabar los vídeos** (los graba el admin): Diario de Trading, Portfolio Adelin y Predicción de Precio, y los Cursos cuando se publique el primero.
- [ ] **Decidir dónde van en el home.** Lo natural es la sección Premium (`PremiumHome`, rehecha el 04-11-2026): cada tarjeta lleva a la ficha de su pieza, y el vídeo podría abrirse desde ella o ir en la propia ficha. La Predicción de Precio no está en esa sección: si lleva vídeo, necesita sitio propio.
- [ ] **Al montarlos**: alojarlos en YouTube y servirlos desde `youtube-nocookie.com`, que ya está permitido en la CSP (`next.config.ts`). Ojo: `GuideVideoEmbed` mete el iframe nada más cargar; en el home conviene una portada con botón de play que solo cargue el vídeo al pulsar, para no frenar la página.


### 00a. Ya no hay canal privado de Telegram (31-10-2026)

Decidido por el admin el 31-10-2026: **solo existe el canal gratuito**; Premium ya no da acceso a ningún canal privado. Del home ya está quitado. **Lo demás está sin tocar a propósito** —el admin lo hará más adelante— y sigue prometiendo o gestionando el canal privado:

- [ ] **El bot** (`src/lib/bot-menu.ts`): la ventaja «Canal privado» de Premium, los textos del plan gratuito y de Premium, y la vinculación de cuenta, que existía para dar acceso al canal. Leer `BOT.md` antes.
- [ ] **Los crons y webhooks**: `telegram-sync` (expulsa del canal privado a quien deja de ser Premium), el webhook de Stripe y el de Telegram, `/api/telegram/unlink`, `/api/admin/users/[id]` y el borrado de cuenta (`revokeChannelAccess`). Decidir qué queda de la vinculación con Telegram si ya no hay canal que abrir.
- [ ] **Los textos que lo prometen**: `/premium` (tabla, lista de precio y FAQ), `PremiumFeatureGrid`, la tarjeta de Premium del dashboard y la página de gracias tras pagar («Vincula tu Telegram»).
- [ ] **La cuenta y el dashboard**: `CuentaTelegramCard` (`/cuenta`) y `SiguientePasoTelegram` (dashboard), que piden vincular Telegram para entrar al canal.
- [ ] **Métricas**: `src/lib/crecimiento.ts` cuenta el canal privado.
- [ ] **Documentación**: `BOT.md` y `PLATAFORMA.md`.


### 000. Herramientas retiradas (31-10-2026)

Hecho en el código: fuera Watchlist, Liberaciones de Tokens, Radar Diario, Mi Portfolio, la Calculadora de Riesgo, la landing `/herramientas` y el Trading en Directo, con su CSS, sus APIs, sus textos y sus menús; sus URLs responden 410 (`src/lib/retiradas.ts`). Falta:

- [ ] **Reenviar el sitemap en Search Console** y comprobar en producción que `/herramientas`, `/radar-diario`, `/calendario-de-liberaciones` y `/trading-en-directo` dan 410.
- [ ] **Volver a registrar los comandos del bot** con `telegram-doctor` si alguno de los retirados sigue saliendo en el menú de Telegram.


### 00. La web es solo guías (empezado el 10-10-2026)

Decidido por el admin el 10-10-2026: **no hay noticias, ni entradas, ni categorías, ni comentarios**. La academia son **guías ultra detalladas de criptomonedas**. Ya está hecho en el código: retirado todo el sistema de entradas (páginas, admin, comentarios, «me gusta», guardados, RSS, avisos, noticias del bot, la métrica de Objetivos y los 5 logros de leer y guardar); `/post/…`, `/categoria/…` y `/rss.xml` responden 410 (`src/lib/retiradas.ts`) y 4 entradas redirigen a su guía (`next.config.ts`). Copia de todo en `backups/` (local, fuera de git). Falta:

- [ ] **Ejecutar el SQL que borra las tablas** de entradas y noticias y los logros retirados, **después** de desplegar el código (el admin lo tiene en el chat del 10-10-2026; está también al final de `scripts/create-objetivos.sql`).
- [ ] **Borrar las 12 portadas** de las entradas del bucket `media` de Supabase (empiezan por `17882…`; la lista exacta, en `backups/entradas-2026-10-10.json`).
- [ ] **Reenviar el sitemap en Search Console** y comprobar en producción que `/post/<cualquiera>`, `/categoria/<cualquiera>` y `/rss.xml` dan 410.
- [ ] **Plantilla común de guía de criptomoneda**, para que cada guía nueva sea contenido y no código: mismas secciones y diseño, y una «última revisión» visible.
- [ ] **CSS muerto en `src/app/globals.css`**: los estilos de la página de entrada (`.post-*`), el feed (`.feed-*`, `.hero-post-*`), los comentarios, la barra de categorías (`.cat-nav-*`), `/articulos` (`.articulos-*`), el índice y la barra de lectura (`.toc-*`, `.reading-progress*`) y lo del admin (`.admin-top-post*`, `.admin-donut*`, `.admin-bar-*`, `.users-reads`). No se pinta nada, pero pesa. Quitarlo con cuidado: algunos bloques comparten reglas con cosas vivas.

### 0. Objetivos y diario: fases 2 y 3

Hecho entre el 04 y el 05-10-2026, en `/admin/objetivos`: objetivos (repetibles, con historial, +1 y métricas automáticas) con el gran objetivo de 1.000 €/mes arriba; calendario de mes y de semana con panel del día y cierre del día; ideas por canal con tick; diario con intenciones, lo que afecta y motiva, y análisis por periodos largos; y Crecimiento con la actividad del mes. El admin eligió canales **YouTube, Web y Telegram** y **usar el bot**. Falta:

- [ ] **Fase 2 — el bot:** `/nota <texto>` e `/idea <texto>` guardan en `diario_notas` e `ideas` desde el móvil (la idea necesita canal: `/idea yt …`, `/idea web …`, `/idea tg …`, o preguntarlo); resumen diario con lo que toca hoy, lo retrasado y cómo van los objetivos, y que **pregunte si el día ha sido productivo y cuánto se ha ganado** (lo guarda en `dias_balance` / `ingresos_dia`, como el cierre del día del panel). En el plan Hobby cada cron corre una vez al día como mucho: aprovechar uno existente (el de noticias está en pausa). **El resumen va a las 22:00 de Rumanía** (decidido el 05-10-2026). Ojo: los crons de Vercel van en UTC y no cambian de hora, así que 22:00 es `0 20 * * *` en invierno (UTC+2, desde el 25-10-2026) y `0 19 * * *` en verano (UTC+3). Con uno fijo, medio año llega una hora antes o después; o se acepta, o se cambia a mano dos veces al año.
- [ ] **Suscriptores de YouTube exactos.** La YouTube Data API pública REDONDEA la cifra a tres cifras significativas (el 05-10-2026 daba 17.200 con 17.224 reales), así que la pestaña Crecimiento y los objetivos de suscriptores solo se mueven de 100 en 100. La solución es la **YouTube Analytics API**: con OAuth de la cuenta del canal da los suscriptores ganados y perdidos de cada día, exactos. Partir de un total exacto conocido (17.224 el 05-10-2026) y sumar el neto diario en el cron de las 04:00, guardándolo en `metricas_diarias`. Necesita: credenciales OAuth en Google Cloud, conectar la cuenta una vez y guardar el refresh token en Vercel.
- [ ] **Fase 3:** balance del domingo por el bot e ideas sugeridas a partir de las consultas de Search Console sin contenido.

### 0b. Cursos para Premium — el primero: fiscalidad cripto en España

La plataforma está hecha (06-10-2026): catálogo `/cursos`, ficha `/cursos/<slug>`, aula `/aula/<curso>` con ritmo y cronograma, lecciones con bloques interactivos, exámenes sorteados y corregidos en el servidor con bloqueo entre módulos, certificado verificable y logro en `/dashboard/logros`. El contenido se escribe en `scripts/cursos/<slug>/` y se sube con `scripts/subir-curso.mjs`. **Sin editor en /admin**, decisión del admin. Nota mínima 5; certificado = 40 % media de módulos + 60 % final; suspenso = 24 h de espera.

Curso de fiscalidad: estructura de 7 módulos y 24 lecciones subida como **borrador**; escritos el módulo 1 entero (3 lecciones + 15 preguntas) y la lección 2.1. Falta, en orden:

- [ ] **Escribir el resto**: lecciones 2.2 a 7.3, los bancos de preguntas de los módulos 2 a 7 (15 cada uno) y el del examen final (30). Cada dato fiscal, contrastado con la AEAT, la DGT o el BOE.
- [ ] **Crear en el diccionario** los términos fiscales que el curso necesita enlazar y que aún no existen: FIFO, permuta, ganancia patrimonial, base del ahorro, airdrop, lending, modelo 721… (regla del diccionario: antes de publicar).
- [ ] **Imágenes**: portada y las ilustraciones que hagan falta, con prompts de Gemini, en WebP.
- [ ] **Comprobar DAC8 en el BOE** antes de publicar: en octubre de 2026 la orden de los modelos 042, 172, 175 y 721 seguía en tramitación (lección «Lo que Hacienda ya sabe de ti»).
- [ ] **Escribir `CURSOS.md`** con el diseño definitivo: estructura de archivos, catálogo de bloques, reglas de examen y cómo se publica.
- [ ] **Al publicarlo** (con el «sí» del admin): `"published": true` en `curso.json` y volver a subir; `cursos` pasa a `acceso: "premium"` en `src/lib/herramientas.ts` (con su `tag` y su `resumen`), `soon: false` en el rail de `src/app/dashboard/page.tsx`, y ofrecer la auditoría SEO de la ficha.

### 00c. Foto de portada para cada guía (31-10-2026)

Pedido por el admin el 31-10-2026. El código ya está listo: cada guía admite el campo `portada` en `src/lib/guides.ts` y `GuiaPortada` la pinta en la sección de guías del home y en el listado `/guias`. Mientras falte, sale una portada provisional con la inicial de la guía.

- [ ] **Hacer una imagen por guía**: hoy son las que salen con `grep -c "  slug: \"" src/lib/guides.ts`. Horizontal (16:9), y que funcione también recortada en miniatura, que es como sale en las filas del home.
- [ ] **Convertirlas a WebP** a 1.600 px de ancho y calidad 82, como toda portada, y guardarlas en `public/guias/<slug>.webp`.
- [ ] **Darlas de alta** con `portada: "/guias/<slug>.webp"` en cada guía de `GUIDES`. Con eso salen solas en el home y en `/guias`.

### 1. Foro completo

**Pedido por el admin el 31-10-2026: un foro completo**, no solo preguntas y respuestas. Un espacio donde los usuarios pregunten, debatan y se respondan entre ellos, con el admin arbitrando. Antes de escribir código hay que cerrar con el admin qué entra en «completo»: categorías o temas (por criptomoneda, por herramienta, trading, fiscalidad…), hilos con respuestas, votos o «me gusta», respuesta marcada como buena, perfiles con sus logros, notificaciones de respuesta, búsqueda y moderación (reportes, bloqueo, edición y borrado).

Desde el 31-10-2026 ya no hay canal privado de Telegram (tarea 00a): el foro puede ser justo el sitio de la comunidad que ese canal dejaba de ser.

**Por qué interesa, más allá de la comunidad:** es el único tipo de contenido que **crece sin que nadie lo escriba**. Cada pregunta bien titulada es una URL que responde a una búsqueda real, y Google tiene un tipo de dato estructurado propio para esto (`QAPage`). Es la vía más barata de multiplicar las URLs indexables del sitio (el recuento actual: `curl -s https://adelinacademy.com/sitemap.xml | grep -c "<loc>"`).

**Con qué se conecta:**
- Los comentarios de las entradas (retirados el 10-10-2026) resolvían media infraestructura, y su script sigue en el repo como referencia: aprobación por el admin, el trigger anti-spam de «un pendiente por persona» (`scripts/comments-one-pending.sql`) y las políticas de RLS. Conviene leerlo antes de empezar de cero.
- El rate limiting del tramo `escritura` ya cubriría los envíos (`src/lib/rate-limit.ts`).

**Preguntas para el admin, antes de escribir código:**
- ¿Preguntar es de Premium, de cuenta gratuita, o abierto? ¿Y leer?
- ¿Responde solo el admin o también otros usuarios?
- ¿Las preguntas pasan por aprobación antes de publicarse, como los comentarios?
- ¿Qué parte del foro es de Premium, si alguna? Hoy todo lo gratuito es lectura libre y la cuenta solo se pide para participar (como el quiz de las guías).

⚠️ Si el foro es público e indexable, **modera antes de publicar**: una pregunta con spam o con un enlace a una estafa, indexada bajo tu dominio, hace más daño que las URLs que ganas.

---

### 2. Niveles de usuarios

Niveles de usuario **en toda la web**. No confundir con los hitos del Diario de Trading, que ya existen.

**Lo del diario está cerrado (26-09-2026).** La web prometía «retos y niveles» del diario como «próximamente». El admin decidió que los hitos cumplen esa promesa (`src/components/trading/TjMilestones.tsx`: siete familias con niveles y el mismo aviso que los logros), y los textos dicen ya «hitos con niveles» en el catálogo, el bot, `/premium` y la ficha `/herramientas/diario`. No hay «retos»: que no se vuelvan a anunciar. Desde el 26-09-2026 los hitos también son logros: el servidor los recalcula desde las operaciones (`src/lib/diarioLogros.ts`) y guarda una fila por nivel en `user_badges` (`diario-<hito>-<nivel>`), así que salen en `/dashboard/logros` y en la tarjeta del panel. Si esta tarea llega a calcular un nivel de usuario a partir de los logros, esos niveles ya están ahí.

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

### 4. El diccionario en profundidad — plantarle cara a Binance

El recuento y qué fichas están ya en profundidad **no se escriben aquí, se preguntan**:

```bash
npm run check:glosario
```

La mayoría siguen siendo definiciones cortas de ~200 palabras. Las páginas de Binance Academy o Bit2Me para esos mismos términos rondan las **1.000-2.500**. Esa distancia es la razón de estar en posición 33 y no en la 5.

**El objetivo final es que todas tengan una ficha capaz de competir de tú a tú.** Pero no de golpe, y por un motivo que no es la pereza: ampliar cincuenta a la vez lleva a rellenar, y **una ficha larga y hueca posiciona PEOR que la corta de hoy**.

#### Por dónde empezar: lo que Google ya te está mandando

Datos reales de Search Console, del 29 de agosto al 3 de septiembre de 2026 (46 impresiones, 7 clics, posición media 33,7). **Cinco de las once consultas del sitio son definiciones**, y eso con las fichas cortas.

**Las tres que ya recibían impresiones están hechas**, y el recuento no se escribe aquí: sale de `npm run check:glosario`.

La siguiente tanda **sale del hilo que ya funciona**, no de adivinar: la consulta más buscada del sitio es «curso de fiscalidad sobre criptomonedas» (6 impresiones) y también aparece «cointracking hacienda». Es decir, el ángulo fiscal español tira. Los términos que lo tocan —`pnl`, `market-cap`, `oferta-circulante`, `staking`— son los siguientes candidatos, y `pnl` el primero: es el que más se confunde con el que se acaba de ampliar.

⚠️ **Antes de escribir la siguiente, vuelve a mirar Search Console.** Con tres fichas profundas publicadas, los datos de agosto ya no son los que mandan.

**Regla de selección, y es la importante:** a partir de la cuarta ficha, **el orden lo decide Search Console, no la intuición**. Rendimiento → Consultas, y se amplían las que ya tengan impresiones. Ampliar un término que nadie busca es trabajo perdido por bueno que quede.

#### Las reglas para que Google no lo lea como relleno

Están **verificadas por `npm run check:glosario`**, que se niega a dar por buena una ficha que no las cumpla. Se aplican a partir de 450 palabras, así que las cortas de hoy no dan error: no se exige reescribirlas todas, solo que la que se amplíe se amplíe bien.

| Regla | Mínimo | Por qué |
|---|---|---|
| **Longitud** | 800-2.000 palabras | Por debajo no compite; por encima casi siempre sobra texto |
| **Estructura** | ≥ 3 `<h2>` | Un muro de párrafos no lo lee nadie, y Google no sabe de qué va cada parte |
| **Números** | al menos un dato o ejemplo con cifras | Cualquiera define «apalancamiento»; pocos ponen la cuenta. Es lo que no tiene el texto genérico |
| **Enlaces internos** | ≥ 3 | Es lo que convierte fichas sueltas en un cuerpo |
| **Apoyo visual** | 1 `.prose-chart`, tabla o `.prose-callout` | La misma exigencia que el resto del contenido |
| **Sin repetir la definición corta** | literal prohibida | La página ya muestra las dos: repetirla es duplicado interno |
| **Densidad del término** | < 2,5 % | Repetirlo en cada frase es la señal de relleno más vieja, y hoy penaliza |
| **Sin frases calcadas** | 0 entre fichas y 0 dentro | Reciclar párrafos al ampliar cincuenta es el atajo evidente, y es duplicado bajo tu propio dominio |

#### Y lo que ningún script puede comprobar

El guardarraíl mide señales, no calidad. Lo que de verdad separa tu ficha de la de Binance:

1. **El ángulo español.** Binance escribe para el mundo. Tú puedes hablar de Hacienda, del modelo 721, de cómo tributa eso en España. Es lo que ya te está trayendo la consulta más buscada.
2. **El error típico.** La estructura que ya usan tus fichas —qué es / por qué importa / **error típico**— es justo lo que no tienen las webs grandes, que se quedan en la definición.
3. **Números tuyos.** Un ejemplo con cifras reales de una operación vale más que tres párrafos de teoría.
4. **Escribir para quien empieza.** Es el lector al que apunta la academia, y el que peor tratan las webs de los exchanges.

⚠️ **No ampliar por lotes.** Una ficha, publicarla, y a la siguiente. Si se escriben diez seguidas se acaba reciclando estructura y frases sin darse cuenta — y eso es precisamente lo que el script caza.

---

## Menor, y ya identificado

- [ ] **Revisar la indexación a partir del 17-10-2026.** El 03-10-2026 solo 47 de las URLs del sitemap estaban indexadas (las que salgan en Search Console → Páginas). Se pidió a mano la indexación de diez: `/premium`, las guías `hyperliquid`, `render` y `worldcoin` (las dos primeras Google ni las conocía), `/calculadora`, `/categoria/fiscalidad`, las entradas `actualizacion-xrp-ledger-2026` y `staking-airdrops-impuestos-espana`, y las fichas `pnl` y `staking`. Comprobar cuáles han entrado. **`staking-airdrops-impuestos-espana` es distinta**: Google la leyó y decidió no indexarla («Rastreada: actualmente sin indexar»), que es una señal de calidad; si sigue fuera, pasarle la auditoría SEO. Mirar también el CTR del título nuevo de `/glosario/atl`.
- [ ] **Ficha pública de Logros.** Es la única de las cuatro herramientas sin página propia (Diario y Portfolio la tienen; la Predicción de Precio se usa sin cuenta). La plantilla existe (`src/app/herramientas/detalle.css`) y el catálogo solo necesita su `paginaPublica`.
