import { createAdminClient } from "@/lib/supabase/admin";
import { RANGOS, cargarCrecimiento, type Rango } from "@/lib/crecimiento";
import { cargarDineroPorMes } from "@/lib/objetivosServidor";
import SeccionCrecimiento from "./SeccionCrecimiento";

export const dynamic = "force-dynamic";

/**
 * Pestaña Crecimiento: miembros de Telegram, suscriptores de YouTube y dinero
 * de Premium, con su evolución. Lee con la clave de servicio, detrás del
 * layout de /admin, que exige rol admin.
 */
export default async function CrecimientoPage({ searchParams }: { searchParams: Promise<{ rango?: string }> }) {
  const { rango: pedido } = await searchParams;
  const rango: Rango = pedido && pedido in RANGOS ? (pedido as Rango) : "90";
  const admin = createAdminClient();
  const [datos, dineroMeses] = await Promise.all([cargarCrecimiento(admin, rango), cargarDineroPorMes(admin)]);
  return <SeccionCrecimiento datos={datos} rango={rango} dineroMeses={dineroMeses} />;
}
