import { createAdminClient } from "@/lib/supabase/admin";
import { cargarObjetivos } from "@/lib/objetivosServidor";
import { type Pieza } from "@/lib/objetivos";
import SeccionIdeas from "./SeccionIdeas";
import FaltaSql from "../FaltaSql";

export const dynamic = "force-dynamic";

/** Pestaña Ideas: el contenido que aún no tiene día. */
export default async function IdeasPage() {
  const admin = createAdminClient();
  const [{ objetivos, faltaSql }, ideasRes] = await Promise.all([
    cargarObjetivos(admin),
    admin.from("contenido_plan").select("*").is("fecha", null).order("created_at", { ascending: false }),
  ]);
  if (faltaSql) return <FaltaSql />;
  return <SeccionIdeas objetivos={objetivos} ideas={(ideasRes.data ?? []) as Pieza[]} />;
}
