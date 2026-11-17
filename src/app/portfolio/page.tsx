import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import PortfolioClient from "@/components/PortfolioClient";
import DcaClient from "@/components/DcaClient";
import PortfoliosTabs from "@/components/PortfoliosTabs";
import UltimosMovimientos from "@/components/UltimosMovimientos";
import type { Movimiento } from "@/lib/portfolio-movimientos";
import { precioBitcoin, type CompraDCA } from "@/lib/dca";
import DisclaimerRiesgo from "@/components/DisclaimerRiesgo";
import { IconoPortfolio } from "@/components/IconosAnimados";
import "./portfolio.css";
import "./portfolio-spot.css";
import "./portfolio-dca.css";

export const metadata: Metadata = {
  title: "Portfolio Adelin",
  description:
    "Sigue en tiempo real el portfolio de AdelinBTC. Precio de compra, rentabilidad actual y evolución de cada posición.",
};

/**
 * La herramienta Portfolio Adelin, para Premium y Admin.
 *
 * Rehecha el 17-11-2026 con el estilo «Cuaderno de estudio» (ESTILO.md): la
 * cartera real presentada como un cuaderno de inversión, en menta (el color
 * del Portfolio). Cabecera con su titular y su nota a mano, las dos carteras
 * como dos teclas, y en cada una la rentabilidad en grande, las cifras en
 * fichas de papel, las posiciones o compras como filas de cuaderno y el panel
 * de admin con teclas y campos del sistema.
 *
 * Los estilos viven en `./portfolio.css` (la página y lo común),
 * `./portfolio-spot.css` (la cartera spot y sus movimientos) y
 * `./portfolio-dca.css` (el DCA y su gráfico). Solo los carga esta página.
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
  const [{ data: positions }, { data: compras }, precioBtc, { data: movimientos }] = await Promise.all([
    supabase.from("portfolio_positions").select("*").order("buy_date", { ascending: true }),
    supabase.from("dca_compras").select("*").order("fecha", { ascending: true }),
    precioBitcoin(),
    // Los tres últimos movimientos del spot de altcoins (nunca del DCA). Si la
    // tabla aún no existe, `data` llega null y el bloque sale vacío.
    supabase
      .from("portfolio_movimientos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  return (
    <div className="blog-page pv-pagina">
      <SiteNav user={!!user} isPremium={isPremium} isAdmin={isAdmin} />

      <main className="pv">
        <header className="pv-cab">
          <div className="pv-cab-texto">
            <p className="pv-cab-chips">
              <span className="pv-sello">Premium · Cartera real</span>
              <span className="pv-directo">
                <span className="pv-latido" aria-hidden="true" />
                En directo
              </span>
            </p>
            <h1 className="pv-titulo">
              Portfolio <span className="fluor">Adelin</span>
            </h1>
            <p className="pv-lead">
              Mis posiciones reales, con su precio de entrada y su rentabilidad al momento.
            </p>
            <p className="pv-mano">también enseño las que van en pérdidas</p>
          </div>

          {/* El objeto de la cabecera: el icono de la pieza en su tecla menta,
              sobre un par de hojas, y la pegatina de «cartera real». */}
          <div className="pv-cab-dibujo" aria-hidden="true">
            <span className="pv-cab-hoja pv-cab-hoja--1" />
            <span className="pv-cab-hoja pv-cab-hoja--2" />
            <span className="pv-cab-icono"><IconoPortfolio size={44} /></span>
            <span className="pv-pegatina">Cartera<br />real</span>
          </div>
        </header>

        <PortfoliosTabs
          spot={
            <PortfolioClient
              initialPositions={positions ?? []}
              isAdmin={isAdmin}
              registro={<UltimosMovimientos movimientos={(movimientos ?? []) as Movimiento[]} />}
            />
          }
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
            componente que la ficha pública, para que no digan cosas distintas;
            aquí se viste de aviso amarillo (portfolio.css). */}
        <DisclaimerRiesgo variante="portfolio" />
      </main>

      <Footer />
    </div>
  );
}
