# EL BOT DE TELEGRAM — dónde vive y qué lo rompe

Esto **no se lee en cada sesión**. Se lee antes de tocar cualquier cosa del bot, y [`AGENTS.md`](./AGENTS.md) dice cuándo.

Lo primero, porque condiciona todo lo demás:

> **El bot no es un proceso aparte. Vive dentro de la web.**
>
> No hay servidor propio, ni un `node bot.js` corriendo en ningún sitio. Es una ruta de Next.js más. Si Vercel se cae, el bot se cae; si un despliegue rompe la compilación, el bot deja de responder.

Son ~3.500 líneas repartidas en cinco piezas, y ninguna estaba documentada hasta el 07-09-2026.

---

## Dónde vive cada cosa

| Pieza | Líneas | Qué es |
|---|---|---|
| `src/app/api/telegram/webhook/route.ts` | **1.353** | El cerebro. Recibe **todo** lo que Telegram manda: mensajes, pulsaciones de botón, solicitudes de entrada al canal |
| `src/lib/bot-menu.ts` | 838 | Las pantallas y los menús. Decide qué ve cada quien según su rol |
| `src/lib/telegram.ts` | 800 | La capa de API: enviar, editar, expulsar, aprobar, resolver chats |
| `src/lib/announce.ts` | 320 | Anuncia entradas, guías y vídeos nuevos |
| `src/app/api/telegram/{link,status,unlink}` | — | Unir y desunir la cuenta de la web con la de Telegram |

Y fuera de la web, una sola herramienta:

```bash
node scripts/telegram-doctor.mjs                 # diagnostica
node scripts/telegram-doctor.mjs --set-webhook   # registra el webhook
```

Comprueba lo que **no se puede ver leyendo el código**, porque no vive aquí sino en la configuración de Telegram: si el bot es administrador del canal, si tiene permiso para aprobar y expulsar, y si el webhook apunta a donde debe con el secreto correcto. Nunca imprime el token.

---

## Cómo se conecta con Telegram: un webhook

Telegram hace un `POST` a `/api/telegram/webhook` cada vez que pasa algo. **No hay sondeo**: el bot no pregunta, le avisan.

Dos cosas protegen esa puerta, y las dos importan:

1. **El secreto.** El webhook compara la cabecera `x-telegram-bot-api-secret-token` con `TELEGRAM_WEBHOOK_SECRET`. Sin coincidencia, la petición se descarta. Sin la variable, el webhook **se niega a funcionar** en vez de aceptar a todo el mundo — que es lo correcto.
2. **El anti-repetición.** Cada `update_id` se inserta en `telegram_events`. Telegram **reintenta** un envío si no le respondes rápido, y sin esta tabla un reintento ejecutaría el comando dos veces. Los ya procesados se limpian solos desde el cron.

**Lo que esto implica:** el bot puede estar perfecto en el código y mudo en producción, porque el webhook se desregistró o apunta a un despliegue viejo. Ese diagnóstico no se hace leyendo nada: se hace con `telegram-doctor`.

---

## Cómo se conecta con la web: cuatro hilos

### 1 · La vinculación de cuentas

El único puente entre «una persona en la web» y «un chat de Telegram».

```
web  → POST /api/telegram/link
     → genera un token de un solo uso, caduca a los 15 min
     → devuelve  t.me/<bot>?start=<token>
usuario abre el enlace
     → Telegram manda /start <token> al webhook
     → el webhook canjea el token y une las dos cuentas
```

Vive en `telegram_link_tokens`. `/api/telegram/status` dice si la cuenta está vinculada y `/api/telegram/unlink` la desune.

### 2 · El rol manda sobre lo que se ve

El bot lee `profiles` para saber si quien escribe es free, premium o admin, y `menuPara()` en `bot-menu.ts` monta una pantalla distinta para cada uno. **El rol se lee de la base de datos, nunca de lo que llegue en el mensaje.**

### 3 · Publicar en la web dispara un aviso

`anunciarPendientes()` (`src/lib/announce.ts`) recoge lo publicado y lo anuncia en el grupo, leyendo `posts` y `content_announcements`.

> 🔴 **Por eso `published = true` no es solo un flag de visibilidad: manda un mensaje a la comunidad del admin.** Si no ha aprobado, se inserta con `published = false`.

Para un anuncio con copy propio en vez de la plantilla fija, el procedimiento está en [`ANUNCIO-TELEGRAM.md`](./ANUNCIO-TELEGRAM.md).

### 4 · Tres crons de Vercel

Declarados en `vercel.json` y protegidos por `CRON_SECRET`:

| Cron | Cuándo | Qué hace |
|---|---|---|
| `telegram-sync` | 04:00 diario | **Expulsa del canal a quien ya no es premium**, avisa a quien está a punto de caducar y limpia los `telegram_events` viejos |
| `promo-premium` | 13:00 dom · mié · vie | Manda la promoción de Premium al canal gratuito |
| `noticias` | cada hora | Propone noticias al admin para que las apruebe |

`telegram-sync` es el que más cuidado pide: **expulsa gente**. Antes de echar a nadie comprueba si está realmente dentro del canal, y no es un detalle de eficiencia — sin esa comprobación, cada usuario gratuito que vinculó Telegram pero nunca entró al canal generaría una llamada de expulsión y un registro, todos los días, para siempre.

---

## Las once tablas

| Tabla | Para qué |
|---|---|
| `telegram_link_tokens` | Los tokens de vinculación, de un solo uso |
| `telegram_events` | Anti-repetición de `update_id` |
| `telegram_access_log` | Quién entró y quién fue expulsado del canal, y por qué |
| `telegram_support_threads` | Los hilos de soporte: el usuario escribe al bot, el admin contesta |
| `telegram_channel_events` · `telegram_channel_stats` | Altas, bajas y recuento del canal |
| `bot_ajustes` | Interruptores del bot. Hoy, el de pausar avisos (`/stop`) |
| `content_announcements` | Qué se ha anunciado ya, para no repetirlo |
| `posts` · `profiles` · `noticias` | Las de la web, en solo lectura desde el bot |

---

## Las catorce variables de entorno

```
TELEGRAM_BOT_TOKEN              TELEGRAM_WEBHOOK_SECRET
TELEGRAM_BOT_USERNAME           TELEGRAM_OWNER_ID
TELEGRAM_CHANNEL_ID             TELEGRAM_ADMIN_CHAT_ID
TELEGRAM_CHANNEL_INVITE_LINK    TELEGRAM_ADMIN_USERNAME
TELEGRAM_FREE_CHANNEL_ID        TELEGRAM_COMMUNITY_CHAT_ID
TELEGRAM_FREE_CHANNEL_USERNAME  TELEGRAM_LOG_CHAT_ID
CRON_SECRET                     NEXT_PUBLIC_SITE_URL
```

**Ninguna se lee directamente fuera de `telegram.ts`.** Ahí hay un ayudante por cada una (`getChannelId()`, `getFreeChannelUrl()`, `getOwnerTelegramId()`…), y todos fallan con un mensaje claro si falta la variable. Es el mismo patrón de fuente única del resto del proyecto: **no escribas `process.env.TELEGRAM_*` en una ruta nueva**, usa el ayudante o añade uno.

---

## Los 27 comandos

```
/start  /arrancar  /menu  /ayuda  /help  /stop  /cancelar  /estado
/web  /dashboard  /premium  /precio  /gratis  /canal  /video
/articulos  /guias  /glosario  /calculadora  /portfolio  /noticias
/faq  /terminos  /privacidad  /usuarios  /chatid  /gombos
```

Los públicos están en `COMANDOS_PUBLICOS` (`bot-menu.ts`), que es lo que se registra en el menú de Telegram. Los de admin no salen ahí.

⚠️ **Un comando retirado del código sigue apareciendo en el menú de Telegram** hasta que se vuelve a registrar la lista. Es configuración del lado de Telegram, no del repo — se arregla con `telegram-doctor`.

---

## Los cinco errores que costarían caro

1. **Leer el rol de lo que llega en el mensaje.** Se lee de `profiles`, siempre. Lo que manda el cliente nunca decide quién es admin.
2. **Quitar el anti-repetición de `telegram_events`.** Parece una tabla de sobra hasta que un reintento de Telegram publica dos veces el mismo anuncio.
3. **Publicar sin aprobación.** `published = true` habla con la comunidad del admin.
4. **Tocar `telegram-sync` sin entender que expulsa gente.** Un fallo ahí echa a suscriptores que están pagando.
5. **Dar por muerto al bot leyendo el código.** Si no responde, lo primero es `node scripts/telegram-doctor.mjs`: nueve de cada diez veces el problema está en la configuración de Telegram, no aquí.
