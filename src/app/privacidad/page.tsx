import type { Metadata } from "next";
import LegalShell from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: "Política de privacidad de AdelinBTC Academy conforme al RGPD.",
};

export default function PrivacidadPage() {
  return (
    <LegalShell title="Política de Privacidad" lastUpdated="30 de junio de 2025">

      <section>
        <h2>1. Responsable del tratamiento</h2>
        <ul>
          <li><strong>Denominación:</strong> AdelinBTC Academy</li>
          <li><strong>Correo de contacto:</strong> georgeadelingombosredes@gmail.com</li>
        </ul>
      </section>

      <section>
        <h2>2. Datos personales que recopilamos</h2>
        <table className="legal-table">
          <thead>
            <tr>
              <th>Dato</th>
              <th>Cuándo se recoge</th>
              <th>Finalidad</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Dirección de correo electrónico</td>
              <td>Registro de cuenta</td>
              <td>Identificación, acceso y comunicaciones</td>
            </tr>
            <tr>
              <td>Nombre completo</td>
              <td>Registro (opcional)</td>
              <td>Personalización de la experiencia</td>
            </tr>
            <tr>
              <td>Datos de pago</td>
              <td>Suscripción Premium</td>
              <td>Procesados por Stripe — no los almacenamos directamente</td>
            </tr>
            <tr>
              <td>Identificador de cliente Stripe</td>
              <td>Primera compra</td>
              <td>Gestión de suscripción y portal de facturación</td>
            </tr>
            <tr>
              <td>Datos de actividad en el Sitio</td>
              <td>Uso continuado</td>
              <td>Estadísticas internas y mejora del servicio</td>
            </tr>
            <tr>
              <td>Datos de cuenta Google</td>
              <td>Si usas «Continuar con Google»</td>
              <td>Autenticación OAuth mediante proveedor externo</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>3. Base legal del tratamiento</h2>
        <ul>
          <li><strong>Ejecución de contrato</strong> (art. 6.1.b RGPD): gestión de cuenta y prestación del servicio.</li>
          <li><strong>Consentimiento</strong> (art. 6.1.a RGPD): comunicaciones comerciales y cookies no esenciales.</li>
          <li><strong>Interés legítimo</strong> (art. 6.1.f RGPD): seguridad del Sitio, prevención del fraude y análisis estadístico interno.</li>
          <li><strong>Obligación legal</strong> (art. 6.1.c RGPD): cuando la normativa aplicable lo exija.</li>
        </ul>
      </section>

      <section>
        <h2>4. Destinatarios y transferencias internacionales</h2>
        <table className="legal-table">
          <thead>
            <tr>
              <th>Proveedor</th>
              <th>Función</th>
              <th>Ubicación</th>
              <th>Garantías</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Supabase</td>
              <td>Base de datos y autenticación</td>
              <td>UE (AWS Frankfurt)</td>
              <td>Cláusulas contractuales tipo</td>
            </tr>
            <tr>
              <td>Stripe</td>
              <td>Procesamiento de pagos</td>
              <td>EE. UU. / UE</td>
              <td>Marco UE-EE. UU. de Privacidad de Datos</td>
            </tr>
            <tr>
              <td>Vercel</td>
              <td>Alojamiento web</td>
              <td>EE. UU. / UE</td>
              <td>Cláusulas contractuales tipo</td>
            </tr>
            <tr>
              <td>Google (OAuth)</td>
              <td>Autenticación con Google</td>
              <td>EE. UU.</td>
              <td>Marco UE-EE. UU. de Privacidad de Datos</td>
            </tr>
          </tbody>
        </table>
        <p>No cedemos tus datos a terceros con fines comerciales propios.</p>
      </section>

      <section>
        <h2>5. Plazo de conservación</h2>
        <ul>
          <li><strong>Datos de cuenta:</strong> mientras mantengas la cuenta activa y, tras su eliminación, los plazos legales vigentes (máx. 5 años para datos fiscales).</li>
          <li><strong>Datos de suscripción:</strong> vigencia de la suscripción más 5 años adicionales por obligaciones fiscales.</li>
          <li><strong>Datos de navegación:</strong> máximo 13 meses desde su recogida.</li>
          <li><strong>Comunicaciones comerciales:</strong> hasta que retires tu consentimiento.</li>
        </ul>
      </section>

      <section>
        <h2>6. Tus derechos</h2>
        <p>Conforme al RGPD y la LOPDGDD tienes los derechos de acceso, rectificación, supresión, oposición, limitación, portabilidad y retirada del consentimiento. Puedes ejercerlos escribiendo a <strong>georgeadelingombosredes@gmail.com</strong>.</p>
        <p>Asimismo, puedes presentar una reclamación ante la <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">Agencia Española de Protección de Datos</a>.</p>
      </section>

      <section>
        <h2>7. Seguridad</h2>
        <p>
          Aplicamos medidas técnicas y organizativas apropiadas: cifrado TLS en tránsito, autenticación segura mediante Supabase Auth, políticas de Row Level Security en base de datos y revisión periódica de controles de seguridad.
        </p>
      </section>

      <section>
        <h2>8. Cookies</h2>
        <p>
          Utilizamos cookies propias y de terceros. Consulta nuestra{" "}
          <a href="/cookies">Política de Cookies</a> para más información.
        </p>
      </section>

    </LegalShell>
  );
}
