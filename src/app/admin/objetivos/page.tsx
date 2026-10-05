import { createAdminClient } from "@/lib/supabase/admin";
import { cargarObjetivos } from "@/lib/objetivosServidor";
import { hoyISO } from "@/lib/objetivos";
import SeccionObjetivos from "./SeccionObjetivos";
import MetaIngresos from "./MetaIngresos";
import FaltaSql from "./FaltaSql";

export const dynamic = "force-dynamic";

/**
 * Pestaña Objetivos. Todo se lee con la clave de servicio: las tablas no
 * tienen ninguna policy (scripts/create-objetivos.sql), y quien llega aquí ya
 * pasó por el layout de /admin, que exige rol admin.
 *
 * Arriba, la meta de ingresos recurrentes (MRR), que antes abría /admin.
 */
export default async function ObjetivosPage() {
  const admin = createAdminClient();
  const [{ objetivos, faltaSql }, registrados, premium] = await Promise.all([
    cargarObjetivos(admin),
    admin.from("profiles").select("id", { count: "exact", head: true }).neq("role", "admin"),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "premium"),
  ]);
  return (
    <>
      <MetaIngresos registrados={registrados.count ?? 0} premium={premium.count ?? 0} />
      {faltaSql ? <FaltaSql /> : <SeccionObjetivos hoy={hoyISO()} objetivos={objetivos} />}
    </>
  );
}
