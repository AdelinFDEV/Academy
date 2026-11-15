---
name: historia-instagram
description: Escribe el prompt completo para generar una historia de Instagram (1080 × 1920) con el estilo de AdelinBTC Academy, para anunciar una guía, un curso, una herramienta, un vídeo o cualquier novedad de la web, con una llamada a la acción fuerte; y las portadas de las historias destacadas. Úsala siempre que se pida una historia, un story, una imagen vertical para Instagram, una portada de destacada o «un anuncio para redes» de algo de la web.
---

# Historia de Instagram con el estilo de AdelinBTC Academy

Entregas **un prompt de imagen completo y desde cero** (para Gemini, ChatGPT u otro generador) y las instrucciones para publicarla. No generas la imagen: la genera el admin.

Dos modelos aprobados el 15-11-2026, y cada historia nueva tiene que parecer de la misma serie:

- **[`ejemplo-tao.md`](./ejemplo-tao.md) — la ESTRUCTURA. Es el prompt que se copia**, y [`historia-tao.png`](./historia-tao.png) es la imagen que salió con él: la referencia visual de cómo tiene que quedar. Orden de bloques, proporciones, el hueco de abajo para el enlace, inglés con los textos en español. Ahí está también cómo adaptarlo a una guía, una captura o una lista.
- [`ejemplo-ethereum.md`](./ejemplo-ethereum.md) — el **estilo** visual (titular condensado, objeto 3D inclinado, datos flotantes, banda azul). Su reparto del espacio está superado: no lo copies.

---

## 1 · Antes de escribir: lee la pieza

No inventes nada. Todo lo que diga la historia tiene que estar en la web.

1. **Abre la página que se anuncia**: `src/app/guias/<slug>/page.tsx`, el curso en `scripts/cursos/<slug>/curso.json`, la herramienta en `src/lib/herramientas.ts`, `/premium` en `src/app/premium/page.tsx`. Saca el título, el gancho y lo que de verdad ofrece.
2. **Mira su portada o su miniatura**, si la tiene: `public/guias/<slug>.webp`, `public/cursos/<slug>/portada.webp` o la que pase el admin. El titular y el objeto 3D **salen de ella**, para que quien vea la historia la reconozca luego.
3. **Comprueba que se puede enlazar**: una guía en `BORRADORES` sin publicar da 404 al público (`AGENTS.md`). Si no está publicada, avisa antes de escribir nada.
4. **Los datos flotantes son reales**: duración, una herramienta de la página, una cifra o una promesa concreta del texto. Nunca una rentabilidad, nunca «gana dinero», nunca nada que la pieza no cumpla (`PLATAFORMA.md`: no prometas lo que el producto no hace).
5. **Una rebaja** se anuncia con el precio anterior tachado, y ese precio tiene que ser el más bajo de los 30 días previos (directiva europea Ómnibus). Nada de «oferta limitada» si no tiene fecha de fin.

---

## 2 · La estructura, en proporciones de la altura

| Tramo | Qué va |
|---|---|
| 0 – 8 % | Vacío: ahí Instagram pinta el nombre de la cuenta y la barra de progreso |
| 8 – 56 % | Etiqueta, titular, subtítulo, objeto y datos, sobre el fondo claro |
| 57 – 100 % | **Una sola banda** azul noche, de un solo color plano. Botón y flecha justo bajo su borde curvo, acabando antes del 75 % |
| 75 – 100 % | Dentro de esa misma banda: **vacío**, para el sticker de enlace, que el admin pone a mano |

**Siempre en proporciones, nunca en píxeles**: el generador ignora los píxeles (pedidos 560 px libres, dejó cero). **Un cuarto, no un tercio**: con el tercio, ChatGPT dejaba demasiado hueco y encogía el contenido.

## 3 · El estilo, regla a regla

| Elemento | Cómo va siempre |
|---|---|
| Formato | Vertical 9:16, 1080 × 1920 |
| Fondo | Blanco perla `#f2f4f7` con líneas horizontales finísimas de cuaderno; resplandor naranja difuso detrás del objeto |
| Etiqueta | Cápsula negra carbón `#1c1c1e`, texto blanco en mayúsculas («GUÍA NUEVA · GRATIS», «VÍDEO NUEVO · YOUTUBE», «PREMIUM · NUEVO PRECIO»…) |
| Titular | Display **muy condensada**, alta, extra negrita, en mayúsculas, grande, con relieve 3D. Negro carbón con **una sola palabra (o cifra) en naranja** `#ff6b2b`. Dos o tres líneas. Sello circular naranja («NUEVO», «−60 %») girado 12° en su esquina |
| Subtítulo | Sans-serif de peso medio, gris `#3a3a3c`, dos líneas: qué es y por qué importa |
| Objeto | Render 3D de plástico brillante blanco y naranja, flotando, con un elemento en primer plano más cerca de cámara y profundidad de campo. Si lleva una imagen real (miniatura, captura), va en una pantalla **recta, de frente y sin perspectiva** |
| Datos | Tres tarjetas blancas flotantes (o una lista de hasta cinco), con un punto o una marca naranja y texto negro en mayúsculas, que no tapan el objeto ni entran en la banda |
| Banda inferior | Azul noche `#0a1628` desde el 57 % hasta el borde de abajo, con el borde superior curvo. **Un solo bloque de un solo color**: sin degradado, sin resplandor dentro, sin línea de corte. El resplandor del botón, pegado al botón. Si se describe en dos trozos («la parte de arriba de la banda» y «el cuarto vacío»), el generador pinta dos azules |
| Llamada a la acción | Botón cápsula naranja con resplandor, texto blanco en mayúsculas y extra negrita (2-3 palabras: «LÉELA GRATIS», «VER EL VÍDEO», «HAZTE PREMIUM»), y debajo una flecha blanca corta hacia abajo, que acaba antes del último cuarto |
| Paleta | Solo blanco perla, negro carbón, naranja `#ff6b2b` y azul noche `#0a1628` (más ámbar `#ffb347` si sale la corona de Premium) |

**Prohibido siempre**: emojis, personas, caras y manos (salvo las de una miniatura o captura real que se adjunta), monedas, gráficos de precios, velas japonesas, el logotipo y el rojo de YouTube, logotipos que no sean el de la cripto de la pieza, marcas de agua y cualquier texto que no esté en el prompt.

**Un curso** puede cambiar el naranja de la palabra destacada, del sello y del botón por **el color de su paleta** (campo `color` de `curso.json`), para que case con su certificado. Todo lo demás queda igual.

---

## 4 · Cómo se escribe el prompt

- **Completo y desde cero, siempre.** Nunca «como la anterior», «edita esta imagen» o «mismo estilo»: el generador no recuerda nada. Repite cada bloque entero aunque sea idéntico al del modelo.
- **En inglés, con los textos de la imagen en español** entre comillas angulares «», con sus tildes. El bloque «LANGUAGE OF THE ON-IMAGE TEXT» impide que los traduzca.
- **El mismo orden de bloques que [`ejemplo-tao.md`](./ejemplo-tao.md)**: KEY RULE (el cuarto de abajo vacío), COMPOSITION (los tramos), LANGUAGE, imagen adjunta si la hay, fondo, etiqueta, titular, subtítulo, objeto, datos, banda con botón, estilo, texto y FORBIDDEN (que repite lo del cuarto vacío). **Nunca** «si no cabe, hazlo todo más pequeño».
- **Poco texto en la imagen.** El titular, como mucho 4 palabras por línea; el subtítulo, dos líneas; cada dato, 3-4 palabras. Cuanto más texto, más faltas mete el generador.
- **El titular engancha, no describe**: el de la portada si funciona («EL ORDENADOR QUE NADIE APAGA»), o una frase con tensión. Nunca «Qué es X». Si la miniatura adjunta ya lleva un titular, el de la historia dice otra cosa.

---

## 5 · Lo que entregas

1. **El prompt**, en un único bloque de código, listo para copiar. Si lleva imagen adjunta, recuerda que se sube en el mismo mensaje.
2. **Cómo publicarla**:
   - **Sticker de enlace** con la URL completa sin `www` (`https://adelinacademy.com/…`) y su texto («Leer la guía», «Ver el vídeo»…), en el cuarto azul vacío de abajo. Si la URL no está en el repo (un vídeo), pídela o di de dónde copiarla.
   - Si el generador no deja el hueco: en Instagram se pellizca la imagen para hacerla más pequeña y se sube; el fondo se rellena de azul y ahí va el enlace.
   - Si es una serie de varias historias, el orden y qué va en cada una.
3. **Una línea con las decisiones**: de dónde sale el titular, qué objeto y qué datos has elegido, para que el admin pueda pedir cambios concretos.

Si se piden **varias historias seguidas** (gancho → dato → llamada a la acción), cada una lleva su prompt entero, con el mismo fondo, la misma tipografía y la misma paleta repetidos palabra por palabra. Solo la última lleva la banda azul con el botón; las demás, una flecha discreta o «Sigue →» en negro carbón.

---

## 6 · Portadas de historias destacadas

Formato fijado por el admin el 15-11-2026: **el mismo que el icono de la web**. Una portada con el fondo oscuro de las historias se rechazó por no casar con el resto del perfil.

**El modelo aprobado es [`ejemplo-destacada.md`](./ejemplo-destacada.md)**, con su imagen [`destacada-premium.webp`](./destacada-premium.webp): cada portada nueva copia su prompt palabra por palabra y cambia solo el objeto. Ahí está también la lista de destacadas ya hechas y su objeto, para no repetir.

- Cuadrada, 1080 × 1080. Instagram la recorta en círculo: todo dentro de un círculo central de 900 px.
- **Fondo blanco** (`#ffffff`), liso.
- **Un aro naranja como borde**, grueso, en plástico 3D con degradado `#ff6b2b` → `#ff9a5c` y un reflejo arriba a la izquierda. Nunca una línea plana.
- Dentro, **un solo objeto** en el render 3D de la serie, grande (casi dos tercios del aro), **inclinado** y **mayormente naranja y ámbar** (`#ffb347`) con detalles blancos: sobre fondo blanco, un objeto blanco se pierde. La primera corona, blanca, recta y con contorno gris, se rechazó por «sosa».
- Detrás, un **resplandor naranja** suave, y alrededor, cuatro destellos pequeños y unas esferas diminutas. Sin texto, sin contornos grises, sin colores fuera de blanco, naranja y ámbar.
