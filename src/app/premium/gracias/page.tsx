"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Crown, Loader2, NotebookPen, ArrowRight, MessageCircle } from "lucide-react";
import { INSTAGRAM_DM_URL } from "@/lib/contacto";

/**
 * Pantalla posterior al pago.
 *
 * Confirma el cobro y lleva a lo que se acaba de pagar: el Diario de Trading y
 * el Portfolio Adelin. No salta sola al dashboard: quien acaba de pagar quiere
 * saber por dónde empezar, y una página que se va sola no se lee.
 *
 * Hasta el 05-11-2026 explicaba cómo vincular Telegram y entrar en el canal
 * privado; Telegram se retiró de la web ese día.
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
                    <span>Ya tienes acceso al Diario de Trading y al Portfolio Adelin.</span>
                  </div>
                </li>
                <li className="gracias-paso gracias-paso--activo">
                  <span className="gracias-paso-num">1</span>
                  <div>
                    <strong>Apunta tu primera operación</strong>
                    <span>
                      En el <b>Diario de Trading</b>, con su riesgo y por qué la tomas. Desde ahí
                      el diario empieza a calcular tus estadísticas.
                    </span>
                  </div>
                </li>
                <li className="gracias-paso">
                  <span className="gracias-paso-num">2</span>
                  <div>
                    <strong>Mira mi cartera</strong>
                    <span>
                      En el <b>Portfolio Adelin</b> tienes mis posiciones reales, con su precio de
                      entrada y la rentabilidad de cada una.
                    </span>
                  </div>
                </li>
              </ol>

              <div className="premium-gate-actions gracias-acciones">
                <Link href="/dashboard/trading" className="btn-primary">
                  <NotebookPen size={16} aria-hidden="true" />
                  Empezar mi diario
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
                <Link href="/dashboard" className="gracias-btn-secundario">
                  Ir a mi academia
                </Link>
              </div>

              <p className="gracias-ayuda">
                <MessageCircle size={13} aria-hidden="true" />
                ¿Alguna duda?{" "}
                <a href={INSTAGRAM_DM_URL} target="_blank" rel="noopener noreferrer">
                  Escríbeme por Instagram
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
