// Una racha solo sigue viva si el usuario visitó hoy o ayer. Si `last_seen`
// es más antiguo, la racha está rota aunque `current_streak` en la base de
// datos siga guardando el número antiguo (solo se recalcula cuando el propio
// usuario vuelve a visitar la web).
export function getEffectiveStreak(
  currentStreak: number | null | undefined,
  lastSeen: string | null | undefined
): number {
  if (!currentStreak || !lastSeen) return 0;

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  return lastSeen === today || lastSeen === yesterdayStr ? currentStreak : 0;
}
