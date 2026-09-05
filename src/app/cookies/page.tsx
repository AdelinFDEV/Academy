import type { Metadata } from "next";
import LegalShell from "@/components/LegalShell";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  alternates: { canonical: "/cookies" },
  title: "Política de Cookies",
  description: "Información sobre las cookies y el almacenamiento local utilizados en AdelinBTC Academy.",
};

export default function CookiesPage() {
  return (
    <LegalShell title="Política de Cookies" lastUpdated={LEGAL.ultimaActualizacion}>

      <p className="legal-intro">
        Esta política explica qué cookies y tecnologías de almacenamiento utilizamos, con qué finalidad y
        cómo puedes gestionarlas. Usamos las estrictamente necesarias para que el Sitio funcione y,
        <strong> solo si lo autorizas</strong>, cookies de analítica que nos dicen qué contenidos se
        leen. <strong>No usamos cookies de publicidad ni de rastreo entre sitios con fines
        comerciales</strong>, y no vendemos ni cedemos tus datos de navegación.
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
              <td><code>cookie_consent_v2</code></td>
              <td>localStorage · Esencial</td>
              <td>Recuerda tu preferencia sobre cookies para no volver a preguntarte, y determina si se carga la analítica</td>
              <td>Persistente hasta que la borres</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>3. Tecnologías de terceros</h2>
        <p>
          Se activan al aceptarlas o al usar determinadas funciones, y en ningún caso las utilizamos
          para publicidad personalizada:
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
              <td>Google Analytics 4</td>
              <td>Solo si aceptas las cookies de analítica</td>
              <td>
                Mide qué páginas se visitan y cómo se navega por el Sitio, para decidir qué contenidos
                ampliar. Las cookies (<code>_ga</code>, <code>_ga_*</code>) duran hasta 2 años, la
                dirección IP se recorta antes de almacenarse y <strong>la publicidad personalizada está
                desactivada</strong>. Si eliges «Solo esenciales», la etiqueta de Google
                <strong> no llega a cargarse</strong>: no es que se cargue y no mida
              </td>
            </tr>
            <tr>
              <td>Cloudflare Web Analytics</td>
              <td>Siempre</td>
              <td>
                Recuento agregado de visitas. <strong>No usa cookies ni almacenamiento</strong> y no
                identifica a nadie, por lo que está exenta de consentimiento
              </td>
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
            el art. 4 de la {LEGAL.leyCookies}, que transpone la Directiva europea sobre privacidad
            en las comunicaciones electrónicas.
          </li>
          <li>
            <strong>Analíticas:</strong> las de Google Analytics 4. <strong>Requieren tu
            consentimiento previo</strong> y solo se cargan si pulsas «Aceptar todas» en el banner.
            Puedes revocarlo cuando quieras (ver apartado 5).
          </li>
          <li>
            <strong>De terceros bajo tu acción:</strong> las de Stripe (solo si pagas) y las de YouTube
            (solo si reproduces un vídeo) se activan únicamente como consecuencia de una acción tuya.
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Cómo gestionar, revocar o eliminar las cookies</h2>
        <p>
          <strong>Para revocar tu consentimiento a la analítica</strong>, borra los datos de sitio de
          {" "}{LEGAL.dominio} en tu navegador: al hacerlo se elimina la preferencia guardada y el
          banner volverá a preguntarte, momento en el que puedes elegir «Solo esenciales». A partir de
          ahí, la etiqueta de Google deja de cargarse.
        </p>
        <p>
          También puedes configurar tu navegador para bloquear o eliminar cookies y datos de
          almacenamiento local. Ten en cuenta que bloquear las tecnologías esenciales impedirá mantener
          la sesión iniciada.
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
          funcionamiento técnico del Sitio (art. 6.1.f RGPD y art. 4 de la {LEGAL.leyCookies}). Las cookies de Stripe se
          activan sobre la base de la ejecución del contrato de pago (art. 6.1.b RGPD). Las
          <strong> cookies analíticas de Google Analytics 4 se amparan exclusivamente en tu
          consentimiento</strong> (art. 6.1.a RGPD y art. 4 de la {LEGAL.leyCookies}), recabado mediante el banner y
          revocable en cualquier momento; hasta que lo otorgas, la etiqueta no se carga. Google LLC
          puede tratar estos datos fuera del Espacio Económico Europeo al amparo del Marco de
          Privacidad de Datos UE-EE. UU. No incorporamos cookies publicitarias; si algún día lo
          hiciéramos, volveríamos a solicitar tu consentimiento de forma separada.
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
