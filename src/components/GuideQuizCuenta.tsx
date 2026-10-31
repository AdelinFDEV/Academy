import Link from "next/link";
import { getGuide } from "@/lib/guides";

/**
 * Lo que ve en el quiz quien no tiene cuenta.
 *
 * Desde el 31-10-2026 las guías se leen enteras sin registrarse; lo único que
 * pide cuenta gratuita es el quiz, porque guarda el resultado y desbloquea el
 * logro de la guía, y eso necesita saber de quién es. Vale para TODAS las
 * guías: cada una envuelve su quiz con `isRegistered ? <Quiz /> : <GuideQuizCuenta />`.
 */
export default function GuideQuizCuenta({ slug }: { slug: string }) {
  const guia = getGuide(slug);
  const vuelta = encodeURIComponent(`/guias/${slug}`);

  return (
    <div className="gbc-paywall">
      <div className="gbc-paywall-badge">🏅 El quiz desbloquea un logro</div>
      <div className="gbc-paywall-t">Crea tu cuenta gratis para hacer el quiz</div>
      <div className="gbc-paywall-d">
        La guía es tuya entera, sin registrarte. El quiz guarda tu resultado y te da el logro
        {guia ? <> <strong>{guia.badge}</strong></> : null}, y para eso necesita saber quién eres.
        Gratis y sin tarjeta.
      </div>
      <Link href={`/register?next=${vuelta}`} className="gbc-paywall-btn">Crear mi cuenta gratis →</Link>
      <div className="gbc-paywall-login">
        ¿Ya tienes cuenta? <Link href={`/login?next=${vuelta}`}>Inicia sesión</Link>
      </div>
    </div>
  );
}
