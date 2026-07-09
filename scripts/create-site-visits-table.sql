-- Ejecutar en Supabase SQL Editor
-- Tabla para el conteo de visitas totales a la web (todas las páginas)

create table if not exists public.site_visits (
  id         uuid default gen_random_uuid() primary key,
  path       text not null,
  user_id    uuid references auth.users(id) on delete set null,
  visited_at timestamptz default now() not null
);

alter table public.site_visits enable row level security;

create policy "Anyone can insert site_visits"
  on public.site_visits for insert
  with check (true);

create policy "Admins can read site_visits"
  on public.site_visits for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create index if not exists site_visits_visited_at_idx on public.site_visits (visited_at);
