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

          // Autenticación con tokens de un solo uso en la URL.
          //
          // /login, /register y /forgot-password NO van aquí a propósito: llevan
          // `noindex` en su layout, y un disallow impediría a Google entrar a
          // verlo. Así se quedaron /login y /forgot-password indexadas en
          // septiembre de 2026 pese a estar bloqueadas.
          "/auth/",
          "/mfa-challenge",

          // Redirigen a login o a premium, así que Google solo vería el salto.
          "/portfolio",
          // Solo las DOS herramientas que siguen tras el muro, nombradas una a
          // una. Antes esto era `/herramientas/` a secas, y al ser el bloqueo
          // por prefijo habría tapado también las fichas públicas
          // `/herramientas/portfolio` y `/herramientas/diario`, que existen
          // justamente para que Google las lea.
          "/herramientas/radar",
          "/herramientas/liberaciones",
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
