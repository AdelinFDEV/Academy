import type { Metadata } from "next";
import LegalShell from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "Política de Cookies",
  description: "Información sobre las cookies utilizadas en AdelinBTC Academy.",
};

export default function CookiesPage() {
  return (
    <LegalShell title="Política de Cookies" lastUpdated="30 de junio de 2025">

      <section>
        <h2>1. ¿Qué son las cookies?</h2>
        <p>
          Las cookies son pequeños archivos de texto que los sitios web almacenan en tu dispositivo cuando los visitas. Permiten que el sitio recuerde tus preferencias, mantenga tu sesión activa y recopile información anónima sobre el uso del servicio.
        </p>
      </section>

      <section>
        <h2>2. Cookies que utilizamos</h2>
        <table className="legal-table">
          <thead>
            <tr>
              <th>Nombre / Patrón</th>
              <th>Tipo</th>
              <th>Proveedor</th>
              <th>Finalidad</th>
              <th>Duración</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>sb-*-auth-token</code></td>
              <td>Esencial</td>
              <td>Supabase</td>
              <td>Mantiene tu sesión de usuario activa y segura</td>
              <td>1 semana (renovable)</td>
            </tr>
            <tr>
              <td><code>sb-*-auth-token-code-verifier</code></td>
              <td>Esencial</td>
              <td>Supabase</td>
              <td>Flujo PKCE para autenticación segura OAuth</td>
              <td>Sesión</td>
            </tr>
            <tr>
              <td><code>cookie_consent</code></td>
              <td>Esencial</td>
              <td>AdelinBTC Academy</td>
              <td>Almacena tu preferencia de consentimiento de cookies</td>
              <td>1 año</td>
            </tr>
            <tr>
              <td><code>__stripe_mid</code></td>
              <td>Funcional</td>
              <td>Stripe</td>
              <td>Prevención de fraude en el proceso de pago</td>
              <td>1 año</td>
            </tr>
            <tr>
              <td><code>__stripe_sid</code></td>
              <td>Funcional</td>
              <td>Stripe</td>
              <td>Identificación de sesión durante el pago</td>
              <td>30 minutos</td>
            </tr>
          </tbody>
        </table>
        <p>
          Actualmente <strong>no utilizamos cookies de publicidad ni de rastreo entre sitios</strong>. Si en el futuro incorporamos herramientas de analítica de terceros, actualizaremos esta política y solicitaremos tu consentimiento.
        </p>
      </section>

      <section>
        <h2>3. Clasificación de cookies</h2>
        <ul>
          <li>
            <strong>Cookies esenciales:</strong> imprescindibles para el funcionamiento básico del Sitio. Sin ellas no podrías iniciar sesión ni acceder a contenido protegido. No requieren tu consentimiento según la normativa vigente.
          </li>
          <li>
            <strong>Cookies funcionales:</strong> mejoran la experiencia del usuario. En nuestro caso, se activan únicamente durante el proceso de pago gestionado por Stripe. Se instalan solo si realizas una compra.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Cómo gestionar o eliminar las cookies</h2>
        <p>
          Puedes configurar tu navegador para que bloquee o elimine cookies. Ten en cuenta que bloquear las cookies esenciales afectará al funcionamiento del Sitio (no podrás mantener la sesión iniciada).
        </p>
        <ul>
          <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
          <li><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
          <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
          <li><a href="https://support.microsoft.com/es-es/windows/eliminar-y-administrar-cookies-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
        </ul>
        <p>
          También puedes retirar o modificar tu consentimiento en cualquier momento haciendo clic en el enlace «Gestionar cookies» ubicado en el pie de página del Sitio.
        </p>
      </section>

      <section>
        <h2>5. Base legal</h2>
        <p>
          La instalación de cookies esenciales se fundamenta en el <strong>interés legítimo</strong> del responsable del tratamiento para garantizar el funcionamiento técnico del Sitio (art. 6.1.f RGPD). Las cookies funcionales se instalan sobre la base de la <strong>ejecución del contrato</strong> (art. 6.1.b RGPD) cuando realizas una compra. Cualquier cookie no esencial futura requerirá tu consentimiento previo (art. 6.1.a RGPD).
        </p>
      </section>

      <section>
        <h2>6. Actualizaciones de esta política</h2>
        <p>
          Podemos actualizar esta Política de Cookies cuando incorporemos nuevas tecnologías o cambie la normativa aplicable. Te informaremos a través del banner de cookies o de un aviso en el Sitio.
        </p>
        <p>
          Para cualquier consulta sobre el uso de cookies, escríbenos a <strong>georgeadelingombosredes@gmail.com</strong>.
        </p>
      </section>

    </LegalShell>
  );
}
