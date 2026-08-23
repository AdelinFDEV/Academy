/**
 * La rutina diaria del admin.
 *
 * Cada mañana a las 6:00 (hora de Rumanía) el bot manda UN mensaje privado al
 * admin con dos cosas: cómo van los canales y una checklist de tres tareas que
 * se marcan pulsando botones. El mismo mensaje se reescribe al marcarlas, así
 * que la mañana entera cabe en un único mensaje del chat.
 *
 * ── Quién puede ver esto ────────────────────────────────────────────────────
 * NADIE más que el admin. Y no depende de que los botones estén escondidos:
 *
 *   1. El destino lo decide `destinoRutina()`, que solo devuelve el Telegram
 *      del admin — nunca el de un usuario, nunca un canal.
 *   2. Cada pulsación se comprueba en el webhook contra el ROL en la base de
 *      datos, no contra el chat ni contra lo que venga en el botón.
 *   3. Además, la fila de la rutina guarda su `chat_id`: aunque un admin
 *      futuro pulsara el botón de otro, `alternarTarea` lo rechaza.
 *
 * Los tres cierres son independientes. Que falle uno no abre la puerta.
 */

import { PREMIUM_PRICE_EUR } from "@/lib/stripe";
import {
  editarMensaje,
  getAdminChatId,
  getChannelId,
  getChannelMemberCount,
  getFreeChannelId,
  getSiteUrl,
  sendTelegramMessageOrThrow,
  type Boton,
} from "@/lib/telegram";
import type { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

/** La zona horaria manda: el admin vive en Rumanía y el mensaje es suyo. */
export const ZONA = "Europe/Bucharest";

/** Hora a la que sale la rutina, en hora de Rumanía. */
export const HORA_RUTINA = 6;

// ── Las tres tareas ─────────────────────────────────────────────────────────

export type TareaId = "youtube" | "entreno" | "trading";

type Tarea = { id: TareaId; linea: string; boton: string };

const TAREAS: Tarea[] = [
  { id: "youtube", linea: "🎥 Contenido para YouTube", boton: "🎥 YouTube" },
  { id: "entreno", linea: "🏋️ Entrenar", boton: "🏋️ Entreno" },
  { id: "trading", linea: "📈 Sesión de trading", boton: "📈 Trading" },
];

/** Solo estos identificadores se aceptan como tarea. Lo que llegue en un botón
 *  es texto que viene de fuera: se valida contra la lista, nunca se usa tal
 *  cual para construir una consulta. */
export function esTarea(valor: string): valor is TareaId {
  return TAREAS.some((t) => t.id === valor);
}

export type Rutina = {
  fecha: string;
  chat_id: number;
  message_id: number | null;
  youtube: boolean;
  entreno: boolean;
  trading: boolean;
};

const CAMPOS_RUTINA = "fecha, chat_id, message_id, youtube, entreno, trading";

function hechas(rutina: Rutina): number {
  return TAREAS.filter((t) => rutina[t.id]).length;
}

// ── Fechas en hora de Rumanía ───────────────────────────────────────────────

/**
 * La fecha de HOY en Rumanía, como YYYY-MM-DD.
 *
 * No se puede usar toISOString(): el servidor corre en UTC y a las 6:00 de
 * Rumanía allí siguen siendo las 3 o las 4 de la madrugada — del mismo día por
 * los pelos, pero es el tipo de detalle que un día de cambio de hora rompe la
 * clave primaria. El locale sueco se usa porque formatea justo YYYY-MM-DD.
 */
export function hoyEnRumania(fecha = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: ZONA }).format(fecha);
}

/** La hora actual en Rumanía, 0-23. */
export function horaEnRumania(fecha = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("es-ES", { timeZone: ZONA, hour: "2-digit", hour12: false }).format(
      fecha
    )
  );
}

/** "lunes, 24 de agosto" — para encabezar el mensaje. */
function fechaLarga(iso: string): string {
  // Mediodía UTC: así el día no se desplaza al convertir a la zona de Rumanía.
  const d = new Date(`${iso}T12:00:00Z`);
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: ZONA,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
}

/** El día anterior a una fecha YYYY-MM-DD. */
function diaAnterior(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

// ── A quién se le manda ─────────────────────────────────────────────────────

/**
 * El Telegram PRIVADO del admin. Nunca un canal ni un chat de registro.
 *
 * Se resuelve por este orden:
 *   1. TELEGRAM_RUTINA_CHAT_ID — para fijarlo a mano si algún día hay más de
 *      un admin y la rutina tiene que seguir siendo de una sola persona.
 *   2. TELEGRAM_ADMIN_CHAT_ID — el privado del admin, si está configurado.
 *   3. El primer perfil con rol admin que tenga Telegram vinculado.
 *
 * A propósito NO se usa getLogChatId(): ese puede apuntar a un grupo, y esto
 * es un mensaje personal.
 */
export async function destinoRutina(admin: Admin): Promise<number | null> {
  const fijado = Number(process.env.TELEGRAM_RUTINA_CHAT_ID);
  if (Number.isFinite(fijado) && fijado !== 0) return fijado;

  const porEntorno = getAdminChatId();
  if (porEntorno) return porEntorno;

  const { data } = await admin
    .from("profiles")
    .select("telegram_user_id")
    .eq("role", "admin")
    .not("telegram_user_id", "is", null)
    .order("telegram_linked_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (data?.telegram_user_id as number | null) ?? null;
}

// ── El resumen de la comunidad ──────────────────────────────────────────────

export type ResumenComunidad = {
  freeTotal: number | null;
  freeAltas: number;
  freeBajas: number;
  /** Diferencia con la foto de ayer. null si no hay foto con la que comparar. */
  freeNetoReal: number | null;
  premiumTotal: number | null;
  premiumPerfiles: number;
};

/**
 * Cómo han ido los canales en las últimas 24 horas.
 *
 * Las altas y bajas salen de telegram_channel_events (lo que vio el bot) y el
 * total, de Telegram (la verdad). Se enseñan las dos cosas porque no siempre
 * cuadran: si el bot estuvo caído un rato, los eventos se pierden y el total
 * no.
 */
export async function resumenComunidad(admin: Admin): Promise<ResumenComunidad> {
  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const free = getFreeChannelId();

  let freeAltas = 0;
  let freeBajas = 0;
  if (free) {
    const { data } = await admin
      .from("telegram_channel_events")
      .select("action")
      .eq("chat_id", String(free))
      .gte("created_at", desde);

    for (const fila of (data ?? []) as { action: string }[]) {
      if (fila.action === "join") freeAltas++;
      else if (fila.action === "leave") freeBajas++;
    }
  }

  const freeTotal = free ? await getChannelMemberCount(free) : null;

  // Comparación con la foto de ayer: es el crecimiento neto de verdad, sin
  // depender de que el bot viera cada alta.
  let freeNetoReal: number | null = null;
  if (free && freeTotal !== null) {
    const { data: ayer } = await admin
      .from("telegram_channel_stats")
      .select("miembros")
      .eq("chat_id", String(free))
      .eq("fecha", diaAnterior(hoyEnRumania()))
      .maybeSingle();
    const antes = (ayer?.miembros as number | null) ?? null;
    if (antes !== null) freeNetoReal = freeTotal - antes;
  }

  let premiumTotal: number | null = null;
  try {
    premiumTotal = await getChannelMemberCount(getChannelId());
  } catch {
    // Sin canal privado configurado: se omite esa línea y ya está.
  }

  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "premium");

  return {
    freeTotal,
    freeAltas,
    freeBajas,
    freeNetoReal,
    premiumTotal,
    premiumPerfiles: count ?? 0,
  };
}

function signo(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

function euros(n: number): string {
  return `${n.toFixed(2).replace(".", ",")}€`;
}

function bloqueComunidad(r: ResumenComunidad): string {
  const lineas = ["📊 LA COMUNIDAD"];

  lineas.push("");
  lineas.push(`📣 Canal free — ${r.freeTotal !== null ? r.freeTotal : "?"} miembros`);
  lineas.push(`     ↗️ ${r.freeAltas} altas · ↘️ ${r.freeBajas} bajas (24h)`);
  if (r.freeNetoReal !== null) {
    const emoji = r.freeNetoReal > 0 ? "🟢" : r.freeNetoReal < 0 ? "🔴" : "⚪";
    lineas.push(`     ${emoji} Neto desde ayer: ${signo(r.freeNetoReal)}`);
  }

  lineas.push("");
  lineas.push(
    `💎 Canal Premium — ${r.premiumTotal !== null ? r.premiumTotal : "?"} miembros`
  );
  lineas.push(
    `     💶 ${euros(r.premiumPerfiles * PREMIUM_PRICE_EUR)}/mes · ${r.premiumPerfiles} suscripciones`
  );

  return lineas.join("\n");
}

// ── Racha ───────────────────────────────────────────────────────────────────

export type Racha = {
  /** Días seguidos completados justo ANTES de hoy. */
  actual: number;
  /** La racha más larga que se ha llegado a encadenar nunca. */
  mejor: number;
};

/**
 * La racha actual y el récord.
 *
 * Se recalculan del historial en vez de guardarse en un contador, a propósito:
 * un contador se desincroniza en cuanto se marca una tarea de un día pasado, y
 * entonces enseña un número que no es verdad — que es lo peor que puede hacer
 * algo cuya única función es motivar.
 *
 * Se miran los últimos 365 días: de sobra para el récord y barato de leer.
 */
export async function calcularRacha(admin: Admin, fecha: string): Promise<Racha> {
  const desde = new Date(`${fecha}T12:00:00Z`);
  desde.setUTCDate(desde.getUTCDate() - 365);

  const { data } = await admin
    .from("rutina_diaria")
    .select("fecha, youtube, entreno, trading")
    .gte("fecha", desde.toISOString().slice(0, 10))
    .lt("fecha", fecha)
    .order("fecha", { ascending: false });

  return resumirRacha((data ?? []) as DiaDeRutina[], fecha);
}

export type DiaDeRutina = Pick<Rutina, "fecha" | TareaId>;

/**
 * El cálculo en sí, separado de la consulta para poder probarlo sin base de
 * datos. `filas` llega ordenada de más reciente a más antigua y sin incluir
 * `fecha`, que es el día de hoy.
 */
export function resumirRacha(filas: DiaDeRutina[], fecha: string): Racha {
  const completo = (f: DiaDeRutina) => f.youtube && f.entreno && f.trading;

  // Racha actual: hacia atrás desde ayer, hasta el primer hueco o fallo.
  let actual = 0;
  let esperado = diaAnterior(fecha);
  for (const fila of filas) {
    if (fila.fecha !== esperado || !completo(fila)) break;
    actual++;
    esperado = diaAnterior(esperado);
  }

  // Récord: la tirada más larga de días consecutivos y completos del
  // historial. Un día incompleto y un hueco en el calendario cortan igual.
  let mejor = 0;
  let tirada = 0;
  let anterior: string | null = null;
  for (const fila of filas) {
    const sigue = anterior !== null && fila.fecha === diaAnterior(anterior);
    tirada = completo(fila) ? (sigue ? tirada + 1 : 1) : 0;
    if (tirada > mejor) mejor = tirada;
    anterior = fila.fecha;
  }

  return { actual, mejor: Math.max(mejor, actual) };
}

// ── El mensaje ──────────────────────────────────────────────────────────────

const ANIMOS = [
  "Hoy se construye lo de dentro de un año 💪",
  "Nadie lo va a hacer por ti. Y menos mal 🔥",
  "Un día más. Un día menos de los que faltan 🚀",
  "Lo aburrido hecho a diario es lo que gana ⚙️",
  "El que aparece todos los días acaba ganando 🏆",
];

function alAzar(opciones: string[]): string {
  return opciones[Math.floor(Math.random() * opciones.length)];
}

function dias(n: number): string {
  return n === 1 ? "1 día" : `${n} días`;
}

/**
 * La línea de la racha. Sale SIEMPRE, también cuando vale cero.
 *
 * Esconderla el primer día era justo lo contrario de lo que hace falta: el día
 * que menos racha tienes es el día que más necesitas verla.
 */
function lineasRacha(racha: Racha, completoHoy: boolean): string[] {
  const hoy = completoHoy ? racha.actual + 1 : racha.actual;
  const lineas: string[] = [];

  if (completoHoy) {
    lineas.push(`🔥 Racha: ${dias(hoy)} seguidos`);
    if (hoy > racha.mejor) lineas.push("🏅 Récord nuevo. Nunca habías llegado tan lejos.");
    else if (hoy === racha.mejor) lineas.push("🏅 Igualas tu récord. Mañana lo rompes.");
    else lineas.push(`🎯 Tu récord son ${dias(racha.mejor)}. Te faltan ${dias(racha.mejor - hoy + 1)}.`);
    return lineas;
  }

  if (racha.actual === 0) {
    lineas.push("🔥 Racha: 0 días");
    lineas.push(
      racha.mejor > 0
        ? `🎯 Tu récord son ${dias(racha.mejor)}. Hoy vuelve a empezar la cuenta.`
        : "🎯 Completa hoy las tres y empieza a contar."
    );
    return lineas;
  }

  lineas.push(`🔥 Racha: ${dias(racha.actual)} seguidos. No la rompas hoy.`);
  if (racha.mejor > racha.actual) {
    lineas.push(`🎯 Tu récord son ${dias(racha.mejor)}.`);
  }
  return lineas;
}

export function textoRutina(
  rutina: Rutina,
  resumen: ResumenComunidad,
  racha: Racha,
  animo: string
): string {
  const total = hechas(rutina);
  const completo = total === TAREAS.length;

  const lineas = [
    "☀️ Buenos días",
    "",
    `📅 ${fechaLarga(rutina.fecha)}`,
    "",
    "━━━━━━━━━━━━━━━━",
    "",
    bloqueComunidad(resumen),
    "",
    "━━━━━━━━━━━━━━━━",
    "",
    `✅ TU RUTINA DE HOY  ·  ${total}/${TAREAS.length}`,
    "",
  ];

  for (const tarea of TAREAS) {
    lineas.push(`${rutina[tarea.id] ? "✅" : "⬜"} ${tarea.linea}`);
  }

  lineas.push("");
  lineas.push(...lineasRacha(racha, completo));
  lineas.push("");

  if (completo) {
    lineas.push("🏆 Día completo. Mañana otra vez — descansa, que te lo has ganado 😴");
  } else {
    lineas.push(animo);
    lineas.push("");
    lineas.push("Pulsa cada una según la vayas haciendo 👇");
  }

  return lineas.join("\n");
}

export function botonesRutina(rutina: Rutina): Boton[][] {
  const filas: Boton[][] = TAREAS.map((tarea) => [
    {
      text: `${rutina[tarea.id] ? "✅" : "⬜"} ${tarea.boton}`,
      data: `r:t:${rutina.fecha}:${tarea.id}`,
    },
  ]);

  filas.push([{ text: "📊 Panel de comunidad", url: `${getSiteUrl()}/admin/comunidad` }]);
  filas.push([{ text: "🔕 Parar los avisos", data: "r:stop" }]);

  return filas;
}

// ── Envío y actualización ───────────────────────────────────────────────────

/**
 * Manda la rutina del día.
 *
 * La fila de `rutina_diaria` se inserta ANTES de enviar nada: su clave
 * primaria es la fecha, así que si el cron se dispara dos veces el mismo día
 * el segundo choca contra la clave y no manda un duplicado. Es el mismo truco
 * que usa el webhook con los update_id de Telegram.
 */
export async function enviarRutina(
  admin: Admin,
  opciones?: { forzar?: boolean }
): Promise<{ enviada: boolean; motivo?: string }> {
  const destino = await destinoRutina(admin);
  if (!destino) return { enviada: false, motivo: "sin destino" };

  const fecha = hoyEnRumania();

  const { error } = await admin
    .from("rutina_diaria")
    .insert({ fecha, chat_id: destino });

  if (error) {
    // 23505 = ya existe la fila de hoy, o sea que la rutina ya salió.
    if (error.code === "23505" && !opciones?.forzar) {
      return { enviada: false, motivo: "ya enviada hoy" };
    }
    if (error.code !== "23505") {
      console.error("[rutina] No se pudo crear la fila del día:", error.message);
      return { enviada: false, motivo: error.message };
    }
  }

  const { data } = await admin
    .from("rutina_diaria")
    .select(CAMPOS_RUTINA)
    .eq("fecha", fecha)
    .maybeSingle();

  const rutina = (data as Rutina | null) ?? {
    fecha,
    chat_id: destino,
    message_id: null,
    youtube: false,
    entreno: false,
    trading: false,
  };

  const resumen = await resumenComunidad(admin);
  const racha = await calcularRacha(admin, fecha);

  try {
    const messageId = await sendTelegramMessageOrThrow(
      destino,
      textoRutina(rutina, resumen, racha, alAzar(ANIMOS)),
      botonesRutina(rutina)
    );

    // Sin el message_id los botones no pueden reescribir el mensaje: seguirían
    // funcionando (marcarían la tarea), pero la checklist no se actualizaría.
    await admin
      .from("rutina_diaria")
      .update({ message_id: messageId, chat_id: destino })
      .eq("fecha", fecha);

    return { enviada: true };
  } catch (err) {
    console.error("[rutina] No se pudo enviar:", err);
    return { enviada: false, motivo: err instanceof Error ? err.message : "error desconocido" };
  }
}

/**
 * Marca o desmarca una tarea y reescribe el mensaje.
 *
 * `chatId` es el chat desde el que se pulsó: tiene que coincidir con el de la
 * rutina. Es la tercera comprobación, después del rol de admin en el webhook —
 * la que impide que un admin distinto toque la rutina de otro.
 */
export async function alternarTarea(
  admin: Admin,
  fecha: string,
  tarea: TareaId,
  chatId: number
): Promise<{ ok: boolean; aviso?: string }> {
  const { data } = await admin
    .from("rutina_diaria")
    .select(CAMPOS_RUTINA)
    .eq("fecha", fecha)
    .maybeSingle();

  const rutina = data as Rutina | null;
  if (!rutina) return { ok: false, aviso: "Esa rutina ya no existe" };
  if (Number(rutina.chat_id) !== chatId) return { ok: false, aviso: "Esa rutina no es de este chat" };

  const nuevo = { ...rutina, [tarea]: !rutina[tarea] } as Rutina;
  const completo = TAREAS.every((t) => nuevo[t.id]);

  const { error } = await admin
    .from("rutina_diaria")
    .update({
      [tarea]: nuevo[tarea],
      completada_en: completo ? new Date().toISOString() : null,
    })
    .eq("fecha", fecha);

  if (error) {
    console.error("[rutina] No se pudo marcar la tarea:", error.message);
    return { ok: false, aviso: "No se pudo guardar" };
  }

  if (rutina.message_id) {
    const resumen = await resumenComunidad(admin);
    const racha = await calcularRacha(admin, fecha);
    await editarMensaje(
      chatId,
      Number(rutina.message_id),
      textoRutina(nuevo, resumen, racha, alAzar(ANIMOS)),
      botonesRutina(nuevo)
    );
  }

  const tareaTexto = TAREAS.find((t) => t.id === tarea)?.boton ?? tarea;
  return {
    ok: true,
    aviso: completo
      ? "🏆 ¡Día completo!"
      : `${nuevo[tarea] ? "✅" : "⬜"} ${tareaTexto}`,
  };
}
