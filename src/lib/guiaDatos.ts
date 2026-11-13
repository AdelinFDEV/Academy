import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { EstadoLector } from "@/components/GuiaAnuncio";

/**
 * Lo que toda guía necesita saber de quien la mira y de sus propios contadores
 * (13-11-2026). Antes cada guía repetía estas treinta líneas en su `page.tsx`.
 *
 * Nada de esto cambia el contenido: la guía se lee entera sin cuenta. Solo
 * decide tres cosas: la barra de arriba, si el quiz se puede hacer o invita a
 * registrarse, y qué versión de los anuncios ve.
 */
export async function datosDeGuia(slug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [perfil, likes, guardada, compartidos, miLike] = await Promise.all([
    user ? supabase.from("profiles").select("full_name, role").eq("id", user.id).single() : Promise.resolve({ data: null }),
    supabase.from("guide_likes").select("id", { count: "exact", head: true }).eq("guide_slug", slug),
    user ? supabase.from("guide_saves").select("id").eq("guide_slug", slug).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("guide_shares").select("id", { count: "exact", head: true }).eq("guide_slug", slug),
    user ? supabase.from("guide_likes").select("id").eq("guide_slug", slug).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  const role = perfil.data?.role ?? "free";
  const isPremium = role === "premium" || role === "admin";
  const isRegistered = !!user;
  const estado: EstadoLector = isPremium ? "premium" : isRegistered ? "cuenta" : "anonimo";

  return {
    /** Para `SiteNav`. */
    nav: {
      user: isRegistered,
      isPremium,
      isAdmin: role === "admin",
      userName: user ? perfil.data?.full_name || user.email?.split("@")[0] || "Usuario" : undefined,
    },
    isRegistered,
    /** Para `GuiaAnuncio`. */
    estado,
    /** Para `GuideInteractions`. */
    interacciones: {
      guideSlug: slug,
      initialLikes: likes.count ?? 0,
      initialLiked: !!miLike.data,
      initialSaved: !!guardada.data,
      initialShares: compartidos.count ?? 0,
      isLoggedIn: isRegistered,
    },
  };
}
