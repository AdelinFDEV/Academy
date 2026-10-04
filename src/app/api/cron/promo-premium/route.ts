import { NextResponse, type NextRequest } from "next/server";
import { getFreeChannelId, getPremiumUrl, getSiteUrl, sendChannelPost } from "@/lib/telegram";
import { PREMIUM_PRICE_EUR } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Dominio sin protocolo, que en un mensaje de Telegram se lee mejor. */
function dominio(): string {
  return getSiteUrl().replace(/^https?:\/\//, "");
}

/*
 * Sobre el tono: se habla de trabajo y compromiso, nunca de rentabilidad
 * asegurada. "Se intenta ganar dinero" no es lo mismo que "vas a ganar
 * dinero", y en un producto financiero esa diferencia importa — la segunda
 * versión es una promesa que no se puede sostener.
 */
function mensaje(): string {
  return (
    "💎 ¿Todavía no eres Premium?\n\n" +
    // El precio es un número, y JS lo escribe con punto decimal: en español
    // "49.99€" canta mucho. Se formatea con coma.
    `Por ${PREMIUM_PRICE_EUR.toLocaleString("es-ES", { minimumFractionDigits: 2 })}€/mes entras a todo esto:\n\n` +
    "💬 La sala de chat privada — el corazón de la comunidad. Se habla de mercado " +
    "todos los días y respondo yo en persona, no un bot.\n" +
    "📈 Mis entradas en spot, en directo y con el precio real de compra\n" +
    `🛠 9 herramientas en ${dominio()} — diario de trading, radar diario, liberaciones de tokens, portfolio…\n` +
    "📚 Todas las guías interactivas desbloqueadas\n\n" +
    "🔥 Aquí se trabaja a diario para intentar ganar dinero, con el máximo compromiso " +
    "por mi parte y por la de cada miembro. Nadie está de adorno.\n\n" +
    "🔴 Trading en directo: solo NASDAQ en 5 minutos, martes y jueves.\n\n" +
    "Sin permanencia. Cancelas cuando quieras."
  );
}

/**
 * Recordatorio de Premium en el canal gratuito. Domingo, miércoles y viernes.
 *
 * Va al canal FREE a propósito: a quien ya paga este mensaje le sobra, y
 * repetírselo tres veces por semana sería la mejor forma de que silencie el
 * canal — y con él, los avisos de contenido nuevo.
 *
 * No lleva registro de envíos como el anunciador de contenido: aquí repetir es
 * justo el objetivo, así que no hay nada que deduplicar.
 *
 * HORARIO — Vercel programa los cron en UTC y no entiende de zonas horarias,
 * así que "0 13 * * 0,3,5" son las 16:00 de Rumanía en horario de VERANO. El
 * último domingo de octubre, cuando el país vuelve al horario de invierno, ese
 * mismo cron pasa a dispararse a las 15:00 locales. Para recuperar las 16:00
 * hay que cambiar el 13 por un 14 en vercel.json (y deshacerlo en marzo).
 * No se automatiza porque el plan Hobby de Vercel no admite dos ejecuciones
 * diarias del mismo cron, que es lo que haría falta para elegir en código.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[promo-premium] Falta CRON_SECRET");
    return NextResponse.json({ error: "Cron no configurado" }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const canal = getFreeChannelId();
  if (!canal) {
    console.error("[promo-premium] Sin canal free configurado");
    return NextResponse.json({ error: "Sin canal" }, { status: 500 });
  }

  // Se deja constancia de la hora local para poder comprobar que el horario
  // de verano no ha desplazado el envío (ver el comentario de vercel.json).
  const horaRumania = new Date().toLocaleString("es-ES", {
    timeZone: "Europe/Bucharest",
    dateStyle: "short",
    timeStyle: "short",
  });

  try {
    await sendChannelPost(mensaje(), {
      chatId: canal,
      botones: [{ text: "💎 Hacerme Premium", url: getPremiumUrl() }],
    });
  } catch (err) {
    console.error("[promo-premium] No se pudo publicar:", err);
    return NextResponse.json({ error: "No se pudo publicar" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, canal, horaRumania });
}
