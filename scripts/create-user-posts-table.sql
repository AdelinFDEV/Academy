-- Ejecutar en Supabase SQL Editor
-- Tabla para artículos leídos y guardados por usuario

create table if not exists public.user_posts (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  post_id    uuid references public.posts(id) on delete cascade not null,
  saved      boolean default false not null,
  read_at    timestamptz,
  unique(user_id, post_id)
);

alter table public.user_posts enable row level security;

create policy "Users can read their own user_posts"
  on public.user_posts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own user_posts"
  on public.user_posts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own user_posts"
  on public.user_posts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own user_posts"
  on public.user_posts for delete
  using (auth.uid() = user_id);

create index if not exists user_posts_user_idx on public.user_posts (user_id);
create index if not exists user_posts_post_idx on public.user_posts (post_id);
