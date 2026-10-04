import { createClient } from "@/lib/supabase/server";
import { buildCheckoutUrl } from "@/lib/stripe";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Punto único de entrada al pago. Todos los botones "Hazte Premium" pasan por
 * aquí (vía la página /premium) para que el checkout de Stripe quede SIEMPRE
 * enlazado con el usuario que paga.
 *
 *  - Sin sesión  → a registro/login, volviendo luego AQUÍ, y de aquí directo a
 *                  Stripe. Antes volvía a /premium y había que pulsar el botón
 *                  de pago otra vez: un clic más justo donde más gente se cae.
 *  - Ya Premium  → al dashboard (no tiene sentido pagar dos veces).
 *  - Si no       → redirige al Payment Link de Stripe con client_reference_id.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const next = encodeURIComponent("/api/checkout");
    return NextResponse.redirect(new URL(`/register?next=${next}`, request.url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "premium" || profile?.role === "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.redirect(buildCheckoutUrl(user.id, user.email));
}
