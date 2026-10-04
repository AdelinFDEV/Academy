import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { avisarAlAdmin } from "@/lib/telegram";

/**
 * Cuánto puede tener una cuenta para considerarla recién creada.
 *
 * El aviso se dispara en `/auth/callback`, por donde pasa también quien vuelve
 * a entrar con Google. Sin este tope, la primera vez que cada usuario ANTIGUO
 * iniciara sesión tras desplegar esto llegaría un «nuevo registro» falso,
 * porque ninguno tiene todavía la marca de avisado. Un día da margen de sobra
 * a quien tarda en abrir el correo de confirmación.
 */
const MAXIMO_EDAD_MS = 24 * 60 * 60 * 1000;

/**
 * Avisa al admin por Telegram de un registro nuevo, con el total de cuentas y
 * de Premium.
 *
 * Se llama al COMPLETAR el registro —al confirmar el email o al entrar por
 * primera vez con Google—, no al rellenar el formulario: así solo cuentan las
 * cuentas reales, no los correos que nunca se confirman.
 *
 * Una sola vez por cuenta: la marca `alta_avisada` va en `app_metadata`, que
 * solo puede escribir el servidor. Se pone ANTES de mandar el mensaje, para que
 * dos visitas seguidas al callback no avisen dos veces. Si el envío falla, se
 * pierde ese aviso; es preferible a repetirlo en cada inicio de sesión.
 *
 * Respeta `/stop` (pasa por `avisarAlAdmin`), igual que los demás avisos de
 * altas. Nunca lanza: un fallo aquí no puede impedir que alguien entre.
 */
export async function avisarNuevoRegistro(user: User): Promise<void> {
  try {
    if (user.app_metadata?.alta_avisada) return;
    if (Date.now() - new Date(user.created_at).getTime() > MAXIMO_EDAD_MS) return;

    const admin = createAdminClient();

    const { error: marcaError } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: { ...user.app_metadata, alta_avisada: true },
    });
    if (marcaError) {
      console.error("[aviso-alta] No se pudo marcar la cuenta:", marcaError.message);
      return;
    }

    const [total, premium] = await Promise.all([
      // Sin administradores, igual que en /admin/premium: no son usuarios.
      admin.from("profiles").select("id", { count: "exact", head: true }).neq("role", "admin"),
      admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "premium"),
    ]);

    const nombre =
      (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()) ||
      user.email?.split("@")[0] ||
      "Sin nombre";
    const via = user.app_metadata?.provider === "google" ? "Google" : "email";

    const lineas = [
      "🆕 Nuevo registro en la web",
      "",
      `${nombre} (con ${via})`,
      "",
      `Usuarios registrados: ${total.count ?? "?"}`,
      `Usuarios Premium: ${premium.count ?? "?"}`,
    ];

    await avisarAlAdmin(admin, lineas.join("\n"));
  } catch (err) {
    console.error("[aviso-alta] Falló el aviso de registro:", err);
  }
}
