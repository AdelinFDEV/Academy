import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { PREMIUM_PRICE_EUR } from "@/lib/stripe";

/**
 * Los datos de /admin (Analítica). Solo servidor, con la clave de servicio.
 *
 * Dos fuentes y nada más:
 *  · `visitas` (vía `analitica_trafico`), la medición propia: tráfico, origen,
 *    país, dispositivo y páginas. Ver `src/lib/visitas.ts`.
 *  · Las tablas de la academia: registros, Premium y lo que hace cada usuario.
 *
 * Cada cifra del periodo se compara con el periodo anterior de la misma
 * duración. Los administradores no cuentan en nada.
 */

export const PERIODOS = [7, 30, 90] as const;
export type Periodo = (typeof PERIODOS)[number];

const DIA = 24 * 60 * 60 * 1000;
const DIA_RUMANIA = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest" });

export type Fila = { nombre: string; n: number; visitantes?: number };
export type DiaTrafico = { dia: string; visitantes: number; vistas: number };

type Trafico = {
  vistas: number;
  visitas: number;
  con_sesion: number;
  por_dia: DiaTrafico[];
  canales: Fila[];
  campanas: Fila[];
  referentes: Fila[];
  paises: Fila[];
  dispositivos: Fila[];
  sistemas: Fila[];
  paginas: Fila[];
  entradas: Fila[];
};

const TRAFICO_VACIO: Trafico = {
  vistas: 0, visitas: 0, con_sesion: 0, por_dia: [], canales: [], campanas: [], referentes: [],
  paises: [], dispositivos: [], sistemas: [], paginas: [], entradas: [],
};

type Perfil = {
  id: string;
  email: string | null;
  full_name: string | null;
  alias: string | null;
  role: "free" | "premium" | "admin";
  created_at: string;
  last_seen: string | null;
  premium_since: string | null;
  subscription_current_period_end: string | null;
  subscription_cancel_at_period_end: boolean | null;
};

export type UsuarioFila = Perfil & { acciones: number; dosPasos: boolean };

export type Comparada = { ahora: number; antes: number };

/** Lo que el usuario hace con la academia. Cada tabla, su columna de fecha. */
const USO = [
  { clave: "lecciones", etiqueta: "Lecciones completadas", tabla: "curso_progreso", fecha: "completada_at" },
  { clave: "cursos", etiqueta: "Cursos empezados", tabla: "curso_inscripciones", fecha: "created_at" },
  { clave: "examenes", etiqueta: "Exámenes entregados", tabla: "curso_intentos", fecha: "entregado_at" },
  { clave: "certificados", etiqueta: "Certificados", tabla: "curso_certificados", fecha: "created_at" },
  { clave: "operaciones", etiqueta: "Operaciones en el Diario", tabla: "trades", fecha: "created_at" },
  { clave: "quizzes", etiqueta: "Quizzes de guías", tabla: "guide_quiz_completions", fecha: "completed_at" },
  { clave: "terminos", etiqueta: "Términos guardados", tabla: "saved_terms", fecha: "created_at" },
] as const;

/** Las tablas que cuentan como «ha usado la academia» para la activación. */
const ACTIVACION = ["curso_inscripciones", "trades", "guide_quiz_completions", "saved_terms", "guide_saves", "diario_dias"] as const;

export function periodoDe(valor: string | undefined): Periodo {
  const n = Number(valor);
  return (PERIODOS as readonly number[]).includes(n) ? (n as Periodo) : 30;
}

/** «AAAA-MM-DD» de cada día del periodo, en la hora de Rumanía, del más antiguo a hoy. */
function diasDelPeriodo(dias: number, ahora: number): string[] {
  const lista: string[] = [];
  for (let i = dias - 1; i >= 0; i--) lista.push(DIA_RUMANIA.format(ahora - i * DIA));
  return [...new Set(lista)];
}

const dentro = (iso: string | null, desde: number, hasta: number) => {
  if (!iso) return false;
  const t = Date.parse(iso);
  return t >= desde && t < hasta;
};

export async function cargarAnalitica(dias: Periodo) {
  const admin = createAdminClient();
  const ahora = Date.now();
  const desde = ahora - dias * DIA;
  const desdeAntes = desde - dias * DIA;

  const trafico = async (a: number, b: number): Promise<Trafico> => {
    const { data, error } = await admin.rpc("analitica_trafico", {
      p_desde: new Date(a).toISOString(),
      p_hasta: new Date(b).toISOString(),
    });
    if (error) {
      console.error("[analitica] analitica_trafico:", error.code, error.message);
      return TRAFICO_VACIO;
    }
    return { ...TRAFICO_VACIO, ...(data as Partial<Trafico>) };
  };

  const contar = async (tabla: string, fecha: string, a: number, b: number) => {
    const { count } = await admin
      .from(tabla)
      .select("*", { count: "exact", head: true })
      .gte(fecha, new Date(a).toISOString())
      .lt(fecha, new Date(b).toISOString());
    return count ?? 0;
  };

  const [actual, anterior, { data: perfilesData, error: errPerfiles }, uso, { data: inscripciones }, { data: certificados }, { data: cursos }] =
    await Promise.all([
      trafico(desde, ahora),
      trafico(desdeAntes, desde),
      admin
        .from("profiles")
        .select("id, email, full_name, alias, role, created_at, last_seen, premium_since, subscription_current_period_end, subscription_cancel_at_period_end")
        .neq("role", "admin")
        .order("created_at", { ascending: false }),
      Promise.all(
        USO.map(async (u) => ({
          clave: u.clave,
          etiqueta: u.etiqueta,
          ahora: await contar(u.tabla, u.fecha, desde, ahora),
          antes: await contar(u.tabla, u.fecha, desdeAntes, desde),
        })),
      ),
      admin.from("curso_inscripciones").select("curso_id, user_id"),
      admin.from("curso_certificados").select("curso_id"),
      admin.from("cursos").select("id, titulo, published").order("orden"),
    ]);

  if (errPerfiles) console.error("[analitica] profiles:", errPerfiles.message);
  const perfiles = (perfilesData ?? []) as Perfil[];
  const ids = perfiles.map((p) => p.id);

  // ── Qué usuarios han hecho algo, y cuántas cosas ──
  const acciones = new Map<string, number>();
  if (ids.length) {
    const filas = await Promise.all(
      ACTIVACION.map((t) => admin.from(t).select("user_id").in("user_id", ids)),
    );
    for (const { data } of filas) {
      for (const f of (data ?? []) as { user_id: string }[]) acciones.set(f.user_id, (acciones.get(f.user_id) ?? 0) + 1);
    }
  }

  // ── Registros, activación y Premium ──
  const registros: Comparada = {
    ahora: perfiles.filter((p) => dentro(p.created_at, desde, ahora)).length,
    antes: perfiles.filter((p) => dentro(p.created_at, desdeAntes, desde)).length,
  };
  const registradosAhora = perfiles.filter((p) => dentro(p.created_at, desde, ahora));
  const activados = registradosAhora.filter((p) => acciones.has(p.id)).length;

  const activos = perfiles.filter((p) => p.role === "premium");
  const altas: Comparada = {
    ahora: perfiles.filter((p) => dentro(p.premium_since, desde, ahora)).length,
    antes: perfiles.filter((p) => dentro(p.premium_since, desdeAntes, desde)).length,
  };
  // Baja: quien tuvo Premium y ya no lo tiene; su fecha, el fin de su último periodo pagado.
  const exPremium = perfiles.filter((p) => p.role === "free" && p.premium_since);
  const bajas: Comparada = {
    ahora: exPremium.filter((p) => dentro(p.subscription_current_period_end, desde, ahora)).length,
    antes: exPremium.filter((p) => dentro(p.subscription_current_period_end, desdeAntes, desde)).length,
  };
  const cancelaciones = activos.filter((p) => p.subscription_cancel_at_period_end).length;

  // ── Cursos: inscritos y certificados de cada uno, desde siempre ──
  const porCurso = new Map<string, { inscritos: number; certificados: number }>();
  for (const i of (inscripciones ?? []) as { curso_id: string }[]) {
    const c = porCurso.get(i.curso_id) ?? { inscritos: 0, certificados: 0 };
    c.inscritos++;
    porCurso.set(i.curso_id, c);
  }
  for (const i of (certificados ?? []) as { curso_id: string }[]) {
    const c = porCurso.get(i.curso_id) ?? { inscritos: 0, certificados: 0 };
    c.certificados++;
    porCurso.set(i.curso_id, c);
  }
  const tablaCursos = ((cursos ?? []) as { id: string; titulo: string; published: boolean }[])
    .filter((c) => c.published)
    .map((c) => ({ titulo: c.titulo, ...(porCurso.get(c.id) ?? { inscritos: 0, certificados: 0 }) }))
    .sort((a, b) => b.inscritos - a.inscritos);

  // ── Los días del gráfico, con los que no tuvieron visitas a cero ──
  const porDia = new Map(actual.por_dia.map((d) => [d.dia, d]));
  const serie = diasDelPeriodo(dias, ahora).map((dia) => porDia.get(dia) ?? { dia, visitantes: 0, vistas: 0 });

  // ── Usuarios: los 30 últimos registrados, con su 2FA ──
  const ultimos = perfiles.slice(0, 30);
  const dosPasos = await Promise.all(
    ultimos.map(async (p) => {
      const { data } = await admin.auth.admin.mfa.listFactors({ userId: p.id });
      return (data?.factors ?? []).some((f) => f.status === "verified");
    }),
  );
  const usuarios: UsuarioFila[] = ultimos.map((p, i) => ({ ...p, acciones: acciones.get(p.id) ?? 0, dosPasos: dosPasos[i] }));

  return {
    dias,
    serie,
    trafico: actual,
    visitas: { ahora: actual.visitas, antes: anterior.visitas } satisfies Comparada,
    vistas: { ahora: actual.vistas, antes: anterior.vistas } satisfies Comparada,
    registros,
    activados,
    altas,
    bajas,
    uso,
    cursos: tablaCursos,
    premium: {
      activos: activos.length,
      mrr: activos.length * PREMIUM_PRICE_EUR,
      cancelaciones,
    },
    totalUsuarios: perfiles.length,
    usuarios,
  };
}

export type Analitica = Awaited<ReturnType<typeof cargarAnalitica>>;
