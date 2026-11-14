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
import GuideSuiComisiones from "./GuideSuiComisiones";
import GuideSuiQuiz from "./GuideSuiQuiz";
import "./sui.css";

/**
 * Guía «Qué es Sui» (14-11-2026). Consulta objetivo: «qué es sui».
 *
 * La consulta es ambigua («sui» es también latín jurídico): el H1 y la
 * respuesta dicen desde la primera línea que se habla de la criptomoneda.
 *
 * Lo que tiene y las demás no: una calculadora de comisiones con la
 * devolución del fondo de almacenamiento, el hackeo de Cetus y la congelación
 * por los validadores contados como prueba de descentralización, el
 * calendario oficial de circulación hasta 2030 y la cuenta de lo que rinde el
 * staking frente a lo que crece la oferta.
 *
 * Datos leídos en la red principal por GraphQL el 14-11-2026: versión de
 * protocolo 141, época 1311, precio de referencia del gas 100 MIST, 76 MIST
 * por unidad de almacenamiento, devolución del 99,99 % (9999), 125
 * validadores, 7.071,8 millones de SUI en staking, 261.685 SUI de
 * recompensas en la época 1310 y un fondo de almacenamiento de 2,76 millones
 * de SUI. Circulación: API oficial sui-circulation.suiexplorer.com. Precio:
 * CoinGecko, misma fecha. Al revisar la guía se vuelve a leer todo eso.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/guias/sui" },
  title: "Qué es Sui (SUI): cómo funciona y sus riesgos",
  description:
    "Qué es Sui, la criptomoneda SUI: objetos en vez de cuentas, comisiones que te devuelven (con calculadora), zkLogin, el hackeo de Cetus y sus desbloqueos.",
  openGraph: {
    title: "Qué es Sui (SUI): la blockchain de objetos que salió de Meta",
    description:
      "Cómo funciona Sui, cuánto cuesta usarla y cuánto te devuelve, entrar con Google, la congelación de Cetus, el calendario de desbloqueos y Hacienda. Con quiz.",
    type: "article",
  },
};

const SLUG = "sui";

const SECCIONES = [
  { id: "que-es", label: "Qué es" },
  { id: "objetos", label: "Objetos" },
  { id: "velocidad", label: "Por qué es rápida" },
  { id: "comisiones", label: "Comisiones" },
  { id: "zklogin", label: "Entrar con Google" },
  { id: "cetus", label: "El caso Cetus" },
  { id: "token", label: "Desbloqueos y staking" },
  { id: "hacienda", label: "Hacienda" },
  { id: "riesgos", label: "Riesgos" },
  { id: "quiz", label: "Quiz" },
];

const TIPOS_OBJETO = [
  {
    tipo: "Propio",
    ejemplo: "Tus monedas, tu NFT, tu entrada a un concierto",
    texto: "Tiene un único dueño y solo él puede usarlo. Es el caso más común, y el más rápido.",
  },
  {
    tipo: "Compartido",
    ejemplo: "Un fondo para cambiar monedas, una subasta",
    texto: "Cualquiera puede usarlo según las reglas de su contrato. Como varias personas lo tocan a la vez, hay que poner orden.",
  },
  {
    tipo: "Inmutable",
    ejemplo: "El código publicado de un contrato",
    texto: "Nadie puede cambiarlo, ni su creador. Se puede leer y usar sin pedir permiso a nadie.",
  },
];

export default async function SuiPage() {
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
          Qué es Sui (SUI)<br />
          <span className="gbc-hero-gold">la criptomoneda que salió del proyecto de Meta</span>
        </h1>
        <p className="gbc-respuesta">
          <strong>Sui es una blockchain para ejecutar aplicaciones, y SUI es su criptomoneda</strong>: con ella se
          pagan las comisiones, se hace staking y se vota. La crearon antiguos ingenieros de Meta que trabajaban en
          Diem. Su idea central es guardarlo todo como objetos con dueño, de modo que lo que solo es tuyo se mueve
          sin esperar turno, en menos de un segundo.
        </p>
        <p className="gbc-revisado">Revisada el <strong>14 de noviembre de 2026</strong> · Datos leídos en la propia red ese día</p>
        <div className="gbc-hero-pills">
          <span className="gbc-pill">Calculadora de comisiones y devoluciones</span>
          <span className="gbc-pill">Desbloqueos hasta 2030</span>
          <span className="gbc-pill">Quiz con logro</span>
        </div>
      </header>

      {/* ── 1 ── */}
      <section id="que-es" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo básico</div>
          <h2 className="gbc-title">Qué es Sui y quién está detrás</h2>
          <div className="gbc-body">
            <p>
              Sui es una <Termino slug="blockchain">blockchain</Termino> de
              <Termino slug="capa-1"> capa 1</Termino>: una red propia, con sus propios
              <Termino slug="validador"> validadores</Termino>, sobre la que se ejecutan
              <Termino slug="smart-contract"> contratos inteligentes</Termino>. Esos validadores se eligen por
              <Termino slug="prueba-de-participacion"> prueba de participación</Termino>: pesan más cuantos más SUI
              les confían los usuarios. Compite con Ethereum, Solana o Avalanche por alojar aplicaciones de
              finanzas, juegos y pagos.
            </p>
            <p>
              Su origen explica casi todo lo demás. En 2019 Facebook, hoy Meta, anunció Libra, una moneda digital
              para sus miles de millones de usuarios. Se rebautizó Diem y nunca llegó a lanzarse: la presión de los
              reguladores la tumbó, y Meta vendió lo que quedaba a principios de 2022.
            </p>
            <p>
              Varios ingenieros de aquel equipo se fueron en 2021 y fundaron Mysten Labs. Al frente estaban Evan
              Cheng, como consejero delegado, y Sam Blackshear, que había creado en Meta el lenguaje de
              programación de Diem. Se llevaron esa idea y construyeron Sui encima. La red principal arrancó el 3
              de mayo de 2023, y la impulsa la Sui Foundation.
            </p>
            <p>
              A 14 de noviembre de 2026 había en circulación 4.139 millones de SUI, de un máximo de 10.000 millones,
              y cada uno cotizaba a 0,69 euros según CoinGecko. Su
              <Termino slug="market-cap"> capitalización</Termino> rondaba los 2.860 millones de euros, en el puesto
              28 del mercado. El precio estaba un 86 % por debajo de su
              <Termino slug="ath"> máximo histórico</Termino> de 5,35 dólares, del 4 de enero de 2025.
            </p>
          </div>
        </div>
      </section>

      {/* ── 2 ── */}
      <section id="objetos" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">La idea que la distingue</div>
          <h2 className="gbc-title">Cómo funciona Sui: objetos en vez de cuentas</h2>
          <div className="gbc-body">
            <p>
              En casi todas las redes, lo que tienes es un número dentro de un registro. Ethereum guarda una lista
              de cuentas con su saldo, y un contrato de un token guarda otra lista: «esta dirección tiene 50». Tu
              dinero es una línea en la hoja de cálculo de otro.
            </p>
            <p>
              Sui guarda <strong>objetos</strong>. Cada moneda, cada <Termino slug="nft">NFT</Termino>, cada entrada a un concierto es una pieza
              con su propio identificador, su dueño y su versión. Si tienes 50 SUI, tienes uno o varios objetos
              moneda que suman 50, y son tuyos en el sentido más literal: la red sabe que te pertenecen sin
              consultar ninguna lista ajena. Es lo que se conoce como
              <Termino slug="modelo-de-objetos"> modelo de objetos</Termino>.
            </p>
            <p>Hay tres clases principales de objetos, y la diferencia importa porque decide cómo de rápido va cada operación:</p>
          </div>

          <div className="sui-objetos">
            {TIPOS_OBJETO.map((o) => (
              <div key={o.tipo} className="sui-objeto">
                <span className="sui-objeto-tipo">Objeto {o.tipo.toLowerCase()}</span>
                <strong>{o.ejemplo}</strong>
                <p>{o.texto}</p>
              </div>
            ))}
          </div>
          <p className="gbc-fuente">Clasificación de la documentación oficial del proyecto, apartado de objetos, consultada el 14 de noviembre de 2026.</p>

          <div className="gbc-body" style={{ marginTop: 24 }}>
            <h3 className="gbc-sub">Move, el lenguaje que heredó de Diem</h3>
            <p>
              Sus contratos se escriben en <Termino slug="lenguaje-move">Move</Termino>, el lenguaje que
              Blackshear diseñó para Diem. Su rasgo central es que trata los activos como cosas físicas: una moneda
              no se puede copiar ni hacer desaparecer por descuido. Solo se puede mover de un dueño a otro.
            </p>
            <p>
              Parece un detalle de programadores, pero ataca un tipo de error que ha costado mucho dinero en otras
              redes: el contrato que, por un fallo de cuentas, crea saldo de la nada o lo pierde. En Move, el
              compilador rechaza ese código antes de publicarlo. Aptos, otra red fundada por exempleados de Meta,
              usa una variante del mismo lenguaje.
            </p>
          </div>

          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th></th><th>Modelo de cuentas (Ethereum)</th><th>Modelo de objetos (Sui)</th></tr></thead>
              <tbody>
                <tr><td><strong>Qué tienes</strong></td><td>Un saldo apuntado en tu cuenta o en el contrato del token</td><td>Objetos con tu nombre como dueño</td></tr>
                <tr><td><strong>Quién decide si es tuyo</strong></td><td>El contrato que lleva la lista</td><td>La propia red, por el campo «dueño» del objeto</td></tr>
                <tr><td><strong>Operaciones a la vez</strong></td><td>En fila, porque todas tocan el mismo estado</td><td>En paralelo, si no tocan los mismos objetos</td></tr>
                <tr><td><strong>Lenguaje</strong></td><td>Solidity</td><td>Move</td></tr>
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Simplificación propia. Ethereum puede funcionar en paralelo en algunos casos, y la comparación detallada
            de su modelo está en la guía de <Link href="/guias/ethereum">Ethereum</Link>.
          </p>
        </div>
      </section>

      {/* ── 3 ── */}
      <section id="velocidad" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">La consecuencia</div>
          <h2 className="gbc-title">Por qué Sui es tan rápida: lo tuyo no espera turno</h2>
          <div className="gbc-body">
            <p>
              Una blockchain necesita <Termino slug="mecanismo-de-consenso">consenso</Termino>: que todos los validadores se
              pongan de acuerdo en el orden de las operaciones. Hace falta cuando dos personas quieren lo mismo a
              la vez, como el último NFT de una colección. Pero si Ana le paga a Luis con sus propias monedas, no
              hay nada que disputar: solo Ana puede gastarlas.
            </p>
            <p>
              Esta red aprovecha esa diferencia. Las operaciones que solo tocan objetos propios o inmutables van por una
              vía rápida: no necesitan que el consenso les asigne turno ni compiten con nadie. Las que tocan un
              objeto compartido, como el fondo de un <Termino slug="dex">DEX</Termino>, sí pasan por la cola y se
              ordenan con Mysticeti, su sistema de consenso.
            </p>
          </div>

          <div className="sui-vias">
            <div className="sui-via es-rapida">
              <span className="sui-via-nombre">Vía rápida</span>
              <strong>Ana le envía 20 SUI a Luis</strong>
              <p>Solo toca la moneda de Ana. Nadie más puede gastarla, así que no hay orden que discutir.</p>
            </div>
            <div className="sui-via">
              <span className="sui-via-nombre">Pasa por el consenso</span>
              <strong>Ana cambia SUI por <Termino slug="stablecoin">USDC</Termino> en un DEX</strong>
              <p>Toca el <Termino slug="liquidity-pool">fondo de liquidez</Termino>, que usan miles de personas. Hay que decidir quién llegó antes.</p>
            </div>
          </div>

          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Un matiz que muchas guías no recogen. En el diseño original, la vía rápida se saltaba el consenso por
              completo. Con Mysticeti v2, presentada en noviembre de 2025, esa validación previa se integró dentro
              del consenso para ahorrar trabajo a los validadores. Las operaciones con objetos propios siguen sin
              esperar turno, pero ya no son un circuito aparte.
            </p>
            <p>
              El resultado, según la documentación oficial, es una
              <Termino slug="finalidad"> finalidad</Termino> de entre 400 y 700 milisegundos: lo que tarda una
              operación en ser definitiva. <Link href="/guias/solana">Solana</Link> persigue la misma velocidad por
              otro camino, con una sola fila muy rápida y máquinas muy potentes. Aquí se consigue sacando de la fila
              todo lo que no necesita estar en ella.
            </p>
          </div>
          <p className="gbc-fuente">
            Vía rápida y objetos: documentación oficial sobre versiones de objetos. Mysticeti v2: blog oficial, 6 de
            noviembre de 2025. Finalidad: documentación oficial, ciclo de vida de una transacción, consultada el 14
            de noviembre de 2026.
          </p>
        </div>
      </section>

      {/* ── Anuncio de media guía ── */}
      <GuiaAnuncio producto="portfolio" variante="compacto" estado={d.estado} />

      {/* ── 4 ── */}
      <section id="comisiones" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que casi nadie explica</div>
          <h2 className="gbc-title">Cuánto cuesta usar Sui, y por qué te devuelven casi todo el almacenamiento</h2>
          <div className="gbc-body">
            <p>
              Cada operación paga dos cosas distintas en <Termino slug="gas">gas</Termino>. La primera es
              el <strong>cálculo</strong>: el trabajo de ejecutarla. La segunda es el <strong>almacenamiento</strong>:
              lo que ocupan los objetos que creas o modificas, que los validadores tendrán que guardar mientras
              existan.
            </p>
            <p>
              Lo pagado por almacenamiento no se gasta. Va a una hucha común, el
               fondo de almacenamiento, y te lo devuelven si
              borras el objeto. A 14 de noviembre de 2026 la devolución era del 99,99 %; si lees un 99 % en
              otra web, es un dato antiguo, de los primeros artículos del propio proyecto. Por eso una operación
              puede salirte gratis, o incluso darte dinero: si liberas más de lo que ocupas, la devolución supera lo
              que pagas.
            </p>
            <p>
              Los precios se miden en MIST, la unidad mínima: mil millones de MIST son 1 SUI. Ese día, cada unidad
              de cálculo costaba 100 MIST y cada byte guardado, 7.600 MIST. El cálculo se cobra por tramos, y
              una operación sencilla cae en el mínimo: 1.000 unidades, 100.000 MIST. Enviar SUI a otra persona sale por unos
              0,0011 SUI, menos de una décima de céntimo. Pon tus números:
            </p>
          </div>

          <GuideSuiComisiones />

          <div className="gbc-body" style={{ marginTop: 26 }}>
            <p>
              Fíjate en un detalle: modificar un objeto cuenta como guardarlo de nuevo. Al enviar monedas, tu moneda de
              gas se reescribe, así que pagas su nuevo almacenamiento y te devuelven el de la versión anterior. Por
              eso el ejemplo crea 260 bytes y libera 130.
            </p>
            <p>
              El sistema tiene una lógica económica clara. Guardar datos para siempre cuesta a los validadores
              disco y trabajo durante años, no solo el día en que se guardan. El fondo no reparte su saldo: solo
              lo que rinde, y la mayor parte va a los validadores para pagarles ese coste mientras dure.
              Y la devolución anima a borrar lo que ya no se usa.
            </p>
          </div>

          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Dato de la red</th><th>Valor, 14 de noviembre de 2026</th></tr></thead>
              <tbody>
                <tr><td><strong>Fondo de almacenamiento</strong></td><td>2,76 millones de SUI, unos 1,9 millones de euros</td></tr>
                <tr><td><strong>Operaciones en un día</strong></td><td>16,4 millones (época 1310, del 13 al 14 de noviembre)</td></tr>
                <tr><td><strong>Comisiones de ese día</strong></td><td>7.498 SUI en total, unos 5.200 euros</td></tr>
                <tr><td><strong>Precio de referencia del gas</strong></td><td>100 MIST por unidad de cálculo</td></tr>
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Parámetros del protocolo (versión 141) y resumen de la época 1310 leídos en la red principal por
            GraphQL el 14 de noviembre de 2026. Fórmula de comisiones y 100 unidades por byte: documentación oficial
            sobre el gas. Euros al precio de CoinGecko de ese día.
          </p>

          <div className="gbc-box gbc-box--gold">
            <div className="gbc-box-title">No es lo mismo que en NEAR</div>
            <div className="gbc-box-body">
              <p>En <Link href="/guias/near">NEAR</Link> guardar datos bloquea parte de tu saldo, que sigue siendo
              tuyo. En Sui lo pagas de verdad: sale de tu <Termino slug="wallet">cartera</Termino> y entra en el fondo. Lo que recibes al borrar es
              una devolución, no un desbloqueo. Si nunca borras nada, ese dinero ya no vuelve.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5 ── */}
      <section id="zklogin" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Sin frase semilla</div>
          <h2 className="gbc-title">¿Se puede entrar en Sui con una cuenta de Google? Así funciona zkLogin</h2>
          <div className="gbc-body">
            <p>
              Sí. La función se llama zkLogin y permite tener una dirección de Sui
              con tu cuenta de Google, Apple, Facebook o Twitch, sin apuntar una
              <Termino slug="seed-phrase"> frase semilla</Termino>. Entras en una aplicación como entrarías en
              cualquier web, y detrás hay una cartera de verdad.
            </p>
            <p>
              Funciona en tres piezas. Google firma un justificante de que eres tú. Una
              <Termino slug="prueba-de-conocimiento-cero"> prueba de conocimiento cero</Termino> demuestra a la red
              que ese justificante es válido sin enseñarle tu correo. Y un número secreto, la «sal», separa tu cuenta
              de Google de tu dirección, para que nadie pueda unir una con otra.
            </p>
            <p>
              Lo más importante para tu seguridad: Google no tiene tus fondos. No puede mover nada por su cuenta,
              porque la firma necesita también la sal. La documentación lo describe como un sistema de dos
              factores. Pero el segundo factor solo protege si la sal está fuera del alcance de tu cuenta de
              Google. Si la aplicación te la entrega al iniciar sesión con Google, quien entre en tu Google
              puede pedirla igual que tú.
            </p>
          </div>

          <div className="gbc-box gbc-box--red">
            <div className="gbc-box-title">El error típico: no saber dónde está la sal</div>
            <div className="gbc-box-body">
              <p>Si pierdes la sal, pierdes el acceso a esa dirección para siempre; lo dice así la documentación
              oficial. Muchas aplicaciones la guardan por ti, y entonces dependes de que esa empresa siga existiendo.
              Lo mismo si Google te cierra la cuenta. Antes de guardar una cantidad seria con zkLogin, pregunta quién
              guarda tu sal y añade una vía de recuperación. La documentación propone una cartera <Termino slug="multifirma">multifirma</Termino> de
              «1 de 2» con dos proveedores: si pierdes uno, entras con el otro.</p>
            </div>
          </div>
          <p className="gbc-fuente">Proveedores, sal y recuperación: documentación oficial de zkLogin, consultada el 14 de noviembre de 2026.</p>
        </div>
      </section>

      {/* ── 6 ── */}
      <section id="cetus" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">La otra cara</div>
          <h2 className="gbc-title">El hackeo de Cetus: ¿es Sui descentralizada si sus validadores pueden congelar fondos?</h2>
          <div className="gbc-body">
            <p>
              Cetus era el mayor DEX de la red. El 22 de mayo de 2025, un atacante aprovechó un fallo en una biblioteca
              de código abierto que usaban sus contratos y vació sus fondos de liquidez. Se llevó unos 223 millones de
              dólares. Fue un <Termino slug="exploit">exploit</Termino> de una aplicación, no de la red, que siguió
              funcionando.
            </p>
            <p>
              Lo que vino después es lo que hace famoso el caso. En pocas horas, los validadores se pusieron de
              acuerdo para ignorar las operaciones de las dos direcciones del atacante. Unos 162 millones quedaron
              congelados dentro de la red. Otros 56 millones ya habían salido hacia Ethereum por un
              <Termino slug="bridge"> puente</Termino>.
            </p>
          </div>

          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Cuándo</th><th>Qué pasó</th></tr></thead>
              <tbody>
                <tr><td><strong>22 de mayo de 2025</strong></td><td>El ataque a Cetus. Los validadores bloquean las direcciones del atacante</td></tr>
                <tr><td><strong>27 de mayo</strong></td><td>Se abre una votación entre validadores para recuperar lo congelado. El voto de la Sui Foundation no cuenta</td></tr>
                <tr><td><strong>29 de mayo</strong></td><td>Se aprueba con el 90,9 % de los votos, que pesan según las monedas que respalda cada validador</td></tr>
                <tr><td><strong>Después</strong></td><td>Una actualización de la red mueve los fondos, sin la firma del atacante, a una cartera multifirma de Cetus, la Sui Foundation y la empresa de seguridad OtterSec, para devolverlos a los afectados</td></tr>
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Votación, umbral y cartera de destino: blog oficial, 27 de mayo de 2025. Cifras congeladas y enviadas a
            Ethereum: The Block, 30 de mayo de 2025.
          </p>

          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>Hay dos formas de leerlo, y las dos son ciertas.</p>
            <ul>
              <li><strong>La buena noticia.</strong> Los usuarios recuperaron la mayor parte de lo robado. En la mayoría de los hackeos de <Termino slug="defi">DeFi</Termino>, el dinero no vuelve nunca.</li>
              <li><strong>La incómoda.</strong> Se demostró que un grupo de validadores puede, en horas, bloquear una dirección y mover sus fondos sin su firma. Esta vez fue contra un ladrón. La herramienta no distingue.</li>
            </ul>
            <p>
              La pregunta que deja es la que se hace a cualquier red: ¿quién puede cambiar las reglas, y cuánto le
              cuesta ponerse de acuerdo? En Sui, a 14 de noviembre de 2026, la respuesta son 125 validadores. Para
              comparar: en Bitcoin, algo así exigiría poner de acuerdo a miles de <Termino slug="nodo">nodos</Termino> y <Termino slug="minero">mineros</Termino> repartidos por el
              mundo, y su <Termino slug="gobernanza">gobernanza</Termino> es lenta precisamente por eso.
            </p>
          </div>
        </div>
      </section>

      {/* ── 7 ── */}
      <section id="token" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">La moneda</div>
          <h2 className="gbc-title">Para qué sirve el token SUI: desbloqueos, reparto y staking</h2>
          <div className="gbc-body">
            <p>
              SUI tiene tres usos: pagar las comisiones, hacer <Termino slug="staking">staking</Termino> para
              asegurar la red y votar en las decisiones del protocolo. Su oferta tiene tope: nunca habrá más de 10.000
              millones. Pero en noviembre de 2026 la <Termino slug="oferta-circulante">oferta circulante</Termino> era solo
              el 41,4 %, y el resto se va soltando en <Termino slug="liberacion-de-tokens">desbloqueos</Termino> mensuales.
            </p>
            <h3 className="gbc-sub">Cómo se repartió</h3>
            <p>
              El reparto publicado antes del lanzamiento reservaba un 50 % para la comunidad, en manos de la Sui
              Foundation. Del resto, un 20 % iba a los primeros colaboradores y un 14 % a los inversores. Quedaban
              un 10 % para la tesorería de Mysten Labs y un 6 % para un programa de acceso comunitario. En el lanzamiento circulaba en torno al 5 %.
            </p>
          </div>

          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Fecha</th><th>SUI en circulación</th><th>Del total</th></tr></thead>
              <tbody>
                <tr><td><strong>Mayo de 2023</strong> (lanzamiento)</td><td>515 millones</td><td>5,1 %</td></tr>
                <tr><td><strong>Mayo de 2024</strong></td><td>2.339 millones</td><td>23,4 %</td></tr>
                <tr className="sui-fila-hoy"><td><strong>Noviembre de 2026</strong> (hoy)</td><td>4.139 millones</td><td>41,4 %</td></tr>
                <tr><td><strong>Noviembre de 2027</strong></td><td>4.356 millones</td><td>43,6 %</td></tr>
                <tr><td><strong>Noviembre de 2028</strong></td><td>4.539 millones</td><td>45,4 %</td></tr>
                <tr><td><strong>Mayo de 2030</strong> (último dato)</td><td>4.783 millones</td><td>47,8 %</td></tr>
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Reparto: plan oficial de diciembre de 2022, recogido por CoinGecko. Circulación mes a mes: API oficial
            de circulación enlazada desde la web oficial, consultada el 14 de noviembre de 2026; de 2027 en adelante
            es su previsión. Próxima liberación: 1 de diciembre de
            2026, según Tokenomist.
          </p>

          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Tres cosas se leen en esa tabla. En mayo de 2024 la circulación casi se duplicó en un solo mes: se
              acabó el primer año de bloqueo de varios grupos. Desde junio de 2026 el ritmo bajó a la mitad, de unos
              52 millones al mes a unos 23. Y en 2030 seguirá sin circular más de la mitad de los SUI: el
              <Termino slug="vesting"> vesting</Termino> de la reserva va mucho más allá.
            </p>
            <p>
              Por eso importa distinguir la capitalización del <Termino slug="fdv">FDV</Termino>, el valor si todos
              los SUI circularan ya. Con el precio del 14 de noviembre de 2026, la primera eran unos 2.860 millones
              de euros y el segundo, unos 6.920 millones.
            </p>
          </div>

          <div className="gbc-body" style={{ marginTop: 8 }}>
            <h3 className="gbc-sub">Lo que rinde el staking, frente a lo que crece la oferta</h3>
            <p>
              Aquí no hace falta montar nada para hacer staking: haces una
              <Termino slug="delegacion"> delegación</Termino> a un validador desde tu cartera. Empiezas a cobrar en
              la siguiente <Termino slug="epoca">época</Termino>, que dura 24 horas, y puedes retirarte cuando
              quieras. Sui no recorta el capital de quien delega si el validador falla: como mucho, pierdes las
              recompensas de esa época.
            </p>
            <p>
              Ahora la cuenta que casi nadie hace. En la época del 13 de noviembre de 2026 se repartieron 261.685 SUI
              entre 7.072 millones en staking. Al año, eso da un 1,35 % bruto. Con un validador que cobre un 10 %, te
              queda en torno al 1,2 %. Casi todo sale de una subvención que baja un 10 % cada 90 épocas.
            </p>
          </div>

          <div className="sui-cuenta">
            <div>
              <span>Lo que rinde el staking</span>
              <strong>≈ 1,35 %</strong>
              <small>Bruto anual, antes de la comisión del validador</small>
            </div>
            <div className="es-contra">
              <span>Lo que crece la oferta circulante</span>
              <strong>≈ 5,2 %</strong>
              <small>De noviembre de 2026 a noviembre de 2027, según la previsión oficial</small>
            </div>
          </div>
          <p className="gbc-fuente">
            Cálculo propio con las recompensas de la época 1310, el stake total y la tasa de recorte de la
            subvención leídos en la red el 14 de noviembre de 2026. Es una aproximación: baja con cada recorte de la
            subvención y cambia con el stake total.
          </p>

          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Fíjate en otro dato raro: hay más SUI en staking (7.072 millones) que en circulación (4.139). Es
              posible porque buena parte de lo que aún no circula también está en staking. La reserva de la
              Sui Foundation, por ejemplo, cobra recompensas, según el blog oficial. Ese peso concentrado es
              el mismo que decide las votaciones, aunque en la de Cetus el de la Fundación quedó fuera.
            </p>
          </div>

          {/* EXPERIENCIA DEL ADMIN: si el admin tiene o ha tenido SUI en staking, aquí encaja su caso real:
              con qué cartera y validador, cuánto cobró en un periodo concreto frente al 1,35 % calculado, y si
              ha probado zkLogin o una aplicación de Sui, qué le pareció. Con fechas y cifras propias. */}

          <div className="gbc-box gbc-box--red">
            <div className="gbc-box-title">El staking no compensa los desbloqueos</div>
            <div className="gbc-box-body">
              <p>Un 1,35 % al año protege tu peso frente a la subvención, pero no frente a los cerca de 20 millones de
              SUI que se liberan cada mes. Y nada de eso decide el precio: en noviembre de 2026 la moneda seguía un 86 % por
              debajo de su máximo de enero de 2025.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8 ── */}
      <section id="hacienda" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Desde España</div>
          <h2 className="gbc-title">SUI y Hacienda: qué declarar si vives en España</h2>
          <div className="gbc-body">
            <p>Tener SUI guardado no tributa. Lo que cuenta es lo que haces con él:</p>
            <ul>
              <li><strong>Lo que cobras por el staking</strong> se declara al recibirlo, valorado en euros ese día. La Dirección General de Tributos lo trata como rendimiento del capital mobiliario (consulta V1766-22). Llega cada época, una vez al día: guarda el historial de tu cartera.</li>
              <li><strong>Cambiar SUI por otra moneda es una venta</strong>, aunque no pases por euros. Hacienda lo trata como una permuta, también dentro de un DEX de la propia red.</li>
              <li><strong>Entrar con zkLogin no cambia nada.</strong> La dirección sigue siendo tuya, y lo que hagas con ella se declara igual.</li>
            </ul>
            <p>
              Para comprar, usa un <Termino slug="exchange">exchange</Termino> autorizado en la Unión Europea bajo
              <Termino slug="mica"> MiCA</Termino>; la CNMV publica los que pueden operar en España. El método de
              cálculo, los tramos y la forma de presentarlo están en la guía de
              <Link href="/guias/fiscalidad-cripto-espana"> fiscalidad de las criptomonedas en España</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* ── 9 ── */}
      <section id="riesgos" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que puede salir mal</div>
          <h2 className="gbc-title">Los riesgos de Sui</h2>
          <div className="gbc-body">
            <ul>
              <li><strong>Los desbloqueos.</strong> Cada mes entran unos 20 millones de SUI más en circulación, y más de la mitad del total seguirá bloqueada en 2030. Son monedas nuevas que alguien puede vender.</li>
              <li><strong>Poder concentrado.</strong> La Sui Foundation y Mysten Labs controlan una parte grande de los SUI, y el caso Cetus demostró que los validadores pueden congelar fondos si se coordinan.</li>
              <li><strong>Las aplicaciones fallan.</strong> Que Move evite ciertos errores no evita todos: Cetus perdió 223 millones por un fallo en su código.</li>
              <li><strong>zkLogin te ata a terceros.</strong> Si pierdes la sal o la cuenta del proveedor sin una vía de respaldo, pierdes la dirección.</li>
              <li><strong>La competencia.</strong> Solana, Ethereum, Aptos y otras redes buscan a los mismos usuarios y desarrolladores, y varias prometen lo mismo: rápida y barata.</li>
              <li><strong>El precio.</strong> Su <Termino slug="volatilidad">volatilidad</Termino> es la de cualquier <Termino slug="altcoin">altcoin</Termino>: en noviembre de 2026 estaba un 86 % por debajo de su máximo de enero de 2025.</li>
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
          <h2 className="gbc-title">Comprueba lo que sabes de Sui</h2>
          <div className="gbc-body" style={{ marginBottom: 32 }}>
            <p>Cinco preguntas. Con las cinco acertadas desbloqueas el logro <strong style={{ color: "var(--gold)" }}>Objeto Propio</strong>.</p>
          </div>
          {d.isRegistered ? <GuideSuiQuiz /> : <GuideQuizCuenta slug={SLUG} />}
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
