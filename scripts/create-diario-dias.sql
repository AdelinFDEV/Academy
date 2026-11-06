-- Diario de Trading: cómo se sintió el usuario cada día y su nota del día.
-- Ejecutar entero en el SQL Editor de Supabase. Se puede lanzar más de una vez.
--
-- Una fila por usuario y día (la fecha es la del calendario del usuario, sin hora).
-- animo: 4 fantástico · 3 bien · 2 mal · 1 muy mal. nota: hasta 600 caracteres.
-- Escribe la API (/api/diario-dias) con la sesión del usuario: RLS le deja solo lo suyo.

create table if not exists public.diario_dias (
  user_id uuid not null references auth.users(id) on delete cascade,
  fecha date not null,
  animo smallint check (animo between 1 and 4),
  nota text check (char_length(nota) <= 600),
  updated_at timestamptz not null default now(),
  primary key (user_id, fecha)
);

alter table public.diario_dias enable row level security;

drop policy if exists "diario_dias: leer lo propio" on public.diario_dias;
create policy "diario_dias: leer lo propio"
  on public.diario_dias for select
  using (auth.uid() = user_id);

drop policy if exists "diario_dias: crear lo propio" on public.diario_dias;
create policy "diario_dias: crear lo propio"
  on public.diario_dias for insert
  with check (auth.uid() = user_id);

drop policy if exists "diario_dias: editar lo propio" on public.diario_dias;
create policy "diario_dias: editar lo propio"
  on public.diario_dias for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "diario_dias: borrar lo propio" on public.diario_dias;
create policy "diario_dias: borrar lo propio"
  on public.diario_dias for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.diario_dias to authenticated;
