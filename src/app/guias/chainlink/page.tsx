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
import GuideChainlinkMediana from "./GuideChainlinkMediana";
import GuideChainlinkQuiz from "./GuideChainlinkQuiz";
import "./chainlink.css";

/**
 * Guía «Qué es Chainlink» (13-11-2026). Consulta objetivo: «qué es chainlink».
 *
 * Toda la guía sigue un solo ejemplo: un préstamo que necesita saber cuánto
 * vale el ether. Lo que tiene y las demás no: el recorrido de un precio paso a
 * paso, un simulador para intentar engañar a la red, un caso real en el que el
 * oráculo falló (mayo de 2022) y lo que el staking de LINK cubre y lo que no.
 *
 * Al revisarla: las cifras del staking y la lista de servicios.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/guias/chainlink" },
  title: "Qué es Chainlink (LINK) y para qué sirve",
  description:
    "Qué es Chainlink, explicado con un ejemplo: cómo lleva precios a una blockchain, para qué sirve el token LINK, qué cubre su staking y cuándo ha fallado.",
  openGraph: {
    title: "Qué es Chainlink (LINK): los oráculos explicados con un ejemplo",
    description:
      "Cómo llega un precio a una blockchain, paso a paso, con un simulador para intentar engañar a la red. El token LINK, su staking y un fallo real. Con quiz.",
    type: "article",
  },
};

const SLUG = "chainlink";

const SECCIONES = [
  { id: "que-es", label: "Qué es" },
  { id: "problema", label: "El problema" },
  { id: "paso-a-paso", label: "Paso a paso" },
  { id: "servicios", label: "Para qué sirve" },
  { id: "link", label: "El token LINK" },
  { id: "fallo", label: "Cuando falla" },
  { id: "errores", label: "Ideas equivocadas" },
  { id: "riesgos", label: "Riesgos" },
  { id: "quiz", label: "Quiz" },
];

const PASOS = [
  { titulo: "El préstamo pregunta", texto: "El contrato del préstamo necesita el precio del ether para saber si tu garantía sigue cubriendo lo que debes." },
  { titulo: "Cada nodo mira por su cuenta", texto: "Un grupo de operadores independientes consulta el precio en varias fuentes de datos de pago, que a su vez lo recogen de muchos mercados." },
  { titulo: "Se quedan con el valor del medio", texto: "Las respuestas se ordenan de menor a mayor y se toma la del centro. Un nodo que mienta o se equivoque queda en un extremo y no cuenta." },
  { titulo: "El precio se apunta en la blockchain", texto: "Solo cuando el precio se mueve más de un pequeño porcentaje, o cuando pasa un tiempo máximo sin cambios." },
  { titulo: "El préstamo actúa", texto: "Con ese dato, el contrato decide: todo sigue igual, o la garantía se vende para devolver el préstamo." },
];

export default async function ChainlinkPage() {
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
        <div className="gbc-hero-ey">Guía de criptomonedas · Nivel intermedio · 12 min</div>
        <h1 className="gbc-hero-title">
          Qué es Chainlink (LINK)<br />
          <span className="gbc-hero-gold">explicado con un solo ejemplo</span>
        </h1>
        <p className="gbc-respuesta">
          <strong>Chainlink es la red que le dice a las blockchains lo que pasa fuera de ellas.</strong> Una
          blockchain no puede consultar el precio de nada ni ningún otro dato del mundo: alguien tiene que
          traérselo. Chainlink lo hace con muchos operadores independientes que se vigilan entre sí, y
          <strong> LINK</strong> es la moneda con la que se les paga.
        </p>
        <p className="gbc-revisado">Revisada el <strong>13 de noviembre de 2026</strong> · Datos técnicos: documentación de Chainlink</p>
        <div className="gbc-hero-pills">
          <span className="gbc-pill">Intenta engañar a la red</span>
          <span className="gbc-pill">Un fallo real, contado</span>
          <span className="gbc-pill">Quiz con logro</span>
        </div>
      </header>

      {/* ── 1 ── */}
      <section id="que-es" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo básico</div>
          <h2 className="gbc-title">Qué es Chainlink y por qué no es una blockchain</h2>
          <div className="gbc-body">
            <p>
              Lo primero que hay que deshacer es un malentendido. Bitcoin, Ethereum o Solana son
              <Termino slug="blockchain"> blockchains</Termino>: redes con su propio registro. Chainlink no. Es un
              servicio que trabaja <strong>para</strong> ellas.
            </p>
            <p>
              Su oficio es el de un <Termino slug="oraculo">oráculo</Termino>: llevar datos de fuera a los
              programas que viven en una blockchain. Lo fundaron Sergey Nazarov y Steve Ellis, que publicaron su
              diseño en 2017, y funciona sobre Ethereum desde el 30 de mayo de 2019. Hoy da servicio a decenas de
              redes.
            </p>
            <p>
              No es un producto que uses tú directamente. Es una pieza que usan las aplicaciones, y por eso casi
              nadie la ve. Pero si has pedido un préstamo en una aplicación de finanzas descentralizadas
              (<Termino slug="defi">DeFi</Termino>), es muy probable que el precio que decidió tu suerte viniera
              de Chainlink.
            </p>
          </div>
        </div>
      </section>

      {/* ── 2 ── */}
      <section id="problema" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Por qué existe</div>
          <h2 className="gbc-title">El problema del oráculo: una blockchain no ve el mundo</h2>
          <div className="gbc-body">
            <p>
              Un <Termino slug="smart-contract">contrato inteligente</Termino> solo conoce lo que está escrito en
              su propia blockchain. No puede abrir una web, ni llamar a un banco, ni mirar a cuánto cotiza nada.
              Está hecho así a propósito: todos los ordenadores de la red tienen que llegar al mismo resultado,
              y eso es imposible si cada uno consulta internet por su cuenta.
            </p>
            <p>
              Sigamos un ejemplo durante toda la guía. Dejas 1 ether como
              <Termino slug="colateral"> garantía</Termino> y pides prestados 2.000 dólares. El contrato tiene una
              regla: si tu ether pasa a valer menos de 2.500, lo vende para devolver el préstamo. Eso es una
              <Termino slug="liquidacion"> liquidación</Termino>.
            </p>
            <p>
              La pregunta es evidente: <strong>¿cómo sabe el contrato cuánto vale el ether?</strong> Alguien tiene
              que decírselo. Y quien se lo diga tiene un poder enorme. Si un único servidor le da un precio falso
              durante un minuto, puede provocar liquidaciones por millones y quedarse con las garantías.
            </p>
          </div>
          <div className="gbc-box gbc-box--red">
            <div className="gbc-box-title">El punto débil de cualquier aplicación</div>
            <div className="gbc-box-body">
              <p>De nada sirve que una blockchain sea imposible de manipular si el dato que la alimenta viene de
              un solo sitio. La aplicación es tan segura como su oráculo.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 ── */}
      <section id="paso-a-paso" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Cómo funciona</div>
          <h2 className="gbc-title">Cómo funciona Chainlink, paso a paso</h2>
          <div className="gbc-body">
            <p>
              La respuesta de Chainlink es no fiarse de nadie en concreto. En lugar de un servidor, pregunta a
              muchos, y descarta a los que se salen de lo normal. Así llega el precio del ether a tu préstamo:
            </p>
          </div>

          <ol className="link-pasos">
            {PASOS.map((p, i) => (
              <li key={p.titulo}>
                <span className="link-paso-n">{i + 1}</span>
                <div><strong>{p.titulo}</strong><p>{p.texto}</p></div>
              </li>
            ))}
          </ol>

          <div className="gbc-body" style={{ marginTop: 28 }}>
            <p>
              El paso 3 es el que lo sostiene todo. Se usa el valor del medio, la mediana, y no la media, por una
              razón concreta: un solo mentiroso puede arrastrar una media, pero no puede mover el valor del
              centro. Compruébalo tú. Haz mentir a los <Termino slug="nodo">nodos</Termino>, de uno en uno, y mira cuántos hacen falta para
              falsear el precio:
            </p>
          </div>

          <GuideChainlinkMediana />
        </div>
      </section>

      {/* ── Anuncio de media guía ── */}
      <GuiaAnuncio producto="portfolio" variante="compacto" estado={d.estado} />

      {/* ── 4 ── */}
      <section id="servicios" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que hace hoy</div>
          <h2 className="gbc-title">Para qué sirve Chainlink, más allá de los precios</h2>
          <div className="gbc-body">
            <p>
              Los precios fueron el primer servicio y siguen siendo el más usado. Con los años, la misma idea,
              varios operadores independientes que se comprueban entre sí, se ha aplicado a otros problemas:
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Servicio</th><th>Qué resuelve</th><th>Quién lo usa</th></tr></thead>
              <tbody>
                <tr><td><strong>Precios</strong></td><td>A cuánto cotiza un activo</td><td>Préstamos, <Termino slug="stablecoin">stablecoins</Termino>, derivados</td></tr>
                <tr><td><strong>Mensajes entre redes (CCIP)</strong></td><td>Mover monedas y datos de una blockchain a otra</td><td>Bancos y emisores de activos; es un <Termino slug="bridge">puente</Termino> entre redes</td></tr>
                <tr><td><strong>Prueba de reservas</strong></td><td>Comprobar que lo que respalda a una moneda existe de verdad</td><td>Stablecoins y oro o bitcoin «envueltos»</td></tr>
                <tr><td><strong>Azar verificable</strong></td><td>Un número aleatorio que nadie puede amañar</td><td>Juegos, sorteos y repartos de <Termino slug="nft">NFT</Termino></td></tr>
                <tr><td><strong>Automatización</strong></td><td>Ejecutar un contrato a una hora o cuando pasa algo</td><td>Cualquier aplicación que no quiera depender de una persona</td></tr>
              </tbody>
            </table>
          </div>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              El de los mensajes entre redes es el que más ha crecido, porque es el que interesa a la banca. La
              red de mensajería bancaria Swift lleva desde 2023 haciendo pruebas con él para mover activos
              digitales entre entidades. Que haya pruebas no significa que los bancos lo usen a diario: son
              pilotos, y así hay que leerlos.
            </p>
            <p>
              En total, Chainlink afirma proteger más de 100.000 millones de dólares depositados en aplicaciones
              (cifra del propio proyecto, mayo de 2026).
            </p>
          </div>
        </div>
      </section>

      {/* ── 5 ── */}
      <section id="link" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">La moneda</div>
          <h2 className="gbc-title">Para qué sirve el token LINK</h2>
          <div className="gbc-body">
            <p>
              LINK tiene dos trabajos. El primero es <strong>pagar</strong>: las aplicaciones que quieren datos
              pagan por ellos, y los operadores cobran en LINK. El segundo es <strong>responder</strong>: quien
              participa puede dejar LINK bloqueado como fianza, y perder una parte si el servicio falla. Eso es
              su <Termino slug="staking">staking</Termino>.
            </p>
            <p>
              Existen 1.000 millones de LINK como máximo, creados todos en 2017. No se crean más: las
              recompensas del staking salen de monedas que ya existían.
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>El staking de LINK</th><th>Cómo está en noviembre de 2026</th></tr></thead>
              <tbody>
                <tr><td><strong>Cuánto cabe</strong></td><td>45 millones de LINK en total. La parte abierta al público está llena</td></tr>
                <tr><td><strong>Cuánto paga</strong></td><td>En torno al 4,3 % anual, variable</td></tr>
                <tr><td><strong>Qué protege</strong></td><td>De momento, solo el precio de ETH en dólares en Ethereum</td></tr>
                <tr><td><strong>Cuánto tarda la retirada</strong></td><td>28 días de espera y, después, 7 días para retirar</td></tr>
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Condiciones de la versión 0.2 del staking, en vigor desde noviembre de 2023, según la página de
            staking de Chainlink (consultada a finales de octubre de 2026).
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              La tercera fila es la importante. El staking que existe hoy es una primera versión: no asegura
              todos los servicios de Chainlink, sino uno solo. Y como la parte pública está llena, comprar LINK
              no significa poder ponerlo a rendir. Si declaras en España y sí consigues entrar, lo que cobres
              tributa al recibirlo, como explica la guía de
              <Link href="/guias/fiscalidad-cripto-espana"> fiscalidad cripto</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* ── 6 ── */}
      <section id="fallo" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Un caso real</div>
          <h2 className="gbc-title">Cuando el oráculo falla: lo que pasó en mayo de 2022</h2>
          <div className="gbc-body">
            <p>
              En mayo de 2022 se hundió la criptomoneda LUNA: en pocos días pasó de valer decenas de dólares a
              fracciones de céntimo. El precio que Chainlink daba de LUNA tenía un suelo de seguridad, un mínimo
              por debajo del cual dejaba de actualizarse. Estaba en 0,10 dólares.
            </p>
            <p>
              Cuando LUNA cayó por debajo, el oráculo siguió diciendo 0,10 mientras en el mercado valía cien
              veces menos. Hubo quien lo aprovechó: compró LUNA casi regalada, la dejó como garantía en
              aplicaciones de préstamos que la valoraban a 0,10 y se llevó dinero bueno. Una de ellas, Venus,
              reconoció unos 11 millones de dólares en pérdidas.
            </p>
            <p>
              La lección no es que Chainlink mintiera: el precio lo dieron sus nodos tal como estaba
              configurado. La lección es que <strong>un oráculo es una pieza más que puede fallar</strong>, y que
              la responsabilidad se reparte entre quien da el dato y la aplicación que decide fiarse de él sin
              más protecciones.
            </p>
          </div>
        </div>
      </section>

      {/* ── 7 ── */}
      <section id="errores" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">El error típico</div>
          <h2 className="gbc-title">Tres ideas equivocadas sobre Chainlink</h2>
          <div className="link-ideas">
            <div>
              <p className="link-idea-mal">«Si Chainlink se usa mucho, LINK tiene que subir»</p>
              <p>El uso de la red y el precio del token son cosas distintas. Las aplicaciones pueden pagar con
              otras monedas, y parte del servicio se ha dado durante años subvencionado. Que una tecnología
              triunfe no garantiza nada sobre su moneda.</p>
            </div>
            <div>
              <p className="link-idea-mal">«Chainlink es descentralizado, así que no depende de nadie»</p>
              <p>Los operadores de cada servicio no se apuntan libremente: se seleccionan. Y los cambios en la
              configuración los aprueba un grupo reducido de firmantes. Es mucho más robusto que un solo
              servidor, pero no es una red abierta como Bitcoin.</p>
            </div>
            <div>
              <p className="link-idea-mal">«Con el staking, si el oráculo falla me compensan»</p>
              <p>El staking cubre hoy un único precio. Si usas una aplicación que depende de cualquier otro dato
              y ese dato falla, no hay fianza que responda por ti.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8 ── */}
      <section id="riesgos" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que puede salir mal</div>
          <h2 className="gbc-title">Los riesgos de Chainlink y de LINK</h2>
          <div className="gbc-body">
            <ul>
              <li><strong>Demasiado depende de él.</strong> Es el oráculo de buena parte de las finanzas descentralizadas. Un fallo grave no afectaría a una aplicación, sino a muchas a la vez.</li>
              <li><strong>La competencia.</strong> Otros oráculos, como Pyth o RedStone, ofrecen datos más rápidos o más baratos, y algunas aplicaciones ya combinan varios.</li>
              <li><strong>El vínculo entre el token y el negocio.</strong> Lo que LINK captura de los ingresos de la red sigue siendo la gran pregunta abierta para quien lo compra.</li>
              <li><strong>El control.</strong> Las decisiones importantes las toma un grupo pequeño. Es eficaz, y es un punto de confianza.</li>
              <li><strong>El precio.</strong> LINK superó los 50 dólares en mayo de 2021 y llegó a caer cerca de un 90 % después. Su <Termino slug="volatilidad">volatilidad</Termino> es la de cualquier criptomoneda.</li>
            </ul>
            <p>
              Sobre Hacienda no hay nada particular: comprar, vender o cambiar LINK tributa como cualquier otra
              criptomoneda.
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
          <h2 className="gbc-title">Comprueba lo que sabes de Chainlink</h2>
          <div className="gbc-body" style={{ marginBottom: 32 }}>
            <p>Cinco preguntas. Con las cinco acertadas desbloqueas el logro <strong style={{ color: "var(--gold)" }}>Mensajero Fiable</strong>.</p>
          </div>
          {d.isRegistered ? <GuideChainlinkQuiz /> : <GuideQuizCuenta slug={SLUG} />}
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
