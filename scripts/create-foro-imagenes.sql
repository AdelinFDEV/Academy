-- Ejecutar en Supabase SQL Editor, DESPUÉS de create-foro-funciones.sql
-- ============================================================================
--  EL FORO — fase 5: las imágenes de las preguntas (12-11-2026). FORO.md §6.6.
--
--  Una imagen es lo más peligroso que entra en el foro: puede llevar código,
--  la ubicación de alguien (EXIF) o algo ilegal. Por eso recorre este camino:
--
--   1. El usuario PIDE subir (`foro_pedir_subida`): se comprueba el permiso y
--      el tope de 12 al día, y se le da una URL firmada de un solo uso.
--   2. Sube el archivo al bucket PRIVADO `foro-pendientes`. Nadie lo ve.
--   3. El servidor lo descarga, comprueba qué es de verdad por sus primeros
--      bytes, lo RECODIFICA a WebP (lo que destruye cualquier cosa escondida y
--      borra los metadatos) y lo CONFIRMA (`foro_confirmar_subida`).
--   4. Solo al publicarse la pregunta pasa al bucket PÚBLICO `foro`.
--
--  Los dos buckets van SIN policies: en ellos solo entra la clave de servicio
--  y las URL firmadas que ella emite. NO AÑADAS UNA POLICY A `storage.objects`
--  PARA ESTOS BUCKETS.
--
--  Idempotente: se puede ejecutar entero más de una vez.
-- ============================================================================

-- ── Los buckets ─────────────────────────────────────────────────────────────
-- El peso y los tipos se limitan TAMBIÉN aquí, por si falla el servidor:
--   · foro-pendientes: lo que sube el usuario. 5 MB; JPG, PNG o WebP.
--   · foro: lo que se enseña. Solo WebP ya recodificado, 2 MB como mucho.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('foro-pendientes', 'foro-pendientes', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('foro',            'foro',            true,  2097152, array['image/webp'])
on conflict (id) do update
set public             = excluded.public,
    file_size_limit    = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- ── Las subidas pedidas ─────────────────────────────────────────────────────
-- Una fila por cada URL firmada que se ha dado. Sirve para tres cosas: contar
-- el tope diario ANTES de dejar subir nada, saber de quién es cada archivo
-- (el navegador solo manda el id) y limpiar lo que nunca se confirmó.
create table if not exists public.foro_subidas (
  id             uuid        primary key default gen_random_uuid(),
  usuario_id     uuid        not null references auth.users (id) on delete cascade,
  creada_at      timestamptz not null default now(),
  confirmada_at  timestamptz
);
create index if not exists foro_subidas_de_usuario on public.foro_subidas (usuario_id, creada_at desc);

alter table public.foro_subidas enable row level security;
revoke all on public.foro_subidas from public, anon, authenticated;
grant all on public.foro_subidas to service_role;

-- ── Pedir una subida ────────────────────────────────────────────────────────
create or replace function public.foro_pedir_subida(p_usuario uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_error  text;
  v_id     uuid;
begin
  v_error := public.foro_puede_participar(p_usuario);
  if v_error is not null then
    return public.foro__error(v_error);
  end if;

  -- La fila de reputación, bloqueada: pone en fila las peticiones del mismo
  -- usuario, y así el tope no se cuela con varias a la vez.
  insert into public.foro_reputacion (usuario_id) values (p_usuario)
  on conflict (usuario_id) do nothing;
  perform 1 from public.foro_reputacion r where r.usuario_id = p_usuario for update;

  if not public.foro__es_admin(p_usuario) and (
    select count(*) from public.foro_subidas s
    where s.usuario_id = p_usuario and s.creada_at > now() - interval '24 hours'
  ) >= 12 then
    return public.foro__error('limite_imagenes');
  end if;

  insert into public.foro_subidas (usuario_id) values (p_usuario) returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

-- ── Confirmar una subida ────────────────────────────────────────────────────
-- La llama el servidor DESPUÉS de comprobar y recodificar el archivo. Aquí se
-- comprueba que la subida es de quien dice, que no se confirmó ya y que no
-- tiene más de una hora. La imagen queda en estado «subida», sin pregunta.
create or replace function public.foro_confirmar_subida(
  p_usuario uuid, p_id uuid, p_ancho integer, p_alto integer, p_bytes integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_error text;
begin
  v_error := public.foro_puede_participar(p_usuario);
  if v_error is not null then
    return public.foro__error(v_error);
  end if;

  update public.foro_subidas s
  set confirmada_at = now()
  where s.id = p_id and s.usuario_id = p_usuario
    and s.confirmada_at is null and s.creada_at > now() - interval '1 hour';
  if not found then
    return public.foro__error('imagen_no_valida');
  end if;

  begin
    insert into public.foro_imagenes (id, autor_id, ruta, ancho, alto, bytes)
    values (p_id, p_usuario, p_id::text || '.webp', p_ancho, p_alto, p_bytes);
  exception
    when unique_violation then return public.foro__error('imagen_no_valida');
    when check_violation  then return public.foro__error('imagen_no_valida');
  end;

  return jsonb_build_object('ok', true, 'id', p_id);
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
select comprobacion, objeto, case when ok then 'bien' else 'MAL' end as resultado
from (
  select 'Bucket privado, 5 MB, JPG/PNG/WebP' as comprobacion, 'foro-pendientes' as objeto,
         exists (
           select 1 from storage.buckets b
           where b.id = 'foro-pendientes' and not b.public and b.file_size_limit = 5242880
             and b.allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']) as ok
  union all
  select 'Bucket público, 2 MB, solo WebP', 'foro',
         exists (
           select 1 from storage.buckets b
           where b.id = 'foro' and b.public and b.file_size_limit = 2097152
             and b.allowed_mime_types = array['image/webp'])
  union all
  -- Ninguna policy de Storage nombra los buckets del foro.
  select 'Sin policies de Storage para el foro', 'storage.objects',
         not exists (
           select 1 from pg_policies p
           where p.schemaname = 'storage' and p.tablename = 'objects'
             and (coalesce(p.qual, '') || coalesce(p.with_check, '')) ilike '%foro%')
  union all
  -- Una policy de Storage que no filtre por bucket vale para TODOS, también
  -- para los del foro. Si esta fila sale MAL, hay que mirar cuál es.
  select 'Policy de Storage acotada a su bucket', p.policyname::text,
         (coalesce(p.qual, '') || coalesce(p.with_check, '')) ilike '%bucket_id%'
  from pg_policies p
  where p.schemaname = 'storage' and p.tablename = 'objects'
  union all
  select 'foro_subidas: RLS, sin policies y sin permisos', 'foro_subidas',
         (select c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relname = 'foro_subidas')
         and not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = 'foro_subidas')
         and not has_table_privilege('anon', 'public.foro_subidas', 'SELECT, INSERT, UPDATE, DELETE')
         and not has_table_privilege('authenticated', 'public.foro_subidas', 'SELECT, INSERT, UPDATE, DELETE')
  union all
  select 'Función cerrada al navegador', p.oid::regprocedure::text,
         not has_function_privilege('anon', p.oid, 'execute')
         and not has_function_privilege('authenticated', p.oid, 'execute')
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname in ('foro_pedir_subida', 'foro_confirmar_subida')
) x
order by ok, comprobacion, objeto;
