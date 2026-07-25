import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import WatchlistClient from "./WatchlistClient";

export const metadata: Metadata = {
  title: "Watchlist | AdelinBTC Academy",
  description: "Sigue el precio de tus criptomonedas favoritas en tiempo real.",
};

export default async function WatchlistPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: coins }, { data: profile }] = await Promise.all([
    supabase
      .from("watchlist")
      .select("id, coin_id, coin_symbol, coin_name, amount, buy_price")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase.from("profiles").select("role").eq("id", user.id).single(),
  ]);

  const role = profile?.role ?? "free";
  const isPremium = role === "premium" || role === "admin";

  return (
    <main className="dashboard-main">
      <WatchlistClient initialCoins={coins ?? []} isPremium={isPremium} />
    </main>
  );
}
