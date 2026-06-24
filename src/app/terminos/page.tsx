import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Términos y condiciones | AdelinBTC Academy",
};

export default function TerminosPage() {
  return (
    <div className="blog-page">
      <div className="bg-ambient" />

      <nav className="blog-nav">
        <Link href="/" className="blog-brand">adelin<span>btc</span></Link>
        <div className="blog-nav-links">
          <Link href="/">← Volver al inicio</Link>
        </div>
      </nav>

      <main className="post-page legal-page">
        <h1 className="post-title">Términos y condiciones</h1>
        <p className="legal-updated">Última actualización: pendiente de revisión</p>

        <div className="post-content">
          <p>
            Al usar AdelinBTC Academy aceptas los siguientes términos. Léelos con
            atención.
          </p>

          <h2>Uso del servicio</h2>
          <p>
            El contenido de la plataforma es de carácter educativo. No constituye
            asesoramiento financiero, de inversión ni recomendación de compra o venta
            de ningún activo.
          </p>

          <h2>Cuentas y suscripciones</h2>
          <p>
            Eres responsable de mantener la confidencialidad de tu cuenta. Los planes
            premium se renuevan según las condiciones indicadas en el momento de la
            compra.
          </p>

          <h2>Propiedad intelectual</h2>
          <p>
            Todo el contenido publicado pertenece a AdelinBTC Academy y no puede
            reproducirse sin autorización.
          </p>

          <h2>Limitación de responsabilidad</h2>
          <p>
            Las decisiones de inversión son responsabilidad exclusiva del usuario.
            No nos hacemos responsables de pérdidas derivadas del uso de la información
            publicada.
          </p>

          <p>
            <em>Este texto es una plantilla. Sustitúyelo por tus términos definitivos
            antes de lanzar el sistema de pagos.</em>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
