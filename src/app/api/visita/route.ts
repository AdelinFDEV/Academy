import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ipDe } from "@/lib/rate-limit";
import { SITE_URL } from "@/lib/site";
import { canalDe, codigoVisitante, corto, dispositivoDe, esBot, sistemaDe } from "@/lib/visitas";

export const runtime = "nodejs";

const ORIGEN_PROPIO = new URL(SITE_URL).origin;
const HOST_PROPIO = new URL(SITE_URL).hostname;

/**
 * Registra una página vista (tabla `visitas`). La llama `RegistroVisita`, en el
 * layout raíz, una vez por página. Siempre responde 204: el visitante no tiene
 * nada que esperar de aquí, y un fallo no debe verse en la web.
 *
 * Lo que NO cuenta, por este orden:
 *  1. Nada que no sea producción. En local y en las vistas previas de Vercel
 *     la base de datos es la misma que la de verdad: sin esto, cada prueba
 *     ensuciaría las cifras.
 *  2. Peticiones que no salen de la propia web (cabecera `Origin`): nadie
 *     puede inflar las visitas desde otra página o con un script suelto.
 *  3. Robots y herramientas, por su navegador.
 *  4. /admin y /api.
 *  5. El admin. Con sesión no cuenta nunca; y al verlo, su código de hoy se
 *     apunta en `visitas_excluidas` y se borra lo que hubiera dejado antes de
 *     iniciar sesión, así que ese navegador no cuenta en todo el día.
 */
export async function POST(request: NextRequest) {
  const nada = new NextResponse(null, { status: 204 });

  if (process.env.VERCEL_ENV !== "production") return nada;
  if (request.headers.get("origin") !== ORIGEN_PROPIO) return nada;

  const ua = request.headers.get("user-agent") ?? "";
  if (esBot(ua)) return nada;

  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = (await request.json()) as Record<string, unknown>;
  } catch {
    return nada;
  }

  const ruta = corto(cuerpo.ruta, 200)?.split(/[?#]/)[0];
  if (!ruta || !ruta.startsWith("/") || ruta.startsWith("/admin") || ruta.startsWith("/api")) return nada;

  const visitante = codigoVisitante(ipDe(request.headers), ua);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();

  if (user) {
    const { data: perfil } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (perfil?.role === "admin") {
      const { error } = await admin.rpc("visita_excluir", { p_visitante: visitante });
      if (error) console.error("[visita] No se pudo excluir al admin:", error.code);
      return nada;
    }
  }

  // El origen solo vale en la entrada, y un referente de la propia web no es un origen.
  const entrada = cuerpo.entrada === true;
  let referente = entrada ? corto(cuerpo.referente, 120)?.toLowerCase() ?? null : null;
  if (referente && (referente === HOST_PROPIO || referente.endsWith(`.${HOST_PROPIO}`))) referente = null;
  const utmSource = entrada ? corto(cuerpo.utm_source, 60) : null;

  const { error } = await admin.rpc("visita_registrar", {
    p_ruta: ruta.length > 1 ? ruta.replace(/\/+$/, "") : ruta,
    p_visitante: visitante,
    p_user: user?.id ?? null,
    p_entrada: entrada,
    p_canal: entrada ? canalDe(referente, utmSource) : null,
    p_referente: referente,
    p_utm_source: utmSource,
    p_utm_medium: entrada ? corto(cuerpo.utm_medium, 60) : null,
    p_utm_campaign: entrada ? corto(cuerpo.utm_campaign, 80) : null,
    p_pais: corto(request.headers.get("x-vercel-ip-country"), 2)?.toUpperCase() ?? null,
    p_dispositivo: dispositivoDe(ua),
    p_sistema: sistemaDe(ua),
  });
  if (error) console.error("[visita] No se pudo guardar:", error.code);

  return nada;
}
