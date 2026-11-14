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
import GuideQuantLicencias from "./GuideQuantLicencias";
import GuideQuantQuiz from "./GuideQuantQuiz";
import "./quant.css";

/**
 * Guía «Qué es Quant (QNT)» (14-11-2026). Consulta objetivo: «qué es quant
 * qnt» (variantes: «qué es quant crypto», «quant criptomoneda»). «Quant» a
 * secas es ambiguo: también es el analista cuantitativo.
 *
 * El eje de la guía es separar la empresa del token. Lo que tiene y las demás
 * en español no: cada acuerdo con bancos, con su fecha, su estado real y si
 * menciona QNT o no; un simulador de cuánto QNT pueden retirar las licencias;
 * quién tiene la oferta (datos en cadena) y lo que hay que saber desde España.
 *
 * Al revisar: precio, capitalización, volumen y circulante (CoinGecko, también
 * en GuideQuantLicencias), estado de la red de la Clearing House (prevista
 * para el primer semestre de 2027), del piloto GBTD y de Fusion.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/guias/quant" },
  title: "Qué es Quant (QNT) y para qué sirve su token",
  description:
    "Qué es Quant (QNT): el software Overledger, qué bancos lo usan de verdad y si eso mueve el token. Con simulador de licencias, riesgos y cómo tributa en España.",
  openGraph: {
    title: "Qué es Quant (QNT): la empresa, el token y los bancos, por separado",
    description:
      "Overledger explicado, cada acuerdo con bancos con su fecha y su estado real, cuánto QNT retiran las licencias y quién tiene la oferta. Con quiz.",
    type: "article",
  },
};

const SLUG = "quant";

const SECCIONES = [
  { id: "que-es", label: "Qué es" },
  { id: "overledger", label: "Overledger" },
  { id: "cerrado", label: "Software cerrado" },
  { id: "bancos", label: "Quién lo usa" },
  { id: "token", label: "El token QNT" },
  { id: "oferta", label: "La oferta" },
  { id: "espana", label: "Desde España" },
  { id: "riesgos", label: "Riesgos" },
  { id: "quiz", label: "Quiz" },
];

type Estado = "hecho" | "piloto" | "anuncio";
const ACUERDOS: { cuando: string; quien: string; que: string; estado: Estado; qnt: string }[] = [
  { cuando: "Abril de 2024", quien: "UK Finance (Regulated Liability Network)", que: "Quant y R3 construyen el prototipo de una red británica de dinero tokenizado. Fue un experimento: terminó con un informe en septiembre de 2024", estado: "piloto", qnt: "No" },
  { cuando: "Mayo de 2025", quien: "Banco Central Europeo", que: "Quant está entre los cerca de 70 participantes de la plataforma de pruebas del euro digital, en el grupo de pagos condicionales. La primera ronda cerró en septiembre de 2025", estado: "piloto", qnt: "No" },
  { cuando: "Septiembre de 2025", quien: "Bancos británicos (GBTD)", que: "Arranca el piloto de depósitos tokenizados en libras con seis bancos, sobre una plataforma de Quant; Monzo se suma en enero de 2026. El 24 de septiembre de 2026 se anuncian las primeras operaciones con clientes reales", estado: "piloto", qnt: "No" },
  { cuando: "25 de marzo de 2026", quien: "Murex", que: "Acuerdo para integrar la tecnología de Quant en MX.3, el programa de mercados de capitales que usan muchos bancos", estado: "anuncio", qnt: "No" },
  { cuando: "2 de junio de 2026", quien: "Quant Fusion", que: "Arranca la red propia de Quant, que según la empresa enlaza 74 blockchains", estado: "hecho", qnt: "Sí, según Quant: el gas se paga en QNT" },
  { cuando: "24 de septiembre de 2026", quien: "The Clearing House (EE. UU.)", que: "Elige a Quant como socio tecnológico de su red de depósitos tokenizados, prevista para el primer semestre de 2027", estado: "anuncio", qnt: "No" },
];

const ROTULO: Record<Estado, string> = { hecho: "Funciona", piloto: "Piloto o prueba", anuncio: "Anuncio" };

export default async function QuantPage() {
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
          Qué es Quant (QNT)<br />
          <span className="gbc-hero-gold">y qué tiene que ver su token con los bancos</span>
        </h1>
        <p className="gbc-respuesta">
          <strong>Quant es una empresa británica que vende Overledger, un software para conectar blockchains
          entre sí y con los sistemas de los bancos.</strong> QNT es el token del proyecto: con él se pagan las
          licencias de ese software y las comisiones de su red, Fusion. Siete bancos británicos ya usan la tecnología de Quant en un
          piloto, y The Clearing House, de los grandes bancos de Estados Unidos, la ha elegido para una red de 2027.
          Pero ninguno de esos acuerdos dice que tengan que comprar QNT.
        </p>
        <p className="gbc-revisado">Revisada el <strong>14 de noviembre de 2026</strong> · Datos de mercado: CoinGecko</p>
        <div className="gbc-hero-pills">
          <span className="gbc-pill">Cada acuerdo, con su estado real</span>
          <span className="gbc-pill">Simulador de licencias</span>
          <span className="gbc-pill">Quiz con logro</span>
        </div>
      </header>

      {/* ── 1 ── */}
      <section id="que-es" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo básico</div>
          <h2 className="gbc-title">Qué es Quant: una empresa, un software y un token</h2>
          <div className="gbc-body">
            <p>
              Cuando alguien busca «Quant crypto» suele mezclar tres cosas distintas, y conviene separarlas.
            </p>
            <ul>
              <li><strong>La empresa.</strong> Quant Network Ltd, registrada en Inglaterra el 28 de septiembre de 2015. Su fundador más conocido, Gilbert Verdian, sigue siendo su director general.</li>
              <li><strong>El software.</strong> Overledger, que conecta redes distintas y los sistemas que los bancos ya tienen. Es lo que Quant vende.</li>
              <li><strong>El token.</strong> QNT, un <Termino slug="erc-20">token ERC-20</Termino> que vive en Ethereum. No tiene una <Termino slug="blockchain">blockchain</Termino> propia de la que sea la moneda principal.</li>
            </ul>
            <p>
              Ese orden importa. Quant no es una red abierta que se sostiene con su moneda, como
              <Link href="/guias/ethereum"> Ethereum</Link>. Es una compañía con clientes, contratos y patentes, que
              además emitió un token en 2018. Lo que le va bien a la empresa no tiene por qué irle bien al token.
              El resto de la guía explica por qué.
            </p>
          </div>
        </div>
      </section>

      {/* ── 2 ── */}
      <section id="overledger" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Cómo funciona</div>
          <h2 className="gbc-title">Cómo funciona Overledger, el software de Quant</h2>
          <div className="gbc-body">
            <p>
              Cada blockchain habla su propio idioma. Un banco que quiera emitir un bono en una red, cobrarlo en
              otra y apuntarlo en su contabilidad de siempre necesitaría tres equipos y tres integraciones. El
              problema tiene nombre: <Termino slug="interoperabilidad">interoperabilidad</Termino>.
            </p>
            <p>
              Overledger hace de traductor. El banco se conecta una sola vez a Overledger, y Overledger se
              encarga de hablar con cada red y con cada sistema. Quant lo llama una capa de orquestación: no
              guarda el dinero, coordina los pasos para que ocurran en el orden pactado.
            </p>
            <p>
              Un ejemplo con números. Imagina que cambias tu hipoteca de banco y el nuevo te presta 300.000 euros.
              El dinero queda bloqueado y se libera solo cuando se cumplen las condiciones de cierre pactadas. Eso
              es un pago condicional, y es el tipo de operación que la tecnología de Quant ha hecho ya con clientes
              reales en Reino Unido.
            </p>
            <p>
              Desde el 2 de junio de 2026, Quant tiene además su propia red, Fusion. Es un
              <Termino slug="rollup"> rollup</Termino>: agrupa operaciones y deja su resumen anotado en otras
              cadenas. Quant asegura que enlaza 74 blockchains, una cifra que solo publica la empresa. Y es la
              propia Quant Network Ltd la que hace de <Termino slug="secuenciador">secuenciador</Termino>:
              decide el orden de las operaciones.
            </p>
          </div>
          <div className="gbc-box gbc-box--gold">
            <div className="gbc-box-title">Quant, Chainlink y Canton no hacen lo mismo</div>
            <div className="gbc-box-body">
              <p>Los tres aparecen en las noticias sobre bancos. <Link href="/guias/chainlink">Chainlink</Link> es
              una red de operadores que llevan datos y mensajes entre cadenas. <Link href="/guias/canton">Canton</Link> es
              una blockchain propia donde cada banco solo ve sus contratos. Quant vende el software que conecta lo
              que el banco ya tiene con cualquiera de esas redes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 ── */}
      <section id="cerrado" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">La gran diferencia</div>
          <h2 className="gbc-title">Por qué Quant es un proyecto cerrado, y qué significa para ti</h2>
          <div className="gbc-body">
            <p>
              En Bitcoin o en Ethereum cualquiera puede leer el código, copiarlo y montar un
              <Termino slug="nodo"> nodo</Termino>. En Quant, no. El núcleo de Overledger es software propiedad de
              la empresa. Lo que publica en su cuenta pública de GitHub son sobre todo kits para conectarse,
              tutoriales y herramientas, no el motor. No es <Termino slug="codigo-abierto">código abierto</Termino>.
            </p>
            <p>
              Además está protegido con patentes. En febrero de 2024 la oficina de patentes de Estados Unidos le
              concedió la número 11.842.335, sobre cómo ordenar en el tiempo operaciones de varias blockchains.
              En 2023 había obtenido la equivalente en Japón, la 7.273.053.
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th></th><th>Quant</th><th>Chainlink</th><th>Canton</th></tr></thead>
              <tbody>
                <tr><td><strong>Qué es</strong></td><td>Software de una empresa, más su red Fusion</td><td>Red de operadores independientes</td><td>Blockchain propia para instituciones</td></tr>
                <tr><td><strong>El código</strong></td><td>Núcleo cerrado y patentado</td><td>Abierto</td><td>Abierto</td></tr>
                <tr><td><strong>Quién decide</strong></td><td>Quant Network Ltd</td><td>El equipo del proyecto y un grupo de firmantes</td><td>Los super validadores, por votación</td></tr>
                <tr><td><strong>El token da voto</strong></td><td>No</td><td>No</td><td>No</td></tr>
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Quant: ficha de transparencia del token presentada en Blockworks el 28 de julio de 2026, que recoge
            que QNT no da derechos de <Termino slug="gobernanza">gobernanza</Termino>, ni dividendos, ni voto, y
            que no hay fundación ni DAO. Patentes: comunicados de Quant de 2023 y febrero de 2024.
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Para un banco, que el software sea de una empresa es una ventaja: hay a quién pedir cuentas,
              contratos de soporte y un responsable legal. Para ti, si compras QNT, es lo contrario. Dependes de
              lo que decida una sociedad privada que no te debe nada: el token no te convierte en accionista.
            </p>
          </div>
        </div>
      </section>

      {/* ── Anuncio de media guía ── */}
      <GuiaAnuncio producto="portfolio" variante="compacto" estado={d.estado} />

      {/* ── 4 ── */}
      <section id="bancos" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que es real</div>
          <h2 className="gbc-title">Quién usa Quant: bancos, pilotos y anuncios, por separado</h2>
          <div className="gbc-body">
            <p>
              Casi todo lo que se publica sobre Quant mezcla tres cosas: lo que funciona, lo que se está probando
              y lo que se ha anunciado. Aquí van los seis acuerdos más citados, con su estado a noviembre de 2026.
              Casi todos giran en torno a la <Termino slug="tokenizacion">tokenización</Termino>: convertir el
              dinero de los bancos en tokens que se mueven por una red. Fíjate en la última columna.
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla qnt-acuerdos">
              <thead><tr><th>Cuándo</th><th>Con quién y qué</th><th>Estado</th><th>¿Usa QNT?</th></tr></thead>
              <tbody>
                {ACUERDOS.map((a) => (
                  <tr key={a.quien}>
                    <td><strong>{a.cuando}</strong></td>
                    <td><strong>{a.quien}.</strong> {a.que}</td>
                    <td><span className={`qnt-estado qnt-estado--${a.estado}`}>{ROTULO[a.estado]}</span></td>
                    <td>{a.qnt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Fuentes: UK Finance (páginas del Regulated Liability Network y de la iniciativa GBTD) y BCE (nota de
            prensa del 5 de mayo de 2025). También el comunicado de Murex del 25 de marzo de 2026, la prensa
            económica sobre la Clearing House (24 y 25 de septiembre de 2026) y los comunicados de Quant.
            Consultadas el 14-11-2026.
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              El caso más sólido es el británico. Barclays, HSBC UK, Lloyds, Monzo, Nationwide, NatWest y
              Santander forman la iniciativa GBTD, y la plataforma la ha desarrollado Quant. En septiembre de 2026
              cerraron sus primeras operaciones con clientes: dos cambios de hipoteca y un pago entre particulares
              que se liberó al entregarse el producto. El dinero era un
              <Termino slug="token-de-deposito"> token de depósito</Termino>: una libra del banco, en formato digital.
            </p>
            <p>
              El más grande es el estadounidense. The Clearing House, la entidad que compensa y liquida más de 2
              billones de dólares al día entre bancos de Estados Unidos, eligió a Quant para su red de depósitos
              tokenizados. Todavía no funciona: está prevista para el primer semestre de 2027.
            </p>
            <p>
              Y la pregunta que nadie responde. En los comunicados de los bancos no aparece QNT. Los clientes
              pagan a una empresa por un servicio, en dinero normal. Que parte de ese dinero termine comprando
              QNT depende de cómo Quant cobre, y eso no lo detalla en público.
            </p>
          </div>
        </div>
      </section>

      {/* ── 5 ── */}
      <section id="token" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">La moneda</div>
          <h2 className="gbc-title">Para qué sirve el token QNT de Quant</h2>
          <div className="gbc-body">
            <p>
              QNT es un <Termino slug="token-de-utilidad">token de utilidad</Termino>: da acceso a un servicio, no
              una parte del negocio. Según la ficha que el proyecto entregó a Blockworks en 2026, tiene tres usos.
            </p>
            <ul>
              <li><strong>Pagar las licencias de Overledger.</strong> Se pagan en QNT. En la versión 2.1.5 de Overledger, la licencia anual de producción costaba 100 libras, pagaderas en QNT. Las tarifas de la plataforma también se pueden pagar en dólares.</li>
              <li><strong>Pagar las comisiones de Fusion.</strong> Según esa ficha, el <Termino slug="gas">gas</Termino> de cada operación en la red de Quant se paga en QNT.</li>
              <li><strong>Hacer de fianza.</strong> Los operadores de nodos de confianza de Fusion deben depositar QNT. A cambio cobran recompensas en QNT. Es un <Termino slug="staking">staking</Termino> reservado a ellos; para el público no tiene fecha.</li>
            </ul>
            <p>
              Lo que cobra Quant por sus servicios es ingreso de la empresa, según la misma ficha. Ningún
              mecanismo reparte esos ingresos entre quienes tienen QNT, ni recompra tokens con ellos.
            </p>
            <p>
              Entonces, ¿cuánta demanda pueden crear las licencias? Haz la cuenta en el caso más favorable:
              todo lo que pagan los clientes se convierte en QNT y se queda retenido un año. Con 500 clientes que
              pagan 100.000 euros cada uno y un QNT a 138 euros, se retienen unos 362.000 QNT. Es el 2,5 % de lo que
              circula. Y esos 50 millones de euros son menos de lo que se negocia de QNT en un solo día.
            </p>
          </div>

          <GuideQuantLicencias />

          <div className="gbc-body" style={{ marginTop: 26 }}>
            <p>
              Mira lo que pasa al subir el precio. Como la cuota se pacta en euros, a más precio hacen falta menos
              tokens. La demanda de las licencias es una cantidad de dinero, no de QNT. Puede sostener el precio
              si crece mucho el número de clientes, pero no lo empuja hacia arriba por sí sola.
            </p>
            {/* EXPERIENCIA DEL ADMIN: si has tenido QNT o lo has analizado para el Portfolio, aquí encaja por qué
                lo compraste o lo descartaste, y qué te hizo mirar la empresa por separado del token. */}
          </div>
        </div>
      </section>

      {/* ── 6 ── */}
      <section id="oferta" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">La oferta</div>
          <h2 className="gbc-title">Cuántos QNT hay y quién los tiene</h2>
          <div className="gbc-body">
            <p>
              Hay 14.612.493 QNT y no se crearán más. Salieron de una <Termino slug="ico">ICO</Termino> en abril de
              2018: se vendieron 9,96 millones de tokens por 11 millones de dólares, a un precio efectivo de unos
              1,10 dólares. Los 9,55 millones que no se vendieron se destruyeron el 14 de septiembre de 2018, una
              <Termino slug="quema-de-tokens"> quema de tokens</Termino>.
            </p>
            <p>
              Hay un detalle que confunde a mucha gente. Si miras el <Termino slug="smart-contract">contrato inteligente</Termino> de QNT en un
              <Termino slug="explorador-de-bloques"> explorador de bloques</Termino>, verás un máximo de 45,47
              millones. Es un resto del diseño original, anterior a la quema. Los tokens quemados siguen
              apuntados a la dirección del propio contrato, donde nadie puede moverlos.
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Dato</th><th>A 14 de noviembre de 2026</th></tr></thead>
              <tbody>
                <tr><td><strong><Termino slug="oferta-circulante">En circulación</Termino></strong></td><td>14,56 millones de QNT, el 99,6 % del total</td></tr>
                <tr><td><strong>Precio de Quant</strong></td><td>152 dólares, unos 138 euros</td></tr>
                <tr><td><strong><Termino slug="market-cap">Capitalización</Termino></strong></td><td>2.200 millones de dólares, puesto 41</td></tr>
                <tr><td><strong><Termino slug="volumen">Volumen</Termino> diario</strong></td><td>Unos 60 millones de euros (mediana de los últimos 30 días), cerca del 3 % de la capitalización</td></tr>
                <tr><td><strong>Máximo histórico (<Termino slug="ath">ATH</Termino>)</strong></td><td>427 dólares, el 11 de septiembre de 2021. Hoy, un 64 % por debajo</td></tr>
                <tr><td><strong>Direcciones con QNT</strong></td><td>Unas 188.600</td></tr>
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Precio, capitalización, volumen y circulante: CoinGecko, 14-11-2026 (el volumen, mediana del 15-10 al 14-11). Venta, quema y reservas:
            ficha de transparencia de Quant en Blockworks. Direcciones y mayores tenedores: datos en cadena del
            contrato en Ethereum (Ethplorer), 14-11-2026.
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              ¿Está concentrada? Sin contar el contrato, las 14 mayores direcciones suman unos 4,4 millones de
              QNT, cerca del 30 % de la oferta. Dos de ellas tienen 600.000 cada una, un 4 %, y no llevan nombre
              público. Al menos otra es de un <Termino slug="exchange">exchange</Termino>: una dirección de Binance con 200.000, que guarda monedas
              de muchos clientes. Así que no equivalen necesariamente a 14 dueños. Aun así, unos pocos
              <Termino slug="whale"> grandes tenedores</Termino> pueden mover el precio.
            </p>
            <p>
              La empresa, en cambio, conserva poco. Tras la ICO se quedó 2,6 millones como reserva y 1,3 millones
              para los fundadores. Según su ficha, hoy conserva unos 68.000 QNT, menos del 0,5 % del total y sin bloqueo. Es decir:
              no hay <Termino slug="liberacion-de-tokens">desbloqueos</Termino> pendientes que vayan a inundar el
              mercado.
            </p>
          </div>
        </div>
      </section>

      {/* ── 7 ── */}
      <section id="espana" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Desde España</div>
          <h2 className="gbc-title">Cómo comprar Quant en España y cómo lo trata Hacienda</h2>
          <div className="gbc-body">
            <p>
              QNT se compra en exchanges, como casi cualquier criptomoneda
              grande. Desde el 1 de julio de 2026, quien te lo venda en España tiene que estar autorizado bajo el
              reglamento europeo <Termino slug="mica">MiCA</Termino>. La ESMA publica la lista de empresas
              autorizadas, y la CNMV la suya de entidades no autorizadas: mira las dos antes de depositar dinero.
            </p>
            <p>
              Si lo sacas a tu propia <Termino slug="wallet">cartera</Termino>, recuerda que es un token de
              Ethereum. Tienes que retirarlo por esa red y tener algo de ETH para pagar la comisión de cada envío.
              Enviarlo por otra red es la forma más común de perderlo.
            </p>
            <p>
              Con Hacienda no hay nada especial. Vender QNT por euros, o cambiarlo por otra criptomoneda, genera
              una ganancia o una pérdida. Se calcula como la diferencia entre lo que valía al salir y lo que te
              costó, y tributa en la base del ahorro, entre el 19 % y el 30 %. Si a 31 de diciembre tienes más de
              50.000 euros en criptomonedas en un exchange de fuera de España, además presentas el modelo 721.
              El detalle está en la guía de <Link href="/guias/fiscalidad-cripto-espana">fiscalidad de las
              criptomonedas en España</Link>.
            </p>
          </div>
          <div className="gbc-box gbc-box--gold">
            <div className="gbc-box-title">El error típico con Quant</div>
            <div className="gbc-box-body">
              <p>Comprar QNT después de un titular del tipo «un gran banco elige a Quant». El 24 de septiembre de
              2026 se anunciaron a la vez la red de la Clearing House y las primeras operaciones del piloto
              británico. Ese día QNT abrió en unos 71 dólares; cuatro días después rozaba los 287: se había
              multiplicado por cuatro. El 14 de noviembre estaba en 152, poco más de la mitad que en el pico
              (precios diarios de CoinGecko).
              Antes de comprar por una noticia, pregúntate si ese acuerdo obliga a alguien a usar el token.
              Casi nunca lo dice.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8 ── */}
      <section id="riesgos" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que puede salir mal</div>
          <h2 className="gbc-title">Los riesgos de Quant y de QNT</h2>
          <div className="gbc-body">
            <ul>
              <li><strong>Depende de una sola empresa.</strong> Si Quant Network Ltd cambia de estrategia, se vende o cierra, el token no tiene una comunidad ni una fundación que siga sin ella.</li>
              <li><strong>El negocio puede crecer sin que crezca el token.</strong> Los grandes clientes pagan en dinero normal. Si Quant decidiera cobrar sin pasar por QNT, nada te protege.</li>
              <li><strong>Código cerrado.</strong> No puedes comprobar cómo funciona lo que compras. Te fías de lo que publica la empresa, y varias cifras, como las 74 redes de Fusion, solo las da ella.</li>
              <li><strong>Los anuncios no son ingresos.</strong> La red de la Clearing House aún no funciona, y un piloto puede quedarse en piloto.</li>
              <li><strong>Competencia.</strong> Chainlink, Canton y la propia red de Swift buscan los mismos clientes. Los bancos no están casados con nadie.</li>
              <li><strong>Grandes tenedores y <Termino slug="liquidez">liquidez</Termino>.</strong> Unas pocas direcciones concentran buena parte de la oferta. En una caída fuerte, vender sin mover el precio puede costar.</li>
              <li><strong>El precio.</strong> QNT cotiza un 64 % por debajo de su máximo de 2021. Su <Termino slug="volatilidad">volatilidad</Termino> es la de cualquier criptomoneda.</li>
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
          <h2 className="gbc-title">Comprueba lo que sabes de Quant</h2>
          <div className="gbc-body" style={{ marginBottom: 32 }}>
            <p>Cinco preguntas. Con las cinco acertadas desbloqueas el logro <strong style={{ color: "var(--gold)" }}>Licencia en Regla</strong>.</p>
          </div>
          {d.isRegistered ? <GuideQuantQuiz /> : <GuideQuizCuenta slug={SLUG} />}
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
