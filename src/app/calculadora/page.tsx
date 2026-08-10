import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import CalculadoraClient from "./CalculadoraClient";

export const metadata: Metadata = {
  title: "Predicción de Precio",
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

      <SiteNav user={true} isPremium={isPremium} userName={userName} isAdmin={isAdmin} />

      <main className="blog-main">
        <CalculadoraClient />
      </main>

      <Footer />
    </div>
  );
}
