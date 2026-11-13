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

-- ── Lo que se retira: las dos tablas de visitas anteriores ──
-- `site_visits` (solo la ruta) y `guide_visits` (la misma visita, repetida para
-- las guías). Sus datos no traen visitante, país, dispositivo ni origen.
drop table if exists public.site_visits cascade;
drop table if exists public.guide_visits cascade;
