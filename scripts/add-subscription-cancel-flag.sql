-- Ejecutar en Supabase SQL Editor
-- Guarda si la suscripción está programada para cancelarse al final del
-- periodo actual (cancel_at_period_end de Stripe). Sin esto no podemos
-- distinguir "se va a renovar" de "ya canceló, tiene acceso hasta X".

alter table public.profiles
  add column if not exists subscription_cancel_at_period_end boolean default false not null;

-- El backend (service_role) ya tiene grant all; nada más que tocar en RLS.
