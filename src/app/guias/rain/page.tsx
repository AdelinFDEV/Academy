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
import GuideRainProporciones from "./GuideRainProporciones";
import GuideRainQuiz from "./GuideRainQuiz";
import "./rain.css";

/**
 * Guía «Qué es Rain crypto» (14-11-2026). Consulta objetivo: «qué es rain crypto».
 *
 * «Rain» a secas es ambiguo: en Google se mezcla con un exchange de Baréin y
 * con una empresa de tarjetas que sufrió un robo en agosto de 2026. La guía lo
 * aclara primero.
 *
 * Auditada el 14-11-2026 (AUDITORIA-SEO.md). Comprobado en cadena (Arbiscan):
 * el token es un proxy ERC-1967; su lógica se cambió el 04-11-2025 y la versión
 * vigente (0x4771…3f0b) bloquea nuevas actualizaciones («UUPS upgrades
 * disabled») y emite a la tesorería el 10 % de lo quemado. Si eso cambia, hay
 * que reescribir el riesgo «El contrato». Lo que tiene y no tienen los primeros resultados (todos son
 * academias de exchanges que venden el token): las cifras de Rain puestas una
 * frente a otra con un medidor propio, las contradicciones entre su libro
 * blanco, su auditoría y su contrato en cadena, la retirada de Kraken, y la
 * situación en España (DGOJ, ESMA, Hacienda).
 *
 * Al revisarla: precio, oferta, TVL y volumen (CoinGecko, DefiLlama); el
 * calendario de liberaciones; la participación de Enlivex y su opción; si la
 * DGOJ ha resuelto los expedientes de Polymarket y Kalshi; y los eventos
 * «Upgraded» del contrato en Arbiscan.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/guias/rain" },
  title: "Qué es Rain crypto (RAIN) y qué riesgos tiene",
  description:
    "Qué es Rain crypto (RAIN): el protocolo de mercados de predicción en Arbitrum, quién está detrás, sus cifras reales y si puedes usarlo legalmente desde España.",
  openGraph: {
    title: "Qué es Rain crypto (RAIN): mercados de predicción, cifras y riesgos",
    description:
      "Cómo funciona Rain, para qué sirve el token RAIN, por qué vale 400 veces lo depositado en el protocolo y qué dicen la DGOJ y Hacienda. Con medidor y quiz.",
    type: "article",
  },
};

const SLUG = "rain";

const SECCIONES = [
  { id: "que-es", label: "Qué es" },
  { id: "cual-rain", label: "¿Qué Rain?" },
  { id: "como-funciona", label: "Cómo funciona" },
  { id: "token", label: "El token RAIN" },
  { id: "cifras", label: "Las cifras" },
  { id: "cronologia", label: "Cronología" },
  { id: "espana", label: "En España" },
  { id: "riesgos", label: "Riesgos" },
  { id: "quiz", label: "Quiz" },
];

const COMISIONES: { id: string; quien: React.ReactNode; pct: string; ejemplo: string }[] = [
  { id: "creador", quien: "Quien crea el mercado", pct: "1,2 %", ejemplo: "1.200 $" },
  { id: "liquidez", quien: <>Quien aporta la <Termino slug="liquidez">liquidez</Termino></>, pct: "1,2 %", ejemplo: "1.200 $" },
  { id: "resolutor", quien: "Quien resuelve el resultado", pct: "0,1 %", ejemplo: "100 $" },
  { id: "quema", quien: <>Recompra y <Termino slug="quema-de-tokens">quema</Termino> de RAIN</>, pct: "2,5 %", ejemplo: "2.500 $" },
];

const REPARTO = [
  { parte: "Fondo de marketing y desarrollo", pct: 20 },
  { parte: "Reserva y tesorería", pct: 20 },
  { parte: "Crecimiento del ecosistema y staking", pct: 15 },
  { parte: "Plataformas de lanzamiento, exchanges y liquidez", pct: 15 },
  { parte: "Equipo", pct: 10 },
  { parte: "Colaboradores, asesores y socios", pct: 10 },
  { parte: "Venta estratégica", pct: 9 },
  { parte: "Preventa", pct: 1 },
];

const CRONOLOGIA = [
  { cuando: "Marzo de 2025", que: "Empieza la venta del token en Gems Launchpad, una plataforma de lanzamiento" },
  { cuando: "Julio de 2025", que: "Se registra en Panamá la Rain Foundation, emisora del token" },
  { cuando: "Agosto de 2025", que: "Hacken entrega su auditoría del token y el contrato se despliega en Arbitrum el día 26" },
  { cuando: "Septiembre de 2025", que: "Sale la versión alfa del protocolo. El día 14 el token marca su mínimo: 0,002221 $" },
  { cuando: "Noviembre de 2025", que: "El día 4 se sustituye la lógica del contrato del token. Enlivex, una biotecnológica del Nasdaq, anuncia 212 millones para comprar RAIN" },
  { cuando: "Enero y febrero de 2026", que: "KuCoin lo lista el 6 de enero y Kraken el 9 de febrero" },
  { cuando: "Febrero y marzo de 2026", que: "La fundación notifica su libro blanco conforme a MiCA el 24 de febrero y lo publica el 26 de marzo" },
  { cuando: "Mayo y junio de 2026", que: "Compromiso de liquidez de 100 millones el 26 de mayo. Kraken retira RAIN el 17 de junio, dentro de su revisión periódica de activos" },
  { cuando: "Julio y agosto de 2026", que: "Primera votación de los titulares, el 29 de julio; el 25 de agosto se queman 7.419 millones de RAIN y el precio marca su máximo: 0,01946 $" },
  { cuando: "Septiembre a noviembre de 2026", que: "Caída continuada: 0,0114 $ el 4 de octubre, 0,0063 $ el 1 de noviembre" },
  { cuando: "14 de noviembre de 2026", que: "0,003692 $: un 81 % por debajo del máximo de agosto" },
];

export default async function RainPage() {
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
          Qué es Rain crypto (RAIN)<br />
          <span className="gbc-hero-gold">y qué riesgos tiene</span>
        </h1>
        <p className="gbc-respuesta">
          <strong>Rain es un protocolo para crear <Termino slug="mercado-de-prediccion">mercados de predicción</Termino> y
          apostar en ellos, y RAIN es su token.</strong> Funciona en Arbitrum, una red construida sobre Ethereum, y lo emite una fundación
          registrada en Panamá en 2025. A 14 de noviembre de 2026, el token capitaliza unos 2.640 millones de dólares:
          unas 400 veces lo depositado en el protocolo. Y cotiza un 81 % por debajo de su máximo de agosto.
        </p>
        <p className="gbc-revisado">Revisada el <strong>14 de noviembre de 2026</strong> · Datos de mercado: CoinGecko y DefiLlama</p>
        <div className="gbc-hero-pills">
          <span className="gbc-pill">Medidor de proporciones</span>
          <span className="gbc-pill">Qué dice la DGOJ</span>
          <span className="gbc-pill">Quiz con logro</span>
        </div>
      </header>

      {/* ── 1 ── */}
      <section id="que-es" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo básico</div>
          <h2 className="gbc-title">Qué es Rain crypto, en pocas palabras</h2>
          <div className="gbc-body">
            <p>
              Un mercado de predicción es una apuesta con precio. Alguien
              plantea una pregunta con respuesta futura («¿ganará tal equipo la final?») y la gente compra el «sí» o el
              «no». Quien acierta cobra; quien falla pierde lo apostado. El precio de cada respuesta refleja qué
              probabilidad le da el mercado.
            </p>
            <p>
              Rain es la infraestructura para montar esos mercados sin pedir permiso a nadie. Cualquiera puede crear
              uno, sobre cualquier tema y en cualquier idioma, y otros pueden apostar en él. Todo se ejecuta con
              <Termino slug="smart-contract"> contratos inteligentes</Termino> en Arbitrum, una
              <Termino slug="capa-2"> capa 2</Termino> de <Link href="/guias/ethereum">Ethereum</Link> donde las
              operaciones cuestan céntimos. Se apuesta sobre todo con
              <Termino slug="stablecoin"> stablecoins</Termino> como USDT.
            </p>
            <p>
              El token RAIN es otra cosa. No hace falta tenerlo para apostar, según el propio libro blanco del
              proyecto, el documento oficial que lo describe. Se presenta como un <Termino slug="token-de-gobernanza">token de gobernanza</Termino>: servirá
              para votar las decisiones del protocolo. Y una parte de las comisiones se usa para comprarlo en el
              mercado y destruirlo.
            </p>
            <p>
              Detrás está la Rain Foundation, inscrita en Panamá el 14 de julio de 2025. El libro blanco nombra a
              las tres personas de su órgano de dirección, todas con domicilio en Panamá. Al equipo del producto lo
              nombra la ficha de riesgos de Kraken del 14 de enero de 2026. Lo encabezan Roy Shaham, consejero
              delegado; Eyal Milstein, director de operaciones, y Muhammad Wasif, director técnico.
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <tbody>
                <tr><td><strong>Qué es</strong></td><td>Protocolo de mercados de predicción y opciones sobre eventos</td></tr>
                <tr><td><strong>Token</strong></td><td>RAIN, estándar <Termino slug="erc-20">ERC-20</Termino></td></tr>
                <tr><td><strong>Red</strong></td><td>Arbitrum (capa 2 de Ethereum)</td></tr>
                <tr><td><strong>Emisor</strong></td><td>Rain Foundation, Panamá (registrada el 14-07-2025)</td></tr>
                <tr><td><strong>Oferta máxima</strong></td><td>1,15 billones de RAIN (1.150.000 millones)</td></tr>
                <tr><td><strong>Contrato oficial</strong></td><td className="rain-mono">0x25118290e6A5f4139381D072181157035864099d</td></tr>
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Fuentes: libro blanco de RAIN, versión 2.0 (marzo de 2026), redactado conforme al Reglamento (UE)
            2023/1114 (MiCA); ficha de riesgos de RAIN de Kraken (14-01-2026).
          </p>
        </div>
      </section>

      {/* ── 2 ── */}
      <section id="cual-rain" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Antes de seguir</div>
          <h2 className="gbc-title">¿Qué Rain? Tres empresas con el mismo nombre</h2>
          <div className="gbc-body">
            <p>
              Si buscas «Rain crypto», Google te mezcla al menos tres cosas distintas. Confundirlas tiene
              consecuencias: puedes leer una mala noticia que no va contigo, o comprar el token equivocado.
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Nombre</th><th>Qué es</th><th>¿Tiene que ver con el token RAIN?</th></tr></thead>
              <tbody>
                <tr><td><strong>Rain Protocol</strong></td><td>El protocolo de mercados de predicción de esta guía, en Arbitrum</td><td><strong>Sí</strong>: su token es RAIN</td></tr>
                <tr><td><strong>Rain (exchange)</strong></td><td>Un <Termino slug="exchange">exchange</Termino> con sede en Baréin, que opera en Oriente Medio</td><td>No. No tiene relación con este token</td></tr>
                <tr><td><strong>Rain (tarjetas)</strong></td><td>Una empresa que da servicio a tarjetas de pago con stablecoins</td><td>No. En agosto de 2026 le robaron 1,1 millones de dólares de un contrato antiguo en Solana</td></tr>
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Robo de agosto de 2026: análisis de la empresa de seguridad Blockaid. Fue contra un contrato antiguo de la
            empresa de tarjetas y afectó a usuarios de Avici y Tria. No tocó el protocolo de Arbitrum ni el token RAIN.
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Ese robo es el ejemplo perfecto. Varios medios lo titularon «exploit de Rain», y quien leyera solo el
              titular podía pensar que había caído el protocolo de esta guía. No fue así: la víctima fue la otra
              empresa con el mismo nombre.
            </p>
            <p>
              Con el símbolo pasa lo mismo: hay otros tokens que también se abrevian RAIN en otras redes. El único
              de este proyecto es el contrato de Arbitrum que termina en <span className="rain-mono">…099d</span>.
              Antes de comprar en un exchange o en una
              <Termino slug="dex"> DEX</Termino>, compara la dirección completa con la de la tabla anterior.
            </p>
          </div>
        </div>
      </section>

      {/* ── 3 ── */}
      <section id="como-funciona" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Cómo funciona</div>
          <h2 className="gbc-title">Cómo funciona un mercado de predicción en Rain</h2>
          <div className="gbc-body">
            <p>
              Cada respuesta posible tiene sus propias acciones. Una acción paga 1 dólar si su respuesta resulta
              cierta y 0 si no. Por eso su precio, entre 0 y 1, se lee como una probabilidad.
            </p>
            <p>
              Un ejemplo con números. Un mercado pregunta si una moneda superará cierto precio antes de fin de año.
              El «sí» cotiza a 0,30 dólares. Con 300 dólares compras unas 1.000 acciones del «sí». Si acaba
              ocurriendo, cobras cerca de 1.000 dólares. Si no, pierdes los 300.
            </p>
            <p>
              Los precios los fija un <Termino slug="amm">creador de mercado automático</Termino>, como en{" "}
              <Link href="/guias/uniswap">Uniswap</Link>. Según el libro blanco, el precio de cada respuesta sale
              de la proporción de dinero que hay puesta en ella. Cuanto más se apuesta al «sí», más caro se vuelve.
              La documentación técnica añade un <Termino slug="libro-de-ordenes">libro de órdenes</Termino>: lo que encuentra contrapartida ahí se cruza
              primero, y el resto pasa al creador de mercado.
            </p>
          </div>

          <div className="gbc-box gbc-box--gold">
            <div className="gbc-box-title">Quién decide qué ha pasado</div>
            <div className="gbc-box-body">
              <p>
                Es la pieza delicada de cualquier mercado de predicción. En Rain, el resultado lo declara quien creó
                el mercado o, en los mercados públicos, un <Termino slug="oraculo">oráculo</Termino> de inteligencia
                artificial llamado Delphi, de la empresa Olympus AI.
              </p>
              <p>
                Si no estás de acuerdo, puedes abrir una disputa, pero el plazo es corto: la documentación técnica
                habla de una hora. Tienes que depositar una garantía: el 0,1 % del dinero del mercado, con un máximo
                de 1.000 dólares. Primero vuelve a decidir una inteligencia artificial. Si se recurre, votan
                oráculos humanos y su decisión es definitiva. Si no llevabas razón, pierdes la garantía.
              </p>
            </div>
          </div>

          <div className="gbc-body" style={{ marginTop: 26 }}>
            <p>
              Cada mercado resuelto paga en comisiones un 5 % de su volumen, repartido así. En un mercado que haya
              movido 100.000 dólares:
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Para quién</th><th>Parte del volumen</th><th>En 100.000 $</th></tr></thead>
              <tbody>
                {COMISIONES.map((c) => (
                  <tr key={c.id}><td>{c.quien}</td><td>{c.pct}</td><td>{c.ejemplo}</td></tr>
                ))}
                <tr><td><strong>Total</strong></td><td><strong>5 %</strong></td><td><strong>5.000 $</strong></td></tr>
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Reparto por defecto según la documentación técnica del protocolo (arquitectura de contratos),
            consultada el 14-11-2026. Si el mercado lo resuelve el oráculo, se suma una tarifa fija configurable.
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Un 5 % es mucho para un apostante frecuente. Si reinviertes el mismo dinero en cinco mercados seguidos,
              las comisiones se llevan cerca del 23 % de lo que pusiste al principio. Es el precio de que los creadores y quienes aportan liquidez tengan un incentivo para hacerlo.
            </p>
          </div>
        </div>
      </section>

      {/* ── Anuncio de media guía ── */}
      <GuiaAnuncio producto="portfolio" variante="compacto" estado={d.estado} />

      {/* ── 4 ── */}
      <section id="token" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">El token</div>
          <h2 className="gbc-title">Para qué sirve el token RAIN, y para qué no</h2>
          <div className="gbc-body">
            <p>
              Aquí conviene leer despacio, porque los documentos del proyecto no dicen lo mismo. Hay cuatro piezas.
            </p>
            <p>
              <strong>Gobernanza.</strong> RAIN servirá para votar las decisiones del protocolo a través de una
              <Termino slug="dao"> DAO</Termino>. El libro blanco de marzo de 2026 decía que esa DAO aún no estaba
              activa y que, hasta entonces, la fundación controla los parámetros y las mejoras con una cartera
              <Termino slug="multifirma"> multifirma</Termino>. La primera votación de los titulares se celebró el
              29 de julio de 2026, y en ella se abstuvieron la fundación y el equipo.
            </p>
            <p>
              <strong>Ningún derecho económico.</strong> El mismo libro blanco es tajante: RAIN no da propiedad, ni
              beneficios, ni derecho a reembolso. Tampoco es necesario para apostar, depositar o crear mercados.
            </p>
            <p>
              <strong>El «Trading Power».</strong> La web del proyecto, y también la ficha de riesgos de Kraken,
              lo cuentan al revés: tener RAIN daría acceso a funciones de trading a través de un «Trading Power».
              Ante la duda, manda el libro blanco: es el documento que la fundación declara veraz ante la UE.
            </p>
            <p>
              <strong>Recompra y quema.</strong> El 2,5 % del volumen de cada mercado se usa para comprar RAIN y
              destruirlo, lo que se llama quema de tokens. Pero el libro blanco advierte
              que es discrecional, que puede suspenderse y que no garantiza el precio. Además, el 10 % de lo
              quemado se vuelve a crear para la tesorería del proyecto: lo dice el informe de transparencia de
              Blockworks y lo hace el código del contrato.
            </p>
          </div>

          <h3 className="rain-sub">Cómo se repartieron los 1,15 billones de RAIN</h3>
          <div className="rain-reparto">
            {REPARTO.map((r) => (
              <div key={r.parte} className="rain-reparto-fila">
                <span className="rain-reparto-nombre">{r.parte}</span>
                <span className="rain-reparto-barra" aria-hidden="true"><span style={{ width: `${(r.pct / 20) * 100}%` }} /></span>
                <span className="rain-reparto-pct">{r.pct} %</span>
              </div>
            ))}
          </div>
          <p className="gbc-fuente">
            Reparto: ficha de riesgos de Kraken (14-01-2026), que coincide con Tokenomist. Según el libro blanco, los
            calendarios de liberación van de 6 a 24 meses según la partida.
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Suma lo que gestiona el proyecto o reparte a su criterio: marketing y desarrollo, reserva, ecosistema,
              liquidez y equipo llegan al 80 %. Las ventas a inversores suman el 10 %. El token se repartió primero
              en Gems Launchpad, en una <Termino slug="ido">venta pública inicial (IDO)</Termino>. Esas
              <Termino slug="tokenomics"> tokenomics</Termino> no son raras en proyectos jóvenes, pero significan que
              el precio depende mucho de cuándo y cómo se liberen los tokens del proyecto.
            </p>
          </div>
        </div>
      </section>

      {/* ── 5 ── */}
      <section id="cifras" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">El dato propio</div>
          <h2 className="gbc-title">Las cifras de Rain, puestas una al lado de otra</h2>
          <div className="gbc-body">
            <p>
              Cada cifra de Rain, por separado, suena bien. Puesto 35 por
              <Termino slug="market-cap"> capitalización</Termino>, miles de millones de dólares, cotiza en más de
              diez exchanges. El problema aparece al compararlas entre sí.
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Dato, a 14-11-2026</th><th>Valor</th><th>Fuente</th></tr></thead>
              <tbody>
                <tr><td>Precio</td><td>0,003692 $</td><td>CoinGecko</td></tr>
                <tr><td>Capitalización</td><td>2.638 millones de $</td><td>CoinGecko</td></tr>
                <tr><td>Valoración totalmente diluida (<Termino slug="fdv">FDV</Termino>)</td><td>4.218 millones de $</td><td>CoinGecko</td></tr>
                <tr><td><Termino slug="oferta-circulante">Oferta circulante</Termino></td><td>714.410 millones de RAIN</td><td>CoinGecko</td></tr>
                <tr><td>Oferta total</td><td>1.142.405 millones de RAIN</td><td>CoinGecko</td></tr>
                <tr><td><Termino slug="volumen">Volumen</Termino> de 24 horas</td><td>12,16 millones de $</td><td>CoinGecko</td></tr>
                <tr><td>Dinero depositado en el protocolo (<Termino slug="tvl">TVL</Termino>)</td><td>6,59 millones de $</td><td>DefiLlama</td></tr>
                <tr><td>TVL máximo</td><td>33,9 millones de $ (26-08-2026)</td><td>DefiLlama</td></tr>
              </tbody>
            </table>
          </div>

          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>Con esos datos salen cuatro proporciones que ninguna ficha de exchange te enseña:</p>
            <ul>
              <li>
                <strong>El token vale unas 400 veces lo depositado.</strong> 2.638 millones frente a 6,59. Casi todo el
                valor de RAIN es expectativa de que el protocolo crezca, no uso actual.
              </li>
              <li>
                <strong>Solo cambia de manos el 0,46 % al día.</strong> De cada 1.000 dólares de capitalización, se
                negocian 4,6 en una jornada. Con tan poco intercambio, el precio puede moverse mucho con poco dinero,
                hacia arriba y hacia abajo.
              </li>
              <li>
                <strong>Un 37,5 % de la oferta total aún no circula.</strong> Son unos 428.000 millones de RAIN, que
                al precio de hoy valdrían unos 1.580 millones de dólares.
              </li>
              <li>
                <strong>Absorberlos llevaría unos 130 días de volumen.</strong> Si todo eso saliera a la venta al
                precio actual, haría falta el volumen de cuatro meses enteros sin un solo comprador más.
              </li>
            </ul>
          </div>

          <GuideRainProporciones />

          <div className="gbc-body" style={{ marginTop: 26 }}>
            <p>
              El medidor viene relleno con los datos de Rain, pero sirve para cualquier token: cambia las casillas
              con los de otro y compara. La última fila es la más práctica. Te dice qué parte del volumen diario
              representa tu compra; si pasa del 1 %, ya moverías el precio al entrar y, sobre todo, al salir.
            </p>
            <p>
              Una advertencia sobre el TVL: mide lo que hay depositado en los contratos del protocolo, no lo que se
              apuesta en un día. Aun así es la mejor referencia pública del tamaño real del protocolo. Y llama la
              atención una cosa: el 26 de mayo de 2026 el proyecto anunció un compromiso de liquidez de 100 millones
              de dólares, la mitad en USDT y la otra mitad en su propio token. El TVL nunca pasó de 33,9 millones.
            </p>
            {/* EXPERIENCIA DEL ADMIN: aquí encaja una experiencia propia con un token de poca rotación (una venta que movió el precio, un deslizamiento real en una DEX de Arbitrum) o el motivo por el que RAIN entra o no en el Portfolio Adelin. No inventar: lo escribe el admin. */}
          </div>
        </div>
      </section>

      {/* ── 6 ── */}
      <section id="cronologia" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">De dónde viene</div>
          <h2 className="gbc-title">Por qué subió tanto Rain, y qué se sabe de su caída</h2>
          <div className="gbc-body">
            <p>
              Rain pasó de 0,0022 dólares en septiembre de 2025 a 0,0195 en agosto de 2026: casi nueve veces. Desde
              entonces ha perdido el 81 %. Tres hechos acompañaron la subida. La caída tiene una explicación menos
              clara.
            </p>
          </div>
          <div className="rain-crono">
            {CRONOLOGIA.map((c) => (
              <div key={c.cuando} className="rain-crono-fila">
                <span className="rain-crono-cuando">{c.cuando}</span>
                <p>{c.que}</p>
              </div>
            ))}
          </div>
          <p className="gbc-fuente">
            Fuentes: libro blanco (fechas de venta, registro y notificación), Hacken (auditoría de agosto de 2025) y
            Arbiscan (despliegue y cambio del contrato). Además, The Block (24-11-2025), avisos de KuCoin y Kraken,
            informe de transparencia de Blockworks (votación) y CoinGecko (máximo, mínimo y precios).
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              <strong>El primer empujón fue Enlivex.</strong> Una biotecnológica israelí de unos 22 millones de
              capitalización anunció en noviembre de 2025 que reuniría 212 millones para comprar RAIN, y la noticia
              más que duplicó el precio. Según sus comunicados, que recoge CoinGecko, tiene 78.820 millones de RAIN:
              el 11 % de lo que circula. Tiene además una opción para comprar a la fundación unos 272.000 millones
              más a 0,0033 dólares, que en marzo de 2026 se prorrogó hasta el 31 de diciembre de 2027.
            </p>
            <p>
              <strong>El segundo fue la moda.</strong> En 2025 y 2026 los mercados de predicción fueron uno de los
              temas del sector, con Polymarket y Kalshi en todas partes. Rain se vendió como la alternativa
              descentralizada.
            </p>
            <p>
              <strong>El tercero, la quema de agosto.</strong> Para cerrar una disputa con participantes de un
              programa de reembolsos, los titulares votaron el 29 de julio una compra de la fundación. Pagaría 23
              millones de dólares por los tokens bloqueados de ese programa, a 0,0031 cada uno, para destruirlos. Se quemaron
              7.419 millones de RAIN el 25 de agosto, y el precio marcó su máximo ese mismo día.
            </p>
            <p>
              <strong>La caída no coincidió con una gran liberación.</strong> Fue gradual, de septiembre a noviembre,
              y la oferta circulante que publica CoinGecko apenas cambió: de 709.000 a 714.000 millones de RAIN. No
              hemos encontrado una explicación pública del proyecto. Lo que sí pesa es lo que queda por llegar.
              Tokenomist calcula que se ha desbloqueado el 68,3 % de la oferta máxima, unos 786.000 millones, y que
              el calendario se extiende hasta 2027. La diferencia con CoinGecko, unos 72.000 millones, son tokens ya
              desbloqueados que no figuran como circulantes. Es el riesgo típico de la
              <Termino slug="liberacion-de-tokens"> liberación de tokens</Termino>: más oferta disponible sin que
              crezca la demanda.
            </p>
          </div>
        </div>
      </section>

      {/* ── 7 ── */}
      <section id="espana" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Desde España</div>
          <h2 className="gbc-title">¿Es legal usar Rain desde España?</h2>
          <div className="gbc-body">
            <p>
              Depende de qué hagas, porque comprar el token y apostar en sus mercados son dos cosas distintas ante la
              ley.
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Qué haces</th><th>Qué es para la ley</th><th>Qué supone</th></tr></thead>
              <tbody>
                <tr><td><strong>Comprar y guardar RAIN</strong></td><td>Un criptoactivo, regulado por <Termino slug="mica">MiCA</Termino></td><td>Legal. Tributa como cualquier criptomoneda</td></tr>
                <tr><td><strong>Apostar en mercados de Rain</strong></td><td>Juego, según el criterio general de la DGOJ</td><td>Operarlo en España exige licencia de juego, y Rain no anuncia ninguna</td></tr>
                <tr><td><strong>Apostar sobre precios o índices</strong></td><td>Puede ser un derivado financiero, según ESMA</td><td>Si lo es, cuentan las reglas de las opciones binarias, que no se pueden vender a particulares</td></tr>
              </tbody>
            </table>
          </div>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              <strong>El token.</strong> La Rain Foundation notificó el 24 de febrero de 2026 un libro blanco conforme a MiCA,
              el reglamento europeo de criptoactivos. Ojo con lo que eso significa: el propio documento avisa de que
              ninguna autoridad europea lo ha aprobado. Es una obligación de información, no un sello de calidad. El
              emisor está en Panamá, fuera de la supervisión europea, y cualquier reclamación iría a sus tribunales.
            </p>
            <p>
              <strong>Los mercados.</strong> El 26 de mayo de 2026, el Ministerio de Consumo anunció que la Dirección
              General de Ordenación del Juego (DGOJ) había abierto expediente sancionador a Polymarket y Kalshi por
              operar sin autorización. También ordenó bloquear sus webs en España mientras se resuelve. Su criterio:
              los mercados de predicción son juego cuando se apuesta sobre resultados futuros inciertos, y operarlos
              aquí exige una licencia específica.
            </p>
            <p>
              Conviene leerlo con precisión. La nota no menciona a Rain, y el expediente es contra los operadores, no
              contra quien apuesta. Lo que sí deja claro es que una plataforma sin licencia española no está
              autorizada aquí y no ofrece las protecciones del juego regulado, como la verificación de identidad o
              el control de las personas autoexcluidas.
            </p>
            <p>
              <strong>Las apuestas sobre precios.</strong> El 3 de julio de 2026, la Autoridad Europea de Valores y
              Mercados (ESMA) publicó una declaración. Cuando un contrato sobre un evento es un instrumento
              financiero, y eso depende de la pregunta, es un derivado: un producto cuyo valor sale de otra cosa.
              Entonces le aplican las restricciones nacionales a las opciones binarias, contratos que pagan una
              cantidad fija o nada, y que no se pueden vender a particulares. Da igual que se llame «mercado de
              predicción».
            </p>
          </div>
          <div className="gbc-box gbc-box--gold">
            <div className="gbc-box-title">Y Hacienda, por dos caminos</div>
            <div className="gbc-box-body">
              <p>
                Si compras RAIN y lo vendes con ganancia, tributa en la base del ahorro, del 19 % al 30 %, igual que
                cualquier criptomoneda. Si ganas apostando en sus mercados, lo que cobras no viene de vender nada: es
                una ganancia que va a la base general, con tu tipo marginal. Y las pérdidas de juego solo restan
                hasta el importe de lo ganado en el juego ese mismo año. El detalle de cómo se calcula cada caso
                está en la guía de <Link href="/guias/fiscalidad-cripto-espana">fiscalidad de las criptomonedas en
                España</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8 ── */}
      <section id="riesgos" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que puede salir mal</div>
          <h2 className="gbc-title">Los riesgos de Rain, sin maquillaje</h2>
          <div className="gbc-body">
            <p>
              Rain es un proyecto de menos de dos años que subió muy rápido. Nada de lo que sigue prueba mala fe,
              pero reúne varias de las señales que conviene mirar dos veces.
            </p>
            <ul>
              <li>
                <strong>Concentración.</strong> Enlivex tiene el 11 % de lo que circula y una opción sobre casi una
                cuarta parte de la oferta máxima. El emisor se reserva 157.000 millones de RAIN. Una venta grande de cualquiera de
                los dos movería el precio. Es la definición de una
                <Termino slug="whale"> ballena</Termino>.
              </li>
              <li>
                <strong>Liberaciones pendientes.</strong> Queda un 37,5 % de la oferta total por circular, con un
                calendario que llega a 2027 y que no se publica completo. Revisa el
                <Termino slug="vesting"> vesting</Termino> antes de cada compra.
              </li>
              <li>
                <strong>Liquidez real escasa.</strong> Kraken retiró el token en junio de 2026 y liquidó en septiembre
                los saldos que nadie retiró, avisando de que podían venderse muy por debajo de los precios de
                referencia recientes.
                Con una rotación del 0,46 % diario, salir con una cantidad grande puede costar caro.
              </li>
              <li>
                <strong>El contrato ya cambió una vez.</strong> El libro blanco dice que el contrato del token no es
                actualizable. Hoy es así, con un matiz que no cuenta. En Arbiscan, el token es un
                <Termino slug="contrato-actualizable"> contrato actualizable</Termino> y su lógica se sustituyó el 4
                de noviembre de 2025. La versión vigente bloquea cualquier cambio posterior. La de antes, la que
                auditó Hacken en agosto de 2025, daba a un propietario único poder para actualizarlo, cambiar el
                oráculo de precios y crear cada día 50.000 dólares en tokens nuevos para la tesorería. Ese
                propietario sigue pudiendo crear tokens: cada día, el 10 % de lo quemado desde la última vez.
              </li>
              <li>
                <strong>Auditorías por partes.</strong> La primera
                <Termino slug="auditoria-de-seguridad"> auditoría</Termino> de Hacken cubría solo el token. La del
                protocolo de apuestas llegó después: el libro blanco la daba por «en curso» en marzo de 2026, y Hacken
                publicó en junio la de su versión 2. Una auditoría reduce el riesgo, no lo elimina. Un fallo en esos
                contratos sería un <Termino slug="exploit">exploit</Termino> sobre el dinero de los apostantes.
              </li>
              <li>
                <strong>Un oráculo de IA.</strong> Si Delphi se equivoca y nadie disputa a tiempo, el resultado
                erróneo es definitivo. Y disputar exige poner dinero dentro de un plazo muy corto.
              </li>
              <li>
                <strong>Regulación.</strong> En España, sus mercados chocan con el criterio de la DGOJ. En Europa,
                ESMA recuerda que muchos contratos sobre eventos son derivados. Un bloqueo o una retirada de exchanges reduciría aún más la liquidez.
              </li>
              <li>
                <strong>Documentos que no casan.</strong> Libro blanco, web, ficha de Kraken y contrato no cuentan
                lo mismo sobre la utilidad del token ni sobre su historia de cambios. En un token que capitaliza
                miles de millones, eso obliga a comprobar cada dato en la fuente.
              </li>
              <li>
                <strong>El precio.</strong> Ha subido casi nueve veces y caído un 81 % en catorce meses. Esa
                <Termino slug="volatilidad"> volatilidad</Termino> es la norma, no la excepción.
              </li>
            </ul>
          </div>
          <DisclaimerRiesgo variante="general" />
        </div>
      </section>

      {/* ── Anuncio final ── */}
      <GuiaAnuncio producto="premium" estado={d.estado} />

      {/* ── QUIZ ── */}
      <section id="quiz" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Quiz final</div>
          <h2 className="gbc-title">Comprueba lo que sabes de Rain</h2>
          <div className="gbc-body" style={{ marginBottom: 32 }}>
            <p>Cinco preguntas. Con las cinco acertadas desbloqueas el logro <strong style={{ color: "var(--gold)" }}>Paraguas Abierto</strong>.</p>
          </div>
          {d.isRegistered ? <GuideRainQuiz /> : <GuideQuizCuenta slug={SLUG} />}
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
