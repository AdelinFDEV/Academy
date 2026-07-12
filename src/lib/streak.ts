// La frontera del "día" se ancla a la zona horaria de la academia (España), no
// a UTC. Con UTC, una visita a la 01:00 en España (verano = UTC+2) contaría como
// el día anterior, rompiendo la racha de forma poco intuitiva: el usuario entra
// cada día pero las fechas registradas no quedan como "ayer/hoy" y la racha se
// reinicia a 1. Anclar a Europe/Madrid hace que "hoy" sea el día natural del
// usuario. Debe usarse la MISMA fuente de verdad en el endpoint que escribe la
// racha (src/app/api/streak/route.ts) y aquí, que la muestra.
const STREAK_TZ = "Europe/Madrid";

// Devuelve la fecha "YYYY-MM-DD" del instante dado, en la zona de la academia.
export function dayInTz(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: STREAK_TZ }).format(d);
}

export function todayStr(): string {
  return dayInTz();
}

export function yesterdayStr(): string {
  return dayInTz(new Date(Date.now() - 24 * 60 * 60 * 1000));
}

// Una racha solo sigue viva si el usuario visitó hoy o ayer. Si `last_seen`
// es más antiguo, la racha está rota aunque `current_streak` en la base de
// datos siga guardando el número antiguo (solo se recalcula cuando el propio
// usuario vuelve a visitar la web).
export function getEffectiveStreak(
  currentStreak: number | null | undefined,
  lastSeen: string | null | undefined
): number {
  if (!currentStreak || !lastSeen) return 0;

  return lastSeen === todayStr() || lastSeen === yesterdayStr() ? currentStreak : 0;
}
