import Stripe from "stripe";

/**
 * Enlace de pago (Payment Link) de la suscripción Premium mensual.
 * Se puede sobreescribir con STRIPE_PAYMENT_LINK por si cambia sin tocar código.
 */
export const PAYMENT_LINK =
  process.env.STRIPE_PAYMENT_LINK ??
  "https://buy.stripe.com/00w3cvgC86CGbKReVTaZi02";

/**
 * Construye la URL del checkout enlazando el pago con el usuario de Supabase.
 * - client_reference_id: id del usuario → lo recibimos en el webhook para saber
 *   a quién activar Premium, sin depender del email.
 * - prefilled_email: rellena el email en Stripe por comodidad.
 */
export function buildCheckoutUrl(userId: string, email?: string | null) {
  const url = new URL(PAYMENT_LINK);
  url.searchParams.set("client_reference_id", userId);
  if (email) url.searchParams.set("prefilled_email", email);
  return url.toString();
}

/** Instancia de Stripe para el servidor (webhooks). Lazy para no romper si
 *  falta la clave en entornos donde no se use (p.ej. build). */
let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("Falta STRIPE_SECRET_KEY en el entorno.");
    _stripe = new Stripe(key);
  }
  return _stripe;
}

/** Estados de Stripe que dan derecho a Premium. */
export function statusGrantsPremium(status?: string | null): boolean {
  return status === "active" || status === "trialing";
}
