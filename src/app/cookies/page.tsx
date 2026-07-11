import type { Metadata } from "next";
import LegalShell from "@/components/LegalShell";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de Cookies",
  description: "Información sobre las cookies y el almacenamiento local utilizados en AdelinBTC Academy.",
};

export default function CookiesPage() {
  return (
    <LegalShell title="Política de Cookies" lastUpdated={LEGAL.ultimaActualizacion}>

      <p className="legal-intro">
        Esta política explica qué cookies y tecnologías de almacenamiento utilizamos, con qué finalidad y
        cómo puedes gestionarlas. Nos limitamos a lo estrictamente necesario para que el Sitio funcione:
        <strong> no usamos cookies de publicidad ni de rastreo entre sitios con fines comerciales</strong>.
      </p>

      <section>
        <h2>1. ¿Qué son las cookies?</h2>
        <p>
          Las cookies son pequeños archivos que un sitio web almacena en tu dispositivo. Junto a ellas,
          usamos también el <strong>almacenamiento local</strong> del navegador (localStorage), una
          tecnología similar que permite recordar preferencias sin enviarlas en cada petición.
        </p>
      </section>

      <section>
        <h2>2. Tecnologías propias que utilizamos</h2>
        <table className="legal-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Finalidad</th>
              <th>Duración</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>sb-*-auth-token</code></td>
              <td>Cookie · Esencial</td>
              <td>Mantiene tu sesión de usuario activa y segura</td>
              <td>Sesión / renovable</td>
            </tr>
            <tr>
              <td><code>sb-*-auth-token-code-verifier</code></td>
              <td>Cookie · Esencial</td>
              <td>Flujo seguro de autenticación (PKCE) al iniciar sesión</td>
              <td>Sesión</td>
            </tr>
            <tr>
              <td><code>cookie_consent</code></td>
              <td>localStorage · Esencial</td>
              <td>Recuerda tu preferencia sobre cookies para no volver a preguntarte</td>
              <td>Persistente hasta que la borres</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>3. Tecnologías de terceros</h2>
        <p>
          Solo se activan al usar determinadas funciones, y en ningún caso las utilizamos para publicidad
          personalizada:
        </p>
        <table className="legal-table">
          <thead>
            <tr>
              <th>Proveedor</th>
              <th>Cuándo</th>
              <th>Finalidad</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Stripe</td>
              <td>Solo si inicias un pago</td>
              <td>Al pulsar «Hazte Premium» te redirigimos a la pasarela segura de Stripe. Stripe instala sus propias cookies <strong>en su dominio</strong> para prevenir el fraude y procesar el pago. No se instalan en {LEGAL.dominio}</td>
            </tr>
            <tr>
              <td>YouTube (Google)</td>
              <td>Solo si reproduces un vídeo incrustado</td>
              <td>Usamos el <strong>modo de privacidad mejorada</strong> (youtube-nocookie.com): YouTube no instala cookies de seguimiento publicitario hasta que reproduces el vídeo, y no las emplea para personalizar anuncios</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>4. Clasificación</h2>
        <ul>
          <li>
            <strong>Esenciales:</strong> imprescindibles para el funcionamiento del Sitio (mantener la
            sesión, seguridad, recordar tu preferencia de cookies). Están exentas de consentimiento según
            el art. 22.2 de la LSSI-CE.
          </li>
          <li>
            <strong>De terceros bajo tu acción:</strong> las de Stripe (solo si pagas) y las de YouTube
            (solo si reproduces un vídeo) se activan únicamente como consecuencia de una acción tuya.
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Cómo gestionar o eliminar las cookies</h2>
        <p>
          Puedes configurar tu navegador para bloquear o eliminar cookies y datos de almacenamiento local.
          Ten en cuenta que bloquear las tecnologías esenciales impedirá mantener la sesión iniciada.
        </p>
        <ul>
          <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
          <li><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
          <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
          <li><a href="https://support.microsoft.com/es-es/windows/eliminar-y-administrar-cookies-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
        </ul>
      </section>

      <section>
        <h2>6. Base legal</h2>
        <p>
          Las tecnologías esenciales se amparan en el interés legítimo del titular para garantizar el
          funcionamiento técnico del Sitio (art. 6.1.f RGPD y art. 22.2 LSSI-CE). Las cookies de Stripe se
          activan sobre la base de la ejecución del contrato de pago (art. 6.1.b RGPD). Si en el futuro
          incorporamos cookies analíticas o publicitarias de terceros, solicitaremos tu consentimiento
          previo (art. 6.1.a RGPD) mediante el banner correspondiente.
        </p>
      </section>

      <section>
        <h2>7. Actualizaciones</h2>
        <p>
          Podemos actualizar esta política cuando cambien las tecnologías empleadas o la normativa
          aplicable. Para cualquier consulta, escríbenos a {LEGAL.email}.
        </p>
      </section>

    </LegalShell>
  );
}
