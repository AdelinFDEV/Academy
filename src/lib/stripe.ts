import Stripe from "stripe";

/**
 * Enlace de pago (Payment Link) de la suscripción Premium mensual.
 * Se puede sobreescribir con STRIPE_PAYMENT_LINK por si cambia sin tocar código.
 *
 * OJO al subir el precio: un Payment Link guarda el precio concreto con el que
 * se creó, así que NO basta con marcar el precio nuevo como predeterminado en
 * el producto — hay que crear un enlace nuevo y cambiarlo aquí. Este valor por
 * defecto tiene que apuntar SIEMPRE al precio vigente: si se queda con uno
 * viejo, el día que falte la variable de entorno la web cobra de menos sin dar
 * ningún error. El enlace anterior, de la tarifa de lanzamiento de 19,99 €,
 * era 00w3cvgC86CGbKReVTaZi02.
 */
export const PAYMENT_LINK =
  process.env.STRIPE_PAYMENT_LINK ??
  "https://buy.stripe.com/28E7sL4Tqe583el00ZaZi03";

/**
 * Precio mensual del Premium, en euros. Es el ÚNICO sitio donde se escribe el
 * importe: el panel, el bot y la página de cuenta tiran de aquí.
 *
 * Ojo: es el precio ACTUAL. Stripe no toca las suscripciones ya existentes, así
 * que quien entre con esta tarifa la conserva aunque el precio suba después. El
 * día que haya suscriptores de dos épocas, las cifras del panel y el importe de
 * /cuenta pasan a ser aproximados y habrá que leer el real de Stripe.
 */
export const PREMIUM_PRICE_EUR = 49.99;

/** 49.99 → "49,99€". Formato español: coma decimal y el símbolo detrás. */
export function precioEur(n: number): string {
  return `${n.toFixed(2).replace(".", ",")}€`;
}

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
