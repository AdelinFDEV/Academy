-- Ejecutar en Supabase SQL Editor
-- ============================================================================
--  BLINDAJE DE COLUMNAS DE `profiles`  —  versiona en el repo la protección de
--  columnas que hasta ahora solo existía como cambio manual en el panel.
--
--  Contexto: la policy de lectura de profiles es USING(true) (pública, para
--  poder mostrar nombre/rol/racha/destacados en comentarios, ranking y home).
--  Con esa policy, la ÚNICA barrera que impide que cualquiera lea los datos de
--  Stripe/facturación de los demás son los GRANT de columna. Este script los
--  deja fijados y reproducibles (antes no estaban en ningún .sql versionado).
--
--  Es idempotente: se puede correr varias veces sin problema.
-- ============================================================================

-- 1. LECTURA (SELECT) ---------------------------------------------------------
--    Supabase concede por defecto SELECT sobre TODAS las columnas a anon y
--    authenticated. Lo revocamos y volvemos a conceder SOLO las columnas no
--    sensibles. Las columnas de Stripe/suscripción y el capital de trading
--    quedan reservadas al service_role (backend), que ignora RLS y GRANTs.
revoke select on public.profiles from anon, authenticated;

grant select (
  id,
  full_name,
  role,
  created_at,
  current_streak,
  max_streak,
  last_seen,
  is_featured,
  premium_since
) on public.profiles to anon, authenticated;

-- Columnas que quedan FUERA a propósito (solo service_role puede leerlas):
--   stripe_customer_id, stripe_subscription_id, subscription_status,
--   subscription_current_period_end, subscription_cancel_at_period_end,
--   trading_starting_capital
-- Todas las lecturas de estas columnas en el código usan el cliente admin
-- (service_role) tras verificar la sesión: /cuenta, /dashboard/trading,
-- /api/stripe/portal, /api/account/delete.

-- 2. ESCRITURA (UPDATE) -------------------------------------------------------
--    Un usuario solo puede editar su propio `full_name`. La racha
--    (current_streak, max_streak, last_seen) e `is_featured` las escribe el
--    backend con service_role (ver /api/streak) para que nadie pueda inflar su
--    racha ni auto-marcarse como "destacado" por escritura directa desde el
--    cliente Supabase del navegador.
--    OJO: hay que revocar también a `anon` — por defecto Supabase le había
--    concedido UPDATE sobre varias columnas. `anon` no debe poder escribir NADA.
revoke update on public.profiles from anon, authenticated;
grant update (full_name) on public.profiles to authenticated;

-- 3. INSERCIÓN (INSERT) -------------------------------------------------------
--    Nadie inserta perfiles desde el cliente: los crea el trigger
--    `handle_new_user` (SECURITY DEFINER) al registrarse. Por defecto Supabase
--    concede INSERT sobre TODAS las columnas (incluidas role, stripe_*,
--    subscription_*), lo cual es un permiso latente peligroso. Se revoca.
revoke insert on public.profiles from anon, authenticated;

-- El backend con service_role conserva acceso total.
grant all on public.profiles to service_role;

-- 4. Verificación -------------------------------------------------------------
--    Resultado esperado (solo SELECT y algún REFERENCES):
--      · anon          → SELECT sobre columnas seguras. Nada de INSERT/UPDATE.
--      · authenticated → SELECT sobre columnas seguras + UPDATE solo full_name.
--    NUNCA debe aparecer INSERT/UPDATE de anon, ni columnas stripe_*/
--    subscription_*/trading_starting_capital/email/avatar_url en SELECT.
select grantee, privilege_type, column_name
from information_schema.role_column_grants
where table_schema = 'public'
  and table_name = 'profiles'
  and grantee in ('anon', 'authenticated')
  and privilege_type in ('SELECT', 'INSERT', 'UPDATE')
order by grantee, privilege_type, column_name;
