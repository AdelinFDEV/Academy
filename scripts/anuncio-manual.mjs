#!/usr/bin/env node
/**
 * Aviso manual en Telegram con copy y/o imagen a medida — para cuando el
 * anunciador automático (src/lib/announce.ts) no encaja porque el mensaje
 * necesita un gancho concreto (ej. "completa el quiz y desbloquea el badge")
 * en vez de la plantilla genérica de guía/entrada/vídeo.
 *
 * Flujo en dos pasos, con aprobación humana en medio:
 *   1) `admin`  — manda la vista previa al chat privado del admin (vía
 *      resolverChatAdmin, igual que hace el resto del bot) y GUARDA el
 *      contenido en un caché local.
 *   2) `free`   — sin repetir nada, relee el caché y publica lo mismo,
 *      tal cual, en el grupo gratuito.
 *
 * Uso:
 *   node scripts/anuncio-manual.mjs admin \
 *     --texto "scripts/anuncio-manual.mensaje.txt" \
 *     --boton-texto "📖 Abrir la guía" \
 *     --boton-url "https://adelinacademy.com/guias/render" \
 *     [--imagen "C:\\ruta\\a\\portada.png"]
 *
 *   node scripts/anuncio-manual.mjs free
 *
 * El texto admite **negrita** (se convierte a entidades de Telegram, igual
 * que entidadesDeMarkdown() en src/lib/telegram.ts — Telegram no recibe
 * Markdown, así que esto evita que un asterisco suelto rompa el mensaje).
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const CACHE = "scripts/.anuncio-manual-cache.json";

// Carga .env.local a mano — el proyecto no trae dotenv como dependencia.
for (const linea of readFileSync(".env.local", "utf8").split("\n")) {
  const m = linea.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!BOT_TOKEN) throw new Error("Falta TELEGRAM_BOT_TOKEN en .env.local.");

function leerArg(nombre) {
  const i = process.argv.indexOf(`--${nombre}`);
  return i === -1 ? null : process.argv[i + 1];
}

// Réplica de resolverChatAdmin() en src/lib/telegram.ts — el chat del admin,
// por variable de entorno si está y si no desde la base de datos.
async function resolverChatAdmin() {
  const porEntorno = process.env.TELEGRAM_LOG_CHAT_ID || process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (porEntorno && Number.isFinite(Number(porEntorno))) return Number(porEntorno);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const { data, error } = await supabase
    .from("profiles")
    .select("telegram_user_id, telegram_linked_at")
    .eq("role", "admin")
    .not("telegram_user_id", "is", null)
    .order("telegram_linked_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.telegram_user_id ?? null;
}

// Réplica de entidadesDeMarkdown() en src/lib/telegram.ts.
function entidadesDeMarkdown(texto) {
  const entidades = [];
  const regex = /\*\*([\s\S]+?)\*\*/g;
  let limpio = "";
  let ultimoIndice = 0;
  let match;
  while ((match = regex.exec(texto)) !== null) {
    limpio += texto.slice(ultimoIndice, match.index);
    entidades.push({ type: "bold", offset: limpio.length, length: match[1].length });
    limpio += match[1];
    ultimoIndice = match.index + match[0].length;
  }
  limpio += texto.slice(ultimoIndice);
  return { texto: limpio, entidades };
}

function construirTeclado(boton) {
  if (!boton?.texto || !boton?.url) return undefined;
  return { inline_keyboard: [[{ text: boton.texto, url: boton.url }]] };
}

async function enviar(chatId, textoConMarcado, { imagenLocal, imagenUrl, boton } = {}) {
  const { texto, entidades } = entidadesDeMarkdown(textoConMarcado);
  const reply_markup = construirTeclado(boton);

  if (imagenLocal) {
    const form = new FormData();
    form.append("chat_id", String(chatId));
    form.append("photo", new Blob([readFileSync(imagenLocal)]), "portada.png");
    form.append("caption", texto.slice(0, 1024));
    form.append("caption_entities", JSON.stringify(entidades));
    if (reply_markup) form.append("reply_markup", JSON.stringify(reply_markup));
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, { method: "POST", body: form });
    const data = await res.json();
    if (!data.ok) throw new Error(`Telegram: ${JSON.stringify(data)}`);
    return data.result.message_id;
  }

  const payload = imagenUrl
    ? { chat_id: chatId, photo: imagenUrl, caption: texto.slice(0, 1024), caption_entities: entidades, reply_markup }
    : { chat_id: chatId, text: texto, entities: entidades, reply_markup, link_preview_options: { is_disabled: true } };
  const endpoint = imagenUrl ? "sendPhoto" : "sendMessage";

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${endpoint}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Telegram: ${JSON.stringify(data)}`);
  return data.result.message_id;
}

const destino = process.argv[2];

if (destino === "admin") {
  const archivoTexto = leerArg("texto");
  if (!archivoTexto) throw new Error("Falta --texto <archivo.txt> con el mensaje.");
  const mensaje = readFileSync(archivoTexto, "utf8").trimEnd();

  const contenido = {
    mensaje,
    imagenLocal: leerArg("imagen"),
    imagenUrl: leerArg("imagen-url"),
    boton: { texto: leerArg("boton-texto"), url: leerArg("boton-url") },
  };
  writeFileSync(CACHE, JSON.stringify(contenido, null, 2));

  const chatId = await resolverChatAdmin();
  if (!chatId) throw new Error("No se ha encontrado ningún admin con telegram_user_id vinculado.");
  const id = await enviar(chatId, `[VISTA PREVIA — así saldría en el grupo free]\n\n${contenido.mensaje}`, {
    imagenLocal: contenido.imagenLocal,
    imagenUrl: contenido.imagenUrl,
    boton: contenido.boton,
  });
  console.log(`Enviado al chat admin (${chatId}), message_id ${id}`);
} else if (destino === "free") {
  if (!existsSync(CACHE)) throw new Error("No hay ningún aviso pendiente de aprobación (falta el paso 'admin').");
  const contenido = JSON.parse(readFileSync(CACHE, "utf8"));

  const chatId = process.env.TELEGRAM_FREE_CHANNEL_ID || "-1003785109253";
  const id = await enviar(chatId, contenido.mensaje, {
    imagenLocal: contenido.imagenLocal,
    imagenUrl: contenido.imagenUrl,
    boton: contenido.boton,
  });
  console.log(`Enviado al grupo free (${chatId}), message_id ${id}`);
} else {
  throw new Error(
    "Uso:\n" +
      '  node scripts/anuncio-manual.mjs admin --texto <archivo.txt> --boton-texto "..." --boton-url "..." [--imagen <ruta-local>] [--imagen-url <url>]\n' +
      "  node scripts/anuncio-manual.mjs free"
  );
}
