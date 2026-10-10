import type { createAdminClient } from "@/lib/supabase/admin";
import { todasLasFilas } from "@/lib/supabase/todasLasFilas";
import { getChannelAdminCount, getFreeChannelId } from "@/lib/telegram";
import { getSubscriberCount } from "@/lib/youtube";
import { esShort, subidasEntre } from "@/lib/actividadMes";
import {
  FUENTES,
  METRICAS,
  calcularRitmo,
  cumpleMeta,
  hoyISO,
  importeEnMes,
  instantes,
  periodosDe,
  type Balance,
  type Fuente,
  type Movimiento,
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

type Foto = { fecha: string; valor: number };

export type Perfil = { role: string; premium_since: string | null; subscription_current_period_end: string | null };

/**
 * Lo que se lee una sola vez por petición y comparten todos los objetivos:
 * con seis periodos de historial por objetivo, repetir estas consultas en cada
 * uno sería multiplicar las idas a Supabase sin necesidad.
 */
class Contexto {
  private cobros: Promise<{ fecha: string; importe: number }[]> | null = null;
  private libro: Promise<Pick<Movimiento, "tipo" | "fecha" | "importe" | "recurrente" | "hasta">[]> | null = null;
  private fotos = new Map<string, Promise<Foto[]>>();
  registros = new Map<string, number>();
  /** Marcas apuntadas por objetivo, de la más antigua a la más reciente. */
  marcas = new Map<string, Foto[]>();

  constructor(readonly admin: Admin, readonly ahora: number) {}

  /** Los cobros de Premium que copió Stripe al libro de dinero. */
  cobrosPremium(): Promise<{ fecha: string; importe: number }[]> {
    this.cobros ??= (async () => {
      const data = await todasLasFilas((a, b) =>
        this.admin
          .from("movimientos")
          .select("id, fecha, importe")
          .eq("origen", "stripe")
          .eq("tipo", "ingreso")
          .eq("categoria", "premium")
          .order("fecha")
          .order("id")
          .range(a, b)
      );
      return data.map((c) => ({ fecha: String(c.fecha), importe: Number(c.importe) }));
    })();
    return this.cobros;
  }

  /** Todo el libro de dinero, ingresos y gastos: para el beneficio. */
  movimientos(): Promise<Pick<Movimiento, "tipo" | "fecha" | "importe" | "recurrente" | "hasta">[]> {
    this.libro ??= (async () => {
      const data = await todasLasFilas((a, b) =>
        this.admin.from("movimientos").select("id, tipo, fecha, importe, recurrente, hasta").order("fecha").order("id").range(a, b)
      );
      return data.map((m) => ({
        tipo: m.tipo as Movimiento["tipo"],
        fecha: String(m.fecha),
        importe: Number(m.importe),
        recurrente: !!m.recurrente,
        hasta: (m.hasta as string | null) ?? null,
      }));
    })();
    return this.libro;
  }

  /** Fotos diarias de una métrica de nivel, de la más antigua a la más reciente. */
  fotosDe(metrica: "miembros_telegram" | "suscriptores_youtube"): Promise<Foto[]> {
    const guardada = this.fotos.get(metrica);
    if (guardada) return guardada;
    const nueva = (async (): Promise<Foto[]> => {
      if (metrica === "miembros_telegram") {
        const canal = getFreeChannelId();
        const [data, admins] = await Promise.all([
          todasLasFilas((a, b) =>
            this.admin
              .from("telegram_channel_stats")
              .select("fecha, miembros")
              .eq("chat_id", String(canal ?? ""))
              .order("fecha")
              .range(a, b)
          ),
          // Sin el dueño ni el bot, como en la pestaña Crecimiento (src/lib/crecimiento.ts).
          canal ? getChannelAdminCount(canal) : Promise.resolve(null),
        ]);
        return data.map((f) => ({ fecha: String(f.fecha), valor: Math.max(0, Number(f.miembros) - (admins ?? 0)) }));
      }
      const data = await todasLasFilas((a, b) =>
        this.admin.from("metricas_diarias").select("fecha, valor").eq("clave", "suscriptores_youtube").order("fecha").range(a, b)
      );
      return data.map((f) => ({ fecha: String(f.fecha), valor: Number(f.valor) }));
    })();
    this.fotos.set(metrica, nueva);
    return nueva;
  }
}

async function contar(consulta: PromiseLike<{ count: number | null }>): Promise<number> {
  return (await consulta).count ?? 0;
}

/**
 * Lo cobrado de verdad por Premium en el periodo: los cobros que copia Stripe
 * al libro de dinero (src/lib/cobrosStripe.ts), en bruto. Antes era una
 * estimación (suscriptores × precio), que no tenía por qué coincidir.
 */
async function ingresos(ctx: Contexto, p: Periodo): Promise<number> {
  const total = (await ctx.cobrosPremium())
    .filter((c) => c.fecha >= p.desde && c.fecha <= p.hasta)
    .reduce((t, c) => t + c.importe, 0);
  return Math.round(total * 100) / 100;
}

const DIAS = (desde: string, hasta: string) => Math.round((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / DIA) + 1;

/**
 * Beneficio del periodo: todo lo ingresado menos todo lo gastado, del libro de
 * dinero (como «Ganancias y gastos»). Lo puntual cuenta el día en que cae; lo
 * fijo de cada mes, en proporción a los días del mes que caen en el periodo
 * (un objetivo semanal se lleva una cuarta parte del alquiler, no entero).
 */
async function beneficio(ctx: Contexto, p: Periodo): Promise<number> {
  let total = 0;
  for (const m of await ctx.movimientos()) {
    const signo = m.tipo === "ingreso" ? 1 : -1;
    if (!m.recurrente) {
      if (m.fecha >= p.desde && m.fecha <= p.hasta) total += signo * m.importe;
      continue;
    }
    for (let mes = p.desde.slice(0, 7); mes <= p.hasta.slice(0, 7); mes = mesSiguiente(mes)) {
      const importe = importeEnMes(m, mes);
      if (!importe) continue;
      const [a, n] = mes.split("-").map(Number);
      const finMes = new Date(Date.UTC(a, n, 0)).toISOString().slice(0, 10);
      const desde = p.desde > `${mes}-01` ? p.desde : `${mes}-01`;
      const hasta = p.hasta < finMes ? p.hasta : finMes;
      total += signo * importe * (DIAS(desde, hasta) / DIAS(`${mes}-01`, finMes));
    }
  }
  return Math.round(total * 100) / 100;
}

/**
 * Nivel al final del periodo (o hoy, si sigue abierto) y nivel con que empezó.
 * Si no hay foto anterior al periodo, la base es la primera foto dentro de él.
 */
async function nivel(ctx: Contexto, metrica: "miembros_telegram" | "suscriptores_youtube", p: Periodo) {
  return nivelDe(await ctx.fotosDe(metrica), p);
}

/**
 * Valor al final del periodo y valor con que empezó. Sirve para las fotos de
 * los canales y para las marcas que apuntas tú: si no hay nada antes del periodo,
 * el punto de partida es lo primero apuntado dentro de él.
 */
function nivelDe(fotos: Foto[], p: Periodo) {
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
    case "marca":
      return nivelDe(ctx.marcas.get(o.id) ?? [], p);
    case "videos":
    case "shorts": {
      // Lo subido a YouTube, por su fecha real de publicación: la misma fuente
      // que el calendario. Antes se contaban los avisos del bot, que van por
      // el día del aviso, sin Shorts y sin los vídeos que el bot no anunció.
      // Sin API, la función cae a esos avisos (y ahí no hay Shorts).
      const { videos } = await subidasEntre(a, new Date(ini), new Date(fin));
      return { valor: videos.filter((v) => esShort(v) === (o.metrica === "shorts")).length, base: 0 };
    }
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
    case "beneficio":
      return { valor: await beneficio(ctx, p), base: 0 };
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

  const conMarcas = objetivos.filter((o) => o.metrica === "marca").map((o) => o.id);
  if (conMarcas.length) {
    const { data: marcas } = await admin
      .from("objetivo_marcas")
      .select("objetivo_id, fecha, valor")
      .in("objetivo_id", conMarcas)
      .order("fecha");
    for (const m of marcas ?? []) {
      const lista = ctx.marcas.get(m.objetivo_id) ?? [];
      lista.push({ fecha: String(m.fecha), valor: Number(m.valor) });
      ctx.marcas.set(m.objetivo_id, lista);
    }
  }

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
      const esNivel = METRICAS[o.metrica].tipo === "nivel";
      return {
        ...o,
        ambito: o.ambito ?? "negocio",
        meta,
        periodo,
        actual: ahora.valor,
        base: ahora.base,
        ...calcularRitmo(meta, esNivel ? ahora.base : 0, ahora.valor, periodo, ctx.ahora),
        historial: anteriores.map((p, i) => ({
          ...p,
          valor: pasados[i].valor,
          cumplido: cumpleMeta(meta, esNivel ? pasados[i].base : 0, pasados[i].valor),
        })),
        marcas: ctx.marcas.get(o.id) ?? [],
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
 * una semana arriba o abajo. Le pone el enlace real y la lleva al día en que
 * salió de verdad.
 *
 * Solo cuenta lo planeado ANTES de publicarse: una pieza que apuntas mañana
 * para el viernes no es la de un vídeo subido ayer.
 *
 * Lo llaman el anunciador (src/lib/announce.ts), al publicar una entrada o un
 * vídeo, y el calendario, con lo que encuentra subido en YouTube (Shorts
 * incluidos, que no se anuncian). Sin esto, lo planeado salía dos veces en el
 * calendario: la pieza azul planeada y la verde detectada.
 *
 * Nunca lanza: un fallo aquí no puede impedir que se anuncie nada. Devuelve si
 * cerró alguna pieza.
 */
export async function cerrarPiezaPlaneada(
  admin: Admin,
  publicado: { canal: "web" | "youtube"; tipos: string[]; cuando: Date; enlace: string }
): Promise<boolean> {
  try {
    const dia = hoyISO(publicado.cuando.getTime());
    const desde = new Date(Date.parse(`${dia}T00:00:00Z`) - MARGEN_CIERRE_DIAS * DIA).toISOString().slice(0, 10);
    const hasta = new Date(Date.parse(`${dia}T00:00:00Z`) + MARGEN_CIERRE_DIAS * DIA).toISOString().slice(0, 10);

    // Ya cerrada por otra vía (el calendario o un anuncio anterior): si no se
    // mirara, se daría por hecha otra pieza planeada cercana con el mismo enlace.
    const { data: ya } = await admin.from("contenido_plan").select("id").eq("enlace", publicado.enlace).limit(1);
    if (ya?.length) return false;

    const { data } = await admin
      .from("contenido_plan")
      .select("id, fecha")
      .eq("canal", publicado.canal)
      .in("tipo", publicado.tipos)
      .neq("estado", "publicado")
      .gte("fecha", desde)
      .lte("fecha", hasta)
      .lte("created_at", publicado.cuando.toISOString());
    if (!data?.length) return false;

    const distancia = (f: string) => Math.abs(Date.parse(`${f}T00:00:00Z`) - Date.parse(`${dia}T00:00:00Z`));
    const pieza = [...data].sort((a, b) => distancia(String(a.fecha)) - distancia(String(b.fecha)))[0];

    const { error } = await admin
      .from("contenido_plan")
      .update({
        fecha: dia,
        estado: "publicado",
        publicado_en: publicado.cuando.toISOString(),
        enlace: publicado.enlace,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pieza.id);
    if (error) throw new Error(error.message);
    return true;
  } catch (err) {
    console.error("[objetivos] No se pudo cerrar la pieza planeada:", err);
    return false;
  }
}

const redondear = (n: number) => Math.round(n * 100) / 100;

/**
 * Los días entre dos fechas, incluidas: productividad y nota (dias_balance) y
 * lo ingresado (movimientos de tipo ingreso, del cierre y apuntados a mano).
 * Los ingresos fijos de cada mes no tienen día: cuentan en los meses, no aquí.
 */
export async function cargarBalances(admin: Admin, desde: string, hasta: string): Promise<Record<string, Balance>> {
  const [dias, ingresos] = await Promise.all([
    admin.from("dias_balance").select("fecha, productividad, nota").gte("fecha", desde).lte("fecha", hasta),
    admin
      .from("movimientos")
      .select("fecha, concepto, categoria, importe, origen")
      .eq("tipo", "ingreso")
      .eq("recurrente", false)
      .gte("fecha", desde)
      .lte("fecha", hasta),
  ]);
  const balances: Record<string, Balance> = {};
  const de = (fecha: string) =>
    (balances[fecha] ??= { fecha, productividad: null, nota: null, ingresos: {}, ingresosCierre: {}, manuales: [], total: 0 });
  for (const d of dias.data ?? []) {
    const b = de(String(d.fecha));
    b.productividad = (d.productividad as Balance["productividad"]) ?? null;
    b.nota = d.nota ?? null;
  }
  for (const i of ingresos.data ?? []) {
    const b = de(String(i.fecha));
    const importe = Number(i.importe);
    const fuente = i.categoria as Fuente;
    b.ingresos[fuente] = redondear((b.ingresos[fuente] ?? 0) + importe);
    if (i.origen === "cierre") b.ingresosCierre[fuente] = importe;
    else b.manuales.push({ concepto: i.concepto ?? FUENTES[fuente]?.texto ?? "Ingreso", fuente, importe });
    b.total = redondear(b.total + importe);
  }
  return balances;
}

/** `fijos`: la parte del total que son ingresos fijos de cada mes (no tienen día), y de qué fuente es. */
export type DineroMes = {
  mes: string;
  total: number;
  fijos: number;
  porFuente: Partial<Record<Fuente, number>>;
  fijosPorFuente: Partial<Record<Fuente, number>>;
  dias: number;
};

/**
 * Todo lo ingresado, sumado por mes y por fuente, del mes más antiguo al más
 * reciente: lo del cierre del día, lo apuntado a mano y los ingresos fijos
 * de cada mes (hasta el mes actual). Es la base de «Tu dinero», del resumen
 * del mes y de «Ganancias y gastos».
 */
export async function cargarDineroPorMes(admin: Admin): Promise<DineroMes[]> {
  const data = await todasLasFilas((a, b) =>
    admin
      .from("movimientos")
      .select("id, fecha, categoria, importe, recurrente, hasta")
      .eq("tipo", "ingreso")
      .order("fecha")
      .order("id")
      .range(a, b)
  );
  const mesActual = hoyISO().slice(0, 7);
  const meses = new Map<string, DineroMes & { diasSet: Set<string> }>();
  const sumar = (mes: string, fuente: Fuente, importe: number, dia: string | null) => {
    const m = meses.get(mes) ?? { mes, total: 0, fijos: 0, porFuente: {}, fijosPorFuente: {}, dias: 0, diasSet: new Set<string>() };
    m.total = redondear(m.total + importe);
    m.porFuente[fuente] = redondear((m.porFuente[fuente] ?? 0) + importe);
    if (dia) m.diasSet.add(dia);
    else {
      m.fijos = redondear(m.fijos + importe);
      m.fijosPorFuente[fuente] = redondear((m.fijosPorFuente[fuente] ?? 0) + importe);
    }
    meses.set(mes, m);
  };
  for (const fila of data) {
    const fecha = String(fila.fecha);
    const importe = Number(fila.importe);
    const fuente = fila.categoria as Fuente;
    if (!fila.recurrente) {
      sumar(fecha.slice(0, 7), fuente, importe, fecha);
      continue;
    }
    // Fijo: cada mes desde el suyo hasta su fin o hasta el mes actual.
    const ultimo = fila.hasta && fila.hasta.slice(0, 7) < mesActual ? fila.hasta.slice(0, 7) : mesActual;
    for (let mes = fecha.slice(0, 7); mes <= ultimo; mes = mesSiguiente(mes)) sumar(mes, fuente, importe, null);
  }
  return [...meses.values()]
    .map(({ diasSet, ...m }) => ({ ...m, dias: diasSet.size }))
    .sort((a, b) => a.mes.localeCompare(b.mes));
}

function mesSiguiente(mes: string): string {
  const [a, m] = mes.split("-").map(Number);
  return new Date(Date.UTC(a, m, 1)).toISOString().slice(0, 7);
}
