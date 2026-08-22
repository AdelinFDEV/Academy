import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Tipos de OTP por email que puede traer el enlace (confirmación / recuperación).
type EmailOtpType = "email" | "signup" | "recovery" | "invite" | "magiclink" | "email_change";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next");

  const supabase = await createClient();

  if (tokenHash && type) {
    // Flujo token_hash: valida el enlace directamente a partir del token, SIN
    // depender del verificador PKCE guardado en el navegador que inició el
    // registro → funciona abriendo el email en CUALQUIER dispositivo. Es el que
    // usan los enlaces de las plantillas de email (confirmación y recuperación).
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });
    // Si el enlace de confirmación es inválido/caducado, a login. En recuperación
    // dejamos seguir: la propia /auth/reset-password avisa de enlace caducado.
    if (error && type !== "recovery") {
      return NextResponse.redirect(`${origin}/login?error=confirm`);
    }
  } else if (code) {
    // Flujo PKCE (OAuth de Google) — ocurre en el mismo navegador por naturaleza.
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      // Aquí es donde aterriza quien entra con una cuenta de Google que no es
      // Gmail (Workspace con dominio propio): el trigger de auth.users impide
      // crear el usuario y el intercambio falla. Antes se ignoraba el error y
      // acababa en /dashboard sin sesión, rebotado a login y sin saber por qué.
      console.error("[auth/callback] No se pudo canjear el código:", error.message);
      return NextResponse.redirect(`${origin}/login?error=dominio`);
    }
  }

  if (type === "recovery") {
    return NextResponse.redirect(`${origin}/auth/reset-password`);
  }

  // Solo rutas propias, relativas (evita open-redirect vía "next").
  const destination = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  return NextResponse.redirect(`${origin}${destination}`);
}
