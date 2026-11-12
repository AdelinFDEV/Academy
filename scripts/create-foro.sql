-- Ejecutar en Supabase SQL Editor
-- ============================================================================
--  EL FORO — fase 2: el esquema (12-11-2026). Plan entero en FORO.md.
--
--  LA REGLA QUE MANDA SOBRE TODO LO DEMÁS (FORO.md §1 y §6.1):
--  desde el navegador, el foro NO EXISTE en Supabase. Ninguna tabla tiene
--  policies —ni de lectura ni de escritura— y `anon` y `authenticated` no
--  tienen ningún permiso sobre ellas. Todo lo lee y lo escribe el servidor
--  con la clave de servicio, a través de `src/lib/foro/`.
--
--  NO AÑADAS UNA POLICY NI UN GRANT A NINGUNA TABLA `foro_*`. Si algo «no se
--  ve desde el cliente», es que está funcionando.
--
--  Idempotente: se puede ejecutar entero más de una vez sin romper nada.
--  La última consulta comprueba el resultado: tiene que salir TODO en «bien».
-- ============================================================================

-- ── 1 · Ajustes: el interruptor del foro ────────────────────────────────────
-- Una sola fila. `modo`:
--   · cerrado  → solo el admin ve y usa el foro (así nace, hasta la beta)
--   · lectura  → se lee, pero nadie publica (la palanca de emergencia)
--   · abierto  → normal
create table if not exists public.foro_ajustes (
  id              boolean     primary key default true check (id),
  modo            text        not null default 'cerrado'
                              check (modo in ('cerrado', 'lectura', 'abierto')),
  normas_version  integer     not null default 1 check (normas_version > 0),
  actualizado_at  timestamptz not null default now()
);
insert into public.foro_ajustes (id) values (true) on conflict (id) do nothing;

-- ── 2 · Categorías: las crea solo el admin ──────────────────────────────────
create table if not exists public.foro_categorias (
  slug         text     primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 40),
  nombre       text     not null check (char_length(nombre) between 2 and 40),
  descripcion  text     not null default '' check (char_length(descripcion) <= 200),
  orden        smallint not null default 0,
  activa       boolean  not null default true
);
insert into public.foro_categorias (slug, nombre, descripcion, orden) values
  ('bitcoin',    'Bitcoin',              'Todo sobre Bitcoin: cómo funciona, cómo comprarlo y cómo guardarlo.', 1),
  ('altcoins',   'Altcoins',             'Ethereum, Solana y el resto de criptomonedas.',                      2),
  ('trading',    'Trading',              'Operativa, gestión del riesgo, psicología y análisis.',              3),
  ('seguridad',  'Seguridad y carteras', 'Carteras, frases semilla, estafas y cómo protegerte.',               4),
  ('impuestos',  'Impuestos',            'Fiscalidad de las criptomonedas y declaraciones.',                   5),
  ('academia',   'La academia',          'Dudas sobre las guías, los cursos y las herramientas de la web.',    6)
on conflict (slug) do nothing;

-- ── 3 · Preguntas ───────────────────────────────────────────────────────────
-- El id es correlativo porque va en la URL (/foro/<id>-<slug>). Todo lo demás
-- que el navegador necesita nombrar lleva uuid.
-- `autor_id` → `on delete set null`: al borrar la cuenta el mensaje queda como
-- «usuario eliminado» sin que nadie tenga que acordarse de anonimizarlo.
create table if not exists public.foro_preguntas (
  id                   bigint      generated always as identity primary key,
  autor_id             uuid        references auth.users (id) on delete set null,
  categoria            text        not null references public.foro_categorias (slug),
  titulo               text        not null check (char_length(titulo) between 15 and 150),
  slug                 text        not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  cuerpo               text        not null check (char_length(cuerpo) between 30 and 5000),
  estado               text        not null default 'publicada'
                                   check (estado in ('publicada', 'oculta', 'borrada')),
  cerrada              boolean     not null default false,
  fijada               boolean     not null default false,
  ganadora_id          uuid,
  -- Contadores. Los mantienen las funciones dentro de su transacción y el cron
  -- los recalcula desde las filas que los justifican (FORO.md §1.4).
  respuestas           integer     not null default 0 check (respuestas >= 0),
  interesante          integer     not null default 0 check (interesante >= 0),
  gracias              integer     not null default 0 check (gracias >= 0),
  yo_tambien           integer     not null default 0 check (yo_tambien >= 0),
  -- sha-256 del texto normalizado: caza el mismo texto dos veces.
  huella               text        not null check (huella ~ '^[0-9a-f]{64}$'),
  editada_at           timestamptz,
  editada_por_admin    boolean     not null default false,
  creada_at            timestamptz not null default now(),
  ultima_actividad_at  timestamptz not null default now()
);
create unique index if not exists foro_preguntas_sin_repetir
  on public.foro_preguntas (autor_id, huella);
create index if not exists foro_preguntas_listado
  on public.foro_preguntas (estado, categoria, ultima_actividad_at desc);
create index if not exists foro_preguntas_de_autor
  on public.foro_preguntas (autor_id, creada_at desc);
create index if not exists foro_preguntas_huella
  on public.foro_preguntas (huella);

-- ── 4 · Respuestas y réplicas ───────────────────────────────────────────────
-- Una réplica es una respuesta con `padre_id`. UN solo nivel: el padre es
-- siempre una respuesta, nunca otra réplica (lo vigila el trigger de abajo).
-- `citado_id`: a quién contesta una réplica dentro del hilo (se pinta su alias).
create table if not exists public.foro_respuestas (
  id                 uuid        primary key default gen_random_uuid(),
  pregunta_id        bigint      not null references public.foro_preguntas (id) on delete cascade,
  padre_id           uuid        references public.foro_respuestas (id) on delete cascade,
  autor_id           uuid        references auth.users (id) on delete set null,
  citado_id          uuid        references auth.users (id) on delete set null,
  cuerpo             text        not null,
  estado             text        not null default 'publicada'
                                 check (estado in ('publicada', 'oculta', 'borrada')),
  me_gusta           integer     not null default 0 check (me_gusta >= 0),
  huella             text        not null check (huella ~ '^[0-9a-f]{64}$'),
  editada_at         timestamptz,
  editada_por_admin  boolean     not null default false,
  creada_at          timestamptz not null default now(),
  constraint foro_respuestas_largo check (
    (padre_id is null     and char_length(cuerpo) between 20 and 3000) or
    (padre_id is not null and char_length(cuerpo) between 5  and 1000)
  ),
  constraint foro_respuestas_cita check (citado_id is null or padre_id is not null)
);
create unique index if not exists foro_respuestas_sin_repetir
  on public.foro_respuestas (autor_id, pregunta_id, huella);
create index if not exists foro_respuestas_de_hilo
  on public.foro_respuestas (pregunta_id, estado, padre_id, creada_at);
create index if not exists foro_respuestas_de_autor
  on public.foro_respuestas (autor_id, creada_at desc);
create index if not exists foro_respuestas_de_padre
  on public.foro_respuestas (padre_id) where padre_id is not null;

-- La ganadora, ahora que existe la tabla de respuestas.
alter table public.foro_preguntas drop constraint if exists foro_preguntas_ganadora_fk;
alter table public.foro_preguntas
  add constraint foro_preguntas_ganadora_fk
  foreign key (ganadora_id) references public.foro_respuestas (id) on delete set null;

-- Última barrera del «un solo nivel»: aunque una función se equivoque, la
-- tabla no admite una réplica de una réplica ni una de otro hilo.
create or replace function public.foro_respuestas_padre_valido()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_padre record;
begin
  if new.padre_id is null then
    return new;
  end if;
  select r.pregunta_id, r.padre_id into v_padre
  from public.foro_respuestas r
  where r.id = new.padre_id;
  if not found
     or v_padre.padre_id is not null
     or v_padre.pregunta_id <> new.pregunta_id then
    raise exception 'foro: padre no valido' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
drop trigger if exists foro_respuestas_padre_valido on public.foro_respuestas;
create trigger foro_respuestas_padre_valido
  before insert or update of padre_id, pregunta_id on public.foro_respuestas
  for each row execute function public.foro_respuestas_padre_valido();

-- ── 5 · Imágenes (solo de preguntas) ────────────────────────────────────────
-- `subida`: está en el bucket privado y aún no cuelga de ninguna pregunta.
-- La ruta la pone el servidor: un uuid y `.webp`, nunca un nombre del usuario.
create table if not exists public.foro_imagenes (
  id           uuid        primary key default gen_random_uuid(),
  pregunta_id  bigint      references public.foro_preguntas (id) on delete cascade,
  autor_id     uuid        references auth.users (id) on delete set null,
  ruta         text        not null unique check (ruta ~ '^[0-9a-f-]{36}\.webp$'),
  ancho        integer     not null check (ancho between 1 and 1600),
  alto         integer     not null check (alto between 1 and 1600),
  bytes        integer     not null check (bytes between 1 and 5242880),
  orden        smallint    not null default 0 check (orden between 0 and 3),
  estado       text        not null default 'subida'
                           check (estado in ('subida', 'publicada', 'oculta', 'borrada')),
  creada_at    timestamptz not null default now(),
  constraint foro_imagenes_publicada_con_pregunta
    check (estado = 'subida' or pregunta_id is not null)
);
create index if not exists foro_imagenes_de_pregunta
  on public.foro_imagenes (pregunta_id, orden);
create index if not exists foro_imagenes_de_autor
  on public.foro_imagenes (autor_id, creada_at desc);

-- ── 6 · Me gusta y etiquetas ────────────────────────────────────────────────
-- Las claves primarias hacen IMPOSIBLE el doble voto: no depende de que
-- nadie lo compruebe antes.
create table if not exists public.foro_me_gusta (
  respuesta_id  uuid        not null references public.foro_respuestas (id) on delete cascade,
  usuario_id    uuid        not null references auth.users (id) on delete cascade,
  creado_at     timestamptz not null default now(),
  primary key (respuesta_id, usuario_id)
);
create index if not exists foro_me_gusta_de_usuario
  on public.foro_me_gusta (usuario_id, creado_at desc);

create table if not exists public.foro_etiquetas (
  pregunta_id  bigint      not null references public.foro_preguntas (id) on delete cascade,
  usuario_id   uuid        not null references auth.users (id) on delete cascade,
  tipo         text        not null check (tipo in ('interesante', 'gracias', 'yo_tambien')),
  creado_at    timestamptz not null default now(),
  primary key (pregunta_id, usuario_id, tipo)
);
create index if not exists foro_etiquetas_de_usuario
  on public.foro_etiquetas (usuario_id, creado_at desc);

-- ── 7 · Reportes ────────────────────────────────────────────────────────────
-- Uno por persona y mensaje. `respuesta_id` vacío = se reporta la pregunta.
create table if not exists public.foro_reportes (
  id            uuid        primary key default gen_random_uuid(),
  pregunta_id   bigint      not null references public.foro_preguntas (id) on delete cascade,
  respuesta_id  uuid        references public.foro_respuestas (id) on delete cascade,
  usuario_id    uuid        references auth.users (id) on delete set null,
  motivo        text        not null check (motivo in (
                              'estafa', 'insulto', 'datos_personales',
                              'consejo_peligroso', 'fuera_de_tema', 'otro')),
  detalle       text        not null default '' check (char_length(detalle) <= 500),
  estado        text        not null default 'abierto'
                            check (estado in ('abierto', 'aceptado', 'desestimado')),
  creado_at     timestamptz not null default now(),
  resuelto_at   timestamptz
);
create unique index if not exists foro_reportes_uno_por_pregunta
  on public.foro_reportes (pregunta_id, usuario_id) where respuesta_id is null;
create unique index if not exists foro_reportes_uno_por_respuesta
  on public.foro_reportes (respuesta_id, usuario_id) where respuesta_id is not null;
create index if not exists foro_reportes_abiertos
  on public.foro_reportes (estado, creado_at);
create index if not exists foro_reportes_de_usuario
  on public.foro_reportes (usuario_id, creado_at desc);

-- ── 8 · Sanciones ───────────────────────────────────────────────────────────
create table if not exists public.foro_sanciones (
  id            uuid        primary key default gen_random_uuid(),
  usuario_id    uuid        not null references auth.users (id) on delete cascade,
  tipo          text        not null check (tipo in ('aviso', 'suspension', 'expulsion')),
  hasta         timestamptz,
  motivo        text        not null check (char_length(motivo) between 3 and 1000),
  admin_id      uuid        references auth.users (id) on delete set null,
  levantada_at  timestamptz,
  creada_at     timestamptz not null default now(),
  constraint foro_sanciones_suspension_con_fin check (tipo <> 'suspension' or hasta is not null)
);
create index if not exists foro_sanciones_de_usuario
  on public.foro_sanciones (usuario_id, creada_at desc);

-- ── 9 · El registro de moderación: solo inserción ───────────────────────────
-- Sin claves ajenas a propósito: el registro tiene que sobrevivir a lo que
-- cuenta (un mensaje borrado, una cuenta eliminada). Se purga a los 12 meses.
create table if not exists public.foro_moderacion (
  id            bigint      generated always as identity primary key,
  actor_id      uuid,                                    -- vacío = el sistema
  accion        text        not null check (accion in (
                              'ocultar', 'ocultar_auto', 'restaurar', 'borrar', 'editar',
                              'cerrar', 'reabrir', 'fijar', 'desfijar', 'mover',
                              'elegir_ganadora', 'cambiar_ganadora',
                              'aceptar_reporte', 'desestimar_reporte',
                              'sancionar', 'levantar_sancion',
                              'cambiar_modo', 'cambiar_normas', 'purgar', 'recalcular')),
  pregunta_id   bigint,
  respuesta_id  uuid,
  usuario_id    uuid,                                    -- sobre quién, si aplica
  motivo        text        not null default '' check (char_length(motivo) <= 1000),
  creado_at     timestamptz not null default now()
);
create index if not exists foro_moderacion_por_fecha on public.foro_moderacion (creado_at desc);
create index if not exists foro_moderacion_de_usuario on public.foro_moderacion (usuario_id, creado_at desc);

-- ── 10 · El libro de puntos: solo inserción ─────────────────────────────────
-- Un punto ganado o perdido es una fila. Revertir es otra fila en negativo,
-- nunca un borrado. `origen_id`: quién lo causó (para el tope por pareja).
create table if not exists public.foro_puntos (
  id            bigint      generated always as identity primary key,
  usuario_id    uuid        not null references auth.users (id) on delete cascade,
  motivo        text        not null check (motivo in (
                              'ganadora', 'me_gusta', 'gracias', 'interesante', 'yo_tambien',
                              'respuesta', 'pregunta', 'elegir_ganadora',
                              'retirado', 'sancion')),
  puntos        integer     not null check (puntos <> 0 and puntos between -100 and 100),
  pregunta_id   bigint,
  respuesta_id  uuid,
  origen_id     uuid,
  creado_at     timestamptz not null default now()
);
create index if not exists foro_puntos_de_usuario on public.foro_puntos (usuario_id, creado_at desc);
create index if not exists foro_puntos_por_motivo on public.foro_puntos (usuario_id, motivo, creado_at desc);
create index if not exists foro_puntos_por_pareja on public.foro_puntos (usuario_id, origen_id, creado_at desc);

-- El candado de las dos tablas de solo inserción. Vale también para la clave
-- de servicio: ni una ruta con un fallo puede reescribir el historial.
-- Dos excepciones, y solo dos:
--   · la purga programada, que abre el candado con `set local foro.purga = 'si'`;
--   · en `foro_puntos`, el borrado en cascada cuando la cuenta ya no existe.
create or replace function public.foro_solo_insercion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_setting('foro.purga', true) = 'si' then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;
  if tg_op = 'DELETE' and tg_table_name = 'foro_puntos'
     and not exists (select 1 from auth.users u where u.id = old.usuario_id) then
    return old;
  end if;
  raise exception 'foro: % es de solo insercion', tg_table_name using errcode = 'P0001';
end;
$$;
drop trigger if exists foro_moderacion_solo_insercion on public.foro_moderacion;
create trigger foro_moderacion_solo_insercion
  before update or delete on public.foro_moderacion
  for each row execute function public.foro_solo_insercion();
drop trigger if exists foro_puntos_solo_insercion on public.foro_puntos;
create trigger foro_puntos_solo_insercion
  before update or delete on public.foro_puntos
  for each row execute function public.foro_solo_insercion();

-- ── 11 · Reputación: los totales, DERIVADOS del libro de puntos ─────────────
-- Está para que el ranking cargue rápido. El cron la recalcula desde
-- `foro_puntos` y avisa si no cuadra. `primera_actividad_at` marca los 7 días
-- en que una cuenta nueva va más despacio (FORO.md §7.1).
create table if not exists public.foro_reputacion (
  usuario_id            uuid        primary key references auth.users (id) on delete cascade,
  puntos                integer     not null default 0,
  puntos_mes            integer     not null default 0,
  mes                   date        not null default date_trunc('month', now())::date,
  ganadoras             integer     not null default 0 check (ganadoras >= 0),
  gracias               integer     not null default 0 check (gracias >= 0),
  preguntas             integer     not null default 0 check (preguntas >= 0),
  respuestas            integer     not null default 0 check (respuestas >= 0),
  fuera_del_ranking     boolean     not null default false,
  primera_actividad_at  timestamptz not null default now(),
  sin_reportar_hasta    timestamptz,
  actualizado_at        timestamptz not null default now()
);
create index if not exists foro_reputacion_ranking on public.foro_reputacion (puntos desc);
create index if not exists foro_reputacion_ranking_mes on public.foro_reputacion (mes, puntos_mes desc);

-- ── 12 · Avisos ─────────────────────────────────────────────────────────────
-- No guardan texto: enlazan al hilo. Los no leídos del mismo tipo sobre lo
-- mismo se agrupan en una fila (`cuantos`), y el índice único lo garantiza.
create table if not exists public.foro_avisos (
  id              uuid        primary key default gen_random_uuid(),
  destinatario    uuid        not null references auth.users (id) on delete cascade,
  tipo            text        not null check (tipo in (
                                'respuesta', 'replica', 'me_gusta',
                                'interesante', 'gracias', 'yo_tambien',
                                'ganadora', 'elige_ganadora', 'ganadora_retirada',
                                'retirado', 'restaurado', 'sancion')),
  pregunta_id     bigint      references public.foro_preguntas (id) on delete cascade,
  respuesta_id    uuid        references public.foro_respuestas (id) on delete cascade,
  cuantos         integer     not null default 1 check (cuantos > 0),
  motivo          text        not null default '' check (char_length(motivo) <= 1000),
  leido           boolean     not null default false,
  leido_at        timestamptz,
  creado_at       timestamptz not null default now(),
  actualizado_at  timestamptz not null default now()
);
create unique index if not exists foro_avisos_agrupados
  on public.foro_avisos (destinatario, tipo, pregunta_id, respuesta_id) nulls not distinct
  where not leido;
create index if not exists foro_avisos_de_usuario
  on public.foro_avisos (destinatario, leido, actualizado_at desc);

-- ── 13 · Normas aceptadas, rechazos del filtro y versiones anteriores ───────
create table if not exists public.foro_normas_aceptadas (
  usuario_id   uuid        not null references auth.users (id) on delete cascade,
  version      integer     not null check (version > 0),
  aceptada_at  timestamptz not null default now(),
  primary key (usuario_id, version)
);

-- Cada mensaje que el filtro rechaza: quién y qué detector, NUNCA el texto.
-- Sirve para el tope de 10 al día y para ver qué detector se pasa de estricto.
create table if not exists public.foro_rechazos (
  id          bigint      generated always as identity primary key,
  usuario_id  uuid        not null references auth.users (id) on delete cascade,
  detector    text        not null check (detector ~ '^[a-z_]{2,40}$'),
  creado_at   timestamptz not null default now()
);
create index if not exists foro_rechazos_de_usuario on public.foro_rechazos (usuario_id, creado_at desc);

-- La versión anterior de un mensaje editado, solo para el admin.
create table if not exists public.foro_ediciones (
  id            bigint      generated always as identity primary key,
  pregunta_id   bigint      not null references public.foro_preguntas (id) on delete cascade,
  respuesta_id  uuid        references public.foro_respuestas (id) on delete cascade,
  editor_id     uuid,
  titulo        text,
  cuerpo        text        not null,
  creada_at     timestamptz not null default now()
);
create index if not exists foro_ediciones_de_mensaje
  on public.foro_ediciones (pregunta_id, respuesta_id, creada_at desc);

-- ── 14 · ¿Puede participar? La segunda comprobación ─────────────────────────
-- La API ya lo comprueba; las funciones de la fase 3 lo VUELVEN a comprobar
-- con esto dentro de su transacción (FORO.md §1.7). Devuelve null si puede, o
-- el código del motivo si no. Cerrada por defecto: lo que no sabe, es un no.
create or replace function public.foro_puede_participar(p_usuario uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_modo    text;
  v_version integer;
  v_rol     text;
  v_alias   text;
begin
  if p_usuario is null then
    return 'sin_sesion';
  end if;

  select a.modo, a.normas_version into v_modo, v_version
  from public.foro_ajustes a where a.id;
  if not found then
    return 'foro_cerrado';
  end if;

  select p.role, p.alias into v_rol, v_alias
  from public.profiles p where p.id = p_usuario;
  if not found then
    return 'sin_sesion';
  end if;

  if v_modo = 'cerrado' and v_rol <> 'admin' then
    return 'foro_cerrado';
  end if;
  if v_modo = 'lectura' then
    return 'solo_lectura';
  end if;
  if v_modo not in ('cerrado', 'abierto') then
    return 'foro_cerrado';
  end if;

  if v_rol is null or v_rol not in ('premium', 'admin') then
    return 'no_premium';
  end if;
  if v_alias is null then
    return 'sin_alias';
  end if;

  if exists (
    select 1 from public.foro_sanciones s
    where s.usuario_id = p_usuario
      and s.levantada_at is null
      and (s.tipo = 'expulsion' or (s.tipo = 'suspension' and s.hasta > now()))
  ) then
    return 'sancionado';
  end if;

  if not exists (
    select 1 from public.foro_normas_aceptadas n
    where n.usuario_id = p_usuario and n.version = v_version
  ) then
    return 'sin_normas';
  end if;

  return null;
end;
$$;

-- ── 15 · El cierre: RLS sin policies y ni un permiso para el navegador ──────
do $$
declare
  t text;
  p record;
begin
  foreach t in array array[
    'foro_ajustes', 'foro_categorias', 'foro_preguntas', 'foro_respuestas',
    'foro_imagenes', 'foro_me_gusta', 'foro_etiquetas', 'foro_reportes',
    'foro_sanciones', 'foro_moderacion', 'foro_puntos', 'foro_reputacion',
    'foro_avisos', 'foro_normas_aceptadas', 'foro_rechazos', 'foro_ediciones'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    -- Por si alguien añadió una policy a mano: fuera.
    for p in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
      execute format('drop policy %I on public.%I', p.policyname, t);
    end loop;
    execute format('revoke all on public.%I from public, anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    -- Nada del foro se emite por Realtime.
    if exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime drop table public.%I', t);
    end if;
  end loop;
end;
$$;

-- Las funciones. Postgres da EXECUTE a todo el mundo por defecto y Supabase
-- publica cada función de `public` en /rest/v1/rpc/…: se cierra una a una.
revoke execute on function public.foro_puede_participar(uuid)   from public, anon, authenticated;
revoke execute on function public.foro_respuestas_padre_valido() from public, anon, authenticated;
revoke execute on function public.foro_solo_insercion()          from public, anon, authenticated;
grant  execute on function public.foro_puede_participar(uuid)   to service_role;

-- ── 16 · Comprobación: TODO tiene que salir en «bien» ───────────────────────
select comprobacion, objeto, case when ok then 'bien' else 'MAL' end as resultado
from (
  -- Cada tabla, con RLS activada.
  select 'RLS activada' as comprobacion, c.relname::text as objeto, c.relrowsecurity as ok
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'foro\_%'
  union all
  -- Ninguna policy en ninguna tabla del foro.
  select 'Sin policies', c.relname::text,
         not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname)
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'foro\_%'
  union all
  -- Ningún permiso de tabla ni de columna para el navegador.
  select 'Sin permisos para anon ni authenticated', c.relname::text,
         not has_table_privilege('anon', c.oid, 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE')
         and not has_table_privilege('authenticated', c.oid, 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE')
         and not has_any_column_privilege('anon', c.oid, 'SELECT, INSERT, UPDATE')
         and not has_any_column_privilege('authenticated', c.oid, 'SELECT, INSERT, UPDATE')
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'foro\_%'
  union all
  -- Ninguna función del foro ejecutable desde el navegador.
  select 'Función cerrada al navegador', p.proname::text,
         not has_function_privilege('anon', p.oid, 'execute')
         and not has_function_privilege('authenticated', p.oid, 'execute')
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname like 'foro\_%'
  union all
  -- Nada del foro en Realtime.
  select 'Fuera de Realtime', c.relname::text,
         not exists (
           select 1 from pg_publication_tables t
           where t.pubname = 'supabase_realtime' and t.schemaname = 'public' and t.tablename = c.relname)
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'foro\_%'
  union all
  select 'Ajustes creados (una fila)', 'foro_ajustes',
         (select count(*) = 1 from public.foro_ajustes)
  union all
  select 'Seis categorías', 'foro_categorias',
         (select count(*) = 6 from public.foro_categorias)
) x
order by ok, comprobacion, objeto;
