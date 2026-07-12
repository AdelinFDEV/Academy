// Requisitos de contraseña, compartidos por el registro y la página de nueva
// contraseña. Deben coincidir con la política de Supabase Auth (minúscula +
// mayúscula + número + símbolo, mínimo 8) para que el usuario vea EN VIVO qué
// le falta, en vez de un error genérico de Supabase tras enviar.
export function passwordChecks(pw: string) {
  return [
    { label: "Al menos 8 caracteres", ok: pw.length >= 8 },
    { label: "Una letra minúscula (a-z)", ok: /[a-z]/.test(pw) },
    { label: "Una letra mayúscula (A-Z)", ok: /[A-Z]/.test(pw) },
    { label: "Un número (0-9)", ok: /\d/.test(pw) },
    { label: "Un símbolo (!@#$%…)", ok: /[^A-Za-z0-9\s]/.test(pw) },
  ];
}

export function passwordValid(pw: string): boolean {
  return passwordChecks(pw).every((c) => c.ok);
}
