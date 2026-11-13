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
import GuideStellarReserva from "./GuideStellarReserva";
import GuideStellarQuiz from "./GuideStellarQuiz";
import "./stellar.css";

/**
 * Guía «Qué es Stellar» (13-11-2026). Consulta objetivo: «qué es stellar».
 *
 * Va de lo práctico a lo teórico: empieza por las tres cosas que sorprenden a
 * quien abre su primera cartera (la reserva, la línea de confianza y el memo) y
 * solo después explica la red. Lo que tiene y las demás no: una calculadora de
 * la reserva bloqueada, la comparación directa con XRP (enlaza a su guía), el
 * recorrido de los 100.000 millones de XLM a los 50.000 y el dato de que XLM no
 * rinde nada por tenerlo.
 *
 * Al revisarla: la reserva base, XLM en circulación y las cifras de activos.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/guias/stellar" },
  title: "Qué es Stellar (XLM) y en qué difiere de XRP",
  description:
    "Qué es Stellar y para qué sirve XLM: la reserva mínima, las líneas de confianza y el memo explicados, sus diferencias con XRP, cuántos XLM hay y sus riesgos.",
  openGraph: {
    title: "Qué es Stellar (XLM): la red para emitir dinero digital",
    description:
      "Las tres cosas que sorprenden al abrir una cartera de Stellar, una calculadora de la reserva, la comparación con XRP y la historia de sus 50.000 millones de XLM.",
    type: "article",
  },
};

const SLUG = "stellar";

const SECCIONES = [
  { id: "que-es", label: "Qué es" },
  { id: "tres-cosas", label: "Tres sorpresas" },
  { id: "reserva", label: "La reserva" },
  { id: "como-funciona", label: "Cómo funciona" },
  { id: "xrp", label: "Stellar y XRP" },
  { id: "xlm", label: "Cuántos XLM hay" },
  { id: "usos", label: "Quién la usa" },
  { id: "riesgos", label: "Riesgos" },
  { id: "quiz", label: "Quiz" },
];

const SORPRESAS = [
  { n: "1", titulo: "Tu cuenta no existe hasta que recibe 1 XLM", texto: "En Stellar, una dirección vacía no es una cuenta. Hay que activarla enviándole al menos 1 XLM, que se queda retenido mientras la cuenta exista." },
  { n: "2", titulo: "No puedes recibir una moneda sin dar permiso antes", texto: "Para tener dólares digitales, euros o cualquier otro activo, primero abres una línea de confianza con quien lo emite. Sin ella, el envío falla. Cada línea retiene otros 0,5 XLM." },
  { n: "3", titulo: "Al enviar a un exchange hace falta el memo", texto: "Los exchanges usan una sola dirección para todos sus clientes. El memo es el número que dice que ese ingreso es tuyo. Si lo olvidas, el dinero llega al exchange y no a tu saldo." },
];

export default async function StellarPage() {
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
          Qué es Stellar (XLM)<br />
          <span className="gbc-hero-gold">y en qué se diferencia de XRP</span>
        </h1>
        <p className="gbc-respuesta">
          <strong>Stellar es una red para emitir y enviar dinero digital, sea cual sea: dólares, euros o fondos
          de inversión convertidos en fichas.</strong> Su moneda, el lumen o XLM, no es el producto: es lo que
          se paga por usar la red y lo que impide que se llene de basura. Una operación cuesta una fracción
          de céntimo y tarda unos cinco segundos.
        </p>
        <p className="gbc-revisado">Revisada el <strong>13 de noviembre de 2026</strong> · Parámetros de la red: documentación de Stellar</p>
        <div className="gbc-hero-pills">
          <span className="gbc-pill">Calculadora de la reserva</span>
          <span className="gbc-pill">Stellar frente a XRP</span>
          <span className="gbc-pill">Quiz con logro</span>
        </div>
      </header>

      {/* ── 1 ── */}
      <section id="que-es" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo básico</div>
          <h2 className="gbc-title">Qué es Stellar y para qué se creó</h2>
          <div className="gbc-body">
            <p>
              La mayoría de las <Termino slug="blockchain">blockchains</Termino> nacieron para tener su propia
              moneda. Stellar nació para mover las de siempre. La idea es sencilla: que enviar 50 euros de
              Madrid a Manila sea tan rápido y tan barato como enviar un correo.
            </p>
            <p>
              La fundó en 2014 Jed McCaleb, que venía de crear Ripple, la empresa detrás de
              <Link href="/guias/xrp"> XRP</Link>. Se marchó por desacuerdos y montó un proyecto con el mismo
              objetivo y otra filosofía. Detrás no hay una empresa con accionistas, sino una fundación sin
              ánimo de lucro: la Stellar Development Foundation.
            </p>
            <p>
              En Stellar, cualquier entidad puede emitir un activo: un banco, una empresa de pagos o una
              gestora de fondos. La red se encarga de llevar la cuenta y de cambiar unos por otros. El XLM
              hace de aceite en el engranaje.
            </p>
          </div>
        </div>
      </section>

      {/* ── 2 ── */}
      <section id="tres-cosas" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Antes de la teoría</div>
          <h2 className="gbc-title">Tres cosas que sorprenden al usar Stellar por primera vez</h2>
          <div className="gbc-body">
            <p>
              Quien viene de Bitcoin o de Ethereum se encuentra en Stellar con tres reglas que no esperaba.
              Ninguna es un fallo. Las tres salen de la misma decisión de diseño, y conocerlas ahorra el
              primer susto.
            </p>
          </div>
          <div className="xlm-sorpresas">
            {SORPRESAS.map((s) => (
              <div key={s.n}>
                <span className="xlm-sorpresa-n">{s.n}</span>
                <strong>{s.titulo}</strong>
                <p>{s.texto}</p>
              </div>
            ))}
          </div>
          <div className="gbc-box gbc-box--red" style={{ marginTop: 26 }}>
            <div className="gbc-box-title">El error que más dinero cuesta</div>
            <div className="gbc-box-body">
              <p>Enviar XLM a un exchange sin el memo. La operación sale bien, es definitiva, y el exchange no
              sabe de quién es. Recuperarlo depende de su servicio de soporte, que puede tardar semanas, cobrar
              por ello o negarse. Copia siempre los dos datos: dirección y memo.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 ── */}
      <section id="reserva" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Con números</div>
          <h2 className="gbc-title">La reserva mínima de XLM: cuánto se queda bloqueado</h2>
          <div className="gbc-body">
            <p>
              Las dos primeras sorpresas tienen la misma explicación. Como usar Stellar es casi gratis, llenar
              la red de cuentas inútiles también lo sería. Para evitarlo, cada cosa que ocupa sitio en el
              registro exige dejar una pequeña fianza en XLM.
            </p>
            <p>
              La unidad se llama reserva base y vale 0,5 XLM. Una cuenta necesita dos, es decir, 1 XLM. Cada
              línea de confianza, cada orden de compraventa abierta y cada firmante añadido cuesta una más.
              Calcula lo que retendría la tuya:
            </p>
          </div>

          <GuideStellarReserva />

          <div className="gbc-body" style={{ marginTop: 26 }}>
            <p>
              Ese XLM no se pierde. Sigue siendo tuyo, pero no puedes gastarlo mientras lo que lo retiene siga
              abierto. Si cierras una línea de confianza, recuperas sus 0,5 XLM. Si fusionas la cuenta con
              otra, recuperas todo.
            </p>
            <p>
              La comisión es aparte y es mínima: 0,00001 XLM por operación. Con un solo XLM se pagan cien mil.
              Solo sube cuando la red está saturada, y entonces pasan primero quienes ofrecen más.
            </p>
          </div>
        </div>
      </section>

      {/* ── Anuncio de media guía ── */}
      <GuiaAnuncio producto="portfolio" variante="compacto" estado={d.estado} />

      {/* ── 4 ── */}
      <section id="como-funciona" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Por dentro</div>
          <h2 className="gbc-title">Cómo funciona Stellar: sin minería y sin staking</h2>
          <div className="gbc-body">
            <p>
              En Stellar no hay mineros que gasten electricidad, como en la
              <Termino slug="prueba-de-trabajo"> prueba de trabajo</Termino>. Tampoco hay monedas bloqueadas
              como fianza, como en la
              <Termino slug="prueba-de-participacion"> prueba de participación</Termino>. Usa un sistema
              propio, el Protocolo de Consenso de Stellar, que funciona con confianza declarada.
            </p>
            <p>
              Cada <Termino slug="validador">validador</Termino> publica una lista de otros validadores de los
              que se fía. Una operación se da por buena cuando suficientes de esos grupos, que se solapan
              entre sí, coinciden. Como nadie compite, no hay recompensa que repartir: validar no se paga.
            </p>
            <p>De ahí salen tres consecuencias, y conviene tener las tres en la cabeza.</p>
            <ul>
              <li><strong>Es rápida y casi gratuita.</strong> Cierra un registro cada cinco o seis segundos, y lo confirmado es definitivo.</li>
              <li><strong>XLM no rinde nada por tenerlo.</strong> No hay <Termino slug="staking">staking</Termino> en la red. Si alguien te ofrece un rendimiento por tus XLM, lo paga una empresa por su cuenta, con el riesgo de esa empresa.</li>
              <li><strong>La validan pocos.</strong> Los validadores de más peso pertenecen a menos de una decena de organizaciones, entre ellas la propia fundación.</li>
            </ul>
            <p>
              Desde febrero de 2024, Stellar admite además
              <Termino slug="smart-contract"> contratos inteligentes</Termino>, con una plataforma llamada
              Soroban. Llegó tarde frente a otras redes, y su ecosistema de
              <Termino slug="defi"> finanzas descentralizadas</Termino> es pequeño en comparación.
            </p>
          </div>
        </div>
      </section>

      {/* ── 5 ── */}
      <section id="xrp" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">La comparación de siempre</div>
          <h2 className="gbc-title">Stellar y XRP: en qué se parecen y en qué no</h2>
          <div className="gbc-body">
            <p>
              Comparten fundador, objetivo y hasta varios detalles técnicos: las dos exigen una reserva mínima
              y las dos usan un número para identificar los ingresos en un exchange. Stellar lo llama memo.
              XRP, etiqueta de destino. Las diferencias están en a quién sirven y en quién las sostiene.
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th></th><th>Stellar (XLM)</th><th>XRP</th></tr></thead>
              <tbody>
                <tr><td><strong>Quién está detrás</strong></td><td>Una fundación sin ánimo de lucro</td><td>Ripple, una empresa privada</td></tr>
                <tr><td><strong>A quién se dirige</strong></td><td>Personas, empresas de pagos y emisores de activos</td><td>Bancos y grandes entidades financieras</td></tr>
                <tr><td><strong>Monedas que existen</strong></td><td>50.000 millones, tras destruir más de la mitad en 2019</td><td>100.000 millones creados al inicio</td></tr>
                <tr><td><strong>Reserva para abrir cuenta</strong></td><td>1 XLM</td><td>1 XRP</td></tr>
                <tr><td><strong>Rendimiento por tenerla</strong></td><td>Ninguno</td><td>Ninguno</td></tr>
                <tr><td><strong>Tamaño</strong></td><td>Varias veces más pequeña por capitalización</td><td>Entre las cinco mayores criptomonedas</td></tr>
              </tbody>
            </table>
          </div>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              En el mercado suelen moverse juntas, y muchas veces XLM sigue a XRP con retraso. Eso es un
              hábito de los operadores, no una ley. Son dos redes distintas, con riesgos distintos. Si te
              interesa la otra mitad de la historia, la tienes en la <Link href="/guias/xrp">guía de XRP</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* ── 6 ── */}
      <section id="xlm" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">La moneda</div>
          <h2 className="gbc-title">Cuántos XLM hay y quién los tiene</h2>
          <div className="gbc-body">
            <p>
              La historia de la <Termino slug="oferta-circulante">oferta</Termino> de XLM tiene un giro poco
              habitual: la fundación destruyó más de la mitad de las monedas de un día para otro.
            </p>
          </div>
          <ol className="xlm-oferta">
            <li><span>2014</span><div><strong>100.000 millones</strong><p>Se crean todos de una vez. Además, la red crea un 1 % nuevo cada año.</p></div></li>
            <li><span>Octubre de 2019</span><div><strong>Se elimina la inflación</strong><p>Los validadores votan quitarla: casi nadie la reclamaba y no cumplía su función.</p></div></li>
            <li><span>Noviembre de 2019</span><div><strong>Se destruyen 55.000 millones</strong><p>La fundación <Termino slug="quema-de-tokens">quema</Termino> más de la mitad de lo que existía. Quedan unos 50.000 millones, y no se crearán más.</p></div></li>
            <li><span>Mediados de 2026</span><div><strong>34.000 millones en circulación</strong><p>El resto, unos 16.000 millones, sigue en manos de la fundación, que los va repartiendo.</p></div></li>
          </ol>
          <p className="gbc-fuente">XLM en circulación al cierre del segundo trimestre de 2026: informe de Blockworks sobre Stellar.</p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Lo último es lo que importa a quien compra. No hay inflación, pero sí un vendedor que conoce
              todo el mundo. Cerca de un tercio de los XLM está todavía en la fundación, que los destina a
              subvenciones, inversiones y desarrollo. Cada XLM que reparte es uno más en el mercado: entre
              abril y junio de 2026, la circulación creció un 2,8 %.
            </p>
          </div>
        </div>
      </section>

      {/* ── 7 ── */}
      <section id="usos" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que hay de verdad</div>
          <h2 className="gbc-title">Quién usa Stellar hoy</h2>
          <div className="gbc-body">
            <p>
              Stellar lleva años anunciando acuerdos. Conviene separar lo que funciona de lo que fue una nota
              de prensa. A noviembre de 2026, lo comprobable es esto.
            </p>
            <ul>
              <li><strong>Fondos convertidos en fichas.</strong> Es su uso más grande. La gestora Franklin Templeton lleva en Stellar el registro de un fondo monetario. Los activos de este tipo en la red rondaban los 3.000 millones de dólares a mediados de 2026.</li>
              <li><strong>Dinero en efectivo.</strong> La empresa de envíos MoneyGram permite convertir dólares digitales en billetes, y al revés, en sus oficinas de decenas de países.</li>
              <li><strong>Stablecoins.</strong> Hay <Termino slug="stablecoin">stablecoins</Termino> en dólares y en euros, pero pocas: menos de 1.000 millones de dólares en total.</li>
            </ul>
            <p>
              Esa última cifra pone a Stellar en su sitio. En la red <Link href="/guias/tron">TRON</Link> circulan
              más de 90.000 millones de dólares solo en USDT. Stellar es una red seria y bien diseñada, con un
              uso real que todavía es pequeño frente al de sus competidoras.
            </p>
          </div>
        </div>
      </section>

      {/* ── 8 ── */}
      <section id="riesgos" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que puede salir mal</div>
          <h2 className="gbc-title">Los riesgos de Stellar y de XLM</h2>
          <div className="gbc-body">
            <ul>
              <li><strong>La fundación tiene un tercio de las monedas.</strong> Su ritmo de reparto pesa sobre el precio, y lo decide ella.</li>
              <li><strong>El uso no obliga a comprar XLM.</strong> Con comisiones de cienmilésimas, una empresa puede mover millones en la red con un puñado de monedas. Que Stellar crezca no significa que XLM suba.</li>
              <li><strong>La red se ha parado.</strong> El 15 de mayo de 2019 estuvo 67 minutos sin cerrar registros. En abril de 2021 fallaron los validadores de la fundación y varios exchanges pausaron las retiradas.</li>
              <li><strong>La competencia es enorme.</strong> Otras redes mueven mucho más dinero en stablecoins, y los bancos prueban las suyas.</li>
              <li><strong>Quien emite un activo puede bloquearlo.</strong> En Stellar, el emisor puede reservarse el permiso de congelar o retirar lo que ha emitido. Mira quién emite lo que tienes.</li>
              <li><strong>El precio.</strong> XLM marcó su máximo en enero de 2018 y no lo ha recuperado. Su <Termino slug="volatilidad">volatilidad</Termino> es la de cualquier criptomoneda.</li>
            </ul>
            <p>
              Sobre Hacienda no hay nada particular: vender XLM o cambiarlo por otro activo tributa como con
              cualquier criptomoneda. La reserva bloqueada no cuenta como venta, porque no sale de tu cuenta.
              El detalle, en la guía de
              <Link href="/guias/fiscalidad-cripto-espana"> fiscalidad de las criptomonedas en España</Link>.
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
          <h2 className="gbc-title">Comprueba lo que sabes de Stellar</h2>
          <div className="gbc-body" style={{ marginBottom: 32 }}>
            <p>Cinco preguntas. Con las cinco acertadas desbloqueas el logro <strong style={{ color: "var(--gold)" }}>Línea de Confianza</strong>.</p>
          </div>
          {d.isRegistered ? <GuideStellarQuiz /> : <GuideQuizCuenta slug={SLUG} />}
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
