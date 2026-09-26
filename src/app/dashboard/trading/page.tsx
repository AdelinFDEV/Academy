import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import TradingJournal from "@/components/TradingJournal";
import { readDiarioLogros } from "@/lib/diarioLogros";
import "./trading.css";

export const metadata: Metadata = {
  title: "Diario de Trading",
  description: "Registra, analiza y mejora tus operaciones de trading.",
};

export default async function TradingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // `trading_starting_capital` no tiene GRANT SELECT para `authenticated` (y no
  // debería: la policy de profiles es USING(true), así que dárselo dejaría a
  // cualquier usuario leer el capital inicial de los demás). Se lee con el
  // cliente admin, ya verificada la identidad arriba con el cliente normal.
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, role, trading_starting_capital")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "free";
  const isPremium = role === "premium" || role === "admin";
  if (!isPremium) redirect("/dashboard");

  const [{ data: trades }, logros] = await Promise.all([
    supabase
      .from("trades")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: true })
      .order("created_at", { ascending: true }),
    readDiarioLogros(supabase, user.id),
  ]);

  const name = profile?.full_name || user.email?.split("@")[0] || "Trader";

  return (
    <main className="dashboard-main">
      <TradingJournal
        initialTrades={trades ?? []}
        userName={name}
        initialCapital={profile?.trading_starting_capital ?? null}
        initialLogros={logros}
      />
    </main>
  );
}
