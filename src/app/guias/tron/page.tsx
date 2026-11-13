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
import GuideTronEnvio from "./GuideTronEnvio";
import GuideTronQuiz from "./GuideTronQuiz";
import "./tron.css";

/**
 * Guía «Qué es TRON» (13-11-2026). Consulta objetivo: «qué es tron».
 *
 * Está contada desde un caso práctico: enviar 500 USDT. Casi nadie llega a
 * TRON por TRX; llega porque le han dicho «mándamelo por TRC-20». Lo que tiene
 * y las demás no: el recibo de un envío desglosado (energía y ancho de banda),
 * una calculadora del coste real, y lo que casi nadie cuenta a la vez: que el
 * emisor puede congelar el USDT y que en la UE ya no se vende en exchanges.
 *
 * Al revisarla: precio de la energía (lo votan los superrepresentantes), el
 * USDT en circulación y el estado del caso de la SEC.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/guias/tron" },
  title: "Qué es TRON (TRX) y por qué mueve el USDT",
  description:
    "Qué es TRON y para qué sirve TRX: por qué casi todo el USDT se envía por su red, cuánto cuesta de verdad un envío TRC-20, quién la controla y sus riesgos.",
  openGraph: {
    title: "Qué es TRON (TRX): la red por la que viaja el USDT",
    description:
      "TRON contado desde un envío de 500 USDT: qué son la energía y el ancho de banda, una calculadora del coste real, quién manda en la red y qué puede salir mal.",
    type: "article",
  },
};

const SLUG = "tron";

const SECCIONES = [
  { id: "que-es", label: "Qué es" },
  { id: "usdt", label: "Por qué el USDT" },
  { id: "comisiones", label: "Cuánto cuesta" },
  { id: "trx", label: "Para qué sirve TRX" },
  { id: "quien-manda", label: "Quién manda" },
  { id: "congelar", label: "Lo que no te cuentan" },
  { id: "errores", label: "Errores caros" },
  { id: "riesgos", label: "Riesgos" },
  { id: "quiz", label: "Quiz" },
];

export default async function TronPage() {
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
          Qué es TRON (TRX)<br />
          <span className="gbc-hero-gold">la red por la que viaja el USDT</span>
        </h1>
        <p className="gbc-respuesta">
          <strong>TRON es una blockchain pensada para mover dinero rápido y barato, y TRX es su moneda.</strong> Casi
          nadie llega a ella por TRX: llega porque cerca de la mitad del USDT del mundo, el dólar digital más
          usado, circula por su red. Cuando alguien te pide «mándamelo por TRC-20», te está pidiendo que uses
          TRON.
        </p>
        <p className="gbc-revisado">Revisada el <strong>13 de noviembre de 2026</strong> · Parámetros de la red: documentación de TRON</p>
        <div className="gbc-hero-pills">
          <span className="gbc-pill">El recibo de un envío, desglosado</span>
          <span className="gbc-pill">Calculadora de coste</span>
          <span className="gbc-pill">Quiz con logro</span>
        </div>
      </header>

      {/* ── 1 ── */}
      <section id="que-es" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo básico</div>
          <h2 className="gbc-title">Qué es TRON y de dónde sale</h2>
          <div className="gbc-body">
            <p>
              TRON es una <Termino slug="blockchain">blockchain</Termino> que funciona desde junio de 2018. La
              fundó Justin Sun, un empresario chino que entonces tenía 27 años, con una promesa que hoy casi
              nadie recuerda: ser la base de un internet del entretenimiento sin intermediarios.
            </p>
            <p>
              Aquello no cuajó. Lo que sí cuajó fue otra cosa, bastante menos romántica. TRON resultó ser una
              red rápida, con comisiones bajas y compatible con las herramientas de
              <Link href="/guias/ethereum"> Ethereum</Link>. Justo lo que necesitaba quien solo quería enviar
              dólares digitales de un sitio a otro.
            </p>
            <p>
              Por eso esta guía no empieza por la tecnología. Empieza por el uso real, que es uno: mover
              <Termino slug="stablecoin"> stablecoins</Termino>. Vamos a seguir un caso durante toda la guía.
              Tienes 500 USDT y quieres enviárselos a alguien.
            </p>
          </div>
        </div>
      </section>

      {/* ── 2 ── */}
      <section id="usdt" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Su uso real</div>
          <h2 className="gbc-title">Por qué casi todo el USDT se mueve por TRON</h2>
          <div className="gbc-body">
            <p>
              USDT es una moneda digital que vale un dólar. La emite una empresa, Tether, y existe en varias
              redes a la vez: es el mismo dólar con distintas matrículas. La de Ethereum se llama ERC-20. La de
              TRON, <strong>TRC-20</strong>.
            </p>
            <p>
              Durante años, enviar USDT por Ethereum costaba varios dólares, a veces decenas. Por TRON costaba
              céntimos o nada. Para alguien que manda 200 dólares a su familia desde otro país, la elección
              estaba hecha. Así se convirtió en la red del USDT en América Latina, Turquía, África y el sudeste
              asiático.
            </p>
          </div>
          <div className="tron-cifras">
            <div><strong>+90.000 M$</strong><span>en USDT circulando por TRON a comienzos de octubre de 2026</span></div>
            <div><strong>2,1 billones $</strong><span>movidos en USDT por la red solo en el segundo trimestre de 2026</span></div>
            <div><strong>3 segundos</strong><span>tarda en producirse cada bloque</span></div>
          </div>
          <p className="gbc-fuente">
            USDT en circulación: DefiLlama, 1 de octubre de 2026. Volumen del trimestre: informe de Messari sobre
            TRON. «Billones» en el sentido español: millones de millones.
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Lo interesante es que la ventaja de precio ya no es la de antes. Enviar USDT por Ethereum o por
              sus redes auxiliares cuesta hoy céntimos, y por TRON, como vas a ver, cuesta más de lo que la
              gente cree. Si sigue siendo la red del USDT es por costumbre: es donde están los cajeros, las
              casas de cambio y los contactos de medio mundo.
            </p>
          </div>
        </div>
      </section>

      {/* ── 3 ── */}
      <section id="comisiones" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Con números</div>
          <h2 className="gbc-title">Cuánto cuesta enviar USDT por TRON (TRC-20)</h2>
          <div className="gbc-body">
            <p>
              Aquí está lo que confunde a todo el mundo. TRON no cobra una comisión en el sentido habitual.
              Cada operación consume dos recursos, y la red te los cobra de dos maneras posibles.
            </p>
            <ul>
              <li><strong>Ancho de banda:</strong> el espacio que ocupa tu operación. Cada cuenta recibe un poco gratis cada día, suficiente para un envío sencillo de TRX.</li>
              <li><strong>Energía:</strong> el cálculo que exige ejecutar un <Termino slug="smart-contract">contrato inteligente</Termino>. Enviar USDT lo es, y gasta mucha.</li>
            </ul>
            <p>
              Si no tienes esos recursos, la red los cobra quemando TRX de tu cartera. Este es el recibo de tu
              envío de 500 USDT, con los parámetros en vigor en noviembre de 2026:
            </p>
          </div>

          <div className="tron-recibo">
            <p className="tron-recibo-titulo">Envío de 500 USDT por TRC-20</p>
            <dl>
              <div><dt>Energía que consume</dt><dd>≈ 65.000 unidades</dd></div>
              <div><dt>Precio de la energía</dt><dd>0,0001 TRX por unidad</dd></div>
              <div><dt>Coste de la energía</dt><dd>≈ 6,5 TRX</dd></div>
              <div><dt>Ancho de banda (si no te queda gratis)</dt><dd>≈ 0,35 TRX</dd></div>
              <div className="es-total"><dt>Total que se quema de tu cartera</dt><dd>≈ 6,9 TRX</dd></div>
            </dl>
            <p className="tron-recibo-nota">
              Si la dirección de destino nunca ha tenido USDT, la energía se dobla: unas 130.000 unidades y
              cerca de 13 TRX.
            </p>
          </div>

          <div className="gbc-body" style={{ marginTop: 26 }}>
            <p>
              Fíjate en dos cosas. La primera: el coste no depende de la cantidad. Enviar 5 USDT cuesta lo
              mismo que enviar 50.000. La segunda: se paga en TRX, no en USDT. Calcula lo que supone en euros
              con el precio de TRX que veas hoy:
            </p>
          </div>

          <GuideTronEnvio />

          <div className="gbc-body" style={{ marginTop: 26 }}>
            <p>
              El precio de la energía no es fijo. Lo votan quienes gobiernan la red: en agosto de 2025 lo
              bajaron a menos de la mitad, de 0,00021 a 0,0001 TRX por unidad. Pueden volver a cambiarlo.
            </p>
          </div>
        </div>
      </section>

      {/* ── Anuncio de media guía ── */}
      <GuiaAnuncio producto="cursos" variante="compacto" estado={d.estado} />

      {/* ── 4 ── */}
      <section id="trx" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">La moneda</div>
          <h2 className="gbc-title">Para qué sirve TRX</h2>
          <div className="gbc-body">
            <p>
              TRX es la moneda propia de TRON, y tiene tres trabajos. Los tres giran en torno a lo mismo: los
              recursos de la red.
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Lo que haces con TRX</th><th>Qué consigues</th><th>La letra pequeña</th></tr></thead>
              <tbody>
                <tr><td><strong>Tenerlo y dejar que se queme</strong></td><td>Pagar cada operación sobre la marcha</td><td>Es lo más caro por envío, y lo más cómodo si envías poco</td></tr>
                <tr><td><strong>Bloquearlo</strong></td><td>Energía o ancho de banda cada día, sin quemar nada</td><td>Hace falta mucho: del orden de miles de TRX para cubrir un envío de USDT al día</td></tr>
                <tr><td><strong>Votar con lo bloqueado</strong></td><td>Elegir a quienes producen los bloques y cobrar una parte de sus recompensas</td><td>Recuperar los TRX bloqueados tarda 14 días</td></tr>
              </tbody>
            </table>
          </div>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Bloquear TRX es su <Termino slug="staking">staking</Termino>. Paga un rendimiento bajo, de un
              dígito, y sobre todo ahorra comisiones a quien usa mucho la red.
            </p>
            <p>
              Un detalle que distingue a TRX de casi todas las demás: no tiene tope de monedas, pero cada
              operación pagada sin recursos quema TRX para siempre. Con tanto USDT moviéndose, hace tiempo que
              se destruyen más TRX de los que se crean. Esa <Termino slug="quema-de-tokens">quema</Termino> depende
              de que la red se siga usando: si el USDT se muda a otra parte, se acaba.
            </p>
          </div>
        </div>
      </section>

      {/* ── 5 ── */}
      <section id="quien-manda" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">El gobierno de la red</div>
          <h2 className="gbc-title">Quién controla TRON: 27 superrepresentantes y un fundador</h2>
          <div className="gbc-body">
            <p>
              En TRON no hay mineros. Los bloques los producen, por turnos, 27 participantes llamados
              superrepresentantes. Se eligen con los votos de quienes tienen TRX bloqueados, y la lista se
              revisa cada seis horas. Es una variante de la
              <Termino slug="prueba-de-participacion"> prueba de participación</Termino>.
            </p>
            <p>
              Veintisiete son muy pocos. En Ethereum hay cientos de miles de
              <Termino slug="validador"> validadores</Termino>. Con 27 la red va rápida y los cambios se aprueban
              en días, como la rebaja de la energía. A cambio, basta con que se pongan de acuerdo 19 para
              decidir cualquier cosa.
            </p>
            <p>
              Y luego está Justin Sun. Formalmente dejó la dirección de la Fundación TRON a finales de 2021 y
              la red pasó a manos de una organización de la comunidad. En la práctica sigue siendo su cara, su
              portavoz y, según se le atribuye de forma habitual, su mayor tenedor.
            </p>
          </div>
          <div className="gbc-box gbc-box--gold">
            <div className="gbc-box-title">El caso de la SEC, y cómo acabó</div>
            <div className="gbc-box-body">
              <p>En marzo de 2023, el regulador de los mercados de Estados Unidos demandó a Sun y a sus empresas.
              Les acusaba de vender TRX sin registrarlo y de inflar su volumen con operaciones falsas, lo que se
              llama <Termino slug="wash-trading">wash trading</Termino>. En marzo de 2026 se anunció un acuerdo: una de las
              empresas paga 10 millones de dólares y se retiran las acusaciones contra Sun, sin admitir ni
              negar los hechos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6 ── */}
      <section id="congelar" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que casi nadie explica</div>
          <h2 className="gbc-title">El USDT de TRON se puede congelar, y en Europa cuesta encontrarlo</h2>
          <div className="gbc-body">
            <p>
              Volvamos a tus 500 USDT. Hay dos cosas sobre ellos que no tienen que ver con TRON y que te
              afectan más que cualquier detalle técnico.
            </p>
            <p>
              <strong>La primera: no son del todo tuyos.</strong> El contrato del USDT permite a Tether congelar
              el saldo de cualquier dirección. Lo hace a petición de autoridades y por iniciativa propia.
              Desde 2024 trabaja con TRON y con la empresa de análisis TRM Labs en una unidad conjunta, llamada
              T3, que ha bloqueado cientos de millones de dólares vinculados a estafas y otros delitos.
            </p>
            <p>
              Tiene su lógica: TRON es también la red favorita de quien mueve dinero ilícito. Varios informes de
              empresas de análisis la sitúan como la blockchain con más volumen de ese tipo. Pero el
              mecanismo es el mismo para todos. Si recibes USDT que venía de una dirección marcada, el
              congelado puedes ser tú.
            </p>
            <p>
              <strong>La segunda: en la Unión Europea ya no se vende en los exchanges.</strong> La norma MiCA
              exige una licencia europea a quien emite una stablecoin, y Tether no la ha pedido. Por eso los
              exchanges autorizados en la UE retiraron el USDT de su oferta para clientes europeos a comienzos
              de 2025. Tenerlo en tu <Termino slug="wallet">cartera</Termino> no está prohibido; lo difícil es
              convertirlo en euros por una vía regulada.
            </p>
          </div>
          <div className="gbc-box gbc-box--red">
            <div className="gbc-box-title">Antes de aceptar un pago en USDT por TRC-20</div>
            <div className="gbc-box-body">
              <p>Pregúntate cómo vas a convertirlo en euros. Si la respuesta es «ya veré», el problema no lo
              tiene quien te paga: lo tienes tú.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7 ── */}
      <section id="errores" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">El error típico</div>
          <h2 className="gbc-title">Los cuatro errores más caros al usar TRON</h2>
          <ol className="tron-errores">
            <li>
              <strong>Tener USDT y cero TRX.</strong>
              <p>Es el más frecuente. Recibes USDT en una cartera nueva y no puedes moverlos, porque la
              comisión se paga en TRX y no tienes. Necesitas que alguien te envíe unos pocos TRX antes.</p>
            </li>
            <li>
              <strong>Equivocarte de red.</strong>
              <p>Las direcciones de TRON empiezan por T. Las de Ethereum, por 0x. Un exchange que espera USDT
              por una red no lo ve si llega por otra. Elige la red en el origen y en el destino, y comprueba
              que coinciden.</p>
            </li>
            <li>
              <strong>Copiar la dirección del historial.</strong>
              <p>Hay estafadores que te envían cantidades mínimas desde una dirección que se parece a una que
              usas. Es el <Termino slug="envenenamiento-de-direcciones">envenenamiento de direcciones</Termino>, y
              TRON es su terreno preferido. Copia siempre la dirección de su origen, nunca del historial.</p>
            </li>
            <li>
              <strong>No hacer un envío de prueba.</strong>
              <p>Como el coste es fijo, enviar primero 5 USDT cuesta lo mismo que enviar 5.000. Es el seguro
              más barato que existe contra los tres errores anteriores.</p>
            </li>
          </ol>
        </div>
      </section>

      {/* ── 8 ── */}
      <section id="riesgos" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que puede salir mal</div>
          <h2 className="gbc-title">Los riesgos de TRON y de TRX</h2>
          <div className="gbc-body">
            <ul>
              <li><strong>Depende de un solo uso.</strong> El valor de la red es mover USDT. Si Tether prioriza otra red o lanza la suya, TRON pierde su razón de ser.</li>
              <li><strong>Depende de una persona.</strong> Pocas redes grandes están tan asociadas a su fundador, y pocas figuras han acumulado tantas polémicas.</li>
              <li><strong>Está concentrada.</strong> 27 productores de bloques. Rápido, y fácil de presionar.</li>
              <li><strong>Su reputación pesa.</strong> Ser la red con más dinero ilícito atrae la atención de los reguladores y de los bancos.</li>
              <li><strong>El precio.</strong> TRX es una criptomoneda, con la <Termino slug="volatilidad">volatilidad</Termino> de cualquier otra.</li>
            </ul>
            <p>
              En cuanto a Hacienda, cambiar euros por USDT, USDT por TRX o cualquiera de ellos por otra moneda
              es una operación que tributa. También lo es cada vez que se queman TRX para pagar una comisión,
              aunque el importe sea mínimo. El detalle está en la guía de
              <Link href="/guias/fiscalidad-cripto-espana"> fiscalidad de las criptomonedas en España</Link>.
            </p>
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
          <h2 className="gbc-title">Comprueba lo que sabes de TRON</h2>
          <div className="gbc-body" style={{ marginBottom: 32 }}>
            <p>Cinco preguntas. Con las cinco acertadas desbloqueas el logro <strong style={{ color: "var(--gold)" }}>Peaje Pagado</strong>.</p>
          </div>
          {d.isRegistered ? <GuideTronQuiz /> : <GuideQuizCuenta slug={SLUG} />}
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
