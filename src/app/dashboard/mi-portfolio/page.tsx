import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MiPortfolioClient, { type Tx } from "./MiPortfolioClient";

export const metadata: Metadata = {
  title: "Mi Portfolio",
  description: "Registra tus compras y ventas de criptomonedas y sigue tu precio medio, valor actual y ganancia o pérdida (realizada y no realizada) en tiempo real.",
};

export default async function MiPortfolioPage() {
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
  if (!isPremium) redirect("/premium");

  const { data: txs } = await supabase
    .from("portfolio_transactions")
    .select("id, coin_id, coin_symbol, coin_name, type, quantity, price, tx_date, created_at")
    .eq("user_id", user.id)
    .order("tx_date", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <main className="dashboard-main">
      <MiPortfolioClient initialTxs={(txs ?? []) as Tx[]} />
    </main>
  );
}
