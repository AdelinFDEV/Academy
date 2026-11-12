-- Ejecutar en Supabase SQL Editor, DESPUÉS de create-foro-imagenes.sql
-- ============================================================================
--  EL FORO — fases 6 a 8: lo que faltaba de base de datos (12-11-2026).
--
--   · `foro_mantenimiento()`  — lo que hace el cron cada día (FORO.md §9.2,
--     §10.1, §11 y §13): recalcula contadores y puntos desde las filas que
--     los justifican, avisa a quien puede elegir ganadora, y purga lo caducado.
--   · `foro_editar_admin(...)` — el admin corrige un mensaje ajeno; queda
--     marcado «editado por moderación» y la versión anterior se guarda (§7).
--   · `foro_salir_del_ranking(...)` — no aparecer en el ranking (§10.4).
--
--  Idempotente: se puede ejecutar entero más de una vez.
-- ============================================================================

-- ── El mantenimiento diario ─────────────────────────────────────────────────
-- Los contadores y los totales se mantienen dentro de cada acción; esto los
-- vuelve a calcular desde cero. Si algo no cuadraba, lo corrige y lo apunta en
-- el registro: un error en un contador se arregla solo, y se sabe.
create or replace function public.foro_mantenimiento()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mes        date := date_trunc('month', now())::date;
  v_me_gusta   integer;
  v_respuestas integer;
  v_etiquetas  integer;
  v_puntos     integer;
  v_avisos     integer := 0;
  v_purgados   integer := 0;
  v_n          integer;
  v_p          record;
begin
  -- ── 1 · Contadores, desde sus filas ──
  with real as (
    select r.id, (select count(*) from public.foro_me_gusta m where m.respuesta_id = r.id)::integer as n
    from public.foro_respuestas r
  )
  update public.foro_respuestas r set me_gusta = real.n
  from real where real.id = r.id and r.me_gusta <> real.n;
  get diagnostics v_me_gusta = row_count;

  with real as (
    select q.id,
      (select count(*) from public.foro_respuestas r
       where r.pregunta_id = q.id and r.padre_id is null and r.estado = 'publicada')::integer as n
    from public.foro_preguntas q
  )
  update public.foro_preguntas q set respuestas = real.n
  from real where real.id = q.id and q.respuestas <> real.n;
  get diagnostics v_respuestas = row_count;

  with real as (
    select q.id,
      (select count(*) from public.foro_etiquetas e where e.pregunta_id = q.id and e.tipo = 'interesante')::integer as i,
      (select count(*) from public.foro_etiquetas e where e.pregunta_id = q.id and e.tipo = 'gracias')::integer as g,
      (select count(*) from public.foro_etiquetas e where e.pregunta_id = q.id and e.tipo = 'yo_tambien')::integer as y
    from public.foro_preguntas q
  )
  update public.foro_preguntas q set interesante = real.i, gracias = real.g, yo_tambien = real.y
  from real where real.id = q.id and (q.interesante, q.gracias, q.yo_tambien) is distinct from (real.i, real.g, real.y);
  get diagnostics v_etiquetas = row_count;

  -- ── 2 · La reputación, desde el libro de puntos ──
  -- Los puntos del mes se cuentan desde el día 1: así el ranking mensual se
  -- reinicia solo, sin borrar nada.
  with real as (
    select r2.usuario_id,
      coalesce((select sum(x.puntos) from public.foro_puntos x where x.usuario_id = r2.usuario_id), 0)::integer as total
    from public.foro_reputacion r2
  )
  update public.foro_reputacion r
  set puntos = real.total, actualizado_at = now()
  from real
  where real.usuario_id = r.usuario_id and r.puntos <> real.total;
  get diagnostics v_puntos = row_count;

  update public.foro_reputacion r
  set mes = v_mes,
      puntos_mes = coalesce((
        select sum(x.puntos) from public.foro_puntos x
        where x.usuario_id = r.usuario_id and x.creado_at >= v_mes), 0)::integer,
      ganadoras = (
        select count(*) from public.foro_preguntas q
        join public.foro_respuestas g on g.id = q.ganadora_id
        where q.estado = 'publicada' and g.estado = 'publicada' and g.autor_id = r.usuario_id)::integer,
      gracias = (
        select count(*) from public.foro_etiquetas e
        join public.foro_preguntas q on q.id = e.pregunta_id
        where e.tipo = 'gracias' and q.estado = 'publicada' and q.autor_id = r.usuario_id)::integer;

  if v_me_gusta + v_respuestas + v_etiquetas + v_puntos > 0 then
    insert into public.foro_moderacion (accion, motivo)
    values ('recalcular', format(
      'Descuadres corregidos: %s contadores de me gusta, %s de respuestas, %s de etiquetas y %s totales de puntos.',
      v_me_gusta, v_respuestas, v_etiquetas, v_puntos));
  end if;

  -- ── 3 · «Ya puedes elegir ganadora»: una vez, a los 14 días con respuestas ──
  for v_p in
    select q.id, q.autor_id from public.foro_preguntas q
    where q.estado = 'publicada' and not q.cerrada and q.ganadora_id is null
      and q.autor_id is not null and q.respuestas > 0
      and q.creada_at < now() - interval '14 days'
      and not exists (
        select 1 from public.foro_avisos a
        where a.pregunta_id = q.id and a.tipo = 'elige_ganadora')
    limit 500
  loop
    perform public.foro__aviso(v_p.autor_id, null, 'elige_ganadora', v_p.id, null, '');
    v_avisos := v_avisos + 1;
  end loop;

  -- ── 4 · Purgas (FORO.md §13) ──
  -- Avisos leídos hace más de 90 días (el de «elige ganadora» se queda: es lo
  -- que impide volver a mandarlo).
  delete from public.foro_avisos a
  where a.leido and a.leido_at < now() - interval '90 days' and a.tipo <> 'elige_ganadora';
  get diagnostics v_n = row_count; v_purgados := v_purgados + v_n;

  -- Rechazos del filtro y subidas de imágenes: solo sirven para topes del día.
  delete from public.foro_rechazos x where x.creado_at < now() - interval '30 days';
  get diagnostics v_n = row_count; v_purgados := v_purgados + v_n;
  delete from public.foro_subidas s where s.creada_at < now() - interval '30 days';
  get diagnostics v_n = row_count; v_purgados := v_purgados + v_n;

  -- Lo borrado hace más de 30 días, salvo que lo cite un reporte abierto.
  -- La fecha del borrado está en el registro.
  delete from public.foro_respuestas r
  where r.estado = 'borrada'
    and exists (
      select 1 from public.foro_moderacion m
      where m.accion = 'borrar' and m.respuesta_id = r.id and m.creado_at < now() - interval '30 days')
    and not exists (
      select 1 from public.foro_reportes x where x.respuesta_id = r.id and x.estado = 'abierto');
  get diagnostics v_n = row_count; v_purgados := v_purgados + v_n;

  delete from public.foro_preguntas q
  where q.estado = 'borrada'
    and exists (
      select 1 from public.foro_moderacion m
      where m.accion = 'borrar' and m.pregunta_id = q.id and m.respuesta_id is null
        and m.creado_at < now() - interval '30 days')
    and not exists (
      select 1 from public.foro_reportes x where x.pregunta_id = q.id and x.estado = 'abierto');
  get diagnostics v_n = row_count; v_purgados := v_purgados + v_n;

  -- Reportes resueltos, sanciones y registro: 12 meses. Una expulsión que
  -- sigue en vigor NO se purga: purgarla sería readmitir al expulsado.
  delete from public.foro_reportes x
  where x.estado <> 'abierto' and x.resuelto_at < now() - interval '12 months';
  get diagnostics v_n = row_count; v_purgados := v_purgados + v_n;

  delete from public.foro_sanciones s
  where s.creada_at < now() - interval '12 months'
    and (s.tipo <> 'expulsion' or s.levantada_at is not null);
  get diagnostics v_n = row_count; v_purgados := v_purgados + v_n;

  -- El registro es de solo inserción: el candado se abre SOLO para esto y
  -- SOLO dentro de esta transacción.
  perform set_config('foro.purga', 'si', true);
  delete from public.foro_moderacion m where m.creado_at < now() - interval '12 months';
  get diagnostics v_n = row_count; v_purgados := v_purgados + v_n;
  perform set_config('foro.purga', '', true);

  return jsonb_build_object(
    'ok', true,
    'descuadres', jsonb_build_object(
      'me_gusta', v_me_gusta, 'respuestas', v_respuestas, 'etiquetas', v_etiquetas, 'puntos', v_puntos),
    'avisos_ganadora', v_avisos,
    'purgados', v_purgados
  );
end;
$$;

-- ── El admin edita un mensaje ajeno ─────────────────────────────────────────
-- Para quitar un dato personal o una frase sin tener que ocultar el mensaje
-- entero. Queda marcado, la versión anterior se guarda y se apunta el motivo.
create or replace function public.foro_editar_admin(
  p_admin uuid, p_pregunta bigint, p_respuesta uuid,
  p_titulo text, p_cuerpo text, p_huella text, p_motivo text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_p       public.foro_preguntas%rowtype;
  v_r       public.foro_respuestas%rowtype;
  v_motivo  text := btrim(coalesce(p_motivo, ''));
begin
  if not public.foro__es_admin(p_admin) then
    return public.foro__error('no_admin');
  end if;
  if char_length(v_motivo) < 3 then
    return public.foro__error('falta_motivo');
  end if;

  select * into v_p from public.foro_preguntas q where q.id = p_pregunta for update;
  if not found or v_p.estado = 'borrada' then
    return public.foro__error('no_existe');
  end if;

  if p_respuesta is null then
    insert into public.foro_ediciones (pregunta_id, editor_id, titulo, cuerpo)
    values (p_pregunta, p_admin, v_p.titulo, v_p.cuerpo);
    begin
      update public.foro_preguntas q
      set titulo = coalesce(p_titulo, q.titulo), cuerpo = p_cuerpo, huella = p_huella,
          editada_at = now(), editada_por_admin = true
      where q.id = p_pregunta;
    exception
      when unique_violation then return public.foro__error('duplicado');
      when check_violation  then return public.foro__error('contenido_no_valido');
    end;
    insert into public.foro_moderacion (actor_id, accion, pregunta_id, usuario_id, motivo)
    values (p_admin, 'editar', p_pregunta, v_p.autor_id, v_motivo);
    return jsonb_build_object('ok', true);
  end if;

  select * into v_r from public.foro_respuestas r
  where r.id = p_respuesta and r.pregunta_id = p_pregunta for update;
  if not found or v_r.estado = 'borrada' then
    return public.foro__error('no_existe');
  end if;
  insert into public.foro_ediciones (pregunta_id, respuesta_id, editor_id, cuerpo)
  values (p_pregunta, p_respuesta, p_admin, v_r.cuerpo);
  begin
    update public.foro_respuestas r
    set cuerpo = p_cuerpo, huella = p_huella, editada_at = now(), editada_por_admin = true
    where r.id = p_respuesta;
  exception
    when unique_violation then return public.foro__error('duplicado');
    when check_violation  then return public.foro__error('contenido_no_valido');
  end;
  insert into public.foro_moderacion (actor_id, accion, pregunta_id, respuesta_id, usuario_id, motivo)
  values (p_admin, 'editar', p_pregunta, p_respuesta, v_r.autor_id, v_motivo);
  return jsonb_build_object('ok', true);
end;
$$;

-- ── Salir del ranking, o volver a él ────────────────────────────────────────
-- Quien sale sigue ganando puntos y nivel; solo deja de aparecer en la lista.
create or replace function public.foro_salir_del_ranking(p_usuario uuid, p_fuera boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_usuario is null or not exists (select 1 from auth.users u where u.id = p_usuario) then
    return public.foro__error('sin_sesion');
  end if;
  insert into public.foro_reputacion (usuario_id, fuera_del_ranking) values (p_usuario, coalesce(p_fuera, false))
  on conflict (usuario_id) do update set fuera_del_ranking = excluded.fuera_del_ranking;
  return jsonb_build_object('ok', true, 'fuera', coalesce(p_fuera, false));
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
  select 'Función cerrada al navegador' as comprobacion, p.oid::regprocedure::text as objeto,
         not has_function_privilege('anon', p.oid, 'execute')
         and not has_function_privilege('authenticated', p.oid, 'execute') as ok
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname like 'foro\_%'
  union all
  select 'search_path fijado', p.oid::regprocedure::text,
         exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname like 'foro\_%'
  union all
  select 'Están las tres nuevas', 'foro_mantenimiento, foro_editar_admin, foro_salir_del_ranking',
         (select count(*) = 3 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'public'
            and p.proname in ('foro_mantenimiento', 'foro_editar_admin', 'foro_salir_del_ranking'))
) x
order by ok, comprobacion, objeto;
