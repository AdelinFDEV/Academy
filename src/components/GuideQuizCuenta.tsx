import Link from "next/link";
import { Lock, Trophy } from "lucide-react";
import { getGuide } from "@/lib/guides";
import Tecla from "@/components/cuaderno/Tecla";

/**
 * Lo que ve en el quiz quien no tiene cuenta.
 *
 * Desde el 31-10-2026 las guías se leen enteras sin registrarse; lo único que
 * pide cuenta gratuita es el quiz, porque guarda el resultado y desbloquea el
 * logro de la guía, y eso necesita saber de quién es. Vale para TODAS las
 * guías: cada una envuelve su quiz con `isRegistered ? <Quiz /> : <GuideQuizCuenta />`.
 *
 * Estilo «Cuaderno de estudio»: una hoja con la pegatina del logro (amarillo,
 * el color de los logros) y la tecla naranja de la acción. CSS en guias.css.
 */
export default function GuideQuizCuenta({ slug }: { slug: string }) {
  const guia = getGuide(slug);
  const vuelta = encodeURIComponent(`/guias/${slug}`);

  return (
    <div className="qzc">
      <span className="qzc-pegatina" aria-hidden="true">
        <Trophy size={30} strokeWidth={2.2} />
        <span className="qzc-candado"><Lock size={13} strokeWidth={3} /></span>
      </span>
      <div className="qzc-cuerpo">
        <div className="qzc-chip">El quiz desbloquea un logro</div>
        <div className="qzc-t">Crea tu cuenta gratis para hacer el quiz</div>
        <div className="qzc-d">
          La guía es tuya entera, sin registrarte. El quiz guarda tu resultado y te da el logro
          {guia ? <> <strong>{guia.badge}</strong></> : null}, y para eso necesita saber quién eres.
          Gratis y sin tarjeta.
        </div>
        <Tecla href={`/register?next=${vuelta}`} color="naranja" className="qzc-boton">
          Crear mi cuenta gratis →
        </Tecla>
        <div className="qzc-login">
          ¿Ya tienes cuenta? <Link href={`/login?next=${vuelta}`}>Inicia sesión</Link>
        </div>
      </div>
    </div>
  );
}
