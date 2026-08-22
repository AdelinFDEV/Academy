/**
 * Política de correos aceptados en el registro.
 *
 * Solo Gmail y Proton Mail. La razón es práctica: los registros basura llegaban
 * desde dominios desechables de usar y tirar, y limitar a dos proveedores
 * conocidos los corta de raíz sin mantener listas negras que nunca acaban.
 *
 * OJO: esto es la mitad de la historia. El registro llama a Supabase desde el
 * navegador, así que estas comprobaciones son solo para dar un mensaje claro:
 * quien llame a la API directamente se las salta. Lo que de verdad impide la
 * creación es el trigger `enforce_email_domain` sobre auth.users
 * (scripts/enforce-email-domain.sql). Si cambias los dominios de aquí, cámbialos
 * también allí.
 */

export const DOMINIOS_PERMITIDOS = [
  "gmail.com",
  "googlemail.com", // alias oficial de Gmail
  "proton.me",
  "protonmail.com",
  "protonmail.ch",
  "pm.me", // alias corto de Proton
] as const;

export const MENSAJE_DOMINIO_NO_PERMITIDO =
  "Solo aceptamos cuentas de Gmail y Proton Mail. Usa un correo @gmail.com o @proton.me para registrarte.";

/** Dominio en minúsculas, o cadena vacía si el correo no tiene forma válida. */
export function dominioDe(email: string): string {
  const partes = email.trim().toLowerCase().split("@");
  return partes.length === 2 ? partes[1] : "";
}

export function emailPermitido(email: string): boolean {
  return (DOMINIOS_PERMITIDOS as readonly string[]).includes(dominioDe(email));
}
