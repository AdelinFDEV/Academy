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
import GuideGramStaking from "./GuideGramStaking";
import GuideGramQuiz from "./GuideGramQuiz";
import "./toncoin.css";

/**
 * Guía «Qué es Toncoin (ahora Gram)» (14-11-2026). Consulta objetivo: «qué es
 * toncoin». El slug es `toncoin` y no `gram` a propósito: la gente sigue
 * buscando el nombre viejo, y «gram» a secas compite con la unidad de peso.
 *
 * Lo que tiene y las demás no: el cambio de nombre explicado con lo que debe
 * hacer quien tenía TON (nada) y la estafa que lo acompaña; la cuenta de la
 * inflación tras los bloques seis veces más rápidos, con una calculadora de
 * staking frente a dilución; la descongelación del 21-02-2027; y la cartera
 * de Telegram frente a la autocustodia, con su efecto en Hacienda (modelo 721).
 *
 * Al revisarla: precio y capitalización (CoinGecko), inflación y parte en
 * staking, número de validadores y de fragmentos, estado del caso Durov en
 * Francia y lo que haya pasado con las monedas descongeladas.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/guias/toncoin" },
  title: "Qué es Toncoin (ahora Gram), la red de Telegram",
  description:
    "Qué es Toncoin y por qué ahora se llama Gram: qué hacer si tenías TON, su relación con Telegram, cuánto da el staking, sus riesgos y cómo tributa en España.",
  openGraph: {
    title: "Qué es Toncoin, ahora Gram (GRAM): la moneda de la red ligada a Telegram",
    description:
      "El cambio de nombre sin letra pequeña, la historia desde 2018, la cartera de Telegram, una calculadora de staking frente a dilución y Hacienda. Con quiz.",
    type: "article",
  },
};

const SLUG = "toncoin";

const SECCIONES = [
  { id: "que-es", label: "Qué es" },
  { id: "historia", label: "Historia" },
  { id: "telegram", label: "Telegram" },
  { id: "red", label: "Cómo funciona" },
  { id: "staking", label: "Staking" },
  { id: "oferta", label: "Quién la tiene" },
  { id: "espana", label: "En España" },
  { id: "riesgos", label: "Riesgos" },
  { id: "quiz", label: "Quiz" },
];

const HITOS = [
  { fecha: "2018", texto: "Telegram vende por adelantado 2.900 millones de «grams» a 171 inversores y recauda unos 1.700 millones de dólares." },
  { fecha: "Octubre de 2019", texto: "La SEC, el supervisor de valores de Estados Unidos, demanda a Telegram por vender un valor sin registrarlo." },
  { fecha: "Marzo de 2020", texto: "Un juez de Nueva York prohíbe entregar los grams a los compradores." },
  { fecha: "Mayo y junio de 2020", texto: "Durov da por cerrado el proyecto. El acuerdo con la SEC obliga a devolver 1.224 millones de dólares y a pagar una multa de 18,5." },
  { fecha: "2020-2021", texto: "Una comunidad de desarrolladores relanza el código como The Open Network. Su moneda se llama Toncoin." },
  { fecha: "Septiembre de 2023", texto: "Telegram anuncia que pondrá una cartera de TON en sus menús, para los usuarios de fuera de Estados Unidos." },
  { fecha: "24 de agosto de 2024", texto: "Detienen a Durov al aterrizar en París. Toncoin cae alrededor de un 14 % en menos de un día." },
  { fecha: "Enero de 2025", texto: "TON pasa a ser la única blockchain asociada a Telegram para sus mini apps, pagos y coleccionables." },
  { fecha: "Abril y mayo de 2026", texto: "Bloques unas seis veces más rápidos, comisiones seis veces más baratas y Telegram como mayor validador." },
  { fecha: "15 de junio de 2026", texto: "Toncoin pasa a llamarse Gram, con el ticker GRAM, tras una votación con el 81,22 % a favor." },
  { fecha: "31 de agosto de 2026", texto: "Empieza el reparto de la Gram Wallet, una cartera sin custodia dentro de Telegram." },
];

export default async function ToncoinPage() {
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
          Qué es Toncoin, ahora Gram (GRAM)<br />
          <span className="gbc-hero-gold">la moneda de la red ligada a Telegram</span>
        </h1>
        <p className="gbc-respuesta">
          <strong>Toncoin es la moneda de TON, una blockchain que diseñó Telegram, y desde el 15 de junio de 2026
          se llama Gram, con el ticker GRAM.</strong> Solo cambiaron el nombre y el logotipo: si tenías TON, ahora
          tienes los mismos Gram sin hacer nada. Sirve para pagar comisiones, hacer staking y comprar dentro de
          Telegram, y su valor depende mucho de lo que decida la empresa de Pavel Durov.
        </p>
        <p className="gbc-revisado">Revisada el <strong>14 de noviembre de 2026</strong> · Datos de red medidos ese día</p>
        <div className="gbc-hero-pills">
          <span className="gbc-pill">Qué cambia si tenías TON</span>
          <span className="gbc-pill">Calculadora de staking y dilución</span>
          <span className="gbc-pill">Quiz con logro</span>
        </div>
      </header>

      {/* ── 1 ── */}
      <section id="que-es" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo básico</div>
          <h2 className="gbc-title">Qué es Toncoin y por qué ahora se llama Gram</h2>
          <div className="gbc-body">
            <p>
              TON es una <Termino slug="capa-1">capa 1</Termino>: una <Termino slug="blockchain">blockchain</Termino>{" "}
              propia, con sus <Termino slug="smart-contract">contratos inteligentes</Termino> y sus aplicaciones, como
              Ethereum o Solana. Toncoin era el nombre de su moneda. Con ella se pagan las <Termino slug="gas">comisiones</Termino> de cada
              operación, se protege la red mediante <Termino slug="staking">staking</Termino> y se compran nombres de
              usuario, regalos y anuncios dentro de Telegram.
            </p>
            <p>
              Fuera de Telegram, TON funciona como cualquier otra red. Tiene sus propios tokens, que allí se llaman
              jettons, entre ellos el USDT de Tether, una <Termino slug="stablecoin">stablecoin</Termino> que llegó a
              TON en 2024. Tiene aplicaciones <Termino slug="defi">DeFi</Termino>, como los{" "}
              <Termino slug="dex">DEX</Termino> STON.fi y DeDust, y carteras independientes de Telegram, como
              Tonkeeper.
            </p>
            <p>
              El nombre nuevo no es nuevo. «Gram» era como llamaba Telegram a su moneda en el documento técnico
              original de la red, y el código de la red lo conservó. Telegram propuso recuperarlo, la votación estuvo
              abierta del 1 al 8 de junio de 2026 y salió con el 81,22 % del poder de voto a favor. El voto se
              pesaba por las monedas que cada cartera tenía el 31 de mayo.
            </p>
            <p>
              La red sigue llamándose TON, o The Open Network. Lo que cambió el 15 de junio a las 12:00 UTC fue el
              nombre de la moneda, su ticker y su logotipo. Exchanges, carteras y webs de datos tuvieron hasta el 22
              de junio para actualizarse, y durante tres meses podían mostrarla como «Gram (prev. Toncoin)», que es
              como la sigue listando CoinGecko en noviembre de 2026.
            </p>
          </div>
          <div className="gbc-box gbc-box--red">
            <div className="gbc-box-title">Si tenías TON, no tienes que hacer nada</div>
            <div className="gbc-box-body">
              <p>
                No hubo canje, ni <Termino slug="bridge">puente</Termino>, ni reclamación, ni monedas nuevas: 10 TON son ahora 10 GRAM, con la misma
                dirección y la misma clave. Por eso cualquier web, bot o mensaje que te pida «reclamar tus GRAM» o
                «migrar tus TON» es <Termino slug="phishing">phishing</Termino>. Lo advirtió la propia red al anunciar
                el cambio, y es la estafa que acompaña a cada cambio de nombre de una criptomoneda.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2 ── */}
      <section id="historia" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">De dónde viene</div>
          <h2 className="gbc-title">De Gram a Toncoin y vuelta a Gram: la historia en once fechas</h2>
          <div className="gbc-body">
            <p>
              La moneda ha dado una vuelta completa. Nació como el proyecto estrella de Telegram, Estados Unidos
              lo tumbó, la comunidad lo resucitó con otro nombre y, ocho años después, Telegram ha vuelto a tomar
              el mando y le ha devuelto el nombre de origen.
            </p>
          </div>
          <ol className="gram-hitos">
            {HITOS.map((h) => (
              <li key={h.fecha}>
                <span className="gram-hito-fecha">{h.fecha}</span>
                <p>{h.texto}</p>
              </li>
            ))}
          </ol>
          <p className="gbc-fuente">
            Fuentes: comunicados de la SEC de octubre de 2019 y del 26 de junio de 2020. Canal oficial de Pavel
            Durov, mensajes del 12-05-2020, 14-09-2023, 21-01-2025, 09-04-2026, 04-05-2026 y 31-08-2026. Canal
            oficial de la red, sobre la votación (1-8 de junio de 2026). Caída del 24-08-2024: DL News, con datos de CoinGecko.
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              La venta de 2018 fue una <Termino slug="ico">ICO</Termino> privada, una de las mayores de la época.
              La SEC sostuvo que los compradores no querían una moneda para usarla, sino revenderla con beneficio,
              y que eso la convertía en un valor. Telegram devolvió el dinero y se apartó. Entre 2020 y 2026, la
              red de Toncoin la impulsó la TON Foundation, una fundación independiente con sede en Suiza.
            </p>
            <p>
              Ese reparto de papeles terminó en mayo de 2026. Durov anunció que Telegram sustituía a la fundación
              como «fuerza motriz» de la red y se convertía en su mayor validador. Lo presentó como el tercero de
              siete pasos de un plan que llama MTONGA, siglas en inglés de «hacer TON grande otra vez». El cambio
              de nombre fue el cuarto.
            </p>
          </div>
        </div>
      </section>

      {/* ── 3 ── */}
      <section id="telegram" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">La relación con Telegram</div>
          <h2 className="gbc-title">Qué tiene que ver Toncoin con Telegram, y qué cartera te conviene</h2>
          <div className="gbc-body">
            <p>
              Más que ninguna otra criptomoneda con una empresa. TON no es Telegram, pero desde enero de 2025 es su
              única blockchain asociada, y la aplicación la usa en casi todo lo que tiene que ver con dinero:
            </p>
            <ul>
              <li><strong>Stars.</strong> La moneda interna para pagar en las mini apps, que son aplicaciones que se abren dentro del chat sin instalar nada. Quien cobra en Stars retira sus ganancias en Gram.</li>
              <li><strong>Nombres y números.</strong> Los alias y los números anónimos se compran y se venden en Fragment, una plataforma de subastas que funciona sobre TON.</li>
              <li><strong>Regalos coleccionables.</strong> Se pueden convertir en <Termino slug="nft">NFT</Termino> de TON y venderse fuera de la aplicación.</li>
              <li><strong>Anuncios.</strong> En la mayoría de países, la publicidad de Telegram se paga con esta moneda.</li>
            </ul>
            <p>
              Para guardarla dentro de Telegram hay dos caminos, y no se parecen. El que conoce más gente es el bot
              Wallet, una mini app de terceros que Telegram puso en sus menús en 2023. En su modo principal es{" "}
              <strong>custodio</strong>: la empresa guarda las claves y tú ves un saldo, como en un{" "}
              <Termino slug="exchange">exchange</Termino>. El nuevo es la <strong>Gram Wallet</strong>, que Telegram
              empezó a repartir el 31 de agosto de 2026. Es una <Termino slug="wallet">cartera</Termino> sin custodia:
              la <Termino slug="clave-privada">clave privada</Termino> vive en tu teléfono.
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th></th><th>Wallet en modo custodio</th><th>Gram Wallet, sin custodia</th></tr></thead>
              <tbody>
                <tr><td><strong>Quién guarda las claves</strong></td><td>La empresa que lo opera</td><td>Tú, en tu dispositivo</td></tr>
                <tr><td><strong>Si pierdes el móvil o el acceso</strong></td><td>Recuperas la cuenta con su soporte</td><td>Solo con tu <Termino slug="seed-phrase">frase de recuperación</Termino></td></tr>
                <tr><td><strong>Si la empresa congela o cierra</strong></td><td>Tus monedas quedan dentro</td><td>No le afecta: las monedas están en la cadena</td></tr>
                <tr><td><strong>Verificación de identidad</strong></td><td>Suele pedirla para operar con euros</td><td>No la pide para usarla</td></tr>
                <tr><td><strong>Para Hacienda (España)</strong></td><td>Saldo en una entidad extranjera: cuenta para el modelo 721</td><td>No entra en el modelo 721</td></tr>
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Canal de Pavel Durov, 31 de agosto de 2026: la Gram Wallet empezó a llegar a «un grupo selecto» de
            usuarios. En noviembre escribió que se habían activado más de un millón en 48 horas. El detalle
            del modelo 721 está más abajo, en la sección de España.
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Ninguna de las dos es la buena para todo el mundo. La <Termino slug="autocustodia">autocustodia</Termino>{" "}
              te quita el riesgo de la empresa y te da el de perder la clave tú mismo. Para unos euros de prueba, la
              comodidad pesa más. Para una cantidad que te dolería perder, apunta la frase de recuperación en papel
              antes de recibir nada, porque Telegram no puede devolvértela.
            </p>
            {/* EXPERIENCIA DEL ADMIN: si el admin usa la Gram Wallet o el bot Wallet, aquí encaja una línea propia
                (qué le pidió al activarla, cuánto tardó un envío, qué le sorprendió). No inventar. */}
          </div>
        </div>
      </section>

      {/* ── Anuncio de media guía ── */}
      <GuiaAnuncio producto="portfolio" variante="compacto" estado={d.estado} />

      {/* ── 4 ── */}
      <section id="red" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Por dentro</div>
          <h2 className="gbc-title">Cómo funciona la red TON: fragmentos que se abren solos y validadores</h2>
          <div className="gbc-body">
            <p>
              TON funciona con <Termino slug="prueba-de-participacion">prueba de participación</Termino>: en vez de
              mineros, la protegen <Termino slug="validador">validadores</Termino> que bloquean monedas como garantía.
              Su rasgo de diseño propio es cómo reparte el trabajo. Hay una cadena maestra que coordina y lleva la
              cuenta de todo, y debajo, las cadenas de trabajo donde ocurren las operaciones.
            </p>
            <p>
              Cada cadena de trabajo puede partirse en fragmentos cuando se satura y volver a juntarse cuando baja
              la carga. Es el <Termino slug="sharding">sharding</Termino> dinámico, y la diferencia con otras redes
              fragmentadas, como <Link href="/guias/near">NEAR</Link>, es que aquí el número de fragmentos no está
              fijado: lo decide la demanda de cada momento. El 14 de noviembre de 2026, con poco tráfico, la cadena
              principal de trabajo funcionaba con un solo fragmento.
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Dato</th><th>Valor</th><th>De dónde sale</th></tr></thead>
              <tbody>
                <tr><td><strong>Un bloque cada</strong></td><td>0,41 segundos</td><td>200.000 bloques de la cadena maestra en 82.592 s</td></tr>
                <tr><td><strong>Comisión de un envío</strong></td><td>0,00039 GRAM, fija</td><td>Durov, mayo de 2026</td></tr>
                <tr><td><strong>Validadores elegidos</strong></td><td>380, con un máximo de 400</td><td>Configuración de la red</td></tr>
                <tr><td><strong>Mínimo para validar</strong></td><td>300.000 GRAM; el validador elegido más pequeño tenía unos 770.000</td><td>Configuración de la red y lista de validadores</td></tr>
                <tr><td><strong>Duración de cada <Termino slug="epoca">turno</Termino></strong></td><td>Unas 18 horas</td><td>Configuración de la red</td></tr>
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Medido el 14 de noviembre de 2026 en la configuración pública de la red (parámetros 15, 16, 17 y 34)
            y en su cadena maestra, a través de la interfaz pública de tonapi. La documentación de TON fija el salto de
            abril de 2026 en un bloque cada 2,5 segundos antes y unos 0,4 después.
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              La comisión casi nula tiene una lectura menos bonita. Con 0,00039 monedas por envío, las comisiones
              no pagan la seguridad de la red. La paga la emisión de monedas nuevas, y eso es lo que explica la
              sección siguiente.
            </p>
          </div>
        </div>
      </section>

      {/* ── 5 ── */}
      <section id="staking" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">El rendimiento, sin trampa</div>
          <h2 className="gbc-title">¿Cuánto da el staking de Toncoin, y de dónde sale?</h2>
          <div className="gbc-body">
            <p>
              En noviembre de 2026, alrededor de un 17 % anual en monedas, según Staking Rewards. Antes de 2026
              rondaba el 4-5 %. La subida no salió de ningún negocio: salió de los bloques más rápidos. La red paga
              1,7 GRAM por cada bloque de la cadena maestra y 1 por cada bloque de trabajo, la misma cantidad de
              siempre. Al producir unas seis veces más bloques, crea unas seis veces más monedas.
            </p>
            <p>
              La cuenta es sencilla. Con un bloque cada 0,41 segundos, salen unos 206 millones de monedas nuevas al
              año sobre 5.284 millones: una <Termino slug="inflacion">inflación</Termino> cercana al 3,9 %. Antes de 2026, los servicios de
              staking la daban en torno al 0,6 %, y la misma cuenta con un bloque cada 2,5 segundos da algo más
              de eso: la emisión se ha multiplicado por seis. Esas monedas se reparten entre el 23,6 % de la oferta
              que está en staking. Por eso el rendimiento es tan alto: 3,9 dividido entre 0,236 da algo más de un 16 %.
            </p>
            <p>
              La consecuencia es la parte que no sale en los anuncios. Quien no hace staking no gana nada, pero sí
              pierde peso: tiene las mismas monedas sobre una oferta que crece cada año. Es{" "}
              <Termino slug="dilucion">dilución</Termino>. Mueve los controles y mira cuánto cambia tu parte de la
              red en cada caso:
            </p>
          </div>

          <GuideGramStaking />

          <div className="gbc-body" style={{ marginTop: 26 }}>
            <p>
              Pon 1.000 Gram, una emisión del 3,9 % y un 24 % de la oferta en staking. A tres años, sin comisiones,
              acabas con unos 1.570 Gram y tu parte de la red crece un 40 %. Si no haces nada,
              sigues con 1.000 y tu parte baja un 11 %. Ninguna de las dos cifras dice nada del precio: si la
              moneda cae, puedes tener más Gram y menos euros.
            </p>
            <p>
              Un particular no llega al millón de monedas que pide un validador, así que delega. Esa{" "}
              <Termino slug="delegacion">delegación</Termino> tiene tres formas. Los contratos de un solo
              nominador, pensados para grandes tenedores. Los grupos de nominadores, hasta 40 por grupo y 10.000
              monedas de mínimo, que la documentación ya da por anticuados. Y el{" "}
              <Termino slug="staking-liquido">staking líquido</Termino>, que acepta poco dinero y te da a cambio
              una ficha, como tsTON, que puedes seguir usando. Nominador es como llama TON a quien delega. Cada
              servicio se queda una parte de la recompensa, y si el validador falla o la red lo multa, lo que se
              llama <Termino slug="slashing">slashing</Termino>, cobras menos.
            </p>
          </div>
          <p className="gbc-fuente">
            Rendimiento, inflación y parte en staking: Staking Rewards, 14 de noviembre de 2026 (16,6 %, 3,95 % y
            23,56 %). La inflación de antes de 2026: documentación de staking de Blockdaemon y de Tonstakers. Recompensa por bloque: parámetro 14 de la configuración de la red. Formas de delegar y
            mínimos: documentación oficial de TON.
          </p>
        </div>
      </section>

      {/* ── 6 ── */}
      <section id="oferta" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Concentración</div>
          <h2 className="gbc-title">Quién tiene los Gram: la mitad de la oferta no circula</h2>
          <div className="gbc-body">
            <p>
              Existen unos 5.284 millones de monedas, pero CoinGecko solo cuenta como{" "}
              <Termino slug="oferta-circulante">oferta circulante</Termino> 2.857 millones, el 54 %. Con un precio
              de 1,05 dólares, eso da una <Termino slug="market-cap">capitalización</Termino> de unos 3.000 millones,
              en el puesto 31 del mercado, a 14 de noviembre de 2026. El{" "}
              <Termino slug="ath">máximo histórico</Termino> de Toncoin fue de 8,25 dólares, el 14 de junio de 2024:
              el precio actual está un 87 % por debajo.
            </p>
            <p>
              Casi todas las monedas se repartieron entre 2020 y 2022 por{" "}
              <Termino slug="prueba-de-trabajo">prueba de trabajo</Termino>: los{" "}
              <Termino slug="minero">mineros</Termino> competían por sacarlas de unos contratos que las guardaban
              desde el inicio. Un análisis de la firma Whiterabbit, de marzo de 2023, concluyó que unas 248
              direcciones conectadas entre sí se llevaron más del 85 %. La TON Foundation negó tener lazos estrechos
              con esos mineros. Lo que no se discute son tres datos públicos:
            </p>
          </div>
          <div className="gram-datos">
            <div>
              <strong>1.081 millones</strong>
              <p>de monedas en 171 carteras de los primeros mineros, congeladas por votación de los validadores en febrero de 2023. Nunca habían hecho un envío.</p>
            </div>
            <div>
              <strong>21-02-2027</strong>
              <p>es el día en que esas carteras pueden volver a moverse, a las 09:00 UTC. Son cerca de una quinta parte de todas las monedas.</p>
            </div>
            <div>
              <strong>≈ 10 %</strong>
              <p>de la oferta es el tope que Telegram dijo en 2024 que quería mantener: vendería el excedente a inversores con bloqueos de uno a cuatro años.</p>
            </div>
          </div>
          <p className="gbc-fuente">
            Congelación: canal oficial de The Open Network, mensaje con el resultado de la votación (febrero de
            2023, con el 91,75 % a favor). Análisis de Whiterabbit: ForkLog, 30 de marzo de 2023. Tope del 10 %: canal de Pavel Durov, 29 de febrero de 2024. Precio, oferta y máximo: CoinGecko.
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Nadie sabe qué harán los dueños de esas carteras congeladas, ni si siguen teniendo las claves. Pero
              una quinta parte de la oferta que puede llegar al mercado en una fecha conocida es justo el tipo de
              cosa que conviene saber antes de comprar, y no después. Es lo que en otras monedas se llama una{" "}
              <Termino slug="liberacion-de-tokens">liberación de tokens</Termino>.
            </p>
          </div>
        </div>
      </section>

      {/* ── 7 ── */}
      <section id="espana" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Desde España</div>
          <h2 className="gbc-title">Toncoin en España: Hacienda, MiCA y la cartera de Telegram</h2>
          <div className="gbc-body">
            <p>
              <strong>El cambio de nombre no se declara.</strong> Para Hacienda, lo que tributa es vender o
              permutar. Pasar de Toncoin a Gram no fue ninguna de las dos cosas: no se entregó una moneda a cambio
              de otra, solo cambió la etiqueta. Tu precio y tu fecha de compra siguen siendo los mismos, y los
              necesitarás cuando vendas.
            </p>
            <p>
              <strong>Las recompensas de staking, sí.</strong> Hacienda las trata como un rendimiento: se declaran
              por su valor en euros el día que las recibes, aunque no vendas nada. Y ese valor pasa a ser su precio
              de compra para cuando las vendas. Con una red que paga en cada turno de 18 horas, eso son cientos de
              apuntes al año. Lo práctico es usar el historial que exportan los servicios de staking.
            </p>
            <p>
              <strong>Dónde las guardas también cuenta.</strong> El modelo 721 obliga a informar de las
              criptomonedas que tienes en entidades extranjeras que las custodian, si el total supera los 50.000
              euros a 31 de diciembre. Un saldo en el bot Wallet en modo custodio entra en ese cálculo. Una Gram
              Wallet sin custodia, no, porque nadie la guarda por ti. Cómo se calcula cada ganancia, con el método{" "}
              <Termino slug="fifo">FIFO</Termino>, lo tienes en la guía de{" "}
              <Link href="/guias/fiscalidad-cripto-espana">fiscalidad de las criptomonedas en España</Link>.
            </p>
            <p>
              En cuanto a <Termino slug="mica">MiCA</Termino>, el reglamento europeo no prohíbe ni autoriza monedas
              sueltas. Regula a las empresas que las venden o las guardan. Desde el 1 de julio de 2026 no queda
              periodo transitorio en ningún país de la UE: quien te ofrezca Gram desde España necesita su
              autorización. Compruébalo en el registro de la CNMV o en el de ESMA antes de mandar dinero, sobre todo
              si la oferta te llega por un canal o un bot de Telegram.
            </p>
          </div>
        </div>
      </section>

      {/* ── 8 ── */}
      <section id="riesgos" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que puede salir mal</div>
          <h2 className="gbc-title">Los riesgos de Toncoin, ahora Gram</h2>
          <div className="gbc-body">
            <ul>
              <li><strong>Depende de una empresa y de una persona.</strong> Telegram es su mayor validador y su principal cliente. La detención de Durov en 2024 tumbó el precio en horas. Francia le levantó las restricciones de viaje en noviembre de 2025, pero la investigación sobre Telegram sigue abierta.</li>
              <li><strong>La emisión subió de golpe.</strong> Cerca del 3,9 % anual desde 2026. Si no haces staking, pierdes peso cada año; si lo haces, cobras en una moneda que se diluye.</li>
              <li><strong>La oferta está concentrada.</strong> Casi la mitad no circula, y una quinta parte puede moverse a partir del 21 de febrero de 2027.</li>
              <li><strong>La red ha cambiado mucho y muy rápido.</strong> Bloques nuevos, comisiones nuevas, <Termino slug="mecanismo-de-consenso">mecanismo de consenso</Termino> nuevo y cartera nueva en seis meses. El código recién estrenado es donde aparecen los fallos.</li>
              <li><strong>Las estafas viven donde vive la moneda.</strong> Bots que «migran» tus TON, falsos <Termino slug="airdrop">airdrops</Termino> y mini apps que piden tu frase de recuperación. Telegram tiene más de mil millones de usuarios, y los estafadores también lo saben.</li>
              <li><strong>El precio.</strong> Su <Termino slug="volatilidad">volatilidad</Termino> es alta: cayó un 87 % desde su máximo de 2024, y en noviembre de 2026 llegó a subir un 14 % en un solo día.</li>
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
          <h2 className="gbc-title">Comprueba lo que sabes de Toncoin y Gram</h2>
          <div className="gbc-body" style={{ marginBottom: 32 }}>
            <p>Cinco preguntas. Con las cinco acertadas desbloqueas el logro <strong style={{ color: "var(--gold)" }}>Vuelta al Gram</strong>.</p>
          </div>
          {d.isRegistered ? <GuideGramQuiz /> : <GuideQuizCuenta slug={SLUG} />}
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
