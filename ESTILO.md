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
- **Esquinas:** redondeadas y generosas (16-40px). Nada de esquinas rectas ni filetes de lujo.
- **Verde y rojo de cifras** (`--sube`, `--baja`) solo para cifras con signo; el «hecho» del camino es menta.
- **Sin emojis** en la web pública.

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
| Abrir y cerrar menús o ventanas | `abrir` / `cerrar` | Muy sutiles |
| La mascota habla o reacciona | `mascota` | Su «voz» propia, cuando exista |

Lo que no suena: pasar el ratón por encima, hacer scroll, escribir en un campo y cualquier cosa que
pase sola sin que la persona haya hecho nada.

- **Vienen ENCENDIDOS por defecto** (lo decidió el admin el 17-11-2026). Por eso el interruptor para
  silenciarlos tiene que estar **siempre a mano y a la vista** (en la barra, un altavoz-tecla), y
  la elección se recuerda. Volumen bajo de serie: que no asuste a quien entra desde el trabajo.
- Nunca es la única respuesta: todo lo que suena también se ve (la tecla se hunde, el aviso aparece).
  En iPhone, con el interruptor de silencio puesto, no suena nada.
- Los sonidos tienen que ser propios o con licencia que permita usarlos en una web comercial
  (sintetizados en el propio código, o de un banco con licencia clara). Se apunta el origen de cada uno.

## Pendiente del nuevo diseño

Lo que está decidido y aún no está hecho vive en [`TAREAS.md`](./TAREAS.md) (apartado «Nuevo diseño»).
Al terminar cada parte, se borra de allí y lo que cambie del estilo se escribe aquí.

## Lo que se probó y NO
El rediseño de lujo negro/naranja del 16-11-2026 se rechazó entero y se borró. Tampoco: editorial
oscuro, fintech con brillos, suizo, banca privada, pizarra, cómic.
