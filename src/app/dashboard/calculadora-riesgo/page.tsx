import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RiskCalculatorClient from "./RiskCalculatorClient";

export const metadata: Metadata = {
  title: "Calculadora de Riesgo | AdelinBTC Academy",
  description: "Calcula el tamaño de tu posición según tu capital y el riesgo que asumes por operación.",
};

export default async function RiskCalculatorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "free";
  const isPremium = role === "premium" || role === "admin";

  // Herramienta exclusiva Premium: fuera de eso, al muro de precios.
  if (!isPremium) redirect("/premium");

  return (
    <main className="dashboard-main">
      <RiskCalculatorClient />
    </main>
  );
}
