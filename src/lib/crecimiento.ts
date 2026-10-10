import type { createAdminClient } from "@/lib/supabase/admin";
import { PREMIUM_PRICE_EUR } from "@/lib/stripe";
import { getChannelAdminCount, getChannelId, getChannelMemberCount, getFreeChannelId } from "@/lib/telegram";
import { getSubscriberCount } from "@/lib/youtube";
import { hoyISO, medianocheRumania, sumarDiasISO } from "@/lib/objetivos";
import type { Perfil } from "@/lib/objetivosServidor";
import { todasLasFilas } from "@/lib/supabase/todasLasFilas";

/**
 * Datos de dos pestañas de /admin/objetivos: Crecimiento (Telegram y YouTube,
 * con su evolución) y la parte de Premium de Dinero. Solo servidor.
 */

type Admin = ReturnType<typeof createAdminClient>;

export type Punto = { fecha: string; valor: number };

export type Serie = {
  /** Valor de hoy: en vivo si se puede, o la última foto. */
  ahora: number | null;
  /** De dónde sale `ahora`, para decirlo en pantalla. */
  fuente: "en vivo" | "última foto" | null;
  puntos: Punto[];
};

export const RANGOS = { "30": "30 días", "90": "90 días", "365": "1 año", todo: "Todo" } as const;
export type Rango = keyof typeof RANGOS;

const DIA = 24 * 60 * 60 * 1000;

/** Fecha de inicio del rango, o null para «todo». */
export function inicioRango(rango: Rango, hoy: string): string | null {
  return rango === "todo" ? null : sumarDiasISO(hoy, -Number(rango) + 1);
}

/** Una serie diaria a partir de fotos, con el valor en vivo añadido como «hoy». */
function serie(fotos: Punto[], desde: string | null, hoy: string, enVivo: number | null): Serie {
  const puntos = fotos.filter((f) => !desde || f.fecha >= desde);
  if (enVivo !== null) {
    const sinHoy = puntos.filter((p) => p.fecha !== hoy);
    return { ahora: enVivo, fuente: "en vivo", puntos: [...sinHoy, { fecha: hoy, valor: enVivo }] };
  }
  const ultima = fotos.at(-1);
  return { ahora: ultima?.valor ?? null, fuente: ultima ? "última foto" : null, puntos };
}

/**
 * Las fotos diarias y la cifra en vivo de un canal, SIN sus administradores:
 * Telegram cuenta al dueño y al bot como miembros, y en el canal Premium eso
 * hacía que saliera 2 sin un solo suscriptor. Se resta el número de
 * administradores de hoy a todas las fotos, también a las antiguas, que se
 * guardaron con ellos dentro: así la curva no da un salto falso.
 */
async function miembrosTelegram(admin: Admin, chatId: string | null): Promise<{ fotos: Punto[]; enVivo: number | null }> {
  if (!chatId) return { fotos: [], enVivo: null };
  const [data, total, admins] = await Promise.all([
    todasLasFilas((a, b) =>
      admin.from("telegram_channel_stats").select("fecha, miembros").eq("chat_id", chatId).order("fecha").range(a, b)
    ),
    getChannelMemberCount(chatId).catch(() => null),
    getChannelAdminCount(chatId).catch(() => null),
  ]);
  const sinAdmins = (n: number) => Math.max(0, n - (admins ?? 0));
  return {
    fotos: data.map((f) => ({ fecha: String(f.fecha), valor: sinAdmins(Number(f.miembros)) })),
    enVivo: total === null ? null : sinAdmins(total),
  };
}

function canalPremium(): string | null {
  try {
    return getChannelId();
  } catch {
    // TELEGRAM_CHANNEL_ID solo existe en Vercel: en local no hay gráfica.
    return null;
  }
}

/** Los meses "AAAA-MM" que cubre el rango, del más antiguo al actual (máx. 24). */
function mesesDelRango(desde: string | null, hoy: string, primero: string | null): string[] {
  const inicio = (desde ?? primero ?? hoy).slice(0, 7);
  const meses: string[] = [];
  let [a, m] = hoy.slice(0, 7).split("-").map(Number);
  while (meses.length < 24) {
    const mes = `${a}-${String(m).padStart(2, "0")}`;
    meses.unshift(mes);
    if (mes <= inicio) break;
    m--;
    if (m === 0) { m = 12; a--; }
  }
  return meses;
}

export type DatosCrecimiento = {
  hoy: string;
  desde: string | null;
  telegramFree: Serie;
  telegramPremium: Serie | null;
  youtube: Serie;
  youtubeConClave: boolean;
};

/** La pestaña Crecimiento: cómo crecen los canales (Telegram y YouTube). */
export async function cargarCrecimiento(admin: Admin, rango: Rango): Promise<DatosCrecimiento> {
  const hoy = hoyISO();
  const desde = inicioRango(rango, hoy);
  const premiumId = canalPremium();

  const [free, premium, fotosYoutube, enVivoYoutube] = await Promise.all([
    miembrosTelegram(admin, getFreeChannelId()),
    miembrosTelegram(admin, premiumId),
    todasLasFilas((a, b) =>
      admin.from("metricas_diarias").select("fecha, valor").eq("clave", "suscriptores_youtube").order("fecha").range(a, b)
    ),
    getSubscriberCount(),
  ]);
  const youtube = fotosYoutube.map((f) => ({ fecha: String(f.fecha), valor: Number(f.valor) }));

  return {
    hoy,
    desde,
    telegramFree: serie(free.fotos, desde, hoy, free.enVivo),
    telegramPremium: premiumId ? serie(premium.fotos, desde, hoy, premium.enVivo) : null,
    youtube: serie(youtube, desde, hoy, enVivoYoutube),
    youtubeConClave: !!process.env.YOUTUBE_API_KEY,
  };
}

export type DatosPremium = {
  hoy: string;
  desde: string | null;
  precio: number;
  activos: number;
  cancelan: number;
  mrr: number;
  /** Cobrado de verdad por Stripe (bruto) en el rango, y lo que Stripe se quedó (comisiones y devoluciones). */
  ingresosRango: number;
  descuentosRango: number;
  ingresosTotales: number;
  porMes: { mes: string; valor: number }[];
  activosPorDia: Punto[];
};

/**
 * La parte de Premium de la pestaña Dinero. Activos y MRR: suscripciones de
 * hoy × precio (lo que se va a cobrar). Lo ingresado: los cobros reales que
 * copia Stripe (src/lib/cobrosStripe.ts), con lo que Stripe se queda aparte.
 */
export async function cargarPremium(admin: Admin, rango: Rango): Promise<DatosPremium> {
  const ahora = Date.now();
  const hoy = hoyISO(ahora);
  const desde = inicioRango(rango, hoy);

  const [perfilesRes, cobros] = await Promise.all([
    admin
      .from("profiles")
      .select("role, premium_since, subscription_current_period_end, subscription_cancel_at_period_end")
      .neq("role", "admin")
      .not("premium_since", "is", null),
    todasLasFilas((a, b) =>
      admin.from("movimientos").select("id, tipo, fecha, categoria, importe").eq("origen", "stripe").order("fecha").order("id").range(a, b)
    ),
  ]);

  const perfiles = (perfilesRes.data ?? []) as (Perfil & { subscription_cancel_at_period_end: boolean | null })[];
  const activosHoy = perfiles.filter((f) => f.role === "premium");
  const cancelan = activosHoy.filter((f) => f.subscription_cancel_at_period_end).length;
  const redondear = (n: number) => Math.round(n * 100) / 100;
  const cobrado = cobros.filter((c) => c.tipo === "ingreso" && c.categoria === "premium").map((c) => ({ fecha: String(c.fecha), importe: Number(c.importe) }));
  const descuentos = cobros.filter((c) => c.tipo === "gasto").map((c) => ({ fecha: String(c.fecha), importe: Number(c.importe) }));
  const suma = (filas: { fecha: string; importe: number }[], cumple: (fecha: string) => boolean) =>
    redondear(filas.filter((f) => cumple(f.fecha)).reduce((t, f) => t + f.importe, 0));
  const enRango = (fecha: string) => !desde || fecha >= desde;

  const primeraAlta = perfiles.map((f) => f.premium_since as string).sort()[0] ?? null;
  const primerCobro = cobrado[0]?.fecha ?? null;
  const porMes = mesesDelRango(desde, hoy, primerCobro ?? (primeraAlta ? hoyISO(Date.parse(primeraAlta)) : null)).map((mes) => ({
    mes,
    valor: suma(cobrado, (f) => f.startsWith(mes)),
  }));

  // Premium activos cada día del rango (o desde la primera alta, si es «todo»).
  const inicioActivos = desde ?? (primeraAlta ? hoyISO(Date.parse(primeraAlta)) : hoy);
  const activosPorDia: Punto[] = [];
  for (let d = inicioActivos; d <= hoy; d = sumarDiasISO(d, 1)) {
    const fin = medianocheRumania(sumarDiasISO(d, 1)).getTime();
    const valor = perfiles.filter((f) => {
      const alta = Date.parse(f.premium_since as string);
      if (alta >= fin) return false;
      if (f.role === "premium") return true;
      return !!f.subscription_current_period_end && Date.parse(f.subscription_current_period_end) >= fin - DIA;
    }).length;
    activosPorDia.push({ fecha: d, valor });
  }

  return {
    hoy,
    desde,
    precio: PREMIUM_PRICE_EUR,
    activos: activosHoy.length,
    cancelan,
    mrr: redondear((activosHoy.length - cancelan) * PREMIUM_PRICE_EUR),
    ingresosRango: suma(cobrado, enRango),
    descuentosRango: suma(descuentos, enRango),
    ingresosTotales: suma(cobrado, () => true),
    porMes,
    activosPorDia,
  };
}
