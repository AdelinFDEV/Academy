-- Ejecutar en Supabase SQL Editor
-- Crea la tabla profiles y un trigger que inserta automáticamente
-- un perfil con role='free' cada vez que un usuario se registra.

-- 1. Tabla profiles
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  role       text not null default 'free' check (role in ('free', 'premium', 'admin')),
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Solo admins pueden cambiar roles (vía service_role desde el backend)
-- Las actualizaciones de role se hacen con la service key, no desde el cliente.

-- 2. Función que crea el perfil al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'free'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 3. Trigger sobre auth.users
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Backfill: crear perfil para usuarios ya existentes que no tengan uno
insert into public.profiles (id, full_name, role)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', ''),
  'free'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;
