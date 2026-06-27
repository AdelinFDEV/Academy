import Link from "next/link";
import Footer from "@/components/Footer";
import LiveCounter from "@/components/LiveCounter";

export const metadata = {
  title: "Política de privacidad | AdelinBTC Academy",
};

export default function PrivacidadPage() {
  return (
    <div className="blog-page">
      <div className="bg-ambient" />

      <nav className="blog-nav">
        <Link href="/" className="blog-brand">adelin<span>btc</span></Link>
        <LiveCounter />
        <div className="blog-nav-links">
          <Link href="/">← Volver al inicio</Link>
        </div>
      </nav>

      <main className="post-page legal-page">
        <h1 className="post-title">Política de privacidad</h1>
        <p className="legal-updated">Última actualización: pendiente de revisión</p>

        <div className="post-content">
          <p>
            En AdelinBTC Academy nos tomamos en serio tu privacidad. Esta página
            describe qué datos recogemos, con qué finalidad y cuáles son tus derechos.
          </p>

          <h2>Datos que recogemos</h2>
          <p>
            Al crear una cuenta recogemos tu nombre y tu dirección de correo
            electrónico. Si te suscribes a un plan de pago, el procesamiento del pago
            lo gestiona nuestro proveedor (Stripe); no almacenamos los datos de tu
            tarjeta en nuestros servidores.
          </p>

          <h2>Uso de los datos</h2>
          <p>
            Usamos tus datos para gestionar tu cuenta, darte acceso al contenido
            y comunicarnos contigo sobre el servicio.
          </p>

          <h2>Tus derechos</h2>
          <p>
            Puedes solicitar el acceso, la rectificación o la eliminación de tus
            datos escribiendo a nuestro correo de contacto.
          </p>

          <p>
            <em>Este texto es una plantilla. Sustitúyelo por tu política definitiva
            antes de lanzar el sistema de pagos.</em>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
