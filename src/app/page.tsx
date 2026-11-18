import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import PremiumHome from "@/components/PremiumHome";
import GuidesHomeSection from "@/components/GuidesHomeSection";
import CursosHome from "@/components/CursosHome";
import RecursosGratisHome from "@/components/RecursosGratisHome";
import ForoEnPortada from "@/components/foro/ForoEnPortada";
import type { ResumenHero } from "@/lib/portfolio-publico";
import HeroCuaderno from "@/components/HeroCuaderno";
import YouTubeLatestSection from "@/components/YouTubeLatestSection";
import { resumenPortfolioPublico } from "@/lib/portfolio-publico";
import { cursosPublicados } from "@/lib/cursos";
import { guiasVisibles } from "@/lib/guiasVisibles";
import { GLOSARIO_CON_PAGINA } from "@/lib/glosario";
import "./home.css";

/**
 * La portada hereda del layout raíz el título, la descripción y el OpenGraph;
 * aquí solo se declara la canónica.
 *
 * Va en la página y no en el layout raíz a propósito: en Next.js los metadatos
 * del layout los heredan todas las rutas hijas, así que una canónica ahí le
 * pondría "/" a media web.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const supabase = await createClient();

  // YouTube no se pide aquí: va a youtube.com (lento y poco fiable) y se
  // resuelve en su propio <Suspense> más abajo, sin frenar la página.
  //
  // La cartera pública no depende de quién mire: se pide A LA VEZ que la
  // sesión, no después (antes eran tres esperas en fila: sesión, perfil y
  // cartera). La cartera tiene su propia caché; aquí solo se deja de esperar.
  const [{ data: { user } }, resumenCompleto, cursos, guias] = await Promise.all([
    supabase.auth.getUser(),
    resumenPortfolioPublico(),
    cursosPublicados(),
    // Solo para contarlas en el índice del hero; la sección de guías las
    // vuelve a pedir, y la consulta de las publicadas va con `cache`.
    guiasVisibles(),
  ]);

  const profileRes = user
    ? await supabase.from("profiles").select("role, full_name").eq("id", user.id).single()
    : null;
  const profileData = profileRes?.data ?? null;
  const isPremium = profileData?.role === "premium" || profileData?.role === "admin";
  const isAdmin = profileData?.role === "admin";
  const userName = profileData?.full_name || user?.email?.split("@")[0] || "";

  // Cifras reales de la cartera para el bloque de Premium. Si falla, el
  // bloque enseña su texto en lugar de la cifra y nadie se entera.
  //
  // Recortadas a lo que se enseña: lo que llega a un componente de cliente
  // viaja en el HTML. Pasarle el resumen entero publicaba los importes
  // invertidos aunque `MOSTRAR_IMPORTES` diga que no (arreglado el 04-11-2026).
  const resumenPortfolio: ResumenHero = resumenCompleto && {
    posiciones: resumenCompleto.posiciones,
    rentabilidadPct: resumenCompleto.rentabilidadPct,
    desdeAnio: resumenCompleto.desdeAnio,
    dca: resumenCompleto.dca && {
      rentabilidadPct: resumenCompleto.dca.rentabilidadPct,
      compras: resumenCompleto.dca.compras,
    },
  };

  return (
    <div className="blog-page home-page">
      {/* ── Nav ── */}
      <SiteNav user={!!user} isPremium={isPremium} userName={userName} isAdmin={isAdmin} />

      {/* El orden cuenta una historia (repaso del 17-11-2026): lo gratuito
          primero (guías y, «también gratis», el diccionario y la
          calculadora), luego los cursos, la comunidad (foro y canal) y, al
          final, Premium con las dudas. Cada sección, su color (ESTILO.md). */}

      {/* ── Hero: estilo «Cuaderno de estudio». Lleva el único <h1>. ── */}
      <HeroCuaderno
        guias={guias.length}
        terminos={GLOSARIO_CON_PAGINA.length}
        cursos={cursos.length}
        sesion={user ? { nombre: userName.split(" ")[0], premium: isPremium } : null}
        portfolio={user && resumenPortfolio ? { rentabilidadPct: resumenPortfolio.rentabilidadPct, desdeAnio: resumenPortfolio.desdeAnio } : null}
      />

      {/* ── Las guías, justo tras el hero ─────────────────────────────────
          Desde el 10-10-2026 la academia son las guías. */}
      <GuidesHomeSection />

      {/* ── Lo otro gratuito: el diccionario y la calculadora ── */}
      <RecursosGratisHome />

      {/* ── Los cursos: el camino de un curso real y la lista de los publicados.
          Sin cursos publicados, no sale. ── */}
      <CursosHome cursos={cursos} />

      {/* ── Lo último del foro ──
          Solo sale si el foro existe para quien mira y hay preguntas. */}
      <ForoEnPortada conSesion={!!user} />

      {/* ── Los últimos vídeos del canal ──
          Va a youtube.com (lento y fuera de nuestro control), así que se
          resuelve en su propio <Suspense>, sin frenar la página. */}
      <Suspense key="yt-latest" fallback={null}>
        <YouTubeLatestSection />
      </Suspense>

      {/* ── Cierre: Premium y las preguntas frecuentes. A quien ya es
          Premium solo le quedan las dudas: sus herramientas las tiene en el
          hero (18-11-2026). ── */}
      <PremiumHome portfolio={resumenPortfolio} cursos={cursos} isPremium={isPremium} />

      <Footer />
    </div>
  );
}
