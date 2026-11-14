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
import GuideHederaComisiones from "./GuideHederaComisiones";
import GuideHederaQuiz from "./GuideHederaQuiz";
import "./hedera.css";

/**
 * Guía «Qué es Hedera» (14-11-2026). Consulta objetivo: «qué es hedera».
 *
 * Lo que tiene y las guías en español no: el hashgraph explicado con un
 * ejemplo de cuatro nodos y una marca de tiempo calculada; quién gobierna
 * hoy, nodo a nodo (incluido el de Repsol en La Rioja); una calculadora de
 * comisiones en dólares, con la subida por ocho del mensaje de HCS; la
 * actividad real medida en el nodo espejo frente a la capacidad anunciada; el
 * reparto real del staking (2,5 % máximo repartido entre más de 6.500 M); la
 * liberación de la tesorería con el salto previsto para el cuarto trimestre de
 * 2026; y lo que pide Hacienda.
 *
 * Datos leídos el 14-11-2026 en el nodo espejo público
 * (mainnet-public.mirrornode.hedera.com): 30 nodos (26 pagan la tasa entera
 * de 4.990 tinybars por HBAR y día, ≈1,82 % anual; Chainlink Labs, 2.434);
 * 13.458 M HBAR en staking; límite de stake premiado de 6.500 M y 450 M por
 * nodo; oferta liberada 44.327 M; 450 M USDC emitidos (token 0.0.456858).
 * Actividad: recuento completo del 13-11-2026 en ese nodo espejo (ver la
 * sección «usos»). Tesorería: hederacouncil.org/treasury, datos del
 * 6-11-2026 (columnas por trimestre; Q4 2026 es previsión). Precio, puesto y
 * capitalización: CoinGecko, 14-11-2026. Tarifas: docs.hedera.com «Fees»;
 * subida de HCS: blog de Hedera de julio de 2025 (v0.69, enero de 2026).
 * Staking: HIP-406. Al revisar la guía se vuelve a leer todo eso.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/guias/hedera" },
  title: "Qué es Hedera (HBAR) y cómo funciona hashgraph",
  description:
    "Qué es Hedera (HBAR): por qué no es una blockchain, quién la gobierna, cuánto cuesta cada operación con calculadora, el staking sin bloqueo y qué pide Hacienda.",
  openGraph: {
    title: "Qué es Hedera (HBAR): hashgraph, el consejo de empresas y lo que cuesta usarla",
    description:
      "El hashgraph con un ejemplo, los 30 nodos que deciden, comisiones fijas en dólares, la tesorería que aún se libera, el staking sin bloqueo y Hacienda. Con quiz.",
    type: "article",
  },
};

const SLUG = "hedera";

const SECCIONES = [
  { id: "que-es", label: "Qué es" },
  { id: "hashgraph", label: "Hashgraph" },
  { id: "consejo", label: "El consejo" },
  { id: "comisiones", label: "Comisiones" },
  { id: "usos", label: "Para qué se usa" },
  { id: "hbar", label: "La moneda HBAR" },
  { id: "staking", label: "Staking" },
  { id: "espana", label: "Desde España" },
  { id: "riesgos", label: "Riesgos" },
  { id: "quiz", label: "Quiz" },
];

const PASOS: { n: string; titulo: string; texto: string }[] = [
  { n: "1", titulo: "Ana recibe tu pago", texto: "Lo apunta en un «evento»: un registro con tu operación, la hora y una referencia a su evento anterior." },
  { n: "2", titulo: "Ana llama a Bea al azar", texto: "Le cuenta todo lo que sabe. Bea crea su propio evento, que apunta a dos padres: su último evento y el de Ana." },
  { n: "3", titulo: "Bea llama a Carla, Carla a Dani…", texto: "Cada llamada lleva lo que se sabe y el historial de quién se lo contó a quién. Es el «cotilleo sobre el cotilleo»." },
  { n: "4", titulo: "Todos tienen el mismo grafo", texto: "En pocas rondas, los cuatro guardan el mismo mapa de conversaciones. Con él, cada uno deduce cómo votarían los demás sin preguntarles." },
];

const NODOS = [
  "Google", "IBM", "Dell", "Deutsche Telekom", "LG", "Nomura", "FedEx", "Accenture", "Standard Bank",
  "Shinhan Bank", "Ubisoft", "McLaren Racing", "Chainlink Labs", "EDF", "Repsol",
];

const TARIFAS: { op: string; usd: string; ejemplo: string }[] = [
  { op: "Enviar HBAR", usd: "0,0001 $", ejemplo: "1.000 envíos: 0,10 $" },
  { op: "Enviar un token creado en Hedera", usd: "0,001 $", ejemplo: "1.000 envíos: 1 $" },
  { op: "Mensaje al servicio de consenso (HCS)", usd: "0,0008 $", ejemplo: "1 millón de mensajes: 800 $" },
  { op: "Asociar un token a tu cuenta", usd: "0,05 $", ejemplo: "Una vez por token" },
  { op: "Crear una cuenta", usd: "0,05 $", ejemplo: "Una vez" },
  { op: "Crear un token nuevo", usd: "1 $", ejemplo: "Una vez" },
];

const REPARTO: { cat: string; pct: string; para: string }[] = [
  { cat: "Ecosistema y desarrollo abierto", pct: "50,61 %", para: "Ayudas y programas para quien construye en la red" },
  { cat: "Acuerdos de compra", pct: "25,40 %", para: "HBAR vendidos a inversores en las rondas privadas y públicas" },
  { cat: "Gobierno y operación de la red", pct: "16,23 %", para: "Fundadores, empleados, colaboradores y el propio consejo" },
  { cat: "Desarrollo inicial y licencias", pct: "7,77 %", para: "El pago por la tecnología original" },
];

export default async function HederaPage() {
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
          Qué es Hedera (HBAR)<br />
          <span className="gbc-hero-gold">y por qué no es una blockchain</span>
        </h1>
        <p className="gbc-respuesta">
          <strong>Hedera es una red pública para pagos, tokens y registros, gobernada por un consejo de grandes
          empresas.</strong> No encadena bloques: ordena las operaciones con un algoritmo llamado hashgraph, en pocos
          segundos y con comisiones fijas en dólares. Su moneda, HBAR, paga esas comisiones y se puede poner en
          staking sin bloquearla. La red es rápida y barata; a cambio, solo una treintena de organizaciones
          deciden y validan.
        </p>
        <p className="gbc-revisado">Revisada el <strong>14 de noviembre de 2026</strong> · Datos: nodo espejo de Hedera y CoinGecko, misma fecha</p>
        <div className="gbc-hero-pills">
          <span className="gbc-pill">El hashgraph, con un ejemplo</span>
          <span className="gbc-pill">Calculadora de comisiones</span>
          <span className="gbc-pill">Quiz con logro</span>
        </div>
      </header>

      {/* ── 1 ── */}
      <section id="que-es" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo básico</div>
          <h2 className="gbc-title">Qué es Hedera y quién está detrás</h2>
          <div className="gbc-body">
            <p>
              Hedera es una <Termino slug="capa-1">red de capa 1</Termino>: tiene sus propias reglas, sus propios
              nodos y su propia moneda, el HBAR. Sirve para lo mismo que otras redes públicas: enviar dinero, crear
              tokens y ejecutar <Termino slug="smart-contract">contratos inteligentes</Termino>. Lo que cambia es
              cómo se pone de acuerdo y quién la dirige.
            </p>
            <p>
              Conviene separar tres nombres que se usan como si fueran uno. <strong>Hashgraph</strong> es el
              algoritmo que ordena las operaciones. <strong>Hedera</strong> es la red que lo usa.
              <strong> HBAR</strong> es la moneda de esa red. Cuando alguien dice «Hedera Hashgraph», mezcla los
              dos primeros.
            </p>
            <p>
              El algoritmo lo inventó Leemon Baird, que fundó la empresa Swirlds en 2015 con Mance Harmon. La red
              abrió al público en 2019. Hoy la gobierna el Consejo de Hedera, una sociedad formada por empresas como
              Google, IBM, Dell o la española Repsol. A 14 de noviembre de 2026, HBAR ocupa el <strong>puesto
              36</strong> por <Termino slug="market-cap">capitalización</Termino> en CoinGecko, con unos 2.580
              millones de dólares.
            </p>
          </div>
        </div>
      </section>

      {/* ── 2 ── */}
      <section id="hashgraph" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Cómo funciona</div>
          <h2 className="gbc-title">¿Hedera es una blockchain? Cómo funciona hashgraph</h2>
          <div className="gbc-body">
            <p>
              No, Hedera no es una <Termino slug="blockchain">blockchain</Termino>. En una blockchain, un nodo
              elegido mete operaciones en un bloque y lo engancha al anterior: una sola fila. En Hedera, cada nodo
              va anotando lo que oye en registros pequeños, llamados eventos. Cada evento apunta a dos eventos
              anteriores, así que el resultado no es una fila, sino una red de flechas que siempre miran al pasado.
              Eso se llama <Termino slug="grafo-aciclico-dirigido">grafo acíclico dirigido</Termino>.
            </p>
            <p>
              El <Termino slug="mecanismo-de-consenso">mecanismo de consenso</Termino> se entiende mejor con un
              ejemplo. Imagina que la red tiene cuatro <Termino slug="nodo">nodos</Termino>: Ana, Bea, Carla y Dani.
              Tú le mandas un pago a Ana.
            </p>
          </div>

          <ol className="hbar-pasos">
            {PASOS.map((p) => (
              <li key={p.n}>
                <span className="hbar-paso-n" aria-hidden="true">{p.n}</span>
                <strong>{p.titulo}</strong>
                <p>{p.texto}</p>
              </li>
            ))}
          </ol>

          <div className="gbc-body" style={{ marginTop: 26 }}>
            <p>
              Ese último paso es la clave, y se llama <strong>votación virtual</strong>. En otras redes, los nodos se
              mandan votos para ponerse de acuerdo. En Hedera no hace falta: si todos tienen el mismo historial de
              conversaciones, cada uno puede calcular qué votaría el resto. Se ahorran millones de mensajes.
            </p>
            <p>
              Falta decidir el orden. Cada operación recibe una marca de tiempo: la mediana de los momentos en que
              cada nodo se enteró de ella. Si Ana la oyó a las 10:00:00,20, Bea a las 0,25, Carla a las 0,31 y Dani
              a las 0,90, la marca queda en 0,28. Dani, lento o tramposo, no puede arrastrarla. Ningún nodo decide
              el orden por su cuenta, y eso limita el <Termino slug="mev">MEV</Termino>, el beneficio que saca en
              otras redes quien ordena las operaciones.
            </p>
            <p>
              El sistema es <Termino slug="tolerancia-a-fallos-bizantinos">tolerante a fallos bizantinos</Termino>:
              según la documentación de Hedera, aguanta mientras los nodos honrados sumen más de dos tercios del HBAR
              en staking, porque cada nodo pesa según lo que tiene vinculado. Hedera lo presenta además como
              asíncrono (aBFT): no necesita suponer que los mensajes llegan a tiempo. La <Termino slug="finalidad">finalidad</Termino> llega en segundos y es definitiva: lo confirmado no se
              reescribe.
            </p>
          </div>
          <div className="gbc-box gbc-box--gold">
            <div className="gbc-box-title">¿Y los «bloques» que enseña el explorador?</div>
            <div className="gbc-box-body">
              <p>
                Si abres HashScan, el <Termino slug="explorador-de-bloques">explorador de bloques</Termino> de
                Hedera, verás números de bloque. Son un envoltorio: la red agrupa lo ya ordenado cada pocos segundos
                para que las herramientas de Ethereum lo entiendan. El 14 de noviembre de 2026 iba por el bloque
                102.328.400. El consenso no depende de ellos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 ── */}
      <section id="consejo" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">El gobierno</div>
          <h2 className="gbc-title">Quién gobierna Hedera: un consejo de hasta 39 empresas</h2>
          <div className="gbc-body">
            <p>
              El Consejo de Hedera tiene un máximo de 39 miembros. Cada uno tiene un voto igual y mantiene un nodo
              de la red. Según Hedera, cada miembro puede estar como mucho dos mandatos seguidos de tres años.
            </p>
            <p>
              El consejo concentra la <Termino slug="gobernanza">gobernanza</Termino>. Decide lo que en otras redes se
              discute en foros abiertos: las actualizaciones del
              software, las tarifas, la tasa de recompensa del staking y el uso de la tesorería. Para cambiar el
              número total de HBAR hace falta la unanimidad de todos sus miembros.
            </p>
            <p>
              A 14 de noviembre de 2026, el nodo espejo público de Hedera, un servidor que guarda una copia de todo el
              historial y deja consultarlo gratis, lista <strong>30 nodos</strong>, todos de miembros del consejo.
              Entre ellos:
            </p>
          </div>
          <ul className="hbar-nodos" aria-label="Algunas organizaciones con nodo en Hedera">
            {NODOS.map((n) => <li key={n}>{n}</li>)}
          </ul>
          <p className="gbc-fuente">
            Fuente: nodo espejo de Hedera (endpoint «network/nodes») y hederacouncil.org, consultados el 14 de
            noviembre de 2026. La web del consejo muestra 34 organizaciones, entre ellas Swirlds; 30 tienen hoy un
            nodo.
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Hay un nodo en España. Repsol entró en el consejo el 18 de diciembre de 2025 para trabajar en
              identidad digital de proveedores y empleados, y su nodo figura alojado en La Rioja. La lista también
              cambia hacia fuera: Boeing, por ejemplo, entró en su día y hoy no tiene nodo.
            </p>
            <p>
              ¿Es eso descentralización? A medias. A favor: los que <Termino slug="validador">validan</Termino> son organizaciones conocidas, de países
              y sectores distintos, que responden con su nombre. En contra: son 30, ninguno puede entrar sin
              invitación y el mismo grupo que valida fija los precios. Si te suena, es porque
              <Link href="/guias/canton"> Canton Network</Link> también se gobierna con grandes instituciones. La
              diferencia es que en Hedera cualquiera puede leer todas las operaciones; en Canton, no.
            </p>
          </div>
          <div className="gbc-box gbc-box--gold">
            <div className="gbc-box-title">Patentado, después abierto: qué es Hiero</div>
            <div className="gbc-box-body">
              <p>
                El hashgraph nació patentado por Swirlds, y durante años fue la crítica más repetida. El 19 de enero
                de 2022 el consejo anunció que había votado comprar esa propiedad intelectual y publicar el código con
                licencia Apache 2.0, que deja usarlo y modificarlo libremente. En septiembre de 2024 cedió todo el
                código de la red a LF Decentralized Trust, la rama de la Linux Foundation para estas redes, donde vive
                como el proyecto Hiero.
              </p>
              <p>
                Ojo con la conclusión: <Termino slug="codigo-abierto">código abierto</Termino> no es red abierta. Cualquiera puede leer, copiar y mejorar
                Hiero. Conectar un nodo a la red principal de Hedera sigue siendo cosa del consejo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Anuncio de media guía ── */}
      <GuiaAnuncio producto="cursos" variante="compacto" estado={d.estado} />

      {/* ── 4 ── */}
      <section id="comisiones" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que cuesta</div>
          <h2 className="gbc-title">Cuánto cuesta usar Hedera: comisiones fijas en dólares</h2>
          <div className="gbc-body">
            <p>
              En Ethereum o en Solana, la comisión sube cuando hay atasco: pagas el <Termino slug="gas">gas</Termino>
              {" "}que marque el mercado en ese minuto. En Hedera cada operación tiene un precio fijado en dólares,
              publicado en la documentación oficial. Lo pagas en HBAR, al cambio del momento.
            </p>
            <p>
              La consecuencia es útil para una empresa: sabe lo que le costará un millón de operaciones antes de
              hacerlas. Si el HBAR sube, paga menos HBAR; si baja, más. En dólares, lo mismo.
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Operación</th><th>Tarifa base</th><th>Ejemplo</th></tr></thead>
              <tbody>
                {TARIFAS.map((t) => (
                  <tr key={t.op}><td><strong>{t.op}</strong></td><td>{t.usd}</td><td>{t.ejemplo}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Fuente: docs.hedera.com, «Fees», tabla de la red principal, consultada el 14 de noviembre de 2026. Son
            tarifas base: firmas adicionales y el gas de los contratos las suben.
          </p>

          <GuideHederaComisiones />

          <div className="gbc-body" style={{ marginTop: 26 }}>
            <p>
              Ahora el matiz que no cuentan las guías que venden Hedera por barata. «Fija» no significa «para
              siempre». En julio de 2025 la red anunció que el mensaje del servicio de consenso pasaba de 0,0001 a
              0,0008 dólares, ocho veces más, con la actualización de enero de 2026. Quien enviaba un millón de mensajes pasó de pagar 100 dólares a pagar 800.
            </p>
            <p>
              Sigue siendo barato. Pero te dice algo importante sobre Hedera: las tarifas son estables mientras el
              consejo quiera que lo sean.
            </p>
          </div>
        </div>
      </section>

      {/* ── 5 ── */}
      <section id="usos" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Para qué sirve</div>
          <h2 className="gbc-title">Para qué se usa Hedera: tokens, mensajes y contratos</h2>
          <div className="gbc-body">
            <p>Hedera ofrece tres servicios de base. Los dos primeros no necesitan programar un contrato.</p>
          </div>
          <div className="hbar-servicios">
            <div>
              <span className="hbar-servicio-sigla">HTS</span>
              <strong>Servicio de tokens</strong>
              <p>Crea monedas, <Termino slug="stablecoin">stablecoins</Termino> o <Termino slug="nft">NFT</Termino> con una sola operación de 1 dólar. Las reglas (quién puede emitir, congelar o cobrar comisiones) vienen de serie.</p>
            </div>
            <div>
              <span className="hbar-servicio-sigla">HCS</span>
              <strong>Servicio de consenso</strong>
              <p>Publica mensajes en un «tema» y la red les pone sello de tiempo y orden. Sirve para registros de auditoría: demostrar qué pasó y cuándo sin guardar los datos en la red.</p>
            </div>
            <div>
              <span className="hbar-servicio-sigla">EVM</span>
              <strong>Contratos inteligentes</strong>
              <p>Hedera ejecuta la <Termino slug="evm">máquina virtual de Ethereum</Termino>, así que los contratos de <Link href="/guias/ethereum">Ethereum</Link> funcionan con pocos cambios.</p>
            </div>
          </div>
          <div className="gbc-body" style={{ marginTop: 26 }}>
            <p>
              ¿Cuánto se usa de verdad? Las guías suelen repetir que Hedera admite «más de 10.000 operaciones por
              segundo». Es capacidad, no uso. Contamos un día entero en el nodo espejo público: el 13 de noviembre
              de 2026 registró <strong>667.819 operaciones</strong>, unas 7,7 por segundo. La cifra incluye las
              operaciones internas que lanzan algunos contratos.
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Tipo de operación</th><th>El 13-11-2026</th><th>Peso</th></tr></thead>
              <tbody>
                <tr><td><strong>Envíos de HBAR y tokens</strong></td><td>494.525</td><td>74,1 %</td></tr>
                <tr><td><strong>Llamadas a contratos (nativas y de tipo Ethereum)</strong></td><td>123.290</td><td>18,5 %</td></tr>
                <tr><td><strong>Mensajes al servicio de consenso</strong></td><td>44.291</td><td>6,6 %</td></tr>
                <tr><td><strong>Resto</strong></td><td>5.713</td><td>0,9 %</td></tr>
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Recuento propio del día completo (00:00 a 24:00, hora UTC) en mainnet-public.mirrornode.hedera.com,
            endpoint «transactions», hecho el 14 de noviembre de 2026. Coincide, salvo por tres operaciones, con la suma de los bloques de ese día.
            El ritmo no es uniforme: hay minutos con diez veces más operaciones que otros.
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Dos datos más, del mismo nodo espejo y del 14 de noviembre de 2026. Hay unos 450 millones de USDC
              emitidos de forma nativa en Hedera, la versión de la stablecoin de Circle para esta red. Y el uso
              empresarial suele ser discreto: Repsol, por ejemplo, entró para trabajar en identidades digitales
              verificables, que no mueven dinero ni salen en las listas de volumen.
            </p>
          </div>
        </div>
      </section>

      {/* ── 6 ── */}
      <section id="hbar" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">La moneda</div>
          <h2 className="gbc-title">HBAR: 50.000 millones creados de una vez, y aún saliendo de la tesorería</h2>
          <div className="gbc-body">
            <p>
              Todos los HBAR que habrá se crearon al lanzar la red: 50.000 millones. No hay minería ni emisión
              nueva. Lo que sí hay es una tesorería que los va soltando, y eso es lo que mueve la
              <Termino slug="oferta-circulante"> oferta circulante</Termino>.
            </p>
            <p>
              A 14 de noviembre de 2026, el nodo espejo marca <strong>44.327 millones de HBAR liberados</strong>, el
              88,7 % del total. El informe de la tesorería del consejo, del 6 de noviembre, reparte así los 50.000
              millones:
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Para qué</th><th>Del total</th><th>Qué incluye</th></tr></thead>
              <tbody>
                {REPARTO.map((r) => (
                  <tr key={r.cat}><td><strong>{r.cat}</strong></td><td>{r.pct}</td><td>{r.para}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Fuente: hederacouncil.org/treasury, informe del 6 de noviembre de 2026. Oferta liberada: nodo espejo de
            Hedera, endpoint «network/supply», 14 de noviembre de 2026.
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Mira ahora el calendario. La <Termino slug="liberacion-de-tokens">liberación</Termino> dio un salto a
              principios de 2025, del 76,51 % al 84,45 % en un trimestre. Después fue lenta: 85,56 % al cerrar 2025
              y 87,71 % al cerrar septiembre de 2026. Y para el final del cuarto trimestre el mismo informe prevé el
              <strong> 95,74 %</strong>, es decir, 47.871 millones.
            </p>
            <p>
              Haz la cuenta. Entre hoy y el 31 de diciembre faltarían por salir unos 3.540 millones de HBAR, un 8 %
              más de lo que ya circula. Que salgan de la tesorería no significa que se vendan en el mercado: pueden ir
              a ayudas o a cuentas que no venden. Pero es oferta nueva disponible, y conviene saberlo antes de
              comprar.
            </p>
            <p>
              Con el precio del 14 de noviembre, 0,0582 dólares (unos 0,053 euros), los 50.000 millones valdrían
              unos 2.910 millones de dólares: es el <Termino slug="fdv">FDV</Termino>. El HBAR llegó a 0,569 dólares el 15 de
              septiembre de 2021, su <Termino slug="ath">máximo histórico</Termino>. Hoy está un 90 % por debajo.
            </p>
          </div>
        </div>
      </section>

      {/* ── 7 ── */}
      <section id="staking" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Rendimiento</div>
          <h2 className="gbc-title">Staking de HBAR sin bloqueo: cuánto da y por qué baja</h2>
          <div className="gbc-body">
            <p>
              El <Termino slug="staking">staking</Termino> en Hedera es el más sencillo de las redes grandes. Eliges
              un nodo desde tu cartera y toda tu cuenta queda vinculada a él. Los HBAR no salen de tu cuenta: puedes
              venderlos o moverlos cuando quieras. No hay periodo de bloqueo ni
              <Termino slug="slashing"> slashing</Termino>, el castigo que otras redes aplican si el nodo falla.
            </p>
            <p>Tres reglas del programa, tal como las fija su propuesta técnica (HIP-406):</p>
            <ul>
              <li><strong>Cuentan los días completos.</strong> El periodo va de medianoche a medianoche, hora UTC. Si pones tu cuenta en staking a las diez de la mañana, ese día no cobra.</li>
              <li><strong>La recompensa no llega sola cada día.</strong> Se acumula y se paga cuando tu cuenta se mueve: al recibir o enviar HBAR, o al cambiar de nodo.</li>
              <li><strong>Caduca al año.</strong> Solo se pueden cobrar los últimos 365 días. Si no mueves la cuenta en más de un año, pierdes lo anterior.</li>
            </ul>
            <p>
              ¿Cuánto rinde? El consejo fija un máximo del 2,5 % anual, pero solo para los primeros 6.500 millones de
              HBAR que cobran recompensa. Si hay más, el mismo dinero se reparte entre más. El 14 de noviembre de 2026
              el nodo espejo marcaba una tasa de 4.990 tinybars por HBAR y día; un tinybar es la cien millonésima
              parte de un HBAR. Pasado a un año, un <strong>1,82 %</strong>. El nodo no se queda comisión.
            </p>
            <p>
              Ojo al elegir nodo. Cada uno tiene un tope de 450 millones de HBAR premiados. Si lo supera, la recompensa
              de ese nodo se reparte entre más y su tasa baja. Ese día, 26 de los 30 nodos pagaban la tasa entera. El
              de Chainlink Labs, el más cargado, pagaba 2.434 tinybars: un 0,89 % al año.
            </p>
            <p>
              Con números: 10.000 HBAR en staking todo un año, en un nodo sin tope superado, darían unos 182 HBAR. A
              0,0582 dólares, unos 10,6 dólares. Y si mañana más gente se suma al staking, esa cifra baja. Es una
              <Termino slug="delegacion"> delegación</Termino> cómoda, pero no un tipo de interés garantizado.
            </p>
          </div>
          <p className="gbc-fuente">
            Fuentes: HIP-406 y docs.hedera.com, «Staking», consultadas el 14 de noviembre de 2026; nodo espejo de
            Hedera, endpoints «network/stake» y «network/nodes», misma fecha (13.458 millones de HBAR vinculados a nodos).
          </p>
        </div>
      </section>

      {/* ── 8 ── */}
      <section id="espana" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Desde España</div>
          <h2 className="gbc-title">Hedera desde España: dónde guardar HBAR y qué pide Hacienda</h2>
          <div className="gbc-body">
            <p>
              Tienes dos opciones. Dejarlos en un <Termino slug="exchange">exchange</Termino>, que los custodia por
              ti, o guardarlos tú en una cuenta propia de Hedera: es la
              <Termino slug="autocustodia"> autocustodia</Termino>. Hay carteras de la red que se instalan en el
              navegador o el móvil, y carteras físicas compatibles, que son una
              <Termino slug="cold-wallet"> cold wallet</Termino>. Si usas un exchange, comprueba en la web de la CNMV
              que está autorizado bajo <Termino slug="mica">MiCA</Termino>.
            </p>
            <p>Hedera tiene tres costumbres propias que pillan a quien viene de otras redes:</p>
            <ul>
              <li><strong>Tu dirección es un número.</strong> Las cuentas tienen la forma 0.0.123456. Crear una cuesta 0,05 dólares, y alguien tiene que pagarlos: tu cartera o el exchange.</li>
              <li><strong>Para recibir un token, primero lo asocias.</strong> Si alguien te envía un token de Hedera que tu cuenta no ha asociado, la operación puede fallar. Asociarlo cuesta 0,05 dólares, una sola vez.</li>
              <li><strong>El <Termino slug="memo">memo</Termino> del exchange.</strong> Muchos exchanges reciben todos los HBAR en una sola cuenta y te distinguen por un número de referencia. Si lo olvidas al enviar, tus HBAR llegan, pero nadie sabe que son tuyos. Recuperarlos depende del soporte, y tarda.</li>
            </ul>
          </div>
          {/* EXPERIENCIA DEL ADMIN: si has tenido HBAR, cuenta aquí en 2-3 frases dónde los compraste y guardaste, si te pasó lo del memo o lo de asociar un token, y si los tienes o no en el Portfolio. Sin cifras de rentabilidad. */}
          <div className="gbc-body" style={{ marginTop: 26 }}>
            <p>
              Con Hacienda, HBAR es una criptomoneda más. Vender por euros, o cambiarlo por otra criptomoneda o por
              una stablecoin, genera una ganancia o pérdida patrimonial que va a la base del ahorro, aunque nunca
              hayas tocado euros. Tenerlos guardados, sin más, no tributa.
            </p>
            <p>
              El staking tiene un detalle propio de Hedera. La Dirección General de Tributos trata estas
              recompensas como rendimiento del capital mobiliario, valorado en euros cuando las recibes (consulta
              V1766-22). Como Hedera las paga de golpe al mover la cuenta, ese día puedes cobrar meses de recompensa
              en una sola entrada. Apunta la fecha y el precio.
            </p>
            <p>
              Desde 2026 los exchanges de la UE informan a Hacienda de tus operaciones por la directiva DAC8. Si
              tienes más de 50.000 euros en criptomonedas custodiadas fuera de España a 31 de diciembre, toca el
              modelo 721. El método completo está en la guía de
              <Link href="/guias/fiscalidad-cripto-espana"> fiscalidad de las criptomonedas en España</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* ── 9 ── */}
      <section id="riesgos" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que puede salir mal</div>
          <h2 className="gbc-title">Los riesgos de Hedera y de HBAR</h2>
          <div className="gbc-body">
            <ul>
              <li><strong>Pocos deciden mucho.</strong> Treinta organizaciones validan, fijan tarifas y reparten la tesorería. Ya han multiplicado una tarifa por ocho. Tú no votas.</li>
              <li><strong>Oferta que todavía sale.</strong> El consejo prevé liberar unos 3.540 millones de HBAR antes de que acabe 2026, un 8 % más de lo que circula hoy.</li>
              <li><strong>Las empresas pueden irse.</strong> Los mandatos son de seis años como mucho y algunos miembros ya no tienen nodo. Un nombre conocido en el consejo no es una promesa de uso.</li>
              <li><strong>Uso real modesto.</strong> Unas 7,7 operaciones por segundo en el día que contamos, frente a una capacidad anunciada de más de 10.000.</li>
              <li><strong>El staking puede rendir menos.</strong> Cuantos más HBAR se vinculan a nodos, menor es la tasa. No hay mínimo garantizado.</li>
              <li><strong>Errores operativos.</strong> Olvidar el memo o enviar un token a una cuenta que no lo ha asociado cuesta tiempo y, a veces, dinero.</li>
              <li><strong>El precio.</strong> La <Termino slug="volatilidad">volatilidad</Termino> es la de cualquier criptomoneda: está un 90 % por debajo de su máximo de 2021.</li>
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
          <h2 className="gbc-title">Comprueba lo que sabes de Hedera</h2>
          <div className="gbc-body" style={{ marginBottom: 32 }}>
            <p>Cinco preguntas. Con las cinco acertadas desbloqueas el logro <strong style={{ color: "var(--gold)" }}>Rumor Ordenado</strong>.</p>
          </div>
          {d.isRegistered ? <GuideHederaQuiz /> : <GuideQuizCuenta slug={SLUG} />}
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
