-- Ejecutar en Supabase SQL Editor

create table if not exists public.watchlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  coin_id text not null,
  coin_symbol text not null,
  coin_name text not null,
  created_at timestamptz default now() not null,
  unique(user_id, coin_id)
);

alter table public.watchlist enable row level security;

create policy "Users can manage their own watchlist"
  on public.watchlist for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists watchlist_user_idx on public.watchlist (user_id, created_at);
