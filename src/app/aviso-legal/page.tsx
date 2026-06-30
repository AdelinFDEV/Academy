import type { Metadata } from "next";
import LegalShell from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "Aviso Legal",
  description: "Aviso legal y condiciones de uso de AdelinBTC Academy.",
};

export default function AvisoLegalPage() {
  return (
    <LegalShell title="Aviso Legal" lastUpdated="30 de junio de 2025">

      <section>
        <h2>1. Datos identificativos del titular</h2>
        <p>
          En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSI-CE), se informa que el titular del sitio web <strong>adelinbtc.com</strong> (en adelante, «el Sitio») es:
        </p>
        <ul>
          <li><strong>Denominación:</strong> AdelinBTC Academy</li>
          <li><strong>Correo electrónico de contacto:</strong> georgeadelingombosredes@gmail.com</li>
          <li><strong>Ámbito de actividad:</strong> Formación y educación en criptomonedas y tecnología blockchain</li>
        </ul>
      </section>

      <section>
        <h2>2. Objeto y ámbito de aplicación</h2>
        <p>
          El presente Aviso Legal regula el acceso, navegación y uso del Sitio. El acceso al Sitio implica la aceptación plena y sin reservas de todas las disposiciones incluidas en este Aviso Legal. Si no está de acuerdo con alguno de los términos aquí recogidos, le rogamos que abandone el Sitio.
        </p>
        <p>
          El titular se reserva el derecho a modificar en cualquier momento las condiciones aquí determinadas, siendo debidamente publicadas las modificaciones.
        </p>
      </section>

      <section>
        <h2>3. Condiciones de uso</h2>
        <p>El usuario se compromete a hacer un uso adecuado de los contenidos y servicios ofrecidos a través del Sitio y, con carácter enunciativo pero no limitativo, a:</p>
        <ul>
          <li>No emplear los contenidos con fines o efectos ilícitos, prohibidos o contrarios al presente Aviso Legal.</li>
          <li>No reproducir, copiar, distribuir, transformar o comunicar públicamente los contenidos sin autorización previa del titular.</li>
          <li>No introducir ni difundir contenidos falsos, inexactos, ambiguos o engañosos.</li>
          <li>No acceder ni intentar acceder a cuentas de otros usuarios o sistemas no autorizados.</li>
          <li>No utilizar el Sitio para actividades de spam, phishing o cualquier otra forma de comunicación no solicitada.</li>
        </ul>
        <p>
          El incumplimiento de cualquiera de las obligaciones anteriores podrá dar lugar a la cancelación inmediata de la cuenta del usuario, sin perjuicio de las responsabilidades legales que pudieran derivarse.
        </p>
      </section>

      <section>
        <h2>4. Propiedad intelectual e industrial</h2>
        <p>
          Todos los contenidos del Sitio —incluyendo, a título meramente enunciativo, textos, fotografías, gráficos, imágenes, vídeos, logotipos, iconos, código fuente, software y diseño gráfico— son propiedad exclusiva del titular o de terceros que han autorizado su uso, y están protegidos por las leyes españolas y europeas de propiedad intelectual e industrial.
        </p>
        <p>
          Queda expresamente prohibida la reproducción total o parcial de los contenidos del Sitio sin la autorización escrita previa del titular.
        </p>
      </section>

      <section>
        <h2>5. Exclusión de responsabilidad</h2>
        <p>
          El titular no se hace responsable de los daños o perjuicios de cualquier naturaleza que pudieran derivarse de:
        </p>
        <ul>
          <li>La disponibilidad, continuidad o infalibilidad del funcionamiento del Sitio.</li>
          <li>Los errores, omisiones o inexactitudes en los contenidos publicados.</li>
          <li>Decisiones financieras, de inversión o de otro tipo tomadas por el usuario sobre la base de la información contenida en el Sitio.</li>
          <li>El uso de los contenidos por parte de terceros.</li>
          <li>La presencia de virus u otros elementos dañinos en los contenidos que puedan causar alteraciones en los sistemas informáticos del usuario.</li>
        </ul>
        <p>
          El Sitio puede contener enlaces a páginas web de terceros. El titular no controla ni asume responsabilidad alguna por los contenidos, privacidad o prácticas de dichos sitios web.
        </p>
      </section>

      <section>
        <h2>6. Disclaimer financiero</h2>
        <div className="legal-disclaimer-box">
          <p>
            <strong>Importante:</strong> Todo el contenido publicado en AdelinBTC Academy —artículos, análisis, guías, señales, herramientas y cualquier otro material— tiene exclusivamente carácter <strong>educativo e informativo</strong>.
          </p>
          <p>
            Ningún contenido del Sitio constituye asesoramiento financiero, de inversión, fiscal o legal. Las criptomonedas y los activos digitales son instrumentos de alto riesgo. Su valor puede aumentar o disminuir drásticamente, pudiendo llegar a perder el capital invertido.
          </p>
          <p>
            Antes de tomar cualquier decisión de inversión, el usuario debe realizar su propio análisis y, en su caso, consultar con un asesor financiero independiente autorizado. El titular no será responsable de las pérdidas o perjuicios derivados de las decisiones tomadas por el usuario en base a la información publicada en el Sitio.
          </p>
        </div>
      </section>

      <section>
        <h2>7. Ley aplicable y jurisdicción</h2>
        <p>
          Las presentes condiciones se rigen e interpretan conforme a la legislación española. Para la resolución de cualesquiera controversias que pudieran surgir en relación con el Sitio, ambas partes se someten a los Juzgados y Tribunales del domicilio del usuario, salvo que la normativa aplicable establezca fuero imperativo distinto.
        </p>
      </section>

    </LegalShell>
  );
}
