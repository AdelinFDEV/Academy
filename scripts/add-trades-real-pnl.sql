-- Ejecutar en Supabase SQL Editor
-- ============================================================================
-- P&L real opcional en el Diario de Trading.
--
-- Hasta ahora el P&L se deducía del resultado: si ganabas, el objetivo; si
-- perdías, exactamente el riesgo. No cabía una salida parcial, un stop con
-- deslizamiento ni una comisión, así que toda pérdida era −1R y toda ganancia
-- el objetivo exacto: la esperanza y la distribución en R medían el plan.
--
-- real_pnl guarda lo que de verdad pasó. Si viene relleno, la API lo copia a
-- pnl (que sigue siendo la cifra con la que se calcula todo) y deduce el
-- resultado de su signo. Si viene vacío, todo funciona exactamente como antes.
--
-- Sin GRANT: los permisos de trades son de tabla y la columna los hereda.
-- ============================================================================

alter table public.trades
  add column if not exists real_pnl numeric;

comment on column public.trades.real_pnl is
  'P&L real de la operación. NULL = se usa el del plan (objetivo si gana, −riesgo si pierde).';
