import Link from "next/link";
import SocialLinks from "@/components/SocialLinks";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand-col">
          <Link href="/" className="footer-brand">
            adelin<span>btc</span>
          </Link>
          <p className="footer-tagline">
            Formación crypto profesional. Análisis, educación blockchain
            y herramientas para operar con criterio.
          </p>
          <SocialLinks variant="footer" />
        </div>

        <div className="footer-links-group">
          <span className="footer-links-title">Navegación</span>
          <Link href="/">Inicio</Link>
          <Link href="/#contenido">Artículos</Link>
          <Link href="/dashboard">Mi academia</Link>
        </div>

        <div className="footer-links-group">
          <span className="footer-links-title">Cuenta</span>
          <Link href="/login">Iniciar sesión</Link>
          <Link href="/register">Crear cuenta</Link>
        </div>

        <div className="footer-links-group">
          <span className="footer-links-title">Academia</span>
          <Link href="/dashboard">Mi dashboard</Link>
          <Link href="/articulos">Artículos</Link>
          <Link href="/premium" className="footer-premium-link">Hazte Premium →</Link>
        </div>

        <div className="footer-links-group">
          <span className="footer-links-title">Legal</span>
          <Link href="/aviso-legal">Aviso legal</Link>
          <Link href="/privacidad">Privacidad</Link>
          <Link href="/cookies">Cookies</Link>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {year} AdelinBTC Academy. Todos los derechos reservados.</span>
        <span className="footer-disclaimer">
          El contenido es educativo y no constituye asesoramiento financiero.{" "}
          <Link href="/cookies" className="footer-cookie-link">Gestionar cookies</Link>
        </span>
      </div>
    </footer>
  );
}
