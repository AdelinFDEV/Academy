import type { Metadata } from "next";
import LegalShell from "@/components/LegalShell";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Aviso Legal",
  description: "Aviso legal, condiciones de uso y advertencia de riesgo de AdelinBTC Academy.",
};

export default function AvisoLegalPage() {
  return (
    <LegalShell title="Aviso Legal" lastUpdated={LEGAL.ultimaActualizacion}>

      <section>
        <h2>1. Datos identificativos del titular</h2>
        <p>
          En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad
          de la Información y del Comercio Electrónico (LSSI-CE), se informa de que el titular del sitio
          web <strong>{LEGAL.dominio}</strong> (en adelante, «el Sitio») es:
        </p>
        <ul>
          <li><strong>Titular:</strong> {LEGAL.titularNombre} (persona física)</li>
          <li><strong>Marca comercial:</strong> {LEGAL.marca}</li>
          <li><strong>Correo electrónico de contacto:</strong> {LEGAL.email}</li>
          <li><strong>Actividad:</strong> {LEGAL.actividad}</li>
        </ul>
      </section>

      <section>
        <h2>2. Objeto y aceptación</h2>
        <p>
          El presente Aviso Legal regula el acceso, la navegación y el uso del Sitio. El acceso al Sitio
          implica la aceptación plena y sin reservas de todas las disposiciones aquí incluidas. Si no
          estás de acuerdo con alguno de los términos, te rogamos que no utilices el Sitio.
        </p>
        <p>
          El titular se reserva el derecho a modificar en cualquier momento estas condiciones, que serán
          debidamente publicadas en esta página.
        </p>
      </section>

      <section>
        <h2>3. Requisito de edad</h2>
        <p>
          El Sitio y sus servicios están dirigidos exclusivamente a personas <strong>mayores de {LEGAL.edadMinima} años</strong>.
          Al registrarte o contratar cualquier servicio declaras ser mayor de dicha edad y tener capacidad
          legal suficiente para obligarte por estas condiciones.
        </p>
      </section>

      <section>
        <h2>4. Condiciones de uso</h2>
        <p>El usuario se compromete a hacer un uso adecuado de los contenidos y servicios y, en particular, a:</p>
        <ul>
          <li>No emplear los contenidos con fines ilícitos, prohibidos o contrarios a este Aviso Legal.</li>
          <li>No reproducir, copiar, distribuir, transformar ni comunicar públicamente los contenidos sin autorización previa del titular.</li>
          <li>No introducir ni difundir contenidos falsos, inexactos o engañosos.</li>
          <li>No acceder ni intentar acceder a cuentas de otros usuarios o a sistemas no autorizados.</li>
          <li>No utilizar el Sitio para spam, phishing o cualquier comunicación no solicitada.</li>
        </ul>
        <p>
          El incumplimiento de estas obligaciones podrá dar lugar a la cancelación inmediata de la cuenta,
          sin perjuicio de las responsabilidades legales que correspondan.
        </p>
      </section>

      <section>
        <h2>5. Suscripción, pagos y cancelación</h2>
        <p>
          El Sitio ofrece una suscripción de pago («Premium») gestionada a través de la plataforma Stripe.
          El precio y las condiciones vigentes se muestran en la página de contratación antes de completar
          el pago. La suscripción se renueva de forma periódica salvo cancelación. Puedes <strong>cancelar
          en cualquier momento</strong> desde tu cuenta, sin penalización; conservarás el acceso hasta el
          final del periodo ya abonado. Conforme al art. 103.m del texto refundido de la Ley General para
          la Defensa de los Consumidores y Usuarios, al tratarse de contenido digital de acceso inmediato,
          el derecho de desistimiento no resulta aplicable una vez iniciada la prestación con tu
          consentimiento.
        </p>
      </section>

      <section>
        <h2>6. Propiedad intelectual e industrial</h2>
        <p>
          Todos los contenidos del Sitio —textos, imágenes, gráficos, vídeos, logotipos, iconos, código
          fuente, software y diseño— son propiedad del titular o de terceros que han autorizado su uso, y
          están protegidos por la normativa española y europea de propiedad intelectual e industrial. Queda
          prohibida su reproducción total o parcial sin autorización escrita previa del titular.
        </p>
      </section>

      <section>
        <h2>7. Exclusión de responsabilidad</h2>
        <p>El titular no se responsabiliza de los daños o perjuicios de cualquier naturaleza derivados de:</p>
        <ul>
          <li>La disponibilidad, continuidad o infalibilidad del funcionamiento del Sitio.</li>
          <li>Errores, omisiones o inexactitudes en los contenidos publicados.</li>
          <li>Decisiones financieras, de inversión o de cualquier tipo tomadas por el usuario a partir de la información del Sitio.</li>
          <li>El uso de los contenidos por parte de terceros.</li>
          <li>La presencia de virus u otros elementos dañinos que puedan alterar los sistemas del usuario.</li>
        </ul>
        <p>
          El Sitio puede contener enlaces a páginas de terceros. El titular no controla ni asume
          responsabilidad por los contenidos, la privacidad o las prácticas de dichos sitios.
        </p>
      </section>

      <section>
        <h2>8. Advertencia de riesgo y ausencia de asesoramiento financiero</h2>
        <div className="legal-disclaimer-box">
          <p>
            <strong>Importante.</strong> Todo el contenido de {LEGAL.marca} —artículos, análisis, guías,
            sesiones de trading en directo, herramientas, el Diario de Trading y cualquier otro
            material— tiene carácter
            <strong> exclusivamente educativo e informativo</strong>.
          </p>
          <p>
            Ningún contenido constituye asesoramiento financiero, de inversión, legal ni fiscal, ni una
            recomendación personalizada de compra o venta de ningún activo. El titular no está registrado
            como empresa de servicios de inversión ni como asesor financiero ante la CNMV.
          </p>
          <p>
            Las criptomonedas y los criptoactivos son productos <strong>de alto riesgo y elevada
            volatilidad</strong>: su valor puede subir o bajar drásticamente y <strong>puedes perder la
            totalidad del capital invertido</strong>. Las rentabilidades pasadas no garantizan resultados
            futuros. La mayoría de criptoactivos no están cubiertos por mecanismos de protección al
            inversor de la Unión Europea.
          </p>
          <p>
            Antes de tomar cualquier decisión, realiza tu propio análisis (DYOR) y, si lo necesitas,
            consulta con un asesor financiero debidamente autorizado. El titular no será responsable de las
            pérdidas o perjuicios derivados de decisiones adoptadas a partir de la información del Sitio.
          </p>
        </div>
      </section>

      <section>
        <h2>9. Protección de datos</h2>
        <p>
          El tratamiento de los datos personales de los usuarios se rige por nuestra{" "}
          <a href="/privacidad">Política de Privacidad</a> y nuestra{" "}
          <a href="/cookies">Política de Cookies</a>.
        </p>
      </section>

      <section>
        <h2>10. Ley aplicable y jurisdicción</h2>
        <p>
          Estas condiciones se rigen por la legislación española. Para la resolución de cualquier
          controversia, y cuando el usuario tenga la condición de consumidor, serán competentes los
          Juzgados y Tribunales del domicilio del usuario. Asimismo, la Comisión Europea pone a disposición
          una plataforma de resolución de litigios en línea accesible en{" "}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a>.
        </p>
      </section>

    </LegalShell>
  );
}
