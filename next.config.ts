import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// 'unsafe-eval' SOLO se necesita en desarrollo (React lo usa para el debugging
// y HMR). En producción ni React ni Next.js lo usan, así que lo retiramos para
// reducir la superficie de un posible XSS.
// Cloudflare Turnstile (captcha anti-bots en login/registro/recuperación) carga
// su script y su iframe desde challenges.cloudflare.com — hay que permitirlo en
// la CSP o el widget quedaría bloqueado.
// Google Analytics 4 carga su etiqueta desde googletagmanager.com. Solo se
// inyecta si el visitante acepta las cookies, pero la CSP se envía en la
// cabecera de todas las páginas, así que el origen tiene que estar permitido
// siempre — si no, quien acepte vería el script bloqueado sin ningún aviso.
const ANALYTICS_SCRIPTS =
  "https://static.cloudflareinsights.com https://www.googletagmanager.com";

const scriptSrc = isDev
  ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com ${ANALYTICS_SCRIPTS}`
  : `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com ${ANALYTICS_SCRIPTS}`;

const securityHeaders = [
  // Evita que el sitio sea embebido en iframes (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // Evita que el navegador adivine el tipo de contenido (MIME sniffing)
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Fuerza HTTPS durante 2 años
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Bloquea referencias al navegar fuera del sitio
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Limita acceso a APIs del navegador (cámara, micrófono, etc.)
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Content Security Policy: controla qué recursos puede cargar la página
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      // GA4 no manda los datos al mismo dominio del que carga el script: la
      // etiqueta viene de googletagmanager.com y las medidas salen hacia
      // google-analytics.com y analytics.google.com. Faltando cualquiera de
      // los tres, GA4 se ve «instalado» pero no registra nada.
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com https://cloudflareinsights.com https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com",
      // Los vídeos se incrustan con youtube-nocookie.com (más privado / RGPD).
      // Debe listarse explícitamente: la CSP no cubre youtube-nocookie.com por
      // permitir youtube.com. Sin esto, TODOS los embeds de vídeo se bloquean.
      "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://challenges.cloudflare.com",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // La ÚNICA excepción a geolocation=(): el diario privado del admin, que
      // guarda dónde se escribió cada nota con «Usar mi ubicación». Va detrás
      // de la regla general porque, con la misma cabecera, Next aplica la
      // última. Cámara y micrófono siguen cerrados también aquí.
      {
        source: "/admin/objetivos/:path*",
        headers: [{ key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" }],
      },
    ];
  },
  // Rutas retiradas que aún pueden recibir tráfico desde Google o enlaces
  // externos. Se redirigen en vez de devolver 404: el visitante aterriza en
  // algo útil y los buscadores traspasan el posicionamiento al destino.
  // permanent: true = HTTP 308 (el cambio es definitivo y Google lo indexa así).
  async redirects() {
    return [
      {
        source: "/guia-iniciacion",
        destination: "/guias",
        permanent: true,
      },
      // Los cursos se retiraron: su hueco lo ocupa Trading en Directo.
      {
        source: "/cursos",
        destination: "/trading-en-directo",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
