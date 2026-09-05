import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClientOpcional } from "@/lib/supabase/admin";
import Footer from "@/components/Footer";
import ArticulosClient, { type Post as ArticulosPost } from "./ArticulosClient";
import SiteNav from "@/components/SiteNav";

export const metadata: Metadata = {
  alternates: { canonical: "/articulos" },
  title: "Artículos y análisis de criptomonedas",
  description:
    "Actualizaciones de red, movimientos de mercado y fiscalidad cripto en España, explicados en lenguaje llano. Todo lo que se publica en AdelinBTC Academy.",
};

export default async function ArticulosPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const profile = user ? (await supabase.from("profiles").select("full_name, role").eq("id", user.id).single()).data : null;
  const role = profile?.role ?? "free";
  const isPremium = role === "premium" || role === "admin";
  const isAdmin = role === "admin";
  const userName = profile?.full_name || user?.email?.split("@")[0] || "Usuario";

  // Las entradas premium las esconde la policy de `posts`. Sin este lector
  // desaparecerían del listado en vez de salir con su candado, y nadie sabría
  // que existen. Aquí no se pide `content`: solo lo que ya se enseña.
  const lector = createAdminClientOpcional() ?? supabase;

  const [{ data: posts }, { data: categories }] = await Promise.all([
    lector
      .from("posts")
      .select("id, title, slug, excerpt, cover_image, is_premium, created_at, categories(name, slug)")
      .eq("published", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("categories")
      .select("name, slug")
      .order("name", { ascending: true }),
  ]);

  const postIds = posts?.map((p) => p.id) ?? [];
  const commentCountMap: Record<string, number> = {};
  if (postIds.length > 0) {
    const { data: cc } = await supabase
      .from("comments")
      .select("post_id")
      .in("post_id", postIds)
      .eq("approved", true);
    cc?.forEach((c) => {
      commentCountMap[c.post_id] = (commentCountMap[c.post_id] ?? 0) + 1;
    });
  }

  return (
    <div className="blog-page">
      <div className="bg-ambient" />

      <SiteNav user={!!user} isPremium={isPremium} userName={user ? userName : undefined} isAdmin={isAdmin} />

      <main className="articulos-page">
        {/* Esta página no tenía `h1`: para Google era un listado sin tema
            declarado. Va aquí, en el componente de servidor, para que esté en
            el HTML inicial y no dependa de que hidrate el cliente. */}
        <header className="articulos-header">
          <h1 className="articulos-title">Artículos y análisis de criptomonedas</h1>
          <p className="articulos-intro">
            Todo lo que se publica en la academia: actualizaciones de red, movimientos de mercado
            y fiscalidad cripto en España, explicado en lenguaje llano y sin dar por sabido nada.
          </p>
        </header>

        <div className="articulos-layout">
          <ArticulosClient
            posts={(posts ?? []) as unknown as ArticulosPost[]}
            categories={categories ?? []}
            commentCountMap={commentCountMap}
            isLoggedIn={!!user}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
