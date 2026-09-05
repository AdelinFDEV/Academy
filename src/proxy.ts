import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { esPrefetchDe, ipDe, registrar, tramoDe } from "@/lib/rate-limit";

// Routes that require an authenticated session.
const protectedRoutes = ["/dashboard", "/cuenta", "/logros", "/portfolio"];
// Routes that require admin role.
const adminRoutes = ["/admin"];
// Routes that logged-in users should not visit (they're already in).
// /auth/* is intentionally excluded: /auth/reset-password must stay accessible
// mid-recovery-flow even when the user has a temporary recovery session.
const authOnlyRoutes = ["/login", "/register"];

// El limitador por IP vive en `@/lib/rate-limit`. Nota heredada que sigue
// siendo cierta: el login y el registro los hace Supabase JS directamente
// desde el navegador, así que limitar esas rutas aquí no serviría de nada —
// la fuerza bruta contra el login la corta el propio Supabase.

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Límite por IP para TODA la web —páginas incluidas—, con un tramo distinto
  // según lo que cueste cada ruta. Va lo PRIMERO de todo, antes de crear el
  // cliente de Supabase: a quien se pasa del cupo no le montamos una sesión.
  const tramo = tramoDe(pathname, esPrefetchDe(request.headers));
  if (tramo) {
    const { limitado, reintentarEn } = registrar(ipDe(request.headers), tramo);

    if (limitado) {
      const esApi = pathname.startsWith("/api");
      const cabeceras = {
        "Retry-After": String(reintentarEn),
        "Content-Type": esApi ? "application/json" : "text/plain; charset=utf-8",
      };

      return new NextResponse(
        esApi
          ? JSON.stringify({ error: "Demasiadas peticiones. Espera un momento." })
          : "Demasiadas peticiones. Espera un momento y vuelve a intentarlo.",
        { status: 429, headers: cabeceras }
      );
    }
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() also refreshes the access token when it has expired.
  const { data: { user } } = await supabase.auth.getUser();

  // Protected routes: redirect to /login and preserve the intended destination
  // via ?next= so the login page can bounce the user back after authentication.
  if (!user && protectedRoutes.some((r) => pathname.startsWith(r))) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2FA: si el usuario tiene un factor TOTP verificado pero la sesión actual
  // todavía está en aal1 (no ha completado el reto de este login), lo mandamos
  // a completarlo antes de dejarle entrar a rutas protegidas o de admin. Sin
  // esto, el 2FA solo se mostraría en /cuenta pero no bloquearía nada de verdad.
  const needsMfaGate =
    protectedRoutes.some((r) => pathname.startsWith(r)) ||
    adminRoutes.some((r) => pathname.startsWith(r));

  if (user && needsMfaGate && pathname !== "/mfa-challenge") {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const mfaPending = aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2";
    if (mfaPending) {
      const mfaUrl = new URL("/mfa-challenge", request.url);
      mfaUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(mfaUrl);
    }
  }

  // Admin routes: require an authenticated session with role = admin.
  if (adminRoutes.some((r) => pathname.startsWith(r))) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Auth-only routes: redirect logged-in users straight to their dashboard.
  if (user && authOnlyRoutes.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Se excluyen los estáticos: no necesitan sesión y hacerlos pasar por aquí
    // solo gasta invocaciones. Ojo al vídeo (mp4/webm): el navegador lo pide
    // POR TROZOS con peticiones de rango, así que la portada sola generaba un
    // puñado de pasadas por el middleware por cada reproducción. Las fuentes de
    // next/font salen bajo _next/static, ya cubierto.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|mp4|webm|mov|mp3|woff|woff2|ttf)$).*)",
  ],
};
