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
