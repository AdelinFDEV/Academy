import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Footer from "@/components/Footer";
import AsesoriaBand from "@/components/AsesoriaBand";
import SiteNav from "@/components/SiteNav";
import GuideProgressBar from "@/components/GuideProgressBar";
import GuideHeroStats from "@/components/GuideHeroStats";
import GuideAnimatedStat from "@/components/GuideAnimatedStat";
import GuideSpotlightCards from "@/components/GuideSpotlightCards";
import GuideFlipCards from "@/components/GuideFlipCards";
import GuideInteractions from "@/components/GuideInteractions";
import GuideVisitTracker from "@/components/GuideVisitTracker";
import GuideVideoEmbed from "@/components/GuideVideoEmbed";
import GuideOrbScanner from "./GuideOrbScanner";
import GuideWorldTokenomics from "./GuideWorldTokenomics";
import GuideWorldQuiz from "./GuideWorldQuiz";

export const metadata: Metadata = {
  alternates: { canonical: "/guias/worldcoin" },
  title: "¿Qué es Worldcoin? La Cripto que Escanea tu Iris",
  description:
    "Worldcoin explicado a fondo: el Orb, World ID, World Chain, el token WLD y por qué el proyecto de Sam Altman ha sido prohibido en varios países. Guía completa con quiz y badge.",
  openGraph: {
    title: "¿Qué es Worldcoin? La Criptomoneda que Escanea tu Iris",
    description: "Cómo funciona el Orb, qué es la prueba de personalidad (Proof of Personhood), tokenomics de WLD y las controversias regulatorias. Con simulador, quiz y badge.",
    type: "article",
  },
};

const SECTIONS = [
  { id: "origen", label: "Origen" },
  { id: "como-funciona", label: "Cómo funciona" },
  { id: "estado-actual", label: "Estado 2026" },
  { id: "casos-de-uso", label: "Casos de uso" },
  { id: "flashcards", label: "Glosario" },
  { id: "tokenomics", label: "Tokenomics" },
  { id: "controversias", label: "Controversias" },
  { id: "quiz", label: "Quiz" },
];

const HERO_STATS = [
  { prefix: "", value: 26, suffix: "M+", dec: 0, label: "Humanos verificados\ncon el Orb" },
  { prefix: "", value: 160, suffix: "+", dec: 0, label: "Países con\nOrbs activos" },
  { prefix: "", value: 10, suffix: "B", dec: 0, label: "Tope máximo\nde tokens WLD" },
  { prefix: "", value: 15, suffix: " años", dec: 0, label: "Plazo de reparto\nde grants" },
];

const USES = [
  { icon: "🆔", title: "World ID: identidad sin identidad", desc: "Demuestra que eres un humano único ante cualquier app, sin revelar quién eres, mediante pruebas de conocimiento cero.", ex: "World App, integraciones de terceros" },
  { icon: "💰", title: "Grants tipo renta básica", desc: "Cada humano verificado recibe WLD periódicamente — el experimento de UBI cripto más grande jamás intentado.", ex: "World App, grants semanales" },
  { icon: "🗳️", title: "Votaciones sin bots ni duplicados", desc: "Sistemas de voto y encuestas donde cada persona cuenta exactamente una vez, sin cuentas falsas ni granjas de bots.", ex: "DAOs, consultas públicas piloto" },
  { icon: "🎯", title: "Airdrops resistentes a sybil attacks", desc: "Proyectos reparten tokens solo entre humanos verificados, evitando que una sola persona reclame miles de veces con bots.", ex: "Airdrops en World Chain" },
  { icon: "🔞", title: "Verificación de edad privada", desc: "Demuestra que eres mayor de edad sin enseñar tu DNI ni tu fecha de nacimiento real a la plataforma.", ex: "Apps de contenido restringido" },
  { icon: "🤖", title: "Distinguir humano de IA", desc: "En la era de los deepfakes y los agentes de IA, World ID certifica que hay una persona real detrás de una cuenta o publicación.", ex: "Redes sociales, foros" },
];

const GLOSSARY_CARDS = [
  {
    title: "El Orb",
    frontText: "El dispositivo esférico que escanea tu iris para verificarte...",
    backText1: "Un aparato biométrico del tamaño de un balón que fotografía el patrón único de tu iris con cámaras infrarrojas.",
    backText2: "Convierte esa imagen en un código matemático (hash) y, según Tools for Humanity, borra la imagen original tras procesarla.",
  },
  {
    title: "World ID",
    frontText: "Tu pasaporte de \"humano único\" en internet...",
    backText1: "Una credencial criptográfica que certifica que eres una persona real y que no te has verificado dos veces.",
    backText2: "No contiene tu nombre ni tus datos — solo prueba el hecho de que eres un humano único, mediante pruebas de conocimiento cero.",
  },
  {
    title: "Proof of Personhood",
    frontText: "El problema que Worldcoin intenta resolver...",
    backText1: "Cómo demostrar en internet que eres una persona real y no un bot, un script o una IA, sin depender de un DNI centralizado.",
    backText2: "Es el equivalente digital de mostrar tu cara — pero verificable matemáticamente y sin intermediarios.",
  },
  {
    title: "Sybil attack",
    frontText: "El ataque que Worldcoin quiere hacer imposible...",
    backText1: "Cuando una sola persona crea miles de identidades falsas para acaparar votos, airdrops o recursos que deberían repartirse entre muchos.",
    backText2: "World ID lo bloquea porque cada iris humano solo puede generar un World ID válido.",
  },
  {
    title: "Tools for Humanity",
    frontText: "La empresa detrás de Worldcoin...",
    backText1: "Fundada en 2019 por Sam Altman (CEO de OpenAI), Alex Blania y Max Novendstern.",
    backText2: "Ha recaudado más de $250M de fondos como a16z, Bain Capital Crypto y Khosla Ventures.",
  },
  {
    title: "World Chain",
    frontText: "Dónde vive el token WLD...",
    backText1: "Una Layer 2 de Ethereum construida sobre OP Stack (la tecnología de Optimism), dentro de la Superchain.",
    backText2: "Prioriza las transacciones de usuarios verificados con World ID frente al tráfico de bots.",
  },
];

const COUNTRY_CARDS = [
  {
    title: "🇰🇪 Kenia",
    frontText: "El primer país en frenar a Worldcoin, en agosto de 2023...",
    backText1: "El gobierno suspendió el registro de Orbs por preocupaciones sobre seguridad de datos y por las largas colas de gente pobre buscando cobrar la recompensa.",
    backText2: "Se reanudó parcialmente en 2024 bajo condiciones más estrictas de supervisión.",
  },
  {
    title: "🇪🇸 España",
    frontText: "La Agencia de Protección de Datos actuó en marzo de 2024...",
    backText1: "La AEPD ordenó una medida cautelar urgente para detener el procesamiento de datos biométricos, citando riesgo para menores y falta de consentimiento informado claro.",
    backText2: "La prohibición temporal fue recurrida y parcialmente revisada por tribunales españoles meses después.",
  },
  {
    title: "🇭🇰 Hong Kong",
    frontText: "Prohibición directa por parte del regulador de privacidad...",
    backText1: "La Oficina del Comisionado de Privacidad declaró la recogida de datos biométricos \"excesiva\" e innecesaria para el fin declarado.",
    backText2: "Ordenó a Worldcoin cesar operaciones y borrar los datos ya recogidos de residentes de Hong Kong.",
  },
  {
    title: "🇵🇹 Portugal / 🇫🇷 Francia",
    frontText: "Investigaciones abiertas por las autoridades de protección de datos...",
    backText1: "Portugal impuso restricciones temporales al procesamiento de datos de menores. La CNIL francesa cuestionó la legalidad del consentimiento y la compensación económica por datos biométricos.",
    backText2: "Ambos casos reflejan la misma tensión: ¿es válido \"pagar\" a alguien por sus datos biométricos más sensibles?",
  },
];

export default async function WorldcoinPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const SLUG = "worldcoin";

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
  const initialLikes  = (likesResult as { count?: number | null }).count ?? 0;
  const initialSaved  = !!(savedResult as { data?: unknown }).data;
  const initialShares = (sharesResult as { count?: number | null }).count ?? 0;

  return (
    <div className="gbc-wrap">
      <GuideVisitTracker guideSlug={SLUG} />
      <GuideProgressBar />

      <SiteNav user={!!user} isPremium={isPremium} userName={user ? userName : undefined} isAdmin={isAdmin} />

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
        <div className="gbc-hero-ey">Guía de criptomonedas · AdelinBTC Academy · 2026</div>
        <h1 className="gbc-hero-title">
          ¿Qué es Worldcoin?<br />
          <span className="gbc-hero-gold">La cripto que te paga por escanear tu iris.</span>
        </h1>
        <p className="gbc-hero-desc">
          Sam Altman, el CEO de OpenAI, cree que en un mundo lleno de IA vamos a necesitar una forma
          de demostrar que somos humanos. Su respuesta: un dispositivo esférico llamado Orb que escanea
          tu iris y te regala criptomoneda a cambio. Esto es Worldcoin — cómo funciona, y por qué
          medio mundo lo está investigando.
        </p>
        <div className="gbc-hero-pills">
          <span className="gbc-pill">8 secciones</span>
          <span className="gbc-pill">Simulador del Orb</span>
          <span className="gbc-pill">Quiz + Badge</span>
          <span className="gbc-pill">Vídeo</span>
        </div>
        <GuideHeroStats stats={HERO_STATS} />
      </header>

      {/* ── SECCIÓN 1: ORIGEN ── FREE */}
      <section id="origen" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Sección 1 <span className="gbc-free-pill">Gratis</span></div>
          <h2 className="gbc-title">El problema que Sam Altman quiere resolver: ¿quién es humano?</h2>
          <div className="gbc-body">
            <p>
              En 2019, mientras dirigía OpenAI y veía de primera mano hacia dónde iba la inteligencia artificial,
              Sam Altman llegó a una conclusión incómoda: si la IA puede generar texto, voces, caras y
              comportamientos indistinguibles de los humanos, internet va a tener un problema fundamental —
              ya no vamos a poder saber si hay una persona real al otro lado de una pantalla.
            </p>
            <p>
              Junto al físico Alex Blania y Max Novendstern, fundó Tools for Humanity con una propuesta radical:
              un sistema biométrico que verifica que eres un humano único — sin depender de un DNI, un gobierno
              o una red social — y que, de paso, reparte una nueva criptomoneda entre todos los verificados como
              una especie de renta básica universal experimental.
            </p>
          </div>

          <div className="gbc-quote">
            <div className="gbc-quote-t">
              «Si la IA automatiza la mayoría del trabajo, necesitaremos algo como una renta básica universal.
              Y para repartirla de forma justa, primero necesitas saber quién es una persona real.»
            </div>
            <div className="gbc-quote-a">— Sam Altman, sobre la tesis fundacional de Worldcoin</div>
          </div>

          <div className="gbc-body" style={{ marginTop: 28 }}>
            <p>
              El proyecto se presentó públicamente en 2021 y lanzó su token en julio de 2023. En 2025, la
              compañía renombró el ecosistema de <strong>Worldcoin</strong> a <strong>World</strong>, para dejar claro
              que el proyecto es mucho más que un token: es una identidad digital (World ID), una app (World App) y
              su propia red blockchain (World Chain). El token sigue llamándose WLD.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 2: CÓMO FUNCIONA ── FREE */}
      <section id="como-funciona" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Sección 2 <span className="gbc-free-pill">Gratis</span></div>
          <h2 className="gbc-title">Cómo funciona: el Orb, World ID y World Chain</h2>
          <div className="gbc-body">
            <p>
              El proceso, en teoría, es sencillo. Te acercas a un Orb — un dispositivo esférico pulido,
              del tamaño de un balón de playa — miras a su cámara durante unos segundos, y este captura el
              patrón único de tu iris con sensores infrarrojos y de luz visible.
            </p>
            <p>
              Ese patrón se convierte en un código matemático (un <em>hash</em>) que representa tu iris sin ser
              una imagen legible. Según Tools for Humanity, la fotografía original se elimina del dispositivo tras
              el procesado — solo el hash, cifrado, se usa para comprobar en el futuro que ese iris no se ha
              verificado ya con otra cuenta. A cambio, recibes tu <strong>World ID</strong> y un primer reparto de
              tokens WLD en la app.
            </p>
          </div>

          <div className="gbc-box gbc-box--gold" style={{ marginTop: 28 }}>
            <div className="gbc-box-title">La pieza clave: pruebas de conocimiento cero</div>
            <div className="gbc-box-body">
              <p>Cuando usas World ID para verificarte en una app, no le envías tu iris ni tu hash — le envías una
              <em> prueba matemática</em> de que posees un World ID válido y único, sin revelar cuál. Es como
              demostrar que tienes carné de conducir sin enseñar el carné: la app solo aprende «sí, es un
              humano único verificado», nada más.</p>
            </div>
          </div>

          <GuideOrbScanner />
        </div>
      </section>

      {/* ── PAYWALL si no registrado ── */}
      {!isRegistered ? (
        <section id="estado-actual" className="gbc-section">
          <div className="gbc-gc">
            <div className="gbc-ey">Sección 3–8 <span className="gbc-lock-pill">Registro gratuito</span></div>
            <h2 className="gbc-title">Estado 2026, casos de uso, tokenomics y controversias</h2>
            <div className="gbc-body">
              <p>Las secciones siguientes cubren el estado actual de Worldcoin, sus casos de uso reales, cómo
              se reparte el token WLD, las prohibiciones y controversias regulatorias en distintos países,
              el vídeo del canal explicándolo todo, y el quiz interactivo con badge de logro.</p>
            </div>
            <div className="gbc-paywall">
              <div className="gbc-paywall-badge">🔓 Has leído 2 de 8 secciones</div>
              <div className="gbc-paywall-t">Regístrate gratis para leer la guía completa</div>
              <div className="gbc-paywall-d">
                Desbloquea las 6 secciones restantes: cifras reales de adopción, casos de uso, tokenomics
                de WLD, el mapa de países que lo han prohibido, el vídeo explicativo, el quiz interactivo
                y tu badge <strong>Prueba de Humanidad</strong>. Sin tarjeta, en 30 segundos.
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
          {/* ── SECCIÓN 3: ESTADO 2026 ── */}
          <section id="estado-actual" className="gbc-section">
            <div className="gbc-gc">
              <div className="gbc-ey">Sección 3</div>
              <h2 className="gbc-title">Worldcoin en 2026: de experimento a red global</h2>
              <div className="gbc-body">
                <p>
                  Lo que empezó como un proyecto experimental con un puñado de Orbs en San Francisco y Nairobi
                  se ha convertido en una de las redes de identidad digital más grandes del mundo. Más de 26
                  millones de personas han pasado por un Orb, y la compañía sigue desplegando dispositivos —
                  ahora también en tiendas, quioscos y puntos de venta en más de 160 países.
                </p>
                <p>
                  World Chain, la Layer 2 de Ethereum del proyecto, prioriza el tráfico de usuarios verificados
                  con World ID frente al de bots — una propuesta directa contra el problema del spam y el MEV
                  (extracción de valor por bots) que afecta a otras redes.
                </p>
              </div>

              <div className="gbc-stats">
                <GuideAnimatedStat end={26} suffix="M+" decimals={0} label="Humanos verificados con el Orb" source="Tools for Humanity, 2026" />
                <GuideAnimatedStat end={160} suffix="+" decimals={0} label="Países con Orbs activos" source="World Network, 2026" />
                <GuideAnimatedStat end={250} prefix="$" suffix="M+" decimals={0} label="Financiación recaudada" source="Crunchbase, rondas acumuladas" />
                <GuideAnimatedStat end={10} suffix="B" decimals={0} label="Tope máximo de tokens WLD" source="Worldcoin Foundation" />
              </div>

              <div className="gbc-box gbc-box--green" style={{ marginTop: 28 }}>
                <div className="gbc-box-title">De Worldcoin a World</div>
                <div className="gbc-box-body">
                  <p>En 2025 la marca «Worldcoin» pasó a un segundo plano y la compañía adoptó «World» como
                  nombre paraguas de todo el ecosistema: World ID (identidad), World App (la super-app/wallet)
                  y World Chain (la red). El token conserva el ticker WLD. El cambio refleja la ambición del
                  proyecto: dejar de ser «una cripto más» para convertirse en la capa de identidad de internet.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── SECCIÓN 4: CASOS DE USO ── */}
          <section id="casos-de-uso" className="gbc-section">
            <div className="gbc-gc">
              <div className="gbc-ey">Sección 4</div>
              <h2 className="gbc-title">Para qué sirve World ID más allá de cobrar tokens</h2>
              <div className="gbc-body">
                <p>
                  El reparto de WLD es solo el gancho inicial. El verdadero producto es World ID, y ya se está
                  usando — o probando — para resolver problemas muy concretos de la era digital.
                </p>
              </div>
              <GuideSpotlightCards uses={USES} />
            </div>
          </section>

          {/* ── FLASHCARDS: GLOSARIO ── */}
          <section id="flashcards" className="gbc-fc-section">
            <div className="gbc-gc">
              <div className="gbc-ey">Glosario</div>
              <h2 className="gbc-title">Términos clave — haz clic para ver la definición</h2>
              <GuideFlipCards cards={GLOSSARY_CARDS} />
            </div>
          </section>

          {/* ── SECCIÓN 5: TOKENOMICS ── */}
          <section id="tokenomics" className="gbc-section">
            <div className="gbc-gc">
              <div className="gbc-ey">Sección 5</div>
              <h2 className="gbc-title">Tokenomics: cómo se reparten los 10.000 millones de WLD</h2>
              <div className="gbc-body">
                <p>
                  El suministro de WLD tiene un tope máximo de 10.000 millones de tokens. La mayor parte —
                  tres de cada cuatro tokens — está reservada para repartirse entre los humanos verificados a
                  lo largo de unos 15 años, en forma de grants periódicos. El resto se divide entre el equipo
                  de Tools for Humanity, los inversores que financiaron el proyecto antes del lanzamiento, y
                  una reserva gestionada por la Worldcoin Foundation.
                </p>
              </div>
              <GuideWorldTokenomics />
              <div className="gbc-box gbc-box--gold" style={{ marginTop: 28 }}>
                <div className="gbc-box-title">Por qué importa el reparto a 15 años</div>
                <div className="gbc-box-body">
                  <p>Repartir el 75% del suministro tan lentamente busca dos cosas: evitar que la entrada masiva
                  de tokens dispare la inflación de golpe, y dar tiempo a que la red crezca — cuantos más humanos
                  se verifiquen con el tiempo, más «tarta» queda por repartir entre los que llegan tarde. Los
                  tokens del equipo e inversores, como en la mayoría de proyectos cripto, están sujetos a
                  periodos de bloqueo (vesting) para evitar ventas masivas nada más salir a bolsa.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── SECCIÓN 6: CONTROVERSIAS ── */}
          <section id="controversias" className="gbc-section">
            <div className="gbc-gc">
              <div className="gbc-ey">Sección 6 · Riesgos reales</div>
              <h2 className="gbc-title">Las controversias: privacidad, ética y prohibiciones</h2>
              <div className="gbc-body">
                <p>
                  Worldcoin no ha sido bien recibido en todas partes. Pedir a millones de personas que entreguen
                  su dato biométrico más único e irremplazable — el iris no se puede «cambiar» como una
                  contraseña si se filtra — ha puesto al proyecto bajo la lupa de reguladores de todo el mundo.
                </p>
                <p>
                  Hay dos críticas centrales. La <strong>de privacidad</strong>: ¿qué pasa si esa base de datos
                  biométrica se filtra o se usa para algo distinto a lo prometido? Y la <strong>ética</strong>:
                  varios de los primeros despliegues del Orb se hicieron en países con ingresos bajos —
                  Kenia, Indonesia — pagando cantidades pequeñas a cambio del escaneo, lo que generó dudas
                  sobre si el consentimiento era realmente libre o si se estaba explotando la necesidad económica
                  de la gente.
                </p>
              </div>

              <div className="gbc-fc-section" style={{ padding: 0 }}>
                <h3 className="gbc-title" style={{ fontSize: 20, marginTop: 8 }}>Radar regulatorio — haz clic en cada país</h3>
                <GuideFlipCards cards={COUNTRY_CARDS} />
              </div>

              <div className="gbc-box gbc-box--red" style={{ marginTop: 28 }}>
                <div className="gbc-box-title">El riesgo que no tiene marcha atrás</div>
                <div className="gbc-box-body">
                  <p>Una contraseña filtrada se puede cambiar. Una tarjeta de crédito robada se puede cancelar.
                  Un iris filtrado es para siempre — es la razón por la que los reguladores tratan los datos
                  biométricos con un estándar de protección mucho más alto que cualquier otro dato personal.
                  Tools for Humanity insiste en que no almacena imágenes y en que el sistema está diseñado para
                  minimizar ese riesgo, pero la discusión sobre si es suficiente sigue abierta en varios países.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── VÍDEO ── */}
          <section id="video" className="gbc-section">
            <div className="gbc-gc">
              <GuideVideoEmbed youtubeId="SXYGxTEcP_w" title="¿Qué es Worldcoin? Explicado" />
            </div>
          </section>

          {/* ── QUIZ ── */}
          <section id="quiz" className="gbc-section">
            <div className="gbc-gc">
              <div className="gbc-ey">Quiz final</div>
              <h2 className="gbc-title">Demuestra lo que sabes — 5 preguntas, badge en juego</h2>
              <div className="gbc-body" style={{ marginBottom: 32 }}>
                <p>Necesitas <strong>5/5</strong> respuestas correctas para desbloquear el badge <strong style={{ color: "var(--gold)" }}>Prueba de Humanidad</strong>. Sin prisa — puedes releer cualquier sección antes de responder.</p>
              </div>
              <GuideWorldQuiz />
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

      {/* Asesoria 1:1 */}
      <AsesoriaBand variant="guide" />

      <Footer />
    </div>
  );
}
