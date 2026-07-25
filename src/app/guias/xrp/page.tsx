import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import GuideProgressBar from "@/components/GuideProgressBar";
import GuideHeroStats from "@/components/GuideHeroStats";
import GuideAnimatedStat from "@/components/GuideAnimatedStat";
import GuideSpotlightCards from "@/components/GuideSpotlightCards";
import GuideFlipCards from "@/components/GuideFlipCards";
import GuideInteractions from "@/components/GuideInteractions";
import GuideVisitTracker from "@/components/GuideVisitTracker";
import GuideXrpConsensus from "./GuideXrpConsensus";
import GuideXrpQuiz from "./GuideXrpQuiz";
import "./xrp.css";

export const metadata: Metadata = {
  title: "¿Qué es XRP y Ripple? El Activo Puente para Pagos Globales | AdelinBTC Academy",
  description:
    "XRP, Ripple y el XRP Ledger explicados a fondo: la diferencia entre la empresa y el activo, el consenso sin minería del XRPL (RPCA y la UNL), XRP como moneda puente en pagos internacionales, el juicio con la SEC, el escrow y los riesgos de centralización. Con simulador de consenso, quiz y badge.",
  openGraph: {
    title: "¿Qué es XRP y Ripple? El Activo Puente para Pagos Globales",
    description:
      "Ripple vs XRP vs XRPL, consenso RPCA/UNL, moneda puente y ODL, el caso SEC y el escrow. Con simulador de consenso, quiz y badge.",
    type: "article",
  },
};

const SECTIONS = [
  { id: "problema", label: "El problema" },
  { id: "como-funciona", label: "Cómo funciona" },
  { id: "estado-actual", label: "Estado 2026" },
  { id: "casos-de-uso", label: "Casos de uso" },
  { id: "glosario", label: "Glosario" },
  { id: "tokenomics", label: "Tokenomics" },
  { id: "riesgos", label: "Riesgos" },
  { id: "quiz", label: "Quiz" },
];

const HERO_STATS = [
  { prefix: "", value: 2012, suffix: "", dec: 0, label: "Año de creación\ndel XRP Ledger" },
  { prefix: "", value: 4, suffix: "s", dec: 0, label: "Segundos en cerrar\ncada ledger (aprox.)" },
  { prefix: "", value: 100, suffix: "B", dec: 0, label: "XRP preminados\nal inicio" },
  { prefix: "", value: 2023, suffix: "", dec: 0, label: "Fallo clave del\ncaso SEC (jueza Torres)" },
];

const USES = [
  { icon: "🌍", title: "Pagos transfronterizos", desc: "Mover valor entre países en segundos y con comisiones ínfimas, evitando la lentitud y el coste de la red bancaria tradicional (SWIFT y bancos corresponsales).", ex: "Remesas, pagos B2B internacionales" },
  { icon: "🌉", title: "Liquidez bajo demanda (ODL)", desc: "Usar XRP como moneda puente para no tener dinero inmovilizado en cuentas por todo el mundo: se convierte a XRP, se mueve y se cambia a la divisa destino al instante.", ex: "Corredores de pagos, fintech" },
  { icon: "💵", title: "RLUSD, la stablecoin de Ripple", desc: "Ripple lanzó su propia stablecoin anclada al dólar, que convive con XRP en el ecosistema y refuerza los casos de uso de pagos y DeFi sobre el XRPL.", ex: "Pagos estables, colateral" },
  { icon: "🏛️", title: "Bancos centrales y CBDCs", desc: "Ripple ofrece tecnología basada en el XRP Ledger para que bancos centrales emitan y gestionen monedas digitales (CBDCs) en plataformas dedicadas.", ex: "Pilotos de moneda digital soberana" },
  { icon: "🧱", title: "Tokenización de activos", desc: "El XRP Ledger incorpora funciones nativas para emitir tokens y activos del mundo real, buscando un hueco en la ola de tokenización que persigue todo el sector.", ex: "Activos del mundo real (RWA)" },
  { icon: "⚡", title: "Micropagos y DEX nativo", desc: "El XRPL tiene un exchange descentralizado integrado desde su diseño y comisiones minúsculas, lo que lo hace apto para micropagos e intercambios directos entre activos.", ex: "DEX on-ledger, micropagos" },
];

const GLOSSARY_CARDS = [
  {
    title: "XRP Ledger (XRPL)",
    frontText: "La blockchain donde vive XRP...",
    backText1: "Una blockchain pública, descentralizada y de código abierto, lanzada en 2012, diseñada para pagos: rápida, barata y con muy bajo consumo energético.",
    backText2: "Existe con independencia de la empresa Ripple: cualquiera puede ejecutar un validador o construir sobre ella.",
  },
  {
    title: "RPCA (consenso)",
    frontText: "Cómo se ponen de acuerdo sin minar...",
    backText1: "El Ripple Protocol Consensus Algorithm: en lugar de prueba de trabajo, un conjunto de validadores propone y compara versiones del ledger hasta que coinciden.",
    backText2: "Cuando una supermayoría (en torno al 80%) está de acuerdo, el ledger se cierra. Por eso confirma en segundos y gasta poquísima energía.",
  },
  {
    title: "UNL (Unique Node List)",
    frontText: "En quién confía cada nodo...",
    backText1: "La lista de validadores en los que un nodo concreto confía para llegar a consenso. Cada operador elige su UNL.",
    backText2: "Si las UNL de la red se solapan lo suficiente, todos convergen en el mismo ledger. La composición de estas listas es clave en el debate sobre la descentralización.",
  },
  {
    title: "Validador",
    frontText: "Quien mantiene la red honesta...",
    backText1: "Un servidor que participa en el consenso proponiendo y confirmando transacciones. No cobra recompensa de bloque como un minero.",
    backText2: "Los ejecutan universidades, empresas, exchanges e individuos. Su independencia es lo que sostiene la confianza en el XRPL.",
  },
  {
    title: "Escrow",
    frontText: "El candado sobre el XRP de Ripple...",
    backText1: "Un mecanismo del propio XRPL que bloquea XRP y solo lo libera según reglas de tiempo. Ripple metió gran parte de su XRP en escrow.",
    backText2: "Cada mes se libera un tramo y lo no usado se vuelve a bloquear. Da previsibilidad a la oferta, pero también evidencia cuánto XRP controla Ripple.",
  },
  {
    title: "Moneda puente (bridge)",
    frontText: "El papel de XRP en un pago...",
    backText1: "XRP se usa como activo intermedio: dólar → XRP → euro, por ejemplo. Se mueve en segundos y evita mantener saldos prefinanciados en cada divisa.",
    backText2: "Es la base del On-Demand Liquidity (ODL): liquidez justo cuando se necesita, sin capital inmovilizado por el mundo.",
  },
];

const RISK_CARDS = [
  {
    title: "Centralización e influencia de Ripple",
    frontText: "El punto más criticado...",
    backText1: "Ripple ha poseído una porción enorme del suministro de XRP y durante años tuvo mucho peso en la lista de validadores recomendada por defecto.",
    backText2: "Aunque el consenso lo ejecutan validadores independientes, esa concentración choca con el ideal de una red sin actores dominantes.",
  },
  {
    title: "Dependencia del escrow y las ventas",
    frontText: "Una oferta que gotea desde arriba...",
    backText1: "Cada mes se libera XRP desde el escrow de Ripple. Las ventas de la empresa han sido señaladas como presión vendedora sobre el precio.",
    backText2: "La salud del ecosistema ha estado muy ligada a las decisiones de una sola compañía, algo atípico frente a criptos más difusas.",
  },
  {
    title: "Incertidumbre regulatoria",
    frontText: "Tras la SEC, no todo está cerrado...",
    backText1: "El fallo de 2023 fue una victoria parcial, pero el estatus legal de los criptoactivos sigue evolucionando en EE. UU. y otras jurisdicciones.",
    backText2: "Cambios regulatorios futuros pueden afectar cómo se usa, cotiza o lista XRP, especialmente por su fuerte enfoque en instituciones financieras.",
  },
  {
    title: "Competencia en su propio terreno",
    frontText: "Los pagos globales están en disputa...",
    backText1: "Las stablecoins (USDT, USDC), las mejoras de SWIFT, otras blockchains de pagos y las CBDCs compiten por el mismo problema que XRP quiere resolver.",
    backText2: "Que XRP mantenga su propuesta de valor como moneda puente depende de conseguir adopción real frente a alternativas que avanzan rápido.",
  },
];

export default async function XrpPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const SLUG = "xrp";

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
          ¿Qué es XRP y Ripple?<br />
          <span className="gbc-hero-gold">El activo puente para mover dinero por el mundo.</span>
        </h1>
        <p className="gbc-hero-desc">
          Enviar dinero de un país a otro sigue tardando días y costando una fortuna en comisiones. XRP nació
          para arreglar exactamente eso: ser el activo intermedio que mueve valor entre divisas en segundos.
          Pero pocos proyectos generan tanta confusión: qué es Ripple, qué es XRP, qué es el XRP Ledger y por
          qué se pasó años enfrentado a la SEC. Esta guía avanzada lo aclara todo, hasta el mecanismo de
          consenso que lo hace funcionar sin minería.
        </p>
        <div className="gbc-hero-pills">
          <span className="gbc-pill">8 secciones</span>
          <span className="gbc-pill">Simulador de consenso</span>
          <span className="gbc-pill">Glosario interactivo</span>
          <span className="gbc-pill">Quiz + Badge</span>
        </div>
        <GuideHeroStats stats={HERO_STATS} />
      </header>

      {/* ── SECCIÓN 1: EL PROBLEMA ── FREE */}
      <section id="problema" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Sección 1 <span className="gbc-free-pill">Gratis</span></div>
          <h2 className="gbc-title">El problema: mover dinero entre países es lento y caro</h2>
          <div className="gbc-body">
            <p>
              Enviar un pago internacional en 2026 sigue siendo sorprendentemente arcaico. El sistema
              tradicional se apoya en una cadena de <strong>bancos corresponsales</strong> conectados por la red
              de mensajería <strong>SWIFT</strong>. Para que funcione, los bancos mantienen dinero inmovilizado
              en cuentas por todo el mundo —las llamadas <strong>nostro/vostro</strong>— por si hace falta pagar
              en cada divisa. El resultado: transferencias que tardan de uno a varios días, comisiones altas y
              billones de dólares parados sin hacer nada.
            </p>
            <p>
              Aquí es donde conviene separar tres conceptos que casi todo el mundo mezcla. <strong>Ripple</strong>
              es una <em>empresa</em> (antes Ripple Labs) que vende soluciones de pago a instituciones
              financieras. <strong>XRP</strong> es un <em>activo digital</em>. Y el <strong>XRP Ledger (XRPL)</strong>
              es la <em>blockchain</em> pública y descentralizada donde vive XRP. Ripple usa XRP y el XRPL en sus
              productos, pero la red seguiría existiendo aunque Ripple desapareciera.
            </p>
          </div>

          <div className="gbc-quote">
            <div className="gbc-quote-t">
              «El dinero debería moverse tan rápido y tan barato como la información. Si internet mueve datos en
              segundos, ¿por qué un pago internacional tarda días?»
            </div>
            <div className="gbc-quote-a">— La motivación detrás del XRP Ledger y su uso como moneda puente</div>
          </div>

          <div className="gbc-body" style={{ marginTop: 28 }}>
            <p>
              La propuesta de XRP es actuar como <strong>moneda puente</strong>: en vez de tener euros parados en
              una cuenta en Europa y dólares en otra en EE. UU., un pago se convierte a XRP, viaja por el XRPL en
              segundos y se cambia a la divisa destino al llegar. No hace falta prefinanciar cuentas por medio
              mundo. Esa es, en una frase, la idea que da sentido a todo lo demás.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 2: CÓMO FUNCIONA ── FREE */}
      <section id="como-funciona" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Sección 2 <span className="gbc-free-pill">Gratis</span></div>
          <h2 className="gbc-title">Cómo funciona: consenso sin minería</h2>
          <div className="gbc-body">
            <p>
              El XRP Ledger no funciona como Bitcoin. No hay <strong>minería</strong> ni prueba de trabajo, no
              hay competencia por resolver acertijos ni recompensa de bloque. En su lugar usa un mecanismo de
              consenso propio, el <strong>RPCA</strong> (Ripple Protocol Consensus Algorithm), ejecutado por un
              conjunto de <strong>validadores</strong> independientes.
            </p>
            <p>
              La clave está en la <strong>UNL</strong> (Unique Node List): la lista de validadores en los que
              cada nodo decide confiar. En cada ronda, los validadores proponen su versión del ledger y la van
              ajustando hasta que una <strong>supermayoría —en torno al 80%—</strong> coincide. En ese momento el
              ledger se cierra, de forma irreversible, y se abre el siguiente. Todo el proceso dura unos pocos
              segundos. Pruébalo:
            </p>
          </div>

          <GuideXrpConsensus />

          <div className="gbc-body" style={{ marginTop: 28 }}>
            <p>
              Este diseño explica las tres grandes cualidades del XRPL: es <strong>rápido</strong> (cierres cada
              3–5 segundos), <strong>barato</strong> (la comisión por transacción es una fracción minúscula de un
              céntimo, y además se <em>destruye</em>, no va a nadie) y de <strong>bajísimo consumo energético</strong>,
              porque no gasta electricidad en minar. El precio a pagar es distinto: la seguridad no descansa en el
              poder de cómputo, sino en la <strong>diversidad e independencia de los validadores</strong> — justo
              el punto donde más se le critica, como veremos.
            </p>
          </div>

          <div className="gbc-box gbc-box--gold" style={{ marginTop: 28 }}>
            <div className="gbc-box-title">Un detalle importante: la comisión se quema</div>
            <div className="gbc-box-body">
              <p>Cada transacción en el XRPL destruye una cantidad diminuta de XRP como comisión (no se la queda
              ningún validador). Es una defensa anti-spam y, a la vez, hace que el suministro total de XRP sea
              muy levemente <em>deflacionario</em> con el tiempo.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PAYWALL si no registrado ── */}
      {!isRegistered ? (
        <section id="estado-actual" className="gbc-section">
          <div className="gbc-gc">
            <div className="gbc-ey">Sección 3–8 <span className="gbc-lock-pill">Registro gratuito</span></div>
            <h2 className="gbc-title">El caso SEC, casos de uso, tokenomics y riesgos</h2>
            <div className="gbc-body">
              <p>Las secciones siguientes cubren el estado de XRP en 2026 tras el juicio con la SEC, sus casos de
              uso reales, el glosario técnico interactivo, cómo funciona su tokenomics con el escrow, los riesgos
              de centralización y el quiz con badge de logro.</p>
            </div>
            <div className="gbc-paywall">
              <div className="gbc-paywall-badge">🔓 Has leído 2 de 8 secciones</div>
              <div className="gbc-paywall-t">Regístrate gratis para leer la guía completa</div>
              <div className="gbc-paywall-d">
                Desbloquea las 6 secciones restantes: el desenlace del caso SEC, los casos de uso de XRP, el
                glosario interactivo (RPCA, UNL, escrow…), su tokenomics con las liberaciones del escrow, los
                riesgos de centralización y el quiz con tu badge <strong>Validador de Confianza</strong>. Sin
                tarjeta, en 30 segundos.
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
          {/* ── SECCIÓN 3: ESTADO 2026 (SEC) ── */}
          <section id="estado-actual" className="gbc-section">
            <div className="gbc-gc">
              <div className="gbc-ey">Sección 3</div>
              <h2 className="gbc-title">XRP en 2026: la larga sombra del caso SEC</h2>
              <div className="gbc-body">
                <p>
                  No se puede entender XRP sin su batalla legal. A finales de <strong>2020</strong>, la
                  <strong> SEC</strong> (el regulador de valores de EE. UU.) demandó a Ripple alegando que había
                  vendido XRP como un <strong>valor no registrado</strong> (una <em>security</em>). La noticia
                  hundió el precio y provocó que varios exchanges estadounidenses suspendieran XRP.
                </p>
                <p>
                  En <strong>julio de 2023</strong>, la jueza <strong>Analisa Torres</strong> emitió un fallo
                  matizado y muy comentado: las <strong>ventas programáticas</strong> de XRP en exchanges (a
                  compradores anónimos) <strong>no</strong> constituyeron una oferta de valores, mientras que
                  ciertas <strong>ventas institucionales</strong> directas <strong>sí</strong>. Fue interpretado
                  como una victoria parcial clave para Ripple, y XRP recuperó protagonismo. En los años
                  siguientes el caso fue resolviéndose (sanciones y fin de los recursos), despejando parte de la
                  incertidumbre.
                </p>
              </div>

              <div className="gbc-stats">
                <GuideAnimatedStat end={2020} decimals={0} label="Año de la demanda de la SEC" source="SEC vs. Ripple" />
                <GuideAnimatedStat end={2023} decimals={0} label="Fallo parcial de la jueza Torres" source="Tribunal del Distrito Sur de Nueva York" />
                <GuideAnimatedStat end={2012} decimals={0} label="Lanzamiento del XRP Ledger" source="XRP Ledger" />
                <GuideAnimatedStat end={100} suffix="B" decimals={0} label="XRP creados al inicio (preminados)" source="XRP Ledger" />
              </div>

              <div className="gbc-box gbc-box--green" style={{ marginTop: 28 }}>
                <div className="gbc-box-title">Por qué fue tan relevante ese fallo</div>
                <div className="gbc-box-body">
                  <p>Más allá de XRP, la distinción entre venta programática e institucional se siguió muy de
                  cerca en toda la industria, porque tocaba la gran pregunta: ¿cuándo un criptoactivo es un
                  valor? Esta guía es educativa y no es asesoramiento legal ni financiero.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── SECCIÓN 4: CASOS DE USO ── */}
          <section id="casos-de-uso" className="gbc-section">
            <div className="gbc-gc">
              <div className="gbc-ey">Sección 4</div>
              <h2 className="gbc-title">Para qué se usa XRP y el XRP Ledger</h2>
              <div className="gbc-body">
                <p>
                  El foco de XRP siempre han sido los pagos y las instituciones financieras, pero el XRP Ledger
                  ha ido sumando capacidades. Estos son sus usos principales.
                </p>
              </div>
              <GuideSpotlightCards uses={USES} />
            </div>
          </section>

          {/* ── GLOSARIO: FLASHCARDS ── */}
          <section id="glosario" className="gbc-fc-section">
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
              <h2 className="gbc-title">Tokenomics: 100.000 millones preminados y el escrow</h2>
              <div className="gbc-body">
                <p>
                  A diferencia de Bitcoin, XRP <strong>no se mina</strong>: los <strong>100.000 millones</strong>
                  de XRP se crearon de golpe al inicio, en 2012. Una gran parte se entregó a la empresa Ripple
                  para financiar el desarrollo y la adopción del ecosistema. Esto es, a la vez, su mayor
                  eficiencia y su mayor polémica.
                </p>
                <p>
                  Para dar previsibilidad y calmar el miedo a que Ripple vendiera todo de golpe, en 2017 la
                  empresa bloqueó la mayor parte de su XRP en un <strong>escrow</strong> dentro del propio XRPL.
                  El mecanismo libera un tramo cada mes; lo que no se usa se vuelve a bloquear. Así el mercado
                  sabe, más o menos, cuánto XRP puede entrar en circulación. Además, como cada transacción
                  <strong> quema</strong> una fracción de XRP, la oferta total desciende muy lentamente con el
                  tiempo.
                </p>
              </div>

              <div className="gbc-box gbc-box--gold" style={{ marginTop: 28 }}>
                <div className="gbc-box-title">La otra cara del preminado</div>
                <div className="gbc-box-body">
                  <p>El preminado hizo a XRP eficiente y sin coste energético, pero también concentró una parte
                  enorme del suministro en una sola empresa. El escrow aporta transparencia sobre el calendario
                  de liberación, aunque no elimina la crítica de fondo: buena parte del XRP depende de las
                  decisiones de Ripple.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── SECCIÓN 6: RIESGOS ── */}
          <section id="riesgos" className="gbc-section">
            <div className="gbc-gc">
              <div className="gbc-ey">Sección 6 · Riesgos reales</div>
              <h2 className="gbc-title">Lo que puede salir mal: centralización, escrow y regulación</h2>
              <div className="gbc-body">
                <p>
                  XRP resuelve un problema real y tiene una tecnología sólida, pero arrastra tensiones que llevan
                  años en el centro del debate. Estas son las cuatro que más se le señalan.
                </p>
              </div>

              <div className="gbc-fc-section" style={{ padding: 0 }}>
                <h3 className="gbc-title" style={{ fontSize: 20, marginTop: 8 }}>Radar de riesgos — haz clic en cada tarjeta</h3>
                <GuideFlipCards cards={RISK_CARDS} />
              </div>

              <div className="gbc-box gbc-box--red" style={{ marginTop: 28 }}>
                <div className="gbc-box-title">La pregunta de fondo</div>
                <div className="gbc-box-body">
                  <p>Todo se reduce a una tensión: XRP ofrece una solución rapidísima y barata para los pagos
                  globales, pero lo hace apoyándose en un modelo mucho más ligado a una empresa y a un conjunto de
                  validadores de lo que muchos consideran «descentralizado». Su futuro depende de ganar adopción
                  real y de que la red siga abriéndose. Esta guía es educativa y no es consejo de inversión:
                  infórmate y decide por ti mismo.</p>
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
                <p>Necesitas <strong>5/5</strong> respuestas correctas para desbloquear el badge <strong style={{ color: "var(--gold)" }}>Validador de Confianza</strong>. Sin prisa — puedes releer cualquier sección antes de responder.</p>
              </div>
              <GuideXrpQuiz />
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
