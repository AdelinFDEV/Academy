"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Crown, Loader2, Send, ArrowRight, MessageCircle } from "lucide-react";
import { TELEGRAM_ADELIN_URL } from "@/lib/contacto";

/**
 * Pantalla posterior al pago.
 *
 * Antes se limitaba a confirmar el cobro y saltaba sola al dashboard en un
 * segundo y medio. El problema: el acceso al canal de Telegram NO es
 * automático — hay que vincular la cuenta y pedir entrada — y ese paso se
 * quedaba sin contar. La gente pagaba y no sabía que le faltaba algo.
 *
 * Ahora el salto automático se quita a propósito y en su lugar se explican los
 * dos pasos que quedan. Que la página se vaya sola justo cuando hay algo que
 * leer era exactamente lo contrario de lo que hacía falta.
 */
export default function GraciasPage() {
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let tries = 0;

    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login?next=/premium/gracias");
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (cancelled) return;

      if (data?.role === "premium" || data?.role === "admin") {
        setActive(true);
        return;
      }

      tries += 1;
      if (tries >= 10) {
        setWaited(true); // ~20s sin confirmación
        return;
      }
      setTimeout(check, 2000);
    }

    check();
    return () => { cancelled = true; };
  }, [router]);

  return (
    <div className="blog-page">
      <div className="bg-ambient" />
      <main className="blog-main premium-gate-page">
        <div className="premium-gate-unlocked">
          <div className="premium-gate-unlocked-icon">
            {active ? <Crown size={34} aria-hidden="true" /> : <Loader2 size={34} className="spin" aria-hidden="true" />}
          </div>
          <h1 className="premium-gate-unlocked-title">
            {active ? "¡Bienvenido a Premium!" : "Activando tu suscripción…"}
          </h1>
          <p className="premium-gate-unlocked-sub">
            {active
              ? "Tu cuenta ya tiene acceso completo. Te queda un último paso para entrar en la comunidad."
              : waited
                ? "El pago se está confirmando. Puede tardar un momento; tu acceso se activará en cuanto Stripe nos lo confirme."
                : "Gracias por tu pago. Estamos confirmando la suscripción con Stripe."}
          </p>

          {active && (
            <>
              <ol className="gracias-pasos">
                <li className="gracias-paso gracias-paso--hecho">
                  <span className="gracias-paso-num">✓</span>
                  <div>
                    <strong>Pago confirmado</strong>
                    <span>Ya tienes acceso a todas las guías y herramientas.</span>
                  </div>
                </li>
                <li className="gracias-paso gracias-paso--activo">
                  <span className="gracias-paso-num">1</span>
                  <div>
                    <strong>Vincula tu Telegram</strong>
                    <span>
                      Entra en <b>Mi cuenta</b> y pulsa «Conectar Telegram». Es un minuto y solo se
                      hace una vez.
                    </span>
                  </div>
                </li>
                <li className="gracias-paso">
                  <span className="gracias-paso-num">2</span>
                  <div>
                    <strong>Pide entrada al canal</strong>
                    <span>
                      En esa misma página aparecerá el botón para entrar. Te acepto al instante,
                      automáticamente.
                    </span>
                  </div>
                </li>
              </ol>

              <div className="premium-gate-actions gracias-acciones">
                <Link href="/cuenta" className="btn-primary">
                  <Send size={16} aria-hidden="true" />
                  Vincular Telegram ahora
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
                <Link href="/dashboard" className="gracias-btn-secundario">
                  Ir a mi academia
                </Link>
              </div>

              <p className="gracias-ayuda">
                <MessageCircle size={13} aria-hidden="true" />
                ¿Alguna duda?{" "}
                <a href={TELEGRAM_ADELIN_URL} target="_blank" rel="noopener noreferrer">
                  Escríbeme por Telegram
                </a>{" "}
                y te ayudo.
              </p>
            </>
          )}

          {!active && (
            <div className="premium-gate-actions">
              <Link href="/dashboard" className="btn-primary">Ir a mi academia →</Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
