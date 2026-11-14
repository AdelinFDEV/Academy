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
import GuideCardanoStaking from "./GuideCardanoStaking";
import GuideCardanoQuiz from "./GuideCardanoQuiz";
import "./cardano.css";

/**
 * Guía «Qué es Cardano» (13-11-2026). Consulta objetivo: «qué es cardano».
 *
 * Está planteada como respuestas a las preguntas que la gente se hace de
 * verdad sobre Cardano (por qué va despacio, cuánto rinde el staking, si se
 * puede perder ADA), y no como una ficha técnica. Lo que tiene y las demás
 * no: el staking con la cifra del lector y en ADA por época, cómo elegir un
 * pool paso a paso, y las críticas contadas sin suavizar.
 *
 * Al revisarla: el rendimiento del staking, el estado de Leios y la sección
 * de gobierno son lo que cambia.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/guias/cardano" },
  title: "Qué es Cardano (ADA) y cuánto rinde su staking",
  description:
    "Qué es Cardano y cómo funciona ADA: por qué avanza despacio, cuánto rinde su staking con calculadora, cómo elegir un pool y qué se le critica al proyecto.",
  openGraph: {
    title: "Qué es Cardano (ADA): cómo funciona, cuánto rinde su staking y qué se le critica",
    description:
      "El método de Cardano, su staking sin bloqueo con calculadora, cómo elegir un pool, quién decide en la red y las críticas, sin suavizar. Con quiz y logro.",
    type: "article",
  },
};

const SLUG = "cardano";

const SECCIONES = [
  { id: "que-es", label: "Qué es" },
  { id: "despacio", label: "Por qué va despacio" },
  { id: "billetes", label: "Cómo funciona" },
  { id: "staking", label: "Cuánto rinde" },
  { id: "pool", label: "Elegir un pool" },
  { id: "gobierno", label: "Quién decide" },
  { id: "ada", label: "Cuántos ADA hay" },
  { id: "criticas", label: "Críticas y riesgos" },
  { id: "quiz", label: "Quiz" },
];

/** Las cinco etapas del plan de Cardano. Fechas: cardano.org e Input Output. */
const ETAPAS = [
  { nombre: "Byron", cuando: "Sep 2017", que: "Nace la red. Solo sirve para enviar y recibir ADA, y la mantienen sus creadores." },
  { nombre: "Shelley", cuando: "Jul 2020", que: "Llega el staking: la red pasa a manos de quien tiene ADA y de cientos de pools independientes." },
  { nombre: "Goguen", cuando: "Sep 2021", que: "Contratos inteligentes. Cuatro años después del lanzamiento, ya se pueden crear aplicaciones." },
  { nombre: "Basho", cuando: "En curso", que: "Hacerla más rápida. Aquí entran Hydra, ya en uso, y Leios, todavía en desarrollo." },
  { nombre: "Voltaire", cuando: "2024-2025", que: "El gobierno pasa a la comunidad: los cambios se votan con ADA." },
];

export default async function CardanoPage() {
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
          Qué es Cardano (ADA)<br />
          <span className="gbc-hero-gold">y cuánto rinde de verdad su staking</span>
        </h1>
        <p className="gbc-respuesta">
          <strong>Cardano es una blockchain para crear aplicaciones, construida despacio y a base de investigación
          revisada por otros científicos.</strong> Su moneda es <strong>ADA</strong>. Quien la tiene puede
          ponerla a rendir sin sacarla de su cartera y sin bloquearla, a cambio de entre un 2 % y un 3 % al año.
          A Cardano se le reconoce el rigor y se le reprocha la lentitud.
        </p>
        <p className="gbc-revisado">Revisada el <strong>13 de noviembre de 2026</strong> · Datos técnicos: cardano.org e Input Output</p>
        <div className="gbc-hero-pills">
          <span className="gbc-pill">Calculadora de staking</span>
          <span className="gbc-pill">Cómo elegir un pool</span>
          <span className="gbc-pill">Quiz con logro</span>
        </div>
      </header>

      {/* ── 1 ── */}
      <section id="que-es" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo básico</div>
          <h2 className="gbc-title">Qué es Cardano y quién está detrás</h2>
          <div className="gbc-body">
            <p>
              Cardano es una <Termino slug="blockchain">blockchain</Termino> pública, como Ethereum: un registro
              compartido sobre el que se mueve dinero y se ejecutan programas. Se lanzó en septiembre de 2017.
            </p>
            <p>
              La puso en marcha Charles Hoskinson, que había sido uno de los fundadores de Ethereum y salió del
              proyecto en 2014. Su empresa, Input Output, se encarga de la investigación y del desarrollo. Junto
              a ella están la Fundación Cardano, que cuida del proyecto, y Emurgo, que busca empresas que lo usen.
            </p>
            <p>
              Los nombres vienen de la historia de las matemáticas: Cardano, por Gerolamo Cardano, un matemático
              del siglo XVI; ADA, por Ada Lovelace, considerada la primera programadora.
            </p>
          </div>
        </div>
      </section>

      {/* ── 2 ── */}
      <section id="despacio" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">La pregunta de siempre</div>
          <h2 className="gbc-title">¿Por qué Cardano avanza tan despacio?</h2>
          <div className="gbc-body">
            <p>
              Porque lo eligió así. La mayoría de los proyectos programan primero y corrigen después. Cardano
              hace lo contrario: antes de construir una pieza, publica un estudio que explica cómo debería
              funcionar, y lo somete a la revisión de otros investigadores, como se hace en la ciencia.
            </p>
            <p>
              Su sistema para validar bloques, <strong>Ouroboros</strong>, fue el primero de su tipo en
              presentarse con una demostración matemática de seguridad en un congreso de criptografía, en 2017.
            </p>
            <p>
              El método tiene una ventaja y un coste. La ventaja: la red no ha tenido ninguna parada completa. El
              coste: los contratos inteligentes llegaron cuatro años después del lanzamiento, cuando otras redes
              ya tenían miles de aplicaciones y a sus usuarios. El plan se divide en cinco etapas:
            </p>
          </div>

          <ol className="ada-etapas">
            {ETAPAS.map((e, i) => (
              <li key={e.nombre}>
                <span className="ada-etapa-n">{i + 1}</span>
                <span className="ada-etapa-nombre">{e.nombre}<small>{e.cuando}</small></span>
                <span className="ada-etapa-que">{e.que}</span>
              </li>
            ))}
          </ol>
          <p className="gbc-fuente">
            Leios, la pieza que debe multiplicar la capacidad de la red, tenía prevista su llegada para finales de
            2026 y seguía sin fecha confirmada en noviembre de 2026.
          </p>
        </div>
      </section>

      {/* ── 3 ── */}
      <section id="billetes" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Por dentro</div>
          <h2 className="gbc-title">Cómo funciona Cardano: monedas como billetes</h2>
          <div className="gbc-body">
            <p>
              Hay dos formas de llevar las cuentas en una blockchain. Ethereum usa <strong>saldos</strong>, como
              un banco: tu cuenta tiene 100 y, si pagas 30, pasa a tener 70.
            </p>
            <p>
              Cardano usa <strong>billetes</strong>, como Bitcoin. No tienes «100 ADA»: tienes, por ejemplo, un
              billete de 60 y otro de 40. Para pagar 30 entregas el de 40 y recibes 10 de cambio. Cada operación
              gasta unos billetes y crea otros nuevos.
            </p>
            <p>Parece un detalle técnico, pero tiene dos efectos que notas como usuario:</p>
            <ul>
              <li><strong>Sabes lo que vas a pagar antes de enviar.</strong> La comisión se calcula por adelantado y, si la operación va a fallar, falla antes de salir, sin cobrarte.</li>
              <li><strong>Programar es más difícil.</strong> Dos personas no pueden gastar el mismo billete a la vez, así que las aplicaciones con mucha gente necesitan un diseño más cuidadoso. Es una de las razones de que tenga menos aplicaciones.</li>
            </ul>
            <p>
              Sobre esa base se ejecutan los <Termino slug="smart-contract">contratos inteligentes</Termino>, y
              con ellos las aplicaciones de finanzas descentralizadas (<Termino slug="defi">DeFi</Termino>).
            </p>
          </div>
        </div>
      </section>

      {/* ── Anuncio de media guía ── */}
      <GuiaAnuncio producto="cursos" variante="compacto" estado={d.estado} />

      {/* ── 4 ── */}
      <section id="staking" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que rinde de verdad</div>
          <h2 className="gbc-title">Cuánto rinde el staking de Cardano, con tu cifra</h2>
          <div className="gbc-body">
            <p>
              Cardano se valida con <Termino slug="prueba-de-participacion">prueba de participación</Termino>:
              los bloques los producen los <strong>pools</strong>, y cuanto más ADA respalda a un pool, más
              bloques le tocan. Hacer <Termino slug="staking">staking</Termino> es prestar tu respaldo a uno de
              ellos y repartirse lo que gana.
            </p>
            <p>Lo que lo distingue de casi todas las demás redes son tres cosas:</p>
            <ul>
              <li><strong>Tu ADA no sale de tu <Termino slug="wallet">cartera</Termino>.</strong> <Termino slug="delegacion">Delegas</Termino> el derecho a validar, no las monedas. El pool no puede tocarlas.</li>
              <li><strong>No hay bloqueo.</strong> Puedes gastar o vender en cualquier momento, sin plazo de espera.</li>
              <li><strong>No hay castigo.</strong> Si tu pool funciona mal, dejas de cobrar esos días, pero no pierdes monedas. En otras redes, un fallo del <Termino slug="validador">validador</Termino> puede costarte parte de lo delegado.</li>
            </ul>
            <p>
              A cambio, rinde poco: <strong>entre un 2 % y un 3 % al año</strong> a finales de 2026, según las
              calculadoras de staking de la red. Y se cobra por épocas de cinco días. Pon tu cifra:
            </p>
          </div>

          <GuideCardanoStaking />

          <div className="gbc-box gbc-box--gold">
            <div className="gbc-box-title">Lo que la calculadora no puede decirte</div>
            <div className="gbc-box-body">
              <p>El rendimiento se cobra en ADA, no en euros. Si tienes 5.000 ADA y ganas 125 en un año, tienes
              más monedas. Lo que valgan depende del precio, y ADA ha llegado a perder más del 90 % desde su
              máximo de 2021. El staking no te protege de eso. Y si declaras en España, lo que cobras tributa al
              recibirlo: está en la guía de <Link href="/guias/fiscalidad-cripto-espana">fiscalidad cripto</Link>.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5 ── */}
      <section id="pool" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Cómo hacerlo bien</div>
          <h2 className="gbc-title">Cómo elegir un pool de staking sin equivocarte</h2>
          <div className="gbc-body">
            <p>
              Hay miles de pools y casi todos rinden parecido. La diferencia entre elegir bien y mal son décimas,
              pero hay cuatro cosas que conviene mirar, y todas se ven en la propia cartera antes de delegar.
            </p>
          </div>
          <div className="ada-pasos">
            <div><span>1</span><h3>Que no esté saturado</h3><p>Cada pool tiene un tope de ADA. Si lo supera, lo que reparte baja para todos sus delegadores. Elige uno que esté por debajo.</p></div>
            <div><span>2</span><h3>Lo que cobra</h3><p>Un pool se queda una cantidad fija por época y un porcentaje. Un porcentaje del 0 % suena bien, pero a veces es un gancho que sube después.</p></div>
            <div><span>3</span><h3>Que produzca bloques</h3><p>Un pool muy pequeño puede pasar varias épocas sin que le toque ninguno, y esas épocas no cobras. Mira su historial.</p></div>
            <div><span>4</span><h3>Quién lo lleva</h3><p>Muchos pools los gestiona una sola empresa con varios nombres. Repartir el staking entre operadores distintos es lo que mantiene la red en muchas manos.</p></div>
          </div>
          <div className="gbc-box gbc-box--red">
            <div className="gbc-box-title">El error típico: hacer staking desde un exchange</div>
            <div className="gbc-box-body">
              <p>Un <Termino slug="exchange">exchange</Termino> te ofrece «staking de ADA» con un botón, y a veces
              con un porcentaje más alto. Pero ahí las monedas no están en tu cartera: las tiene el exchange, y
              las ventajas de Cardano desaparecen. Si el exchange bloquea las retiradas o quiebra, tu ADA va con
              él. Hacerlo desde tu propia cartera es <Termino slug="autocustodia">autocustodia</Termino>: cuesta
              diez minutos más y las monedas siguen siendo tuyas.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6 ── */}
      <section id="gobierno" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Quién manda</div>
          <h2 className="gbc-title">Quién decide en Cardano: el voto de quien tiene ADA</h2>
          <div className="gbc-body">
            <p>
              Durante años, los cambios en Cardano los decidían sus tres entidades fundadoras. Eso terminó entre
              septiembre de 2024 y enero de 2025, con dos actualizaciones que entregaron el <Termino slug="gobernanza">gobierno</Termino> a la
              comunidad.
            </p>
            <p>Desde entonces, cualquier cambio importante necesita el visto bueno de tres grupos:</p>
            <ul>
              <li><strong>Los representantes.</strong> Cada persona con ADA puede votar o delegar su voto en un representante, igual que delega su staking.</li>
              <li><strong>Los operadores de pools</strong>, que son quienes hacen funcionar la red.</li>
              <li><strong>Un comité constitucional</strong>, que comprueba que lo aprobado respeta las reglas escritas del proyecto.</li>
            </ul>
            <p>
              También se vota en qué se gasta la tesorería: un fondo que se llena con una parte de las
              recompensas y las comisiones, y que paga el desarrollo. El riesgo es el de cualquier votación: si
              vota poca gente, deciden unos pocos con mucho ADA.
            </p>
          </div>
        </div>
      </section>

      {/* ── 7 ── */}
      <section id="ada" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">La moneda</div>
          <h2 className="gbc-title">Cuántos ADA existen y de dónde salen las recompensas</h2>
          <div className="gbc-body">
            <p>
              ADA tiene un máximo fijado en el protocolo: <strong>45.000 millones</strong>. La mayor parte ya
              está <Termino slug="oferta-circulante">en circulación</Termino>. Lo que falta está guardado en una reserva, y de ahí sale lo que se paga por
              el staking.
            </p>
            <p>
              Cada época se libera una pequeña parte de lo que queda en la reserva, así que la cantidad repartida
              baja poco a poco con los años. Por eso el rendimiento del staking de Cardano tiende a ir a menos.
              Cuando la reserva se agote, las recompensas saldrán solo de las comisiones.
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th></th><th>Cardano (ADA)</th></tr></thead>
              <tbody>
                <tr><td><strong>Máximo de monedas</strong></td><td>45.000 millones</td></tr>
                <tr><td><strong>Unidad más pequeña</strong></td><td>1 lovelace = 0,000001 ADA</td></tr>
                <tr><td><strong>Una época</strong></td><td>5 días</td></tr>
                <tr><td><strong>Primera recompensa</strong></td><td>Entre 15 y 20 días después de delegar</td></tr>
                <tr><td><strong>Plazo para retirar</strong></td><td>Ninguno</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 8 ── */}
      <section id="criticas" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que puede salir mal</div>
          <h2 className="gbc-title">Lo que se le critica a Cardano, y sus riesgos</h2>
          <div className="gbc-body">
            <ul>
              <li><strong>Mucho rigor, poco uso.</strong> El dinero depositado en sus aplicaciones, lo que se mide con el <Termino slug="tvl">TVL</Termino>, es una fracción pequeña del de Ethereum o Solana. Una red segura que se usa poco vale menos de lo que su tecnología promete.</li>
              <li><strong>Llega tarde.</strong> Cada mejora tarda años. Para cuando Cardano estrena algo, sus competidores llevan tiempo ofreciéndolo.</li>
              <li><strong>Depende mucho de una persona.</strong> Charles Hoskinson es la cara del proyecto, y sus opiniones mueven el ánimo de la comunidad más de lo que debería en una red descentralizada.</li>
              <li><strong>El rendimiento baja.</strong> El 2-3 % del staking irá a menos con los años.</li>
              <li><strong>El precio.</strong> ADA marcó su máximo, cerca de 3,10 dólares, en septiembre de 2021, y desde ahí ha llegado a caer más de un 90 %. Esa <Termino slug="volatilidad">volatilidad</Termino> pesa mucho más que el staking.</li>
            </ul>
            <p>
              Y lo que tiene a favor, para ser justos: no ha sufrido paradas completas, su staking es de los más
              seguros para quien delega, y es de las redes repartidas entre más operadores distintos. Tampoco es
              infalible: en noviembre de 2025 una transacción defectuosa dividió la cadena en dos durante unas
              horas, hasta que los operadores actualizaron sus programas.
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
          <h2 className="gbc-title">Comprueba lo que sabes de Cardano</h2>
          <div className="gbc-body" style={{ marginBottom: 32 }}>
            <p>Cinco preguntas. Con las cinco acertadas desbloqueas el logro <strong style={{ color: "var(--gold)" }}>Delegador Paciente</strong>.</p>
          </div>
          {d.isRegistered ? <GuideCardanoQuiz /> : <GuideQuizCuenta slug={SLUG} />}
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
