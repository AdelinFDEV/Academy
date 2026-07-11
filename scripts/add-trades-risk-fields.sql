-- Ejecutar en Supabase SQL Editor
-- Campos de riesgo (stop-loss / take-profit) para calcular Riesgo % y ratio R
-- en el Diario de Trading, y política de UPDATE que faltaba para poder editar
-- operaciones ya guardadas.

alter table public.trades
  add column if not exists stop_loss numeric,
  add column if not exists take_profit numeric;

create policy "Users can update their own trades"
  on public.trades for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
