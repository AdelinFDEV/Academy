import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import PortfolioClient from "@/components/PortfolioClient";
import DcaClient from "@/components/DcaClient";
import PortfoliosTabs from "@/components/PortfoliosTabs";
import { precioBitcoin, type CompraDCA } from "@/lib/dca";
import DisclaimerRiesgo from "@/components/DisclaimerRiesgo";
import { IconoPortfolio } from "@/components/IconosAnimados";
import "./portfolio.css";

export const metadata: Metadata = {
  title: "Portfolio Adelin",
  description:
    "Sigue en tiempo real el portfolio de AdelinBTC. Precio de compra, rentabilidad actual y evolución de cada posición.",
};

/**
 * La herramienta Portfolio Adelin, para Premium y Admin.
 *
 * Rehecha el 04-11-2026: una cabecera propia con el icono animado de la pieza,
 * el conmutador de carteras y cada cartera con sus cifras, su gráfico y su
 * tabla. Los estilos viven en `./portfolio.css`, que solo carga esta página.
 */
export default async function PortfolioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let role = "anon";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = profile?.role ?? "free";
  }

  const isPremium = role === "premium" || role === "admin";
  const isAdmin = role === "admin";

  // Free and unauthenticated users must not see portfolio data
  if (!isPremium) redirect("/premium");

  // Las dos carteras y el precio de BTC, en paralelo: son consultas
  // independientes y encadenarlas solo suma espera.
  const [{ data: positions }, { data: compras }, precioBtc] = await Promise.all([
    supabase.from("portfolio_positions").select("*").order("buy_date", { ascending: true }),
    supabase.from("dca_compras").select("*").order("fecha", { ascending: true }),
    precioBitcoin(),
  ]);

  return (
    <div className="blog-page">
      <div className="bg-ambient" />

      <SiteNav user={!!user} isPremium={isPremium} isAdmin={isAdmin} />

      <main className="blog-main pv">
        <header className="pv-cabecera">
          <span className="pv-cabecera-icono" aria-hidden="true"><IconoPortfolio size={26} /></span>
          <div>
            <span className="pv-cabecera-sello">Premium · Cartera real</span>
            <h1 className="pv-titulo">Portfolio Adelin</h1>
            <p className="pv-subtitulo">
              Mis posiciones reales, con su precio de entrada y su rentabilidad al momento.
              También las que van en pérdidas.
            </p>
          </div>
        </header>

        <PortfoliosTabs
          spot={<PortfolioClient initialPositions={positions ?? []} isAdmin={isAdmin} />}
          dca={
            <DcaClient
              compras={(compras ?? []) as CompraDCA[]}
              precioInicial={precioBtc}
              isAdmin={isAdmin}
            />
          }
        />

        {/* El descargo va DEBAJO de las posiciones, no encima: aquí es donde
            alguien acaba de ver qué compro y a qué precio, y es el momento en
            que hay que dejar claro que no es una recomendación. Es el mismo
            componente que la ficha pública, para que no digan cosas distintas. */}
        <DisclaimerRiesgo variante="portfolio" />
      </main>

      <Footer />
    </div>
  );
}
