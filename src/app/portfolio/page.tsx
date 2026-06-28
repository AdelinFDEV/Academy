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
import PortfolioClient from "@/components/PortfolioClient";

export const metadata: Metadata = {
  title: "Portfolio Spot | AdelinBTC Academy",
  description:
    "Sigue en tiempo real el portfolio de AdelinBTC. Precio de compra, rentabilidad actual y evolución de cada posición.",
};

export default async function PortfolioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let role = "anon";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = profile?.role ?? "free";
  }

  const isPremium = role === "premium" || role === "admin";
  const isAdmin = role === "admin";

  const { data: positions } = await supabase
    .from("portfolio_positions")
    .select("*")
    .order("buy_date", { ascending: true });

  return (
    <div className="blog-page">
      <div className="bg-ambient" />

      <nav className="blog-nav">
        <Link href="/" className="blog-brand">
          adelin<span>btc</span>
        </Link>
        <LiveCounter />
        <div className="blog-nav-links">
          <NavArticulosDropdown />
          <NavEducacionDropdown />
          <NavHerramientasDropdown user={!!user} isPremium={isPremium} />
          {user ? (
            <>
              <Link href="/dashboard" className="btn-nav-link btn-nav-link--dashboard">
                Academia
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="btn-nav-login">Iniciar sesión</Link>
              <Link href="/register" className="btn-nav-register">Registrarte</Link>
            </>
          )}
        </div>
        <BlogMobileMenu user={!!user} isPremium={isPremium} />
      </nav>

      <main className="blog-main">
        <PortfolioClient
          initialPositions={positions ?? []}
          isPremium={isPremium}
          isAdmin={isAdmin}
          isLoggedIn={!!user}
        />
      </main>

      <Footer />
    </div>
  );
}
