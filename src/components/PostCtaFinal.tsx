import Link from "next/link";
import { ArrowRight, Send } from "lucide-react";
import { TELEGRAM_ADELIN_URL } from "@/lib/contacto";

const CANAL_FREE_URL = "https://t.me/FreeAdelinBTC";

/**
 * Cierre fijo al final de cada entrada.
 *
 * Sustituye a los dos bloques sueltos que había antes (uno para invitados y
 * otro para usuarios free), por dos motivos: ninguno mencionaba Telegram, y
 * quien ya era Premium terminaba de leer y no encontraba nada — justo el
 * lector más fiel se quedaba sin siguiente paso.
 *
 * El mensaje cambia según quién lee: a nadie se le ofrece algo que ya tiene.
 */
export default function PostCtaFinal({
  logueado,
  esPremium,
}: {
  logueado: boolean;
  esPremium: boolean;
}) {
  if (esPremium) {
    return (
      <div className="post-cierre post-cierre--premium">
        <span className="post-cierre-tag">COMUNIDAD</span>
        <h3>Comenta esto en el canal privado</h3>
        <p>
          Tienes el canal Premium incluido en tu suscripción, y a mí al otro lado: si algo de
          este análisis te ha dejado dudas, escríbeme y lo vemos.
        </p>
        <div className="post-cierre-acciones">
          <Link href="/cuenta" className="post-cierre-btn">
            <Send size={15} aria-hidden="true" />
            Ir al canal privado
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
          <a
            href={TELEGRAM_ADELIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="post-cierre-btn post-cierre-btn--alt"
          >
            Escríbeme
          </a>
        </div>
      </div>
    );
  }

  if (logueado) {
    return (
      <div className="post-cierre">
        <span className="post-cierre-tag">PREMIUM</span>
        <h3>¿Quieres más contenido como este?</h3>
        <p>
          Con Premium desbloqueas todos los análisis avanzados, el diario de trading y el
          canal privado de Telegram, donde puedes escribirme directamente. 19,99€/mes,
          sin permanencia.
        </p>
        <div className="post-cierre-acciones">
          <Link href="/premium" className="post-cierre-btn">
            Ver planes Premium
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
          <a
            href={CANAL_FREE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="post-cierre-btn post-cierre-btn--alt"
          >
            <Send size={15} aria-hidden="true" />
            Canal gratuito
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="post-cierre">
      <span className="post-cierre-tag">EMPIEZA AQUÍ</span>
      <h3>¿Te ha resultado útil?</h3>
      <p>
        Únete al canal de Telegram para no perderte los próximos análisis, y crea tu cuenta
        gratis para acceder a las guías y herramientas. Sin tarjeta, en 30 segundos.
      </p>
      <div className="post-cierre-acciones">
        <a
          href={CANAL_FREE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="post-cierre-btn"
        >
          <Send size={15} aria-hidden="true" />
          Unirme al Telegram
        </a>
        <Link href="/register" className="post-cierre-btn post-cierre-btn--alt">
          Crear cuenta gratis
        </Link>
      </div>
    </div>
  );
}
