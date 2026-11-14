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
import GuideNearAlmacenamiento from "./GuideNearAlmacenamiento";
import GuideNearQuiz from "./GuideNearQuiz";
import "./near.css";

/**
 * Guía «Qué es NEAR Protocol» (14-11-2026). Consulta objetivo: «qué es near protocol».
 *
 * Lo que tiene y las demás no: una calculadora del NEAR que queda bloqueado
 * por guardar datos (storage staking), lo que rinde el staking descontando la
 * inflación con los datos de la propia red, y el fin del 30 % de comisiones
 * para los desarrolladores (versión 2.14, 26-10-2026), que la mayoría de las
 * guías en español todavía da por vigente.
 *
 * Datos de la red leídos por RPC en la red principal el 14-11-2026: versión de
 * protocolo 88, inflación máxima 1/40, 0 % de comisión para los contratos,
 * 10 fragmentos, época de 43.200 bloques, 1 NEAR por 100.000 bytes, oferta de
 * 1.311,7 millones y 589 millones en staking con 345 validadores.
 *
 * Ojo con el tesoro: `protocol_reward_rate` sale [0, 1] en
 * EXPERIMENTAL_protocol_config, pero treasury.near sigue cobrando ~10 % de la
 * emisión al cerrar cada época (comprobado en el nodo de archivo, 14-11-2026),
 * y HSP-029 describe el reparto 90/10 como vigente. La guía usa 90/10.
 * Precio: CoinGecko, misma fecha. Al revisar la guía, se vuelve a leer todo
 * eso: es lo que antes caduca.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/guias/near" },
  title: "Qué es NEAR Protocol: cómo funciona y qué rinde",
  description:
    "Qué es NEAR Protocol, sin jerga: cuentas con nombre, sharding, el NEAR que bloquea guardar datos (con calculadora) y lo que rinde el staking de verdad.",
  openGraph: {
    title: "Qué es NEAR Protocol (NEAR): cuentas con nombre, almacenamiento y staking real",
    description:
      "Cómo funciona NEAR, cuánto NEAR bloquea guardar datos, qué rinde el staking descontando la inflación, su giro a la IA y lo que pide Hacienda. Con quiz.",
    type: "article",
  },
};

const SLUG = "near";

const SECCIONES = [
  { id: "que-es", label: "Qué es" },
  { id: "cuentas", label: "Cuentas con nombre" },
  { id: "por-dentro", label: "Cómo funciona" },
  { id: "almacenamiento", label: "Almacenamiento" },
  { id: "comisiones", label: "Comisiones" },
  { id: "staking", label: "Staking real" },
  { id: "futuro", label: "Abstracción e IA" },
  { id: "hacienda", label: "Hacienda" },
  { id: "riesgos", label: "Riesgos" },
  { id: "quiz", label: "Quiz" },
];

const CUENTAS: { tipo: string; ejemplo: string; texto: React.ReactNode; nombre: boolean }[] = [
  {
    tipo: "Cuenta con nombre",
    ejemplo: "lucia.near",
    texto: <>La eliges tú, con un máximo de 64 caracteres en total. Se lee, se dicta por teléfono y se recuerda. Es lo que la mayoría de <Termino slug="wallet">carteras</Termino> te propone crear.</>,
    nombre: true,
  },
  {
    tipo: "Cuenta implícita",
    ejemplo: "98793cd91a3f870f…be8ffc0da19",
    texto: <>64 caracteres hexadecimales que salen de tu <Termino slug="clave-publica">clave pública</Termino>. Existe en cuanto alguien le envía NEAR, sin pasos previos. Es la que suelen darte los <Termino slug="exchange">exchanges</Termino>.</>,
    nombre: false,
  },
  {
    tipo: "Implícita al estilo Ethereum",
    ejemplo: "0x32be343b94f8…a78f6aa8f9",
    texto: "Una dirección de 40 caracteres con 0x delante, como las de Ethereum. Existe para que carteras de esa red puedan usar NEAR sin cambiar de formato.",
    nombre: false,
  },
];

export default async function NearPage() {
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
          Qué es NEAR Protocol (NEAR)<br />
          <span className="gbc-hero-gold">y en qué se diferencia de las demás redes</span>
        </h1>
        <p className="gbc-respuesta">
          <strong>NEAR Protocol es una blockchain para ejecutar aplicaciones, pensada para que usarla se parezca
          a usar internet</strong>: las cuentas tienen nombre, como «lucia.near», y enviar dinero cuesta en torno a
          una centésima de céntimo. Escala repartiendo el trabajo en fragmentos que funcionan en paralelo. Su moneda,
          NEAR, paga las comisiones, respalda los datos que guardas y se usa para el staking.
        </p>
        <p className="gbc-revisado">Revisada el <strong>14 de noviembre de 2026</strong> · Datos leídos en la propia red ese día</p>
        <div className="gbc-hero-pills">
          <span className="gbc-pill">Calculadora del almacenamiento</span>
          <span className="gbc-pill">El staking, descontando la inflación</span>
          <span className="gbc-pill">Quiz con logro</span>
        </div>
      </header>

      {/* ── 1 ── */}
      <section id="que-es" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo básico</div>
          <h2 className="gbc-title">Qué es NEAR Protocol y quién lo creó</h2>
          <div className="gbc-body">
            <p>
              NEAR Protocol es una <Termino slug="blockchain">blockchain</Termino> de capa 1: una red propia, con
              sus propios <Termino slug="validador">validadores</Termino>, sobre la que se ejecutan
              <Termino slug="smart-contract"> contratos inteligentes</Termino>. Compite en la misma liga que
              Ethereum o Solana, pero ha puesto el foco en otra cosa: que quien la usa no tenga que entender
              direcciones, redes ni comisiones.
            </p>
            <p>
              Sus fundadores venían de la inteligencia artificial, no de las criptomonedas. Illia Polosukhin había
              trabajado en Google. Es uno de los ocho autores de «Attention Is All You Need», el artículo de 2017
              que presentó la arquitectura sobre la que funcionan los modelos de lenguaje actuales. Alexander
              Skidanov venía de Microsoft. En 2017 montaron NEAR.ai, una empresa que intentaba enseñar a una
              máquina a programar.
            </p>
            <p>
              Para pagar a quienes les ayudaban a entrenar sus modelos, buscaron una blockchain barata y rápida, y
              no encontraron ninguna que sirviera. En 2018 cambiaron de rumbo y se pusieron a construirla. La red
              arrancó en abril de 2020 con 1.000 millones de NEAR y abrió las transferencias en octubre de ese año.
              Hoy la gestiona un ecosistema de entidades encabezado por la NEAR Foundation, con sede en Suiza.
            </p>
            <p>
              A 14 de noviembre de 2026 había 1.311,7 millones de NEAR, según la propia red, y cada uno cotizaba
              a 3,02 euros según CoinGecko. Eso deja su <Termino slug="market-cap">capitalización</Termino> en unos
              3.960 millones de euros, en el puesto 22 del mercado. El precio está cerca de un 84 % por debajo de
              su <Termino slug="ath">máximo histórico</Termino> de 20,44 dólares, del 16 de enero de 2022.
            </p>
          </div>
        </div>
      </section>

      {/* ── 2 ── */}
      <section id="cuentas" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que se nota al usarla</div>
          <h2 className="gbc-title">Cuentas con nombre: «lucia.near» en vez de una cadena de 64 caracteres</h2>
          <div className="gbc-body">
            <p>
              En Bitcoin o en Ethereum, tu cuenta es una dirección: una ristra de letras y números que nadie
              recuerda. En NEAR Protocol puede ser un nombre. Hay tres formas de cuenta, y las tres reciben NEAR
              igual:
            </p>
          </div>

          <div className="near-cuentas">
            {CUENTAS.map((c) => (
              <div key={c.tipo} className={`near-cuenta${c.nombre ? " es-nombre" : ""}`}>
                <span className="near-cuenta-tipo">{c.tipo}</span>
                <code>{c.ejemplo}</code>
                <p>{c.texto}</p>
              </div>
            ))}
          </div>
          <p className="gbc-fuente">Formatos y longitudes: especificación del protocolo NEAR (Nomicon), apartado de cuentas. Las direcciones de ejemplo son inventadas y están recortadas.</p>

          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Los nombres funcionan como dominios. La cuenta «near» crea «lucia.near», y solo «lucia.near» puede
              crear «tienda.lucia.near». Así una empresa puede tener cuentas hijas ordenadas bajo su nombre, y
              tú puedes saber de un vistazo de quién es cada una.
            </p>
            <h3 className="gbc-sub">Una cuenta, varias llaves</h3>
            <p>
              La otra diferencia está dentro. En casi todas las redes, una cuenta es una
              <Termino slug="clave-privada"> clave privada</Termino>: quien la tiene, lo puede todo. En NEAR una
              cuenta puede tener varias claves, y cada una con sus permisos.
            </p>
            <ul>
              <li><strong>Clave de acceso total.</strong> Mueve fondos, añade o borra claves. Es la que protege tu <Termino slug="seed-phrase">frase semilla</Termino>.</li>
              <li><strong>Clave de llamada a funciones.</strong> Solo puede usar un contrato concreto, no puede enviar NEAR y tiene un tope para gastar en comisiones. Es la que deja una aplicación en tu navegador para no pedirte firma a cada clic.</li>
            </ul>
            <p>
              Esa segunda llave es la razón de que muchas aplicaciones de NEAR no te pidan confirmar cada
              movimiento. Es cómodo, y su daño está acotado: si alguien la roba, puede usar esa aplicación en tu
              nombre, pero no vaciarte la cuenta.
            </p>
          </div>

          <div className="gbc-box gbc-box--red">
            <div className="gbc-box-title">El error típico con los nombres</div>
            <div className="gbc-box-body">
              <p>Un nombre legible también se puede imitar. «lucia.near» y «luc1a.near» son cuentas distintas, y la
              segunda puede ser de un estafador. Es la versión con nombres del
              <Termino slug="envenenamiento-de-direcciones"> envenenamiento de direcciones</Termino>. Copia el
              nombre de un sitio de confianza, compruébalo letra a letra y, si es la primera vez, envía antes una
              cantidad pequeña.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 ── */}
      <section id="por-dentro" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Cómo funciona</div>
          <h2 className="gbc-title">Cómo funciona NEAR Protocol: Nightshade y el sharding</h2>
          <div className="gbc-body">
            <p>
              Una blockchain normal es una sola fila: todos los validadores procesan todas las operaciones. NEAR
              usa <Termino slug="sharding">sharding</Termino>: parte la red en fragmentos que trabajan a la vez,
              cada uno con un grupo de cuentas. Su diseño se llama <strong>Nightshade</strong>.
            </p>
            <p>
              Lo particular de Nightshade es que los fragmentos no son redes separadas. Cada bloque recoge un trozo
              de cada fragmento, así que sigue habiendo una sola cadena y una sola historia. Para ti es invisible:
              no eliges fragmento ni ves en cuál está tu cuenta.
            </p>
            <p>
              Desde la mejora de 2024, conocida como Nightshade 2.0, los validadores ya no tienen que guardar
              todos los saldos y contratos de un fragmento para comprobar su trabajo. Reciben, junto con el trozo
              que revisan, solo los datos que ese trozo toca. Eso abarata el equipo necesario y permite añadir
              fragmentos sin que cada <Termino slug="nodo">nodo</Termino> cargue con más.
            </p>
          </div>

          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Dato</th><th>NEAR Protocol, noviembre de 2026</th></tr></thead>
              <tbody>
                <tr><td><strong>Fragmentos en marcha</strong></td><td>10, que se reparten las cuentas por orden alfabético</td></tr>
                <tr><td><strong>Un bloque nuevo</strong></td><td>Cada 0,57 segundos de media (anunciado como 600 milisegundos desde mayo de 2025)</td></tr>
                <tr><td><strong><Termino slug="confirmacion">Confirmación</Termino> definitiva</strong></td><td>En torno a 1,2 segundos</td></tr>
                <tr><td><strong>Enviar NEAR a otra cuenta</strong></td><td>0,000045 NEAR de comisión: poco más de una centésima de céntimo</td></tr>
                <tr><td><strong>Validadores activos</strong></td><td>345</td></tr>
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Fragmentos, validadores y tiempo de bloque: configuración de la red principal y bloques leídos el 14 de
            noviembre de 2026 (media de 37.877 bloques). Comisión: documentación oficial de NEAR, al precio mínimo
            del gas. Confirmación: anuncio de NEAR de mayo de 2025.
          </p>

          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Es la misma meta que persiguen las otras grandes redes por caminos opuestos.
              <Link href="/guias/ethereum"> Ethereum</Link> deja su red principal lenta y manda el tráfico a
              <Termino slug="capa-2"> capas 2</Termino> construidas encima.
              <Link href="/guias/solana"> Solana</Link> lo hace todo en una sola fila con máquinas muy potentes.
              NEAR reparte el trabajo dentro de la propia red, y eso le permite crecer añadiendo fragmentos.
            </p>
          </div>
        </div>
      </section>

      {/* ── Anuncio de media guía ── */}
      <GuiaAnuncio producto="portfolio" variante="compacto" estado={d.estado} />

      {/* ── 4 ── */}
      <section id="almacenamiento" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que casi nadie explica</div>
          <h2 className="gbc-title">El almacenamiento en NEAR Protocol: por qué parte de tu saldo queda bloqueado</h2>
          <div className="gbc-body">
            <p>
              Guardar datos en NEAR Protocol no se paga: se respalda. Por cada 100.000 bytes que ocupe tu cuenta, 1 NEAR de
              tu saldo queda inmovilizado. Es lo que la red llama <em>storage staking</em>. El NEAR
              sigue siendo tuyo, pero no lo puedes mover mientras los datos existan. Si los borras, se libera.
            </p>
            <p>
              El motivo es económico. Cada dato que se guarda lo tienen que conservar los validadores mientras exista.
              Si se pagara una sola vez, nadie tendría motivo para borrar nada. Con este sistema, ocupar sitio
              tiene un coste continuo, el de no poder usar ese NEAR, y liberar sitio tiene premio.
            </p>
            <p>Lo vas a notar en tres situaciones:</p>
            <ul>
              <li><strong>Al recibir un token por primera vez.</strong> El contrato de ese token tiene que apuntar tu saldo, y te pide un depósito por el sitio que ocupa. En wNEAR y en la <Termino slug="stablecoin">stablecoin</Termino> USDT son 0,00125 NEAR: 125 bytes.</li>
              <li><strong>Al intentar vaciar tu cuenta.</strong> Si ocupa más de lo que la red regala, no puedes enviar todo tu saldo: una parte respalda tus propios datos. Las cuentas que ocupan menos de 770 bytes pueden quedarse a cero.</li>
              <li><strong>Si despliegas un contrato.</strong> El código cuenta como datos. Un contrato de 200 kB inmoviliza 2 NEAR.</li>
            </ul>
            <p>Pon tus números:</p>
          </div>

          <GuideNearAlmacenamiento />

          <div className="gbc-body" style={{ marginTop: 26 }}>
            <p>
              A gran escala la cifra deja de ser pequeña. El contrato de wNEAR, la versión de NEAR que usan las
              aplicaciones de <Termino slug="defi">finanzas descentralizadas</Termino>, ocupaba 169 millones de
              bytes el 14 de noviembre de 2026. Eso son 1.690 NEAR bloqueados, unos 5.100 euros, solo por guardar
              los saldos de sus usuarios.
            </p>
          </div>
          <p className="gbc-fuente">
            Regla de 1 NEAR por 100.000 bytes y depósitos de wNEAR (wrap.near) y USDT (usdt.tether-token.near):
            leídos en la red principal el 14 de noviembre de 2026. Límite de 770 bytes: documentación oficial de
            NEAR sobre almacenamiento.
          </p>
        </div>
      </section>

      {/* ── 5 ── */}
      <section id="comisiones" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Un cambio de octubre de 2026</div>
          <h2 className="gbc-title">Adónde van las comisiones: el fin del 30 % para los desarrolladores</h2>
          <div className="gbc-body">
            <p>
              Durante seis años, NEAR Protocol tuvo una regla que no tenía casi ninguna otra red: el 30 % de la
              comisión que pagabas al usar un contrato iba a la cuenta de ese contrato. El resto se quemaba. Era
              una forma de pagar a quien construía aplicaciones sin que tuviera que cobrarte aparte.
            </p>
            <p>
              Ya no es así. El 3 de julio de 2026, la cámara de gobierno de NEAR Protocol, la House of Stake,
              ratificó la propuesta HSP-027, aprobada por 46 votos a 2. La versión 2.14 del software de la red,
              publicada el 26 de octubre de 2026, lleva ese reparto a cero. El 14 de noviembre de 2026 la red
              principal ya funcionaba con esa regla: <strong>toda la comisión se quema</strong>.
            </p>
            <p>
              Conviene saberlo porque la mayoría de las guías en español todavía cuenta el 30 % como vigente. Y
              porque cambia lo que significa la actividad de la red: cada operación ahora retira NEAR de la
              circulación en lugar de repartirlo.
            </p>
          </div>
          <div className="gbc-box gbc-box--gold">
            <div className="gbc-box-title">Que se queme no significa que haya menos NEAR</div>
            <div className="gbc-box-body">
              <p>Con comisiones de una centésima de céntimo, lo que se quema es poco frente a lo que se crea. La
              prueba está en la cuenta: la red arrancó en 2020 con 1.000 millones de NEAR y en noviembre de 2026
              tenía 1.311,7 millones. La <Termino slug="quema-de-tokens">quema</Termino> frena la
              <Termino slug="inflacion"> inflación</Termino>, no la anula.</p>
            </div>
          </div>
          <p className="gbc-fuente">
            Propuesta y ratificación: foro de gobernanza de NEAR, HSP-027 (3 de julio de 2026). Recuento de votos:
            Forklog y The Defiant (julio de 2026). Versión 2.14.0: notas de publicación de nearcore, 26 de octubre
            de 2026. Estado de la red: parámetro de recompensa por gas quemado, a cero en
            la versión de protocolo 88, leído el 14 de noviembre de 2026.
          </p>
        </div>
      </section>

      {/* ── 6 ── */}
      <section id="staking" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que rinde de verdad</div>
          <h2 className="gbc-title">Cuánto rinde el staking en NEAR Protocol, descontando la inflación</h2>
          <div className="gbc-body">
            <p>
              NEAR Protocol se valida con <Termino slug="prueba-de-participacion">prueba de participación</Termino>. Los
              validadores bloquean NEAR como garantía y cobran por producir bloques. Tú puedes hacer
              <Termino slug="staking"> staking</Termino> sin montar nada: eliges un validador y le haces una
              <Termino slug="delegacion"> delegación</Termino> de tus NEAR. Él se queda una comisión, que fija
              cada uno, y te reparte el resto.
            </p>
            <p>
              Lo que se reparte sale de monedas nuevas. Desde el 30 de octubre de 2025, la red crea como máximo
              un 2,5 % de NEAR al año; antes era un 5 %. De cada emisión, el 90 % va a los validadores y a
              quienes delegan en ellos, y el 10 % a la cuenta del tesoro del protocolo.
            </p>
            <p>
              El 14 de noviembre de 2026 había 589 millones de NEAR en staking, el 44,9 % del total. El 90 % de
              ese 2,5 % repartido entre menos de la mitad de las monedas da un 5 % bruto anual. Con un validador
              que cobre el 10 %, te queda un 4,5 %. Falta restar lo que no sale en el folleto: en ese mismo año,
              la cantidad total de NEAR ha crecido otro 2,5 %.
            </p>
            <p>Así quedan 1.000 NEAR al cabo de un año, en tres casos:</p>
          </div>

          <div className="near-caminos">
            <div className="near-camino es-mal">
              <span className="near-camino-nombre">Sin hacer nada</span>
              <strong>1.000 NEAR</strong>
              <span className="near-camino-peso">−2,4 % de peso en la red</span>
              <p>Tienes las mismas monedas, pero hay un 2,5 % más de NEAR en circulación. Tu parte se encoge.</p>
            </div>
            <div className="near-camino es-bien">
              <span className="near-camino-nombre">Staking, validador al 10 %</span>
              <strong>≈ 1.045 NEAR</strong>
              <span className="near-camino-peso">+2,0 % de peso en la red</span>
              <p>Ganas más deprisa de lo que crece la oferta. Ese 2 % es lo que ganas de verdad, en NEAR.</p>
            </div>
            <div className="near-camino">
              <span className="near-camino-nombre">El validador falla medio año</span>
              <strong>≈ 1.022 NEAR</strong>
              <span className="near-camino-peso">−0,2 % de peso en la red</span>
              <p>Un validador que deja de producir bloques deja de cobrar, y tú con él. Acabas casi como empezaste.</p>
            </div>
          </div>
          <p className="gbc-fuente">
            Cálculo propio con la inflación máxima (2,5 %), la parte en staking (44,9 %) y el reparto 90/10 entre
            staking y tesoro, leídos en la red el 14 de noviembre de 2026. El reparto se comprobó en lo que
            ingresa la cuenta treasury.near al cerrar cada época. Es una aproximación: el rendimiento baja si entra más NEAR
            en staking, y sube si sale. La rebaja del 5 % al 2,5 %: versión 2.9.0 de nearcore, octubre de 2025.
          </p>

          <div className="gbc-box gbc-box--gold">
            <div className="gbc-box-title">Lo que viene: un tope del 1,6 %</div>
            <div className="gbc-box-body">
              <p>A principios de noviembre de 2026, la House of Stake aprobó la propuesta HSP-029, que baja la
              emisión máxima del 2,5 % al 1,6 % de forma gradual, a lo largo de 24 meses. Aún no está en marcha:
              falta la revisión de su consejo de seguridad, un periodo de gracia de unos 90 días y que los
              validadores instalen la nueva versión. Cuando llegue, el rendimiento bruto bajará hacia el 3,4 %,
              según los cálculos de la propia propuesta, y también la dilución de quien no hace staking.</p>
            </div>
          </div>
          <p className="gbc-fuente">HSP-029: The Block y Crypto Briefing, 3 de noviembre de 2026.</p>

          {/* EXPERIENCIA DEL ADMIN: si el admin hace o ha hecho staking de NEAR, aquí encaja su caso real:
              qué validador o cartera usó, cuánto cobró en un periodo concreto frente a esta estimación, y
              cuánto tardó de verdad en recuperar los NEAR al retirarlos. Con fechas y cifras propias. */}

          <div className="gbc-body" style={{ marginTop: 24 }}>
            <h3 className="gbc-sub">Lo que cuesta salir</h3>
            <p>
              A diferencia de <Link href="/guias/cardano">Cardano</Link>, donde tus monedas no se mueven nunca de
              tu cartera, en NEAR quedan bloqueadas mientras las tienes en staking. Al retirarlas esperas cuatro
              <Termino slug="epoca"> épocas</Termino>. Cada época son 43.200 bloques, unas 6,8 horas al ritmo
              actual. Como la cuenta empieza al cerrar la época en curso, la espera va de unas 27 a unas 34 horas.
              Durante ese tiempo no cobras ni puedes vender.
            </p>
          </div>

          <div className="gbc-box gbc-box--red">
            <div className="gbc-box-title">El staking no protege del precio</div>
            <div className="gbc-box-body">
              <p>Todo lo anterior se mide en NEAR. Ganar un 2 % de peso en la red no compensa una caída del 84 %
              como la que acumula su precio desde enero de 2022. El staking reparte la tarta; no decide cuánto vale.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7 ── */}
      <section id="futuro" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Hacia dónde va</div>
          <h2 className="gbc-title">NEAR Protocol hoy: abstracción de cadenas e inteligencia artificial</h2>
          <div className="gbc-body">
            <p>
              NEAR Protocol ya no se presenta solo como una red rápida. Su apuesta de los últimos dos años tiene
              dos patas, y las dos salen de la misma idea que las cuentas con nombre: esconder la complejidad.
            </p>
            <h3 className="gbc-sub">Una cuenta para todas las redes</h3>
            <p>
              La <Termino slug="abstraccion-de-cadenas">abstracción de cadenas</Termino> busca que no tengas que
              saber en qué red está cada cosa. Su pieza central son las <strong>firmas en cadena</strong>, en
              marcha desde el 8 de agosto de 2024. Un grupo de nodos firma operaciones en nombre de tu cuenta de
              NEAR mediante <Termino slug="computacion-multiparte">computación multiparte</Termino>: cada uno
              aporta un trozo de la firma y ninguno tiene la clave entera. Así, desde «lucia.near» puedes
              controlar una dirección de Bitcoin o de Ethereum.
            </p>
            <p>
              Encima funcionan los <strong>NEAR Intents</strong>. Dices qué quieres, por ejemplo cambiar bitcoin
              por USDC en otra red, y unos intermediarios compiten por hacerlo. No eliges
              <Termino slug="bridge"> puente</Termino> ni red. En junio de 2026 el sistema anunció haber superado
              los 20.000 millones de dólares de volumen acumulado, según la propia red.
            </p>
            <h3 className="gbc-sub">El giro hacia la IA</h3>
            <p>
              El proyecto habla de «IA propiedad del usuario». En diciembre de 2025 lanzó NEAR AI Cloud y un chat
              privado. Ejecutan modelos abiertos en chips capaces de cifrar los datos incluso mientras los
              procesan, para que ni quien opera la máquina vea lo que le preguntas.
            </p>
            <p>
              Una advertencia sobre todo esto. Que NEAR AI tenga clientes no significa que el token NEAR gane valor
              con ello: el vínculo entre el producto y la moneda depende de cuánto uso acabe pasando por la red.
              Las cifras de este apartado las publica el propio proyecto y no las ha auditado nadie de fuera.
            </p>
          </div>
          <p className="gbc-fuente">
            Firmas en cadena: blog de NEAR, 8 de agosto de 2024. Volumen de Intents: anuncio de la red recogido por
            KuCoin News, 3 de junio de 2026. NEAR AI Cloud: anuncio de NEAR AI, diciembre de 2025.
          </p>
        </div>
      </section>

      {/* ── 8 ── */}
      <section id="hacienda" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Desde España</div>
          <h2 className="gbc-title">NEAR Protocol y Hacienda: qué declarar si vives en España</h2>
          <div className="gbc-body">
            <p>
              Mientras tus NEAR solo estén en tu cuenta, no hay nada que declarar por ellos. Las tres situaciones
              propias de NEAR Protocol se tratan así:
            </p>
            <ul>
              <li><strong>Las recompensas del staking</strong> son renta el día que llegan, por su valor en euros de ese día: rendimiento del capital mobiliario, según la consulta V1766-22 de la Dirección General de Tributos. En NEAR llegan con cada época, tres o cuatro veces al día, así que a fin de año son más de mil apuntes: exporta el historial de tu cartera o de tu validador.</li>
              <li><strong>Un cambio con NEAR Intents tributa como una venta.</strong> Dar NEAR a cambio de bitcoin o de USDC en otra red es una permuta, aunque no haya euros por medio y aunque nunca elijas puente ni red.</li>
              <li><strong>Lo bloqueado por almacenamiento no es una venta.</strong> El NEAR no sale de tu cuenta ni lo cambias por nada; solo deja de poder moverse.</li>
            </ul>
            <p>
              El método de cálculo, los tramos y la forma de presentarlo están en la guía de
              <Link href="/guias/fiscalidad-cripto-espana"> fiscalidad de las criptomonedas en España</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* ── 9 ── */}
      <section id="riesgos" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que puede salir mal</div>
          <h2 className="gbc-title">Los riesgos de NEAR Protocol</h2>
          <div className="gbc-body">
            <ul>
              <li><strong>La emisión sin techo.</strong> El protocolo no fija un número final de NEAR: cada época crea monedas nuevas, y con las comisiones actuales la quema retira una fracción mínima de lo que entra.</li>
              <li><strong>Las reglas cambian.</strong> En un año se han rebajado la inflación y se ha suprimido el reparto a los desarrolladores, y ya hay aprobada otra rebaja de la emisión. La rebaja de 2025 salió adelante aunque la primera votación de la comunidad no alcanzó el umbral, y hubo validadores que lo criticaron.</li>
              <li><strong>La competencia.</strong> Ethereum, Solana y decenas de redes buscan a los mismos usuarios y desarrolladores, y casi todas prometen lo mismo: rápida y barata.</li>
              <li><strong>Las piezas nuevas.</strong> Firmas en cadena, Intents y NEAR AI son recientes. Un fallo en el grupo de nodos que firma por ti afectaría a fondos en otras redes.</li>
              <li><strong>Los nombres se imitan.</strong> Una cuenta legible facilita el engaño de los nombres parecidos y el <Termino slug="phishing">phishing</Termino>.</li>
              <li><strong>El precio.</strong> NEAR es una <Termino slug="altcoin">altcoin</Termino> con mucha <Termino slug="volatilidad">volatilidad</Termino>: en noviembre de 2026 seguía cerca de un 84 % por debajo de los 20,44 dólares de enero de 2022.</li>
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
          <h2 className="gbc-title">Comprueba lo que sabes de NEAR Protocol</h2>
          <div className="gbc-body" style={{ marginBottom: 32 }}>
            <p>Cinco preguntas. Con las cinco acertadas desbloqueas el logro <strong style={{ color: "var(--gold)" }}>Nombre Propio</strong>.</p>
          </div>
          {d.isRegistered ? <GuideNearQuiz /> : <GuideQuizCuenta slug={SLUG} />}
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
