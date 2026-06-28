-- ============================================================================
--  SUSCRIPCIONES PREMIUM (Stripe)  —  ejecutar en Supabase SQL Editor
-- ----------------------------------------------------------------------------
--  Añade el estado de suscripción a profiles, cierra un agujero de seguridad
--  (un usuario podía ascenderse a 'premium' por su cuenta) y crea una tabla de
--  idempotencia para los webhooks de Stripe.
--
--  IMPORTANTE: NUNCA se borran datos del usuario al bajarlo a 'free'. Sólo se
--  cambia el rol. Así, si vuelve a pagar, recupera todo lo que tenía guardado
--  (trades, watchlist, términos, logros…) porque nunca se eliminó.
-- ============================================================================

-- 1. Columnas de facturación en profiles -------------------------------------
alter table public.profiles
  add column if not exists stripe_customer_id              text,
  add column if not exists stripe_subscription_id          text,
  add column if not exists subscription_status             text,
  add column if not exists subscription_current_period_end timestamptz,
  add column if not exists premium_since                   timestamptz;

-- Búsqueda rápida del perfil a partir del cliente de Stripe (lo usa el webhook)
create unique index if not exists profiles_stripe_customer_id_idx
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

-- 2. Cerrar la escalada de privilegios ---------------------------------------
--    La policy "Users can update their own profile" permite que un usuario
--    actualice su propia fila. Sin restricción de columnas, podría hacer
--    update profiles set role='premium'. Restringimos por columnas: el rol y
--    los campos de Stripe sólo los puede tocar el backend (service_role, que
--    ignora RLS y los GRANT de columna).
revoke update on public.profiles from authenticated;
grant  update (full_name, current_streak, max_streak, last_seen, is_featured)
  on public.profiles to authenticated;

-- El backend con service_role conserva acceso total
grant all on public.profiles to service_role;

-- 3. Idempotencia de webhooks ------------------------------------------------
--    Stripe puede reenviar el mismo evento. Guardamos los IDs ya procesados
--    para no aplicar dos veces el mismo cambio.
create table if not exists public.stripe_events (
  id           text primary key,          -- evt_... de Stripe
  type         text not null,
  processed_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;
-- Sin policies: sólo el service_role (que ignora RLS) puede leer/escribir.

-- 4. Auditoría opcional de cambios de suscripción ----------------------------
create table if not exists public.subscription_log (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users(id) on delete set null,
  event_type  text,
  status      text,
  new_role    text,
  created_at  timestamptz not null default now()
);

alter table public.subscription_log enable row level security;
-- Sin policies: lectura/escritura sólo vía service_role.
