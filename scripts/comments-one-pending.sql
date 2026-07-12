-- Ejecutar en Supabase SQL Editor
-- ============================================================================
--  ANTI-SPAM DE COMENTARIOS  —  un único comentario pendiente por usuario
--  (global: en toda la web, no por artículo).
--
--  Regla: un usuario registrado no puede crear un comentario nuevo mientras
--  tenga uno anterior sin aprobar. En cuanto el admin aprueba (o borra) el
--  pendiente, puede volver a comentar.
--
--  Se aplica con un trigger BEFORE INSERT con SECURITY DEFINER (mismo patrón
--  que enforce_profile_self_update en profiles). Es la barrera de VERDAD:
--  da igual que ataquen /api/comments o que llamen a PostgREST directo con su
--  JWT — la base de datos rechaza el insert. Un bot puede mandar 10.000
--  peticiones y aun así solo existirá 1 fila pendiente suya.
--
--  Bonus de seguridad: fuerza approved=false para cualquier usuario normal,
--  así nadie puede autoaprobarse un comentario mandando approved=true directo
--  a PostgREST (bypass de moderación). Solo el service_role (backend/admin)
--  puede insertar comentarios ya aprobados.
--
--  Es idempotente: se puede correr varias veces sin problema.
-- ============================================================================

create or replace function public.enforce_one_pending_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- El backend con service_role (aprobaciones, seeding) se salta la regla.
  if auth.role() = 'service_role' then
    return new;
  end if;

  -- Un usuario normal NUNCA crea comentarios ya aprobados: aunque mande
  -- approved=true directo a PostgREST, aquí se fuerza a pendiente.
  new.approved := false;

  -- Global: si ya tiene CUALQUIER comentario pendiente, se rechaza.
  if exists (
    select 1 from public.comments
    where user_id = new.user_id and approved = false
  ) then
    raise exception 'PENDING_COMMENT_EXISTS'
      using message = 'Ya tienes un comentario pendiente de aprobación.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_one_pending_comment_trigger on public.comments;
create trigger enforce_one_pending_comment_trigger
  before insert on public.comments
  for each row
  execute function public.enforce_one_pending_comment();

-- Índice para que la comprobación "¿tiene pendiente?" sea instantánea.
create index if not exists comments_user_pending_idx
  on public.comments (user_id)
  where approved = false;
