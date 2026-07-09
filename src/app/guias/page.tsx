import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import { ArrowRight, Zap, BookOpen, Trophy, BarChart2, Lock, Star } from "lucide-react";
import { GUIDES } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Guías Interactivas | AdelinBTC Academy",
  description:
    "Aprende crypto paso a paso con guías interactivas: gráficas animadas, quizzes, flashcards y badges de logro. Desde Bitcoin hasta DeFi.",
};

// Clase CSS por dificultad (las clases guides-diff--* ya existen en globals.css).
const DIFF_CLASS: Record<string, string> = {
  "básico": "basic",
  "intermedio": "intermediate",
  "avanzado": "advanced",
};

export default async function GuiasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const profileData = user
    ? (await supabase.from("profiles").select("full_name, role").eq("id", user.id).single()).data
    : null;
  const role = profileData?.role ?? "free";
  const isPremium = role === "premium" || role === "admin";
  const isAdmin = role === "admin";
  const userName = profileData?.full_name || user?.email?.split("@")[0] || "Usuario";

  return (
    <div className="blog-page">
      <div className="bg-ambient" />

      <SiteNav user={!!user} isPremium={isPremium} userName={user ? userName : undefined} isAdmin={isAdmin} />

      <main className="guias-page">

        {/* Hero */}
        <div className="guias-hero">
          <div className="guias-hero-glow" aria-hidden="true" />
          <div className="guias-hero-inner">
            <div className="guias-hero-eyebrow">
              <Zap size={14} aria-hidden="true" />
              Guías Interactivas · AdelinBTC Academy
            </div>
            <h1 className="guias-hero-title">
              Aprende crypto<br />
              <span className="guias-hero-title-gold">como nunca antes.</span>
            </h1>
            <p className="guias-hero-subtitle">
              No listas de bullets ni teoría aburrida. Cada guía combina contenido experto,
              gráficas animadas, flashcards, quizzes con puntuación y badges de logro que
              demuestran lo que sabes.
            </p>
            <div className="guias-hero-pills">
              <span className="guias-hero-pill"><BarChart2 size={13} aria-hidden="true" /> Gráficas animadas</span>
              <span className="guias-hero-pill"><BookOpen size={13} aria-hidden="true" /> Flashcards</span>
              <span className="guias-hero-pill"><Star size={13} aria-hidden="true" /> Quiz 0–10</span>
              <span className="guias-hero-pill"><Trophy size={13} aria-hidden="true" /> Badges de logro</span>
            </div>
          </div>
        </div>

        {/* Guías publicadas */}
        <div className="guias-section">
          <h2 className="guias-section-title">Disponibles ahora</h2>
          <div className="guias-grid">
            {GUIDES.map((g) => (
              <Link key={g.slug} href={`/guias/${g.slug}`} className="guias-card">
                <div className="guias-card-glow" aria-hidden="true" />
                <div className="guias-card-top">
                  <span className={`guides-diff-badge guides-diff--${DIFF_CLASS[g.difficulty]}`}>
                    {g.difficulty.charAt(0).toUpperCase() + g.difficulty.slice(1)}
                  </span>
                  {g.type === "free"
                    ? <span className="guides-access-badge">Gratis con registro</span>
                    : <span className="guides-access-badge guides-access-badge--premium"><Lock size={11} aria-hidden="true" /> Premium</span>}
                </div>
                <h3 className="guias-card-title">{g.title}</h3>
                <p className="guias-card-desc">{g.description}</p>
                <div className="guias-card-meta">
                  <span><BookOpen size={13} aria-hidden="true" /> {g.sections} secciones</span>
                  <span><Trophy size={13} aria-hidden="true" /> {g.badge}</span>
                </div>
                <div className="guias-card-cta">
                  Empezar <ArrowRight size={14} aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA registro */}
        {!user && (
          <div className="guias-cta-band">
            <div className="guias-cta-band-glow" aria-hidden="true" />
            <div className="guias-cta-band-inner">
              <h3 className="guias-cta-band-title">Crea tu cuenta gratis y empieza a aprender</h3>
              <p className="guias-cta-band-sub">Accede a las guías gratuitas, acumula puntos y desbloquea badges.</p>
              <div className="guias-cta-band-actions">
                <Link href="/register" className="guias-cta-primary">
                  Registrarme gratis <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link href="/login" className="guias-cta-secondary">Ya tengo cuenta</Link>
              </div>
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
