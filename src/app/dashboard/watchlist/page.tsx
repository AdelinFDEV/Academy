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

  const { data: coins } = await supabase
    .from("watchlist")
    .select("id, coin_id, coin_symbol, coin_name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return (
    <main className="dashboard-main">
      <WatchlistClient initialCoins={coins ?? []} />
    </main>
  );
}
