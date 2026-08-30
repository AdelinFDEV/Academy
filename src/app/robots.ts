import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * robots.txt — punto 2 del plan SEO (ver SEO-PLAN.md).
 *
 * Next.js sirve este archivo como `/robots.txt`. Hace dos cosas: declarar dónde
 * está el sitemap y evitar que Google gaste su presupuesto de rastreo en
 * páginas que no le sirven de nada.
 *
 * Ojo con lo que significa `disallow`: impide **rastrear**, no indexar. Una URL
 * bloqueada aquí puede seguir apareciendo en Google si alguien la enlaza, solo
 * que sin descripción. Para lo privado de verdad la barrera es el login del
 * servidor, que ya existe; esto es higiene de rastreo, no seguridad.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // Privado o administrativo.
          "/admin",
          "/dashboard",
          "/cuenta",
          "/api/",

          // Autenticación: sin contenido que posicionar, y algunas rutas llevan
          // tokens de un solo uso en la URL.
          "/login",
          "/register",
          "/forgot-password",
          "/auth/",
          "/mfa-challenge",

          // Redirigen a login o a premium, así que Google solo vería el salto.
          "/calculadora",
          "/portfolio",
          "/herramientas/",
          "/trading-en-directo",
          "/logros",

          // Página de confirmación de pago: se llega tras el checkout, nunca
          // desde una búsqueda.
          "/premium/gracias",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
