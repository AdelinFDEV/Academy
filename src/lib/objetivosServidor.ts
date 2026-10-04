import type { createAdminClient } from "@/lib/supabase/admin";
import { PREMIUM_PRICE_EUR } from "@/lib/stripe";
import { getFreeChannelId } from "@/lib/telegram";
import { getSubscriberCount } from "@/lib/youtube";
import {
  METRICAS,
  calcularRitmo,
  hoyISO,
  instantes,
  periodosDe,
  type Objetivo,
  type ObjetivoConProgreso,
  type Periodo,
} from "@/lib/objetivos";

/**
 * La parte de /admin/objetivos que consulta la base de datos. Solo servidor:
 * importa el precio de Stripe y el cliente con la clave de servicio.
 */

type Admin = ReturnType<typeof createAdminClient>;

const DIA = 24 * 60 * 60 * 1000;
/** El mismo mes medio que usa /admin/premium para estimar lo cobrado. */
const MES_MEDIO = 30.44 * DIA;

type Foto = { fecha: string; valor: number };

/**
 * Lo que se lee una sola vez por petición y comparten todos los objetivos:
 * con seis periodos de historial por objetivo, repetir estas consultas en cada
 * uno sería multiplicar las idas a Supabase sin necesidad.
 */
export type Perfil = { role: string; premium_since: string | null; subscription_current_period_end: string | null };

class Contexto {
  private perfiles: Promise<Perfil[]> | null = null;
  private fotos = new Map<string, Promise<Foto[]>>();
  registros = new Map<string, number>();

  constructor(readonly admin: Admin, readonly ahora: number) {}

  perfilesDePago(): Promise<Perfil[]> {
    this.perfiles ??= (async () => {
      const { data } = await this.admin
        .from("profiles")
        .select("role, premium_since, subscription_current_period_end")
        .neq("role", "admin")
        .not("premium_since", "is", null);
      return (data ?? []) as Perfil[];
    })();
    return this.perfiles;
  }

  /** Fotos diarias de una métrica de nivel, de la más antigua a la más reciente. */
  fotosDe(metrica: "miembros_telegram" | "suscriptores_youtube"): Promise<Foto[]> {
    const guardada = this.fotos.get(metrica);
    if (guardada) return guardada;
    const nueva = (async (): Promise<Foto[]> => {
      if (metrica === "miembros_telegram") {
        const { data } = await this.admin
          .from("telegram_channel_stats")
          .select("fecha, miembros")
          .eq("chat_id", String(getFreeChannelId() ?? ""))
          .order("fecha");
        return (data ?? []).map((f) => ({ fecha: String(f.fecha), valor: Number(f.miembros) }));
      }
      const { data } = await this.admin
        .from("metricas_diarias")
        .select("fecha, valor")
        .eq("clave", "suscriptores_youtube")
        .order("fecha");
      return (data ?? []).map((f) => ({ fecha: String(f.fecha), valor: Number(f.valor) }));
    })();
    this.fotos.set(metrica, nueva);
    return nueva;
  }
}

async function contar(consulta: PromiseLike<{ count: number | null }>): Promise<number> {
  return (await consulta).count ?? 0;
}

/**
 * Cuotas cobradas entre `desde` y `hasta` (instantes en ms), con la misma
 * estimación que /admin/premium: una cuota al darse de alta y otra cada mes
 * medio, hasta hoy si sigue siendo Premium o hasta el fin de su último periodo
 * pagado si se dio de baja. La usan los objetivos de ingresos y la pestaña
 * Crecimiento: una sola cuenta para que nunca den cifras distintas.
 */
export function contarCuotas(perfiles: Perfil[], desde: number, hasta: number, ahora: number): number {
  let cuotas = 0;
  const tope = Math.min(hasta, ahora);
  for (const f of perfiles) {
    if (!f.premium_since) continue;
    const alta = Date.parse(f.premium_since);
    const limite =
      f.role === "premium" ? ahora : f.subscription_current_period_end ? Date.parse(f.subscription_current_period_end) : alta + 1;
    for (let cobro = alta; cobro < limite && cobro < tope; cobro += MES_MEDIO) {
      if (cobro >= desde) cuotas++;
    }
  }
  return cuotas;
}

async function ingresos(ctx: Contexto, p: Periodo): Promise<number> {
  const { ini, fin } = instantes(p);
  const cuotas = contarCuotas(await ctx.perfilesDePago(), Date.parse(ini), Date.parse(fin), ctx.ahora);
  return Math.round(cuotas * PREMIUM_PRICE_EUR * 100) / 100;
}

/**
 * Nivel al final del periodo (o hoy, si sigue abierto) y nivel con que empezó.
 * Si no hay foto anterior al periodo, la base es la primera foto dentro de él.
 */
async function nivel(ctx: Contexto, metrica: "miembros_telegram" | "suscriptores_youtube", p: Periodo) {
  const fotos = await ctx.fotosDe(metrica);
  const hasta = fotos.filter((f) => f.fecha <= p.hasta);
  const antes = fotos.filter((f) => f.fecha < p.desde);
  const dentro = fotos.filter((f) => f.fecha >= p.desde && f.fecha <= p.hasta);
  const valor = hasta.length ? hasta[hasta.length - 1].valor : 0;
  const base = antes.length ? antes[antes.length - 1].valor : dentro.length ? dentro[0].valor : valor;
  return { valor, base };
}

/** Lo conseguido en un periodo. Los días son los de Rumanía. */
async function medir(ctx: Contexto, o: Objetivo, p: Periodo): Promise<{ valor: number; base: number }> {
  const { ini, fin } = instantes(p);
  const a = ctx.admin;
  switch (o.metrica) {
    case "manual":
      return { valor: ctx.registros.get(`${o.id}|${p.desde}`) ?? 0, base: 0 };
    case "entradas":
      return {
        valor: await contar(a.from("posts").select("id", { count: "exact", head: true }).eq("published", true).gte("created_at", ini).lt("created_at", fin)),
        base: 0,
      };
    case "videos":
      // Los vídeos que el bot detectó y anunció: solo los largos.
      return {
        valor: await contar(a.from("content_announcements").select("id", { count: "exact", head: true }).eq("kind", "video").gte("announced_at", ini).lt("announced_at", fin)),
        base: 0,
      };
    case "registros":
      return {
        valor: await contar(a.from("profiles").select("id", { count: "exact", head: true }).neq("role", "admin").gte("created_at", ini).lt("created_at", fin)),
        base: 0,
      };
    case "premium":
      return {
        valor: await contar(a.from("profiles").select("id", { count: "exact", head: true }).neq("role", "admin").gte("premium_since", ini).lt("premium_since", fin)),
        base: 0,
      };
    case "ingresos":
      return { valor: await ingresos(ctx, p), base: 0 };
    case "miembros_telegram":
    case "suscriptores_youtube":
      return nivel(ctx, o.metrica, p);
  }
}

/**
 * Los objetivos con su periodo actual, su ritmo y el historial de periodos ya
 * cerrados. `faltaSql` avisa de que las tablas aún no existen (PGRST205) o
 * les falta la migración del 05-10-2026 (42703, columna inexistente).
 */
export async function cargarObjetivos(admin: Admin): Promise<{ objetivos: ObjetivoConProgreso[]; faltaSql: boolean }> {
  const [{ data, error }, migracion] = await Promise.all([
    admin.from("objetivos").select("*").order("desde", { ascending: true }),
    // La tabla de la migración del 05-10-2026: si no está, falta lanzar el SQL
    // otra vez, y guardar un objetivo nuevo fallaría por la columna `repeticion`.
    admin.from("objetivo_registros").select("objetivo_id", { head: true, count: "exact" }),
  ]);
  if (error?.code === "PGRST205" || migracion.error?.code === "PGRST205") return { objetivos: [], faltaSql: true };
  const objetivos = (data ?? []) as Objetivo[];

  const ctx = new Contexto(admin, Date.now());
  const hoy = hoyISO(ctx.ahora);

  const manuales = objetivos.filter((o) => o.metrica === "manual").map((o) => o.id);
  if (manuales.length) {
    const { data: regs, error: regErr } = await admin
      .from("objetivo_registros")
      .select("objetivo_id, periodo, valor")
      .in("objetivo_id", manuales);
    if (regErr?.code === "PGRST205") return { objetivos: [], faltaSql: true };
    for (const r of regs ?? []) ctx.registros.set(`${r.objetivo_id}|${r.periodo}`, Number(r.valor));
  }

  const resultado = await Promise.all(
    objetivos.map(async (o): Promise<ObjetivoConProgreso> => {
      const { actual: periodo, anteriores } = periodosDe(o, hoy);
      const [ahora, ...pasados] = await Promise.all([periodo, ...anteriores].map((p) => medir(ctx, o, p)));
      const meta = Number(o.meta);
      return {
        ...o,
        meta,
        periodo,
        actual: ahora.valor,
        base: ahora.base,
        ...calcularRitmo(meta, METRICAS[o.metrica].tipo === "nivel" ? ahora.base : 0, ahora.valor, periodo, ctx.ahora),
        historial: anteriores.map((p, i) => ({ ...p, valor: pasados[i].valor, cumplido: pasados[i].valor >= meta })),
      };
    })
  );

  return { objetivos: resultado, faltaSql: false };
}

/**
 * Foto diaria de los suscriptores de YouTube, para el cron de las 04:00.
 * Sin YOUTUBE_API_KEY no hace nada: devuelve null y lo dice la salida del cron.
 */
export async function fotografiarYoutube(admin: Admin): Promise<number | null> {
  const total = await getSubscriberCount();
  if (total === null) return null;
  const { error } = await admin
    .from("metricas_diarias")
    .upsert({ clave: "suscriptores_youtube", fecha: hoyISO(), valor: total }, { onConflict: "clave,fecha" });
  if (error) {
    console.error("[objetivos] No se pudo guardar la foto de YouTube:", error.message);
    return null;
  }
  return total;
}

/** Días de margen entre la fecha planeada y la real para dar una pieza por hecha. */
const MARGEN_CIERRE_DIAS = 7;

/**
 * Cierra la pieza del calendario que corresponde a algo recién publicado: la
 * del mismo canal y tipo, aún sin publicar, con la fecha más cercana dentro de
 * una semana arriba o abajo. Le pone el enlace real.
 *
 * Lo llama el anunciador (src/lib/announce.ts) al publicar una entrada o un
 * vídeo. Sin esto, una entrada planeada salía dos veces en el calendario: la
 * pieza azul planeada y la verde detectada.
 *
 * Nunca lanza: un fallo aquí no puede impedir que se anuncie nada.
 */
export async function cerrarPiezaPlaneada(
  admin: Admin,
  publicado: { canal: "web" | "youtube"; tipos: string[]; cuando: Date; enlace: string }
): Promise<void> {
  try {
    const dia = hoyISO(publicado.cuando.getTime());
    const desde = new Date(Date.parse(`${dia}T00:00:00Z`) - MARGEN_CIERRE_DIAS * DIA).toISOString().slice(0, 10);
    const hasta = new Date(Date.parse(`${dia}T00:00:00Z`) + MARGEN_CIERRE_DIAS * DIA).toISOString().slice(0, 10);

    const { data } = await admin
      .from("contenido_plan")
      .select("id, fecha")
      .eq("canal", publicado.canal)
      .in("tipo", publicado.tipos)
      .neq("estado", "publicado")
      .gte("fecha", desde)
      .lte("fecha", hasta);
    if (!data?.length) return;

    const distancia = (f: string) => Math.abs(Date.parse(`${f}T00:00:00Z`) - Date.parse(`${dia}T00:00:00Z`));
    const pieza = [...data].sort((a, b) => distancia(String(a.fecha)) - distancia(String(b.fecha)))[0];

    await admin
      .from("contenido_plan")
      .update({
        estado: "publicado",
        publicado_en: publicado.cuando.toISOString(),
        enlace: publicado.enlace,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pieza.id);
  } catch (err) {
    console.error("[objetivos] No se pudo cerrar la pieza planeada:", err);
  }
}
