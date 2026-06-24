-- Ejecutar en Supabase SQL Editor
-- Tabla para el diario de trading por usuario

create table if not exists public.trades (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  date date not null,
  pair text not null,
  direction text not null check (direction in ('long', 'short')),
  entry_price numeric not null,
  exit_price numeric not null,
  size numeric not null,
  pnl numeric not null,
  result text not null check (result in ('win', 'loss', 'breakeven')),
  strategy text,
  notes text
);

alter table public.trades enable row level security;

create policy "Users can view their own trades"
  on public.trades for select
  using (auth.uid() = user_id);

create policy "Users can insert their own trades"
  on public.trades for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own trades"
  on public.trades for delete
  using (auth.uid() = user_id);

-- Índice para queries por usuario ordenadas por fecha
create index if not exists trades_user_date_idx on public.trades (user_id, date);
