/**
 * Diagnóstico del bot de Telegram. Comprueba de una pasada todo lo que no se
 * puede ver leyendo el código, porque vive en la configuración de Telegram:
 * si el bot es admin del canal, si tiene permiso para aprobar y expulsar, si
 * el webhook apunta a donde debe y si está registrado con el secreto.
 *
 *   node scripts/telegram-doctor.mjs              → solo diagnostica
 *   node scripts/telegram-doctor.mjs --set-webhook → registra el webhook
 *
 * Nunca imprime el token ni el secreto: solo dice si están y si funcionan.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");

const VERDE = "\x1b[32m", ROJO = "\x1b[31m", AMARILLO = "\x1b[33m", GRIS = "\x1b[2m", FIN = "\x1b[0m";
const ok = (t, extra = "") => console.log(`${VERDE}✓${FIN} ${t} ${GRIS}${extra}${FIN}`);
const mal = (t, extra = "") => console.log(`${ROJO}✗${FIN} ${t} ${GRIS}${extra}${FIN}`);
const aviso = (t, extra = "") => console.log(`${AMARILLO}!${FIN} ${t} ${GRIS}${extra}${FIN}`);

/** Lee .env.local sin dependencias: KEY=valor, ignorando comentarios. */
function leerEnv() {
  let texto;
  try {
    texto = readFileSync(join(RAIZ, ".env.local"), "utf8");
  } catch {
    console.error("No se encuentra .env.local en la raíz del proyecto.");
    process.exit(1);
  }
  const env = {};
  for (const linea of texto.split("\n")) {
    const limpia = linea.trim();
    if (!limpia || limpia.startsWith("#")) continue;
    const igual = limpia.indexOf("=");
    if (igual === -1) continue;
    env[limpia.slice(0, igual).trim()] = limpia.slice(igual + 1).trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = leerEnv();
const TOKEN = env.TELEGRAM_BOT_TOKEN;
const CANAL = env.TELEGRAM_CHANNEL_ID;
const SECRETO = env.TELEGRAM_WEBHOOK_SECRET;
// Mismo valor por defecto que getCuentaUrl() en src/lib/telegram.ts: en local
// NEXT_PUBLIC_SITE_URL no suele estar definida, y el webhook siempre apunta a
// producción de todas formas (Telegram no puede llamar a localhost).
const SITIO = env.NEXT_PUBLIC_SITE_URL || "https://adelinacademy.com";

async function api(metodo, params = {}) {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${metodo}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.description ?? `HTTP ${res.status}`);
  return json.result;
}

console.log("\nDiagnóstico de Telegram\n");

// — 1. Variables de entorno —
const faltan = ["TELEGRAM_BOT_TOKEN", "TELEGRAM_BOT_USERNAME", "TELEGRAM_CHANNEL_ID",
  "TELEGRAM_WEBHOOK_SECRET", "TELEGRAM_CHANNEL_INVITE_LINK"].filter((k) => !env[k]);
if (faltan.length) {
  mal("Faltan variables en .env.local", faltan.join(", "));
  process.exit(1);
}
ok("Las 5 variables de Telegram están definidas en .env.local");

// — 2. El bot responde —
let bot;
try {
  bot = await api("getMe");
  ok(`El token es válido`, `@${bot.username}`);
} catch (err) {
  mal("El token no funciona", err.message);
  process.exit(1);
}

if (env.TELEGRAM_BOT_USERNAME !== bot.username) {
  mal("TELEGRAM_BOT_USERNAME no coincide con el bot real",
    `configurado: ${env.TELEGRAM_BOT_USERNAME} · real: ${bot.username}`);
  console.log(`  ${GRIS}El deep-link de vinculación (t.me/usuario?start=…) apuntaría a otro sitio.${FIN}`);
} else {
  ok("TELEGRAM_BOT_USERNAME coincide con el bot real");
}

// — 3. El canal existe y el bot está dentro con los permisos que necesita —
try {
  const chat = await api("getChat", { chat_id: CANAL });
  ok(`El canal existe`, `${chat.title} (${chat.type})`);

  const miembro = await api("getChatMember", { chat_id: CANAL, user_id: bot.id });
  if (miembro.status !== "administrator") {
    mal("El bot NO es administrador del canal", `estado: ${miembro.status}`);
    console.log(`  ${GRIS}Sin esto no puede aprobar solicitudes ni expulsar a nadie.${FIN}`);
  } else {
    ok("El bot es administrador del canal");
    if (!miembro.can_invite_users) {
      mal("Le falta el permiso «Invitar usuarios / añadir miembros»");
      console.log(`  ${GRIS}Es el permiso que Telegram exige para aprobar solicitudes de entrada.${FIN}`);
    } else ok("Puede aprobar solicitudes de entrada");
    if (!miembro.can_restrict_members) {
      mal("Le falta el permiso «Banear usuarios»");
      console.log(`  ${GRIS}Sin él no puede expulsar a quien deje de ser Premium.${FIN}`);
    } else ok("Puede expulsar miembros");
  }
} catch (err) {
  mal("No se puede leer el canal", err.message);
  console.log(`  ${GRIS}Revisa TELEGRAM_CHANNEL_ID y que el bot esté añadido al canal.${FIN}`);
}

// — 4. Webhook —
const urlEsperada = `${SITIO.replace(/\/$/, "")}/api/telegram/webhook`;

if (process.argv.includes("--set-webhook")) {
  try {
    await api("setWebhook", {
      url: urlEsperada,
      secret_token: SECRETO,
      // callback_query es imprescindible: sin él los botones de acción del
      // menú («Ver mi Premium») no llegan nunca y se quedan girando.
      // chat_member es de los que Telegram NO manda por defecto, y sin él no
      // hay forma de enterarse de quién entra al canal gratuito (es público:
      // no genera solicitud de entrada, la gente entra directamente).
      allowed_updates: ["message", "chat_join_request", "callback_query", "chat_member"],
      drop_pending_updates: false,
    });
    ok("Webhook registrado con secreto", urlEsperada);
  } catch (err) {
    mal("No se pudo registrar el webhook", err.message);
    process.exit(1);
  }

  // Sin esto los comandos existen pero no los ve nadie: son los que Telegram
  // ofrece en el botón "/" del chat y en el menú del bot.
  try {
    await api("setMyCommands", {
      // Esta lista tiene que ir a la par de COMANDOS_PUBLICOS en
      // src/lib/bot-menu.ts: allí se decide qué pantalla abre cada uno. Aquí
      // solo se declaran para que Telegram los ofrezca en el botón "/".
      // (Los de admin, como /noticias, NO se publican a propósito.)
      commands: [
        { command: "menu", description: "Menú principal" },
        { command: "premium", description: "Qué incluye Premium, ventaja a ventaja" },
        { command: "precio", description: "Precio y formas de pago" },
        { command: "cancelar", description: "Cómo cancelar la suscripción" },
        { command: "estado", description: "Mi plan y cuánto me queda" },
        { command: "gratis", description: "Lo que ya tienes sin pagar" },
        { command: "faq", description: "Dudas frecuentes" },
        { command: "canal", description: "El canal privado de Telegram" },
        { command: "web", description: "La Academy por dentro" },
        { command: "ayuda", description: "Cómo funciona este bot" },
      ],
    });
    ok("Comandos publicados", "10 comandos · /menu /premium /precio /cancelar /estado …");
  } catch (err) {
    mal("No se pudieron publicar los comandos", err.message);
  }

  // Los de admin van SOLO en tu chat privado, con scope "chat": si se
  // publicaran con el scope por defecto, cualquiera vería /noticias o /video
  // en su propio botón "/" — precisamente lo que el código evita a propósito
  // (mira COMANDOS_DE_ADMIN en el webhook: a quien no es admin ni se le
  // insinúa que existen).
  try {
    const url = env.NEXT_PUBLIC_SUPABASE_URL;
    const key = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      aviso("No se pudieron publicar tus comandos de admin", "sin credenciales de Supabase");
    } else {
      const res = await fetch(
        `${url}/rest/v1/profiles?select=telegram_user_id&role=eq.admin&telegram_user_id=not.is.null&order=telegram_linked_at.asc&limit=1`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` } }
      );
      const filas = await res.json();
      const chatId = filas[0]?.telegram_user_id;

      if (!chatId) {
        aviso("No se pudieron publicar tus comandos de admin", "ningún admin tiene Telegram vinculado todavía");
      } else {
        await api("setMyCommands", {
          scope: { type: "chat", chat_id: chatId },
          commands: [
            { command: "noticias", description: "Buscar noticias nuevas" },
            { command: "video", description: "Último vídeo de YouTube" },
            { command: "rutina", description: "Mi rutina de hoy" },
            { command: "stop", description: "Parar los avisos" },
            { command: "arrancar", description: "Reanudar los avisos" },
          ],
        });
        ok("Comandos de admin publicados en tu chat", "5 comandos · nadie más los ve");
      }
    }
  } catch (err) {
    mal("No se pudieron publicar tus comandos de admin", err.message);
  }
}

try {
  const info = await api("getWebhookInfo");
  if (!info.url) {
    mal("No hay webhook registrado");
    console.log(`  ${GRIS}Ejecuta: node scripts/telegram-doctor.mjs --set-webhook${FIN}`);
  } else {
    if (info.url !== urlEsperada) {
      aviso("El webhook apunta a otra URL", `registrado: ${info.url} · esperado: ${urlEsperada}`);
    } else {
      ok("Webhook registrado", info.url);
    }

    // getWebhookInfo no revela el secreto, así que lo único que delata que
    // falta es un 401 en el último error: nuestro endpoint rechaza sin él.
    if (info.last_error_message) {
      const e = info.last_error_message;
      mal("Último intento de entrega fallido", e);
      if (/401/.test(e)) {
        console.log(`  ${GRIS}401 = Telegram no manda el secreto. Vuelve a registrarlo con --set-webhook.${FIN}`);
      } else if (/500/.test(e)) {
        console.log(`  ${GRIS}500 = faltan variables de entorno en el servidor (¿las pusiste en Vercel?).${FIN}`);
      }
    } else {
      ok("Sin errores de entrega recientes");
    }

    if (info.pending_update_count > 0) {
      aviso(`Hay ${info.pending_update_count} updates sin entregar`);
    }

    // allowed_updates vacío = todos menos chat_member y reacciones, que ya nos
    // vale. Pero si alguien lo restringió a mano, chat_join_request puede
    // haberse quedado fuera y las solicitudes de entrada nunca llegarían.
    const permitidos = info.allowed_updates;
    const faltantes = ["chat_join_request", "callback_query", "chat_member"].filter(
      (tipo) => permitidos && !permitidos.includes(tipo)
    );
    if (faltantes.length) {
      mal(`Faltan tipos en allowed_updates: ${faltantes.join(", ")}`, (permitidos ?? []).join(", "));
      if (faltantes.includes("chat_join_request")) {
        console.log(`  ${GRIS}Las solicitudes de entrada al canal nunca llegarían al bot.${FIN}`);
      }
      if (faltantes.includes("callback_query")) {
        console.log(`  ${GRIS}Los botones del menú no responderían: se quedarían girando.${FIN}`);
      }
      if (faltantes.includes("chat_member")) {
        console.log(`  ${GRIS}No te enterarías de quién entra al canal gratuito.${FIN}`);
      }
      console.log(`  ${GRIS}Ejecuta: node scripts/telegram-doctor.mjs --set-webhook${FIN}`);
    } else {
      ok("El bot recibe solicitudes de entrada y pulsaciones de botón");
    }
  }
} catch (err) {
  mal("No se pudo consultar el webhook", err.message);
}

// — 5. Auditoría del canal —
//
// La API de bots NO permite listar los miembros de un canal, así que no se
// puede reconciliar uno a uno. Lo único auditable es el total: si en el canal
// hay más gente que premium vinculados, alguien entró por fuera del bot
// (normalmente, aprobado a mano) y el cron nunca lo va a expulsar, porque
// reconcilia desde la base de datos y a esa persona no la ve.
try {
  const total = await api("getChatMemberCount", { chat_id: CANAL });

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    aviso(`El canal tiene ${total} miembros`, "sin credenciales de Supabase para comparar");
  } else {
    const res = await fetch(
      `${url}/rest/v1/profiles?select=id&role=in.(premium,admin)&telegram_user_id=not.is.null`,
      { headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "count=exact" } }
    );
    // El total exacto viene en la cabecera Content-Range: "0-8/9".
    const esperados = Number(res.headers.get("content-range")?.split("/")[1] ?? NaN);

    if (!Number.isFinite(esperados)) {
      aviso(`El canal tiene ${total} miembros`, "no se pudo contar los premium vinculados");
    } else {
      // +1 por el propio bot, que también cuenta como miembro del canal.
      const previsto = esperados + 1;
      if (total <= previsto) {
        ok(`Miembros del canal: ${total}`, `${esperados} premium vinculados + el bot`);
      } else {
        mal(`Hay ${total - previsto} miembro(s) de más en el canal`,
          `${total} dentro · ${esperados} premium vinculados + el bot`);
        console.log(`  ${GRIS}Alguien entró sin pasar por el bot (¿aprobado a mano?).${FIN}`);
        console.log(`  ${GRIS}El cron NO lo expulsará: reconcilia desde la BD y a esa persona no la ve.${FIN}`);
      }
    }
  }
} catch (err) {
  mal("No se pudo auditar el canal", err.message);
}

// — 5b. El chat de la comunidad (grupo enlazado al canal Premium) —
//
// Al convertir el Premium en comunidad, Telegram engancha un grupo aparte al
// canal. Ese grupo recibe copia de TODO lo que se publica, y tiene su propia
// lista de miembros: si el bot no está dentro como administrador, no puede
// expulsar de ahí a quien deja de pagar, y esa persona sigue leyéndolo todo.
try {
  const canal = await api("getChat", { chat_id: CANAL });
  // Un TELEGRAM_COMMUNITY_CHAT_ID puesto a mano manda siempre: las
  // "Comunidades" de Telegram pueden dejar el linked_chat_id apuntando a un
  // grupo de discusión fantasma, distinto del chat real. Se descubre el chat
  // real con /chatid escrito dentro de él (solo el dueño puede usarlo).
  const grupo = env.TELEGRAM_COMMUNITY_CHAT_ID || canal.linked_chat_id;
  const fuente = env.TELEGRAM_COMMUNITY_CHAT_ID ? "TELEGRAM_COMMUNITY_CHAT_ID" : "linked_chat_id del canal";

  if (!grupo) {
    ok("El canal Premium no tiene chat de comunidad", "no hay nada más que vigilar");
  } else {
    let info;
    try {
      info = await api("getChat", { chat_id: grupo });
    } catch (err) {
      mal(`El bot NO está en el chat de la comunidad (${fuente}: ${grupo})`, err.message);
      if (!env.TELEGRAM_COMMUNITY_CHAT_ID) {
        console.log(`  ${GRIS}Esto puede ser un grupo de discusión fantasma y no el chat real de la comunidad.${FIN}`);
        console.log(`  ${GRIS}Escribe /chatid DENTRO del chat de verdad y pon el id en TELEGRAM_COMMUNITY_CHAT_ID.${FIN}`);
      }
      console.log(`  ${GRIS}Quien deje de pagar se queda dentro del chat y sigue leyendo el Premium.${FIN}`);
      console.log(`  ${GRIS}Añade @${bot.username} al chat como ADMIN con «Añadir miembros» y «Banear usuarios».${FIN}`);
      throw new Error("saltar el resto");
    }

    ok("El bot está en el chat de la comunidad", info.title);

    if (info.username) {
      mal(`El chat de la comunidad es PÚBLICO (@${info.username})`);
      console.log(`  ${GRIS}Cualquiera puede entrar y leer todo lo que se publica en el Premium.${FIN}`);
      console.log(`  ${GRIS}Ponlo privado en los ajustes del grupo.${FIN}`);
    } else {
      ok("El chat de la comunidad es privado");
    }

    const m = await api("getChatMember", { chat_id: grupo, user_id: bot.id });
    if (m.status !== "administrator") {
      mal("El bot no es administrador del chat", `estado: ${m.status}`);
      console.log(`  ${GRIS}Sin ser admin no puede aprobar entradas ni expulsar de ahí.${FIN}`);
    } else {
      if (!m.can_invite_users) mal("En el chat le falta «Añadir miembros»", "no podrá aprobar solicitudes");
      else ok("Puede aprobar entradas al chat");
      if (!m.can_restrict_members) mal("En el chat le falta «Banear usuarios»", "no podrá expulsar de ahí");
      else ok("Puede expulsar del chat");
    }

    const totalGrupo = await api("getChatMemberCount", { chat_id: grupo });
    const totalCanal = await api("getChatMemberCount", { chat_id: CANAL });
    if (totalGrupo > totalCanal) {
      aviso(`En el chat hay ${totalGrupo} y en el canal ${totalCanal}`,
        "hay gente en el chat que no está en el canal");
      console.log(`  ${GRIS}Comprueba que el chat exija aprobación para entrar.${FIN}`);
    } else {
      ok(`Chat de la comunidad: ${totalGrupo} miembros`, `canal: ${totalCanal}`);
    }
  }
} catch (err) {
  if (err.message !== "saltar el resto") mal("No se pudo auditar el chat de la comunidad", err.message);
}

// — 6. Enlaces de captación —
//
// Telegram no deja a un bot escribir a quien no le ha hablado antes, así que a
// quien entra al canal por su cuenta la bienvenida NO le llega en el momento.
// Estos enlaces abren el bot primero: al pulsar INICIAR ya hay conversación, y
// desde ese momento esa persona es localizable para siempre.
console.log(`\n${GRIS}Enlaces que abren el bot antes del canal (reparte estos, no el del canal):${FIN}`);
for (const [donde, etiqueta] of [["la web", "web"], ["Instagram", "ig"], ["YouTube", "yt"],
                                 ["cualquier sitio", "canal"]]) {
  console.log(`  ${donde.padEnd(16)} https://t.me/${bot.username}?start=${etiqueta}`);
}
console.log(`  ${GRIS}La etiqueta final es libre: queda registrada y dice de dónde viene cada uno.${FIN}`);

// — 7. Reacciones de los canales —
//
// Las noticias se publican con 🔥 y 💩 para que la gente opine. El bot NO
// puede activarlas (setChatAvailableReactions no existe en la API de bots):
// se hace a mano en Telegram, ajustes del canal → Reacciones. Si no están, el
// bot lo detecta y publica con botones, pero conviene saber en qué modo va.
const REACCIONES = ["🔥", "💩"];
for (const [nombre, id] of [["free", env.TELEGRAM_FREE_CHANNEL_ID || "-1003785109253"],
                            ["Premium", CANAL]]) {
  try {
    const chat = await api("getChat", { chat_id: id });
    const permitidas = chat.available_reactions;

    if (permitidas === undefined) {
      ok(`Canal ${nombre}: reacciones abiertas`, "valen todas las de Telegram");
      continue;
    }
    const emojis = permitidas.filter((r) => r.type === "emoji").map((r) => r.emoji);
    const faltan = REACCIONES.filter((e) => !emojis.includes(e));

    if (emojis.length === 0) {
      const soloPago = permitidas.some((r) => r.type === "paid");
      aviso(`Canal ${nombre}: sin reacciones de emoji`,
        soloPago ? "solo está la de pago (estrellas), que no sirve para votar" : "desactivadas");
      console.log(`  ${GRIS}Actívalas en Telegram: ajustes del canal → Reacciones → ${REACCIONES.join(" ")}${FIN}`);
      console.log(`  ${GRIS}Mientras tanto las noticias salen con botones de voto.${FIN}`);
    } else if (faltan.length) {
      aviso(`Canal ${nombre}: faltan reacciones`, `permitidas: ${emojis.join(" ")} · faltan: ${faltan.join(" ")}`);
    } else {
      ok(`Canal ${nombre}: ${REACCIONES.join(" ")} activas`, "las noticias saldrán sin botones");
    }
  } catch (err) {
    mal(`No se pudieron consultar las reacciones del canal ${nombre}`, err.message);
  }
}

// — 8. La rutina diaria y el interruptor de avisos —
//
// Merece una comprobación propia porque su fallo es SILENCIOSO: si el
// interruptor está en pausa (se pulsó /stop y se olvidó), el bot deja de
// avisar de todo y no hay nada que lo delate.
try {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    aviso("No se pudo comprobar la rutina diaria", "sin credenciales de Supabase");
  } else {
    const cab = { apikey: key, Authorization: `Bearer ${key}` };

    const resAjustes = await fetch(
      `${url}/rest/v1/bot_ajustes?select=valor&clave=eq.avisos_pausados`,
      { headers: cab }
    );
    if (!resAjustes.ok) {
      mal("Falta la tabla bot_ajustes", "ejecuta scripts/create-rutina-diaria.sql");
    } else {
      const filas = await resAjustes.json();
      if (filas[0]?.valor === "1") {
        aviso("Los avisos están EN PAUSA", "el bot no manda nada por su cuenta — /arrancar para volver");
      } else {
        ok("Los avisos automáticos están activos");
      }
    }

    // Bienvenidas que no se pudieron entregar. No es un error: es gente que
    // entró al canal sin haber hablado nunca con el bot. Se entregan solas en
    // cuanto lo hagan, pero saber cuántas hay dice a cuánta gente no alcanzas.
    const resPend = await fetch(
      `${url}/rest/v1/telegram_bienvenidas_pendientes?select=telegram_user_id`,
      { headers: { ...cab, Prefer: "count=exact" } }
    );
    if (!resPend.ok) {
      mal("Falta la tabla telegram_bienvenidas_pendientes", "ejecuta scripts/create-rutina-diaria.sql");
    } else {
      const pendientes = Number(resPend.headers.get("content-range")?.split("/")[1] ?? 0);
      if (pendientes > 0) {
        aviso(`${pendientes} bienvenida(s) sin entregar`, "esperan a que esa gente le hable al bot");
      } else {
        ok("Ninguna bienvenida pendiente de entregar");
      }
    }

    const resRutina = await fetch(`${url}/rest/v1/rutina_diaria?select=fecha&order=fecha.desc&limit=1`, {
      headers: cab,
    });
    if (!resRutina.ok) {
      mal("Falta la tabla rutina_diaria", "ejecuta scripts/create-rutina-diaria.sql");
    } else {
      const filas = await resRutina.json();
      ok("Rutina diaria lista", filas[0]?.fecha ? `última: ${filas[0].fecha}` : "todavía sin enviar ninguna");
    }
  }
} catch (err) {
  mal("No se pudo comprobar la rutina diaria", err.message);
}

console.log(`\n${GRIS}Nota: que el enlace de invitación exija aprobación no se puede consultar por API.${FIN}`);
console.log(`${GRIS}Compruébalo en Telegram: ajustes del canal → enlace → «Approve new subscribers».${FIN}\n`);
