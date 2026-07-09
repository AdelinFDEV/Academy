import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";
import BlogMobileMenu from "@/components/BlogMobileMenu";
import CalculadoraClient from "./CalculadoraClient";
import LiveCounter from "@/components/LiveCounter";
import GuideSearch from "@/components/GuideSearch";

export const metadata: Metadata = {
  title: "Predicción de Precio | AdelinBTC Academy",
  description: "Calcula qué Market Cap necesita un token para alcanzar tu precio objetivo. Compara con Bitcoin, Ethereum y Solana en tiempo real.",
};

export default async function CalculadoraPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const role      = profile?.role ?? "free";
  const isPremium = role === "premium" || role === "admin";
  const isAdmin   = role === "admin";
  const userName  = profile?.full_name ?? user.email?.split("@")[0] ?? "Usuario";

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
        <CalculadoraClient />
      </main>

      <Footer />
    </div>
  );
}
