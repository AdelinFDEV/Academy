import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ipDe } from "@/lib/rate-limit";
import { canalDe, codigoVisitante, corto, dispositivoDe, esBot, sistemaDe } from "@/lib/visitas";

export const runtime = "nodejs";

/**
 * Registra una página vista (tabla `visitas`). La llama `RegistroVisita`, en el
 * layout raíz, una vez por página. Siempre responde 204: el visitante no tiene
 * nada que esperar de aquí, y un fallo no debe verse en la web.
 *
 * No cuentan: robots, rutas de /admin y /api, ni las visitas del admin.
 */
export async function POST(request: NextRequest) {
  const nada = new NextResponse(null, { status: 204 });
  const ua = request.headers.get("user-agent") ?? "";
  if (esBot(ua)) return nada;

  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = (await request.json()) as Record<string, unknown>;
  } catch {
    return nada;
  }

  const ruta = corto(cuerpo.ruta, 200);
  if (!ruta || !ruta.startsWith("/") || ruta.startsWith("/admin") || ruta.startsWith("/api")) return nada;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();
  if (user) {
    const { data: perfil } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (perfil?.role === "admin") return nada;
  }

  const entrada = cuerpo.entrada === true;
  const referente = entrada ? corto(cuerpo.referente, 120) : null;
  const utmSource = entrada ? corto(cuerpo.utm_source, 60) : null;

  const { error } = await admin.from("visitas").insert({
    ruta: ruta.split(/[?#]/)[0],
    visitante: codigoVisitante(ipDe(request.headers), ua),
    user_id: user?.id ?? null,
    entrada,
    canal: entrada ? canalDe(referente, utmSource) : null,
    referente,
    utm_source: utmSource,
    utm_medium: entrada ? corto(cuerpo.utm_medium, 60) : null,
    utm_campaign: entrada ? corto(cuerpo.utm_campaign, 80) : null,
    pais: corto(request.headers.get("x-vercel-ip-country"), 2)?.toUpperCase() ?? null,
    dispositivo: dispositivoDe(ua),
    sistema: sistemaDe(ua),
  });
  if (error) console.error("[visita] No se pudo guardar:", error.code);

  return nada;
}
