import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ALIAS_DIAS_ENTRE_CAMBIOS, avatarPorId, problemaDelAlias } from "@/lib/perfilPublico";

/**
 * Guarda el perfil público: alias y foto (ver FORO.md y
 * `scripts/create-perfil-publico.sql`).
 *
 * Es la ÚNICA puerta de escritura de esas columnas: `authenticated` no tiene
 * UPDATE sobre ellas, así que se escriben con la clave de servicio después
 * de comprobar aquí la sesión y validar todo. El autor sale de la sesión,
 * nunca del cuerpo de la petición.
 *
 * Cuerpo: `{ alias?: string, avatar?: string | null }`. Lo que no venga no
 * se toca.
 */

const DIA_MS = 24 * 60 * 60 * 1000;

function error(mensaje: string, status = 400) {
  return NextResponse.json({ error: mensaje }, { status });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return error("Tienes que iniciar sesión.", 401);

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return error("Petición no válida.");
  }
  if (!cuerpo || typeof cuerpo !== "object") return error("Petición no válida.");
  const { alias, avatar } = cuerpo as { alias?: unknown; avatar?: unknown };

  const admin = createAdminClient();
  const { data: actual, error: errLeer } = await admin
    .from("profiles")
    .select("role, alias, alias_cambiado_at")
    .eq("id", user.id)
    .single();
  if (errLeer || !actual) return error("No se pudo leer tu perfil. Inténtalo en unos minutos.", 500);

  const cambios: { alias?: string; alias_cambiado_at?: string; avatar?: string | null } = {};

  // ── La foto: un id de la lista, o null para volver a la inicial ──
  if (avatar !== undefined) {
    if (avatar === null) {
      cambios.avatar = null;
    } else if (typeof avatar === "string" && avatarPorId(avatar)) {
      cambios.avatar = avatar;
    } else {
      return error("Esa foto de perfil no existe.");
    }
  }

  // ── El alias ──
  if (alias !== undefined) {
    if (typeof alias !== "string") return error("Alias no válido.");
    const limpio = alias.trim();
    const problema = problemaDelAlias(limpio, { esAdmin: actual.role === "admin" });
    if (problema) return error(problema);

    const mismo = actual.alias?.toLowerCase() === limpio.toLowerCase();
    // Cambiar solo mayúsculas («satoshi» → «Satoshi») no cuenta como cambio
    // de identidad: no gasta el plazo.
    if (!mismo && actual.alias && actual.role !== "admin" && actual.alias_cambiado_at) {
      const desde = Date.now() - new Date(actual.alias_cambiado_at).getTime();
      const faltan = Math.ceil((ALIAS_DIAS_ENTRE_CAMBIOS * DIA_MS - desde) / DIA_MS);
      if (faltan > 0) {
        return error(`Podrás volver a cambiar el alias dentro de ${faltan} ${faltan === 1 ? "día" : "días"}.`);
      }
    }
    if (actual.alias !== limpio) {
      cambios.alias = limpio;
      if (!mismo) cambios.alias_cambiado_at = new Date().toISOString();
    }
  }

  if (Object.keys(cambios).length === 0) {
    return NextResponse.json({ ok: true, alias: actual.alias ?? null });
  }

  const { error: errGuardar } = await admin.from("profiles").update(cambios).eq("id", user.id);
  if (errGuardar) {
    // El índice único de `lower(alias)` es quien decide de verdad si está
    // libre: comprobarlo antes con una consulta deja una carrera entre dos
    // personas que eligen el mismo a la vez.
    if (errGuardar.code === "23505") return error("Ese alias ya lo tiene otra persona.", 409);
    return error("No se pudo guardar. Inténtalo en unos minutos.", 500);
  }

  return NextResponse.json({ ok: true, alias: cambios.alias ?? actual.alias ?? null });
}
