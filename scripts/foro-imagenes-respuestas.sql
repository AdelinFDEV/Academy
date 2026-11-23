-- Ejecutar en Supabase SQL Editor, DESPUÉS de create-foro-imagenes.sql
-- ============================================================================
--  EL FORO — imágenes también en las respuestas y réplicas (23-11-2026).
--  FORO.md §6.6. Lo pidió el admin: hasta ahora solo las preguntas llevaban.
--
--  Una imagen de una respuesta es una fila más de `foro_imagenes`, con su
--  `pregunta_id` (el hilo) y además su `respuesta_id`. Así `sincronizar` del
--  servidor, que mueve el almacén según el hilo, ya las lleva.
--
--  Su estado sigue SIEMPRE al de su respuesta y al de su hilo, con dos
--  disparadores: si la respuesta se oculta o se borra, sus imágenes también;
--  y una imagen no puede quedar «publicada» si su respuesta o su pregunta no
--  lo están (aunque se restaure el hilo entero).
--
--  Idempotente: se puede ejecutar entero más de una vez.
-- ============================================================================

-- ── La columna ──────────────────────────────────────────────────────────────
alter table public.foro_imagenes
  add column if not exists respuesta_id uuid references public.foro_respuestas (id) on delete cascade;
create index if not exists foro_imagenes_de_respuesta
  on public.foro_imagenes (respuesta_id, orden) where respuesta_id is not null;

-- ── La respuesta manda sobre sus imágenes ───────────────────────────────────
create or replace function public.foro__imagenes_siguen_respuesta()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.foro_imagenes i
  set estado = new.estado
  where i.respuesta_id = new.id and i.estado <> 'borrada' and i.estado <> new.estado;
  return null;
end;
$$;

drop trigger if exists foro_imagenes_siguen_respuesta on public.foro_respuestas;
create trigger foro_imagenes_siguen_respuesta
  after update of estado on public.foro_respuestas
  for each row when (old.estado is distinct from new.estado)
  execute function public.foro__imagenes_siguen_respuesta();

-- ── Y una imagen de respuesta no se publica si su mensaje no lo está ─────────
create or replace function public.foro__imagen_de_respuesta_visible()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_r text;
  v_p text;
begin
  if new.respuesta_id is not null and new.estado = 'publicada' then
    select r.estado into v_r from public.foro_respuestas r where r.id = new.respuesta_id;
    select q.estado into v_p from public.foro_preguntas q where q.id = new.pregunta_id;
    if v_r is distinct from 'publicada' then
      new.estado := coalesce(v_r, 'borrada');
    elsif v_p is distinct from 'publicada' then
      new.estado := coalesce(v_p, 'borrada');
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists foro_imagen_de_respuesta_visible on public.foro_imagenes;
create trigger foro_imagen_de_respuesta_visible
  before update of estado on public.foro_imagenes
  for each row
  execute function public.foro__imagen_de_respuesta_visible();

-- ── Responder, ahora con imágenes ───────────────────────────────────────────
-- La versión anterior (sin `p_imagenes`) se borra: si no, quedarían dos.
drop function if exists public.foro_responder(uuid, bigint, uuid, text, text, boolean);

create or replace function public.foro_responder(
  p_usuario uuid, p_pregunta bigint, p_a uuid, p_cuerpo text,
  p_huella text, p_tiene_enlaces boolean, p_imagenes uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_p       public.foro_preguntas%rowtype;
  v_a       public.foro_respuestas%rowtype;
  v_raiz    public.foro_respuestas%rowtype;
  v_error   text;
  v_admin   boolean;
  v_nuevo   boolean;
  v_padre   uuid;
  v_citado  uuid;
  v_id      uuid;
  v_n       integer;
  v_imgs    uuid[] := coalesce(p_imagenes, '{}');
begin
  -- Como mucho 2 imágenes por respuesta o réplica.
  if coalesce(array_length(v_imgs, 1), 0) > 2 then
    return public.foro__error('imagen_no_valida');
  end if;

  -- Primero la pregunta (orden de bloqueo), después el usuario.
  select * into v_p from public.foro_preguntas q where q.id = p_pregunta for update;
  if not found or v_p.estado <> 'publicada' then
    return public.foro__error('no_existe');
  end if;

  select * into v_error, v_admin, v_nuevo
  from public.foro__antes_de_publicar(p_usuario, p_tiene_enlaces);
  if v_error is not null then
    return public.foro__error(v_error);
  end if;

  if v_p.cerrada then
    return public.foro__error('hilo_cerrado');
  end if;

  if p_a is not null then
    select * into v_a from public.foro_respuestas r where r.id = p_a and r.pregunta_id = p_pregunta;
    if not found or v_a.estado <> 'publicada' then
      return public.foro__error('no_existe');
    end if;
    if v_a.padre_id is null then
      v_padre := v_a.id;
      v_raiz  := v_a;
    else
      select * into v_raiz from public.foro_respuestas r where r.id = v_a.padre_id;
      if not found or v_raiz.estado <> 'publicada' then
        return public.foro__error('no_existe');
      end if;
      v_padre  := v_raiz.id;
      v_citado := v_a.autor_id;
    end if;
  end if;

  if not v_admin then
    select count(*) into v_n from public.foro_respuestas r
    where r.autor_id = p_usuario and r.creada_at > now() - interval '1 hour';
    if v_n >= 10 then
      return public.foro__error('limite_respuestas');
    end if;
    select count(*) into v_n from public.foro_respuestas r
    where r.autor_id = p_usuario and r.creada_at > now() - interval '24 hours';
    if v_n >= (case when v_nuevo then 5 else 30 end) then
      return public.foro__error('limite_respuestas');
    end if;
  end if;

  begin
    insert into public.foro_respuestas (pregunta_id, padre_id, autor_id, citado_id, cuerpo, huella)
    values (p_pregunta, v_padre, p_usuario, v_citado, p_cuerpo, p_huella)
    returning id into v_id;
  exception
    when unique_violation then return public.foro__error('duplicado');
    when check_violation  then return public.foro__error('contenido_no_valido');
  end;

  if v_padre is null then
    update public.foro_preguntas q
    set respuestas = q.respuestas + 1, ultima_actividad_at = now()
    where q.id = p_pregunta;
    update public.foro_reputacion r set respuestas = r.respuestas + 1 where r.usuario_id = p_usuario;
    perform public.foro__premiar(p_usuario, 'respuesta', 1, p_pregunta, v_id, null);
    perform public.foro__aviso(v_p.autor_id, p_usuario, 'respuesta', p_pregunta, null, '');
  else
    update public.foro_preguntas q set ultima_actividad_at = now() where q.id = p_pregunta;
    perform public.foro__aviso(v_raiz.autor_id, p_usuario, 'replica', p_pregunta, v_padre, '');
    if v_citado is not null and v_citado is distinct from v_raiz.autor_id then
      perform public.foro__aviso(v_citado, p_usuario, 'replica', p_pregunta, v_padre, '');
    end if;
  end if;

  -- Sus imágenes: solo las suyas, ya comprobadas y sin mensaje. Si alguna no
  -- vale, se deshace TODO (también la respuesta).
  if coalesce(array_length(v_imgs, 1), 0) > 0 then
    with marcadas as (
      update public.foro_imagenes i
      set pregunta_id  = p_pregunta,
          respuesta_id = v_id,
          estado       = 'publicada',
          orden        = (array_position(v_imgs, i.id) - 1)::smallint
      where i.id = any (v_imgs)
        and i.autor_id = p_usuario and i.estado = 'subida' and i.pregunta_id is null
      returning 1
    )
    select count(*) into v_n from marcadas;
    if v_n <> array_length(v_imgs, 1) then
      raise exception 'foro: imagen no valida' using errcode = 'FR001';
    end if;
  end if;

  return jsonb_build_object('ok', true, 'id', v_id, 'padre', v_padre);
end;
$$;

-- ── Cerradas al navegador, como todas ───────────────────────────────────────
do $$
declare
  f record;
begin
  for f in
    select p.oid::regprocedure as firma
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'foro\_%'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.firma);
    execute format('grant execute on function %s to service_role', f.firma);
  end loop;
end;
$$;

-- ── Comprobación: TODO tiene que salir en «bien» ────────────────────────────
select comprobacion, case when ok then 'bien' else 'MAL' end as resultado
from (
  select 'Columna respuesta_id' as comprobacion,
         exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'foro_imagenes' and column_name = 'respuesta_id') as ok
  union all
  select 'Un solo foro_responder, con imágenes',
         (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'public' and p.proname = 'foro_responder') = 1
         and exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                     where n.nspname = 'public' and p.proname = 'foro_responder'
                       and pg_get_function_arguments(p.oid) like '%p_imagenes uuid[]%')
  union all
  select 'Disparadores de las imágenes',
         (select count(*) from pg_trigger t
          where t.tgname in ('foro_imagenes_siguen_respuesta', 'foro_imagen_de_respuesta_visible')) = 2
  union all
  select 'foro_responder cerrada al navegador',
         not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                     where n.nspname = 'public' and p.proname = 'foro_responder'
                       and (has_function_privilege('anon', p.oid, 'execute')
                            or has_function_privilege('authenticated', p.oid, 'execute')))
) x
order by ok, comprobacion;
