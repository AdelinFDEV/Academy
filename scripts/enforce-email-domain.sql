-- Ejecutar en Supabase SQL Editor
--
-- Solo se aceptan cuentas de Gmail y Proton Mail.
--
-- Va en un trigger sobre auth.users y no en la web a propósito: el registro
-- llama a Supabase DESDE EL NAVEGADOR, así que cualquier validación en React es
-- solo un mensaje bonito — quien llame a la API directamente se la salta. Aquí
-- no hay vuelta: se bloquea la fila, venga de donde venga (formulario, API,
-- Google OAuth o incluso la service_role key).
--
-- Los usuarios que YA existen no se ven afectados: el trigger es sobre INSERT,
-- no sobre el login.

-- ── Normalización de alias ───────────────────────────────────────────────────
-- Gmail ignora los puntos y todo lo que va tras un '+': u.se.r+loquesea@gmail.com
-- y user@gmail.com son EL MISMO buzón. Sin esto, limitar el registro a Gmail no
-- sirve de nada — con una sola cuenta se pueden crear cuentas ilimitadas.
create or replace function public.normalizar_email(correo text)
returns text
language sql
immutable
as $$
  with partes as (
    select
      split_part(lower(trim(correo)), '@', 1) as parte_local,
      split_part(lower(trim(correo)), '@', 2) as dominio
  )
  select case
    when dominio in ('gmail.com', 'googlemail.com')
      then replace(split_part(parte_local, '+', 1), '.', '') || '@gmail.com'
    else split_part(parte_local, '+', 1) || '@' || dominio
  end
  from partes;
$$;

-- ── El guardián ──────────────────────────────────────────────────────────────
create or replace function public.enforce_email_domain()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  dominio text;
begin
  -- Sin email (p.ej. alta por teléfono) no hay nada que validar.
  if new.email is null then
    return new;
  end if;

  -- En UPDATE solo interesa si el correo cambia de verdad. Supabase toca esta
  -- tabla constantemente (último acceso, tokens…) y no queremos entrometernos.
  if tg_op = 'UPDATE' and new.email is not distinct from old.email then
    return new;
  end if;

  dominio := lower(split_part(new.email, '@', 2));

  if dominio not in (
    'gmail.com', 'googlemail.com',
    'proton.me', 'protonmail.com', 'protonmail.ch', 'pm.me'
  ) then
    raise exception 'Solo se aceptan correos de Gmail y Proton Mail (recibido: %)', dominio
      using errcode = 'check_violation';
  end if;

  -- Alias del mismo buzón que ya tiene cuenta. Se excluyen los duplicados
  -- EXACTOS a propósito: de esos ya se encarga Supabase con su propio error, y
  -- la pantalla de registro lo convierte en un "revisa tu email" falso para no
  -- revelar qué correos existen. Si los interceptáramos aquí, romperíamos esa
  -- protección contra enumeración de usuarios.
  if exists (
    select 1 from auth.users u
    where u.email is not null
      and u.id is distinct from new.id
      and lower(u.email) <> lower(new.email)
      and public.normalizar_email(u.email) = public.normalizar_email(new.email)
  ) then
    raise exception 'Ese correo es un alias de una cuenta que ya existe'
      using errcode = 'unique_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_email_domain_trigger on auth.users;

create trigger enforce_email_domain_trigger
  before insert or update of email on auth.users
  for each row execute function public.enforce_email_domain();
