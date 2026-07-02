import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Footer from "@/components/Footer";
import BlogMobileMenu from "@/components/BlogMobileMenu";
import NavArticulosDropdown from "@/components/NavArticulosDropdown";
import NavEducacionDropdown from "@/components/NavEducacionDropdown";
import NavHerramientasDropdown from "@/components/NavHerramientasDropdown";
import LogoutButton from "@/components/LogoutButton";
import LiveCounter from "@/components/LiveCounter";
import GuideProgressBar from "../que-es-la-blockchain/GuideProgressBar";
import GuideInteractions from "@/components/GuideInteractions";
import GuideVisitTracker from "@/components/GuideVisitTracker";
import GuideCycleHeroStats from "./GuideCycleHeroStats";
import GuideCycleChart from "./GuideCycleChart";
import GuideCyclePhases from "./GuideCyclePhases";
import GuideCycleQuiz from "./GuideCycleQuiz";
import GuideRevealCard from "./GuideRevealCard";
import { Unlock } from "lucide-react";

export const metadata: Metadata = {
  title: "¿Por Qué Ahora Es el Momento de Comprar Bitcoin? Ciclos de Mercado | AdelinBTC Academy",
  description:
    "El ciclo de 4 años del halving explicado en lenguaje simple: por qué la fase bajista está terminando, qué esperar de las altcoins antes del próximo halving y los rangos de precio de este ciclo.",
  openGraph: {
    title: "¿Por Qué Ahora Es el Momento de Comprar Bitcoin?",
    description: "Análisis de ciclos del halving, con gráfica interactiva, señales de entrada y quiz con badge.",
    type: "article",
  },
};

const SECTIONS = [
  { id: "ciclos", label: "Los ciclos" },
  { id: "donde-estamos", label: "Dónde estamos" },
  { id: "senales", label: "Señales" },
  { id: "estrategia", label: "Estrategia" },
  { id: "quiz", label: "Quiz" },
];

export default async function CiclosDeBitcoinPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const SLUG = "ciclos-de-bitcoin";

  const [profileResult, likesResult, savedResult, sharesResult] = await Promise.all([
    user
      ? supabase.from("profiles").select("full_name, role").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
    supabase.from("guide_likes").select("id", { count: "exact", head: true }).eq("guide_slug", SLUG),
    user
      ? supabase.from("guide_saves").select("id").eq("guide_slug", SLUG).eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("guide_shares").select("id", { count: "exact", head: true }).eq("guide_slug", SLUG),
  ]);

  const profileData = profileResult.data;
  const role = profileData?.role ?? "free";
  const isPremium = role === "premium" || role === "admin";
  const isAdmin = role === "admin";
  const userName = profileData?.full_name || user?.email?.split("@")[0] || "Usuario";
  const isRegistered = !!user;

  let initialLiked = false;
  if (user) {
    const { data: likeRow } = await supabase
      .from("guide_likes").select("id").eq("guide_slug", SLUG).eq("user_id", user.id).maybeSingle();
    initialLiked = !!likeRow;
  }
  const initialLikes  = (likesResult as any).count ?? 0;
  const initialSaved  = !!(savedResult as any).data;
  const initialShares = (sharesResult as any).count ?? 0;

  return (
    <div className="gbc-wrap">
      <GuideVisitTracker guideSlug={SLUG} />
      <GuideProgressBar />

      {/* Nav */}
      <nav className="blog-nav">
        <Link href="/" className="blog-brand">adelin<span>btc</span></Link>
        <LiveCounter />
        <div className="blog-nav-links">
          <NavArticulosDropdown />
          <NavEducacionDropdown />
          <NavHerramientasDropdown user={!!user} isPremium={isPremium} />
          {user ? (
            <>
              <Link href="/dashboard" className="btn-nav-link btn-nav-link--dashboard">Academia</Link>
              {isAdmin && <Link href="/admin" className="btn-nav-link">Admin</Link>}
              <div className="blog-nav-user">
                <span className="blog-nav-user-name">{userName}</span>
                <span className={`blog-nav-user-role${isPremium ? " premium" : ""}`}>{isAdmin ? "Admin" : isPremium ? "Premium" : "Free"}</span>
              </div>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="btn-nav-link">Iniciar sesión</Link>
              <Link href="/register" className="btn-nav-cta">Registrarse</Link>
            </>
          )}
        </div>
        <BlogMobileMenu user={!!user} isPremium={isPremium} userName={user ? userName : undefined} isAdmin={isAdmin} />
      </nav>

      {/* Index */}
      <nav className="gbc-index" aria-label="Índice de la guía">
        <div className="gbc-index-inner">
          <span className="gbc-index-lbl">Índice</span>
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="gbc-index-link">{s.label}</a>
          ))}
        </div>
      </nav>

      {/* Hero */}
      <header className="gbc-hero">
        <div className="gbc-hero-glow" aria-hidden="true" />
        <div className="gbc-hero-ey">Análisis de mercado · AdelinBTC Academy · 2026</div>
        <h1 className="gbc-hero-title">
          ¿Por qué AHORA es el momento<br />
          <span className="gbc-hero-gold">de empezar a comprar Bitcoin?</span>
        </h1>
        <p className="gbc-hero-desc">
          El ciclo del halving explicado sin rodeos: dónde estamos, por qué la fase bajista
          está llegando a su fin, y qué patrón siguen históricamente las altcoins antes de que
          empiece el siguiente mercado alcista.
        </p>
        <div className="gbc-hero-pills">
          <span className="gbc-pill">5 secciones</span>
          <span className="gbc-pill">Gráfica interactiva de ciclos</span>
          <span className="gbc-pill">Quiz + Badge</span>
        </div>
        <GuideCycleHeroStats />
      </header>

      {/* ── SECTION 1: LOS CICLOS ── FREE */}
      <section id="ciclos" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Sección 1 <span className="gbc-free-pill">Gratis</span></div>
          <h2 className="gbc-title">El ciclo de 4 años: la variable que más mueve el precio de Bitcoin</h2>
          <div className="gbc-body">
            <p>
              Bitcoin no sube ni baja al azar. Desde su creación se mueve siguiendo un patrón que se repite cada
              ~4 años, marcado por un evento programado en su propio código: el <strong>halving</strong>. Cada
              ~210.000 bloques, la recompensa que reciben los mineros por validar transacciones se reduce a la mitad.
              Menos Bitcoin nuevo entrando al mercado, con la misma o mayor demanda, ha coincidido — en los cuatro
              halvings que llevamos (2012, 2016, 2020 y 2024) — con una subida fuerte de precio en los 12-18 meses posteriores.
            </p>
            <p>
              Después de esa subida siempre ha llegado una corrección — a veces brutal, del 50-80% desde máximos —
              seguida de una fase de recuperación silenciosa, hasta que el ciclo vuelve a arrancar con el siguiente halving.
              Es exactamente el mismo patrón, cuatro veces seguidas.
            </p>
          </div>

          <div className="gbc-box gbc-box--gold">
            <div className="gbc-box-title">Nota importante antes de seguir leyendo</div>
            <div className="gbc-box-body">
              Todo lo que viene a continuación es un <strong>análisis basado en patrones históricos</strong>, no una
              garantía ni asesoramiento financiero personalizado. Los ciclos pasados no aseguran que el futuro se
              repita exactamente igual. Invierte siempre con cabeza, solo lo que puedas permitirte perder, y haz tu
              propia investigación (DYOR).
            </div>
          </div>

          <div className="gbc-quote">
            <div className="gbc-quote-t">
              «Acerté el inicio de la fase bajista, justo cuando el mercado empezó a corregir. Ahora, con este mismo
              modelo de ciclos, la idea es acertar también el inicio de la fase alcista — entrando antes de que sea obvio para todos.»
            </div>
            <div className="gbc-quote-a">— Nota del equipo de AdelinBTC Academy</div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: DÓNDE ESTAMOS ── FREE */}
      <section id="donde-estamos" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Sección 2 <span className="gbc-free-pill">Gratis</span></div>
          <h2 className="gbc-title">Dónde estamos ahora: cerrando la fase bajista</h2>
          <div className="gbc-body">
            <p>
              El último halving fue en <strong>abril de 2024</strong>. Como en ciclos anteriores, el precio subió
              con fuerza durante los meses siguientes hasta marcar máximos del ciclo. Desde entonces estamos en la
              fase de corrección — la parte incómoda, donde la mayoría pierde la paciencia o vende.
            </p>
            <p>
              Según este modelo de ciclos, esa fase bajista está <strong>llegando a su final aproximadamente en octubre
              de 2026</strong>. Eso no significa que el suelo exacto se toque ese mes concreto — significa que estadísticamente
              estamos en la ventana en la que, en ciclos anteriores, ya convenía empezar a acumular con más convicción.
            </p>
          </div>

          <GuideCycleChart />
          <GuideCyclePhases />
        </div>
      </section>

      {/* ── SECTION 3+: PAYWALL si no registrado ── */}
      {!isRegistered ? (
        <section id="senales" className="gbc-section">
          <div className="gbc-gc">
            <div className="gbc-ey">Sección 3–5 <span className="gbc-lock-pill">Registro gratuito</span></div>
            <h2 className="gbc-title">Señales de compra, estrategia y quiz con badge</h2>
            <div className="gbc-body">
              <p>Las secciones siguientes cubren las señales concretas de que el momento de acumular ya está aquí,
              por qué las altcoins suelen adelantarse al halving, los rangos de precio estimados para este ciclo,
              cómo posicionarse sin apostarlo todo a una fecha exacta, y el quiz interactivo con badge de logro.</p>
            </div>
            <div className="gbc-paywall">
              <div className="gbc-paywall-badge"><Unlock size={13} strokeWidth={2.2} aria-hidden="true" /> Has leído 2 de 5 secciones</div>
              <div className="gbc-paywall-t">Regístrate gratis para leer la guía completa</div>
              <div className="gbc-paywall-d">
                Desbloquea las 3 secciones restantes: señales de compra, estrategia de posicionamiento,
                el quiz interactivo y tu badge <strong>Cazador de Ciclos</strong>. Sin tarjeta, en 30 segundos.
              </div>
              <Link href="/register" className="gbc-paywall-btn">Crear mi cuenta gratis →</Link>
              <div className="gbc-paywall-login">
                ¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* ── SECTION 3: SEÑALES ── */}
          <section id="senales" className="gbc-section">
            <div className="gbc-gc">
              <div className="gbc-ey">Sección 3</div>
              <h2 className="gbc-title">Señales de que el momento de acumular ya está aquí</h2>
              <div className="gbc-body">
                <p>
                  Hay una regularidad que se repite en los ciclos anteriores: <strong>las altcoins tienden a moverse
                  con fuerza en los meses previos al siguiente halving</strong>, no después. Cuando la subida de Bitcoin
                  ya es noticia en medios generalistas, gran parte del recorrido de las altcoins ya ha ocurrido. Estar
                  posicionado antes de que sea evidente es, precisamente, la ventaja que busca este análisis.
                </p>
                <p>
                  El próximo halving se estima para <strong>principios de 2028</strong>. Si el patrón se repite, la
                  fase «pre-halving» — donde el capital empieza a rotar hacia altcoins con más fuerza — arrancaría
                  durante 2027. Eso deja la fase de recuperación actual (2026) como la ventana de acumulación con
                  mejor relación riesgo/recompensa según este modelo.
                </p>
              </div>

              <div className="gbc-cards" style={{ marginTop: 28 }}>
                <GuideRevealCard title="Suelo estimado de este ciclo" hint="Toca para revelar el rango">
                  <p>Este análisis sitúa el rango de suelo del ciclo actual para Bitcoin entre <strong>$40.000 y $50.000</strong>. No es un precio garantizado — el mercado podría no llegar a tocar ese rango, o perforarlo a la baja en un escenario más bajista de lo esperado.</p>
                </GuideRevealCard>
                <GuideRevealCard title="Objetivo del próximo ciclo alcista" hint="Toca para revelar el rango">
                  <p>Para el techo del próximo ciclo, tras el halving de 2028, el rango que maneja este análisis es amplio: entre <strong>$180.000 y $200.000</strong>. Cuanto más lejos en el tiempo, mayor es la incertidumbre — trátalo como una referencia orientativa, no como un objetivo fijo.</p>
                </GuideRevealCard>
              </div>

              <div className="gbc-box gbc-box--red" style={{ marginTop: 28 }}>
                <div className="gbc-box-title">Esto no es una promesa</div>
                <div className="gbc-box-body">
                  Ningún modelo de ciclos —por bueno que sea su histórico— predice el futuro con precisión de
                  calendario o de precio exacto. Los rangos anteriores son estimaciones basadas en patrones pasados.
                  El mercado cripto es volátil y puede invalidar cualquier expectativa en cualquier momento.
                </div>
              </div>
            </div>
          </section>

          {/* ── SECTION 4: ESTRATEGIA ── */}
          <section id="estrategia" className="gbc-section">
            <div className="gbc-gc">
              <div className="gbc-ey">Sección 4</div>
              <h2 className="gbc-title">Cómo posicionarse sin apostarlo todo a una fecha exacta</h2>
              <div className="gbc-body">
                <p>
                  Tener una tesis de ciclo no significa apostar todo tu capital de golpe a un mes concreto. La forma
                  más razonable de aplicar este análisis es con una estrategia escalonada:
                </p>
              </div>

              <div className="gbc-cards" style={{ marginTop: 8 }}>
                <div className="gbc-card">
                  <div className="gbc-card-title">1. Compra escalonada (DCA)</div>
                  <div className="gbc-card-text">
                    <p>En lugar de invertir todo de una vez, reparte las compras en el tiempo. Si el suelo llega antes o después de lo esperado, tu precio medio de entrada queda protegido.</p>
                  </div>
                </div>
                <div className="gbc-card">
                  <div className="gbc-card-title">2. Solo capital que puedas inmovilizar</div>
                  <div className="gbc-card-text">
                    <p>Un ciclo completo dura años. Invertir dinero que podrías necesitar a corto plazo te obliga a vender en el peor momento posible.</p>
                  </div>
                </div>
                <div className="gbc-card">
                  <div className="gbc-card-title">3. Prioriza Bitcoin, luego altcoins con convicción</div>
                  <div className="gbc-card-text">
                    <p>Bitcoin es la base del ciclo. Las altcoins amplifican el movimiento pero también el riesgo — solo tiene sentido rotar hacia ellas si entiendes el proyecto concreto.</p>
                  </div>
                </div>
                <div className="gbc-card">
                  <div className="gbc-card-title">4. Ten un plan de salida</div>
                  <div className="gbc-card-text">
                    <p>Igual que ayuda saber cuándo entrar, ayuda decidir de antemano en qué rangos de precio irás asegurando beneficios — antes de que la euforia del ciclo alcista nuble el criterio.</p>
                  </div>
                </div>
              </div>

              <div className="gbc-box gbc-box--green" style={{ marginTop: 28 }}>
                <div className="gbc-box-title">La idea de fondo</div>
                <div className="gbc-box-body">
                  Nadie acierta el suelo exacto ni el techo exacto. El objetivo de conocer el ciclo no es la
                  perfección de calendario, sino <strong>estar dentro del mercado con una estrategia clara</strong>,
                  en lugar de reaccionar por miedo cuando el precio ya se ha movido.
                </div>
              </div>
            </div>
          </section>

          {/* ── QUIZ ── */}
          <section id="quiz" className="gbc-section">
            <div className="gbc-gc">
              <div className="gbc-ey">Quiz final</div>
              <h2 className="gbc-title">Demuestra lo que sabes — 5 preguntas, badge en juego</h2>
              <div className="gbc-body" style={{ marginBottom: 32 }}>
                <p>Necesitas <strong>5/5</strong> respuestas correctas para desbloquear el badge <strong style={{ color: "var(--gold)" }}>Cazador de Ciclos</strong>. Sin prisa — puedes releer cualquier sección antes de responder.</p>
              </div>
              <GuideCycleQuiz />
            </div>
          </section>
        </>
      )}

      {/* ── Interacciones ── */}
      <section className="gbc-section gbc-interactions-section">
        <div className="gbc-gc">
          <div className="gbc-interactions-wrap">
            <p className="gbc-interactions-label">¿Te ha resultado útil esta guía?</p>
            <GuideInteractions
              guideSlug={SLUG}
              initialLikes={initialLikes}
              initialLiked={initialLiked}
              initialSaved={initialSaved}
              initialShares={initialShares}
              isLoggedIn={isRegistered}
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
