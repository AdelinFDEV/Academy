import { createAdminClient } from "@/lib/supabase/admin";
import { todasLasFilas } from "@/lib/supabase/todasLasFilas";
import { cargarBalances, cargarObjetivos, premiumEstimadoPorDia } from "@/lib/objetivosServidor";
import { diaRumania, hoyISO, type Nota } from "@/lib/objetivos";
import SeccionDiario from "./SeccionDiario";
import FaltaSql from "../FaltaSql";

export const dynamic = "force-dynamic";

/** Fuera del componente: leer la hora durante el render es impuro (react-hooks/purity). */
function haceTreceSemanas(): string {
  return new Date(Date.now() - 13 * 7 * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Pestaña Diario: escribir y analizar cómo te sientes con el proyecto.
 *
 * Se leen todas las notas (hasta 2.000) porque el análisis las necesita
 * enteras: un año escribiendo a diario son 365 filas de texto, nada.
 */
export default async function DiarioPage() {
  const admin = createAdminClient();
  // Lo publicado en las últimas 13 semanas, para cruzarlo con el ánimo
  // («¿me siento mejor las semanas que publico?»).
  const desde = haceTreceSemanas();
  const hoy = hoyISO();
  const [{ objetivos, faltaSql }, notasRes, entradasRes, videosRes, balancesHoy, premiumHoy] = await Promise.all([
    cargarObjetivos(admin),
    todasLasFilas((a, b) =>
      admin.from("diario_notas").select("*").order("fecha", { ascending: false }).order("created_at", { ascending: false }).order("id").range(a, b)
    ),
    admin.from("posts").select("created_at").eq("published", true).gte("created_at", desde),
    admin.from("content_announcements").select("announced_at").eq("kind", "video").gte("announced_at", desde),
    cargarBalances(admin, hoy, hoy),
    premiumEstimadoPorDia(admin, hoy, hoy),
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

  const publicaciones = [
    ...(entradasRes.data ?? []).map((p) => diaRumania(p.created_at)),
    ...(videosRes.data ?? []).map((v) => diaRumania(v.announced_at)),
  ];

  return (
    <SeccionDiario
      hoy={hoy}
      objetivos={objetivos}
      notas={notas}
      publicaciones={publicaciones}
      urlsFotos={urlsFotos}
      balanceHoy={balancesHoy[hoy]}
      premiumHoy={premiumHoy[hoy] ?? 0}
    />
  );
}
