import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that require an authenticated session.
const protectedRoutes = ["/dashboard", "/cuenta", "/logros", "/portfolio"];
// Routes that require admin role.
const adminRoutes = ["/admin"];
// Routes that logged-in users should not visit (they're already in).
// /auth/* is intentionally excluded: /auth/reset-password must stay accessible
// mid-recovery-flow even when the user has a temporary recovery session.
const authOnlyRoutes = ["/login", "/register"];

// Rate limiting for sensitive API routes (checkout, stripe portal).
// Note: login/register auth is handled client-side by Supabase JS directly,
// so rate-limiting those POST routes here has no effect — Supabase's own
// rate limiting covers that path.
// Tramo estricto: rutas muy sensibles (pago). Pocas peticiones por ventana larga.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const rateLimitedApis = ["/api/checkout", "/api/stripe/portal"];

// Tramo amplio: rutas públicas de escritura/contadores propensas a spam
// (inserciones anónimas, likes, comentarios). Límite generoso para no molestar
// al uso normal pero cortar el abuso trivial.
const writeLimitMap = new Map<string, { count: number; resetAt: number }>();
const WRITE_LIMIT_MAX = 80;
const WRITE_LIMIT_WINDOW_MS = 60 * 1000;
const writeLimitedApis = [
  "/api/guide-shares",
  "/api/guide-visit",
  "/api/guide-likes",
  "/api/guide-saves",
  "/api/guide-quiz-completion",
  "/api/guide-badge",
  "/api/comments",
  "/api/likes",
  "/api/shares",
];

function hitLimit(
  map: Map<string, { count: number; resetAt: number }>,
  ip: string,
  max: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = map.get(ip);

  if (!entry || now > entry.resetAt) {
    map.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (entry.count >= max) return true;
  entry.count++;
  return false;
}

function isRateLimited(ip: string): boolean {
  return hitLimit(rateLimitMap, ip, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate-limit our own API routes. Sensitive payment routes get a strict tier;
  // public write/counter routes get a generous per-minute tier to stop spam.
  const isSensitive = rateLimitedApis.some((r) => pathname.startsWith(r));
  const isWrite = writeLimitedApis.some((r) => pathname.startsWith(r));
  if (isSensitive || isWrite) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    const limited = isSensitive
      ? isRateLimited(ip)
      : hitLimit(writeLimitMap, ip, WRITE_LIMIT_MAX, WRITE_LIMIT_WINDOW_MS);

    if (limited) {
      return new NextResponse(
        JSON.stringify({ error: "Demasiadas peticiones. Espera un momento." }),
        { status: 429, headers: { "Content-Type": "application/json" } }
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
