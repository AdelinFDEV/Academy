-- Ejecutar en Supabase SQL Editor
--
-- Añade la cantidad que el usuario posee de cada moneda (mini-portfolio).
-- La política RLS existente ("Users can manage their own watchlist", FOR ALL
-- con auth.uid() = user_id) ya cubre el UPDATE de esta columna, así que no
-- hace falta crear ninguna política nueva.

alter table public.watchlist
  add column if not exists amount numeric;

-- Opcional: impide cantidades negativas.
alter table public.watchlist
  drop constraint if exists watchlist_amount_non_negative;
alter table public.watchlist
  add constraint watchlist_amount_non_negative
  check (amount is null or amount >= 0);
