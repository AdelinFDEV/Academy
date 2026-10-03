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

- [ ] **Fichas públicas que faltan.** Cuatro herramientas siguen sin página propia: calculadora de riesgo, watchlist, Mi Portfolio y Logros. Son las únicas que aún salen con candado en `/herramientas` y apagadas en el sidebar. La plantilla existe (`src/app/herramientas/detalle.css`) y el catálogo solo necesita su `paginaPublica`.
- [ ] **`BlogMobileMenu`** es la última lista de herramientas escrita a mano; debería salir del catálogo como el resto.
- [ ] **La tabla `rutina_diaria`** quedó huérfana al retirar la rutina diaria. Borrarla es opcional: `scripts/drop-rutina-diaria.sql`.
- [ ] **Separar `guias.css`**, que mezcla las tres primeras guías en 1200+ líneas (deuda conocida, ver `AGENTS.md`).
