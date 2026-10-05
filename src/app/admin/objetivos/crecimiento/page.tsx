import { createAdminClient } from "@/lib/supabase/admin";
import { RANGOS, cargarCrecimiento, type Rango } from "@/lib/crecimiento";
import { cargarDineroPorMes } from "@/lib/objetivosServidor";
import { cargarActividadMes } from "@/lib/actividadMes";
import { hoyISO } from "@/lib/objetivos";
import SeccionCrecimiento from "./SeccionCrecimiento";

export const dynamic = "force-dynamic";

/**
 * Pestaña Crecimiento: miembros de Telegram, suscriptores de YouTube y dinero
 * de Premium, con su evolución, y la actividad de un mes (lo publicado).
 * Abre en 30 días y en el mes actual. Lee con la clave de servicio, detrás del
 * layout de /admin, que exige rol admin.
 */
export default async function CrecimientoPage({ searchParams }: { searchParams: Promise<{ rango?: string; mes?: string }> }) {
  const { rango: pedido, mes: mesUrl } = await searchParams;
  const rango: Rango = pedido && pedido in RANGOS ? (pedido as Rango) : "30";
  const mesHoy = hoyISO().slice(0, 7);
  // Un mes válido y no futuro; si no, el actual.
  const mes = mesUrl && /^\d{4}-(0[1-9]|1[0-2])$/.test(mesUrl) && mesUrl <= mesHoy ? mesUrl : mesHoy;
  const admin = createAdminClient();
  const [datos, dineroMeses, actividad] = await Promise.all([
    cargarCrecimiento(admin, rango),
    cargarDineroPorMes(admin),
    cargarActividadMes(admin, mes),
  ]);
  return <SeccionCrecimiento datos={datos} rango={rango} dineroMeses={dineroMeses} actividad={actividad} />;
}
