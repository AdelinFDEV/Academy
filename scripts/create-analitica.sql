-- ════════════════════════════════════════════════════════════════════════════
-- 13-11-2026 · Analítica propia (/admin) — sustituye a site_visits y guide_visits
-- ════════════════════════════════════════════════════════════════════════════
--
-- Una fila por página vista. Sin cookies ni almacenamiento en el navegador, y
-- sin guardar la IP: `visitante` es un código que el servidor calcula con la
-- IP, el navegador y una sal que cambia cada día, así que cuenta visitantes
-- únicos de un día pero no puede seguir a nadie de un día a otro.
--
-- Solo escribe y lee el servidor, con la clave de servicio: RLS activado, cero
-- policies y nada concedido a `anon` ni a `authenticated`.
--
-- Idempotente: se puede lanzar entero y más de una vez.

create table if not exists public.visitas (
  id           bigint generated always as identity primary key,
  creada       timestamptz not null default now(),
  ruta         text not null check (char_length(ruta) between 1 and 200),
  visitante    text not null check (char_length(visitante) = 16),
  user_id      uuid references auth.users (id) on delete set null,
  entrada      boolean not null default false,
  canal        text check (char_length(canal) <= 40),
  referente    text check (char_length(referente) <= 120),
  utm_source   text check (char_length(utm_source) <= 60),
  utm_medium   text check (char_length(utm_medium) <= 60),
  utm_campaign text check (char_length(utm_campaign) <= 80),
  pais         text check (char_length(pais) = 2),
  dispositivo  text check (dispositivo in ('movil', 'tablet', 'escritorio')),
  sistema      text check (char_length(sistema) <= 20)
);

create index if not exists visitas_creada_idx on public.visitas (creada);
create index if not exists visitas_user_idx on public.visitas (user_id) where user_id is not null;

alter table public.visitas enable row level security;
revoke all on public.visitas from anon, authenticated;

-- ── Lo que ve el panel: todo el tráfico de un periodo en una sola llamada ──
-- Los días se cuentan en la hora de Rumanía, como el resto del panel.
-- «visitas» = parejas (visitante, día): la misma persona dos días son 2.
create or replace function public.analitica_trafico(p_desde timestamptz, p_hasta timestamptz)
returns jsonb
language sql
stable
set search_path = public
as $$
  with v as (
    select *, (creada at time zone 'Europe/Bucharest')::date as dia
    from public.visitas
    where creada >= p_desde and creada < p_hasta
  ),
  visitas_dia as (
    select distinct visitante, dia from v
  ),
  -- La primera fila de cada visitante en cada día: de ahí salen país,
  -- dispositivo y sistema, para no contar dos veces a quien cambia de red.
  primera as (
    select distinct on (visitante, dia) visitante, dia, pais, dispositivo, sistema
    from v order by visitante, dia, creada
  )
  select jsonb_build_object(
    'vistas',     (select count(*) from v),
    'visitas',    (select count(*) from visitas_dia),
    'con_sesion', (select count(distinct user_id) from v),
    -- Visitas de una sola página: llegaron y se fueron.
    'rebotes',    (select count(*) from (select 1 from v group by visitante, dia having count(*) = 1) r),
    -- A qué hora (de Rumanía) se ve la web: páginas vistas por tramo.
    'por_hora', coalesce((
      select jsonb_agg(jsonb_build_object('hora', hora, 'n', n) order by hora)
      from (select extract(hour from creada at time zone 'Europe/Bucharest')::int as hora, count(*) as n from v group by 1) h
    ), '[]'::jsonb),
    'por_dia', coalesce((
      select jsonb_agg(jsonb_build_object('dia', dia, 'visitantes', visitantes, 'vistas', vistas) order by dia)
      from (select dia, count(distinct visitante) as visitantes, count(*) as vistas from v group by dia) d
    ), '[]'::jsonb),
    'canales', coalesce((
      select jsonb_agg(jsonb_build_object('nombre', canal, 'n', n) order by n desc)
      from (select coalesce(canal, 'Directo') as canal, count(*) as n from v where entrada group by 1) c
    ), '[]'::jsonb),
    'campanas', coalesce((
      select jsonb_agg(jsonb_build_object('nombre', nombre, 'n', n) order by n desc)
      from (
        select concat_ws(' · ', utm_source, utm_campaign) as nombre, count(*) as n
        from v where entrada and (utm_source is not null or utm_campaign is not null)
        group by 1 order by 2 desc limit 10
      ) c
    ), '[]'::jsonb),
    'referentes', coalesce((
      select jsonb_agg(jsonb_build_object('nombre', referente, 'n', n) order by n desc)
      from (
        select referente, count(*) as n from v
        where entrada and referente is not null
        group by 1 order by 2 desc limit 10
      ) r
    ), '[]'::jsonb),
    'paises', coalesce((
      select jsonb_agg(jsonb_build_object('nombre', pais, 'n', n) order by n desc)
      from (select coalesce(pais, '??') as pais, count(*) as n from primera group by 1 order by 2 desc limit 12) p
    ), '[]'::jsonb),
    'dispositivos', coalesce((
      select jsonb_agg(jsonb_build_object('nombre', dispositivo, 'n', n) order by n desc)
      from (select coalesce(dispositivo, 'escritorio') as dispositivo, count(*) as n from primera group by 1) d
    ), '[]'::jsonb),
    'sistemas', coalesce((
      select jsonb_agg(jsonb_build_object('nombre', sistema, 'n', n) order by n desc)
      from (select coalesce(sistema, 'Otro') as sistema, count(*) as n from primera group by 1) s
    ), '[]'::jsonb),
    'paginas', coalesce((
      select jsonb_agg(jsonb_build_object('nombre', ruta, 'n', vistas, 'visitantes', visitantes) order by vistas desc)
      from (
        select ruta, count(*) as vistas, count(distinct (visitante, dia)) as visitantes
        from v group by 1 order by 2 desc limit 15
      ) p
    ), '[]'::jsonb),
    'entradas', coalesce((
      select jsonb_agg(jsonb_build_object('nombre', ruta, 'n', n) order by n desc)
      from (select ruta, count(*) as n from v where entrada group by 1 order by 2 desc limit 10) e
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.analitica_trafico(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.analitica_trafico(timestamptz, timestamptz) to service_role;

-- ── Visitantes que no cuentan: el admin ──
-- Cuando el servidor ve que quien navega es un admin, apunta aquí su código de
-- hoy y borra lo que ese código hubiera dejado antes de iniciar sesión. Desde
-- ese momento, ese navegador no cuenta en todo el día, tampoco sin sesión.
-- El código cambia cada día, así que cada fila caduca sola; el cron las purga.
create table if not exists public.visitas_excluidas (
  visitante text primary key check (char_length(visitante) = 16),
  creada    timestamptz not null default now()
);
alter table public.visitas_excluidas enable row level security;
revoke all on public.visitas_excluidas from anon, authenticated;

create or replace function public.visita_excluir(p_visitante text)
returns void
language sql
set search_path = public
as $$
  insert into public.visitas_excluidas (visitante) values (p_visitante)
  on conflict (visitante) do nothing;
  delete from public.visitas where visitante = p_visitante;
$$;

-- Guarda una página vista, salvo que el visitante esté excluido hoy.
create or replace function public.visita_registrar(
  p_ruta text, p_visitante text, p_user uuid, p_entrada boolean, p_canal text, p_referente text,
  p_utm_source text, p_utm_medium text, p_utm_campaign text, p_pais text, p_dispositivo text, p_sistema text
)
returns void
language sql
set search_path = public
as $$
  insert into public.visitas (ruta, visitante, user_id, entrada, canal, referente, utm_source, utm_medium, utm_campaign, pais, dispositivo, sistema)
  select p_ruta, p_visitante, p_user, p_entrada, p_canal, p_referente, p_utm_source, p_utm_medium, p_utm_campaign, p_pais, p_dispositivo, p_sistema
  where not exists (select 1 from public.visitas_excluidas e where e.visitante = p_visitante);
$$;

revoke all on function public.visita_excluir(text) from public, anon, authenticated;
revoke all on function public.visita_registrar(text, text, uuid, boolean, text, text, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.visita_excluir(text) to service_role;
grant execute on function public.visita_registrar(text, text, uuid, boolean, text, text, text, text, text, text, text, text) to service_role;

-- ── La academia: cuentas, Premium y uso, SIN administradores ──
-- Todo se cuenta en la base de datos (nada de traer filas y contarlas fuera:
-- la API corta en 1.000 sin avisar). Los admins no cuentan en ninguna cifra:
-- ni como usuarios, ni sus lecciones, operaciones o certificados de prueba.
create or replace function public.analitica_academia(p_desde timestamptz, p_hasta timestamptz)
returns jsonb
language sql
stable
set search_path = public
as $$
  with u as (
    select * from public.profiles where role <> 'admin'
  ),
  nuevos as (
    select id from u where created_at >= p_desde and created_at < p_hasta
  ),
  -- Cada cosa que un usuario ha hecho con la academia, una fila.
  hechos as (
    select user_id from public.curso_inscripciones
    union all select user_id from public.curso_progreso
    union all select user_id from public.trades
    union all select user_id from public.diario_dias
    union all select user_id from public.guide_quiz_completions
    union all select user_id from public.saved_terms
    union all select user_id from public.guide_saves
  ),
  ultimos as (
    select id from u order by created_at desc limit 30
  )
  select jsonb_build_object(
    'usuarios',     (select count(*) from u),
    'premium',      (select count(*) from u where role = 'premium'),
    -- Los que pagan de verdad: con suscripción de Stripe en vigor. Un Premium
    -- dado a mano desde el panel no genera dinero.
    'premium_pago', (select count(*) from u where role = 'premium' and stripe_subscription_id is not null
                       and subscription_status in ('active', 'trialing', 'past_due')),
    'cancelaran',   (select count(*) from u where role = 'premium' and subscription_cancel_at_period_end),
    'registros',    (select count(*) from nuevos),
    'activados',    (select count(*) from nuevos n where exists (select 1 from hechos h where h.user_id = n.id)),
    'altas',        (select count(*) from u where premium_since >= p_desde and premium_since < p_hasta),
    'bajas',        (select count(*) from u where role = 'free' and premium_since is not null
                       and subscription_current_period_end >= p_desde and subscription_current_period_end < p_hasta),
    'registros_dia', coalesce((
      select jsonb_agg(jsonb_build_object('dia', dia, 'n', n) order by dia)
      from (select (created_at at time zone 'Europe/Bucharest')::date as dia, count(*) as n
            from u where created_at >= p_desde and created_at < p_hasta group by 1) d
    ), '[]'::jsonb),
    'uso', jsonb_build_object(
      'lecciones',    (select count(*) from public.curso_progreso t join u on u.id = t.user_id where t.completada_at >= p_desde and t.completada_at < p_hasta),
      'cursos',       (select count(*) from public.curso_inscripciones t join u on u.id = t.user_id where t.created_at >= p_desde and t.created_at < p_hasta),
      'examenes',     (select count(*) from public.curso_intentos t join u on u.id = t.user_id where t.entregado_at >= p_desde and t.entregado_at < p_hasta),
      'certificados', (select count(*) from public.curso_certificados t join u on u.id = t.user_id where t.created_at >= p_desde and t.created_at < p_hasta),
      'operaciones',  (select count(*) from public.trades t join u on u.id = t.user_id where t.created_at >= p_desde and t.created_at < p_hasta),
      'quizzes',      (select count(*) from public.guide_quiz_completions t join u on u.id = t.user_id where t.completed_at >= p_desde and t.completed_at < p_hasta),
      'terminos',     (select count(*) from public.saved_terms t join u on u.id = t.user_id where t.created_at >= p_desde and t.created_at < p_hasta)
    ),
    'cursos', coalesce((
      select jsonb_agg(jsonb_build_object('titulo', c.titulo, 'inscritos', i.n, 'certificados', ce.n) order by i.n desc, c.orden)
      from public.cursos c
      cross join lateral (select count(*) as n from public.curso_inscripciones t join u on u.id = t.user_id where t.curso_id = c.id) i
      cross join lateral (select count(*) as n from public.curso_certificados t join u on u.id = t.user_id where t.curso_id = c.id) ce
      where c.published
    ), '[]'::jsonb),
    -- Cuántas cosas ha hecho cada uno de los 30 últimos registrados.
    'acciones', coalesce((
      select jsonb_object_agg(h.user_id, h.n)
      from (select user_id, count(*) as n from hechos where user_id in (select id from ultimos) group by 1) h
    ), '{}'::jsonb)
  );
$$;

revoke all on function public.analitica_academia(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.analitica_academia(timestamptz, timestamptz) to service_role;

-- ── Lo que se retira: las dos tablas de visitas anteriores ──
-- `site_visits` (solo la ruta) y `guide_visits` (la misma visita, repetida para
-- las guías). Sus datos no traen visitante, país, dispositivo ni origen.
drop table if exists public.site_visits cascade;
drop table if exists public.guide_visits cascade;
