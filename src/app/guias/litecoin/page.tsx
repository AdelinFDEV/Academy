import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import GuideProgressBar from "@/components/GuideProgressBar";
import GuideInteractions from "@/components/GuideInteractions";
import GuideBreadcrumbJsonLd from "@/components/GuideBreadcrumbJsonLd";
import GuiasRelacionadas from "@/components/GuiasRelacionadas";
import GuideQuizCuenta from "@/components/GuideQuizCuenta";
import GuiaAnuncio from "@/components/GuiaAnuncio";
import DisclaimerRiesgo from "@/components/DisclaimerRiesgo";
import Termino from "@/components/Termino";
import { datosDeGuia } from "@/lib/guiaDatos";
import GuideLitecoinPago from "./GuideLitecoinPago";
import GuideLitecoinQuiz from "./GuideLitecoinQuiz";
import "./litecoin.css";

/**
 * Guía «Qué es Litecoin» (14-11-2026). Consulta objetivo: «qué es litecoin».
 *
 * El ángulo: Litecoin como red de pagos, medida. Lo que tarda de verdad un pago
 * según las confirmaciones (con el margen del 90 %, que no da nadie), lo que
 * cuesta frente a Bitcoin con datos de Blockchair, el calendario completo de
 * halvings, el papel de banco de pruebas (SegWit, Lightning, MWEB) y lo que
 * puede hacer un inversor español con el ETF estadounidense (nada: PRIIPs).
 * La división de 2017 y los bloques grandes son el ángulo de la guía de Bitcoin
 * Cash; aquí solo se menciona y se enlaza.
 *
 * Al revisarla: comisiones y emisión (Blockchair), fecha estimada del próximo
 * halving, patrimonio del ETF LTCC y si la UE aclara cómo trata MWEB el
 * reglamento contra el blanqueo.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/guias/litecoin" },
  title: "Qué es Litecoin (LTC) y cuánto tarda un pago",
  description:
    "Qué es Litecoin, en qué se diferencia de Bitcoin y cuánto tarda y cuesta un pago, con calculadora. Halvings, privacidad MWEB, el ETF y qué mirar desde España.",
  openGraph: {
    title: "Qué es Litecoin (LTC): pagos, halvings y privacidad opcional",
    description:
      "La plata de Bitcoin, medida: cuánto tarda un pago con cada número de confirmaciones, cuánto cuesta, cuándo es el próximo halving y qué pasó con MWEB. Con quiz.",
    type: "article",
  },
};

const SLUG = "litecoin";

const SECCIONES = [
  { id: "que-es", label: "Qué es" },
  { id: "frente-a-bitcoin", label: "Frente a Bitcoin" },
  { id: "pago", label: "Un pago, medido" },
  { id: "mineria", label: "Minería" },
  { id: "halving", label: "Halvings" },
  { id: "laboratorio", label: "SegWit y MWEB" },
  { id: "espana", label: "Desde España" },
  { id: "riesgos", label: "Riesgos" },
  { id: "quiz", label: "Quiz" },
];

const HALVINGS = [
  { fecha: "Octubre de 2011", bloque: "0", premio: "50 LTC", nota: "Arranque de la red" },
  { fecha: "25 de agosto de 2015", bloque: "840.000", premio: "25 LTC", nota: "Primer halving" },
  { fecha: "5 de agosto de 2019", bloque: "1.680.000", premio: "12,5 LTC", nota: "Segundo halving" },
  { fecha: "2 de agosto de 2023", bloque: "2.520.000", premio: "6,25 LTC", nota: "El último, el vigente" },
  { fecha: "Hacia finales de julio de 2027", bloque: "3.360.000", premio: "3,125 LTC", nota: "Estimado: depende del ritmo real de los bloques" },
];

export default async function LitecoinPage() {
  const d = await datosDeGuia(SLUG);

  return (
    <div className="gbc-wrap">
      <GuideBreadcrumbJsonLd slug={SLUG} />
      <GuideProgressBar />
      <SiteNav {...d.nav} />

      <nav className="gbc-index" aria-label="Índice de la guía">
        <div className="gbc-index-inner">
          <span className="gbc-index-lbl">Índice</span>
          {SECCIONES.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="gbc-index-link">{s.label}</a>
          ))}
        </div>
      </nav>

      <header className="gbc-hero">
        <div className="gbc-hero-glow" aria-hidden="true" />
        <div className="gbc-hero-ey">Guía de criptomonedas · Nivel básico · 12 min</div>
        <h1 className="gbc-hero-title">
          Qué es Litecoin (LTC)<br />
          <span className="gbc-hero-gold">y cuánto tarda y cuesta un pago de verdad</span>
        </h1>
        <p className="gbc-respuesta">
          <strong>Litecoin es una criptomoneda creada en 2011 como una copia retocada de Bitcoin, pensada para
          pagos más rápidos y baratos.</strong> Añade un bloque cada 2,5 minutos en vez de cada 10, tendrá como
          máximo 84 millones de monedas y la comisión de red de un envío no llega a un céntimo. Su moneda se llama LTC
          y en España se compra, se guarda y se declara como cualquier otra.
        </p>
        <p className="gbc-revisado">Revisada el <strong>14 de noviembre de 2026</strong> · Datos de red: Blockchair, 14-11-2026</p>
        <div className="gbc-hero-pills">
          <span className="gbc-pill">Calculadora de un pago</span>
          <span className="gbc-pill">Calendario de halvings</span>
          <span className="gbc-pill">Quiz con logro</span>
        </div>
      </header>

      {/* ── 1 ── */}
      <section id="que-es" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo básico</div>
          <h2 className="gbc-title">Qué es Litecoin y por qué se creó</h2>
          <div className="gbc-body">
            <p>
              Si te preguntas qué es Litecoin, la respuesta corta es esta: el <Termino slug="bitcoin">Bitcoin</Termino> de
              2011 con tres piezas cambiadas para que pagar fuera más ágil. Es una red independiente, con su propia
              <Termino slug="blockchain"> blockchain</Termino>, sus propios <Termino slug="minero">mineros</Termino> y su propia moneda, el LTC.
            </p>
            <p>
              La creó Charlie Lee, entonces ingeniero de Google, en octubre de 2011. Tomó el código abierto de Bitcoin
              y lo modificó. La idea la resumió con una imagen que aún se repite: si Bitcoin es el oro digital,
              Litecoin quiere ser la plata. Más abundante, más rápida de mover y pensada para el gasto diario.
            </p>
            <p>
              Lee apenas conserva LTC. El 20 de diciembre de 2017, con el precio cerca de sus máximos de entonces,
              anunció que había vendido o donado casi todos sus LTC: dijo que opinar sobre el precio teniéndolos era
              un conflicto de interés. Sigue al frente del proyecto y en 2025 entró en el consejo de Lite Strategy,
              una empresa cotizada en Nasdaq que ese año llegó a acumular 929.548 LTC como reserva.
            </p>
            <p>
              Fue una de las primeras <Termino slug="altcoin">altcoins</Termino> y, quince años después, sigue entre
              las criptomonedas más conocidas. No tiene empresa detrás. La impulsa una fundación sin ánimo
              de lucro, la Litecoin Foundation, que financia parte del desarrollo con donaciones.
            </p>
          </div>
        </div>
      </section>

      {/* ── 2 ── */}
      <section id="frente-a-bitcoin" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">La comparación obligada</div>
          <h2 className="gbc-title">¿Cuál es la diferencia entre Litecoin y Bitcoin?</h2>
          <div className="gbc-body">
            <p>
              Funcionan igual por dentro: los dos usan <Termino slug="prueba-de-trabajo">prueba de trabajo</Termino>,
              el mismo modelo de direcciones y la misma forma de firmar operaciones. Lo que cambia son unos pocos
              números, y de ellos sale todo lo demás.
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th></th><th>Bitcoin</th><th>Litecoin</th></tr></thead>
              <tbody>
                <tr><td><strong>Un bloque cada…</strong></td><td>10 minutos</td><td>2,5 minutos</td></tr>
                <tr><td><strong>Monedas como máximo</strong></td><td>21 millones</td><td>84 millones</td></tr>
                <tr><td><strong><Termino slug="oferta-circulante">Monedas ya emitidas</Termino></strong></td><td>20,1 millones (95,8 %)</td><td>77,8 millones (92,6 %)</td></tr>
                <tr><td><strong><Termino slug="algoritmo-de-minado">Algoritmo de minado</Termino></strong></td><td>SHA-256</td><td>Scrypt</td></tr>
                <tr><td><strong>Premio por bloque hoy</strong></td><td>3,125 BTC</td><td>6,25 LTC</td></tr>
                <tr><td><strong>Comisión mediana, 24 h</strong></td><td>0,147 $ (unos 13 céntimos)</td><td>0,00034 $ (unas tres centésimas de céntimo)</td></tr>
                <tr><td><strong>Operaciones en 24 h</strong></td><td>462.614</td><td>164.285</td></tr>
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Emisión, comisiones y operaciones: Blockchair, 14 de noviembre de 2026. Conversión a euros con el cambio
            de referencia del BCE del 13 de noviembre de 2026 (1 € = 1,1052 $). La mediana es la comisión del pago
            que queda en medio: la mitad de los envíos pagó menos y la otra mitad, más.
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Fíjate en que todo encaja con un cuatro. Bloques cuatro veces más frecuentes, cuatro veces más monedas.
              Así el ritmo de emisión en el tiempo es el mismo que el de Bitcoin, solo que repartido en unidades más
              pequeñas.
            </p>
            <p>
              Lo que la tabla no dice es el tamaño. A precios del 14 de noviembre de 2026 (unos 60.000 euros por BTC
              y unos 43 euros por LTC), la <Termino slug="market-cap">capitalización de mercado</Termino> de Bitcoin
              es unas 360 veces la de Litecoin. Y su red mueve casi tres veces más operaciones al día. Litecoin es más ágil, pero también mucho más pequeña.
            </p>
          </div>
        </div>
      </section>

      {/* ── 3 ── */}
      <section id="pago" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que nadie mide</div>
          <h2 className="gbc-title">Cuánto tarda una transacción de Litecoin, y cuánto cuesta</h2>
          <div className="gbc-body">
            <p>
              Casi todas las explicaciones se quedan en «2,5 minutos por bloque». Eso no es lo que tarda un pago.
              Un pago se da por bueno cuando lleva varias <Termino slug="confirmacion">confirmaciones</Termino>, es
              decir, cuando se han añadido varios bloques encima del suyo. Cuántas, lo decide quien cobra: un
              <Termino slug="exchange"> exchange</Termino>, una tienda o tú.
            </p>
            <p>
              Hay un segundo detalle. Los bloques no llegan como un reloj, sino al azar: 2,5 minutos es la media. A
              veces salen dos en un minuto y a veces pasan diez sin ninguno. Por eso la calculadora te da la espera
              media y también el margen dentro del que caen 9 de cada 10 pagos.
            </p>
          </div>

          <GuideLitecoinPago />

          <div className="gbc-body" style={{ marginTop: 26 }}>
            <p>Los números que salen, para los casos más habituales:</p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Confirmaciones</th><th>Litecoin: media · 9 de cada 10</th><th>Bitcoin: media · 9 de cada 10</th></tr></thead>
              <tbody>
                <tr><td><strong>1</strong></td><td>2,5 min · antes de 5,8 min</td><td>10 min · antes de 23 min</td></tr>
                <tr><td><strong>3</strong></td><td>7,5 min · antes de 13 min</td><td>30 min · antes de 53 min</td></tr>
                <tr><td><strong>6</strong></td><td>15 min · antes de 23 min</td><td>60 min · antes de 93 min</td></tr>
                <tr><td><strong>12</strong></td><td>30 min · antes de 42 min</td><td>120 min · antes de 166 min</td></tr>
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Cálculo propio: el tiempo hasta N bloques sigue una distribución de Erlang con la media de cada red.
            Comisiones de la calculadora: mediana de 24 horas según Blockchair, 14 de noviembre de 2026.
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Ahora el coste. Ese día, la comisión mediana de la red fue de unos 0,0003 euros en Litecoin y de unos
              13 céntimos en Bitcoin. En un pago de 20 euros, eso es el 0,0016 % frente al 0,67 %. En Bitcoin la
              cifra se dispara en los días de atasco, cuando la <Termino slug="mempool">mempool</Termino> se llena y
              hay que pujar por entrar en el bloque.
            </p>
            <p>
              Una trampa a evitar: una confirmación de Litecoin no protege lo mismo que una de Bitcoin. Su red tiene
              mucha menos potencia de cálculo detrás, y por eso los exchanges suelen pedir más bloques de LTC que de
              BTC para darte el depósito por bueno. Compara siempre con las confirmaciones que te exijan a ti, no con
              las del folleto.
            </p>
            {/* EXPERIENCIA DEL ADMIN: un depósito o pago real en LTC (exchange usado, confirmaciones que pidió, minutos que tardó y comisión de retirada cobrada), comparado con uno en BTC. */}
          </div>
          <div className="gbc-box gbc-box--gold">
            <div className="gbc-box-title">Lo que más pagas no es la red</div>
            <div className="gbc-box-body">
              <p>La comisión de red es casi cero, pero un exchange cobra su propia tarifa fija por retirar, que suele
              ser muchas veces mayor. Antes de mover LTC, mira esa cifra en la pantalla de retirada: es la que de
              verdad te cuesta el envío.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Anuncio de media guía ── */}
      <GuiaAnuncio producto="portfolio" variante="compacto" estado={d.estado} />

      {/* ── 4 ── */}
      <section id="mineria" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Quién la sostiene</div>
          <h2 className="gbc-title">Cómo se mina Litecoin: Scrypt y la minería compartida con Dogecoin</h2>
          <div className="gbc-body">
            <p>
              Litecoin la mantienen mineros, como Bitcoin. La diferencia está en el
              algoritmo. Charlie Lee eligió Scrypt, una función que exige mucha memoria, con la idea de que se pudiera
              minar con ordenadores corrientes y no solo con máquinas especializadas.
            </p>
            <p>
              Esa idea no duró. Hacia 2014 llegaron las máquinas <Termino slug="asic">ASIC</Termino> para Scrypt,
              mucho más eficientes que cualquier tarjeta gráfica. Hoy minar Litecoin en casa no sale a cuenta: el
              <Termino slug="hash-rate"> hash rate</Termino> de la red rondaba los 2,7 PH/s (unos 2,7 mil billones
              de cálculos por segundo) el 14 de noviembre de 2026, según Blockchair. Casi todo sale de granjas
              profesionales.
            </p>
            <p>
              Desde septiembre de 2014, Dogecoin admite la
              <Termino slug="mineria-fusionada"> minería fusionada</Termino> con Litecoin. Como las dos usan Scrypt,
              un minero puede asegurar las dos redes con el mismo trabajo y cobrar el premio de ambas.
            </p>
          </div>
          <div className="ltc-fusion">
            <div>
              <span className="ltc-fusion-et">Para el minero</span>
              <p>Cobra dos premios por la misma electricidad: el bloque de Litecoin y el de Dogecoin.</p>
            </div>
            <div>
              <span className="ltc-fusion-et">Para Litecoin</span>
              <p>Esos ingresos extra ayudan a mantener mineros en la red aunque el premio en LTC se parta por la mitad cada cuatro años.</p>
            </div>
            <div>
              <span className="ltc-fusion-et">Para Dogecoin</span>
              <p>Hereda la seguridad de una red mucho más potente que la que tendría ella sola.</p>
            </div>
          </div>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              La cara menos amable es la dependencia. Parte del sueldo de quien protege Litecoin depende del precio
              de una moneda que nació como broma. Si Dogecoin cayera con fuerza, algunos mineros podrían dejar de
              salirles las cuentas.
            </p>
          </div>
        </div>
      </section>

      {/* ── 5 ── */}
      <section id="halving" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">El calendario</div>
          <h2 className="gbc-title">¿Cuándo es el próximo halving de Litecoin?</h2>
          <div className="gbc-body">
            <p>
              Hacia finales de julio de 2027, en el bloque 3.360.000. Cada 840.000 bloques, más o menos cada cuatro
              años, el premio por bloque se reduce a la mitad. Es el <Termino slug="halving">halving</Termino>, el
              mismo mecanismo que usa Bitcoin.
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Fecha</th><th>Bloque</th><th>Premio desde entonces</th><th></th></tr></thead>
              <tbody>
                {HALVINGS.map((h) => (
                  <tr key={h.bloque}>
                    <td><strong>{h.fecha}</strong></td>
                    <td>{h.bloque}</td>
                    <td>{h.premio}</td>
                    <td>{h.nota}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            El 14 de noviembre de 2026 la red iba por el bloque 3.212.763 (Blockchair). Quedan unos 147.000 bloques:
            a 2,5 minutos cada uno, unos 256 días. La fecha se mueve si los bloques salen más rápido o más lento.
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Hoy se crean 6,25 LTC por bloque, unos 3.600 al día. Sobre los 77,8 millones que ya existen, es una
              <Termino slug="inflacion"> inflación</Termino> del 1,7 % al año, el doble que la de Bitcoin. Tras el
              halving de 2027 bajará a algo menos del 0,9 %.
            </p>
            <p>
              Lo que no hace un halving es garantizar que el precio suba. LTC marcó su
              <Termino slug="ath"> máximo histórico</Termino> en unos 410 dólares en mayo de 2021, según
              CoinGecko. Después llegó el halving de 2023, y en noviembre de 2026 cotiza por debajo de los 50.
              Menos emisión solo empuja el precio si la demanda se mantiene.
            </p>
          </div>
        </div>
      </section>

      {/* ── 6 ── */}
      <section id="laboratorio" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">El banco de pruebas</div>
          <h2 className="gbc-title">SegWit, Lightning y MWEB: lo que Litecoin probó antes que Bitcoin</h2>
          <div className="gbc-body">
            <p>
              El papel más útil de Litecoin no ha sido el de moneda, sino el de laboratorio. Como su código es casi
              el de Bitcoin, sirve para probar mejoras con dinero real antes de llevarlas a la red grande.
            </p>
          </div>
          <ol className="ltc-hitos">
            <li>
              <span className="ltc-hitos-fecha">Mayo de 2017</span>
              <strong>Activa SegWit</strong>
              <p>
                <Termino slug="segwit">SegWit</Termino> separa las firmas del resto de la operación y libera espacio
                en el bloque. Litecoin lo activó el 10 de mayo de 2017; Bitcoin, en agosto. Esa misma pelea por el
                tamaño de los bloques acabó partiendo Bitcoin en dos ese verano, la historia que cuenta la guía de
                <Link href="/guias/bitcoin-cash"> Bitcoin Cash</Link>.
              </p>
            </li>
            <li>
              <span className="ltc-hitos-fecha">Mayo de 2017</span>
              <strong>Primer pago por Lightning en la red principal</strong>
              <p>
                Con SegWit activo, un desarrollador de Blockstream envió un pago por
                <Termino slug="lightning-network"> Lightning Network</Termino>, una
                <Termino slug="capa-2"> capa 2</Termino> que mueve pagos fuera de la cadena y solo apunta el
                resultado. Fue sobre Litecoin, meses antes de que funcionara en Bitcoin.
              </p>
            </li>
            <li>
              <span className="ltc-hitos-fecha">Mayo de 2022</span>
              <strong>Llega MWEB, la privacidad opcional</strong>
              <p>
                MWEB (MimbleWimble Extension Blocks) añade a cada bloque una zona paralela donde las cantidades y
                las direcciones van ocultas. Es voluntaria: solo la usa quien envía a una dirección que empieza por
                «ltcmweb1». Las entradas y salidas de esa zona sí se ven.
              </p>
            </li>
          </ol>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              MWEB tuvo un precio inmediato. En junio de 2022, los cinco grandes exchanges de Corea del Sur (Upbit,
              Bithumb, Coinone, Korbit y Gopax) anunciaron que retiraban Litecoin. Su ley contra el blanqueo prohíbe
              las operaciones anónimas, y no podían garantizar que sus clientes no las usaran.
            </p>
            <p>
              Eso convierte a Litecoin en un caso raro. No es una <Termino slug="moneda-de-privacidad">moneda de
              privacidad</Termino> como <Link href="/guias/monero">Monero</Link>, donde todo va oculto siempre. Es
              una moneda pública con una puerta a la privacidad. Si tú no la usas, tus operaciones son tan visibles
              en un <Termino slug="explorador-de-bloques">explorador de bloques</Termino> como en Bitcoin.
            </p>
            <p>
              En Europa queda una pregunta abierta. El reglamento (UE) 2024/1624 contra el blanqueo se aplica desde
              el 10 de julio de 2027 y prohíbe a los exchanges llevar cuentas que permitan anonimizar operaciones,
              también mediante «criptomonedas que refuerzan el anonimato». Las define como las que ocultan los
              datos de las transferencias de forma sistemática u opcional, así que la privacidad opcional entra en
              la definición.
            </p>
            <p>
              Lo que no existe a noviembre de 2026 es una lista oficial, ni una aclaración sobre si basta con que la
              red ofrezca MWEB para que todo LTC cuente como una de esas monedas. Hasta que la haya, cada exchange
              europeo decidirá por su cuenta.
            </p>
          </div>
        </div>
      </section>

      {/* ── 7 ── */}
      <section id="espana" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Desde España</div>
          <h2 className="gbc-title">Comprar Litecoin desde España: el ETF, Hacienda y dónde guardarlo</h2>
          <div className="gbc-body">
            <p>
              Para comprar Litecoin desde España lo normal es un exchange: abres cuenta, verificas tu identidad,
              ingresas euros y compras LTC. Antes, comprueba que la plataforma figura como proveedor autorizado en el
              registro de criptoactivos de la CNMV o de la ESMA, y mira dos comisiones: la de compra y la fija por
              retirar a tu <Termino slug="wallet">cartera</Termino>. Y conviene saber dos cosas más.
            </p>
          </div>
          <div className="ltc-hechos">
            <div>
              <strong>Tiene ETF al contado en EE. UU., pero tú no puedes comprarlo</strong>
              <p>
                El Canary Litecoin ETF (LTCC) es un <Termino slug="etf-de-bitcoin">ETF al contado</Termino>: cotiza
                en Nasdaq desde finales de octubre de 2025 y guarda LTC de verdad, con una comisión anual del 0,95 %.
                Gestionaba unos 13 millones de dólares a 26 de octubre de 2026, según ETF Central. Un minorista
                español no puede comprarlo: el reglamento europeo PRIIPs exige un{" "}
                <Termino slug="kid">documento de datos fundamentales (KID)</Termino> para vender este tipo de
                producto a particulares. La gestora no lo publica, así que los brókeres no lo ofrecen. Lo que sí
                cotiza en Europa son <Termino slug="etp">ETP</Termino> respaldados por LTC, como el CoinShares
                Physical Litecoin.
              </p>
            </div>
            <div>
              <strong>Tributa como cualquier otra criptomoneda</strong>
              <p>
                Vender LTC por euros o cambiarlo por otra criptomoneda es una venta a efectos fiscales. La ganancia
                va a la base del ahorro de la renta. Gastarlo en una tienda también cuenta como venta, aunque sea un
                café.
              </p>
            </div>
          </div>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Ese último punto choca con la idea de Litecoin como dinero para el día a día. Cada pago con LTC es una
              operación que, en teoría, tendrías que calcular y declarar. Si lo usas para pagar, guarda fecha, cantidad
              y valor en euros de cada movimiento. El método completo está en la guía de
              <Link href="/guias/fiscalidad-cripto-espana"> fiscalidad de las criptomonedas en España</Link>.
            </p>
            <p>
              Para guardarlo, cualquier cartera compatible con Litecoin sirve. Si
              vas a tenerlo a largo plazo, la <Termino slug="autocustodia">autocustodia</Termino> te quita el riesgo
              de que el exchange quiebre o lo retire, como pasó en Corea.
            </p>
          </div>
        </div>
      </section>

      {/* ── 8 ── */}
      <section id="riesgos" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que puede salir mal</div>
          <h2 className="gbc-title">Los riesgos de invertir en Litecoin</h2>
          <div className="gbc-body">
            <ul>
              <li><strong>Su razón de ser se ha estrechado.</strong> Pagar barato y rápido ya lo hacen las <Termino slug="stablecoin">stablecoins</Termino> en redes baratas, sin el vaivén del precio. Litecoin compite con eso, no solo con Bitcoin.</li>
              <li><strong>Menos seguridad que Bitcoin.</strong> Con mucha menos potencia de minado, <Termino slug="ataque-del-51">atacar su red</Termino> es más barato. Por eso los exchanges piden más confirmaciones.</li>
              <li><strong>Dependencia de Dogecoin.</strong> Parte de los ingresos de sus mineros llega por la minería fusionada. Si ese ingreso cae, puede bajar la potencia que protege la red.</li>
              <li><strong>MWEB y la regulación.</strong> Ya le costó salir de Corea. El reglamento europeo contra el blanqueo incluye la privacidad opcional en su definición: si los exchanges de la UE deciden que eso alcanza a LTC, podrían dejar de ofrecerlo desde julio de 2027.</li>
              <li><strong>El precio.</strong> Su <Termino slug="volatilidad">volatilidad</Termino> es la de cualquier criptomoneda, y lleva años muy lejos de sus máximos de 2021.</li>
              <li><strong>Liquidez en declive relativo.</strong> Su peso en el mercado ha caído frente a proyectos más nuevos, y con menos <Termino slug="liquidez">liquidez</Termino> las ventas grandes mueven más el precio.</li>
            </ul>
          </div>
          <DisclaimerRiesgo variante="general" />
        </div>
      </section>

      {/* ── Anuncio final ── */}
      <GuiaAnuncio producto="cursos" estado={d.estado} />

      {/* ── QUIZ ── */}
      <section id="quiz" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Quiz final</div>
          <h2 className="gbc-title">Comprueba lo que sabes de Litecoin</h2>
          <div className="gbc-body" style={{ marginBottom: 32 }}>
            <p>Cinco preguntas. Con las cinco acertadas desbloqueas el logro <strong style={{ color: "var(--gold)" }}>Plata Digital</strong>.</p>
          </div>
          {d.isRegistered ? <GuideLitecoinQuiz /> : <GuideQuizCuenta slug={SLUG} />}
        </div>
      </section>

      <GuiasRelacionadas slug={SLUG} />

      <section className="gbc-section gbc-interactions-section">
        <div className="gbc-gc">
          <div className="gbc-interactions-wrap">
            <p className="gbc-interactions-label">¿Te ha resultado útil esta guía?</p>
            <GuideInteractions {...d.interacciones} />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
