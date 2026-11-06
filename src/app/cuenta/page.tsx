import { redirect } from "next/navigation";

/**
 * /cuenta ya no es una página: desde el 06-11-2026 todo lo que hacía (plan,
 * suscripción, contraseña, verificación en dos pasos, borrar la cuenta) vive
 * en «Mi perfil». Se mantiene la ruta porque hay enlaces antiguos (emails,
 * marcadores, el regreso del portal de Stripe de sesiones abiertas) y porque
 * `robots.ts` y `src/proxy.ts` la siguen cubriendo.
 */
export default async function CuentaPage({
  searchParams,
}: {
  searchParams: Promise<{ portal_error?: string }>;
}) {
  const { portal_error } = await searchParams;
  redirect(portal_error ? "/dashboard/perfil?portal_error=1" : "/dashboard/perfil");
}
