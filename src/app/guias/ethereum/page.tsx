import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import GuideInteractions from "@/components/GuideInteractions";
import GuideBreadcrumbJsonLd from "@/components/GuideBreadcrumbJsonLd";
import GuiasRelacionadas from "@/components/GuiasRelacionadas";
import GuideQuizCuenta from "@/components/GuideQuizCuenta";
import GuiaAnuncio from "@/components/GuiaAnuncio";
import DisclaimerRiesgo from "@/components/DisclaimerRiesgo";
import Termino from "@/components/Termino";
import Anotacion from "@/components/cuaderno/Anotacion";
import Postit from "@/components/cuaderno/Postit";
import SimboloEstudio, { Llave } from "@/components/cuaderno/SimboloEstudio";
import { datosDeGuia } from "@/lib/guiaDatos";
import GuideEthereumGas from "./GuideEthereumGas";
import GuideEthereumQuiz from "./GuideEthereumQuiz";
import "./ethereum.css";

/**
 * Guía «Qué es Ethereum» (13-11-2026). Consulta objetivo: «qué es ethereum».
 *
 * Lo que tiene y las demás no: el coste de usar la red explicado con una
 * calculadora de gas y una tabla de ejemplos, los tres errores que más dinero
 * cuestan, y lo que cambia para quien declara en España.
 *
 * Cada fecha y cada cifra lleva su fuente en el texto. Al revisar la guía,
 * empezar por la tabla de actualizaciones: es lo que antes caduca.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/guias/ethereum" },
  title: "Qué es Ethereum: cómo funciona y qué cuesta",
  description:
    "Qué es Ethereum y cómo funciona, sin jerga: contratos inteligentes, el gas con una calculadora, el staking, las capas 2 y los errores que más dinero cuestan.",
  openGraph: {
    title: "Qué es Ethereum: cómo funciona, cuánto cuesta usarlo y qué riesgos tiene",
    description:
      "Contratos inteligentes, gas con calculadora, staking, capas 2, diferencias con Bitcoin y los tres errores que más dinero cuestan. Con quiz y logro.",
    type: "article",
  },
};

const SLUG = "ethereum";

const SECCIONES = [
  { id: "que-es", label: "Qué es" },
  { id: "contratos", label: "Contratos inteligentes" },
  { id: "gas", label: "Cuánto cuesta" },
  { id: "staking", label: "Del minado al staking" },
  { id: "capas-2", label: "Capas 2" },
  { id: "bitcoin", label: "Ethereum y Bitcoin" },
  { id: "errores", label: "Errores caros" },
  { id: "hacienda", label: "Hacienda" },
  { id: "riesgos", label: "Riesgos" },
  { id: "quiz", label: "Quiz" },
];

/** Las actualizaciones que explican el Ethereum de hoy. Fechas: ethereum.org. */
const HITOS = [
  { fecha: "30 jul 2015", nombre: "Lanzamiento", que: "Arranca la red. Se valida con minería, como Bitcoin." },
  { fecha: "5 ago 2021", nombre: "London (EIP-1559)", que: "Cada transacción quema una parte de su comisión. Las tarifas se vuelven más previsibles." },
  { fecha: "15 sep 2022", nombre: "The Merge", que: "Fin de la minería: la red pasa a la prueba de participación y su consumo de energía cae en torno a un 99,95 %." },
  { fecha: "12 abr 2023", nombre: "Shapella", que: "Quien tenía ETH en staking puede retirarlo por primera vez." },
  { fecha: "13 mar 2024", nombre: "Dencun", que: "Llegan los «blobs»: espacio barato para las capas 2, que bajan sus comisiones de golpe." },
  { fecha: "7 may 2025", nombre: "Pectra", que: "Un validador puede acumular hasta 2.048 ETH y las carteras ganan funciones de cuenta inteligente." },
  { fecha: "3 dic 2025", nombre: "Fusaka", que: "PeerDAS: los nodos comprueban los datos de las capas 2 por muestreo, lo que deja sitio para muchos más." },
];

export default async function EthereumPage() {
  const d = await datosDeGuia(SLUG);

  return (
    <div className="gbc-wrap">
      <GuideBreadcrumbJsonLd slug={SLUG} />
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
        <div className="gbc-hero-ey">Guía de criptomonedas · Nivel básico · 14 min</div>
        <h1 className="gbc-hero-title">
          Qué es Ethereum<br />
          <span className="gbc-hero-gold">y cómo funciona, sin jerga</span>
        </h1>
        <p className="gbc-respuesta">
          <SimboloEstudio tipo="estrella" margen className="gbc-respuesta-estrella" retraso={200} />
          <strong><Anotacion tipo="highlight" color="var(--amarillo)" grosor={2} iteraciones={1} retraso={300}>Ethereum es una red de ordenadores que ejecuta programas además de mover dinero.</Anotacion></strong> Esos
          programas se llaman <Anotacion tipo="underline" color="var(--azul)" grosor={2} retraso={1300}>contratos inteligentes</Anotacion>, y sobre ellos funcionan los préstamos sin banco, las
          stablecoins y los NFT. Su moneda es el <strong>ether (ETH)</strong>: con ella se paga cada operación y
          se protege la red.
        </p>
        <p className="gbc-revisado">Revisada el <strong>13 de noviembre de 2026</strong> · Fechas y datos técnicos: ethereum.org</p>
        <div className="gbc-hero-pills">
          <span className="gbc-pill">Calculadora de gas</span>
          <span className="gbc-pill">Ethereum frente a Bitcoin</span>
          <span className="gbc-pill">Quiz con logro</span>
        </div>
      </header>

      {/* ── 1 · Qué es ── */}
      <section id="que-es" className="gbc-section">
        <div className="gbc-gc gbc-margen">
          <div className="gbc-ey">Lo básico</div>
          <h2 className="gbc-title">Qué es Ethereum y en qué se diferencia de una moneda</h2>
          <div className="gbc-body">
            <p>
              Ethereum es una <Termino slug="blockchain">blockchain</Termino>: un registro compartido que nadie
              controla y que miles de ordenadores mantienen idéntico. Hasta ahí, igual que Bitcoin. La
              diferencia está en lo que se puede apuntar en él.
            </p>
            <p>
              En Bitcoin se apuntan pagos: «Ana envía 0,1 a Luis». En Ethereum se apuntan también
              <strong> <Anotacion tipo="circle" junta>programas</Anotacion></strong>, y la red los ejecuta. Por eso se le suele llamar <Anotacion tipo="underline" color="var(--azul)" grosor={2} retraso={500}>«el ordenador mundial»</Anotacion>:
              un ordenador lento y caro comparado con el tuyo, pero que nadie puede apagar ni trampear.
            </p>
            <p>
              Lo propuso Vitalik Buterin en 2013, con 19 años, y la red arrancó el 30 de julio de 2015. Hoy es la
              segunda criptomoneda por <Termino slug="market-cap">capitalización</Termino>, detrás de Bitcoin, y
              la base sobre la que funciona la mayor parte de las finanzas descentralizadas.
            </p>
          </div>
          <Postit color="amarillo" giro={-2}>
            <SimboloEstudio tipo="nb" color="naranja" className="postit-esquina" retraso={400} />
            <div className="postit-titulo">Ethereum no es lo mismo que ether</div>
            <div className="postit-cuerpo">
              <p><strong>Ethereum</strong> es la red. <strong>Ether (ETH)</strong> es su moneda. Cuando alguien dice
              «he comprado Ethereum», ha comprado ether. La distinción importa porque sobre la red viven miles de
              monedas más que no son ETH, y se confunden con facilidad.</p>
            </div>
          </Postit>
        </div>
      </section>

      {/* ── 2 · Contratos inteligentes ── */}
      <section id="contratos" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Cómo funciona</div>
          <h2 className="gbc-title">Cómo funciona Ethereum: los contratos inteligentes</h2>
          <div className="gbc-body">
            <p>
              <Anotacion tipo="bracket" lados="left" color="var(--azul)" relleno={[2, 6, 2, 6]} iteraciones={1}>
                Un <Termino slug="smart-contract">contrato inteligente</Termino> es un programa guardado en la
                blockchain que hace lo que dice su código cuando se cumplen sus condiciones. No hay nadie en medio
                que pueda decidir otra cosa.
              </Anotacion>
            </p>
            <p>
              Un ejemplo. Quieres un préstamo de 1.000 dólares y dejas 1.500 en ether como garantía. El contrato
              guarda la garantía, te entrega el préstamo y, si el ether cae por debajo de un límite, la vende
              solo para devolver el dinero al prestamista. Ningún empleado aprueba ni revisa nada.
            </p>
            <p>De esa idea salen casi todos los usos de Ethereum:</p>
            <Llave color="azul">
            <ul>
              <li><strong>Finanzas descentralizadas</strong> (<Termino slug="defi">DeFi</Termino>): préstamos, ahorro e intercambio de monedas en un <Termino slug="dex">exchange descentralizado</Termino>, sin banco.</li>
              <li><strong><Termino slug="stablecoin">Stablecoins</Termino></strong>: dólares digitales como USDT o USDC, que en buena parte circulan sobre Ethereum.</li>
              <li><strong><Termino slug="nft">NFT</Termino></strong>: certificados de propiedad de algo único, de una entrada a una obra digital.</li>
              <li><strong>Tokens</strong>: cualquiera puede crear una moneda nueva encima de la red, sin montar una blockchain propia.</li>
            </ul>
            </Llave>
            <p>
              <SimboloEstudio tipo="exclamacion" color="coral" margen />
              El reverso de la moneda: un contrato hace lo que dice su código, <Anotacion tipo="underline" color="var(--coral)" retraso={300}>también cuando el código tiene un
              fallo</Anotacion>. Un error de programación es un <Termino slug="exploit">exploit</Termino> esperando a ocurrir,
              y no hay ventanilla donde reclamar.
            </p>
          </div>
        </div>
      </section>

      {/* ── 3 · Gas ── */}
      <section id="gas" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que cuesta de verdad</div>
          <h2 className="gbc-title">Cuánto cuesta usar Ethereum: el gas, con números</h2>
          <div className="gbc-body">
            <p>
              Cada operación en Ethereum consume trabajo de los ordenadores de la red, y ese trabajo se paga. La
              unidad con la que se mide es el <Termino slug="gas">gas</Termino>, y la comisión sale de una
              multiplicación:
            </p>
            <p className="eth-formula"><SimboloEstudio tipo="estrella" className="eth-formula-estrella" semilla={11} /><strong>comisión = gas que gasta la operación × precio del gas</strong></p>
            <p>
              El primer número depende de lo que hagas: enviar ETH gasta siempre <Anotacion tipo="box" color="var(--lila)" grosor={2} relleno={[1, 4]} junta>21.000 unidades</Anotacion>, y cambiar una
              moneda por otra, varias veces más. El segundo lo fija la demanda: cuanta más gente quiere operar a
              la vez, más sube. Se expresa en <strong>gwei</strong>, que es <Anotacion tipo="underline" color="var(--lila)" grosor={2} animar={false}>una milmillonésima de ether</Anotacion>.
            </p>
            <p>
              Con eso ya puedes hacer la cuenta tú. Pon el precio del gas que marque tu cartera y el precio del
              ETH de hoy:<SimboloEstudio tipo="flecha" color="cielo" giro={20} className="eth-flecha-calculadora" retraso={200} />
            </p>
          </div>

          <GuideEthereumGas />

          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead>
                <tr><th>Operación</th><th>Gas aproximado</th><th>Con el gas a 1 gwei</th><th>Con el gas a 30 gwei</th></tr>
              </thead>
              <tbody>
                <tr><td>Enviar ETH</td><td className="es-num">21.000</td><td className="es-num">0,000021 ETH</td><td className="es-num">0,00063 ETH</td></tr>
                <tr><td>Enviar un token (USDT, USDC…)</td><td className="es-num">65.000</td><td className="es-num">0,000065 ETH</td><td className="es-num">0,00195 ETH</td></tr>
                <tr><td>Cambiar una moneda por otra</td><td className="es-num">150.000</td><td className="es-num">0,00015 ETH</td><td className="es-num">0,0045 ETH</td></tr>
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            <SimboloEstudio tipo="asterisco" color="cielo" className="eth-fuente-asterisco" />
            El gas de enviar ETH (21.000) es fijo y está en el protocolo. Los otros dos son valores orientativos:
            dependen del contrato de cada token y de cada exchange.
          </p>

          <div className="gbc-body" style={{ marginTop: 26 }}>
            <p>
              Fíjate en lo que dice la tabla: la misma operación cuesta <strong><Anotacion tipo="circle" junta>treinta veces más</Anotacion></strong> con la
              red llena que con la red vacía. Por eso en Ethereum importa cuándo operas, y por eso existen las
              <Termino slug="capa-2">capas 2</Termino> que verás más abajo.
            </p>
            <p>
              Un detalle más. Desde agosto de 2021, una parte de cada comisión no la cobra nadie: se destruye.
              Con la red muy usada se destruye más ETH del que se crea, y la cantidad total baja. Con poca
              actividad ocurre lo contrario. <Anotacion tipo="highlight" color="var(--amarillo)" grosor={2} iteraciones={1} retraso={300}>A diferencia de Bitcoin, ETH no tiene un tope máximo de monedas.</Anotacion>
            </p>
          </div>
        </div>
      </section>

      {/* ── 4 · Staking ── */}
      <section id="staking" className="gbc-section">
        <div className="gbc-gc gbc-margen">
          <div className="gbc-ey">Quién mantiene la red</div>
          <h2 className="gbc-title">Del minado al staking: cómo se protege Ethereum</h2>
          <div className="gbc-body">
            <p>
              Hasta 2022, Ethereum se validaba con minería, la misma
              <Termino slug="prueba-de-trabajo"> prueba de trabajo</Termino> de Bitcoin: ordenadores gastando
              electricidad para ganarse el derecho a escribir el siguiente bloque. El 15 de septiembre de 2022, en
              una actualización llamada <strong><Anotacion tipo="box" color="var(--lila)" grosor={2} relleno={[1, 5]} junta>The Merge</Anotacion></strong>, la red cambió de sistema sin detenerse.
            </p>
            <p>
              Desde entonces usa la <Termino slug="prueba-de-participacion">prueba de participación</Termino>. <Anotacion tipo="highlight" color="var(--amarillo)" grosor={2} iteraciones={1} retraso={300}>En
              lugar de electricidad, se arriesga dinero</Anotacion>: un <Termino slug="validador">validador</Termino> bloquea
              ETH como fianza y, a cambio, cobra por proponer y comprobar bloques. Si hace trampas, la red le
              quita parte de esa fianza. Según la Fundación Ethereum, el cambio redujo el consumo de energía de
              la red en torno a un 99,95 %.
            </p>
            <p>
              Montar un validador propio pide 32 ETH y un ordenador encendido siempre. Para el resto existe el
              <Termino slug="staking"> staking</Termino> <Termino slug="delegacion">delegado</Termino>: dejas tu ETH a un servicio que lo junta con el
              de otros y reparte lo que gana, quedándose una comisión.
            </p>
          </div>
          <Postit color="coral" giro={1.5}>
            <SimboloEstudio tipo="exclamacion" color="coral" className="postit-esquina" retraso={400} />
            <div className="postit-titulo">El staking no es una cuenta de ahorro</div>
            <div className="postit-cuerpo">
              <p>Lo que rinde se paga en ETH, y el ETH sube y baja. <Anotacion tipo="underline" color="var(--coral)" grosor={2} animar={false}>Un 3 % anual en ETH no compensa una caída del
              40 % en su precio.</Anotacion> Además, retirar puede tardar días cuando mucha gente quiere salir a la vez, y si
              haces staking a través de un intermediario, dependes de que ese intermediario no falle.</p>
            </div>
          </Postit>
        </div>
      </section>

      {/* ── Anuncio de media guía ── */}
      <GuiaAnuncio producto="portfolio" variante="compacto" estado={d.estado} />

      {/* ── 5 · Capas 2 ── */}
      <section id="capas-2" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Por qué hay tantas redes</div>
          <h2 className="gbc-title">Qué son las capas 2 de Ethereum y por qué existen</h2>
          <div className="gbc-body">
            <p>
              Ethereum procesa solo unas decenas de operaciones por segundo. Cuando mucha gente quiere usarlo a la vez, no
              cabe todo el mundo y las comisiones se disparan. La solución que eligió la red no fue hacerse más
              grande, sino dejar que otras redes trabajen por encima de ella.
            </p>
            <p>
              <Anotacion tipo="bracket" lados="left" color="var(--lila)" relleno={[2, 6, 2, 6]} iteraciones={1}>Una <strong>capa 2</strong> es una red aparte que agrupa miles de operaciones, las procesa fuera y
              apunta en Ethereum solo el resultado.</Anotacion> Arbitrum, Optimism, Base o zkSync son capas 2. Operar en ellas
              cuesta céntimos, y <Anotacion tipo="highlight" color="var(--amarillo)" grosor={2} iteraciones={1} retraso={500}>la seguridad de fondo la sigue poniendo Ethereum</Anotacion>.
            </p>
            <p>
              Casi todas las actualizaciones recientes van en esa dirección: abaratar el espacio que las capas 2
              alquilan a Ethereum.
            </p>
          </div>

          <ol className="eth-hitos">
            {HITOS.map((h) => (
              <li key={h.nombre}>
                {h.nombre === "The Merge" && <SimboloEstudio tipo="estrella" className="eth-hito-estrella" semilla={8} />}
                <span className="eth-hito-fecha">{h.fecha}</span>
                <span className="eth-hito-cuerpo"><strong>{h.nombre}</strong>{h.que}</span>
              </li>
            ))}
          </ol>
          <p className="gbc-fuente">
            Fechas de activación en la red principal, según ethereum.org. La siguiente actualización, Glamsterdam,
            seguía en pruebas en octubre de 2026 (CoinDesk, 8 de octubre de 2026) y no tenía fecha confirmada.
          </p>
        </div>
      </section>

      {/* ── 6 · Ethereum y Bitcoin ── */}
      <section id="bitcoin" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">La comparación de siempre</div>
          <h2 className="gbc-title">Diferencias entre Ethereum y Bitcoin</h2>
          <div className="gbc-body">
            <p>
              <Anotacion tipo="bracket" lados="left" color="var(--menta)" relleno={[2, 6, 2, 6]} iteraciones={1}>
                No compiten por lo mismo. Bitcoin quiere ser dinero escaso y difícil de cambiar. Ethereum quiere
                ser una plataforma donde se construyen cosas, y por eso cambia a menudo.
              </Anotacion>
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th></th><th>Bitcoin</th><th>Ethereum</th></tr></thead>
              <tbody>
                <tr><td><strong>Para qué nació</strong></td><td>Dinero sin banco central</td><td>Ejecutar programas sin intermediarios</td></tr>
                <tr><td><strong>Cómo se valida</strong></td><td>Minería (prueba de trabajo)</td><td>Staking (prueba de participación)</td></tr>
                <tr><td><strong>Cuántas monedas habrá</strong></td><td>21 millones, ni una más</td><td><Anotacion tipo="circle" relleno={[4, 8]} junta>Sin tope</Anotacion>; parte de las comisiones se destruye</td></tr>
                <tr><td><strong>Un bloque nuevo</strong></td><td>Cada 10 minutos, de media</td><td>Cada 12 segundos</td></tr>
                <tr><td><strong>Con qué frecuencia cambia</strong></td><td>Muy poco, a propósito</td><td>Una o dos actualizaciones grandes al año</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 7 · Errores ── */}
      <section id="errores" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">El error típico</div>
          <h2 className="gbc-title">Los tres errores que más dinero cuestan en Ethereum</h2>
          <div className="gbc-body">
            <p>Ninguno tiene que ver con el precio. Los tres ocurren al mover monedas, y los tres se pueden evitar.</p>
          </div>
          <div className="eth-errores">
            <div className="eth-error">
              <span className="eth-error-n"><SimboloEstudio tipo="aro" color="coral" className="eth-error-aro" semilla={21} animar={false} />1</span>
              <h3><Anotacion tipo="strike-through" color="var(--coral)" iteraciones={1}>Enviar por la red equivocada</Anotacion></h3>
              <p>La misma dirección sirve en Ethereum y en sus capas 2, así que es fácil retirar de un
              <Termino slug="exchange"> exchange</Termino> por una red y esperar el dinero en otra. <SimboloEstudio tipo="check" color="menta" className="eth-error-check" animar={false} />Antes de
              enviar, comprueba que la red de salida y la de llegada son la misma, y manda primero una cantidad
              pequeña de prueba.</p>
            </div>
            <div className="eth-error">
              <span className="eth-error-n"><SimboloEstudio tipo="aro" color="coral" className="eth-error-aro" semilla={22} animar={false} />2</span>
              <h3><Anotacion tipo="strike-through" color="var(--coral)" iteraciones={1} retraso={250}>Quedarse sin ETH para el gas</Anotacion></h3>
              <p><Anotacion tipo="underline" color="var(--lila)" grosor={2} animar={false}>Las comisiones se pagan siempre en ETH, también cuando lo que mueves es otra moneda.</Anotacion> Quien
              tiene 500 USDC en su <Termino slug="wallet">cartera</Termino> y cero ETH no puede moverlos. <SimboloEstudio tipo="check" color="menta" className="eth-error-check" semilla={4} animar={false} />Deja
              siempre un poco de ETH para pagar la salida.</p>
            </div>
            <div className="eth-error">
              <span className="eth-error-n"><SimboloEstudio tipo="aro" color="coral" className="eth-error-aro" semilla={23} animar={false} />3</span>
              <h3><Anotacion tipo="strike-through" color="var(--coral)" iteraciones={1} retraso={500}>Dar permisos sin límite</Anotacion></h3>
              <p>Para usar una aplicación, primero le das permiso para mover tus tokens. Muchas piden permiso
              ilimitado, y ese permiso sigue vivo cuando ya no la usas. Si la aplicación resulta ser una estafa
              o la atacan, pueden vaciarte esa moneda. <SimboloEstudio tipo="flecha" color="azul" className="eth-error-check" giro={-30} semilla={6} animar={false} />Es lo que explica la ficha de la
              <Termino slug="aprobacion-de-token"> aprobación de tokens</Termino>.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8 · Hacienda ── */}
      <section id="hacienda" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Desde España</div>
          <h2 className="gbc-title">Ethereum y Hacienda: lo que cambia si declaras en España</h2>
          <div className="gbc-body">
            <p>
              <SimboloEstudio tipo="exclamacion" color="naranja" margen semilla={9} />
              <Anotacion tipo="underline" color="var(--menta)" retraso={200}>Tener ETH guardado no tributa.</Anotacion> Lo que cuenta es lo que haces con él, y en Ethereum se hacen dos
              cosas que mucha gente no sabe que tributan:
            </p>
            <ul>
              <li><strong><Anotacion tipo="underline" color="var(--lila)" retraso={500}>Cambiar ETH por otra moneda es una venta.</Anotacion></strong> Aunque no pases por euros, Hacienda lo trata como una permuta: calculas lo que has ganado o perdido en ese momento.</li>
              <li><strong><Anotacion tipo="highlight" color="var(--amarillo)" grosor={2} iteraciones={1} animar={false}>Lo que rinde el staking se declara al recibirlo.</Anotacion></strong> Según el criterio de la Dirección General de Tributos (consulta V1766-22), es un rendimiento del capital mobiliario, valorado en euros el día que lo cobras.</li>
            </ul>
            <p>
              El detalle, con los tramos y el método de cálculo, está en la guía de
              <Link href="/guias/fiscalidad-cripto-espana"> fiscalidad de las criptomonedas en España</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* ── 9 · Riesgos ── */}
      <section id="riesgos" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que puede salir mal</div>
          <h2 className="gbc-title">Los riesgos de Ethereum, sin maquillaje</h2>
          <div className="gbc-body">
            <ul>
              <li><strong>El precio.</strong> ETH <Anotacion tipo="underline" color="var(--coral)" retraso={200}>ha caído más de un 70 % desde máximos en más de una ocasión</Anotacion>. Esa <Termino slug="volatilidad">volatilidad</Termino> no es un accidente: es lo normal en este activo.</li>
              <li><strong>La competencia.</strong> Redes más rápidas y baratas le disputan las aplicaciones, y sus propias capas 2 se quedan con comisiones que antes cobraba Ethereum.</li>
              <li><strong>La complejidad.</strong> Entre capas 2, <Termino slug="bridge">puentes</Termino> y permisos, es fácil equivocarse. Los tres errores de arriba salen de ahí.</li>
              <li><strong>La concentración del staking.</strong> Una parte grande del ETH en staking pasa por unos pocos servicios. Si uno falla, afecta a muchos a la vez.</li>
              <li><strong>Los fallos de código.</strong> <Anotacion tipo="highlight" color="var(--amarillo)" grosor={2} iteraciones={1} retraso={300}>Ethereum como red no ha sido vulnerada, pero las aplicaciones que corren encima sí</Anotacion>, y con frecuencia.</li>
            </ul>
          </div>
          <DisclaimerRiesgo variante="general" />
        </div>
      </section>

      {/* ── Anuncio final: tras el contenido y antes del quiz ── */}
      <GuiaAnuncio producto="cursos" estado={d.estado} />

      {/* ── QUIZ ── */}
      <section id="quiz" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Quiz final</div>
          <h2 className="gbc-title">Comprueba lo que sabes de Ethereum</h2>
          <div className="gbc-body" style={{ marginBottom: 32 }}>
            <p>Cinco preguntas. Con las cinco acertadas desbloqueas el logro <strong className="gbc-logro">Ordenador Mundial</strong>. Puedes releer cualquier sección antes de responder.</p>
          </div>
          {d.isRegistered ? <GuideEthereumQuiz /> : <GuideQuizCuenta slug={SLUG} />}
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
