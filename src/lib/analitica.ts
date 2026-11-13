import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { PREMIUM_PRICE_EUR } from "@/lib/stripe";

/**
 * Los datos de /admin (Analítica). Solo servidor, con la clave de servicio.
 *
 * Todo se calcula en la base de datos, en dos funciones (`scripts/create-analitica.sql`):
 *  · `analitica_trafico`: la medición propia de visitas. Ver `src/lib/visitas.ts`.
 *  · `analitica_academia`: cuentas, Premium y uso de la academia.
 *
 * Ninguna cifra cuenta a los administradores: ni sus visitas (no se guardan),
 * ni su cuenta, ni lo que hacen en cursos, Diario o guías.
 *
 * El periodo son días naturales enteros de Rumanía: «7 días» es hoy y los 6
 * anteriores. Se compara con el mismo tramo desplazado hacia atrás, cortado a
 * la misma hora, para no comparar un día a medias con uno entero.
 */

export const PERIODOS = [7, 30, 90] as const;
export type Periodo = (typeof PERIODOS)[number];

const DIA = 24 * 60 * 60 * 1000;
const ZONA = "Europe/Bucharest";
const DIA_RUMANIA = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA });
const HORA_RUMANIA = new Intl.DateTimeFormat("en-GB", { timeZone: ZONA, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });

export type Fila = { nombre: string; n: number; visitantes?: number };
export type DiaTrafico = { dia: string; visitantes: number; vistas: number; registros: number };
export type Comparada = { ahora: number; antes: number };

type Trafico = {
  vistas: number;
  visitas: number;
  con_sesion: number;
  rebotes: number;
  por_hora: { hora: number; n: number }[];
  por_dia: { dia: string; visitantes: number; vistas: number }[];
  canales: Fila[];
  campanas: Fila[];
  referentes: Fila[];
  paises: Fila[];
  dispositivos: Fila[];
  sistemas: Fila[];
  paginas: Fila[];
  entradas: Fila[];
  /** Páginas por las que se entra desde Google sin UTM: lo que está posicionado. */
  google: Fila[];
  google_tipos: Fila[];
};

const USO = {
  lecciones: "Lecciones completadas",
  cursos: "Cursos empezados",
  examenes: "Exámenes entregados",
  certificados: "Certificados",
  operaciones: "Operaciones en el Diario",
  quizzes: "Quizzes de guías",
  terminos: "Términos guardados",
} as const;
type ClaveUso = keyof typeof USO;

type Academia = {
  usuarios: number;
  premium: number;
  premium_pago: number;
  cancelaran: number;
  registros: number;
  activados: number;
  altas: number;
  bajas: number;
  registros_dia: { dia: string; n: number }[];
  uso: Record<ClaveUso, number>;
  cursos: { titulo: string; inscritos: number; certificados: number }[];
  acciones: Record<string, number>;
};

const TRAFICO_VACIO: Trafico = {
  vistas: 0, visitas: 0, con_sesion: 0, rebotes: 0, por_hora: [], por_dia: [], canales: [], campanas: [],
  referentes: [], paises: [], dispositivos: [], sistemas: [], paginas: [], entradas: [], google: [], google_tipos: [],
};

const ACADEMIA_VACIA: Academia = {
  usuarios: 0, premium: 0, premium_pago: 0, cancelaran: 0, registros: 0, activados: 0, altas: 0, bajas: 0,
  registros_dia: [], uso: { lecciones: 0, cursos: 0, examenes: 0, certificados: 0, operaciones: 0, quizzes: 0, terminos: 0 },
  cursos: [], acciones: {},
};

type Perfil = {
  id: string;
  email: string | null;
  full_name: string | null;
  alias: string | null;
  role: "free" | "premium";
  created_at: string;
  last_seen: string | null;
};

export type UsuarioFila = Perfil & { acciones: number; dosPasos: boolean };

export function periodoDe(valor: string | undefined): Periodo {
  const n = Number(valor);
  return (PERIODOS as readonly number[]).includes(n) ? (n as Periodo) : 30;
}

/** Milisegundos transcurridos hoy en Rumanía (desde su medianoche). */
function msDeHoyEnRumania(ahora: number): number {
  const [h, m, s] = HORA_RUMANIA.format(ahora).split(":").map(Number);
  return ((h * 60 + m) * 60 + s) * 1000 + (ahora % 1000);
}

export async function cargarAnalitica(dias: Periodo) {
  const admin = createAdminClient();
  const ahora = Date.now();
  // Medianoche de Rumanía de hace (dias − 1) días: el periodo empieza en un día entero.
  const desde = ahora - msDeHoyEnRumania(ahora) - (dias - 1) * DIA;
  const antesDesde = desde - dias * DIA;
  const antesHasta = ahora - dias * DIA;

  const llamar = async <T extends object>(funcion: string, a: number, b: number, vacio: T): Promise<{ datos: T; falta: boolean }> => {
    const { data, error } = await admin.rpc(funcion, { p_desde: new Date(a).toISOString(), p_hasta: new Date(b).toISOString() });
    if (error) {
      console.error(`[analitica] ${funcion}:`, error.code, error.message);
      return { datos: vacio, falta: true };
    }
    return { datos: { ...vacio, ...(data as Partial<T>) }, falta: false };
  };

  const [traf, trafAntes, acad, acadAntes, { data: ultimosData }] = await Promise.all([
    llamar("analitica_trafico", desde, ahora, TRAFICO_VACIO),
    llamar("analitica_trafico", antesDesde, antesHasta, TRAFICO_VACIO),
    llamar("analitica_academia", desde, ahora, ACADEMIA_VACIA),
    llamar("analitica_academia", antesDesde, antesHasta, ACADEMIA_VACIA),
    admin
      .from("profiles")
      .select("id, email, full_name, alias, role, created_at, last_seen")
      .neq("role", "admin")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const t = traf.datos;
  const a = acad.datos;

  // ── Los días del gráfico, con los que no tuvieron nada a cero ──
  const visitasDia = new Map(t.por_dia.map((d) => [d.dia, d]));
  const registrosDia = new Map(a.registros_dia.map((d) => [d.dia, d.n]));
  const serie: DiaTrafico[] = [];
  for (let i = 0; i < dias; i++) {
    // Mediodía de cada día: a salvo de los cambios de hora.
    const dia = DIA_RUMANIA.format(desde + i * DIA + DIA / 2);
    const v = visitasDia.get(dia);
    serie.push({ dia, visitantes: v?.visitantes ?? 0, vistas: v?.vistas ?? 0, registros: registrosDia.get(dia) ?? 0 });
  }

  const horas = Array.from({ length: 24 }, (_, hora) => ({ hora, n: t.por_hora.find((h) => h.hora === hora)?.n ?? 0 }));

  // ── Usuarios: los 30 últimos registrados, con su 2FA ──
  const ultimos = (ultimosData ?? []) as Perfil[];
  const dosPasos = await Promise.all(
    ultimos.map(async (p) => {
      const { data } = await admin.auth.admin.mfa.listFactors({ userId: p.id });
      return (data?.factors ?? []).some((f) => f.status === "verified");
    }),
  );
  const usuarios: UsuarioFila[] = ultimos.map((p, i) => ({ ...p, acciones: a.acciones[p.id] ?? 0, dosPasos: dosPasos[i] }));

  const comparar = (ahoraN: number, antesN: number): Comparada => ({ ahora: ahoraN, antes: antesN });

  return {
    dias,
    /** Falta ejecutar `scripts/create-analitica.sql` (o está a medias). */
    faltaSql: traf.falta || acad.falta,
    serie,
    horas,
    trafico: t,
    visitas: comparar(t.visitas, trafAntes.datos.visitas),
    vistas: comparar(t.vistas, trafAntes.datos.vistas),
    rebote: comparar(t.visitas ? (t.rebotes / t.visitas) * 100 : 0, trafAntes.datos.visitas ? (trafAntes.datos.rebotes / trafAntes.datos.visitas) * 100 : 0),
    registros: comparar(a.registros, acadAntes.datos.registros),
    activados: a.activados,
    altas: comparar(a.altas, acadAntes.datos.altas),
    bajas: comparar(a.bajas, acadAntes.datos.bajas),
    uso: (Object.keys(USO) as ClaveUso[]).map((clave) => ({
      clave,
      etiqueta: USO[clave],
      ahora: a.uso[clave] ?? 0,
      antes: acadAntes.datos.uso[clave] ?? 0,
    })),
    cursos: a.cursos,
    premium: {
      activos: a.premium,
      dePago: a.premium_pago,
      mrr: a.premium_pago * PREMIUM_PRICE_EUR,
      cancelaciones: a.cancelaran,
    },
    totalUsuarios: a.usuarios,
    usuarios,
  };
}

export type Analitica = Awaited<ReturnType<typeof cargarAnalitica>>;
