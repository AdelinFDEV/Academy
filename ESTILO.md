# El estilo de la web — «Cuaderno de estudio»

Elegido por el admin el 17-11-2026 entre 15 maquetas. La referencia viva es
[`disenos/version-o-equilibrio.html`](./disenos/version-o-equilibrio.html): ábrela antes de diseñar
cualquier pantalla nueva. **Se pule durante la producción, pero no se cambia de dirección sin que lo
pida el admin.**

Es el equilibrio de tres maquetas, y cada técnica tiene su sitio (si se usan todas en todas partes,
deja de ser un equilibrio y pasa a ser una mezcla):

| De… | Qué | Dónde se usa |
|---|---|---|
| **N** (tarjetas de estudio) | Fondo lavanda claro `#f3f5ff`; tarjetas que se giran en 3D (pregunta delante, respuesta detrás); barra de progreso gruesa con relieve; las guías como mazos apilados | Hero, guías, repasos y quiz |
| **I** (cuaderno) | Titulares en Fraunces 800; notas a mano en Caveat; subrayado de rotulador amarillo (`.fluor`); palabra rodeada a boli que se dibuja sola; botones gordos que se hunden al pulsarlos | Toda la web: es la «letra» de la marca |
| **H** (camino tipo Duolingo) | Recorrido de nodos: hecho (verde), actual (naranja que late), examen (lila), bloqueado (gris) y el certificado como meta | Cursos: módulos, exámenes y certificado |

## Las piezas

- **🔴 El sistema de diseño es [`disenos/sistema.html`](./disenos/sistema.html)** (17-11-2026): la
  paleta, el color de cada sección, la tipografía, los botones-tecla, los gestos de rotulador,
  etiquetas, pósits, pegatinas, barras de progreso, racha, tarjetas que giran, mazos, el camino, el quiz,
  formularios, avisos y tarjetas de producto. **Lo que una pantalla necesite y no esté ahí, se añade
  primero ahí y luego se usa.** Al pasarlo a la web, sus variables van a `globals.css` con los mismos nombres.
- **Colores: una web colorida, pero con significado.** Siete colores, cada uno en tres tonos: base,
  lateral `-o` (el canto de las teclas y el texto sobre su tono suave) y suave `-s` (fondos).
  | Color | Base · lateral · suave | Significa | Sección |
  |---|---|---|---|
  | Naranja | `#ff8a1f` · `#a65000` · `#ffead6` | Marca, acción principal | Portada, barra, Premium |
  | Azul | `#4f5dff` · `#2f3cc9` · `#e4e7ff` | Enlaces, foco | Diario de Trading |
  | Menta | `#2fc488` · `#137a52` · `#d9f5e9` | Hecho, acierto, guardado | Portfolio |
  | Lila | `#8f7cff` · `#6450e0` · `#ece8ff` | Exámenes | Cursos |
  | Amarillo | `#ffd23f` · `#866500` · `#fff3c4` | Rotulador, logros, riesgo | Diccionario y logros |
  | Coral | `#ff6b81` · `#bb3550` · `#ffe2e7` | Fallo, error | Foro |
  | Cielo | `#2fbff5` · `#0e709b` · `#d9f3fd` | Información | Guías |

  Los laterales `-o` se oscurecieron el 17-11-2026 para que el texto `-o` sobre su tono suave pase el
  contraste AA (4,5:1): naranja `#a65000`, menta `#137a52`, coral `#bb3550`, cielo `#0e709b`,
  amarillo `#866500`.

  **La barra de arriba** (17-11-2026, pedido por el admin: «que no se vea todo tan igual»): cada
  botón va en reposo en el tono suave de su color, con el texto en su lateral `-o`. Cursos lila,
  Portfolio menta, Diario azul, Foro coral, Instagram lila, YouTube amarillo, altavoz cielo, tu
  tarjeta naranja y menú menta. La pieza de la página en la que estás sigue siendo la tecla de su
  color base. Detalle en `src/components/site-nav.css`.
  En la barra, Cursos tira a rosa violeta y el Diario a azul cielo, y van en una cápsula lavanda
  más ancha con borde fino: lila y azul puros se confundían ahí (17-11-2026).

  **La portada** (repaso del 17-11-2026): el fondo lleva los puntos de una libreta, muy suaves (los
  mismos del menú), en vez del lavanda liso. El hero tiene tres formas planas de la paleta detrás de
  las tarjetas y, debajo, **el índice del cuaderno**: una pestaña por sección, con su color, su cifra
  real (contada, nunca escrita a mano) y su enlace. Una tarjeta nunca deja un hueco en blanco para
  igualar el alto de su vecina: lo que sobra se lo queda su dibujo (la gráfica, las fichas).

  Neutros: tinta `#1d1b33`, tinta 2 `#5f5c7d`, tinta 3 `#a3a7c0`, gris `#e2e5f4`, gris lateral
  `#c1c6dc`, fondo `#f3f5ff`, papel `#fff`. **Cifras con signo** (y solo ellas): sube `#12a36b`, baja
  `#e5484d`. Sobre naranja, azul, lila, coral y tinta, texto blanco; sobre **menta, cielo y amarillo, texto en tinta** (el blanco no llega al contraste mínimo: corregido el 17-11-2026). Premium cierra en un bloque
  de tinta oscura.
- **Tipografía:** Fraunces (titulares, 800, y números grandes), Nunito (texto y botones, 600-900),
  Caveat (notas a mano, con moderación: una o dos por sección).
- **🔴 TODOS los botones de la web son TECLAS** (pedido por el admin el 17-11-2026: «esa sensación de
  teclado súper satisfactorio»). Sin excepción: CTA, formularios, quiz, paginación, menús, admin.
  Referencia: [`disenos/botones-tecla.html`](./disenos/botones-tecla.html).
  - Un lateral sólido de su tono oscuro (`--h`: 9px normal, 6px pequeño, 12px grande, 8px solo icono; más profundas el 17-11-2026, a petición del admin) más una sombra
    blanda debajo; brillo de 2px arriba por dentro, como el borde de una tecla.
  - Al pasar el ratón la tecla «se prepara»: baja 2px.
  - Al pulsar baja **el recorrido entero** (`translateY(var(--h))`) en 60ms, el lateral desaparece, la
    cara se oscurece un poco (`brightness(.93)`) y una sombra interior marca el hundido.
  - Al soltar **rebota con muelle** (`cubic-bezier(.34,1.8,.5,1)`, 260ms).
  - Las respuestas del quiz se hunden también con el teclado físico (A, B, C, D).
  - **Suena dos veces, como una tecla de verdad** (17-11-2026): `tecla` al bajar (con un golpe grave
    de fondo) y `soltar`, más flojo, al subir; si el dedo se va fuera, sube callada. Se queda hundida
    **al menos 110 ms**, para que un toque rápido con el dedo también se vea entero, y al subir
    rebota un pelo más grande y asienta. Con Intro (y Espacio en un botón) hace lo mismo.
- **El menú se abre como un cuaderno** (17-11-2026, `menu-movil.css`, «La apertura»): la hoja se
  despliega en círculo desde el botón, las filas se reparten como tarjetas (ladeadas, se pasan y
  asientan), cada icono salta, las notas a mano se escriben solas y el panel de la cuenta entra por
  la derecha como una hoja suelta. Al cerrar, todo se recoge hacia el botón en 0,32 s. En el ordenador
  va un 40 % más pausado (0,85 s al abrir, 0,44 s al cerrar). **El menú nunca tiene scroll**: se
  compacta y, si aun así no cabe, `.mm-hoja` se escala con `zoom` hasta caber (BlogMobileMenu).
- **El desplegable de tu cuenta es una ficha de alumno** (17-11-2026): cabecera naranja suave con
  «¡hola de nuevo!» a mano, filas con su icono de color (dashboard cielo, perfil menta, admin lila,
  salir coral) y un pico que apunta a la tarjeta; se despliega como una hoja que cae y se pliega al
  cerrar. La cuenta del menú grande usa el mismo diseño.
- **🔴 Todas las tarjetas que giran usan el mismo giro** (17-11-2026): `useGiro` + `giro.css`
  (`src/components/cuaderno/`). Con el ratón encima se levanta y se ladea, pero NO gira (antes giraba
  al pasar el ratón y el clic la devolvía al sitio); al pulsar se hunde; al soltar se da la vuelta
  como una carta (se levanta, crece a mitad de giro, se pasa y asienta, siempre hacia el mismo lado)
  con un brillo que cruza la cara nueva, roce de papel y un toque sordo al caer. Ninguna tarjeta
  nueva escribe su propio `rotateY`.
  - Vibración corta en el móvil (`navigator.vibrate(8)`, donde exista).
  - El clic sonoro suena por defecto (ver «Los sonidos»). Cómo se hace:
    Web Audio API (no `<audio>`, que tarda en sonar y en iOS falla), un solo `AudioContext` creado o
    reanudado (`resume()`) en el primer `pointerdown`, sonidos cortos (< 80 ms) decodificados una vez a
    `AudioBuffer` (o sintetizados), volumen bajo y una variación mínima de tono por pulsación para que
    no canse. La preferencia se guarda en `localStorage`. En iPhone no suena con el interruptor de
    silencio puesto (es del sistema) y no hay vibración: el sonido nunca puede ser la única respuesta.
  - Desactivado: gris y sin movimiento. Foco: contorno azul separado 4px.
  - Con «reducir movimiento», el mismo hundido pero sin rebote.
  - Radio de 16px (12px el pequeño, 20px el grande) y mayúsculas 900. Variantes: naranja (la acción
    principal, una por bloque), azul, menta y blanca.
- **La barra de scroll** (17-11-2026, `globals.css`): tirador redondeado en naranja pastel con el
  brillo y el canto de las teclas, sobre el carril lavanda; se aviva al pasar el ratón. Sin dibujos:
  el admin la quiere sencilla.
- **Esquinas:** redondeadas y generosas (16-40px). Nada de esquinas rectas ni filetes de lujo.
- **Verde y rojo de cifras** (`--sube`, `--baja`) solo para cifras con signo; el «hecho» del camino es menta.
- **Sin emojis** en la web pública. En su lugar existe la **carita feliz dibujada**
  (`CaritaFeliz.tsx`, 17-11-2026): cara amarilla con contorno naranja, ojos sonrientes, mofletes
  rosados y sonrisa, que aparece con un saltito al verse y se mece despacio. Al admin le encanta y
  quiere verla más, **sin exagerar**:
  - **Una por pantalla como mucho**, y nunca dos seguidas en la misma página si se ven a la vez.
  - **Solo en momentos amables**: una bienvenida, una pista que ayuda, algo bien hecho (un quiz
    acertado, una lección terminada, un formulario enviado, un estado vacío que anima a empezar).
  - **Nunca** junto a un riesgo, un error, una advertencia, el descargo de responsabilidad, precios o
    dinero: ahí resta seriedad.
  - Va al lado del texto, como un dibujo al margen; no sustituye palabras ni lleva texto propio.
  - Primer uso: junto al pósit «Así se aprende aquí» del hero, en el móvil.
  - **Las pegatinas del cuaderno**: los dibujos amables que se generan como imagen. Tienen su propio
    apartado, con el prompt base que se usa SIEMPRE: «🔴 Las pegatinas del cuaderno», más abajo.
  - En el **menú del móvil** las teclas llevan nombres de una palabra («Diario», «Guías»…), el pastel
    de su sección y, con sesión, una tecla naranja sólida con tu foto que lleva a tu dashboard.

## 🔴 Las marcas de estudio en TODOS los textos explicativos (decidido el 17-11-2026)

El admin, tras ver la guía de Ethereum: «aplícalo a todas y marca esto como estilo para todos los
textos explicativos de la web». Cada texto que explica algo (guías, fichas del diccionario,
lecciones y fichas de los cursos) tiene que parecer **el cuaderno de alguien que lo ha estudiado a
fondo**: lo importante marcado, lo demás limpio. La referencia es `src/app/guias/ethereum/`.

- **Nunca se cambia una palabra del texto.** Las marcas son SVG que se pintan encima en el navegador
  (no las ven Google ni los lectores de pantalla) o envoltorios `<span>`/`<Anotacion>` alrededor de
  texto que no cambia. Se demuestra comparando el texto visible del HTML antes y después (diff vacío)
  y con `check:seo` antes y después.
- **Solo lo más importante de cada sección**: la respuesta, definiciones, cifras clave, advertencias,
  conclusiones, lo que entra en el quiz o el examen.
- **Código de colores (con significado, siempre el mismo):**
  | Marca | Color | Para |
  |---|---|---|
  | rotulador (`highlight`) | amarillo | la idea clave |
  | rodear (`circle`) | naranja | lo que no te puedes saltar |
  | subrayado a boli (`underline`) | azul | un concepto |
  | subrayado o tachado | coral | un error típico o un riesgo |
  | subrayado, corchete o check | menta | lo que está bien, la conclusión |
  | recuadro o subrayado | lila | lo que entra en el quiz o el examen |
  | corchete al margen (`bracket`) | el que toque | un párrafo que lo resume |
- **Símbolos de estudio** dibujados (`SimboloEstudio`: estrella, flecha, «!», check, asterisco, «NB»,
  aro; y `Llave` para agrupar una lista), `aria-hidden`, sin palabras nuevas. Al margen en escritorio,
  junto a la primera palabra en el móvil.
- **Pósits** (`Postit`): las cajas de nota, aviso o dato curioso que YA existen se convierten en pósit
  (amarillo nota o dato, coral riesgo, menta lo que está bien). Mismo texto, palabra por palabra. En
  escritorio pueden ir al margen; en el móvil, en su sitio.
- **Moderación**: como mucho 2-3 trazos animados por pantalla; el resto aparece ya dibujado
  (`animar={false}`). Se dibujan al entrar en pantalla, una vez. Con «reducir movimiento», quietos.
- **🔴 Se dibujan cuando la persona los VE, no cuando rozan la pantalla** (pedido por el admin el
  17-11-2026: en el móvil se pintaban antes de verse y la animación se perdía). Toda marca que se
  dibuje sola usa `alVerse` (`src/lib/alVerse.ts`), nunca un `IntersectionObserver` propio: espera a
  que esté en la franja central (lejos de la barra de arriba y de la del navegador abajo), a que se
  quede ahí 300 ms (pasar de largo con el dedo no cuenta), a que no esté transparente, a que la
  pestaña esté delante y a que hayan cargado las fuentes.
- Piezas en `src/components/cuaderno/`: `Anotacion`, `SimboloEstudio` (+ `Llave`), `TrazoVisible`,
  `Postit`, `colores.ts`. Referencia visual en `disenos/sistema.html`.
- **Todo texto explicativo NUEVO** (guía, ficha, lección) se escribe ya con sus marcas.

## Las librerías del estilo

Instaladas el 17-11-2026, todas con licencia MIT. **No hagas a mano lo que ya hace una de estas, ni
metas otra que haga lo mismo.** Cualquier componente que las use es de cliente (`"use client"`).

| Librería | Para qué, y solo para eso | Notas |
|---|---|---|
| `rough-notation` | Los gestos de rotulador y boli sobre el texto: subrayado (`underline`), marcador (`highlight`), rodear (`circle`), recuadro (`box`), tachado (`strike-through`), con su animación al aparecer | La forma de la I. Anotar **al entrar en pantalla** (IntersectionObserver), una vez. Con «reducir movimiento», `animate: false`. El `.fluor` de CSS sigue valiendo para titulares fijos que no necesitan animarse |
| `roughjs` | Dibujar formas «a mano» en SVG o canvas: flechas, cajas, el trazo del camino de los cursos, gráficas esbozadas en guías | Fijar `seed` para que el dibujo no cambie en cada render (y no haya desajuste de hidratación: dibujar en `useEffect`) |
| `@rive-app/react-canvas` | **La mascota** (ver abajo): sus animaciones y estados | El `.riv` se carga solo donde sale la mascota, nunca en el bundle general. Con «reducir movimiento», un fotograma quieto |
| `framer-motion` (ya estaba) | Tarjetas que giran, la barra de progreso que se llena, los nodos del camino, transiciones entre pasos | Ya lo usa la barra de navegación (`layoutId`) |
| `canvas-confetti` (ya estaba) | La celebración: aprobar un examen, terminar una guía, conseguir un logro | Solo en momentos ganados, nunca de adorno. Respeta «reducir movimiento» (`disableForReducedMotion: true`) |

Los botones-tecla, el fondo y la rotación de las tarjetas son **CSS puro**: no necesitan librería y van
más rápidos así.

## La mascota sustituye a Nova (decidido el 17-11-2026)

Nova, la asistente del Diario de Trading, se cambiará por una **mascota** animada con Rive, en la línea
de la que se dibujó en las maquetas H, I y E (una moneda naranja con cara). Lo que hay que decidir con
el admin **antes** de construirla:

- [ ] **Nombre:** ¿sigue llamándose Nova o es un personaje nuevo? Si cambia, hay textos que la nombran
  en guías, FAQ, glosario, la ficha `/herramientas/diario`, `/premium` y el aviso de cookies.
- [ ] **Diseño del personaje** y sus estados: reposo, saluda, celebra, piensa, avisa (algo va mal),
  triste, duerme. Se dibuja y anima en el editor de Rive y se exporta a `.riv`.
- [ ] **Dónde sale:** el Diario (donde vive hoy Nova), los cursos (en el camino, animando), el quiz de
  las guías (celebra o anima según la respuesta) y los logros.

Inventario de lo que es Nova hoy, para no dejar nada a medias al cambiarla. Sácalo de nuevo antes de
empezar, porque cambia: `grep -rli 'nova' src --include=*.tsx --include=*.ts --include=*.css`.
- **El personaje y su sala:** `src/components/trading/` → `NovaHead.tsx`, `NovaNav.tsx`, `NovaRoom.tsx`,
  `novaVuelo.tsx`, `nova.css`, `nova-room.css`; y `src/components/NovaMini.tsx` + `nova-mini.css`.
- **Lo que piensa y dice:** `src/components/trading/tjNova.ts` (la lógica de los avisos) y su uso en
  `TjBot.tsx`, `TjWelcome.tsx`, `TjDayJournal.tsx`, `TradingJournal.tsx`, `tjStats.ts`.
- **Dónde aparece fuera del Diario:** `NavPrincipal.tsx` y `SiteNav.tsx` (la barra),
  `PremiumHome.tsx`, `GuiaAnuncio.tsx`, `/herramientas/diario` (`NovaSaludo.tsx`), la guía del diario
  de trading (`GuiaDiarioCta.tsx`), `/premium`, `/cursos` y los textos de `glosario.ts`,
  `preguntas-frecuentes.ts`, `/cookies` y `/admin/guias-instrucciones`.
- **La lógica de los avisos se conserva:** lo que cambia es quién los dice y cómo se ve.

## Los sonidos (decidido el 17-11-2026)

La web **sonará en casi todas sus interacciones**, como una app de aprendizaje: forma parte del estilo,
igual que las teclas. Las reglas técnicas están en el apartado de los botones (Web Audio API, un solo
`AudioContext`, sonidos cortos cargados una vez, volumen bajo, preferencia en `localStorage`). Lo que
allí dice «apagado por defecto» quedó superado: vienen encendidos.

Un **sistema único**, no sonidos sueltos por componente: un módulo (p. ej. `src/lib/sonidos.ts`) con
un catálogo con nombre (`sonar("tecla")`, `sonar("acierto")`…) y un interruptor general. El mapa de
partida, que se ajustará al construirlo:

| Momento | Sonido | Carácter |
|---|---|---|
| Pulsar cualquier botón-tecla | `tecla` | Clic mecánico corto, con una variación mínima de tono |
| Girar una tarjeta de estudio | `girar` | Roce de papel |
| Acertar en un quiz | `acierto` | Dos notas ascendentes, alegre |
| Fallar en un quiz | `fallo` | Una nota grave y suave, nunca un pitido de castigo |
| Completar una lección o módulo, o avanzar en el camino | `avance` | Notas en escalera |
| Aprobar un examen, terminar una guía, ganar un logro | `logro` | Fanfarria corta, junto al confeti |
| Mantener la racha | `racha` | Chispa breve |
| Guardar (operación del Diario, perfil, formularios) | `guardado` | «Clac» satisfactorio |
| Error al guardar o validar | `error` | Golpe sordo y corto |
| Interruptor on/off | `interruptor` | Clic doble |
| Encender el sonido de la web (el altavoz) | `encender` | Clic y dos notas que suben: algo que se despierta |
| Apagarlo | `apagar` | Clic y una nota que baja y se apaga; suena antes de silenciar |
| Abrir y cerrar menús o ventanas | `abrir` / `cerrar` | Muy sutiles |
| La mascota habla o reacciona | `mascota` | Su «voz» propia, cuando exista |

Lo que no suena: pasar el ratón por encima, hacer scroll, escribir en un campo y cualquier cosa que
pase sola sin que la persona haya hecho nada.

- **Vienen ENCENDIDOS por defecto** (lo decidió el admin el 17-11-2026). Por eso el interruptor para
  silenciarlos tiene que estar **siempre a mano y a la vista**, y la elección se recuerda. Desde el
  17-11-2026 es **una etiqueta que cuelga de la barra con una cuerda trenzada color yute, que sale directamente del borde de la barra, debajo de la marca**: se mece
  despacio y da un balanceo de péndulo al pulsarla. **Encendido es naranja pastel** (las ondas
  del altavoz laten); **apagado, gris**, tachado y quieta. Al pulsarla sale unos segundos una nota a
  mano al lado: «sonido activado» o «en silencio». La barra reserva debajo su hueco (56 px), así
  que nunca tapa la página (`site-nav.css`, `.nav-sonido`). **En el móvil solo cuelga en la portada**: en cualquier
  otra página y con el menú abierto no se ve, y el altavoz está dentro del menú, junto al buscador
  (`SonidoColgante.tsx`).
- **La barra del móvil es simétrica** (17-11-2026, el admin es perfeccionista con esto): el mismo
  margen a izquierda y derecha (18 px; 14 px a 360 y 12 px a 320), el mismo hueco entre todos los
  botones (12 px; 8 px a 360 o menos) y todos con el mismo alto (34 px por debajo de 480). Volumen bajo de serie: que no asuste a quien entra desde el trabajo.
- Nunca es la única respuesta: todo lo que suena también se ve (la tecla se hunde, el aviso aparece).
  En iPhone, con el interruptor de silencio puesto, no suena nada.
- Los sonidos tienen que ser propios o con licencia que permita usarlos en una web comercial
  (sintetizados en el propio código, o de un banco con licencia clara). Se apunta el origen de cada uno.

## 🔴 Las pegatinas del cuaderno: el prompt base (decidido el 17-11-2026)

Todo dibujo que se genere como imagen para la web (con ChatGPT, Gemini o la herramienta que sea) es
una **pegatina del cuaderno**, y se pide **siempre con este prompt base**, completo y desde cero
(nunca «edita la imagen anterior»). Solo cambian la escena y el formato. Así todas parecen del mismo
dibujante. Lo pidió el admin el 17-11-2026: «para siempre respetar el mismo arte gráfico».

**Pegatinas aprobadas**, que son el modelo a imitar:

- `public/cuaderno/toro-oso-pegatina.webp`: el toro menta persigue al oso coral, que huye a dos patas
  con los brazos en alto. Va en la barra del móvil con el menú abierto (`site-nav.css`, `.nav-toro-oso`).
  Es la que mejor fija el estilo: **graciosa, tierna y nada violenta**.
- `public/cuaderno/cohete-pegatina.webp`: un cohete kawaii que despega entre estrellas, junto a «Mejora
  como trader» en el menú del móvil (`MenuGarabatos.tsx`, `.mm-cohete`).

**El prompt base**: se copia entero y se rellenan los dos huecos entre corchetes.

```
Crea una pegatina ilustrada, [FORMATO: p. ej. «horizontal y alargada (proporción 3:1)» o «cuadrada»],
con FONDO TRANSPARENTE (PNG con canal alfa), sin ningún texto, letras ni números.

ESCENA: [qué pasa, quién sale y qué hace, con el gesto y la expresión de cada uno. Siempre en clave de
dibujo animado: tierna y con humor, nunca violenta ni que dé miedo].

ESTILO (muy importante, debe ser exactamente este): ilustración de pegatina troquelada, como dibujada
a mano con rotulador en una libreta. Trazo de contorno en tinta azul marino muy oscura (#1d1b33),
grosor medio y ligeramente irregular, como hecho a mano, con extremos redondeados. Relleno de colores
PASTEL PLANOS, sin degradados, sin texturas, sin sombreado realista, tomados de esta paleta: menta
suave (#d9f5e9) con detalles en verde (#2fc488); coral rosado suave (#ffe2e7) con detalles en coral
(#ff6b81); crema (#fff3c4); naranja suave (#ffead6) con detalles en naranja (#ff8a1f); lila suave
(#ece8ff) con detalles en lila (#8f7cff); azul cielo suave (#d9f3fd) con detalles en azul (#2fbff5).
Mejillas con un toque rosa. Alrededor de TODA la silueta, un BORDE BLANCO GRUESO TROQUELADO, uniforme,
como el margen de una pegatina recortada, y detrás una sombra lila suave y difusa (#8f7cff al 25 % de
opacidad) desplazada ligeramente hacia abajo. Estética kawaii pero con humor, proporciones redondeadas
y cabezas algo grandes.

COMPOSICIÓN: el dibujo ocupa casi todo el lienzo, con aire mínimo alrededor del borde blanco. Silueta
clara y legible incluso a tamaño muy pequeño (se verá a unos [TAMAÑO EN LA WEB] px), así que evita
detalles finos, fondos, suelos, paisajes o elementos sueltos fuera del borde blanco de la pegatina.

NO incluir: texto, logotipos, fondo de color, marco rectangular, estilo 3D, fotorrealismo, degradados
ni brillos.
```

**Al subirla a la web:**

- El original que entrega el admin se deja donde lo deje. En la web se usa una **copia ligera**:
  recortada (`sharp().trim()`), a unas **3 veces el tamaño en pantalla** y en **webp**, en
  `public/cuaderno/<nombre>-pegatina.webp`.
- Si se cambia una imagen, se le pone **otro nombre**: Next y el navegador guardan la anterior por nombre.
- Siempre es decoración: `alt=""` y nada de texto dentro.
- Valen las reglas de los gestos de calidez (arriba): pocas, en momentos amables y nunca junto a un
  riesgo, un error, el descargo de responsabilidad o el dinero.

## Los trazos siempre en su sitio (18-11-2026)

Subrayados, círculos y corchetes de rotulador (rough-notation) se dibujan **solo** con `Anotacion` o con
`MarcasEstudio`, y los dos pasan por `src/lib/anclarTrazo.ts`: el trazo se ancla al bloque de su palabra y
se recoloca si algo se reacomoda (una letra que carga tarde, el zoom, girar el móvil). **Nunca** se llama
a `annotate()` directamente: sin el ancla, el trazo se queda donde estaba la palabra (pasó con «a fondo»
en el móvil).

## El puntero (decidido el 18-11-2026)

Solo con ratón. Punteros **nativos** de 32 px (`public/cuaderno/puntero*`, pegatinas en PNG o SVG; reglas al final de
`globals.css`), nunca un dibujo que siga al ratón con JavaScript: flecha en tinta con borde blanco,
manita naranja sobre lo que se pulsa y el ↻ naranja sobre las tarjetas que giran (una tarjeta girando era confusa a 32 px). Los tres son pegatinas del admin, limpias, a 32 px y con versión @2x. Donde se escribe,
la barra de texto de siempre. **Toda regla nueva que ponga la mano usa `cursor: var(--puntero-mano, pointer)`**,
nunca `cursor: pointer` a secas. Al pulsar una tecla con el ratón salen tres rayitas de rotulador
(`chispa` en `Tecla.tsx`).

## Pendiente del nuevo diseño

Lo que está decidido y aún no está hecho vive en [`TAREAS.md`](./TAREAS.md) (apartado «Nuevo diseño»).
Al terminar cada parte, se borra de allí y lo que cambie del estilo se escribe aquí.

## Lo que se probó y NO
El rediseño de lujo negro/naranja del 16-11-2026 se rechazó entero y se borró. Tampoco: editorial
oscuro, fintech con brillos, suizo, banca privada, pizarra, cómic.
