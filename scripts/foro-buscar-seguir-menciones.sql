-- Ejecutar en Supabase SQL Editor, DESPUÉS de foro-imagenes-respuestas.sql
-- ============================================================================
--  EL FORO — buscador, seguir un hilo y menciones (23-11-2026). Lo pidió el
--  admin. FORO.md §2, §6.3 y §11.
--
--   1. BUSCAR (`foro_buscar`): hilos publicados cuyas palabras están en el
--      título o en el texto, sin distinguir mayúsculas ni tildes. Lo usan el
--      buscador del foro (todas las palabras) y «¿es alguna de estas?» al
--      escribir un título (basta con parte de ellas). Solo lee, solo lo
--      publicado, y sin SQL dinámico: las palabras son datos, nunca código.
--   2. SEGUIR (`foro_seguidos`, `foro_seguir`): quien sigue un hilo recibe un
--      aviso con cada respuesta nueva. Lo crea `foro_responder`, en la misma
--      transacción que la respuesta.
--   3. MENCIONES (@alias): al publicar, hasta 5 mencionados reciben un aviso.
--      También dentro de `foro_preguntar` y `foro_responder`. Los alias se
--      resuelven AQUÍ, en la base de datos: al servidor de la web no le llega
--      el id de nadie.
--
--  `foro_preguntar` y `foro_responder` ganan parámetros CON VALOR POR DEFECTO:
--  la web que está publicada (que todavía no los manda) sigue funcionando
--  desde que se ejecuta esto hasta que se despliega el código nuevo.
--
--   4. IMÁGENES DE LAS RÉPLICAS (repaso de seguridad): si la respuesta de la
--      que cuelgan se oculta o se borra, salen del bucket público con ella.
--
--  Idempotente: se puede ejecutar entero más de una vez.
-- ============================================================================

-- ── 1 · Los dos avisos nuevos ───────────────────────────────────────────────
-- La restricción de `tipo` se rehace con «seguido» y «mencion».
do $$
declare
  c record;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace n on n.oid = rel.relnamespace
    where n.nspname = 'public' and rel.relname = 'foro_avisos' and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%tipo%'
  loop
    execute format('alter table public.foro_avisos drop constraint %I', c.conname);
  end loop;
end;
$$;

alter table public.foro_avisos add constraint foro_avisos_tipo_check check (tipo in (
  'respuesta', 'replica', 'me_gusta',
  'interesante', 'gracias', 'yo_tambien',
  'ganadora', 'elige_ganadora', 'ganadora_retirada',
  'retirado', 'restaurado', 'sancion',
  'seguido', 'mencion'));

-- ── 2 · Seguir un hilo ──────────────────────────────────────────────────────
-- La clave primaria hace imposible seguirlo dos veces.
create table if not exists public.foro_seguidos (
  pregunta_id  bigint      not null references public.foro_preguntas (id) on delete cascade,
  usuario_id   uuid        not null references auth.users (id) on delete cascade,
  creado_at    timestamptz not null default now(),
  primary key (pregunta_id, usuario_id)
);
create index if not exists foro_seguidos_de_usuario
  on public.foro_seguidos (usuario_id, creado_at desc);

-- Como todas las tablas del foro: RLS, ninguna policy y ningún permiso para
-- el navegador. Fuera de Realtime.
alter table public.foro_seguidos enable row level security;
do $$
declare
  p record;
begin
  for p in select policyname from pg_policies where schemaname = 'public' and tablename = 'foro_seguidos' loop
    execute format('drop policy %I on public.foro_seguidos', p.policyname);
  end loop;
  if exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'foro_seguidos'
  ) then
    alter publication supabase_realtime drop table public.foro_seguidos;
  end if;
end;
$$;
revoke all on public.foro_seguidos from public, anon, authenticated;
grant all on public.foro_seguidos to service_role;

-- Seguir o dejar de seguir. Seguir es participar (Premium, sin sanción, con
-- alias y normas); dejar de seguir se puede siempre, como borrar lo propio.
create or replace function public.foro_seguir(p_usuario uuid, p_pregunta bigint, p_poner boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_p      public.foro_preguntas%rowtype;
  v_error  text;
begin
  if p_usuario is null then
    return public.foro__error('sin_sesion');
  end if;

  select * into v_p from public.foro_preguntas q where q.id = p_pregunta;
  if not found or v_p.estado <> 'publicada' then
    return public.foro__error('no_existe');
  end if;

  if coalesce(p_poner, false) then
    v_error := public.foro_puede_participar(p_usuario);
    if v_error is not null then
      return public.foro__error(v_error);
    end if;
    -- De su propia pregunta ya le llegan las respuestas.
    if v_p.autor_id is not distinct from p_usuario then
      return public.foro__error('sin_cambios');
    end if;
    if (select count(*) from public.foro_seguidos s where s.usuario_id = p_usuario) >= 200 then
      return public.foro__error('limite_seguidos');
    end if;
    insert into public.foro_seguidos (pregunta_id, usuario_id) values (p_pregunta, p_usuario)
    on conflict (pregunta_id, usuario_id) do nothing;
  else
    delete from public.foro_seguidos s where s.pregunta_id = p_pregunta and s.usuario_id = p_usuario;
    -- Lo que avisaba de ese hilo por seguirlo ya no le interesa.
    delete from public.foro_avisos a
    where a.destinatario = p_usuario and a.tipo = 'seguido' and a.pregunta_id = p_pregunta and not a.leido;
  end if;

  return jsonb_build_object('ok', true, 'siguiendo', coalesce(p_poner, false));
end;
$$;

-- ── 3 · Menciones ───────────────────────────────────────────────────────────
-- De una lista de alias (como mucho 5 distintos), quiénes existen. Interna:
-- solo la llaman `foro_preguntar` y `foro_responder`.
create or replace function public.foro__mencionados(p_alias text[])
returns table (id uuid)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id
  from public.profiles p
  where p.alias is not null
    and lower(p.alias) in (
      select distinct lower(a) from unnest(coalesce(p_alias, '{}')) a
      where a ~ '^[A-Za-z][A-Za-z0-9_.]{2,19}$'
      limit 5
    )
  limit 5;
$$;

-- De una lista de alias, cuáles existen, escritos como los puso su dueño.
-- Para pintar como mención solo las de verdad. No devuelve ningún id.
create or replace function public.foro_alias_existentes(p_alias text[])
returns table (alias text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.alias
  from public.profiles p
  where p.alias is not null
    and lower(p.alias) in (
      select distinct lower(a) from unnest(coalesce(p_alias, '{}')) a
      where a ~ '^[A-Za-z][A-Za-z0-9_.]{2,19}$'
      limit 200
    )
  limit 200;
$$;

-- Si el mensaje que mencionaba deja de estar publicado, su aviso desaparece
-- (FORO.md §11): lo que no se puede leer no avisa.
create or replace function public.foro__menciones_siguen_respuesta()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.estado <> 'publicada' then
    delete from public.foro_avisos a
    where a.respuesta_id = new.id and a.tipo = 'mencion' and not a.leido;
  end if;
  return null;
end;
$$;

drop trigger if exists foro_menciones_siguen_respuesta on public.foro_respuestas;
create trigger foro_menciones_siguen_respuesta
  after update of estado on public.foro_respuestas
  for each row when (old.estado is distinct from new.estado)
  execute function public.foro__menciones_siguen_respuesta();

-- ── 4 · Buscar ──────────────────────────────────────────────────────────────
-- El texto como lo compara el buscador: minúsculas y sin tildes.
create or replace function public.foro__plano(t text)
returns text
language sql
immutable
set search_path = ''
as $$
  select translate(lower(coalesce(t, '')),
                   'áàäâãéèëêíìïîóòöôõúùüûñç',
                   'aaaaaeeeeiiiiooooouuuunc');
$$;

-- Hilos PUBLICADOS que llevan las palabras, en el título o en el texto.
--   p_palabras: ya en minúsculas y sin tildes (las prepara el servidor).
--   p_minimo:   cuántas palabras distintas tienen que aparecer. El buscador
--               pide todas; «¿es alguna de estas?», parte.
-- Se compara con `position`, no con `like`: un «%» o un «_» en una palabra no
-- significan nada. El título cuenta el triple. A igualdad, lo más reciente.
create or replace function public.foro_buscar(p_palabras text[], p_minimo integer, p_limite integer)
returns table (id bigint, puntos integer)
language sql
stable
security definer
set search_path = ''
as $$
  with palabras as (
    select distinct w
    from unnest(coalesce(p_palabras, '{}')) w
    where char_length(w) between 2 and 40
    limit 8
  ),
  hilos as (
    select q.id, q.ultima_actividad_at,
           public.foro__plano(q.titulo) as t,
           public.foro__plano(q.cuerpo) as c
    from public.foro_preguntas q
    where q.estado = 'publicada'
  ),
  cuenta as (
    select h.id, h.ultima_actividad_at,
           (select count(*) from palabras p where position(p.w in h.t) > 0)::integer as en_titulo,
           (select count(*) from palabras p where position(p.w in h.t) > 0 or position(p.w in h.c) > 0)::integer as en_total
    from hilos h
  )
  select c.id, (c.en_titulo * 3 + c.en_total)::integer as puntos
  from cuenta c
  where c.en_total > 0
    and c.en_total >= least(greatest(coalesce(p_minimo, 1), 1), (select count(*) from palabras))
  order by puntos desc, c.ultima_actividad_at desc, c.id desc
  limit least(greatest(coalesce(p_limite, 10), 1), 50);
$$;

-- ── 4 bis · Las imágenes de las réplicas siguen también a su respuesta ───────
-- Repaso de seguridad del 23-11-2026: al ocultar o borrar una RESPUESTA, sus
-- réplicas dejan de verse (cuelgan de ella), pero sus filas siguen
-- «publicadas» y sus imágenes seguían en el bucket público. Ahora salen con
-- ella, y vuelven si la respuesta se restaura.
create or replace function public.foro__imagenes_siguen_respuesta()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Las del propio mensaje.
  update public.foro_imagenes i
  set estado = new.estado
  where i.respuesta_id = new.id and i.estado <> 'borrada' and i.estado <> new.estado;

  -- Las de sus réplicas (solo una respuesta las tiene).
  if new.padre_id is null then
    if new.estado = 'publicada' then
      update public.foro_imagenes i
      set estado = 'publicada'
      from public.foro_respuestas x
      where x.padre_id = new.id and x.estado = 'publicada'
        and i.respuesta_id = x.id and i.estado = 'oculta';
    else
      update public.foro_imagenes i
      set estado = case when new.estado = 'borrada' then 'borrada' else 'oculta' end
      from public.foro_respuestas x
      where x.padre_id = new.id
        and i.respuesta_id = x.id and i.estado = 'publicada';
    end if;
  end if;
  return null;
end;
$$;

create or replace function public.foro__imagen_de_respuesta_visible()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_r      text;
  v_padre  uuid;
  v_rp     text;
  v_p      text;
begin
  if new.respuesta_id is not null and new.estado = 'publicada' then
    select r.estado, r.padre_id into v_r, v_padre from public.foro_respuestas r where r.id = new.respuesta_id;
    select q.estado into v_p from public.foro_preguntas q where q.id = new.pregunta_id;
    if v_padre is not null then
      select r.estado into v_rp from public.foro_respuestas r where r.id = v_padre;
    end if;
    if v_r is distinct from 'publicada' then
      new.estado := coalesce(v_r, 'borrada');
    elsif v_padre is not null and v_rp is distinct from 'publicada' then
      new.estado := case when coalesce(v_rp, 'borrada') = 'borrada' then 'borrada' else 'oculta' end;
    elsif v_p is distinct from 'publicada' then
      new.estado := coalesce(v_p, 'borrada');
    end if;
  end if;
  return new;
end;
$$;

-- ── 5 · Preguntar y responder, con menciones y seguidores ───────────────────
-- Las versiones anteriores se borran: si no, quedarían dos con el mismo nombre.
drop function if exists public.foro_preguntar(uuid, text, text, text, text, text, uuid[], boolean);
drop function if exists public.foro_responder(uuid, bigint, uuid, text, text, boolean, uuid[]);
drop function if exists public.foro_responder(uuid, bigint, uuid, text, text, boolean);

create or replace function public.foro_preguntar(
  p_usuario uuid, p_categoria text, p_titulo text, p_slug text, p_cuerpo text,
  p_huella text, p_imagenes uuid[], p_tiene_enlaces boolean,
  p_menciones text[] default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_error   text;
  v_admin   boolean;
  v_nuevo   boolean;
  v_modo    text;
  v_id      bigint;
  v_n       integer;
  v_imgs    uuid[] := coalesce(p_imagenes, '{}');
  v_s       uuid;
begin
  select * into v_error, v_admin, v_nuevo
  from public.foro__antes_de_publicar(p_usuario, p_tiene_enlaces);
  if v_error is not null then
    return public.foro__error(v_error);
  end if;

  if not v_admin then
    select count(*) into v_n from public.foro_preguntas q
    where q.autor_id = p_usuario and q.creada_at > now() - interval '24 hours';
    if v_n >= (case when v_nuevo then 1 else 3 end) then
      return public.foro__error('limite_preguntas');
    end if;

    -- Tope global: más de 30 preguntas en una hora entre todos no es uso
    -- normal. El foro pasa solo a lectura y queda apuntado.
    select a.modo into v_modo from public.foro_ajustes a where a.id for update;
    if v_modo = 'abierto' and (
      select count(*) from public.foro_preguntas q where q.creada_at > now() - interval '1 hour'
    ) >= 30 then
      update public.foro_ajustes a set modo = 'lectura', actualizado_at = now() where a.id;
      insert into public.foro_moderacion (accion, motivo)
      values ('cambiar_modo', 'Automático: más de 30 preguntas en una hora. El foro pasa a solo lectura.');
      return public.foro__error('solo_lectura');
    end if;
  end if;

  if not exists (select 1 from public.foro_categorias c where c.slug = p_categoria and c.activa) then
    return public.foro__error('categoria_no_valida');
  end if;

  -- El mismo texto ya está en el foro, sea suyo o de otro.
  if exists (
    select 1 from public.foro_preguntas q
    where q.huella = p_huella and q.estado <> 'borrada'
  ) then
    return public.foro__error('duplicado');
  end if;

  if coalesce(array_length(v_imgs, 1), 0) > 4
     or (select count(distinct x) from unnest(v_imgs) x) <> coalesce(array_length(v_imgs, 1), 0) then
    return public.foro__error('imagen_no_valida');
  end if;

  begin
    insert into public.foro_preguntas (autor_id, categoria, titulo, slug, cuerpo, huella)
    values (p_usuario, p_categoria, p_titulo, p_slug, p_cuerpo, p_huella)
    returning id into v_id;
  exception
    when unique_violation then return public.foro__error('duplicado');
    when check_violation  then return public.foro__error('contenido_no_valido');
  end;

  -- Las imágenes tienen que ser suyas, recién subidas y sin dueño. Si alguna
  -- no cuadra, se deshace todo: la excepción anula también la pregunta.
  if coalesce(array_length(v_imgs, 1), 0) > 0 then
    with marcadas as (
      update public.foro_imagenes i
      set pregunta_id = v_id,
          estado      = 'publicada',
          orden       = (array_position(v_imgs, i.id) - 1)::smallint
      where i.id = any (v_imgs)
        and i.autor_id = p_usuario and i.estado = 'subida' and i.pregunta_id is null
      returning 1
    )
    select count(*) into v_n from marcadas;
    if v_n <> array_length(v_imgs, 1) then
      raise exception 'foro: imagen no valida' using errcode = 'FR001';
    end if;
  end if;

  update public.foro_reputacion r set preguntas = r.preguntas + 1 where r.usuario_id = p_usuario;
  perform public.foro__premiar(p_usuario, 'pregunta', 1, v_id, null, null);

  -- Las menciones (@alias): como mucho 5 y nunca a uno mismo.
  for v_s in
    select x.id from public.foro__mencionados(p_menciones) x where x.id <> p_usuario
  loop
    perform public.foro__aviso(v_s, p_usuario, 'mencion', v_id, null, '');
  end loop;

  return jsonb_build_object('ok', true, 'id', v_id, 'slug', p_slug);
exception
  when sqlstate 'FR001' then return public.foro__error('imagen_no_valida');
end;
$$;

create or replace function public.foro_responder(
  p_usuario uuid, p_pregunta bigint, p_a uuid, p_cuerpo text,
  p_huella text, p_tiene_enlaces boolean,
  p_imagenes uuid[] default null, p_menciones text[] default null
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
  v_s       uuid;
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

  -- Quien sigue el hilo se entera de cada RESPUESTA nueva (no de las
  -- réplicas). El autor de la pregunta ya tiene su aviso de «respuesta».
  if v_padre is null then
    for v_s in
      select s.usuario_id from public.foro_seguidos s
      where s.pregunta_id = p_pregunta
        and s.usuario_id <> p_usuario
        and s.usuario_id is distinct from v_p.autor_id
    loop
      perform public.foro__aviso(v_s, p_usuario, 'seguido', p_pregunta, null, '');
    end loop;
  end if;

  -- Las menciones (@alias): como mucho 5, nunca a uno mismo, y no a quien
  -- este mismo mensaje ya avisa por otra vía (el autor de la pregunta, el de
  -- la respuesta a la que se replica o el citado).
  for v_s in
    select x.id from public.foro__mencionados(p_menciones) x
    where x.id <> p_usuario
      and not (v_padre is null and x.id is not distinct from v_p.autor_id)
      and not (v_padre is not null and (x.id is not distinct from v_raiz.autor_id or x.id is not distinct from v_citado))
  loop
    perform public.foro__aviso(v_s, p_usuario, 'mencion', p_pregunta, v_id, '');
  end loop;

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
  select 'Avisos «seguido» y «mencion» permitidos' as comprobacion,
         exists (
           select 1 from pg_constraint con
           where con.conname = 'foro_avisos_tipo_check'
             and pg_get_constraintdef(con.oid) like '%seguido%'
             and pg_get_constraintdef(con.oid) like '%mencion%') as ok
  union all
  select 'foro_seguidos: RLS, sin policies y sin permisos',
         (select c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relname = 'foro_seguidos')
         and not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = 'foro_seguidos')
         and not has_table_privilege('anon', 'public.foro_seguidos', 'SELECT, INSERT, UPDATE, DELETE')
         and not has_table_privilege('authenticated', 'public.foro_seguidos', 'SELECT, INSERT, UPDATE, DELETE')
  union all
  select 'Un solo foro_preguntar y un solo foro_responder, con menciones',
         (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'public' and p.proname in ('foro_preguntar', 'foro_responder')) = 2
         and (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname in ('foro_preguntar', 'foro_responder')
                and pg_get_function_arguments(p.oid) like '%p_menciones text[]%') = 2
  union all
  select 'Ninguna función del foro se puede llamar desde el navegador',
         not exists (
           select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname like 'foro\_%'
             and (has_function_privilege('anon', p.oid, 'execute')
                  or has_function_privilege('authenticated', p.oid, 'execute')))
  union all
  select 'Ninguna tabla del foro tiene policies ni permisos para el navegador',
         not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename like 'foro\_%')
         and not exists (
           select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'foro\_%'
             and (not c.relrowsecurity
                  or has_table_privilege('anon', c.oid, 'SELECT, INSERT, UPDATE, DELETE')
                  or has_table_privilege('authenticated', c.oid, 'SELECT, INSERT, UPDATE, DELETE')))
  union all
  select 'Sin policies de Storage para los buckets del foro',
         not exists (
           select 1 from pg_policies p
           where p.schemaname = 'storage' and p.tablename = 'objects'
             and (coalesce(p.qual, '') || coalesce(p.with_check, '')) ilike '%foro%')
  union all
  select 'Toda policy de Storage está acotada a su bucket',
         not exists (
           select 1 from pg_policies p
           where p.schemaname = 'storage' and p.tablename = 'objects'
             and (coalesce(p.qual, '') || coalesce(p.with_check, '')) not ilike '%bucket_id%')
  union all
  select 'Disparador de las menciones',
         exists (select 1 from pg_trigger t where t.tgname = 'foro_menciones_siguen_respuesta')
  union all
  select 'Disparadores de las imágenes de las respuestas',
         (select count(*) from pg_trigger t
          where t.tgname in ('foro_imagenes_siguen_respuesta', 'foro_imagen_de_respuesta_visible')) = 2
) x
order by ok, comprobacion;
