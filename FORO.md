# El foro — plan de construcción

**Estado: plan, sin código del foro.** Lo único construido es lo que el foro necesita antes de existir: el perfil público (alias y foto, en «Mi perfil»).

**Orden innegociable: primero la seguridad y la moderación, luego la lógica, y el diseño al final.** Si una regla de aquí molesta al construir, se cambia aquí primero, con el admin, y después en el código. Nunca al revés.

Cada fase de la §16 tiene un **criterio de salida**: hasta cumplirlo no se empieza la siguiente.

---

## 0 · Lo decidido

| Fecha | Decisión |
|---|---|
| 05-11-2026 | Foro de **preguntas y respuestas**. Primero la seguridad; el diseño, después |
| 06-11-2026 | **Leer es de todos** (sin cuenta, gratuitos y Google). **Publicar es de Premium** (y del admin) |
| 06-11-2026 | Antes del foro, el **perfil público**: alias y una de 4 fotos. En el foro nunca sale el nombre ni el email. **Hecho** |
| 06-11-2026 | **Ningún alias puede parecerse a AdelinBTC** ni llevar palabras malsonantes (`problemaDelAlias` en `src/lib/perfilPublico.ts`). Solo el admin lleva ese nombre. Un falso positivo se arregla añadiendo la palabra a `INOCENTES`, nunca aflojando la regla |
| 06-11-2026 | **Avisos** cuando alguien te responde |
| 06-11-2026 | **No hay perfiles visitables**: no se puede abrir la página de otro usuario. **No hay mensajes directos** |
| 06-11-2026 | En las respuestas solo se puede **responder** y dar **me gusta**. Con muchas respuestas, **las más valoradas salen primero** |
| 06-11-2026 | Las preguntas pueden llevar **imágenes**, con un **límite de caracteres** como el de los foros grandes |
| 06-11-2026 | Las preguntas se **valoran con etiquetas** (Interesante, Gracias y una tercera); le llegan a su autor |
| 06-11-2026 | **Ranking** del foro en toda la web (preguntas, gracias, puntos), pensado para premiar a quien ayuda |
| 06-11-2026 | El autor elige la **respuesta ganadora**: su autor gana puntos, el hilo **se cierra** y la ganadora se **fija arriba** |
| 06-11-2026 | **Solo Premium participa, en todo.** Sin Premium (gratuito, sin cuenta o con el Premium caducado) solo se lee: ni me gusta, ni etiquetas, ni reportar, ni elegir ganadora. **Cualquier botón de participar le lleva a hacerse Premium** |

---

## 1 · Los principios

1. **Un solo escritor: el servidor.** Ninguna tabla del foro tiene policy de escritura para `anon` ni `authenticated`. La clave anónima va en el navegador de cualquiera: con una policy de `insert`, un `curl` se saltaría toda la validación. Es la misma regla que `portfolio_positions` y `dca_compras` (`PLATAFORMA.md`).
2. **Lo que cambia varias cosas a la vez, en una sola transacción.** Elegir ganadora, dar un me gusta o moderar tocan varias tablas (contadores, puntos, avisos, registro). Se hacen en **funciones de Postgres**, todo o nada; nunca con varias llamadas desde la API que puedan quedarse a medias.
3. **Nada se publica sin pasar por el filtro**, y lo indexable (las preguntas) pasa además por el admin.
4. **Los contadores y los puntos no se escriben a mano.** Salen de las filas que los justifican: un me gusta es una fila, y la cifra se deriva. Así siempre se pueden recalcular y auditar.
5. **Lo mínimo de cada persona.** Alias y foto; ni perfil, ni email, ni IP guardada.
6. **Todo es YMYL** (dinero): el listón de calidad y de moderación es el más alto. Una estafa indexada bajo el dominio hace más daño que todas las URLs que gana el foro.

---

## 2 · Qué hay en el foro y qué no

**Hay:**

- **Hilo** = una pregunta (título, texto, categoría y hasta 4 imágenes) y sus respuestas.
- **Respuesta**: plana, a la pregunta. No hay respuestas a respuestas (ver D9).
- **Me gusta** en las respuestas.
- **Etiquetas** en las preguntas: *Interesante*, *Gracias* y *Yo también* (ver §8).
- **Respuesta ganadora**, elegida por el autor de la pregunta (§9).
- **Reportar** cualquier pregunta o respuesta.
- **Avisos** (§11) y **ranking** (§10).

**No hay, y no se construye sin que el admin lo pida:**

- Perfiles visitables. El alias y la foto se ven **junto al mensaje** y en el ranking, **sin enlace** a ninguna parte.
- Mensajes directos, chat, ni nada privado entre usuarios.
- Votos negativos. Invitan a la venganza y en una comunidad pequeña hunden a la gente nueva.
- Encuestas, firmas ni enlaces en el perfil.

---

## 3 · Quién puede hacer qué

| Acción | Sin cuenta | Gratuito (o Premium caducado) | Premium | Premium suspendido del foro | Admin |
|---|---|---|---|---|---|
| Leer lo publicado | ✅ | ✅ | ✅ | ✅ | ✅ |
| Preguntar (con imágenes) | → Premium | → Premium | ✅ | — | ✅ |
| Responder | → Premium | → Premium | ✅ | — | ✅ |
| Me gusta en respuestas | → Premium | → Premium | ✅ | — | ✅ |
| Etiquetar preguntas | → Premium | → Premium | ✅ | — | ✅ |
| Elegir la ganadora de **su** pregunta | — | → Premium (D10) | ✅ | — | ✅ (cualquiera) |
| Reportar | → Premium | → Premium | ✅ | ✅ | — |
| Ver lo suyo y sus avisos | — | ✅ | ✅ | ✅ | ✅ |
| Moderar | — | — | — | — | ✅ |

**«→ Premium»**: el botón se ve igual que para un Premium (así se entiende qué se gana), pero al pulsarlo no hace la acción: abre una invitación a hacerse Premium con lo que incluye y el enlace a `/premium`. Sin cuenta, primero a registrarse y después a Premium. **La API rechaza la acción igualmente**: el botón es solo la puerta de venta, la barrera de verdad es el servidor.

**Reportar contenido ilícito sin ser Premium.** El botón de reportar es de Premium, pero la ley pide que **cualquiera** pueda avisar de contenido ilícito (DSA, §13). Para eso, el pie de cada hilo enlaza a un **canal de avisos legales** abierto a todos, fuera de las herramientas del foro, que va a la misma cola del admin.

Reglas:

1. **«Es Premium» se decide en el servidor en cada acción**, leyendo `profiles.role` en ese momento. Nunca de lo que mande el navegador ni de lo calculado al cargar.
2. **Si el Premium caduca, lo publicado se queda** y pasa a ser como un gratuito: lee y ve sus avisos, pero no participa. Lo suyo no se oculta por dejar de pagar.
3. **Una suspensión del foro no toca el Premium.** Son cosas distintas, en sitios distintos.
4. **Nadie se valora a sí mismo**: ni me gusta a su respuesta, ni etiquetas a su pregunta, ni elegir su propia respuesta como ganadora.

---

## 4 · Límites del contenido

Referencia: Reddit permite títulos de 300 caracteres y cuerpos de 40.000; Stack Overflow, títulos de 15 a 150 y cuerpos de 30 a 30.000. Para una comunidad que empieza, y moderada a mano, conviene **más corto**: obliga a ir al grano y se revisa rápido.

| Campo | Mínimo | Máximo | Por qué |
|---|---|---|---|
| Título | 15 | 150 | Un título que se lee entero en Google y en el listado |
| Pregunta | 30 | 5.000 | ~800 palabras: de sobra para explicar un problema con contexto |
| Respuesta | 20 | 3.000 | Una respuesta que necesita más suele ser una guía |
| Imágenes por pregunta | 0 | 4 | Capturas de un gráfico, un error o un exchange |
| Peso por imagen (subida) | — | 5 MB | Lo que pesa una captura de móvil |
| Lado mayor (guardada) | — | 1.600 px | Se reduce al guardar |

Los límites se cuentan **después de normalizar** (§6.4) y viven en un solo archivo (`src/lib/foro/limites.ts`) que leen la API y el formulario. La restricción `check` de la tabla repite los máximos como última barrera.

**Imágenes en las respuestas: no en la primera versión** (D8). Cada imagen es moderación extra, y casi todas las dudas se resuelven con texto.

---

## 5 · El modelo de datos

Nombres orientativos; el SQL final se escribe en la fase 2. Todas las tablas con RLS activada y **sin** policy de escritura.

| Tabla | Una fila es… | Claves y campos que importan |
|---|---|---|
| `foro_categorias` | una categoría (las crea el admin) | `slug`, `nombre`, `orden`, `activa` |
| `foro_preguntas` | una pregunta | `autor_id`, `categoria`, `titulo`, `slug`, `cuerpo`, `estado`, `cerrada`, `ganadora_id`, contadores, `huella`, fechas |
| `foro_imagenes` | una imagen de una pregunta | `pregunta_id`, `ruta`, `ancho`, `alto`, `bytes`, `orden`, `estado` |
| `foro_respuestas` | una respuesta | `pregunta_id`, `autor_id`, `cuerpo`, `estado`, `me_gusta` (contador), `huella`, fechas |
| `foro_me_gusta` | un me gusta | **PK (`respuesta_id`, `usuario_id`)**: es imposible dar dos |
| `foro_etiquetas` | una etiqueta puesta | **PK (`pregunta_id`, `usuario_id`, `tipo`)** |
| `foro_reportes` | un reporte | `objeto`, `objeto_id`, `usuario_id`, `motivo`, `estado`; único por (objeto, usuario) |
| `foro_moderacion` | una acción de moderación | quién, qué, sobre qué, motivo, fecha. **Solo inserción** |
| `foro_sanciones` | una sanción | `usuario_id`, `tipo` (aviso, suspensión, expulsión), `hasta`, `motivo` |
| `foro_puntos` | un movimiento de puntos | `usuario_id`, `motivo`, `puntos` (±), `ref`, fecha. **Solo inserción** (§10) |
| `foro_reputacion` | los totales de un usuario | puntos totales y del mes, respuestas ganadoras, gracias recibidas, nivel. **Derivada** del libro de puntos |
| `foro_avisos` | un aviso | `destinatario`, `tipo`, `pregunta_id`, `cuantos`, `leido`, fechas |

**Estados** de preguntas, respuestas e imágenes: `pendiente` → `publicada` | `rechazada`; `publicada` → `oculta` (reversible) | `borrada`. Nunca se borra la fila de verdad mientras haya un reporte o una sanción que la cite: se marca, y se purga al vencer el plazo de conservación (§13).

**Lectura pública** (policy `select` para `anon, authenticated`): solo filas `publicada`, y solo las columnas públicas (`GRANT` por columnas, como `scripts/lock-profiles-columns.sql`). El autor de un mensaje se pinta con su alias y su foto de `profiles`, que ya son públicos; **`autor_id` no sale nunca al navegador**: sin perfiles visitables no hace falta, y con él se podría cruzar la actividad de alguien.

---

## 6 · La seguridad, capa a capa

### 6.1 Base de datos

- RLS en todas las tablas, cerrada por defecto. Ninguna policy de `insert`, `update` ni `delete` para `anon` ni `authenticated`.
- `GRANT` por columnas: el público lee el texto, la fecha, el alias y los contadores. Nunca motivos, reportes, sanciones, huellas ni `autor_id`.
- `check` en la tabla: longitudes y estados permitidos.
- **Únicos** que hacen imposible el doble voto: las PK de `foro_me_gusta` y `foro_etiquetas`, y el único de los reportes.
- **Funciones `SECURITY DEFINER`** para cada acción compuesta (§6.3), con `search_path` fijado, que solo puede ejecutar `service_role`.
- `foro_moderacion` y `foro_puntos`: sin `update` ni `delete` para nadie salvo `service_role`, y un trigger que lo rechaza también para él salvo en la purga programada.

### 6.2 La API (`/api/foro/*`)

Cada acción pasa, en este orden, y se corta en el primer fallo:

1. **Sesión válida** (`supabase.auth.getUser()`, nunca `getSession()`).
2. **Permiso** según la tabla del §3, leído en ese momento: rol, sanción vigente, normas aceptadas, alias puesto.
3. **Límites de envío** contados en la base de datos (§6.5).
4. **Validación del contenido** (§6.4).
5. **La función de Postgres** que hace el cambio entero.
6. Respuesta al cliente con un **mensaje genérico en español**. Nunca el error de Postgres, que enseña nombres de tablas y restricciones.

Todas las rutas `/api/foro/*` entran en el tramo `escritura` de `src/lib/rate-limit.ts`, y las imágenes en uno propio más estricto.

### 6.3 Las acciones compuestas, atómicas

| Función | Hace, todo o nada |
|---|---|
| `foro_publicar(...)` | Crea la pregunta o la respuesta **pendiente** o publicada según la confianza (§7.1), comprueba límites y duplicados, y apunta en el registro |
| `foro_me_gusta(respuesta, usuario)` | Pone o quita el me gusta, ajusta el contador y los puntos (§10) y crea o agrupa el aviso. Rechaza su propia respuesta, una respuesta no publicada o de un hilo no publicado |
| `foro_etiquetar(pregunta, usuario, tipo)` | Igual, para las etiquetas de las preguntas |
| `foro_elegir_ganadora(pregunta, respuesta, usuario)` | Comprueba que es el autor (o el admin), que la respuesta es de otro y está publicada y que el hilo no está cerrado; fija la ganadora, cierra el hilo, da los puntos y avisa (§9) |
| `foro_moderar(objeto, accion, motivo, admin)` | Aprueba, rechaza, oculta, restaura o borra; revierte los puntos que dependían de ello; apunta en el registro y avisa al autor con el motivo |
| `foro_sancionar(usuario, tipo, hasta, motivo, admin)` | Crea la sanción, la apunta y avisa |

Todas bloquean la fila que tocan (`select … for update`) antes de comprobar nada: dos me gusta simultáneos, o dos personas eligiendo ganadora a la vez, no pueden dejar un contador mal.

### 6.4 El contenido

- **Texto plano.** Nunca se pinta HTML del usuario: nada de `dangerouslySetInnerHTML`; React escapa el texto. Los saltos de línea se respetan. Si algún día hay formato, es un subconjunto mínimo (negrita, listas, código) convertido en el servidor con lista blanca.
- **Normalizar antes de validar y contar**: Unicode NFC, quitar caracteres invisibles (ancho cero, control, dirección del texto), colapsar espacios y saltos repetidos. Si no, las palabras vetadas se esquivan con un carácter invisible en medio.
- **Duplicados**: huella del texto normalizado. El mismo texto dos veces del mismo usuario se rechaza; de usuarios distintos, va a revisión (cuentas coordinadas).
- **Enlaces**: solo a dominios de una lista blanca (la propia web, YouTube, exploradores de bloques y webs oficiales que apruebe el admin). Los demás, rechazados. Todo enlace sale con `rel="nofollow ugc noopener noreferrer"`.
- **Detectores que mandan a revisión** aunque el usuario tenga confianza: algo que parezca una **frase semilla** (12 o 24 palabras seguidas de la lista BIP-39), una **clave privada**, una dirección de cartera pidiendo envíos, teléfonos y emails, «escríbeme por privado», enlaces de WhatsApp o Telegram, códigos de referido y promesas de rentabilidad («x10 asegurado»). Son las estafas típicas del sector.
- **Palabras malsonantes**: el mismo filtro del alias (`src/lib/perfilPublico.ts`), sobre el texto normalizado.

### 6.5 Límites de envío, por usuario

El limitador de `src/lib/rate-limit.ts` vive en la memoria de cada instancia de Vercel: es la primera capa, no la de verdad. **La de verdad se cuenta en la base de datos**, dentro de `foro_publicar` y compañía:

| Acción | Límite |
|---|---|
| Preguntas pendientes a la vez | 1 (el patrón de `scripts/comments-one-pending.sql`) |
| Preguntas | 3 al día |
| Respuestas | 10 a la hora, 30 al día |
| Me gusta | 60 al día |
| Etiquetas | 60 al día |
| Imágenes subidas | 12 al día |
| Reportes | 20 al día |

Son de arranque y se ajustan con el uso real, aquí primero.

### 6.6 Las imágenes

Una imagen es el contenido más peligroso del foro: puede llevar un script, la ubicación de alguien o algo ilegal. Así entra:

1. El navegador pide subir; la API comprueba permiso y límites y da una **URL firmada de un solo uso** a un bucket **privado** de Supabase Storage (`foro-pendientes`).
2. Al confirmar, el **servidor** la descarga y la comprueba: tipo real por sus **primeros bytes** (no por la extensión ni por lo que diga el navegador), solo **JPG, PNG o WebP** (nunca SVG, que puede llevar código, ni GIF), peso y dimensiones.
3. **La recodifica** a WebP de 1.600 px como mucho. Recodificar destruye cualquier cosa escondida en el archivo y **borra los metadatos EXIF**, que en una foto de móvil incluyen **la ubicación GPS**.
4. Pasa al bucket público (`foro`) **solo cuando la pregunta se aprueba**. Hasta entonces la ven el autor y el admin, con una URL firmada que caduca.
5. El nombre del archivo lo pone el servidor (un id aleatorio), nunca el usuario.
6. Si se rechaza o se borra la pregunta, sus imágenes se borran del bucket.

### 6.7 Contra la manipulación de puntos y del orden

Premium cuesta dinero, y eso ya frena las cuentas falsas en masa. Aun así:

- **Topes diarios** de puntos por cada motivo (§10.2): nadie sube el ranking a base de volumen.
- **Tope por pareja**: los me gusta de una misma persona a otra dan puntos solo hasta un máximo al día. Dos amigos votándose todo se estancan pronto.
- **Antigüedad mínima**: los me gusta y etiquetas de una cuenta Premium de menos de 7 días cuentan para el orden de las respuestas, pero **no dan puntos** hasta que cumple esa semana.
- **Alerta al admin** cuando una pareja de usuarios acumula muchos votos cruzados, o cuando muchos votos llegan en ráfaga a un mismo mensaje.
- Los puntos de lo que se oculta o se borra **se revierten** (§10.1).

---

## 7 · La moderación

### 7.1 Antes de publicar

- **Las preguntas siempre pasan por el admin**: cada una es una URL indexable bajo el dominio.
- **Las respuestas, por confianza:**

| Nivel de confianza | Cómo se llega | Sus respuestas |
|---|---|---|
| 0 · Nuevo | Al empezar | Van a revisión |
| 1 · De confianza | 3 respuestas aprobadas, ninguna rechazada en 30 días y sin sanciones | Se publican solas, sujetas a reporte |

Una sanción o un rechazo devuelve al nivel 0. El admin puede quitar o dar la confianza a mano. Los detectores del §6.4 mandan a revisión **siempre**, tenga el nivel que tenga.

La cola de `/admin/foro` enseña cada pendiente con su autor, sus envíos anteriores, sus sanciones y lo que marcó el detector. Acciones: **aprobar**, **rechazar con motivo** (el autor lo ve), **editar antes de aprobar** (queda marcado «editado por moderación») y **mover de categoría**.

### 7.2 Después de publicar

- **Reportar**: cualquier Premium, una vez por mensaje, con un motivo de una lista cerrada: estafa o spam, insulto, datos personales, consejo peligroso, fuera de tema, otro.
- **Ocultado automático**: con 3 reportes de cuentas distintas, el mensaje se oculta solo hasta que el admin lo revise. Un reporte de «estafa» va a la cola con prioridad.
- Acciones del admin: **ocultar** (reversible), **restaurar**, **borrar**, **editar** (marcado), **cerrar o reabrir** un hilo, **cambiar la ganadora** y **fijar** un hilo arriba de su categoría.

### 7.3 Sanciones

En escalera, cada una con su motivo, que el sancionado ve:

1. **Aviso.**
2. **Suspensión del foro**: 7 días; la siguiente, 30.
3. **Expulsión del foro.**

Estafa, frase semilla ajena o suplantar al admin: directo al paso 3. Qué pasa con el Premium de un expulsado es la D4.

### 7.4 El registro

**Toda acción del admin y del sistema queda escrita**: quién, qué, sobre qué, cuándo y por qué. No se edita ni se borra desde la web. Sirve para responder a quien reclama, y lo pide la ley (§13).

---

## 8 · Me gusta y etiquetas

**Me gusta (en respuestas):** uno por persona y respuesta; se puede quitar. Cuenta para el orden (§9) y da puntos al autor (§10).

**Etiquetas (en preguntas):** cada persona puede poner cualquiera de las tres, una vez cada una, y quitarlas:

| Etiqueta | Qué dice | Para qué sirve |
|---|---|---|
| **Interesante** | «Esta pregunta aporta» | Premia las buenas preguntas |
| **Gracias** | «Me ha servido leer esto» | Premia el hilo entero, a quien preguntó |
| **Yo también** | «Tengo la misma duda» | Dice qué dudas son comunes: pista para nuevas guías y para ordenar el listado |

**Le llegan a quien preguntó** como aviso, agrupadas («5 personas marcaron *Gracias* en tu pregunta»), nunca una por una. Se ven los totales, **no quién etiquetó**.

---

## 9 · El orden de las respuestas y la ganadora

### 9.1 La regla

1. **La ganadora va siempre la primera**, fijada y destacada.
2. **Con menos de 5 respuestas publicadas**: el resto en **orden cronológico** (la más antigua arriba). Con pocas, el orden de llegada se lee como una conversación, y un me gusta temprano no entierra a quien llegó después.
3. **Con 5 o más**: el resto **por relevancia**:
   - primero, más **me gusta** (de usuarios distintos, por construcción);
   - a igualdad, la **más antigua** primero: premia a quien ayudó antes, y el orden no salta;
   - a igualdad de todo, por **id**, para que el orden sea siempre el mismo en cada carga.
4. Un selector deja ver también **«Más recientes»**. La ganadora sigue arriba en los dos.

Por qué solo me gusta y no «interacciones»: las respuestas no tienen respuestas propias (D9), así que la única interacción que existe es el me gusta. Si un día hay otras, entran aquí con su peso, y se apunta.

### 9.2 Cómo se calcula sin errores

- El orden se calcula **en la consulta**, en la base de datos (`order by` con los criterios de arriba), no en el navegador: así es el mismo para todos y para Google.
- `me_gusta` es un **contador** de la fila, mantenido por `foro_me_gusta(...)` dentro de la misma transacción. El cron diario lo **recalcula** desde `foro_me_gusta` y avisa si encuentra diferencias: si algún error deja un contador mal, se corrige solo y se sabe.
- Ocultar una respuesta no borra sus me gusta: deja de salir y de contar mientras está oculta.

### 9.3 La respuesta ganadora

- **La elige el autor de la pregunta**, entre respuestas **publicadas** de **otras** personas. El admin también puede, y puede cambiarla.
- **Es definitiva para el autor.** Cambiarla solo puede el admin, con motivo en el registro. Si no, se podría dar los puntos a un amigo, luego a otro, y así.
- **Al elegirla**, en una sola transacción:
  1. el hilo queda **cerrado**: no admite más respuestas, y donde iba el formulario sale «Resuelto: este hilo ya tiene respuesta»;
  2. la ganadora se **fija arriba**, con su marca;
  3. su autor **gana puntos** y un aviso;
  4. quien preguntó gana unos pocos puntos por cerrar su duda;
  5. se apunta en el registro.
- **Los me gusta y las etiquetas siguen abiertos** en un hilo cerrado: un hilo resuelto puede seguir ayudando a otros.
- **Si la ganadora se oculta o se borra por moderación**: se revierten sus puntos, el hilo **se reabre** y el autor recibe un aviso para elegir otra.
- **Hilos sin ganadora**: siguen abiertos. A los 14 días con respuestas se le recuerda al autor que puede elegir una (un aviso, una vez). Si su Premium caducó, a los 30 días el hilo sale en la cola del admin, que puede elegirla.

### 9.4 Lo que hay que probar (fase 9)

Casos que se escriben como pruebas automáticas antes de abrir:

- 0, 1, 4, 5 y 20 respuestas; empates de me gusta; empates de me gusta y de fecha.
- Dar y quitar un me gusta 10 veces seguidas: el contador acaba donde empezó.
- 50 me gusta simultáneos a la misma respuesta: el contador es 50.
- Me gusta a la propia respuesta, a una oculta y a una de un hilo pendiente: rechazados.
- Elegir ganadora siendo otro usuario, eligiendo la propia, una oculta, dos veces y dos personas a la vez. Responder a un hilo cerrado.
- Ocultar la ganadora: el hilo se reabre y los puntos vuelven.
- Que el orden sea idéntico en dos cargas seguidas.

---

## 10 · Puntos, niveles y ranking

### 10.1 Cómo se guardan

Los puntos son un **libro de movimientos** (`foro_puntos`): cada punto ganado o perdido es una fila con su motivo y lo que lo causó. Nunca se suma «a mano» un total. Así:

- se puede **auditar** de dónde sale cada punto;
- se puede **revertir** lo que dependía de algo moderado (una fila en negativo, no un borrado);
- el ranking del mes o de siempre es solo **sumar filas por fechas**.

`foro_reputacion` guarda los totales para que el ranking cargue rápido; el cron diario la **recalcula desde el libro** y avisa si no cuadra.

### 10.2 Cuántos puntos y por qué

El objetivo es premiar **ayudar bien**, no publicar mucho. Por eso lo que más da es la ganadora y lo que te dan otros, y lo que depende solo de ti tiene tope.

| Motivo | Puntos | Tope |
|---|---|---|
| Tu respuesta es la **ganadora** | **+15** | — |
| **Me gusta** en tu respuesta | +2 | 20 al día por este motivo; 3 al día de una misma persona |
| **Gracias** en tu pregunta | +2 | 10 al día |
| **Interesante** en tu pregunta | +1 | 10 al día |
| **Yo también** en tu pregunta | +1 | 10 al día |
| **Respuesta publicada** | +1 | 5 al día |
| **Pregunta publicada** | +1 | 2 al día |
| **Elegir ganadora** en tu pregunta | +2 | — |
| Mensaje tuyo **retirado por moderación** | −10 | — |
| **Sanción** | −25 (aviso), −50 (suspensión) | — |

Quitar un me gusta o una etiqueta quita sus puntos. El total que se enseña nunca baja de 0.

### 10.3 Niveles

Salen de los **puntos de siempre** y se ven junto al alias en cada mensaje y en el ranking. Dan estatus, no acceso (D11):

| Nivel | Desde |
|---|---|
| Nuevo | 0 |
| Colaborador | 50 |
| Experto | 250 |
| Referente | 1.000 |

Encaja con la tarea «Niveles de usuarios» de `TAREAS.md`: si se hace un nivel de toda la web, el del foro es una de sus piezas, no otro sistema.

### 10.4 El ranking

En `/foro/ranking`, más una tarjeta con **tu posición** en el dashboard y en «Mi perfil». Dos periodos:

- **Este mes**: se reinicia cada mes. Es el que motiva: alguien nuevo puede ganar en su primer mes.
- **Siempre**: el histórico, para el estatus.

Y tres tablas: **Más puntos**, **Más respuestas ganadoras** y **Más gracias recibidas**.

Cada fila enseña posición, foto, alias, nivel y la cifra. **Sin enlace a ningún perfil.** Quien quiera puede **no aparecer en el ranking** desde «Mi perfil» (sigue ganando puntos y nivel). El admin no compite.

Los logros nuevos del foro (primera respuesta, primera ganadora, 10 ganadoras, 100 gracias…) los da el **servidor** desde el libro de puntos, nunca el navegador: `user_badges` deja insertar desde el cliente (ver el comentario de `src/app/dashboard/logros/page.tsx`), así que un logro del foro no puede ir por ahí.

---

## 11 · Avisos

Una campana en la barra con los no leídos, y la lista en el dashboard.

| Aviso | A quién | Agrupado |
|---|---|---|
| Nueva respuesta en tu pregunta | Autor de la pregunta | Sí, por hilo |
| Me gusta en tu respuesta | Autor de la respuesta | Sí, por respuesta |
| Etiquetas en tu pregunta | Autor de la pregunta | Sí, por pregunta y etiqueta |
| Tu respuesta es la ganadora | Autor de la respuesta | No |
| Tu pregunta o respuesta fue aprobada / rechazada (con motivo) | Autor | No |
| Ya puedes elegir ganadora (a los 14 días) | Autor de la pregunta | No |
| La ganadora de tu hilo se retiró: elige otra | Autor de la pregunta | No |
| Sanción, con su motivo | Sancionado | No |

Reglas:

- Se crean **dentro de la misma función** que hace el cambio, y solo sobre contenido **publicado**: un spam rechazado no llega a nadie.
- Si lo que causó el aviso se oculta o se borra, el aviso desaparece.
- **Sin auto-avisos.**
- Guardan a quién, qué hilo, el tipo, cuántos y si está leído. Nada del texto: enlazan al hilo.
- La lectura es `destinatario = auth.uid()`; nadie crea avisos para otros.
- Se borran solos a los 90 días de leídos.
- Por email, opcional y apagado por defecto (D7).

---

## 12 · Google

- Se indexa una pregunta **publicada con al menos una respuesta publicada**. Las demás, `noindex`.
- **`QAPage`** solo con lo visible: la pregunta, sus respuestas publicadas, la ganadora como `acceptedAnswer` y las demás como `suggestedAnswer`, con su número de me gusta como `upvoteCount`. Nada oculto ni pendiente (`PLATAFORMA.md`: spam de datos estructurados).
- **Sitemap**: solo los hilos indexables. Nunca la cola, los avisos ni nada personal.
- **URL**: `/foro`, `/foro/<categoria>` y `/foro/<id>-<slug-del-titulo>`. Antes de fijarlas, comparar con cada `Disallow` de `robots.txt` **por prefijo**.
- **Lo ocultado o borrado responde 410**, como las rutas retiradas (`src/lib/retiradas.ts`).
- Cada hilo lleva `DisclaimerRiesgo.tsx`, y la página dice que las respuestas son opiniones de los usuarios, no de la academia.
- El primer hilo real pasa la Fase 16 de `AUDITORIA-SEO.md`.

---

## 13 · Lo legal y la privacidad

- **Marco rumano** (`PLATAFORMA.md`): la web aloja contenido de terceros, y la Ley 365/2002 le pide retirar lo ilícito en cuanto lo sabe. Encima, el **Reglamento de Servicios Digitales (DSA)** de la UE pide a todo servicio de alojamiento un **canal para avisar de contenido ilícito** y **explicar al usuario el motivo** cuando se le retira algo. Los reportes de los Premium (§7.2), el canal de avisos legales abierto a todos (§3) y los motivos (§7.3) cubren las dos cosas; se comprueba con el texto del reglamento antes de abrir.
- **Normas de la comunidad**: una página pública que el usuario acepta antes de su primera publicación. Se guarda la fecha y la versión aceptada; si cambian, se vuelven a aceptar.
- **Términos y privacidad**: el foro como finalidad nueva (base legal: el contrato, art. 6.1.b del RGPD); qué se publica, que es visible para cualquiera e indexable, y cuánto se guarda.
- **Qué se guarda**: autor, texto, imágenes recodificadas, fechas y estado. **No se guarda la IP** en el foro. Las imágenes, **sin EXIF**.
- **Plazos**: reportes, registro de moderación y sanciones, 12 meses (D6); avisos leídos, 90 días; lo borrado se purga a los 30 días, salvo que lo cite un reporte o una sanción abiertos.
- **Borrar la cuenta** (`/api/account/delete`): sus mensajes publicados quedan como «usuario eliminado», sin alias ni foto; lo pendiente se borra; sus puntos y su fila del ranking desaparecen (D5).

---

## 14 · Lo que el usuario hace con lo suyo

- **Editar**: libremente durante 30 minutos; después, una edición vuelve a mandar el mensaje a revisión. Se guarda la versión anterior para el admin. Una respuesta ganadora no se edita: cambiaría lo que se premió.
- **Borrar**: su pregunta, mientras no tenga respuestas; después, solo pidiéndolo al admin, porque se llevaría lo que escribieron otros. Sus respuestas, siempre, salvo la ganadora.
- **Ver lo suyo**: en el dashboard, sus preguntas y respuestas con su estado (pendiente, publicada, rechazada con su motivo).

---

## 15 · Intentar romperlo (fase 9)

Antes de enseñárselo a nadie, cada intento se prueba y su resultado se escribe aquí.

**Permisos**
- [ ] Publicar, responder, dar me gusta, etiquetar, reportar y elegir ganadora sin sesión, con cuenta gratuita, suspendida y con un Premium recién caducado: la API lo rechaza todo, aunque se salte el botón.
- [ ] Escribir llamando a Supabase directamente con la clave anónima y con el token de un usuario. Tiene que fallar todo: no hay policies de escritura.
- [ ] Publicar en nombre de otro mandando otro `autor_id`.
- [ ] Leer pendientes, rechazados, ocultos, reportes, registro, sanciones, puntos y avisos de otro, con y sin sesión.
- [ ] Encontrar el `autor_id` de alguien en cualquier respuesta de la API o en el HTML.

**Contenido**
- [ ] HTML, `<script>`, `javascript:` en enlaces, Markdown malicioso y caracteres invisibles para esquivar filtros.
- [ ] Una frase semilla, una dirección pidiendo envíos y un enlace de Telegram: los tres a revisión.
- [ ] Textos justo en los límites y uno por encima.

**Imágenes**
- [ ] Un SVG con script, un PHP renombrado a `.jpg`, un GIF, un archivo de 50 MB y uno de 20.000 × 20.000 px.
- [ ] Una foto con GPS: la guardada no tiene EXIF.
- [ ] Ver la imagen de una pregunta pendiente sin ser su autor ni el admin.

**Ráfagas y concurrencia**
- [ ] Enviar en ráfaga desde una cuenta y desde varias: queda una pendiente.
- [ ] Todos los casos del §9.4.

**Puntos**
- [ ] Una pareja votándose todo un día: se para en el tope.
- [ ] Una cuenta de menos de 7 días: sus votos ordenan pero no dan puntos.
- [ ] Ocultar algo con puntos: se revierten. Recalcular la reputación desde el libro: cuadra.

**Moderación**
- [ ] Tres reportes de una misma cuenta (cuenta uno) y de tres cuentas (se oculta).
- [ ] Borrar una cuenta: sus mensajes quedan anónimos.

**Google**
- [ ] El sitemap, el `noindex`, el 410 y el `QAPage` de un hilo con y sin respuesta, y con ganadora.

---

## 16 · El plan de construcción, paso a paso

Cada fase deja algo comprobado y no empieza hasta que la anterior cumple su criterio de salida. Hasta la fase 13, **el foro no tiene ningún enlace público** y sus páginas responden 404 a quien no sea admin.

| # | Fase | Qué se hace | Criterio de salida |
|---|---|---|---|
| 0 | **Decisiones** | Cerrar las D pendientes de abajo | Todas cerradas y escritas en el §0 |
| 1 | **Perfil público** | Alias, foto, reglas del alias | ✅ Hecho. Falta ejecutar `scripts/create-perfil-publico.sql` |
| 2 | **Esquema** | Tablas, estados, `check`, únicos, índices, RLS y `GRANT` por columnas. Un solo SQL, idempotente | Desde el navegador no se puede escribir nada, comprobado con la clave anónima y con un token |
| 3 | **Funciones atómicas** | Las del §6.3, el libro de puntos y los límites del §6.5, en Postgres | Las pruebas de concurrencia del §9.4 en verde contra una base de prueba |
| 4 | **API** | `/api/foro/*` con las comprobaciones del §6.2, normalización, detectores y filtro de palabras | Cada ruta rechaza cada caso de «Permisos» y «Contenido» del §15 |
| 5 | **Imágenes** | Subida firmada, comprobación, recodificado, buckets y limpieza (§6.6) | Los casos de «Imágenes» del §15 en verde |
| 6 | **Moderación** | `/admin/foro`: cola, reportes, sanciones, confianza y registro | El admin puede hacer cada acción del §7, y todas quedan en el registro |
| 7 | **Avisos** | Tabla, creación dentro de las funciones, agrupado, campana y lista | Cada aviso del §11 se crea, se agrupa y desaparece cuando debe |
| 8 | **Puntos y ranking** | Puntos del §10.2, topes, reputación, recálculo en el cron, niveles, ranking y logros del foro | El recálculo cuadra con los totales; los casos de «Puntos» del §15 en verde |
| 9 | **Romperlo** | Todo el §15, escrito con su resultado | Cero fallos abiertos |
| 10 | **Legal** | Normas de la comunidad, términos, privacidad y canal de avisos (DSA) | Textos publicados; la aceptación de las normas se guarda con su versión |
| 11 | **Diseño** | Listado, categorías, hilo, preguntar con imágenes, responder, me gusta, etiquetas, ganadora, avisos, ranking, «lo mío» en el dashboard y la **invitación a Premium** de cada botón para quien no lo es | Revisado por el admin en escritorio y en móvil |
| 12 | **SEO** | `QAPage`, sitemap, `noindex`, 410 y auditoría del primer hilo | `check:seo` en verde y la Fase 16 de la auditoría hecha |
| 13 | **Beta cerrada** | Abierto solo para el admin y unos pocos Premium elegidos, durante 2 semanas | Sin incidencias de seguridad; límites y puntos ajustados con datos reales |
| 14 | **Apertura** | Enlace en la barra, anuncio y vigilancia de la cola los primeros días | — |

---

## Decisiones pendientes

| | Pregunta | Lo que recomiendo |
|---|---|---|
| **D2** | ¿Se aprueba antes de publicar? | **Preguntas siempre; respuestas por confianza** (§7.1) |
| **D4** | ¿Qué pasa con el Premium de un expulsado del foro? | **Nada**: pierde el foro y conserva lo que paga. Si es grave (estafa), los términos permiten cancelar; caso por caso |
| **D5** | Al borrar la cuenta, ¿sus mensajes se anonimizan o se borran? | **Se anonimizan** y, si lo pide, se borran también. Borrar siempre deja huecos en los hilos de otros |
| **D6** | ¿Cuánto se guardan reportes, registro y sanciones? | **12 meses**, y lo que esté en una reclamación abierta, hasta cerrarla |
| **D7** | ¿Avisos también por email? | **Sí, opcional y apagado por defecto**, como mucho un resumen diario. Necesita proveedor de correo y enlace de baja en cada email |
| **D8** | ¿Imágenes también en las respuestas? | **No en la primera versión.** Se añade si los usuarios lo piden |
| **D9** | ¿Respuestas a respuestas (hilos anidados)? | **No.** Respuestas planas a la pregunta: más fáciles de leer, de ordenar y de moderar |
| **D10** | Quien ya no es Premium, ¿puede elegir ganadora en sus propias preguntas? | **Decidido el 06-11-2026: no**, solo Premium participa. Al pulsar, la invitación a volver a Premium. Para que el hilo no se quede sin resolver, **el admin puede elegir la ganadora** de cualquier hilo, y a los 30 días sin ganadora se le avisa en la cola |
| **D11** | ¿Los niveles dan algo más que estatus? | **No, al principio.** Si dan algo material, se piensa con la suscripción delante |
| **D12** | La tercera etiqueta: ¿«Yo también»? | **Sí**: es la única que mide algo nuevo (cuántos tienen la misma duda) y alimenta las próximas guías |
| **D13** | ¿Categorías? | **Pocas y fijas al principio**: Bitcoin, altcoins, trading, seguridad y carteras, impuestos, la academia. Las crea solo el admin |
| **D14** | ¿Los números del §4, §6.5 y §10.2? | **Los de este documento para la beta**, y se ajustan con lo que pase en ella |
