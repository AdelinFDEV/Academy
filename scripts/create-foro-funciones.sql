-- Ejecutar en Supabase SQL Editor, DESPUÉS de create-foro.sql
-- ============================================================================
--  EL FORO — fase 3: las funciones atómicas (12-11-2026). Plan en FORO.md §6.3.
--
--  Cada acción del foro es UNA función que lo hace todo o no hace nada:
--  comprueba el permiso otra vez (la API ya lo hizo), cuenta los límites,
--  cambia las filas, mueve los contadores, apunta los puntos, crea los avisos
--  y escribe en el registro. Ninguna ruta de la API toca una tabla.
--
--  Reglas de este archivo:
--   · `security definer` + `set search_path = ''` + nombres con su esquema.
--   · Devuelven jsonb: {"ok": true, …} o {"ok": false, "error": "<codigo>"}.
--     El código es para el servidor; el texto que ve el usuario lo pone la API.
--   · El autor es SIEMPRE el parámetro `p_usuario`, que la API saca de la
--     sesión. Ninguna acepta un autor distinto del que actúa.
--   · Orden de bloqueo, siempre el mismo, para no cruzarse: pregunta →
--     respuesta → reputación.
--   · Las que empiezan por `foro__` (dos guiones) son piezas internas.
--   · Al final se cierran TODAS al navegador y una consulta lo comprueba.
--
--  Idempotente: se puede ejecutar entero más de una vez.
-- ============================================================================

-- Revertir los puntos de un mensaje con muchos me gusta pasa de 100: el tope
-- de la fase 2 se queda corto para la fila que deshace.
alter table public.foro_puntos drop constraint if exists foro_puntos_puntos_check;
alter table public.foro_puntos
  add constraint foro_puntos_puntos_check
  check (puntos <> 0 and puntos between -100000 and 100000);

-- ════════════════════════════════════════════════════════════════════════════
--  PIEZAS INTERNAS
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.foro__error(p_codigo text)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_build_object('ok', false, 'error', p_codigo);
$$;

-- Apunta un movimiento en el libro y lo suma a los totales. Sin topes: los
-- topes los pone `foro__premiar`. Si la cuenta ya no existe, no hace nada.
create or replace function public.foro__apuntar(
  p_usuario uuid, p_motivo text, p_puntos integer,
  p_pregunta bigint, p_respuesta uuid, p_origen uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mes date := date_trunc('month', now())::date;
begin
  if p_usuario is null or p_puntos is null or p_puntos = 0 then
    return;
  end if;
  if not exists (select 1 from auth.users u where u.id = p_usuario) then
    return;
  end if;

  insert into public.foro_reputacion (usuario_id) values (p_usuario)
  on conflict (usuario_id) do nothing;

  insert into public.foro_puntos (usuario_id, motivo, puntos, pregunta_id, respuesta_id, origen_id)
  values (p_usuario, p_motivo, p_puntos, p_pregunta, p_respuesta, p_origen);

  update public.foro_reputacion r
  set puntos         = r.puntos + p_puntos,
      puntos_mes     = case when r.mes = v_mes then r.puntos_mes + p_puntos else p_puntos end,
      mes            = v_mes,
      actualizado_at = now()
  where r.usuario_id = p_usuario;
end;
$$;

-- Da puntos respetando los topes del §10.2 y del §6.7. Devuelve los que dio.
--   · tope diario de premios por motivo;
--   · me gusta: 3 premios al día de una misma persona;
--   · lo que viene de una cuenta Premium de menos de 7 días no da puntos.
create or replace function public.foro__premiar(
  p_usuario uuid, p_motivo text, p_puntos integer,
  p_pregunta bigint, p_respuesta uuid, p_origen uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tope   integer;
  v_desde  timestamptz;
begin
  if p_usuario is null or p_puntos <= 0 then
    return 0;
  end if;

  v_tope := case p_motivo
    when 'me_gusta'    then 20
    when 'gracias'     then 10
    when 'interesante' then 10
    when 'yo_tambien'  then 10
    when 'respuesta'   then 5
    when 'pregunta'    then 2
    else null
  end;

  if v_tope is not null and (
    select count(*) from public.foro_puntos x
    where x.usuario_id = p_usuario and x.motivo = p_motivo and x.puntos > 0
      and x.creado_at > now() - interval '24 hours'
  ) >= v_tope then
    return 0;
  end if;

  if p_origen is not null and p_motivo in ('me_gusta', 'gracias', 'interesante', 'yo_tambien') then
    if p_motivo = 'me_gusta' and (
      select count(*) from public.foro_puntos x
      where x.usuario_id = p_usuario and x.motivo = 'me_gusta' and x.origen_id = p_origen
        and x.puntos > 0 and x.creado_at > now() - interval '24 hours'
    ) >= 3 then
      return 0;
    end if;

    select coalesce(p.premium_since, p.created_at) into v_desde
    from public.profiles p where p.id = p_origen;
    if v_desde is null or v_desde > now() - interval '7 days' then
      return 0;
    end if;
  end if;

  perform public.foro__apuntar(p_usuario, p_motivo, p_puntos, p_pregunta, p_respuesta, p_origen);
  return p_puntos;
end;
$$;

-- Deshace lo que un origen concreto le dio a alguien por un mensaje (quitar
-- un me gusta o una etiqueta): una fila en negativo por el neto, nunca un borrado.
create or replace function public.foro__deshacer(
  p_usuario uuid, p_motivo text, p_pregunta bigint, p_respuesta uuid, p_origen uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_neto integer;
begin
  if p_usuario is null then
    return;
  end if;
  select coalesce(sum(x.puntos), 0) into v_neto
  from public.foro_puntos x
  where x.usuario_id = p_usuario and x.motivo = p_motivo
    and x.pregunta_id  is not distinct from p_pregunta
    and x.respuesta_id is not distinct from p_respuesta
    and x.origen_id    is not distinct from p_origen;
  if v_neto > 0 then
    perform public.foro__apuntar(p_usuario, p_motivo, -v_neto, p_pregunta, p_respuesta, p_origen);
  end if;
end;
$$;

-- Crea un aviso o lo suma al que ya hay sin leer sobre lo mismo. Nunca a uno
-- mismo, nunca a una cuenta que no existe.
create or replace function public.foro__aviso(
  p_destinatario uuid, p_actor uuid, p_tipo text,
  p_pregunta bigint, p_respuesta uuid, p_motivo text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_destinatario is null or p_destinatario is not distinct from p_actor then
    return;
  end if;
  if not exists (select 1 from auth.users u where u.id = p_destinatario) then
    return;
  end if;

  update public.foro_avisos a
  set cuantos = a.cuantos + 1, actualizado_at = now(), motivo = coalesce(p_motivo, '')
  where a.destinatario = p_destinatario and a.tipo = p_tipo and not a.leido
    and a.pregunta_id  is not distinct from p_pregunta
    and a.respuesta_id is not distinct from p_respuesta;
  if found then
    return;
  end if;

  begin
    insert into public.foro_avisos (destinatario, tipo, pregunta_id, respuesta_id, motivo)
    values (p_destinatario, p_tipo, p_pregunta, p_respuesta, coalesce(p_motivo, ''));
  exception when unique_violation then
    -- Dos a la vez: el otro llegó antes. Se suma al suyo.
    update public.foro_avisos a
    set cuantos = a.cuantos + 1, actualizado_at = now()
    where a.destinatario = p_destinatario and a.tipo = p_tipo and not a.leido
      and a.pregunta_id  is not distinct from p_pregunta
      and a.respuesta_id is not distinct from p_respuesta;
  end;
end;
$$;

-- Lo contrario: al quitar un me gusta o una etiqueta, el aviso sin leer baja
-- en uno, y desaparece si era el único.
create or replace function public.foro__quitar_aviso(
  p_destinatario uuid, p_tipo text, p_pregunta bigint, p_respuesta uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_destinatario is null then
    return;
  end if;
  delete from public.foro_avisos a
  where a.destinatario = p_destinatario and a.tipo = p_tipo and not a.leido and a.cuantos <= 1
    and a.pregunta_id  is not distinct from p_pregunta
    and a.respuesta_id is not distinct from p_respuesta;
  if found then
    return;
  end if;
  update public.foro_avisos a
  set cuantos = a.cuantos - 1
  where a.destinatario = p_destinatario and a.tipo = p_tipo and not a.leido and a.cuantos > 1
    and a.pregunta_id  is not distinct from p_pregunta
    and a.respuesta_id is not distinct from p_respuesta;
end;
$$;

-- Lo común a preguntar y responder: permiso, fila de reputación bloqueada
-- (pone en fila las peticiones del mismo usuario, así los límites no se
-- cuelan con dos a la vez), tope de rechazos y regla de los nuevos.
-- Devuelve null si puede seguir, o el código del error.
-- OJO: quien la llama tiene que haber bloqueado YA la pregunta, si hay una.
create or replace function public.foro__antes_de_publicar(
  p_usuario uuid, p_tiene_enlaces boolean, out o_error text, out o_admin boolean, out o_nuevo boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_primera timestamptz;
begin
  o_admin := false;
  o_nuevo := true;

  o_error := public.foro_puede_participar(p_usuario);
  if o_error is not null then
    return;
  end if;

  select p.role = 'admin' into o_admin from public.profiles p where p.id = p_usuario;
  o_admin := coalesce(o_admin, false);

  insert into public.foro_reputacion (usuario_id) values (p_usuario)
  on conflict (usuario_id) do nothing;
  select r.primera_actividad_at into v_primera
  from public.foro_reputacion r where r.usuario_id = p_usuario
  for update;
  o_nuevo := v_primera > now() - interval '7 days';

  if o_admin then
    o_nuevo := false;
    return;
  end if;

  -- Diez mensajes rechazados por el filtro en un día: hasta mañana.
  if (
    select count(*) from public.foro_rechazos x
    where x.usuario_id = p_usuario and x.creado_at > now() - interval '24 hours'
  ) >= 10 then
    o_error := 'demasiados_rechazos';
    return;
  end if;

  if o_nuevo and coalesce(p_tiene_enlaces, true) then
    o_error := 'nuevo_sin_enlaces';
    return;
  end if;
end;
$$;

-- Oculta o borra un mensaje con todo lo que cuelga de ello. NO comprueba
-- quién lo pide: eso es cosa de quien la llama.
--   p_accion: 'ocultar' | 'ocultar_auto' | 'borrar'
--   p_penalizar: los −10 de «retirado por moderación» (solo al borrar el admin)
-- Las réplicas de una respuesta oculta no cambian de estado: la lectura las
-- esconde con su padre, y al restaurarlo vuelven solas.
create or replace function public.foro__retirar(
  p_pregunta bigint, p_respuesta uuid, p_actor uuid,
  p_accion text, p_motivo text, p_penalizar boolean
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_p      public.foro_preguntas%rowtype;
  v_r      public.foro_respuestas%rowtype;
  v_final  text := case when p_accion = 'borrar' then 'borrada' else 'oculta' end;
  v_neto   integer;
begin
  select * into v_p from public.foro_preguntas q where q.id = p_pregunta for update;
  if not found then
    return 'no_existe';
  end if;

  if p_respuesta is null then
    -- ── Una pregunta ──
    if v_p.estado = 'borrada' or v_p.estado = v_final then
      return 'sin_cambios';
    end if;

    update public.foro_preguntas q set estado = v_final where q.id = p_pregunta;
    update public.foro_imagenes i set estado = v_final
    where i.pregunta_id = p_pregunta and i.estado <> 'borrada';

    if v_p.estado = 'publicada' then
      select coalesce(sum(x.puntos), 0) into v_neto
      from public.foro_puntos x
      where x.usuario_id = v_p.autor_id and x.pregunta_id = p_pregunta and x.respuesta_id is null;
      if v_neto <> 0 then
        perform public.foro__apuntar(v_p.autor_id, 'retirado', -v_neto, p_pregunta, null, null);
      end if;
      -- Lo que avisaba de este hilo ya no lleva a ninguna parte.
      delete from public.foro_avisos a where a.pregunta_id = p_pregunta and not a.leido;
    end if;

    if p_penalizar then
      perform public.foro__apuntar(v_p.autor_id, 'retirado', -10, p_pregunta, null, null);
    end if;
    perform public.foro__aviso(v_p.autor_id, p_actor, 'retirado', p_pregunta, null, p_motivo);

    insert into public.foro_moderacion (actor_id, accion, pregunta_id, usuario_id, motivo)
    values (p_actor, p_accion, p_pregunta, v_p.autor_id, coalesce(p_motivo, ''));
    return null;
  end if;

  -- ── Una respuesta o una réplica ──
  select * into v_r from public.foro_respuestas r
  where r.id = p_respuesta and r.pregunta_id = p_pregunta for update;
  if not found then
    return 'no_existe';
  end if;
  if v_r.estado = 'borrada' or v_r.estado = v_final then
    return 'sin_cambios';
  end if;

  update public.foro_respuestas r set estado = v_final where r.id = p_respuesta;

  if v_r.estado = 'publicada' then
    if v_r.padre_id is null then
      update public.foro_preguntas q set respuestas = greatest(q.respuestas - 1, 0)
      where q.id = p_pregunta;
    end if;

    -- Era la ganadora: el hilo se reabre y su premio se retira aparte, para
    -- que al restaurarla no vuelva con unos puntos de ganadora que ya no es.
    if v_p.ganadora_id = p_respuesta then
      update public.foro_preguntas q set ganadora_id = null, cerrada = false where q.id = p_pregunta;
      perform public.foro__deshacer(v_r.autor_id, 'ganadora', p_pregunta, p_respuesta, v_p.autor_id);
      update public.foro_reputacion x set ganadoras = greatest(x.ganadoras - 1, 0)
      where x.usuario_id = v_r.autor_id;
      perform public.foro__aviso(v_p.autor_id, p_actor, 'ganadora_retirada', p_pregunta, null, '');
    end if;

    select coalesce(sum(x.puntos), 0) into v_neto
    from public.foro_puntos x
    where x.usuario_id = v_r.autor_id and x.respuesta_id = p_respuesta;
    if v_neto <> 0 then
      perform public.foro__apuntar(v_r.autor_id, 'retirado', -v_neto, p_pregunta, p_respuesta, null);
    end if;
    delete from public.foro_avisos a where a.respuesta_id = p_respuesta and not a.leido;
  end if;

  if p_penalizar then
    perform public.foro__apuntar(v_r.autor_id, 'retirado', -10, p_pregunta, p_respuesta, null);
  end if;
  perform public.foro__aviso(v_r.autor_id, p_actor, 'retirado', p_pregunta, p_respuesta, p_motivo);

  insert into public.foro_moderacion (actor_id, accion, pregunta_id, respuesta_id, usuario_id, motivo)
  values (p_actor, p_accion, p_pregunta, p_respuesta, v_r.autor_id, coalesce(p_motivo, ''));
  return null;
end;
$$;

-- Devuelve a «publicada» algo oculto, y con ello los puntos que se le
-- quitaron al ocultarlo (anula las filas «retirado» de ese mensaje).
create or replace function public.foro__restaurar(
  p_pregunta bigint, p_respuesta uuid, p_actor uuid, p_motivo text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_p     public.foro_preguntas%rowtype;
  v_r     public.foro_respuestas%rowtype;
  v_quit  integer;
begin
  select * into v_p from public.foro_preguntas q where q.id = p_pregunta for update;
  if not found then
    return 'no_existe';
  end if;

  if p_respuesta is null then
    if v_p.estado <> 'oculta' then
      return 'sin_cambios';
    end if;
    update public.foro_preguntas q set estado = 'publicada' where q.id = p_pregunta;
    update public.foro_imagenes i set estado = 'publicada'
    where i.pregunta_id = p_pregunta and i.estado = 'oculta';

    select coalesce(sum(x.puntos), 0) into v_quit
    from public.foro_puntos x
    where x.usuario_id = v_p.autor_id and x.motivo = 'retirado'
      and x.pregunta_id = p_pregunta and x.respuesta_id is null;
    if v_quit <> 0 then
      perform public.foro__apuntar(v_p.autor_id, 'retirado', -v_quit, p_pregunta, null, null);
    end if;
    perform public.foro__aviso(v_p.autor_id, p_actor, 'restaurado', p_pregunta, null, p_motivo);

    insert into public.foro_moderacion (actor_id, accion, pregunta_id, usuario_id, motivo)
    values (p_actor, 'restaurar', p_pregunta, v_p.autor_id, coalesce(p_motivo, ''));
    return null;
  end if;

  select * into v_r from public.foro_respuestas r
  where r.id = p_respuesta and r.pregunta_id = p_pregunta for update;
  if not found then
    return 'no_existe';
  end if;
  if v_r.estado <> 'oculta' then
    return 'sin_cambios';
  end if;

  update public.foro_respuestas r set estado = 'publicada' where r.id = p_respuesta;
  if v_r.padre_id is null then
    update public.foro_preguntas q set respuestas = q.respuestas + 1 where q.id = p_pregunta;
  end if;

  select coalesce(sum(x.puntos), 0) into v_quit
  from public.foro_puntos x
  where x.usuario_id = v_r.autor_id and x.motivo = 'retirado' and x.respuesta_id = p_respuesta;
  if v_quit <> 0 then
    perform public.foro__apuntar(v_r.autor_id, 'retirado', -v_quit, p_pregunta, p_respuesta, null);
  end if;
  perform public.foro__aviso(v_r.autor_id, p_actor, 'restaurado', p_pregunta, p_respuesta, p_motivo);

  insert into public.foro_moderacion (actor_id, accion, pregunta_id, respuesta_id, usuario_id, motivo)
  values (p_actor, 'restaurar', p_pregunta, p_respuesta, v_r.autor_id, coalesce(p_motivo, ''));
  return null;
end;
$$;

-- Cierra los reportes abiertos de un mensaje. Si se desestiman, cuenta los
-- reportes en falso de cada uno: 3 en 30 días, y 30 días sin poder reportar.
create or replace function public.foro__cerrar_reportes(
  p_pregunta bigint, p_respuesta uuid, p_estado text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_quien  uuid;
  v_n      integer := 0;
begin
  for v_quien in
    update public.foro_reportes r
    set estado = p_estado, resuelto_at = now()
    where r.estado = 'abierto' and r.pregunta_id = p_pregunta
      and r.respuesta_id is not distinct from p_respuesta
    returning r.usuario_id
  loop
    v_n := v_n + 1;
    if p_estado = 'desestimado' and v_quien is not null and (
      select count(*) from public.foro_reportes x
      where x.usuario_id = v_quien and x.estado = 'desestimado'
        and x.resuelto_at > now() - interval '30 days'
    ) >= 3 then
      insert into public.foro_reputacion (usuario_id) values (v_quien)
      on conflict (usuario_id) do nothing;
      update public.foro_reputacion x set sin_reportar_hasta = now() + interval '30 days'
      where x.usuario_id = v_quien;
    end if;
  end loop;
  return v_n;
end;
$$;

-- ¿Es admin? Leído de la base de datos en ese momento.
create or replace function public.foro__es_admin(p_usuario uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles p where p.id = p_usuario and p.role = 'admin');
$$;

-- ════════════════════════════════════════════════════════════════════════════
--  LO QUE HACE UN USUARIO
-- ════════════════════════════════════════════════════════════════════════════

-- Aceptar las normas de la comunidad, en su versión vigente.
create or replace function public.foro_aceptar_normas(p_usuario uuid, p_version integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_vigente integer;
  v_rol     text;
begin
  select a.normas_version into v_vigente from public.foro_ajustes a where a.id;
  if v_vigente is null or p_version is distinct from v_vigente then
    return public.foro__error('version_antigua');
  end if;
  select p.role into v_rol from public.profiles p where p.id = p_usuario;
  if v_rol is null or v_rol not in ('premium', 'admin') then
    return public.foro__error('no_premium');
  end if;
  insert into public.foro_normas_aceptadas (usuario_id, version) values (p_usuario, p_version)
  on conflict (usuario_id, version) do nothing;
  return jsonb_build_object('ok', true);
end;
$$;

-- El filtro de la API ha rechazado un mensaje: se cuenta, sin guardar el texto.
create or replace function public.foro_registrar_rechazo(p_usuario uuid, p_detector text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hoy integer;
begin
  if p_usuario is null or not exists (select 1 from auth.users u where u.id = p_usuario) then
    return public.foro__error('sin_sesion');
  end if;
  insert into public.foro_rechazos (usuario_id, detector) values (p_usuario, p_detector);
  select count(*) into v_hoy from public.foro_rechazos x
  where x.usuario_id = p_usuario and x.creado_at > now() - interval '24 hours';
  return jsonb_build_object('ok', true, 'hoy', v_hoy);
end;
$$;

-- Preguntar. El texto llega YA normalizado y filtrado por la API; aquí se
-- comprueban el permiso, los límites, los duplicados y las imágenes.
create or replace function public.foro_preguntar(
  p_usuario uuid, p_categoria text, p_titulo text, p_slug text, p_cuerpo text,
  p_huella text, p_imagenes uuid[], p_tiene_enlaces boolean
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

  return jsonb_build_object('ok', true, 'id', v_id, 'slug', p_slug);
exception
  when sqlstate 'FR001' then return public.foro__error('imagen_no_valida');
end;
$$;

-- Responder a la pregunta (p_a = null) o replicar a un mensaje (p_a = su id).
-- Si p_a es una réplica, la nueva cuelga de la MISMA respuesta y cita a su
-- autor: el hilo tiene un solo nivel.
create or replace function public.foro_responder(
  p_usuario uuid, p_pregunta bigint, p_a uuid, p_cuerpo text,
  p_huella text, p_tiene_enlaces boolean
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
begin
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

  return jsonb_build_object('ok', true, 'id', v_id, 'padre', v_padre);
end;
$$;

-- Poner o quitar un me gusta en una respuesta o una réplica.
create or replace function public.foro_me_gusta(p_usuario uuid, p_respuesta uuid, p_poner boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_r      public.foro_respuestas%rowtype;
  v_error  text;
  v_total  integer;
  v_n      integer;
begin
  v_error := public.foro_puede_participar(p_usuario);
  if v_error is not null then
    return public.foro__error(v_error);
  end if;

  select * into v_r from public.foro_respuestas r where r.id = p_respuesta for update;
  if not found or v_r.estado <> 'publicada' then
    return public.foro__error('no_existe');
  end if;
  if not exists (
    select 1 from public.foro_preguntas q where q.id = v_r.pregunta_id and q.estado = 'publicada'
  ) or (v_r.padre_id is not null and not exists (
    select 1 from public.foro_respuestas x where x.id = v_r.padre_id and x.estado = 'publicada'
  )) then
    return public.foro__error('no_existe');
  end if;
  if v_r.autor_id is not distinct from p_usuario then
    return public.foro__error('propio');
  end if;

  if p_poner then
    if (
      select count(*) from public.foro_me_gusta m
      where m.usuario_id = p_usuario and m.creado_at > now() - interval '24 hours'
    ) >= 60 then
      return public.foro__error('limite_me_gusta');
    end if;

    insert into public.foro_me_gusta (respuesta_id, usuario_id) values (p_respuesta, p_usuario)
    on conflict (respuesta_id, usuario_id) do nothing;
    get diagnostics v_n = row_count;
    if v_n = 1 then
      update public.foro_respuestas r set me_gusta = r.me_gusta + 1 where r.id = p_respuesta;
      perform public.foro__premiar(v_r.autor_id, 'me_gusta', 2, v_r.pregunta_id, p_respuesta, p_usuario);
      perform public.foro__aviso(v_r.autor_id, p_usuario, 'me_gusta', v_r.pregunta_id, p_respuesta, '');
    end if;
  else
    delete from public.foro_me_gusta m where m.respuesta_id = p_respuesta and m.usuario_id = p_usuario;
    get diagnostics v_n = row_count;
    if v_n = 1 then
      update public.foro_respuestas r set me_gusta = greatest(r.me_gusta - 1, 0) where r.id = p_respuesta;
      perform public.foro__deshacer(v_r.autor_id, 'me_gusta', v_r.pregunta_id, p_respuesta, p_usuario);
      perform public.foro__quitar_aviso(v_r.autor_id, 'me_gusta', v_r.pregunta_id, p_respuesta);
    end if;
  end if;

  select r.me_gusta into v_total from public.foro_respuestas r where r.id = p_respuesta;
  return jsonb_build_object('ok', true, 'me_gusta', v_total, 'puesto', p_poner);
end;
$$;

-- Poner o quitar una etiqueta (interesante, gracias, yo_tambien) en una pregunta.
create or replace function public.foro_etiquetar(
  p_usuario uuid, p_pregunta bigint, p_tipo text, p_poner boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_p      public.foro_preguntas%rowtype;
  v_error  text;
  v_n      integer;
  v_delta  integer := 0;
  v_pts    integer;
begin
  if p_tipo is null or p_tipo not in ('interesante', 'gracias', 'yo_tambien') then
    return public.foro__error('etiqueta_no_valida');
  end if;

  select * into v_p from public.foro_preguntas q where q.id = p_pregunta for update;
  if not found or v_p.estado <> 'publicada' then
    return public.foro__error('no_existe');
  end if;

  v_error := public.foro_puede_participar(p_usuario);
  if v_error is not null then
    return public.foro__error(v_error);
  end if;
  if v_p.autor_id is not distinct from p_usuario then
    return public.foro__error('propio');
  end if;

  v_pts := case when p_tipo = 'gracias' then 2 else 1 end;

  if p_poner then
    if (
      select count(*) from public.foro_etiquetas e
      where e.usuario_id = p_usuario and e.creado_at > now() - interval '24 hours'
    ) >= 60 then
      return public.foro__error('limite_etiquetas');
    end if;
    insert into public.foro_etiquetas (pregunta_id, usuario_id, tipo) values (p_pregunta, p_usuario, p_tipo)
    on conflict (pregunta_id, usuario_id, tipo) do nothing;
    get diagnostics v_n = row_count;
    if v_n = 1 then
      v_delta := 1;
      perform public.foro__premiar(v_p.autor_id, p_tipo, v_pts, p_pregunta, null, p_usuario);
      perform public.foro__aviso(v_p.autor_id, p_usuario, p_tipo, p_pregunta, null, '');
    end if;
  else
    delete from public.foro_etiquetas e
    where e.pregunta_id = p_pregunta and e.usuario_id = p_usuario and e.tipo = p_tipo;
    get diagnostics v_n = row_count;
    if v_n = 1 then
      v_delta := -1;
      perform public.foro__deshacer(v_p.autor_id, p_tipo, p_pregunta, null, p_usuario);
      perform public.foro__quitar_aviso(v_p.autor_id, p_tipo, p_pregunta, null);
    end if;
  end if;

  if v_delta <> 0 then
    update public.foro_preguntas q
    set interesante = greatest(q.interesante + case when p_tipo = 'interesante' then v_delta else 0 end, 0),
        gracias     = greatest(q.gracias     + case when p_tipo = 'gracias'     then v_delta else 0 end, 0),
        yo_tambien  = greatest(q.yo_tambien  + case when p_tipo = 'yo_tambien'  then v_delta else 0 end, 0)
    where q.id = p_pregunta;
    if p_tipo = 'gracias' and v_p.autor_id is not null then
      update public.foro_reputacion r set gracias = greatest(r.gracias + v_delta, 0)
      where r.usuario_id = v_p.autor_id;
    end if;
  end if;

  select * into v_p from public.foro_preguntas q where q.id = p_pregunta;
  return jsonb_build_object(
    'ok', true, 'puesto', p_poner,
    'interesante', v_p.interesante, 'gracias', v_p.gracias, 'yo_tambien', v_p.yo_tambien
  );
end;
$$;

-- Elegir la respuesta ganadora. El autor, una vez y para siempre; el admin
-- puede elegirla en cualquier hilo y cambiarla.
create or replace function public.foro_elegir_ganadora(
  p_usuario uuid, p_pregunta bigint, p_respuesta uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_p       public.foro_preguntas%rowtype;
  v_r       public.foro_respuestas%rowtype;
  v_vieja   public.foro_respuestas%rowtype;
  v_error   text;
  v_admin   boolean;
begin
  select * into v_p from public.foro_preguntas q where q.id = p_pregunta for update;
  if not found or v_p.estado <> 'publicada' then
    return public.foro__error('no_existe');
  end if;

  v_error := public.foro_puede_participar(p_usuario);
  if v_error is not null then
    return public.foro__error(v_error);
  end if;
  v_admin := public.foro__es_admin(p_usuario);

  if not v_admin then
    if v_p.autor_id is distinct from p_usuario then
      return public.foro__error('no_es_tuya');
    end if;
    if v_p.ganadora_id is not null or v_p.cerrada then
      return public.foro__error('ya_elegida');
    end if;
  end if;

  select * into v_r from public.foro_respuestas r
  where r.id = p_respuesta and r.pregunta_id = p_pregunta for update;
  if not found or v_r.estado <> 'publicada' or v_r.padre_id is not null then
    return public.foro__error('respuesta_no_valida');
  end if;
  -- Nadie se premia a sí mismo: ni el autor con su respuesta, ni el admin
  -- eligiendo en un hilo la respuesta de quien preguntó.
  if v_r.autor_id is not distinct from v_p.autor_id then
    return public.foro__error('propio');
  end if;
  if v_p.ganadora_id = p_respuesta then
    return public.foro__error('sin_cambios');
  end if;

  -- El admin cambia una ganadora que ya había: se le retira el premio.
  if v_p.ganadora_id is not null then
    select * into v_vieja from public.foro_respuestas r where r.id = v_p.ganadora_id for update;
    if found then
      perform public.foro__deshacer(v_vieja.autor_id, 'ganadora', p_pregunta, v_vieja.id, v_p.autor_id);
      update public.foro_reputacion x set ganadoras = greatest(x.ganadoras - 1, 0)
      where x.usuario_id = v_vieja.autor_id;
    end if;
  end if;

  update public.foro_preguntas q
  set ganadora_id = p_respuesta, cerrada = true, ultima_actividad_at = now()
  where q.id = p_pregunta;

  perform public.foro__apuntar(v_r.autor_id, 'ganadora', 15, p_pregunta, p_respuesta, v_p.autor_id);
  if v_r.autor_id is not null then
    insert into public.foro_reputacion (usuario_id) values (v_r.autor_id)
    on conflict (usuario_id) do nothing;
    update public.foro_reputacion x set ganadoras = x.ganadoras + 1 where x.usuario_id = v_r.autor_id;
  end if;
  perform public.foro__aviso(v_r.autor_id, p_usuario, 'ganadora', p_pregunta, p_respuesta, '');

  -- Los 2 puntos por cerrar su duda: solo si la elige el autor, y una vez.
  if not v_admin and not exists (
    select 1 from public.foro_puntos x
    where x.usuario_id = p_usuario and x.motivo = 'elegir_ganadora' and x.pregunta_id = p_pregunta
  ) then
    perform public.foro__apuntar(p_usuario, 'elegir_ganadora', 2, p_pregunta, null, null);
  end if;

  insert into public.foro_moderacion (actor_id, accion, pregunta_id, respuesta_id, usuario_id, motivo)
  values (
    p_usuario,
    case when v_p.ganadora_id is null then 'elegir_ganadora' else 'cambiar_ganadora' end,
    p_pregunta, p_respuesta, v_r.autor_id, ''
  );

  return jsonb_build_object('ok', true);
end;
$$;

-- Reportar un mensaje. Lo puede hacer también un Premium suspendido (FORO.md
-- §3), así que no usa `foro_puede_participar`: comprueba lo suyo.
-- Al tercer reporte de cuentas distintas —o al primero de «estafa» de alguien
-- con 50 puntos o más— el mensaje se oculta en esta misma transacción.
create or replace function public.foro_reportar(
  p_usuario uuid, p_pregunta bigint, p_respuesta uuid, p_motivo text, p_detalle text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_p        public.foro_preguntas%rowtype;
  v_r        public.foro_respuestas%rowtype;
  v_modo     text;
  v_rol      text;
  v_autor    uuid;
  v_puntos   integer;
  v_hasta    timestamptz;
  v_abiertos integer;
  v_oculto   boolean := false;
begin
  select * into v_p from public.foro_preguntas q where q.id = p_pregunta for update;
  if not found or v_p.estado <> 'publicada' then
    return public.foro__error('no_existe');
  end if;
  v_autor := v_p.autor_id;

  if p_respuesta is not null then
    select * into v_r from public.foro_respuestas r
    where r.id = p_respuesta and r.pregunta_id = p_pregunta for update;
    if not found or v_r.estado <> 'publicada' then
      return public.foro__error('no_existe');
    end if;
    v_autor := v_r.autor_id;
  end if;

  select a.modo into v_modo from public.foro_ajustes a where a.id;
  select p.role into v_rol from public.profiles p where p.id = p_usuario;
  if v_rol is null then
    return public.foro__error('sin_sesion');
  end if;
  if v_modo is distinct from 'abierto' and not (v_modo = 'cerrado' and v_rol = 'admin') then
    return public.foro__error('foro_cerrado');
  end if;
  if v_rol not in ('premium', 'admin') then
    return public.foro__error('no_premium');
  end if;
  if exists (
    select 1 from public.foro_sanciones s
    where s.usuario_id = p_usuario and s.tipo = 'expulsion' and s.levantada_at is null
  ) then
    return public.foro__error('sancionado');
  end if;
  if v_autor is not distinct from p_usuario then
    return public.foro__error('propio');
  end if;

  insert into public.foro_reputacion (usuario_id) values (p_usuario)
  on conflict (usuario_id) do nothing;
  select x.puntos, x.sin_reportar_hasta into v_puntos, v_hasta
  from public.foro_reputacion x where x.usuario_id = p_usuario for update;
  if v_hasta is not null and v_hasta > now() then
    return public.foro__error('sin_reportar');
  end if;
  if (
    select count(*) from public.foro_reportes x
    where x.usuario_id = p_usuario and x.creado_at > now() - interval '24 hours'
  ) >= 20 then
    return public.foro__error('limite_reportes');
  end if;

  begin
    insert into public.foro_reportes (pregunta_id, respuesta_id, usuario_id, motivo, detalle)
    values (p_pregunta, p_respuesta, p_usuario, p_motivo, coalesce(p_detalle, ''));
  exception
    when unique_violation then return public.foro__error('ya_reportado');
    when check_violation  then return public.foro__error('contenido_no_valido');
  end;

  select count(distinct x.usuario_id) into v_abiertos
  from public.foro_reportes x
  where x.estado = 'abierto' and x.pregunta_id = p_pregunta
    and x.respuesta_id is not distinct from p_respuesta;

  if v_abiertos >= 3 or (p_motivo = 'estafa' and v_puntos >= 50) then
    perform public.foro__retirar(
      p_pregunta, p_respuesta, null, 'ocultar_auto',
      'Oculto automáticamente por reportes, a la espera de revisión.', false
    );
    v_oculto := true;
  end if;

  return jsonb_build_object('ok', true, 'oculto', v_oculto);
end;
$$;

-- Editar lo propio, durante 30 minutos. El texto nuevo llega ya filtrado.
-- La versión anterior se guarda para el admin.
create or replace function public.foro_editar(
  p_usuario uuid, p_pregunta bigint, p_respuesta uuid,
  p_titulo text, p_cuerpo text, p_huella text, p_tiene_enlaces boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_p      public.foro_preguntas%rowtype;
  v_r      public.foro_respuestas%rowtype;
  v_error  text;
  v_admin  boolean;
  v_nuevo  boolean;
begin
  select * into v_p from public.foro_preguntas q where q.id = p_pregunta for update;
  if not found or v_p.estado <> 'publicada' then
    return public.foro__error('no_existe');
  end if;

  select * into v_error, v_admin, v_nuevo
  from public.foro__antes_de_publicar(p_usuario, p_tiene_enlaces);
  if v_error is not null then
    return public.foro__error(v_error);
  end if;

  if p_respuesta is null then
    if v_p.autor_id is distinct from p_usuario then
      return public.foro__error('no_es_tuya');
    end if;
    if v_p.creada_at < now() - interval '30 minutes' then
      return public.foro__error('fuera_de_plazo');
    end if;
    if exists (
      select 1 from public.foro_preguntas q
      where q.huella = p_huella and q.id <> p_pregunta and q.estado <> 'borrada'
    ) then
      return public.foro__error('duplicado');
    end if;
    insert into public.foro_ediciones (pregunta_id, editor_id, titulo, cuerpo)
    values (p_pregunta, p_usuario, v_p.titulo, v_p.cuerpo);
    begin
      update public.foro_preguntas q
      set titulo = p_titulo, cuerpo = p_cuerpo, huella = p_huella, editada_at = now()
      where q.id = p_pregunta;
    exception
      when unique_violation then return public.foro__error('duplicado');
      when check_violation  then return public.foro__error('contenido_no_valido');
    end;
    return jsonb_build_object('ok', true);
  end if;

  select * into v_r from public.foro_respuestas r
  where r.id = p_respuesta and r.pregunta_id = p_pregunta for update;
  if not found or v_r.estado <> 'publicada' then
    return public.foro__error('no_existe');
  end if;
  if v_r.autor_id is distinct from p_usuario then
    return public.foro__error('no_es_tuya');
  end if;
  if v_r.creada_at < now() - interval '30 minutes' then
    return public.foro__error('fuera_de_plazo');
  end if;
  -- La ganadora no se edita: cambiaría lo que se premió.
  if v_p.ganadora_id = p_respuesta then
    return public.foro__error('es_ganadora');
  end if;
  insert into public.foro_ediciones (pregunta_id, respuesta_id, editor_id, cuerpo)
  values (p_pregunta, p_respuesta, p_usuario, v_r.cuerpo);
  begin
    update public.foro_respuestas r
    set cuerpo = p_cuerpo, huella = p_huella, editada_at = now()
    where r.id = p_respuesta;
  exception
    when unique_violation then return public.foro__error('duplicado');
    when check_violation  then return public.foro__error('contenido_no_valido');
  end;
  return jsonb_build_object('ok', true);
end;
$$;

-- Borrar lo propio. No pide ser Premium: es su contenido, y puede retirarlo
-- aunque ya no pague. Una pregunta, solo si nadie ha respondido; una
-- respuesta, siempre que no sea la ganadora.
create or replace function public.foro_borrar_propio(
  p_usuario uuid, p_pregunta bigint, p_respuesta uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_p      public.foro_preguntas%rowtype;
  v_r      public.foro_respuestas%rowtype;
  v_error  text;
begin
  if p_usuario is null then
    return public.foro__error('sin_sesion');
  end if;
  select * into v_p from public.foro_preguntas q where q.id = p_pregunta for update;
  if not found or v_p.estado = 'borrada' then
    return public.foro__error('no_existe');
  end if;

  if p_respuesta is null then
    if v_p.autor_id is distinct from p_usuario then
      return public.foro__error('no_existe');
    end if;
    if exists (
      select 1 from public.foro_respuestas r
      where r.pregunta_id = p_pregunta and r.estado <> 'borrada'
    ) then
      return public.foro__error('tiene_respuestas');
    end if;
  else
    select * into v_r from public.foro_respuestas r
    where r.id = p_respuesta and r.pregunta_id = p_pregunta;
    if not found or v_r.estado = 'borrada' or v_r.autor_id is distinct from p_usuario then
      return public.foro__error('no_existe');
    end if;
    if v_p.ganadora_id = p_respuesta then
      return public.foro__error('es_ganadora');
    end if;
  end if;

  v_error := public.foro__retirar(p_pregunta, p_respuesta, p_usuario, 'borrar', 'Borrado por su autor.', false);
  if v_error is not null then
    return public.foro__error(v_error);
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

-- Marcar avisos como leídos: los que diga, o todos si no dice ninguno.
-- Solo los SUYOS: el filtro por destinatario no depende de la lista.
create or replace function public.foro_leer_avisos(p_usuario uuid, p_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_n integer;
begin
  if p_usuario is null then
    return public.foro__error('sin_sesion');
  end if;
  update public.foro_avisos a
  set leido = true, leido_at = now()
  where a.destinatario = p_usuario and not a.leido
    and (p_ids is null or a.id = any (p_ids));
  get diagnostics v_n = row_count;
  return jsonb_build_object('ok', true, 'leidos', v_n);
end;
$$;

-- ════════════════════════════════════════════════════════════════════════════
--  LO QUE HACE EL ADMIN
-- ════════════════════════════════════════════════════════════════════════════

-- Moderar un mensaje o un hilo.
--   ocultar · restaurar · borrar · desestimar  → pregunta o respuesta
--   cerrar · reabrir · fijar · desfijar · mover → solo la pregunta
create or replace function public.foro_moderar(
  p_admin uuid, p_accion text, p_pregunta bigint, p_respuesta uuid,
  p_motivo text, p_categoria text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_p       public.foro_preguntas%rowtype;
  v_error   text;
  v_motivo  text := btrim(coalesce(p_motivo, ''));
begin
  if not public.foro__es_admin(p_admin) then
    return public.foro__error('no_admin');
  end if;

  if p_accion in ('ocultar', 'borrar') then
    -- El autor ve el motivo (y lo pide la ley): no puede ir vacío.
    if char_length(v_motivo) < 3 then
      return public.foro__error('falta_motivo');
    end if;
    v_error := public.foro__retirar(p_pregunta, p_respuesta, p_admin, p_accion, v_motivo, p_accion = 'borrar');
    if v_error is not null then
      return public.foro__error(v_error);
    end if;
    perform public.foro__cerrar_reportes(p_pregunta, p_respuesta, 'aceptado');
    return jsonb_build_object('ok', true);
  end if;

  if p_accion = 'restaurar' then
    v_error := public.foro__restaurar(p_pregunta, p_respuesta, p_admin, v_motivo);
    if v_error is not null then
      return public.foro__error(v_error);
    end if;
    perform public.foro__cerrar_reportes(p_pregunta, p_respuesta, 'desestimado');
    return jsonb_build_object('ok', true);
  end if;

  select * into v_p from public.foro_preguntas q where q.id = p_pregunta for update;
  if not found then
    return public.foro__error('no_existe');
  end if;

  if p_accion = 'desestimar' then
    if public.foro__cerrar_reportes(p_pregunta, p_respuesta, 'desestimado') = 0 then
      return public.foro__error('sin_cambios');
    end if;
    insert into public.foro_moderacion (actor_id, accion, pregunta_id, respuesta_id, motivo)
    values (p_admin, 'desestimar_reporte', p_pregunta, p_respuesta, v_motivo);
    return jsonb_build_object('ok', true);
  end if;

  if p_respuesta is not null then
    return public.foro__error('accion_no_valida');
  end if;

  if p_accion = 'cerrar' then
    update public.foro_preguntas q set cerrada = true where q.id = p_pregunta;
  elsif p_accion = 'reabrir' then
    -- Reabrir un hilo con ganadora la dejaría elegida y abierto a la vez.
    if v_p.ganadora_id is not null then
      return public.foro__error('tiene_ganadora');
    end if;
    update public.foro_preguntas q set cerrada = false where q.id = p_pregunta;
  elsif p_accion = 'fijar' then
    update public.foro_preguntas q set fijada = true where q.id = p_pregunta;
  elsif p_accion = 'desfijar' then
    update public.foro_preguntas q set fijada = false where q.id = p_pregunta;
  elsif p_accion = 'mover' then
    if not exists (select 1 from public.foro_categorias c where c.slug = p_categoria and c.activa) then
      return public.foro__error('categoria_no_valida');
    end if;
    update public.foro_preguntas q set categoria = p_categoria where q.id = p_pregunta;
  else
    return public.foro__error('accion_no_valida');
  end if;

  insert into public.foro_moderacion (actor_id, accion, pregunta_id, usuario_id, motivo)
  values (p_admin, p_accion, p_pregunta, v_p.autor_id, v_motivo);
  return jsonb_build_object('ok', true);
end;
$$;

-- Sancionar: aviso, suspensión (con sus días) o expulsión.
create or replace function public.foro_sancionar(
  p_admin uuid, p_usuario uuid, p_tipo text, p_dias integer, p_motivo text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_motivo  text := btrim(coalesce(p_motivo, ''));
  v_hasta   timestamptz;
  v_id      uuid;
begin
  if not public.foro__es_admin(p_admin) then
    return public.foro__error('no_admin');
  end if;
  if p_tipo is null or p_tipo not in ('aviso', 'suspension', 'expulsion') then
    return public.foro__error('accion_no_valida');
  end if;
  if char_length(v_motivo) < 3 then
    return public.foro__error('falta_motivo');
  end if;
  if not exists (select 1 from public.profiles p where p.id = p_usuario) then
    return public.foro__error('no_existe');
  end if;
  if public.foro__es_admin(p_usuario) then
    return public.foro__error('accion_no_valida');
  end if;
  if p_tipo = 'suspension' then
    if p_dias is null or p_dias < 1 or p_dias > 365 then
      return public.foro__error('accion_no_valida');
    end if;
    v_hasta := now() + make_interval(days => p_dias);
  end if;

  insert into public.foro_sanciones (usuario_id, tipo, hasta, motivo, admin_id)
  values (p_usuario, p_tipo, v_hasta, v_motivo, p_admin)
  returning id into v_id;

  perform public.foro__apuntar(
    p_usuario, 'sancion', case when p_tipo = 'aviso' then -25 else -50 end, null, null, null
  );
  perform public.foro__aviso(p_usuario, p_admin, 'sancion', null, null, v_motivo);
  insert into public.foro_moderacion (actor_id, accion, usuario_id, motivo)
  values (p_admin, 'sancionar', p_usuario, p_tipo || ': ' || v_motivo);

  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

-- Levantar una sanción antes de tiempo. Los puntos que costó no vuelven.
create or replace function public.foro_levantar_sancion(p_admin uuid, p_sancion uuid, p_motivo text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario uuid;
begin
  if not public.foro__es_admin(p_admin) then
    return public.foro__error('no_admin');
  end if;
  update public.foro_sanciones s set levantada_at = now()
  where s.id = p_sancion and s.levantada_at is null
  returning s.usuario_id into v_usuario;
  if not found then
    return public.foro__error('sin_cambios');
  end if;
  insert into public.foro_moderacion (actor_id, accion, usuario_id, motivo)
  values (p_admin, 'levantar_sancion', v_usuario, btrim(coalesce(p_motivo, '')));
  return jsonb_build_object('ok', true);
end;
$$;

-- El interruptor del foro: cerrado, lectura o abierto.
create or replace function public.foro_cambiar_modo(p_admin uuid, p_modo text, p_motivo text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.foro__es_admin(p_admin) then
    return public.foro__error('no_admin');
  end if;
  if p_modo is null or p_modo not in ('cerrado', 'lectura', 'abierto') then
    return public.foro__error('accion_no_valida');
  end if;
  update public.foro_ajustes a set modo = p_modo, actualizado_at = now() where a.id;
  insert into public.foro_moderacion (actor_id, accion, motivo)
  values (p_admin, 'cambiar_modo', p_modo || ': ' || btrim(coalesce(p_motivo, '')));
  return jsonb_build_object('ok', true, 'modo', p_modo);
end;
$$;

-- ════════════════════════════════════════════════════════════════════════════
--  EL CIERRE: ninguna función del foro se puede llamar desde el navegador
-- ════════════════════════════════════════════════════════════════════════════
-- Recorre TODAS las funciones `foro_*` de `public`, las de hoy y las que se
-- añadan: una función nueva que se olvide de su `revoke` queda cerrada igual
-- al volver a ejecutar este archivo.
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

-- Comprobación: TODO tiene que salir en «bien».
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
  select 'Están todas (29 o más)', 'foro_*',
         (select count(*) >= 29 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'public' and p.proname like 'foro\_%')
) x
order by ok, comprobacion, objeto;
