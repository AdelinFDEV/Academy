import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TradingJournal from "@/components/TradingJournal";

export const metadata: Metadata = {
  title: "Diario de Trading | AdelinBTC Academy",
  description: "Registra, analiza y mejora tus operaciones de trading.",
};

export default async function TradingPage() {
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
  if (!isPremium) redirect("/dashboard");

  const { data: trades } = await supabase
    .from("trades")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: true });

  const name = profile?.full_name || user.email?.split("@")[0] || "Trader";

  return (
    <main className="dashboard-main">
      <TradingJournal initialTrades={trades ?? []} userName={name} />
    </main>
  );
}
