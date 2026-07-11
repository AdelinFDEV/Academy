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

  return (
    <main className="dashboard-main">
      <RiskCalculatorClient />
    </main>
  );
}
