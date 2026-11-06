-- Ejecutar en Supabase SQL Editor
-- ============================================================================
--  PERFIL PÚBLICO  —  alias y foto de perfil (06-11-2026)
--
--  Lo que el foro enseñará de cada autor (ver FORO.md): un alias único y una
--  de las fotos que crea el admin. Nunca el nombre de la cuenta ni el email.
--
--  · `alias`: lo elige el usuario. Único sin distinguir mayúsculas.
--  · `avatar`: el id de una variante de `src/lib/perfilPublico.ts`.
--  · `alias_cambiado_at`: cuándo lo cambió por última vez (se puede cambiar
--    una vez cada 30 días, para que nadie vaya cambiando de identidad).
--
--  Se escriben SOLO desde /api/perfil con la clave de servicio, que valida
--  todo. `authenticated` no recibe UPDATE sobre estas columnas: si lo
--  tuviera, cualquiera se pondría un alias vetado con un `curl`.
--
--  Idempotente: se puede ejecutar entero más de una vez.
-- ============================================================================

alter table public.profiles add column if not exists alias text;
alter table public.profiles add column if not exists avatar text;
alter table public.profiles add column if not exists alias_cambiado_at timestamptz;

-- La última barrera si un día la API valida mal: la misma forma que exige
-- el servidor (empieza por letra, 3 a 20 de letras, números, _ y .).
alter table public.profiles drop constraint if exists profiles_alias_formato;
alter table public.profiles
  add constraint profiles_alias_formato
  check (alias is null or alias ~ '^[A-Za-z][A-Za-z0-9_.]{2,19}$');

-- El id de la foto: corto y sin rutas. Qué ids existen lo decide el código.
alter table public.profiles drop constraint if exists profiles_avatar_formato;
alter table public.profiles
  add constraint profiles_avatar_formato
  check (avatar is null or avatar ~ '^[a-z0-9-]{1,32}$');

-- Único sin mayúsculas: «Satoshi» y «satoshi» son el mismo alias.
create unique index if not exists profiles_alias_unico
  on public.profiles (lower(alias))
  where alias is not null;

-- Lectura pública de las dos columnas: son públicas por definición (se verán
-- en el foro). `alias_cambiado_at` no se concede: no le importa a nadie más.
grant select (alias, avatar) on public.profiles to anon, authenticated;

-- Verificación: alias y avatar tienen que salir en SELECT para anon y
-- authenticated, y en UPDATE solo debe seguir full_name.
select grantee, privilege_type, column_name
from information_schema.role_column_grants
where table_schema = 'public'
  and table_name = 'profiles'
  and grantee in ('anon', 'authenticated')
  and column_name in ('alias', 'avatar', 'alias_cambiado_at', 'full_name')
order by grantee, privilege_type, column_name;
