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

---

## Funcionalidades pedidas

### 00c. SEO del Diario de Trading: lo que falta (10-11-2026)

Hecho el 10-11-2026: la ficha `/herramientas/diario` tiene título y descripción centrados en «diario de trading» (sin «Nova», que no se busca), la respuesta «Qué es un diario de trading» arriba, cuatro preguntas nuevas (qué es, si es gratis, por qué no un Excel, si usa IA: **no**, y así se dice) y su `WebApplication` con el precio de Stripe en el JSON-LD. Términos nuevos en el diccionario: `diario-de-trading` y `win-rate`, enlazados desde `revenge-trading` y `efecto-disposicion`. Guía nueva y gratuita `/guias/como-hacer-un-diario-de-trading`, con calculadora de R y esperanza, quiz y logro «Bitácora al Día». **Nunca se anuncia el Diario como «con IA»**: Nova son reglas. Falta, en orden:

- [ ] **Capturas reales del Diario** (las pasa el admin) para la ficha, con su `alt`: hoy todo son maquetas decorativas y Google Imágenes no ve nada.
- [ ] **Una experiencia propia en la guía** (fase 8 de la auditoría, la única que no se puede escribir sin el admin): una operación suya apuntada, un error que el diario le enseñó o una captura de su propio diario. Hoy todo el ejemplo es inventado y así lo dice.
- [ ] **`check:seo` de las demás guías** con el script corregido el 10-11-2026 (antes se saltaba los `<p>` con clase). Como control, `guias/xrp "xrp"` da tres fallos que ya estaban: densidad 2,69 % (techo 2,5), una frase de más de 40 palabras y un solo enlace entrante (huérfana).
- [ ] **Mirar en Search Console** qué consultas trae `/herramientas/diario` a las 4-6 semanas del despliegue, y ajustar la palabra clave a los datos.

### 00d. Nova, el bot del Diario: siguientes pasos (06-11-2026)

Hecho el 06-11-2026 (versión 1): **Nova** vive en la cabecera del Resumen (`TjBot.tsx`, motor en `tjNova.ts`). Son reglas sobre los datos, sin IA. Da un **pulso** de 0 a 100 (riesgo, resultados, emociones y constancia, sobre lo reciente), prioriza sus mensajes (lo urgente sube a «Lo más importante»), propone acciones con botón y analiza hoy, sensaciones y su efecto en el dinero, tendencia del ánimo, rachas, riesgo, revancha, sobreoperar, caída desde el máximo y nuevos máximos, forma reciente, franjas horarias, hitos y las lecturas de `buildInsights`/`welcomeReading`. El personaje (`NovaHead.tsx`) es una cabeza que vuela por su espacio bajo el saludo, girándose en continuo; hace una actividad (dormir, pelota, trading, estudiar, música) durante 10 minutos o hasta que le interrumpan, y luego otra; cambia de cara según cómo va el usuario y se alegra al pasarle el ratón. La frase corta junto a él está quitada de momento (el motor sigue calculando `teasers`).

Desde el 07-11-2026 **se rehace entero con cada dato nuevo** (operación, ánimo, capital, hito) y lo primero que hace es reaccionar a lo último apuntado; cada capítulo tiene un tope de mensajes y «Lo más importante» se elige antes de recortar. Fuera del Diario vive en la barra, junto a «Diario de Trading» (`NovaNav.tsx`), y vuela entre la barra y su habitación (`novaVuelo.tsx`).

Hecho el 10-11-2026 (versión 2 del motor): `tjNova.ts` tiene tres capas, **lectura** (los hechos, una vez), **memoria** y **reglas**. La memoria no guarda nada: **vuelve a leer el diario tal como estaba hace 7 y 30 días y el lunes**, y compara. De ahí salen el aviso «Sigue igual» (un problema que ya vio hace una semana pesa más), el reconocimiento «lo has corregido» y el **objetivo de la semana** (el área más floja el lunes, de las cuatro que evalúa por dentro: riesgo, resultados, emociones y constancia, medido con lo apuntado desde entonces: capítulo «Tu objetivo de la semana»). **El «pulso» de 0 a 100 se retiró ese mismo día** (el admin: confundía): ya no sale en el popup, en la barra, en las fichas ni en Premium, y el bocadillo **no lleva scroll** (tres mensajes por capítulo como mucho). Habilidades nuevas: días seguidos en verde/rojo, la semana frente a la anterior, tu mejor y peor estrategia reciente, operaciones sin riesgo apuntado y la lista «antes de tu próxima sesión». Cuando el análisis cambia, Nova lo **anuncia** (se gira y saca un bocadillo con la frase principal; el punto rojo dice cuántas cosas nuevas hay) y la barra de la web enseña el resumen (`nova-resumen` en localStorage). La cabeza (`NovaHead.tsx`), la habitación (`NovaRoom.tsx` + `nova-room.css`), el popup y los vuelos (con estela, `NovaEstela` en `novaVuelo.tsx`) se rehicieron ese mismo día. Falta:

- [ ] **Ver con el admin si se le añade IA** encima de las reglas (por ejemplo, que redacte el resumen o responda preguntas), y con qué modelo y coste.
- [ ] **Antes de anunciarlo en las fichas** (`/herramientas/diario`, `/premium`), abrir `tjNova.ts` y prometer solo lo que hace.

### 00b. Un vídeo explicativo de cada herramienta, para el home (31-10-2026)

Pedido por el admin el 31-10-2026: grabar un vídeo corto de cada herramienta que enseñe cómo se usa, y colocarlo en el home.

- [ ] **Grabar los vídeos** (los graba el admin): Diario de Trading, Portfolio Adelin, Predicción de Precio y los Cursos.
- [ ] **Decidir dónde van en el home.** Lo natural es la sección Premium (`PremiumHome`, rehecha el 08-11-2026 como bento con FAQ): cada celda lleva a la ficha de su pieza, y el vídeo podría abrirse desde ella o ir en la propia ficha. La Predicción de Precio solo sale ahí como enlace en la franja «Gratis»: si lleva vídeo, necesita sitio propio.
- [ ] **Al montarlos**: alojarlos en YouTube y servirlos desde `youtube-nocookie.com`, que ya está permitido en la CSP (`next.config.ts`). Ojo: `GuideVideoEmbed` mete el iframe nada más cargar; en el home conviene una portada con botón de play que solo cargue el vídeo al pulsar, para no frenar la página.


### 00a. Telegram, retirado entero (05-11-2026)

Decidido por el admin el 05-11-2026: **no hay Telegram en ningún sitio**. Hecho en el código: fuera el bot (webhook y comandos), la vinculación de cuentas (`/api/telegram/*`, la tarjeta de `/cuenta` y el aviso del dashboard), los crons `telegram-sync` y `promo-premium`, los avisos al admin, los avisos de guías y vídeos (`announce.ts`), `/admin/comunidad`, Telegram en `/admin/premium` y en Objetivos (métrica, canal de ideas y calendario, gráficas de Crecimiento), los enlaces del pie y de redes, los textos de Premium y de la página de gracias, `BOT.md` y `ANUNCIO-TELEGRAM.md`. Lo que no era de Telegram y vivía en su cron (la foto diaria de YouTube y la red de seguridad de los cobros de Stripe) pasó a `/api/cron/diario`. Copia de todos los datos en `backups/telegram-2026-11-05/` (local, fuera de git). **El SQL que borra sus tablas y columnas está ejecutado** (comprobado en Supabase el 12-11-2026: ni las 8 tablas ni las 3 columnas de `profiles` existen). Falta:

- [ ] **Quitar las variables de Telegram en Vercel**: todas las `TELEGRAM_*` (token del bot, ids de canal, enlace de invitación, secreto del webhook…). Ya no las lee nadie. Y la `TELEGRAM_BOT_TOKEN` que sigue en el `.env.local` de cada ordenador.
- [ ] **Apagar el bot en Telegram**: borrar su webhook (`deleteWebhook`) o el bot entero desde @BotFather, y decidir qué pasa con los canales (cerrarlos o dejar un último mensaje que lleve a la web).
- [ ] **El aviso de que se acaba el Premium** iba por Telegram a quien había cancelado y le quedaban 3 días. Ya no existe: decidir si se manda por email (`cancel_warning_period_end` en `profiles` sigue sirviendo para no repetirlo).
- [ ] **Pedido por el admin el 05-11-2026: revisar la seguridad y que todo funcione solo desde la web, ahora que no hay Telegram.**
  - **Gestionar la cuenta desde el dashboard:** el usuario tiene que poder hacer ahí todo lo que antes pasaba por el bot o por Telegram: ver su plan, renovar o cancelar Premium (portal de Stripe), cambiar contraseña y 2FA, borrar su cuenta y escribir a soporte. Hecho el 06-11-2026: todo vive en «Mi perfil» (`/dashboard/perfil`) y `/cuenta` redirige allí; el portal de Stripe vuelve a `/dashboard/perfil#suscripcion`. Queda revisar que el flujo entero funciona sin Telegram (sobre todo renovar y cancelar).
  - **Seguridad:** repasar las rutas que tocaban Telegram (webhook de Stripe, borrado de cuenta, cambio de rol desde `/admin/users`) y que el resto sigue protegido (RLS de `profiles`, `CRON_SECRET` del cron nuevo, limitador).
  - **Ni una mención ni lógica de Telegram:** buscar en el código, los textos, el SQL, las variables de entorno y los emails (`grep -rni telegram src scripts *.md`) y que no quede nada que dependa de él. Lo que sí queda a propósito: comentarios que explican que se retiró y los scripts SQL históricos.

### 000. Herramientas retiradas (31-10-2026)

Hecho en el código: fuera Watchlist, Liberaciones de Tokens, Radar Diario, Mi Portfolio, la Calculadora de Riesgo, la landing `/herramientas` y el Trading en Directo, con su CSS, sus APIs, sus textos y sus menús; sus URLs responden 410 (`src/lib/retiradas.ts`). Falta:

- [ ] **Borrar de Google el rastro del Trading en Directo** (pedido por el admin el 08-11-2026).
  - **Por qué:** el servicio ya no existe y no se ofrece, y no se puede anunciar en ningún sitio (`AGENTS.md`). Pero el 08-11-2026, al buscar la web en Google, debajo de la portada seguían saliendo como enlaces destacados «Trading en Directo» y «Herramientas de trading e…» (la landing `/herramientas`, también retirada). Quien llega por ahí cree que el servicio sigue, pulsa y se encuentra «Esta página ya no existe». Es una promesa falsa en el escaparate más visible de la web, y el admin la quiere fuera.
  - **Lo que ya está hecho, y no hay que repetir:** en la web no queda nada. Comprobado el 08-11-2026 en producción: `/trading-en-directo`, `/herramientas`, `/radar-diario` y `/calendario-de-liberaciones` responden **410 Gone** con `X-Robots-Tag: noindex` (`src/lib/retiradas.ts` + `src/proxy.ts`), ninguna está en el sitemap, el código del servicio se borró el 31-10-2026 y la última frase que hablaba de «operativa en directo» (`TerminoVideo.tsx`) se cambió ese día. Lo que enseña Google es su caché de antes del 31-10.
  - **Lo que falta, y solo puede hacerlo el admin desde Search Console** (Claude no tiene acceso):
    1. *Indexación → Retiradas → Nueva solicitud → Quitar temporalmente la URL*, una por una: `https://adelinacademy.com/trading-en-directo` y `https://adelinacademy.com/herramientas`. Las saca de los resultados en uno o dos días; sin esto, Google tarda semanas en volver a pasar.
    2. *Sitemaps*: reenviar `sitemap.xml`.
    3. Opcional: *Inspección de URLs* de cada una para confirmar que Google ya ve el 410.
  - **Cómo se cierra:** buscar `site:adelinacademy.com directo` y `site:adelinacademy.com herramientas` en Google. Si no sale ninguna de las dos, se borra esta tarea. La retirada temporal dura unos seis meses; para entonces el 410 ya las habrá sacado para siempre.
  - **Ligado:** el SQL que quita la variante de aviso `directo` de `cursos.aviso` (al final de `scripts/create-cursos.sql`). Ningún curso la usa (comprobado el 12-11-2026), pero la regla de la tabla no se puede leer desde la API: si no consta que se ejecutó, relanzar esas últimas líneas, que son idempotentes.


### 00. La web es solo guías (empezado el 10-10-2026)

Decidido por el admin el 10-10-2026: **no hay noticias, ni entradas, ni categorías, ni comentarios**. La academia son **guías ultra detalladas de criptomonedas**. Ya está hecho en el código: retirado todo el sistema de entradas (páginas, admin, comentarios, «me gusta», guardados, RSS, avisos, noticias del bot, la métrica de Objetivos y los 5 logros de leer y guardar); `/post/…`, `/categoria/…` y `/rss.xml` responden 410 (`src/lib/retiradas.ts`) y 4 entradas redirigen a su guía (`next.config.ts`). Copia de todo en `backups/` (local, fuera de git). **El SQL que borra sus tablas y los logros retirados está ejecutado**, y `/post/…`, `/categoria/…` y `/rss.xml` dan 410 en producción y no están en el sitemap (comprobado el 12-11-2026). Falta:

- [ ] **Borrar las 11 portadas** de las entradas del bucket `media` de Supabase (empiezan por `17882…`; la lista exacta, en `backups/entradas-2026-10-10.json`). El 12-11-2026 seguían las 11 y ningún archivo del código las usa.
- [ ] **Reenviar el sitemap en Search Console.**
- [ ] **Plantilla común de guía de criptomoneda**, para que cada guía nueva sea contenido y no código: mismas secciones y diseño, y una «última revisión» visible.
- [ ] **CSS muerto en `src/app/globals.css`**: los estilos de la página de entrada (`.post-*`), el feed (`.feed-*`, `.hero-post-*`), los comentarios, la barra de categorías (`.cat-nav-*`), `/articulos` (`.articulos-*`), el índice y la barra de lectura (`.toc-*`, `.reading-progress*`) y lo del admin (`.admin-top-post*`, `.admin-donut*`, `.admin-bar-*`, `.users-reads`). No se pinta nada, pero pesa. Quitarlo con cuidado: algunos bloques comparten reglas con cosas vivas.

### 0. Objetivos: lo que falta

Hecho entre el 04 y el 05-10-2026, en `/admin/objetivos`: objetivos (repetibles, con historial, +1 y métricas automáticas) con el gran objetivo de 1.000 €/mes arriba; calendario de mes y de semana con panel del día y cierre del día; ideas por canal con tick; diario con intenciones, lo que afecta y motiva, y análisis por periodos largos; y Crecimiento con la actividad del mes. Los canales son **YouTube y Web**. Las fases que dependían del bot de Telegram (notas e ideas desde el móvil, resumen diario y balance del domingo) se cayeron con él el 05-11-2026. Falta:

- [ ] **Suscriptores de YouTube exactos.** La YouTube Data API pública REDONDEA la cifra a tres cifras significativas (el 05-10-2026 daba 17.200 con 17.224 reales), así que la pestaña Crecimiento y los objetivos de suscriptores solo se mueven de 100 en 100. La solución es la **YouTube Analytics API**: con OAuth de la cuenta del canal da los suscriptores ganados y perdidos de cada día, exactos. Partir de un total exacto conocido (17.224 el 05-10-2026) y sumar el neto diario en el cron de las 04:00, guardándolo en `metricas_diarias`. Necesita: credenciales OAuth en Google Cloud, conectar la cuenta una vez y guardar el refresh token en Vercel.
- [ ] **Ideas sugeridas** en Objetivos a partir de las consultas de Search Console que aún no tienen contenido.

### 0b. Cursos para Premium — el primero: fiscalidad cripto en España

La plataforma está hecha (06-10-2026): catálogo `/cursos`, ficha `/cursos/<slug>`, aula `/aula/<curso>` con ritmo y cronograma, lecciones con bloques interactivos, exámenes sorteados y corregidos en el servidor con bloqueo entre módulos, certificado verificable y logro en `/dashboard/logros`. El contenido se escribe en `scripts/cursos/<slug>/` y se sube con `scripts/subir-curso.mjs`. **Sin editor en /admin**, decisión del admin. Nota mínima 5; certificado = 40 % media de módulos + 60 % final; suspenso = 24 h de espera.

Curso de fiscalidad: estructura de 7 módulos y 24 lecciones subida como **borrador**; escritos el módulo 1 entero (3 lecciones + 15 preguntas) y la lección 2.1. Falta, en orden:

- [ ] **Escribir el resto**: lecciones 2.2 a 7.3, los bancos de preguntas de los módulos 2 a 7 (15 cada uno) y el del examen final (30). Cada dato fiscal, contrastado con la AEAT, la DGT o el BOE.
- [ ] **Crear en el diccionario** los términos fiscales que el curso necesita enlazar y que aún no existen: FIFO, permuta, ganancia patrimonial, base del ahorro, lending, modelo 721… (`airdrop` ya existe desde el curso de seguridad) (regla del diccionario: antes de publicar).
- [ ] **Imágenes**: portada y las ilustraciones que hagan falta, con prompts de Gemini, en WebP.
- [ ] **Comprobar DAC8 en el BOE** antes de publicar: en octubre de 2026 la orden de los modelos 042, 172, 175 y 721 seguía en tramitación (lección «Lo que Hacienda ya sabe de ti»).
- [ ] **Al publicarlo** (con el «sí» del admin): `"published": true` en `curso.json`, volver a subir y ofrecer la auditoría SEO de la ficha. (El catálogo ya está en `acceso: "premium"` desde el curso de psicología.)

**Pedido por el admin el 05-11-2026: implementar el primer curso de punta a punta y comprobarlo todo antes de abrirlo.** No basta con que el contenido esté escrito; hay que recorrerlo como un alumno:

- [ ] **Desbloqueo de módulos:** cada módulo se abre solo al aprobar el examen del anterior, y no antes. Probar también los atajos: entrar por URL directa a una lección de un módulo bloqueado, recargar a mitad de examen o abrirlo en dos pestañas.
- [ ] **Exámenes:** preguntas sorteadas y corregidas en el servidor (`src/lib/cursos-examen.ts`), nota mínima 5, la espera de 24 h tras suspender, y que la nota guardada sea la que se enseña. Comprobar que la respuesta correcta no viaja al navegador antes de corregir.
- [ ] **Certificado:** que se entregue completo al aprobar el examen final, con la nota (40 % media de módulos + 60 % final), descargable, y que el código abra su página pública de verificación (`/cursos/verificar/<codigo>`). Que el logro del curso salga en `/dashboard/logros`.
- [ ] **Un apartado nuevo en el dashboard para todos los usuarios**, «Mis cursos»: los cursos en curso con su progreso por módulos, el siguiente paso, las notas y los certificados conseguidos. Quien no es Premium ve el catálogo y qué incluye. Hoy el dashboard solo tiene el enlace a `/cursos` en la barra lateral y la vitrina de certificados.

### 0d. Curso «Seguridad cripto» — publicado el 08-11-2026

Pedido por el admin el 08-11-2026, con la orden de publicarlo sin esperar su aprobación al terminar. Informe con fuentes en [`informes/curso-seguridad-cripto.md`](./informes/curso-seguridad-cripto.md). Escrito en `scripts/cursos/seguridad-cripto/`: 5 módulos, 17 lecciones, 75 preguntas de módulo y 40 del final (salen 25). Paleta violeta `#a78bfa`, logro «Caja Fuerte» (escudo con cerradura en `logros.tsx`), aviso «formacion» generalizado para cualquier curso y 12 términos nuevos en el diccionario (`autocustodia`, `sim-swapping`, `envenenamiento-de-direcciones`, `chiringuito-financiero`, `pig-butchering`, `aprobacion-de-token`, `passphrase`, `esquema-ponzi`, `ingenieria-social`, `airdrop`, `malware`, `explorador-de-bloques`). Certificado y logro entregados al admin. Falta:

- [ ] **Recorrerlo como alumno** con las comprobaciones de la sección 0b, y los bloques de cada lección en móvil.
- [ ] **Auditoría SEO de la ficha `/cursos/seguridad-cripto`** (AUDITORIA-SEO.md entera): no se ofreció antes de publicar porque el admin pidió no esperar. Al final, `npm run check:seo -- cursos/seguridad-cripto "seguridad cripto"`.

### 0c. Curso «Psicología del trading» — publicado el 08-11-2026

Aprobado el diseño el 08-11-2026 (informe en [`informes/curso-psicologia-trading.md`](./informes/curso-psicologia-trading.md)). Escrito entero en `scripts/cursos/psicologia-del-trading/`: 6 módulos, 24 lecciones, 90 preguntas de módulo y 40 del final (salen 25). Hecho también: los 12 términos nuevos del diccionario, los bloques `prospectiva`, `rachas` y `calculadora-r`, el aviso «formacion» de `DisclaimerRiesgo.tsx` y el logro «Sangre Fría» en la categoría **Cursos**, que se gana solo con aprobar el examen final (la categoría Temple con sellos se retiró el mismo día, a petición del admin). **Publicado el 08-11-2026 con el «sí» del admin** (SQL del aviso «formacion» ejecutado; `cursos` pasa a `acceso: "premium"` en `herramientas.ts` y sale del «Pronto» del dashboard). Su certificado se guarda en la vitrina: una balda en la portada del dashboard, debajo del perfil, y la página `/dashboard/certificados`, abiertas aunque se deje Premium. Falta, en orden:

- [ ] **Recorrerlo como alumno** con las comprobaciones de la sección 0b (desbloqueo, exámenes, certificado) y además: los tres bloques nuevos en móvil y escritorio, el logro en la categoría Cursos de `/dashboard/logros`, y la vitrina: la balda de la portada del dashboard y `/dashboard/certificados` con su descarga en PDF.
- [ ] **Decidir el orden** frente al de fiscalidad antes de publicar ese: los dos tienen `"orden": 1`.
- [ ] **Auditoría SEO de la ficha `/cursos/psicologia-del-trading`** (AUDITORIA-SEO.md entera): ofrecida al publicar, aún sin hacer. Al final, `npm run check:seo -- cursos/psicologia-del-trading "psicología del trading"`.

### 1. Foro de preguntas y respuestas

**El plan entero está en [`FORO.md`](./FORO.md)**: lo decidido, los principios, permisos, límites, modelo de datos, seguridad capa a capa, moderación, me gusta y etiquetas, orden de respuestas y ganadora, puntos y ranking, avisos, Google, lo legal y las pruebas para romperlo. Aquí solo el estado; el detalle no se repite, para que no se desincronice.

Lo esencial (06-11-2026): **leer es de todos y participar es solo de Premium**, en todo; sin perfiles visitables ni mensajes directos; respuestas con me gusta y las más valoradas arriba; etiquetas en las preguntas; respuesta ganadora que cierra el hilo; ranking con libro de puntos. **Primero la seguridad y la moderación; el diseño, al final.**

**Por qué interesa:** es el único contenido que **crece sin que nadie lo escriba**, y cada pregunta bien titulada es una URL que responde a una búsqueda real (`QAPage`).

En construcción desde el 12-11-2026. Ese día se cerraron las once decisiones (§0 de `FORO.md`: **nada se revisa antes de publicar**, el filtro rechaza en el acto, réplicas de un nivel) y se reforzó la seguridad: el navegador no lee ni escribe ninguna tabla del foro, y todo pasa por `src/lib/foro/`. Las fases 0 a 3 y la 5 (imágenes, probada contra Storage) están hechas, y los cuatro SQL del foro están ejecutados y comprobados en Supabase: el esquema (`scripts/create-foro.sql`) y las funciones (`scripts/create-foro-funciones.sql`) están ejecutados y, con la clave anónima, no se lee ni se escribe ninguna tabla ni se llama a ninguna función (comprobado el 12-11-2026).

- [ ] **Fase 4 — API:** escrita (`src/lib/foro/` y `/api/foro/*`), con el filtro de texto probado (77 casos) y las rutas probadas sin sesión. **Falta probarla con sesiones de verdad**: gratuito, Premium, suspendido, 2FA a medias y campos de más. Necesita cuentas de prueba en Supabase, que hay que crear con permiso del admin y borrar después.
- [ ] **Casos de dos peticiones a la vez** del §9.4 de `FORO.md` (50 me gusta simultáneos, dos eligiendo ganadora): con esas mismas cuentas de prueba, contra la API.
- [ ] **Fase 6 — Moderación:** `/admin/foro` y sus rutas están escritos. **Falta que el admin lo use con su sesión** (con la verificación en dos pasos pasada).
- [ ] **Fases 7 y 8:** la base de datos y el servidor están hechos (avisos, puntos, recálculo diario, ranking, logros derivados). **Faltan sus pantallas** (campana, lista de avisos, ranking), que van con el diseño.
- [ ] **Fase 11 — Diseño:** están todas las pantallas: listado, categoría, hilo (responder, replicar, me gusta, etiquetas, ganadora, reportar, editar y borrar), `/foro/preguntar` con imágenes, `/foro/normas`, `/foro/ranking` y `/foro/mio` (reputación, avisos y mensajes propios). Compila en producción. **Falta que el admin las vea y las use con su sesión**: nadie las ha visto pintadas, porque con el foro cerrado solo las ve él. Al abrir el foro: la campana de avisos en la barra de toda la web y el enlace desde el dashboard.
- [ ] **Revisar el texto de las normas** (`src/app/foro/normas/page.tsx`): es un borrador escrito sin revisión legal. Va con la fase 10.
- [ ] **Fases 9, 10 y 12 a 14**: romperlo (pendiente de cuentas de prueba), legal (las normas de la comunidad y los cambios en términos y privacidad), SEO, beta cerrada y apertura.
- [ ] **D15**, antes de la fase 6: si se reconoce a un expulsado que vuelve con otra cuenta (final de `FORO.md`).

---

### 2. Niveles de usuarios

Niveles de usuario **en toda la web**. No confundir con los hitos del Diario de Trading, que ya existen.

**Lo del diario está cerrado (26-09-2026).** La web prometía «retos y niveles» del diario como «próximamente». El admin decidió que los hitos cumplen esa promesa (`src/components/trading/TjMilestones.tsx`: siete familias con niveles y el mismo aviso que los logros), y los textos dicen ya «hitos con niveles» en el catálogo, el bot, `/premium` y la ficha `/herramientas/diario`. No hay «retos»: que no se vuelvan a anunciar. Desde el 26-09-2026 los hitos también son logros: el servidor los recalcula desde las operaciones (`src/lib/diarioLogros.ts`) y guarda una fila por nivel en `user_badges` (`diario-<hito>-<nivel>`), así que salen en `/dashboard/logros` y en la tarjeta del panel. Si esta tarea llega a calcular un nivel de usuario a partir de los logros, esos niveles ya están ahí.

**Con qué se conecta:**
- Ya existe medio sistema: **16 logros** en `src/lib/logros.tsx` (ocho de actividad, uno de pago y uno por guía, derivados de `GUIDES`), rachas diarias, y la tabla `user_badges`. Los niveles serían la capa de encima, no algo nuevo.
- La tarjeta del dashboard y `/dashboard/logros` ya pintan esa lista: un nivel visible saldría en los dos sitios sin duplicar nada.

**Preguntas para el admin:**
- ¿El nivel sale de los logros, de la racha, de las guías y cursos completados, o de una mezcla?
- ¿Da algo material (acceso, descuento) o es solo estatus? Si da algo material, hay que pensarlo con la suscripción delante.
- ¿Se ve entre usuarios —en el foro, por ejemplo— o es privado?

---

### 3. Perfil público y fotos de perfil — VA ANTES QUE EL FORO

**Decidido por el admin el 06-11-2026: se hace antes que el foro, y son 4 fotos.** Montado el 06-11-2026: `/dashboard/perfil` («Mi perfil», en el rail del dashboard y en el menú del usuario) con la foto, el alias (`src/lib/perfilPublico.ts`, que valida igual en el navegador y en `/api/perfil`), la vista previa de cómo se verá en el foro, qué podrá hacer allí según sea Premium o no, y toda la cuenta (plan y suscripción, contraseña, verificación en dos pasos —destacada solo si no está activada—, soporte por Instagram y borrado). `/cuenta` redirige aquí. La foto sale junto al nombre en la barra, el menú, el dashboard y el Diario. Falta:

- [ ] **Las 4 fotos definitivas, si el admin las quiere de otro estilo.** Hoy son 4 personajes en SVG dibujados a mano (toro, oso, ballena y astronauta, en `public/avatares/`): se ven nítidos a cualquier tamaño. Si se hacen con Gemini, WebP de ~256 px en la misma carpeta y cambiar solo el `src` de cada una en `AVATARES`; el `id` no se toca. Decidir si alguna es solo para Premium.
- [ ] **Los logros que el usuario elija mostrar** en su perfil público: se decide con el diseño del foro (fase G de `FORO.md`).

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

- [ ] **Revisar la indexación en Search Console → Páginas.** El 03-10-2026 se pidió a mano la indexación de `/premium`, las guías `hyperliquid`, `render` y `worldcoin`, `/calculadora` y las fichas `pnl` y `staking`: comprobar cuáles han entrado. Mirar también el CTR del título nuevo de `/glosario/atl`.
- [ ] **Ficha pública de Logros.** Es la única de las cuatro herramientas sin página propia (Diario y Portfolio la tienen; la Predicción de Precio se usa sin cuenta). La plantilla existe (`src/app/herramientas/detalle.css`) y el catálogo solo necesita su `paginaPublica`.
