import { createAdminClient } from "@/lib/supabase/admin";
import { todasLasFilas } from "@/lib/supabase/todasLasFilas";
import { cargarBalances, cargarObjetivos } from "@/lib/objetivosServidor";
import { hoyISO, sumarDiasISO, type Intencion, type Nota, type Productividad } from "@/lib/objetivos";
import SeccionDiario from "./SeccionDiario";
import FaltaSql from "../FaltaSql";

export const dynamic = "force-dynamic";

/**
 * Pestaña Diario: un sitio tranquilo para escribir, con tus intenciones de la
 * semana y el mes al lado, y el análisis de tus sensaciones en su propia vista.
 *
 * Se leen todas las notas porque el análisis las necesita enteras, desde la
 * primera: es lo que deja ver cómo has cambiado en uno o varios años.
 */
export default async function DiarioPage({ searchParams }: { searchParams: Promise<{ nota?: string }> }) {
  const { nota: notaPedida } = await searchParams;
  const admin = createAdminClient();
  const hoy = hoyISO();
  const lunes = sumarDiasISO(hoy, -((new Date(`${hoy}T00:00:00Z`).getUTCDay() + 6) % 7));
  const primeroMes = `${hoy.slice(0, 7)}-01`;
  const [{ objetivos, faltaSql }, notasRes, balancesHoy, intencionesRes, diasRes] = await Promise.all([
    cargarObjetivos(admin),
    todasLasFilas((a, b) =>
      admin.from("diario_notas").select("*").order("fecha", { ascending: false }).order("created_at", { ascending: false }).order("id").range(a, b)
    ),
    cargarBalances(admin, hoy, hoy),
    // Las de esta semana y las de este mes. Sin la tabla (SQL sin lanzar), lista vacía.
    admin
      .from("diario_intenciones")
      .select("id, texto, horizonte, desde, hecha")
      .or(`and(horizonte.eq.semana,desde.eq.${lunes}),and(horizonte.eq.mes,desde.eq.${primeroMes})`)
      .order("created_at"),
    // Cómo fue cada día (el cierre), para cruzarlo con el ánimo en «Cómo me siento».
    todasLasFilas((a, b) =>
      admin.from("dias_balance").select("fecha, productividad").not("productividad", "is", null).order("fecha").range(a, b)
    ),
  ]);
  if (faltaSql) return <FaltaSql />;

  // Las fotos viven en un bucket PRIVADO: se enseñan con enlaces firmados que
  // caducan en una hora, pedidos todos de una vez.
  const notas = notasRes as Nota[];
  const rutas = notas.flatMap((n) => n.fotos ?? []);
  const urlsFotos: Record<string, string> = {};
  if (rutas.length) {
    const { data: firmadas } = await admin.storage.from("diario").createSignedUrls(rutas, 3600);
    for (const f of firmadas ?? []) if (f.path && f.signedUrl) urlsFotos[f.path] = f.signedUrl;
  }

  const productividad: Record<string, Productividad> = {};
  for (const d of diasRes) productividad[String(d.fecha)] = d.productividad as Productividad;

  return (
    <SeccionDiario
      hoy={hoy}
      objetivos={objetivos}
      notas={notas}
      urlsFotos={urlsFotos}
      balanceHoy={balancesHoy[hoy]}
      intenciones={(intencionesRes.data ?? []) as Intencion[]}
      faltaIntenciones={intencionesRes.error?.code === "PGRST205"}
      lunes={lunes}
      productividad={productividad}
      notaInicial={notas.some((n) => n.id === notaPedida) ? notaPedida : undefined}
    />
  );
}
