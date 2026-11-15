---
name: historia-instagram
description: Escribe el prompt completo para generar una historia de Instagram (1080 × 1920) con el estilo de AdelinBTC Academy, para anunciar una guía, un curso, una herramienta o cualquier novedad de la web, con una llamada a la acción fuerte. Úsala siempre que se pida una historia, un story, una imagen vertical para Instagram o «un anuncio para redes» de algo de la web.
---

# Historia de Instagram con el estilo de AdelinBTC Academy

Entregas **un prompt de imagen completo y desde cero** (para Gemini u otro generador) y las instrucciones para publicarla. No generas la imagen: la genera el admin.

El estilo se aprobó el 15-11-2026 con la historia de la guía de Ethereum. El prompt de esa historia está entero en [`ejemplo-ethereum.md`](./ejemplo-ethereum.md): **es el modelo**. Cada historia nueva tiene que parecer de la misma serie.

---

## 1 · Antes de escribir: lee la pieza

No inventes nada. Todo lo que diga la historia tiene que estar en la web.

1. **Abre la página que se anuncia**: `src/app/guias/<slug>/page.tsx`, el curso en `scripts/cursos/<slug>/curso.json`, la herramienta en `src/lib/herramientas.ts`. Saca el título, el gancho y lo que de verdad ofrece.
2. **Mira su portada**, si la tiene: `public/guias/<slug>.webp` o `public/cursos/<slug>/portada.webp`. El titular y el objeto 3D de la historia **salen de ella**: la historia es la versión vertical de la portada, para que quien la vea luego reconozca la guía.
3. **Comprueba que se puede enlazar**: una guía en `BORRADORES` sin publicar da 404 al público (`AGENTS.md`). Si no está publicada, avisa antes de escribir nada.
4. **Los tres datos flotantes son reales**: duración (`readTime`), una herramienta interactiva de la página (calculadora, simulador, quiz), una cifra o una promesa concreta del texto. Nunca una rentabilidad, nunca «gana dinero», nunca nada que la pieza no cumpla (regla de `PLATAFORMA.md`: no prometas lo que el producto no hace).

---

## 2 · El estilo, regla a regla

| Elemento | Cómo va siempre |
|---|---|
| Formato | Vertical 9:16, 1080 × 1920 |
| Zona segura arriba | Los **300 px** de arriba vacíos: ahí Instagram pinta el nombre y la barra de progreso |
| Zona segura abajo | Los **380 px** de abajo vacíos, en la banda azul: ahí va el sticker de enlace |
| Fondo | Blanco perla `#f2f4f7` con líneas horizontales finísimas de cuaderno; resplandor naranja difuso detrás del objeto |
| Etiqueta | Cápsula negra carbón `#1c1c1e`, texto blanco en mayúsculas («GUÍA NUEVA · GRATIS», «CURSO NUEVO», «NUEVO EN LA WEB»…) a 320 px del borde superior |
| Titular | Display **muy condensada**, alta, extra negrita, en mayúsculas, enorme, con relieve 3D. Negro carbón con **una sola palabra en naranja** `#ff6b2b`. Tres líneas como mucho. Sello circular naranja «NUEVO» girado 12° en su esquina |
| Subtítulo | Sans-serif de peso medio, gris `#3a3a3c`, dos líneas: qué es y por qué importa |
| Objeto | Render 3D de plástico brillante blanco y naranja, flotando e inclinado, con un elemento en primer plano más cerca de cámara y profundidad de campo |
| Tres datos | Tarjetas blancas flotantes con un punto naranja y texto negro en mayúsculas, a distintas alturas alrededor del objeto |
| Banda inferior | El tercio de abajo en azul noche `#0a1628` con el borde superior curvo |
| Llamada a la acción | Botón cápsula naranja con resplandor, texto blanco en mayúsculas y extra negrita (2-3 palabras: «LÉELA GRATIS», «EMPIEZA EL CURSO», «PRUÉBALO»), y debajo una flecha blanca hacia abajo |
| Paleta | Solo blanco perla, negro carbón, naranja `#ff6b2b` y azul noche `#0a1628` |

**Prohibido siempre**: emojis, personas, caras, manos, monedas, gráficos de precios, velas japonesas, logotipos que no sean el de la cripto de la guía, marcas de agua y cualquier texto que no esté en el prompt.

**Un curso** puede cambiar el naranja de la palabra destacada, del sello y del botón por **el color de su paleta** (campo `color` de `curso.json`), para que case con su certificado. Todo lo demás queda igual.

---

## 3 · Cómo se escribe el prompt

- **Completo y desde cero, siempre.** Nunca «como la anterior», «edita esta imagen» o «mismo estilo»: el generador no recuerda nada. Repite cada bloque entero aunque sea idéntico al del ejemplo.
- **En español**, con los textos exactos **entre comillas angulares «»**, con sus tildes, y la frase de cierre que obliga a no añadir texto.
- **Mismo orden de bloques que el ejemplo**: zona segura superior, fondo, etiqueta, titular, subtítulo, objeto, tres datos, banda inferior con botón, zona segura inferior, estilo, texto, prohibido.
- **Poco texto en la imagen.** El titular tiene como mucho 4 palabras por línea, el subtítulo dos líneas y los datos 3 palabras cada uno. Cuanto más texto, más faltas mete el generador.
- **El titular engancha, no describe**: el de la portada si funciona («EL ORDENADOR QUE NADIE APAGA»), o una frase con tensión. Nunca «Qué es X».

---

## 4 · Lo que entregas

1. **El prompt**, en un único bloque de código, listo para copiar.
2. **Cómo publicarla**:
   - **Sticker de enlace** con la URL completa sin `www` (`https://adelinacademy.com/…`) y su texto («Leer la guía», «Ver el curso»…), colocado en la zona azul vacía, donde apunta la flecha.
   - Si es una serie de varias historias, el orden y qué va en cada una.
3. **Una línea con las decisiones**: de dónde sale el titular, qué objeto y qué datos has elegido, para que el admin pueda pedir cambios concretos.

Si se piden **varias historias seguidas** (gancho → dato → llamada a la acción), cada una lleva su prompt entero, con el mismo fondo, la misma tipografía y la misma paleta repetidos palabra por palabra. Solo la última lleva la banda azul con el botón; las demás, una flecha discreta o «Sigue →» en negro carbón.
