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
import GuideEthenaCobertura from "./GuideEthenaCobertura";
import GuideEthenaQuiz from "./GuideEthenaQuiz";
import "./ethena.css";

/**
 * Guía «Qué es Ethena» (14-11-2026). Consulta objetivo: «qué es ethena».
 *
 * Lo que tiene y los primeros resultados no: la cobertura explicada con un
 * ejemplo en números y un simulador (precio y funding), la composición real
 * del respaldo a 14-11-2026 (casi el 80 % en efectivo, no en cobertura), los
 * días que aguantaría el fondo de reserva con funding negativo, y el dictamen
 * de ESMA del 8-10-2026 con lo que supone para quien vive en España.
 *
 * Al revisarla: oferta de USDe y composición del respaldo (DefiLlama y panel
 * de transparencia de Ethena), fondo de reserva, rendimiento de sUSDe, precio
 * de ENA, estado del fee switch y el plazo del dictamen de ESMA. Los dos
 * datos del simulador viven en GuideEthenaCobertura.tsx.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/guias/ethena" },
  title: "Qué es Ethena (ENA) y cómo funciona USDe",
  description:
    "Qué es Ethena y cómo sostiene USDe su dólar: la cobertura con números, de dónde sale el rendimiento, qué pasó en 2025 y si puedes usarlo desde España.",
  openGraph: {
    title: "Qué es Ethena (ENA): USDe, sUSDe y su cobertura, explicados con números",
    description:
      "Un simulador de la cobertura, el respaldo real de USDe a noviembre de 2026, el fondo de reserva, el episodio de Binance y lo que dicen BaFin y ESMA. Con quiz.",
    type: "article",
  },
};

const SLUG = "ethena";

const SECCIONES = [
  { id: "que-es", label: "Qué es" },
  { id: "cobertura", label: "La cobertura" },
  { id: "rendimiento", label: "El rendimiento" },
  { id: "respaldo", label: "El respaldo hoy" },
  { id: "binance", label: "Octubre de 2025" },
  { id: "ena", label: "El token ENA" },
  { id: "espana", label: "Desde España" },
  { id: "riesgos", label: "Riesgos" },
  { id: "quiz", label: "Quiz" },
];

const TOKENS = [
  { tipo: "El dólar", nombre: "USDe", texto: "La moneda estable de Ethena. Aspira a valer 1 dólar. Tenerla no paga nada: es la base de todo lo demás." },
  { tipo: "El dólar que rinde", nombre: "sUSDe", texto: "USDe depositado en el contrato de Ethena. Su valor en USDe sube a medida que entra el rendimiento del protocolo." },
  { tipo: "El token del proyecto", nombre: "ENA", texto: "Sirve para votar las decisiones del protocolo. Su precio sube y baja como el de cualquier criptomoneda." },
];

export default async function EthenaPage() {
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
        <div className="gbc-hero-ey">Guía de criptomonedas · Nivel intermedio · 13 min</div>
        <h1 className="gbc-hero-title">
          Qué es Ethena (ENA)<br />
          <span className="gbc-hero-gold">y cómo sostiene USDe su dólar sin tener dólares</span>
        </h1>
        <p className="gbc-respuesta">
          <strong>Ethena es un protocolo que emite USDe, un dólar sintético que no se respalda con dólares en un
          banco.</strong> Se respalda con criptomonedas compradas al contado y una apuesta a la baja del mismo
          tamaño, de modo que si el precio sube o baja, una cosa compensa a la otra. Y, cada vez más, con otras
          stablecoins: en noviembre de 2026 son casi el 80 % del respaldo. Lo que cobra esa apuesta, y lo que rinde el efectivo
          que guarda, es el rendimiento que reparte. Si vives en la Unión Europea, USDe no
          tiene un emisor autorizado y Ethena no te ofrece el depósito que cobra ese rendimiento.
        </p>
        <p className="gbc-revisado">Revisada el <strong>14 de noviembre de 2026</strong> · Datos del panel de transparencia de Ethena y de DefiLlama</p>
        <div className="gbc-hero-pills">
          <span className="gbc-pill">Simulador de la cobertura</span>
          <span className="gbc-pill">El respaldo real, con porcentajes</span>
          <span className="gbc-pill">Quiz con logro</span>
        </div>
      </header>

      {/* ── 1 ── */}
      <section id="que-es" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo básico</div>
          <h2 className="gbc-title">Qué es Ethena, en una frase y en tres tokens</h2>
          <div className="gbc-body">
            <p>
              Ethena es un proyecto de <Termino slug="defi">finanzas descentralizadas</Termino> que fabrica
              dólares digitales. Su producto se llama USDe. Como cualquier
              <Termino slug="stablecoin"> stablecoin</Termino>, aspira a valer siempre 1 dólar. La diferencia está
              en qué hay detrás.
            </p>
            <p>
              USDT o USDC guardan dólares, o deuda pública, en cuentas de bancos y gestoras. Ethena no. Guarda
              criptomonedas y las protege de su propia caída con una posición en
              <Termino slug="futuros"> futuros</Termino>. Por eso Ethena prefiere llamarlo «dólar sintético»: su
              valor no sale de un depósito, sale de una operación financiera.
            </p>
            <p>
              El proyecto lo fundó Guy Young en 2023 y USDe empezó a circular a principios de 2024. A 14 de
              noviembre de 2026 había unos 4.900 millones de USDe en circulación, según DefiLlama. Llegó a haber
              14.800 millones el 4 de octubre de 2025. Alrededor de USDe hay tres tokens, y conviene no
              confundirlos:
            </p>
          </div>
          <div className="ena-tokens">
            {TOKENS.map((t) => (
              <div key={t.nombre}>
                <span className="ena-token-tipo">{t.tipo}</span>
                <strong>{t.nombre}</strong>
                <p>{t.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2 ── */}
      <section id="cobertura" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Cómo funciona</div>
          <h2 className="gbc-title">Cómo funciona USDe: la cobertura delta neutral, con números</h2>
          <div className="gbc-body">
            <p>
              La idea se llama <Termino slug="delta-neutral">delta neutral</Termino>: tener un activo y, a la vez,
              una apuesta contraria del mismo tamaño. Lo que gana una parte lo pierde la otra, y el conjunto deja de
              moverse con el precio: es una <Termino slug="cobertura">cobertura</Termino> completa.
            </p>
            <p>
              Ethena compra ETH o BTC al <Termino slug="spot">contado</Termino> y abre una
              <Termino slug="long-short"> posición corta</Termino> del mismo tamaño en un
              <Termino slug="contrato-perpetuo"> contrato perpetuo</Termino>, un futuro sin fecha de vencimiento.
              Míralo con números. Alguien entrega 3.000 dólares en otra stablecoin para acuñar USDe (crear monedas
              nuevas a cambio de ese depósito), y ETH vale 3.000 dólares:
            </p>
          </div>

          <div className="ena-ejemplo">
            <div>
              <p className="ena-ejemplo-cab">Día 1 · ETH a 3.000 $</p>
              <dl>
                <dt>1 ETH al contado</dt><dd>3.000 $</dd>
                <dt>Corto de 1 ETH</dt><dd>0 $</dd>
                <dt>Respaldo</dt><dd className="es-total">3.000 $</dd>
              </dl>
            </div>
            <div>
              <p className="ena-ejemplo-cab">ETH cae un 20 %</p>
              <dl>
                <dt>1 ETH al contado</dt><dd>2.400 $</dd>
                <dt>Corto de 1 ETH</dt><dd>+600 $</dd>
                <dt>Respaldo</dt><dd className="es-total">3.000 $</dd>
              </dl>
            </div>
            <div>
              <p className="ena-ejemplo-cab">ETH sube un 50 %</p>
              <dl>
                <dt>1 ETH al contado</dt><dd>4.500 $</dd>
                <dt>Corto de 1 ETH</dt><dd>−1.500 $</dd>
                <dt>Respaldo</dt><dd className="es-total">3.000 $</dd>
              </dl>
            </div>
          </div>

          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Con esos 3.000 dólares de respaldo, Ethena emite 3.000 USDe. Pase lo que pase con ETH, el respaldo
              sigue valiendo lo mismo. Prueba tú con cualquier movimiento:
            </p>
          </div>

          <GuideEthenaCobertura />

          <div className="gbc-body" style={{ marginTop: 26 }}>
            <p>
              El ETH no se queda en el <Termino slug="exchange">exchange</Termino>. Ethena lo deja en manos de
              custodios externos, empresas que guardan criptomonedas por cuenta de otros. Ellos lo hacen constar
              como <Termino slug="colateral">colateral</Termino> en Binance, OKX o Bybit sin transferírselo. Así,
              si un exchange quiebra, el ETH no está dentro. La posición corta, en cambio, sí vive en ese exchange.
            </p>
            <p>
              Una precisión que importa: tú no puedes acuñar USDe. Solo pueden hacerlo usuarios aprobados, que
              pasan la verificación de identidad (<Termino slug="kyc">KYC</Termino>) de Ethena. Los demás compran
              y venden USDe en el mercado. Son esos usuarios aprobados quienes, al canjear 1 USDe por 1 dólar en
              otras stablecoins, devuelven el precio a su sitio cuando se desvía: compran barato en el mercado y
              canjean a 1 dólar. Es un <Termino slug="arbitraje">arbitraje</Termino>, y solo funciona si ellos
              están activos.
            </p>
          </div>
        </div>
      </section>

      {/* ── 3 ── */}
      <section id="rendimiento" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">De dónde sale el dinero</div>
          <h2 className="gbc-title">De dónde sale el rendimiento de Ethena, y qué pasa si el funding es negativo</h2>
          <div className="gbc-body">
            <p>
              El rendimiento de Ethena tiene tres fuentes. La principal es el
              <Termino slug="funding-rate"> funding rate</Termino>: el pago periódico entre quienes apuestan al alza
              y quienes apuestan a la baja en los perpetuos. Cuando el mercado es optimista, los largos pagan a los
              cortos. Y Ethena está en el lado corto.
            </p>
            <p>
              La segunda es el <Termino slug="staking">staking</Termino>. Cuando el respaldo lleva ETH, Ethena
              puede guardarlo como stETH, una versión de <Termino slug="staking-liquido">staking líquido</Termino>{" "}
              que rinde en torno a un 3-4 % anual, según su documentación. El 14 de noviembre de 2026 esa parte era
              prácticamente nula. La tercera es el efectivo: la parte del respaldo en stablecoins y deuda a corto
              plazo, que rinde aproximadamente lo que paga el Tesoro de Estados Unidos.
            </p>
            <p>
              Ese rendimiento no llega a quien tiene USDe a secas. Llega a quien lo deposita y recibe sUSDe. El
              contrato no te ingresa monedas: hace que cada sUSDe valga más USDe con el tiempo. A 11 de noviembre
              de 2026, el rendimiento medio de sUSDe en 30 días era del 5,1 % anual. Desde su lanzamiento, la media
              es del 10,2 %, según Ethena. Ninguna de las dos cifras está garantizada: el rendimiento depende del
              momento del mercado y puede quedarse en cero.
            </p>
          </div>

          <div className="gbc-box gbc-box--gold">
            <div className="gbc-box-title">Cuando el funding se vuelve negativo</div>
            <div className="gbc-box-body">
              <p>
                Si el mercado se pone pesimista, los cortos pagan a los largos. Ethena deja de cobrar y empieza a
                pagar. Primero lo absorben los otros ingresos. Si no bastan, entra el fondo de reserva, que existe
                para que esa pérdida no llegue a quien tiene sUSDe: según la documentación, sUSDe solo acumula
                rendimiento positivo o nulo.
              </p>
              <p>
                El fondo de reserva tenía unos 62 millones de dólares el 14 de noviembre de 2026, según el panel
                de transparencia de Ethena. Es un 1,3 % de los USDe en circulación. Y ya no crece: la parte de los
                ingresos que se le destina la fija la gobernanza, y hoy es del 0 %.
              </p>
            </div>
          </div>

          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              ¿Cuánto aguantaría? Usa la pestaña «Si cambia el funding» del simulador. Con la cobertura actual,
              cerca del 20 % del respaldo, y un funding de −10 % anual sostenido, el fondo cubriría unos 230 días
              solo de funding. Es un cálculo orientativo y conservador: no cuenta lo que rinde el efectivo, que
              compensa parte de la pérdida. Con datos de unos tres años, hasta finales de 2024, Ethena calcula que
              la racha más larga de funding negativo duró 13 días. Que no haya pasado no significa que no pueda
              pasar.
            </p>
            {/* EXPERIENCIA DEL ADMIN: si has tenido sUSDe o USDe, o lo has visto usar como garantía en un exchange, aquí encaja una línea con lo que viste (rendimiento real cobrado, cuánto tardó el canje, qué pasó el 10-10-2025). No inventar. */}
          </div>
        </div>
      </section>

      {/* ── Anuncio de media guía ── */}
      <GuiaAnuncio producto="portfolio" variante="compacto" estado={d.estado} />

      {/* ── 4 ── */}
      <section id="respaldo" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que casi nadie cuenta</div>
          <h2 className="gbc-title">Qué respalda hoy a USDe: menos cobertura y más efectivo</h2>
          <div className="gbc-body">
            <p>
              La explicación de la cobertura es correcta, pero hoy describe solo una parte de USDe. Cuando el
              funding baja, Ethena traslada respaldo a stablecoins y deuda a corto plazo, que no necesitan
              cobertura. Así se expone menos a pagar funding. El 14 de noviembre de 2026, el panel de
              transparencia de Ethena mostraba esto:
            </p>
          </div>

          <div className="ena-barra" role="img" aria-label="Respaldo de USDe: 79,4 % efectivo, 15,5 % bitcoin, 5,1 % resto">
            <span className="ena-barra-efectivo" style={{ width: "79.4%" }} />
            <span className="ena-barra-btc" style={{ width: "15.5%" }} />
            <span className="ena-barra-resto" style={{ width: "5.1%" }} />
          </div>
          <ul className="ena-barra-leyenda">
            <li><i className="ena-barra-efectivo" />Efectivo líquido, 79,4 %</li>
            <li><i className="ena-barra-btc" />BTC con cobertura, 15,5 %</li>
            <li><i className="ena-barra-resto" />ETH, acciones <Termino slug="tokenizacion">tokenizadas</Termino> y otros, 5,1 %</li>
          </ul>

          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Dónde está la cobertura</th><th>Parte del respaldo</th></tr></thead>
              <tbody>
                <tr><td><strong>Binance</strong></td><td>15,6 %</td></tr>
                <tr><td><strong>OKX</strong></td><td>4,0 %</td></tr>
                <tr><td><strong>Bybit</strong></td><td>2,1 %</td></tr>
                <tr><td><strong>Deribit y otros</strong></td><td>0,7 %</td></tr>
                <tr><td><strong>Sin asignar a ningún exchange</strong> (sobre todo el efectivo)</td><td>77,6 %</td></tr>
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Fuente: panel de transparencia de Ethena, 14 de noviembre de 2026. Respaldo total: 4.915 millones de
            dólares. «Efectivo líquido» es la etiqueta de Ethena para stablecoins y activos equivalentes.
          </p>

          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Ese efectivo son stablecoins como USDC, USDT o USDtb. USDtb es otra moneda estable de la propia
              Ethena, respaldada sobre todo por un fondo de deuda del Tesoro estadounidense gestionado por
              BlackRock. El resto incluye pequeñas posiciones en acciones y oro tokenizados. Lectura práctica: a noviembre de 2026, USDe se
              parece más a una stablecoin respaldada por otras stablecoins que a la máquina de funding de 2024. Eso reduce el riesgo de funding negativo y de los
              exchanges. A cambio, el rendimiento se acerca al de un depósito en dólares, y aparece otro riesgo: el
              de las stablecoins que guarda.
            </p>
            <p>
              Los números cambian de un mes a otro. Si el funding vuelve a subir, lo previsible es que la cobertura
              vuelva a crecer. Por eso estas cifras llevan fecha: el panel de transparencia de Ethena las publica a
              diario.
            </p>
          </div>
        </div>
      </section>

      {/* ── 5 ── */}
      <section id="binance" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">El día que se torció</div>
          <h2 className="gbc-title">Qué pasó con USDe en Binance el 10 de octubre de 2025</h2>
          <div className="gbc-body">
            <p>
              Ese viernes el mercado sufrió la mayor ola de <Termino slug="liquidacion">liquidaciones</Termino> de su
              historia: más de 19.000 millones de dólares, según CoinGlass. Bitcoin y{" "}
              <Link href="/guias/ethereum">Ethereum</Link> cayeron más de un 10 % en cuestión de horas. En el
              mercado al contado de Binance, USDe llegó a cotizar a 0,65 dólares entre las 21:36 y las 22:16, hora
              UTC: unos 40 minutos.
            </p>
            <p>
              En otros mercados, como Curve, apenas se apartó del dólar. El respaldo siguió por encima de lo
              emitido y los canjes funcionaron, según Ethena y el análisis de 21Shares. El fallo estaba en
              Binance: valoraba USDe con su propio
              <Termino slug="libro-de-ordenes"> libro de órdenes</Termino>, y no con un precio de referencia externo
              (un <Termino slug="oraculo">oráculo</Termino>). Y ese libro se quedó sin compradores.
            </p>
            <p>
              Ahí está la lección. Mucha gente tenía USDe como garantía para operar con
              <Termino slug="apalancamiento"> apalancamiento</Termino> en Binance. Al hundirse el precio en pantalla,
              su garantía «valía» un 35 % menos y sus posiciones se liquidaron. Binance compensó después a los
              afectados, pero el daño ya estaba hecho.
            </p>
          </div>
          <div className="gbc-box">
            <div className="gbc-box-title">El error típico</div>
            <div className="gbc-box-body">
              <p>
                Pensar que «está respaldado» significa «no puede caer». Un <Termino slug="depeg">depeg</Termino>
                {" "}puede ocurrir en un mercado concreto aunque el respaldo esté intacto, y dura lo justo para
                liquidarte. Si usas una stablecoin como garantía de una operación apalancada, el riesgo no es la
                moneda: es cómo la valora tu exchange en el peor minuto.
              </p>
            </div>
          </div>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              La confianza tardó más en volver que el precio. La oferta de USDe pasó de 14.700 millones el 1 de
              octubre de 2025 a 9.600 millones a final de mes, y a unos 4.900 millones en noviembre de 2026, según
              DefiLlama.
            </p>
          </div>
        </div>
      </section>

      {/* ── 6 ── */}
      <section id="ena" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">El token</div>
          <h2 className="gbc-title">Para qué sirve el token ENA de Ethena: votos y un fee switch dormido</h2>
          <div className="gbc-body">
            <p>
              ENA es el <Termino slug="token-de-gobernanza">token de gobernanza</Termino> de Ethena: quien lo tiene
              vota las propuestas del protocolo. No es una stablecoin ni da derecho a parte del respaldo de USDe.
              Su precio se mueve libremente.
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Dato</th><th>Valor</th></tr></thead>
              <tbody>
                <tr><td><strong>Oferta máxima</strong></td><td>15.000 millones de ENA</td></tr>
                <tr><td><strong><Termino slug="oferta-circulante">En circulación</Termino></strong></td><td>13.500 millones (90 %)</td></tr>
                <tr><td><strong>Precio</strong></td><td>0,118 dólares (unos 0,107 euros)</td></tr>
                <tr><td><strong>Máximo histórico</strong></td><td>1,52 dólares, el 11 de abril de 2024: hoy está un 92 % por debajo</td></tr>
                <tr><td><strong><Termino slug="market-cap">Capitalización</Termino></strong></td><td>Unos 1.600 millones de dólares, puesto 51</td></tr>
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">Fuente: CoinGecko, 14 de noviembre de 2026.</p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Durante años, ENA no recibía nada de los ingresos del protocolo. Eso cambia, en teoría, con el
              llamado «fee switch»: un interruptor que desvía comisiones hacia el token. La Fundación Ethena lo
              propuso el 27 de agosto de 2026 y la <Termino slug="gobernanza">gobernanza</Termino> lo aprobó.
              Dedica hasta el 95 % de los ingresos netos que recibe la fundación a la{" "}
              <Termino slug="recompra-de-tokens">recompra de ENA</Termino> en el mercado.
            </p>
            <p>
              Pero está dormido. Solo se activa cuando la oferta de USDe alcance el primer umbral, fijado
              inicialmente en 7.500 millones de dólares, según Crypto Briefing a 29 de octubre de 2026. Con 4.900
              millones en circulación, faltan más de 2.500. Hasta entonces, no hay recompras.
            </p>
            <p>
              La misma propuesta cambió el calendario de <Termino slug="vesting">vesting</Termino>. Los inversores
              iniciales recibieron de golpe, desde el 5 de octubre de 2026, todos los tokens que aún tenían
              bloqueados, en vez de mes a mes. Tras esa <Termino slug="liberacion-de-tokens">liberación</Termino>,
              solo queda bloqueado en torno al 12 % de la oferta, del equipo, el ecosistema y la fundación, según
              The Block. Aparte está StablecoinX, una empresa que acumula ENA y tiene cerca del 20 % de la oferta
              sujeto a su propio bloqueo pactado.
            </p>
          </div>
        </div>
      </section>

      {/* ── 7 ── */}
      <section id="espana" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Desde España</div>
          <h2 className="gbc-title">¿Se puede usar Ethena en España? BaFin, MiCA y Hacienda</h2>
          <div className="gbc-body">
            <p>
              Respuesta corta: ningún emisor autorizado en la Unión Europea respalda USDe, y Ethena no te ofrece
              sUSDe si vives aquí, según su propia documentación. Tener USDe no es ilegal. Lo que se está cerrando son las vías reguladas para comprarlo. Así se
              ha llegado hasta aquí:
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Cuándo</th><th>Qué pasó</th><th>Qué supone para ti</th></tr></thead>
              <tbody>
                <tr><td><strong>21 de marzo de 2025</strong></td><td>El supervisor alemán, BaFin, prohíbe a Ethena GmbH ofrecer USDe y le ordena congelar sus reservas, por deficiencias graves frente a <Termino slug="mica">MiCA</Termino></td><td>La filial europea que buscaba la licencia queda paralizada</td></tr>
                <tr><td><strong>Abril de 2025</strong></td><td>Ethena GmbH retira su solicitud de autorización el día 3 y BaFin le ordena liquidar su emisión de USDe</td><td>No habrá un USDe autorizado en la UE por esa vía</td></tr>
                <tr><td><strong>Junio de 2025</strong></td><td>Plan de canje de 42 días, hasta el 6 de agosto; los usuarios alemanes ya habían pasado a Ethena BVI, en las Islas Vírgenes Británicas</td><td>El emisor de USDe queda fuera de la UE</td></tr>
                <tr><td><strong>8 de octubre de 2026</strong></td><td>ESMA, el supervisor europeo de mercados, pide que los proveedores autorizados con MiCA dejen de dar servicios con stablecoins que no cumplen MiCA a clientes de la UE</td><td>Tres meses como máximo para resolver lo que ya tengan sus clientes: hasta el 8 de enero de 2027</td></tr>
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Fuentes: comunicados de BaFin de 2025, recogidos por The Block y Ledger Insights. Dictamen de ESMA del
            8 de octubre de 2026. Términos de USDe y documentación de staking de Ethena, consultados el 14 de
            noviembre de 2026.
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Qué significa en la práctica, si vives en España. ESMA no nombra ninguna moneda: cada supervisor y
              cada plataforma deciden cuáles entran en ese grupo. Todo apunta a que USDe está dentro, porque BaFin
              lo trató como una stablecoin sujeta a MiCA y ya no hay emisor autorizado en la UE que lo respalde. Si
              es así, un exchange autorizado con MiCA no debería dejarte comprar USDe ni aumentar lo que tienes.
              Durante el periodo de salida, solo puede ayudarte a venderlo, convertirlo, retirarlo o seguir
              guardándolo. Fuera de esos exchanges, en una
              <Termino slug="wallet"> cartera</Termino> propia, puedes seguir teniéndolo. Lo haces sin las
              protecciones de MiCA y sin un emisor al que reclamar en Europa.
            </p>
            <p>
              El token ENA es otra cosa. No es una stablecoin, así que el dictamen de ESMA no le afecta: que
              puedas comprarlo depende de cada plataforma. Para saber si una plataforma está autorizada en España,
              consulta los registros de la CNMV, el supervisor español.
            </p>
            <p>
              Con Hacienda no hay atajo. Cambiar USDe por otra criptomoneda, o por euros, es una operación que se
              declara, con su ganancia o su pérdida en euros. Además, aunque valga 1 dólar, el euro también se
              mueve: puedes ganar o perder solo por el tipo de cambio. Hacienda no se ha pronunciado en concreto
              sobre sUSDe, así que guarda cada depósito y cada retirada con su fecha y su valor en euros. El
              método está en la guía de
              <Link href="/guias/fiscalidad-cripto-espana"> fiscalidad de las criptomonedas en España</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* ── 8 ── */}
      <section id="riesgos" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que puede salir mal</div>
          <h2 className="gbc-title">¿Es seguro USDe? Los riesgos de Ethena, sin maquillaje</h2>
          <div className="gbc-body">
            <ul>
              <li><strong>Funding negativo prolongado.</strong> Si dura meses, el fondo de reserva, de unos 62 millones, se agota. Después, la pérdida la soporta el respaldo.</li>
              <li><strong>Riesgo de contraparte.</strong> La cobertura vive en exchanges como Binance, OKX o Bybit. Si uno quiebra o congela cuentas, la posición corta puede perderse, aunque el ETH esté con un custodio. Es el <Termino slug="riesgo-de-contraparte">riesgo de contraparte</Termino>, y Ethena lo reparte, no lo elimina.</li>
              <li><strong>Custodia.</strong> El colateral está con custodios externos. Ethena confía en ellos, y tú confías en Ethena.</li>
              <li><strong>Las stablecoins que guarda.</strong> Con casi el 80 % del respaldo en efectivo líquido, un problema en esas stablecoins es ya un problema de USDe.</li>
              <li><strong>Depeg en un mercado concreto.</strong> Octubre de 2025 lo demostró: el precio puede hundirse en un exchange durante minutos, y como garantía de una operación apalancada eso basta para perderlo todo.</li>
              <li><strong>Canje solo para unos pocos.</strong> Tú no puedes canjear USDe directamente: dependes de que otros lo compren a 1 dólar.</li>
              <li><strong>Regulación.</strong> Sin un emisor autorizado en la UE, lo previsible es que las vías reguladas para comprarlo aquí sigan cerrándose.</li>
              <li><strong>El token ENA.</strong> Ha perdido un 92 % desde su máximo, y el fee switch puede no activarse nunca si USDe no vuelve a crecer.</li>
              <li><strong><Termino slug="smart-contract">Contratos inteligentes</Termino>.</strong> Un fallo en el código de USDe o sUSDe afectaría a todo lo depositado.</li>
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
          <h2 className="gbc-title">Comprueba lo que sabes de Ethena</h2>
          <div className="gbc-body" style={{ marginBottom: 32 }}>
            <p>
              Cinco preguntas. Con las cinco acertadas desbloqueas el logro{" "}
              <strong style={{ color: "var(--gold)" }}>Delta Cero</strong>. Si quieres ir más allá de Ethena, el
              curso <Link href="/cursos/defi-y-stablecoins">DeFi y stablecoins</Link> compara cómo se sostienen
              las distintas monedas estables.
            </p>
          </div>
          {d.isRegistered ? <GuideEthenaQuiz /> : <GuideQuizCuenta slug={SLUG} />}
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
