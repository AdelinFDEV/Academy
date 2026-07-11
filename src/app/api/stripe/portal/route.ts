import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login?next=/cuenta`);
  }

  // `stripe_customer_id` no tiene GRANT SELECT para `authenticated` (ver
  // /cuenta y /dashboard/trading) — se lee con el cliente admin tras
  // verificar la sesión arriba con el cliente normal.
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, stripe_customer_id")
    .eq("id", user.id)
    .single();

  // Admins and users without a Stripe record don't go through the portal.
  if (!profile?.stripe_customer_id) {
    const isPremium = profile?.role === "premium" || profile?.role === "admin";
    return NextResponse.redirect(isPremium ? `${origin}/cuenta` : `${origin}/premium`);
  }

  try {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/cuenta`,
    });
    return NextResponse.redirect(session.url);
  } catch (err) {
    console.error("[stripe-portal] Error creando sesión:", err);
    return NextResponse.redirect(`${origin}/cuenta?portal_error=1`);
  }
}
