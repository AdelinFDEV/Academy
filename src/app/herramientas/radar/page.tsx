import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import RadarClient from "./RadarClient";
import "./radar.css";

export const metadata: Metadata = {
  title: "Radar Diario",
  description: "Tu resumen diario del mercado: Bitcoin en 24h con máximo y mínimo, índice de miedo y codicia, eventos macro de EE. UU. y los mayores movimientos del día.",
};

export default async function RadarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Con `next`, para que tras iniciar sesión vuelva al radar y no al dashboard.
  if (!user) redirect("/login?next=/herramientas/radar");

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

      <SiteNav user={true} isPremium={isPremium} userName={userName} isAdmin={isAdmin} />

      <main className="blog-main">
        <RadarClient />
      </main>

      <Footer />
    </div>
  );
}
