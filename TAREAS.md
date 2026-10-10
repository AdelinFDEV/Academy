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

### 1. Foro de preguntas y respuestas

Un espacio donde los usuarios pregunten y se respondan entre ellos, con el admin arbitrando.

**Por qué interesa, más allá de la comunidad:** es el único tipo de contenido que **crece sin que nadie lo escriba**. Cada pregunta bien titulada es una URL que responde a una búsqueda real, y Google tiene un tipo de dato estructurado propio para esto (`QAPage`). Es la vía más barata de multiplicar las URLs indexables del sitio (el recuento actual: `curl -s https://adelinacademy.com/sitemap.xml | grep -c "<loc>"`).

**Con qué se conecta:**
- Los comentarios ya resuelven media infraestructura: aprobación por el admin, el trigger anti-spam de «un pendiente por persona» (`scripts/comments-one-pending.sql`) y las políticas de RLS. Conviene leerlo antes de empezar de cero.
- El rate limiting del tramo `escritura` ya cubriría los envíos (`src/lib/rate-limit.ts`).

**Preguntas para el admin, antes de escribir código:**
- ¿Preguntar es de Premium, de cuenta gratuita, o abierto? ¿Y leer?
- ¿Responde solo el admin o también otros usuarios?
- ¿Las preguntas pasan por aprobación antes de publicarse, como los comentarios?

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
| **Apoyo visual** | 1 `.prose-chart`, tabla o `.prose-callout` | La misma exigencia que ya tienen las entradas |
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

## 5. El muro de registro es lo que Google ve de las guías

El protocolo de [`AUDITORIA-SEO.md`](./AUDITORIA-SEO.md) se ejecuta a partir de ahora en **cada entrada y cada guía nueva**, y se ofrece solo. El contenido anterior no lo había pasado nunca. La primera pasada fue el 07-09-2026; la segunda, el 10-09-2026, encontró la causa de fondo.

**El diagnóstico de la primera pasada era erróneo y conviene decirlo:** se apuntó a los componentes de cliente —quiz, gráficos, minijuegos— como lo que Google no ve. Las siete guías son **componentes de servidor**, así que eso se renderiza. Lo que Googlebot no ve es lo que hay **detrás del muro de registro**, porque entra siempre sin sesión.

Seis de las siete guías cortan en la **sección 2 de 8**. La séptima, fiscalidad, solo cierra los extras de Premium. El resultado se mide solo:

| Guía | Palabras que ve Google | H2 |
|---|---|---|
| `fiscalidad-cripto-espana` — sin muro de registro | **3.617** | **9** |
| `que-es-la-blockchain` | 1.090 | 3 |
| `xrp` | 917 | 3 |
| `hyperliquid` | 905 | 3 |
| `render` | 826 | 3 |
| `worldcoin` | 737 | 3 |
| `ciclos-de-bitcoin` | 745 | 3 |

Las seis con muro tienen **exactamente 3 `<h2>`** —dos secciones abiertas más el reclamo— y por eso ninguna llega al mínimo de 4. No es un problema de redacción: **es el muro**, y arreglarlo con un encabezado de adorno sería justo lo que el propio protocolo prohíbe.

**Decidido por el admin el 10-09-2026: el muro no se toca.** Lo que es de registro sigue siendo de registro. Queda anotado como **deuda aceptada** en `DEUDA_CONOCIDA` de `scripts/check-seo.mjs`, con dos etiquetas —`h2` y `palabras`—, para que las seis guías dejen de pedir en rojo una corrección que no va a llegar y sigan diciendo la verdad en amarillo.

Conviene tener claro qué significa y qué no: **las guías con muro aparecen en Google igual**, están indexadas y en el sitemap. Lo que cambia es con cuánto compiten — Googlebot juzga `/guias/xrp` por las 917 palabras que ve, no por las ~3.000 que lee un registrado.

Lo que no dependía del muro quedó cerrado el 03-10-2026: las guías declaran su muro en el JSON-LD (`isAccessibleForFree`, desde el campo `muro` de `GUIDES`) y todas llevan el bloque `<GuiasRelacionadas>` fuera del muro, así que ninguna depende ya solo del enlace de `/guias`.

Lo que ya está corregido y verificado en verde el 10-09-2026: la densidad de `/post/bitcoin-core-v32-2026` (0,07 % → 0,60 %, hoy **sin fallos**), las once frases de más de 40 palabras repartidas por seis guías, la frase media de `worldcoin` (31 → 21), la clave de `ciclos-de-bitcoin` en el H1 y en la description, y el techo de densidad de `render` (2,55 % → 2,30 %).

**El orden lo decide el tráfico, no la lista.** Se empieza por lo que ya recibe impresiones en Search Console, igual que con las fichas del diccionario.

---

## Menor, y ya identificado

- [ ] **Revisar la indexación a partir del 17-10-2026.** El 03-10-2026 solo 47 de las URLs del sitemap estaban indexadas (las que salgan en Search Console → Páginas). Se pidió a mano la indexación de diez: `/premium`, las guías `hyperliquid`, `render` y `worldcoin` (las dos primeras Google ni las conocía), `/calculadora`, `/categoria/fiscalidad`, las entradas `actualizacion-xrp-ledger-2026` y `staking-airdrops-impuestos-espana`, y las fichas `pnl` y `staking`. Comprobar cuáles han entrado. **`staking-airdrops-impuestos-espana` es distinta**: Google la leyó y decidió no indexarla («Rastreada: actualmente sin indexar»), que es una señal de calidad; si sigue fuera, pasarle la auditoría SEO. Mirar también el CTR de los títulos nuevos de `/calendario-de-liberaciones` y `/glosario/atl`.
- [ ] **Fichas públicas que faltan.** Cuatro herramientas siguen sin página propia: calculadora de riesgo, watchlist, Mi Portfolio y Logros. Son las únicas que aún salen con candado en `/herramientas` y apagadas en el sidebar. La plantilla existe (`src/app/herramientas/detalle.css`) y el catálogo solo necesita su `paginaPublica`.
- [ ] **`BlogMobileMenu`** es la última lista de herramientas escrita a mano; debería salir del catálogo como el resto.
