import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  accountContext, buildMilestones, byChronology, milestoneBadgeId, milestoneProgress, parseStoredLevels,
  type StoredLevels, type Trade,
} from "@/components/trading/tjStats";

export interface DiarioLogrosSync {
  /** Niveles concedidos en esta llamada: los que merecen aviso. */
  newlyUnlocked: string[];
  /** Todos los niveles guardados del diario, recién concedidos incluidos. */
  stored: { badge_id: string; unlocked_at: string }[];
}

/** Los niveles de hito ya guardados como logro. */
export async function readDiarioLogros(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("user_badges")
    .select("badge_id, unlocked_at")
    .eq("user_id", userId)
    .like("badge_id", "diario-%");
  return data ?? [];
}

/**
 * Concede en user_badges los niveles de hito del Diario de Trading que el
 * usuario ya ha alcanzado, recalculándolos desde sus operaciones guardadas:
 * no se fía de lo que diga el navegador, igual que /api/badges.
 *
 * Se guarda una fila por nivel ("diario-disciplina-1", "-2"…). La tabla solo
 * admite insertar, y así cada nivel conserva su fecha y nunca se pierde.
 *
 * El servidor cuenta los meses en UTC y el navegador en hora local: un mes
 * recién cerrado puede concederse unas horas antes o después que en pantalla.
 */
export async function syncDiarioLogros(supabase: SupabaseClient, userId: string): Promise<DiarioLogrosSync> {
  const [{ data: trades }, { data: profile }, before] = await Promise.all([
    supabase.from("trades").select("*").eq("user_id", userId),
    // trading_starting_capital no se puede leer con la clave de la sesión (ver
    // /dashboard/trading/page.tsx); la identidad ya viene verificada.
    createAdminClient().from("profiles").select("trading_starting_capital").eq("id", userId).single(),
    readDiarioLogros(supabase, userId),
  ]);

  if (!trades?.length) return { newlyUnlocked: [], stored: before };

  const sorted = (trades as Trade[]).sort(byChronology);
  const capital: number | null = profile?.trading_starting_capital ?? null;
  const stored: StoredLevels = parseStoredLevels(before);
  const milestones = buildMilestones(sorted, capital, accountContext(sorted, capital), new Date(), stored);

  const have = new Set(before.map(r => r.badge_id));
  const rows = milestones.flatMap(m =>
    Array.from({ length: milestoneProgress(m).level }, (_, i) => milestoneBadgeId(m.id, i + 1))
      .filter(id => !have.has(id))
      .map(badge_id => ({ user_id: userId, badge_id }))
  );
  if (!rows.length) return { newlyUnlocked: [], stored: before };

  // ignoreDuplicates: si dos guardados llegan a la vez, el segundo no falla.
  const { data, error } = await supabase
    .from("user_badges")
    .upsert(rows, { onConflict: "user_id,badge_id", ignoreDuplicates: true })
    .select("badge_id, unlocked_at");

  if (error) {
    console.error("[diario-logros] no se pudieron guardar:", error.message);
    return { newlyUnlocked: [], stored: before };
  }

  const added = data ?? [];
  return { newlyUnlocked: added.map(r => r.badge_id), stored: [...before, ...added] };
}
