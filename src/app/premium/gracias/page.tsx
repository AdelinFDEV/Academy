"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Check, Crown, Loader2, NotebookPen, ArrowRight, ArrowUpRight } from "lucide-react";
import { INSTAGRAM_DM_URL } from "@/lib/contacto";
import Tecla from "@/components/cuaderno/Tecla";
import "./gracias.css";

/**
 * Pantalla posterior al pago.
 *
 * Confirma el cobro y lleva a lo que se acaba de pagar. No salta sola al
 * dashboard: quien acaba de pagar quiere saber por dónde empezar, y una página
 * que se va sola no se lee.
 *
 * Estilo «Cuaderno de estudio» desde el 17-11-2026 (ESTILO.md): una hoja de
 * papel con los pasos como un camino corto (hecho en menta, el actual en
 * naranja que late, el siguiente en gris) y los botones-tecla.
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
    <div className="blog-page gr-pagina">
      <main className="gr">
        <div className={`gr-hoja${active ? " is-activa" : ""}`}>
          {active && <span className="gr-pegatina" aria-hidden="true">Tu<br />Premium</span>}

          <div className="gr-icono" aria-hidden="true">
            {active ? <Crown size={34} /> : <Loader2 size={34} className="gr-girando" />}
          </div>

          <p className="gr-mano">{active ? "¡ya está!" : "un momento…"}</p>
          <h1 className="gr-titulo">
            {active ? <>¡Bienvenido a <span className="fluor">Premium</span>!</> : "Activando tu suscripción…"}
          </h1>
          <p className="gr-sub" aria-live="polite">
            {active
              ? "Tu cuenta ya tiene acceso completo. Por aquí puedes empezar."
              : waited
                ? "El pago se está confirmando. Puede tardar un momento; tu acceso se activará en cuanto Stripe nos lo confirme."
                : "Gracias por tu pago. Estamos confirmando la suscripción con Stripe."}
          </p>

          {active && (
            <>
              <ol className="gr-pasos">
                <li className="gr-paso gr-paso--hecho">
                  <span className="gr-paso-num" aria-hidden="true"><Check size={18} strokeWidth={3.2} /></span>
                  <div>
                    <strong>Pago confirmado</strong>
                    <span>Ya tienes acceso al Diario de Trading, al Portfolio Adelin y a todos los cursos.</span>
                  </div>
                </li>
                <li className="gr-paso gr-paso--activo">
                  <span className="gr-paso-num" aria-hidden="true">1</span>
                  <div>
                    <strong>Apunta tu primera operación</strong>
                    <span>
                      En el <b>Diario de Trading</b>, con su riesgo y por qué la tomas. Desde ahí
                      el diario empieza a calcular tus estadísticas.
                    </span>
                  </div>
                </li>
                <li className="gr-paso">
                  <span className="gr-paso-num" aria-hidden="true">2</span>
                  <div>
                    <strong>Mira mi cartera</strong>
                    <span>
                      En el <Link href="/portfolio">Portfolio Adelin</Link> tienes mis posiciones reales, con su precio de
                      entrada y la rentabilidad de cada una.
                    </span>
                  </div>
                </li>
              </ol>

              <div className="gr-acciones">
                <Tecla href="/dashboard/trading" tamano="grande">
                  <NotebookPen size={18} aria-hidden="true" />
                  Empezar mi diario
                  <ArrowRight size={18} strokeWidth={2.6} aria-hidden="true" />
                </Tecla>
                <Tecla href="/dashboard" color="blanca">Ir a mi dashboard</Tecla>
              </div>

              <p className="gr-ayuda">
                ¿Alguna duda?{" "}
                <a href={INSTAGRAM_DM_URL} target="_blank" rel="noopener noreferrer">
                  Escríbeme por Instagram <ArrowUpRight size={13} strokeWidth={2.6} aria-hidden="true" />
                </a>{" "}
                y te ayudo.
              </p>
            </>
          )}

          {!active && (
            <div className="gr-acciones">
              <Tecla href="/dashboard" color="blanca">
                Ir a mi dashboard <ArrowRight size={16} strokeWidth={2.6} aria-hidden="true" />
              </Tecla>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
