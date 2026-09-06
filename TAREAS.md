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

### 4. El diccionario en profundidad — plantarle cara a Binance

El recuento y qué fichas están ya en profundidad **no se escriben aquí, se preguntan**:

```bash
npm run check:glosario
```

La mayoría siguen siendo definiciones cortas de ~200 palabras. Las páginas de Binance Academy o Bit2Me para esos mismos términos rondan las **1.000-2.500**. Esa distancia es la razón de estar en posición 33 y no en la 5.

**El objetivo final es que todas tengan una ficha capaz de competir de tú a tú.** Pero no de golpe, y por un motivo que no es la pereza: ampliar cincuenta a la vez lleva a rellenar, y **una ficha larga y hueca posiciona PEOR que la corta de hoy**.

#### Por dónde empezar: lo que Google ya te está mandando

Datos reales de Search Console, del 29 de agosto al 3 de septiembre de 2026 (46 impresiones, 7 clics, posición media 33,7). **Cinco de las once consultas del sitio son definiciones**, y eso con las fichas cortas:

| Término | Consultas que ya lo buscan | Impresiones | Estado |
|---|---|---|---|
| `hot-wallet` | «hot wallet» | 2 | **Primero** |
| `roi` | «qué es el roi» | 1 | **Segundo** |

`exchange` era la primera de esta lista y **ya está hecha** (1.445 palabras, en verde). Después de las dos que quedan, la siguiente tanda **sale del hilo que ya funciona**, no de adivinar: la consulta más buscada del sitio es «curso de fiscalidad sobre criptomonedas» (6 impresiones) y también aparece «cointracking hacienda». Es decir, el ángulo fiscal español tira. Los términos que lo tocan —`pnl`, `market-cap`, `oferta-circulante`, `staking`— son los siguientes candidatos.

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

## 5. Pasar la auditoría SEO por el contenido que ya está publicado

El protocolo de [`AUDITORIA-SEO.md`](./AUDITORIA-SEO.md) se ejecuta a partir de ahora en **cada entrada y cada guía nueva**, y se ofrece solo. Pero el contenido publicado antes de que existiera no lo ha pasado nunca, y al estrenar el auditor sobre él salieron fallos reales. Estos no son deuda que se perdona: son páginas que ya están compitiendo en Google con un lastre medible.

Lo encontrado en la primera pasada (07-09-2026), por orden de lo que más cuesta:

| Página | Qué falla | Por qué importa |
|---|---|---|
| `/post/bitcoin-core-v32-2026` | La palabra clave aparece **1 vez en 1.473 palabras** (0,07 %) | Es el fallo del suelo de densidad, el mismo de la primera ficha. Google no ve de qué va |
| `/guias/fiscalidad-cripto-espana` | Densidad **0,26 %**, solo **3 `<h2>`**, 3 frases de más de 40 palabras | Es la guía que sostiene la consulta más buscada del sitio. Es la que más urge |
| `/guias/xrp` | Solo **3 `<h2>`**, 2 frases largas, 1 párrafo de más de 120 palabras | — |

Y un hallazgo estructural que afecta a **todas** las guías: el auditor mide 909 palabras en la de XRP porque **lo que Google recibe es solo lo renderizado en el servidor**. Todo lo que vive dentro de un componente de cliente —quiz, gráficos, minijuegos— no lo ve el rastreador. Merece una comprobación página a página: si el contenido que sostiene la consulta está dentro de un interactivo, hay que sacar una versión en texto al servidor.

```bash
npm run check:seo -- guias/fiscalidad-cripto-espana
npm run check:seo -- post/bitcoin-core-v32-2026 "bitcoin core"
```

**El orden lo decide el tráfico, no la lista.** Se empieza por lo que ya recibe impresiones en Search Console, igual que con las fichas del diccionario.

---

## Menor, y ya identificado

- [ ] **Fichas públicas que faltan.** Cuatro herramientas siguen sin página propia: calculadora de riesgo, watchlist, Mi Portfolio y Logros. Son las únicas que aún salen con candado en `/herramientas` y apagadas en el sidebar. La plantilla existe (`src/app/herramientas/detalle.css`) y el catálogo solo necesita su `paginaPublica`.
- [ ] **`BlogMobileMenu`** es la última lista de herramientas escrita a mano; debería salir del catálogo como el resto.
- [ ] **La tabla `rutina_diaria`** quedó huérfana al retirar la rutina diaria. Borrarla es opcional: `scripts/drop-rutina-diaria.sql`.
- [ ] **Separar `guias.css`**, que mezcla las tres primeras guías en 1200+ líneas (deuda conocida, ver `AGENTS.md`).
