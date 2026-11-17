import Link from "next/link";
import { Crown, ShieldAlert } from "lucide-react";
import SocialLinks from "@/components/SocialLinks";
import { CoinGeckoGlyph } from "@/components/BrandMarks";
import Tecla from "@/components/cuaderno/Tecla";
import { detalleDe, herramienta } from "@/lib/herramientas";
import "./footer.css";

/**
 * El pie de todas las páginas. Estilo «Cuaderno de estudio» desde el
 * 17-11-2026 (ESTILO.md): una hoja de papel sobre el fondo lavanda, la marca
 * en Fraunces, cada columna con su color y el aviso de riesgo en amarillo, que
 * es el color del riesgo en el sistema de diseño. Su CSS vive en `footer.css`.
 *
 * Las columnas, por lo que busca quien llega al final de una página (repaso
 * del 17-11-2026: antes «Navegación» solo tenía Inicio y Guías): lo gratuito,
 * las tres piezas de pago, la cuenta y lo legal. Los nombres y las rutas de las
 * herramientas salen del catálogo (`@/lib/herramientas`, fuente única), y
 * van a su ficha pública: el pie no sabe quién mira. El foro no está porque
 * solo existe para quien puede entrar (lo decide la barra).
 */
export default function Footer() {
  const year = new Date().getFullYear();
  const prediccion = herramienta("prediccion");
  const diario = herramienta("diario");
  const cartera = herramienta("portfolio");
  const cursos = herramienta("cursos");

  return (
    <footer className="site-footer">
      <div className="footer-hoja">
        <div className="footer-inner">
          <div className="footer-brand-col">
            <Link href="/" className="footer-brand">
              Adelin<em>BTC</em>
            </Link>
            <p className="footer-tagline">
              Formación crypto profesional. Análisis, educación blockchain
              y herramientas para operar con criterio.
            </p>
            <SocialLinks />
            <p className="footer-nota" aria-hidden="true">↑ aquí me encuentras</p>
          </div>

          <div className="footer-links-group footer-tono--cielo">
            <span className="footer-links-title">Aprende gratis</span>
            {/* Las guías, por su catálogo: hasta el 31-10-2026 el pie las
                listaba todas, una a una, y con muchas guías rompía el diseño. */}
            <Link href="/guias">Guías</Link>
            <Link href="/glosario">Diccionario cripto</Link>
            <Link href={detalleDe(prediccion)}>{prediccion.label}</Link>
          </div>

          <div className="footer-links-group footer-tono--naranja">
            <span className="footer-links-title">Premium</span>
            <Link href={detalleDe(diario)}>{diario.label}</Link>
            <Link href={detalleDe(cartera)}>{cartera.label}</Link>
            <Link href={detalleDe(cursos)}>{cursos.label}</Link>
            <Tecla href="/premium" tamano="peq" className="footer-premium-link">
              <Crown size={14} strokeWidth={2.6} aria-hidden="true" />
              Hazte Premium
            </Tecla>
          </div>

          <div className="footer-links-group footer-tono--azul">
            <span className="footer-links-title">Tu cuenta</span>
            <Link href="/dashboard">Mi dashboard</Link>
            <Link href="/login">Iniciar sesión</Link>
            <Link href="/register">Crear cuenta</Link>
          </div>

          <div className="footer-links-group footer-tono--lila">
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
              href="https://www.coingecko.com"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-partner footer-partner--cg"
              title="Datos de mercado por CoinGecko"
            >
              <span className="footer-partner-mark footer-partner-mark--cg"><CoinGeckoGlyph /></span>
              <span className="footer-partner-texto">
                <span className="footer-partner-word">Coin<span>Gecko</span></span>
                <span className="footer-partner-que">Datos de mercado en tiempo real</span>
              </span>
            </a>
          </div>
        </div>
      </div>

      <div className="footer-disclaimer-band">
        <div className="footer-disclaimer-inner">
          <span className="footer-disclaimer-icon" aria-hidden="true">
            <ShieldAlert size={20} strokeWidth={2.4} />
          </span>
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
            {/* Misma cláusula que cierra <DisclaimerRiesgo> en las herramientas.
                Va también aquí porque el pie sale en TODAS las páginas: es el
                único sitio que cubre también las guías y el foro. */}
            <p className="footer-disclaimer-text">
              <strong>Tú decides y tú respondes.</strong> El uso que hagas de cualquier información publicada en
              esta web —cifras, operaciones, análisis, estadísticas o herramientas— es responsabilidad
              exclusivamente tuya. Ninguna decisión de inversión que tomes a partir de este contenido genera
              responsabilidad alguna para AdelinBTC Academy ni para su autor. <strong>Esto no es un grupo de
              señales</strong>: no se te dice qué comprar, ni cuándo, ni a qué precio, y no se recomienda copiar
              ninguna operación.
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
