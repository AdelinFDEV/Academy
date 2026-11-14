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
import GuideZcashTransacciones from "./GuideZcashTransacciones";
import GuideZcashQuiz from "./GuideZcashQuiz";
import "./zcash.css";

/**
 * Guía «Qué es Zcash» (14-11-2026). Consulta objetivo: «qué es zcash».
 *
 * Lo que la distingue de Monero, y de esta guía de la de Monero, es que la
 * privacidad es OPCIONAL. Todo gira alrededor de eso: el comparador de los
 * cuatro tipos de operación, cuánto ZEC está blindado de verdad, y cómo encaja
 * esa opción con la norma europea de 2027 (que aquí se resume en dos frases y
 * se enlaza a la guía de Monero, que la explica).
 *
 * Lo que no tienen los primeros resultados en español (Decrypt, CriptoNoticias,
 * Finst, Datawallet; revisados el 14-11-2026): los números después de NU7
 * (bloques de 25 s, Sprout congelado), cuánto ZEC está blindado hoy, qué ve un
 * tercero en cada tipo de pago y el ángulo europeo y español. Datawallet sí
 * cuenta Orchard e Ironwood, pero con datos de julio y bloques de 75 s.
 *
 * Al revisarla (caducan antes): el porcentaje blindado y los saldos de cada
 * fondo (ZecStats), el debate del fondo de desarrollo (ZIP PR #1428), qué
 * exchanges europeos la siguen ofreciendo y si la UE publica qué monedas entran
 * en el artículo 79.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/guias/zcash" },
  title: "Qué es Zcash (ZEC): privacidad que se elige",
  description:
    "Qué es Zcash y qué ve un tercero en cada tipo de pago. Cuánto ZEC está blindado de verdad, el fallo de Orchard de 2026 y qué cambia en Europa en 2027.",
  openGraph: {
    title: "Qué es Zcash (ZEC): direcciones transparentes, blindadas y lo que cambia en 2027",
    description:
      "Un comparador de los cuatro tipos de operación, el 28,9 % de ZEC que está blindado, el fallo de Orchard y la norma europea contra el blanqueo. Con quiz.",
    type: "article",
  },
};

const SLUG = "zcash";

const SECCIONES = [
  { id: "que-es", label: "Qué es Zcash" },
  { id: "transparente-blindada", label: "Transparente o blindada" },
  { id: "como-funciona", label: "Cómo funciona" },
  { id: "orchard-ironwood", label: "Orchard e Ironwood" },
  { id: "cuanto-blindado", label: "Cuánto está blindado" },
  { id: "moneda", label: "La moneda ZEC" },
  { id: "europa", label: "¿Es legal?" },
  { id: "riesgos", label: "Riesgos" },
  { id: "quiz", label: "Quiz" },
];

const FONDOS = [
  { nombre: "Sprout", desde: "Octubre de 2016", ceremonia: "Sí: seis personas", estado: "Congelado desde el 6-11-2026", saldo: "12.224 ZEC" },
  { nombre: "Sapling", desde: "Octubre de 2018", ceremonia: "Sí: una segunda, abierta a voluntarios", estado: "Abierto", saldo: "418.000 ZEC" },
  { nombre: "Orchard", desde: "Mayo de 2022", ceremonia: "No (Halo 2)", estado: "Sellado: solo se sale hacia Ironwood", saldo: "321.000 ZEC" },
  { nombre: "Ironwood", desde: "Julio de 2026", ceremonia: "No", estado: "Abierto", saldo: "4,18 millones de ZEC" },
];

const REPARTO = [
  { cuando: "2016-2020", que: "Recompensa de los fundadores", texto: "El 20 % de cada bloque iba a los fundadores, a la empresa que lo creó y a sus inversores. Fue la crítica más repetida en sus primeros años." },
  { cuando: "2020-2024", que: "Fondo de desarrollo", texto: "El mismo 20 %, repartido: 7 % para Electric Coin Company, 5 % para la Zcash Foundation y 8 % para becas a terceros." },
  { cuando: "Noviembre de 2024", que: "Becas y una hucha cerrada", texto: "El 8 % sigue en becas (Zcash Community Grants). El 12 % pasa a una hucha que nadie puede gastar hasta que se decida cómo." },
  { cuando: "Noviembre de 2025", que: "Lo votan los poseedores", texto: "La hucha se convierte en un fondo que deciden quienes tienen ZEC: votan cada tres meses y una beca necesita al menos 420.000 ZEC participando." },
];

export default async function ZcashPage() {
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
          Qué es Zcash (ZEC)<br />
          <span className="gbc-hero-gold">la privacidad que eliges tú</span>
        </h1>
        <p className="gbc-respuesta">
          <strong>Zcash es una criptomoneda nacida en 2016 que te deja elegir, en cada pago, si es público como
          en Bitcoin o privado.</strong> Con una dirección blindada se ocultan quién paga, quién cobra y cuánto.
          Esa privacidad es opcional, y a noviembre de 2026 solo el 28,9 % de los ZEC está blindado. Tenerla es
          legal en España; comprarla en exchanges europeos puede complicarse desde julio de 2027.
        </p>
        <p className="gbc-revisado">Revisada el <strong>14 de noviembre de 2026</strong> · Datos de red: ZecStats, a 14-11-2026</p>
        <div className="gbc-hero-pills">
          <span className="gbc-pill">Los cuatro tipos de pago, a la vista</span>
          <span className="gbc-pill">El fallo de Orchard, explicado</span>
          <span className="gbc-pill">Quiz con logro</span>
        </div>
      </header>

      {/* ── 1 ── */}
      <section id="que-es" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo básico</div>
          <h2 className="gbc-title">Qué es Zcash y en qué se diferencia de Monero</h2>
          <div className="gbc-body">
            <p>
              Zcash es una <Termino slug="moneda-de-privacidad">moneda de privacidad</Termino>, pero de un tipo
              distinto. Parte del código de <Termino slug="bitcoin">Bitcoin</Termino> y le añade una segunda
              forma de pagar, en la que los datos del pago no se publican. Su moneda se llama ZEC.
            </p>
            <p>
              Si te preguntas qué es Zcash frente a Monero, la diferencia cabe en una palabra: <strong>opcional</strong>.
              En la <Link href="/guias/monero">guía de Monero</Link> verás que allí todo pago es privado y no se
              puede desactivar. En Zcash conviven dos mundos en la misma
              <Termino slug="blockchain"> blockchain</Termino>: direcciones transparentes, que lo enseñan todo, y
              direcciones blindadas, que lo ocultan.
            </p>
            <p>
              La pieza que lo hace posible es una técnica matemática llamada
              <Termino slug="prueba-de-conocimiento-cero"> prueba de conocimiento cero</Termino>. Sale de un
              artículo académico de 2014, Zerocash, firmado por investigadores de varias universidades. La red
              arrancó el 28 de octubre de 2016, impulsada por Zooko Wilcox.
            </p>
            <p>
              Hoy la mantienen varias organizaciones a la vez: la Zcash Foundation, Shielded Labs, ZODL y otros
              grupos financiados con becas. ZODL es el equipo que en enero de 2026 salió de Electric Coin Company;
              hace la <Termino slug="wallet">cartera</Termino> Zodl, antes llamada Zashi. No hay una única empresa
              al mando.
            </p>
          </div>
        </div>
      </section>

      {/* ── 2 ── */}
      <section id="transparente-blindada" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">La diferencia, a la vista</div>
          <h2 className="gbc-title">Direcciones transparentes y blindadas: qué ve cada uno</h2>
          <div className="gbc-body">
            <p>
              Para entender qué es Zcash en la práctica, empieza por sus direcciones. Las transparentes
              empiezan por «t» y funcionan como las de Bitcoin. Las blindadas
              guardan el dinero en lo que Zcash llama un fondo blindado. Desde 2022 las carteras usan además
              direcciones unificadas, que empiezan por «u» y agrupan los dos tipos en una sola.
            </p>
            <p>
              Según de dónde sale el dinero y adónde llega, hay cuatro tipos de operación. Cada uno deja ver
              cosas distintas en el <Termino slug="explorador-de-bloques">explorador de bloques</Termino>:
            </p>
          </div>

          <GuideZcashTransacciones />

          <div className="gbc-tabla-caja" style={{ marginTop: 26 }}>
            <table className="gbc-tabla">
              <thead><tr><th>Tipo</th><th>De dónde a dónde</th><th>Qué se ve</th><th>Qué se oculta</th></tr></thead>
              <tbody>
                <tr><td><strong>Transparente</strong></td><td>t → t</td><td>Emisor, receptor y cantidad</td><td>Nada</td></tr>
                <tr><td><strong>Blindar</strong></td><td>t → z</td><td>Quién mete el dinero y cuánto</td><td>Quién lo recibe dentro</td></tr>
                <tr><td><strong>Blindada</strong></td><td>z → z</td><td>Que existió, la fecha y la comisión</td><td>Emisor, receptor, cantidad y nota</td></tr>
                <tr><td><strong>Desblindar</strong></td><td>z → t</td><td>Quién recibe y cuánto</td><td>De qué dirección blindada salió</td></tr>
              </tbody>
            </table>
          </div>

          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              El error típico está en las dos filas del medio. Si blindas 2,5 ZEC y diez minutos después
              desblindas 2,5 ZEC, la cadena no une las dos operaciones, pero cualquiera puede sospecharlo. La
              privacidad la da mover el dinero <strong>dentro</strong> del fondo blindado, no entrar y salir.
            </p>
            <p>
              Hay una puerta que abres tú. Cada dirección blindada tiene su
              <Termino slug="clave-de-visualizacion"> clave de visualización</Termino>: quien la tenga puede ver
              tus operaciones, pero no gastar. Sirve para enseñarle tus cuentas a un asesor o a una auditoría sin
              hacerlas públicas para todos.
            </p>
            {/* EXPERIENCIA DEL ADMIN: aquí encaja una operación real (blindar ZEC desde un exchange a una cartera propia, qué dirección pidió el exchange, cuánto tardó y qué se veía después en el explorador). Sin ella, esta sección no tiene experiencia de primera mano. */}
          </div>
        </div>
      </section>

      {/* ── 3 ── */}
      <section id="como-funciona" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Cómo funciona</div>
          <h2 className="gbc-title">Cómo funciona Zcash: pruebas de conocimiento cero y la ceremonia</h2>
          <div className="gbc-body">
            <p>
              La mitad de la respuesta a qué es Zcash es matemática. Una prueba de conocimiento cero demuestra
              que algo es cierto sin enseñar por qué. El ejemplo de
              siempre: probar que eres mayor de edad sin enseñar tu fecha de nacimiento. En Zcash, cada pago
              blindado lleva una prueba que dice «este dinero existe, es de quien lo gasta y no se ha gastado
              antes». La red lo comprueba sin ver la cantidad ni las direcciones.
            </p>
            <p>
              La variante que usa se llama zk-SNARK: pruebas cortas que la red verifica en milisegundos. Las primeras tenían un precio. Para crearlas hacía falta una
              <Termino slug="configuracion-de-confianza"> configuración de confianza</Termino>: una ceremonia que
              fabrica unos parámetros y debe destruir después las claves usadas para hacerlos.
            </p>
            <p>
              Si alguien hubiera guardado esas claves, podría fabricar ZEC falsos dentro del fondo blindado, y
              nadie lo vería. En octubre de 2016 la ceremonia la hicieron seis personas en lugares distintos;
              bastaba con que una destruyera su parte. Una firmaba como «John Dobbertin», y en 2022 se supo
              que era Edward Snowden. En 2018 se repitió para Sapling, esta vez abierta a voluntarios de todo
              el mundo.
            </p>
            <p>
              El paso que lo cambió todo llegó el 31 de mayo de 2022, con la actualización NU5. Su nuevo fondo,
              Orchard, usa un sistema de pruebas llamado Halo 2, que no necesita ceremonia. Cada actualización de
              este tipo es un <Termino slug="hard-fork">hard fork</Termino> pactado, y desde entonces ya no hay que
              confiar en que nadie guardó una copia.
            </p>
          </div>

          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Fondo blindado</th><th>Desde</th><th>¿Ceremonia?</th><th>Estado</th><th>Saldo</th></tr></thead>
              <tbody>
                {FONDOS.map((f) => (
                  <tr key={f.nombre}>
                    <td><strong>{f.nombre}</strong></td>
                    <td>{f.desde}</td>
                    <td>{f.ceremonia}</td>
                    <td>{f.estado}</td>
                    <td>{f.saldo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Saldos de ZecStats a 14 de noviembre de 2026. Fechas de activación: anuncios de cada actualización
            (NU5, NU6.3 y NU7).
          </p>
        </div>
      </section>

      {/* ── Anuncio de media guía ── */}
      <GuiaAnuncio producto="portfolio" variante="compacto" estado={d.estado} />

      {/* ── 4 ── */}
      <section id="orchard-ironwood" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que pasó en 2026</div>
          <h2 className="gbc-title">El fallo de Orchard y la salida por Ironwood</h2>
          <div className="gbc-body">
            <p>
              Quitar la ceremonia no quitó todos los riesgos. El 29 de mayo de 2026, Taylor Hornby, un
              investigador independiente que revisaba Orchard por encargo de Shielded Labs, encontró un fallo en
              su circuito de pruebas. Permitía crear ZEC de la nada
              sin dejar rastro, y llevaba abierto desde 2022, unos cuatro años.
            </p>
            <p>
              Se corrigió en pocos días, con una actualización de urgencia a primeros de junio. Lo difícil era
              otra pregunta: ¿alguien lo había usado antes? La Zcash Foundation dijo no haber encontrado indicios
              de ello. Pero probar que nunca se fabricó una moneda falsa es imposible en un fondo donde las
              cantidades no se ven, y los propios desarrolladores lo reconocieron.
            </p>
            <p>
              La respuesta fue Ironwood, la actualización NU6.3, activada el 28 de julio de 2026 en el bloque
              3.428.143. Abre un fondo blindado nuevo y sella Orchard: ya no recibe pagos, y solo se puede salir
              de él hacia Ironwood. Esa salida pasa por un <strong>torniquete</strong>, una regla de contabilidad
              que no deja sacar más ZEC de los que entraron de forma verificable.
            </p>
            <p>
              Si alguien hubiera fabricado monedas falsas, se quedarían atrapadas dentro. El precio es que cada
              dueño tiene que mover sus ZEC por su cuenta, y que la cantidad que cruza de un fondo a otro queda a la
              vista. Al activarse, Orchard guardaba más de 3,6 millones de ZEC; a 14 de noviembre quedaban 321.000.
            </p>
          </div>
          <div className="gbc-box gbc-box--gold">
            <div className="gbc-box-title">Ya había pasado una vez</div>
            <div className="gbc-box-body">
              <p>En marzo de 2018, Ariel Gabizon, ingeniero de la empresa que creó Zcash, encontró otro fallo de
              falsificación, en las pruebas del fondo original. Se arregló en silencio con Sapling, en octubre de
              2018, y se hizo público el 5 de febrero de 2019. Tampoco se encontraron indicios de que se usara. Dos
              fallos en ocho años, los dos hallados por gente que trabajaba para el proyecto, es lo que tienes que
              saber antes de comprar.</p>
            </div>
          </div>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Mover los fondos también tiene fecha de caducidad. La actualización NU7, activada el 6 de noviembre
              de 2026, dejó de aceptar el formato de operación que usaba Sprout, el fondo de 2016. Los 12.224 ZEC
              que nadie había sacado se quedaron sin poder gastarse. No se han destruido: la propuesta deja
              abierta la posibilidad de devolver el acceso algún día, sin fecha ni compromiso.
            </p>
          </div>
        </div>
      </section>

      {/* ── 5 ── */}
      <section id="cuanto-blindado" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">El dato que importa</div>
          <h2 className="gbc-title">¿Cuánto ZEC está blindado de verdad, y por qué te afecta?</h2>
          <div className="gbc-body">
            <p>
              Ninguna explicación de qué es Zcash está completa sin este número. A 14 de noviembre de 2026,
              según ZecStats, hay 4,93 millones de ZEC en fondos blindados. Son el
              28,9 % de los 17,04 millones que existen. El otro 71 % está en direcciones transparentes, a la vista
              como en Bitcoin.
            </p>
          </div>
          <div className="zec-barra" role="img" aria-label="El 28,9 % de los ZEC está blindado y el 71,1 % es transparente">
            <div className="zec-barra-blindado" style={{ width: "28.9%" }}><span>28,9 % blindado</span></div>
            <div className="zec-barra-transparente"><span>71,1 % transparente</span></div>
          </div>
          <p className="gbc-fuente">Fuente: ZecStats, 14 de noviembre de 2026. Ironwood guarda el 85 % de lo blindado.</p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Te afecta por una razón sencilla: en privacidad, te escondes entre los demás. Ese grupo se llama
              <Termino slug="conjunto-de-anonimato"> conjunto de anonimato</Termino>, y cuanto más grande, mejor.
              Si casi nadie blinda, los pocos que lo hacen destacan, y es más fácil relacionar lo que entra con lo
              que sale.
            </p>
            <p>
              Es la crítica que se le hace desde Monero, donde todo pago es privado y el grupo es la red entera. La
              respuesta de Zcash es que su grupo, cuando usas Ironwood, son más de cuatro millones de ZEC
              mezclados entre sí, en vez de las dieciséis salidas por firma de Monero. Las dos cosas son ciertas, y
              miden cosas distintas.
            </p>
            <p>
              La parte opcional tiene también su lado práctico. Las carteras modernas, como Zodl, blindan por
              defecto lo que reciben. Y la parte transparente es la que permite a cada <Termino slug="exchange">exchange</Termino> y a
              los <Termino slug="etp">fondos cotizados</Termino> trabajar con ZEC sin tocar la privacidad: por ahí ha entrado el dinero institucional.
            </p>
            <p>
              Lo que no cambia es la <Termino slug="fungibilidad">fungibilidad</Termino>. Un ZEC con historial
              transparente sí arrastra su pasado, igual que un bitcoin. Solo deja de arrastrarlo cuando pasa un
              tiempo dentro del fondo blindado.
            </p>
          </div>
        </div>
      </section>

      {/* ── 6 ── */}
      <section id="moneda" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">La moneda</div>
          <h2 className="gbc-title">Cuántos ZEC habrá: 21 millones, halvings y el reparto del bloque</h2>
          <div className="gbc-body">
            <p>
              En lo económico, Zcash copia a Bitcoin más de lo que parece. Usa
              <Termino slug="prueba-de-trabajo"> prueba de trabajo</Termino>, con un algoritmo llamado Equihash,
              tiene un tope de 21 millones y reduce su emisión a la mitad cada cuatro años, con su
              propio <Termino slug="halving">halving</Termino>. La diferencia está en quién cobra cada bloque.
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th></th><th>Bitcoin</th><th>Zcash</th></tr></thead>
              <tbody>
                <tr><td><strong>Tope de monedas</strong></td><td>21 millones</td><td>21 millones</td></tr>
                <tr><td><strong>Emitidas</strong></td><td>Cerca de 20 millones</td><td>17,04 millones (14-11-2026)</td></tr>
                <tr><td><strong>Un bloque cada</strong></td><td>10 minutos</td><td>25 segundos (desde el 6-11-2026; antes, 75)</td></tr>
                <tr><td><strong>Recompensa por bloque</strong></td><td>3,125 BTC</td><td>0,52 ZEC, unos 1.800 ZEC al día</td></tr>
                <tr><td><strong>Halvings</strong></td><td>2012, 2016, 2020, 2024</td><td>Noviembre de 2020 y de 2024; el próximo, hacia noviembre de 2028</td></tr>
                <tr><td><strong>Quién cobra el bloque</strong></td><td>El <Termino slug="minero">minero</Termino>, entero</td><td>El minero, el 80 %; el 20 %, el desarrollo</td></tr>
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Fuentes: ZecStats (oferta y tiempo de bloque, 14-11-2026) y los anuncios de NU7 (noviembre de 2026).
            Con NU7 los bloques salen tres veces más rápido y pagan un tercio, así que la emisión diaria no cambia.
          </p>

          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Ese 20 % para el desarrollo es la seña de identidad de Zcash, y la fuente de casi todas sus
              discusiones. Ha pasado por cuatro etapas:
            </p>
          </div>
          <ol className="zec-reparto">
            {REPARTO.map((r) => (
              <li key={r.cuando}>
                <span>{r.cuando}</span>
                <strong>{r.que}</strong>
                <p>{r.texto}</p>
              </li>
            ))}
          </ol>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              El modelo actual dura hasta el tercer halving, hacia noviembre de 2028, y ya se discute qué viene
              después. El 30 de octubre de 2026, Sean Bowe y Zooko Wilcox propusieron llevar el 8 % de las becas a
              otra hucha cerrada. A 14 de noviembre la propuesta sigue abierta y sin fecha.
            </p>
            <p>
              NU7 añadió una pieza más: el 60 % de las comisiones de cada operación sale de la circulación, y el
              minero se queda el resto. Ese dinero no se destruye: según la votación de los poseedores, volverá a
              emitirse como recompensa a partir de 2031. Es la forma de que la seguridad de la red no dependa solo
              de una emisión que se va reduciendo.
            </p>
          </div>
        </div>
      </section>

      {/* ── 7 ── */}
      <section id="europa" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Desde España</div>
          <h2 className="gbc-title">¿Es legal Zcash en España? Lo que cambia en 2027</h2>
          <div className="gbc-body">
            <p>
              Sí: tener ZEC en una cartera propia y enviarlo es legal. El
              Reglamento (UE) 2024/1624 prohíbe, desde el 10 de julio de 2027, que exchanges y custodios de la UE
              operen con monedas que refuerzan el anonimato; la <Link href="/guias/monero">guía de Monero</Link>
              explica la norma entera.
            </p>
            <p>
              Lo propio de Zcash es que su privacidad se puede no usar, y eso le ha dado más margen que a Monero.
              Tres hechos lo muestran:
            </p>
            <ul>
              <li>
                <strong>Junio de 2023.</strong> Binance anunció que dejaría de ofrecer monedas de privacidad en
                España, Francia, Italia y Polonia. El 26 de junio rectificó y Zcash se quedó.
              </li>
              <li>
                <strong>Enero de 2024.</strong> OKX la retiró, junto con Monero y Dash.
              </li>
              <li>
                <strong>Septiembre de 2026.</strong> Según la prensa especializada, las plataformas que la ofrecen
                en Europa trabajan solo con direcciones transparentes, y SwissBorg la añadió ese mes.
              </li>
            </ul>
            <p>
              La pregunta abierta es si ZEC cuenta como «moneda que refuerza el anonimato» cuando un exchange
              solo toca su parte transparente. A noviembre de 2026 no
              hemos encontrado una lista oficial europea que lo aclare. Si la normativa la incluye, lo normal es que
              la vía regulada para cambiar euros por ZEC se cierre como se está cerrando para Monero.
            </p>
            <p>
              En Estados Unidos ha pasado lo contrario. Grayscale convirtió su fondo de Zcash en un ETF, con el
              símbolo ZCSH, que cotiza desde el 25 de agosto de 2026. A 18 de septiembre guardaba unos 596.000
              ZEC, cerca del 3,5 % de todos los emitidos, según Crypto Briefing. Desde España, en general, un minorista no puede comprar ETF
              estadounidenses: les falta el documento de datos fundamentales que exige la normativa europea.
            </p>
          </div>
          <div className="gbc-box gbc-box--gold">
            <div className="gbc-box-title">Zcash y Hacienda: lo que tributa y lo que no</div>
            <div className="gbc-box-body">
              <p>Blindar o desblindar tus propios ZEC es mover dinero entre direcciones tuyas: no es una venta y
              no tributa. Sí tributa cambiar ZEC por euros o por otra criptomoneda. Además, desde el 1 de enero de
              2026 los exchanges de la UE recogen los datos de las operaciones de sus clientes para enviarlos a
              Hacienda, por la directiva DAC8: lo que pase por ellos le llegará igual.</p>
              <p>Si un día tienes que justificar de dónde salen unos ZEC que pasaron por el fondo blindado, tu
              prueba es la clave de visualización: enseña tus movimientos sin dar acceso al dinero. Lo que sí
              tienes que apuntar tú es el precio en euros de cada cambio de ZEC por otra cosa. Cómo se calcula la
              ganancia lo explica la guía de
              <Link href="/guias/fiscalidad-cripto-espana"> fiscalidad de las criptomonedas en España</Link>.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8 ── */}
      <section id="riesgos" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que puede salir mal</div>
          <h2 className="gbc-title">Los riesgos de Zcash</h2>
          <div className="gbc-body">
            <ul>
              <li><strong>La criptografía puede fallar.</strong> Ha pasado dos veces, en 2018 y en 2026. Las dos se cerraron sin indicios de abuso, pero en un fondo blindado nadie puede demostrar que no lo hubo.</li>
              <li><strong>La salida europea puede cerrarse.</strong> Desde julio de 2027, si los supervisores la tratan como moneda de anonimato, se irá la <Termino slug="liquidez">liquidez</Termino> en euros.</li>
              <li><strong>La privacidad depende de ti.</strong> Blindar y desblindar la misma cantidad en poco tiempo, o usar direcciones transparentes por comodidad, te deja a la vista.</li>
              <li><strong>Las migraciones dejan monedas atrás.</strong> NU7 dejó 12.224 ZEC de Sprout sin poder gastarse. Si guardas ZEC en una cartera antigua, sigue las actualizaciones.</li>
              <li><strong>La gobernanza está en discusión.</strong> En 2026 el equipo de la cartera principal salió de su empresa, y el reparto del 20 % del bloque se renegocia hasta 2028.</li>
              <li><strong>El precio.</strong> Su <Termino slug="volatilidad">volatilidad</Termino> es extrema: tras conocerse el fallo de Orchard, en junio de 2026, cayó de casi 600 a unos 300 dólares en dos días, y el 14 de noviembre rondaba los 880, según ZecStats.</li>
            </ul>
          </div>
          <div className="gbc-box">
            <div className="gbc-box-title">Qué es Zcash, en cinco líneas</div>
            <div className="gbc-box-body">
              <ul>
                <li>Una criptomoneda de 2016 con pagos públicos y pagos privados en la misma red.</li>
                <li>Lo privado se consigue con pruebas de conocimiento cero, y desde 2022 sin ceremonia.</li>
                <li>Solo el 28,9 % de los ZEC está blindado: la privacidad es real si la usas bien.</li>
                <li>Tope de 21 millones y halvings cada cuatro años, con un 20 % del bloque para el desarrollo.</li>
                <li>Legal en España; su sitio en los exchanges europeos se decide antes de julio de 2027.</li>
              </ul>
            </div>
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
          <h2 className="gbc-title">Comprueba si has entendido qué es Zcash</h2>
          <div className="gbc-body" style={{ marginBottom: 32 }}>
            <p>Cinco preguntas con casos prácticos sobre qué es Zcash y cómo se usa. Con las cinco acertadas desbloqueas el logro <strong style={{ color: "var(--gold)" }}>Prueba Silenciosa</strong>.</p>
          </div>
          {d.isRegistered ? <GuideZcashQuiz /> : <GuideQuizCuenta slug={SLUG} />}
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
