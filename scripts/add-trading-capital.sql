-- Ejecutar en Supabase SQL Editor
-- Capital inicial de trading, usado para calcular la evolución de la cuenta
-- (capital actual = capital inicial + P&L acumulado) en el Diario de Trading.

alter table public.profiles
  add column if not exists trading_starting_capital numeric;
