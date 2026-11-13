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
import GuideMoneroObservador from "./GuideMoneroObservador";
import GuideMoneroQuiz from "./GuideMoneroQuiz";
import "./monero.css";

/**
 * Guía «Qué es Monero» (13-11-2026). Consulta objetivo: «qué es monero».
 *
 * Está montada como una lista de afirmaciones que se oyen sobre Monero, cada
 * una con su veredicto. Lo que tiene y las demás no: un comparador de lo que ve
 * un observador en Bitcoin y en Monero, la situación legal en la UE con fecha y
 * artículo (AMLR, art. 79, 10 de julio de 2027) y lo que eso supone al
 * declarar en España.
 *
 * Al revisarla: el estado de la norma europea y de la mejora FCMP++, y qué
 * exchanges europeos la siguen ofreciendo.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/guias/monero" },
  title: "Qué es Monero (XMR) y si es legal en España",
  description:
    "Qué es Monero y cómo oculta emisor, receptor y cantidad. Qué hay de cierto en lo que se dice de XMR, su situación legal en la UE y cómo se declara en España.",
  openGraph: {
    title: "Qué es Monero (XMR): privacidad, mitos y situación legal en Europa",
    description:
      "Qué ve un observador en Bitcoin y qué ve en Monero, siete afirmaciones con su veredicto, la norma europea que llega en 2027 y Hacienda. Con quiz.",
    type: "article",
  },
};

const SLUG = "monero";

const SECCIONES = [
  { id: "que-es", label: "Qué es" },
  { id: "que-oculta", label: "Qué oculta" },
  { id: "como-lo-hace", label: "Cómo lo hace" },
  { id: "afirmaciones", label: "Verdadero o falso" },
  { id: "legal", label: "¿Es legal?" },
  { id: "moneda", label: "La moneda XMR" },
  { id: "hacienda", label: "Hacienda" },
  { id: "riesgos", label: "Riesgos" },
  { id: "quiz", label: "Quiz" },
];

const TECNICAS = [
  { oculta: "Quién envía", nombre: "Firmas en anillo", texto: "Tu operación se firma junto con otras quince salidas reales tomadas de la cadena. Desde fuera, cualquiera de las dieciséis pudo ser la que pagó." },
  { oculta: "Quién recibe", nombre: "Direcciones de un solo uso", texto: "Tu dirección pública no aparece nunca en la cadena. Cada pago va a una dirección nueva, creada para esa operación, que solo tú sabes reconocer como tuya." },
  { oculta: "Cuánto", nombre: "Transacciones confidenciales", texto: "La cantidad viaja cifrada. La red comprueba con matemáticas que no se ha creado dinero de la nada, sin llegar a ver la cifra." },
];

type Veredicto = "cierto" | "falso" | "a-medias";
const AFIRMACIONES: { frase: string; veredicto: Veredicto; texto: string }[] = [
  { frase: "«Monero es imposible de rastrear»", veredicto: "a-medias", texto: "Es, con diferencia, la criptomoneda grande más difícil de seguir. Imposible es otra cosa. Un vídeo interno de la empresa de análisis Chainalysis, filtrado en 2024, mostraba cómo podían acotar operaciones cuando el usuario se conectaba a servidores controlados por ellos. La cadena protege; lo que haces alrededor, no." },
  { frase: "«Solo la usan delincuentes»", veredicto: "falso", texto: "Se usa en mercados ilegales, y negarlo sería mentir. Pero el grueso del dinero ilícito en criptomonedas se mueve en stablecoins, que son públicas. La privacidad financiera es lo normal fuera de aquí: nadie ve el saldo de tu cuenta bancaria." },
  { frase: "«Tener Monero es ilegal en España»", veredicto: "falso", texto: "Tenerla, recibirla y enviarla desde tu propia cartera es legal. Lo que está cambiando es otra cosa: dónde puedes comprarla y venderla." },
  { frase: "«Se mina con un ordenador normal»", veredicto: "cierto", texto: "Su algoritmo, RandomX, está diseñado para los procesadores corrientes y penaliza las máquinas especializadas. Minar es posible con un portátil. Que sea rentable depende de lo que pagues por la luz, y en España rara vez lo es." },
  { frase: "«Como Bitcoin, tiene un máximo de monedas»", veredicto: "falso", texto: "No lo tiene. Desde junio de 2022 se crean 0,6 XMR por bloque, para siempre. Es una inflación pequeña y decreciente en porcentaje, pensada para que siempre haya con qué pagar a los mineros." },
  { frase: "«Nadie puede atacar su red»", veredicto: "falso", texto: "En agosto y septiembre de 2025, un proyecto llamado Qubic concentró gran parte de la potencia de minado y reescribió 18 bloques, unos 36 minutos de historial. Varios exchanges pausaron los depósitos." },
  { frase: "«Con Monero Hacienda no se entera»", veredicto: "falso", texto: "La obligación de declarar no depende de que te vean. Y casi siempre se entra y se sale por un sitio que sí te identifica. Más abajo tienes el detalle." },
];

const ROTULO: Record<Veredicto, string> = { cierto: "Cierto", falso: "Falso", "a-medias": "A medias" };

export default async function MoneroPage() {
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
          Qué es Monero (XMR)<br />
          <span className="gbc-hero-gold">y qué hay de cierto en lo que se dice</span>
        </h1>
        <p className="gbc-respuesta">
          <strong>Monero es una criptomoneda diseñada para que nadie pueda ver quién paga, quién cobra ni
          cuánto.</strong> En Bitcoin todo eso es público. En Monero queda oculto por defecto, en todas las
          operaciones. Tenerla es legal en España, pero comprarla y venderla en Europa es cada vez más difícil,
          y en julio de 2027 lo será más.
        </p>
        <p className="gbc-revisado">Revisada el <strong>13 de noviembre de 2026</strong> · Marco legal: Reglamento (UE) 2024/1624</p>
        <div className="gbc-hero-pills">
          <span className="gbc-pill">Bitcoin frente a Monero, a la vista</span>
          <span className="gbc-pill">Siete afirmaciones, con veredicto</span>
          <span className="gbc-pill">Quiz con logro</span>
        </div>
      </header>

      {/* ── 1 ── */}
      <section id="que-es" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo básico</div>
          <h2 className="gbc-title">Qué es Monero y qué problema resuelve</h2>
          <div className="gbc-body">
            <p>
              Mucha gente cree que Bitcoin es anónimo. No lo es. Su
              <Termino slug="blockchain"> blockchain</Termino> es un libro abierto: cualquiera puede consultar
              todas las operaciones de la historia, con su origen, su destino y su importe. Lo único que no
              aparece es tu nombre, y eso dura hasta que alguien une una dirección contigo.
            </p>
            <p>
              Pasa más de lo que parece. Le das tu dirección a alguien para que te pague, y esa persona puede
              ver cuánto tienes y qué haces con ello. Si compraste en un
              <Termino slug="exchange"> exchange</Termino> con tu DNI, el exchange sabe adónde fue cada moneda que
              retiraste.
            </p>
            <p>
              Monero nació en abril de 2014 para cerrar esa ventana. Su nombre significa «moneda» en esperanto.
              No tiene empresa detrás ni fundador conocido: la mantiene un grupo de desarrolladores y se
              financia con donaciones de su comunidad. Su moneda se abrevia XMR.
            </p>
          </div>
        </div>
      </section>

      {/* ── 2 ── */}
      <section id="que-oculta" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">La diferencia, a la vista</div>
          <h2 className="gbc-title">Qué ve un observador en Bitcoin y qué ve en Monero</h2>
          <div className="gbc-body">
            <p>
              La forma más rápida de entenderlo es mirar la misma operación en las dos redes. Ana le paga a
              Luis. Un tercero, que no conoce a ninguno, consulta el
              <Termino slug="explorador-de-bloques"> explorador de bloques</Termino>. Cambia de red y mira qué
              encuentra:
            </p>
          </div>

          <GuideMoneroObservador />

          <div className="gbc-body" style={{ marginTop: 26 }}>
            <p>
              La palabra clave es <strong>por defecto</strong>. Otras monedas ofrecen privacidad como una
              opción que se activa. Si es opcional, casi nadie la usa, y quien la usa destaca. En Monero no se
              puede desactivar, así que todas las operaciones se parecen entre sí.
            </p>
            <p>
              De ahí sale una propiedad que tiene nombre: fungibilidad. Significa que una moneda vale
              exactamente lo mismo que otra, porque ninguna arrastra historial. Un billete de 20 euros es
              fungible. Un bitcoin que pasó por una dirección marcada puede ser rechazado por un exchange. Un
              monero, no: nadie sabe por dónde pasó.
            </p>
          </div>
        </div>
      </section>

      {/* ── 3 ── */}
      <section id="como-lo-hace" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Cómo funciona</div>
          <h2 className="gbc-title">Cómo funciona Monero: tres técnicas, una para cada dato</h2>
          <div className="gbc-body">
            <p>No hay un único truco. Hay tres, y cada uno tapa una de las tres cosas que Bitcoin enseña.</p>
          </div>
          <div className="xmr-tecnicas">
            {TECNICAS.map((t) => (
              <div key={t.nombre}>
                <span className="xmr-tecnica-oculta">Oculta: {t.oculta}</span>
                <strong>{t.nombre}</strong>
                <p>{t.texto}</p>
              </div>
            ))}
          </div>
          <div className="gbc-body" style={{ marginTop: 26 }}>
            <p>
              La primera es la más débil de las tres. Dieciséis candidatos son pocos, y con suficiente
              información de fuera se pueden ir descartando. Por eso el proyecto lleva años preparando un
              cambio de fondo, conocido como FCMP++, que sustituiría el grupo de dieciséis por todas las
              salidas que han existido en la cadena. En octubre de 2026 seguía en fase de pruebas, sin fecha
              para la red principal.
            </p>
            <p>
              Hay además una puerta que se abre desde dentro. Cada cartera tiene una clave de visualización:
              si se la das a alguien, puede ver lo que has recibido, pero no gastarlo. Sirve para que un
              asesor, un auditor o una administración comprueben tus cuentas. La privacidad de Monero es
              tuya, y tú decides a quién se la levantas.
            </p>
          </div>
        </div>
      </section>

      {/* ── Anuncio de media guía ── */}
      <GuiaAnuncio producto="cursos" variante="compacto" estado={d.estado} />

      {/* ── 4 ── */}
      <section id="afirmaciones" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que se dice</div>
          <h2 className="gbc-title">Siete cosas que se dicen de Monero, y cuáles son verdad</h2>
          <div className="gbc-body">
            <p>Pocas criptomonedas arrastran tantas frases hechas, a favor y en contra. Aquí van las siete más repetidas.</p>
          </div>
          <div className="xmr-afirmaciones">
            {AFIRMACIONES.map((a) => (
              <div key={a.frase} className={`xmr-afirmacion xmr-afirmacion--${a.veredicto}`}>
                <div className="xmr-afirmacion-cab">
                  <p className="xmr-afirmacion-frase">{a.frase}</p>
                  <span className="xmr-veredicto">{ROTULO[a.veredicto]}</span>
                </div>
                <p>{a.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5 ── */}
      <section id="legal" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Desde España</div>
          <h2 className="gbc-title">¿Es legal Monero en España y en la Unión Europea?</h2>
          <div className="gbc-body">
            <p>
              Sí. Ninguna ley española ni europea prohíbe a un particular tener Monero. Lo que la regulación
              está cerrando no es la moneda: son las puertas de entrada y de salida, es decir, las empresas.
            </p>
            <p>Ha ocurrido en tres pasos, y el tercero aún no ha llegado.</p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th>Cuándo</th><th>Qué pasó</th><th>Qué supone para ti</th></tr></thead>
              <tbody>
                <tr><td><strong>Febrero de 2024</strong></td><td>Binance retira Monero en todo el mundo</td><td>Se va el mercado con más volumen</td></tr>
                <tr><td><strong>Octubre de 2024</strong></td><td>Kraken deja de ofrecerla en el Espacio Económico Europeo</td><td>Se va el principal exchange regulado que la vendía en euros</td></tr>
                <tr><td><strong>10 de julio de 2027</strong></td><td>Empieza a aplicarse el reglamento europeo contra el blanqueo</td><td>Ningún exchange ni custodio de la UE podrá operar con monedas de anonimato reforzado</td></tr>
              </tbody>
            </table>
          </div>
          <p className="gbc-fuente">
            Tercera fila: artículo 79 del Reglamento (UE) 2024/1624, que prohíbe a los proveedores de servicios
            de criptoactivos mantener cuentas con monedas que refuerzan el anonimato.
          </p>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              Conviene leer bien a quién obliga esa norma. Obliga a las empresas: exchanges, custodios, bancos.
              No convierte en delito que tú tengas XMR en una <Termino slug="wallet">cartera</Termino> propia, ni
              que se lo envíes a otra persona.
            </p>
            <p>
              El efecto práctico es otro, y ya se nota. Cambiar euros por Monero, o al revés, por una vía
              regulada es cada vez más difícil. Quedan los intercambios entre particulares y los servicios de
              fuera de la UE, con menos garantías y precios peores. Si la compras, piensa primero por dónde vas
              a salir.
            </p>
          </div>
        </div>
      </section>

      {/* ── 6 ── */}
      <section id="moneda" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">La moneda</div>
          <h2 className="gbc-title">Cómo se crea XMR: minería para todos y emisión sin fin</h2>
          <div className="gbc-body">
            <p>
              Monero usa <Termino slug="prueba-de-trabajo">prueba de trabajo</Termino>, como Bitcoin: los
              mineros compiten con cálculo y quien acierta añade el bloque. Sale uno cada dos minutos. Las
              diferencias están en dos decisiones de diseño.
            </p>
          </div>
          <div className="gbc-tabla-caja">
            <table className="gbc-tabla">
              <thead><tr><th></th><th>Bitcoin</th><th>Monero</th></tr></thead>
              <tbody>
                <tr><td><strong>Con qué se mina</strong></td><td>Máquinas especializadas, en naves industriales</td><td>Procesadores corrientes: el algoritmo RandomX, desde 2019</td></tr>
                <tr><td><strong>Cuántas monedas habrá</strong></td><td>21 millones como máximo</td><td>Sin tope: 0,6 XMR por bloque para siempre, desde junio de 2022</td></tr>
                <tr><td><strong>Cuántas hay</strong></td><td>Cerca de 20 millones</td><td>Unos 18,5 millones</td></tr>
                <tr><td><strong>Inflación anual</strong></td><td>Por debajo del 1 %, y bajando hasta cero</td><td>Por debajo del 1 %, y bajando poco a poco sin llegar a cero</td></tr>
              </tbody>
            </table>
          </div>
          <div className="gbc-body" style={{ marginTop: 24 }}>
            <p>
              La emisión perpetua tiene una razón. Cuando Bitcoin deje de crear monedas, sus mineros vivirán
              solo de las comisiones, y nadie sabe si bastará. Monero optó por garantizar un pago mínimo para
              siempre, a cambio de una <Termino slug="inflacion">inflación</Termino> pequeña.
            </p>
            <p>
              Lo de minar con cualquier ordenador también tiene su cruz. Como no hacen falta máquinas caras,
              la potencia de la red es modesta, y alquilarla o reunirla no es imposible. Es lo que explica el
              episodio de 2025: la seguridad de una red así depende de que nadie junte más de la mitad del
              <Termino slug="hash-rate"> hash rate</Termino>.
            </p>
          </div>
        </div>
      </section>

      {/* ── 7 ── */}
      <section id="hacienda" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">El error típico</div>
          <h2 className="gbc-title">Monero y Hacienda: el error de pensar que no cuenta</h2>
          <div className="gbc-body">
            <p>
              El error más caro con Monero no es técnico. Es creer que, como no se ve, no se declara. La ley no
              distingue entre monedas públicas y privadas: una ganancia al vender tributa igual con XMR que con
              cualquier otra.
            </p>
            <p>
              Y en la práctica casi nunca es invisible. Los euros salieron de tu banco hacia algún sitio. Si
              compraste otra criptomoneda en un exchange y la cambiaste por Monero, ese cambio es una venta, y
              el exchange la tiene registrada. Cuando vuelvas a euros, alguien te preguntará de dónde vienen.
            </p>
            <p>
              Aquí la privacidad juega en tu contra. Con Bitcoin puedes demostrar tu historial con la propia
              cadena. Con Monero tienes que haberlo guardado tú: fecha, cantidad y valor en euros de cada
              compra y cada venta. Sin ese registro no puedes calcular tu ganancia ni justificar el origen del
              dinero ante un banco.
            </p>
          </div>
          <div className="gbc-box gbc-box--gold">
            <div className="gbc-box-title">Lo que conviene guardar desde el primer día</div>
            <div className="gbc-box-body">
              <p>Justificante de cada compra y cada venta, con fecha y valor en euros. Y las claves de
              visualización de tus carteras, que permiten probar lo recibido si te lo piden. El método de
              cálculo está en la guía de
              <Link href="/guias/fiscalidad-cripto-espana"> fiscalidad de las criptomonedas en España</Link>.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8 ── */}
      <section id="riesgos" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Lo que puede salir mal</div>
          <h2 className="gbc-title">Los riesgos de Monero</h2>
          <div className="gbc-body">
            <ul>
              <li><strong>La salida se estrecha.</strong> Cada exchange que la retira reduce la <Termino slug="liquidez">liquidez</Termino>. Desde julio de 2027 no quedará ninguno regulado en la UE.</li>
              <li><strong>La regulación puede ir a más.</strong> Hoy obliga a las empresas. Nada garantiza que se quede ahí.</li>
              <li><strong>Su red ya ha sido reorganizada.</strong> Lo de 2025 demostró que su potencia de minado no es inalcanzable.</li>
              <li><strong>Un fallo oculto sería difícil de ver.</strong> Como las cantidades van cifradas, un error que permitiera crear monedas podría pasar más tiempo sin detectarse que en una cadena pública.</li>
              <li><strong>La privacidad no es total.</strong> Tu conexión, el servidor al que te conectas y lo que haces antes y después dejan rastro.</li>
              <li><strong>El precio.</strong> Su <Termino slug="volatilidad">volatilidad</Termino> es la de cualquier criptomoneda, agravada por un mercado cada vez más pequeño.</li>
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
          <h2 className="gbc-title">Comprueba lo que sabes de Monero</h2>
          <div className="gbc-body" style={{ marginBottom: 32 }}>
            <p>Cinco preguntas. Con las cinco acertadas desbloqueas el logro <strong style={{ color: "var(--gold)" }}>Sobre Cerrado</strong>.</p>
          </div>
          {d.isRegistered ? <GuideMoneroQuiz /> : <GuideQuizCuenta slug={SLUG} />}
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
