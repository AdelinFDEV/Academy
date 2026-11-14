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
import GuideBitcoinCashReparto from "./GuideBitcoinCashReparto";
import GuideBitcoinCashQuiz from "./GuideBitcoinCashQuiz";
import "./bitcoin-cash.css";

/**
 * Guía «Qué es Bitcoin Cash» (14-11-2026). Consulta objetivo: «qué es bitcoin cash».
 *
 * El ángulo es la división y la apuesta por los bloques grandes, no los pagos
 * (eso lo cuenta la guía de Litecoin). Lo que tiene y los primeros resultados
 * no: la cadena de divisiones entera (BCH, BSV, eCash) con una calculadora de lo
 * que recibió cada tenedor, el uso real de los bloques medido en cadena y lo que
 * se sabe, y lo que no, de cómo tributan en España las monedas de una división.
 *
 * Al revisarla: precios de la calculadora, comisiones y operaciones diarias de
 * las dos redes (Blockchair), hash rate, y si la DGT ha publicado una consulta
 * vinculante sobre divisiones.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/guias/bitcoin-cash" },
  title: "Qué es Bitcoin Cash (BCH) y por qué se separó",
  description:
    "Qué es Bitcoin Cash, por qué se separó de Bitcoin en 2017, cuánto BCH te tocó, cuánto se usan de verdad sus bloques y cómo tributa en España.",
  openGraph: {
    title: "Qué es Bitcoin Cash (BCH): la división de 2017 y la apuesta por los bloques grandes",
    description:
      "La guerra del tamaño de bloque, las tres divisiones con calculadora, cuánto se usan de verdad sus bloques y qué dice Hacienda de las monedas recibidas. Con quiz.",
    type: "article",
  },
};

const SLUG = "bitcoin-cash";

const SECCIONES = [
  { id: "que-es", label: "Qué es" },
  { id: "division", label: "La división" },
  { id: "me-toco", label: "¿Me tocó BCH?" },
  { id: "escalar", label: "Bloques o capa 2" },
  { id: "diferencias", label: "Frente a Bitcoin" },
  { id: "mejoras", label: "Qué ha cambiado" },
  { id: "adopcion", label: "El uso real" },
  { id: "hacienda", label: "Hacienda" },
  { id: "riesgos", label: "Riesgos" },
  { id: "quiz", label: "Quiz" },
];

const HITOS = [
  { fecha: "2010", texto: "Bitcoin fija un límite de 1 MB por bloque, como medida provisional contra el spam." },
  { fecha: "2015-2017", texto: "La red se llena y las comisiones suben. Empieza la discusión sobre cómo ganar capacidad." },
  { fecha: "1 de agosto de 2017", texto: "Tras el bloque 478.558, una parte de la comunidad sigue con otras reglas: nace Bitcoin Cash, con bloques de 8 MB." },
  { fecha: "Agosto de 2017", texto: "Bitcoin activa SegWit, la mejora que el bando de los bloques grandes rechazaba." },
  { fecha: "Mayo de 2018", texto: "Bitcoin Cash sube el límite a 32 MB." },
  { fecha: "15 de noviembre de 2018", texto: "Bitcoin Cash se parte a su vez: nace Bitcoin SV (BSV), que quería bloques todavía mayores." },
  { fecha: "15 de noviembre de 2020", texto: "Otra división, por un desacuerdo sobre la financiación del desarrollo: nace la rama que hoy se llama eCash (XEC)." },
];

export default async function BitcoinCashPage() {
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
          Qué es Bitcoin Cash (BCH)<br />
          <span className="gbc-hero-gold">y por qué se separó de Bitcoin</span>
        </h1>
        <p className="gbc-respuesta">
          <strong>Bitcoin Cash es la criptomoneda que nació el 1 de agosto de 2017, cuando Bitcoin se partió en
          dos por una discusión sobre el tamaño de sus bloques.</strong> Quien tenía bitcoin ese día recibió la
          misma cantidad de BCH. Su apuesta fue meter más operaciones en cada bloque para que pagar fuera barato;
          las comisiones son hoy de fracciones de céntimo, pero la red se usa poco.
        </p>
        <p className="gbc-revisado">Revisada el <strong>14 de noviembre de 2026</strong> · Datos en cadena de Blockchair y precios de CoinGecko de esa fecha</p>
        <div className="gbc-hero-pills">
          <span className="gbc-pill">Calculadora de las tres divisiones</span>
          <span className="gbc-pill">Uso real de sus bloques, medido</span>
          <span className="gbc-pill">Quiz con logro</span>
        </div>
      </header>

      {/* ── 1 ── */}
      <section id="que-es" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">La respuesta corta</div>
          <h2 className="gbc-title">Qué es Bitcoin Cash, en tres ideas</h2>
          <div className="gbc-body">
            <p>
              <strong>Es una copia de <Termino slug="bitcoin">Bitcoin</Termino> que siguió su propio camino.</strong>{" "}
              Hasta el bloque 478.558 las dos comparten la misma historia. A partir de ahí, cada una tiene su
              propia <Termino slug="blockchain">blockchain</Termino>, sus{" "}
              <Termino slug="minero">mineros</Termino> y su precio. A esa separación se
              le llama <Termino slug="hard-fork">hard fork</Termino>, o división.
            </p>
            <p>
              <strong>Su diferencia de fondo es el tamaño del bloque.</strong> Bitcoin mantuvo un límite pequeño y
              confió en otras capas para crecer. Bitcoin Cash eligió bloques mucho mayores: hoy, como mínimo, de
              32 MB, y con un límite que se ajusta solo si la demanda sube.
            </p>
            <p>
              <strong>Por lo demás, se parece mucho al original.</strong> Usa{" "}
              <Termino slug="prueba-de-trabajo">prueba de trabajo</Termino> con el mismo algoritmo, saca un bloque
              cada diez minutos y nunca habrá más de 21 millones de BCH.
            </p>
          </div>
        </div>
      </section>

      {/* ── 2 ── */}
      <section id="division" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">El origen</div>
          <h2 className="gbc-title">Por qué se creó Bitcoin Cash: la guerra del tamaño de bloque</h2>
          <div className="gbc-body">
            <p>
              Bitcoin tenía desde 2010 un límite de 1 MB por bloque. En 2017 ese espacio se quedó corto. Las
              operaciones esperaban en la <Termino slug="mempool">mempool</Termino> y ganaba sitio quien más
              pagaba. Según BitInfoCharts, la comisión media superó los 50 dólares un día de diciembre de 2017.
            </p>
            <p>
              Todos querían más capacidad. Discutían cómo conseguirla. Un bando defendía subir el{" "}
              <Termino slug="tamano-de-bloque">tamaño de bloque</Termino>: más operaciones por bloque, comisiones
              más bajas, y el pago sencillo en la propia cadena que describía el documento original de Satoshi. El
              otro temía que bloques grandes encarecieran mantener un <Termino slug="nodo">nodo</Termino> y
              dejaran la red en manos de pocos. Prefería <Termino slug="segwit">SegWit</Termino> y pagos fuera de
              la cadena.
            </p>
            <p>
              No hubo acuerdo, y en Bitcoin no hay nadie que pueda imponerlo. Así que el bando de los bloques
              grandes hizo lo único posible: arrancar con otras reglas. Los programas antiguos rechazaron sus
              bloques, y la cadena se partió en dos. Lo impulsaron algunos grandes mineros, como ViaBTC, que
              minó su primer bloque, y defensores conocidos de los bloques grandes, como Roger Ver.
            </p>
          </div>

          <ol className="bch-hitos">
            {HITOS.map((h) => (
              <li key={h.fecha}>
                <span className="bch-hito-fecha">{h.fecha}</span>
                <p>{h.texto}</p>
              </li>
            ))}
          </ol>

          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              La división de 2018 fue la más dura. El grupo de Bitcoin SV, encabezado por Craig Wright, quería
              bloques enormes y rechazaba los cambios técnicos que proponía el otro bando. Durante días, los
              dos bandos lanzaron potencia de minado el uno contra el otro, lo que se llamó «guerra de hash». En marzo de 2024, el Tribunal
              Superior de Inglaterra concluyó que Wright no es Satoshi Nakamoto, como él afirmaba.
            </p>
            <p>
              La lección es incómoda para el propio Bitcoin Cash. Nació para defender una visión frente a la
              mayoría, y él mismo se partió dos veces cuando dentro hubo minorías que pensaban distinto.
            </p>
          </div>
        </div>
      </section>

      {/* ── 3 ── */}
      <section id="me-toco" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Si tenías bitcoin en 2017</div>
          <h2 className="gbc-title">Tenía bitcoin en 2017: ¿me tocó Bitcoin Cash?</h2>
          <div className="gbc-body">
            <p>
              Sí, si los tenías antes del bloque 478.558. Una división copia el historial entero hasta ese punto.
              Tus monedas existían en las dos cadenas, una por una, y las mismas{" "}
              <Termino slug="clave-privada">claves privadas</Termino> abrían las dos. Con 1 BTC tenías también
              1 BCH. Lo mismo pasó después: cada BCH dio 1 BSV en 2018, y otra moneda en 2020 que hoy equivale a
              un millón de XEC.
            </p>
            <p>
              Que te tocara no significa que lo tengas. Depende de dónde estaban tus bitcoin:
            </p>
            <ul>
              <li>
                <strong>En tu propia <Termino slug="wallet">cartera</Termino>.</strong> El BCH sigue ahí, aunque tu
                cartera no lo muestre. Para verlo hay que abrir esas claves en un programa compatible con Bitcoin
                Cash.
              </li>
              <li>
                <strong>En un <Termino slug="exchange">exchange</Termino>.</strong> Dependía de él. Muchos lo
                abonaron, algunos tarde y otros nunca. Con BSV y eCash, la lista de los que pagaron fue más corta.
              </li>
            </ul>
          </div>

          <GuideBitcoinCashReparto />

          <div className="gbc-body" style={{ marginTop: 26 }}>
            <p>
              Con 1 BTC, la cuenta de hoy sale así: 195,89 euros en BCH, 13,49 en BSV y unos 4,81 en XEC. En
              total, 214 euros, frente a los 60.558 que vale ese bitcoin. Las tres divisiones juntas suman un
              0,35 % de la moneda de la que salieron, con precios de CoinGecko del 14 de noviembre de 2026.
            </p>
          </div>

          {/* EXPERIENCIA DEL ADMIN: si tuvo bitcoin en agosto de 2017, cómo recibió (o no) su BCH, en qué exchange o cartera, y qué hizo con él. Si recuperó monedas antiguas, el proceso real que siguió y lo que tardó. */}

          <div className="gbc-box gbc-box--gold">
            <div className="gbc-box-title">Si vas a recuperar BCH antiguo</div>
            <div className="gbc-box-body">
              <p>
                Mueve antes tus bitcoin a una cartera nueva. Después, abre las claves viejas en una cartera
                conocida de Bitcoin Cash, descargada de su web oficial. Nunca escribas tu{" "}
                <Termino slug="seed-phrase">frase semilla</Termino> en una web que promete «reclamar» monedas de
                una división: es un <Termino slug="phishing">phishing</Termino> clásico. En noviembre de 2017, una
                web falsa para reclamar Bitcoin Gold, otra división de Bitcoin, robó así las monedas de quienes
                la usaron.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Anuncio de media guía ── */}
      <GuiaAnuncio producto="portfolio" variante="compacto" estado={d.estado} />

      {/* ── 4 ── */}
      <section id="escalar" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Dos formas de crecer</div>
          <h2 className="gbc-title">Bloques grandes o capa 2: qué eligió cada uno, y cómo le va</h2>
          <div className="gbc-body">
            <p>
              La pregunta de 2017 sigue abierta: ¿dónde se apuntan los pagos pequeños? Cada red dio una
              respuesta distinta.
            </p>
          </div>
          <div className="bch-caminos">
            <div>
              <span className="bch-camino-red">Bitcoin Cash</span>
              <strong>Todo en la cadena</strong>
              <p>Cada pago, por pequeño que sea, va a un bloque. Para que quepan muchos, bloques grandes. Es simple de usar, pero cada nodo guarda y valida todo.</p>
            </div>
            <div>
              <span className="bch-camino-red">Bitcoin</span>
              <strong>Una capa encima</strong>
              <p>
                La cadena se reserva para liquidar. Los pagos pequeños van por una{" "}
                <Termino slug="capa-2">capa 2</Termino>, sobre todo{" "}
                <Termino slug="lightning-network">Lightning Network</Termino>, que solo apunta en la cadena la
                apertura y el cierre de cada canal.
              </p>
            </div>
          </div>

          <div className="gbc-body" style={{ marginTop: 26 }}>
            <p>Estas son las cifras de las dos redes en las últimas 24 horas, a 14 de noviembre de 2026:</p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th></th><th>Bitcoin</th><th>Bitcoin Cash</th></tr></thead>
              <tbody>
                <tr><td><strong>Comisión mediana</strong></td><td>Unos 0,14 €</td><td>Menos de 0,2 céntimos</td></tr>
                <tr><td><strong>Comisión media</strong></td><td>Unos 0,49 €</td><td>Medio céntimo</td></tr>
                <tr><td><strong>Operaciones en 24 horas</strong></td><td>462.614</td><td>13.603</td></tr>
                <tr><td><strong>Tamaño medio de bloque</strong></td><td>Unos 2,1 MB</td><td>Unos 104 KB, el 0,3 % de su límite</td></tr>
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Fuente: estadísticas de Blockchair del 14-11-2026, en dólares pasados a euros a 1,10 $/€. Tamaño de
            bloque: media de los cien últimos bloques de Bitcoin Cash (Blockchair) y de los quince últimos de
            Bitcoin (mempool.space), ese mismo día.
          </p>

          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Fíjate en la última fila: los bloques de Bitcoin, con su límite pequeño, llevan unas veinte veces
              más datos que los de Bitcoin Cash. Hoy enviar en Bitcoin también es barato, porque su red va
              tranquila. La diferencia aparece cuando
              hay demanda: entonces la comisión de Bitcoin sube hasta varios euros, y la de Bitcoin Cash, con sus
              bloques casi vacíos, no se mueve.
            </p>
            <p>
              Lightning, por su parte, existe y funciona, pero es pequeño. A finales de agosto de 2026, según
              mempool.space, sus canales públicos sumaban unos 3.795 BTC. Ninguna de las dos apuestas ha llevado
              los pagos con criptomoneda al uso cotidiano que se prometía en 2017.
            </p>
          </div>
        </div>
      </section>

      {/* ── 5 ── */}
      <section id="diferencias" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lado a lado</div>
          <h2 className="gbc-title">Diferencias entre Bitcoin Cash y Bitcoin</h2>
          <div className="gbc-body">
            <p>Comparten el diseño de base. Lo que cambia son unas pocas reglas, y con ellas el comportamiento de la red.</p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th></th><th>Bitcoin (BTC)</th><th>Bitcoin Cash (BCH)</th></tr></thead>
              <tbody>
                <tr><td><strong>Tamaño de bloque</strong></td><td>Un tope de casi 4 MB desde SegWit; en la práctica, unos 2 MB</td><td>32 MB como mínimo, con límite que se adapta a la demanda</td></tr>
                <tr><td><strong>Cómo escala</strong></td><td>SegWit y capa 2 (Lightning)</td><td>Más espacio en la propia cadena</td></tr>
                <tr><td><strong>Ajuste de <Termino slug="dificultad-de-minado">dificultad</Termino></strong></td><td>Cada 2.016 bloques, unas dos semanas</td><td>En cada bloque (algoritmo ASERT, desde 2020)</td></tr>
                <tr><td><strong>Monedas máximas</strong></td><td>21 millones</td><td>21 millones</td></tr>
                <tr><td><strong>Monedas <Termino slug="oferta-circulante">emitidas</Termino></strong></td><td>Unos 20,1 millones</td><td>Unos 20,1 millones (el 95,8 %)</td></tr>
                <tr><td><strong>Último <Termino slug="halving">halving</Termino></strong></td><td>Abril de 2024</td><td>Abril de 2024, unas dos semanas antes</td></tr>
                <tr><td><strong><Termino slug="hash-rate">Hash rate</Termino></strong></td><td>Unos 818 EH/s</td><td>Entre 3,5 y 3,7 EH/s, menos del 0,5 % del de Bitcoin</td></tr>
                <tr><td><strong><Termino slug="market-cap">Capitalización</Termino></strong></td><td>Unos 1,22 billones de euros</td><td>Unos 3.940 millones de euros, puesto 23</td></tr>
                <tr><td><strong>Contratos y tokens</strong></td><td>Muy limitados en la cadena</td><td>Tokens propios desde 2023 (CashTokens)</td></tr>
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Hash rate, emisión y bloques: Blockchair y mempool.space, 14-11-2026. Capitalización y puesto:
            CoinGecko, misma fecha.
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              El halving cae casi a la vez en las dos redes porque comparten la numeración de bloques: ocurre
              cada 210.000. El de 2024 dejó la recompensa en 3,125 monedas por bloque. Bitcoin Cash llegó antes
              al bloque 840.000, el 3 de abril frente al 20 de Bitcoin, porque durante sus primeros meses sacó
              bloques más deprisa de lo previsto. El próximo será hacia 2028.
            </p>
            <p>
              La fila del hash rate es la que más pesa. Las dos redes se minan con las mismas máquinas, los{" "}
              <Termino slug="asic">ASIC</Termino>, así que la potencia puede saltar de una a otra en minutos. Para
              Bitcoin Cash, que mueve menos de la mitad del 1 % de la potencia de Bitcoin, eso es una amenaza
              permanente.
            </p>
          </div>
        </div>
      </section>

      {/* ── 6 ── */}
      <section id="mejoras" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Desde 2017</div>
          <h2 className="gbc-title">Qué ha cambiado en Bitcoin Cash desde la división</h2>
          <div className="gbc-body">
            <p>
              Bitcoin Cash cambia sus reglas con más facilidad que Bitcoin. Hasta 2020 hubo dos actualizaciones
              al año; desde 2021, una, cada 15 de mayo. Estas son las que más importan:
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Cuándo</th><th>Qué cambió</th><th>Para qué sirve</th></tr></thead>
              <tbody>
                <tr><td><strong>Noviembre de 2020</strong></td><td>ASERT, el nuevo ajuste de dificultad</td><td>Recalcula la dificultad en cada bloque. Evita los saltos de los primeros años, cuando los mineros entraban y salían según qué red pagaba más</td></tr>
                <tr><td><strong>Mayo de 2023</strong></td><td>CashTokens</td><td>Permite crear tokens y <Termino slug="nft">NFT</Termino> directamente en la cadena, sin otra red</td></tr>
                <tr><td><strong>Mayo de 2024</strong></td><td>Límite de bloque adaptativo (ABLA)</td><td>El tope deja de ser fijo: parte de 32 MB y sube o baja según lo llenos que vayan los bloques, sin necesidad de otra división</td></tr>
                <tr><td><strong>Mayo de 2025</strong></td><td>Nuevos límites para los programas de la cadena y cálculo con números muy grandes</td><td>Programas más complejos dentro de la cadena</td></tr>
                <tr><td><strong>Mayo de 2026</strong></td><td>Bucles, funciones, operaciones con bits y pago directo a un programa (P2S)</td><td>Sigue en la misma línea: un lenguaje de <Termino slug="smart-contract">contratos inteligentes</Termino> más capaz</td></tr>
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Fuente: especificaciones oficiales de cada actualización publicadas por Bitcoin Cash Node, uno de
            los programas de nodo de la red.
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              El límite adaptativo es la mejora que mejor resume la apuesta. Bitcoin se partió en 2017 porque
              subir un número exigía un acuerdo que no hubo. Bitcoin Cash ha intentado que eso no vuelva a hacer
              falta: el tamaño lo decide el uso.
            </p>
            <p>
              Por ahora, el límite no se ha movido de su suelo, porque la red no lo necesita. Por eso conviene
              leer las mejoras con calma: hay más capacidad técnica que gente usándola.
            </p>
          </div>
        </div>
      </section>

      {/* ── 7 ── */}
      <section id="adopcion" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">La promesa y los datos</div>
          <h2 className="gbc-title">Por qué Bitcoin Cash no se ha convertido en el dinero de los pagos</h2>
          <div className="gbc-body">
            <p>
              La idea era que, con comisiones mínimas, la gente pagaría con BCH. Las comisiones son mínimas. La
              gente no paga. En las 24 horas medidas, la red de Bitcoin Cash registró unas 34 veces menos
              operaciones que la de Bitcoin. Hay cuatro motivos que se ven en los datos:
            </p>
            <ul>
              <li>
                <strong>El efecto red se quedó en Bitcoin.</strong> Los exchanges, las carteras, los cajeros y los{" "}
                <Termino slug="etf-de-bitcoin">ETF</Termino> se construyeron sobre BTC. Una moneda vale como medio
                de pago si la acepta mucha gente, y la mayoría siguió con el original.
              </li>
              <li>
                <strong>Quien quiere pagar barato usa otra cosa.</strong> Para mover dinero entre personas, hoy se
                usan sobre todo las <Termino slug="stablecoin">stablecoins</Termino>, que no cambian de valor de
                un día para otro.
              </li>
              <li>
                <strong>El precio no acompañó.</strong> Su <Termino slug="ath">máximo histórico</Termino> fue de 3.187 euros el 19 de diciembre de 2017,
                según CoinGecko. A 14 de noviembre de 2026 cotiza a 195,89, un 94 % por debajo. Pocos quieren
                cobrar en algo que ha perdido eso.
              </li>
              <li>
                <strong>Las divisiones dañaron la confianza.</strong> Partirse en 2018 y en 2020 repartió
                desarrolladores, mineros y comunidad.
              </li>
            </ul>
            <p>
              No todo el mercado de pagos con criptomoneda está en Bitcoin Cash. Otras redes antiguas, como{" "}
              <Link href="/guias/litecoin">Litecoin</Link>, compiten por ese mismo uso con argumentos parecidos.
            </p>
          </div>
        </div>
      </section>

      {/* ── 8 ── */}
      <section id="hacienda" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Desde España</div>
          <h2 className="gbc-title">Cómo tributa en España el Bitcoin Cash recibido en una división</h2>
          <div className="gbc-body">
            <p>
              <strong>La respuesta honesta: no hay una regla escrita para este caso.</strong> A noviembre de
              2026 no conocemos ninguna consulta vinculante de la Dirección General de Tributos (DGT) dedicada a
              las divisiones de una cadena. Lo que hay son las normas generales del IRPF y el trato que se da a
              casos parecidos.
            </p>
            <p>
              El más cercano son los <Termino slug="airdrop">airdrops</Termino>: monedas que te llegan gratis
              por tener otra. La Ley del IRPF considera ganancia patrimonial cualquier bien que entra en tu
              patrimonio sin venir de una venta, y la cuenta por su valor de mercado. Esa ganancia va a la base
              general, la que se suma a tu sueldo, y no a la del ahorro. Es el trato habitual de los airdrops en
              España.
            </p>
            <p>Aplicado al BCH, el BSV o el XEC recibidos, circulan tres lecturas, y dan cifras distintas:</p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Lectura</th><th>Al recibirlo</th><th>Al venderlo</th></tr></thead>
              <tbody>
                <tr><td><strong>Como un airdrop</strong></td><td>Ganancia por su valor de mercado ese día, en la base general</td><td>Ganancia o pérdida frente a ese valor, en la base del ahorro</td></tr>
                <tr><td><strong>Con coste cero</strong></td><td>Nada</td><td>Todo lo que cobras es ganancia, en la base del ahorro</td></tr>
                <tr><td><strong>Como un reparto del bitcoin original</strong></td><td>Nada: tu bitcoin se ha partido en dos</td><td>Lo que pagaste por el bitcoin se reparte entre las dos monedas, y la ganancia se calcula frente a esa parte</td></tr>
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Primera fila: artículos 37.1.l, 45 y 46 de la Ley 35/2006 del IRPF. Las otras dos son
            interpretaciones de asesores; que sepamos, ninguna tiene respaldo expreso de la DGT.
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Hay un dato práctico. Las tres divisiones ocurrieron en 2017, 2018 y 2020, y el plazo general de
              Hacienda para revisar un año es de cuatro, contados desde que acaba el plazo de declararlo. Salvo
              que algo lo haya interrumpido, esos ejercicios están prescritos. La duda que queda viva es otra:
              qué valor de compra usas cuando vendes hoy. Con la lectura del airdrop es el precio del día de la
              división; con la del coste cero, nada.
            </p>
            <p>
              Ahí está el error típico: vender BCH antiguo y no declararlo porque «fue gratis». La venta tributa
              siempre. Si te pasa, guarda la prueba de cuántos bitcoin tenías el 1 de agosto de 2017 y del
              precio del BCH ese día, y consulta con un asesor qué lectura aplicar.
            </p>
          </div>
          <div className="gbc-box gbc-box--gold">
            <div className="gbc-box-title">Para el resto de operaciones</div>
            <div className="gbc-box-body">
              <p>
                Cambiar BCH por otra criptomoneda también cuenta como venta, y el orden de salida lo marca el
                método <Termino slug="fifo">FIFO</Termino>. Todo eso, con ejemplos, está en la guía de
                <Link href="/guias/fiscalidad-cripto-espana"> fiscalidad de las criptomonedas en España</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9 ── */}
      <section id="riesgos" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que puede salir mal</div>
          <h2 className="gbc-title">Los riesgos de Bitcoin Cash</h2>
          <div className="gbc-body">
            <ul>
              <li><strong>Seguridad prestada.</strong> Con menos del 0,5 % de la potencia de Bitcoin, un grupo de mineros de BTC podría reunir más de la mitad de la de Bitcoin Cash. Es lo que permite un <Termino slug="ataque-del-51">ataque del 51 %</Termino>.</li>
              <li><strong>Más divisiones.</strong> Ya se ha partido dos veces. Cada una reparte comunidad, mineros y atención.</li>
              <li><strong>Poco uso.</strong> Si la demanda no llega, sobra capacidad y faltan razones para tener la moneda.</li>
              <li><strong>Liquidez.</strong> Se negocia en los grandes exchanges, pero con mucha menos <Termino slug="liquidez">liquidez</Termino> que Bitcoin: en un mal día, vender una cantidad grande mueve el precio.</li>
              <li><strong>El precio.</strong> Su <Termino slug="volatilidad">volatilidad</Termino> es la de cualquier criptomoneda, y su historial incluye una caída del 94 % desde el máximo.</li>
              <li><strong>Estafas con su nombre.</strong> Las webs que prometen «reclamar» monedas de una división piden tu frase semilla para robarte.</li>
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
          <h2 className="gbc-title">Comprueba lo que sabes de Bitcoin Cash</h2>
          <div className="gbc-body" style={{ marginBottom: 32 }}>
            <p>Cinco preguntas. Con las cinco acertadas desbloqueas el logro <strong style={{ color: "var(--gold)" }}>Rama Partida</strong>.</p>
          </div>
          {d.isRegistered ? <GuideBitcoinCashQuiz /> : <GuideQuizCuenta slug={SLUG} />}
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
