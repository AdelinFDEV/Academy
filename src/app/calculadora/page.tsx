import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";
import BlogMobileMenu from "@/components/BlogMobileMenu";
import NavArticulosDropdown from "@/components/NavArticulosDropdown";
import NavEducacionDropdown from "@/components/NavEducacionDropdown";
import NavHerramientasDropdown from "@/components/NavHerramientasDropdown";
import LogoutButton from "@/components/LogoutButton";
import CalculadoraClient from "./CalculadoraClient";

export const metadata: Metadata = {
  title: "Calculadora de Precio | AdelinBTC Academy",
  description: "Calcula a qué precio llegaría tu token si alcanzara el Market Cap de Bitcoin, Ethereum o Solana en tiempo real.",
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
        <div className="blog-nav-links">
          <NavArticulosDropdown />
          <NavEducacionDropdown />
          <NavHerramientasDropdown user={true} isPremium={isPremium} />
          <Link href="/dashboard" className="btn-nav-link btn-nav-link--dashboard">Academia</Link>
          {isAdmin && <Link href="/admin" className="btn-nav-link">Admin</Link>}
          <div className="blog-nav-user">
            <span className="blog-nav-user-name">{userName}</span>
            <span className={`blog-nav-user-role${isPremium ? " premium" : ""}`}>
              {isAdmin ? "Admin" : isPremium ? "Premium" : "Free"}
            </span>
          </div>
          <LogoutButton />
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
