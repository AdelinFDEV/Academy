import Link from "next/link";
import { Crown, ShieldAlert } from "lucide-react";
import SocialLinks from "@/components/SocialLinks";
import { DefiLlamaGlyph, CoinGeckoGlyph, MexcGlyph } from "@/components/BrandMarks";

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
          <Link href="/premium" className="footer-premium-link">
            <Crown size={14} strokeWidth={2.4} aria-hidden="true" />
            Hazte Premium
          </Link>
        </div>

        <div className="footer-links-group">
          <span className="footer-links-title">Legal</span>
          <Link href="/aviso-legal">Aviso legal</Link>
          <Link href="/privacidad">Privacidad</Link>
          <Link href="/cookies">Cookies</Link>
        </div>
      </div>

      <div className="footer-partners">
        <span className="footer-partners-label">En colaboración con</span>
        <div className="footer-partners-list">
          <a
            href="https://defillama.com/unlocks"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-partner footer-partner--dl"
            title="Datos de liberaciones por DefiLlama"
          >
            <span className="footer-partner-mark footer-partner-mark--dl"><DefiLlamaGlyph /></span>
            <span className="footer-partner-word">Defi<span>Llama</span></span>
          </a>
          <a
            href="https://www.coingecko.com"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-partner footer-partner--cg"
            title="Datos de mercado por CoinGecko"
          >
            <span className="footer-partner-mark footer-partner-mark--cg"><CoinGeckoGlyph /></span>
            <span className="footer-partner-word">Coin<span>Gecko</span></span>
          </a>
          <a
            href="https://www.mexc.com/es/register?inviteCode=mexc-1xydM"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-partner footer-partner--mx"
            title="Abre tu cuenta en MEXC"
          >
            <span className="footer-partner-mark footer-partner-mark--mx"><MexcGlyph /></span>
            <span className="footer-partner-word">MEXC</span>
          </a>
        </div>
      </div>

      <div className="footer-disclaimer-band">
        <div className="footer-disclaimer-inner">
          <ShieldAlert size={20} className="footer-disclaimer-icon" aria-hidden="true" />
          <div>
            <p className="footer-disclaimer-title">Aviso de riesgo</p>
            <p className="footer-disclaimer-text">
              El contenido de AdelinBTC Academy tiene fines exclusivamente educativos e informativos y no
              constituye asesoramiento financiero, de inversión, legal ni fiscal. Las criptomonedas son activos
              de alto riesgo y alta volatilidad: su valor puede caer drásticamente y podrías perder la totalidad
              del capital invertido. Rentabilidades pasadas no garantizan resultados futuros. Ninguna herramienta,
              guía o análisis de esta web debe interpretarse como una recomendación de compra o venta. Realiza
              siempre tu propia investigación (DYOR) y consulta con un asesor financiero cualificado antes de
              tomar decisiones de inversión.
            </p>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {year} AdelinBTC Academy. Todos los derechos reservados.</span>
      </div>
    </footer>
  );
}
