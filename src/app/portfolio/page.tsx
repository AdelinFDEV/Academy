import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";
import BlogMobileMenu from "@/components/BlogMobileMenu";
import LiveCounter from "@/components/LiveCounter";
import GuideSearch from "@/components/GuideSearch";
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

  // Free and unauthenticated users must not see portfolio data
  if (!isPremium) redirect("/premium");

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
        <div className="blog-nav-center">
          <LiveCounter />
          <span className="blog-nav-divider" aria-hidden="true" />
          <GuideSearch />
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
