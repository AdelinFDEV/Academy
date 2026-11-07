import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import DashboardSavedTerms from "@/components/DashboardSavedTerms";
import {
  NotebookPen, Wallet, GraduationCap, Crown, ArrowRight, Check, Lock, Flame, Trophy,
  BookOpenCheck, ShieldCheck, Clock,
} from "lucide-react";
import DashboardSavedGuides from "@/components/DashboardSavedGuides";
import TwoFactorNudge from "@/components/TwoFactorNudge";
import DashboardAtajos from "@/components/DashboardAtajos";
import { LOGROS, diarioLevel, isEarned } from "@/lib/logros";
import DashboardToolsSidebar from "@/components/DashboardToolsSidebar";
import type { ToolSection } from "@/components/DashboardToolsSidebar";
import { GUIDES, GUIDES_NEWEST_FIRST } from "@/lib/guides";
import { getEffectiveStreak } from "@/lib/streak";
import GuiaPortada from "@/components/GuiaPortada";
import AvatarUsuario from "@/components/AvatarUsuario";

/**
 * El panel de cada usuario.
 *
 * Rehecho el 04-11-2026: arriba, una cabecera con el saludo y tres datos
 * suyos —racha, logros y guías completadas—; debajo, la cartera, los logros
 * con su barra de progreso, las últimas guías (marcadas si ya las completó),
 * y lo que tiene guardado. Todo lo que se cuenta aquí sale de sus datos: no
 * hay ni una cifra de adorno.
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, current_streak, last_seen, is_featured")
    .eq("id", user.id)
    .single();

  const effectiveStreak = getEffectiveStreak(profile?.current_streak, profile?.last_seen);

  const name = profile?.full_name || user.email?.split("@")[0] || "Usuario";
  const role = profile?.role || "free";
  const isPremium = role === "premium" || role === "admin";
  const planLabel = role === "admin" ? "Admin" : isPremium ? "Premium" : "Plan gratuito";

  const [{ data: savedTermsData }, { data: savedGuidesData }, { data: userBadgesData }, { data: foto }] = await Promise.all([
    supabase
      .from("saved_terms")
      .select("term, definition, category")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("guide_saves")
      .select("guide_slug, saved_at")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false }),
    supabase
      .from("user_badges")
      .select("badge_id")
      .eq("user_id", user.id),
    // La foto de perfil, para «Mi perfil» del rail. Aparte: si la columna aún
    // no existe, falla sola y sale la inicial.
    supabase.from("profiles").select("avatar").eq("id", user.id).maybeSingle(),
  ]);

  // La foto que eligió en «Mi perfil»: junto a su nombre en el saludo y en «Mi perfil» del rail.
  const avatar = (foto as { avatar?: string | null } | null)?.avatar ?? null;

  const savedTermsList = savedTermsData ?? [];
  const savedGuidesList = (savedGuidesData ?? [])
    .map((sg) => ({ slug: sg.guide_slug, savedAt: sg.saved_at, meta: GUIDES.find((g) => g.slug === sg.guide_slug) }))
    .filter((sg): sg is { slug: string; savedAt: string; meta: NonNullable<typeof sg.meta> } => !!sg.meta);
  const earnedBadgeIds = new Set((userBadgesData ?? []).map((b) => b.badge_id));

  // Los logros salen de `@/lib/logros`, la misma lista que pinta
  // /dashboard/logros. Los del diario solo se consiguen con Premium: a quien no
  // lo tiene (ni tiene ninguno de antes) no se le enseñan logros imposibles.
  const DASH_BADGES = LOGROS.filter((b) => !b.diario || isPremium || isEarned(earnedBadgeIds, b));
  const badgesUnlockedCount = DASH_BADGES.filter((b) => isEarned(earnedBadgeIds, b)).length;
  const badgesPct = DASH_BADGES.length ? Math.round((badgesUnlockedCount / DASH_BADGES.length) * 100) : 0;

  // Una guía está completada cuando tiene su logro: el quiz con nota perfecta.
  const guiasCompletadas = GUIDES.filter((g) => earnedBadgeIds.has(g.badgeId)).length;

  const TOOL_SECTIONS: ToolSection[] = [
    {
      label: "Educación",
      tools: [
        { href: "/glosario", icon: "booka",         name: "Diccionario Cripto",   desc: "Términos clave explicados",      locked: false, soon: false },
        { href: "/guias",    icon: "map",           name: "Guías Interactivas",   desc: "Tu hoja de ruta de aprendizaje", locked: false, soon: false },
        // "Pronto" hasta que se publique el primer curso; entonces, soon: false.
        { href: "/cursos",   icon: "graduationcap", name: "Cursos",               desc: "Por módulos, con examen y certificado", locked: false, soon: true },
      ],
    },
    {
      label: "Herramientas",
      tools: [
        // Desde el 31-10-2026 son estas cuatro: se retiraron Watchlist,
        // Liberaciones, Radar, Mi Portfolio y la Calculadora de Riesgo.
        { href: isPremium ? "/dashboard/trading" : "#", icon: "notebookpen", name: "Diario de Trading",    desc: "Registra y analiza tus operaciones",     locked: !isPremium, soon: false },
        { href: isPremium ? "/portfolio"         : "#", icon: "piechart",    name: "Portfolio Adelin",     desc: "Sigue las compras de AdelinBTC en SPOT", locked: !isPremium, soon: false },
        { href: "/calculadora",                         icon: "target",      name: "Predicción de Precio", desc: "¿Qué Market Cap necesita tu token?",     locked: false,      soon: false },
        { href: "/logros",                              icon: "trophy",      name: "Logros",               desc: "Tu progreso y rachas",                   locked: false,      soon: false },
      ],
    },
    {
      label: "Tu cuenta",
      tools: [
        // Alias y foto: lo que el foro enseñará de cada uno (FORO.md).
        {
          href: "/dashboard/perfil", icon: "user", name: "Mi perfil", desc: "Tu perfil, tu plan y tu seguridad", locked: false, soon: false,
          foto: { avatar, inicial: (name.trim().charAt(0) || "U").toUpperCase() },
        },
      ],
    },
  ];

  return (
    <>
    {/* El rail va PRIMERO en el DOM aunque esté posicionado aparte: así el
        tabulador y los lectores de pantalla recorren la navegación antes que
        el contenido, que es el orden que se ve. */}
    <DashboardToolsSidebar sections={TOOL_SECTIONS} />

    <div className="dash-page-wrap">
    <main className="dashboard-main">

      {/* ── Cabecera: el saludo y tres datos suyos ── */}
      <section className={`dh-hero${isPremium ? " is-premium" : ""}`}>
        <div className="dh-hero-texto">
          <span className="dh-plan">
            {isPremium && <Crown size={13} aria-hidden="true" />}
            {planLabel}
          </span>
          <div className="dh-saludo-fila">
            {avatar && <AvatarUsuario avatar={avatar} inicial={(name.trim().charAt(0) || "U").toUpperCase()} className="dh-saludo-foto" />}
            <h1 className="dh-saludo">
              Hola, <span>{name}</span>
              {profile?.is_featured && (
                <span className="dh-estrella" title="Usuario destacado: 30 días de racha">★</span>
              )}
            </h1>
          </div>
          <p className="dh-sub">Tu academia: guías, diccionario y herramientas, todo en un sitio.</p>
          {!isPremium && (
            <Link href="/premium" className="dh-hero-cta">
              <Crown size={15} aria-hidden="true" /> Hazte Premium
              <ArrowRight size={15} strokeWidth={2.4} aria-hidden="true" />
            </Link>
          )}
        </div>

        <div className="dh-datos">
          <Link href="/dashboard/logros" className="dh-dato dh-dato--racha">
            <span className="dh-dato-icono" aria-hidden="true"><Flame size={18} /></span>
            <span className="dh-dato-valor">{effectiveStreak}</span>
            <span className="dh-dato-texto">{effectiveStreak === 1 ? "día de racha" : "días de racha"}</span>
          </Link>
          <Link href="/dashboard/logros" className="dh-dato dh-dato--logros">
            <span className="dh-dato-icono" aria-hidden="true"><Trophy size={18} /></span>
            <span className="dh-dato-valor">{badgesUnlockedCount}<small>/{DASH_BADGES.length}</small></span>
            <span className="dh-dato-texto">logros</span>
          </Link>
          <Link href="/guias" className="dh-dato dh-dato--guias">
            <span className="dh-dato-icono" aria-hidden="true"><BookOpenCheck size={18} /></span>
            <span className="dh-dato-valor">{guiasCompletadas}<small>/{GUIDES.length}</small></span>
            <span className="dh-dato-texto">guías completadas</span>
          </Link>
        </div>
      </section>

      <TwoFactorNudge />

      {/* ── La cartera, con su dato vivo ── */}
      <DashboardAtajos isPremium={isPremium} />

      {/* ── Logros ── */}
      <section className="dh-card dh-logros">
        <header className="dh-card-cab">
          <div>
            <h2 className="dh-h2">Tus logros</h2>
            <p className="dh-card-sub">
              {badgesUnlockedCount === 0
                ? "Completa el quiz de una guía o entra unos días seguidos para conseguir el primero."
                : `${badgesUnlockedCount} de ${DASH_BADGES.length} desbloqueados`}
            </p>
          </div>
          <Link href="/dashboard/logros" className="dh-enlace">
            Ver todos <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </header>

        <div className="dh-barra" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={badgesPct} aria-label="Progreso de logros">
          <span style={{ width: `${badgesPct}%` }} />
        </div>

        <div className="dh-logros-rejilla">
          {DASH_BADGES.map((badge) => {
            const unlocked = isEarned(earnedBadgeIds, badge);
            return (
              <div key={badge.id} className={`dh-logro${unlocked ? " is-conseguido" : ""}${badge.special ? " is-especial" : ""}`}>
                {unlocked ? (
                  <span className={`badge-unlocked-check${badge.special ? " badge-unlocked-check--gold" : ""}`} title="Logro obtenido">
                    <Check size={10} strokeWidth={3.2} aria-hidden="true" />
                  </span>
                ) : (
                  <span className="badge-lock" title="Aún no conseguido">
                    <Lock size={9} strokeWidth={3} aria-hidden="true" />
                  </span>
                )}
                <div className="dh-logro-icono">{badge.icon}</div>
                <span className="dh-logro-nombre">{badge.label}</span>
                <div className="badge-tooltip">
                  <p className="badge-tooltip-condition">{badge.condition}</p>
                  {badge.diario && (
                    <p className="badge-tooltip-reward">
                      <span className="badge-tooltip-reward-star">★</span> Nivel {diarioLevel(earnedBadgeIds, badge)} de {badge.diario.levels}
                    </p>
                  )}
                  {badge.reward && (
                    <p className="badge-tooltip-reward">
                      <span className="badge-tooltip-reward-star">★</span> {badge.reward}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Premium (solo a quien no lo tiene) ── */}
      {!isPremium && (
        <section className="dh-premium">
          <div className="dh-premium-texto">
            <span className="dh-plan dh-plan--oro"><Crown size={13} aria-hidden="true" /> Premium</span>
            <h2 className="dh-premium-titulo">Opera con método, no de memoria</h2>
            <ul className="dh-premium-lista">
              <li><span><NotebookPen size={15} aria-hidden="true" /></span>Diario de Trading con diez estadísticas</li>
              <li><span><Wallet size={15} aria-hidden="true" /></span>Portfolio Adelin: mi cartera real, en vivo</li>
              <li><span><GraduationCap size={15} aria-hidden="true" /></span>Cursos con certificado, cuando se publiquen</li>
            </ul>
          </div>
          <div className="dh-premium-compra">
            <p className="dh-premium-precio">49,99 €<small>/mes</small></p>
            <Link href="/premium" className="dh-premium-cta">
              Hazte Premium <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
            </Link>
            <p className="dh-premium-nota">
              <ShieldCheck size={12} aria-hidden="true" /> Sin permanencia · Cancela cuando quieras
            </p>
          </div>
        </section>
      )}

      {/* ── Últimas guías ── */}
      <section className="dh-bloque">
        <header className="dh-bloque-cab">
          <h2 className="dh-h2">Últimas guías</h2>
          <Link href="/guias" className="dh-enlace">Ver todas <ArrowRight size={14} aria-hidden="true" /></Link>
        </header>
        <div className="dh-guias">
          {GUIDES_NEWEST_FIRST.slice(0, 3).map((guide) => {
            const hecha = earnedBadgeIds.has(guide.badgeId);
            return (
              <Link
                key={guide.slug}
                href={`/guias/${guide.slug}`}
                className="dh-guia"
                style={{ "--g": guide.color } as React.CSSProperties}
              >
                <span className="dh-guia-portada">
                  <GuiaPortada guia={guide} sizes="(max-width: 760px) 100vw, 320px" />
                  {hecha && (
                    <span className="dh-guia-hecha"><Check size={12} strokeWidth={3} aria-hidden="true" /> Completada</span>
                  )}
                </span>
                <span className="dh-guia-cuerpo">
                  <span className="dh-guia-meta">
                    {guide.difficulty.charAt(0).toUpperCase() + guide.difficulty.slice(1)}
                    <span aria-hidden="true">·</span>
                    <Clock size={12} aria-hidden="true" /> {guide.readTime}
                  </span>
                  <span className="dh-guia-titulo">{guide.title}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Guardado ── */}
      <section className="dh-bloque">
        <header className="dh-bloque-cab">
          <h2 className="dh-h2">
            Guías guardadas
            {savedGuidesList.length > 0 && <span className="dh-cuenta">{savedGuidesList.length}</span>}
          </h2>
          <Link href="/guias" className="dh-enlace">Ver guías <ArrowRight size={14} aria-hidden="true" /></Link>
        </header>
        <DashboardSavedGuides initialGuides={savedGuidesList} />
      </section>

      <section className="dh-bloque">
        <header className="dh-bloque-cab">
          <h2 className="dh-h2">
            Diccionario guardado
            {savedTermsList.length > 0 && <span className="dh-cuenta">{savedTermsList.length}</span>}
          </h2>
          <Link href="/glosario" className="dh-enlace">Ver diccionario <ArrowRight size={14} aria-hidden="true" /></Link>
        </header>
        <DashboardSavedTerms initialTerms={savedTermsList} />
      </section>

    </main>
    </div>
    </>
  );
}
