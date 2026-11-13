# El foro — plan de construcción

**Estado: abierto al público desde el 13-11-2026** (decisión del admin, sin la beta cerrada de la fase 13; primer hilo: la bienvenida del admin, id 1). Las fases 9 y 10 siguen pendientes con el foro ya abierto. En construcción desde el 12-11-2026. Hecho: el perfil público (alias y foto, en «Mi perfil»). El plan de seguridad se reforzó ese día (§1 puntos 1, 7 y 8, §5, §6.0, §6.1, §6.2, §6.4, §6.6 y §15): el navegador ya no lee las tablas, cada permiso se comprueba dos veces y el foro es un módulo cerrado.

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
| 12-11-2026 | **Nada se revisa antes de publicar**: preguntas y respuestas salen al momento. Se modera después, con reportes (§7) |
| 12-11-2026 | Lo que el filtro automático marca como posible estafa **se rechaza en el acto**: ni se guarda ni se publica, y el usuario lo reescribe (§6.4). No hay cola previa |
| 12-11-2026 | **Se puede responder a una respuesta, un solo nivel**: debajo de cada respuesta van sus réplicas, todas a la misma altura; contestar a una réplica la deja en ese hilo citando el alias (§2) |
| 12-11-2026 | **Imágenes solo en las preguntas**, no en respuestas ni réplicas |
| 12-11-2026 | **Seis categorías** al abrir: Bitcoin, Altcoins, Trading, Seguridad y carteras, Impuestos y La academia. Las crea solo el admin |
| 12-11-2026 | La tercera etiqueta es **«Yo también»** |
| 12-11-2026 | Al borrar la cuenta, sus mensajes **se quedan sin nombre** («usuario eliminado»); si lo pide, se borran |
| 12-11-2026 | Un expulsado del foro **conserva su Premium**. En un caso grave, el admin lo cancela a mano |
| 12-11-2026 | **Avisos solo en la web**, sin email |
| 12-11-2026 | Los niveles dan **solo estatus** |
| 12-11-2026 | Reportes, sanciones y registro se guardan **12 meses** |
| 12-11-2026 | Los números del §4, §6.5 y §10.2 son los de este documento para la beta, y se ajustan con lo que pase en ella |
| 06-11-2026 | **Solo Premium participa, en todo.** Sin Premium (gratuito, sin cuenta o con el Premium caducado) solo se lee: ni me gusta, ni etiquetas, ni reportar, ni elegir ganadora. **Cualquier botón de participar le lleva a hacerse Premium** |

---

## 1 · Los principios

1. **Un solo escritor y un solo lector: el servidor** (reforzado el 12-11-2026). Las tablas del foro no tienen **ninguna** policy, ni de escritura ni de lectura, y `anon` y `authenticated` no tienen ningún permiso sobre ellas: desde el navegador el foro **no existe** en Supabase. La clave anónima va en el navegador de cualquiera: con una policy de `insert`, un `curl` se saltaría toda la validación, y con una de `select` bastaría un despiste en los permisos de columna para enseñar un `autor_id` o un motivo de moderación. Todo lo que se lee y se escribe pasa por el módulo `src/lib/foro/` del servidor (§6.0).
2. **Lo que cambia varias cosas a la vez, en una sola transacción.** Elegir ganadora, dar un me gusta o moderar tocan varias tablas (contadores, puntos, avisos, registro). Se hacen en **funciones de Postgres**, todo o nada; nunca con varias llamadas desde la API que puedan quedarse a medias.
3. **Nada se publica sin pasar por el filtro automático.** No hay revisión humana previa (decidido el 12-11-2026), así que el filtro es la única barrera antes de publicar: lo que marca, no entra. Lo demás se corrige después, con reportes y ocultado automático (§7).
4. **Los contadores y los puntos no se escriben a mano.** Salen de las filas que los justifican: un me gusta es una fila, y la cifra se deriva. Así siempre se pueden recalcular y auditar.
5. **Lo mínimo de cada persona.** Alias y foto; ni perfil, ni email, ni IP guardada.
6. **Todo es YMYL** (dinero): el listón de calidad y de moderación es el más alto. Una estafa indexada bajo el dominio hace más daño que todas las URLs que gana el foro.
7. **Cada regla se comprueba dos veces, en dos sitios.** La API decide si alguien puede hacer algo, y la función de Postgres **lo vuelve a comprobar** dentro de la transacción (Premium, sanción, alias, normas, autoría). Si un día una ruta nueva se olvida de una comprobación, la base de datos se niega igual.
8. **Cerrado por defecto.** Lo que no está permitido expresamente, está prohibido: campos que no se esperan en una petición la invalidan, un estado desconocido no se pinta, y un fallo al comprobar un permiso es un «no».

---

## 2 · Qué hay en el foro y qué no

**Hay:**

- **Hilo** = una pregunta (título, texto, categoría y hasta 4 imágenes) y sus respuestas.
- **Respuesta**: a la pregunta.
- **Réplica**: a una respuesta, **un solo nivel**. Todas las réplicas de una respuesta van debajo de ella, a la misma altura y por orden de llegada. Contestar a una réplica crea otra réplica en ese mismo hilo, que empieza citando el alias de a quién se contesta. Solo texto, más cortas (§4), y **no pueden ser la ganadora**.
- **Me gusta** en las respuestas y en las réplicas.
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
| Responder y replicar | → Premium | → Premium | ✅ | — | ✅ |
| Me gusta en respuestas y réplicas | → Premium | → Premium | ✅ | — | ✅ |
| Etiquetar preguntas | → Premium | → Premium | ✅ | — | ✅ |
| Elegir la ganadora de **su** pregunta | — | → Premium | ✅ | — | ✅ (cualquiera) |
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
| Réplica | 5 | 1.000 | Es una aclaración, no otra respuesta |
| Imágenes por pregunta | 0 | 4 | Capturas de un gráfico, un error o un exchange |
| Peso por imagen (subida) | — | 5 MB | Lo que pesa una captura de móvil |
| Lado mayor (guardada) | — | 1.600 px | Se reduce al guardar |

Los límites se cuentan **después de normalizar** (§6.4) y viven en un solo archivo (`src/lib/foro/limites.ts`) que leen la API y el formulario. La restricción `check` de la tabla repite los máximos como última barrera.

**Imágenes en las respuestas y réplicas: no** (decidido el 12-11-2026). Como nada se revisa antes de publicar, cada imagen sale sin que nadie la haya visto; se limita a las preguntas, y casi todas las dudas se resuelven con texto.

---

## 5 · El modelo de datos

Nombres orientativos; el SQL final se escribe en la fase 2. Todas las tablas con RLS activada y **sin** policy de escritura.

| Tabla | Una fila es… | Claves y campos que importan |
|---|---|---|
| `foro_categorias` | una categoría (las crea el admin) | `slug`, `nombre`, `orden`, `activa` |
| `foro_preguntas` | una pregunta | `autor_id`, `categoria`, `titulo`, `slug`, `cuerpo`, `estado`, `cerrada`, `ganadora_id`, contadores, `huella`, fechas |
| `foro_imagenes` | una imagen de una pregunta | `pregunta_id`, `ruta`, `ancho`, `alto`, `bytes`, `orden`, `estado` |
| `foro_respuestas` | una respuesta o una réplica | `pregunta_id`, `padre_id` (vacío en una respuesta; en una réplica, la respuesta de la que cuelga, que nunca es otra réplica), `autor_id`, `cuerpo`, `estado`, `me_gusta` (contador), `huella`, fechas |
| `foro_me_gusta` | un me gusta | **PK (`respuesta_id`, `usuario_id`)**: es imposible dar dos |
| `foro_etiquetas` | una etiqueta puesta | **PK (`pregunta_id`, `usuario_id`, `tipo`)** |
| `foro_reportes` | un reporte | `objeto`, `objeto_id`, `usuario_id`, `motivo`, `estado`; único por (objeto, usuario) |
| `foro_moderacion` | una acción de moderación | quién, qué, sobre qué, motivo, fecha. **Solo inserción** |
| `foro_sanciones` | una sanción | `usuario_id`, `tipo` (aviso, suspensión, expulsión), `hasta`, `motivo` |
| `foro_puntos` | un movimiento de puntos | `usuario_id`, `motivo`, `puntos` (±), `ref`, fecha. **Solo inserción** (§10) |
| `foro_reputacion` | los totales de un usuario | puntos totales y del mes, respuestas ganadoras, gracias recibidas, nivel. **Derivada** del libro de puntos |
| `foro_ajustes` | el modo del foro y la versión de las normas | una sola fila; la leen todas las funciones (§6.1) |
| `foro_normas_aceptadas` | una aceptación de las normas | `usuario_id`, `version`, fecha |
| `foro_avisos` | un aviso | `destinatario`, `tipo`, `pregunta_id`, `cuantos`, `leido`, fechas |

**Estados** de preguntas, respuestas e imágenes: `publicada` → `oculta` (reversible) | `borrada`. No hay `pendiente` ni `rechazada`: nada espera revisión, y lo que el filtro rechaza no llega a guardarse. Nunca se borra la fila de verdad mientras haya un reporte o una sanción que la cite: se marca, y se purga al vencer el plazo de conservación (§13).

**Lectura pública: la hace el servidor, no el navegador** (cambiado el 12-11-2026; antes iba a ser una policy `select` con `GRANT` por columnas). Las páginas del foro son componentes de servidor que leen con la clave de servicio a través de `src/lib/foro/datos/`, que solo devuelve filas `publicada` y las convierte en un objeto con **los campos públicos escritos uno a uno** (§6.0). El autor de un mensaje se pinta con su alias y su foto; **`autor_id` no sale nunca al navegador**: sin perfiles visitables no hace falta, y con él se podría cruzar la actividad de alguien.

**Los identificadores.** Las preguntas llevan un número correlativo (va en la URL). Todo lo demás que el navegador necesita nombrar (una respuesta para darle me gusta, una imagen) lleva un `uuid` aleatorio: no se puede recorrer ni adivinar. Los de usuario no salen nunca.

**Claves ajenas.** `autor_id` apunta a `auth.users` con `on delete set null`: al borrar la cuenta, el mensaje se queda sin autor («usuario eliminado») sin que haya que acordarse de hacerlo. Me gusta, etiquetas, avisos y reputación, `on delete cascade`.

---

## 6 · La seguridad, capa a capa

### 6.0 El encapsulamiento: quién puede tocar qué (12-11-2026)

El foro es un módulo cerrado. Desde fuera solo se ve su puerta.

```
navegador ──► /api/foro/*  y páginas de /foro  (finas: no deciden nada)
                    │
                    ▼
            src/lib/foro/            ← la ÚNICA parte del código que conoce las tablas
            ├─ limites.ts            lo único compartido con el navegador (números)
            ├─ tipos.ts              lo que sale al navegador, campo a campo
            ├─ texto/                normalizar, detectores, enlaces, palabras
            ├─ peticion.ts           origen, tamaño, JSON estricto, errores genéricos
            ├─ permisos.ts           sesión, 2FA, Premium, sanción, alias, normas
            ├─ datos/                lecturas → devuelven solo `tipos.ts`
            └─ acciones/             escrituras → llaman a UNA función de Postgres
                    │
                    ▼
            funciones foro_*()  ──►  tablas foro_*   (sin policies, sin permisos)
```

Reglas, y las vigila `npm run check` (se añaden a `scripts/check-code.mjs` en la fase 4):

1. **Ningún archivo fuera de `src/lib/foro/` nombra una tabla ni una función `foro_`.** Ni una página, ni una ruta de la API, ni el admin: todos llaman a `datos/` o a `acciones/`.
2. **Todo `src/lib/foro/` menos `limites.ts` y `tipos.ts` empieza por `import "server-only"`**: si alguien lo importa desde un componente de cliente, la compilación falla en vez de mandar la clave de servicio al navegador.
3. **Nada sale al navegador sin pasar por un tipo de `tipos.ts`**, construido campo a campo. Nunca se devuelve una fila tal cual (`select *` y `...fila` prohibidos en `datos/`): el día que se añada una columna privada a la tabla, no sale sola.
4. **Las rutas de la API no tienen lógica**: leen la petición con `peticion.ts`, piden permiso a `permisos.ts`, llaman a una acción y devuelven su resultado. Una regla nueva se escribe una vez, en el módulo, no en cada ruta.
5. **Lo personal no se mezcla con lo público.** La página de un hilo se genera igual para todo el mundo y se puede cachear; lo que depende de quién mira (si ya le diste me gusta, tus avisos) se pide aparte, con `Cache-Control: private, no-store`. Así es imposible que la caché le sirva a uno lo de otro.
6. **Moderar invalida la caché en el acto** (`revalidateTag` del hilo): lo ocultado no puede seguir sirviéndose ni un minuto.

### 6.1 Base de datos

- RLS activada en todas las tablas y **ninguna policy**. Además, `revoke all … from anon, authenticated` en cada una: aunque alguien añadiera una policy por error, seguiría sin permiso.
- Las tablas del foro **no entran en la publicación de Realtime**: nada de lo que pasa en ellas se emite por websocket.
- `check` en la tabla: longitudes y estados permitidos. `not null` y claves ajenas en todo.
- **Únicos** que hacen imposible el doble voto: las PK de `foro_me_gusta` y `foro_etiquetas`, y el único de los reportes.
- **Funciones `SECURITY DEFINER`** para cada acción compuesta (§6.3), con `set search_path = ''` y todos los nombres con su esquema. Postgres da permiso de ejecución **a todo el mundo por defecto**, y Supabase publica cada función de `public` en `/rest/v1/rpc/…`: por eso cada una lleva su `revoke execute … from public, anon, authenticated` y su `grant execute … to service_role`, y el SQL termina con una consulta que lista quién puede ejecutar qué.
- **Cada función vuelve a comprobar el permiso** con `foro_puede_participar(usuario)` (Premium o admin en `profiles.role`, sin sanción vigente, con alias y con las normas aceptadas), dentro de la misma transacción. Cierra también el hueco entre que la API comprueba y la base de datos escribe.
- `foro_moderacion` y `foro_puntos`: sin `update` ni `delete` para nadie salvo `service_role`, y un trigger que lo rechaza también para él salvo en la purga programada.
- **Interruptor de emergencia**: una fila en `foro_ajustes` con el modo del foro (`cerrado` = solo el admin lo ve, `lectura` = se lee pero nadie publica, `abierto`). Las funciones lo leen: pasar a `lectura` corta toda escritura en el acto, sin desplegar nada. Estuvo en `cerrado` hasta el 13-11-2026; desde entonces, `abierto`.
- **Tope global**: si en una hora se publican más de 30 preguntas entre todas las cuentas, el foro pasa solo a `lectura` y avisa al admin. Un ataque coordinado no lo llena antes de que nadie mire.

### 6.2 La API (`/api/foro/*`)

Cada acción pasa, en este orden, y se corta en el primer fallo:

0. **La petición es de la propia web**: la cabecera `Origin` tiene que ser la del sitio y el `Content-Type`, `application/json`. Un formulario escondido en otra web no puede publicar en nombre de quien la visita (CSRF), aunque lleve su cookie.
1. **Sesión válida** (`supabase.auth.getUser()`, nunca `getSession()`). Si la cuenta tiene verificación en dos pasos, la sesión tiene que haberla pasado (`aal2`): hoy `src/proxy.ts` solo lo exige en las páginas protegidas, no en `/api`. Las rutas de moderación lo exigen **siempre**: un admin sin la verificación en dos pasos activada ve el panel pero no puede moderar (`sesionAdmin`).
2. **Permiso** según la tabla del §3, leído en ese momento: modo del foro, rol, sanción vigente, normas aceptadas, alias puesto.
3. **Tamaño y forma**: el cuerpo no pasa de 16 KB, y se valida con un esquema `zod` **estricto**: un campo que no se espera (`autor_id`, `estado`, `puntos`…) invalida la petición entera en vez de ignorarse. Los identificadores se validan como `uuid` o entero antes de llegar a la base de datos.
4. **Límites de envío** contados en la base de datos (§6.5).
5. **Validación del contenido** (§6.4).
6. **La función de Postgres** que hace el cambio entero. El autor es siempre el de la sesión: ninguna ruta acepta un id de usuario en el cuerpo.
7. Respuesta al cliente con un **mensaje genérico en español**. Nunca el error de Postgres, que enseña nombres de tablas y restricciones. En el registro del servidor se apunta el código del error y los ids, **nunca el texto del mensaje ni cabeceras**.

**Lo que no existe y lo que no puedes ver responden igual.** Un hilo oculto o borrado da el mismo 404 que uno que nunca existió a quien no es su autor ni el admin (el 410 del §12 es para lo retirado que Google ya conocía).

Todas las rutas `/api/foro/*` entran en el tramo `escritura` de `src/lib/rate-limit.ts`, y las imágenes en uno propio más estricto.

### 6.3 Las acciones compuestas, atómicas

| Función | Hace, todo o nada |
|---|---|
| `foro_preguntar(...)`, `foro_responder(...)` | Crean la pregunta, la respuesta o la réplica ya **publicada**, tras comprobar permiso, modo del foro, límites y duplicados; avisan a quien toca. En una réplica comprueban que el padre es una respuesta publicada de ese mismo hilo y no otra réplica |
| `foro_me_gusta(respuesta, usuario)` | Pone o quita el me gusta, ajusta el contador y los puntos (§10) y crea o agrupa el aviso. Rechaza su propia respuesta, una respuesta no publicada o de un hilo no publicado |
| `foro_etiquetar(pregunta, usuario, tipo)` | Igual, para las etiquetas de las preguntas |
| `foro_elegir_ganadora(pregunta, respuesta, usuario)` | Comprueba que es el autor (o el admin), que la respuesta es de otro y está publicada y que el hilo no está cerrado; fija la ganadora, cierra el hilo, da los puntos y avisa (§9) |
| `foro_reportar(objeto, usuario, motivo)` | Apunta el reporte y, al tercero de cuentas distintas, **oculta el mensaje** en la misma transacción |
| `foro_moderar(objeto, accion, motivo, admin)` | Oculta, restaura o borra; revierte los puntos que dependían de ello; apunta en el registro y avisa al autor con el motivo |
| `foro_sancionar(usuario, tipo, hasta, motivo, admin)` | Crea la sanción, la apunta y avisa |

Todas bloquean la fila que tocan (`select … for update`) antes de comprobar nada: dos me gusta simultáneos, o dos personas eligiendo ganadora a la vez, no pueden dejar un contador mal.

### 6.4 El contenido

- **Texto plano.** Nunca se pinta HTML del usuario: nada de `dangerouslySetInnerHTML`; React escapa el texto. Los saltos de línea se respetan. Si algún día hay formato, es un subconjunto mínimo (negrita, listas, código) convertido en el servidor con lista blanca.
- **Normalizar antes de validar y contar**: Unicode NFC, quitar caracteres invisibles (ancho cero, control, dirección del texto), colapsar espacios y saltos repetidos. Si no, las palabras vetadas se esquivan con un carácter invisible en medio. Tope de marcas combinadas por letra (el texto «zalgo» que se sale de su línea) y de saltos de línea.
- **Para comparar con los filtros se usa una segunda forma, más agresiva** (NFKC, sin tildes, minúsculas, letras parecidas de otros alfabetos pasadas a la latina): «ｅｓｔａｆａ» o una «а» cirílica no esquivan nada. Se guarda el texto en NFC; la forma agresiva solo sirve para detectar.
- **Duplicados**: huella del texto normalizado. El mismo texto dos veces se rechaza, sea del mismo usuario (cubre también el doble clic y el reintento) o de otro (cuentas coordinadas, o copiar la pregunta de alguien).
- **Enlaces**: solo a dominios de una lista blanca (la propia web, YouTube, exploradores de bloques y webs oficiales que apruebe el admin). Los demás, rechazados. Todo enlace sale con `rel="nofollow ugc noopener noreferrer"`. Se analizan con `new URL()` y se compara el **dominio exacto**: solo `https:`, sin usuario ni contraseña en la URL, sin puerto y sin dominios `xn--` (los que imitan a otro con letras parecidas). El enlace se pinta como componente de React a partir del texto, nunca como HTML.
- **El JSON-LD lleva texto de usuarios** (§12): al escribirlo en la página, cada `<` se escapa como `<`. Sin eso, un `</script>` dentro de una pregunta cerraría la etiqueta y lo siguiente se ejecutaría como código en la página de todos.
- **Detectores que rechazan el mensaje en el acto** (decidido el 12-11-2026; no se guarda, y el usuario ve qué tiene que quitar). **Buscan la oferta, no el tema**: en este foro se viene a preguntar por estafas, y un detector que rechace la palabra «Telegram» o «10 % mensual» deja sin poder preguntar a quien más lo necesita. «Me han escrito por Telegram ofreciendo un 10 % garantizado, ¿es fiable?» pasa; «escríbeme por Telegram» y «te garantizo un 10 %» no. La frase semilla se detecta con las listas oficiales BIP-39 (12 palabras seguidas de la lista). Saltan con: algo que parezca una **frase semilla** (12 o 24 palabras seguidas de la lista BIP-39), una **clave privada**, una dirección de cartera pidiendo envíos, teléfonos y emails, «escríbeme por privado», enlaces de WhatsApp o Telegram, códigos de referido y promesas de rentabilidad («x10 asegurado»). Son las estafas típicas del sector. Un falso positivo se arregla afinando el detector, y cada rechazo se cuenta (sin guardar el texto) para ver cuál se pasa de estricto.
- **Palabras malsonantes**: el mismo filtro del alias (`src/lib/perfilPublico.ts`), sobre el texto normalizado.

### 6.5 Límites de envío, por usuario

El limitador de `src/lib/rate-limit.ts` vive en la memoria de cada instancia de Vercel: es la primera capa, no la de verdad. **La de verdad se cuenta en la base de datos**, dentro de `foro_publicar` y compañía:

| Acción | Límite |
|---|---|
| Preguntas | 3 al día |
| Respuestas y réplicas | 10 a la hora, 30 al día |
| Mensajes rechazados por el filtro | 10 al día; al pasar, no puede publicar hasta mañana (quien prueba variantes para colar una estafa) |
| Me gusta | 60 al día |
| Etiquetas | 60 al día |
| Imágenes subidas | 12 al día |
| Reportes | 20 al día |

Son de arranque y se ajustan con el uso real, aquí primero.

### 6.6 Las imágenes

Una imagen es el contenido más peligroso del foro: puede llevar un script, la ubicación de alguien o algo ilegal. Así entra:

1. El navegador pide subir; la base de datos comprueba el permiso y el tope de 12 al día, **apunta la subida** (`foro_subidas`: así se sabe de quién es cada archivo y se cuenta el tope antes de dejar subir nada) y se da una **URL firmada de un solo uso** a un bucket **privado** de Supabase Storage (`foro-pendientes`).
2. Al confirmar, el **servidor** la descarga y la comprueba: tipo real por sus **primeros bytes** (no por la extensión ni por lo que diga el navegador), solo **JPG, PNG o WebP** (nunca SVG, que puede llevar código, ni GIF), peso y dimensiones.
3. **La recodifica** a WebP de 1.600 px como mucho. Recodificar destruye cualquier cosa escondida en el archivo y **borra los metadatos EXIF**, que en una foto de móvil incluyen **la ubicación GPS**.
4. Pasa al bucket público (`foro`) **al publicarse la pregunta**, ya recodificada. La original del bucket privado se borra; lo que quede allí sin pregunta a las 24 horas, lo limpia el cron.
5. El nombre del archivo lo pone el servidor (un id aleatorio), nunca el usuario.
6. Si se rechaza o se borra la pregunta, sus imágenes se borran del bucket.
7. **Los dos buckets, sin ninguna policy** en `storage.objects` para `anon` ni `authenticated`: solo entra la clave de servicio y las URL firmadas que ella emite. El límite de peso y los tipos permitidos se fijan **también en el bucket**, por si falla la comprobación del servidor.
8. **Las dimensiones se leen de la cabecera del archivo antes de decodificarlo**, con un tope de píxeles: una imagen de 20.000 × 20.000 pesa pocos KB comprimida y tumba el servidor al abrirla.
9. La imagen guardada se sirve siempre como `image/webp` (lo fija el servidor al subirla, no el navegador) y nunca desde una ruta de la propia web que acepte un nombre de archivo.

### 6.7 Contra la manipulación de puntos y del orden

Premium cuesta dinero, y eso ya frena las cuentas falsas en masa. Aun así:

- **Topes diarios** de puntos por cada motivo (§10.2): nadie sube el ranking a base de volumen.
- **Tope por pareja**: los me gusta de una misma persona a otra dan puntos solo hasta un máximo al día. Dos amigos votándose todo se estancan pronto.
- **Antigüedad mínima**: los me gusta y etiquetas de una cuenta Premium de menos de 7 días cuentan para el orden de las respuestas, pero **no dan puntos** hasta que cumple esa semana.
- **Alerta al admin** cuando una pareja de usuarios acumula muchos votos cruzados, o cuando muchos votos llegan en ráfaga a un mismo mensaje.
- Los puntos de lo que se oculta o se borra **se revierten** (§10.1).

---

## 7 · La moderación

### 7.1 Antes de publicar: solo el filtro

**Nada pasa por el admin antes de publicarse** (decidido el 12-11-2026). Lo que pasa el filtro automático del §6.4 se publica al momento; lo que no, se rechaza y no se guarda.

Eso deja al foro sin red humana previa, así que lo compensan cuatro cosas, todas automáticas:

1. **El filtro rechaza, no retiene** (§6.4), y quien acumula 10 rechazos en un día no publica hasta el siguiente.
2. **El ocultado automático** con 3 reportes (§7.2), y con **uno solo** si el motivo es «estafa» y quien reporta tiene nivel Colaborador o más.
3. **Los nuevos van más despacio**: en sus primeros 7 días en el foro, una cuenta publica como mucho 1 pregunta y 5 respuestas al día, y **no puede poner enlaces**. Es cuando actúa quien paga un mes solo para colar una estafa.
4. **Google espera** (§12): un hilo no es indexable hasta llevar 48 horas publicado sin reportes abiertos. Lo que se retira en ese plazo no llega a salir en el buscador.

`/admin/foro` no tiene cola de pendientes: tiene los **reportes abiertos**, lo **ocultado automáticamente** a la espera de decisión y las **alertas** (§6.7), con el autor de cada mensaje, sus envíos anteriores y sus sanciones.

### 7.2 Después de publicar

- **Reportar**: cualquier Premium, una vez por mensaje, con un motivo de una lista cerrada: estafa o spam, insulto, datos personales, consejo peligroso, fuera de tema, otro.
- **Ocultado automático**: con 3 reportes de cuentas distintas, el mensaje se oculta solo hasta que el admin lo revise (o con 1 de «estafa» de un Colaborador o más, §7.1). Ocultar una respuesta oculta también sus réplicas. Un reporte de «estafa» sale el primero en la lista del admin.
- **Quien reporta en falso pierde el botón**: 3 reportes desestimados por el admin en 30 días, y no puede reportar durante 30 días. Si no, tres amigos ocultarían lo que quisieran.
- Acciones del admin: **ocultar** (reversible), **restaurar**, **borrar**, **editar** (marcado), **cerrar o reabrir** un hilo, **cambiar la ganadora** y **fijar** un hilo arriba de su categoría.

### 7.3 Sanciones

En escalera, cada una con su motivo, que el sancionado ve:

1. **Aviso.**
2. **Suspensión del foro**: 7 días; la siguiente, 30.
3. **Expulsión del foro.**

Estafa, frase semilla ajena o suplantar al admin: directo al paso 3. El expulsado **conserva su Premium** (decidido el 12-11-2026); en un caso grave, el admin lo cancela a mano.

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

**Las réplicas no se ordenan por me gusta**: van debajo de su respuesta por orden de llegada, que es como se lee una conversación. Y no cuentan para el orden de las respuestas: una respuesta con mucha discusión debajo no es por eso mejor.

### 9.2 Cómo se calcula sin errores

- El orden se calcula **en la consulta**, en la base de datos (`order by` con los criterios de arriba), no en el navegador: así es el mismo para todos y para Google.
- `me_gusta` es un **contador** de la fila, mantenido por `foro_me_gusta(...)` dentro de la misma transacción. El cron diario lo **recalcula** desde `foro_me_gusta` y avisa si encuentra diferencias: si algún error deja un contador mal, se corrige solo y se sabe.
- Ocultar una respuesta no borra sus me gusta: deja de salir y de contar mientras está oculta.

### 9.3 La respuesta ganadora

- **La elige el autor de la pregunta**, entre respuestas **publicadas** de **otras** personas (una réplica no puede serlo). El admin también puede, y puede cambiarla.
- **Es definitiva para el autor.** Cambiarla solo puede el admin, con motivo en el registro. Si no, se podría dar los puntos a un amigo, luego a otro, y así.
- **Al elegirla**, en una sola transacción:
  1. el hilo queda **cerrado**: no admite más respuestas ni réplicas, y donde iba el formulario sale «Resuelto: este hilo ya tiene respuesta»;
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
- Me gusta a la propia respuesta, a una oculta y a una de un hilo oculto: rechazados.
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
| Mensaje tuyo **borrado por el admin** | −10 | — |
| **Sanción** | −25 (aviso), −50 (suspensión) | — |

Ocultar un mensaje (por reportes o por el admin) le quita los puntos que había ganado, sin multa: es reversible, y al restaurarlo vuelven. Los −10 son solo para lo que el admin **borra**, que es definitivo. Quitar un me gusta o una etiqueta quita sus puntos. El total que se enseña nunca baja de 0.

### 10.3 Niveles

Salen de los **puntos de siempre** y se ven junto al alias en cada mensaje y en el ranking. Dan solo estatus (decidido el 12-11-2026):

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
| Nueva réplica a tu respuesta, o a una réplica tuya | Autor de la respuesta y el citado | Sí, por respuesta |
| Tu mensaje se ocultó o se retiró (con motivo) | Autor | No |
| Ya puedes elegir ganadora (a los 14 días) | Autor de la pregunta | No |
| La ganadora de tu hilo se retiró: elige otra | Autor de la pregunta | No |
| Sanción, con su motivo | Sancionado | No |

Reglas:

- Se crean **dentro de la misma función** que hace el cambio, y solo sobre contenido **publicado**: un spam rechazado no llega a nadie.
- Si lo que causó el aviso se oculta o se borra, el aviso desaparece.
- **Sin auto-avisos.**
- Guardan a quién, qué hilo, el tipo, cuántos y si está leído. Nada del texto: enlazan al hilo.
- Los lee el servidor filtrando por el usuario **de la sesión**, nunca por un id que mande el navegador; nadie crea avisos para otros.
- Se borran solos a los 90 días de leídos.
- Solo en la web: no hay avisos por email (decidido el 12-11-2026).

---

## 12 · Google

- Se indexa una pregunta **publicada con al menos una respuesta publicada, que lleve 48 horas en el foro y no tenga reportes abiertos**. Las demás, `noindex`. Como nada se revisa antes de publicar, esas 48 horas son el margen para que un reporte retire algo antes de que llegue a Google.
- **`QAPage`** solo con lo visible: la pregunta, sus respuestas publicadas, la ganadora como `acceptedAnswer` y las demás como `suggestedAnswer`, con su número de me gusta como `upvoteCount`. Nada oculto (`PLATAFORMA.md`: spam de datos estructurados). Las réplicas van como `comment` de su respuesta.
- **Sitemap**: solo los hilos indexables. Nunca la cola, los avisos ni nada personal.
- **URL**: `/foro`, `/foro/<categoria>` y `/foro/<id>-<slug-del-titulo>`. Antes de fijarlas, comparar con cada `Disallow` de `robots.txt` **por prefijo**.
- **Lo ocultado o borrado responde 410**, como las rutas retiradas (`src/lib/retiradas.ts`).
- Cada hilo lleva `DisclaimerRiesgo.tsx`, y la página dice que las respuestas son opiniones de los usuarios, no de la academia.
- El primer hilo real pasa la Fase 16 de `AUDITORIA-SEO.md`.

---

## 13 · Lo legal y la privacidad

- **Marco rumano** (`PLATAFORMA.md`): la web aloja contenido de terceros, y la Ley 365/2002 le pide retirar lo ilícito en cuanto lo sabe. Encima, el **Reglamento de Servicios Digitales (DSA)** de la UE pide a todo servicio de alojamiento un **canal para avisar de contenido ilícito** y **explicar al usuario el motivo** cuando se le retira algo. Los reportes de los Premium (§7.2), el canal de avisos legales abierto a todos (§3) y los motivos (§7.3) cubren las dos cosas; se comprueba con el texto del reglamento antes de abrir.
- **Normas de la comunidad**: una página pública (`/foro/normas`, escrita el 12-11-2026 como **borrador a falta de la revisión legal**) que el usuario acepta antes de su primera publicación. La versión vigente es `NORMAS_VERSION` en `limites.ts`, que tiene que coincidir con `foro_ajustes.normas_version`. Se guarda la fecha y la versión aceptada; si cambian, se vuelven a aceptar.
- **Términos y privacidad**: el foro como finalidad nueva (base legal: el contrato, art. 6.1.b del RGPD); qué se publica, que es visible para cualquiera e indexable, y cuánto se guarda.
- **Qué se guarda**: autor, texto, imágenes recodificadas, fechas y estado. **No se guarda la IP** en el foro. Las imágenes, **sin EXIF**.
- **Plazos**: reportes, registro de moderación y sanciones, 12 meses; avisos leídos, 90 días; lo borrado se purga a los 30 días, salvo que lo cite un reporte o una sanción abiertos.
- **Borrar la cuenta** (`/api/account/delete`): sus mensajes publicados quedan como «usuario eliminado», sin alias ni foto; sus puntos y su fila del ranking desaparecen. Si además pide borrar sus mensajes, se borran.

---

## 14 · Lo que el usuario hace con lo suyo

- **Editar**: durante 30 minutos, y la edición pasa otra vez por el filtro entero. Después ya no se edita: sin revisión previa, editar más tarde serviría para cambiar un mensaje inocente por una estafa cuando ya nadie mira. Se guarda la versión anterior para el admin. Una respuesta ganadora no se edita: cambiaría lo que se premió.
- **Borrar**: su pregunta, mientras no tenga respuestas; después, solo pidiéndolo al admin, porque se llevaría lo que escribieron otros. Sus respuestas, siempre, salvo la ganadora.
- **Ver lo suyo**: en el dashboard, sus preguntas, respuestas y réplicas con su estado (publicada, u oculta o retirada con su motivo).

---

## 15 · Intentar romperlo (fase 9)

Antes de enseñárselo a nadie, cada intento se prueba y su resultado se escribe aquí.

**Permisos**
- [ ] Publicar, responder, dar me gusta, etiquetar, reportar y elegir ganadora sin sesión, con cuenta gratuita, suspendida y con un Premium recién caducado: la API lo rechaza todo, aunque se salte el botón.
- [ ] Escribir llamando a Supabase directamente con la clave anónima y con el token de un usuario. Tiene que fallar todo: no hay policies de escritura.
- [ ] Publicar en nombre de otro mandando otro `autor_id`.
- [ ] Leer ocultos, borrados, reportes, registro, sanciones, puntos y avisos de otro, con y sin sesión.
- [ ] Encontrar el `autor_id` de alguien en cualquier respuesta de la API o en el HTML.
- [ ] Leer cualquier tabla `foro_*` y llamar a cada función `foro_*` por `/rest/v1/rpc/` con la clave anónima y con el token de un Premium: todo rechazado.
- [ ] Mandar una petición válida desde otro origen (sin `Origin`, con otro `Origin` y como formulario): rechazada.
- [ ] Mandar campos de más (`autor_id`, `estado`, `puntos`) en cada ruta: la petición entera se rechaza.
- [ ] Con verificación en dos pasos activada y la sesión sin pasarla: no publica.
- [ ] Pedir un hilo oculto, uno borrado y uno que no existe sin ser el autor: los tres dan el mismo 404, con el mismo cuerpo.
- [ ] Poner el foro en `lectura`: ninguna escritura entra, tampoco llamando a la función directamente con la clave de servicio de una ruta.
- [ ] Ocultar un hilo: deja de servirse en el acto, también desde la caché, y lo personal de un usuario no aparece nunca en la respuesta de otro.
- [ ] `npm run check` falla si un archivo fuera de `src/lib/foro/` nombra una tabla `foro_`.

**Contenido**
- [ ] HTML, `<script>`, `javascript:` en enlaces, Markdown malicioso y caracteres invisibles para esquivar filtros.
- [ ] `</script><script>alert(1)</script>` en el título y en el cuerpo de una pregunta publicada: el JSON-LD no se rompe.
- [ ] Palabras vetadas con letras de ancho completo, cirílicas y con tildes de más; un enlace `xn--`, uno con `usuario@` y uno a un subdominio parecido a uno permitido.
- [ ] Una frase semilla, una dirección pidiendo envíos y un enlace de Telegram: los tres rechazados, y nada guardado. Once rechazos seguidos: bloqueado hasta mañana.
- [ ] Una cuenta de menos de 7 días en el foro: un enlace permitido, rechazado; la segunda pregunta del día, rechazada.
- [ ] Replicar a una réplica (queda en el hilo de la respuesta), a una respuesta oculta, a una de otro hilo y en un hilo cerrado. Elegir una réplica como ganadora.
- [ ] Textos justo en los límites y uno por encima.

**Imágenes**
- [ ] Un SVG con script, un PHP renombrado a `.jpg`, un GIF, un archivo de 50 MB y uno de 20.000 × 20.000 px.
- [ ] Una foto con GPS: la guardada no tiene EXIF.
- [ ] Ver una imagen subida y aún sin pregunta, o la de una pregunta oculta, sin ser su autor ni el admin.

**Ráfagas y concurrencia**
- [ ] Enviar en ráfaga desde una cuenta y desde varias: se para en los límites del §6.5, y el mismo texto dos veces se rechaza.
- [ ] Todos los casos del §9.4.

**Puntos**
- [ ] Una pareja votándose todo un día: se para en el tope.
- [ ] Una cuenta de menos de 7 días: sus votos ordenan pero no dan puntos.
- [ ] Ocultar algo con puntos: se revierten. Recalcular la reputación desde el libro: cuadra.

**Moderación**
- [ ] Tres reportes de una misma cuenta (cuenta uno) y de tres cuentas (se oculta, con sus réplicas). Uno de «estafa» de un Colaborador (se oculta). Tres reportes desestimados: pierde el botón.
- [ ] Borrar una cuenta: sus mensajes quedan anónimos.

**Google**
- [ ] El sitemap, el `noindex`, el 410 y el `QAPage` de un hilo con y sin respuesta, y con ganadora.

---

## 16 · El plan de construcción, paso a paso

Cada fase deja algo comprobado y no empieza hasta que la anterior cumple su criterio de salida. Hasta la fase 13, **el foro no tiene ningún enlace público** y sus páginas responden 404 a quien no sea admin (modo `cerrado` de `foro_ajustes`, §6.1).

**Cómo se ordena el código** (pedido por el admin el 12-11-2026: módulos separados, nunca un CSS enorme):

- La lógica, en `src/lib/foro/` (§6.0). Un archivo por responsabilidad.
- Las rutas, en `src/app/api/foro/<accion>/route.ts`, una por acción.
- Las páginas, en `src/app/foro/`, con **un CSS por pantalla**: `foro.css` (solo lo que comparten todas: cabecera del foro, tarjeta de autor, botones de participar), `listado.css`, `hilo.css`, `preguntar.css` y `ranking.css`. La moderación, en `src/app/admin/foro/` con su `foro-admin.css`. Nada del foro va a `globals.css`.
- Los componentes, en `src/components/foro/`, uno por pieza.

| # | Fase | Qué se hace | Criterio de salida |
|---|---|---|---|
| 0 | **Decisiones** | Cerrar las decisiones pendientes | ✅ Cerradas el 12-11-2026, en el §0 |
| 1 | **Perfil público** | Alias, foto, reglas del alias | ✅ Hecho, con `scripts/create-perfil-publico.sql` ejecutado (comprobado en Supabase el 12-11-2026) |
| 2 | **Esquema** | Tablas, estados, `check`, únicos, índices, RLS sin policies y `revoke` a `anon` y `authenticated`. Un solo SQL, idempotente (`scripts/create-foro.sql`) | ✅ Hecho el 12-11-2026. Con la clave anónima: las 16 tablas rechazan leer y escribir (42501) y ninguna función se puede llamar. Con el token de un usuario se prueba en la fase 9; sus permisos son los mismos, y lo confirma la consulta final del SQL |
| 3 | **Funciones atómicas** | Las del §6.3, el libro de puntos y los límites del §6.5, en Postgres | Escritas el 12-11-2026 en `scripts/create-foro-funciones.sql` (26 funciones) y probadas con 152 casos en un Postgres de pruebas (PGlite): permisos, límites, réplicas, me gusta, etiquetas, ganadora, reportes, moderación, sanciones, solo lectura, tope global y borrado de cuenta. Ejecutadas en Supabase y comprobadas el 12-11-2026 (ninguna se puede llamar con la clave anónima). **Falta**: los casos de dos peticiones a la vez del §9.4 (50 me gusta simultáneos, dos eligiendo ganadora), que necesitan varias conexiones y se prueban contra la API en la fase 9 |
| 4 | **API** | `/api/foro/*` con las comprobaciones del §6.2, normalización, detectores y filtro de palabras, y las reglas del §6.0 en `npm run check` | Escrita el 12-11-2026: `src/lib/foro/` (filtro de texto, permisos, `rutaForo`, acciones y lecturas personales), once rutas en `/api/foro/` y las tres reglas del §6.0 en `npm run check`. Probado: el filtro con 77 casos (rechaza las estafas y deja pasar a quien pregunta por ellas) y las rutas sin sesión, sin `Origin` y con `Origin` ajeno. **Falta** probar con sesiones de verdad (gratuito, Premium, suspendido, con 2FA a medias, campos de más): necesita cuentas de prueba |
| 5 | **Imágenes** | Subida firmada, comprobación, recodificado, buckets y limpieza (§6.6) | Escrita el 12-11-2026: `scripts/create-foro-imagenes.sql` (dos buckets sin policies, `foro_subidas` y dos funciones), `src/lib/foro/imagenes/` y dos rutas. Probado en local con 34 archivos (SVG con script, PHP renombrado, GIF, WebP animado, 50 MB, bomba de 20.000 × 20.000 px, foto con GPS que sale sin EXIF, script pegado al final que no sobrevive) y el SQL con 21 casos. SQL ejecutado y recorrido entero probado contra Storage el 12-11-2026: la clave anónima no lista ni sube en ningún bucket, la URL firmada sirve una sola vez, el bucket rechaza un SVG y 6 MB, y la imagen solo se ve tras publicarse y deja de verse al ocultarse. Las imágenes públicas llevan 2 minutos de caché: es lo que puede tardar en desaparecer una retirada |
| 6 | **Moderación** | `/admin/foro`: reportes, ocultados, alertas, sanciones y registro | Escrita el 12-11-2026: `/admin/foro` (modo del foro, reportes abiertos con el historial del autor, ocultos, votos cruzados, sanciones y registro), cuatro rutas en `/api/admin/foro/` tras `rutaForoAdmin` (admin **con la verificación en dos pasos pasada**, siempre) y `acciones/moderar.ts`. Se sanciona al autor de un mensaje: ni el panel lleva ids de usuario al navegador. Las funciones están probadas en el Postgres de pruebas; las rutas, sin sesión y sin `Origin`; la lectura del panel, contra la base real. La edición de un mensaje por el admin («editado por moderación») está en `foro_editar_admin` y en el panel. **Falta**: que el admin lo use con su sesión |
| 7 | **Avisos** | Tabla, creación dentro de las funciones, agrupado, campana y lista | La base de datos está hecha y probada el 12-11-2026: los avisos se crean dentro de cada función, se agrupan, bajan al quitar un me gusta y desaparecen al ocultarse lo que los causó; el cron manda «ya puedes elegir ganadora» a los 14 días (una vez) y borra los leídos a los 90. Hay ruta para leerlos y marcarlos (`/api/foro/avisos`). **Falta** la campana y la lista, que van con el diseño (fase 11) |
| 8 | **Puntos y ranking** | Puntos del §10.2, topes, reputación, recálculo en el cron, niveles, ranking y logros del foro | Hecha el 12-11-2026 en `scripts/create-foro-mantenimiento.sql`: `foro_mantenimiento()` recalcula cada día contadores y puntos desde sus filas y apunta en el registro lo que no cuadraba; el ranking mensual se reinicia solo. `datos/ranking.ts` da las cuatro tablas; los logros del foro se derivan de la reputación (`LOGROS_FORO`), no de `user_badges`. Probado con 45 casos: estropear contadores a mano y que los arregle, cambio de mes, purgas (una expulsión en vigor no se purga) y los topes de puntos de la fase 3. **Falta**: que el admin ejecute el SQL, y las páginas del ranking, que van con el diseño |
| 9 | **Romperlo** | Todo el §15, escrito con su resultado | Cero fallos abiertos |
| 10 | **Legal** | Normas de la comunidad, términos, privacidad y canal de avisos (DSA) | Textos publicados; la aceptación de las normas se guarda con su versión |
| 11 | **Diseño** | Listado, categorías, hilo, preguntar con imágenes, responder, me gusta, etiquetas, ganadora, avisos, ranking, «lo mío» en el dashboard y la **invitación a Premium** de cada botón para quien no lo es | **En marcha.** Hecho el 12-11-2026: las páginas de lectura (`/foro`, `/foro/<categoria>`, `/foro/<id>-<titulo>`), `/foro/preguntar` con subida de imágenes, `/foro/normas` con su aceptación, y en el hilo: responder y replicar, me gusta, etiquetas, elegir ganadora, reportar y borrar lo propio, con la invitación a Premium (o al paso que falte) en cada botón. Lo personal de quien mira se pide aparte (`ContextoHilo` → `/api/foro/mio`); el HTML del hilo es igual para todos. Un CSS por pantalla. Compila en producción (`next build`). Después, el mismo día: editar lo propio durante 30 minutos, `/foro/ranking` (cuatro tablas y los niveles) y `/foro/mio` (reputación y logros, avisos con su frase y su enlace, mensajes propios con su estado y el motivo si están ocultos, sanciones en vigor y salir del ranking). También el 12-11-2026, pedido por el admin: el foro en la barra de escritorio (`.nav-foro`, junto a la cápsula de las tres piezas) y en el menú a pantalla completa, y **las dos últimas preguntas en la portada, debajo de las guías** (`ForoEnPortada`, `portada.css`). Las tres cosas salen solo para quien puede entrar al foro (`foroALaVista`): todos cuando esté abierto, solo el admin mientras está cerrado; y el bloque de la portada, solo si hay preguntas. **Rediseñado desde cero el 12-11-2026**, pedido por el admin: un marco común (`MarcoForo`: fondo técnico quieto, sin desenfoque ni animación), un color y un icono por categoría (`categorias.tsx`, variable `--cat`), tarjetas de cristal y titulares con una palabra en la serif de la casa. Cada pantalla es una vista sin datos propios en `src/components/foro/vistas/` (o `ListadoHilos` / `HiloCompleto`) y su `page.tsx` solo comprueba el acceso y le pasa los datos; sigue habiendo un CSS por pantalla. El ranking lleva podio del mes; preguntar, las categorías como fichas y una columna de consejos; las normas, índice fijo y secciones numeradas; el bloque de la portada usa las mismas tarjetas. Las pantallas se vieron pintadas con datos inventados en una maqueta local que no se subió, en escritorio y en móvil. **Falta**: la campana de avisos en la barra (hoy los avisos se ven en `/foro/mio`) y el enlace desde el dashboard. Y lo principal: **nadie ha pulsado un botón con una sesión de verdad**; con el foro cerrado solo lo ve el admin con la suya |
| 12 | **SEO** | `QAPage`, sitemap, `noindex`, 410 y auditoría del primer hilo | Hecho el 12-11-2026 lo que no depende de tener contenido: `QAPage` y migas en cada hilo (`qaPageSchema` en `src/lib/schema.ts`, solo con el foro abierto), canónica por página, `noindex` hasta que un hilo es indexable (con respuesta, 48 horas y sin reportes abiertos) y el foro en el sitemap (`urlsParaSitemap`: nada mientras esté cerrado, y de los hilos solo los indexables). El esquema está probado con un `</script>` dentro del texto. **Falta**: el 410 de lo retirado que Google ya conocía, la caché de lo público, y la auditoría SEO con `check:seo` sobre el primer hilo real |
| 13 | **Beta cerrada** | Abierto solo para el admin y unos pocos Premium elegidos, durante 2 semanas | Sin incidencias de seguridad; límites y puntos ajustados con datos reales |
| 14 | **Apertura** | Enlace en la barra, anuncio y vigilancia de la cola los primeros días | — |

---

## Decisiones pendientes

Ninguna. Las once que había se cerraron el 12-11-2026 y están en el §0. Queda una, que no bloquea nada hasta la fase 6:

| | Pregunta | Lo que recomiendo |
|---|---|---|
| **D15** | Un expulsado borra su cuenta y se registra de nuevo con otro email. ¿Se le reconoce? | **Sí**: guardar con la expulsión una huella irreversible del email y del cliente de Stripe, solo para impedir el reingreso al foro, y decirlo en la privacidad. Sin eso, la expulsión dura lo que se tarda en crear otra cuenta |
