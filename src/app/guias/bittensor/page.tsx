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
import GuideBittensorReparto from "./GuideBittensorReparto";
import GuideBittensorQuiz from "./GuideBittensorQuiz";
import "./bittensor.css";

/**
 * Guía «Qué es Bittensor» (14-11-2026). Consulta objetivo: «qué es bittensor».
 *
 * Lo que tiene y las demás en español no: una calculadora del reparto de un
 * día de emisión (propietario, mineros, validadores), la comparación entre lo
 * que vale la emisión y lo que la red ingresa por uso real, y qué supone para
 * Hacienda que hacer staking en una subred sea cambiar TAO por un token alfa.
 *
 * Al revisarla: precio y oferta de TAO, número de subredes, el reparto por
 * defecto (18/41/41), la fórmula que asigna la emisión a cada subred (cambia a
 * menudo) y la fecha estimada del segundo halving.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/guias/bittensor" },
  title: "Qué es Bittensor (TAO) y quién cobra la emisión",
  description:
    "Qué es Bittensor y cómo paga en TAO por aportar IA: subredes, mineros, dTAO y halvings, con calculadora del reparto diario y lo que pide Hacienda del staking.",
  openGraph: {
    title: "Qué es Bittensor (TAO): subredes, dTAO, halvings y quién cobra cada día",
    description:
      "Cómo funciona la red que paga por inteligencia artificial, cuánto se emite y quién se lo lleva, qué ingresa de verdad, el robo de 2024 y cómo tributan el staking y los tokens alfa en España. Con quiz.",
    type: "article",
  },
};

const SLUG = "bittensor";

const SECCIONES = [
  { id: "que-es", label: "Qué es" },
  { id: "como-funciona", label: "Cómo funciona" },
  { id: "reparto", label: "El reparto" },
  { id: "dtao", label: "dTAO y alfa" },
  { id: "tao", label: "TAO y halvings" },
  { id: "uso", label: "Uso real" },
  { id: "hacienda", label: "Hacienda" },
  { id: "riesgos", label: "Riesgos" },
  { id: "quiz", label: "Quiz" },
];

const PAPELES = [
  { quien: "Propietario", hace: "Crea la subred y escribe sus reglas: qué tarea se pide y cómo se puntúa.", cobra: "18 % de lo que emite su subred" },
  { quien: "Mineros", hace: "Hacen el trabajo: responden preguntas, entrenan un modelo, alquilan una GPU o predicen un precio.", cobra: "41 %, según la nota que reciben" },
  { quien: "Validadores", hace: "Ponen a prueba a los mineros y les ponen nota. Con esas notas se reparte la emisión.", cobra: "41 %, compartido con quienes delegan en ellos" },
];

export default async function BittensorPage() {
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
          Qué es Bittensor (TAO)<br />
          <span className="gbc-hero-gold">y quién se lleva lo que emite cada día</span>
        </h1>
        <p className="gbc-respuesta">
          <strong>Bittensor es una red que paga en TAO, su criptomoneda, a quien aporta inteligencia artificial
          útil.</strong> Se divide en más de cien subredes, cada una con una tarea: responder a un chat, entrenar
          un modelo, alquilar potencia de cálculo. Unos participantes hacen el trabajo, otros lo puntúan, y la red
          reparte entre ellos unos 3.600 TAO nuevos al día. Como Bitcoin, tiene un tope de 21 millones y
          <Termino slug="halving"> halvings</Termino>.
        </p>
        <p className="gbc-revisado">Revisada el <strong>14 de noviembre de 2026</strong> · Datos de red y precio a noviembre de 2026</p>
        <div className="gbc-hero-pills">
          <span className="gbc-pill">Calculadora del reparto diario</span>
          <span className="gbc-pill">Emisión frente a ingresos reales</span>
          <span className="gbc-pill">Quiz con logro</span>
        </div>
      </header>

      {/* ── 1 ── */}
      <section id="que-es" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo básico</div>
          <h2 className="gbc-title">Qué es Bittensor y qué problema quiere resolver</h2>
          <div className="gbc-body">
            <p>
              Hoy la inteligencia artificial más potente está en manos de unas pocas empresas. Ellas eligen qué
              modelos se entrenan, quién los usa y a qué precio. Bittensor propone otra cosa: un mercado sin dueño
              en el que cualquiera con un servidor aporta trabajo de IA y cobra por él, sin pedir permiso a
              nadie.
            </p>
            <p>
              El pago no sale de un cliente que contrata, sino de la propia red. Cada 12 segundos, la
              <Termino slug="blockchain"> blockchain</Termino> de Bittensor crea TAO nuevo y lo reparte entre quienes
              han hecho el trabajo más valioso. Es la misma idea que paga a un
              <Termino slug="minero"> minero</Termino> de <Termino slug="bitcoin">Bitcoin</Termino>, con una
              diferencia de fondo. En Bitcoin se paga por gastar energía en un cálculo inútil; en Bittensor, por
              producir algo que otro participante considera útil.
            </p>
            <p>
              Detrás está la Opentensor Foundation, creada por Jacob Steeves y Ala Shaabana. La red arrancó en enero
              de 2021 sin venta inicial de tokens ni reparto previo a inversores: todo el TAO que existe ha salido de
              la emisión. Es su propia <Termino slug="capa-1">capa 1</Termino>, construida con la tecnología de
              Polkadot (Substrate), y su moneda se escribe TAO o con la letra griega τ.
            </p>
          </div>
          <div className="gbc-box gbc-box--gold">
            <div className="gbc-box-title">En qué se parece a Render, y en qué no</div>
            <div className="gbc-box-body">
              <p>
                Las dos se meten en el saco de «cripto e IA», pero cobran de forma opuesta. En la red de
                <Link href="/guias/render"> Render</Link> un cliente encarga un trabajo concreto, lo paga y los
                <Termino slug="nodo"> nodos</Termino> que lo hacen cobran por él. En Bittensor la mayor parte del pago no viene de clientes: viene de la
                emisión de la red. Esa diferencia explica casi todo lo bueno y lo malo que leerás abajo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2 ── */}
      <section id="como-funciona" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Cómo funciona</div>
          <h2 className="gbc-title">Cómo funciona Bittensor: subredes, mineros y validadores</h2>
          <div className="gbc-body">
            <p>
              La red no hace una sola cosa. Se divide en <Termino slug="subred">subredes</Termino>, cada una con su
              número y su encargo. La 64, Chutes, sirve modelos de lenguaje a quien paga por usarlos: lo que se
              llama <Termino slug="inferencia">inferencia</Termino>. Otras entrenan modelos entre muchos ordenadores,
              predicen precios o alquilan tarjetas gráficas. Ojo: aquí una subred no es una blockchain aparte, como en
              Avalanche. Todas viven en la misma cadena; lo que cambia es la tarea. Hay 128, el máximo que admite hoy
              la red, según los datos de la propia cadena a noviembre de 2026.
            </p>
            <p>Dentro de cada subred hay tres papeles, y cada uno cobra una parte fija de lo que emite:</p>
          </div>
          <div className="tao-papeles">
            {PAPELES.map((p) => (
              <div key={p.quien}>
                <strong>{p.quien}</strong>
                <p>{p.hace}</p>
                <span className="tao-papel-cobra">{p.cobra}</span>
              </div>
            ))}
          </div>
          <p className="gbc-fuente">
            Reparto por defecto según la documentación oficial de Bittensor (concepto «Emissions»), consultada en
            noviembre de 2026. El propietario puede moverlo dentro de unos límites: los mineros nunca bajan del 33 %.
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              La pieza que lo une todo se llama Yuma. Es el <Termino slug="mecanismo-de-consenso">mecanismo de
              consenso</Termino> de cada subred, y funciona como un tribunal de jueces. Cada
              <Termino slug="validador"> validador</Termino> puntúa a los mineros. Yuma junta esas notas, dando más
              peso a los validadores con más TAO detrás, y recorta las que se apartan mucho de la mayoría. Así, un
              validador que puntúe a su amigo por encima de lo que opinan los demás no consigue nada.
            </p>
            <p>
              El cálculo se hace por <Termino slug="epoca">épocas</Termino>, de 360 bloques por defecto: unos 72
              minutos. En cada una, los mineros con peor nota pueden perder su plaza en favor de uno nuevo, después
              de un periodo de gracia. Cada subred admite 256 plazas en total, y la competencia por ellas es
              constante.
            </p>
            <p>
              Desde el 7 de octubre de 2026, con la versión 475 de la red, hay una alternativa. El propietario de una
              subred puede elegir el modo «Null»: puntúa un solo validador, el que tenga más TAO detrás, y la subred
              admite hasta 2.500 plazas. Es más simple y escala mejor, pero deja la nota en manos de una sola parte.
            </p>
          </div>
        </div>
      </section>

      {/* ── 3 ── */}
      <section id="reparto" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Con números</div>
          <h2 className="gbc-title">Cuánto TAO emite Bittensor al día y cómo se reparte</h2>
          <div className="gbc-body">
            <p>
              Las cuentas de la emisión de Bittensor caben en tres líneas. Sale un bloque cada 12 segundos: 7.200 al
              día. Desde diciembre de 2025, cada bloque emite 0,5 TAO. Son 3.600 TAO diarios para toda la red, que se
              reparten primero entre subredes y después, dentro de cada una, entre sus tres papeles.
            </p>
            <p>
              Ejemplo. Una subred que se lleve el 2 % de la emisión recibe 72 TAO al día. Su propietario se queda
              13 TAO; los mineros, 29,5 entre todos; los validadores y quienes delegan en ellos, otros 29,5. A 176 €
              por TAO, precio del 14 de noviembre de 2026 según CoinGecko, los mineros de esa subred se reparten unos
              5.200 € diarios. Mueve los datos y mira cómo cambia con cada halving:
            </p>
          </div>

          <GuideBittensorReparto />

          <div className="gbc-body" style={{ marginTop: 26 }}>
            <p>
              ¿Y qué decide la parte de cada subred? La demanda de su token: cuánto TAO entra a hacer staking en
              ella. La fórmula exacta cambia a menudo. En noviembre de 2025, Taoflow la ató a las entradas netas de
              TAO; en junio de 2026 se sustituyó por otra basada en el precio medio de ese token. No te quedes con un
              porcentaje concreto. Quédate con la idea: las subredes compiten por atraer TAO, y la que lo consigue
              cobra más emisión.
            </p>
            <p>
              Un detalle que la calculadora no puede enseñar: muchas subredes no pagan a sus mineros. A 16 de abril
              de 2026, 67 de las 128 <Termino slug="quema-de-tokens">quemaban</Termino> el 99 % o más del incentivo
              de minería, según datos de Taostats recogidos por FalconX. Con Taoflow les convenía: menos pago a
              mineros era menos venta de su token. Desde junio de 2026, quemar resta a la subred la misma parte de su
              emisión, así que esa cifra puede haber bajado.
            </p>
          </div>
        </div>
      </section>

      {/* ── Anuncio de media guía ── */}
      <GuiaAnuncio producto="portfolio" variante="compacto" estado={d.estado} />

      {/* ── 4 ── */}
      <section id="dtao" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">El cambio de 2025</div>
          <h2 className="gbc-title">Qué es dTAO y qué son los tokens alfa de cada subred</h2>
          <div className="gbc-body">
            <p>
              Hasta febrero de 2025, un grupo de 64 grandes validadores decidía qué parte de la emisión se llevaba
              cada subred. Era rápido y estaba muy concentrado. Dynamic TAO, abreviado dTAO, se activó el 13 de
              febrero de 2025 y le dio esa decisión al mercado.
            </p>
            <p>
              Desde entonces, cada subred tiene su propio token, llamado alfa, y un
              <Termino slug="liquidity-pool"> fondo de liquidez</Termino> que lo cruza con TAO. Funciona como un
              <Termino slug="amm"> AMM</Termino>: si entra TAO, el alfa sube de precio; si sale, baja. Cada token
              alfa tiene, como TAO, un tope de 21 millones y su propia curva de halvings.
            </p>
            <p>
              Aquí está la parte que más confunde. Hacer <Termino slug="staking">staking</Termino> en una subred ya
              no es «bloquear TAO»: es cambiarlo por el alfa de esa subred, al precio del fondo en ese momento. Al
              salir, el cambio se deshace al precio de entonces. Puedes recuperar más TAO del que pusiste o bastante
              menos, y en un fondo pequeño el <Termino slug="slippage">slippage</Termino> de una operación grande se
              nota.
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th></th><th>Staking en el root (subred 0)</th><th>Staking en una subred</th></tr></thead>
              <tbody>
                <tr><td><strong>Qué tienes</strong></td><td>TAO, sin cambiarlo</td><td>El token alfa de esa subred</td></tr>
                <tr><td><strong>Qué cobras</strong></td><td>Una parte de lo que cobran los validadores en todas las subredes</td><td>Una parte de la emisión de esa subred</td></tr>
                <tr><td><strong>De qué depende lo que recuperas</strong></td><td>Del precio de TAO</td><td>Del precio de TAO y, además, del de ese alfa</td></tr>
                <tr><td><strong>Cuánto TAO había así</strong></td><td>49,6 % del total</td><td>21,3 % del total</td></tr>
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Última fila: datos a 1 de mayo de 2026, informe «State of Bittensor» de FalconX y SubnetStats. Entre
            las dos, cerca del 70 % de todo el TAO estaba en staking.
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              En los dos casos no lo haces tú solo: lo delegas en un validador, que cobra una comisión antes de
              pagarte. Esa <Termino slug="delegacion">delegación</Termino> no le da tus monedas: tu TAO o tu alfa
              siguen en tu <Termino slug="wallet">cartera</Termino>, y puedes moverlos a otro validador cuando quieras.
            </p>
          </div>
        </div>
      </section>

      {/* ── 5 ── */}
      <section id="tao" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">La moneda</div>
          <h2 className="gbc-title">TAO: 21 millones, halvings y cuándo llega el próximo</h2>
          <div className="gbc-body">
            <p>
              TAO copia el calendario de Bitcoin con un matiz. El halving no se
              activa por número de bloques, sino por cantidad emitida: cada vez que se emite la mitad de lo que
              queda hasta 21 millones, la emisión por bloque se parte por dos.
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Tramo</th><th>Se activa al llegar a</th><th>TAO por bloque</th><th>TAO al día</th><th>Cuándo</th></tr></thead>
              <tbody>
                <tr><td><strong>Inicio</strong></td><td>0</td><td>1</td><td>7.200</td><td>Enero de 2021</td></tr>
                <tr><td><strong>1.er halving</strong></td><td>10,5 millones</td><td>0,5</td><td>3.600</td><td>15 de diciembre de 2025</td></tr>
                <tr><td><strong>2.º halving</strong></td><td>15,75 millones</td><td>0,25</td><td>1.800</td><td>Hacia finales de 2029 o 2030 (estimación)</td></tr>
                <tr><td><strong>3.er halving</strong></td><td>18,375 millones</td><td>0,125</td><td>900</td><td>Años después</td></tr>
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Umbrales y emisión: documentación oficial de Bittensor y Taostats. Fecha del primer halving, en el
            bloque 7.103.976: KuCoin, comprobado en la propia cadena. La del segundo es una cuenta propia,
            explicada debajo.
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Hay un detalle que retrasa los halvings. El TAO que se paga por inscribirse en una subred, y parte de las
              comisiones, se «recicla»: se resta de lo emitido y vuelve a estar pendiente de emitir. Por eso la
              documentación oficial avisa de que el reciclaje retrasa los halvings.
            </p>
            <p>
              En la práctica, de momento, apenas se nota. El 14 de noviembre de 2026 se habían emitido 11.727.000
              TAO, según la propia cadena. Desde el halving, la
              <Termino slug="oferta-circulante"> oferta circulante</Termino> ha crecido algo más de 3.600 TAO al día
              de media. A ese ritmo, faltan 4 millones para el segundo umbral: unos 1.100 días. De ahí sale el «hacia
              finales de 2029 o 2030», que se retrasará si el reciclaje crece.
            </p>
            <p>
              ¿Y el precio? El halving no lo sube por sí solo. El día del primero, TAO cayó un 8 %, según Forklog. Su
              máximo histórico sigue siendo el de marzo de 2024, 757,60 dólares; el 14 de noviembre de 2026 cotizaba a
              193,96 dólares, unos 176 €, con una <Termino slug="market-cap">capitalización</Termino> de 2.270
              millones de dólares, según CoinGecko.
            </p>
            <p>
              Para comprarlo, TAO cotiza en <Termino slug="exchange">exchanges</Termino> grandes como Binance o
              Kraken. Para hacer staking tienes que sacarlo a una cartera que admita la red de Bittensor: dejarlo en
              el exchange es dejarlo en manos de otro.
            </p>
          </div>
        </div>
      </section>

      {/* ── 6 ── */}
      <section id="uso" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">La pregunta incómoda</div>
          <h2 className="gbc-title">¿Quién usa Bittensor de verdad? La emisión frente a los ingresos</h2>
          <div className="gbc-body">
            <p>
              Para saber si Bittensor funciona hay que separar dos dineros. Uno es la emisión: TAO nuevo que la red
              crea y reparte. El otro, lo que pagan clientes de fuera por usar lo que producen las subredes. El
              primero lo garantiza el protocolo. El segundo es el que demostraría que la red vale algo por sí misma.
            </p>
          </div>
          <div className="tao-balanza">
            <div>
              <span>Lo que se emite</span>
              <strong>≈ 231 M€ al año</strong>
              <p>3.600 TAO al día × 365 días × 176 €. Valor de la emisión a precio del 14 de noviembre de 2026.</p>
            </div>
            <div className="tao-balanza-otro">
              <span>Lo que ingresa la red</span>
              <strong>≈ 15 M€ al año</strong>
              <p>Más de 17 millones de dólares anualizados en comisiones de registro y de transacción, según Artemis, recogido por FalconX en mayo de 2026.</p>
            </div>
          </div>
          <div className="gbc-body" style={{ marginTop: 26 }}>
            <p>
              Con esas dos cifras, la emisión vale unas quince veces lo que la red cobra en comisiones. No miden
              exactamente lo mismo. La emisión va al precio de hoy, y una parte ni se paga: se quema. Las comisiones
              son de primavera, y los ingresos de cada subred por sus servicios van aparte; algunas los usan para
              recomprar su propio token. Pero el orden de magnitud es claro. Hoy a los mineros de Bittensor les paga,
              sobre todo, la emisión.
            </p>
            <p>
              Hay uso real, y conviene no negarlo. Chutes anunció en noviembre de 2025 que había superado el millón de
              dólares de ingresos en 90 días, con más de 10.000 diarios. Sus modelos se ofrecen a través de
              OpenRouter, un mercado de modelos que usan programadores de todo el mundo. Templar entrenaba modelos repartidos
              entre ordenadores de desconocidos, hasta que su equipo se marchó en abril de 2026. Pero el interés está
              muy concentrado: a 1 de mayo de 2026, solo 9 subredes tenían más de 1.000 cuentas comprando o vendiendo
              su token en una semana, según FalconX.
            </p>
            <p>
              Es el mismo dilema que en la red de <Link href="/guias/render">Render</Link>, más acusado. Una
              criptomoneda que paga por trabajo útil necesita, tarde o temprano, que alguien de fuera quiera comprar
              ese trabajo. Si no llega, la emisión se reparte entre los mismos que la cobran. Y una red que verifica
              humanos, como la de <Link href="/guias/worldcoin">Worldcoin</Link>, tampoco escapa: el token solo
              aguanta si hay demanda fuera de él.
            </p>
            {/* EXPERIENCIA DEL ADMIN: si has probado una subred (por ejemplo, usar Chutes como cliente, hacer staking en una subred o seguir su precio alfa), aquí encaja contarlo: qué hiciste, cuánto costó y qué te sorprendió. */}
          </div>
        </div>
      </section>

      {/* ── 7 ── */}
      <section id="hacienda" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Desde España</div>
          <h2 className="gbc-title">Staking de TAO y tokens alfa: qué pide Hacienda</h2>
          <div className="gbc-body">
            <p>
              Ninguna norma española habla de Bittensor, y la Dirección General de Tributos no ha resuelto ninguna
              consulta sobre sus tokens alfa. Así que lo que sigue no es un criterio oficial: es la lectura
              prudente de la academia, aplicando las reglas generales. El problema es que dTAO convierte en
              operaciones sujetas cosas que parecen simples gestiones de staking.
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Lo que haces</th><th>Qué es para Hacienda</th><th>Cómo se calcula</th></tr></thead>
              <tbody>
                <tr><td><strong>Cobrar recompensas de staking</strong>, en TAO o en alfa</td><td>Rendimiento del capital mobiliario, en la base del ahorro</td><td>Valor en euros el día que las recibes, aunque no vendas</td></tr>
                <tr><td><strong>Pasar TAO a una subred</strong></td><td>Permuta: cambias TAO por otro criptoactivo</td><td>Ganancia o pérdida entre lo que te costó el TAO y lo que valía al cambiarlo</td></tr>
                <tr><td><strong>Sacar alfa de una subred</strong></td><td>Otra permuta, ahora de alfa a TAO</td><td>Lo mismo, con el coste de ese alfa</td></tr>
                <tr><td><strong>Mover tu delegación en el root</strong></td><td>Sin cambio de moneda: no parece haber permuta</td><td>Nada que declarar por el movimiento</td></tr>
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Criterios: consulta vinculante V1766-22 de la DGT sobre el staking, y artículo 37.1.h de la Ley 35/2006
            del IRPF sobre las permutas. La aplicación a los tokens alfa es interpretación de la academia: no hay
            consulta específica a noviembre de 2026.
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Un ejemplo. Compraste 10 TAO a 200 € y hoy valen 250 €. Los pasas a una subred: con ese criterio, tienes una
              ganancia de 500 € que declarar, aunque no hayas tocado un euro. Si ese alfa luego cae a la mitad, la pérdida existe,
              pero solo cuenta cuando lo cambies de vuelta. Y cada recompensa que cobres se suma aparte, a precio del
              día.
            </p>
            <p>
              Con decenas de recompensas al día, llevar la cuenta a mano es imposible. Exploradores como Taostats
              permiten descargar tu historial; guárdalo cada año. El método para ordenar compras y ventas, el
              <Termino slug="fifo"> FIFO</Termino>, y los tramos que pagarás están en la guía de
              <Link href="/guias/fiscalidad-cripto-espana"> fiscalidad de las criptomonedas en España</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* ── 8 ── */}
      <section id="riesgos" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que puede salir mal</div>
          <h2 className="gbc-title">Los riesgos de Bittensor, con fechas</h2>
          <div className="gbc-body">
            <p>
              Bittensor ya ha tenido sus sustos, y conviene conocerlos antes de comprar un solo TAO. El más serio
              fue en julio de 2024.
            </p>
          </div>
          <div className="gbc-box gbc-box--red">
            <div className="gbc-box-title">El robo de julio de 2024, y por qué se paró la red</div>
            <div className="gbc-box-body">
              <p>
                El 2 de julio de 2024 se robaron unos 32.000 TAO, cerca de 8 millones de dólares, de carteras de
                usuarios. La blockchain no se rompió. Alguien subió al repositorio público de Python una versión falsa
                de la librería de Bittensor, la 6.12.2. Llevaba un <Termino slug="malware">malware</Termino> que
                enviaba la <Termino slug="clave-privada">clave privada</Termino> de quien la usaba a un servidor del
                atacante.
              </p>
              <p>
                Unos 35 minutos después del primer robo, la Opentensor Foundation puso a los validadores en «modo
                seguro» y la red dejó de procesar transferencias. Dos días después seguía sin hacerlo. Cortó el robo,
                pero también demostró que un grupo pequeño podía detener la cadena. Fuente: informe posterior de la fundación,
                recogido por The Block el 4 de julio de 2024.
              </p>
            </div>
          </div>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <ul>
              <li><strong>Concentración.</strong> En abril de 2026 Covenant, el equipo detrás de tres de las quince mayores subredes, se marchó y cerró sus subredes. Sus alfas cayeron hasta un 40 % al instante y TAO, un 24 % en horas, según FalconX. El modo Null, además, deja la nota de una subred en manos de un solo validador.</li>
              <li><strong>Gobernanza poco clara.</strong> Covenant alegó que el cofundador Jacob Steeves seguía mandando de hecho tras dejar la dirección de la fundación en febrero de 2026; él lo negó. Las reglas de la <Termino slug="gobernanza">gobernanza</Termino> cambian a menudo, con varias versiones de la red en una sola semana.</li>
              <li><strong>Emisión sin clientes.</strong> Si los ingresos reales no crecen, la red reparte TAO nuevo entre quienes lo venden para pagar sus servidores. Es presión vendedora diaria.</li>
              <li><strong>Doble riesgo en las subredes.</strong> El alfa suma su propia <Termino slug="volatilidad">volatilidad</Termino> a la de TAO, y en fondos pequeños la <Termino slug="liquidez">liquidez</Termino> es escasa: en mayo de 2026 solo cuatro aguantaban una compra de un millón de dólares sin que su precio se moviera más de un 2 %.</li>
              <li><strong>Tu propia seguridad.</strong> El robo de 2024 entró por el ordenador del usuario. Instala software solo desde la fuente oficial y no guardes claves sin cifrar.</li>
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
          <h2 className="gbc-title">Comprueba lo que sabes de Bittensor</h2>
          <div className="gbc-body" style={{ marginBottom: 32 }}>
            <p>Cinco preguntas. Con las cinco acertadas desbloqueas el logro <strong style={{ color: "var(--gold)" }}>Mente Distribuida</strong>.</p>
          </div>
          {d.isRegistered ? <GuideBittensorQuiz /> : <GuideQuizCuenta slug={SLUG} />}
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
