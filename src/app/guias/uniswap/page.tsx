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
import GuideUniswapLiquidez from "./GuideUniswapLiquidez";
import GuideUniswapQuiz from "./GuideUniswapQuiz";
import "./uniswap.css";

/**
 * Guía «Qué es Uniswap» (14-11-2026). Consulta objetivo: «qué es uniswap».
 *
 * Lo que tiene y las demás no: la fórmula x · y = k con un fondo de ejemplo y
 * tres compras calculadas, una calculadora de pérdida impermanente con las
 * comisiones dentro, el estado real del «fee switch» con fechas y lo que
 * supone en España cambiar un token por otro o aportar liquidez.
 *
 * Al revisarla: las cifras de DefiLlama (volumen, fondos, Unichain), el
 * despliegue del fee switch por redes y versiones, el UNI en circulación y
 * cualquier consulta nueva de la DGT sobre DeFi.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/guias/uniswap" },
  title: "Qué es Uniswap (UNI) y cómo funciona por dentro",
  description:
    "Qué es Uniswap y cómo fija el precio: la fórmula x·y=k con números, una calculadora de pérdida impermanente, el token UNI y su quema, y lo que dice Hacienda.",
  openGraph: {
    title: "Qué es Uniswap (UNI): la fórmula, la liquidez y el token, con números",
    description:
      "Cómo cambia Uniswap un token por otro sin libro de órdenes, cuánto cuesta aportar liquidez, qué hace el fee switch con UNI y cómo se declara en España. Con calculadora y quiz.",
    type: "article",
  },
};

const SLUG = "uniswap";

const SECCIONES = [
  { id: "que-es", label: "Qué es" },
  { id: "formula", label: "La fórmula" },
  { id: "intercambio", label: "Cómo se usa" },
  { id: "liquidez", label: "Aportar liquidez" },
  { id: "versiones", label: "v1 a v4 y Unichain" },
  { id: "token", label: "El token UNI" },
  { id: "hacienda", label: "Hacienda" },
  { id: "riesgos", label: "Riesgos" },
  { id: "quiz", label: "Quiz" },
];

/** Fondo de ejemplo: 100 ETH y 300.000 USDC, k = 30.000.000. Sin la comisión del 0,3 %. */
const COMPRAS = [
  { pagas: "3.000 USDC", recibes: "0,990 ETH", medio: "3.030 USDC", peor: "1 %", despues: "3.060 USDC" },
  { pagas: "30.000 USDC", recibes: "9,091 ETH", medio: "3.300 USDC", peor: "10 %", despues: "3.630 USDC" },
  { pagas: "150.000 USDC", recibes: "33,333 ETH", medio: "4.500 USDC", peor: "50 %", despues: "6.750 USDC" },
];

/** 2√r / (1 + r) − 1, redondeado. r = precio final / precio inicial. */
const PERDIDAS = [
  { cambio: "Baja a la cuarta parte (−75 %)", perdida: "−20,0 %" },
  { cambio: "Baja a la mitad (−50 %)", perdida: "−5,7 %" },
  { cambio: "Sube un 25 %", perdida: "−0,6 %" },
  { cambio: "Sube un 50 %", perdida: "−2,0 %" },
  { cambio: "Se duplica (+100 %)", perdida: "−5,7 %" },
  { cambio: "Se triplica (+200 %)", perdida: "−13,4 %" },
  { cambio: "Se multiplica por cinco (+400 %)", perdida: "−25,5 %" },
];

export default async function UniswapPage() {
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
          Qué es Uniswap (UNI)<br />
          <span className="gbc-hero-gold">y cómo funciona por dentro</span>
        </h1>
        <p className="gbc-respuesta">
          <strong>Uniswap es el mayor <Termino slug="dex">exchange descentralizado</Termino>: un conjunto de{" "}
          <Termino slug="smart-contract">contratos</Termino> en Ethereum y otras redes que cambia un token por otro desde tu propia cartera, sin registro
          ni intermediario.</strong> El precio no sale de un <Termino slug="libro-de-ordenes">libro de órdenes</Termino>, sino de una fórmula aplicada a
          fondos que aportan otros usuarios, que cobran una comisión por cada cambio. UNI es su{" "}
          <Termino slug="token-de-gobernanza">token de gobernanza</Termino>: sirve para votar y, desde diciembre
          de 2025, parte de las comisiones se usa para <Termino slug="quema-de-tokens">quemarlo</Termino>.
        </p>
        <p className="gbc-revisado">Revisada el <strong>14 de noviembre de 2026</strong> · Datos de DefiLlama y de la gobernanza de Uniswap</p>
        <div className="gbc-hero-pills">
          <span className="gbc-pill">La fórmula x · y = k, con números</span>
          <span className="gbc-pill">Calculadora de pérdida impermanente</span>
          <span className="gbc-pill">Quiz con logro</span>
        </div>
      </header>

      {/* ── 1 ── */}
      <section id="que-es" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo básico</div>
          <h2 className="gbc-title">Qué es Uniswap y para qué sirve</h2>
          <div className="gbc-body">
            <p>
              Uniswap sirve para una cosa: cambiar un token por otro. Conectas tu{" "}
              <Termino slug="wallet">cartera</Termino>, eliges qué das y qué quieres, y un contrato inteligente hace el cambio en una sola operación.
              No hay cuenta que abrir, ni DNI que enviar, ni nadie que custodie tu dinero entre medias.
            </p>
            <p>
              Conviene separar tres cosas que comparten nombre. El <strong>protocolo Uniswap</strong> son los
              contratos: están publicados en la cadena y cualquiera puede usarlos, también desde otras webs.{" "}
              <strong>Uniswap Labs</strong> es la empresa de Nueva York, fundada por Hayden Adams, que los escribió
              y que hace la web y la cartera más conocidas. Y <strong>UNI</strong> es el token con el que se vota
              qué cambia en el protocolo.
            </p>
            <p>
              Es grande. Según DefiLlama, a 14 de noviembre de 2026 pasaron por Uniswap unos 63.000 millones de
              dólares en los últimos 30 días, y más de 4 billones desde que nació en 2018. Los fondos que lo hacen
              funcionar, su <Termino slug="tvl">valor total bloqueado</Termino>, suman unos 3.200 millones de
              dólares, repartidos entre Ethereum y más de cuarenta redes.
            </p>
            <p>
              Su diferencia con un <Termino slug="exchange">exchange</Termino> como los que conoces está en cómo
              se fija el precio. Un exchange centralizado, y también algunos descentralizados como{" "}
              <Link href="/guias/hyperliquid">Hyperliquid</Link>, casan órdenes de compra y de venta en un{" "}
              libro de órdenes. Uniswap no tiene libro: tiene fondos y
              una fórmula.
            </p>
          </div>
        </div>
      </section>

      {/* ── 2 ── */}
      <section id="formula" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Cómo funciona</div>
          <h2 className="gbc-title">Cómo funciona Uniswap: un fondo y la fórmula x · y = k</h2>
          <div className="gbc-body">
            <p>
              Uniswap es un <Termino slug="amm">creador de mercado automático</Termino>. Cada par de tokens tiene
              su <Termino slug="liquidity-pool">fondo de liquidez</Termino>: un contrato con dos montones, por
              ejemplo ETH y USDC, una <Termino slug="stablecoin">stablecoin</Termino> que sigue al dólar. Quien
              compra ETH deja USDC en el fondo y se lleva ETH. Quien vende hace lo contrario.
            </p>
            <p>
              La regla que decide cuánto te llevas cabe en una línea. Si x es la cantidad de un token e y la del
              otro, su producto tiene que valer lo mismo antes y después de cada cambio: <strong>x · y = k</strong>.
              El precio es la proporción entre los dos montones.
            </p>
            <p>
              Con números se ve mejor. Imagina un fondo con <strong>100 ETH y 300.000 USDC</strong>. Su k es
              30.000.000, y el precio es 300.000 / 100 = 3.000 USDC por ETH. Ahora llegan tres compradores
              distintos:
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Pagas</th><th>Recibes</th><th>Precio medio</th><th>Peor que 3.000</th><th>Precio del fondo después</th></tr></thead>
              <tbody>
                {COMPRAS.map((c) => (
                  <tr key={c.pagas}><td><strong>{c.pagas}</strong></td><td>{c.recibes}</td><td>{c.medio}</td><td>{c.peor}</td><td>{c.despues}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Cálculo propio con la fórmula de Uniswap v2 y un fondo de ejemplo, sin la comisión del 0,3 %. Primera
            fila: 30.000.000 / 303.000 = 99,01 ETH quedan en el fondo, así que te llevas 0,99.
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              <strong>Tu propia compra mueve el precio.</strong> Con el 1 % del fondo pagas un 1 % de más; con la
              mitad, un 50 %. Eso es el <Termino slug="impacto-en-el-precio">impacto en el precio</Termino>, y
              explica por qué comprar en un fondo pequeño sale caro aunque la comisión sea baja.
            </p>
            <p>
              ¿Y quién devuelve el precio a su sitio? Los <Termino slug="arbitraje">arbitrajistas</Termino>. Si en el fondo el ETH vale 3.630 USDC y en
              el resto del mercado 3.000, alguien le vende ETH al fondo hasta igualarlos y se queda la diferencia.
              Nadie fija el precio de Uniswap: lo arrastra el resto del mercado.
            </p>
            <p>
              Cada cambio paga además una comisión, que se queda en el fondo para quien lo financió. En la versión
              2 es siempre del 0,3 %. En la 3, quien crea el fondo elige entre 0,01 %, 0,05 %, 0,3 % y 1 %. La
              fórmula es la misma idea en todas las versiones, aunque las últimas la aplican por tramos de precio.
            </p>
          </div>
        </div>
      </section>

      {/* ── 3 ── */}
      <section id="intercambio" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Paso a paso</div>
          <h2 className="gbc-title">Cómo usar Uniswap para cambiar un token por otro</h2>
          <div className="gbc-body">
            <p>Un intercambio son seis pasos. Los tres que más dinero cuestan cuando se hacen deprisa son el 2, el 4 y el 5.</p>
          </div>
          <ol className="uni-pasos">
            <li>
              <strong>Ten una cartera propia con algo para pagar la red.</strong>
              <p>Cada operación paga <Termino slug="gas">gas</Termino> en la moneda de la red: ETH en Ethereum y en sus <Termino slug="capa-2">capas 2</Termino>, BNB en BNB Chain. Sin esa moneda no puedes mover nada, aunque tengas otros tokens.</p>
            </li>
            <li>
              <strong>Entra escribiendo tú la dirección.</strong>
              <p>La web de Uniswap Labs es app.uniswap.org. Nunca desde un anuncio del buscador ni desde un enlace que te manden: las copias falsas son el robo más común.</p>
            </li>
            <li>
              <strong>Elige la red y los dos tokens.</strong>
              <p>El nombre no basta, porque cualquiera puede crear un token llamado igual. Lo que identifica a un token es la dirección de su contrato.</p>
            </li>
            <li>
              <strong>Autoriza el token que vas a vender.</strong>
              <p>La primera vez que vendes un token firmas una <Termino slug="aprobacion-de-token">aprobación</Termino>: le das permiso a un contrato para moverlo. Uniswap usa un contrato intermedio, Permit2. Lo apruebas una vez y después cada cambio se autoriza con una firma que caduca.</p>
            </li>
            <li>
              <strong>Revisa el precio, el impacto y la tolerancia.</strong>
              <p>La web enseña cuánto vas a recibir, el impacto en el precio y la <Termino slug="slippage">tolerancia de deslizamiento</Termino>: lo máximo que aceptas que empeore el precio mientras la operación espera.</p>
            </li>
            <li>
              <strong>Firma y espera la confirmación.</strong>
              <p>Si el precio ha empeorado más de tu tolerancia, el contrato rechaza el cambio. Pierdes el gas consumido, pero no el dinero del intercambio.</p>
            </li>
          </ol>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              La tolerancia merece un número. Con un 0,5 % en un cambio de 1.000 €, aceptas recibir hasta 5 €
              menos de lo previsto. Con un 5 %, hasta 50 €. Mientras tu operación espera en la{" "}
              <Termino slug="mempool">mempool</Termino>, hay programas que la leen y aprovechan ese margen. Lo
              verás en los riesgos.
            </p>
            <p>
              Lo que cuesta la red depende de dónde operes. En la red principal de Ethereum el gas puede valer más
              que el propio cambio si mueves poco dinero. En una capa 2 como
              Arbitrum o Base suele ser una fracción. Si estás empezando, la{" "}
              <Link href="/guias/ethereum">guía de Ethereum</Link> explica cómo se calcula.
            </p>
          </div>
          {/* EXPERIENCIA DEL ADMIN: un intercambio real hecho en Uniswap — red elegida, cuánto costó el gas en euros, qué tolerancia puso y si alguna vez una operación le falló o le salió peor de lo previsto. Una captura de la pantalla de revisión antes de firmar encajaría aquí. */}
          <div className="gbc-box gbc-box--red">
            <div className="gbc-box-title">El error típico</div>
            <div className="gbc-box-body">
              <p>Subir la tolerancia «porque la operación no entra». Si un cambio falla con un 0,5 %, casi siempre
              es porque el fondo es pequeño o el token es raro, y subirla al 10 % solo hace que salga caro. Antes de
              tocarla, mira el impacto en el precio: si pasa del 1 %, el problema es el tamaño de tu orden frente
              al fondo.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Anuncio de media guía ── */}
      <GuiaAnuncio producto="cursos" variante="compacto" estado={d.estado} />

      {/* ── 4 ── */}
      <section id="liquidez" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">El otro lado del fondo</div>
          <h2 className="gbc-title">Aportar liquidez en Uniswap: comisiones contra pérdida impermanente</h2>
          <div className="gbc-body">
            <p>
              Los fondos no los pone Uniswap. Los pone cualquiera que deposite los dos tokens a partes iguales de
              valor: 500 € en ETH y 500 € en USDC, por ejemplo. A cambio cobra su parte de las comisiones de
              todos los cambios que pasen por ese fondo, en proporción a lo que aportó. Al entrar recibe un
              justificante de su parte: en la versión 2, un token LP; en la 3 y la 4, un{" "}
              <Termino slug="nft">NFT</Termino> con su posición. Es lo que devuelve para retirar sus tokens.
            </p>
            <p>
              El coste no se ve en ningún recibo. Se llama{" "}
              <Termino slug="perdida-impermanente">pérdida impermanente</Termino>, y sale de la fórmula. Cuando
              el ETH sube, los arbitrajistas compran ETH al fondo hasta igualar el precio. Tu parte del fondo
              acaba con menos ETH y más USDC: has ido vendiendo lo que subía. Cuando baja, al revés.
            </p>
            <p>
              La cuenta es fija para un fondo como el del ejemplo. Si r es el precio final dividido entre el
              inicial, frente a haberlos guardado tienes 2√r / (1 + r) − 1. No depende del tamaño del fondo ni de
              cuánto aportes: solo de cuánto se ha movido el precio.
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Si el token volátil…</th><th>Tienes, frente a haberlos guardado</th></tr></thead>
              <tbody>
                {PERDIDAS.map((p) => (
                  <tr key={p.cambio}><td>{p.cambio}</td><td><strong>{p.perdida}</strong></td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Cálculo propio con la fórmula de un fondo de producto constante y rango completo, antes de comisiones.
            Es «impermanente» porque desaparece si el precio vuelve al punto de partida.
          </p>

          <GuideUniswapLiquidez />

          <div className="gbc-body" style={{ marginTop: 26 }}>
            <p>
              Con los valores de partida de la calculadora se ve el caso más habitual. Aportas 1.000 €, el token{" "}
              <Termino slug="volatilidad">volátil</Termino> se duplica y cobras un 3 % en comisiones. Guardados, tendrías 1.500 €. En el fondo tienes
              1.414 €, más 30 € de comisiones. Has ganado dinero, pero 56 € menos que sin hacer nada.
            </p>
            <p>
              La versión 3 añadió la <Termino slug="liquidez-concentrada">liquidez concentrada</Termino>: eliges
              un tramo de precios, por ejemplo entre 2.500 y 3.500 USDC por ETH. Mientras el precio está dentro,
              tu dinero trabaja mucho más y cobras más comisiones. Si sale, dejas de cobrar y te quedas con todo
              en el token que peor ha ido. La pérdida impermanente, además, es mayor que la de la tabla.
            </p>
            <p>
              Y desde diciembre de 2025 hay un detalle más: en muchos fondos, una parte de la comisión ya no es
              para ti. En la versión 2, de cada 0,3 % que paga quien cambia, tú cobras un 0,25 %. Lo explica la
              sección del token. El curso <Link href="/cursos/defi-y-stablecoins">DeFi y stablecoins</Link> dedica
              una lección entera a calcular estas posiciones.
            </p>
          </div>
        </div>
      </section>

      {/* ── 5 ── */}
      <section id="versiones" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">La historia</div>
          <h2 className="gbc-title">De Uniswap v1 a v4: qué cambió y qué es Unichain</h2>
          <div className="gbc-body">
            <p>
              Uniswap no se actualiza: se publica una versión nueva y las anteriores siguen funcionando. Por eso
              en la web conviven fondos de v2, v3 y v4, y la propia web elige la ruta más barata entre ellos.
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Versión</th><th>Desde</th><th>Qué trajo</th></tr></thead>
              <tbody>
                <tr><td><strong>v1</strong></td><td>Noviembre de 2018</td><td>La idea: fondos con la fórmula x · y = k, todos contra ETH</td></tr>
                <tr><td><strong>v2</strong></td><td>Mayo de 2020</td><td>Fondos entre dos tokens cualesquiera, con comisión fija del 0,3 %</td></tr>
                <tr><td><strong>v3</strong></td><td>Mayo de 2021</td><td>Liquidez concentrada por tramos de precio y cuatro niveles de comisión</td></tr>
                <tr><td><strong>v4</strong></td><td>Enero de 2025</td><td>Todos los fondos en un solo contrato y los hooks: código propio en cada fondo</td></tr>
                <tr><td><strong>Unichain</strong></td><td>11 de febrero de 2025</td><td>Una red propia, de capa 2 sobre Ethereum</td></tr>
              </tbody>
            </table>
          </div>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              La pieza nueva de v4 son los hooks. Un hook es un contrato que
              quien crea el fondo engancha a él, y que se ejecuta antes o después de cada cambio. Sirven para
              comisiones que suben cuando el mercado se agita, para{" "}
              <Termino slug="orden-limitada">órdenes limitadas</Termino> o para fondos con reglas
              propias. Su cruz es evidente: es código de terceros, y un hook mal escrito o malicioso afecta a
              quien use ese fondo.
            </p>
            <p>
              Unichain es una capa 2 construida por Uniswap Labs con la tecnología de Optimism. Es un{" "}
              <Termino slug="rollup">rollup</Termino>: agrupa operaciones y las anota en Ethereum, con bloques de
              un segundo. Lo que cobra su <Termino slug="secuenciador">secuenciador</Termino>, después de pagar
              los datos a Ethereum y el 15 % que se queda Optimism, va a la quema de UNI. Su uso, de momento, es pequeño: según DefiLlama, a 14 de noviembre de 2026
              tenía depositados unos 23 millones de dólares, frente a más de 5.000 millones en Base.
            </p>
          </div>
        </div>
      </section>

      {/* ── 6 ── */}
      <section id="token" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">La moneda</div>
          <h2 className="gbc-title">Para qué sirve el token UNI: votar y, desde 2025, quemarse</h2>
          <div className="gbc-body">
            <p>
              UNI nació en septiembre de 2020 con uno de los <Termino slug="airdrop">airdrops</Termino> más
              recordados. Uniswap Labs regaló 400 UNI a cada una de las 251.534 direcciones que habían usado el
              protocolo antes del 1 de septiembre, incluidas unas 12.000 que solo tenían operaciones fallidas.
            </p>
            <p>
              Se crearon 1.000 millones de UNI. El 60 % fue para la comunidad y el resto para el equipo, los
              inversores y los asesores, con cuatro años de <Termino slug="vesting">vesting</Termino>. La{" "}
              <Termino slug="gobernanza">gobernanza</Termino> puede crear hasta un 2 % más al año desde
              septiembre de 2024, pero no lo ha hecho nunca: el contrato de UNI sigue registrando exactamente
              1.000 millones emitidos.
            </p>
            <p>
              Es un token de gobernanza: quien lo tiene vota las
              propuestas que cambian el protocolo. Para votar hay que delegar los UNI, en uno mismo o en otra
              persona, y una propuesta necesita 40 millones de votos a favor para salir adelante. Durante cinco
              años, eso fue todo lo que hacía.
            </p>
          </div>

          <h3 className="uni-subtitulo">El «fee switch»: de la promesa a la quema</h3>
          <div className="gbc-body">
            <p>
              Desde 2020 los contratos tenían un interruptor para desviar parte de las comisiones al protocolo.
              Nadie lo encendía. El 25 de diciembre de 2025, la gobernanza aprobó la propuesta «UNIfication» con un 99,9 % de
              los votos, según The Block, y lo activó.
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Fondos</th><th>Comisión que paga quien cambia</th><th>Para quien aporta liquidez</th><th>Para el protocolo</th></tr></thead>
              <tbody>
                <tr><td><strong>v2</strong></td><td>0,30 %</td><td>0,25 %</td><td>0,05 %</td></tr>
                <tr><td><strong>v3, niveles bajos</strong></td><td>0,01 % o 0,05 %</td><td>Tres cuartas partes</td><td>Una cuarta parte</td></tr>
                <tr><td><strong>v3, niveles altos</strong></td><td>0,30 % o 1 %</td><td>Cinco sextas partes</td><td>Una sexta parte</td></tr>
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Fuente: propuesta UNIfication, blog de Uniswap Labs (10 de noviembre de 2025). Empezó por los fondos
            de Ethereum. En julio de 2026 ya cubría v2 y v3 en once redes, según The Block (18 de julio). El 27
            de julio se ejecutó la votación que lo extiende a una parte de los fondos v4, en siete redes.
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Lo que recoge el protocolo no se reparte. Se acumula en un contrato del que solo se puede sacar
              quemando UNI en otro. Es decir, quien quiera esas comisiones tiene que destruir UNI a cambio. La
              misma propuesta quemó de golpe 100 millones de UNI de la tesorería, una estimación de lo que se
              habría quemado si el interruptor hubiera estado encendido desde el principio.
            </p>
            <p>
              El efecto se puede comprobar en la cadena. Los UNI quemados no se borran: se envían a una dirección
              de la que nadie puede sacarlos. A 14 de noviembre de 2026 esa dirección guardaba unos 114 millones
              de UNI, más del 11 % de los 1.000 millones emitidos. No hay que confundirlo con la{" "}
              <Termino slug="oferta-circulante">oferta circulante</Termino>, que tampoco cuenta los UNI que siguen
              en la tesorería. A cambio, la propuesta reservó 20 millones de UNI al año para financiar el
              desarrollo, desde enero de 2026.
            </p>
            <p>
              Lo que UNI no es: no es una acción ni paga dividendos. La quema reduce cuántos UNI hay, y que eso se traduzca en
              precio depende del uso de Uniswap y del mercado. Tampoco es necesario para usar Uniswap: puedes
              cambiar tokens toda la vida sin tener ni uno.
            </p>
          </div>
        </div>
      </section>

      {/* ── 7 ── */}
      <section id="hacienda" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Desde España</div>
          <h2 className="gbc-title">Uniswap y Hacienda: cada cambio es una venta</h2>
          <div className="gbc-body">
            <p>
              Que no haya registro no cambia nada en tu declaración. Para Hacienda, cambiar un token por otro en
              Uniswap es una <strong>permuta</strong>: calculas la ganancia o la pérdida en ese momento, con el
              valor de mercado en euros de la operación, aunque no hayas tocado un euro.
            </p>
            <p>
              Un ejemplo. Compraste 1 ETH por 2.000 € y hoy lo cambias por USDC cuando vale 3.000 €. Tienes
              una ganancia de 1.000 €, que va a la base del ahorro. Si después cambias esos USDC por otro token,
              es otra permuta. Las comisiones de red que pagas en cada cambio cuentan en el cálculo: lo dice la
              Dirección General de Tributos en su consulta vinculante V0648-24, de 11 de abril de 2024.
            </p>
            <p>
              Aportar liquidez tiene su propio criterio. En esa misma consulta, el contribuyente cobraba
              rendimientos de fondos de liquidez de creadores de mercado automáticos, a través de una plataforma
              que gestionaba su posición. Hacienda los calificó como rendimiento del capital mobiliario: se
              valoran en euros el día que los recibes y también van a la base del ahorro.
            </p>
            <p>
              Lo que dejó fuera, de forma expresa, es la entrada y la salida del fondo: recibir y devolver el
              token LP. Así que no está aclarado si depositar tus dos tokens es, en sí, una permuta.
            </p>
          </div>
          <div className="gbc-box gbc-box--gold">
            <div className="gbc-box-title">Lo que conviene guardar desde el primer cambio</div>
            <div className="gbc-box-body">
              <p>El identificador de cada operación, que encuentras en el{" "}
              <Termino slug="explorador-de-bloques">explorador de bloques</Termino>, con su fecha y el valor en
              euros de lo que diste y recibiste. En liquidez, además, lo que aportaste, lo que retiraste y las
              comisiones cobradas. En los fondos v2 las comisiones no te llegan aparte, sino que engordan tu parte
              del fondo, así que sin esas notas no hay forma de separarlas.</p>
              <p>Los tramos y el método de cálculo están en la guía de{" "}
              <Link href="/guias/fiscalidad-cripto-espana">fiscalidad de las criptomonedas en España</Link>. Si
              aportas liquidez con cantidades importantes, consulta a un asesor.</p>
            </div>
          </div>
          <div className="gbc-body" style={{ marginTop: 20 }}>
            <p>
              Una nota sobre la regulación. El reglamento europeo <Termino slug="mica">MiCA</Termino> deja fuera,
              en su considerando 22, los servicios que se prestan de forma totalmente descentralizada, sin
              intermediarios. Por eso el protocolo Uniswap no está autorizado por la CNMV, y eso tiene una cara b:
              nadie responde si te equivocas de token o firmas lo que no debías.
            </p>
          </div>
        </div>
      </section>

      {/* ── 8 ── */}
      <section id="riesgos" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que puede salir mal</div>
          <h2 className="gbc-title">Los riesgos de Uniswap: tokens falsos, firmas y bots</h2>
          <div className="gbc-body">
            <ul>
              <li><strong>Tokens falsos.</strong> Crear un token y un fondo en Uniswap no exige permiso a nadie. Hay copias de casi todo, con el mismo nombre y el mismo logotipo. El UNI auténtico en Ethereum tiene el contrato 0x1f9840a85d5af5bf1d1762f925bdaddc4201f984: compruébalo siempre en un explorador.</li>
              <li><strong>Webs y firmas trampa.</strong> El <Termino slug="phishing">phishing</Termino> ya no pide tu <Termino slug="seed-phrase">frase semilla</Termino>: te pide una aprobación o una firma. Una firma de permiso no cuesta gas y parece inofensiva, pero puede autorizar a otro a llevarse ese token. Lee qué firmas y revoca los permisos que ya no uses.</li>
              <li><strong>Los bots del sándwich.</strong> Es una forma de <Termino slug="mev">MEV</Termino>. Un bot ve tu cambio en espera, compra justo antes y vende justo después. Tú pagas más, hasta el límite de tu tolerancia. Hay carteras que envían las operaciones por un canal privado: reducen el riesgo, no lo eliminan.</li>
              <li><strong>La pérdida impermanente.</strong> Si aportas liquidez, una subida fuerte te deja por detrás de quien se quedó quieto. Las comisiones pueden no compensarlo.</li>
              <li><strong>El código.</strong> Los contratos principales llevan años en uso y han sido auditados, pero un <Termino slug="exploit">exploit</Termino> nunca es imposible. Y los hooks de v4 los escribe cualquiera.</li>
              <li><strong>Nadie al otro lado.</strong> Si te equivocas de red, de token o de dirección, no hay servicio de atención que lo deshaga.</li>
              <li><strong>El precio de UNI.</strong> Su volatilidad es la de cualquier criptomoneda. La quema no garantiza que suba.</li>
            </ul>
          </div>
          <DisclaimerRiesgo variante="general" />
        </div>
      </section>

      {/* ── Anuncio final ── */}
      <GuiaAnuncio producto="portfolio" estado={d.estado} />

      {/* ── QUIZ ── */}
      <section id="quiz" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Quiz final</div>
          <h2 className="gbc-title">Comprueba lo que sabes de Uniswap</h2>
          <div className="gbc-body" style={{ marginBottom: 32 }}>
            <p>Cinco preguntas. Con las cinco acertadas desbloqueas el logro <strong style={{ color: "var(--gold)" }}>Producto Constante</strong>.</p>
          </div>
          {d.isRegistered ? <GuideUniswapQuiz /> : <GuideQuizCuenta slug={SLUG} />}
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
