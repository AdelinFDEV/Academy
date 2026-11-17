import { createClient } from "@/lib/supabase/server";
import { PREMIUM_PRICE_EUR } from "@/lib/stripe";
import DashboardSavedTerms from "@/components/DashboardSavedTerms";
import Link from "next/link";
import {
  NotebookPen, Wallet, GraduationCap, Crown, ArrowRight, Check, Flame, Trophy, BookOpenCheck, Clock,
} from "lucide-react";
import DashboardSavedGuides from "@/components/DashboardSavedGuides";
import TwoFactorNudge from "@/components/TwoFactorNudge";
import DashboardAtajos from "@/components/DashboardAtajos";
import { LOGROS, diarioLevel, isEarned } from "@/lib/logros";
import IndicePanel, { type ToolSection } from "@/components/panel/IndicePanel";
import PegatinaLogro, { colorDeLogro } from "@/components/panel/PegatinaLogro";
import RachaSemana from "@/components/panel/RachaSemana";
import Tecla from "@/components/cuaderno/Tecla";
import { semanaDeRacha } from "@/lib/rachaSemana";
import { GUIDES, GUIDES_NEWEST_FIRST } from "@/lib/guides";
import { getEffectiveStreak, todayStr } from "@/lib/streak";
import GuiaPortada from "@/components/GuiaPortada";
import AvatarUsuario from "@/components/AvatarUsuario";
import VitrinaCertificados, { type EjemploVitrina } from "@/components/VitrinaCertificados";
import { certificadosDelAlumno, cursoPorSlug, cursosPublicados } from "@/lib/cursos";
import { destinoPorRuta } from "@/lib/herramientas";

/** La semana de la racha. Fuera del componente: la fecha de hoy no puede leerse en el render. */
function semanaActual(racha: number, ultimoDia: string | null | undefined) {
  return semanaDeRacha(racha, racha > 0 ? ultimoDia ?? null : null, todayStr());
}

/**
 * El panel de cada usuario.
 *
 * Rehecho el 04-11-2026 y pasado al estilo «Cuaderno de estudio» el
 * 17-11-2026: arriba, el saludo con tres datos suyos —racha, logros y guías
 * completadas— y la racha de la semana; el aviso del 2FA si le falta; el
 * índice de todo lo suyo (que sustituye al rail fijo), la vitrina (arriba si
 * ya tiene certificados, después de los logros si está vacía), la cartera, los
 * logros como pegatinas, las últimas guías (marcadas si ya las completó) y lo
 * que tiene guardado.
 * Todo lo que se cuenta aquí sale de sus datos: no hay ni una cifra de adorno.
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
    // La foto de perfil, para el saludo y «Mi perfil» del índice. Aparte: si la columna aún
    // no existe, falla sola y sale la inicial.
    supabase.from("profiles").select("avatar").eq("id", user.id).maybeSingle(),
  ]);
  // La vitrina: los certificados que ha ganado (solo los suyos, con su sesión).
  const certificados = await certificadosDelAlumno(user.id);
  // Vitrina vacía: una muestra con su nombre y el primer curso publicado.
  let ejemploVitrina: EjemploVitrina | null = null;
  if (certificados.length === 0) {
    const [primero] = await cursosPublicados();
    const curso = primero ? await cursoPorSlug(primero.slug) : null;
    if (curso) {
      ejemploVitrina = { titulo: curso.curso.titulo, logro: curso.curso.logro, color: curso.curso.color, fecha: curso.curso.updated_at };
    }
  }

  // La foto que eligió en «Mi perfil»: junto a su nombre en el saludo y en «Mi perfil» del índice.
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
  const semana = semanaActual(effectiveStreak, profile?.last_seen);

  const acceso = { logueado: true, premium: isPremium };
  const TOOL_SECTIONS: ToolSection[] = [
    {
      label: "Educación",
      tools: [
        { href: "/glosario", icon: "booka",         name: "Diccionario Cripto",   desc: "Términos clave explicados",      locked: false, soon: false },
        { href: "/guias",    icon: "map",           name: "Guías Interactivas",   desc: "Tu hoja de ruta de aprendizaje", locked: false, soon: false },
        { href: "/cursos",   icon: "graduationcap", name: "Cursos",               desc: "Por módulos, con examen y certificado", locked: false, soon: false },
        // Abierto a todos: un certificado ganado se descarga siempre, aunque ya no se sea Premium.
        { href: "/dashboard/certificados", icon: "award", name: "Mis certificados", desc: "Tu vitrina: descárgalos cuando quieras", locked: false, soon: false },
      ],
    },
    {
      label: "Herramientas",
      tools: [
        // Desde el 31-10-2026 son estas cuatro: se retiraron Watchlist,
        // Liberaciones, Radar, Mi Portfolio y la Calculadora de Riesgo.
        // Sin Premium llevan a su ficha (destinoPorRuta): bloqueadas, pero no muertas.
        { href: destinoPorRuta("/dashboard/trading", acceso), icon: "notebookpen", name: "Diario de Trading", desc: "Registra y analiza tus operaciones",     locked: !isPremium, soon: false },
        { href: destinoPorRuta("/portfolio", acceso),         icon: "piechart",    name: "Portfolio Adelin",  desc: "Sigue las compras de AdelinBTC en SPOT", locked: !isPremium, soon: false },
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

  const vitrina = <VitrinaCertificados certificados={certificados} forma="estante" nombre={name} ejemplo={ejemploVitrina} />;

  return (
    <main className="dashboard-main">

      {/* ── Cabecera: el saludo, tres datos suyos y la racha de la semana ── */}
      <section className="dh pn-hoja" aria-labelledby="dh-titulo">
        <div className="dh-texto">
          <p className="pn-mano dh-nota">tu cuaderno de estudio</p>
          <div className="dh-saludo-fila">
            {avatar && <AvatarUsuario avatar={avatar} inicial={(name.trim().charAt(0) || "U").toUpperCase()} className="dh-saludo-foto" />}
            <h1 id="dh-titulo" className="dh-saludo">
              Hola, <span className="fluor">{name}</span>
              {profile?.is_featured && (
                <span className="dh-estrella" title="Usuario destacado: 30 días de racha">★</span>
              )}
            </h1>
          </div>
          <p className="dh-sub">Tu academia: guías, diccionario y herramientas, todo en un sitio.</p>
          <div className="dh-acciones">
            <span className={`pn-chip ${isPremium ? "tono-naranja" : "tono-gris"}`}>
              {isPremium && <Crown size={13} aria-hidden="true" />}
              {planLabel}
            </span>
            {!isPremium && (
              <Tecla href="/premium" tamano="peq">
                <Crown size={15} aria-hidden="true" /> Hazte Premium
              </Tecla>
            )}
          </div>
        </div>

        <div className="dh-lado">
          <div className="dh-datos">
            <Link href="/dashboard/logros" className="dh-dato tono-naranja">
              <span className="dh-dato-icono" aria-hidden="true"><Flame size={18} /></span>
              <span className="dh-dato-valor">{effectiveStreak}</span>
              <span className="dh-dato-texto">{effectiveStreak === 1 ? "día de racha" : "días de racha"}</span>
            </Link>
            <Link href="/dashboard/logros" className="dh-dato tono-amarillo">
              <span className="dh-dato-icono" aria-hidden="true"><Trophy size={18} /></span>
              <span className="dh-dato-valor">{badgesUnlockedCount}<small>/{DASH_BADGES.length}</small></span>
              <span className="dh-dato-texto">logros</span>
            </Link>
            <Link href="/guias" className="dh-dato tono-cielo">
              <span className="dh-dato-icono" aria-hidden="true"><BookOpenCheck size={18} /></span>
              <span className="dh-dato-valor">{guiasCompletadas}<small>/{GUIDES.length}</small></span>
              <span className="dh-dato-texto">guías completadas</span>
            </Link>
          </div>
          <div className="dh-racha">
            <span className="pn-etiqueta">Racha de esta semana</span>
            <RachaSemana dias={semana} etiqueta="Tu racha en los últimos siete días" />
          </div>
        </div>
      </section>

      {/* El aviso del segundo paso, si le falta: lo primero tras el saludo. */}
      <TwoFactorNudge />

      {/* ── El índice: todo lo suyo, en fichas de color (sustituye al rail fijo) ── */}
      <IndicePanel sections={TOOL_SECTIONS} />

      {/* ── La vitrina: arriba si ya tiene certificados; vacía, baja tras los logros ── */}
      {certificados.length > 0 && vitrina}

      {/* ── La cartera, con su dato vivo ── */}
      <DashboardAtajos isPremium={isPremium} />

      {/* ── Logros: la colección de pegatinas ── */}
      <section className="pn-hoja dh-logros" aria-labelledby="dh-logros-titulo">
        <header className="pn-hoja-cab">
          <div>
            <h2 id="dh-logros-titulo" className="pn-h2">Tus logros</h2>
            <p className="pn-sub">
              {badgesUnlockedCount === 0
                ? "Completa el quiz de una guía o entra unos días seguidos para conseguir el primero."
                : `${badgesUnlockedCount} de ${DASH_BADGES.length} desbloqueados`}
            </p>
          </div>
          <Tecla href="/dashboard/logros" color="amarillo" tamano="peq">
            Ver todos <ArrowRight size={14} aria-hidden="true" />
          </Tecla>
        </header>

        <div className="pn-progreso">
          <span
            className="pn-barra tono-amarillo"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={badgesPct}
            aria-label="Progreso de logros"
          >
            <i style={{ width: `${badgesPct}%` }} />
          </span>
          <b>{badgesPct} %</b>
        </div>

        <ul className="dh-logros-rejilla">
          {DASH_BADGES.map((badge, i) => {
            const unlocked = isEarned(earnedBadgeIds, badge);
            return (
              <li key={badge.id} className={`dh-logro pgl-anfitrion${unlocked ? " is-conseguido" : ""}`}>
                <PegatinaLogro
                  icono={badge.icon}
                  color={colorDeLogro(badge)}
                  conseguida={unlocked}
                  indice={i}
                  tamano="peq"
                  especial={badge.special}
                />
                <span className="dh-logro-nombre">
                  {badge.label}
                  <span className="sr-only">{unlocked ? " (conseguido)" : " (sin conseguir)"}</span>
                </span>
                <span className="dh-logro-pista">
                  <span>{badge.condition}</span>
                  {badge.diario && (
                    <span className="dh-logro-premio">★ Nivel {diarioLevel(earnedBadgeIds, badge)} de {badge.diario.levels}</span>
                  )}
                  {badge.reward && <span className="dh-logro-premio">★ {badge.reward}</span>}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {certificados.length === 0 && vitrina}

      {/* ── Premium (solo a quien no lo tiene): el bloque de tinta ── */}
      {!isPremium && (
        <section className="dh-premium" aria-labelledby="dh-premium-titulo">
          <div className="dh-premium-texto">
            <span className="pn-chip tono-naranja"><Crown size={13} aria-hidden="true" /> Premium</span>
            <h2 id="dh-premium-titulo" className="dh-premium-titulo">Opera con <span className="fluor">método</span>, no de memoria</h2>
            <ul className="dh-premium-lista">
              <li><span className="tono-azul"><NotebookPen size={16} aria-hidden="true" /></span>Diario de Trading con diez estadísticas</li>
              <li><span className="tono-menta"><Wallet size={16} aria-hidden="true" /></span>Portfolio Adelin: mi cartera real, en vivo</li>
              <li><span className="tono-lila"><GraduationCap size={16} aria-hidden="true" /></span>Cursos con examen y certificado</li>
            </ul>
          </div>
          <div className="dh-premium-compra">
            <p className="dh-premium-precio">{PREMIUM_PRICE_EUR.toFixed(2).replace(".", ",")} €<small>/mes</small></p>
            <Tecla href="/premium" tamano="grande">
              Hazte Premium <ArrowRight size={17} strokeWidth={2.6} aria-hidden="true" />
            </Tecla>
            <p className="dh-premium-nota">Sin permanencia · Cancela cuando quieras</p>
          </div>
        </section>
      )}

      {/* ── Últimas guías ── */}
      <section className="dh-bloque" aria-labelledby="dh-guias-titulo">
        <header className="pn-hoja-cab">
          <h2 id="dh-guias-titulo" className="pn-h2">Últimas guías</h2>
          <Tecla href="/guias" color="cielo" tamano="peq">Ver todas <ArrowRight size={14} aria-hidden="true" /></Tecla>
        </header>
        <div className="dh-guias">
          {GUIDES_NEWEST_FIRST.slice(0, 3).map((guide) => {
            const hecha = earnedBadgeIds.has(guide.badgeId);
            return (
              <Link key={guide.slug} href={`/guias/${guide.slug}`} className="dh-guia">
                <span className="dh-guia-portada">
                  <GuiaPortada guia={guide} sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 360px" />
                  {hecha && (
                    <span className="pn-chip tono-menta dh-guia-hecha"><Check size={12} strokeWidth={3} aria-hidden="true" /> Completada</span>
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
      <section className="dh-bloque" aria-labelledby="dh-guardadas-titulo">
        <header className="pn-hoja-cab">
          <h2 id="dh-guardadas-titulo" className="pn-h2">
            Guías guardadas
            {savedGuidesList.length > 0 && <span className="pn-cuenta tono-cielo">{savedGuidesList.length}</span>}
          </h2>
          <Tecla href="/guias" color="blanca" tamano="peq">Ver guías <ArrowRight size={14} aria-hidden="true" /></Tecla>
        </header>
        <DashboardSavedGuides initialGuides={savedGuidesList} />
      </section>

      <section className="dh-bloque" aria-labelledby="dh-terminos-titulo">
        <header className="pn-hoja-cab">
          <h2 id="dh-terminos-titulo" className="pn-h2">
            Diccionario guardado
            {savedTermsList.length > 0 && <span className="pn-cuenta tono-amarillo">{savedTermsList.length}</span>}
          </h2>
          <Tecla href="/glosario" color="blanca" tamano="peq">Ver diccionario <ArrowRight size={14} aria-hidden="true" /></Tecla>
        </header>
        <DashboardSavedTerms initialTerms={savedTermsList} />
      </section>

    </main>
  );
}
