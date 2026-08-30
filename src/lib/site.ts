/**
 * URL canónica del sitio, en un solo sitio.
 *
 * El fallback apunta al dominio de producción y no a localhost a propósito: si
 * `NEXT_PUBLIC_SITE_URL` falta en el entorno de despliegue, es mucho menos malo
 * publicar URLs correctas que llenar el sitemap y las canónicas de `localhost`.
 *
 * Sin barra final, para poder concatenar rutas directamente.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://adelinacademy.com"
).replace(/\/$/, "");
