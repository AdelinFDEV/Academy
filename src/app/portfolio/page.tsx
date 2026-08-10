import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import PortfolioClient from "@/components/PortfolioClient";

export const metadata: Metadata = {
  title: "Portfolio Spot",
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

      <SiteNav user={!!user} isPremium={isPremium} />

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
