# Modelo aprobado de ESTRUCTURA: historia del vídeo de TAO (15-11-2026)

> **Aprobado por el admin con este prompt exacto** («ahora sí ha salido bien»), tras corregir la banda azul en dos tonos. Es la referencia de todas las historias futuras.
>
> **La imagen que salió: [`historia-tao.png`](./historia-tao.png).** Cada historia nueva tiene que parecerse a ella en el reparto: el contenido arriba hasta algo más de la mitad, la banda azul de **un solo color** con el botón y la flecha justo bajo la curva, y debajo un hueco azul liso de casi un cuarto de la altura para el enlace.

**Este es el prompt que se copia para cualquier historia nueva.** El admin lo dio por bueno tras varios intentos: el estilo (titular condensado, objeto 3D, datos flotantes, banda azul) viene de la historia de Ethereum ([`ejemplo-ethereum.md`](./ejemplo-ethereum.md)); la **estructura y el espacio** son los de este.

Lo que se aprendió por el camino y no debe perderse:

- **Los píxeles no se respetan.** Pedido «los últimos 560 px vacíos», el generador metió el botón y la flecha hasta el borde. Se describe en **proporciones de la altura**.
- **La regla del hueco va al principio** del prompt, se repite en «FORBIDDEN» y se llama «KEY RULE». Lo primero es lo que más pesa.
- **La banda azul es UN solo bloque de un solo color**, de la curva al borde inferior. Si el prompt habla de «la parte de arriba de la banda» y aparte del «cuarto vacío», o pide un resplandor dentro de la banda, el generador pinta dos azules con una línea de corte (pasó el 15-11-2026). El resplandor del botón, pegado al botón.
- **Un cuarto, no un tercio.** Con «el último tercio vacío» y «si no cabe, hazlo todo más pequeño», ChatGPT dejaba demasiado hueco y encogía el contenido. El cuarto es el punto bueno; y nada de «hazlo más pequeño».
- **En inglés, con los textos en español entre «».** El bloque «LANGUAGE OF THE ON-IMAGE TEXT» impide que el generador los traduzca.
- **Una imagen real (miniatura, captura) se adjunta** y se coloca en una pantalla recta, de frente y sin perspectiva, con la orden de copiarla tal cual. Puede fallar (retoca caras o letras): si pasa, se deja la pantalla vacía y se pega la imagen en Instagram.

## La estructura, en proporciones de la altura

| Tramo | Qué va |
|---|---|
| 0 – 8 % | Vacío: ahí Instagram pinta el nombre de la cuenta y la barra de progreso |
| 8 – 56 % | Etiqueta, titular, subtítulo, objeto y tres datos, sobre el fondo claro |
| 57 – 100 % | **Una sola banda** azul noche, de un solo color. Botón y flecha justo bajo su borde curvo, acabando antes del 75 % |
| 75 – 100 % | Dentro de esa misma banda: **vacío**, para el sticker de enlace, que el admin pone a mano |

## El prompt

```
Vertical design for an Instagram story, 9:16 aspect ratio (1080 × 1920), for a premium online cryptocurrency academy. It announces a new YouTube video about Bittensor and its coin, TAO. Eye-catching and energetic, yet clean and professional.

KEY RULE — ONE SINGLE BLUE BAND, AND ITS LOWER PART IS EMPTY: the lower part of the image, from about 57 % of its height down to the very bottom edge, is ONE single continuous block of deep midnight blue (#0a1628). It is one flat, uniform color from its curved top edge to the bottom edge: no gradient, no second shade, no lighter or darker area, no horizontal seam or line, no vignette, no glow, no texture. Inside it, only the button and the arrow, near its top. The lowest quarter of the image stays completely empty: the same flat blue, nothing on it. It is reserved for a link sticker added later.

COMPOSITION, by proportions of the image height:
· Top 8 %: empty, background only.
· From 8 % to 56 %: label, headline, subtitle, video player and data cards, on the light background.
· From 57 % to 100 %: the single flat midnight blue band. The button and the arrow sit in its upper part, ending before 75 % of the height. From 75 % to 100 %: empty, the same flat blue.

LANGUAGE OF THE ON-IMAGE TEXT: every text in the image is in SPANISH, written exactly as given between « », with all accents. Do not translate it.

ATTACHED IMAGE: I am attaching the video thumbnail, in 16:9 format. It goes inside the screen of the video player, complete and uncropped. Copy it exactly as it is: the same person with the same face, cap, T-shirt and expression; the same headline «EL BITCOIN DE LA IA» with its letters unchanged; the same orange «T» icon, split coin with chip and label «MÁX. 21 M». Do not redraw or reinterpret it, do not change any letter, color or facial feature. It is a flat photo placed on the screen.

BACKGROUND of the light area: very light pearl white (#f2f4f7) with ultra-thin, barely visible gray horizontal lines, like a subtle notebook page, and a soft, diffused radial orange glow (#ff6b2b) behind the video player. The glow stays in the light area and never spills into the blue band.

LABEL, left-aligned with a generous left margin: a small charcoal black (#1c1c1e) capsule with white uppercase bold sans-serif text: «VÍDEO NUEVO · YOUTUBE».

HEADLINE, right below, left-aligned: very condensed, tall and narrow display typeface, extra bold, uppercase, large, slight 3D relief and soft shadow, two tightly spaced lines:
«TAO, EXPLICADO»
«EN UN VÍDEO»
Charcoal black (#1c1c1e), except «TAO,» in bright orange (#ff6b2b) with a glossy gradient and soft glow. At the top right of the headline, a small circular orange stamp rotated 12 degrees, white border, white uppercase text: «NUEVO».

SUBTITLE, below the headline, left-aligned, medium-weight sans-serif, dark gray (#3a3a3c), two lines:
«Qué es Bittensor, cómo paga en TAO»
«y por qué lo comparan con Bitcoin.»

VIDEO PLAYER, horizontally centered, in the middle of the light area: a 3D glossy white plastic video player with very rounded edges and a thin frame, perfectly front-facing, no tilt or perspective, about 85 % of the image width, screen in exact 16:9 ratio filled with the attached thumbnail, sharp. Below the screen, inside the frame, a thin progress bar in orange. A glossy orange plastic play button (#ff6b2b) with a raised white triangle sticks out of its bottom left corner, rotated 10 degrees, without covering the person's face or the thumbnail headline. A few small glossy white spheres around it for depth.

THREE FLOATING DATA CARDS close to the player, never covering its screen and never entering the blue band: white rounded cards, small orange dot on the left, charcoal black uppercase bold sans-serif text, slightly rotated like physical cards with a soft shadow:
«SUBREDES DE IA» (top right of the player)
«HALVINGS COMO BITCOIN» (bottom left of the player)
«PAGA POR APORTAR IA» (bottom right of the player)

BUTTON AND ARROW, on the flat blue band, just below its curved top edge, centered: a wide capsule button, bright orange (#ff6b2b) with glossy gradient, a soft orange glow tightly around the button only, and soft relief, white uppercase extra bold sans-serif text: «VER EL VÍDEO». Right under the button, a short thick white arrow pointing down, ending before 75 % of the image height. The glow of the button does not tint the rest of the band.

STYLE: premium 3D render, glossy plastic, cinematic studio lighting from the top left with a warm orange backlight on the light area, soft shadows, slight depth of field, but the thumbnail always sharp. High contrast, readable on a phone. Palette: pearl white, charcoal black, orange (#ff6b2b), midnight blue (#0a1628).

TEXT: outside the thumbnail, write exactly and only the texts given between « », in Spanish, with no typos and nothing added. Inside the thumbnail, only what the attached image already contains.

FORBIDDEN: a second shade of blue or any color change inside the blue band, gradients or seams in the band, anything in the bottom quarter of the image, emojis, the YouTube logo, the color red, other logos, watermarks, any person or face outside the thumbnail, hands, coins outside the thumbnail, price charts, any text not specified.
```

## Cómo se adapta a otra historia

- **Sin imagen adjunta** (una guía, un curso): fuera el bloque «ATTACHED IMAGE»; el «VIDEO PLAYER» se cambia por el objeto 3D de la portada (como en Ethereum: inclinado, con un elemento en primer plano), y el resto se queda igual.
- **Con una captura real** (el foro, una herramienta): el marco es un teléfono recto en vez de un reproductor, y la orden de copiarla tal cual es la misma.
- **Con lista** (lo que incluye Premium): el objeto a la derecha y la lista de tarjetas a la izquierda, todo dentro del 8–56 %.
- Cambian solo los textos, el objeto y la URL del enlace. **La KEY RULE, la COMPOSITION, el LANGUAGE, la banda, el estilo, el texto y el FORBIDDEN se copian palabra por palabra.**
