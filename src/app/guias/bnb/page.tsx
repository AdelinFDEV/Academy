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
import GuideBnbQuema from "./GuideBnbQuema";
import GuideBnbQuiz from "./GuideBnbQuiz";
import "./bnb.css";

/**
 * Guía «Qué es BNB» (13-11-2026). Consulta objetivo: «qué es bnb».
 *
 * El hilo: BNB tiene dos vidas, la de moneda de la casa de Binance y la de
 * combustible de una red propia, y en 2026 se han separado para quien vive en
 * España, porque Binance se quedó sin licencia europea. Lo que tiene y las
 * demás no: las quemas de 2026 una a una, una calculadora de cuánto falta para
 * los 100 millones y qué significa BNB para un europeo sin Binance.
 *
 * Al revisarla: TODO lo de la licencia MiCA de Binance (cambia por semanas),
 * la última quema y los parámetros de la red.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/guias/bnb" },
  title: "Qué es BNB y para qué sirve sin Binance",
  description:
    "Qué es BNB: la moneda de Binance y el combustible de BNB Chain. Cómo funcionan sus quemas, qué riesgos tiene y qué cambia en España tras la salida de Binance.",
  openGraph: {
    title: "Qué es BNB: la moneda de Binance, explicada desde España",
    description:
      "Las dos vidas de BNB, sus quemas con cifras de 2026, una calculadora de cuánto falta para los 100 millones y lo que cambia sin Binance en Europa. Con quiz.",
    type: "article",
  },
};

const SLUG = "bnb";

const SECCIONES = [
  { id: "que-es", label: "Qué es" },
  { id: "dos-vidas", label: "Sus dos vidas" },
  { id: "quemas", label: "Las quemas" },
  { id: "red", label: "BNB Chain" },
  { id: "espana", label: "Sin Binance" },
  { id: "historial", label: "Historial" },
  { id: "errores", label: "Errores caros" },
  { id: "riesgos", label: "Riesgos" },
  { id: "quiz", label: "Quiz" },
];

const QUEMAS = [
  { n: "34.ª", fecha: "15 de enero", quemado: "1.371.804", quedan: "136,36 millones" },
  { n: "35.ª", fecha: "15 de abril", quemado: "≈ 1.570.000", quedan: "134,79 millones" },
  { n: "36.ª", fecha: "15 de julio", quemado: "1.615.828", quedan: "133,17 millones" },
  { n: "La de otoño", fecha: "19 de octubre", quemado: "≈ 1.650.000", quedan: "131,51 millones" },
];

const HISTORIAL = [
  { fecha: "Julio de 2017", titulo: "Nace con una venta pública", texto: "Binance crea 200 millones de BNB y vende la mitad para financiar el exchange. Su única utilidad entonces: pagar menos comisiones." },
  { fecha: "Septiembre de 2020", titulo: "Estrena red compatible con Ethereum", texto: "Arranca Binance Smart Chain, hoy BNB Chain. BNB pasa a ser el gas de una red entera, no solo un cupón de descuento." },
  { fecha: "Octubre de 2022", titulo: "Un fallo en su puente crea 2 millones de BNB", texto: "Un atacante fabrica de la nada unos 570 millones de dólares. Los validadores paran la red durante horas para contenerlo." },
  { fecha: "Noviembre de 2023", titulo: "Binance se declara culpable en EE. UU.", texto: "Acepta pagar 4.300 millones de dólares por fallos contra el blanqueo. Su fundador, Changpeng Zhao, dimite y cumple cuatro meses de prisión en 2024." },
  { fecha: "Octubre de 2025", titulo: "Indulto y máximo histórico", texto: "El presidente de EE. UU. indulta a Zhao. Ese mismo mes BNB marca su precio más alto, por encima de los 1.300 dólares." },
  { fecha: "Julio de 2026", titulo: "Binance se queda fuera de la UE", texto: "Termina el plazo de la norma europea MiCA sin que Binance tenga licencia, y deja de dar servicio a sus clientes de España." },
];

export default async function BnbPage() {
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
        <div className="gbc-hero-ey">Guía de criptomonedas · Nivel básico · 13 min</div>
        <h1 className="gbc-hero-title">
          Qué es BNB<br />
          <span className="gbc-hero-gold">y para qué sirve sin Binance</span>
        </h1>
        <p className="gbc-respuesta">
          <strong>BNB es la moneda que creó Binance, el mayor exchange del mundo, y a la vez el combustible de
          su propia red, BNB Chain.</strong> Sirve para pagar las comisiones de esa red y daba ventajas dentro
          del exchange. Desde julio de 2026 Binance no puede operar en España, así que aquí solo queda la
          primera mitad.
        </p>
        <p className="gbc-revisado">Revisada el <strong>13 de noviembre de 2026</strong> · Cifras de quemas: avisos trimestrales de BNB Chain</p>
        <div className="gbc-hero-pills">
          <span className="gbc-pill">Las quemas de 2026, una a una</span>
          <span className="gbc-pill">Qué cambia en España</span>
          <span className="gbc-pill">Quiz con logro</span>
        </div>
      </header>

      {/* ── 1 ── */}
      <section id="que-es" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo básico</div>
          <h2 className="gbc-title">Qué es BNB, en pocas palabras</h2>
          <div className="gbc-body">
            <p>
              BNB son las siglas de «Build and Build». Antes se llamaba Binance Coin, y el cambio de nombre no
              es casual: la empresa lleva años intentando que la moneda no dependa de ella.
            </p>
            <p>
              Nació en julio de 2017 como un vale de descuento. Quien pagaba las comisiones del
              <Termino slug="exchange"> exchange</Termino> con BNB pagaba menos. Para financiarse, Binance creó 200
              millones de monedas y vendió la mitad al público. No había red propia, ni aplicaciones, ni nada
              más detrás.
            </p>
            <p>
              Hoy es otra cosa. Es una de las cinco criptomonedas más grandes por
              <Termino slug="market-cap"> capitalización</Termino>, tiene su propia
              <Termino slug="blockchain"> blockchain</Termino> y sobre ella funcionan miles de aplicaciones. Pero
              sigue cargando con su origen: buena parte de su valor depende de cómo le vaya a una sola empresa.
            </p>
          </div>
        </div>
      </section>

      {/* ── 2 ── */}
      <section id="dos-vidas" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Para qué sirve</div>
          <h2 className="gbc-title">Las dos vidas de BNB: el exchange y la red</h2>
          <div className="gbc-body">
            <p>
              Para entender BNB hay que separar dos cosas que casi siempre se cuentan mezcladas. Una depende de
              Binance. La otra, no.
            </p>
          </div>
          <div className="bnb-vidas">
            <div className="bnb-vida">
              <p className="bnb-vida-rotulo">Dentro de Binance</p>
              <p className="bnb-vida-titulo">La moneda de la casa</p>
              <ul>
                <li>Descuento en las comisiones de compraventa</li>
                <li>Acceso a los repartos de monedas nuevas del exchange</li>
                <li>Garantía para operar con derivados dentro de la plataforma</li>
              </ul>
              <p className="bnb-vida-pie">Todo esto exige tener cuenta en Binance.</p>
            </div>
            <div className="bnb-vida bnb-vida--red">
              <p className="bnb-vida-rotulo">Fuera de Binance</p>
              <p className="bnb-vida-titulo">El combustible de BNB Chain</p>
              <ul>
                <li>Paga el <Termino slug="gas">gas</Termino> de cada operación en la red</li>
                <li>Se deja como fianza para validar: es su <Termino slug="staking">staking</Termino></li>
                <li>Da voto en las decisiones técnicas de la red</li>
              </ul>
              <p className="bnb-vida-pie">Todo esto se hace desde tu propia cartera, sin cuenta en ningún sitio.</p>
            </div>
          </div>
          <div className="gbc-body" style={{ marginTop: 26 }}>
            <p>
              La distinción importa más que nunca. Durante años, la primera columna fue la razón por la que la
              gente compraba BNB. Para quien vive en España, esa columna ha dejado de existir, como verás más
              abajo. Lo que queda es la segunda.
            </p>
          </div>
        </div>
      </section>

      {/* ── 3 ── */}
      <section id="quemas" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que la hace distinta</div>
          <h2 className="gbc-title">Las quemas de BNB: por qué cada trimestre hay menos</h2>
          <div className="gbc-body">
            <p>
              BNB no se mina ni se crea. Al revés: se destruye. Cada tres meses, una cantidad de monedas se
              envía a una dirección de la que nadie puede sacarlas. A eso se le llama
              <Termino slug="quema-de-tokens"> quema</Termino>, y el objetivo declarado es bajar de los 200 millones
              iniciales a 100 millones.
            </p>
            <p>
              Hay dos mecanismos. El grande es la quema trimestral: una fórmula calcula cuánto destruir según
              el precio de BNB y el número de bloques producidos. Cuando el precio baja, se queman más
              monedas. El pequeño funciona en cada bloque: una parte de las comisiones que pagan los usuarios se
              destruye al momento.
            </p>
            <p>Estas son las quemas trimestrales de 2026, con lo que quedaba después de cada una:</p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Quema</th><th>Fecha (2026)</th><th>BNB destruidos</th><th>Quedan en total</th></tr></thead>
              <tbody>
                {QUEMAS.map((q) => (
                  <tr key={q.n}><td><strong>{q.n}</strong></td><td>{q.fecha}</td><td>{q.quemado}</td><td>{q.quedan}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Avisos de quema publicados por BNB Chain. Las cifras con «≈» están redondeadas a partir de lo que
            quedaba antes y después.
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              En un año se ha destruido cerca del 4,5 % de todos los BNB. La pregunta útil es cuánto falta para
              llegar al objetivo. Depende del ritmo, y el ritmo cambia con el precio. Muévelo tú:
            </p>
          </div>

          <GuideBnbQuema />

          <div className="gbc-box gbc-box--gold" style={{ marginTop: 26 }}>
            <div className="gbc-box-title">Quemar no es regalar dinero</div>
            <div className="gbc-box-body">
              <p>Que haya menos monedas solo sube el precio si la demanda se mantiene. Una quema reduce la
              <Termino slug="oferta-circulante"> oferta</Termino>; no crea compradores. Y cuando se llegue a
              100 millones, las quemas trimestrales se acaban.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Anuncio de media guía ── */}
      <GuiaAnuncio producto="portfolio" variante="compacto" estado={d.estado} />

      {/* ── 4 ── */}
      <section id="red" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">La red</div>
          <h2 className="gbc-title">Qué es BNB Chain y por qué es tan barata</h2>
          <div className="gbc-body">
            <p>
              BNB Chain es una copia adaptada de <Link href="/guias/ethereum">Ethereum</Link>. Usa las mismas
              direcciones, las mismas carteras y el mismo tipo de
              <Termino slug="smart-contract"> contratos inteligentes</Termino>. La diferencia está en quién la
              mantiene.
            </p>
            <p>
              En Ethereum validan cientos de miles de participantes. En BNB Chain lo hacen unas pocas decenas
              de <Termino slug="validador">validadores</Termino>, elegidos por la cantidad de BNB que los respalda.
              Con tan pocos, ponerse de acuerdo es rápido y barato. También es menos resistente: quien
              controle a un puñado de ellos controla la red.
            </p>
          </div>
          <div className="bnb-cifras">
            <div><strong>0,45 s</strong><span>entre un bloque y el siguiente, tras las mejoras de 2025 y enero de 2026</span></div>
            <div><strong>0,05 gwei</strong><span>precio mínimo del gas desde otoño de 2025: una operación sencilla cuesta menos de un céntimo</span></div>
            <div><strong>Decenas</strong><span>de validadores, frente a los cientos de miles de Ethereum</span></div>
          </div>
          <div className="gbc-body" style={{ marginTop: 26 }}>
            <p>
              Ese es el trato, y conviene decirlo claro. BNB Chain ofrece comisiones casi nulas a cambio de
              concentrar el control. En octubre de 2022 se vio la cara útil de esa concentración: los
              validadores pararon la red en horas para frenar un robo. Y se vio la otra: una red que unos pocos
              pueden parar no es una red que nadie pueda parar.
            </p>
          </div>
        </div>
      </section>

      {/* ── 5 ── */}
      <section id="espana" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Desde España</div>
          <h2 className="gbc-title">Qué pasa con BNB ahora que Binance no opera en España</h2>
          <div className="gbc-body">
            <p>
              Desde el 1 de julio de 2026, ninguna empresa puede ofrecer servicios de criptomonedas en la Unión
              Europea sin la licencia que exige la norma <Termino slug="mica">MiCA</Termino>. Binance la pidió en Grecia en enero y retiró la
              solicitud el 24 de junio, cuando ya se daba por hecho que se la iban a denegar.
            </p>
            <p>
              La consecuencia para sus clientes de España ha llegado por fases. Primero se quedaron sin poder
              depositar ni comprar: solo vender y retirar. En noviembre, Binance les ha comunicado que cerrará
              las cuentas afectadas el 31 de diciembre de 2026, y que a partir del 29 de noviembre cobrará una
              comisión mensual sobre el saldo que quede dentro.
            </p>
          </div>
          <div className="gbc-box gbc-box--red">
            <div className="gbc-box-title">Si todavía tienes saldo en Binance</div>
            <div className="gbc-box-body">
              <p>Lee el correo que te haya enviado el propio exchange y actúa según lo que diga tu cuenta, no
              según lo que leas en redes. La situación ha cambiado varias veces en pocos meses: lo escrito aquí
              refleja lo publicado hasta el 13 de noviembre de 2026.</p>
            </div>
          </div>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>¿Y qué significa esto para BNB? Tres cosas.</p>
            <ul>
              <li><strong>BNB no desaparece.</strong> La moneda vive en BNB Chain, que no es una empresa ni necesita licencia. Puedes tenerla en tu propia <Termino slug="wallet">cartera</Termino> y usarla como siempre.</li>
              <li><strong>Pierde su primera utilidad.</strong> Sin cuenta en Binance no hay descuentos ni repartos. Para un residente en España, BNB es hoy solo el gas de una red.</li>
              <li><strong>Comprarla es menos directo.</strong> Hay que hacerlo en un exchange con licencia europea que la tenga listada, o cambiarla por otra moneda en un <Termino slug="dex">exchange descentralizado</Termino>.</li>
            </ul>
            <p>
              Es un buen ejemplo de por qué la <Termino slug="autocustodia">autocustodia</Termino> no es una manía
              de puristas. Quien tenía sus BNB en una cartera propia no ha tenido que hacer nada. Quien los
              tenía en el exchange ha recibido un plazo.
            </p>
          </div>
        </div>
      </section>

      {/* ── 6 ── */}
      <section id="historial" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">De dónde viene</div>
          <h2 className="gbc-title">La historia de BNB en seis fechas</h2>
          <div className="gbc-body">
            <p>Ninguna otra moneda grande tiene una historia tan pegada a la de una empresa. Estas son las fechas que explican su precio y sus riesgos.</p>
          </div>
          <ol className="bnb-historial">
            {HISTORIAL.map((h) => (
              <li key={h.fecha}>
                <span className="bnb-historial-fecha">{h.fecha}</span>
                <div><strong>{h.titulo}</strong><p>{h.texto}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── 7 ── */}
      <section id="errores" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">El error típico</div>
          <h2 className="gbc-title">Los tres errores que más dinero cuestan con BNB</h2>
          <div className="gbc-body">
            <p>
              <strong>Enviarla por la red equivocada.</strong> Como BNB Chain usa las mismas direcciones que
              Ethereum, un envío a la red que no es llega a una dirección que parece la tuya. Las monedas no se
              pierden si la cartera es tuya, pero recuperarlas exige saber lo que haces. Si el destino es un
              exchange que no admite esa red, pueden perderse del todo. Comprueba siempre la red antes de
              enviar.
            </p>
            <p>
              <strong>Quedarte sin BNB para el gas.</strong> En BNB Chain, toda operación se paga en BNB. Puedes
              tener mil dólares en una <Termino slug="stablecoin">stablecoin</Termino> y no poder moverlos por no
              tener unos céntimos de BNB. Deja siempre un poco.
            </p>
            <p>
              <strong>Fiarte de una moneda porque «está en BNB Chain».</strong> Crear una moneda en esta red
              cuesta céntimos. Por eso es el terreno favorito de los proyectos que nacen para vaciar el bolsillo
              de quien entra: los <Termino slug="pump-and-dump">inflados y abandonados</Termino>. Que algo
              funcione sobre BNB Chain no dice nada de quién lo ha creado.
            </p>
          </div>
        </div>
      </section>

      {/* ── 8 ── */}
      <section id="riesgos" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que puede salir mal</div>
          <h2 className="gbc-title">Los riesgos de BNB</h2>
          <div className="gbc-body">
            <ul>
              <li><strong>Depende de una empresa.</strong> Ninguna otra moneda de este tamaño está tan ligada a una compañía. Lo que le pase a Binance con un regulador se nota en el precio de BNB.</li>
              <li><strong>La regulación ya ha golpeado.</strong> La salida de la Unión Europea no es una hipótesis: ha ocurrido. Nada impide que se repita en otros mercados.</li>
              <li><strong>La red está concentrada.</strong> Pocos validadores, cercanos al entorno de Binance. Eficaz, y un único punto de presión.</li>
              <li><strong>Su <Termino slug="bridge">puente</Termino> ya falló.</strong> El robo de 2022 creó monedas de la nada. Se contuvo, pero demostró que podía pasar.</li>
              <li><strong>El precio.</strong> Como cualquier criptomoneda, su <Termino slug="volatilidad">volatilidad</Termino> es alta: ha llegado a caer más de un 60 % desde un máximo.</li>
            </ul>
            <p>
              Sobre Hacienda no hay nada especial. Vender BNB, cambiarla por otra moneda o usarla para pagar
              tributa igual que con cualquier otra, como explica la guía de
              <Link href="/guias/fiscalidad-cripto-espana"> fiscalidad de las criptomonedas en España</Link>. Las
              quemas no te afectan: no recibes ni pierdes nada.
            </p>
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
          <h2 className="gbc-title">Comprueba lo que sabes de BNB</h2>
          <div className="gbc-body" style={{ marginBottom: 32 }}>
            <p>Cinco preguntas. Con las cinco acertadas desbloqueas el logro <strong style={{ color: "var(--gold)" }}>Combustible de la Casa</strong>.</p>
          </div>
          {d.isRegistered ? <GuideBnbQuiz /> : <GuideQuizCuenta slug={SLUG} />}
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
