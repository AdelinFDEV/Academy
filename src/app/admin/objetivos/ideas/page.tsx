import { createAdminClient } from "@/lib/supabase/admin";
import { todasLasFilas } from "@/lib/supabase/todasLasFilas";
import { type Idea } from "@/lib/objetivos";
import SeccionIdeas from "./SeccionIdeas";

export const dynamic = "force-dynamic";

/**
 * Pestaña Ideas: una columna por canal (YouTube, web, Telegram), cada una con
 * su campo para apuntar y un tick para tachar lo hecho. Sin día ni relación
 * con el calendario; si una idea llega a hacerse, se planea allí aparte.
 */
export default async function IdeasPage() {
  const admin = createAdminClient();
  const [ideas, prueba] = await Promise.all([
    todasLasFilas<Idea>((a, b) =>
      admin.from("ideas").select("id, texto, canal, hecha, created_at").order("created_at", { ascending: false }).order("id").range(a, b)
    ),
    // Sin la tabla o sin sus columnas (SQL sin lanzar), la pestaña lo dice en vez de salir vacía.
    admin.from("ideas").select("id, canal, hecha", { count: "exact", head: true }),
  ]);
  return <SeccionIdeas ideas={ideas} falta={["PGRST205", "42703", "PGRST204"].includes(prueba.error?.code ?? "")} />;
}
