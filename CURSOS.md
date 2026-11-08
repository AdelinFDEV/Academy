# CURSOS — cómo se crea un curso de pago, de la idea a la publicación

**Léelo entero antes de escribir una línea de un curso nuevo.** Es la fuente de verdad del proceso y viaja en el repo: vale igual desde cualquier ordenador. Se escribió el 08-11-2026 a partir del primer curso publicado, **«Psicología del trading»** (`scripts/cursos/psicologia-del-trading/`), que es la **referencia viva**: ante cualquier duda de formato, ábrelo y copia su forma.

Lo que hay en este archivo:

1. [Las reglas que no se negocian](#1--las-reglas-que-no-se-negocian)
2. [El proceso, paso a paso](#2--el-proceso-paso-a-paso)
3. [Fase 1 · Investigar y el informe](#3--fase-1--investigar-y-el-informe)
4. [La paleta de cada curso](#4--la-paleta-de-cada-curso)
5. [Los archivos del curso](#5--los-archivos-del-curso)
6. [Cómo se escribe una lección](#6--cómo-se-escribe-una-lección)
7. [Los bloques interactivos](#7--los-bloques-interactivos)
8. [Exámenes y preguntas](#8--exámenes-y-preguntas)
9. [Certificado, vitrina y logro](#9--certificado-vitrina-y-logro)
10. [Accesos y seguridad](#10--accesos-y-seguridad)
11. [Diccionario, aviso legal y textos](#11--diccionario-aviso-legal-y-textos)
12. [Subir, probar y publicar](#12--subir-probar-y-publicar)
13. [Dónde aparece un curso en la web](#13--dónde-aparece-un-curso-en-la-web)

---

## 1 · Las reglas que no se negocian

| Regla | Por qué |
|---|---|
| **Primero un informe, después el curso.** Nada se escribe ni se sube hasta que el admin aprueba el informe de la Fase 1 | El temario, las fuentes y el logro se deciden una vez, con el admin, y no a mitad de escribir |
| **Cada afirmación, con su fuente fiable y su URL** en el informe, y con su matiz en la lección (muestra, país, periodo; correlación no es causa) | Todo el contenido es YMYL. Una cifra sin fuente o exagerada hunde la credibilidad del curso entero |
| **Cada curso, su propia paleta de color**, distinta de la de los cursos anteriores. El certificado la hereda | Ver el [punto 4](#4--la-paleta-de-cada-curso). Que cada curso se reconozca de un vistazo, también su certificado |
| **No se promete lo que el curso no hace.** Ni ganancias, ni «dominar», ni resultados garantizados | Normativa de consumo y YMYL. La promesa honesta vende mejor a largo plazo |
| **SIEMPRE: toda palabra técnica, o que merezca explicarse, se define en el diccionario y se enlaza** en su primera aparición en cada lección, en las preguntas no (ahí no hay enlaces). Si no existe, se crea **en el momento, sin esperar a que lo pida nadie**, con una definición buena, y antes de publicar. Ante la duda, se crea | Pedido expreso del admin (08-11-2026) y regla intocable de AGENTS.md. Así se hizo en el primer curso: 12 términos nuevos. `subir-curso.mjs` avisa si una lección no enlaza ninguno |
| **Nada de emojis** en lecciones, bloques ni textos del curso. Los callouts van **sin** el icono-emoji | Dirección de diseño de la academia |
| **Nunca se publica sin el «sí» explícito del admin.** `"published": true` en `curso.json` lo hace visible al subir | No hay paso intermedio para echarse atrás |
| **El curso es contenido (filas), no código.** Si hace falta código nuevo (un bloque, un aviso), se pregunta antes y se reutiliza lo que ya hay | La web no crece con cada curso (decisión del admin, 06-10-2026) |
| **Al quitar algo, se borra todo su código** | Regla general de la web |

---

## 2 · El proceso, paso a paso

```
Fase 1  Investigar → informe en informes/curso-<slug>.md → el admin lo aprueba
Fase 2  Paleta y logro → términos del diccionario que falten
Fase 3  curso.json → lecciones → bancos de preguntas
Fase 4  subir-curso.mjs --probar → subir como BORRADOR → recorrerlo como alumno
Fase 5  Auditoría SEO de la ficha (se pregunta siempre) → «sí» del admin → publicar
```

Antes de empezar, pregunta al admin lo que no esté claro: el tema exacto, el público, si hay que pedir algo de código nuevo. Y da de alta la tarea en `TAREAS.md`; bórrala en el mismo commit en que se cierre.

---

## 3 · Fase 1 · Investigar y el informe

**Investigar a fondo en la web antes de proponer nada.** Fuentes, por orden de peso:

1. **Supervisores y organismos oficiales:** ESMA, CNMV, BIS, IOSCO, BOE, AEAT, DGT, EBA/EIOPA, textos de reglamentos (MiCA, MiFID II).
2. **Estudios revisados por pares**, con su revista y su año (Journal of Finance, AER, PNAS…). Si solo se ha podido leer el resumen, se dice.
3. **Libros de práctica reconocidos**, citados como marco práctico, **nunca como prueba**. Donde un libro y un estudio dicen cosas distintas, manda el estudio.

Nunca: blogs de brokers, cifras redondas sin estudio detrás («el 90 % pierde el 90 % en 90 días»), webs de cursos rivales como fuente.

**El informe** va en `informes/curso-<slug>.md` (modelo: `informes/curso-psicologia-trading.md`) y propone:

1. Título y promesa honesta, con lo que el curso **no** hace.
2. Público y nivel (`básico`, `intermedio` o `avanzado`).
3. Temario por módulos y lecciones: el **objetivo** de cada lección y las **fuentes** que la sostienen.
4. Ejercicios prácticos por módulo, apoyados en las herramientas de la web que encajen (Diario de Trading, Nova, Portfolio, calculadoras).
5. Exámenes: preguntas por módulo, banco del final y cuántas salen.
6. El logro: nombre e icono propio.
7. La paleta propuesta (ver el punto 4).
8. Qué hay que tocar en el código, si algo.
9. Preguntas abiertas para el admin.
10. Todas las fuentes, con su URL.

Se presenta al admin y **se espera su aprobación**. Si cambia algo, se anota arriba del informe.

---

## 4 · La paleta de cada curso

**Cada curso tiene su paleta, y es distinta de la de todos los anteriores.** Pedido del admin el 08-11-2026.

La paleta sale del campo **`color`** de `curso.json` (un hexadecimal). Ese único color tiñe automáticamente:

- la portada del curso, la ficha y las tarjetas de `/cursos`;
- el acento del aula (temario, botones, barras de progreso);
- **el certificado**: las cintas del medallón, el resplandor de la banda azul noche y el tono del oro (`--cert-acento` en `components/aula/certificado.css`);
- la vitrina de certificados del dashboard.

No hay que tocar CSS para cambiar de paleta: basta con el `color`.

**Cómo elegirla:**

- Que **no se parezca** a la de ningún curso del registro de abajo. Busca otra familia (si ya hay un turquesa, no otro verde azulado).
- Que **case con el tema** (verde azulado de calma para psicología, dorado para fiscalidad…).
- Que se lea bien sobre el azul noche de la web: tonos medios y luminosos (luminosidad media-alta), nunca colores muy oscuros.
- **No uses el dorado `#e6b455`** para un curso nuevo: es el acento de la casa y ya lo tiene el de fiscalidad.
- Propónla en el informe y que el admin la apruebe.

**Registro de paletas** (añade cada curso nuevo aquí en el mismo commit):

| Curso | Slug | `color` | Familia | Estado |
|---|---|---|---|---|
| Psicología del trading | `psicologia-del-trading` | `#5ec8c4` | Verde azulado (turquesa) | Publicado 08-11-2026 |
| Seguridad cripto | `seguridad-cripto` | `#a78bfa` | Violeta | Publicado 08-11-2026 |
| Fiscalidad cripto en España | `fiscalidad-cripto-espana` | `#e6b455` | Dorado | Borrador |

Ideas libres para los siguientes: coral `#ff8a7a`, azul cobalto `#6f9bff`, verde lima `#a3e635`, rosa `#f472b6`, ámbar `#fbbf24`. Comprueba que el que elijas no choque con los colores de las herramientas (Diario `#ff9a4d`, Portfolio `#4f9dff`).

---

## 5 · Los archivos del curso

El contenido vive en **Supabase**; estos archivos son su copia con historial y la forma cómoda de escribirlo:

```
scripts/cursos/<slug>/
  curso.json                  ← datos del curso, módulos y lecciones
  lecciones/MM-LL-<slug>.html ← el texto de cada lección (01-01-…, 01-02-…)
  preguntas/modulo-<n>.json   ← un banco por módulo
  preguntas/final.json        ← el banco del examen final
```

### `curso.json`

```json
{
  "slug": "psicologia-del-trading",
  "titulo": "Psicología del trading",
  "subtitulo": "Una frase para la tarjeta del catálogo.",
  "descripcion": "El párrafo que vende el curso en su ficha. Honesto: qué hace y qué no.",
  "objetivos": ["Lo que sabrá hacer el alumno al terminar, 5-6 frases cortas."],
  "nivel": "intermedio",
  "portada": null,
  "color": "#5ec8c4",
  "aviso": "formacion",
  "logro": "Sangre Fría",
  "preguntas_final": 25,
  "revisado": "2026-11-08",
  "orden": 1,
  "published": false,
  "modulos": [
    {
      "orden": 1,
      "titulo": "Título del módulo",
      "descripcion": "Una o dos frases.",
      "nota_minima": 5,
      "preguntas_examen": 10,
      "lecciones": [
        { "slug": "slug-unico-de-la-leccion", "titulo": "…", "resumen": "Gancho para el temario público.", "minutos": 13, "archivo": "01-01-slug-unico-de-la-leccion.html" }
      ]
    }
  ]
}
```

| Campo | Qué saber |
|---|---|
| `slug` | La URL `/cursos/<slug>` y la clave del logro. **No se cambia una vez publicado**. `verificar` está reservado |
| `color` | La paleta: ver el punto 4 |
| `aviso` | El descargo de `DisclaimerRiesgo.tsx`: `formacion` (cursos de trading/inversión), `fiscal` (fiscalidad), `general`. Una variante nueva se añade **dentro de ese componente** y en el `check` de `cursos.aviso` (SQL) |
| `logro` | El nombre del logro. Corto, con carácter, que no repita otro logro de la web |
| `preguntas_final` | Cuántas salen en el final (el banco tiene que tener más) |
| `orden` | Posición en el catálogo. Que no empate con otro curso publicado |
| `lecciones[].slug` | **Único en toda la tabla**, no solo en el curso: no reutilices slugs de otros cursos. `examen` y `certificado` están reservados |
| `lecciones[].resumen` | Sale **público** en la ficha: es un gancho, no un resumen que cuente la lección entera |

**Tamaño de referencia:** 5-7 módulos de 3-5 lecciones; lecciones de 12-16 minutos (850-1.200 palabras más los bloques).

---

## 6 · Cómo se escribe una lección

HTML con el vocabulario `.prose-*` de la web (estilos en `globals.css`) más los bloques interactivos. Estructura que siguen todas las del curso de referencia:

1. **`prose-resumen`** al principio, con el título «En esta lección»: lo que se lleva quien no sigue leyendo.
2. **3-5 `<h2>`** con el desarrollo.
3. **Al menos dos piezas visuales distintas** (`prose-dato`, `prose-chart`, `prose-vs`, `prose-table`, `prose-pasos`, `prose-hitos`) y **uno o dos bloques interactivos**.
4. Los **ejercicios** del módulo, en la última lección o repartidos, con instrucciones concretas en las herramientas de la web.
5. **Cierre con `prose-callout prose-callout--tip`** que empieza por «**Quédate con esto:**».

Reglas de redacción:

- Frases cortas (media ≤ 24 palabras), para quien empieza.
- Cada cifra con su fuente nombrada en el texto (autor, año, revista u organismo) y su matiz. Sin enlaces externos en el cuerpo.
- Los callouts **sin** `prose-callout-icon` (nada de emojis):

```html
<div class="prose-callout prose-callout--info">
  <div class="prose-callout-body">Texto del aviso.</div>
</div>
```

- Variantes de callout: `--info`, `--tip`, `--warning`, `--danger`.
- El ancho de las barras de `prose-chart` se calcula a mano: `(valor / valor_más_alto) × 100`. Grafica la diferencia, no el total.
- **Comprueba las cuentas.** Si una lección cita una simulación o un cálculo, hazlo de verdad (un script de Python basta) antes de escribir la cifra.

---

## 7 · Los bloques interactivos

Se escriben así dentro del HTML, con el JSON exacto que pide cada uno:

```html
<div data-bloque="pregunta"><script type="application/json">
{ "enunciado": "…", "opciones": ["…", "…", "…", "…"], "correcta": 1, "explicacion": "…" }
</script></div>
```

El catálogo vive en `src/components/aula/Bloque.tsx` (una sola lista) y en `BLOQUES` de `scripts/subir-curso.mjs`. Si los datos no encajan, el alumno no ve nada y el admin ve un aviso rojo.

| Bloque | Para qué | Datos |
|---|---|---|
| `pregunta` | Comprobación rápida con explicación | `{ enunciado, opciones[], correcta (desde 0), explicacion }` |
| `verdadero-falso` | Desmontar mitos, de uno en uno | `{ titulo?, afirmaciones: [{ texto, verdadero, explicacion }] }` |
| `clasificar` | Llevar tarjetas a su grupo | `{ titulo, instrucciones?, grupos: [{ id, nombre }], elementos: [{ texto, grupo, explicacion? }] }` |
| `ordenar` | Poner pasos en orden | `{ titulo, instrucciones?, pasos: [] }` ← en el orden correcto, mínimo 3 |
| `grafico` | Barras, línea o área animadas | `{ tipo: "barras"\|"linea"\|"area", titulo?, subtitulo?, nota?, formato?: "eur"\|"pct"\|"num", apilado?, datos: [{ etiqueta, … }], series: [{ clave, nombre, color? }] }` |
| `tramos` | Escala por tramos (impuestos) | `{ titulo, etiqueta, tramos: [{ hasta \| null, tipo }], valorInicial, max, paso?, nota? }` |
| `fifo` | Simulador FIFO de lotes | `{ titulo, activo, compras: [{ fecha, cantidad, precio, comision? }], venta: { cantidad, precio, comision? } }` |
| `prospectiva` | Medir la aversión a la pérdida (moneda) | `{ titulo, perdida, ganancias: [] (de menor a mayor), nota? }` |
| `rachas` | Simular rachas de un método | `{ titulo, operaciones (10-500), acierto (%), ganancia_r?, perdida_r?, nota? }` |
| `calculadora-r` | Tamaño de posición y R | `{ titulo, capital, riesgo, entrada, stop, objetivo?, nota? }` |

**Un bloque nuevo** solo si ninguno sirve, y con permiso del admin: su componente en `src/components/aula/bloques/`, su validador, su línea en `Bloque.tsx` y en `BLOQUES` de `subir-curso.mjs`, su CSS en `src/app/aula/aula.css`, y su fila en esta tabla. Las animaciones, con `transform` y `opacity` (nunca `left`/`top` ni filtros animados: van a tirones en iPhone), y se apagan con `prefers-reduced-motion`.

---

## 8 · Exámenes y preguntas

**Las reglas del aula** (fuente única: `src/lib/cursos-progreso.ts`; no se reescriben en otro sitio):

- Las lecciones de un módulo abierto se hacen en cualquier orden.
- El examen de un módulo se abre al completar **todas** sus lecciones.
- El módulo siguiente se abre al **aprobar** ese examen con `nota_minima` (5).
- Suspender obliga a esperar **24 horas** antes de repetir.
- El examen final se abre con todos los módulos aprobados, y se aprueba con **5**.
- Nota de 0 a 10: cada acierto suma 1 y **cada fallo resta 1/(opciones − 1)**. Contestar al azar da de media 0.
- **Certificado = 40 % media de los módulos + 60 % examen final.**
- El admin lo ve todo abierto y sin esperas, para revisar.
- Las respuestas correctas **nunca** llegan al navegador: `curso_preguntas` no tiene policies y todo se corrige en el servidor (`src/lib/cursos-examen.ts`).

**Los bancos:**

| Banco | Preguntas | Salen |
|---|---|---|
| Cada módulo (`modulo-<n>.json`) | **15** | 10 (`preguntas_examen`) |
| Final (`final.json`) | **40** | 25 (`preguntas_final`) |

Formato de cada pregunta:

```json
{
  "clave": "pt-m1-01",
  "leccion": "slug-de-la-leccion-que-lo-explica",
  "enunciado": "¿…?",
  "opciones": ["…", "…", "…", "…"],
  "correcta": 2,
  "explicacion": "Por qué la buena es la buena, con la fuente si es una cifra."
}
```

- `clave`: única en el curso, con un prefijo propio del curso (`pt-` para psicología del trading): `<prefijo>-m<n>-NN` y `<prefijo>-f-NN`.
- `leccion`: la lección que el alumno debe repasar si falla.
- **Cuatro opciones**, todas plausibles, sin «todas las anteriores».
- **Reparte la posición de la correcta** entre 0, 1, 2 y 3. Al escribir, la tendencia es ponerla casi siempre en la segunda: baraja al final con un script, salvo cuando las opciones son números en orden.
- **El final**: la mitad de conocimiento y la mitad de **casos prácticos** (situaciones reales en las que hay que reconocer el error y elegir lo que diría un buen plan).
- Las preguntas solo preguntan lo que las lecciones explican.

---

## 9 · Certificado, vitrina y logro

**El certificado** es un solo componente: `src/components/aula/Certificado.tsx` (+ `certificado.css`). Lo pintan el aula, la verificación pública, la vitrina y todas las **muestras** (`muestra` = marca de agua «Muestra»): ficha del curso, `/cursos`, `/premium`, el slider de la portada y la vitrina vacía. Cambiar el diseño ahí lo cambia en todas partes.

- Diseño (08-11-2026): marco de pan de oro, banda azul noche con medallón y cintas, papel marfil con guilloché, nombre en serif (Fraunces, servida con `next/font`), pie con fecha, emisor «AdelinBTC Academy» y código con sello holográfico. **Hereda la paleta del curso** por `color`.
- Se mide en `cqw`: se ve igual en miniatura que impreso. Se descarga con «Guardar como PDF» (A4 apaisado; la regla `@media print` deja solo el certificado).
- Se emite **solo** al aprobar el final (`emitirCertificado` en `cursos-examen.ts`), con un código de 10 caracteres y verificación pública en `/cursos/verificar/<codigo>`.
- **No se firma con el nombre de ninguna persona.**

**La vitrina** (`src/components/VitrinaCertificados.tsx`) sale en la portada del dashboard (forma `estante`, debajo del perfil) y en `/dashboard/certificados` (forma `completa`). Vive fuera de `/aula` a propósito: **lo ganado se descarga siempre, aunque se deje Premium.**

**El logro:**

- Se gana **solo con aprobar el examen final**. Va en la categoría **«Cursos»** de `/dashboard/logros`, junto a los de todos los cursos.
- Sale de `curso_certificados`, **nunca** de `user_badges` (esa tabla deja insertar desde el navegador).
- Su nombre es `logro` de `curso.json`.
- **Icono propio:** un SVG sencillo en `src/lib/logros.tsx` (como `PsicologiaBadgeIcon`) y su entrada en `CURSO_BADGE_ICON_BY_SLUG`. Sin entrada, sale un birrete genérico.

---

## 10 · Accesos y seguridad

Ya está montado; **un curso nuevo encaja tal cual**, sin tocar nada:

| Quién | Qué ve |
|---|---|
| Cualquiera, también Google | `/cursos` y la ficha `/cursos/<slug>`: título, descripción, objetivos y temario (títulos, resúmenes y minutos). **Nunca** el texto de las lecciones |
| Cuenta gratuita | Lo mismo, con el botón «Hazte Premium para empezar» |
| Premium y admin | El aula `/aula/<slug>`: lecciones, bloques, exámenes y certificado |

Tres barreras independientes protegen el aula: `src/proxy.ts` (sin sesión, al login), `exigirAula()`/`contextoAula()` en páginas y APIs (sin Premium, a la ficha o 403) y la base de datos (la policy de `curso_lecciones` solo deja leer a `premium`/`admin`; `curso_preguntas` sin policies).

**Intocable:** el catálogo y el temario públicos se leen con `createAdminClientOpcional()` (`src/lib/cursos.ts`). Si alguien lo «arregla», los cursos desaparecen de Google y de los listados.

---

## 11 · Diccionario, aviso legal y textos

- **Diccionario — siempre, sin que nadie lo pida.** Es parte del trabajo de escribir el curso, igual que las preguntas:
  1. Al escribir cada lección, **apunta toda palabra técnica o que merezca explicarse** (siglas, anglicismos, conceptos de finanzas o psicología, nombres de sesgos, métricas…). Ante la duda, entra en la lista.
  2. Comprueba cuáles existen: `grep '  slug: "' src/lib/glosario.ts`.
  3. **Crea las que falten** en `src/lib/glosario.ts` con una **definición buena**, siguiendo [`PLANTILLA-DICCIONARIO.md`](./PLANTILLA-DICCIONARIO.md) (Parte A): `definition` corta y clara, `extended` de 150-250 palabras con la estructura qué es / por qué importa / error típico, con datos con fuente si los hay, y tres `seeAlso` que existan. Cada ficha con frases propias: nunca copiadas de otra.
  4. **Enlaza cada término en su primera aparición en cada lección**: `<a href="/glosario/<slug>">término</a>`. Comprueba que todos los enlaces apuntan a un `slug` que existe.
  5. `npm run check:glosario`. `term` no se cambia jamás.
  
  En el primer curso se crearon así doce términos (`cfd`, `efecto-disposicion`, `r-multiplo`, `drawdown`…) y es lo que el admin quiere que pase siempre.
- **Aviso legal:** el del campo `aviso`. Nunca un descargo escrito a mano en una lección.
- **Textos que anuncian los cursos** (Premium, portada, dashboard): si un curso cambia lo que se puede prometer, revísalos. Nada de «próximamente» para algo que ya existe, ni «incluido» para algo que aún no.

---

## 12 · Subir, probar y publicar

```bash
node --env-file=.env.local scripts/subir-curso.mjs <slug> --probar   # solo comprueba
node --env-file=.env.local scripts/subir-curso.mjs <slug>            # comprueba y sube
```

`--probar` valida el JSON, que cada lección tenga su archivo, que cada bloque exista y su JSON se lea, que las correctas estén en rango y que los bancos alcancen. Subir **actualiza** (no borra lecciones: se llevaría el progreso de los alumnos). Las preguntas retiradas sí se borran.

**Antes de publicar, recórrelo como alumno** (en local con `npm run dev`, con una cuenta Premium de prueba y con una gratuita):

- [ ] Una cuenta gratuita ve la ficha y el temario, pero el aula la manda a la ficha.
- [ ] El desbloqueo: el módulo siguiente no se abre hasta aprobar; probar la URL directa a una lección bloqueada.
- [ ] Un examen suspendido obliga a esperar 24 h; uno aprobado guarda la nota que se enseña.
- [ ] Todos los bloques se ven bien en móvil y escritorio.
- [ ] El certificado se emite al aprobar el final, con la nota correcta, la paleta del curso y su página de verificación.
- [ ] El certificado aparece en la vitrina y se descarga en PDF; el logro sale en «Cursos».

**Publicar** (solo con el «sí» del admin):

1. **Ofrece la auditoría SEO** de la ficha (AGENTS.md, punto 2) y hazla si dice que sí: `npm run check:seo -- cursos/<slug> "<palabra clave>"`.
2. `"published": true` en `curso.json` y vuelve a subir.
3. **Si el curso usa código nuevo** (un bloque, un aviso), despliega primero el código y publica después: la web en producción tiene que conocerlo antes de que el curso exista en la base de datos.
4. Comprueba en producción la ficha, `/cursos` y que el aula pide sesión.
5. Actualiza el registro de paletas (punto 4) y `TAREAS.md`.

El SQL que haga falta se da **completo, en un solo bloque**, repetible (`if not exists`, `drop … if exists`), y se copia también a `scripts/create-cursos.sql`.

---

## 13 · Dónde aparece un curso en la web

Todo sale solo de Supabase al publicarlo; no hay que tocar estas páginas:

| Dónde | Qué |
|---|---|
| `/cursos` | El catálogo: el primero publicado va de portada, con su certificado de muestra; con más de uno, la rejilla de todos |
| `/cursos/<slug>` | La ficha pública (indexable, entra sola en el sitemap) |
| `/aula/<slug>` | El aula: temario fijo y plegable (tecla T), lecciones, exámenes, certificado |
| `/premium` | La lista de cursos publicados y la muestra del certificado |
| `/dashboard` | La vitrina de certificados |
| `/dashboard/logros` | El logro, en «Cursos» |
| `/cursos/verificar/<codigo>` | La verificación pública de cada certificado |
