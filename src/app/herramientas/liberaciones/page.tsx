import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";
import BlogMobileMenu from "@/components/BlogMobileMenu";
import LiveCounter from "@/components/LiveCounter";
import GuideSearch from "@/components/GuideSearch";
import LiberacionesClient from "./LiberacionesClient";

export const metadata: Metadata = {
  title: "Liberaciones de Tokens | AdelinBTC Academy",
  description: "Calendario de vesting y liberaciones de tokens cripto. Anticipa la presión vendedora con datos reales de ARB, ZK, STRK, SUI y más.",
};

export default async function LiberacionesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "free";
  const isPremium = role === "premium" || role === "admin";
  const isAdmin = role === "admin";
  const userName = profile?.full_name ?? user.email?.split("@")[0] ?? "Usuario";

  if (!isPremium) redirect("/premium");

  return (
    <div className="blog-page">
      <div className="bg-ambient" />

      <nav className="blog-nav">
        <Link href="/" className="blog-brand">adelin<span>btc</span></Link>
        <div className="blog-nav-center">
          <LiveCounter />
          <span className="blog-nav-divider" aria-hidden="true" />
          <GuideSearch />
        </div>
        <BlogMobileMenu user={true} isPremium={isPremium} userName={userName} isAdmin={isAdmin} />
      </nav>

      <main className="blog-main">
        <LiberacionesClient isPremium={isPremium} />
      </main>

      <Footer />
    </div>
  );
}
