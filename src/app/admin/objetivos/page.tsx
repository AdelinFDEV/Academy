import { createAdminClient } from "@/lib/supabase/admin";
import { cargarDineroPorMes, cargarObjetivos } from "@/lib/objetivosServidor";
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
 * Arriba, la meta de 1.000 € al mes, con todo lo ingresado según el libro de
 * dinero (no solo Premium).
 */
export default async function ObjetivosPage() {
  const admin = createAdminClient();
  const hoy = hoyISO();
  const [{ objetivos, faltaSql }, dineroMeses] = await Promise.all([cargarObjetivos(admin), cargarDineroPorMes(admin)]);
  return (
    <>
      <MetaIngresos meses={dineroMeses} hoy={hoy} />
      {faltaSql ? <FaltaSql /> : <SeccionObjetivos hoy={hoy} objetivos={objetivos} />}
    </>
  );
}
