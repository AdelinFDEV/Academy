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
import GuideHyperliquidOrderBook from "./GuideHyperliquidOrderBook";
import GuideHyperliquidQuiz from "./GuideHyperliquidQuiz";
import "./hyperliquid.css";

export const metadata: Metadata = {
  title: "¿Qué es Hyperliquid? El Exchange de Perpetuos que Vive On-Chain | AdelinBTC Academy",
  description:
    "Hyperliquid explicado a fondo: cómo funciona un libro de órdenes 100% on-chain, su blockchain propia con consenso HyperBFT, la capa HyperEVM, el vault HLP, el token HYPE del airdrop sin fondos de inversores y los riesgos reales del proyecto. Con simulador, quiz y badge.",
  openGraph: {
    title: "¿Qué es Hyperliquid? El Exchange de Perpetuos que Vive On-Chain",
    description:
      "Libro de órdenes on-chain, HyperBFT, HyperEVM, el vault HLP y el token HYPE. Con simulador de order book, quiz y badge.",
    type: "article",
  },
};

const SECTIONS = [
  { id: "problema", label: "El problema" },
  { id: "como-funciona", label: "Cómo funciona" },
  { id: "estado-actual", label: "Estado 2026" },
  { id: "casos-de-uso", label: "Casos de uso" },
  { id: "glosario", label: "Glosario" },
  { id: "tokenomics", label: "Token HYPE" },
  { id: "riesgos", label: "Riesgos" },
  { id: "quiz", label: "Quiz" },
];

const HERO_STATS = [
  { prefix: "", value: 2024, suffix: "", dec: 0, label: "Año del airdrop\nmasivo de HYPE" },
  { prefix: "", value: 1, suffix: "º", dec: 0, label: "DEX de perpetuos por\nvolumen del mercado" },
  { prefix: "", value: 100, suffix: "%", dec: 0, label: "Libro de órdenes\non-chain" },
  { prefix: "", value: 24, suffix: "/7", dec: 0, label: "Mercado abierto\nsin custodia" },
];

const USES = [
  { icon: "📈", title: "Trading de perpetuos con apalancamiento", desc: "El corazón de Hyperliquid: contratos perpetuos sobre decenas de criptomonedas, con apalancamiento, para especular al alza o a la baja sin fecha de vencimiento.", ex: "BTC-PERP, ETH-PERP, y decenas de pares" },
  { icon: "💱", title: "Mercado spot on-chain", desc: "Además de derivados, permite comprar y vender tokens al contado en su propio libro de órdenes, incluyendo tokens nativos del ecosistema.", ex: "Spot de HYPE y otros activos" },
  { icon: "🏦", title: "Depositar en el vault HLP", desc: "Los usuarios pueden aportar liquidez al Hyperliquidity Provider, el vault que hace de creador de mercado y liquidador, y compartir sus resultados.", ex: "Ganar (o perder) con la actividad del protocolo" },
  { icon: "🧩", title: "Aplicaciones sobre HyperEVM", desc: "Su capa compatible con Ethereum permite desplegar contratos inteligentes y apps DeFi que se conectan directamente con la liquidez del exchange.", ex: "Préstamos, staking, protocolos que usan HYPE" },
  { icon: "🛠️", title: "Builder codes e integraciones", desc: "Otras interfaces y bots pueden construir sobre Hyperliquid y enrutar órdenes, cobrando su propia comisión encima del protocolo base.", ex: "Front-ends de terceros, bots de trading" },
  { icon: "🔓", title: "Operar sin KYC y con autocustodia", desc: "Se conecta con una wallet, sin registro ni entrega de documentos, y los fondos nunca salen del control del usuario como sí ocurre en un exchange centralizado.", ex: "Conectas wallet y operas" },
];

const GLOSSARY_CARDS = [
  {
    title: "Contrato perpetuo (perp)",
    frontText: "El producto estrella de Hyperliquid...",
    backText1: "Un derivado que replica el precio de un activo (como BTC) con apalancamiento, pero sin fecha de vencimiento: puedes mantener la posición abierta indefinidamente.",
    backText2: "Para que su precio no se aleje del real existe el 'funding rate', un pago periódico entre largos y cortos que lo mantiene anclado al spot.",
  },
  {
    title: "Libro de órdenes (CLOB)",
    frontText: "Cómo se casan compras y ventas...",
    backText1: "Un 'central limit order book': la lista de todas las órdenes de compra (bids) y venta (asks) a cada precio. Tu orden se cruza con las contrapartidas reales.",
    backText2: "Es el modelo de los exchanges profesionales. Hyperliquid lo mantiene entero on-chain, algo muy difícil por la cantidad de operaciones que exige.",
  },
  {
    title: "Funding rate",
    frontText: "El pegamento entre perp y spot...",
    backText1: "Un pequeño pago periódico entre quienes están largos y quienes están cortos. Si el perp cotiza por encima del spot, los largos pagan a los cortos, y viceversa.",
    backText2: "Ese incentivo empuja el precio del perpetuo hacia el precio real del activo, evitando que se despeguen.",
  },
  {
    title: "HLP (Hyperliquidity Provider)",
    frontText: "El 'lado de la casa', abierto a todos...",
    backText1: "Un vault comunitario que actúa como creador de mercado y como liquidador del protocolo. Cualquiera puede depositar en él.",
    backText2: "Los depositantes reparten las ganancias o pérdidas de esa actividad. No es dinero garantizado: en eventos extremos el HLP puede perder.",
  },
  {
    title: "HyperBFT",
    frontText: "El motor de su blockchain...",
    backText1: "El mecanismo de consenso propio de la L1 de Hyperliquid, diseñado para confirmar operaciones con una latencia bajísima.",
    backText2: "Esa velocidad es lo que permite tener un libro de órdenes on-chain que se sienta tan rápido como uno centralizado.",
  },
  {
    title: "HyperEVM",
    frontText: "La puerta a las apps DeFi...",
    backText1: "Una capa compatible con la Máquina Virtual de Ethereum integrada con el núcleo de Hyperliquid (HyperCore).",
    backText2: "Permite que desarrolladores desplieguen contratos y protocolos que se conectan directamente con la liquidez del exchange, usando HYPE como gas.",
  },
];

const RISK_CARDS = [
  {
    title: "Centralización de validadores",
    frontText: "¿On-chain pero descentralizado?...",
    backText1: "Durante buena parte de su historia la red ha operado con un número reducido de validadores, muy ligados al equipo fundador.",
    backText2: "Un producto que se presenta como descentralizado pero con pocas manos controlando el consenso plantea dudas sobre su resistencia a la censura y a errores.",
  },
  {
    title: "El incidente JELLY",
    frontText: "Cuando el protocolo intervino...",
    backText1: "En marzo de 2025, una posición extrema en el token JELLY amenazó con provocar grandes pérdidas al vault HLP. Los validadores decidieron intervenir y delistar el mercado.",
    backText2: "Protegió a los depositantes, pero abrió el debate: si unas pocas manos pueden pausar o cerrar un mercado, ¿hasta qué punto es un sistema sin confianza?",
  },
  {
    title: "Riesgo regulatorio",
    frontText: "Los perpetuos están en la diana...",
    backText1: "El trading de derivados con apalancamiento está muy vigilado por los reguladores, y el acceso desde algunos países (como EE. UU.) está restringido.",
    backText2: "Un cambio regulatorio o una acción contra plataformas de perpetuos podría afectar de lleno al proyecto y a sus usuarios.",
  },
  {
    title: "Dependencia del volumen",
    frontText: "El valor vive del uso...",
    backText1: "Gran parte del atractivo de HYPE se apoya en las comisiones que genera un volumen de trading altísimo, usadas en parte para recomprar tokens.",
    backText2: "Si ese volumen cae —por competencia, un mercado bajista o pérdida de confianza— el motor económico que sostiene al token se debilita.",
  },
];

export default async function HyperliquidPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const SLUG = "hyperliquid";

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
          ¿Qué es Hyperliquid?<br />
          <span className="gbc-hero-gold">El exchange de perpetuos que vive on-chain.</span>
        </h1>
        <p className="gbc-hero-desc">
          Operar con perpetuos siempre había obligado a elegir: la velocidad de un exchange centralizado
          (con custodia y opacidad) o la transparencia de un DEX (lento y con precios malos). Hyperliquid
          se propuso romper ese dilema con una idea difícil: meter un libro de órdenes profesional entero
          dentro de una blockchain. Esto es qué es, cómo lo consigue y por qué se ha convertido en uno de
          los proyectos más comentados del sector.
        </p>
        <div className="gbc-hero-pills">
          <span className="gbc-pill">8 secciones</span>
          <span className="gbc-pill">Simulador de order book</span>
          <span className="gbc-pill">Glosario interactivo</span>
          <span className="gbc-pill">Quiz + Badge</span>
        </div>
        <GuideHeroStats stats={HERO_STATS} />
      </header>

      {/* ── SECCIÓN 1: EL PROBLEMA ── FREE */}
      <section id="problema" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Sección 1 <span className="gbc-free-pill">Gratis</span></div>
          <h2 className="gbc-title">El dilema de operar con perpetuos</h2>
          <div className="gbc-body">
            <p>
              Los <strong>contratos perpetuos</strong> son el producto más operado de todo el mercado cripto:
              derivados que permiten apostar al alza o a la baja del precio de una moneda, con apalancamiento y
              sin fecha de caducidad. Casi todo ese volumen se movía en <strong>exchanges centralizados</strong>
              como Binance: rápidos y cómodos, pero con dos problemas de fondo. Tú no controlas tus fondos —los
              custodia la empresa— y no ves lo que pasa por dentro. El colapso de FTX en 2022 recordó a todo el
              mundo lo que puede salir mal cuando confías tu dinero a una caja negra.
            </p>
            <p>
              La alternativa descentralizada, los <strong>DEX</strong>, resolvía la custodia (tú tienes tus
              fondos) pero no encajaba bien con los perpetuos. La mayoría usan <strong>AMM</strong> (creadores
              de mercado automáticos): pools de liquidez y una fórmula matemática que fija el precio. Funciona
              para intercambios simples, pero para trading serio de derivados —donde importan la profundidad,
              la velocidad y precios finos— se quedaba corto y caro.
            </p>
          </div>

          <div className="gbc-quote">
            <div className="gbc-quote-t">
              «¿Y si un exchange descentralizado pudiera sentirse exactamente igual de rápido que uno
              centralizado, con un libro de órdenes de verdad, pero sin que nadie custodie tu dinero?»
            </div>
            <div className="gbc-quote-a">— La apuesta de Hyperliquid, impulsada por Jeff Yan y Hyperliquid Labs</div>
          </div>

          <div className="gbc-body" style={{ marginTop: 28 }}>
            <p>
              Esa es la tesis de Hyperliquid. En lugar de conformarse con un AMM, decidió construir lo más
              difícil: un <strong>libro de órdenes completo funcionando 100% on-chain</strong>. Y para que eso
              fuera posible sin ahogarse, no lo montó sobre Ethereum ni otra red existente, sino sobre una
              <strong> blockchain propia</strong> diseñada desde cero para una sola cosa: aguantar el ritmo
              frenético de un exchange de trading.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 2: CÓMO FUNCIONA ── FREE */}
      <section id="como-funciona" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Sección 2 <span className="gbc-free-pill">Gratis</span></div>
          <h2 className="gbc-title">Cómo funciona: un libro de órdenes dentro de una blockchain</h2>
          <div className="gbc-body">
            <p>
              Para entender Hyperliquid hay que entender primero qué es un <strong>libro de órdenes</strong>.
              No hay una fórmula que invente el precio: hay dos columnas, las órdenes de <strong>compra</strong>
              (bids) y las de <strong>venta</strong> (asks) a cada nivel de precio. Cuando lanzas una orden a
              mercado, esta se va cruzando con las contrapartidas reales que hay en el libro. Si tu orden es
              grande, se «come» varios niveles y acabas pagando un precio medio peor: eso es el
              <strong> slippage</strong>. Pruébalo tú mismo:
            </p>
          </div>

          <GuideHyperliquidOrderBook />

          <div className="gbc-body" style={{ marginTop: 28 }}>
            <p>
              La proeza técnica de Hyperliquid es mantener ese libro —con miles de órdenes cambiando por
              segundo— <strong>entero on-chain</strong>, sin que ninguna empresa lo gestione en secreto. Lo
              logra con su propia blockchain, la <strong>L1 de Hyperliquid</strong>, cuyo consenso
              <strong> HyperBFT</strong> confirma las operaciones con una latencia bajísima. El resultado se
              siente como un exchange centralizado —rápido, con órdenes límite, apalancamiento— pero tú nunca
              pierdes la custodia y cada operación es verificable.
            </p>
          </div>

          <div className="gbc-box gbc-box--gold" style={{ marginTop: 28 }}>
            <div className="gbc-box-title">Dos capas: HyperCore y HyperEVM</div>
            <div className="gbc-box-body">
              <p>Hyperliquid tiene un núcleo, <em>HyperCore</em>, donde vive el motor de trading (el libro de
              órdenes, los perpetuos, el spot). Y encima añadió <em>HyperEVM</em>, una capa compatible con
              Ethereum donde cualquiera puede desplegar aplicaciones DeFi que se conectan directamente con esa
              liquidez. Es como tener el exchange y el «app store» sobre las mismas vías.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PAYWALL si no registrado ── */}
      {!isRegistered ? (
        <section id="estado-actual" className="gbc-section">
          <div className="gbc-gc">
            <div className="gbc-ey">Sección 3–8 <span className="gbc-lock-pill">Registro gratuito</span></div>
            <h2 className="gbc-title">Estado 2026, casos de uso, el token HYPE y los riesgos</h2>
            <div className="gbc-body">
              <p>Las secciones siguientes cubren el estado de Hyperliquid en 2026, sus casos de uso reales, el
              glosario interactivo con los términos clave, cómo funciona el token HYPE y su famoso airdrop sin
              inversores, los riesgos del proyecto y el quiz con badge de logro.</p>
            </div>
            <div className="gbc-paywall">
              <div className="gbc-paywall-badge">🔓 Has leído 2 de 8 secciones</div>
              <div className="gbc-paywall-t">Regístrate gratis para leer la guía completa</div>
              <div className="gbc-paywall-d">
                Desbloquea las 6 secciones restantes: el estado de Hyperliquid en 2026, sus casos de uso, el
                glosario interactivo, cómo funciona el token HYPE y su airdrop sin VCs, los riesgos reales del
                proyecto y el quiz con tu badge <strong>Maestro del Libro de Órdenes</strong>. Sin tarjeta, en
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
              <h2 className="gbc-title">Hyperliquid en 2026: del airdrop de HYPE a líder de los perpetuos</h2>
              <div className="gbc-body">
                <p>
                  Hyperliquid pasó de proyecto de nicho a nombre propio del sector en muy poco tiempo. El punto
                  de inflexión fue el <strong>29 de noviembre de 2024</strong>: el lanzamiento de su token
                  <strong> HYPE</strong> con un airdrop que repartió una gran parte del suministro entre los
                  usuarios que habían operado en la plataforma. Fue uno de los airdrops más comentados de la
                  historia reciente, tanto por su tamaño como por una decisión poco habitual: el proyecto no
                  había vendido tokens a fondos de capital riesgo.
                </p>
                <p>
                  Desde entonces se ha consolidado como el <strong>mayor DEX de perpetuos por volumen</strong>,
                  capturando una porción enorme del trading descentralizado de derivados. En 2025 amplió su
                  alcance con el lanzamiento de <strong>HyperEVM</strong>, abriendo la puerta a un ecosistema de
                  aplicaciones DeFi construidas sobre su liquidez.
                </p>
              </div>

              <div className="gbc-stats">
                <GuideAnimatedStat end={2024} decimals={0} label="Año del airdrop de HYPE (29 nov)" source="Hyperliquid" />
                <GuideAnimatedStat end={1} suffix="º" decimals={0} label="DEX de perpetuos por volumen" source="Narrativa de mercado 2025–2026" />
                <GuideAnimatedStat end={2025} decimals={0} label="Lanzamiento de la capa HyperEVM" source="Hyperliquid" />
                <GuideAnimatedStat end={0} decimals={0} label="Rondas de financiación con VCs" source="Hyperliquid Labs" />
              </div>

              <div className="gbc-box gbc-box--green" style={{ marginTop: 28 }}>
                <div className="gbc-box-title">Autofinanciado, sin inversores externos</div>
                <div className="gbc-box-body">
                  <p>A diferencia de casi todos los grandes proyectos cripto, Hyperliquid no levantó rondas con
                  fondos de capital riesgo a cambio de una parte del token. El equipo, <em>Hyperliquid Labs</em>,
                  se autofinanció, y eso le permitió repartir una porción del suministro mucho mayor entre la
                  comunidad. Es parte de por qué su airdrop generó tanto entusiasmo.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── SECCIÓN 4: CASOS DE USO ── */}
          <section id="casos-de-uso" className="gbc-section">
            <div className="gbc-gc">
              <div className="gbc-ey">Sección 4</div>
              <h2 className="gbc-title">Para qué se usa Hyperliquid</h2>
              <div className="gbc-body">
                <p>
                  Aunque nació como un exchange de perpetuos, Hyperliquid se ha ido convirtiendo en una pequeña
                  plataforma con varias capas. Estos son sus usos principales.
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

          {/* ── SECCIÓN 5: TOKENOMICS HYPE ── */}
          <section id="tokenomics" className="gbc-section">
            <div className="gbc-gc">
              <div className="gbc-ey">Sección 5</div>
              <h2 className="gbc-title">El token HYPE: comisiones, buybacks y gobernanza</h2>
              <div className="gbc-body">
                <p>
                  HYPE es el token nativo del ecosistema y cumple varias funciones a la vez. Es el
                  <strong> gas</strong> que se paga por usar las aplicaciones de HyperEVM, se puede
                  <strong> stakear</strong> para participar en la seguridad de la red, y está pensado como pieza
                  central de la gobernanza del protocolo.
                </p>
                <p>
                  Pero lo que más atención ha recibido es su relación con las <strong>comisiones</strong>. El
                  enorme volumen de trading de Hyperliquid genera muchos ingresos, y una parte se destina a
                  <strong> recomprar HYPE en el mercado</strong> a través del llamado <em>Assistance Fund</em>.
                  La idea es que, cuanto más se usa el exchange, más presión de compra recibe el token, atando su
                  valor a la actividad real de la plataforma.
                </p>
              </div>

              <div className="gbc-box gbc-box--gold" style={{ marginTop: 28 }}>
                <div className="gbc-box-title">El airdrop que marcó la diferencia</div>
                <div className="gbc-box-body">
                  <p>En noviembre de 2024, Hyperliquid repartió una porción muy grande del suministro de HYPE
                  entre sus usuarios reales, premiando a quienes habían operado en la plataforma. Al no haber
                  vendido tokens a inversores privados, esa distribución hacia la comunidad fue mucho mayor de lo
                  habitual — un gesto que reforzó la narrativa de un proyecto «de los usuarios».</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── SECCIÓN 6: RIESGOS ── */}
          <section id="riesgos" className="gbc-section">
            <div className="gbc-gc">
              <div className="gbc-ey">Sección 6 · Riesgos reales</div>
              <h2 className="gbc-title">Lo que puede salir mal: centralización, intervención y regulación</h2>
              <div className="gbc-body">
                <p>
                  Hyperliquid es uno de los proyectos más impresionantes a nivel técnico, pero eso no lo hace
                  inmune a los riesgos. Antes de sacar conclusiones, conviene mirar las cuatro tensiones que más
                  se le señalan.
                </p>
              </div>

              <div className="gbc-fc-section" style={{ padding: 0 }}>
                <h3 className="gbc-title" style={{ fontSize: 20, marginTop: 8 }}>Radar de riesgos — haz clic en cada tarjeta</h3>
                <GuideFlipCards cards={RISK_CARDS} />
              </div>

              <div className="gbc-box gbc-box--red" style={{ marginTop: 28 }}>
                <div className="gbc-box-title">La tensión que define su futuro</div>
                <div className="gbc-box-body">
                  <p>Todo se resume en un equilibrio difícil: Hyperliquid ofrece una experiencia de trading
                  excepcional, pero para lograr esa velocidad ha sacrificado —de momento— parte de la
                  descentralización que promete el mundo cripto. Su reto es abrir el consenso y demostrar que
                  puede ser rápido <em>y</em> resistente a la censura a la vez. Esta guía es educativa y no es
                  consejo de inversión: infórmate y decide por ti mismo.</p>
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
                <p>Necesitas <strong>5/5</strong> respuestas correctas para desbloquear el badge <strong style={{ color: "var(--gold)" }}>Maestro del Libro de Órdenes</strong>. Sin prisa — puedes releer cualquier sección antes de responder.</p>
              </div>
              <GuideHyperliquidQuiz />
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
