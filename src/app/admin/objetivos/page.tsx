import { createAdminClient } from "@/lib/supabase/admin";
import { cargarObjetivos } from "@/lib/objetivosServidor";
import { hoyISO } from "@/lib/objetivos";
import SeccionObjetivos from "./SeccionObjetivos";
import FaltaSql from "./FaltaSql";

export const dynamic = "force-dynamic";

/**
 * Pestaña Objetivos. Todo se lee con la clave de servicio: las tablas no
 * tienen ninguna policy (scripts/create-objetivos.sql), y quien llega aquí ya
 * pasó por el layout de /admin, que exige rol admin.
 */
export default async function ObjetivosPage() {
  const { objetivos, faltaSql } = await cargarObjetivos(createAdminClient());
  if (faltaSql) return <FaltaSql />;
  return <SeccionObjetivos hoy={hoyISO()} objetivos={objetivos} />;
}
