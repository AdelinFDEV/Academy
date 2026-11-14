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
import GuideAaveLiquidacion from "./GuideAaveLiquidacion";
import GuideAaveQuiz from "./GuideAaveQuiz";
import "./aave.css";

/**
 * Guía «Qué es Aave» (14-11-2026). Consulta objetivo: «qué es aave».
 *
 * Lo que tiene y las demás no: un préstamo seguido de principio a fin en
 * euros, con su factor de salud y su liquidación parcial calculados; una
 * calculadora del precio de liquidación; la curva del tipo de interés con
 * números; el incidente de rsETH de abril de 2026 contado como lección sobre
 * el colateral, y lo que dice Hacienda (V0648-24) y lo que no ha dicho.
 *
 * Al revisarla: TVL de DefiLlama, oferta de GHO y de AAVE (CoinGecko), el
 * estado de las recompras y de Aavenomics 3.0 en el foro de gobernanza, el
 * despliegue de v4 por redes, Umbrella frente a stkAAVE y cualquier consulta
 * nueva de la DGT sobre préstamos con colateral.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/guias/aave" },
  title: "Qué es Aave (AAVE) y cómo funciona un préstamo",
  description:
    "Qué es Aave y cómo presta sin banco: un préstamo en euros, a qué precio te liquidan con calculadora, los préstamos flash, GHO, el token AAVE y Hacienda.",
  openGraph: {
    title: "Qué es Aave (AAVE): préstamos con colateral, liquidación y token, con números",
    description:
      "Cómo pides prestado en Aave sin intermediario, qué es el factor de salud, a qué precio te liquidan, para qué sirve AAVE y cómo se declara en España. Con calculadora y quiz.",
    type: "article",
  },
};

const SLUG = "aave";

const SECCIONES = [
  { id: "que-es", label: "Qué es" },
  { id: "prestamo", label: "Un préstamo" },
  { id: "liquidacion", label: "Liquidación" },
  { id: "intereses", label: "Intereses" },
  { id: "flash", label: "Préstamos flash" },
  { id: "historia", label: "GHO y versiones" },
  { id: "token", label: "El token AAVE" },
  { id: "hacienda", label: "Hacienda" },
  { id: "riesgos", label: "Riesgos" },
  { id: "quiz", label: "Quiz" },
];

/** Ejemplo del texto: 2 ETH a 3.000 €, 3.000 € de deuda, umbral del 80 %, bono del 5 %. */
const ESCENARIOS = [
  { eth: "3.000 €", colateral: "6.000 €", salud: "1,60", que: "Nada. Tienes margen" },
  { eth: "2.400 €", colateral: "4.800 €", salud: "1,28", que: "Nada todavía, pero el margen se ha ido a la mitad" },
  { eth: "1.875 €", colateral: "3.750 €", salud: "1,00", que: "El límite exacto" },
  { eth: "1.800 €", colateral: "3.600 €", salud: "0,96", que: "Liquidable: alguien devuelve 1.500 € de tu deuda y se lleva 1.575 € de tu ETH" },
];

/** Parámetros de ejemplo: tipo base 0 %, pendiente 1 del 4 %, óptimo del 90 %, pendiente 2 del 40 %, factor de reserva del 10 %. */
const CURVA = [
  { u: "50 %", pide: "2,2 %", deposita: "1,0 %", ancho: 5 },
  { u: "80 %", pide: "3,6 %", deposita: "2,6 %", ancho: 8.1 },
  { u: "90 %", pide: "4,0 %", deposita: "3,2 %", ancho: 9.1 },
  { u: "95 %", pide: "24,0 %", deposita: "20,5 %", ancho: 54.5 },
  { u: "100 %", pide: "44,0 %", deposita: "39,6 %", ancho: 100 },
];

export default async function AavePage() {
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
        <div className="gbc-hero-ey">Guía de criptomonedas · Nivel intermedio · 15 min</div>
        <h1 className="gbc-hero-title">
          Qué es Aave (AAVE)<br />
          <span className="gbc-hero-gold">y cómo funciona un préstamo sin banco</span>
        </h1>
        <p className="gbc-respuesta">
          <strong>Aave es el mayor protocolo de préstamos de las <Termino slug="defi">finanzas descentralizadas</Termino>:
          unos contratos en Ethereum y otras redes donde depositas criptomonedas para cobrar intereses o las dejas
          como garantía para pedir prestado, sin nadie en medio.</strong> Siempre se presta menos de lo que vale la
          garantía, y si su precio cae demasiado, el protocolo la vende para cobrarse. AAVE es su token: sirve para
          votar los cambios del protocolo.
        </p>
        <p className="gbc-revisado">Revisada el <strong>14 de noviembre de 2026</strong> · Datos de DefiLlama, CoinGecko y la gobernanza de Aave</p>
        <div className="gbc-hero-pills">
          <span className="gbc-pill">Un préstamo en euros, de principio a fin</span>
          <span className="gbc-pill">Calculadora del precio de liquidación</span>
          <span className="gbc-pill">Quiz con logro</span>
        </div>
      </header>

      {/* ── 1 ── */}
      <section id="que-es" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo básico</div>
          <h2 className="gbc-title">Qué es Aave y para qué sirve</h2>
          <div className="gbc-body">
            <p>
              Aave hace lo que hace un banco con los depósitos y los préstamos, pero sin banco. Unos usuarios
              depositan criptomonedas y cobran intereses. Otros las piden prestadas y pagan intereses. Entre medias
              solo hay <Termino slug="smart-contract">contratos inteligentes</Termino>: código publicado en la{" "}
              <Termino slug="blockchain">cadena de bloques</Termino> que guarda el dinero, calcula los tipos y ejecuta las garantías.
            </p>
            <p>
              No hay estudio de riesgo ni nómina que enseñar. Lo que Aave te pide es una garantía, el{" "}
              <Termino slug="colateral">colateral</Termino>, y que valga más que lo que te llevas. Si dejas 1.000 €
              en ETH, puedes pedir, por ejemplo, 500 € en una <Termino slug="stablecoin">stablecoin</Termino>. Si
              no devuelves, nadie te reclama: el contrato vende tu garantía.
            </p>
            <p>
              Es el mayor de su clase. Según DefiLlama, a 14 de noviembre de 2026 Aave tenía depositados unos
              15.000 millones de dólares, su <Termino slug="tvl">valor total bloqueado</Termino>, repartidos
              entre Ethereum y una veintena de redes. El segundo de la lista, Morpho, rondaba los 10.000 millones.
            </p>
            <p>
              Cuando depositas, recibes un aToken: aUSDC si depositas USDC, aWETH si depositas WETH, que es ETH
              convertido en un token estándar. Es tu justificante, y su saldo crece solo, segundo a segundo, con
              los intereses que pagan los prestatarios. Para recuperar tu dinero devuelves el aToken y te llevas
              lo depositado más lo ganado, siempre que haya <Termino slug="liquidez">liquidez</Termino> libre en
              ese momento.
            </p>
          </div>
        </div>
      </section>

      {/* ── 2 ── */}
      <section id="prestamo" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Cómo funciona</div>
          <h2 className="gbc-title">Cómo funciona Aave: un préstamo con colateral, en euros</h2>
          <div className="gbc-body">
            <p>
              Sigue un préstamo de principio a fin. Tienes 2 ETH y supón que ETH vale 3.000 €: son 6.000 €. No
              quieres venderlos, porque crees que subirán y porque venderlos te obligaría a pagar a Hacienda.
              Necesitas 3.000 € para otra cosa.
            </p>
            <p>
              Depositas los 2 ETH en Aave y los marcas como colateral. Siguen siendo tuyos y siguen cobrando un
              pequeño interés, pero ya no puedes sacarlos mientras debas dinero. Con ellos pides 3.000 € en USDC,
              una stablecoin que sigue al dólar. El USDC llega a tu <Termino slug="wallet">cartera</Termino> al
              momento.
            </p>
            <p>
              Hay dos límites, y conviene no confundirlos. El primero es el{" "}
              <Termino slug="ltv">LTV máximo</Termino>, el porcentaje de tu garantía que puedes pedir de golpe.
              El segundo es el <strong>umbral de liquidación</strong>, algo más alto: si tu deuda llega a ese
              porcentaje de lo que vale tu garantía, te pueden liquidar. Los dos los fija la{" "}
              <Termino slug="gobernanza">gobernanza</Termino> para cada activo. En ETH rondan el 80-85 %.
            </p>
            <p>
              Para seguir el ejemplo, usaremos un umbral del 80 %, el mismo que usa Aave en su centro de ayuda.
              Con 6.000 € de garantía, tu deuda podría llegar hasta 4.800 € antes de que te liquiden. Debes 3.000
              €. Ese margen es lo que mide el número más importante de Aave.
            </p>
            <p>
              En la práctica, todo esto son cuatro pasos en app.aave.com: conectas tu cartera, eliges la red,
              depositas el activo y marcas si cuenta como colateral, y en la pestaña de pedir prestado eliges qué
              y cuánto. Cada paso es una transacción que firmas tú y que paga su comisión de{" "}
              <Termino slug="gas">gas</Termino>. Para devolver, el camino es el inverso: primero la deuda, después
              la retirada.
            </p>
          </div>
          <div className="gbc-box gbc-box--gold">
            <div className="gbc-box-title">¿Para qué pide nadie un préstamo con más garantía que dinero?</div>
            <div className="gbc-box-body">
              <p>Para tener liquidez sin vender lo que tiene. Para cubrir un gasto sin deshacer una posición a
              largo plazo. Y, lo más habitual, para operar con <Termino slug="apalancamiento">apalancamiento</Termino>:
              pedir stablecoins contra ETH, comprar más ETH y volver a depositarlo. Lo primero tiene sentido en
              casos concretos. Lo segundo multiplica tanto lo que ganas como lo que pierdes.</p>
            </div>
          </div>
          {/* EXPERIENCIA DEL ADMIN: un préstamo real en Aave — qué dejó de colateral, cuánto pidió y para qué, qué factor de salud mantuvo y si alguna vez tuvo que añadir garantía o devolver deuda deprisa en una caída. Una captura del panel de la posición con el factor de salud encajaría aquí. */}
        </div>
      </section>

      {/* ── 3 ── */}
      <section id="liquidacion" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que decide todo</div>
          <h2 className="gbc-title">El factor de salud de Aave: a qué precio te liquidan</h2>
          <div className="gbc-body">
            <p>
              El <Termino slug="factor-de-salud">factor de salud</Termino> resume tu posición en una cifra. Es
              lo que vale tu garantía multiplicado por su umbral de liquidación, dividido entre lo que debes. En
              el ejemplo: 6.000 € × 0,80 / 3.000 € = <strong>1,6</strong>.
            </p>
            <p>
              Mientras esté por encima de 1, no pasa nada. Si baja de 1, cualquiera puede{" "}
              <Termino slug="liquidacion">liquidarte</Termino>. De ahí sale el precio que debes tener apuntado:
              tu deuda dividida entre la cantidad de garantía y el umbral. Aquí, 3.000 / (2 × 0,80) ={" "}
              <strong>1.875 € por ETH</strong>. Una caída del 37,5 %.
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Si ETH vale…</th><th>Tu garantía</th><th>Factor de salud</th><th>Qué pasa</th></tr></thead>
              <tbody>
                {ESCENARIOS.map((e) => (
                  <tr key={e.eth}><td><strong>{e.eth}</strong></td><td>{e.colateral}</td><td>{e.salud}</td><td>{e.que}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Cálculo propio con 2 ETH de colateral, 3.000 € de deuda en stablecoin, un umbral del 80 % y un bono de
            liquidación de ejemplo del 5 %. Sin contar los intereses, que hacen crecer la deuda.
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Una liquidación no se lo lleva todo, pero cuesta. Con el factor de salud entre 0,95 y 1, el
              liquidador puede devolver hasta la mitad de tu deuda. Con 0,95 o menos, o si tu garantía o tu deuda
              valen menos de 2.000 dólares, puede devolverla entera. Son las reglas de Aave v3, según su centro de ayuda.
            </p>
            <p>
              A cambio, se lleva tu ETH por el valor de lo que devolvió más un premio, el bono de liquidación. En
              la última fila: devuelve 1.500 € y se lleva 1.575 € en ETH. Esos 75 € son lo que pierdes. Te quedan
              1,125 ETH y 1.500 € de deuda, con un factor de salud de 1,08. Si el precio sigue cayendo, vuelta a
              empezar.
            </p>
            <p>
              No hay aviso previo ni plazo para reaccionar. Liquidan bots que vigilan todas las posiciones y actúan
              en segundos, porque el bono es su negocio. Y el precio que manda no es el de tu{" "}
              <Termino slug="exchange">exchange</Termino>, sino el que lee Aave de su{" "}
              <Termino slug="oraculo">oráculo</Termino>, normalmente Chainlink.
            </p>
          </div>

          <GuideAaveLiquidacion />

          <div className="gbc-body" style={{ marginTop: 26 }}>
            <p>
              Prueba a mover el umbral y la deuda. Verás que la regla práctica sale sola: con un factor de salud
              de 2, el precio de tu garantía puede caer a la mitad antes de que te liquiden. Con 1,25, basta una
              caída del 20 %. ETH ha caído más del 20 % en una semana muchas veces.
            </p>
          </div>
          <div className="gbc-box gbc-box--red">
            <div className="gbc-box-title">El error típico</div>
            <div className="gbc-box-body">
              <p>Pedir el máximo que deja la web. El LTV máximo dice cuánto puedes pedir, no cuánto deberías. Quien
              pide hasta el límite empieza con un factor de salud muy cerca de 1 y lo pierde con el primer
              movimiento brusco. Y como los intereses suman cada segundo, tu factor de salud baja aunque el
              precio no se mueva.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Anuncio de media guía ── */}
      <GuiaAnuncio producto="cursos" variante="compacto" estado={d.estado} />

      {/* ── 4 ── */}
      <section id="intereses" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">El precio del dinero</div>
          <h2 className="gbc-title">Por qué cambian los tipos de interés en Aave</h2>
          <div className="gbc-body">
            <p>
              En Aave nadie fija el tipo de interés a mano. Lo decide una curva, distinta para cada activo, que
              depende de una sola variable: la <Termino slug="tasa-de-utilizacion">tasa de utilización</Termino>,
              es decir, qué parte de lo depositado está prestada. Con mucho dinero ocioso, pedir es barato. Con
              casi todo prestado, se encarece.
            </p>
            <p>
              La curva tiene un codo, el punto óptimo. Hasta ahí sube despacio. A partir de ahí, se dispara. La
              razón es práctica: si el 100 % estuviera prestado, ningún depositante podría retirar. El salto de
              tipos empuja a los prestatarios a devolver y atrae depósitos nuevos.
            </p>
          </div>
          <ul className="aave-curva" aria-label="Tipo que pagas al pedir prestado según la utilización, con parámetros de ejemplo">
            {CURVA.map((c) => (
              <li key={c.u}>
                <span className="aave-curva-u">{c.u} prestado</span>
                <span className="aave-curva-barra"><span style={{ width: `${c.ancho}%` }} /></span>
                <span className="aave-curva-tipo">{c.pide}</span>
              </li>
            ))}
          </ul>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Utilización</th><th>Pagas al pedir</th><th>Cobras al depositar</th></tr></thead>
              <tbody>
                {CURVA.map((c) => (
                  <tr key={c.u}><td><strong>{c.u}</strong></td><td>{c.pide}</td><td>{c.deposita}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Cálculo propio con parámetros de ejemplo, del orden de los que usa Aave en stablecoins. Óptimo del 90 %,
            pendiente del 4 % antes del codo y del 40 % después, y un 10 % de los intereses para la tesorería. Los
            reales de cada activo cambian por votación y se ven en la propia app.
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Lo que cobras al depositar siempre es menos de lo que se paga al pedir, por dos motivos. Solo una
              parte de lo depositado está prestada y genera intereses. Y una porción de esos intereses, el factor
              de reserva, va a la tesorería de Aave. Es de donde salen sus ingresos.
            </p>
            <p>
              Por eso el <Termino slug="apy">APY</Termino> que ves en la web no es una promesa. Es el tipo de ese
              momento, y puede cambiar en la siguiente operación de cualquier usuario. Si pides prestado a un 4 %
              y el mercado se tensa, puedes acabar pagando un 20 % sin haber firmado nada nuevo.
            </p>
            <p>
              Si quieres practicar estas cuentas con calma, el curso{" "}
              <Link href="/cursos/defi-y-stablecoins">DeFi y stablecoins</Link> de la academia trata los
              préstamos con colateral y las stablecoins paso a paso.
            </p>
          </div>
        </div>
      </section>

      {/* ── 5 ── */}
      <section id="flash" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">El invento de Aave</div>
          <h2 className="gbc-title">Qué son los préstamos flash de Aave</h2>
          <div className="gbc-body">
            <p>
              Un <Termino slug="prestamo-flash">préstamo flash</Termino> es un préstamo sin garantía que se pide
              y se devuelve dentro de la misma transacción. Puede ser de millones. Funciona porque una transacción
              en Ethereum es todo o nada: si al final no está devuelto el dinero más la comisión, la transacción
              entera se anula, como si nunca hubiera ocurrido.
            </p>
            <p>
              Aave no corre riesgo, porque o le devuelven o el préstamo no existió. Cobra una comisión que en v3
              se fijó en el 0,05 %, según su documentación: 50 € por cada 100.000 € prestados durante unos
              segundos. La gobernanza puede cambiarla.
            </p>
            <p>
              Sirven para operaciones que necesitan mucho capital un instante. Un{" "}
              <Termino slug="arbitraje">arbitraje</Termino> entre dos mercados. Cambiar tu garantía de un activo
              a otro sin devolver antes la deuda. O liquidar a otro usuario sin tener el dinero. No son para ti
              salvo que programes: se piden desde un contrato, no desde la web.
            </p>
            <p>
              También tienen su cara oscura. Varios ataques a otros protocolos, como el de Beanstalk en abril de
              2022, usaron préstamos flash para reunir por unos segundos el capital que necesitaban. El fallo
              estaba en el protocolo atacado, no en Aave, pero el préstamo flash fue la palanca.
            </p>
          </div>
        </div>
      </section>

      {/* ── 6 ── */}
      <section id="historia" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">De dónde viene</div>
          <h2 className="gbc-title">De ETHLend a Aave v4, y qué es GHO</h2>
          <div className="gbc-body">
            <p>
              Aave empezó en 2017 con otro nombre, ETHLend, creado por el finlandés Stani Kulechov. Entonces
              casaba préstamos entre dos personas, como un tablón de anuncios. Funcionaba mal: había que esperar a
              que alguien aceptara tu oferta. En 2018 cambió de nombre a Aave, «fantasma» en finés, y de modelo: un
              fondo común del que todos piden y en el que todos depositan.
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Cuándo</th><th>Qué</th><th>Qué cambió</th></tr></thead>
              <tbody>
                <tr><td><strong>2017</strong></td><td>ETHLend</td><td>Préstamos entre particulares, con el token LEND</td></tr>
                <tr><td><strong>Enero de 2020</strong></td><td>Aave v1</td><td>Fondos comunes con tipos automáticos y los préstamos flash</td></tr>
                <tr><td><strong>Octubre de 2020</strong></td><td>Token AAVE</td><td>100 LEND se cambian por 1 AAVE; oferta máxima de 16 millones</td></tr>
                <tr><td><strong>Marzo de 2022</strong></td><td>Aave v3</td><td>Mercados en muchas redes y límites de riesgo por activo</td></tr>
                <tr><td><strong>Julio de 2023</strong></td><td>GHO</td><td>La stablecoin propia de Aave</td></tr>
                <tr><td><strong>Junio de 2025</strong></td><td>Umbrella</td><td>Nuevo sistema de respaldo ante deudas impagadas</td></tr>
                <tr><td><strong>30 de marzo de 2026</strong></td><td>Aave v4</td><td>Liquidez central compartida y mercados especializados</td></tr>
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Fuentes: registro de cambios de la documentación de Aave (v3, Umbrella y v4) y anuncio de la migración
            de LEND a AAVE, que empezó el 2 de octubre de 2020.
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              <strong>GHO</strong> es la stablecoin de Aave. No nace de dólares guardados en un banco: se crea
              cuando alguien la pide prestada contra su colateral en Aave, y se destruye cuando la devuelve.
              También hay módulos que la cambian uno a uno por USDC o USDT. Su tipo de interés no sale de la curva
              de utilización, porque no hay depósitos de GHO que prestar: lo fija la gobernanza. Según CoinGecko, a 14 de noviembre de 2026 había unos 699 millones de GHO en
              circulación, cotizando a 0,998 dólares.
            </p>
            <p>
              <strong>Aave v4</strong> se lanzó en Ethereum el 30 de marzo de 2026 con un diseño de «hubs» y
              «spokes». Un hub es un depósito central de liquidez. Los spokes son mercados conectados a él, cada
              uno con sus propias reglas: uno para monedas que se mueven juntas, otro para activos más
              arriesgados. La idea es que un mercado nuevo no empiece de cero, sino que tire de la liquidez del hub.
            </p>
            <p>
              Desde entonces ha llegado a Avalanche, a Arc, la <Termino slug="capa-1">capa 1</Termino> de
              Circle, y a Base. Aun así, v3 sigue siendo
              casi todo Aave. Según el informe de 180 días de Aave Labs, a 1 de octubre de 2026 había 1.340 millones
              de dólares depositados en v4, frente a 31.900 millones en v3. Como en{" "}
              <Link href="/guias/uniswap">Uniswap</Link>, las versiones conviven: la nueva no apaga la anterior.
            </p>
          </div>
        </div>
      </section>

      {/* ── 7 ── */}
      <section id="token" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">La moneda</div>
          <h2 className="gbc-title">Para qué sirve el token AAVE: votar, respaldar y, a veces, recomprarse</h2>
          <div className="gbc-body">
            <p>
              No necesitas AAVE para usar Aave. Depositas y pides prestado con cualquier activo admitido. El
              token sirve para otra cosa: es el <Termino slug="token-de-gobernanza">token de gobernanza</Termino>{" "}
              del protocolo. Quien lo tiene vota qué activos se admiten, con qué umbrales, qué curvas de interés y
              en qué redes se despliega. La <Termino slug="dao">DAO</Termino> de Aave gestiona además una
              tesorería propia.
            </p>
            <p>
              Hay 16 millones de AAVE como máximo y, según CoinGecko, unos 15,4 millones en{" "}
              <Termino slug="oferta-circulante">circulación</Termino> a 14 de noviembre de 2026. Ese día cotizaba a
              unos 93 € (102 dólares), con una <Termino slug="market-cap">capitalización</Termino> cercana a los
              1.580 millones de dólares. Su <Termino slug="ath">máximo histórico</Termino> fue de 661 dólares, el 18
              de mayo de 2021: hoy vale un 85 % menos.
            </p>
          </div>

          <h3 className="aave-subtitulo">Staking: de stkAAVE a Umbrella</h3>
          <div className="gbc-body">
            <p>
              Durante años, el uso principal de AAVE fue el <Termino slug="staking">staking</Termino> en el Safety
              Module: lo bloqueabas, cobrabas una recompensa y, a cambio, aceptabas que una parte pudiera usarse
              para tapar un agujero. Era un seguro pagado por los propios tenedores, con riesgo de{" "}
              <Termino slug="slashing">slashing</Termino>.
            </p>
            <p>
              Desde junio de 2025 ese papel pasa a <strong>Umbrella</strong>. Ya no se bloquea AAVE, sino aTokens
              (aUSDC, aUSDT, aWETH) y GHO. Cada depósito cubre solo su activo: si aparece una{" "}
              <Termino slug="deuda-incobrable">deuda incobrable</Termino> en USDC, se recorta lo depositado en
              aUSDC, de forma automática y sin votación. Para salir hay que esperar 20 días y retirar en las 48
              horas siguientes. stkAAVE sigue existiendo durante la transición, pero la documentación de Aave dice
              que su penalización se desactiva cuando Umbrella alcanza escala suficiente.
            </p>
          </div>

          <h3 className="aave-subtitulo">Recompras: aprobadas, pausadas y en espera</h3>
          <div className="gbc-body">
            <p>
              En 2025 la gobernanza aprobó usar parte de los ingresos para recomprar AAVE en el mercado, con un
              presupuesto que llegó a rondar los 50 millones de dólares al año. Tras el incidente de abril de
              2026, que verás en los riesgos, las recompras se pausaron para reforzar la tesorería.
            </p>
            <p>
              En junio de 2026 Kulechov anunció un modelo nuevo, Aavenomics 3.0, con recompras automáticas que no
              dependerían de una votación cada vez. En octubre se abrió en el foro el debate sobre si debe incluir
              también staking. A 14 de noviembre de 2026 no hemos encontrado en el foro de gobernanza una votación
              aprobada con su presupuesto y su fecha. Hasta que
              la haya, es un anuncio. Y aunque llegue, una recompra no garantiza que el precio suba: depende de lo
              que gane Aave y de lo que haga el mercado.
            </p>
          </div>
        </div>
      </section>

      {/* ── 8 ── */}
      <section id="hacienda" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Desde España</div>
          <h2 className="gbc-title">Aave y Hacienda: lo que tributa al prestar y al pedir prestado</h2>
          <div className="gbc-body">
            <p>
              Que no haya un banco no cambia tu declaración. Hay un criterio de la Dirección General de Tributos
              que toca de lleno a Aave: la consulta vinculante V0648-24, de 11 de abril de 2024. Lo que dice, y lo
              que no dice, es esto:
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Lo que haces en Aave</th><th>Cómo tributa en España</th><th>Seguridad del criterio</th></tr></thead>
              <tbody>
                <tr><td><strong>Cobrar intereses por depositar</strong></td><td>Rendimiento del capital mobiliario, valorado en euros, en la base del ahorro</td><td>Lo dice la V0648-24</td></tr>
                <tr><td><strong>Cobrar intereses por lo que dejas de colateral</strong></td><td>Igual: rendimiento del capital mobiliario</td><td>Lo dice la V0648-24</td></tr>
                <tr><td><strong>Pagar intereses por lo que pides</strong></td><td>No se pueden restar de esos rendimientos</td><td>Lo dice la V0648-24</td></tr>
                <tr><td><strong>Recibir el préstamo</strong></td><td>No es una ganancia: es una deuda que devolverás</td><td>Principio general</td></tr>
                <tr><td><strong>Cambiar lo prestado por otra criptomoneda</strong></td><td>Permuta: ganancia o pérdida en ese momento</td><td>Lo dice la V0648-24, como otras anteriores</td></tr>
                <tr><td><strong>Depositar y recibir el aToken</strong></td><td>Sin aclarar si es una permuta</td><td>Nadie lo ha resuelto</td></tr>
                <tr><td><strong>Que te liquiden</strong></td><td>Lo razonable es tratarlo como una venta de tu colateral</td><td>Sin consulta específica</td></tr>
              </tbody>
            </table>
          </div>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              La liquidación es la fila que más duele. Si te liquidan 0,875 ETH que compraste a 1.000 € la unidad
              cuando valen 1.800 €, has transmitido un activo con ganancia: unos 700 €, aunque la operación te haya
              costado dinero. No hay una consulta de la DGT sobre este caso exacto. Lo prudente es declararlo como
              transmisión y, con importes grandes, preguntar a un asesor.
            </p>
            <p>
              Los intereses tienen además un problema práctico. Tu aToken crece cada segundo, y no hay un día de
              cobro. Apunta el saldo al entrar y al salir, con su valor en euros. Los tramos de la base del ahorro y
              el método de cálculo están en la guía de{" "}
              <Link href="/guias/fiscalidad-cripto-espana">fiscalidad de las criptomonedas en España</Link>.
            </p>
          </div>
          <div className="gbc-box gbc-box--gold">
            <div className="gbc-box-title">Un registro por posición, no por año</div>
            <div className="gbc-box-body">
              <p>Abre una hoja para cada posición de Aave y apunta cinco momentos: depósito, préstamo, devolución,
              retirada y, si llega, la liquidación. En cada uno, la cantidad, el precio en euros y el enlace a la
              transacción en el <Termino slug="explorador-de-bloques">explorador de bloques</Termino>. Al
              cerrar, las unidades que retiras de más sobre las que depositaste son el interés cobrado. Cómo
              valorarlas en euros, si al retirar o día a día, no lo ha aclarado Hacienda: por eso conviene tener
              cada fecha.</p>
            </div>
          </div>
          <div className="gbc-body" style={{ marginTop: 20 }}>
            <p>
              Una nota de supervisión. Aave es un protocolo, no una entidad autorizada por la CNMV ni por el
              Banco de España. Si algo sale mal, no hay fondo de garantía de depósitos ni servicio de reclamaciones
              al que acudir.
            </p>
          </div>
        </div>
      </section>

      {/* ── 9 ── */}
      <section id="riesgos" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que puede salir mal</div>
          <h2 className="gbc-title">¿Es fiable Aave? Los riesgos, con un caso de 2026</h2>
          <div className="gbc-body">
            <p>
              El 18 de abril de 2026 alguien atacó el <Termino slug="bridge">puente</Termino> entre redes de
              rsETH, un token de <Termino slug="staking-liquido">staking líquido</Termino> del proyecto Kelp.
              Sacó 116.500 rsETH sin respaldo. Depositó 89.567 en Aave como colateral, y Aave los
              valoró como si fueran buenos. Con ellos pidió prestados 82.650 WETH. Los contratos de Aave no
              fallaron: falló lo que aceptaban como garantía.
            </p>
            <p>
              Aave congeló los mercados afectados en 85 minutos. Después, una coalición de proyectos llamada DeFi
              United reunió aportaciones en ETH para devolver el respaldo, y Kelp lo repuso en cinco tramos. Según
              el informe de 180 días de Aave Labs, el 26 de mayo el rsETH volvía a estar respaldado y los mercados funcionaban con normalidad, sin tocar
              Umbrella. Por el camino, la confianza se resintió: según el mismo informe, el valor total bloqueado
              en Aave pasó de 26.180 millones de dólares el 1 de abril a 13.930 millones el 1 de julio.
            </p>
          </div>
          <div className="gbc-body">
            <ul>
              <li><strong>La liquidación.</strong> Es el riesgo que eliges tú. Una caída rápida, con un factor de salud bajo, te cuesta el bono y te deja con menos garantía.</li>
              <li><strong>El colateral de otros.</strong> El caso de rsETH lo demostró: si Aave acepta un activo que resulta no valer lo que dice, el agujero afecta a todo el mercado.</li>
              <li><strong>Quedarte sin poder retirar.</strong> Si la utilización llega al 100 %, tu depósito sigue siendo tuyo, pero no puedes sacarlo hasta que alguien devuelva o deposite.</li>
              <li><strong>El oráculo.</strong> Te liquidan por el precio que lee Aave. Un dato erróneo, o un <Termino slug="depeg">depeg</Termino> brusco de una stablecoin, puede disparar liquidaciones.</li>
              <li><strong>El código.</strong> Los contratos llevan años en uso y pasan <Termino slug="auditoria-de-seguridad">auditorías de seguridad</Termino>, pero un <Termino slug="exploit">exploit</Termino> nunca es imposible. Y v4 es código nuevo.</li>
              <li><strong>Las webs falsas.</strong> El <Termino slug="phishing">phishing</Termino> imita la app de Aave para que firmes una <Termino slug="aprobacion-de-token">aprobación</Termino> que vacía tu cartera. Escribe tú la dirección.</li>
              <li><strong>El precio de AAVE.</strong> Su <Termino slug="volatilidad">volatilidad</Termino> es la de cualquier criptomoneda. Lleva más de cuatro años muy por debajo de su máximo.</li>
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
          <h2 className="gbc-title">Comprueba lo que sabes de Aave</h2>
          <div className="gbc-body" style={{ marginBottom: 32 }}>
            <p>Cinco preguntas. Con las cinco acertadas desbloqueas el logro <strong style={{ color: "var(--gold)" }}>Lejos del Uno</strong>.</p>
          </div>
          {d.isRegistered ? <GuideAaveQuiz /> : <GuideQuizCuenta slug={SLUG} />}
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
