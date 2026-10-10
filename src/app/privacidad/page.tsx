import type { Metadata } from "next";
import LegalShell from "@/components/LegalShell";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  alternates: { canonical: "/privacidad" },
  title: "Política de Privacidad",
  description:
    "Política de privacidad de AdelinBTC Academy conforme al RGPD (UE) 2016/679 y a la normativa rumana de protección de datos.",
};

export default function PrivacidadPage() {
  return (
    <LegalShell title="Política de Privacidad" lastUpdated={LEGAL.ultimaActualizacion}>

      <p className="legal-intro">
        En {LEGAL.marca} respetamos tu privacidad y tratamos tus datos personales conforme al
        Reglamento (UE) 2016/679 (RGPD) y a la {LEGAL.leyProteccionDatos}, norma nacional aplicable por
        estar el responsable establecido en {LEGAL.pais}. El RGPD es un reglamento europeo y te ampara
        igual con independencia de dónde residas dentro de la Unión. Esta política explica, de forma
        clara, qué datos recogemos, con qué finalidad, sobre qué base legal y qué derechos tienes.
      </p>

      <section>
        <h2>1. Responsable del tratamiento</h2>
        <ul>
          <li><strong>Titular:</strong> {LEGAL.titularNombre}</li>
          <li><strong>Identificación fiscal:</strong> {LEGAL.identificadorFiscal}</li>
          <li><strong>Domicilio:</strong> {LEGAL.domicilio} ({LEGAL.pais})</li>
          <li><strong>Marca:</strong> {LEGAL.marca}</li>
          <li><strong>Sitio web:</strong> {LEGAL.dominio}</li>
          <li><strong>Correo de contacto y ejercicio de derechos:</strong> {LEGAL.email}</li>
        </ul>
        <p>
          No hemos designado un Delegado de Protección de Datos (DPO), al no ser obligatorio conforme
          al art. 37 RGPD para la actividad y volumen de tratamiento del Sitio.
        </p>
      </section>

      <section>
        <h2>2. Datos que tratamos y para qué</h2>
        <table className="legal-table">
          <thead>
            <tr>
              <th>Categoría de datos</th>
              <th>Cuándo se recoge</th>
              <th>Finalidad</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Correo electrónico</td>
              <td>Registro de cuenta</td>
              <td>Identificación, acceso, seguridad y comunicaciones sobre el servicio</td>
            </tr>
            <tr>
              <td>Nombre (opcional)</td>
              <td>Registro o edición del perfil</td>
              <td>Personalizar la experiencia</td>
            </tr>
            <tr>
              <td>Contraseña</td>
              <td>Registro con email</td>
              <td>Se almacena cifrada (hash) por nuestro proveedor de autenticación; nunca la vemos</td>
            </tr>
            <tr>
              <td>Datos de tu cuenta de Google</td>
              <td>Solo si usas «Continuar con Google»</td>
              <td>Autenticación mediante OAuth (email y nombre básico del perfil)</td>
            </tr>
            <tr>
              <td>Doble factor (2FA)</td>
              <td>Si activas la verificación en dos pasos</td>
              <td>Clave TOTP para app de autenticación. No solicitamos ni almacenamos tu número de teléfono</td>
            </tr>
            <tr>
              <td>Datos de suscripción</td>
              <td>Al hacerte Premium</td>
              <td>Identificador de cliente y suscripción de Stripe, estado y vigencia. El pago lo procesa Stripe: <strong>no almacenamos los datos de tu tarjeta</strong></td>
            </tr>
            <tr>
              <td>Progreso y gamificación</td>
              <td>Uso de la academia</td>
              <td>Racha de actividad, logros y guías leídas o guardadas</td>
            </tr>
            <tr>
              <td>Contenido que tú creas</td>
              <td>Al usar las herramientas</td>
              <td>Diario de Trading (operaciones, notas, capital), watchlist, portfolio y términos guardados. Son <strong>privados</strong>: solo tú puedes verlos</td>
            </tr>
            <tr>
              <td>Datos de uso agregados</td>
              <td>Navegación por el Sitio</td>
              <td>Estadística interna (páginas y contenidos visitados). <strong>No registramos tu dirección IP ni tu navegador</strong> en estas métricas</td>
            </tr>
          </tbody>
        </table>
        <p>
          No tratamos categorías especiales de datos (art. 9 RGPD) ni realizamos elaboración de perfiles
          ni decisiones automatizadas con efectos jurídicos sobre ti (art. 22 RGPD).
        </p>
      </section>

      <section>
        <h2>3. Base legal de cada tratamiento</h2>
        <ul>
          <li><strong>Ejecución de un contrato</strong> (art. 6.1.b RGPD): crear y gestionar tu cuenta, dar acceso a las herramientas y gestionar la suscripción Premium.</li>
          <li><strong>Consentimiento</strong> (art. 6.1.a RGPD): cookies no esenciales y, en su caso, el envío de comunicaciones comerciales o newsletter. Es libre y revocable en cualquier momento.</li>
          <li><strong>Interés legítimo</strong> (art. 6.1.f RGPD): garantizar la seguridad del Sitio, prevenir el fraude y elaborar estadística interna agregada que no te identifica individualmente.</li>
          <li><strong>Obligación legal</strong> (art. 6.1.c RGPD): conservar la documentación de facturación exigida por la normativa mercantil y fiscal.</li>
        </ul>
      </section>

      <section>
        <h2>4. Comunicaciones comerciales</h2>
        <p>
          Si en algún momento activas la recepción de boletines o comunicaciones comerciales, lo haremos
          únicamente con tu <strong>consentimiento previo y expreso</strong>. Podrás darte de baja en
          cualquier momento desde el propio email o escribiéndonos a {LEGAL.email}. Los correos
          estrictamente necesarios para el servicio (confirmación de cuenta, recuperación de contraseña,
          avisos de facturación) no son comunicaciones comerciales y se envían sobre la base de la
          ejecución del contrato.
        </p>
      </section>

      <section>
        <h2>5. Destinatarios y transferencias internacionales</h2>
        <p>
          Solo compartimos datos con los proveedores tecnológicos imprescindibles para prestar el
          servicio, que actúan como <strong>encargados del tratamiento</strong> bajo contrato. No vendemos
          ni cedemos tus datos a terceros con fines comerciales propios.
        </p>
        <table className="legal-table">
          <thead>
            <tr>
              <th>Proveedor</th>
              <th>Función</th>
              <th>Ubicación</th>
              <th>Garantía de transferencia</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Supabase</td>
              <td>Base de datos y autenticación</td>
              <td>Unión Europea</td>
              <td>Tratamiento dentro del EEE</td>
            </tr>
            <tr>
              <td>Stripe</td>
              <td>Procesamiento de pagos</td>
              <td>UE / EE. UU.</td>
              <td>Cláusulas Contractuales Tipo y Data Privacy Framework</td>
            </tr>
            <tr>
              <td>Vercel</td>
              <td>Alojamiento del sitio web</td>
              <td>UE / EE. UU.</td>
              <td>Cláusulas Contractuales Tipo</td>
            </tr>
            <tr>
              <td>Google</td>
              <td>Inicio de sesión con Google (OAuth)</td>
              <td>EE. UU.</td>
              <td>Data Privacy Framework</td>
            </tr>
            <tr>
              <td>YouTube (Google)</td>
              <td>Vídeos incrustados, solo al reproducirlos</td>
              <td>EE. UU.</td>
              <td>Modo de privacidad mejorada (youtube-nocookie). Ver Política de Cookies</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>6. Plazos de conservación</h2>
        <ul>
          <li><strong>Datos de cuenta y contenido propio:</strong> mientras mantengas la cuenta activa. Si la eliminas, se borran de inmediato (salvo lo que la ley obligue a conservar).</li>
          <li><strong>Datos de facturación y suscripción:</strong> el plazo exigido por la normativa mercantil y fiscal (con carácter general, hasta 5 años).</li>
          <li><strong>Estadística de uso agregada:</strong> se conserva de forma disociada; al eliminar tu cuenta se anonimiza para no vincularla a ti.</li>
          <li><strong>Consentimiento de comunicaciones comerciales:</strong> hasta que lo retires.</li>
        </ul>
      </section>

      <section>
        <h2>7. Tus derechos</h2>
        <p>
          Puedes ejercer en cualquier momento tus derechos de <strong>acceso, rectificación, supresión
          («derecho al olvido»), oposición, limitación del tratamiento, portabilidad</strong> y a
          <strong> retirar el consentimiento</strong> prestado, escribiendo a {LEGAL.email}. La retirada
          del consentimiento no afecta a la licitud del tratamiento previo.
        </p>
        <p>
          Además, desde tu propia cuenta puedes <strong>eliminar tu perfil de forma autónoma</strong>: al
          hacerlo se borra tu contenido personal, se cancela cualquier suscripción activa y se anonimiza
          la estadística asociada.
        </p>
        <p>
          Si consideras que no hemos atendido correctamente tu solicitud, puedes reclamar ante la
          autoridad de control del país de establecimiento del responsable, la{" "}
          <a href={LEGAL.autoridadControl.url} target="_blank" rel="noopener noreferrer">
            {LEGAL.autoridadControl.nombre} ({LEGAL.autoridadControl.siglas})
          </a>{" "}
          de {LEGAL.pais}. El artículo 77 del RGPD te permite además presentar la reclamación{" "}
          <strong>ante la autoridad de tu propio país de residencia</strong>, que la tramitará y la
          trasladará: si vives en España, puedes dirigirte directamente a la{" "}
          <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">Agencia Española de Protección de Datos</a>.
        </p>
      </section>

      <section>
        <h2>8. Seguridad</h2>
        <p>
          Aplicamos medidas técnicas y organizativas apropiadas: cifrado TLS en tránsito, autenticación
          segura con hash de contraseñas, verificación en dos pasos opcional, políticas de acceso a nivel
          de fila (Row Level Security) en la base de datos y revisión periódica de los controles de
          seguridad.
        </p>
      </section>

      <section>
        <h2>9. Menores de edad</h2>
        <p>
          El Sitio está dirigido exclusivamente a <strong>mayores de {LEGAL.edadMinima} años</strong>. Al
          registrarte declaras cumplir dicha edad. No recogemos de forma consciente datos de menores; si
          detectamos que se ha creado una cuenta incumpliendo este requisito, procederemos a eliminarla.
        </p>
      </section>

      <section>
        <h2>10. Cookies</h2>
        <p>
          Utilizamos almacenamiento y cookies según se detalla en nuestra{" "}
          <a href="/cookies">Política de Cookies</a>.
        </p>
      </section>

      <section>
        <h2>11. Cambios en esta política</h2>
        <p>
          Podemos actualizar esta política para adaptarla a cambios legales o del servicio. Publicaremos
          siempre la versión vigente en esta página, indicando la fecha de última actualización.
        </p>
      </section>

    </LegalShell>
  );
}
