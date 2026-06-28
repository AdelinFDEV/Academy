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
import GuideProgressBar from "./GuideProgressBar";
import GuideFlashcards from "./GuideFlashcards";
import GuideCharts from "./GuideCharts";
import GuideQuiz from "./GuideQuiz";

export const metadata: Metadata = {
  title: "¿Qué es la Blockchain? Guía Completa 2026 | AdelinBTC Academy",
  description:
    "De Satoshi al presente: entiende qué es la blockchain, cómo funciona, por qué es imposible de falsificar y cuál es su futuro ante la computación cuántica. Guía con datos reales 2026.",
  openGraph: {
    title: "¿Qué es la Blockchain? Guía Completa 2026",
    description: "Historia, funcionamiento, estado actual ($2.17T market cap) y amenaza cuántica. Con quiz, flashcards y badge.",
    type: "article",
  },
};

const SECTIONS = [
  { id: "origen", label: "Origen" },
  { id: "como-funciona", label: "Cómo funciona" },
  { id: "estado-actual", label: "Estado 2026" },
  { id: "para-que-sirve", label: "Usos reales" },
  { id: "flashcards", label: "Flashcards" },
  { id: "potencial", label: "Potencial" },
  { id: "computacion-cuantica", label: "Amenaza cuántica" },
  { id: "quiz", label: "Quiz" },
];

const TIMELINE = [
  { yr: "1991", ev: "La idea precursora", desc: "Stuart Haber y W. Scott Stornetta publican el primer concepto de documento con marca de tiempo inmutable encadenada criptográficamente." },
  { yr: "2008", ev: "El whitepaper de Satoshi", desc: "El seudónimo Satoshi Nakamoto publica «Bitcoin: A Peer-to-Peer Electronic Cash System». La blockchain nace como soporte de Bitcoin." },
  { yr: "2009", ev: "Bloque génesis", desc: "El 3 de enero se mina el primer bloque de Bitcoin. El mensaje embebido: «Chancellor on brink of second bailout for banks» — un manifiesto de época." },
  { yr: "2015", ev: "Ethereum y los smart contracts", desc: "Vitalik Buterin lanza Ethereum. La blockchain deja de ser solo dinero y se convierte en plataforma programable." },
  { yr: "2020", ev: "El verano DeFi", desc: "Protocolos como Uniswap, Compound y Aave explotan. El TVL en DeFi pasa de $1B a $15B en meses." },
  { yr: "2021", ev: "Mainstream y NFTs", desc: "Bitcoin supera los $64,000. Los NFTs generan $25B en volumen. PayPal, Visa y Tesla integran crypto en sus balances." },
  { yr: "2022", ev: "Ethereum Merge", desc: "Ethereum migra de Proof of Work a Proof of Stake, reduciendo su consumo energético un 99.95%." },
  { yr: "2024", ev: "ETFs de Bitcoin en EE.UU.", desc: "La SEC aprueba los primeros ETFs spot de Bitcoin. En 10 días de trading se acumulan más de $10B en activos." },
  { yr: "2026", ev: "Tokenización masiva", desc: "El mercado de Real World Assets (RWA) tokenizados supera los $32B. BlackRock, JPMorgan y Santander operan activamente en cadena." },
];

const USES = [
  { icon: "💸", title: "Transferencias globales", desc: "Enviar dinero a cualquier parte del mundo en minutos, sin bancos, con fees de céntimos.", ex: "Bitcoin Lightning, Stellar" },
  { icon: "🏦", title: "DeFi: Banca sin bancos", desc: "Préstamos, intereses y trading descentralizado. $71.77B en valor bloqueado operando 24/7.", ex: "Aave, Uniswap, Curve" },
  { icon: "🏠", title: "Tokenización de activos reales", desc: "Inmuebles, bonos, materias primas y arte tokenizados. El mercado RWA ya supera los $32B.", ex: "Ondo Finance, Maple, RealT" },
  { icon: "🆔", title: "Identidad soberana", desc: "Credenciales digitales que el usuario controla, sin depender de ninguna empresa o gobierno.", ex: "Polygon ID, Sovrin" },
  { icon: "🗳️", title: "Gobernanza y DAOs", desc: "Organizaciones autónomas donde los poseedores de tokens votan decisiones de protocolo.", ex: "MakerDAO, Uniswap DAO" },
  { icon: "🎮", title: "Gaming y metaverso", desc: "Propiedad real de items digitales, mercados P2P y economías abiertas entre juegos.", ex: "Immutable X, Ronin" },
  { icon: "📋", title: "Cadena de suministro", desc: "Trazabilidad de productos desde origen hasta consumidor final, inmutable y auditable.", ex: "VeChain, IBM Food Trust" },
  { icon: "🏥", title: "Salud y registros médicos", desc: "Historial clínico portable controlado por el paciente, compartible con cualquier hospital.", ex: "Medibloc, Coral Health" },
];

export default async function QueEsLaBlockchainPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const profileData = user
    ? (await supabase.from("profiles").select("full_name, role").eq("id", user.id).single()).data
    : null;
  const role = profileData?.role ?? "free";
  const isPremium = role === "premium" || role === "admin";
  const isAdmin = role === "admin";
  const userName = profileData?.full_name || user?.email?.split("@")[0] || "Usuario";
  const isRegistered = !!user;

  return (
    <div className="gbc-wrap">
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
        <div className="gbc-hero-ey">Guía fundamental · AdelinBTC Academy · 2026</div>
        <h1 className="gbc-hero-title">
          ¿Qué es la Blockchain?<br />
          <span className="gbc-hero-gold">El registro que nadie puede falsificar.</span>
        </h1>
        <p className="gbc-hero-desc">
          Desde el whitepaper de Satoshi hasta los $2.17 billones en capitalización actual.
          Entiende el mecanismo que está rehaciendo las finanzas, la identidad y el contrato social —
          y qué amenaza representa la computación cuántica para su futuro.
        </p>
        <div className="gbc-hero-pills">
          <span className="gbc-pill">8 secciones</span>
          <span className="gbc-pill">Datos verificados 2026</span>
          <span className="gbc-pill">Quiz + Badge</span>
          <span className="gbc-pill">Flashcards</span>
        </div>
        <a href="#origen" className="gbc-cta">Comenzar la guía</a>
        <div className="gbc-hero-stats">
          <div>
            <div className="gbc-stat-n">$2.17T</div>
            <div className="gbc-stat-l">Capitalización<br />crypto global</div>
          </div>
          <div>
            <div className="gbc-stat-n">350M+</div>
            <div className="gbc-stat-l">Usuarios activos<br />estimados 2026</div>
          </div>
          <div>
            <div className="gbc-stat-n">$71.77B</div>
            <div className="gbc-stat-l">Total Value Locked<br />en DeFi</div>
          </div>
          <div>
            <div className="gbc-stat-n">$32B+</div>
            <div className="gbc-stat-l">Activos reales<br />tokenizados (RWA)</div>
          </div>
          <div>
            <div className="gbc-stat-n">15,000+</div>
            <div className="gbc-stat-l">Proyectos activos<br />en blockchain</div>
          </div>
        </div>
      </header>

      {/* ── SECTION 1: ORIGEN ── FREE */}
      <section id="origen" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Sección 1 <span className="gbc-free-pill">Gratis</span></div>
          <h2 className="gbc-title">El origen: un problema de confianza de 5.000 años</h2>
          <div className="gbc-body">
            <p>
              El dinero siempre ha dependido de un intermediario de confianza: el orfebre que guardaba el oro, el banco que anotaba el depósito, el banco central que garantizaba el billete. El problema no era técnico — era la confianza. ¿Quién certifica que el registro es verdadero?
            </p>
            <p>
              En 2008, en pleno colapso financiero global, un mensaje apareció en una lista de correo de criptografía. Lo firmaba alguien llamado Satoshi Nakamoto. La propuesta era radical: un sistema de efectivo electrónico entre pares que funcionara sin ninguna institución de confianza. El mecanismo que lo hacía posible se llamaba blockchain.
            </p>
          </div>

          <div className="gbc-quote">
            <div className="gbc-quote-t">
              «Lo que necesitamos es un sistema de pago electrónico basado en prueba criptográfica en lugar de confianza, que permita a dos partes dispuestas a realizar transacciones directamente entre sí sin necesidad de un tercero de confianza.»
            </div>
            <div className="gbc-quote-a">— Satoshi Nakamoto, Bitcoin Whitepaper, 2008</div>
          </div>

          <div className="gbc-body" style={{ marginTop: 28 }}>
            <p>
              La idea no era completamente nueva. En 1991, los criptógrafos Stuart Haber y W. Scott Stornetta habían descrito un sistema para marcar documentos con un sello temporal inmutable. En 1997, Adam Back inventó Hashcash — prueba de trabajo computacional para frenar el spam. En 2004, Hal Finney refinó el concepto con «reusable proofs of work». Satoshi unió todas estas piezas.
            </p>
          </div>

          <h3 className="gbc-title" style={{ fontSize: 20, marginTop: 36 }}>Línea del tiempo: de la idea al billón</h3>
          <div className="gbc-tl">
            {TIMELINE.map((t) => (
              <div key={t.yr} className="gbc-tl-item">
                <div className="gbc-tl-yr">{t.yr}</div>
                <div className="gbc-tl-col">
                  <div className="gbc-tl-dot" />
                  <div className="gbc-tl-line" />
                </div>
                <div className="gbc-tl-cnt">
                  <div className="gbc-tl-ev">{t.ev}</div>
                  <div className="gbc-tl-desc">{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 2: CÓMO FUNCIONA ── FREE */}
      <section id="como-funciona" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Sección 2 <span className="gbc-free-pill">Gratis</span></div>
          <h2 className="gbc-title">Cómo funciona: bloques, hashes y consenso</h2>
          <div className="gbc-body">
            <p>
              Una blockchain es, literalmente, una cadena de bloques. Cada bloque contiene un conjunto de transacciones, una marca de tiempo, y el hash del bloque anterior. Este último detalle es lo que lo hace inviolable.
            </p>
          </div>

          <div className="gbc-cards" style={{ marginTop: 28 }}>
            <div className="gbc-card">
              <div className="gbc-card-title">1. La transacción</div>
              <div className="gbc-card-text">
                <p>Alice quiere enviar 0.5 BTC a Bob. Firma la transacción con su clave privada — una prueba matemática de que ella autoriza el movimiento sin revelar la clave.</p>
                <p>La transacción se emite a la red de miles de nodos que la validan: ¿Tiene Alice saldo suficiente? ¿La firma es válida?</p>
              </div>
            </div>
            <div className="gbc-card">
              <div className="gbc-card-title">2. El bloque</div>
              <div className="gbc-card-text">
                <p>Las transacciones válidas se agrupan en un bloque. El bloque incluye: un número de versión, el hash del bloque anterior (parent hash), el árbol Merkle de transacciones, la marca de tiempo y el nonce (en PoW).</p>
                <p>El hash del bloque es la huella digital de todo ese contenido. Si cambias una coma, el hash cambia por completo.</p>
              </div>
            </div>
            <div className="gbc-card">
              <div className="gbc-card-title">3. El consenso</div>
              <div className="gbc-card-text">
                <p><strong style={{ color: "var(--gold)" }}>Proof of Work (Bitcoin):</strong> Los mineros compiten resolviendo un puzzle matemático. El primero en resolverlo añade el bloque y recibe la recompensa. Requiere energía real.</p>
                <p><strong style={{ color: "var(--gold)" }}>Proof of Stake (Ethereum):</strong> Los validadores depositan ETH como garantía. Son seleccionados aleatoriamente. Si actúan de mala fe, pierden su depósito (slashing).</p>
              </div>
            </div>
            <div className="gbc-card">
              <div className="gbc-card-title">4. La inmutabilidad</div>
              <div className="gbc-card-text">
                <p>Si un atacante quisiera alterar una transacción del bloque 700.000, tendría que recalcular ese bloque y todos los posteriores — más rápido que el resto de la red combinada.</p>
                <p>En Bitcoin, eso requeriría controlar más del 51% del hashrate global. El coste estimado: miles de millones de dólares en hardware y electricidad.</p>
              </div>
            </div>
          </div>

          <div className="gbc-box gbc-box--gold" style={{ marginTop: 28 }}>
            <div className="gbc-box-title">La analogía del libro contable público</div>
            <div className="gbc-box-body">
              <p>Imagina un libro contable que una ciudad entera tiene en copia. Cada vez que alguien quiere añadir una entrada, la mayoría de los ciudadanos debe confirmarla. Si alguien intenta borrar una página antigua, todos los demás tienen la versión correcta. Eso es la blockchain — pero con miles de copias en todo el mundo, actualización en segundos y verificación matemática automática.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3+: PAYWALL si no registrado ── */}
      {!isRegistered ? (
        <section id="estado-actual" className="gbc-section">
          <div className="gbc-gc">
            <div className="gbc-ey">Sección 3–8 <span className="gbc-lock-pill">Registro gratuito</span></div>
            <h2 className="gbc-title">Estado 2026, usos reales, potencial y computación cuántica</h2>
            <div className="gbc-body">
              <p>Las secciones siguientes cubren el estado actual del mercado con datos verificados de 2026, los 8 casos de uso más importantes, el potencial futuro de la blockchain y la amenaza real que representa la computación cuántica — incluyendo quiz interactivo y badge de logro.</p>
            </div>
            <div className="gbc-paywall">
              <div className="gbc-paywall-t">Crea tu cuenta gratuita para continuar</div>
              <div className="gbc-paywall-d">Acceso inmediato a esta guía y todas las gratuitas. Sin tarjeta de crédito.</div>
              <Link href="/register" className="gbc-paywall-btn">Registrarme gratis</Link>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* ── SECTION 3: ESTADO ACTUAL 2026 ── */}
          <section id="estado-actual" className="gbc-section">
            <div className="gbc-gc">
              <div className="gbc-ey">Sección 3</div>
              <h2 className="gbc-title">El estado de la blockchain en 2026: los números reales</h2>
              <div className="gbc-body">
                <p>
                  La blockchain ya no es un experimento marginal. En junio de 2026, la capitalización total del mercado crypto supera los $2.17 billones (trillion), con Bitcoin representando el 52% y Ethereum el 18%. Más de 350 millones de personas tienen algún tipo de exposición a activos digitales.
                </p>
                <p>
                  Los gobiernos de más de 130 países están desarrollando activamente CBDCs (monedas digitales de banco central). El Banco Central Europeo tiene el Digital Euro en fase piloto. China ya tiene 260 millones de usuarios en el e-CNY.
                </p>
              </div>

              <div className="gbc-stats">
                <div className="gbc-stat-c">
                  <div className="gbc-stat-num">$2.17T</div>
                  <div className="gbc-stat-lbl">Market cap crypto global</div>
                  <div className="gbc-stat-src">CoinMarketCap, Jun 2026</div>
                </div>
                <div className="gbc-stat-c">
                  <div className="gbc-stat-num">$71.77B</div>
                  <div className="gbc-stat-lbl">TVL en DeFi</div>
                  <div className="gbc-stat-src">DeFiLlama, Jun 2026</div>
                </div>
                <div className="gbc-stat-c">
                  <div className="gbc-stat-num">$32B+</div>
                  <div className="gbc-stat-lbl">RWA tokenizados</div>
                  <div className="gbc-stat-src">RWA.xyz, Jun 2026</div>
                </div>
                <div className="gbc-stat-c">
                  <div className="gbc-stat-num">350M+</div>
                  <div className="gbc-stat-lbl">Usuarios activos estimados</div>
                  <div className="gbc-stat-src">Chainalysis, Triple-A</div>
                </div>
                <div className="gbc-stat-c">
                  <div className="gbc-stat-num">130+</div>
                  <div className="gbc-stat-lbl">Países con CBDC en desarrollo</div>
                  <div className="gbc-stat-src">Atlantic Council CBDC Tracker</div>
                </div>
                <div className="gbc-stat-c">
                  <div className="gbc-stat-num">$10B+</div>
                  <div className="gbc-stat-lbl">ETFs Bitcoin spot (primeras semanas)</div>
                  <div className="gbc-stat-src">Bloomberg, ene 2024</div>
                </div>
              </div>

              <GuideCharts chart="adoption" />
              <GuideCharts chart="market" />
              <GuideCharts chart="defi" />

              <div className="gbc-box gbc-box--green" style={{ marginTop: 28 }}>
                <div className="gbc-box-title">Institucionalización acelerada</div>
                <div className="gbc-box-body">
                  <p>BlackRock, el mayor gestor de activos del mundo, lanzó su ETF de Bitcoin (IBIT) en enero de 2024. En 2026 gestiona más de $18B en Bitcoin. Fidelity, ARK y Franklin Templeton también operan ETFs spot. JPMorgan procesa pagos en blockchain mediante JPM Coin. El mundo institucional ya no ignora la blockchain — la integra.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── SECTION 4: USOS REALES ── */}
          <section id="para-que-sirve" className="gbc-section">
            <div className="gbc-gc">
              <div className="gbc-ey">Sección 4</div>
              <h2 className="gbc-title">Para qué sirve realmente: 8 casos de uso que ya existen</h2>
              <div className="gbc-body">
                <p>
                  Más allá del precio de Bitcoin, la blockchain resuelve problemas concretos en industrias reales. Estos no son casos hipotéticos — están en producción hoy, con millones de usuarios y miles de millones en valor.
                </p>
              </div>
              <div className="gbc-use-grid">
                {USES.map((u) => (
                  <div key={u.title} className="gbc-use-c">
                    <div className="gbc-use-icon">{u.icon}</div>
                    <div className="gbc-use-t">{u.title}</div>
                    <div className="gbc-use-d">{u.desc}</div>
                    <div className="gbc-use-ex">Ejemplos: {u.ex}</div>
                  </div>
                ))}
              </div>

              <div className="gbc-box gbc-box--gold" style={{ marginTop: 28 }}>
                <div className="gbc-box-title">El caso Ethereum: el ordenador mundial</div>
                <div className="gbc-box-body">
                  <p>Ethereum es la segunda blockchain por capitalización y la primera en actividad de desarrolladores. Su propuesta es ser un ordenador global descentralizado donde cualquiera puede desplegar código que se ejecuta exactamente como está programado, sin downtime, sin censura, sin intermediarios. En 2026 procesa más de 1.2 millones de transacciones diarias y tiene más de 4,000 aplicaciones desplegadas.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── FLASHCARDS ── */}
          <section id="flashcards" className="gbc-fc-section">
            <div className="gbc-gc">
              <div className="gbc-ey">Flashcards</div>
              <h2 className="gbc-title">Terminos clave — haz click para ver la definición</h2>
              <GuideFlashcards />
            </div>
          </section>

          {/* ── SECTION 5: POTENCIAL ── */}
          <section id="potencial" className="gbc-section">
            <div className="gbc-gc">
              <div className="gbc-ey">Sección 5</div>
              <h2 className="gbc-title">El potencial: lo que todavía no hemos visto</h2>
              <div className="gbc-body">
                <p>
                  Todo lo que existe hoy — $2 billones en cripto, $71B en DeFi, $32B en RWA — es la fase 0. La blockchain aún no ha alcanzado ni el 5% de su potencial de disrupción. Las estimaciones más conservadoras sitúan el mercado total addressable en $16 billones para 2030.
                </p>
              </div>

              <div className="gbc-cards" style={{ marginTop: 28 }}>
                <div className="gbc-card">
                  <div className="gbc-card-title">Tokenización de todo</div>
                  <div className="gbc-card-text">
                    <p>El mercado inmobiliario global vale $330 billones. Las acciones privadas, $13 billones. La deuda global, $300 billones. La tokenización de estos activos significaría liquidez instantánea, fraccionalización y acceso global para inversores de cualquier tamaño.</p>
                    <p>BlackRock estima que el mercado de activos tokenizados alcanzará los $10 billones en 2030.</p>
                  </div>
                </div>
                <div className="gbc-card">
                  <div className="gbc-card-title">Internet del Valor (Web3)</div>
                  <div className="gbc-card-text">
                    <p>Internet movió información. La blockchain mueve valor. En la Web3, cada interacción digital puede llevar micropagos, derechos de propiedad o recompensas — sin que una plataforma intermedie y se quede el 30%.</p>
                    <p>Imagina un creador de contenido que recibe pagos directos de sus seguidores en fracciones de centavo por cada visualización.</p>
                  </div>
                </div>
                <div className="gbc-card">
                  <div className="gbc-card-title">Identidad soberana global</div>
                  <div className="gbc-card-text">
                    <p>1.100 millones de personas en el mundo no tienen documentación legal. Sin DNI, no pueden abrir cuentas bancarias, acceder a servicios o demostrar su identidad. Una blockchain de identidad podría resolver esto con un móvil básico.</p>
                    <p>La ONU, el Banco Mundial y Microsoft ya tienen proyectos activos en esta dirección.</p>
                  </div>
                </div>
                <div className="gbc-card">
                  <div className="gbc-card-title">Automatización de contratos</div>
                  <div className="gbc-card-text">
                    <p>Los contratos inteligentes podrían automatizar seguros (pago automático si el vuelo se retrasa), hipotecas (liberación automática del título al último pago), herencias y cualquier acuerdo con condiciones verificables objetivamente.</p>
                    <p>El mercado global de gestión de contratos vale $2.7 billones anuales — una fracción de lo que los smart contracts podrían capturar.</p>
                  </div>
                </div>
              </div>

              <div className="gbc-box gbc-box--gold" style={{ marginTop: 28 }}>
                <div className="gbc-box-title">La curva S de la adopción tecnológica</div>
                <div className="gbc-box-body">
                  <p>Internet tardó 15 años en pasar de 1 millón a 1.000 millones de usuarios (1993-2008). El móvil tardó 12 años. La blockchain lleva 15 años y está en ~350 millones de usuarios — exactamente donde estaba internet en 2000, justo antes de la explosión masiva. La infraestructura (wallets, on-ramps, regulación) está llegando a la madurez necesaria para la adopción masiva.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── SECTION 6: QUANTUM ── */}
          <section id="computacion-cuantica" className="gbc-section">
            <div className="gbc-gc">
              <div className="gbc-ey">Sección 6 · Estado actual y futuro</div>
              <h2 className="gbc-title">La amenaza cuántica: ¿puede un ordenador cuántico romper Bitcoin?</h2>
              <div className="gbc-body">
                <p>
                  En diciembre de 2024, Google presentó Willow, un chip cuántico de 105 qubits capaz de resolver en 5 minutos un cálculo que los mejores superordenadores clásicos tardarían 10 septillones de años. La noticia sacudió el mundo de la blockchain: ¿es esto el fin de la criptografía actual?
                </p>
                <p>
                  La respuesta es matizada: la amenaza es real, pero está lejos — y la industria ya está preparando la defensa.
                </p>
              </div>

              <div className="gbc-cards" style={{ marginTop: 28 }}>
                <div className="gbc-card">
                  <div className="gbc-card-title">Qué es la computación cuántica</div>
                  <div className="gbc-card-text">
                    <p>Los ordenadores clásicos usan bits: 0 o 1. Los ordenadores cuánticos usan qubits, que pueden ser 0 y 1 simultáneamente (superposición) y correlacionarse entre sí (entrelazamiento). Esto les permite explorar millones de soluciones en paralelo.</p>
                    <p>Para ciertos problemas matemáticos específicos — como factorizar números enormes o resolver logaritmos discretos — un ordenador cuántico es exponencialmente más rápido.</p>
                  </div>
                </div>
                <div className="gbc-card">
                  <div className="gbc-card-title">La vulnerabilidad real</div>
                  <div className="gbc-card-text">
                    <p>Bitcoin y la mayoría de blockchains usan ECDSA (Elliptic Curve Digital Signature Algorithm) para las firmas. El algoritmo de Shor, ejecutado en un ordenador cuántico suficientemente potente, podría derivar la clave privada desde la clave pública.</p>
                    <p>El problema: si tu dirección ha recibido pero no enviado, la clave pública no está expuesta. Pero si has reutilizado direcciones o has enviado transacciones, tu clave pública es pública — y vulnerable.</p>
                  </div>
                </div>
                <div className="gbc-card">
                  <div className="gbc-card-title">La escala del problema</div>
                  <div className="gbc-card-text">
                    <p>Romper ECDSA-256 requeriría un ordenador cuántico con ~4.000 qubits lógicos tolerantes a fallos (no qubits físicos ruidosos). Willow tiene 105 qubits físicos con alta tasa de error. La estimación más optimista habla de 10-20 años para alcanzar esa capacidad.</p>
                    <p>El SHA-256 (usado para el mining de Bitcoin) es mucho más resistente al cuántico — requeriría ~2.500 veces más qubits que el ataque a ECDSA.</p>
                  </div>
                </div>
                <div className="gbc-card">
                  <div className="gbc-card-title">La solución: criptografía post-cuántica</div>
                  <div className="gbc-card-text">
                    <p>El NIST (Instituto Nacional de Estándares de EE.UU.) publicó en 2024 los primeros estándares de criptografía post-cuántica (PQC): CRYSTALS-Kyber, CRYSTALS-Dilithium y SPHINCS+. Estos algoritmos son resistentes a ataques cuánticos.</p>
                    <p>Ethereum ya tiene una propuesta activa (EIP) para migrar a firmas post-cuánticas. Bitcoin también tiene desarrolladores trabajando en esto. La transición será gradual — pero está en marcha.</p>
                  </div>
                </div>
              </div>

              <div className="gbc-box gbc-box--red" style={{ marginTop: 28 }}>
                <div className="gbc-box-title">El riesgo más inmediato: «harvest now, decrypt later»</div>
                <div className="gbc-box-body">
                  <p>Los actores más peligrosos — estados-nación — no esperarán a tener un ordenador cuántico para actuar. Ya están recopilando tráfico cifrado hoy para descifrarlo cuando tengan la capacidad cuántica. Para transacciones financieras con datos sensibles a largo plazo, la migración a PQC no puede esperar. Para Bitcoin, el riesgo es más lejano pero igualmente real.</p>
                </div>
              </div>

              <div className="gbc-box gbc-box--green" style={{ marginTop: 16 }}>
                <div className="gbc-box-title">Conclusión: la blockchain sobrevivirá al cuántico</div>
                <div className="gbc-box-body">
                  <p>La blockchain no es un protocolo fijo — es software que se puede actualizar. La transición a criptografía post-cuántica es un problema técnico con soluciones conocidas. El verdadero riesgo es la complacencia: asumir que la amenaza está lejos y no prepararse. Las blockchains que sobrevivan serán las que migren antes.</p>
                </div>
              </div>

              <div className="gbc-stats" style={{ marginTop: 28 }}>
                <div className="gbc-stat-c">
                  <div className="gbc-stat-num">105</div>
                  <div className="gbc-stat-lbl">Qubits físicos<br />Google Willow (2024)</div>
                </div>
                <div className="gbc-stat-c">
                  <div className="gbc-stat-num">~4.000</div>
                  <div className="gbc-stat-lbl">Qubits lógicos<br />necesarios para romper ECDSA</div>
                </div>
                <div className="gbc-stat-c">
                  <div className="gbc-stat-num">10-20</div>
                  <div className="gbc-stat-lbl">Años estimados<br />para alcanzar esa capacidad</div>
                </div>
                <div className="gbc-stat-c">
                  <div className="gbc-stat-num">3</div>
                  <div className="gbc-stat-lbl">Estándares PQC publicados<br />por NIST en 2024</div>
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
                <p>Necesitas 4/5 respuestas correctas para desbloquear el badge <strong style={{ color: "var(--gold)" }}>Arquitecto de Cadenas</strong>. Sin prisa — puedes releer cualquier sección antes de responder.</p>
              </div>
              <GuideQuiz />
            </div>
          </section>
        </>
      )}

      <Footer />
    </div>
  );
}
