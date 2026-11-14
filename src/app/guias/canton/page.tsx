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
import GuideCantonEmision from "./GuideCantonEmision";
import GuideCantonQuiz from "./GuideCantonQuiz";
import "./canton.css";

/**
 * Guía «Qué es Canton Network» (14-11-2026). Consulta objetivo: «qué es
 * canton network».
 *
 * Lo que tiene y las demás en español no: quién ve qué en una operación (y la
 * paradoja de que Canton Coin sea pública en una red privada), el repo
 * explicado con números, la curva de emisión oficial con un simulador de
 * dilución, lo que puede y no puede hacer un particular desde España y cómo lo
 * trata Hacienda.
 *
 * Al revisar: precio, capitalización, puesto y volumen (CoinGecko), oferta
 * circulante (también en GuideCantonEmision), número de super validadores,
 * estado de JPM Coin en Canton y del servicio de tokenización de DTCC.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/guias/canton" },
  title: "Qué es Canton Network (CC) y cómo funciona",
  description:
    "Qué es Canton Network: la red de bancos donde cada parte solo ve sus contratos, cómo se emite Canton Coin (CC) sin preventa y qué puedes hacer desde España.",
  openGraph: {
    title: "Qué es Canton Network (CC): la blockchain de los bancos, explicada",
    description:
      "Privacidad entre partes, Daml, el Global Synchronizer, quién la usa, cómo se emite Canton Coin y sus riesgos. Con simulador de emisión y quiz.",
    type: "article",
  },
};

const SLUG = "canton";

const SECCIONES = [
  { id: "que-es", label: "Qué es" },
  { id: "privacidad", label: "Quién ve qué" },
  { id: "synchronizer", label: "Global Synchronizer" },
  { id: "quien-la-usa", label: "Quién la usa" },
  { id: "ethereum", label: "Frente a Ethereum" },
  { id: "canton-coin", label: "Canton Coin" },
  { id: "desde-espana", label: "Desde España" },
  { id: "riesgos", label: "Riesgos" },
  { id: "quiz", label: "Quiz" },
];

const VISIBILIDAD: { quien: string; ve: string; noVe: string }[] = [
  { quien: "El banco que presta", ve: "El contrato entero: importe, tipo, plazo y garantía", noVe: "Las demás operaciones de la gestora" },
  { quien: "La gestora que recibe el dinero", ve: "El mismo contrato, y sus propias posiciones", noVe: "Con quién más opera el banco" },
  { quien: "El custodio de los bonos", ve: "Solo la parte que le toca: mover la garantía", noVe: "El tipo de interés pactado" },
  { quien: "El Global Synchronizer", ve: "Que hay mensajes cifrados que ordenar y confirmar", noVe: "Nada del contenido" },
  { quien: "Cualquier otro participante", ve: "Nada", noVe: "Ni siquiera que la operación existe" },
];

const HITOS: { cuando: string; que: string }[] = [
  { cuando: "9 de mayo de 2023", que: "Digital Asset presenta Canton Network con bancos, infraestructuras de mercado y firmas de trading" },
  { cuando: "1 de julio de 2024", que: "Arrancan el Global Synchronizer y Canton Coin, con el voto a favor de los super validadores" },
  { cuando: "19 de marzo de 2025", que: "Goldman Sachs, HKFMI y Moody's se suman a la fundación que gobierna el Global Synchronizer" },
  { cuando: "Agosto de 2025", que: "La plataforma de repos de Broadridge sobre Canton procesa unos 280.000 millones de dólares al día de media" },
  { cuando: "7 de enero de 2026", que: "JPMorgan anuncia que llevará a Canton JPM Coin, su versión digital de los depósitos en dólares, por fases durante 2026" },
  { cuando: "28 de octubre de 2026", que: "DTCC abre su servicio de tokenización de valores, conectado a Canton y a una red propia" },
];

const CURVA: { fase: string; ritmo: string; apps: string; validadores: string; sv: string }[] = [
  { fase: "Jul. 2024 – ene. 2025", ritmo: "40.000 M", apps: "15 %", validadores: "5 %", sv: "80 %" },
  { fase: "Ene. 2025 – ene. 2026", ritmo: "20.000 M", apps: "40 %", validadores: "12 %", sv: "48 %" },
  { fase: "Ene. 2026 – jul. 2029", ritmo: "10.000 M", apps: "62 %", validadores: "18 %", sv: "20 %" },
  { fase: "Jul. 2029 – jul. 2034", ritmo: "5.000 M", apps: "69 %", validadores: "21 %", sv: "10 %" },
  { fase: "Desde jul. 2034", ritmo: "2.500 M", apps: "75 %", validadores: "20 %", sv: "5 %" },
];

export default async function CantonPage() {
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
          Qué es Canton Network (CC)<br />
          <span className="gbc-hero-gold">la blockchain que usan los bancos</span>
        </h1>
        <p className="gbc-respuesta">
          <strong>Canton Network es una blockchain pensada para bancos y gestoras, en la que cada participante
          solo ve los contratos en los que interviene.</strong> Sus instituciones la usan para mover bonos
          tokenizados, préstamos con garantía y dinero bancario. Su moneda, Canton Coin (CC), paga el uso de la
          red y se crea como recompensa a quien la mantiene, sin preventa. Puedes comprarla en algunos
          exchanges, pero no te da acceso a lo que hacen los bancos dentro.
        </p>
        <p className="gbc-revisado">Revisada el <strong>14 de noviembre de 2026</strong> · Datos de mercado: CoinGecko, misma fecha</p>
        <div className="gbc-hero-pills">
          <span className="gbc-pill">Quién ve qué, operación a operación</span>
          <span className="gbc-pill">Simulador de emisión de CC</span>
          <span className="gbc-pill">Quiz con logro</span>
        </div>
      </header>

      {/* ── 1 ── */}
      <section id="que-es" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo básico</div>
          <h2 className="gbc-title">Qué es Canton Network, en pocas palabras</h2>
          <div className="gbc-body">
            <p>
              Canton Network es una <Termino slug="capa-1">red de capa 1</Termino>: una
              <Termino slug="blockchain"> blockchain</Termino> con sus propias reglas y su propia moneda. La
              diferencia está en para quién se hizo. No nació para que cualquiera mueva criptomonedas, sino para
              que un banco, una gestora y un custodio compartan operaciones sin enseñárselas al resto.
            </p>
            <p>
              En <Termino slug="bitcoin">Bitcoin</Termino> o en Ethereum todos los
              <Termino slug="nodo"> nodos</Termino> guardan una copia de todo. Para un banco eso es
              inaceptable: sus clientes, sus precios y sus posiciones serían públicos. Canton Network resuelve
              ese problema al revés. Cada participante guarda solo sus contratos, y la red se limita a garantizar
              que todos los implicados ven la misma versión.
            </p>
            <p>
              La desarrolló Digital Asset, una empresa de Nueva York fundada en 2015, que la presentó en mayo de
              2023. Desde el 1 de julio de 2024 funciona su capa común, el Global Synchronizer, junto con su
              moneda nativa, Canton Coin. A 14 de noviembre de 2026, Canton Coin ocupa el <strong>puesto 26</strong> por
              <Termino slug="market-cap">capitalización</Termino> en CoinGecko, con el símbolo <strong>CC</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* ── 2 ── */}
      <section id="privacidad" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Cómo funciona</div>
          <h2 className="gbc-title">Cómo funciona Canton: cada participante solo ve sus contratos</h2>
          <div className="gbc-body">
            <p>
              Los contratos de Canton se escriben en <Termino slug="daml">Daml</Termino>, un lenguaje de
              <Termino slug="smart-contract"> contratos inteligentes</Termino> creado por Digital Asset. Su rasgo
              principal es que cada contrato declara quién lo firma, quién puede ejecutarlo y quién puede verlo.
              La privacidad no se añade después: va escrita en el propio contrato.
            </p>
            <p>
              Cuando se ejecuta una operación, la red la parte en «vistas». Cada parte recibe solo la suya. Lo
              ves mejor con un ejemplo: un banco presta 10 millones de euros a una gestora durante una noche, y
              la gestora entrega bonos como garantía a través de un custodio.
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Quién</th><th>Qué ve</th><th>Qué no ve</th></tr></thead>
              <tbody>
                {VISIBILIDAD.map((v) => (
                  <tr key={v.quien}><td><strong>{v.quien}</strong></td><td>{v.ve}</td><td>{v.noVe}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Ejemplo propio. El reparto de lo que ve cada uno sigue la documentación técnica de Canton
            (docs.canton.network, «What is Canton»), consultada el 14 de noviembre de 2026.
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Lo importante es la última fila. En una blockchain pública, hasta quien no participa ve que algo
              ha ocurrido. En Canton, quien no está en el contrato no recibe nada, y el nodo de cada institución
              guarda solo lo suyo.
            </p>
          </div>
          <div className="gbc-box gbc-box--gold">
            <div className="gbc-box-title">La paradoja: Canton Coin es pública</div>
            <div className="gbc-box-body">
              <p>
                En una red construida para ocultar, su moneda no se oculta. El libro blanco de Canton Coin dice
                expresamente que las posiciones y transferencias de CC son visibles. Lo hicieron a propósito:
                así cualquiera puede medir cuánto se usa cada aplicación. Las operaciones privadas pueden ir en
                la misma transacción que un pago en CC, y siguen siendo privadas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 ── */}
      <section id="synchronizer" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">La capa común</div>
          <h2 className="gbc-title">Qué es el Global Synchronizer y quién gobierna Canton Network</h2>
          <div className="gbc-body">
            <p>
              Si cada uno guarda solo lo suyo, alguien tiene que poner orden. Esa pieza es el sincronizador. No
              guarda contratos: recibe mensajes cifrados, los ordena y confirma que todas las partes han dado su
              visto bueno. Así una operación entre tres entidades se cierra de golpe para las tres, o no se
              cierra.
            </p>
            <p>
              El Global Synchronizer es el sincronizador público y compartido de la red. Lo operan los
              <strong> super validadores</strong>: organizaciones que funcionan como
              <Termino slug="validador"> validadores</Termino> y, además, mantienen esta capa común. Deciden por
              mayorías de unos dos tercios. Con ese voto fijan casi todo: quién entra como super validador, las
              comisiones y hasta la curva de emisión de la moneda.
            </p>
            <p>
              Por encima hay una fundación sin ánimo de lucro, la Canton Foundation (antes Global Synchronizer
              Foundation), constituida en Delaware el 24 de junio de 2024 y apoyada por la Linux Foundation.
              Coordina la <Termino slug="gobernanza"> gobernanza</Termino>, pero vota como un super validador
              más. El desarrollo técnico y el mantenimiento del protocolo siguen en manos de Digital Asset y de
              otros colaboradores, según el documento oficial de Canton Coin.
            </p>
            <p>
              Un detalle que la separa de Ethereum: no cualquiera conecta un validador a la red principal.
              Necesitas que un super validador te patrocine, que tu dirección IP entre en una lista autorizada y
              una aprobación previa. La documentación oficial habla de unas dos a cuatro semanas de trámite.
            </p>
          </div>
        </div>
      </section>

      {/* ── Anuncio de media guía ── */}
      <GuiaAnuncio producto="cursos" variante="compacto" estado={d.estado} />

      {/* ── 4 ── */}
      <section id="quien-la-usa" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Para qué sirve</div>
          <h2 className="gbc-title">Quién usa Canton Network: bancos, gestoras y el mercado de repos</h2>
          <div className="gbc-body">
            <p>
              El uso principal de Canton Network es la <Termino slug="tokenizacion">tokenización</Termino> de
              activos financieros: convertir un bono, un fondo o un depósito en un registro digital que se mueve
              en minutos y a cualquier hora. El sector los llama activos del mundo real. El caso con más volumen es el <Termino slug="repo">repo</Termino>.
            </p>
            <p>
              Un repo es un préstamo a muy corto plazo con garantía. Una gestora necesita 10 millones de euros
              para una noche. Entrega bonos del Estado por valor de algo más y recibe el dinero. Al día
              siguiente devuelve los 10 millones más un interés pequeño, por ejemplo 1.000 euros, y recupera sus
              bonos. Es la fontanería de los mercados: cada día se mueven así billones.
            </p>
            <p>
              Hacerlo en Canton tiene una ventaja concreta. El dinero y la garantía cambian de manos en el mismo
              instante, sin esperar a que dos sistemas distintos cuadren sus registros. Y ninguno de los
              competidores del banco ve a quién presta ni a qué tipo.
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Cuándo</th><th>Qué pasó</th></tr></thead>
              <tbody>
                {HITOS.map((h) => (
                  <tr key={h.cuando}><td><strong>{h.cuando}</strong></td><td>{h.que}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Fuentes: comunicados de Digital Asset (9-5-2023), Canton Network (1-7-2024), Linux Foundation (19-3-2025), Broadridge
            (10-9-2025, datos de agosto), Digital Asset y Kinexys by J.P. Morgan (7-1-2026) y DTCC (28-10-2026).
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Lee esa tabla con cuidado. Casi todo lo que hacen estas entidades ocurre en contratos privados
              entre ellas, y casi nunca exige que tengan Canton Coin. Que JPMorgan lleve su
              <Termino slug="token-de-deposito"> token de depósito</Termino> a Canton dice mucho de la red. De
              la demanda de CC dice bastante menos, y lo verás en la sección de la moneda.
            </p>
            <p>
              Con DTCC pasa lo mismo. Es el depositario central de valores de Estados Unidos, y el 28 de octubre
              de 2026 abrió su servicio de tokenización con una veintena de entidades firmadas, entre ellas
              JPMorgan, Citi y Morgan Stanley. Canton es una de sus dos redes al arrancar. Para Canton Network es
              un respaldo enorme; para quien tenga CC, un dato que no cambia cuántas monedas se crean.
            </p>
          </div>
        </div>
      </section>

      {/* ── 5 ── */}
      <section id="ethereum" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">La comparación</div>
          <h2 className="gbc-title">En qué se diferencia Canton Network de Ethereum</h2>
          <div className="gbc-body">
            <p>
              Las dos son redes de capa 1 con contratos inteligentes, y ahí acaban casi todas las similitudes.
              <Link href="/guias/ethereum"> Ethereum</Link> busca que cualquiera pueda comprobarlo todo. Canton
              busca que nadie vea lo que no le toca.
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th></th><th>Ethereum</th><th>Canton Network</th></tr></thead>
              <tbody>
                <tr><td><strong>Quién ve las operaciones</strong></td><td>Todo el mundo</td><td>Solo las partes de cada contrato</td></tr>
                <tr><td><strong>Qué guarda cada nodo</strong></td><td>La cadena entera</td><td>Solo los contratos de sus partes</td></tr>
                <tr><td><strong>Quién valida</strong></td><td>Cualquiera que deposite 32 ETH</td><td>Validadores aprobados; capa común en manos de super validadores</td></tr>
                <tr><td><strong>Lenguaje</strong></td><td>Solidity, sobre todo</td><td>Daml</td></tr>
                <tr><td><strong>Pagar el uso</strong></td><td>En ETH, obligatorio en cada operación</td><td>En CC o mediante un tercero que lo prepaga: la moneda es opcional</td></tr>
                <tr><td><strong>Usuarios típicos</strong></td><td>Particulares, <Termino slug="defi">DeFi</Termino>, <Termino slug="nft">NFT</Termino>, empresas</td><td>Bancos, gestoras, custodios, infraestructuras de mercado</td></tr>
              </tbody>
            </table>
          </div>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Por eso hay un debate abierto sobre si Canton es «una blockchain de verdad». Sus defensores dicen
              que es pública porque cualquier institución aprobada puede conectarse. Sus críticos responden que
              una red donde no puedes comprobar lo que hacen los demás pide confianza en quien la gobierna. Las
              dos cosas son ciertas a la vez.
            </p>
          </div>
        </div>
      </section>

      {/* ── 6 ── */}
      <section id="canton-coin" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">La moneda</div>
          <h2 className="gbc-title">Canton Coin (CC): cómo se emite sin preventa</h2>
          <div className="gbc-body">
            <p>
              Canton Coin no se vendió a inversores antes de existir. El libro blanco que la Canton Foundation
              presentó bajo el reglamento europeo <Termino slug="mica">MiCA</Termino>, notificado el 9 de
              septiembre de 2025, lo dice sin rodeos: no hubo preventas ni reservas para fundadores. Toda CC en
              circulación se ha acuñado a cambio de prestar un servicio a la red.
            </p>
            <p>
              El mecanismo se llama equilibrio de quema y acuñación. Quien usa la red paga el tráfico con CC, y
              esas monedas se destruyen: es una <Termino slug="quema-de-tokens">quema de tokens</Termino>. A la
              vez, cada diez minutos se acuñan monedas nuevas para super validadores, validadores y aplicaciones,
              en proporción a lo que han aportado. Si se quema más de lo que se crea, la
              <Termino slug="oferta-circulante"> oferta</Termino> baja; si no, sube.
            </p>
            <p>
              Lo que se puede crear tiene un techo, y está escrito. En los diez primeros años, como máximo
              100.000 millones de CC. Después, 2.500 millones al año para siempre. No hay tope total.
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Fase</th><th>Máximo al año</th><th>Aplicaciones</th><th>Validadores</th><th>Super validadores</th></tr></thead>
              <tbody>
                {CURVA.map((c) => (
                  <tr key={c.fase}><td><strong>{c.fase}</strong></td><td>{c.ritmo}</td><td>{c.apps}</td><td>{c.validadores}</td><td>{c.sv}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Fuente: libro blanco MiCA de Canton Coin (Canton Foundation, 9-9-2025), tabla «Canton Coin Minting
            Curve». Fechas calculadas desde el arranque del 1 de julio de 2024. El reparto ya se ha retocado por
            votación: desde la propuesta CIP-0082, un 5 % de cada ronda va a un fondo de desarrollo que gestiona
            la fundación (docs.canton.network, consultada el 14-11-2026).
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              A 14 de noviembre de 2026 circulan unos 40.050 millones de CC, según CoinGecko. Su precio era de
              0,084 dólares y su capitalización, de unos 3.360 millones de dólares. Estás en la fase de 10.000
              millones al año, que dura hasta julio de 2029.
            </p>
            <p>
              Haz la cuenta tú. Si hasta julio de 2029 se acuñara el máximo y no se quemara nada, saldrían unos
              26.300 millones de CC nuevos. Sería un 66 % más de oferta. Quien tenga hoy 1.000 CC tendría una
              porción de la red un 40 % menor. Prueba otros plazos y otros niveles de quema:
            </p>
          </div>

          <GuideCantonEmision />

          <div className="gbc-body" style={{ marginTop: 26 }}>
            <p>
              Fíjate también en la primera fila de la tabla. Durante el primer medio año, el 80 % de lo acuñable
              fue para los super validadores, que al arrancar eran un grupo reducido de empresas e instituciones.
              Ahora es el 20 %, y bajando. No hubo preventa, pero el reparto inicial tampoco fue para el público.
            </p>
          </div>
        </div>
      </section>

      {/* ── 7 ── */}
      <section id="desde-espana" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Desde España</div>
          <h2 className="gbc-title">¿Se puede comprar Canton Coin en España? Lo que puedes hacer y lo que no</h2>
          <div className="gbc-body">
            <p>
              Sí, puedes comprar CC. Según su libro blanco MiCA, la Canton Foundation pidió su admisión a
              negociación en la UE empezando por Kraken, a través de su sociedad irlandesa, y España figura entre
              los países de destino. A noviembre de 2026 también cotiza en Bybit, OKX, KuCoin y Gate, entre
              otros, según CoinGecko.
            </p>
            <p>
              Ese documento lleva una advertencia que debes leer: ninguna autoridad europea lo ha aprobado. MiCA
              exige publicarlo, no que un supervisor dé por buena la moneda. Comprueba además que el
              <Termino slug="exchange"> exchange</Termino> que uses está autorizado en la UE: ESMA mantiene el
              registro público de proveedores autorizados bajo MiCA.
            </p>
          </div>
          <div className="cc-puedes">
            <div className="cc-puedes-col cc-puedes-col--si">
              <p className="cc-puedes-titulo">Lo que sí puedes hacer</p>
              <ul>
                <li>Comprar y vender CC en un exchange, como cualquier otra criptomoneda.</li>
                <li>Guardarla en una <Termino slug="wallet">cartera</Termino> de la red, a través de un validador de un tercero.</li>
                <li>Ver sus movimientos: las transferencias de CC son públicas.</li>
                <li>Leer el código de Daml y de la red, que es abierto.</li>
              </ul>
            </div>
            <div className="cc-puedes-col cc-puedes-col--no">
              <p className="cc-puedes-titulo">Lo que no</p>
              <ul>
                <li>Comprar los bonos tokenizados ni entrar en los repos de los bancos: son contratos privados entre instituciones.</li>
                <li>Montar un validador en la red principal sin patrocinio y aprobación.</li>
                <li>Esperar que el éxito de esos bancos llegue al precio de CC: no hay un vínculo directo.</li>
              </ul>
            </div>
          </div>
          {/* EXPERIENCIA DEL ADMIN: si has comprado o seguido CC, cuenta aquí en 2-3 frases dónde la compraste o la miraste, qué te sorprendió (la liquidez, la cartera, el precio frente a las noticias de bancos) y si la tienes o no en el Portfolio. Sin cifras de rentabilidad. */}
          <div className="gbc-body" style={{ marginTop: 26 }}>
            <p>
              Con Hacienda, CC funciona como cualquier criptomoneda. Si la vendes por euros, o la cambias por
              otra criptomoneda o por una <Termino slug="stablecoin">stablecoin</Termino>, la diferencia entre
              lo que te costó y lo que vale en ese momento es una ganancia o pérdida patrimonial. Va a la base
              del ahorro de tu renta, aunque nunca hayas tocado euros.
            </p>
            <p>
              Dos detalles más. Desde el 1 de enero de 2026, los exchanges de la UE recogen tus operaciones para
              comunicárselas a Hacienda, por la directiva DAC8; el primer envío llega en 2027. Y si a 31 de diciembre tienes más de 50.000 euros en criptomonedas custodiadas en
              el extranjero, hay que presentar el modelo 721. El método de cálculo, con ejemplos, está en la guía
              de <Link href="/guias/fiscalidad-cripto-espana">fiscalidad de las criptomonedas en España</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* ── 8 ── */}
      <section id="riesgos" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que puede salir mal</div>
          <h2 className="gbc-title">Los riesgos de Canton Coin para un inversor particular</h2>
          <div className="gbc-body">
            <ul>
              <li><strong>La red puede crecer sin que CC lo haga.</strong> Las instituciones pueden pagar el tráfico mediante un tercero, y sus activos no son CC. El propio diseño llama a la moneda «opcional».</li>
              <li><strong>La oferta crece mucho.</strong> Hasta 10.000 millones de CC al año ahora, sin tope total. Si la quema no acompaña, cada moneda vale una parte menor de la red.</li>
              <li><strong>Concentración del poder.</strong> Unas decenas de super validadores, casi todos grandes instituciones, pueden cambiar por votación las comisiones y la curva de emisión. No tienes voto.</li>
              <li><strong>Dependencia de Digital Asset.</strong> Es la empresa que creó la red y sigue desarrollando el protocolo. Sus problemas o sus decisiones serían los de Canton.</li>
              <li><strong><Termino slug="liquidez">Liquidez</Termino> escasa para su tamaño.</strong> El 14 de noviembre de 2026 se negociaron unos 10,6 millones de dólares en 24 horas, un 0,3 % de su capitalización. En una caída fuerte, vender sin mover el precio puede costar.</li>
              <li><strong>Pequeñas tasas por guardarla en la red.</strong> Cada posición de CC en una cartera de Canton paga una tasa fija con el tiempo, y las posiciones diminutas pueden acabar caducadas.</li>
              <li><strong>El precio.</strong> Su <Termino slug="volatilidad">volatilidad</Termino> es la de cualquier criptomoneda. Marcó su máximo, 0,194 dólares, el 3 de febrero de 2026; el 14 de noviembre cotizaba un 57 % por debajo, según CoinGecko.</li>
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
          <h2 className="gbc-title">Comprueba lo que sabes de Canton Network</h2>
          <div className="gbc-body" style={{ marginBottom: 32 }}>
            <p>Cinco preguntas. Con las cinco acertadas desbloqueas el logro <strong style={{ color: "var(--gold)" }}>Vista Reservada</strong>.</p>
          </div>
          {d.isRegistered ? <GuideCantonQuiz /> : <GuideQuizCuenta slug={SLUG} />}
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
