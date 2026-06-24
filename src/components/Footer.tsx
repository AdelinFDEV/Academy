import Link from "next/link";

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
          <span className="footer-links-title">Legal</span>
          <Link href="/privacidad">Privacidad</Link>
          <Link href="/terminos">Términos</Link>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {year} AdelinBTC Academy. Todos los derechos reservados.</span>
        <span className="footer-disclaimer">
          El contenido es educativo y no constituye asesoramiento financiero.
        </span>
      </div>
    </footer>
  );
}
