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

### 00d. Nova, el bot del Diario: siguientes pasos (06-11-2026)

Hecho el 06-11-2026 (versión 1): **Nova** vive en la cabecera del Resumen (`TjBot.tsx`, motor en `tjNova.ts`). Son reglas sobre los datos, sin IA. Da un **pulso** de 0 a 100 (riesgo, resultados, emociones y constancia, sobre lo reciente), prioriza sus mensajes (lo urgente sube a «Lo más importante»), propone acciones con botón y analiza hoy, sensaciones y su efecto en el dinero, tendencia del ánimo, rachas, riesgo, revancha, sobreoperar, caída desde el máximo y nuevos máximos, forma reciente, franjas horarias, hitos y las lecturas de `buildInsights`/`welcomeReading`. El personaje (`NovaHead.tsx`) es una cabeza que vuela por su espacio bajo el saludo, girándose en continuo; hace una actividad (dormir, pelota, trading, estudiar, música) durante 10 minutos o hasta que le interrumpan, y luego otra; cambia de cara según cómo va el usuario y se alegra al pasarle el ratón. La frase corta junto a él está quitada de momento (el motor sigue calculando `teasers`).

Desde el 07-11-2026 **se rehace entero con cada dato nuevo** (operación, ánimo, capital, hito) y lo primero que hace es reaccionar a lo último apuntado; cada capítulo tiene un tope de mensajes y «Lo más importante» se elige antes de recortar. Fuera del Diario vive en la barra, junto a «Diario de Trading» (`NovaNav.tsx`), y vuela entre la barra y su habitación (`novaVuelo.tsx`). Falta:

- [ ] **Ver con el admin si se le añade IA** encima de las reglas (por ejemplo, que redacte el resumen o responda preguntas), y con qué modelo y coste.
- [ ] **Antes de anunciarlo en las fichas** (`/herramientas/diario`, `/premium`), abrir `tjNova.ts` y prometer solo lo que hace.

### 00b. Un vídeo explicativo de cada herramienta, para el home (31-10-2026)

Pedido por el admin el 31-10-2026: grabar un vídeo corto de cada herramienta que enseñe cómo se usa, y colocarlo en el home.

- [ ] **Grabar los vídeos** (los graba el admin): Diario de Trading, Portfolio Adelin y Predicción de Precio, y los Cursos cuando se publique el primero.
- [ ] **Decidir dónde van en el home.** Lo natural es la sección Premium (`PremiumHome`, rehecha el 04-11-2026): cada tarjeta lleva a la ficha de su pieza, y el vídeo podría abrirse desde ella o ir en la propia ficha. La Predicción de Precio no está en esa sección: si lleva vídeo, necesita sitio propio.
- [ ] **Al montarlos**: alojarlos en YouTube y servirlos desde `youtube-nocookie.com`, que ya está permitido en la CSP (`next.config.ts`). Ojo: `GuideVideoEmbed` mete el iframe nada más cargar; en el home conviene una portada con botón de play que solo cargue el vídeo al pulsar, para no frenar la página.


### 00a. Telegram, retirado entero (05-11-2026)

Decidido por el admin el 05-11-2026: **no hay Telegram en ningún sitio**. Hecho en el código: fuera el bot (webhook y comandos), la vinculación de cuentas (`/api/telegram/*`, la tarjeta de `/cuenta` y el aviso del dashboard), los crons `telegram-sync` y `promo-premium`, los avisos al admin, los avisos de guías y vídeos (`announce.ts`), `/admin/comunidad`, Telegram en `/admin/premium` y en Objetivos (métrica, canal de ideas y calendario, gráficas de Crecimiento), los enlaces del pie y de redes, los textos de Premium y de la página de gracias, `BOT.md` y `ANUNCIO-TELEGRAM.md`. Lo que no era de Telegram y vivía en su cron (la foto diaria de YouTube y la red de seguridad de los cobros de Stripe) pasó a `/api/cron/diario`. Copia de todos los datos en `backups/telegram-2026-11-05/` (local, fuera de git). Falta:

- [ ] **Ejecutar el SQL que borra las tablas y columnas de Telegram**, **después** de desplegar el código (el admin lo tiene en el chat del 05-11-2026; está también al final de `scripts/create-objetivos.sql`).
- [ ] **Quitar las variables de Telegram en Vercel**: todas las `TELEGRAM_*` (token del bot, ids de canal, enlace de invitación, secreto del webhook…). Ya no las lee nadie.
- [ ] **Apagar el bot en Telegram**: borrar su webhook (`deleteWebhook`) o el bot entero desde @BotFather, y decidir qué pasa con los canales (cerrarlos o dejar un último mensaje que lleve a la web).
- [ ] **El aviso de que se acaba el Premium** iba por Telegram a quien había cancelado y le quedaban 3 días. Ya no existe: decidir si se manda por email (`cancel_warning_period_end` en `profiles` sigue sirviendo para no repetirlo).
- [ ] **Pedido por el admin el 05-11-2026: revisar la seguridad y que todo funcione solo desde la web, ahora que no hay Telegram.**
  - **Gestionar la cuenta desde el dashboard:** el usuario tiene que poder hacer ahí todo lo que antes pasaba por el bot o por Telegram: ver su plan, renovar o cancelar Premium (portal de Stripe), cambiar contraseña y 2FA, borrar su cuenta y escribir a soporte. Hecho el 06-11-2026: todo vive en «Mi perfil» (`/dashboard/perfil`) y `/cuenta` redirige allí; el portal de Stripe vuelve a `/dashboard/perfil#suscripcion`. Queda revisar que el flujo entero funciona sin Telegram (sobre todo renovar y cancelar).
  - **Seguridad:** repasar las rutas que tocaban Telegram (webhook de Stripe, borrado de cuenta, cambio de rol desde `/admin/users`) y que el resto sigue protegido (RLS de `profiles`, `CRON_SECRET` del cron nuevo, limitador).
  - **Ni una mención ni lógica de Telegram:** buscar en el código, los textos, el SQL, las variables de entorno y los emails (`grep -rni telegram src scripts *.md`) y que no quede nada que dependa de él. Lo que sí queda a propósito: comentarios que explican que se retiró y los scripts SQL históricos.

### 000. Herramientas retiradas (31-10-2026)

Hecho en el código: fuera Watchlist, Liberaciones de Tokens, Radar Diario, Mi Portfolio, la Calculadora de Riesgo, la landing `/herramientas` y el Trading en Directo, con su CSS, sus APIs, sus textos y sus menús; sus URLs responden 410 (`src/lib/retiradas.ts`). Falta:

- [ ] **Reenviar el sitemap en Search Console** y comprobar en producción que `/herramientas`, `/radar-diario`, `/calendario-de-liberaciones` y `/trading-en-directo` dan 410.


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
- [ ] **Al publicarlo** (con el «sí» del admin): `"published": true` en `curso.json`, volver a subir y ofrecer la auditoría SEO de la ficha. (El catálogo ya está en `acceso: "premium"` desde el curso de psicología.)

**Pedido por el admin el 05-11-2026: implementar el primer curso de punta a punta y comprobarlo todo antes de abrirlo.** No basta con que el contenido esté escrito; hay que recorrerlo como un alumno:

- [ ] **Desbloqueo de módulos:** cada módulo se abre solo al aprobar el examen del anterior, y no antes. Probar también los atajos: entrar por URL directa a una lección de un módulo bloqueado, recargar a mitad de examen o abrirlo en dos pestañas.
- [ ] **Exámenes:** preguntas sorteadas y corregidas en el servidor (`src/lib/cursos-examen.ts`), nota mínima 5, la espera de 24 h tras suspender, y que la nota guardada sea la que se enseña. Comprobar que la respuesta correcta no viaja al navegador antes de corregir.
- [ ] **Certificado:** que se entregue completo al aprobar el examen final, con la nota (40 % media de módulos + 60 % final), descargable, y que el código abra su página pública de verificación (`/cursos/verificar/<codigo>`). Que el logro del curso salga en `/dashboard/logros`.
- [ ] **Un apartado nuevo en el dashboard para todos los usuarios**, «Mis cursos»: los cursos en curso con su progreso por módulos, el siguiente paso, las notas y los certificados conseguidos. Quien no es Premium ve el catálogo y qué incluye. Hoy el dashboard solo tiene un enlace a `/cursos` en la barra lateral, marcado «Pronto».

### 0c. Curso «Psicología del trading» — publicado el 08-11-2026

Aprobado el diseño el 08-11-2026 (informe en [`informes/curso-psicologia-trading.md`](./informes/curso-psicologia-trading.md)). Escrito entero en `scripts/cursos/psicologia-del-trading/`: 6 módulos, 24 lecciones, 90 preguntas de módulo y 40 del final (salen 25). Hecho también: los 12 términos nuevos del diccionario, los bloques `prospectiva`, `rachas` y `calculadora-r`, el aviso «formacion» de `DisclaimerRiesgo.tsx` y la categoría de logros **Temple** con el logro «Sangre Fría» y sus tres sellos (`src/lib/logroTemple.ts`). **Publicado el 08-11-2026 con el «sí» del admin** (SQL de `scripts/cursos-logro-categoria.sql` ejecutado; `cursos` pasa a `acceso: "premium"` en `herramientas.ts` y sale del «Pronto» del dashboard). Su certificado se guarda en la vitrina `/dashboard/certificados`, abierta aunque se deje Premium. Falta, en orden:

- [ ] **Recorrerlo como alumno** con las comprobaciones de la sección 0b (desbloqueo, exámenes, certificado) y además: los tres bloques nuevos en móvil y escritorio, los tres sellos en `/dashboard/logros` y la vitrina `/dashboard/certificados` con su descarga en PDF (el II cuenta días de `diario_dias` desde la inscripción; el III, esperas de «Sin revancha» después del certificado).
- [ ] **Decidir el orden** frente al de fiscalidad antes de publicar ese: los dos tienen `"orden": 1`.
- [ ] **Auditoría SEO de la ficha `/cursos/psicologia-del-trading`** (AUDITORIA-SEO.md entera): ofrecida al publicar, aún sin hacer. Al final, `npm run check:seo -- cursos/psicologia-del-trading "psicología del trading"`.

### 1. Foro de preguntas y respuestas

**El plan entero está en [`FORO.md`](./FORO.md)**: lo decidido, los principios, permisos, límites, modelo de datos, seguridad capa a capa, moderación, me gusta y etiquetas, orden de respuestas y ganadora, puntos y ranking, avisos, Google, lo legal y las pruebas para romperlo. Aquí solo el estado; el detalle no se repite, para que no se desincronice.

Lo esencial (06-11-2026): **leer es de todos y participar es solo de Premium**, en todo; sin perfiles visitables ni mensajes directos; respuestas con me gusta y las más valoradas arriba; etiquetas en las preguntas; respuesta ganadora que cierra el hilo; ranking con libro de puntos. **Primero la seguridad y la moderación; el diseño, al final.**

**Por qué interesa:** es el único contenido que **crece sin que nadie lo escriba**, y cada pregunta bien titulada es una URL que responde a una búsqueda real (`QAPage`).

- [ ] **Fase 0 — Cerrar las decisiones pendientes** del final de `FORO.md` (D2, D4–D9, D11–D14).
  El perfil público (su fase 1) ya está hecho: es la tarea 3.
- [ ] **Fases 2 a 14**, en el orden y con los criterios de salida de la §16 de `FORO.md`: esquema, funciones atómicas, API, imágenes, moderación, avisos, puntos y ranking, romperlo, legal, diseño, SEO, beta cerrada y apertura.

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

- [ ] **Revisar la indexación a partir del 17-10-2026.** El 03-10-2026 solo 47 de las URLs del sitemap estaban indexadas (las que salgan en Search Console → Páginas). Se pidió a mano la indexación de diez: `/premium`, las guías `hyperliquid`, `render` y `worldcoin` (las dos primeras Google ni las conocía), `/calculadora`, `/categoria/fiscalidad`, las entradas `actualizacion-xrp-ledger-2026` y `staking-airdrops-impuestos-espana`, y las fichas `pnl` y `staking`. Comprobar cuáles han entrado. **`staking-airdrops-impuestos-espana` es distinta**: Google la leyó y decidió no indexarla («Rastreada: actualmente sin indexar»), que es una señal de calidad; si sigue fuera, pasarle la auditoría SEO. Mirar también el CTR del título nuevo de `/glosario/atl`.
- [ ] **Ficha pública de Logros.** Es la única de las cuatro herramientas sin página propia (Diario y Portfolio la tienen; la Predicción de Precio se usa sin cuenta). La plantilla existe (`src/app/herramientas/detalle.css`) y el catálogo solo necesita su `paginaPublica`.
