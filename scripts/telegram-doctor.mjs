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
      allowed_updates: ["message", "chat_join_request"],
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
      commands: [
        { command: "menu", description: "Ver el menú principal" },
        { command: "estado", description: "Mi Premium y cuánto me queda" },
        { command: "ayuda", description: "Cómo funciona esto" },
      ],
    });
    ok("Comandos publicados", "/menu · /estado · /ayuda");
  } catch (err) {
    mal("No se pudieron publicar los comandos", err.message);
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
    if (info.allowed_updates && !info.allowed_updates.includes("chat_join_request")) {
      mal("chat_join_request NO está en allowed_updates", info.allowed_updates.join(", "));
      console.log(`  ${GRIS}Las solicitudes de entrada al canal nunca llegarían al bot.${FIN}`);
      console.log(`  ${GRIS}Ejecuta: node scripts/telegram-doctor.mjs --set-webhook${FIN}`);
    } else {
      ok("El bot recibe las solicitudes de entrada al canal");
    }
  }
} catch (err) {
  mal("No se pudo consultar el webhook", err.message);
}

console.log(`\n${GRIS}Nota: que el enlace de invitación exija aprobación no se puede consultar por API.${FIN}`);
console.log(`${GRIS}Compruébalo en Telegram: ajustes del canal → enlace → «Approve new subscribers».${FIN}\n`);
