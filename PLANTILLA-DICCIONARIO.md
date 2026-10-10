# EL DICCIONARIO — el término corto y la ficha ampliada

Este archivo cubre el diccionario entero, y son **dos trabajos distintos**:

| | Qué es | Dónde está |
|---|---|---|
| **Término** | El campo `extended` de ~150-250 palabras. Es lo mínimo para que el término **exista como URL** | [Parte A](#parte-a--el-término), aquí abajo |
| **Ficha ampliada** | Llevarlo a 1.200-2.200 palabras para competir con Binance y Bit2Me | [Parte B](#parte-b--la-ficha-ampliada), la plantilla |

Los dos guardarraíles:

```bash
npm run check:glosario                 # el texto: longitud, enlaces, densidad, relleno
npm run check:seo -- glosario/<slug>   # la página servida: SEO, encabezados, esquemas
```

El segundo necesita `npm run dev` levantado, y por eso no está en el hook de `pre-push`.

---

# PARTE A · El término

Los términos —**50 hoy**, `grep -c '  slug: "' src/lib/glosario.ts` para el número de verdad— viven en **`src/lib/glosario.ts`**. Antes estaban dentro de `GlosarioClient.tsx`, que es un componente de cliente, así que ni el sitemap ni ninguna página de servidor podían leerlos.

## La regla que gobierna todo: sin `extended`, el término no existe

Sin ese campo no aparece en `/glosario/[termino]` —la ruta usa `dynamicParams = false`, así que devuelve **404**—, no entra en el sitemap y el listado no lo enlaza.

No es una limitación técnica, es una decisión: **una URL con 25 palabras es contenido escaso**, y publicar cincuenta de golpe arrastra al dominio entero. Hoy todos tienen su `extended`; la regla sigue viva para los que se añadan.

## Al añadir un término nuevo

`term` (visible, y clave de los guardados) · `slug` · `category` · `definition` corta · `extended` de ~150-250 palabras en HTML, con la estructura **qué es / por qué importa / error típico** · `seeAlso` con **tres slugs que existan y tengan `extended`** — si apuntas a uno sin él, el enlace no se pinta.

Con eso queda publicado. No hay que tocar el sitemap ni el listado: se enteran solos.

## 🔴 `term` no se toca NUNCA

**Es la clave de los guardados de los usuarios** (tabla `saved_terms`, vía `/api/terms`). Cambiar ese texto deja huérfanos los favoritos de todo el mundo, y no hay vuelta atrás sin una migración.

El `slug` sí se puede cambiar **mientras el término no esté publicado**; una vez indexado, cambiarlo exige montar una redirección.

## Cuándo se amplía, y el peligro

La mayoría de las fichas rondan las 205 palabras. El plan es llevarlas a 1.200-2.200 para competir de tú a tú, y ahí aparece el peligro real: **rellenar**. Una ficha larga y hueca posiciona PEOR que la corta de hoy.

`npm run check:glosario` se aplica **a partir de 450 palabras**, así que las cortas de hoy no dan error: no se exige reescribirlas todas, solo que la que se amplíe se amplíe bien. Y de todo lo que exige, el que más importa es **ninguna frase calcada de otra ficha**: reciclar párrafos entre términos es el atajo evidente al ampliar cincuenta, y es duplicado dentro de tu propio dominio.

**El orden lo decide Search Console, no la intuición**: se amplían las que ya reciben impresiones. La lista de por cuál seguir está en [`TAREAS.md`](./TAREAS.md).

---

# PARTE B · La ficha ampliada

La estructura y el diseño que sigue **toda** ficha ampliada. Se fijó el 07-09-2026 con `exchange`, la primera, después de auditarla entera contra el HTML servido.

No es una sugerencia de estilo: cada regla sale de un fallo real o de un dato de Search Console.

## 1 · Antes de escribir

**El orden lo decide Search Console, no la intuición.** Rendimiento → Consultas, y se amplía lo que ya recibe impresiones. Ampliar un término que nadie busca es trabajo perdido por bueno que quede. La lista de por dónde seguir vive en [`TAREAS.md`](./TAREAS.md).

Y antes de escribir una línea, **comprobar los destinos que vas a enlazar**:

```bash
for d in /glosario/dex /guias/fiscalidad-cripto-espana /guias/xrp; do
  printf "%-46s %s\n" "$d" "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000$d)"
done
```

Un término sin `extended` da **404**, y una guía que no esté en `GUIDES` tampoco existe.

---

## 2 · Los campos de `src/lib/glosario.ts`

| Campo | Qué poner |
|---|---|
| `term` | **No se toca nunca.** Es la clave de `saved_terms`: cambiarlo deja huérfanos los guardados de todo el mundo |
| `definition` | La definición corta del listado. Sale también como lead bajo el título |
| `extended` | El texto largo, en HTML. La estructura está en el punto 3 |
| `seeAlso` | Tres slugs **que existan y tengan `extended`** |
| `seoTitle` | Solo si «Qué es {term}» no es como lo busca la gente. Máximo **48 caracteres** |
| `seoDescription` | La que invita a entrar. Máximo **160**. Entre 110 y 160 es lo óptimo |
| `faq` | 5-7 preguntas. Ver el punto 4 |

⚠️ `npm run check` **no vigila** `seoTitle` ni `seoDescription`: solo mira la metadata escrita en los `page.tsx`. Aquí el límite lo aplica quien escribe, y `check:seo` lo verifica después contra la página real.

---

## 3 · La estructura del texto

Siempre este orden. `exchange` es la referencia viva.

### 3.1 Resumen de entrada

```html
<div class="prose-resumen">
  <span class="prose-resumen-title">En veinte segundos</span>
  <p>Qué es, en una frase que se entienda sin saber nada.</p>
  <p>Lo que más cuesta a los principiantes o el error que más se comete.</p>
</div>
```

Es lo que se lleva quien no sigue leyendo, que son la mayoría.

### 3.2 Dos párrafos de entrada

El primero sitúa. El segundo dice **qué explica esta ficha que las demás no** — normalmente, desmontar la comparación fácil con la que se despachan otras webs.

### 3.3 Cinco `<h2>`, en este orden

| # | Sección | Qué va dentro |
|---|---|---|
| 1 | **Los dos tipos / las partes / cómo funciona** | La distinción que de verdad importa, con `prose-vs` si hay dos caras |
| 2 | **Lo que cuesta de verdad** | El coste real con números. `prose-chart` + `prose-dato` |
| 3 | **El error típico** | El fallo que comete todo el mundo, con casos reales en `prose-hitos` |
| 4 | **Lo que Hacienda espera si… desde España** | El ángulo español. `prose-table` |
| 5 | **Cómo elegir / cómo hacerlo bien** | Comprobaciones accionables en `prose-pasos` |

**La cuarta es la que gana la partida.** Binance Academy escribe para el mundo; tú puedes hablar de Hacienda, del FIFO y de la declaración informativa. Es también lo que dicen los datos: la consulta más buscada del sitio es «curso de fiscalidad sobre criptomonedas».

Si un término no da para una de las cinco, **se quita esa sección**. Rellenar para cumplir la plantilla es exactamente lo que la plantilla existe para evitar.

---

## 4 · Las preguntas frecuentes

5-7, en el campo `faq`. Cubren la **cola larga**: quien empieza no busca solo «qué es X», busca «¿es seguro?», «¿cuánto cuesta?», «¿en qué se diferencia de Y?».

Cuatro que casi siempre aplican:

1. ¿Es seguro…?
2. ¿Cuál es el mejor… para empezar? → **nunca un nombre concreto**: criterios
3. ¿Cuánto cuesta…?
4. ¿Qué diferencia hay entre X e Y? → la confusión típica del principiante

**En texto plano, sin HTML**: el esquema no admite etiquetas y tener dos versiones es el descuadre que Google penaliza.

⚠️ **Sobre el resultado enriquecido, sin humo:** desde 2023 Google solo muestra el desplegable de FAQ a webs oficiales de administración y salud. Aquí **no va a salir**. El valor está en el contenido visible, en cubrir consultas que el texto corrido no responde de frente, y en que lo lean también los asistentes de IA. Se emite el esquema porque no cuesta nada, no porque vaya a dar un adorno en el buscador.

---

## 5 · Las piezas visuales

El vocabulario completo, con el marcado listo para copiar, está en el **anexo** al final de este archivo. Vivía en `/admin/posts-instrucciones`, retirada con las entradas el 10-10-2026; los estilos `.prose-*` siguen en `globals.css`.

`prose-resumen` · `prose-vs` · `prose-chart` · `prose-dato` · `prose-hitos` · `prose-pasos` · `prose-callout` · `prose-table`

**Mínimo cinco tipos distintos, y uno cada menos de 300 palabras.** Sin fotos que rompan el texto, son lo único que impide que 1.400 palabras parezcan un muro.

**La regla que las gobierna: si el bloque no dice nada que el párrafo no diga ya, sobra.** Estructuran, no decoran.

Y una que costó un rehacer: **grafica la diferencia, no el total.** El primer gráfico de `exchange` comparaba «lo que queda de 1.000 €» con comisiones del 1,5 %, 0,5 % y 0,1 %: las tres barras salían casi idénticas —98,5 / 99,5 / 99,9— y escondían justo lo que se quería enseñar. Graficando el coste —15 € / 5 € / 1 €— se ve de un vistazo.

---

## 6 · Los números que hay que cumplir

Todos verificados por los dos guardarraíles.

| Qué | Objetivo | Por qué |
|---|---|---|
| Longitud | **1.200-1.600** palabras | Binance y Bit2Me rondan las 1.000-2.500. Por debajo no compites; por encima casi siempre sobra texto |
| `<h2>` en el cuerpo | ≥ 4 | Sin estructura, Google no sabe de qué va cada parte |
| Densidad del término | **0,6-1,2 %** | Ver el aviso de abajo |
| Enlaces internos | ≥ 5, todos 200 | Convierten 50 fichas sueltas en un cuerpo |
| Enlaces externos | **0** | Nunca en el cuerpo |
| Frase media | ≤ 24 palabras | El lector es principiante |
| Frases > 40 palabras | 0 | Idem |
| Tipos de bloque visual | ≥ 5 | Que no parezca un muro |
| Título | ≤ 48 caracteres | El layout añade « \| AdelinBTC», 12 más |
| Descripción | 110-160 | Por debajo desaprovecha; por encima corta |

### ⚠️ El fallo que más fácil se comete: quedarse CORTO de palabra clave

Al escribir `exchange` evité repetir la palabra para no sonar a relleno y me pasé de frenada: **aparecía UNA vez en 1.419 palabras**, un 0,07 %. Google necesita verla. Corregido a 14 apariciones (0,97 %) usándola donde de verdad pertenece — en los `<h2>`, al presentar cada tipo, y al hablar de los casos reales.

**No es lo mismo evitar el relleno que esconder el término.** El límite de arriba es 2,5 %; el suelo es 0,6 %, y es el que se olvida.

---

## 7 · Lo que ningún script puede medir

1. **El ángulo español.** Hacienda, el FIFO, la declaración informativa. Es lo que las webs grandes no tienen y lo que ya te trae búsquedas.
2. **El error típico.** La estructura qué es / por qué importa / **error típico** es tuya; los exchanges se quedan en la definición.
3. **Números propios.** Un ejemplo con cifras vale más que tres párrafos de teoría.
4. **Escribir para quien empieza.** Es el lector al que apunta la academia y el que peor tratan las webs de los exchanges.

⚠️ **No ampliar por lotes.** Una ficha, publicarla, y a la siguiente. Escribir diez seguidas lleva a reciclar estructura y frases sin darse cuenta, y eso es duplicado bajo tu propio dominio — que es justo lo que `check:glosario` caza.

---

## 8 · Lo que rodea a la ficha, y ya está montado

No hay que tocarlo al escribir un término nuevo. Sale solo.

| Dónde | Qué | Para quién |
|---|---|---|
| Junto al título | Botón **Guardar** | Solo con sesión |
| Bajo la definición | Banda de **crear cuenta** | Solo sin sesión. A quien ya la tiene **no se le enseña nada**: ya convirtió |
| Al final | **Último vídeo** del canal | Todos. Se actualiza solo desde YouTube |

La banda va **debajo** de la definición corta, nunca encima: quien llega desde Google tiene que ver la respuesta antes que una oferta. Si lo primero es un banner, se vuelve al buscador — y eso Google lo mide.

---

## 9 · Antes de dar la ficha por buena

```bash
npm run check:glosario
npm run check:seo -- glosario/<slug>
npm run check && npx tsc --noEmit
```

Los tres en verde. Y mirar la página de verdad: hay cosas que solo se ven ahí — el icono de un callout que faltaba, un gráfico que no se entendía, una etiqueta recortada.

---

## Anexo · El marcado de las piezas visuales

Todo va dentro del HTML de `extended`. Los estilos viven en `globals.css` (`.prose-content` y las clases `.prose-*`); cualquier otra etiqueta se pinta, pero sin estilo propio garantizado. **La regla:** si el bloque no dice nada que el párrafo no diga ya, sobra. Sirven para estructurar, no para decorar.

### Gráfico de barras

```html
<div class="prose-chart">
  <div class="prose-chart-title">Dominancia de mercado</div>
  <div class="prose-chart-row">
    <span class="prose-chart-label">Bitcoin</span>
    <div class="prose-chart-track"><div class="prose-chart-fill" style="width:100%"></div></div>
    <span class="prose-chart-value">54%</span>
  </div>
  <div class="prose-chart-row">
    <span class="prose-chart-label">Ethereum</span>
    <div class="prose-chart-track"><div class="prose-chart-fill" style="width:33%"></div></div>
    <span class="prose-chart-value">18%</span>
  </div>
</div>
```

- El `width` de `.prose-chart-fill` se calcula a mano: `(valor / valor_más_alto) × 100`.
- Barras horizontales y estáticas: sin JavaScript ni dependencias.
- **Grafica la diferencia, no el total.** En la ficha de `exchange`, el primer gráfico comparaba «lo que queda de 1.000 €» con comisiones del 1,5 %, 0,5 % y 0,1 %: las tres barras salían casi iguales (98,5 / 99,5 / 99,9) y escondían lo que se quería enseñar. Graficando el *coste* (15 € / 5 € / 1 €) la diferencia se ve de un vistazo.

### Piezas para textos largos

```html
<!-- Resumen: lo que se lleva quien no sigue leyendo -->
<div class="prose-resumen">
  <span class="prose-resumen-title">En veinte segundos</span>
  <p>…</p>
</div>

<!-- Comparación a dos columnas. data-tono: "favor" (verde) o "contra" (rojo) -->
<div class="prose-vs">
  <div class="prose-vs-lado prose-vs-lado--a">
    <p class="prose-vs-title">Centralizado</p>
    <p class="prose-vs-sub">CEX · custodia una empresa</p>
    <ul>
      <li data-tono="favor">Pagas con tarjeta</li>
      <li data-tono="contra">Te pide el DNI</li>
    </ul>
  </div>
  <div class="prose-vs-lado prose-vs-lado--b">…</div>
</div>

<!-- Una cifra que pare el ojo -->
<div class="prose-dato">
  <span class="prose-dato-cifra">504 €</span>
  <span class="prose-dato-texto">Lo que cuesta la diferencia en 36 aportaciones.</span>
</div>

<!-- Línea temporal -->
<div class="prose-hitos">
  <div class="prose-hito">
    <span class="prose-hito-fecha">2014 · Mt. Gox</span>
    <p>Desapareció con 850.000 BTC de sus clientes.</p>
  </div>
</div>

<!-- Pasos numerados (la numeración la pone el CSS) -->
<ol class="prose-pasos">
  <li><strong>Comprueba que puedes sacar el dinero.</strong> …</li>
</ol>
```

### Avisos (callouts)

```html
<div class="prose-callout prose-callout--tip">
  <span class="prose-callout-icon">✅</span>
  <div class="prose-callout-body">Texto del aviso o dato destacado.</div>
</div>
```

Variantes: `--info` (💡), `--tip` (✅), `--warning` (⚠️) y `--danger` (🚨). Se cambian la clase y el emoji del icono según el caso.

### Tablas e imágenes

`<table class="prose-table">` para tablas e `<img class="prose-img">` para imágenes, con el resto de etiquetas normales (`h2`–`h4`, `p`, `ul`/`ol`, `blockquote`, `code`).
