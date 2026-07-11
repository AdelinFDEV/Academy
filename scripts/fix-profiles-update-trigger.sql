-- Ejecutar en Supabase SQL Editor
-- ============================================================================
-- Arregla el UPDATE de `profiles` para `authenticated` de una vez por todas.
--
-- Causa raíz: la policy "Editar propio perfil" compara stripe_customer_id
-- (y role) contra el valor actual en su WITH CHECK. Esa subconsulta se evalúa
-- como el rol `authenticated`, que no tiene GRANT SELECT sobre
-- stripe_customer_id ni sobre otras columnas sensibles → CUALQUIER update
-- (incluso uno que solo toca current_streak) revienta con
-- "permission denied for table profiles", porque Postgres no puede evaluar
-- el CHECK, no porque lo rechace.
--
-- Damos SELECT amplio a `authenticated` sí abriría la fuga de PII del 28/06
-- (la policy de lectura es USING(true): cualquiera podría leer el
-- stripe_customer_id de cualquier otro). Así que la protección anti-escalada
-- de privilegios (nadie cambia su propio role/stripe_customer_id vía RLS) se
-- mueve a un trigger BEFORE UPDATE con SECURITY DEFINER, que sí puede leer
-- esas columnas sin depender de los GRANT del rol que hace la petición.
-- ============================================================================

-- 1. Trigger function: se ejecuta con los privilegios de quien la definió
--    (el dueño de la función, normalmente postgres), no con los del rol que
--    dispara el UPDATE. Así puede comparar OLD vs NEW en columnas sensibles
--    sin necesitar GRANT SELECT para `authenticated`.
create or replace function public.enforce_profile_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- El backend (service_role) se salta esta comprobación: los cambios de
  -- rol/Stripe legítimos (checkout, webhook, panel admin) vienen de ahí.
  if auth.role() = 'service_role' then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'No puedes cambiar tu propio rol.';
  end if;

  if new.stripe_customer_id is distinct from old.stripe_customer_id then
    raise exception 'No puedes modificar tu stripe_customer_id.';
  end if;

  if new.stripe_subscription_id is distinct from old.stripe_subscription_id then
    raise exception 'No puedes modificar tu stripe_subscription_id.';
  end if;

  if new.subscription_status is distinct from old.subscription_status then
    raise exception 'No puedes modificar tu subscription_status.';
  end if;

  -- Conserva la regla existente: no puedes autodeclararte destacado salvo
  -- que tu racha máxima ya sea de 30 días o más.
  if new.is_featured and not old.is_featured and coalesce(new.max_streak, 0) < 30 then
    raise exception 'Necesitas 30 días de racha para ser destacado.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_profile_self_update_trigger on public.profiles;
create trigger enforce_profile_self_update_trigger
  before update on public.profiles
  for each row
  execute function public.enforce_profile_self_update();

-- 2. Simplifica la policy: la comprobación anti-escalada ya la hace el
--    trigger de arriba (que no depende de GRANT de columnas). La policy solo
--    necesita seguir garantizando que cada uno edite únicamente su propia fila.
drop policy if exists "Editar propio perfil" on public.profiles;
create policy "Editar propio perfil"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
