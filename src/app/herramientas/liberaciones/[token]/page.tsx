import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";
import BlogMobileMenu from "@/components/BlogMobileMenu";
import LiveCounter from "@/components/LiveCounter";
import TokenDetailClient from "./TokenDetailClient";
import { TOKENS } from "../tokenData";

interface Props {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token: tokenId } = await params;
  const token = TOKENS.find(t => t.id === tokenId);
  if (!token) return { title: "Token no encontrado" };
  return {
    title: `${token.name} (${token.symbol}) Liberaciones de Tokens | AdelinBTC Academy`,
    description: `Calendario de vesting y liberaciones de ${token.name}. Analiza los unlocks mensuales, la distribución del supply y el impacto en el precio.`,
  };
}

export default async function TokenDetailPage({ params }: Props) {
  const { token: tokenId } = await params;
  const token = TOKENS.find(t => t.id === tokenId);
  if (!token) notFound();

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

  return (
    <div className="blog-page">
      <div className="bg-ambient" />

      <nav className="blog-nav">
        <Link href="/" className="blog-brand">adelin<span>btc</span></Link>
        <LiveCounter />
        <BlogMobileMenu user={true} isPremium={isPremium} userName={userName} isAdmin={isAdmin} />
      </nav>

      <main className="blog-main">
        <TokenDetailClient token={token} isPremium={isPremium} />
      </main>

      <Footer />
    </div>
  );
}
