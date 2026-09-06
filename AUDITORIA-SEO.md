# AUDITORÍA SEO — el protocolo que se ejecuta al terminar CADA entrada y CADA guía

Esto no es documentación de consulta. Es un **procedimiento que Claude ejecuta paso a paso**, leyéndolo línea por línea, sobre la entrada o la guía que acaba de montar.

Está escrito desde un puesto concreto: el de alguien cuyo trabajo es que estas páginas compitan de tú a tú con Binance Academy, Bit2Me Academy, Coinbase Learn y los medios cripto en español. Esas webs tienen dominios con años de autoridad y equipos detrás. Contra eso no se gana escribiendo «bastante bien»: se gana **cumpliendo mejor que ellos lo que Google premia** y **cubriendo lo que ellos no pueden cubrir**.

Hay un motivo extra para que esta auditoría sea más severa que la de una web normal. Google clasifica el contenido sobre dinero, inversión e impuestos como **YMYL** (*Your Money or Your Life*), y a esas páginas les aplica el listón más alto de todo su sistema de evaluación. Cada entrada y cada guía de esta academia es YMYL. **Aquí no hay contenido menor.**

---

## CÓMO SE DISPARA — esto es lo primero, y no depende de que nadie lo recuerde

**Al terminar de montar una entrada o una guía nueva, Claude pregunta, siempre, con estas palabras o equivalentes:**

> ¿Empiezo la auditoría SEO de la entrada / de la guía?

Reglas del disparador:

1. Se pregunta **siempre**, aunque la entrada parezca corta, urgente o evidente. Una noticia de 500 palabras compite en Google exactamente igual que una guía de 3.000.
2. Se pregunta **después** de tener el contenido montado y **antes** de pedir la aprobación para publicar. El orden importa: auditar después de publicar es corregir en caliente, delante de los lectores y de Google.
3. **En cuanto el admin diga que sí, se ejecuta esto entero**, de la Fase 0 a la Fase 17, en orden, sin saltarse fases y sin resumirlas.
4. Si dice que no, se anota en el mensaje de cierre que la entrada **queda sin auditar**, para que conste.
5. No se pregunta dos veces por lo mismo. Pero si el admin pide cambios grandes después de una auditoría en verde, se vuelve a preguntar: el texto ya no es el que se auditó.

**Esto aplica también a una entrada o guía existente que se reescriba a fondo**, no solo a las nuevas. Cambiar la mitad del cuerpo es publicar otra página en la misma URL.

---

## ANTES DE EMPEZAR: dónde vive lo que vas a corregir

Las correcciones se aplican en sitios distintos según el tipo, y confundirlos cuesta una hora:

| Tipo | Dónde vive el texto | Cómo se corrige |
|---|---|---|
| **Entrada** | Una **fila de la tabla `posts`** en Supabase: `content`, `title`, `excerpt`, `seo_title`, `meta_description`, `focus_keyword` | Con un script de Node contra Supabase usando `SUPABASE_SERVICE_ROLE_KEY` de `.env.local` — el mismo patrón que `scripts/check-contenido.mjs`. **Nunca** se crea un `.tsx` para una entrada |
| **Guía** | `src/app/guias/<slug>/page.tsx` y su `<slug>.css` | Editando el componente |
| **Ficha del diccionario** | El campo `extended` del término en `src/lib/glosario.ts` | Editando el archivo. Tiene su protocolo propio en [`PLANTILLA-DICCIONARIO.md`](./PLANTILLA-DICCIONARIO.md) |

Y una regla que gobierna toda la auditoría:

> **Cada fase se corrige antes de pasar a la siguiente, y se vuelve a medir.**
>
> Nada de apuntar quince fallos y arreglarlos al final. Arreglar la estructura cambia el recuento de palabras; cambiar el título cambia la densidad; añadir un enlace cambia el bloque de enlazado. Auditar en bloque y corregir en bloque es cómo se acaba con una página que pasa el script y no responde a nada.

---

## FASE 0 · Preparar la mesa

**0.1 — Levanta el servidor.** La auditoría se hace contra **el HTML que se sirve**, no contra el código ni contra el borrador. Es lo que ve Google.

```bash
npm run dev
```

**0.2 — Ten a mano estos tres datos**, y escríbelos en el informe:

- La **ruta** exacta: `/post/<slug>` o `/guias/<slug>`.
- El **tipo**: entrada o guía. Los umbrales cambian.
- La **consulta objetivo**: en una entrada es el `focus_keyword` de su fila; en una guía, la consulta por la que se creó.

**0.3 — Comprueba que la página responde 200 sin sesión.**

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/post/<slug>
```

Si da **404** siendo una entrada premium, para: es el fallo que describe AGENTS.md —contenido de pago protegido y a la vez invisible— y hay que resolverlo antes de auditar nada. Si da **307**, la ruta está protegida por `src/proxy.ts` y no la va a indexar nadie.

**0.4 — Lee la página entera, de arriba abajo, como un lector.** Antes de medir nada. Esta lectura produce la mitad de los hallazgos que ningún script encuentra, y hacerla *después* de las métricas no vale: ya vas condicionado por los números.

Al terminar, contesta por escrito, en una frase cada una:

- ¿Qué se lleva alguien que solo lea los tres primeros párrafos?
- ¿En qué punto se perdería un principiante?
- ¿Qué frase sobra?

---

## FASE 1 · La consulta: qué busca de verdad quien va a llegar aquí

Va primero porque **condiciona todo lo demás**. Una página impecable que responde a otra pregunta no posiciona.

**1.1 — Escribe la consulta objetivo tal cual la teclearía el lector.** En minúsculas, con la torpeza incluida: `como tributan los airdrops`, no `tratamiento fiscal de las distribuciones gratuitas de criptoactivos`.

**1.2 — Clasifica la intención.** Solo hay cuatro, y la página tiene que servir a una:

| Intención | Qué quiere quien busca | Qué tiene que ser la página |
|---|---|---|
| **Informativa** | Entender algo | Explicación, ejemplo y error típico |
| **Navegacional** | Llegar a un sitio concreto | Casi nunca es nuestro caso |
| **Comercial** | Comparar antes de decidir | Criterios, tabla, ventajas y contras |
| **Transaccional** | Hacer algo ya | Pasos numerados, sin teoría de más |

**El fallo caro es responder «informativa» a una consulta transaccional.** Quien busca «cómo declarar cripto» quiere los pasos, no la historia del impuesto. Si el texto empieza contextualizando durante tres párrafos, se vuelve al buscador — y esa vuelta Google la mide.

**1.3 — Lista la cola larga.** Entre 5 y 10 formulaciones distintas de la misma necesidad. Salen de tres sitios, por orden de fiabilidad:

1. **Search Console → Rendimiento → Consultas**, filtrando por páginas parecidas. Es el único dato real que tenemos.
2. Las sugerencias del propio buscador y el bloque de «Otras preguntas».
3. Las preguntas que hace un principiante en el grupo de Telegram.

**1.4 — Con el texto delante, comprueba cuáles de esas formulaciones responde la página.** Una por una. Las que no responda y sean relevantes: o entran en un `<h2>` o en la FAQ, o se anota por qué se descartan.

**Criterio para pasar de fase:** la consulta objetivo está escrita, la intención clasificada, y no queda ninguna formulación relevante sin respuesta ni sin motivo por el que se descarta.

---

## FASE 2 · El hueco: qué tienen los que ya están arriba, y qué no pueden tener

No se compite escribiendo lo mismo un poco mejor. Se compite **cubriendo lo que al de arriba le falta**.

**2.1 — Mira los tres o cuatro primeros resultados de la consulta objetivo.** Qué son: ¿fichas de exchange? ¿medios? ¿foros? Eso dice qué formato premia Google para esa consulta, y no se discute: si los tres primeros son tutoriales con pasos, un ensayo no va a entrar.

**2.2 — Anota los subtemas que cubren TODOS.** Si los tres hablan de comisiones y nuestra página no, eso no es una elección de estilo: es una carencia. Lo que cubren todos es **el mínimo de la consulta**.

**2.3 — Anota lo que no cubre NINGUNO.** Ahí está la partida. Y esta web tiene tres huecos estructurales que las grandes no pueden llenar:

1. **El ángulo español.** Hacienda, el método FIFO, la declaración informativa de bienes en el extranjero, los tramos del ahorro. Binance Academy escribe para el mundo y no puede entrar ahí. Lo dicen además nuestros propios datos: la consulta que más impresiones trae al sitio es de fiscalidad.
2. **El error típico.** Las webs de las plataformas explican qué es algo; no explican cómo se equivoca la gente con eso, entre otras cosas porque a menudo ese error les beneficia.
3. **Números propios y concretos.** Un ejemplo con cifras reales vale más que tres párrafos de teoría, y es lo primero que alguien copia en un foro o en redes — que es como se consiguen enlaces sin pedirlos.

**2.4 — Escribe en una frase qué añade esta página al mundo.** Si la frase es «lo mismo que los demás, pero en nuestra web», **la página no está lista**: le falta el ángulo, y ninguna optimización posterior lo arregla.

**Criterio para pasar de fase:** hay al menos **un** subtema que cubrimos y los de arriba no, desarrollado de verdad —con su sección, su tabla o su ejemplo—, no mencionado de pasada.

---

## FASE 3 · El resultado en Google: title, description y URL

Es lo único que ve el 100 % de quien nos encuentra. Una página excelente con un título mediocre pierde contra una página mediocre con un título excelente, porque **la segunda es la que se pulsa**.

**3.1 — Monta el snippet y míralo.** Escríbelo tal como sale en el buscador, con el sufijo puesto:

```
adelinacademy.com › post › <slug>
<seo_title> | AdelinBTC
<meta_description>
```

**3.2 — Title. Cuatro comprobaciones, todas obligatorias:**

| Regla | Umbral | Por qué |
|---|---|---|
| Longitud | **≤ 48 caracteres** sin el sufijo | El layout añade ` \| AdelinBTC`, 12 más. Google corta sobre los 60 |
| La palabra clave, **delante** | Primeras 3-4 palabras | Lo que se recorta es el final: una keyword al final desaparece justo cuando más falta hace |
| Sin coletillas | 0 | «y por qué importa» ocupaba 18 caracteres en cuatro entradas y no aportaba ni una búsqueda |
| Promete algo concreto | — | «Qué es el staking» informa; «Staking: cuánto se gana y qué paga Hacienda» se pulsa |

`npm run check` vigila el límite de 48 **solo en la metadata escrita en los `page.tsx`**. El `seo_title` de una entrada vive en Supabase: ahí el límite lo aplicas tú, y lo verifica después `check:seo` contra la página servida.

**3.3 — Description. Tres comprobaciones:**

- **Entre 110 y 160 caracteres.** Por debajo desaprovecha sitio; por encima se corta a media frase.
- **Contiene la palabra clave** — Google la resalta en negrita, y eso sube el porcentaje de clics por sí solo.
- **Dice qué se lleva quien entra**, no de qué va la página. «Explicamos el método FIFO» es una etiqueta. «Cuál de tus bitcoin vende Hacienda primero, con un ejemplo de tres compras y el cálculo hecho» es una promesa.

**3.4 — La URL.** Corta, con la palabra clave, sin años salvo que el contenido sea de ese año, sin palabras vacías. **Y si la página ya está indexada, no se toca**: cambiar un slug indexado obliga a montar una redirección y desperdicia todo lo acumulado.

Antes de fijar una URL nueva, **compárala con cada `Disallow` de `src/app/robots.ts`**. El bloqueo es **por prefijo**: que no coincida exactamente no basta, tiene que no empezar igual. Este error ya dejó dos fichas sin poder rastrearse.

**Criterio para pasar de fase:** snippet escrito, las tres piezas dentro de límites, y la respuesta honesta a esta pregunta: **si esto saliera el cuarto, ¿lo pulsarías antes que a los tres de arriba?** Si no, se reescribe el título.

---

## FASE 4 · La respuesta, arriba del todo

La estructura que funciona es la de una noticia bien escrita: **la conclusión primero, el desarrollo después**. Quien busca algo quiere la respuesta, no el camino que llevó a ella.

**4.1 — Localiza el primer bloque de texto real** (el que va después del H1, antes del primer `<h2>`).

**4.2 — Comprueba que responde la consulta de forma directa y completa.** Si alguien leyera solo eso y cerrara, ¿tendría su respuesta? Si la respuesta es «no, tendría el contexto», hay que reescribirlo.

**4.3 — La palabra clave aparece ahí**, de forma natural, sin forzar. El auditor lo comprueba y avisa si no.

**4.4 — Nada se interpone entre el H1 y esa respuesta.** Ni un banner, ni una oferta, ni un aviso largo. Quien llega desde Google tiene que ver la respuesta antes que cualquier otra cosa; si lo primero es una llamada a registrarse, se vuelve al buscador.

**4.5 — Los primeros dos párrafos no pueden empezar contextualizando.** «Desde la aparición de Bitcoin en 2009…» es la fórmula que separa a las páginas que posicionan de las que no. Se corta y se empieza por la respuesta.

**Criterio para pasar de fase:** los tres primeros párrafos, leídos solos, resuelven la consulta.

---

## FASE 5 · El esqueleto: los encabezados

Los encabezados no son decoración tipográfica: son **el índice con el que Google entiende de qué va cada parte** y lo que decide qué fragmento enseña en los resultados.

**5.1 — Un solo `<h1>`, y contiene la palabra clave.**

**5.2 — Sin saltos de nivel.** De `h2` no se pasa a `h4`. El auditor lo cuenta.

**5.3 — Número mínimo de `<h2>` en el cuerpo:**

| Tipo | Mínimo |
|---|---|
| Entrada | **3** |
| Guía | **4** |
| Ficha del diccionario | **4** (la plantilla fija 5) |

**5.4 — Cada `<h2>` describe lo que hay debajo, y podría buscarse en Google.** Es la diferencia entre un índice y una etiqueta:

| Mal | Bien |
|---|---|
| «Introducción» | «Qué es el staking en una frase» |
| «Consideraciones» | «Lo que cuesta de verdad, con números» |
| «Conclusión» | «Cómo elegir sin arrepentirte» |

Un `<h2>` de una sola palabra casi nunca describe nada: el auditor lo marca como fallo.

**5.5 — El orden sigue el orden de las dudas del lector**, no el de la exposición académica. Qué es → por qué me importa → cuánto cuesta → en qué me puedo equivocar → qué hago.

**5.6 — Al menos un `<h2>` reproduce, o casi, una formulación de la cola larga de la Fase 1.** Es lo que hace que la página pueda aparecer para más de una consulta.

**Criterio para pasar de fase:** leyendo solo los encabezados, en orden, se entiende el argumento entero de la página.

---

## FASE 6 · La palabra clave: suelo, techo y variantes

Aquí se cometen los dos errores opuestos, y **el que más se comete es el que menos se vigila**.

**6.1 — Mide la densidad.**

```bash
npm run check:seo -- post/<slug> "<focus_keyword>"
```

El tercer argumento es opcional pero **en una entrada se pone siempre**: sin él, el auditor deduce la clave del slug, y en una noticia el slug y la consulta objetivo casi nunca coinciden. Con el `focus_keyword` de la fila se mide lo que de verdad se persigue.

**6.2 — El suelo: ≥ 0,4 %.** Es el fallo real y documentado de esta web: en la primera ficha auditada la palabra clave aparecía **una vez en 1.419 palabras** — un 0,07 %— por evitar sonar a relleno. Google necesita ver el término. Se corrige usándolo **donde pertenece de verdad**: en los `<h2>`, al presentar cada apartado, y al describir los casos concretos. Nunca metiéndolo con calzador en frases que no lo pedían.

**6.3 — El techo: ≤ 2,5 %.** Por encima suena a máquina y se lee peor. Se corrige sustituyendo por pronombres y por variantes, no borrando frases.

**6.4 — Las variantes y el campo semántico.** Google no busca cadenas de texto, busca **entidades**. Una página sobre exchanges que no menciona custodia, comisiones, KYC, cartera, retirada ni orden, es una página que habla de la palabra sin hablar del tema. Lista los 8-12 términos que cualquiera que domine el asunto usaría, y comprueba cuáles faltan.

**6.5 — La palabra clave está en:** el `title`, el `<h1>`, la `description`, el primer párrafo y **al menos un `<h2>`**. Los cuatro primeros los verifica el auditor.

**6.6 — Longitud del cuerpo:**

| Tipo | Rango | Nota |
|---|---|---|
| Entrada | **500-1.500** palabras | El rango es amplio a propósito: **manda el tema, no la cifra** |
| Guía | **800+** | Lo que se mide es lo renderizado en el servidor, ver 6.7 |
| Ficha | **1.200-2.200** | Para competir con Binance y Bit2Me |

**Nunca se rellena para llegar al mínimo, ni se poda algo que aporta para no pasarse.** Una página larga y hueca posiciona peor que una corta y densa: es exactamente el problema que Google atacó con las actualizaciones de contenido útil.

**6.7 — Aviso para las guías.** Buena parte de una guía vive en componentes de cliente —quiz, gráficos, minijuegos— y **eso no está en el HTML que recibe el rastreador**. Si el auditor dice 900 palabras en una guía que parece de 3.000, no es un fallo del script: es lo que Google ve de verdad. Si el contenido que sostiene la consulta está dentro de un componente interactivo, **hay que sacar una versión en texto al servidor**.

**Criterio para pasar de fase:** densidad entre 0,4 % y 2,5 %, la clave en los cinco sitios, y ningún término del campo semántico ausente sin motivo.

---

## FASE 7 · Cómo se lee

El lector objetivo de esta academia **empieza**. Un texto que solo entiende quien ya sabe no es un texto exigente: es un texto que ha fallado.

**7.1 — Frase media ≤ 24 palabras.** Lo mide el auditor.

**7.2 — Ninguna frase por encima de 40 palabras.** Se parte en dos. Siempre se puede.

**7.3 — Ningún párrafo por encima de 120 palabras.** En un móvil, un párrafo largo es un muro gris que se salta entero.

**7.4 — Cada tecnicismo, explicado en su primera aparición o enlazado al diccionario.** Es la regla de la Fase 9, y aquí se mira desde el otro lado: no «¿está enlazado?», sino «¿se entiende la frase sin salir de la página?».

**7.5 — Voz activa y segunda persona.** «Hacienda considera que has vendido» se entiende; «se considera producida una alteración patrimonial» no. Esto no es estilo: es que el lector abandone o no.

**7.6 — Fuera las cuatro muletillas que no dicen nada:** «es importante destacar», «cabe señalar», «en el mundo de las criptomonedas», «como todos sabemos». Búscalas y bórralas; la frase siempre queda mejor.

**7.7 — Ninguna afirmación vaga donde puede haber un número.** «Las comisiones pueden ser altas» → «entre el 0,1 % y el 1,5 %, quince veces de diferencia sobre la misma compra».

**Criterio para pasar de fase:** el auditor en verde en las tres métricas, y ninguna frase que haya que leer dos veces.

---

## FASE 8 · E-E-A-T y el ángulo español

Esto es lo que Google mira en contenido YMYL, y es donde una web pequeña puede ganar a una grande: **experiencia de primera mano** es lo único que no se compra con presupuesto.

**8.1 — Experiencia.** ¿Hay algo aquí que solo pueda escribir quien lo ha hecho? Una cifra propia, una operación real, un error cometido, una captura de una plataforma que se usa. Si toda la página se pudo escribir leyendo otras páginas, **falta lo único que nos diferencia**.

**8.2 — Pericia.** El texto demuestra que se domina el tema si: nombra los matices, dice cuándo la regla general no aplica y admite lo que no se sabe. Un texto sin ninguna excepción es un texto superficial.

**8.3 — Autoridad.** ¿Enlaza a lo nuestro que sostiene la afirmación —la guía, la ficha, la entrada anterior—? La autoridad interna se construye enlazando, no proclamando.

**8.4 — Confianza. Es la que más pesa, y aquí es innegociable:**

- Nada de promesas de rentabilidad, ni explícitas ni sugeridas.
- Ningún dato inventado ni redondeado a favor.
- El **descargo de responsabilidad** donde toca. Vive en un solo sitio, `src/components/DisclaimerRiesgo.tsx`, y **jamás se escribe a mano en una página**: si el texto vive en dos sitios acaban diciendo cosas distintas, y entonces ya no protege.
- Fechas visibles cuando el contenido caduca. Una entrada de fiscalidad sin año es una entrada que envejecerá mintiendo.

**8.5 — El ángulo español, explícito.** Es el hueco de la Fase 2 convertido en sección. Pregúntate: ¿qué cambia de esto para alguien que declara en España? Si la respuesta es «nada», dilo — también es información útil, y nadie más se la da.

**8.6 — Verifica los datos que has escrito.** Cada cifra, cada fecha, cada porcentaje. En YMYL un dato mal no es una errata: es la razón por la que Google deja de mostrar un dominio entero.

**Criterio para pasar de fase:** hay al menos un elemento de experiencia propia, ninguna afirmación sin respaldo, y el descargo puesto por componente.

---

## FASE 9 · Los enlaces que salen, y la regla del diccionario

**9.1 — Mínimos, que verifica el auditor:**

| Tipo | Enlaces internos en el cuerpo |
|---|---|
| Entrada | **2-4** |
| Guía | **≥ 2** |
| Ficha | **≥ 5** |

**9.2 — Todos responden 200.** Lo comprueba el auditor uno a uno. Un término del diccionario sin `extended` da **404**, y una guía que no esté en `GUIDES` tampoco existe.

**9.3 — El ancla es una palabra que ya estaba en el texto.** Nunca se añade una frase para poder colocar un enlace, y nunca se escribe «pincha aquí»: el texto del enlace es lo que le dice a Google de qué va el destino.

**9.4 — LA REGLA DEL DICCIONARIO. Se aplica sin excepción.**

> Todo término técnico que aparezca **por primera vez** en una entrada o en una guía va enlazado a `/glosario/<slug>`. Y **si no existe en el diccionario, se crea antes de publicar**.

El procedimiento, en este orden:

1. **Repasa el texto buscando jerga**: mecanismos (*vesting*, *staking*, *halving*), instrumentos (*futuros*, *stablecoin*), métricas (*market cap*, *oferta circulante*) y operativa (*apalancamiento*, *stop-loss*, *liquidación*).
2. **Comprueba cuáles están ya** en `src/lib/glosario.ts` **con su campo `extended`**.
3. **Los que falten, créalos**: `term`, `slug`, `category`, `definition` corta, `extended` de ~150-250 palabras y `seeAlso` con tres slugs que existan.
4. **Enlaza solo la primera aparición.** Repetir el mismo enlace cinco veces no aporta y ensucia la lectura.

Esto no es cosmético y hace tres cosas a la vez: quien empieza entiende lo que lee sin salir del sitio, cada término gana enlaces internos que lo posicionan —el diccionario son 50 URLs indexables, el bloque más grande de la web— y el texto deja de asumir un vocabulario que el lector objetivo no tiene.

```bash
npm run check:contenido -- <slug>
```

Avisa de los términos del diccionario que la entrada menciona sin enlazar. El aviso no bloquea —hay menciones que no son la primera, o que van dentro de una cita— pero **se mira entero**.

**9.5 — Enlaces externos en el cuerpo: cero.** Es regla de la casa y el auditor la comprueba.

**Criterio para pasar de fase:** mínimos cumplidos, ningún destino roto, ningún tecnicismo suelto.

---

## FASE 10 · Los enlaces que entran, y la canibalización

Un enlace que sale reparte autoridad. **Un enlace que entra es el que la trae**, y es lo que casi nadie hace al publicar.

**10.1 — La página nueva necesita al menos 2 enlaces entrantes desde otras páginas del sitio.** El auditor los busca recorriendo el sitemap. Una página sin ningún enlace entrante es **huérfana**: Google la descubre por el sitemap, la rastrea con desgana y la interpreta como periférica.

**10.2 — De dónde salen esos enlaces:**

- De la **ficha del diccionario** del término principal, si existe.
- De la **guía** que trata el tema en profundidad.
- De la **entrada anterior** que ya lo mencionaba de pasada — y ahí el enlace se coloca sobre la palabra que ya estaba escrita.

**10.3 — Canibalización: comprueba que no compites contigo mismo.** Si ya hay otra página nuestra apuntando a la misma consulta, Google tiene que elegir, y a menudo elige mal o no elige. Hay tres salidas, por orden de preferencia:

1. **Fusionar**: quedarse con una y redirigir la otra.
2. **Diferenciar**: cambiar el enfoque de una de las dos y su título.
3. **Jerarquizar**: dejar una como principal y que la otra la enlace y trate un subtema.

Publicar una tercera página sobre lo mismo **nunca** es la salida.

**Criterio para pasar de fase:** ≥ 2 enlaces entrantes reales, y ninguna otra página del sitio disputando la misma consulta.

---

## FASE 11 · Datos estructurados

**11.1 — Qué debe emitir cada tipo:**

| Tipo | Esquema | ¿Automático? |
|---|---|---|
| Entrada | `Article` + `BreadcrumbList` | Sí, los genera `/post/[slug]` |
| Guía | `BreadcrumbList` | **No: hay que añadir `<GuideBreadcrumbJsonLd slug={SLUG} />`** |
| Ficha | `DefinedTerm` + `BreadcrumbList` (+ `FAQPage` si hay FAQ) | Sí |
| Todas | `Organization` + `WebSite` | Sí, en el layout raíz, una sola vez |

**11.2 — Todo el JSON-LD parsea.** Lo comprueba el auditor.

**11.3 — LA REGLA QUE NO SE PUEDE ROMPER: no declares nada que el visitante no pueda ver.** Google lo llama spam de datos estructurados y lo penaliza. Nada de valoraciones inventadas, autores falsos ni preguntas que solo existen en el esquema. Si emites `FAQPage`, **las preguntas tienen que estar visibles en la página**, y el auditor compara los dos recuentos.

**11.4 — Las migas de pan del esquema replican las visibles.** Están escritas dos veces en `/post/[slug]`: en el `<nav className="post-breadcrumb">` y en el `breadcrumbSchema`. Si cambias una, cambia la otra.

**11.5 — `isAccessibleForFree` sale de `is_premium`.** Es lo que evita que Google interprete el muro de pago como *cloaking*.

**Sobre el resultado enriquecido de FAQ, sin humo:** desde 2023 Google solo lo muestra a webs oficiales de administración y salud. **Aquí no va a salir.** Se emite igual porque no cuesta nada y porque lo leen los asistentes de IA, pero el valor está en el contenido visible, no en el adorno del buscador.

**Criterio para pasar de fase:** los esquemas que tocan, todos parsean, y nada declarado que no se vea.

---

## FASE 12 · Imágenes, portada y peso

Lo que Google mide de la velocidad es la experiencia real: **LCP** (cuándo aparece lo grande), **INP** (cuánto tarda en responder a un toque) y **CLS** (cuánto se mueve la página mientras carga). Una portada sin optimizar los estropea los tres.

**12.1 — La portada, en WebP. Siempre.** Ancho máximo 1.600 px, calidad 82, con `sharp`. Regla sin excepciones: el admin da la imagen y Claude la optimiza sin preguntar. Tres portadas de fiscalidad pesaban **8 MB en PNG** y quedaron en **904 KB**: un 89 % menos sin diferencia visible.

**12.2 — El panel admite 5 MB, y que entre no significa que valga.** Un PNG de 2,7 MB hace más daño a la carga que todo lo que se gane optimizando el servidor.

**12.3 — Se sube a Supabase Storage** (bucket `media`, nombre `${Date.now()}-${slug}.webp`) y se guarda la **URL pública** en `cover_image`. Nunca se enlaza una imagen alojada fuera.

**12.4 — Toda imagen con `alt` descriptivo.** Describe lo que se ve, no repite la palabra clave. El auditor cuenta las que no lo tienen.

**12.5 — HTML por debajo de 400 KB.** Lo comprueba el auditor. Por encima, casi siempre es contenido duplicado en el marcado.

**Criterio para pasar de fase:** portada en WebP dentro de peso, todos los `alt` puestos, HTML dentro de límite.

---

## FASE 13 · Rastreo, canónica y sitemap

De poco sirve todo lo anterior si Google no puede llegar, o llega y ve dos páginas donde hay una.

**13.1 — `robots.txt` no la bloquea.** Y **el bloqueo es por prefijo**: que la ruta no coincida exactamente con un `Disallow` no basta, tiene que **no empezar igual**. Lo comprueba el auditor, y este fallo ya ocurrió de verdad.

**13.2 — Canónica propia, apuntando a sí misma, en ruta relativa.**

| Tipo | Qué hace falta |
|---|---|
| Entrada | Nada: la genera `/post/[slug]` |
| Guía | **Añadir `alternates: { canonical: "/guias/<slug>" }`** a su `metadata` |
| Página pública nueva | A mano, además de meterla en `STATIC_ROUTES` |

**Nunca en un `layout.tsx`**: en Next los metadatos del layout los heredan **todas** las rutas hijas, y una canónica ahí le pone la misma URL a media web.

**13.3 — Está en el sitemap.** Lo comprueba el auditor.

| Tipo | Cómo entra |
|---|---|
| Entrada | Sola, con `published = true`. Tarda menos de 1 h |
| Guía | **Solo si está en el array `GUIDES` de `src/lib/guides.ts`.** El sitemap recorre ese array, no la carpeta |
| Ficha | Sola, en cuanto tiene `extended` |

Una guía con su `page.tsx` pero sin su alta en `GUIDES` **es invisible para Google**.

**13.4 — Sin `noindex`.** Lo comprueba el auditor.

**13.5 — Nada de inventar `lastModified`.** Solo donde hay fecha real. Una fecha de compilación que miente hace más daño que una ausente.

**Criterio para pasar de fase:** el bloque de rastreo del auditor, entero en verde.

---

## FASE 14 · Los apoyos visuales

Sin fotos que rompan el texto, son lo único que impide que mil palabras parezcan un muro. Y no son decoración: **una tabla o un gráfico dicen en un vistazo lo que un párrafo dice en treinta segundos**, y eso es tiempo de permanencia que se gana.

**14.1 — Mínimos:**

| Tipo | Bloques visuales |
|---|---|
| Entrada | **≥ 1 `.prose-chart`**, obligatorio |
| Guía | ≥ 1 |
| Ficha | **≥ 5 tipos distintos**, uno cada menos de 300 palabras |

**14.2 — El vocabulario disponible**, con el marcado listo para copiar en `/admin/posts-instrucciones`, bloque 08:

`prose-resumen` · `prose-vs` · `prose-chart` · `prose-dato` · `prose-hitos` · `prose-pasos` · `prose-callout` · `prose-table`

**14.3 — La regla que los gobierna: si el bloque no dice nada que el párrafo no diga ya, sobra.** Estructuran, no adornan.

**14.4 — Grafica la diferencia, no el total.** Salió de un rehacer real: el primer gráfico de la ficha de exchange comparaba «lo que queda de 1.000 €» con comisiones del 1,5 %, 0,5 % y 0,1 %. Las tres barras salían casi idénticas —98,5 / 99,5 / 99,9— y escondían justo lo que se quería enseñar. Graficando **el coste** —15 € / 5 € / 1 €— se ve de un vistazo.

**14.5 — En `.prose-chart-fill` el `width` se calcula a mano:** `(valor / valor_más_alto) × 100`.

**14.6 — Abre la página y míralos.** Hay cosas que solo se ven ahí: un icono de callout que falta —el emoji es marcado, no CSS—, una etiqueta recortada, un gráfico que no se entiende. Ya pasó, y ningún script lo detectó.

**Criterio para pasar de fase:** mínimos cumplidos, ningún bloque redundante y todos vistos renderizados.

---

## FASE 15 · La conversión, sin pagarla con el ranking

Una entrada tiene que convertir, pero **hay un orden que no se negocia**: primero la respuesta, después la oferta.

**15.1 — Nada se interpone entre el H1 y la respuesta.** Ya está en la Fase 4 y se repite aquí porque es donde se rompe.

**15.2 — A quien ya tiene cuenta no se le enseña la banda de registro.** Ya convirtió; enseñársela es ruido. En las fichas lo resuelve `TerminoCta`, que devuelve `null` si hay sesión.

**15.3 — El texto de un CTA no promete lo que el producto no hace.** Al escribir sobre una herramienta, **abre su código y comprueba que hace lo que vas a decir**. En una sola sesión aparecieron tres textos que prometían de más, y ese tipo de cosa acaba en una reclamación.

**15.4 — El cierre invita a lo que sigue.** Un enlace a la guía que profundiza, o al diccionario. Nunca «pincha aquí».

**Criterio para pasar de fase:** ninguna oferta antes de la respuesta y ninguna promesa que el producto no cumpla.

---

## FASE 16 · La pasada mecánica

Ahora, y no antes. Los scripts confirman lo que ya has arreglado; no lo encuentran por ti.

```bash
npm run check:seo -- post/<slug> "<focus_keyword>"   # la página servida
npm run check:contenido -- <slug>                     # la fila en Supabase
npm run check && npx tsc --noEmit                     # el código
```

Para una guía, además, se comprueba a mano lo que el auditor no puede saber: que está en `GUIDES`, que tiene su `<slug>.css`, su `<GuideBreadcrumbJsonLd>` y el cierre fijo con `GuideInteractions` y `Footer`.

**Los tres en verde. Sin excepciones y sin «esto no aplica».**

Y la advertencia que hace falta repetir: **`check:seo` sale en verde en una página que cumple todas las métricas y no responde a nada.** Mide lo que se puede contar. El criterio —si el texto responde de verdad, si el ejemplo aporta, si el título invita a pulsar— es de las fases anteriores, y ejecutar el script no las sustituye.

Si algo sale en rojo: **se corrige y se vuelve a ejecutar.** Un fallo no se justifica en el informe, se arregla. La única excepción es la deuda conocida ya registrada en `check-contenido.mjs`, que es de contenido antiguo y nunca de contenido nuevo.

---

## FASE 17 · El informe

Se entrega al admin **antes** de pedir la aprobación para publicar. Formato fijo:

```
AUDITORÍA SEO · <ruta>

Consulta objetivo   <la consulta> · intención <informativa|comercial|transaccional>
Qué añade           <la frase de la Fase 2.4>

Corregido
  · <qué estaba mal> → <qué se hizo>
  · …

Sin tocar, y por qué
  · <hallazgo> → <motivo>

Guardarraíles       check:seo ✓   check:contenido ✓   check + tsc ✓
Pendiente de ti     <lo que requiere una decisión del admin>
```

Dos reglas del informe:

1. **Se dice lo que quedó fuera y por qué.** Un informe que solo lista aciertos no informa de nada.
2. **Se separa lo hecho de lo pendiente de decisión.** Nada se publica antes de la aprobación explícita: `published = true` **dispara un aviso al grupo de Telegram** desde `anunciarPendientes()`. Publicar por cuenta propia manda un mensaje a la comunidad del admin.

---

## FASE 18 · Después de publicar

La auditoría no acaba en el `publish`. Estos son los únicos datos reales que vamos a tener.

**18.1 — No hay que tocar Search Console.** El sitemap la recoge sola en menos de 1 h. La inspección de URL con «Solicitar indexación» se reserva para algo puntual e importante: la cuota es de unas 10 al día.

**18.2 — A los 7 días**, en Search Console → Rendimiento, filtrando por esa página: ¿tiene impresiones? Si no tiene ninguna, no es un problema de optimización, es que **la consulta no tiene volumen** o la página no se ha indexado. Son dos diagnósticos distintos y se comprueban distinto.

**18.3 — A los 28 días**, tres lecturas:

| Lo que ves | Lo que significa | Qué se hace |
|---|---|---|
| Impresiones sí, clics no | El snippet no invita | Reescribir `seo_title` y `meta_description` |
| Posición 8-20 | Estás cerca | Ampliar la sección que responde a la consulta que ya trae impresiones |
| Consultas inesperadas | Google te ha entendido mejor que tú | **Escuchar**: es la mejor pista para la siguiente entrada |

**18.4 — Lo que aprendas, vuelve aquí.** Si una lección se repite dos veces, se escribe en este documento. Es lo que impide que la auditoría se quede congelada mientras Google cambia.

---

## Lo que NO se hace nunca

1. **Rellenar para llegar al mínimo de palabras.** Una página larga y hueca posiciona peor que una corta y densa.
2. **Reciclar párrafos entre páginas.** Es contenido duplicado bajo tu propio dominio, y es el atajo evidente cuando se escriben varias del mismo tema. `check:glosario` lo caza en las fichas; en las entradas lo cazas tú.
3. **Meter la palabra clave donde no encaja.** Se nota, se lee peor y ya no funciona desde hace más de una década.
4. **Declarar en el esquema algo que no se ve.**
5. **Prometer rentabilidades, ni siquiera de forma indirecta.**
6. **Publicar sin la aprobación del admin.** Dispara un aviso en su grupo de Telegram.
7. **Cambiar el slug de una página ya indexada** sin montar la redirección.
8. **Dar por buena una página porque el script salió en verde.** Es la trampa que este documento existe para evitar.

---

## Resumen de una línea

> Cada fase se mide, **se corrige y se vuelve a medir**; los scripts van al final y confirman, no descubren; y lo que decide si esta página gana no es ninguna métrica de aquí, sino haber respondido la consulta mejor que los tres de arriba y haber contado lo que ellos no pueden contar.
