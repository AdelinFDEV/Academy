import { createAdminClient } from "@/lib/supabase/admin";
import { RANGOS, cargarCrecimiento, type Rango } from "@/lib/crecimiento";
import { cargarActividadMes } from "@/lib/actividadMes";
import { hoyISO } from "@/lib/objetivos";
import SeccionCrecimiento from "./SeccionCrecimiento";

export const dynamic = "force-dynamic";

/**
 * Pestaña Crecimiento: lo publicado en un mes y cómo crecen los canales
 * (miembros de Telegram y suscriptores de YouTube). El dinero tiene su propia
 * pestaña desde el 10-10-2026 (/admin/objetivos/dinero).
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
  const [datos, actividad] = await Promise.all([cargarCrecimiento(admin, rango), cargarActividadMes(admin, mes)]);
  return <SeccionCrecimiento datos={datos} rango={rango} actividad={actividad} />;
}
