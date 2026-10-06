import Link from "next/link";
import { AlertTriangle } from "lucide-react";

/**
 * Descargo de responsabilidad de las herramientas de la academia.
 *
 * **Fuente única a propósito.** Un aviso legal repartido a mano por varias
 * páginas acaba diciendo cosas distintas en cada una, y entonces no protege:
 * la defensa de «lo advertí» se cae si en una página lo advertiste y en otra
 * no. Antes había dos avisos de una línea sueltos —en Mi Portfolio y en el
 * Radar— que decían mucho menos que este; ahora todos pasan por aquí.
 *
 * Cada variante añade lo específico de su herramienta, pero **todas cierran
 * con el mismo bloque de responsabilidad** (ver `RESPONSABILIDAD`), que es
 * innegociable: es el que deja por escrito que decidir es cosa de quien lee.
 *
 * ⚠️ NO ES ASESORAMIENTO JURÍDICO. Cubre lo evidente —no es recomendación,
 * resultados pasados, riesgo de pérdida total, ausencia de registro como
 * asesor, responsabilidad del usuario— pero **debe revisarlo un abogado**,
 * sobre todo por la normativa sobre promoción de criptoactivos, que es
 * específica y cambia. Ojo al doble frente desde que el titular opera desde
 * Rumanía (06-09-2026): manda MiCA a nivel europeo y la autoridad rumana (ASF)
 * en el país de establecimiento, pero **el público objetivo es español**, así
 * que las reglas de publicidad de la CNMV siguen siendo relevantes por ser a
 * quien se dirige la comunicación.
 */

export type VarianteAviso = "portfolio" | "directo" | "diario" | "general" | "fiscal";
type Variante = VarianteAviso;

/**
 * El bloque que va en TODAS las variantes, sin excepción.
 *
 * Lo pidió el admin el 05-09-2026 y responde a un riesgo concreto: que alguien
 * copie una operación, pierda dinero y sostenga que esto era un servicio de
 * señales. Aquí queda dicho que no lo es y que la decisión es suya.
 */
function Responsabilidad() {
  return (
    <>
      <p>
        <strong>Tú decides y tú respondes.</strong> El uso que hagas de
        cualquier información publicada en esta web —cifras, operaciones,
        análisis, estadísticas o herramientas— es{" "}
        <strong>responsabilidad exclusivamente tuya</strong>. Ninguna decisión
        de inversión que tomes a partir de este contenido genera
        responsabilidad alguna para AdelinBTC Academy ni para su autor.
      </p>
      <p>
        <strong>Esto no es un grupo de señales.</strong> No se te dice qué
        comprar, ni cuándo, ni a qué precio, y{" "}
        <strong>no se recomienda copiar ninguna operación</strong>. Lo que se
        publica se publica para explicar cómo se toma una decisión, no para que
        la repitas: replicar la operativa de otra persona sin conocer su
        capital, su horizonte ni su tolerancia a la pérdida es una forma
        habitual de perder dinero.
      </p>
    </>
  );
}

const TEXTO: Record<Variante, { titulo: string; cuerpo: React.ReactNode }> = {
  portfolio: {
    titulo: "Esto no es una recomendación de inversión",
    cuerpo: (
      <>
        <p>
          Lo que se publica aquí es <strong>mi cartera personal</strong>, con
          fines informativos y educativos. No es una recomendación de compra o
          de venta, ni asesoramiento financiero, ni una propuesta para que
          replique nadie estas posiciones.
        </p>
        <p>
          <strong>No soy asesor financiero registrado</strong> ni estoy inscrito
          en ningún registro de empresas de servicios de inversión. No presto
          asesoramiento personalizado: no conozco tu situación, tus ingresos, tu
          horizonte temporal ni tu tolerancia a la pérdida, y cualquiera de esas
          cosas cambia por completo qué es sensato para ti.
        </p>
        <p>
          <strong>Los resultados pasados no garantizan resultados futuros.</strong>{" "}
          Las criptomonedas son activos de alto riesgo y muy volátiles: puedes
          perder la totalidad de lo invertido. Que una posición esté hoy en
          ganancias no dice nada de lo que hará mañana.
        </p>
      </>
    ),
  },

  directo: {
    titulo: "Aviso de riesgo: esto no son señales de trading",
    cuerpo: (
      <>
        <p>
          Las sesiones son <strong>contenido formativo</strong>. Se muestra mi
          operativa en tiempo real para explicar cómo se toma una decisión, no
          para que se copie.
        </p>
        <p>
          <strong>
            Operar <Link href="/glosario/futuros">futuros</Link> con{" "}
            <Link href="/glosario/apalancamiento">apalancamiento</Link> es de
            altísimo riesgo.
          </strong>{" "}
          Puedes perder la totalidad del capital, y más rápido de lo que
          imaginas. Con apalancamiento basta un movimiento en contra para que la
          posición se cierre sola —{" "}
          <Link href="/glosario/liquidacion">liquidación</Link> — sin que el
          precio te haya dado tiempo a tener razón. La mayoría de las cuentas
          minoristas que operan derivados apalancados pierden dinero.
        </p>
        <p>
          <strong>No soy asesor financiero registrado</strong> y no presto
          asesoramiento personalizado. Lo que funciona en mi cuenta, con mi
          tamaño y mi tolerancia al riesgo, puede arruinar la tuya. Si decides
          operar, hazlo solo con dinero que puedas permitirte perder y define
          antes tu{" "}
          <Link href="/glosario/tamano-de-posicion">tamaño de posición</Link> y
          tu <Link href="/glosario/stop-loss">stop-loss</Link>.
        </p>
      </>
    ),
  },

  diario: {
    titulo: "Lo que el diario dice, y lo que no",
    cuerpo: (
      <>
        <p>
          El diario es una <strong>herramienta de registro</strong>: guarda las
          operaciones que tú apuntas y calcula estadísticas sobre ellas. No
          sugiere entradas, no valora tus decisiones y no predice nada.
        </p>
        <p>
          <strong>Las estadísticas describen tu pasado, no tu futuro.</strong>{" "}
          Un ratio de acierto alto en veinte operaciones puede ser suerte, y una
          racha buena no es una ventaja demostrada. Sirven para detectar
          patrones en lo que ya hiciste, no para dar por seguro lo que viene.
        </p>
      </>
    ),
  },

  // Para los cursos y contenidos de fiscalidad (añadida el 06-10-2026 con el
  // curso de fiscalidad cripto). La normativa es española y cambia cada año:
  // por eso insiste en la fecha de revisión y en el asesor para casos propios.
  fiscal: {
    titulo: "Formación fiscal, no asesoramiento fiscal",
    cuerpo: (
      <>
        <p>
          Este contenido es <strong>formativo</strong>: explica cómo funciona la
          tributación de las criptomonedas en España con carácter general. No es
          asesoramiento fiscal ni jurídico personalizado, y{" "}
          <strong>no sustituye a un asesor fiscal</strong> que conozca tu
          situación concreta: residencia, el resto de tus rentas, tu historial
          de operaciones y tus obligaciones anteriores.
        </p>
        <p>
          <strong>La normativa cambia, y cada año.</strong> Los tipos, los
          umbrales, los plazos y los criterios de la Agencia Tributaria se
          revisan con frecuencia. El contenido indica la fecha de su última
          revisión: si ha pasado una campaña de la renta desde entonces,
          compruébalo en las fuentes oficiales antes de declarar.
        </p>
        <p>
          <strong>AdelinBTC Academy no presta asesoramiento fiscal.</strong>{" "}
          Ante un caso dudoso, una inspección o un requerimiento de Hacienda,
          acude a un profesional.
        </p>
      </>
    ),
  },

  general: {
    titulo: "Información, no asesoramiento",
    cuerpo: (
      <>
        <p>
          Esta herramienta es <strong>informativa y educativa</strong>. No
          constituye asesoramiento financiero ni recomendación de compra o
          venta, y los datos que muestra pueden llevar retardo o contener
          errores. <strong>No soy asesor financiero registrado</strong> ni
          presto asesoramiento personalizado.
        </p>
      </>
    ),
  },
};

export default function DisclaimerRiesgo({ variante }: { variante: Variante }) {
  const { titulo, cuerpo } = TEXTO[variante];

  return (
    <aside className="disclaimer" role="note" aria-label="Aviso legal y de riesgo">
      <div className="disclaimer-head">
        <span className="disclaimer-icon" aria-hidden="true">
          <AlertTriangle size={17} strokeWidth={2.1} />
        </span>
        <h2 className="disclaimer-title">{titulo}</h2>
      </div>

      <div className="disclaimer-body">
        {cuerpo}
        <Responsabilidad />
      </div>

      <p className="disclaimer-foot">
        Más información en el <Link href="/aviso-legal">aviso legal</Link>.
      </p>
    </aside>
  );
}
