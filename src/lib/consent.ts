/**
 * Consentimiento de cookies — fuente única.
 *
 * Antes la preferencia se leía y escribía a mano dentro de `CookieBanner`, y
 * nadie más la miraba: el banner guardaba la elección y ahí moría. Eso valía
 * mientras el sitio solo tuviera cookies esenciales, pero en cuanto entra una
 * analítica de terceros el banner deja de ser informativo y pasa a **decidir**
 * si ese script se carga o no.
 *
 * Aquí viven la clave, el evento y los dos accesores. Quien necesite saber si
 * puede cargar algo no esencial pregunta a `leerConsentimiento()` y se suscribe
 * a `CONSENT_EVENT`; nadie vuelve a tocar `localStorage` por su cuenta.
 */

/** `all` = acepta también lo no esencial. `essential` = solo lo imprescindible. */
export type Consentimiento = "all" | "essential";

/**
 * Clave versionada, y la versión importa.
 *
 * El banner anterior decía literalmente «no usamos cookies de publicidad ni de
 * rastreo». Quien pulsó «Aceptar todas» aceptó *eso*, no una analítica de
 * Google. El consentimiento del RGPD tiene que ser informado, así que al
 * cambiar lo que se pide hay que volver a preguntar: por eso la clave sube a
 * `_v2` en vez de reutilizar la respuesta vieja.
 */
export const CONSENT_KEY = "cookie_consent_v2";

/** Se emite en `window` al elegir, para que los oyentes reaccionen sin recargar. */
export const CONSENT_EVENT = "consentimiento-cookies";

/** La preferencia guardada, o `null` si todavía no ha elegido. */
export function leerConsentimiento(): Consentimiento | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    return v === "all" || v === "essential" ? v : null;
  } catch {
    // Modo privado o almacenamiento bloqueado: se trata como «no ha elegido»,
    // que es lo conservador — sin elección no se carga nada opcional.
    return null;
  }
}

/** Guarda la elección y avisa a quien esté escuchando. */
export function guardarConsentimiento(valor: Consentimiento): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONSENT_KEY, valor);
  } catch {
    // Si no se puede persistir, al menos la sesión actual respeta la elección.
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: valor }));
}

/** ¿Puede cargarse algo que no sea estrictamente necesario? */
export function aceptaNoEsenciales(): boolean {
  return leerConsentimiento() === "all";
}
