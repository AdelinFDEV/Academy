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
import GuideSolanaCostes from "./GuideSolanaCostes";
import GuideSolanaQuiz from "./GuideSolanaQuiz";
import "./solana.css";

/**
 * Guía «Qué es Solana» (13-11-2026). Consulta objetivo: «qué es solana».
 *
 * El ángulo: Solana es un intercambio, velocidad a cambio de exigencia y de
 * un historial de caídas. Lo que tiene y las demás no: la tabla de paradas
 * con fecha, duración y causa; el depósito de las cuentas («rent»), que nadie
 * explica; y la cuenta de qué parte del staking es inflación.
 *
 * Al revisarla, empezar por «Alpenglow» y por la inflación: es lo que cambia.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/guias/solana" },
  title: "Qué es Solana: velocidad, caídas y riesgos",
  description:
    "Qué es Solana y por qué es tan rápida: su reloj, lo que cuesta una transacción, las seis caídas de la red con fecha y causa, el staking de SOL y sus riesgos.",
  openGraph: {
    title: "Qué es Solana (SOL): por qué es tan rápida y qué ha pagado por ello",
    description:
      "El reloj de Solana, comisiones con calculadora, las caídas de la red una a una, Alpenglow, el staking de SOL y los errores típicos. Con quiz y logro.",
    type: "article",
  },
};

const SLUG = "solana";

const SECCIONES = [
  { id: "que-es", label: "Qué es" },
  { id: "velocidad", label: "Por qué es rápida" },
  { id: "costes", label: "Lo que cuesta" },
  { id: "caidas", label: "Las caídas" },
  { id: "validadores", label: "Quién la valida" },
  { id: "sol", label: "La moneda SOL" },
  { id: "ethereum", label: "Solana o Ethereum" },
  { id: "errores", label: "Errores típicos" },
  { id: "riesgos", label: "Riesgos" },
  { id: "quiz", label: "Quiz" },
];

/** Paradas completas de la red principal. Fuente: informes de incidencias de Solana. */
const CAIDAS = [
  { fecha: "14 sep 2021", horas: "17 h", causa: "Una avalancha de transacciones de bots en el lanzamiento de un token desbordó la red." },
  { fecha: "30 abr 2022", horas: "7 h", causa: "Bots compitiendo por acuñar NFT llegaron a enviar millones de peticiones por segundo." },
  { fecha: "1 jun 2022", horas: "4,5 h", causa: "Un fallo de programación en un tipo de transacción poco habitual hizo que los validadores no se pusieran de acuerdo." },
  { fecha: "30 sep 2022", horas: "6 h", causa: "Un validador mal configurado produjo bloques duplicados y destapó un fallo al resolver el conflicto." },
  { fecha: "25 feb 2023", horas: "19 h", causa: "Un bloque anormalmente grande saturó el sistema que reparte los bloques entre validadores." },
  { fecha: "6 feb 2024", horas: "5 h", causa: "Un fallo en la parte que carga los programas dejó a los validadores en bucle." },
];

export default async function SolanaPage() {
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
          Qué es Solana<br />
          <span className="gbc-hero-gold">y qué ha pagado por ser tan rápida</span>
        </h1>
        <p className="gbc-respuesta">
          <strong>Solana es una blockchain diseñada para ser rápida y barata</strong>: confirma operaciones en
          segundos y cada una cuesta una fracción de céntimo. Lo consigue pidiendo ordenadores muy potentes a
          quienes la mantienen, y eso tiene un precio: menos gente puede validarla, y la red se ha parado entera
          varias veces. Su moneda es <strong>SOL</strong>.
        </p>
        <p className="gbc-revisado">Revisada el <strong>13 de noviembre de 2026</strong> · Datos técnicos: solana.com e informes de incidencias de la red</p>
        <div className="gbc-hero-pills">
          <span className="gbc-pill">Las 6 caídas, una a una</span>
          <span className="gbc-pill">Calculadora de costes</span>
          <span className="gbc-pill">Quiz con logro</span>
        </div>
      </header>

      {/* ── 1 ── */}
      <section id="que-es" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo básico</div>
          <h2 className="gbc-title">Qué es Solana y para qué se usa</h2>
          <div className="gbc-body">
            <p>
              Solana es una <Termino slug="blockchain">blockchain</Termino> sobre la que se pueden ejecutar
              programas, igual que en Ethereum. La ideó Anatoly Yakovenko, un ingeniero que venía de Qualcomm, en
              2017, y la red principal arrancó en marzo de 2020.
            </p>
            <p>
              Su apuesta es distinta a la de casi todas las demás. En vez de repartir el trabajo entre varias
              redes, Solana intenta que <strong>una sola red lo aguante todo</strong>, exprimiendo al máximo los
              ordenadores que la sostienen.
            </p>
            <p>Eso la ha hecho fuerte en los usos donde la velocidad y el coste mandan:</p>
            <ul>
              <li><strong>Pagos con <Termino slug="stablecoin">stablecoins</Termino></strong>: mover dólares digitales cuesta menos de un céntimo.</li>
              <li><strong>Intercambio de monedas</strong> en un <Termino slug="dex">exchange descentralizado</Termino>, con órdenes que se ejecutan casi al instante.</li>
              <li><strong>Memecoins</strong>: crear y lanzar una moneda cuesta casi nada, para bien y para mal.</li>
              <li><strong><Termino slug="nft">NFT</Termino> y juegos</strong>, donde hay muchas operaciones pequeñas.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── 2 ── */}
      <section id="velocidad" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Cómo funciona</div>
          <h2 className="gbc-title">Por qué Solana es tan rápida: un reloj y muchas cajas</h2>
          <div className="gbc-body">
            <p>Dos ideas explican casi toda su velocidad.</p>
            <h3 className="gbc-sub">Un reloj que todos comparten</h3>
            <p>
              En la mayoría de las redes, los ordenadores gastan tiempo en ponerse de acuerdo sobre el orden de
              las operaciones: cuál llegó antes y cuál después. Solana les da un reloj común, llamado
              <strong> prueba de historia</strong>. Es una cuenta que solo se puede hacer paso a paso, así que
              cada operación queda sellada con el momento exacto en que entró. Con el orden ya resuelto, no hay
              que discutirlo.
            </p>
            <h3 className="gbc-sub">Muchas cajas abiertas a la vez</h3>
            <p>
              Ethereum procesa las operaciones de una en una, como un supermercado con una sola caja. Solana
              mira antes qué cuentas toca cada operación y atiende en paralelo las que no se pisan entre sí. Dos
              pagos entre personas distintas no tienen por qué esperar el uno al otro.
            </p>
            <p>
              El resultado: un bloque nuevo cada 0,4 segundos, aproximadamente. La cifra de 65.000 operaciones
              por segundo que se repite por ahí es un máximo teórico. En el día a día la red procesa entre mil y
              unos pocos miles, que sigue siendo muchísimo más que Ethereum.
            </p>
          </div>
          <div className="gbc-box gbc-box--gold">
            <div className="gbc-box-title">Lo que cambió el 21 de octubre de 2026</div>
            <div className="gbc-box-body">
              <p>Ese día se activó <strong>Alpenglow</strong>, el mayor cambio en la historia de la red: sustituye el
              sistema con el que los validadores votaban y daban por definitivo cada bloque. El objetivo declarado
              es que una operación sea irreversible en unos 150 milisegundos, frente a los casi 13 segundos de
              antes. Ojo: 150 milisegundos es el <strong>objetivo de diseño</strong>, no una cifra ya medida. El día
              del estreno, el panel oficial marcaba varios segundos (solana.com y Cointelegraph, octubre de 2026).</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 ── */}
      <section id="costes" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que cuesta de verdad</div>
          <h2 className="gbc-title">Cuánto cuesta una transacción en Solana</h2>
          <div className="gbc-body">
            <p>
              La comisión base es fija: <strong>0,000005 SOL por firma</strong>, y casi todas las operaciones
              llevan una sola. Con la red muy cargada puedes añadir una propina para pasar antes, pero incluso
              así se habla de céntimos.
            </p>
            <p>
              Lo que casi nadie te cuenta es el <strong>depósito</strong>. La primera vez que recibes una moneda
              nueva, Solana te abre una pequeña cuenta para guardarla y te retiene unos
              <strong> 0,002 SOL</strong> como fianza por el espacio que ocupa. No es una comisión: lo recuperas
              si cierras esa cuenta. Pero si entras con el SOL justo, esa fianza es lo que te deja a medias.
            </p>
          </div>

          <GuideSolanaCostes />

          <p className="gbc-fuente">
            Comisión base y depósito de una cuenta de token, según la documentación de Solana. La propina de
            prioridad no está incluida: depende de lo llena que esté la red en ese momento.
          </p>
        </div>
      </section>

      {/* ── 4 ── */}
      <section id="caidas" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">La otra cara</div>
          <h2 className="gbc-title">Las caídas de Solana: cuántas ha habido y por qué</h2>
          <div className="gbc-body">
            <p>
              Una caída, aquí, significa que la red entera deja de producir bloques: nadie puede enviar, vender
              ni retirar nada hasta que los validadores la reinician a mano. Tu dinero no se pierde, pero se
              queda quieto, y eso en plena caída de precios importa.
            </p>
            <p>Solana ha tenido seis paradas completas. Estas son, con lo que duraron:</p>
          </div>

          <div className="sol-caidas">
            {CAIDAS.map((c) => (
              <div key={c.fecha} className="sol-caida">
                <span className="sol-caida-fecha">{c.fecha}</span>
                <span className="sol-caida-horas">{c.horas}</span>
                <span className="sol-caida-causa">{c.causa}</span>
              </div>
            ))}
          </div>
          <p className="gbc-fuente">
            Duración aproximada de cada parada completa, según los informes de incidencias publicados por Solana.
            No se incluyen los episodios de lentitud en los que la red siguió funcionando.
          </p>

          <div className="gbc-body" style={{ marginTop: 26 }}>
            <p>
              Dos lecturas, las dos ciertas. La mala: casi 60 horas parada en total, cuando Bitcoin y Ethereum no
              se han detenido así en ese tiempo. La buena: cinco de las seis ocurrieron en año y medio, entre
              2021 y principios de 2023, y la más reciente de la lista es de febrero de 2024.
            </p>
            <p>
              Parte de la mejora viene de no depender de un solo programa. Durante años, todos los validadores
              usaban el mismo: un fallo en él tumbaba la red entera. Desde diciembre de 2025 existe un segundo,
              <strong> Firedancer</strong>, escrito desde cero por otro equipo.
            </p>
          </div>
        </div>
      </section>

      {/* ── Anuncio de media guía ── */}
      <GuiaAnuncio producto="cursos" variante="compacto" estado={d.estado} />

      {/* ── 5 ── */}
      <section id="validadores" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Quién la mantiene</div>
          <h2 className="gbc-title">Quién valida Solana y por qué importa</h2>
          <div className="gbc-body">
            <p>
              Solana funciona con <Termino slug="prueba-de-participacion">prueba de participación</Termino>: los
              bloques los proponen y comprueban los <Termino slug="validador">validadores</Termino>, que dejan
              SOL bloqueado como fianza. Quien tiene SOL puede delegarlo en uno y repartirse lo que gana.
            </p>
            <p>
              La pega es lo que cuesta ser validador. La documentación de Solana pide un servidor con 256 GB de
              memoria o más y una conexión muy rápida: un equipo profesional, no el ordenador de casa. Un nodo
              de Bitcoin, en cambio, funciona en un miniordenador doméstico.
            </p>
            <p>
              Cuanto más cuesta participar, menos gente lo hace, y más se parece la red a un grupo de empresas
              especializadas. Es el precio de la velocidad, y es la crítica que más se le hace a Solana.
            </p>
          </div>
        </div>
      </section>

      {/* ── 6 ── */}
      <section id="sol" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">La moneda</div>
          <h2 className="gbc-title">Para qué sirve SOL y cuánto rinde su staking</h2>
          <div className="gbc-body">
            <p>
              SOL se usa para tres cosas: pagar las comisiones, cubrir los depósitos de las cuentas y hacer
              <Termino slug="staking"> staking</Termino>. No tiene un máximo de monedas. La red crea SOL nuevo
              cada año para pagar a los validadores, con una <Termino slug="inflacion">inflación</Termino> que
              empezó en el 8 % y baja un 15 % cada año, hasta quedarse en el 1,5 %.
            </p>
            <p>
              A mediados de 2026 esa inflación rondaba el 3,7 %, y el staking pagaba algo más de un 5 % antes
              de la comisión del validador, con cerca de dos tercios de todo el SOL delegado (Solana Compass,
              2026).
            </p>
          </div>
          <div className="sol-cuenta">
            <div><span>Lo que paga el staking</span><strong>≈ 5,3 %</strong></div>
            <div className="sol-cuenta-op">−</div>
            <div><span>SOL nuevo que se crea</span><strong>≈ 3,7 %</strong></div>
            <div className="sol-cuenta-op">=</div>
            <div className="es-resultado"><span>Lo que ganas de verdad</span><strong>≈ 1,6 %</strong></div>
          </div>
          <div className="gbc-body" style={{ marginTop: 22 }}>
            <p>
              Esa cuenta es la que casi nunca se enseña. La mayor parte de lo que «rinde» el staking es SOL
              recién creado, que diluye a todo el mundo. Quien hace staking mantiene su parte del pastel y gana
              un poco; quien no lo hace, la va perdiendo. Y todo ello en SOL, cuyo precio se mueve mucho más que
              ese 1,6 %.
            </p>
            <p>
              Si declaras en España, lo que cobras por el staking tributa al recibirlo. Está explicado en la
              guía de <Link href="/guias/fiscalidad-cripto-espana">fiscalidad de las criptomonedas</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* ── 7 ── */}
      <section id="ethereum" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">La comparación</div>
          <h2 className="gbc-title">Solana o Ethereum: qué cambia para ti</h2>
          <div className="gbc-body">
            <p>
              Las dos sirven para lo mismo, ejecutar programas, y han tomado caminos opuestos.
              <Link href="/guias/ethereum"> Ethereum</Link> mantiene su red principal lenta y fácil de validar, y
              manda el tráfico a otras redes construidas encima. Solana lo hace todo en una.
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th></th><th>Solana</th><th>Ethereum</th></tr></thead>
              <tbody>
                <tr><td><strong>Una operación sencilla</strong></td><td>Menos de un céntimo</td><td>De céntimos a varios euros, según la hora; céntimos en sus capas 2</td></tr>
                <tr><td><strong>Un bloque nuevo</strong></td><td>Cada 0,4 segundos</td><td>Cada 12 segundos</td></tr>
                <tr><td><strong>Paradas completas</strong></td><td>Seis, la última de la lista en 2024</td><td>Ninguna</td></tr>
                <tr><td><strong>Montar un validador</strong></td><td>Servidor profesional</td><td>Un ordenador normal y 32 ETH</td></tr>
                <tr><td><strong>Dónde está el dinero</strong></td><td>Menos que en Ethereum</td><td>La mayor parte de las finanzas descentralizadas</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 8 ── */}
      <section id="errores" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">El error típico</div>
          <h2 className="gbc-title">En qué se equivoca la gente con Solana</h2>
          <div className="gbc-body">
            <ul>
              <li>
                <strong>Tratar una memecoin como una inversión.</strong> En Solana, lanzar una moneda cuesta
                minutos y céntimos. La inmensa mayoría sube, quien la creó vende y se queda en nada: es el
                mecanismo de un <Termino slug="pump-and-dump">pump and dump</Termino>.
              </li>
              <li>
                <strong>Firmar sin leer.</strong> Como todo es rápido y barato, se firma sin mirar. Una web
                falsa que imita a una conocida puede pedirte una firma que le da el control de tus monedas. Es
                <Termino slug="phishing"> phishing</Termino>, y es el robo más frecuente.
              </li>
              <li>
                <strong>Entrar con el SOL justo.</strong> Entre comisiones y depósitos de cuentas, quien llega
                con lo exacto se queda sin poder mover nada. Deja siempre un pequeño margen.
              </li>
              <li>
                <strong>Creer que barato es lo mismo que seguro.</strong> Que una operación cueste un céntimo no
                dice nada de la aplicación en la que la haces.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── 9 ── */}
      <section id="riesgos" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que puede salir mal</div>
          <h2 className="gbc-title">Los riesgos de Solana</h2>
          <div className="gbc-body">
            <ul>
              <li><strong>Que vuelva a pararse.</strong> Lleva tiempo sin hacerlo, pero un sistema tan exigido tiene menos margen ante un fallo.</li>
              <li><strong>La concentración.</strong> Pocos validadores, caros de mantener, y un cambio tan profundo como Alpenglow recién estrenado.</li>
              <li><strong>La dilución.</strong> No hay un máximo de SOL: quien lo tiene parado pierde peso cada año.</li>
              <li><strong>El ruido.</strong> Buena parte de la actividad son memecoins. Si esa moda se enfría, las cifras de uso se enfrían con ella.</li>
              <li><strong>El precio.</strong> SOL cayó más de un 95 % entre 2021 y finales de 2022. Esa <Termino slug="volatilidad">volatilidad</Termino> forma parte del activo.</li>
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
          <h2 className="gbc-title">Comprueba lo que sabes de Solana</h2>
          <div className="gbc-body" style={{ marginBottom: 32 }}>
            <p>Cinco preguntas. Con las cinco acertadas desbloqueas el logro <strong style={{ color: "var(--gold)" }}>A Contrarreloj</strong>.</p>
          </div>
          {d.isRegistered ? <GuideSolanaQuiz /> : <GuideQuizCuenta slug={SLUG} />}
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
