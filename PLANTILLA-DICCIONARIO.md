# Plantilla de una ficha ampliada del diccionario

La estructura y el diseño que sigue **toda** ficha ampliada. Se fijó el 07-09-2026 con `exchange`, la primera, después de auditarla entera contra el HTML servido.

No es una sugerencia de estilo: cada regla de aquí sale de un fallo real o de un dato de Search Console, y hay dos guardarraíles que las comprueban.

```bash
npm run check:glosario           # el texto: longitud, enlaces, densidad, relleno
npm run check:seo -- glosario/<slug>   # la página servida: SEO, encabezados, esquemas
```

El segundo necesita `npm run dev` levantado, y por eso no está en el hook de `pre-push`.

---

## 1 · Antes de escribir

**El orden lo decide Search Console, no la intuición.** Rendimiento → Consultas, y se amplía lo que ya recibe impresiones. Ampliar un término que nadie busca es trabajo perdido por bueno que quede. La lista de por dónde seguir vive en [`TAREAS.md`](./TAREAS.md).

Y antes de escribir una línea, **comprobar los destinos que vas a enlazar**:

```bash
for d in /glosario/dex /guias/fiscalidad-cripto-espana /post/metodo-fifo-criptomonedas; do
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

El vocabulario completo está en `/admin/posts-instrucciones`, bloque 08, con el marcado listo para copiar. Sirve igual en las entradas del blog.

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
