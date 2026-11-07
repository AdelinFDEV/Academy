# Informe · Curso «Psicología del trading» — propuesta para aprobar

**Estado:** aprobado por el admin el 08-11-2026 tal cual («adelante»), con las recomendaciones de cada pregunta del punto 8: título «Psicología del trading», aprobado del final en 5, logro con tres sellos en la categoría Temple y los tres bloques nuevos. **Construido, sin subir**: ver `TAREAS.md`, sección 0c.
Cambios frente a este informe: el 08-11-2026 el admin retiró la categoría Temple y los sellos; «Sangre Fría» va en la categoría Cursos y se gana solo con aprobar el examen final. Y el aviso legal no es la variante `"diario"` (habla de la herramienta, no de un curso), sino una nueva, `"formacion"`, dentro del mismo `DisclaimerRiesgo.tsx`.

---

## 0 · Antes de nada: tres cosas que he encontrado en el código

1. **Ya hay un curso en el repo: `fiscalidad-cripto-espana`**, con `"published": false` y solo 4 lecciones escritas de unas 20 (`scripts/cursos/fiscalidad-cripto-espana/`). Si este de psicología sale antes, será el **primer curso publicado**, aunque no el primero escrito. TAREAS.md (apartado 0b) da por hecho que el primero es el de fiscalidad: hay que decidir el orden (pregunta 8.1).
2. **El sistema de cursos ya resuelve casi todo lo que necesita este curso**: módulos con examen (banco de 15 → 10 sorteadas, aprueba con 5, 24 h de espera tras suspender), examen final con banco propio, certificado verificable (40 % media de módulos + 60 % final) y logro desde `curso_certificados`. **El curso es contenido (filas), no código nuevo**, salvo el logro con su categoría propia y, si se aprueban, tres bloques interactivos nuevos.
3. **El Diario de Trading ya mide justo los errores que el curso enseña.** Nova avisa de «Cierras las ganadoras antes de tiempo» (es el efecto disposición), de «Tus pérdidas superan el riesgo planeado» (mover el stop por aversión a la pérdida), de rachas («cuidado con subir el tamaño por euforia») y del riesgo por encima del 2 %. El hito «Sin revancha» premia esperar tras una pérdida. Y `diario_dias` guarda el ánimo del día (1-4) y una nota. **El curso pone nombre y respaldo científico a lo que el Diario ya detecta.** Ese es el hueco frente a los rivales: ningún curso de psicología del trading en español trae una herramienta propia para practicarlo.

---

## 1 · Título y promesa

**Título recomendado:** **Psicología del trading**
**Subtítulo:** *Tus sesgos, tus emociones y tu riesgo, con datos y no con frases motivadoras.*

Por qué así: «psicología del trading» es la consulta que se quiere ganar (Fase 1 de la auditoría SEO). El encargo decía «dominar la psicología en el trading», pero **«dominar» promete un resultado que nadie puede garantizar**. El subtítulo marca la diferencia frente a la competencia, que vende motivación.

Alternativas, por si el admin prefiere otro tono:
- «Psicología del trading: decide con la cabeza fría»
- «Temple: psicología del trading con datos»

**Promesa (lo que va en la ficha, y nada más):**

> Al acabar sabrás reconocer, con nombre y apellido, los errores de cabeza que la investigación documenta en casi todos los traders minoristas: cortar las ganancias y estirar las pérdidas, operar de más por exceso de confianza, perseguir lo perdido, ver solo lo que confirma tu idea. Y tendrás un sistema para frenarlos que practicas en tu propio Diario de Trading: reglas «si pasa esto, hago esto», una lista previa a operar, un tamaño de posición que te protege de ti mismo y una revisión semanal.

**Lo que la ficha dice expresamente que el curso NO hace** (regla «no prometas lo que el producto no hace», y obligación YMYL):
- No te enseña una estrategia ni te da señales.
- No promete que vayas a ganar dinero. **La psicología no convierte en rentable un método sin ventaja**: solo evita que pierdas por tu cabeza la ventaja que tengas (módulo 1, lección 4).
- No es asesoramiento financiero personalizado ni terapia. Si el trading te genera ansiedad, deudas o conductas de juego, el curso remite a un profesional.

Aviso legal: el de siempre, `DisclaimerRiesgo.tsx`. Recomiendo la variante `"diario"` (habla de trading); si su texto no encaja con un curso, se añade una variante **dentro del mismo componente**, nunca un aviso a mano.

---

## 2 · Público y nivel

- **Para quién:** quien ya opera o va a empezar a operar (cripto, sobre todo), ha perdido dinero o ha sentido que «sabía lo que tenía que hacer y no lo hizo». También quien hace inversión a largo plazo y quiere dejar de vender en pánico o comprar por FOMO.
- **Nivel:** `"intermedio"`. No hace falta saber análisis técnico. Sí conviene saber qué es un [stop-loss](/glosario/stop-loss), un [take-profit](/glosario/take-profit) y el [tamaño de posición](/glosario/tamano-de-posicion); se enlazan en su primera aparición.
- **Acceso:** Premium, como todos los cursos (`contextoAula` exige Premium). Eso garantiza que **todo alumno tiene el Diario de Trading**, y por eso los ejercicios pueden apoyarse en él.
- **Duración estimada:** 24 lecciones de 12-16 min (unas 5 h 30) + 6 exámenes de módulo + el final. A un ritmo de 3 lecciones por semana, unas 8 semanas — que es, además, lo que hace falta para que el ejercicio de 21 días del módulo 6 tenga sentido.

---

## 2b · Acceso: solo quien paga la suscripción

**El requisito del admin:** cualquiera puede **ver** el curso en Cursos (ficha, título y temario), pero solo quien tiene la suscripción de pago puede entrar en las lecciones, los ejercicios y los exámenes.

**Conclusión: el sistema actual ya funciona exactamente así, y el curso nuevo encaja tal cual.** No hay que tocar el muro. Lo he comprobado en el código, no en la documentación:

### Lo que todo el mundo puede ver (también Google)
| Pieza | Cómo se lee | Qué enseña |
|---|---|---|
| Catálogo `/cursos` | `cursosPublicados()` con `createAdminClientOpcional()` | Título, subtítulo, nivel, número de módulos, lecciones y minutos |
| Ficha `/cursos/<slug>` | `cursoPorSlug()` con `createAdminClientOpcional()` | Descripción, objetivos y temario completo: módulos y lecciones con su **título, resumen y minutos**. **Nunca el `contenido`** (la consulta no lo pide) |
| Logro en `/dashboard/logros` | `logrosDeCursos()` | El logro aparece bloqueado, con «Ver el curso» |

La ficha cambia el botón según quién mire (`FichaCurso.tsx`): sin sesión, «Ver qué incluye Premium» y «Ya tengo cuenta»; con sesión gratuita, «Hazte Premium para empezar»; con Premium, «Tu curso te espera». La ficha entra en el sitemap.

**`createAdminClientOpcional()` no se toca:** con la clave anónima, `curso_lecciones` no se puede leer sin Premium, y el temario saldría vacío o la ficha daría 404 en Google y en los listados.

### Lo que está detrás del muro (tres barreras independientes)
1. **Middleware:** `src/proxy.ts` tiene `/aula` en `protectedRoutes`. Sin sesión, al login.
2. **Servidor:** todas las páginas del aula (portada, lección, examen y certificado) llaman a `exigirAula()`, que usa `contextoAula()`. Sin Premium te redirige a la ficha pública. Las cuatro APIs (`/api/cursos/leccion`, `inscripcion`, `examen` y `examen/entregar`) usan el mismo `contextoAula()` y responden **403** («Los cursos son para alumnos Premium»). La página de una lección solo pide el `contenido` **después** de pasar esa puerta.
3. **Base de datos:** la policy «Premium lee las lecciones» solo deja leer `curso_lecciones` a `role in ('premium','admin')`. `curso_preguntas` no tiene ninguna policy: las preguntas y las respuestas solo las lee el servidor con la clave de servicio. Aunque alguien llame a Supabase desde la consola con la clave anónima, no saca ni una lección ni una respuesta.

### Por qué cubre todas las partes de este curso
- **Lecciones y bloques interactivos** (también los tres nuevos que se proponen): viven en el `contenido` de la lección, así que quedan detrás del muro.
- **Exámenes de módulo y final**: pasan por `contextoAula()` y por `curso_preguntas`.
- **Ejercicios en el Diario de Trading**: el Diario ya es una herramienta de pago, así que quien no paga tampoco puede hacerlos.
- **Logro «Sangre Fría»**: el sello I sale de `curso_certificados`, que solo existe si se aprobó el final dentro del aula.

### Qué significa exactamente «Premium»
`esPremium` es `role === "premium" || role === "admin"`, y el rol se lee siempre de `profiles`, nunca de la petición. El webhook de Stripe (`src/app/api/stripe/webhook/route.ts`) pone `premium` o `free` según el estado de la suscripción. Si alguien cancela, pierde el acceso al aula al volver a `free`, pero **conserva su certificado y su logro**, porque son filas suyas.

Dos matices para que el admin decida si le valen:
- **El admin también puede dar Premium a mano** desde `/api/admin/users/[id]`. Esa persona entra en el curso sin haber pagado. Hoy pasa igual con el Diario y el Portfolio.
- **En la ficha, el resumen de cada lección es público.** Hay que escribirlo como un gancho («Por qué vender pronto lo que gana te sale caro»), no como un resumen que cuente la lección entera.

### Lo único que hay que hacer, y ya estaba previsto
- **No dar de alta el curso en ningún sitio como gratuito.** Se sube con `subir-curso.mjs` igual que el de fiscalidad: no existe un campo «gratis» por curso, todos son Premium por diseño.
- **Antes de publicar, probarlo de verdad con tres sesiones** (PLATAFORMA.md pide no fiarse del código): sin sesión, cuenta gratuita y cuenta Premium. Hay que comprobar que la gratuita ve la ficha con el temario, que `/aula/psicologia-del-trading/<leccion>` la devuelve a la ficha y que `POST /api/cursos/examen` le responde 403. Ese recorrido ya está en TAREAS.md (0b) para el primer curso.

---

## 3 · Temario: 6 módulos, 24 lecciones

Cada lección lleva su objetivo y las fuentes que la sostienen (la lista completa con URL está en el punto 9). Regla de redacción para todas: **cada cifra con su matiz** (muestra, país, periodo) y sin convertir una correlación en una causa.

### Módulo 1 · Por qué pierde la mayoría (y qué parte es psicología)

*Arranca con datos, no con frases. Establece la tesis honesta del curso.*

| # | Lección | Objetivo | Fuentes |
|---|---|---|---|
| 1.1 | Lo que dicen los datos | Conocer las cifras oficiales: ESMA, 74-89 % de cuentas minoristas pierden con [CFD](/glosario/cfd); CNMV, 70-90 % en España (82 % en su estudio de 2015-16); BIS, la mayoría de usuarios de apps cripto perdió con bitcoin entre 2015 y 2022 | [ESMA 2018](#f-esma), [CNMV](#f-cnmv), [BIS 69](#f-bis) |
| 1.2 | Operar más no es operar mejor | Entender el caso Barber-Odean: los hogares que más operaban ganaron un 11,4 % anual frente al 17,9 % del mercado; y que lo que compraban rendía peor que lo que vendían | [Barber y Odean 2000](#f-bo2000), [Odean 1999](#f-odean1999) |
| 1.3 | ¿Se puede vivir del [day trading](/glosario/day-trading)? | Leer bien el estudio brasileño: el 97 % de quienes insistieron más de 300 días perdió; solo el 1,1 % ganó más que el salario mínimo; **sin pruebas de que se aprenda con la práctica**. Y Taiwán: un porcentaje ínfimo bate al mercado de forma repetible | [Chague et al.](#f-chague), [Barber et al. Taiwán](#f-taiwan) |
| 1.4 | Qué puede hacer la psicología y qué no | Separar ventaja (método) de ejecución (cabeza). Lo-Repin-Steenbarger: los traders con reacciones emocionales más intensas rindieron peor, y no hay «personalidad de trader»: es una habilidad que se trabaja. Pero **sin ventaja no hay psicología que salve** | [Lo, Repin y Steenbarger 2005](#f-lrs), [Douglas](#f-douglas) |

### Módulo 2 · Cómo decide tu cerebro cuando hay dinero en juego

| # | Lección | Objetivo | Fuentes |
|---|---|---|---|
| 2.1 | Teoría prospectiva y [aversión a la pérdida](/glosario/aversion-a-la-perdida) | Entender que valoramos ganancias y pérdidas respecto a un punto de referencia, no la riqueza total, y que perder duele más que ganar (estimación media λ ≈ 2,25; **es una media, varía entre personas**) | [Kahneman y Tversky 1979](#f-kt1979), [Tversky y Kahneman 1992](#f-kt1992) |
| 2.2 | El [efecto disposición](/glosario/efecto-disposicion) | Reconocer la tendencia a vender pronto lo que gana y aguantar lo que pierde. Odean: 10.000 cuentas, se realizan antes las ganancias que las pérdidas. **Conexión con Nova**: el aviso «Cierras las ganadoras antes de tiempo» | [Shefrin y Statman 1985](#f-ss1985), [Odean 1998](#f-odean1998) |
| 2.3 | Dinero de la casa y querer empatar | Ver cómo una ganancia previa empuja a arriesgar más, y una pérdida previa a buscar lo que permita «quedarse a cero». Es la raíz del [revenge trading](/glosario/revenge-trading) | [Thaler y Johnson 1990](#f-tj1990) |
| 2.4 | La biología del riesgo | Saber que el miedo y la euforia tienen correlato físico medible (piel, pulso, hormonas, actividad cerebral) y que no se apagan con voluntad. **Matiz obligatorio:** muestras pequeñas (10 y 17 traders), resultados correlacionales | [Lo y Repin 2002](#f-lr2002), [Coates y Herbert 2008](#f-ch2008), [Kuhnen y Knutson 2005](#f-kk2005) |

### Módulo 3 · Los sesgos que te mienten

| # | Lección | Objetivo | Fuentes |
|---|---|---|---|
| 3.1 | [Exceso de confianza](/glosario/exceso-de-confianza) e ilusión de control | Saber que el exceso de confianza predice operar de más (los hombres operaron un 45 % más que las mujeres y perdieron más rentabilidad por ello) y que, en traders profesionales, más ilusión de control fue con menos rendimiento y peor gestión del riesgo | [Odean 1999](#f-odean1999), [Barber y Odean 2001](#f-bo2001), [Fenton-O'Creevy et al. 2003](#f-foc2003) |
| 3.2 | El [sesgo de confirmación](/glosario/sesgo-de-confirmacion) | Detectar cuándo buscas solo lo que te da la razón sobre una operación ya abierta | [Nickerson 1998](#f-nickerson) |
| 3.3 | El [anclaje](/glosario/anclaje) | Ver cómo el precio de entrada, el [ATH](/glosario/ath) o un objetivo redondo deciden por ti | [Tversky y Kahneman 1974](#f-kt1974) |
| 3.4 | Redes, finfluencers y copy trading | Reconocer el [FOMO](/glosario/fomo) fabricado: lo que dicen IOSCO (2025) sobre finfluencers y copy trading, y la advertencia conjunta de los supervisores europeos sobre cripto («posibilidad muy real de perder todo») y la publicidad engañosa en redes | [IOSCO 2025](#f-iosco), [ESAs 2022](#f-esas), [MiCA art. 7](#f-mica) |

### Módulo 4 · Pensar en probabilidades

| # | Lección | Objetivo | Fuentes |
|---|---|---|---|
| 4.1 | Una operación no significa nada | Interiorizar las «cinco verdades» de Douglas: cualquier cosa puede pasar, las ganancias y pérdidas se reparten al azar dentro de una ventaja, cada momento es único | [Douglas 2000](#f-douglas) |
| 4.2 | Piensa en R | Medir cada resultado en [R-múltiplos](/glosario/r-multiplo) y entender la [esperanza matemática](/glosario/esperanza-matematica). **Conexión con el Diario**: ya calcula R y la esperanza por operación | [Tharp](#f-tharp) |
| 4.3 | El tamaño de posición te protege de ti | Ver por qué el tamaño decide la supervivencia más que la entrada, y por qué el Diario marca como agresivo arriesgar más del 2 % de la cuenta. El [apalancamiento](/glosario/apalancamiento) y la [liquidación](/glosario/liquidacion), desde la emoción | [Tharp](#f-tharp), [ESMA 2018](#f-esma) (límites de apalancamiento) |
| 4.4 | Muestra, ruido y rachas | Entender que con 10 operaciones no se sabe nada (el Diario pide 30 antes de sacar conclusiones) y que las rachas de pérdidas son normales en un método con ventaja | [Douglas 2000](#f-douglas), [Barber et al. Taiwán](#f-taiwan) |

### Módulo 5 · Regular la emoción en tiempo real

| # | Lección | Objetivo | Fuentes |
|---|---|---|---|
| 5.1 | Antes, durante y después: el modelo de Gross | Aprender los cinco puntos donde se puede regular una emoción y por qué **reinterpretar** funciona mejor que **reprimir** (reprimir quita la cara, no el sentimiento) | [Gross 1998](#f-gross), [Gross 2002](#f-gross2002) |
| 5.2 | Reglas «si pasa esto, hago esto» | Escribir planes de implementación. Efecto medio-grande en el metaanálisis de 2006 (d = 0,65); **la revisión de 2024 lo rebaja** tras corregir sesgos de publicación: se cuenta así, con las dos cifras | [Gollwitzer y Sheeran 2006](#f-gs2006) |
| 5.3 | La lista previa a operar | Montar una [lista de control](/glosario/plan-de-trading) previa. Se usa la lista quirúrgica de la OMS como **analogía** (redujo muertes y complicaciones en 8 hospitales), no como prueba de que funcione en trading | [Haynes et al. 2009](#f-haynes) |
| 5.4 | Después de una pérdida | Tener un protocolo para el momento más peligroso: pausa obligatoria, bajar tamaño, cerrar la plataforma. **Conexión con el Diario**: el hito «Sin revancha» y el aviso de Nova tras varias pérdidas seguidas | [Thaler y Johnson 1990](#f-tj1990), [Lo, Repin y Steenbarger 2005](#f-lrs) |

### Módulo 6 · Tu sistema de mejora continua

| # | Lección | Objetivo | Fuentes |
|---|---|---|---|
| 6.1 | El diario como herramienta psicológica | Saber por qué escribir lo que sientes ayuda y cuáles son sus límites (Pennebaker; y el comentario de Bootzin en la misma revista: prometedor, pero no es un tratamiento) | [Pennebaker 1997](#f-pennebaker), [Steenbarger 2009](#f-steen2009) |
| 6.2 | La revisión semanal centrada en soluciones | Preguntarse «¿cuándo sí seguí el plan y qué fue distinto?» en vez de solo «¿por qué fallé?» | [Steenbarger 2009](#f-steen2009), [Steenbarger 2003](#f-steen2003) |
| 6.3 | Euforia, rachas y [drawdown](/glosario/drawdown) | Gestionar las dos caras: la racha ganadora que hace subir el tamaño y la caída que hace perseguir lo perdido | [Thaler y Johnson 1990](#f-tj1990), [Coates y Herbert 2008](#f-ch2008) |
| 6.4 | Proyecto final: tu plan psicológico | Redactar el plan personal: tus tres sesgos principales (con los datos de tu Diario), tus reglas «si-entonces», tu lista previa, tu límite de riesgo y tu protocolo tras pérdida | Todo el curso |

---

## 4 · Ejercicios prácticos por módulo

Todos usan lo que **ya existe** en el Diario: operaciones con `strategy` y `notes`, riesgo y beneficio esperado (de ahí sale R), el ánimo del día (1-4) con su nota de hasta 600 caracteres, los hitos y los mensajes de Nova. **Nada de lo que sigue exige que Nova cambie.**

Dentro de cada lección hay además bloques interactivos del aula (`pregunta`, `verdadero-falso`, `clasificar`, `ordenar`, `grafico`), que ya existen.

| Módulo | Ejercicio en el Diario | Ejercicio en la lección |
|---|---|---|
| 1 | **Auditoría honesta:** apunta (o importa de memoria) tus últimas 10-20 operaciones y lee qué te dice Nova de la esperanza y del riesgo. Anota cuántas operaste por semana. | `clasificar`: «¿esto es un problema de método o de ejecución?» con 8 casos. |
| 2 | **Etiqueta tus cierres:** durante dos semanas, en la nota de cada operación cerrada, escribe si cerraste *por plan*, *por miedo* o *por esperanza*. Compáralo con el aviso de Nova «Cierras las ganadoras antes de tiempo» y con el porcentaje del objetivo que capturas. | Nuevo bloque `prospectiva` (ver punto 7): el alumno acepta o rechaza apuestas 50/50 y ve su propia aversión a la pérdida aproximada. |
| 3 | **El abogado del diablo:** antes de cada entrada, escribe en la nota el mejor argumento *en contra* de la operación. Y una vez a la semana, revisa si alguna salida la decidió el precio de entrada (anclaje). | `verdadero-falso` sobre casos de anclaje y confirmación. |
| 4 | **20 operaciones en R:** registra 20 operaciones con su riesgo y beneficio esperado, sin mirar el P&L en euros: solo R. Comprueba que ninguna pasa del 2 % de la cuenta (Nova lo marca). | Nuevo bloque `rachas`: simula 100 operaciones con un 55 % de acierto y enseña lo largas que salen las rachas de pérdidas por puro azar. Nuevo bloque `calculadora-r`: tamaño de posición a partir del % de riesgo. |
| 5 | **Tres reglas y un semáforo:** escribe tres reglas «si-entonces» en la nota del día. Regla de ánimo: si apuntas *mal* o *muy mal* (ánimo ≤ 2), ese día no operas o lo haces a medio tamaño. Objetivo práctico: el primer nivel del hito **«Sin revancha»**. | `ordenar`: los pasos del protocolo tras una pérdida. |
| 6 | **21 días de ánimo:** registra ánimo y nota 21 días (operes o no). Cada domingo, revisión con «Lo más importante» de Nova y la pregunta de Steenbarger: ¿qué día seguí el plan y qué fue distinto? Termina en el plan del 6.4. | Plantilla del plan psicológico para imprimir (hay `BotonImprimir` en el aula). |

**Honestidad sobre los ejercicios:** el aula **no comprueba** que se hagan; se evalúa el conocimiento en los exámenes. Los datos del Diario los declara el propio usuario. Por eso el logro principal sale del certificado (imposible de falsear) y lo que dependa del Diario se presenta como práctica, no como prueba (punto 6).

---

## 5 · Exámenes

Con las reglas que ya tiene la plataforma (no cambia nada del motor):

- **Exámenes de módulo (6):** banco de **15 preguntas por módulo** (90 en total), se sortean **10**, aprueba con **5**, 24 h de espera tras suspender. Tipo test con 3-4 opciones; el fallo resta 1/(opciones − 1).
- **Examen final:** banco propio de **40 preguntas** (`preguntas/final.json`), se sortean **25** (`"preguntas_final": 25`; el de fiscalidad tiene 20, pero este curso tiene más módulos). Unos 30 min.
  - **Mitad conocimiento** (qué dice la teoría prospectiva, qué midió Barber-Odean…).
  - **Mitad casos**: situaciones de trading en las que hay que identificar el sesgo y elegir la respuesta del plan («Llevas tres pérdidas seguidas y ves una entrada clarísima. ¿Qué dice tu protocolo?»). Es lo que hace que el examen mida criterio y no memoria.
- **Aprobado del final:** 5, como hoy (está fijo en `cursos-examen.ts`, línea 212). Si el admin quiere un listón más alto para este curso, hace falta una columna `nota_minima_final` en `cursos` y tocar esa línea (pregunta 8.3).
- **Certificado:** 40 % media de módulos + 60 % final, verificable en `/cursos/verificar/<codigo>`.
- **Cada pregunta lleva su `explicacion`** con la fuente, como en el curso de fiscalidad.

---

## 6 · El logro: categoría nueva «Temple»

### Cómo están hoy los logros

`src/lib/logros.tsx` define tres familias y `Badges.tsx` las agrupa en cuatro categorías: **01 Actividad** (rachas de días), **02 Guías** (quiz perfecto, sale de `GUIDES`), **03 Cursos** (un logro por curso publicado, icono de birrete genérico, sale de `curso_certificados` vía `logrosDeCursos()`) y **04 Diario de Trading** (hitos con niveles, guardados como `diario-*` en `user_badges`).

Dos detalles importan:
- Los logros de curso **no** se guardan en `user_badges`, porque esa tabla deja insertar desde el navegador. Este logro tiene que seguir esa regla.
- Hoy todos los cursos comparten el mismo icono y la misma categoría. **Este sería el primero distinto.**

### La propuesta

**Categoría nueva: «Temple»** (`id: "temple"`, número 05, detrás del Diario)
*«Logros que se ganan dominando la cabeza, no el gráfico.»*

Es una categoría pensada para crecer: hoy tiene un logro, y mañana puede acoger otros que crucen formación y práctica.

**Logro: «Sangre Fría»** — con **tres sellos**, en la misma línea visual que los niveles del Diario (las tres rayitas), pero con significado propio:

| Sello | Cómo se gana | De dónde sale (servidor) |
|---|---|---|
| **I · Conocimiento** | Aprobar el examen final del curso. **Con este sello el logro cuenta como conseguido.** | `curso_certificados` (no falsificable) |
| **II · Práctica** | 21 días distintos con ánimo apuntado en el Diario **después** de empezar el curso | `diario_dias` (fecha ≥ primer intento o lección del curso) |
| **III · Temple** | Nivel 1 del hito «Sin revancha» conseguido **después** del certificado | Se recalcula desde `trades` con `buildMilestones`, igual que hace `syncDiarioLogros`; no se lee `user_badges` |

Por qué así:
- **Es diferente al resto:** es el único logro que une un curso con la práctica real en una herramienta. Los de curso premian aprobar; los del Diario, operar con disciplina; este premia **las dos cosas**.
- **No se puede falsear la parte que importa:** el sello I sale del certificado. Los sellos II y III se basan en datos que declara el propio usuario —como todo el Diario— y la tarjeta lo presenta como práctica, no como prueba.
- **Nada se guarda en `user_badges`**: los tres sellos se calculan en el servidor al abrir `/dashboard/logros`.
- **Icono propio** (SVG, sin emojis): una línea de pulso que se aplana dentro de un círculo. Sustituye al birrete genérico solo en este logro.
- **Especial:** lleva la etiqueta «Especial», como el súper hito del Diario.

Alternativa más simple, si el admin no quiere sellos: el logro es solo el certificado, pero igualmente con categoría «Temple» e icono propio (pregunta 8.4).

---

## 7 · Qué hay que tocar en el código

### Contenido (lo grueso del trabajo)
1. `scripts/cursos/psicologia-del-trading/curso.json` — con `"aviso": "diario"`, `"nivel": "intermedio"`, `"logro": "Sangre Fría"`, `"preguntas_final": 25`, `"published": false`.
2. `lecciones/*.html` — 24 lecciones, cada término técnico enlazado al diccionario en su primera aparición.
3. `preguntas/modulo-1.json` … `modulo-6.json` (15 cada uno) y `preguntas/final.json` (40).
4. Subir con `node --env-file=.env.local scripts/subir-curso.mjs psicologia-del-trading --probar` y después sin `--probar`. **No se publica sin el «sí» del admin.**

### Diccionario (antes de publicar, regla intocable)
Ya existen y se enlazan: `stop-loss`, `take-profit`, `tamano-de-posicion`, `apalancamiento`, `liquidacion`, `fomo`, `ath`, `pnl`, `roi`, `futuros`.
**Hay que crear** (comprobado con `grep '  slug: "' src/lib/glosario.ts`): `cfd`, `day-trading`, `aversion-a-la-perdida`, `efecto-disposicion`, `exceso-de-confianza`, `sesgo-de-confirmacion`, `anclaje`, `revenge-trading`, `r-multiplo`, `esperanza-matematica`, `drawdown`, `plan-de-trading`. Son 12 fichas. Si alguna se enlaza a su página ampliada, necesita `extended`, o da 404.

### Logro y categoría «Temple»
5. **SQL** (se dará completo en un solo bloque, repetible): `alter table public.cursos add column if not exists logro_categoria text;` — así la categoría es un dato del curso y no un `if` con el slug.
6. `scripts/subir-curso.mjs` — leer y validar `logro_categoria` de `curso.json`.
7. `src/lib/cursos.ts` → `logrosDeCursos()` — devolver `logro_categoria` y, para los cursos de categoría `temple`, calcular los sellos II y III en el servidor (lee `diario_dias` y `trades` del usuario).
8. `src/components/Badges.tsx` — `CategoryId` gana `"temple"`; los cursos con `logro_categoria` van a su categoría y no a «Cursos»; el pie de la tarjeta enseña los tres sellos.
9. `src/lib/logros.tsx` — icono propio por slug de curso (como `GUIDE_BADGE_ICON_BY_SLUG` para las guías).
10. `src/app/dashboard/logros/logros.css` — el color de la categoría `lg-cat--temple` (CSS por módulo, no en `globals.css`).

### Bloques interactivos nuevos (opcionales, pregunta 8.5)
11. `src/components/aula/bloques/` — `Prospectiva`, `Rachas` y `CalculadoraR`, cada uno con su validador, más su línea en `Bloque.tsx`. El curso puede salir sin ellos usando solo los bloques que ya existen.

### Al publicar (ya listado en TAREAS.md, 0b)
12. `cursos` pasa a `acceso: "premium"` en `src/lib/herramientas.ts` y `soon: false` en el rail del dashboard — **solo si es el primer curso publicado**.
13. La ficha `/cursos/psicologia-del-trading` entra sola en el sitemap. **Auditoría SEO completa** de la ficha antes de publicar (AGENTS.md, punto 2), con `npm run check:seo -- cursos/psicologia-del-trading "psicología del trading"`.
14. `TAREAS.md` — dar de alta la tarea al aprobarse este informe y borrarla en el mismo commit en que se cierre.

### Lo que NO hay que tocar
- El motor de exámenes, el certificado ni las reglas de `cursos-progreso.ts`.
- El muro de pago: `exigirAula()`, `contextoAula()`, las policies de `curso_lecciones` y `curso_preguntas` (ver 2b).
- `createAdminClientOpcional()` en el catálogo (intocable).
- `src/proxy.ts` y `robots.txt`: `/aula` ya está protegido y bloqueado.
- **Nova.** Una fase 2 opcional sería que Nova, a quien tenga el certificado, enlace la lección que explica cada aviso («Esto es el efecto disposición → lección 2.2»). No hace falta para lanzar.

---

## 8 · Preguntas para el admin

1. **Orden:** ¿este curso sale antes que el de fiscalidad (que está a medias) y pasa a ser el primero publicado?
2. **Título:** ¿«Psicología del trading» con el subtítulo propuesto, o una de las alternativas?
3. **Aprobado del final:** ¿5, como en todos los cursos, o un listón propio más alto (necesita una columna nueva)?
4. **Logro:** ¿«Sangre Fría» con los tres sellos, o solo el certificado (más simple)? ¿Y el nombre de la categoría, «Temple»?
5. **Bloques nuevos:** ¿se hacen los tres (`prospectiva`, `rachas`, `calculadora-r`) o se lanza con los que ya hay?

---

## 9 · Fuentes

Las cifras del informe salen de estos documentos. Donde solo he podido leer el resumen o una página de la editorial (no el texto completo), lo indico: **antes de escribir cada lección hay que abrir la fuente primaria** y comprobar la cifra exacta.

### Regulación y supervisores
- <a id="f-esma"></a>**ESMA (2018).** *ESMA agrees to prohibit binary options and restrict CFDs to protect retail investors.* 74-89 % de cuentas minoristas pierden; pérdida media de 1.600 a 29.000 € por cliente; límites de apalancamiento de 30:1 a 2:1; protección frente a saldo negativo. https://www.esma.europa.eu/node/84933 · Renovación: https://www.esma.europa.eu/node/86076
- <a id="f-cnmv"></a>**CNMV.** Resolución de 2023 sobre CFD (70-90 % de clientes con pérdidas en España; prohibición de publicidad a minoristas): https://www.cnmv.es/docportal/aldia/Resolucion_CFD.pdf · Consulta previa con los datos de 2015-16 (82 %): https://www.cnmv.es/DocPortal/DocFaseConsulta/CNMV/CP_ComercializacionCFD.pdf · BOE: https://www.boe.es/boe/dias/2023/07/14/pdfs/BOE-A-2023-16394.pdf
- <a id="f-bis"></a>**Cornelli, Doerr, Frost y Gambacorta (2023).** *Crypto shocks and retail losses.* BIS Bulletin n.º 69. https://www.bis.org/publ/bisbull69.htm
- <a id="f-esas"></a>**EBA, ESMA y EIOPA (2022).** Advertencia conjunta a los consumidores sobre los riesgos de los criptoactivos. https://www.esma.europa.eu/press-news/esma-news/eu-financial-regulators-warn-consumers-risks-crypto-assets
- <a id="f-iosco"></a>**IOSCO (2025).** Informes finales sobre finfluencers, copy trading y prácticas de enganche digital (resumen de un despacho; abrir el original de IOSCO antes de citar): https://www.hlc.com/en/publications/iosco-publishes-final-reports-on-finfluencers-online-imitative-trading-practices-and-digital-engagem · Hoja de ruta de IOSCO: https://iosco.org/landing/pdf/Roadmap-to-enhance-Retail-Investor-Online-Safety.pdf
- <a id="f-mica"></a>**Reglamento MiCA (UE) 2023/1114, art. 7** — comunicaciones publicitarias de criptoactivos: «imparciales, claras y no engañosas». https://www.esma.europa.eu/publications-and-data/interactive-single-rulebook/mica/article-7-marketing-communications
- **ESMA (2022).** Directrices sobre la prueba de conveniencia de MiFID II (contexto: por qué a un minorista se le evalúa antes de venderle un producto complejo). https://www.esma.europa.eu/sites/default/files/library/esma35-43-2938_gls_appropriateness_ex-only.pdf

### Finanzas conductuales
- <a id="f-kt1979"></a>**Kahneman y Tversky (1979).** *Prospect Theory: An Analysis of Decision under Risk.* Econometrica 47(2). https://www.econometricsociety.org/publications/econometrica/1979/03/01/prospect-theory-analysis-decision-under-risk
- <a id="f-kt1992"></a>**Tversky y Kahneman (1992).** *Advances in Prospect Theory: Cumulative Representation of Uncertainty.* Journal of Risk and Uncertainty 5. https://ideas.repec.org/a/kap/jrisku/v5y1992i4p297-323.html · Texto: https://psych.fullerton.edu/mbirnbaum/psych466/articles/Tversky_Kahneman_JRU_92.pdf
- <a id="f-kt1974"></a>**Tversky y Kahneman (1974).** *Judgment under Uncertainty: Heuristics and Biases.* Science 185. https://pubmed.ncbi.nlm.nih.gov/17835457/
- <a id="f-ss1985"></a>**Shefrin y Statman (1985).** *The Disposition to Sell Winners Too Early and Ride Losers Too Long.* Journal of Finance. (No he podido abrir el texto completo; referencia vía Odean 1998.)
- <a id="f-odean1998"></a>**Odean (1998).** *Are Investors Reluctant to Realize Their Losses?* Journal of Finance 53(5). Resumen del CFA Institute: https://rpc.cfainstitute.org/-/media/documents/article/cfa-digest/1999/dig-v29-n2-469-pdf.pdf
- <a id="f-odean1999"></a>**Odean (1999).** *Do Investors Trade Too Much?* American Economic Review 89. https://econweb.ucsd.edu/~jandreon/Econ264/papers/Odean%20AER%201999.pdf
- <a id="f-bo2000"></a>**Barber y Odean (2000).** *Trading Is Hazardous to Your Wealth.* Journal of Finance 55(2). https://faculty.haas.berkeley.edu/odean/Papers%20current%20versions/Individual_Investor_Performance_Final.pdf
- <a id="f-bo2001"></a>**Barber y Odean (2001).** *Boys Will Be Boys: Gender, Overconfidence, and Common Stock Investment.* Quarterly Journal of Economics 116(1). https://faculty.haas.berkeley.edu/odean/papers/gender/BoysWillBeBoys.pdf
- <a id="f-tj1990"></a>**Thaler y Johnson (1990).** *Gambling with the House Money and Trying to Break Even.* Management Science 36(6). https://ideas.repec.org/a/inm/ormnsc/v36y1990i6p643-660.html — matiz: experimentos de laboratorio y encuestas.
- <a id="f-nickerson"></a>**Nickerson (1998).** *Confirmation Bias: A Ubiquitous Phenomenon in Many Guises.* Review of General Psychology 2(2). https://pages.ucsd.edu/~cmckenzie/nickersonConfirmationBias.pdf

### Estudios sobre traders minoristas
- <a id="f-chague"></a>**Chague, De-Losso y Giovannetti (2019-2020).** *Day Trading for a Living?* SSRN 3423101. https://econpapers.repec.org/RePEc:fgv:eesptd:525 — matiz: el 97 % es de quienes persistieron más de 300 días.
- <a id="f-taiwan"></a>**Barber, Lee, Liu y Odean.** *The Cross-Section of Speculator Skill* (Journal of Financial Markets, 2014): https://econpapers.repec.org/RePEc:eee:finmar:v:18:y:2014:i:c:p:1-24 · *Learning, Fast or Slow* (Review of Asset Pricing Studies, 2020): https://econpapers.repec.org/RePEc:oup:rasset:v:10:y:2020:i:1:p:61-93. — matiz: el porcentaje exacto de los que baten al mercado de forma repetible hay que sacarlo del texto; varía entre artículos.
- <a id="f-foc2003"></a>**Fenton-O'Creevy, Nicholson, Soane y Willman (2003).** *Trading on Illusions.* Journal of Occupational and Organizational Psychology 76(1). https://oro.open.ac.uk/1317
- <a id="f-lrs"></a>**Lo, Repin y Steenbarger (2005).** *Fear and Greed in Financial Markets: A Clinical Study of Day-Traders.* American Economic Review 95(2). https://web.mit.edu/Alo/www/Papers/online.html
- <a id="f-lr2002"></a>**Lo y Repin (2002).** *The Psychophysiology of Real-Time Financial Risk Processing.* Journal of Cognitive Neuroscience 14(3). https://web.mit.edu/Alo/www/Papers/repin.html
- <a id="f-ch2008"></a>**Coates y Herbert (2008).** *Endogenous Steroids and Financial Risk Taking on a London Trading Floor.* PNAS 105(16). https://pmc.ncbi.nlm.nih.gov/articles/PMC2329689
- <a id="f-kk2005"></a>**Kuhnen y Knutson (2005).** *The Neural Basis of Financial Risk Taking.* Neuron 47(5). https://pubmed.ncbi.nlm.nih.gov/16129404/

### Regulación emocional y conducta
- <a id="f-gross"></a>**Gross (1998).** *The Emerging Field of Emotion Regulation: An Integrative Review.* Review of General Psychology 2(3). https://static1.squarespace.com/static/55917f64e4b0cd3b4705b68c/t/5c47fda9758d46280be433e9/1548221901394/Gross+%281998%29.pdf
- <a id="f-gross2002"></a>**Gross (2002).** *Emotion Regulation: Affective, Cognitive, and Social Consequences.* Psychophysiology. https://pubmed.ncbi.nlm.nih.gov/12212647/
- <a id="f-gs2006"></a>**Gollwitzer y Sheeran (2006).** *Implementation Intentions and Goal Achievement: A Meta-analysis.* Advances in Experimental Social Psychology 38. https://kops.uni-konstanz.de/entities/publication/2e749bfb-8533-437c-8203-7e788c910c5f — y la revisión de 2024 (Sheeran, Listrom y Gollwitzer), que rebaja el efecto: hay que localizar el artículo original antes de citar la cifra.
- <a id="f-haynes"></a>**Haynes et al. (2009).** *A Surgical Safety Checklist to Reduce Morbidity and Mortality in a Global Population.* NEJM 360(5). https://pubmed.ncbi.nlm.nih.gov/19144931/ — solo como analogía.
- <a id="f-pennebaker"></a>**Pennebaker (1997).** *Writing About Emotional Experiences as a Therapeutic Process.* Psychological Science 8(3). https://sanlab.psych.ucla.edu/wp-content/uploads/sites/31/2016/03/Pennebaker_Psychscience_1997.pdf

### Literatura de psicología del trading (libros de práctica, no estudios)
Se citan como **marco práctico reconocido**, nunca como prueba científica. Donde un libro y un estudio dicen lo mismo, manda el estudio.
- <a id="f-douglas"></a>**Mark Douglas (2000).** *Trading in the Zone.* Prentice Hall Press. Ficha: https://www.librarything.com/work/8493934
- <a id="f-tharp"></a>**Van K. Tharp.** *Trade Your Way to Financial Freedom* (McGraw-Hill): R-múltiplos, esperanza y tamaño de posición. https://www.mheducation.com/highered/mhp/product/financial-freedom-super-tradermktgprg.html
- <a id="f-steen2003"></a>**Brett N. Steenbarger (2003).** *The Psychology of Trading.* Wiley, ISBN 978-0-471-26761-4.
- <a id="f-steen2009"></a>**Brett N. Steenbarger (2009).** *The Daily Trading Coach: 101 Lessons for Becoming Your Own Trading Psychologist.* Wiley, ISBN 978-0-470-39856-2. https://gov.wiley.com/WileyCDA/WileyTitle/productCd-0470398566.html · El enfoque centrado en soluciones, contado por el autor: https://traderfeed.blogspot.com/2017/12/brett-steenbarger-trading-psychology.html
  Steenbarger es, además, coautor del estudio de Lo, Repin y Steenbarger (2005): es el puente entre la literatura práctica y la científica.

### Lo que el informe deja a propósito fuera
- **Afirmaciones sin fuente sólida** que circulan en los cursos rivales («el 90 % de los traders pierde el 90 % en 90 días», «el trading es 80 % psicología»): no tienen un estudio detrás y el curso no las usa. Una lección puede citarlas para desmontarlas.
- **El marco legal rumano:** el curso es formación general, no asesoramiento personalizado, y no recomienda productos; eso lo mantiene fuera del asesoramiento de inversión de MiFID II. Si el admin quiere una revisión legal específica antes de publicar, se hace aparte.
