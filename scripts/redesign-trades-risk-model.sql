-- Ejecutar en Supabase SQL Editor
-- ============================================================================
-- Rediseño del Diario de Trading: de precio de entrada/salida/tamaño/
-- stop-loss/take-profit a un modelo directo de Riesgo asumido ($) y
-- Ganancia esperada ($), con el Resultado elegido por el usuario en vez de
-- calculado de precios.
--
-- RECOMENDADO: si ya guardaste operaciones de prueba con el formulario
-- viejo, usa el botón "Resetear diario" en /dashboard/trading ANTES de
-- correr esto — las columnas viejas se eliminan y esas operaciones se
-- quedarían con campos vacíos.
-- ============================================================================

alter table public.trades
  add column if not exists risk_amount numeric,
  add column if not exists expected_gain numeric;

-- La fecha ahora incluye hora (antes solo era date).
alter table public.trades
  alter column date type timestamptz using date::timestamptz;

alter table public.trades
  drop column if exists entry_price,
  drop column if exists exit_price,
  drop column if exists size,
  drop column if exists stop_loss,
  drop column if exists take_profit;
