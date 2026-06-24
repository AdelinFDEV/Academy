-- Ejecutar en Supabase SQL Editor
-- Tabla para persistir los logros desbloqueados por usuario

create table if not exists public.user_badges (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  badge_id    text not null,
  unlocked_at timestamptz default now() not null,
  unique(user_id, badge_id)
);

alter table public.user_badges enable row level security;

create policy "Users can read their own badges"
  on public.user_badges for select
  using (auth.uid() = user_id);

create policy "Users can insert their own badges"
  on public.user_badges for insert
  with check (auth.uid() = user_id);

create index if not exists user_badges_user_idx on public.user_badges (user_id);
