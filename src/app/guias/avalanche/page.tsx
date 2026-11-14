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
import GuideAvalancheStaking from "./GuideAvalancheStaking";
import GuideAvalancheQuiz from "./GuideAvalancheQuiz";
import "./avalanche.css";

/**
 * Guía «Qué es Avalanche» (14-11-2026). Consulta objetivo: «qué es avalanche».
 *
 * La consulta es ambigua (también es un grupo, un coche, un fenómeno de
 * montaña): el H1 y el primer párrafo dicen desde la primera línea que se
 * habla de la criptomoneda AVAX.
 *
 * Lo que tiene y las demás no: una calculadora del staking con la fórmula
 * oficial y los cambios de Helicon (22-09-2026: validar desde 48 horas, 90 %
 * de tiempo activo, tasa mínima del 7,5 %), que ninguna guía en español
 * recoge; el error de enviar AVAX por la cadena equivocada; y los datos de
 * uso real de las L1, no solo la promesa.
 *
 * Auditoría SEO y verificación de cifras en fuentes primarias: 14-11-2026.
 *
 * Datos leídos en la P-Chain el 14-11-2026 (api.avax.network):
 * getCurrentSupply 476,56 M; 603 validadores con 216,07 M AVAX en staking
 * (45,8 M delegados en 43.358 delegaciones); comisión mediana del 5 %; los 15
 * mayores reúnen más del 20 % del peso. Precio y oferta: CoinGecko, misma
 * fecha. Actividad, quema y tokenización: Blockworks Advisory, informe del
 * tercer trimestre de 2026. Al revisar la guía, se vuelve a leer todo eso.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/guias/avalanche" },
  title: "Qué es Avalanche (AVAX): cadenas, L1 y staking",
  description:
    "Qué es Avalanche (AVAX), la red de tres cadenas compatible con Ethereum: cómo funciona, sus L1, lo que rinde el staking (con calculadora) y qué pide Hacienda.",
  openGraph: {
    title: "Qué es Avalanche (AVAX): las tres cadenas, las L1 y lo que rinde el staking",
    description:
      "Para qué sirven la X, la P y la C, cómo decide la red preguntando a 20 validadores al azar, quién usa sus L1 y cuánto rinde bloquear AVAX tras Helicon. Con quiz.",
    type: "article",
  },
};

const SLUG = "avalanche";

const SECCIONES = [
  { id: "que-es", label: "Qué es" },
  { id: "cadenas", label: "Las tres cadenas" },
  { id: "consenso", label: "Consenso" },
  { id: "l1", label: "Las L1" },
  { id: "usos", label: "Para qué se usa" },
  { id: "moneda", label: "La moneda AVAX" },
  { id: "staking", label: "Staking" },
  { id: "hacienda", label: "Hacienda" },
  { id: "riesgos", label: "Riesgos" },
  { id: "quiz", label: "Quiz" },
];

const CADENAS = [
  {
    letra: "X",
    nombre: "X-Chain",
    para: "Crear e intercambiar activos",
    direccion: "X-avax1…",
    texto: "Guarda y mueve AVAX y otros activos con reglas sencillas. Es rápida y barata, pero no ejecuta programas. Desde abril de 2023 ordena sus operaciones en una cadena lineal, como las otras dos.",
  },
  {
    letra: "P",
    nombre: "P-Chain",
    para: "Coordinar a los validadores",
    direccion: "P-avax1…",
    texto: <>Lleva la cuenta de quién valida, cuánto tiene en <Termino slug="staking">staking</Termino> y qué L1 existen. Aquí se bloquean los AVAX para hacer staking y aquí se da de alta una red nueva.</>,
  },
  {
    letra: "C",
    nombre: "C-Chain",
    para: "Ejecutar contratos inteligentes",
    direccion: "0x…",
    texto: <>Es la cadena que usa casi todo el mundo: aplicaciones, <Termino slug="stablecoin">stablecoins</Termino>, fondos <Termino slug="tokenizacion">tokenizados</Termino>. Funciona como Ethereum, con sus mismas <Termino slug="wallet">carteras</Termino> y sus mismos contratos.</>,
  },
];

const L1_ACTIVAS = [
  { nombre: "Gunzilla (GUNZ)", que: "Videojuego de disparos Off the Grid", cifra: "39,3 millones de operaciones" },
  { nombre: "Dexalot", que: <><Termino slug="dex">Exchange descentralizado</Termino> con <Termino slug="libro-de-ordenes">libro de órdenes</Termino></>, cifra: "20,7 millones de operaciones" },
  { nombre: "Henesys", que: "MapleStory Universe, del estudio Nexon", cifra: "15,8 millones de operaciones" },
];

export default async function AvalanchePage() {
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
          Qué es Avalanche (AVAX), la criptomoneda<br />
          <span className="gbc-hero-gold">y la red de tres cadenas que hay detrás</span>
        </h1>
        <p className="gbc-respuesta">
          <strong>Avalanche es una blockchain para ejecutar aplicaciones, y AVAX es su criptomoneda.</strong> Se
          divide en tres cadenas con tareas distintas, y la que más se usa, la C-Chain, funciona igual que Ethereum.
          Confirma las operaciones en torno a un segundo preguntando a validadores elegidos al azar, y deja que
          cualquier empresa monte su propia red conectada a ella. AVAX paga las comisiones, que se queman, y se
          bloquea en staking para proteger la red.
        </p>
        <p className="gbc-revisado">Revisada el <strong>14 de noviembre de 2026</strong> · Datos leídos en la propia red ese día</p>
        <div className="gbc-hero-pills">
          <span className="gbc-pill">Calculadora del staking, ya con Helicon</span>
          <span className="gbc-pill">Qué cadena elegir al enviar AVAX</span>
          <span className="gbc-pill">Quiz con logro</span>
        </div>
      </header>

      {/* ── 1 ── */}
      <section id="que-es" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo básico</div>
          <h2 className="gbc-title">Qué es Avalanche y quién está detrás</h2>
          <div className="gbc-body">
            <p>
              Si has buscado «qué es Avalanche» pensando en criptomonedas, es esto: una
              <Termino slug="blockchain"> blockchain</Termino> de <Termino slug="capa-1">primera capa</Termino>, con
              red y <Termino slug="validador">validadores</Termino> propios, sobre la que se ejecutan <Termino slug="smart-contract">contratos inteligentes</Termino>. Su moneda se llama AVAX.
              No tiene relación con el grupo de música, el coche ni las avalanchas de nieve.
            </p>
            <p>
              La red principal de Avalanche arrancó el 21 de septiembre de 2020. La desarrolló Ava Labs, una empresa
              de Nueva York fundada por Emin Gün Sirer, profesor de informática en la Universidad Cornell, junto a
              Kevin Sekniqi y Ted Yin. Hoy la impulsan Ava Labs y la Fundación Avalanche, pero el código es abierto y
              cualquiera con AVAX suficientes puede validar.
            </p>
            <p>
              Avalanche compite en la misma liga que <Link href="/guias/ethereum">Ethereum</Link>,{" "}
              <Link href="/guias/solana">Solana</Link> o <Link href="/guias/near">NEAR</Link>: redes donde se construyen aplicaciones
              de dinero. Su rasgo propio no es ser la más rápida, sino la forma de organizarse. Divide el trabajo en
              tres cadenas y permite que cada empresa tenga una red a medida sin salir del ecosistema.
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Dato</th><th>Valor el 14 de noviembre de 2026</th></tr></thead>
              <tbody>
                <tr><td><strong>Precio</strong></td><td>7,22 euros (7,96 dólares)</td></tr>
                <tr><td><strong><Termino slug="market-cap">Capitalización</Termino></strong></td><td>Unos 3.224 millones de euros, puesto 25</td></tr>
                <tr><td><strong><Termino slug="ath">Máximo histórico</Termino></strong></td><td>144,96 dólares, el 21 de noviembre de 2021: hoy está un 94,5 % por debajo</td></tr>
                <tr><td><strong>AVAX que existirán como máximo</strong></td><td>720 millones</td></tr>
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">Precio, capitalización y máximo: CoinGecko, 14 de noviembre de 2026. Tope de emisión: documentación oficial de Avalanche.</p>
        </div>
      </section>

      {/* ── 2 ── */}
      <section id="cadenas" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Cómo está montada</div>
          <h2 className="gbc-title">Las tres cadenas de Avalanche: X, P y C</h2>
          <div className="gbc-body">
            <p>
              Avalanche no es una cadena, sino tres, que juntas forman lo que el proyecto llama la red primaria. Cada
              una hace un trabajo, tiene su propio saldo y su propio formato de dirección. Los validadores de
              Avalanche mantienen las tres a la vez.
            </p>
          </div>
          <div className="avax-cadenas">
            {CADENAS.map((c) => (
              <div key={c.letra} className="avax-cadena">
                <span className="avax-cadena-letra" aria-hidden="true">{c.letra}</span>
                <strong>{c.nombre}</strong>
                <span className="avax-cadena-para">{c.para}</span>
                <p>{c.texto}</p>
                <span className="avax-cadena-dir">Dirección: <code>{c.direccion}</code></span>
              </div>
            ))}
          </div>

          <div className="gbc-body" style={{ marginTop: 26 }}>
            <h3 className="gbc-sub">Por qué la C-Chain es compatible con Ethereum</h3>
            <p>
              La C-Chain ejecuta la máquina virtual de Ethereum, la <Termino slug="evm">EVM</Termino>: el mismo
              «procesador» que interpreta los programas de Ethereum. Un contrato
              escrito para Ethereum funciona en Avalanche sin reescribirlo. Las direcciones tienen el mismo formato,
              0x seguido de 40 caracteres, y MetaMask se conecta añadiendo la red con su identificador, el 43114.
            </p>
            <p>
              Fue una decisión comercial tanto como técnica. En 2020 casi todos los programadores de este sector
              escribían para Ethereum. Hablar su idioma permitió a Avalanche atraer aplicaciones que ya existían, en
              lugar de esperar a que alguien aprendiera un lenguaje nuevo.
            </p>
            <p>
              Ser compatible no significa ser parte de Ethereum. Avalanche no es una
              <Termino slug="capa-2"> capa 2</Termino>: no apunta nada en Ethereum ni toma prestada su seguridad. Tus
              ETH no aparecen en Avalanche, y un USDC de Avalanche no es el mismo que uno de Ethereum aunque tu
              cartera use la misma dirección en las dos.
            </p>
          </div>

          <div className="gbc-box gbc-box--red">
            <div className="gbc-box-title">El error típico: enviar AVAX por la cadena que no toca</div>
            <div className="gbc-box-body">
              <p>Al retirar AVAX de un <Termino slug="exchange">exchange</Termino>, algunos te dejan elegir entre la
              X-Chain y la C-Chain. Si lo que quieres es usar aplicaciones, elige la C-Chain: lo que llegue a la X-Chain
              no se ve en MetaMask y tendrás que traspasarlo. Y al revés: antes de enviar a un exchange, comprueba qué
              cadena acepta. Una dirección 0x es de la C-Chain; una que empieza por «X-avax1», de la X-Chain.</p>
              <p>Para hacer staking pasa lo mismo: los AVAX tienen que estar en la P-Chain. Carteras como Core, la de
              Ava Labs, hacen ese traspaso entre cadenas por ti, con una comisión mínima.</p>
            </div>
          </div>
          <p className="gbc-fuente">
            Cadenas y identificador de red: documentación de la red primaria en build.avax.network. Paso de la
            X-Chain a una cadena lineal: actualización Cortina, activada el 25 de abril de 2023.
          </p>
        </div>
      </section>

      {/* ── 3 ── */}
      <section id="consenso" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Por dentro</div>
          <h2 className="gbc-title">Cómo funciona Avalanche: preguntar a 20 validadores al azar</h2>
          <div className="gbc-body">
            <p>
              Toda blockchain necesita un <Termino slug="mecanismo-de-consenso">mecanismo de consenso</Termino>: una
              forma de que miles de ordenadores que no se fían entre sí acuerden qué ha pasado.
              <Termino slug="bitcoin"> Bitcoin</Termino> lo resuelve con
              <Termino slug="prueba-de-trabajo"> minería</Termino>. La mayoría de redes de <Termino slug="prueba-de-participacion">prueba de participación</Termino>{" "}
              lo resuelven con rondas de votación en las que participa todo el conjunto de validadores. Avalanche hace otra cosa: muestreo
              aleatorio.
            </p>
            <p>
              Funciona como un rumor que se confirma. Cada validador que duda entre
              dos bloques pregunta a 20 validadores elegidos al azar cuál prefieren. La elección se pondera por lo que
              cada uno tiene en staking. Si 15 de los 20 le dan la misma respuesta, cuenta un acierto y vuelve a
              preguntar a otros 20. Cuando suma 20 aciertos seguidos, la decisión es definitiva.
            </p>
            <p>
              Como nadie habla con todos, la red puede crecer en número de validadores sin que las rondas se alarguen.
              Y como las muestras se cruzan, en pocas vueltas toda la red acaba inclinada hacia la misma respuesta.
              Los protocolos que siguen este método forman la familia Snow; el que usan hoy las tres cadenas se llama
              Snowman.
            </p>
          </div>

          <ol className="avax-rondas" aria-label="Las tres cifras del consenso de Avalanche">
            <li><strong>20</strong><span>validadores en cada muestra, elegidos al azar según su staking</span></li>
            <li><strong>15</strong><span>respuestas iguales para que la consulta cuente como acierto</span></li>
            <li><strong>20</strong><span>aciertos seguidos para dar el bloque por definitivo</span></li>
          </ol>

          <div className="gbc-body" style={{ marginTop: 24 }}>
            <h3 className="gbc-sub">Qué significa «definitivo» y por qué importa</h3>
            <p>
              Cuando Avalanche acepta un bloque, no hay vuelta atrás: eso es la
              <Termino slug="finalidad"> finalidad</Termino>. La documentación habla de en torno a un segundo. En
              Bitcoin se suele esperar una hora, seis bloques, para darlo por seguro. En Ethereum la finalidad formal
              llega a los dos ciclos de votación, unos 13 minutos.
            </p>
            <p>
              Para ti se traduce en algo práctico. Un exchange que acepta depósitos en Avalanche puede abonarlos casi
              al momento, y una aplicación no tiene que esperar varias
              <Termino slug="confirmacion"> confirmaciones</Termino> antes de dar por buena una
              operación.
            </p>
            <p>
              El método tiene una condición, como todos: funciona mientras la mayor parte de los AVAX en staking estén
              en manos de validadores honrados. El 14 de noviembre de 2026 había 603 validadores, y los 15 mayores
              reunían más de una quinta parte del peso. No es una concentración extrema, pero tampoco es irrelevante.
            </p>
          </div>
          <p className="gbc-fuente">
            Parámetros del consenso (20, 15 y 20) y tiempo de aceptación: documentación de Avalanche, «Avalanche
            Consensus». Validadores y peso: lectura propia de la P-Chain, 14 de noviembre de 2026.
          </p>
        </div>
      </section>

      {/* ── Anuncio de media guía ── */}
      <GuiaAnuncio producto="portfolio" variante="compacto" estado={d.estado} />

      {/* ── 4 ── */}
      <section id="l1" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Redes a medida</div>
          <h2 className="gbc-title">Qué son las Avalanche L1 (antes, subredes) y quién las usa</h2>
          <div className="gbc-body">
            <p>
              Una Avalanche L1 es una blockchain propia que una empresa o un proyecto monta dentro del ecosistema. Elige
              sus validadores, sus reglas, su moneda para pagar comisiones y, si quiere, quién puede usarla. Un banco
              puede exigir que solo operen clientes identificados; un videojuego, que las comisiones se paguen con su
              propia moneda.
            </p>
            <p>
              Hasta 2024 se llamaban <Termino slug="subred">subredes</Termino>, y tenían un peaje alto: cada validador
              de una subred debía validar también la red primaria, con 2.000 AVAX bloqueados. Con el AVAX de entonces
              eran decenas de miles de euros por máquina, solo para empezar.
            </p>
            <p>
              La actualización Etna, presentada como Avalanche9000, lo cambió el 16 de diciembre de 2024. Desde
              entonces, los validadores de una L1 no tienen que bloquear los 2.000 AVAX ni validar la red primaria.
              Pagan una cuota continua a la P-Chain, que empezó en torno a 1,33 AVAX al mes por validador. Con el mismo
              cambio, la comisión mínima de la C-Chain bajó casi un 96 %.
            </p>
            <p>
              Las L1 se comunican entre sí y con la C-Chain mediante un sistema de mensajes propio de Avalanche, sin
              <Termino slug="bridge"> puentes</Termino> de terceros. Es la diferencia con montar una red totalmente
              aparte: la empresa tiene su cadena, pero no se queda aislada.
            </p>
          </div>

          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th></th><th>Avalanche L1</th><th>Capa 2 de Ethereum</th><th><Termino slug="sharding">Fragmentos</Termino> de NEAR</th></tr></thead>
              <tbody>
                <tr><td><strong>Quién la protege</strong></td><td>Sus propios validadores</td><td>Ethereum, donde apunta sus resultados</td><td>Los validadores de toda la red</td></tr>
                <tr><td><strong>Quién la crea</strong></td><td>Cualquier proyecto que pague la cuota</td><td>Cualquier proyecto, con su propio equipo</td><td>La propia red: no se crean a voluntad</td></tr>
                <tr><td><strong>Reglas propias</strong></td><td>Sí: permisos, moneda de comisiones, máquina virtual</td><td>Limitadas: hereda las de Ethereum</td><td>No</td></tr>
              </tbody>
            </table>
          </div>
          <div className="gbc-body" style={{ marginTop: 20 }}>
            <p>
              Esa libertad tiene un precio. Una capa 2 de Ethereum hereda su seguridad; los
              fragmentos de NEAR comparten la de toda la red.
              Una L1 de Avalanche con diez validadores es tan segura como esos diez validadores, ni más ni menos.
            </p>
          </div>

          <h3 className="gbc-sub avax-sub">Las L1 con más actividad, julio a septiembre de 2026</h3>
          <div className="avax-l1s">
            {L1_ACTIVAS.map((l) => (
              <div key={l.nombre}>
                <strong>{l.nombre}</strong>
                <span>{l.que}</span>
                <b>{l.cifra}</b>
              </div>
            ))}
          </div>
          <p className="gbc-fuente">
            Etna y cuota de las L1: blog de Avalanche, diciembre de 2024. Actividad de las L1: Blockworks Advisory,
            informe del tercer trimestre de 2026.
          </p>
        </div>
      </section>

      {/* ── 5 ── */}
      <section id="usos" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que hay de verdad</div>
          <h2 className="gbc-title">Para qué se usa Avalanche hoy: fondos tokenizados, juegos y pagos</h2>
          <div className="gbc-body">
            <p>
              El uso que más ha crecido en Avalanche no es especulativo. Es la tokenización: convertir un activo tradicional, como una
              participación en un fondo de deuda pública, en una ficha que se mueve por la cadena.
            </p>
            <ul>
              <li><strong>Fondos de gestoras grandes.</strong> A 30 de septiembre de 2026 había 1.220 millones de dólares en activos tokenizados en la C-Chain, cuarta de 24 redes medidas. El mayor es BUIDL, el fondo de BlackRock: 486,5 millones de dólares solo en Avalanche.</li>
              <li><strong>Redes de valores en Japón y Estados Unidos.</strong> Progmat, la plataforma japonesa de valores tokenizados, terminó de mudarse a su propia L1 en julio de 2026. Dinari ofrece acciones estadounidenses tokenizadas desde la suya.</li>
              <li><strong>Videojuegos.</strong> Las tres L1 más activas incluyen dos juegos. Cada partida genera muchas operaciones pequeñas, y una red propia evita competir por espacio con el resto.</li>
              <li><strong>Pagos con stablecoins.</strong> En la C-Chain circulaban 2.560 millones de dólares en 26 monedas estables, y hay tarjetas Visa que gastan ese saldo.</li>
              <li><strong>Finanzas descentralizadas.</strong> Las aplicaciones de <Termino slug="defi">DeFi</Termino> de la C-Chain movieron 6.640 millones de dólares en sus exchanges descentralizados durante el trimestre, un 20 % menos que en el anterior. El 80 % pasó por uno solo, Pharaoh.</li>
            </ul>
            <p>
              Ahora, la otra cara. La actividad del público en la C-Chain va a menos. Las direcciones activas al día
              pasaron de unas 621.000 de media en el segundo trimestre de 2026 a unas 144.000 en el tercero, y las
              operaciones cayeron un 19 %. Avalanche está ganando empresas y perdiendo, por ahora, usuarios de a pie.
            </p>
          </div>
          <p className="gbc-fuente">
            Todas las cifras: Blockworks Advisory, informe del tercer trimestre de 2026 (datos a 30 de septiembre).
            Son las publicadas para el ecosistema; no las hemos auditado.
          </p>
        </div>
      </section>

      {/* ── 6 ── */}
      <section id="moneda" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">La moneda</div>
          <h2 className="gbc-title">AVAX: un tope de 720 millones y comisiones que se queman</h2>
          <div className="gbc-body">
            <p>
              AVAX tiene tres usos: pagar comisiones en las tres cadenas, bloquearse en staking para validar, y pagar la
              cuota de los validadores de las L1. Su oferta tiene dos reglas que se citan mucho y se explican poco.
            </p>
            <h3 className="gbc-sub">El tope</h3>
            <p>
              Nunca habrá más de 720 millones de AVAX. La mitad, 360 millones, se creó al arrancar en 2020. La otra
              mitad se va creando para pagar las recompensas del staking, cada vez más despacio: la fórmula reparte una
              fracción de lo que falta por emitir, así que cuanto más cerca está el tope, menos se crea.
            </p>
            <p>
              El 14 de noviembre de 2026 la P-Chain registraba 476,56 millones emitidos. Quedaban 243 millones por
              crear, algo menos de la mitad de lo que ya existe.
            </p>
            <h3 className="gbc-sub">La quema</h3>
            <p>
              Toda comisión que pagas en AVAX en la red primaria se destruye: no va a ningún validador. Es una
              <Termino slug="quema-de-tokens"> quema de tokens</Termino> total, no parcial como en Ethereum. El
              contador de la P-Chain no descuenta lo quemado, y por eso CoinGecko daba ese día una oferta total de
              471,4 millones: unos 5 millones menos que lo emitido.
            </p>
          </div>

          <div className="avax-balanza">
            <div className="es-crea">
              <span>Creados en recompensas</span>
              <strong>2,62 millones de AVAX</strong>
              <small>Julio a septiembre de 2026</small>
            </div>
            <div className="es-quema">
              <span>Quemados en comisiones de la C-Chain</span>
              <strong>59.126 AVAX</strong>
              <small>El mismo trimestre: unas 44 veces menos</small>
            </div>
          </div>

          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              La cuenta es clara: la quema existe, pero hoy no frena casi nada, y AVAX sigue teniendo
              <Termino slug="inflacion"> inflación</Termino>: cada trimestre hay más en circulación. Lo que limita la
              emisión es el tope de 720 millones, no la quema. Para que la balanza se diera la vuelta, la red tendría que cobrar
              decenas de veces más comisiones que ahora.
            </p>
          </div>
          <p className="gbc-fuente">
            Tope y emisión inicial: documentación de Avalanche, «AVAX token». Emitidos: P-Chain (getCurrentSupply),
            14 de noviembre de 2026. Oferta total: CoinGecko, misma fecha. Recompensas y quema: Blockworks Advisory,
            tercer trimestre de 2026.
          </p>
        </div>
      </section>

      {/* ── 7 ── */}
      <section id="staking" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que cambió en septiembre de 2026</div>
          <h2 className="gbc-title">Staking de AVAX: cuánto rinde, cuánto pide y qué cambió con Helicon</h2>
          <div className="gbc-body">
            <p>
              Hacer staking en Avalanche es bloquear AVAX en la P-Chain durante un
              plazo fijo. Hay dos maneras: montar tu propio validador o hacer una
              <Termino slug="delegacion"> delegación</Termino> en el de otro, que se queda una comisión. La
              actualización Helicon, activada el 22 de septiembre de 2026, cambió varias reglas que casi ninguna guía
              en español recoge todavía.
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th></th><th>Validar</th><th>Delegar</th></tr></thead>
              <tbody>
                <tr><td><strong>Mínimo</strong></td><td>2.000 AVAX</td><td>25 AVAX</td></tr>
                <tr><td><strong>Plazo</strong></td><td>De 48 horas a 1 año (antes de Helicon, desde 2 semanas)</td><td>De 2 semanas a 1 año, dentro del plazo del validador</td></tr>
                <tr><td><strong>Salida anticipada</strong></td><td>No existe</td><td>No existe</td></tr>
                <tr><td><strong>Condición para cobrar</strong></td><td><Termino slug="nodo">Nodo</Termino> activo el 90 % del tiempo (antes, el 80 %)</td><td>Que tu validador cumpla esa misma condición</td></tr>
                <tr><td><strong>Comisión</strong></td><td>Cobras la de tus delegadores</td><td>Pagas la del validador, del 2 % en adelante</td></tr>
                <tr><td><strong>Renovación automática</strong></td><td>Sí, desde Helicon</td><td>No</td></tr>
              </tbody>
            </table>
          </div>

          <div className="gbc-body" style={{ marginTop: 24 }}>
            <h3 className="gbc-sub">Sin castigo, pero todo o nada</h3>
            <p>
              Avalanche no aplica <Termino slug="slashing">slashing</Termino>: la red no te quita lo depositado aunque
              el validador falle o se porte mal. Lo dice su documentación con todas las letras: el validador recupera
              su depósito entero. Lo que pierde es la recompensa, y la pierde entera: por debajo del 90 % de tiempo
              activo no hay pago parcial. Si delegas, tu recompensa depende de ese mismo validador.
            </p>
            <h3 className="gbc-sub">El plazo pesa más de lo que parece</h3>
            <p>
              La fórmula de Avalanche paga más por año cuanto más largo es el bloqueo. Helicon ha ensanchado esa
              diferencia: la tasa del plazo más corto baja del 10 % al 7,5 % de forma gradual hasta el 21 de diciembre
              de 2026, y la del año entero se queda en el 12 %. Cada bloqueo se queda con la tasa del día en que
              empieza. Con la oferta de hoy y la tasa final, un año bloqueado rinde en torno a un 6,1 %; dos semanas
              renovadas una y otra vez, alrededor de un 4 % anual.
            </p>
          </div>

          <GuideAvalancheStaking />

          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Un ejemplo con los valores por defecto de la calculadora. Delegas 1.000 AVAX durante un año en un
              validador con la comisión mediana de la red, un 5 %. Al terminar recibes unos 58 AVAX además de los tuyos,
              un 5,8 %. Si delegas solo dos semanas, recibes 1,43 AVAX, y tienes los 1.000 libres antes. A cambio de esa
              libertad renuncias a cerca de un tercio del rendimiento anual.
            </p>
            <p>
              El 14 de noviembre de 2026 había 216,1 millones de AVAX en staking, un 45 % de lo emitido, repartidos
              entre 603 validadores y 43.358 delegaciones.
            </p>
          </div>

          {/* EXPERIENCIA DEL ADMIN: si el admin hace o ha hecho staking de AVAX (delegando desde Core o desde un
              exchange), aquí encaja su caso real: cuánto delegó, en qué validador o plataforma, qué plazo eligió y
              cuánto recibió de verdad al terminar frente a lo que dice esta calculadora. Con fechas y cifras propias. */}

          <div className="gbc-box gbc-box--red">
            <div className="gbc-box-title">El rendimiento está en AVAX, y AVAX está un 94 % por debajo de su máximo</div>
            <div className="gbc-box-body">
              <p>Un 6 % al año en AVAX no compensa una caída del precio, y durante el plazo no puedes vender lo
              bloqueado. Además, cada AVAX nuevo que reparte el staking aumenta la oferta: quien no hace staking ve
              cómo su parte de la red se encoge un poco cada año.</p>
            </div>
          </div>
          <p className="gbc-fuente">
            Reglas de staking y de Helicon (ACP-236, 267, 273 y 285): documentación de Avalanche, «Helicon Upgrade» y
            «How to stake», consultadas el 14 de noviembre de 2026. Ausencia de slashing y recompensa del delegador
            ligada al tiempo activo del validador: documentación de Avalanche, «Avalanche Consensus» y «AVAX Staking
            for Finance Professionals». Staking, validadores y comisión mediana: lectura propia de la P-Chain, 14 de
            noviembre de 2026. Rendimientos: cálculo propio con la fórmula oficial.
          </p>
        </div>
      </section>

      {/* ── 8 ── */}
      <section id="hacienda" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Desde España</div>
          <h2 className="gbc-title">Avalanche y Hacienda: qué declarar si vives en España</h2>
          <div className="gbc-body">
            <p>
              Tener AVAX guardado no tributa. Lo que cuenta es lo que haces con ellos, y en Avalanche hay dos detalles
              propios que conviene saber antes de la declaración:
            </p>
            <ul>
              <li><strong>La recompensa del staking llega de golpe al final.</strong> En Avalanche no cobras cada día: recibes todo cuando termina el plazo. La Dirección General de Tributos trata estas recompensas como rendimiento del capital mobiliario, valorado en euros el día que las recibes (consulta V1766-22). Si bloqueas un año en noviembre de 2026, ese ingreso cae en la renta de 2027.</li>
              <li><strong>Pasar AVAX de una de tus cadenas a otra no es una venta.</strong> Mover AVAX de la X-Chain a la C-Chain dentro de tu cartera no cambia un activo por otro. Guarda igualmente el registro, porque las direcciones son distintas y tendrás que explicar el camino.</li>
              <li><strong>Cambiar AVAX por otra moneda sí es una venta</strong>, aunque no pases por euros. Hacienda lo trata como una permuta, y calculas la ganancia o la pérdida en ese momento.</li>
            </ul>
            <p>
              Si compras AVAX, hazlo en un proveedor autorizado bajo <Termino slug="mica">MiCA</Termino>, el reglamento
              europeo de criptoactivos: la CNMV publica cuáles pueden operar en España. El método de cálculo, los
              tramos y la forma de presentarlo están en la guía de
              <Link href="/guias/fiscalidad-cripto-espana"> fiscalidad de las criptomonedas en España</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* ── 9 ── */}
      <section id="riesgos" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que puede salir mal</div>
          <h2 className="gbc-title">Los riesgos de Avalanche</h2>
          <div className="gbc-body">
            <ul>
              <li><strong>El precio.</strong> AVAX cotizaba el 14 de noviembre de 2026 un 94,5 % por debajo de su máximo de 2021. Esa <Termino slug="volatilidad">volatilidad</Termino> es la de cualquier <Termino slug="altcoin">altcoin</Termino>, y no la arregla ninguna tecnología.</li>
              <li><strong>La dilución.</strong> Quedan 243 millones de AVAX por crear, y la quema de comisiones no compensa ni una pequeña parte.</li>
              <li><strong>El uso de a pie, a la baja.</strong> Las direcciones activas de la C-Chain cayeron más de dos tercios en un trimestre. La tesis depende de empresas cuyos proyectos tardan años y pueden irse a otra red.</li>
              <li><strong>Pocas L1 hacen mucho.</strong> En el tercer trimestre de 2026, Gunzilla sola hizo más operaciones que las dos L1 siguientes juntas, y dos de las tres más activas son videojuegos. Si una de ellas se marcha, se nota.</li>
              <li><strong>Las L1 no heredan la seguridad.</strong> Una L1 pequeña puede tener pocos validadores, y si fallan, la red primaria no responde por ella.</li>
              <li><strong>La competencia.</strong> Ethereum con sus capas 2, Solana y otras redes buscan a las mismas gestoras y los mismos juegos.</li>
              <li><strong>El bloqueo.</strong> Lo que pones en staking no se puede sacar antes de tiempo, aunque el precio se hunda ese mismo día.</li>
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
          <h2 className="gbc-title">Comprueba lo que sabes de Avalanche</h2>
          <div className="gbc-body" style={{ marginBottom: 32 }}>
            <p>Cinco preguntas. Con las cinco acertadas desbloqueas el logro <strong style={{ color: "var(--gold)" }}>Veinte al Azar</strong>.</p>
          </div>
          {d.isRegistered ? <GuideAvalancheQuiz /> : <GuideQuizCuenta slug={SLUG} />}
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
