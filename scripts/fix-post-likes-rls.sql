-- ============================================================
-- FIX: el like no se queda / el contador se revierte
-- Causa: la tabla post_likes no tiene políticas RLS de INSERT
--        ni DELETE, así que los likes nunca se guardan ni se
--        pueden quitar (error 42501: row-level security).
--
-- Ejecutar TODO este bloque en el SQL Editor de Supabase.
-- Es idempotente: se puede correr varias veces sin problema.
-- ============================================================

-- Asegura que la tabla existe con la estructura correcta
create table if not exists public.post_likes (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(user_id, post_id)
);

-- Restricción de unicidad (necesaria para el toggle insert/delete).
-- Si ya existe, el bloque DO la ignora.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'post_likes_user_id_post_id_key'
  ) then
    alter table public.post_likes
      add constraint post_likes_user_id_post_id_key unique (user_id, post_id);
  end if;
exception when duplicate_table then null;
end $$;

-- Activa RLS
alter table public.post_likes enable row level security;

-- Borra políticas previas para recrearlas limpias
drop policy if exists "Anyone can count likes"           on public.post_likes;
drop policy if exists "Users can view their own likes"   on public.post_likes;
drop policy if exists "Users can insert their own likes" on public.post_likes;
drop policy if exists "Users can delete their own likes" on public.post_likes;

-- Lectura pública (para contar likes en cada post)
create policy "Anyone can count likes"
  on public.post_likes for select
  using (true);

-- Un usuario autenticado puede dar like en su propio nombre
create policy "Users can insert their own likes"
  on public.post_likes for insert
  with check (auth.uid() = user_id);

-- Un usuario autenticado puede quitar su propio like
create policy "Users can delete their own likes"
  on public.post_likes for delete
  using (auth.uid() = user_id);

-- Índices
create index if not exists post_likes_post_idx on public.post_likes (post_id);
create index if not exists post_likes_user_idx on public.post_likes (user_id, post_id);

-- ── Verificación: deberías ver 3 políticas (select, insert, delete) ──
select policyname, cmd from pg_policies where tablename = 'post_likes';
