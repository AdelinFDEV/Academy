import type { createAdminClient } from "@/lib/supabase/admin";
import { PREMIUM_PRICE_EUR } from "@/lib/stripe";
import { getChannelId, getChannelMemberCount, getFreeChannelId } from "@/lib/telegram";
import { getSubscriberCount } from "@/lib/youtube";
import { hoyISO, medianocheRumania, sumarDiasISO } from "@/lib/objetivos";
import { contarCuotas, type Perfil } from "@/lib/objetivosServidor";
import { todasLasFilas } from "@/lib/supabase/todasLasFilas";

/**
 * Pestaña Crecimiento de /admin/objetivos: Telegram, YouTube y dinero de
 * Premium, con su evolución. Solo servidor.
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

async function fotosTelegram(admin: Admin, chatId: string | null): Promise<Punto[]> {
  if (!chatId) return [];
  const data = await todasLasFilas((a, b) =>
    admin.from("telegram_channel_stats").select("fecha, miembros").eq("chat_id", chatId).order("fecha").range(a, b)
  );
  return data.map((f) => ({ fecha: String(f.fecha), valor: Number(f.miembros) }));
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
  dinero: {
    precio: number;
    activos: number;
    cancelan: number;
    mrr: number;
    ingresosRango: number;
    ingresosTotales: number;
    porMes: { mes: string; valor: number }[];
    activosPorDia: Punto[];
  };
};

export async function cargarCrecimiento(admin: Admin, rango: Rango): Promise<DatosCrecimiento> {
  const ahora = Date.now();
  const hoy = hoyISO(ahora);
  const desde = inicioRango(rango, hoy);
  const premiumId = canalPremium();

  const [free, premium, fotosYoutube, perfilesRes, enVivoFree, enVivoPremium, enVivoYoutube] = await Promise.all([
    fotosTelegram(admin, getFreeChannelId()),
    fotosTelegram(admin, premiumId),
    todasLasFilas((a, b) =>
      admin.from("metricas_diarias").select("fecha, valor").eq("clave", "suscriptores_youtube").order("fecha").range(a, b)
    ),
    admin
      .from("profiles")
      .select("role, premium_since, subscription_current_period_end, subscription_cancel_at_period_end")
      .neq("role", "admin")
      .not("premium_since", "is", null),
    getChannelMemberCount(getFreeChannelId() ?? undefined).catch(() => null),
    premiumId ? getChannelMemberCount(premiumId).catch(() => null) : Promise.resolve(null),
    getSubscriberCount(),
  ]);

  // ── Dinero: la misma estimación que /admin/premium ──────────────────────
  const perfiles = (perfilesRes.data ?? []) as (Perfil & { subscription_cancel_at_period_end: boolean | null })[];
  const activosHoy = perfiles.filter((f) => f.role === "premium");
  const cancelan = activosHoy.filter((f) => f.subscription_cancel_at_period_end).length;
  const euros = (cuotas: number) => Math.round(cuotas * PREMIUM_PRICE_EUR * 100) / 100;

  const primeraAlta = perfiles.map((f) => f.premium_since as string).sort()[0] ?? null;
  const porMes = mesesDelRango(desde, hoy, primeraAlta ? hoyISO(Date.parse(primeraAlta)) : null).map((mes) => {
    const [a, m] = mes.split("-").map(Number);
    const siguiente = new Date(Date.UTC(a, m, 1)).toISOString().slice(0, 10);
    const cuotas = contarCuotas(perfiles, medianocheRumania(`${mes}-01`).getTime(), medianocheRumania(siguiente).getTime(), ahora);
    return { mes, valor: euros(cuotas) };
  });

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

  const youtube = fotosYoutube.map((f) => ({ fecha: String(f.fecha), valor: Number(f.valor) }));

  return {
    hoy,
    desde,
    telegramFree: serie(free, desde, hoy, enVivoFree),
    telegramPremium: premiumId ? serie(premium, desde, hoy, enVivoPremium) : null,
    youtube: serie(youtube, desde, hoy, enVivoYoutube),
    youtubeConClave: !!process.env.YOUTUBE_API_KEY,
    dinero: {
      precio: PREMIUM_PRICE_EUR,
      activos: activosHoy.length,
      cancelan,
      mrr: euros(activosHoy.length - cancelan),
      ingresosRango: euros(contarCuotas(perfiles, desde ? medianocheRumania(desde).getTime() : 0, ahora + DIA, ahora)),
      ingresosTotales: euros(contarCuotas(perfiles, 0, ahora + DIA, ahora)),
      porMes,
      activosPorDia,
    },
  };
}
