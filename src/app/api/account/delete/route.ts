import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

// Tablas con datos propios del usuario que se borran por completo. Se borran
// explícitamente en vez de fiarse solo del "on delete cascade" de la FK,
// porque varias de estas tablas se crearon a mano en Supabase y no podemos
// verificar remotamente si tienen esa cascada configurada — así el borrado
// funciona siempre, tenga o no cascada la base de datos.
const OWNED_TABLES = [
  "comments",
  "guide_likes",
  "guide_saves",
  "guide_quiz_completions",
  "portfolio_positions",
  "saved_terms",
  "user_posts",
  "trades",
  "watchlist",
  "user_badges",
  "post_likes",
] as const;

// Tablas de analítica/auditoría: no se borran, se anonimizan (user_id →
// null) para no perder totales históricos ni el rastro de facturación.
const ANONYMIZE_TABLES = [
  "guide_visits",
  "guide_shares",
  "post_shares",
  "site_visits",
  "subscription_log",
] as const;

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, stripe_subscription_id, subscription_status")
    .eq("id", user.id)
    .single();

  // Salvaguarda: evita que un admin se borre a sí mismo por error y se
  // quede el proyecto sin nadie con acceso al panel.
  if (profile?.role === "admin") {
    return NextResponse.json(
      { error: "Los administradores no pueden eliminar su cuenta desde aquí. Contacta con soporte." },
      { status: 403 }
    );
  }

  // Si hay una suscripción de Stripe activa, se cancela YA (no al final del
  // periodo) antes de borrar nada. Si esto falla, abortamos: mejor dejar la
  // cuenta intacta que borrarla con un cobro recurrente huérfano en Stripe.
  const hasActiveSub =
    profile?.stripe_subscription_id &&
    (profile.subscription_status === "active" || profile.subscription_status === "trialing");

  if (hasActiveSub) {
    try {
      const stripe = getStripe();
      await stripe.subscriptions.cancel(profile!.stripe_subscription_id!);
    } catch (err) {
      // Si Stripe dice que ya no está activa (p.ej. el webhook la canceló
      // justo antes que nosotros), no es un fallo real: seguimos adelante.
      const message = err instanceof Error ? err.message : "";
      const alreadyInactive = /already|not in an active|no such subscription/i.test(message);

      if (!alreadyInactive) {
        console.error("[account-delete] No se pudo cancelar la suscripción de Stripe:", err);
        return NextResponse.json(
          { error: "No se pudo cancelar tu suscripción activa. Inténtalo de nuevo en unos minutos o contacta con soporte." },
          { status: 502 }
        );
      }
    }
  }

  const admin = createAdminClient();

  for (const table of OWNED_TABLES) {
    const { error } = await admin.from(table).delete().eq("user_id", user.id);
    if (error) {
      console.error(`[account-delete] Error borrando ${table}:`, error.message);
      return NextResponse.json({ error: "No se pudo eliminar toda tu información. Inténtalo de nuevo." }, { status: 500 });
    }
  }

  for (const table of ANONYMIZE_TABLES) {
    const { error } = await admin.from(table).update({ user_id: null }).eq("user_id", user.id);
    if (error) {
      console.error(`[account-delete] Error anonimizando ${table}:`, error.message);
      return NextResponse.json({ error: "No se pudo eliminar toda tu información. Inténtalo de nuevo." }, { status: 500 });
    }
  }

  // Borra al usuario de auth.users. profiles cae en cascada (on delete cascade).
  const { error: authErr } = await admin.auth.admin.deleteUser(user.id);
  if (authErr) {
    console.error("[account-delete] Error borrando el usuario de auth:", authErr.message);
    return NextResponse.json({ error: "No se pudo eliminar la cuenta. Inténtalo de nuevo." }, { status: 500 });
  }

  // Limpia la sesión/cookies del navegador.
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
