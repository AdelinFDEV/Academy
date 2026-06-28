"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Crown, Loader2 } from "lucide-react";

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
        router.replace("/login?next=/dashboard");
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
        setTimeout(() => router.replace("/dashboard"), 1500);
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
              ? "Tu cuenta ya tiene acceso completo. Te llevamos a tu academia…"
              : waited
                ? "El pago se está confirmando. Puede tardar un momento; tu acceso se activará en cuanto Stripe nos lo confirme."
                : "Gracias por tu pago. Estamos confirmando la suscripción con Stripe."}
          </p>
          <div className="premium-gate-actions">
            <Link href="/dashboard" className="btn-primary">Ir a mi academia →</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
