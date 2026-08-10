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
import GuideRenderNetwork from "./GuideRenderNetwork";
import GuideRenderTokenomics from "./GuideRenderTokenomics";
import GuideRenderQuiz from "./GuideRenderQuiz";
import "./render.css";

export const metadata: Metadata = {
  title: "¿Qué es Render (RENDER)? La Red que Alquila la Potencia de tu GPU",
  description:
    "Render explicado a fondo: cómo funciona el renderizado descentralizado, quién está detrás (OTOY y OctaneRender), su tokenomics Burn-and-Mint, la migración a Solana y por qué es la estrella del sector DePIN. Guía completa con simuladores, quiz y badge.",
  openGraph: {
    title: "¿Qué es Render (RENDER)? La Red que Alquila la Potencia de tu GPU",
    description: "Renderizado descentralizado con GPUs ociosas, Proof of Render, Burn-and-Mint Equilibrium, migración a Solana y la narrativa DePIN + IA. Con simuladores, quiz y badge.",
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
  { id: "riesgos", label: "Riesgos" },
  { id: "quiz", label: "Quiz" },
];

const HERO_STATS = [
  { prefix: "", value: 537, suffix: "M", dec: 0, label: "Suministro máximo\nde tokens RENDER" },
  { prefix: "", value: 2017, suffix: "", dec: 0, label: "Año del ICO\nfundacional (OTOY)" },
  { prefix: "", value: 2023, suffix: "", dec: 0, label: "Migración a\nla red Solana" },
  { prefix: "", value: 24, suffix: "/7", dec: 0, label: "GPUs ociosas\nrenderizando en red" },
];

const USES = [
  { icon: "🎬", title: "VFX y efectos de cine y TV", desc: "Estudios y artistas renderizan planos, efectos visuales y animación 3D repartiendo el trabajo entre miles de GPUs en lugar de comprar granjas de render carísimas.", ex: "Postproducción, tráilers, series" },
  { icon: "🎨", title: "Arte digital y NFTs", desc: "Artistas de obra generativa y 3D usan la red para producir piezas de altísima resolución que su equipo local no podría renderizar en tiempo razonable.", ex: "Beeple y artistas cripto de referencia" },
  { icon: "🤖", title: "Computación de IA y machine learning", desc: "Las mismas GPUs que renderizan gráficos sirven para entrenar y ejecutar modelos de IA — la red se ha ido abriendo a cargas de trabajo de inteligencia artificial.", ex: "Inferencia y entrenamiento de modelos" },
  { icon: "🕶️", title: "Metaverso y mundos 3D", desc: "Renderizado de entornos inmersivos, experiencias de realidad virtual y aumentada, y escenarios interactivos que exigen gráficos fotorrealistas en tiempo real o casi.", ex: "VR/AR, mundos virtuales" },
  { icon: "🏗️", title: "Gemelos digitales y visualización", desc: "Arquitectura, ingeniería y producto crean réplicas 3D fotorrealistas de edificios, ciudades o dispositivos para simular, presentar o inspeccionar antes de construir.", ex: "Arquitectura, automoción, industria" },
  { icon: "📺", title: "Motion graphics y publicidad", desc: "Agencias y creadores producen anuncios, cabeceras y gráficos animados de alta calidad sin cuellos de botella de hardware, escalando la potencia según el proyecto.", ex: "Spots, branding animado" },
];

const GLOSSARY_CARDS = [
  {
    title: "Render Network",
    frontText: "La red que da nombre al proyecto...",
    backText1: "Un mercado descentralizado donde quien necesita renderizar gráficos 3D contrata potencia de GPU a personas de todo el mundo que prestan la suya.",
    backText2: "Coordina el reparto de trabajos, verifica que se hacen bien y liquida los pagos en tokens RENDER.",
  },
  {
    title: "Node operator",
    frontText: "El que pone la potencia de cálculo...",
    backText1: "Una persona o empresa que conecta su GPU (o varias) a la red para renderizar los trabajos de otros mientras no la usa.",
    backText2: "A cambio recibe tokens RENDER. Es el equivalente al \"minero\", pero en lugar de resolver hashes, renderiza imágenes.",
  },
  {
    title: "OctaneRender / OTOY",
    frontText: "La tecnología y la empresa de origen...",
    backText1: "OTOY, fundada por Jules Urbach, desarrolla OctaneRender, uno de los motores de renderizado por GPU más usados en la industria del 3D.",
    backText2: "Render Network nació como la capa descentralizada que pone esa potencia de renderizado al alcance de cualquiera.",
  },
  {
    title: "Proof of Render",
    frontText: "Cómo la red confía en el trabajo hecho...",
    backText1: "El mecanismo que verifica que un node operator ha renderizado correctamente el trabajo que se le asignó, antes de liberar el pago.",
    backText2: "Protege al artista (recibe lo que pidió) y a la red (evita que un nodo cobre por trabajo mal hecho o falso).",
  },
  {
    title: "Burn-and-Mint Equilibrium",
    frontText: "El motor económico del token...",
    backText1: "Cuando un artista paga un trabajo se \"queman\" tokens RENDER; a la vez se \"emiten\" nuevos para recompensar a los nodos.",
    backText2: "El balance entre lo quemado y lo emitido determina si la oferta total de RENDER sube, baja o se mantiene.",
  },
  {
    title: "DePIN",
    frontText: "La categoría a la que pertenece Render...",
    backText1: "\"Decentralized Physical Infrastructure Networks\": redes que coordinan hardware físico del mundo real (aquí, GPUs) mediante incentivos en token.",
    backText2: "Render es uno de sus proyectos insignia, junto a redes de almacenamiento, conectividad o sensores.",
  },
];

const RISK_CARDS = [
  {
    title: "Dependencia de OTOY",
    frontText: "El origen es también una debilidad...",
    backText1: "Buena parte de la tecnología, las integraciones y la dirección del proyecto giran alrededor de OTOY y Jules Urbach.",
    backText2: "Una red que se presenta como descentralizada, pero muy ligada a una sola empresa, plantea dudas sobre su independencia real.",
  },
  {
    title: "Competencia feroz",
    frontText: "No está sola en el mercado de GPU...",
    backText1: "Compite con gigantes de la nube (AWS, Google Cloud) y con otras redes DePIN de cómputo GPU como Akash o io.net.",
    backText2: "Su ventaja depende de ofrecer precio, fiabilidad y calidad mejores que alquilar GPU por los canales tradicionales.",
  },
  {
    title: "Utilidad real vs. especulación",
    frontText: "¿Cuánto del volumen es uso genuino?...",
    backText1: "El precio de RENDER se ha movido mucho al calor de la narrativa IA + DePIN, no siempre en línea con la demanda real de renderizado.",
    backText2: "Para sostenerse a largo plazo, la red necesita trabajos de render de verdad, no solo entusiasmo de mercado.",
  },
  {
    title: "Fiabilidad de los nodos",
    frontText: "Repartir el trabajo tiene un coste...",
    backText1: "Depender de GPUs domésticas dispersas implica gestionar caídas, latencia, calidad desigual y verificación del trabajo.",
    backText2: "Por eso el Proof of Render y el sistema de reputación de nodos son piezas críticas: sin confianza, no hay red.",
  },
];

export default async function RenderPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const SLUG = "render";

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
          ¿Qué es Render?<br />
          <span className="gbc-hero-gold">La cripto que alquila la potencia de tu GPU.</span>
        </h1>
        <p className="gbc-hero-desc">
          Renderizar una escena 3D fotorrealista puede tardar horas en un solo ordenador — mientras
          millones de tarjetas gráficas por el mundo están apagadas o sin usar. Render conecta ambas
          cosas: quien necesita potencia de renderizado y quien tiene una GPU ociosa. Esto es Render,
          cómo funciona y por qué se ha convertido en la estrella del sector DePIN.
        </p>
        <div className="gbc-hero-pills">
          <span className="gbc-pill">8 secciones</span>
          <span className="gbc-pill">Simulador de red</span>
          <span className="gbc-pill">Tokenomics interactivo</span>
          <span className="gbc-pill">Quiz + Badge</span>
        </div>
        <GuideHeroStats stats={HERO_STATS} />
      </header>

      {/* ── SECCIÓN 1: ORIGEN ── FREE */}
      <section id="origen" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Sección 1 <span className="gbc-free-pill">Gratis</span></div>
          <h2 className="gbc-title">El problema: renderizar en 3D es carísimo y lento</h2>
          <div className="gbc-body">
            <p>
              Detrás de cada plano de una película de animación, de cada efecto visual imposible y de
              cada anuncio en 3D fotorrealista hay un proceso invisible y brutalmente exigente: el
              <strong> renderizado</strong>. Es el cálculo que convierte un modelo 3D en una imagen final,
              simulando cómo la luz rebota en cada superficie. Una sola imagen compleja puede tardar horas
              en calcularse, y una película tiene decenas de miles de fotogramas.
            </p>
            <p>
              Para hacerlo, los estudios montan «granjas de render»: naves llenas de tarjetas gráficas (GPUs)
              que cuestan una fortuna en hardware, electricidad y mantenimiento. Los que no pueden permitírselo
              alquilan potencia en la nube (AWS, Google Cloud), que también sale cara. Mientras tanto,
              millones de GPUs potentes —en ordenadores de gamers, estudios pequeños o mineros reconvertidos—
              pasan gran parte del día <strong>encendidas sin hacer nada útil</strong>.
            </p>
          </div>

          <div className="gbc-quote">
            <div className="gbc-quote-t">
              «El poder de cómputo gráfico del mundo está infrautilizado. Si pudiéramos conectar toda esa
              GPU ociosa en una sola red, tendríamos una capacidad de renderizado prácticamente ilimitada.»
            </div>
            <div className="gbc-quote-a">— La tesis fundacional de Render, impulsada por Jules Urbach (OTOY)</div>
          </div>

          <div className="gbc-body" style={{ marginTop: 28 }}>
            <p>
              De esa idea nació Render Network. Su creador, <strong>Jules Urbach</strong>, no es un recién
              llegado: lleva décadas en el mundo del renderizado como fundador de <strong>OTOY</strong>, la
              empresa detrás de <strong>OctaneRender</strong>, uno de los motores de render por GPU más usados
              de la industria. Render es su apuesta por descentralizar esa potencia: en lugar de granjas
              propiedad de unos pocos, un mercado abierto donde cualquiera con una buena GPU puede ofrecer su
              capacidad y cobrar por ella.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 2: CÓMO FUNCIONA ── FREE */}
      <section id="como-funciona" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Sección 2 <span className="gbc-free-pill">Gratis</span></div>
          <h2 className="gbc-title">Cómo funciona: un mercado de GPUs que se reparten el trabajo</h2>
          <div className="gbc-body">
            <p>
              El funcionamiento tiene tres protagonistas. Por un lado, el <strong>artista o estudio</strong>
              que necesita renderizar y sube su trabajo a la red. Por otro, los <strong>node operators</strong>:
              personas que conectan su GPU ociosa para hacer ese trabajo a cambio de tokens RENDER. Y en el
              medio, la <strong>red Render</strong>, que reparte las tareas, verifica los resultados y liquida
              los pagos.
            </p>
            <p>
              La clave está en el <strong>reparto en paralelo</strong>. Un trabajo de render no se envía entero
              a una sola máquina: se trocea en fragmentos (tiles o fotogramas) que se distribuyen entre muchas
              GPUs a la vez. Cada una renderiza su parte y devuelve el resultado, que la red recompone. Así, un
              trabajo que tardaría horas en un solo equipo puede terminarse en minutos entre decenas de nodos.
            </p>
          </div>

          <GuideRenderNetwork />

          <div className="gbc-box gbc-box--gold" style={{ marginTop: 28 }}>
            <div className="gbc-box-title">La pieza de confianza: Proof of Render</div>
            <div className="gbc-box-body">
              <p>¿Cómo sabe la red que un nodo ha hecho bien su trabajo antes de pagarle? Mediante el
              <em> Proof of Render</em>: un sistema de verificación y reputación que comprueba que el resultado
              es correcto y penaliza a quien intente cobrar por trabajo defectuoso o falso. Sin este mecanismo,
              nadie confiaría su render —ni su dinero— a un desconocido al otro lado de internet.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PAYWALL si no registrado ── */}
      {!isRegistered ? (
        <section id="estado-actual" className="gbc-section">
          <div className="gbc-gc">
            <div className="gbc-ey">Sección 3–8 <span className="gbc-lock-pill">Registro gratuito</span></div>
            <h2 className="gbc-title">Estado 2026, casos de uso, tokenomics y riesgos</h2>
            <div className="gbc-body">
              <p>Las secciones siguientes cubren el estado actual de Render, sus casos de uso reales, la
              migración a Solana, el glosario de términos clave, cómo funciona su tokenomics Burn-and-Mint de
              forma interactiva, los riesgos del proyecto, el vídeo explicativo y el quiz con badge de logro.</p>
            </div>
            <div className="gbc-paywall">
              <div className="gbc-paywall-badge">🔓 Has leído 2 de 8 secciones</div>
              <div className="gbc-paywall-t">Regístrate gratis para leer la guía completa</div>
              <div className="gbc-paywall-d">
                Desbloquea las 6 secciones restantes: el estado de Render en 2026, sus casos de uso, el
                glosario interactivo, el simulador de tokenomics Burn-and-Mint, los riesgos reales del
                proyecto, el vídeo y el quiz con tu badge <strong>Nodo Verificado</strong>. Sin tarjeta, en
                30 segundos.
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
              <h2 className="gbc-title">Render en 2026: de RNDR en Ethereum a RENDER en Solana</h2>
              <div className="gbc-body">
                <p>
                  Render no ha dejado de moverse. Nació con un ICO en 2017 impulsado por OTOY y lanzó su
                  mainnet sobre Ethereum en 2020, con el token bajo el ticker <strong>RNDR</strong>. Pero las
                  comisiones altas y la congestión de Ethereum lastraban una red que necesita liquidar muchos
                  micropagos entre artistas y nodos.
                </p>
                <p>
                  La respuesta llegó a finales de <strong>2023</strong>: la comunidad aprobó migrar la red a
                  <strong> Solana</strong>, una blockchain mucho más rápida y barata, y aprovechó para renombrar
                  el token de <strong>RNDR a RENDER</strong>. Desde entonces, el proyecto ha surfeado la
                  narrativa que lo cambió todo en 2024: la unión de <strong>IA y DePIN</strong>. Las mismas GPUs
                  que renderizan gráficos sirven para entrenar y ejecutar modelos de inteligencia artificial, y
                  eso colocó a Render en el centro de una de las tesis de inversión más calientes del sector.
                </p>
              </div>

              <div className="gbc-stats">
                <GuideAnimatedStat end={537} suffix="M" decimals={0} label="Suministro máximo de tokens RENDER" source="Render Network Foundation" />
                <GuideAnimatedStat end={2017} decimals={0} label="Año del ICO fundacional (OTOY)" source="Render Network" />
                <GuideAnimatedStat end={2023} decimals={0} label="Migración de Ethereum a Solana" source="Render Network Foundation" />
                <GuideAnimatedStat end={1} suffix="º" decimals={0} label="Referente del sector DePIN de GPU" source="Narrativa de mercado 2024–2026" />
              </div>

              <div className="gbc-box gbc-box--green" style={{ marginTop: 28 }}>
                <div className="gbc-box-title">Gobernanza por propuestas: las RNP</div>
                <div className="gbc-box-body">
                  <p>Los grandes cambios de Render —incluida la migración a Solana o su modelo económico— no
                  los decide una sola empresa a puerta cerrada, sino que se discuten y votan como
                  <em> Render Network Proposals</em> (RNP), al estilo de otras comunidades cripto. Es el intento
                  del proyecto de gobernarse de forma cada vez más descentralizada, aunque, como veremos en los
                  riesgos, el peso de OTOY sigue siendo grande.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── SECCIÓN 4: CASOS DE USO ── */}
          <section id="casos-de-uso" className="gbc-section">
            <div className="gbc-gc">
              <div className="gbc-ey">Sección 4</div>
              <h2 className="gbc-title">Para qué se usa Render de verdad</h2>
              <div className="gbc-body">
                <p>
                  Render no es una idea abstracta: mueve trabajo real. Empezó centrado en el renderizado 3D y
                  los efectos visuales, y con el tiempo se ha ido abriendo a la computación de IA y a mundos
                  inmersivos. Estos son sus usos principales.
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
              <h2 className="gbc-title">Tokenomics: cómo el token RENDER conecta pagos y recompensas</h2>
              <div className="gbc-body">
                <p>
                  El token RENDER es el que engrasa toda la máquina. Los artistas pagan sus trabajos en RENDER
                  y los node operators cobran en RENDER. Pero lo interesante es <strong>cómo</strong> se conecta
                  lo uno con lo otro: mediante un modelo llamado <strong>Burn-and-Mint Equilibrium</strong> (BME).
                </p>
                <p>
                  La idea es sencilla: cuando un artista paga un trabajo, esos tokens se <strong>queman</strong>
                  (burn) — desaparecen de circulación. A la vez, la red <strong>emite</strong> (mint) tokens
                  nuevos para pagar a los nodos que hicieron el trabajo. Si se quema más de lo que se emite, la
                  oferta baja (deflacionario); si se emite más de lo que se quema, sube (inflacionario). Prueba
                  a mover la demanda y observa el efecto:
                </p>
              </div>

              <GuideRenderTokenomics />

              <div className="gbc-box gbc-box--gold" style={{ marginTop: 28 }}>
                <div className="gbc-box-title">Por qué importa el equilibrio</div>
                <div className="gbc-box-body">
                  <p>El BME ata el valor del token a la <strong>utilidad real</strong> de la red: cuanto más
                  renderizado de verdad se paga, más RENDER se quema. En teoría, una red muy usada tiende a ser
                  deflacionaria, lo que alinea el interés de los que tienen tokens con el crecimiento del uso.
                  El reto es que ese uso sea genuino y no solo especulación — algo que abordamos en los riesgos.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── SECCIÓN 6: RIESGOS ── */}
          <section id="riesgos" className="gbc-section">
            <div className="gbc-gc">
              <div className="gbc-ey">Sección 6 · Riesgos reales</div>
              <h2 className="gbc-title">Lo que puede salir mal: dependencia, competencia y especulación</h2>
              <div className="gbc-body">
                <p>
                  Render es uno de los proyectos DePIN más sólidos por tener un producto y una empresa reales
                  detrás, pero eso no lo hace inmune a los riesgos. Antes de sacar conclusiones, conviene mirar
                  las cuatro tensiones que más se le señalan.
                </p>
              </div>

              <div className="gbc-fc-section" style={{ padding: 0 }}>
                <h3 className="gbc-title" style={{ fontSize: 20, marginTop: 8 }}>Radar de riesgos — haz clic en cada tarjeta</h3>
                <GuideFlipCards cards={RISK_CARDS} />
              </div>

              <div className="gbc-box gbc-box--red" style={{ marginTop: 28 }}>
                <div className="gbc-box-title">La pregunta que decide su futuro</div>
                <div className="gbc-box-body">
                  <p>Todo se reduce a una cosa: ¿habrá suficiente demanda real de renderizado (y de cómputo de
                  IA) para sostener la red más allá de los ciclos de entusiasmo del mercado? Si la respuesta es
                  sí, Render tiene una utilidad tangible que pocas criptomonedas pueden presumir. Si es no, su
                  valor dependerá sobre todo de la narrativa. Esta guía es educativa y no es consejo de
                  inversión: infórmate y decide por ti mismo.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── VÍDEO ── */}
          <section id="video" className="gbc-section">
            <div className="gbc-gc">
              <GuideVideoEmbed youtubeId="tPUQUnytU_Q" title="¿Qué es Render Network? Explicado" />
            </div>
          </section>

          {/* ── QUIZ ── */}
          <section id="quiz" className="gbc-section">
            <div className="gbc-gc">
              <div className="gbc-ey">Quiz final</div>
              <h2 className="gbc-title">Demuestra lo que sabes — 5 preguntas, badge en juego</h2>
              <div className="gbc-body" style={{ marginBottom: 32 }}>
                <p>Necesitas <strong>5/5</strong> respuestas correctas para desbloquear el badge <strong style={{ color: "var(--gold)" }}>Nodo Verificado</strong>. Sin prisa — puedes releer cualquier sección antes de responder.</p>
              </div>
              <GuideRenderQuiz />
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
