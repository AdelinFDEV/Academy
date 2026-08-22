import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getChannelId,
  getChannelMemberCount,
  getCuentaUrl,
  getFreeChannelId,
  revokeChannelAccess,
  sendTelegramMessage,
} from "@/lib/telegram";
import { anunciarPendientes } from "@/lib/announce";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Admin = ReturnType<typeof createAdminClient>;

const DIA = 24 * 60 * 60 * 1000;

/** Días de antelación con los que se avisa de que se acaba el Premium. */
const DIAS_DE_AVISO = 3;

/** Cuánto se conservan los updates de Telegram ya procesados. Los reintentos
 *  de Telegram se agotan en minutos, así que una semana sobra de largo. */
const DIAS_RETENCION_EVENTOS = 7;

/**
 * Red de seguridad además del webhook de Stripe: expulsa del canal a
 * cualquier usuario vinculado cuyo rol ya no sea premium/admin. Cubre el caso
 * de que el webhook de Stripe fallara o se perdiera un evento.
 */
async function expulsarCaducados(admin: Admin) {
  const { data: stale, error } = await admin
    .from("profiles")
    .select("id, telegram_user_id")
    .not("telegram_user_id", "is", null)
    .not("role", "in", "(premium,admin)");

  if (error) {
    console.error("[telegram-sync] Error consultando perfiles:", error.message);
    return null;
  }

  // revokeChannelAccess comprueba antes si la persona está realmente dentro,
  // así que los usuarios gratuitos que vincularon Telegram pero nunca entraron
  // al canal no generan ni llamada de expulsión ni registro: sin eso, cada
  // ejecución diaria repetía un "kicked" falso por cada uno de ellos.
  let kicked = 0;
  for (const profile of stale ?? []) {
    if (!profile.telegram_user_id) continue;
    const expulsado = await revokeChannelAccess(admin, {
      userId: profile.id,
      telegramUserId: profile.telegram_user_id,
      reason: "Reconciliación periódica: rol no premium",
    });
    if (expulsado) kicked++;
  }

  return { revisados: stale?.length ?? 0, expulsados: kicked };
}

/**
 * Avisa por Telegram a quien tiene la suscripción cancelada y está a punto de
 * quedarse fuera. Quien cancela por despiste (o por un problema con la tarjeta)
 * se entera cuando ya está fuera del canal; esto le da una última oportunidad
 * de reactivar sin perder nada.
 */
async function avisarDeCancelacionesProximas(admin: Admin) {
  const ahora = new Date();
  const limite = new Date(ahora.getTime() + DIAS_DE_AVISO * DIA);

  const { data: candidatos, error } = await admin
    .from("profiles")
    .select("id, full_name, telegram_user_id, subscription_current_period_end, cancel_warning_period_end")
    .eq("subscription_cancel_at_period_end", true)
    .eq("subscription_status", "active")
    .not("telegram_user_id", "is", null)
    .gt("subscription_current_period_end", ahora.toISOString())
    .lte("subscription_current_period_end", limite.toISOString());

  if (error) {
    console.error("[telegram-sync] Error buscando cancelaciones próximas:", error.message);
    return null;
  }

  let avisados = 0;
  for (const perfil of candidatos ?? []) {
    const fin = perfil.subscription_current_period_end as string | null;
    if (!fin || !perfil.telegram_user_id) continue;

    // Comparar el periodo (y no un booleano "ya avisado") es lo que hace que
    // el cron diario no repita el mensaje, y que a la vez vuelva a avisar si
    // la persona reactiva y más adelante cancela de nuevo: ese periodo ya es
    // otro y no coincide con el guardado.
    const yaAvisado = perfil.cancel_warning_period_end as string | null;
    if (yaAvisado && new Date(yaAvisado).getTime() === new Date(fin).getTime()) continue;

    const dias = Math.max(1, Math.ceil((new Date(fin).getTime() - ahora.getTime()) / DIA));
    const nombre = (perfil.full_name as string | null) ?? "";
    const saludo = nombre ? `${nombre}, ` : "";

    await sendTelegramMessage(
      perfil.telegram_user_id,
      `${saludo}tu suscripción Premium no se va a renovar: te ${dias === 1 ? "queda 1 día" : `quedan ${dias} días`} de acceso.\n\n` +
        "Cuando termine saldrás del canal privado automáticamente. Si quieres seguir, " +
        "puedes reactivar la renovación en un par de clics.",
      [{ text: "🔄 Reactivar mi Premium", url: getCuentaUrl() }]
    );

    const { error: marcaErr } = await admin
      .from("profiles")
      .update({ cancel_warning_period_end: fin })
      .eq("id", perfil.id);

    // Si no se puede marcar, mañana volvería a avisar a la misma persona. Se
    // registra para poder detectarlo antes de que se vuelva pesado.
    if (marcaErr) {
      console.error("[telegram-sync] No se pudo marcar el aviso enviado:", marcaErr.message);
    }
    avisados++;
  }

  return { candidatos: candidatos?.length ?? 0, avisados };
}

/**
 * Foto diaria del tamaño de cada canal.
 *
 * Los eventos de alta y baja por sí solos no bastan para dibujar la curva: si
 * el bot está caído un rato, o alguien entró antes de que existiera todo esto,
 * el recuento acumulado se desvía y ya no se recupera. Este total pedido a
 * Telegram es la fuente de verdad; los eventos solo explican el porqué.
 */
async function fotografiarCanales(admin: Admin) {
  const hoy = new Date().toISOString().slice(0, 10);
  const canales = [getFreeChannelId(), (() => { try { return getChannelId(); } catch { return null; } })()];

  const guardados: string[] = [];
  for (const canal of canales) {
    if (!canal) continue;
    const miembros = await getChannelMemberCount(canal);
    if (miembros === null) continue;

    // upsert: si el cron se ejecuta dos veces el mismo día, se actualiza en
    // vez de duplicar la fila.
    const { error } = await admin
      .from("telegram_channel_stats")
      .upsert({ chat_id: String(canal), fecha: hoy, miembros }, { onConflict: "chat_id,fecha" });

    if (error) console.error("[telegram-sync] Error guardando la foto del canal:", error.message);
    else guardados.push(String(canal));
  }
  return guardados;
}

/** Poda de tablas que sólo crecen. Sin esto acaban engordando la base de datos
 *  con filas que ya no sirven para nada. */
async function limpiar(admin: Admin) {
  const corteEventos = new Date(Date.now() - DIAS_RETENCION_EVENTOS * DIA).toISOString();
  const { error: evErr } = await admin
    .from("telegram_events")
    .delete()
    .lt("created_at", corteEventos);
  if (evErr) console.error("[telegram-sync] Error limpiando telegram_events:", evErr.message);

  // Los tokens de vinculación caducan a los 15 minutos; pasado un día no le
  // sirven a nadie, ni siquiera para depurar.
  const corteTokens = new Date(Date.now() - DIA).toISOString();
  const { error: tkErr } = await admin
    .from("telegram_link_tokens")
    .delete()
    .lt("expires_at", corteTokens);
  if (tkErr) console.error("[telegram-sync] Error limpiando telegram_link_tokens:", tkErr.message);

  return { eventos: !evErr, tokens: !tkErr };
}

export async function GET(request: NextRequest) {
  // Obligatorio, no opcional: sin secreto este endpoint queda expuesto a
  // cualquiera que acierte la ruta y pueda dispararlo a voluntad.
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[telegram-sync] Falta CRON_SECRET");
    return NextResponse.json({ error: "Cron no configurado" }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Cada tarea es independiente: que una falle no debe impedir las otras, así
  // que ninguna corta la ejecución — devuelven null y se refleja en la salida.
  const expulsiones = await expulsarCaducados(admin);
  const avisos = await avisarDeCancelacionesProximas(admin);
  const limpieza = await limpiar(admin);
  const fotos = await fotografiarCanales(admin).catch((err) => {
    console.error("[telegram-sync] Error fotografiando canales:", err);
    return null;
  });
  // Red de seguridad para los avisos al canal: las entradas ya se anuncian al
  // publicarlas, pero las guías nuevas (que llegan con un despliegue) y los
  // vídeos de YouTube no tienen ningún evento que los dispare.
  const novedades = await anunciarPendientes(admin).catch((err) => {
    console.error("[telegram-sync] Error anunciando novedades:", err);
    return null;
  });

  return NextResponse.json({ expulsiones, avisos, limpieza, novedades, fotos });
}
