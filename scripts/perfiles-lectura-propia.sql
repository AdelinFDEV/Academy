-- Ejecutar en Supabase SQL Editor
-- ============================================================================
--  PERFILES: cada uno lee SOLO el suyo (repaso de seguridad del 23-11-2026)
--
--  Lo que había: la policy de lectura de `profiles` era pública (USING true),
--  pensada para enseñar nombre, rol y racha en comentarios, ranking y portada
--  (ver `lock-profiles-columns.sql`). Con ella, CUALQUIERA con la clave
--  pública de la web (va en el navegador de todo el mundo) podía pedir la
--  lista entera de usuarios con su `id`, su NOMBRE REAL (`full_name`), su rol,
--  su fecha de alta y su último día de conexión. Y, desde que existe el alias
--  del foro, cruzar cada alias con el nombre real de su dueño: justo lo que el
--  foro promete que no pasa (FORO.md §0: «nunca sale el nombre ni el email»).
--
--  Comprobado ese día con la clave anónima: 16 de 16 filas visibles.
--
--  Lo que queda: cada usuario lee su propia fila y nadie más lee nada. La web
--  no pierde nada: todas sus lecturas de `profiles` son de la fila propia
--  (`.eq("id", user.id)`, con la sesión) o las hace el servidor con la clave
--  de servicio (el foro, el panel de administración, Stripe, la racha), que
--  no pasa por estas reglas. Revisado archivo por archivo el 23-11-2026.
--
--  Idempotente: se puede ejecutar entero más de una vez.
-- ============================================================================

alter table public.profiles enable row level security;

-- 1. Fuera TODAS las policies de lectura que haya (la pública se añadió a
--    mano en el panel y no se sabe su nombre). Las de escritura no se tocan.
do $$
declare
  p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and cmd in ('SELECT', 'ALL')
  loop
    execute format('drop policy %I on public.profiles', p.policyname);
  end loop;
end;
$$;

-- 2. La única lectura: la fila propia, y solo con sesión.
create policy "Leer el perfil propio"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- 3. Sin sesión (anon) no hay ninguna policy de lectura: no ve ninguna fila.
--    Los permisos de columna de `anon` no se tocan a propósito: otras tablas
--    tienen policies que consultan `profiles`, y quitarle el permiso cambiaría
--    un «cero filas» por un error en esas consultas. Sin filas, da igual qué
--    columnas pudiera leer.

-- 4. Comprobación: TODO tiene que salir en «bien».
select comprobacion, case when ok then 'bien' else 'MAL' end as resultado
from (
  select 'RLS activada en profiles' as comprobacion,
         (select c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relname = 'profiles') as ok
  union all
  select 'Una sola policy de lectura, y es la de la fila propia',
         (select count(*) from pg_policies
          where schemaname = 'public' and tablename = 'profiles' and cmd in ('SELECT', 'ALL')) = 1
         and exists (
           select 1 from pg_policies
           where schemaname = 'public' and tablename = 'profiles' and cmd = 'SELECT'
             and qual ilike '%auth.uid()%' and qual not ilike '%true%')
  union all
  select 'Ninguna policy de lectura vale para quien no tiene sesión',
         not exists (
           select 1 from pg_policies
           where schemaname = 'public' and tablename = 'profiles' and cmd in ('SELECT', 'ALL')
             and (roles && array['anon', 'public']::name[]))
  union all
  select 'Sin sesión (anon) no se escribe nada',
         not exists (
           select 1 from information_schema.role_column_grants
           where table_schema = 'public' and table_name = 'profiles'
             and grantee = 'anon' and privilege_type in ('INSERT', 'UPDATE'))
  union all
  select 'Con sesión siguen cerradas las columnas de Stripe y el email',
         not exists (
           select 1 from information_schema.role_column_grants
           where table_schema = 'public' and table_name = 'profiles'
             and grantee = 'authenticated' and privilege_type = 'SELECT'
             and column_name in ('email', 'stripe_customer_id', 'stripe_subscription_id', 'subscription_status',
                                 'subscription_current_period_end', 'trading_starting_capital'))
) x
order by ok, comprobacion;
