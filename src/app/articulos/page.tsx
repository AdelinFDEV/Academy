import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Footer from "@/components/Footer";
import Icon from "@/components/Icon";
import ArticulosClient from "./ArticulosClient";
import LogoutButton from "@/components/LogoutButton";
import BlogMobileMenu from "@/components/BlogMobileMenu";
import NavHerramientasDropdown from "@/components/NavHerramientasDropdown";
import NavArticulosDropdown from "@/components/NavArticulosDropdown";
import NavEducacionDropdown from "@/components/NavEducacionDropdown";

export const metadata: Metadata = {
  title: "Artículos | AdelinBTC Academy",
  description: "Todos los análisis, guías y publicaciones de AdelinBTC Academy.",
};

export default async function ArticulosPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const profile = user ? (await supabase.from("profiles").select("full_name, role").eq("id", user.id).single()).data : null;
  const role = profile?.role ?? "free";
  const isPremium = role === "premium" || role === "admin";
  const isAdmin = role === "admin";
  const userName = profile?.full_name || user?.email?.split("@")[0] || "Usuario";

  const [{ data: posts }, { data: categories }] = await Promise.all([
    supabase
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

      <nav className="blog-nav">
        <Link href="/" className="blog-brand">adelin<span>btc</span></Link>
        <div className="blog-nav-links">
          <NavArticulosDropdown />
          <NavEducacionDropdown />
          <NavHerramientasDropdown user={!!user} isPremium={isPremium} />
          {user ? (
            <>
              <Link href="/dashboard" className="btn-nav-link btn-nav-link--dashboard">Academia</Link>
              {isAdmin && <Link href="/admin" className="btn-nav-link">Admin</Link>}
              <div className="blog-nav-user">
                <span className="blog-nav-user-name">{userName}</span>
                <span className={`blog-nav-user-role${isPremium ? " premium" : ""}`}>{isAdmin ? "Admin" : isPremium ? "Premium" : "Free"}</span>
              </div>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="btn-nav-link">Iniciar sesión</Link>
              <Link href="/register" className="btn-nav-cta">Registrarse</Link>
            </>
          )}
        </div>
        <BlogMobileMenu user={!!user} isPremium={isPremium} userName={user ? userName : undefined} isAdmin={isAdmin} />
      </nav>

      <main className="articulos-page">
        <div className="articulos-layout">
          <ArticulosClient
            posts={(posts ?? []) as any}
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
