import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase con la SERVICE ROLE KEY. Ignora RLS, así que SOLO debe
 * usarse en el servidor (webhooks, tareas administrativas). Nunca lo importes
 * en componentes de cliente ni expongas la clave al navegador.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno."
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * El mismo cliente, pero devuelve `null` en vez de lanzar si falta la clave.
 *
 * Existe para leer las **entradas premium en las páginas públicas**. La policy
 * de `posts` oculta la fila entera a quien no es premium —comprobado el
 * 06-09-2026 creando una entrada de prueba—, y eso, que suena a lo correcto,
 * dejaba el contenido de pago invisible del todo: 404 para Google, ausente del
 * sitemap, del RSS y de los listados. Nadie que no estuviera ya suscrito podía
 * enterarse de que existía.
 *
 * Con este cliente se lee **solo lo que se enseña**: título, portada, extracto
 * y categoría. El `content` se sigue tapando en la página según `hasAccess`, y
 * al ser un componente de servidor no llega al navegador de quien no paga.
 *
 * El patrón en cada página es `createAdminClientOpcional() ?? supabase`: si un
 * día falta la clave, se cae al cliente normal y las entradas premium
 * desaparecen —que es peor de cara al SEO, pero nunca filtra nada.
 */
export function createAdminClientOpcional() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  return createAdminClient();
}
