import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// 'unsafe-eval' SOLO se necesita en desarrollo (React lo usa para el debugging
// y HMR). En producción ni React ni Next.js lo usan, así que lo retiramos para
// reducir la superficie de un posible XSS.
// Cloudflare Turnstile (captcha anti-bots en login/registro/recuperación) carga
// su script y su iframe desde challenges.cloudflare.com — hay que permitirlo en
// la CSP o el widget quedaría bloqueado.
const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://static.cloudflareinsights.com"
  : "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://static.cloudflareinsights.com";

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
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com https://cloudflareinsights.com",
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
    ];
  },
};

export default nextConfig;
