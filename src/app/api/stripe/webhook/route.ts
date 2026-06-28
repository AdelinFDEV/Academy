import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe, statusGrantsPremium } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// El webhook necesita el cuerpo SIN procesar para validar la firma y debe
// ejecutarse siempre en el runtime de Node y en cada petición.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  role: string | null;
  premium_since: string | null;
};

/** Stripe ha movido el periodo a nivel de item en versiones recientes; lo
 *  buscamos en ambos sitios para ser robustos. */
function getPeriodEnd(sub: Stripe.Subscription): string | null {
  const top = (sub as unknown as { current_period_end?: number })
    .current_period_end;
  const item = sub.items?.data?.[0]?.current_period_end;
  const ts = top ?? item;
  return ts ? new Date(ts * 1000).toISOString() : null;
}

/**
 * Aplica el estado de la suscripción a un perfil.
 *  - active/trialing → 'premium' (salvo que sea admin, que no se toca).
 *  - cualquier otro  → 'free' (salvo admin). NO borra datos, sólo el rol.
 */
async function applyToProfile(
  admin: ReturnType<typeof createAdminClient>,
  profile: ProfileRow,
  opts: {
    customerId: string | null;
    subscriptionId: string | null;
    status: string | null;
    periodEnd: string | null;
    eventType: string;
  }
) {
  const grantsPremium = statusGrantsPremium(opts.status);
  const isAdmin = profile.role === "admin";

  const update: Record<string, unknown> = {
    subscription_status: opts.status,
    subscription_current_period_end: opts.periodEnd,
  };
  if (opts.customerId) update.stripe_customer_id = opts.customerId;
  if (opts.subscriptionId) update.stripe_subscription_id = opts.subscriptionId;

  let newRole = profile.role;
  if (!isAdmin) {
    newRole = grantsPremium ? "premium" : "free";
    update.role = newRole;
    if (grantsPremium && !profile.premium_since) {
      update.premium_since = new Date().toISOString();
    }
  }

  await admin.from("profiles").update(update).eq("id", profile.id);

  await admin.from("subscription_log").insert({
    user_id: profile.id,
    event_type: opts.eventType,
    status: opts.status,
    new_role: newRole,
  });
}

/** Busca el perfil por id de cliente o de suscripción de Stripe. */
async function findProfile(
  admin: ReturnType<typeof createAdminClient>,
  { customerId, subscriptionId }: { customerId?: string | null; subscriptionId?: string | null }
): Promise<ProfileRow | null> {
  if (customerId) {
    const { data } = await admin
      .from("profiles")
      .select("id, role, premium_since")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    if (data) return data as ProfileRow;
  }
  if (subscriptionId) {
    const { data } = await admin
      .from("profiles")
      .select("id, role, premium_since")
      .eq("stripe_subscription_id", subscriptionId)
      .maybeSingle();
    if (data) return data as ProfileRow;
  }
  return null;
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe-webhook] Falta STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Webhook no configurado" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Falta firma" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    console.error("[stripe-webhook] Firma inválida:", (err as Error).message);
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Idempotencia: si ya procesamos este evento, salimos con éxito.
  const { error: insertErr } = await admin
    .from("stripe_events")
    .insert({ id: event.id, type: event.type });
  if (insertErr) {
    // Conflicto de PK = evento repetido → ya tratado.
    if (insertErr.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("[stripe-webhook] Error registrando evento:", insertErr.message);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  try {
    switch (event.type) {
      // Pago inicial completado: aquí establecemos el vínculo usuario ↔ cliente
      // de Stripe gracias a client_reference_id (el id del usuario de Supabase).
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id ?? null;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id ?? null;

        if (!userId) {
          console.error("[stripe-webhook] checkout sin client_reference_id");
          break;
        }

        const { data: profile } = await admin
          .from("profiles")
          .select("id, role, premium_since")
          .eq("id", userId)
          .maybeSingle();

        if (!profile) {
          console.error("[stripe-webhook] Usuario no encontrado:", userId);
          break;
        }

        let status: string | null = "active";
        let periodEnd: string | null = null;
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          status = sub.status;
          periodEnd = getPeriodEnd(sub);
        }

        await applyToProfile(admin, profile as ProfileRow, {
          customerId,
          subscriptionId,
          status,
          periodEnd,
          eventType: event.type,
        });
        break;
      }

      // Renovaciones, impagos, pausas, cancelaciones programadas, etc.
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;
        const status =
          event.type === "customer.subscription.deleted" ? "canceled" : sub.status;

        const profile = await findProfile(admin, {
          customerId,
          subscriptionId: sub.id,
        });

        if (!profile) {
          // Aún no hay vínculo (lo crea checkout.session.completed). Lo
          // ignoramos: el evento de checkout dejará el estado correcto.
          console.warn("[stripe-webhook] Sin perfil para cliente:", customerId);
          break;
        }

        await applyToProfile(admin, profile, {
          customerId,
          subscriptionId: sub.id,
          status,
          periodEnd: getPeriodEnd(sub),
          eventType: event.type,
        });
        break;
      }

      default:
        // Otros eventos no nos interesan.
        break;
    }
  } catch (err) {
    console.error("[stripe-webhook] Error procesando", event.type, err);
    // Borramos el registro de idempotencia para permitir el reintento de Stripe.
    await admin.from("stripe_events").delete().eq("id", event.id);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
