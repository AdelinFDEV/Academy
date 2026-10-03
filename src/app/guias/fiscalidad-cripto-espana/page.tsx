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
import GuideBreadcrumbJsonLd from "@/components/GuideBreadcrumbJsonLd";
import GuiasRelacionadas from "@/components/GuiasRelacionadas";
import GuideFiscalFifo from "./GuideFiscalFifo";
import GuideFiscalCalc from "./GuideFiscalCalc";
import GuideFiscalQuiz from "./GuideFiscalQuiz";
import "./fiscalidad-cripto-espana.css";

export const metadata: Metadata = {
  alternates: { canonical: "/guias/fiscalidad-cripto-espana" },
  title: "Fiscalidad Cripto en España: FIFO y Modelo 721",
  description:
    "Fiscalidad cripto en España: qué tributa, cuánto pagas, el método FIFO, staking, airdrops y el modelo 721. Guía completa y gratis, con ejemplos y cifras.",
  openGraph: {
    title: "Fiscalidad Cripto en España: Modelo 721, Staking, FIFO y Ganancias",
    description:
      "Todo lo que Hacienda espera de ti si tienes criptomonedas en España: hechos imponibles, FIFO obligatorio, tramos del ahorro, staking, modelo 721, Patrimonio y compensación de pérdidas. Ocho secciones abiertas.",
    type: "article",
  },
};

const SECTIONS = [
  { id: "hacienda-lo-sabe", label: "Hacienda ya lo sabe" },
  { id: "que-tributa", label: "Qué tributa" },
  { id: "fifo", label: "FIFO" },
  { id: "escala", label: "Cuánto pagas" },
  { id: "rentas", label: "Staking y airdrops" },
  { id: "modelo-721", label: "Modelo 721" },
  { id: "patrimonio", label: "Patrimonio" },
  { id: "perdidas", label: "Pérdidas" },
  { id: "errores", label: "Errores" },
  { id: "quiz", label: "Quiz" },
];

const HERO_STATS = [
  { prefix: "", value: 30, suffix: "%", dec: 0, label: "Tipo máximo de la\nbase del ahorro" },
  { prefix: "", value: 50, suffix: "k€", dec: 0, label: "Umbral del modelo 721\npara cripto en el extranjero" },
  { prefix: "", value: 4, suffix: "", dec: 0, label: "Años para compensar\npérdidas pendientes" },
  { prefix: "", value: 2026, suffix: "", dec: 0, label: "Primer ejercicio con\nintercambio DAC8" },
];

const RENTAS = [
  {
    icon: "🔒",
    title: "Staking y delegación",
    desc: "Rendimiento del capital mobiliario por cesión de capitales a terceros. Tributa en la base del ahorro (19–30%) y se valora en euros al valor de mercado del día en que recibes la recompensa, aunque no vendas nada. Ese mismo valor pasa a ser el coste de adquisición de esas monedas.",
    ex: "Base del ahorro · criterio DGT V1766-22",
  },
  {
    icon: "🪂",
    title: "Airdrops",
    desc: "Ganancia patrimonial que NO deriva de una transmisión, así que no va a la base del ahorro: se integra en la base general, junto a tu nómina, donde los tipos llegan mucho más arriba. Se valora al precio de mercado del día en que puedes disponer de los tokens.",
    ex: "Base general · el que más sorprende",
  },
  {
    icon: "⛏️",
    title: "Minería",
    desc: "Se considera actividad económica: implica alta en Hacienda, IAE y declarar los rendimientos en la base general. A cambio, puedes deducir gastos directos — electricidad, amortización del equipo, conectividad — algo que no puedes hacer con el staking.",
    ex: "Base general · rendimiento de actividad económica",
  },
  {
    icon: "🏦",
    title: "Lending e intereses",
    desc: "Prestar tus criptomonedas a cambio de un interés sigue la misma lógica que el staking: rendimiento del capital mobiliario en la base del ahorro, valorado el día del cobro. Si la plataforma quiebra y no recuperas el principal, ahí tendrás una pérdida patrimonial distinta.",
    ex: "Base del ahorro",
  },
  {
    icon: "🎁",
    title: "Referidos y promociones",
    desc: "Los bonus por invitar amigos o por registrarte suelen tratarse como ganancia patrimonial no derivada de transmisión — base general — o incluso como rendimiento en especie según el caso. No son «dinero gratis» sin consecuencias fiscales.",
    ex: "Base general, con matices",
  },
  {
    icon: "🖼️",
    title: "NFT",
    desc: "Comprar y vender NFT genera ganancia o pérdida patrimonial como cualquier otro activo. Si además eres el creador y los vendes de forma habitual, deja de ser patrimonio y pasa a ser actividad económica, con IVA incluido en muchos supuestos.",
    ex: "Depende de si eres inversor o creador",
  },
];

const ERROR_CARDS = [
  {
    title: "«Como no he sacado euros, no declaro»",
    frontText: "El error más caro de todos...",
    backText1: "Cambiar BTC por ETH, comprar un NFT con ETH o pagar algo con cripto son transmisiones: afloran ganancia o pérdida aunque nunca toques tu banco.",
    backText2: "Hacienda no grava «sacar dinero», grava la alteración patrimonial. El euro es solo la unidad en la que se mide.",
  },
  {
    title: "«Uso el precio medio de mis compras»",
    frontText: "Cómodo, intuitivo y equivocado...",
    backText1: "El precio medio ponderado no está permitido para particulares en el IRPF español: el método obligatorio es FIFO.",
    backText2: "Usar el medio suele infravalorar la ganancia en carteras antiguas, y es exactamente el tipo de desviación que salta al cruzar datos.",
  },
  {
    title: "«El exchange ya informa, no hago nada»",
    frontText: "Confundir informar con declarar...",
    backText1: "Que tu exchange presente los modelos 172 y 173 no sustituye a tu declaración: son obligaciones distintas y de sujetos distintos.",
    backText2: "Al contrario: lo que informa el exchange es precisamente con lo que Hacienda va a contrastar tu renta.",
  },
  {
    title: "«Mis cripto están en cold wallet, no existo»",
    frontText: "Media verdad peligrosa...",
    backText1: "Cierto que la autocustodia queda fuera del modelo 721, porque no hay un tercero que custodie tus claves.",
    backText2: "Pero las ganancias cuando vendas tributan exactamente igual, y si superas los umbrales sigues teniendo que declarar Patrimonio.",
  },
  {
    title: "«Compenso las pérdidas contra mi sueldo»",
    frontText: "Los compartimentos no se mezclan...",
    backText1: "Las pérdidas de la base del ahorro no bajan lo que pagas por tu nómina: son bases separadas con reglas propias.",
    backText2: "Solo puedes compensarlas con ganancias de la misma base y, con límite del 25%, contra rendimientos del capital mobiliario positivos.",
  },
  {
    title: "«Perdí los registros, ya lo arreglaré»",
    frontText: "El coste de no tener el histórico...",
    backText1: "Sin valor de adquisición documentado, justificar el coste ante una comprobación se vuelve muy difícil — y la carga de la prueba es tuya.",
    backText2: "Exporta el histórico completo de cada plataforma cada año, aunque no vayas a declarar nada: los exchanges cierran, y con ellos tus datos.",
  },
];

export default async function FiscalidadCriptoEspanaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const SLUG = "fiscalidad-cripto-espana";

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
      <GuideBreadcrumbJsonLd slug={SLUG} />
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
        <div className="gbc-hero-ey">Guía completa · AdelinBTC Academy · 2026</div>
        <h1 className="gbc-hero-title">
          Fiscalidad cripto en España<br />
          <span className="gbc-hero-gold">Todo lo que Hacienda espera de ti.</span>
        </h1>
        <p className="gbc-hero-desc">
          En la fiscalidad cripto española tributas cuando <strong>vendes, permutas una moneda por otra
          o pagas con ella</strong>: es una ganancia patrimonial que va a la base del ahorro, del{" "}
          <strong>19% al 30%</strong>. Comprar y mantener no tributa. El <Link href="/glosario/staking">staking</Link> y los airdrops son
          rentas aparte. El cálculo es por <strong>FIFO obligatorio</strong>, y si a 31 de diciembre
          tienes más de 50.000 € en plataformas de fuera de España, te toca además el{" "}
          <strong>modelo 721</strong>.
        </p>
        <p className="gbc-hero-desc gbc-hero-desc--sec">
          Esa es la respuesta corta de la fiscalidad cripto. Abajo está cada pieza con su ejemplo y
          sus cifras, porque desde
          2026, con DAC8 en marcha, la Agencia Tributaria recibe tus saldos y tus operaciones de
          cualquier plataforma europea. La pregunta ya no es si lo van a saber: es si lo que declaras
          cuadra con lo que ellos ya tienen.
        </p>
        <div className="gbc-hero-pills">
          <span className="gbc-pill">8 secciones abiertas</span>
          <span className="gbc-pill">Normativa 2026</span>
          <span className="gbc-pill">Ejemplos con cifras</span>
          <span className="gbc-pill">Simulador y quiz · Premium</span>
        </div>
        <GuideHeroStats stats={HERO_STATS} />
      </header>

      {/* Aviso legal */}
      <section className="gbc-section">
        <div className="gbc-gc">
          <div className="fisc-disclaimer">
            <span className="fisc-disclaimer-icon" aria-hidden="true">⚖️</span>
            <div>
              <strong>Esto es formación, no asesoramiento fiscal.</strong> La normativa cambia cada
              ejercicio y cada caso tiene matices — residencia, comunidad autónoma, volumen, tipo de
              operativa. Usa esta guía para entender el terreno y tomar decisiones informadas, pero
              contrasta tu caso concreto con un asesor antes de presentar nada. Los importes y tramos
              recogidos aquí corresponden a la normativa estatal vigente para el ejercicio 2025,
              declarado en 2026.
            </div>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 1 ── FREE */}
      <section id="hacienda-lo-sabe" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Sección 1 <span className="gbc-free-pill">Gratis</span></div>
          <h2 className="gbc-title">Se acabó la opacidad: Hacienda ya tiene tus datos</h2>
          <div className="gbc-body">
            <p>
              Durante años, la fiscalidad cripto en España funcionó sobre una premisa cómoda y falsa:
              que si no sacabas el dinero al banco, nadie se enteraba. Esa premisa ha muerto, y no de
              forma gradual — se ha desmontado en tres movimientos normativos encadenados.
            </p>
            <p>
              El primero fueron los <strong>modelos 172 y 173</strong>, aprobados por la Orden HFP/887/2023.
              Desde entonces, los proveedores de servicios de criptoactivos con presencia en España están
              obligados a comunicar dos cosas a la Agencia Tributaria. Una, los <strong>saldos</strong> de sus usuarios a 31 de diciembre (modelo 172). Dos, <strong>todas las operaciones</strong> del año —compras, ventas, permutas, cobros y pagos— en el modelo 173. Se presentaron por
              primera vez en enero de 2024. Tú no presentas ninguno de los dos: los presenta la plataforma,
              hablando de ti.
            </p>
            <p>
              El segundo fue <strong>MiCA</strong>, el reglamento europeo de criptoactivos plenamente
              aplicable desde diciembre de 2024, que obliga a las plataformas autorizadas a identificar
              a sus usuarios con estándares equivalentes a los de un banco. El anonimato operativo en
              exchanges regulados dejó de existir.
            </p>
            <p>
              Y el tercero, el definitivo, es <strong>DAC8</strong>: la directiva europea de cooperación
              administrativa que extiende el intercambio automático de información a los criptoactivos.
              Su efecto práctico es que ya no importa en qué país de la UE tengas la cuenta — la
              información viaja sola hasta la administración de tu país de residencia fiscal.
            </p>
          </div>

          <div className="gbc-quote">
            <div className="gbc-quote-t">
              La pregunta relevante ya no es «¿cómo sabrá Hacienda que tengo cripto?».
              Es «¿coincidirá lo que yo declare con lo que Hacienda ya tiene apuntado?».
            </div>
            <div className="gbc-quote-a">— El cambio de paradigma que trae 2026</div>
          </div>

          <div className="gbc-box gbc-box--gold" style={{ marginTop: 28 }}>
            <div className="gbc-box-title">Qué significa esto en la práctica</div>
            <div className="gbc-box-body">
              <p>
                Que la fiscalidad cripto pasa a comprobarse igual que se comprueba la declaración de un
                asalariado: por cruce automático de datos. Si tu exchange informa de 40.000 € en ventas
                y tu declaración no recoge ninguna ganancia patrimonial, esa discrepancia no depende de
                que un inspector se fije en ti — salta sola. Declarar bien deja de ser una cuestión de
                prudencia y pasa a ser la única opción operativa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 2 ── FREE */}
      <section id="que-tributa" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Sección 2 <span className="gbc-free-pill">Gratis</span></div>
          <h2 className="gbc-title">Qué tributa y qué no en la fiscalidad cripto</h2>
          <div className="gbc-body">
            <p>
              Aquí está el 80% de los errores de la fiscalidad cripto, y casi todos vienen de la misma
              confusión: creer que el
              impuesto se activa al recibir euros en el banco. No es así. Lo que grava el IRPF es la
              <strong> alteración en la composición de tu patrimonio</strong> que pone de manifiesto una
              ganancia o una pérdida. El euro es solo la unidad de medida, no el desencadenante.
            </p>
          </div>

          <div className="fisc-table">
            <div className="fisc-table-head">
              <span>Operación</span>
              <span>¿Tributa?</span>
              <span>Por qué</span>
            </div>
            <div className="fisc-table-row is-no">
              <span className="fisc-table-op">Comprar cripto con euros</span>
              <span className="fisc-table-tag fisc-table-tag--no">No</span>
              <span className="fisc-table-why">Cambias euros por otro activo al mismo valor. No hay ganancia todavía: lo que haces es fijar tu precio de adquisición.</span>
            </div>
            <div className="fisc-table-row is-no">
              <span className="fisc-table-op">Mantener (<Link href="/glosario/hodl">HODL</Link>), aunque suba mucho</span>
              <span className="fisc-table-tag fisc-table-tag--no">No</span>
              <span className="fisc-table-why">La plusvalía latente no tributa. En España no existe un impuesto sobre la revalorización no realizada en el IRPF.</span>
            </div>
            <div className="fisc-table-row is-no">
              <span className="fisc-table-op">Mover cripto entre tus propias wallets</span>
              <span className="fisc-table-tag fisc-table-tag--no">No</span>
              <span className="fisc-table-why">No hay transmisión: sigues siendo el titular. Eso sí, guarda la traza — un traspaso mal documentado parece una venta.</span>
            </div>
            <div className="fisc-table-row is-yes">
              <span className="fisc-table-op">Vender cripto por euros</span>
              <span className="fisc-table-tag fisc-table-tag--yes">Sí</span>
              <span className="fisc-table-why">Ganancia o pérdida patrimonial en la base del ahorro: diferencia entre valor de transmisión y de adquisición.</span>
            </div>
            <div className="fisc-table-row is-yes">
              <span className="fisc-table-op">Permutar una cripto por otra</span>
              <span className="fisc-table-tag fisc-table-tag--yes">Sí</span>
              <span className="fisc-table-why">Es una permuta (art. 37.1.h LIRPF). Se valora a precio de mercado del día, aunque no pases por euros en ningún momento.</span>
            </div>
            <div className="fisc-table-row is-yes">
              <span className="fisc-table-op">Pagar bienes o servicios con cripto</span>
              <span className="fisc-table-tag fisc-table-tag--yes">Sí</span>
              <span className="fisc-table-why">Estás transmitiendo el activo para adquirir otra cosa. Aflora la ganancia acumulada hasta ese momento.</span>
            </div>
            <div className="fisc-table-row is-yes">
              <span className="fisc-table-op">Convertir a stablecoins (USDT, USDC)</span>
              <span className="fisc-table-tag fisc-table-tag--yes">Sí</span>
              <span className="fisc-table-why">Una <Link href="/glosario/stablecoin">stablecoin</Link> es otra criptomoneda, no un euro. «Ponerse en stable» para protegerse de una caída es una permuta plenamente sujeta.</span>
            </div>
            <div className="fisc-table-row is-yes">
              <span className="fisc-table-op">Cobrar staking, intereses o airdrops</span>
              <span className="fisc-table-tag fisc-table-tag--yes">Sí</span>
              <span className="fisc-table-why">Son rentas, no transmisiones. Cada una va a una base distinta — lo desglosamos en la sección 5.</span>
            </div>
          </div>

          <div className="gbc-box gbc-box--red" style={{ marginTop: 28 }}>
            <div className="gbc-box-title">La trampa de las stablecoins</div>
            <div className="gbc-box-body">
              <p>
                Merece la pena insistir porque es donde más gente se lleva un susto. Compraste BTC a 20.000 €. El mercado se gira y lo pasas a USDT con BTC a 90.000 €. Acabas de realizar una ganancia de 70.000 € por cada bitcoin, aunque en tu cabeza «no has vendido» y el saldo siga dentro del <Link href="/glosario/exchange">exchange</Link>. Un trader activo que rota posiciones puede acumular
                decenas de hechos imponibles al año sin haber retirado un solo euro.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Secciones 3-8 abiertas. La norma —qué tributa, FIFO, tramos, staking,
          airdrops y el modelo 721— es lo que se busca en Google y lo que el
          título promete; esconderla dejaba a la guía compitiendo con dos
          secciones contra páginas de asesorías que lo cuentan entero.
          Lo que sigue siendo Premium son las herramientas y el cierre. */}
        {/* ── SECCIÓN 3: FIFO ── */}
        <section id="fifo" className="gbc-section">
          <div className="gbc-gc">
            <div className="gbc-ey">Sección 3</div>
            <h2 className="gbc-title">FIFO: la regla que decide cuánto ganas «en papel»</h2>
            <div className="gbc-body">
              <p>
                Imagina que llevas tres años comprando bitcoin poco a poco. Tienes lotes a 18.000 €,
                a 32.000 €, a 55.000 €. Vendes una parte. ¿Cuál de esos precios usas para calcular la
                ganancia? La respuesta no es «el que quieras»: en la fiscalidad cripto española el
                método es{" "}
                <strong>FIFO</strong> —<em>First In, First Out</em>— y es <strong>obligatorio</strong>.
                Se entiende que vendes primero las monedas que compraste primero.
              </p>
              <p>
                Esto no es un detalle contable menor. En una cartera construida durante años, los lotes
                más antiguos suelen ser los más baratos, así que el FIFO tiende a <strong>maximizar la
                ganancia declarada</strong> en las primeras ventas. No puedes elegir el lote más caro
                para reducir la factura, ni usar el precio medio ponderado, ni aplicar LIFO. Mueve los
                controles y observa cómo se van consumiendo los lotes:
              </p>
            </div>

              {/* El FIFO, dibujado. Era el concepto que más cuesta de toda la
                  guía y solo estaba en palabras y dentro del simulador, que es
                  de pago. El dibujo va en SVG escrito a mano: no hay archivo
                  que subir ni optimizar, y se lee igual en cualquier pantalla. */}
              <figure className="fisc-fifo-fig">
                <svg
                  className="fisc-fifo-svg"
                  viewBox="0 0 720 300"
                  role="img"
                  aria-labelledby="fifo-svg-t fifo-svg-d"
                >
                  <title id="fifo-svg-t">Cómo consume el FIFO tus lotes de bitcoin</title>
                  <desc id="fifo-svg-d">
                    Tres compras de 0,5 BTC a 18.000, 32.000 y 55.000 euros. Una venta de 0,7 BTC
                    consume el lote más antiguo entero y 0,2 BTC del segundo, nunca el más caro.
                  </desc>

                  {/* La venta, marcada arriba: entra por la izquierda */}
                  <path d="M60 34 L60 46 L340 46 L340 34" className="fisc-fifo-llave" />
                  <text x="200" y="26" className="fisc-fifo-tx fisc-fifo-tx--venta" textAnchor="middle">
                    Vendes 0,7 BTC a 90.000 €
                  </text>

                  {/* Los tres lotes, en orden de compra */}
                  <rect x="60" y="70" width="200" height="72" rx="8" className="fisc-fifo-lote fisc-fifo-lote--usado" />
                  <rect x="260" y="70" width="80" height="72" rx="8" className="fisc-fifo-lote fisc-fifo-lote--usado" />
                  <rect x="340" y="70" width="120" height="72" rx="8" className="fisc-fifo-lote" />
                  <rect x="460" y="70" width="200" height="72" rx="8" className="fisc-fifo-lote" />

                  {/* Las divisiones reales entre compras */}
                  <line x1="260" y1="70" x2="260" y2="142" className="fisc-fifo-corte" />
                  <line x1="460" y1="70" x2="460" y2="142" className="fisc-fifo-corte" />

                  <text x="160" y="100" className="fisc-fifo-tx fisc-fifo-tx--fuerte" textAnchor="middle">18.000 €</text>
                  <text x="160" y="122" className="fisc-fifo-tx fisc-fifo-tx--min" textAnchor="middle">0,5 BTC · la más antigua</text>

                  <text x="360" y="100" className="fisc-fifo-tx fisc-fifo-tx--fuerte" textAnchor="middle">32.000 €</text>
                  <text x="360" y="122" className="fisc-fifo-tx fisc-fifo-tx--min" textAnchor="middle">0,5 BTC</text>

                  <text x="560" y="100" className="fisc-fifo-tx fisc-fifo-tx--fuerte" textAnchor="middle">55.000 €</text>
                  <text x="560" y="122" className="fisc-fifo-tx fisc-fifo-tx--min" textAnchor="middle">0,5 BTC · intacta</text>

                  <text x="60" y="166" className="fisc-fifo-tx fisc-fifo-tx--min">Primera compra</text>
                  <text x="660" y="166" className="fisc-fifo-tx fisc-fifo-tx--min" textAnchor="end">Última compra</text>

                  {/* La cuenta */}
                  <line x1="60" y1="196" x2="660" y2="196" className="fisc-fifo-corte" />

                  <text x="60" y="228" className="fisc-fifo-tx fisc-fifo-tx--min">Coste que se resta (FIFO)</text>
                  <text x="60" y="254" className="fisc-fifo-tx fisc-fifo-tx--fuerte">15.400 €</text>
                  <text x="60" y="276" className="fisc-fifo-tx fisc-fifo-tx--min">0,5 × 18.000 + 0,2 × 32.000</text>

                  <text x="300" y="228" className="fisc-fifo-tx fisc-fifo-tx--min">Importe de la venta</text>
                  <text x="300" y="254" className="fisc-fifo-tx fisc-fifo-tx--fuerte">63.000 €</text>

                  <text x="660" y="228" className="fisc-fifo-tx fisc-fifo-tx--min" textAnchor="end">Ganancia que declaras</text>
                  <text x="660" y="254" className="fisc-fifo-tx fisc-fifo-tx--oro" textAnchor="end">47.600 €</text>
                  <text x="660" y="276" className="fisc-fifo-tx fisc-fifo-tx--min" textAnchor="end">9.100 € más que a precio medio</text>
                </svg>
                <figcaption className="fisc-fifo-cap">
                  La venta entra siempre por la izquierda. Con precio medio ponderado la ganancia
                  serían 38.500 € — <strong>9.100 € menos</strong>—, y por eso no puedes elegirlo.
                </figcaption>
              </figure>

              {isPremium ? (
                <GuideFiscalFifo />
              ) : (
                <div className="gbc-box gbc-box--gold" style={{ marginTop: 28 }}>
                  <div className="gbc-box-title">El simulador FIFO es Premium</div>
                  <div className="gbc-box-body">
                    <p>
                      La regla está explicada entera aquí arriba y no hace falta la herramienta para entenderla. El simulador sirve para lo otro: meter tus compras y tus ventas y ver qué lote consume cada una. <Link href="/premium">Hazte Premium</Link> para usarla.
                    </p>
                  </div>
                </div>
              )}

            <div className="gbc-box gbc-box--gold" style={{ marginTop: 28 }}>
              <div className="gbc-box-title">El FIFO se aplica por criptomoneda, no por plataforma</div>
              <div className="gbc-box-body">
                <p>
                  Un malentendido habitual: llevar el FIFO por separado en cada exchange. La Dirección
                  General de Tributos considera que las unidades de una misma criptomoneda son bienes
                  homogéneos, así que tu bitcoin es <strong>uno solo</strong> aunque esté repartido entre
                  Binance, Kraken y una Ledger. El orden de compra que cuenta es el global. Si operas en
                  varias plataformas y no consolidas, tu cálculo estará mal aunque cada exchange
                  individualmente cuadre.
                </p>
              </div>
            </div>

            <div className="gbc-body" style={{ marginTop: 28 }}>
              <p>
                Una nota práctica: los <strong>gastos y comisiones</strong> inherentes a la operación
                suman al valor de adquisición cuando compras y restan del valor de transmisión cuando
                vendes. No son un detalle despreciable — en operativa frecuente pueden suponer una
                parte relevante del resultado, y olvidarlos significa pagar de más.
              </p>
            </div>
          </div>
        </section>

        {/* ── SECCIÓN 4: ESCALA ── */}
        <section id="escala" className="gbc-section">
          <div className="gbc-gc">
            <div className="gbc-ey">Sección 4</div>
            <h2 className="gbc-title">Cuánto pagas: la escala del ahorro, tramo a tramo</h2>
            <div className="gbc-body">
              <p>
                Aquí se responde la pregunta con la que llega casi todo el mundo a la fiscalidad
                cripto: cuánto se paga. Las ganancias por vender o permutar criptomonedas se integran
                en la{" "}
                <strong>base imponible del ahorro</strong>, que tiene su propia escala, separada de la
                de tu nómina. Desde el 1 de enero de 2025, con la entrada en vigor de la Ley 7/2024,
                esa escala tiene cinco tramos y el último subió del 28% al <strong>30%</strong>.
              </p>
            </div>

            <div className="gbc-stats">
              <GuideAnimatedStat end={19} suffix="%" decimals={0} label="Hasta 6.000 € de base del ahorro" source="Escala estatal 2025" />
              <GuideAnimatedStat end={21} suffix="%" decimals={0} label="De 6.000 € a 50.000 €" source="Escala estatal 2025" />
              <GuideAnimatedStat end={23} suffix="%" decimals={0} label="De 50.000 € a 200.000 €" source="Escala estatal 2025" />
              <GuideAnimatedStat end={30} suffix="%" decimals={0} label="Más de 300.000 € (antes 28%)" source="Ley 7/2024" />
            </div>

            <div className="gbc-body" style={{ marginTop: 28 }}>
              <p>
                El tramo intermedio que falta en las cifras de arriba es el de <strong>200.000 € a
                300.000 €, al 27%</strong>. Y aquí conviene deshacer el malentendido más extendido de
                todos: los tramos son <strong>marginales</strong>. Entrar en el tramo del 30% no
                significa que pagues el 30% de toda tu ganancia, sino solo de la parte que excede los
                300.000 €. Compruébalo tú mismo:
              </p>
            </div>

              {isPremium ? (
                <GuideFiscalCalc />
              ) : (
                <div className="gbc-box gbc-box--gold" style={{ marginTop: 28 }}>
                  <div className="gbc-box-title">La calculadora por tramos es Premium</div>
                  <div className="gbc-box-body">
                    <p>
                      La escala y el funcionamiento marginal están contados arriba. La calculadora hace la cuenta con tu cifra y te enseña cuánto cae en cada tramo. <Link href="/premium">Hazte Premium</Link> para usarla.
                    </p>
                  </div>
                </div>
              )}

            <div className="gbc-box gbc-box--green" style={{ marginTop: 28 }}>
              <div className="gbc-box-title">La base del ahorro es un saco compartido</div>
              <div className="gbc-box-body">
                <p>
                  En esa misma base entran los dividendos de tus acciones, los intereses de tus depósitos
                  y las recompensas de staking. El tipo que acabas pagando por tu ganancia cripto depende,
                  por tanto, de todo lo demás que tengas ahí dentro. Dos personas con la misma ganancia de
                  10.000 € en bitcoin pueden pagar tipos distintos según el resto de sus rentas del ahorro.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECCIÓN 5: RENTAS ── */}
        <section id="rentas" className="gbc-section">
          <div className="gbc-gc">
            <div className="gbc-ey">Sección 5</div>
            <h2 className="gbc-title">Staking, airdrops y minería: cada renta a su base</h2>
            <div className="gbc-body">
              <p>
                La parte de la fiscalidad cripto que más se falla después del FIFO es esta. No todo lo
                que entra en tu wallet es una ganancia patrimonial. Hay rentas que no vienen
                de transmitir nada — vienen de <em>tener</em> o de <em>hacer</em> — y cada una tiene su
                propia calificación fiscal. Esto importa muchísimo, porque de ello depende si tributas
                al 19% o si te vas por encima del 40%.
              </p>
              <p>
                El caso más relevante es el <strong>staking</strong>. La Dirección General de Tributos,
                en su consulta vinculante <strong>V1766-22</strong>, estableció que las recompensas de
                staking son <strong>rendimientos del capital mobiliario</strong> obtenidos por la cesión
                de capitales propios a terceros. Van a la base del ahorro y —esto es lo que más
                sorprende— se devengan <strong>al recibirlas</strong>, valoradas en euros al precio de
                mercado de ese día, aunque no vendas absolutamente nada.
              </p>
            </div>

            <GuideSpotlightCards uses={RENTAS} />

            <div className="gbc-box gbc-box--red" style={{ marginTop: 28 }}>
              <div className="gbc-box-title">El riesgo real del staking: tributar por lo que luego se desploma</div>
              <div className="gbc-box-body">
                <p>
                  Como la recompensa tributa el día que la recibes, puedes acabar pagando impuestos por
                  un valor que después se evapora. Si recibes tokens valorados en 5.000 € a lo largo del
                  año y en diciembre valen 1.200 €, tu rendimiento del capital mobiliario sigue siendo de
                  5.000 €. La caída posterior no corrige ese rendimiento: generará, en su caso, una
                  pérdida patrimonial cuando vendas — y las pérdidas patrimoniales solo se compensan
                  contra rendimientos del capital mobiliario hasta un límite del 25%. Son compartimentos
                  distintos, y por eso conviene tenerlo previsto antes de que llegue la campaña.
                </p>
              </div>
            </div>

            <div className="gbc-body" style={{ marginTop: 28 }}>
              <p>
                Un apunte sobre gastos: al no tener las criptomonedas la consideración de valores
                negociables, <strong>no son deducibles</strong> los gastos de administración y custodia
                que sí lo serían en una cartera de acciones. Es una asimetría poco conocida y que juega
                en contra del inversor.
              </p>
            </div>
          </div>
        </section>

        {/* ── SECCIÓN 6: MODELO 721 ── */}
        <section id="modelo-721" className="gbc-section">
          <div className="gbc-gc">
            <div className="gbc-ey">Sección 6</div>
            <h2 className="gbc-title">Modelo 721: el informativo que más sanciones genera</h2>
            <div className="gbc-body">
              <p>
                Es la única obligación de la fiscalidad cripto que no depende de que hayas ganado ni
                un euro. El modelo 721 es la <strong>declaración informativa sobre monedas virtuales situadas en
                el extranjero</strong>, aprobada por la Orden HFP/886/2023. Es el hermano cripto del
                conocido modelo 720 de bienes en el extranjero, y tiene una característica que lo hace
                peligroso: <strong>no se paga nada con él</strong>. Es puramente informativo. Precisamente
                por eso se olvida — y precisamente por eso genera sanciones.
              </p>
            </div>

            <div className="fisc-721">
              <div className="fisc-721-item">
                <div className="fisc-721-k">¿Quién lo presenta?</div>
                <div className="fisc-721-v">Personas físicas y jurídicas residentes en España que sean titulares, beneficiarias o autorizadas sobre monedas virtuales custodiadas en el extranjero. También quien lo haya sido durante el año aunque ya no lo sea.</div>
              </div>
              <div className="fisc-721-item">
                <div className="fisc-721-k">Umbral</div>
                <div className="fisc-721-v">Cuando el valor conjunto a <strong>31 de diciembre</strong> supera los <strong>50.000 €</strong>. Es un umbral global, no por plataforma: se suman todos los saldos custodiados fuera de España.</div>
              </div>
              <div className="fisc-721-item">
                <div className="fisc-721-k">Plazo</div>
                <div className="fisc-721-v">Del <strong>1 de enero al 31 de marzo</strong> del año siguiente. Para el ejercicio 2025, el plazo fue del 1 de enero al 31 de marzo de 2026.</div>
              </div>
              <div className="fisc-721-item">
                <div className="fisc-721-k">Años siguientes</div>
                <div className="fisc-721-v">Si ya lo presentaste, solo vuelves a presentarlo cuando el valor conjunto se haya incrementado en más de <strong>20.000 €</strong> respecto a la última declaración presentada.</div>
              </div>
              <div className="fisc-721-item fisc-721-item--star">
                <div className="fisc-721-k">La autocustodia NO entra</div>
                <div className="fisc-721-v">La Agencia Tributaria ha aclarado que las criptomonedas en monederos donde <strong>tú controlas las claves privadas</strong>, sin un tercero que las custodie, quedan fuera del modelo 721. Las <Link href="/glosario/cold-wallet"><em>cold wallets</em></Link> no custodiadas no se declaran aquí. Solo entra lo que está bajo custodia de terceros.</div>
              </div>
              <div className="fisc-721-item">
                <div className="fisc-721-k">Sanciones</div>
                <div className="fisc-721-v">Multa fija de <strong>300 €</strong> por no presentarlo tras requerimiento y <strong>150 €</strong> por presentarlo incompleto o con errores, además de <strong>20 € por cada dato omitido</strong> y <strong>10 € por cada dato incorrecto</strong>.</div>
              </div>
            </div>

            <div className="gbc-box gbc-box--gold" style={{ marginTop: 28 }}>
              <div className="gbc-box-title">Presentar el 721 no es declarar</div>
              <div className="gbc-box-body">
                <p>
                  Son obligaciones independientes y hay que cumplir las dos. Puedes tener que presentar
                  el 721 sin haber vendido nada en todo el año (informas de un saldo, no de una ganancia),
                  y puedes tener que declarar ganancias en el IRPF sin llegar nunca al umbral del 721.
                  Confundirlas —o creer que una sustituye a la otra— es un error frecuente y caro.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECCIÓN 7: PATRIMONIO ── */}
        <section id="patrimonio" className="gbc-section">
          <div className="gbc-gc">
            <div className="gbc-ey">Sección 7</div>
            <h2 className="gbc-title">El olvidado: Impuesto sobre el Patrimonio</h2>
            <div className="gbc-body">
              <p>
                Es el punto ciego de la fiscalidad cripto en España. Casi nadie lo tiene en el radar, y
                sin embargo puede afectarte sin que hayas hecho una
                sola operación en todo el año. El <strong>Impuesto sobre el Patrimonio</strong> (modelo
                714) grava lo que <em>tienes</em>, no lo que ganas, y las criptomonedas forman parte de
                la base como cualquier otro bien, valoradas a precio de mercado a 31 de diciembre.
              </p>
              <p>
                La obligación de declarar aparece, con carácter general, en dos supuestos. Cuando el patrimonio neto supera los <strong>700.000 €</strong>, con una exención adicional de hasta 300.000 € para la vivienda habitual. O cuando el valor de los bienes supera los 2.000.000 €, aunque salga a cuota cero. Aquí entra todo: inmuebles, cuentas, fondos, acciones y, por supuesto, tu
                cartera cripto.
              </p>
            </div>

            <div className="gbc-box gbc-box--gold" style={{ marginTop: 8 }}>
              <div className="gbc-box-title">Es un impuesto cedido: tu comunidad autónoma manda</div>
              <div className="gbc-box-body">
                <p>
                  Aquí está la clave que hace imposible dar una respuesta única: el Patrimonio está
                  cedido a las comunidades autónomas, que fijan mínimo exento, tipos y bonificaciones.
                  El resultado va desde comunidades donde la cuota queda prácticamente bonificada al
                  100% hasta otras donde se paga íntegro. Dos personas con la misma cartera y el mismo
                  saldo a 31 de diciembre pueden tener facturas radicalmente distintas según dónde
                  residan. Y ojo: <strong>la obligación de declarar puede existir aunque la cuota final
                  sea cero</strong>.
                </p>
              </div>
            </div>

            <div className="gbc-body" style={{ marginTop: 28 }}>
              <p>
                Un detalle que descoloca a mucha gente: la fecha de valoración es el <strong>31 de
                diciembre</strong>, un único día. Si tu cartera valía mucho ese día y se desplomó en
                enero, el impuesto se calcula sobre la foto de diciembre. Es exactamente el mismo
                fenómeno que vimos con el staking — la fiscalidad congela un instante, y el mercado
                sigue moviéndose.
              </p>
            </div>
          </div>
        </section>

        {/* ── SECCIÓN 8: PÉRDIDAS ── */}
        <section id="perdidas" className="gbc-section">
          <div className="gbc-gc">
            <div className="gbc-ey">Sección 8</div>
            <h2 className="gbc-title">Pérdidas: cómo compensarlas y la regla que casi todos aplican mal</h2>
            <div className="gbc-body">
              <p>
                Las pérdidas no son solo un mal trago: en la fiscalidad cripto son un activo, siempre
                que sepas usarlas.
                El orden de compensación en la base del ahorro funciona así:
              </p>
            </div>

            <div className="fisc-steps">
              <div className="fisc-step">
                <div className="fisc-step-n">1</div>
                <div>
                  <strong>Contra tus propias ganancias patrimoniales</strong>
                  <p>Primero, las pérdidas se restan de las ganancias del mismo ejercicio dentro de la base del ahorro. Si vendiste una cripto con 8.000 € de ganancia y otra con 3.000 € de pérdida, tributas por 5.000 €.</p>
                </div>
              </div>
              <div className="fisc-step">
                <div className="fisc-step-n">2</div>
                <div>
                  <strong>Contra rendimientos del capital mobiliario, con tope del 25%</strong>
                  <p>Si aún te queda saldo negativo, puedes compensarlo contra el saldo positivo de rendimientos del capital mobiliario —dividendos, intereses, staking— pero solo hasta el <strong>25%</strong> de ese saldo.</p>
                </div>
              </div>
              <div className="fisc-step">
                <div className="fisc-step-n">3</div>
                <div>
                  <strong>Los cuatro años siguientes</strong>
                  <p>Lo que siga sin compensar no se pierde: se arrastra a los <strong>cuatro ejercicios siguientes</strong>, aplicando el mismo orden. Pasado ese plazo, caduca — por eso conviene llevar un control anual de saldos pendientes.</p>
                </div>
              </div>
            </div>

            <div className="gbc-box gbc-box--red" style={{ marginTop: 28 }}>
              <div className="gbc-box-title">La regla de recompra: para cripto es un año, no dos meses</div>
              <div className="gbc-box-body">
                <p>
                  Circula mucha desinformación con esto. La famosa <strong>«regla de los dos meses»</strong>
                  está pensada para <em>valores admitidos a negociación</em> —acciones cotizadas— y las
                  criptomonedas no lo son. A ellas se les aplica la regla general del{" "}
                  <strong>artículo 33.5.e) de la Ley del IRPF</strong>: si vendes con pérdidas y{" "}
                  <strong>recompras el mismo activo dentro del año siguiente</strong>, esa pérdida no se
                  computa en ese ejercicio.
                </p>
                <p style={{ marginTop: 12 }}>
                  Matiz importante y tranquilizador: la pérdida <strong>no se pierde, se difiere</strong>.
                  Podrás computarla cuando transmitas definitivamente esas monedas recompradas. Lo que la
                  norma impide es aflorar una pérdida fiscal manteniendo en la práctica la misma posición.
                </p>
              </div>
            </div>

            <div className="gbc-body" style={{ marginTop: 28 }}>
              <p>
                ¿Y si el problema es que <strong>no puedes vender</strong>? El caso de los fondos atrapados en una plataforma quebrada —el escenario FTX— es distinto. No basta con que el activo valga cero: hace falta que la pérdida esté <em>justificada</em> y que exista una alteración patrimonial acreditable, normalmente ligada al procedimiento concursal. No es
                algo que se pueda dar por hecho el año del colapso, y es uno de los supuestos donde
                merece más la pena sentarse con un asesor.
              </p>
            </div>
          </div>
        </section>

      {/* ── MURO PREMIUM: las herramientas y el cierre ── */}
      {isPremium ? (
        <>
          {/* ── SECCIÓN 9: ERRORES Y CALENDARIO ── */}
          <section id="errores" className="gbc-section">
            <div className="gbc-gc">
              <div className="gbc-ey">Sección 9</div>
              <h2 className="gbc-title">Calendario fiscal y los errores que más dinero cuestan</h2>
              <div className="gbc-body">
                <p>
                  El año de la fiscalidad cripto tiene dos citas fijas y una tarea continua que casi nadie
                  hace hasta
                  que es tarde: mantener el histórico de operaciones al día.
                </p>
              </div>

              <div className="fisc-cal">
                <div className="fisc-cal-item">
                  <div className="fisc-cal-when">1 ene – 31 mar</div>
                  <div className="fisc-cal-what">
                    <strong>Modelo 721</strong>
                    <span>Informativa de monedas virtuales en el extranjero del año anterior, si superas los 50.000 €.</span>
                  </div>
                </div>
                <div className="fisc-cal-item">
                  <div className="fisc-cal-when">Abr – jun</div>
                  <div className="fisc-cal-what">
                    <strong>Renta (modelo 100) y Patrimonio (modelo 714)</strong>
                    <span>Campaña ordinaria. Aquí van tus ganancias y pérdidas patrimoniales y tus rendimientos del capital mobiliario.</span>
                  </div>
                </div>
                <div className="fisc-cal-item">
                  <div className="fisc-cal-when">31 dic</div>
                  <div className="fisc-cal-what">
                    <strong>Fecha de foto</strong>
                    <span>Es el día que fija el valor de tu patrimonio para el 721 y para el Impuesto sobre el Patrimonio.</span>
                  </div>
                </div>
                <div className="fisc-cal-item">
                  <div className="fisc-cal-when">Todo el año</div>
                  <div className="fisc-cal-what">
                    <strong>Registro de operaciones</strong>
                    <span>Exporta el histórico de cada plataforma. Reconstruir tres años de operativa en abril es donde se cometen los errores.</span>
                  </div>
                </div>
              </div>

              <div className="gbc-body" style={{ marginTop: 32 }}>
                <p>
                  En cuanto a las casillas, las ganancias y pérdidas por transmisión de monedas virtuales
                  tienen su apartado propio dentro de la declaración —en el bloque de ganancias y pérdidas
                  patrimoniales de la base del ahorro, alrededor de las casillas{" "}
                  <strong>1800 y siguientes</strong>—, donde se detalla cada operación con su valor de
                  transmisión y de adquisición. La numeración exacta puede variar de una campaña a otra,
                  así que conviene guiarse por el nombre del apartado y no por el número memorizado del
                  año pasado.
                </p>
              </div>

              <div className="gbc-fc-section" style={{ padding: 0, marginTop: 32 }}>
                <h3 className="gbc-title" style={{ fontSize: 20, marginTop: 8 }}>
                  Los seis errores más caros — haz clic en cada tarjeta
                </h3>
                <GuideFlipCards cards={ERROR_CARDS} />
              </div>

              <div className="gbc-box gbc-box--green" style={{ marginTop: 32 }}>
                <div className="gbc-box-title">Si arrastras años sin declarar</div>
                <div className="gbc-box-body">
                  <p>
                    Regularizar voluntariamente, antes de recibir cualquier requerimiento, activa el
                    régimen de recargos por declaración extemporánea en lugar del régimen sancionador —
                    que es sustancialmente más duro. Dicho de otro modo: adelantarse siempre sale más
                    barato que esperar a que llamen. Con el cruce automático de datos plenamente operativo
                    desde 2026, el margen para esperar se ha reducido a prácticamente nada.
                  </p>
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
                <p>
                  Necesitas <strong>5/5</strong> respuestas correctas para desbloquear el badge{" "}
                  <strong style={{ color: "var(--gold)" }}>Cuentas Claras</strong>. No son preguntas de
                  memoria: son los cinco matices donde más gente se deja dinero. Puedes releer cualquier
                  sección antes de responder.
                </p>
              </div>
              <GuideFiscalQuiz />
            </div>
          </section>
        </>
      ) : (
        <section id="errores" className="gbc-section">
          <div className="gbc-gc">
            <div className="gbc-ey">
              Herramientas y cierre <span className="gbc-lock-pill">Premium</span>
            </div>
            <h2 className="gbc-title">Calendario fiscal, los seis errores caros y las herramientas</h2>
            <div className="gbc-body">
              <p>
                Hasta aquí tienes la fiscalidad cripto entera y gratis. Qué tributa, cómo se calcula con FIFO y cuánto se paga en cada tramo. Cómo van staking y airdrops, y a quién le tocan el modelo 721, el Patrimonio y la compensación de pérdidas. Lo que queda es la parte que se usa
                con la declaración delante.
              </p>
            </div>

            <div className="fisc-locked-list">
              <div className="fisc-locked-item"><span>1</span> Simulador FIFO: mete tus compras y tus ventas y mira qué lote consume cada una</div>
              <div className="fisc-locked-item"><span>2</span> Calculadora por tramos: tu ganancia desglosada del 19% al 30%, tramo a tramo</div>
              <div className="fisc-locked-item"><span>3</span> Calendario fiscal del ejercicio y los seis errores que más dinero cuestan</div>
              <div className="fisc-locked-item"><span>4</span> Quiz de cinco preguntas y el badge Cuentas Claras</div>
            </div>

            <div className="gbc-paywall" id="quiz">
              <div className="gbc-paywall-badge">Has leído las 8 secciones de teoría</div>
              <div className="gbc-paywall-t">
                {isRegistered
                  ? "Hazte Premium para las herramientas"
                  : "Las herramientas son Premium"}
              </div>
              <div className="gbc-paywall-d">
                La norma la tienes entera arriba. Lo que desbloquea Premium es aplicarla a tu caso:
                el <strong>simulador FIFO</strong>, la <strong>calculadora por tramos</strong>, el
                calendario con los errores caros, el quiz y tu badge{" "}
                <strong>Cuentas Claras</strong>. Una sola declaración mal planteada cuesta más que la
                suscripción de un año.
              </div>
              <Link href="/premium" className="gbc-paywall-btn">Hazte Premium →</Link>
              <div className="gbc-paywall-login">
                {isRegistered ? (
                  <>Ya tienes cuenta gratuita — solo te falta el acceso Premium.</>
                ) : (
                  <>¿Ya eres Premium? <Link href="/login">Inicia sesión</Link></>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <GuiasRelacionadas slug={SLUG} />

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
