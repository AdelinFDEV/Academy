import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Footer from "@/components/Footer";
import BlogMobileMenu from "@/components/BlogMobileMenu";
import LiveCounter from "@/components/LiveCounter";
import GuideSearch from "@/components/GuideSearch";
import GuiaMindMap from "@/components/GuiaMindMap";

export const metadata: Metadata = {
  title: "Guía para empezar | AdelinBTC Academy",
  description: "Los 4 pasos para empezar en crypto con criterio. Registro, exchange, redes y contenido.",
};

export default async function GuiaIniciacionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const profileData = user
    ? (await supabase.from("profiles").select("full_name, role").eq("id", user.id).single()).data
    : null;
  const role = profileData?.role ?? "free";
  const isPremium = role === "premium" || role === "admin";
  const isAdmin = role === "admin";
  const userName = profileData?.full_name || user?.email?.split("@")[0] || "Usuario";

  return (
    <div className="blog-page">
      <div className="bg-ambient" />

      {/* Nav */}
      <nav className="blog-nav">
        <Link href="/" className="blog-brand">adelin<span>btc</span></Link>
        <div className="blog-nav-center">
          <LiveCounter />
          <span className="blog-nav-divider" aria-hidden="true" />
          <GuideSearch />
        </div>
        <BlogMobileMenu user={!!user} isPremium={isPremium} userName={user ? userName : undefined} isAdmin={isAdmin} />
      </nav>

      {/* Cascade step-by-step */}
      <div className="guias-map-wrap">
        <GuiaMindMap />
      </div>

      <Footer />
    </div>
  );
}
