import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Footer from "@/components/Footer";
import BlogMobileMenu from "@/components/BlogMobileMenu";
import NavArticulosDropdown from "@/components/NavArticulosDropdown";
import NavEducacionDropdown from "@/components/NavEducacionDropdown";
import NavHerramientasDropdown from "@/components/NavHerramientasDropdown";
import LogoutButton from "@/components/LogoutButton";
import LiveCounter from "@/components/LiveCounter";
import GuiaMindMap from "@/components/GuiaMindMap";

export const metadata: Metadata = {
  title: "Guía para empezar | AdelinBTC Academy",
  description: "Los 4 pasos para empezar en crypto con criterio. Registro, exchange, redes y contenido.",
};

export default async function GuiasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="blog-page">
      <div className="bg-ambient" />

      {/* Nav */}
      <nav className="blog-nav">
        <Link href="/" className="blog-brand">
          adelin<span>btc</span>
        </Link>
        <LiveCounter />
        <div className="blog-nav-links">
          <NavArticulosDropdown />
          <NavEducacionDropdown />
          <NavHerramientasDropdown user={!!user} />
          {user ? (
            <>
              <Link href="/dashboard" className="btn-nav-cta">Ir a la academia →</Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="btn-nav-login">Iniciar sesión</Link>
              <Link href="/register" className="btn-nav-register">Registrarte</Link>
            </>
          )}
        </div>
        <BlogMobileMenu user={!!user} />
      </nav>

      {/* Cascade step-by-step */}
      <div className="guias-map-wrap">
        <GuiaMindMap />
      </div>

      <Footer />
    </div>
  );
}
