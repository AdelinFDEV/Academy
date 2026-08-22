import Link from "next/link";
import { Send, ArrowRight } from "lucide-react";

/**
 * Aviso del paso que le falta al usuario para estar del todo dentro.
 *
 * Existe porque el acceso al canal de Telegram no es automático al pagar: hay
 * que vincular la cuenta y pedir entrada. Quien no lo sabía se quedaba pagando
 * sin usar la comunidad, que es justo lo que más adelanta a una baja.
 *
 * No se muestra a quien ya lo tiene resuelto: un aviso permanente que no se
 * puede completar deja de leerse a los dos días.
 */
export default function SiguientePasoTelegram({
  isPremium,
  telegramVinculado,
}: {
  isPremium: boolean;
  telegramVinculado: boolean;
}) {
  if (!isPremium || telegramVinculado) return null;

  return (
    <div className="paso-telegram">
      <span className="paso-telegram-icon" aria-hidden="true">
        <Send size={18} />
      </span>

      <div className="paso-telegram-texto">
        <strong>Te falta un paso: entra en la comunidad</strong>
        <span>
          Vincula tu Telegram desde Mi cuenta y te abro el canal privado al instante.
          Está incluido en tu Premium.
        </span>
      </div>

      <Link href="/cuenta" className="paso-telegram-btn">
        Vincular ahora
        <ArrowRight size={15} aria-hidden="true" />
      </Link>
    </div>
  );
}
