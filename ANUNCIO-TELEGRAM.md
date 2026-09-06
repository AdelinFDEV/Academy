# Aviso manual en Telegram, con copy propio

El aviso **automático** de guías/entradas/vídeos nuevos ya existe y no necesita nada de esto: lo hace `anunciarPendientes()` en `src/lib/announce.ts` con una plantilla fija (`📚 NUEVA GUÍA INTERACTIVA` / `📝 NUEVA ENTRADA`), y se dispara solo desde el cron diario o al publicar desde el panel.

Esto otro es distinto: para cuando el admin pide un mensaje **con copy propio** — por ejemplo, un gancho concreto tipo "completa el quiz y desbloquea el badge X" en vez del texto genérico — con imagen propia si la da, y **con aprobación antes de publicar**. Es `scripts/anuncio-manual.mjs`, y el proceso son siempre estos pasos, en este orden:

1. Redactar el mensaje (con el mismo tono que el resto del bot: `**negrita**`, emojis moderados, nada de exageraciones — ver `bot-menu.ts` para el tono de referencia) y guardarlo en un `.txt` suelto, p. ej. `scripts/anuncio-manual.mensaje.txt`.
2. Si el admin da una imagen propia, pedirle la **ruta local del archivo** (no hay forma de extraer los bytes de una imagen pegada en el chat; si no da ninguna, cae por defecto a la portada genérica del sitio, `/opengraph-image`, pasándola como `--imagen-url`).
3. Enviar la vista previa al chat privado del admin:
   ```bash
   node scripts/anuncio-manual.mjs admin --texto "scripts/anuncio-manual.mensaje.txt" --boton-texto "📖 Abrir la guía" --boton-url "https://adelinacademy.com/guias/<slug>" --imagen "<ruta local>"
   ```
   Esto guarda el contenido exacto en `scripts/.anuncio-manual-cache.json` (gitignored — es un envío puntual, no algo que viva en el repo).
4. **Esperar la aprobación explícita del admin en el chat** antes de tocar el grupo free — nunca se publica sin que lo confirme, aunque la vista previa "parezca" correcta.
5. Solo entonces, publicar lo mismo, tal cual, en el grupo gratuito:
   ```bash
   node scripts/anuncio-manual.mjs free
   ```
   Este paso relee el caché — no hace falta repetir texto ni imagen, y así lo que se aprueba es exactamente lo que se publica.

El script necesita `TELEGRAM_BOT_TOKEN` en `.env.local` (no viene por defecto; si falta, pedírselo al admin) y usa `resolverChatAdmin()` contra Supabase para encontrar el chat del admin — no hace falta que dé su chat ID a mano.
