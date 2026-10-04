-- Objetivos, plan de contenido y diario del negocio: /admin/objetivos.
--
-- Ejecutar en Supabase → SQL Editor. Es idempotente: se puede lanzar dos veces
-- sin romper nada.
--
-- ── Solo el admin, y solo desde el servidor ─────────────────────────────────
--
-- Es lo más personal del panel: objetivos, ideas y cómo se siente el admin con
-- su negocio. Las tres tablas llevan RLS activado y CERO políticas, igual que
-- `bot_ajustes`: con la clave anónima —la que va en el navegador de cualquiera—
-- no se puede ni leer ni escribir nada. Todo pasa por el servidor con la clave
-- de servicio, después de comprobar que la sesión es de un admin
-- (`requireAdmin` en la API, el layout de /admin en las páginas).
--
-- NO añadas una política «para que el admin pueda». Es exactamente el error
-- que PLATAFORMA.md describe para `portfolio_positions`.

-- ── 1. Objetivos ────────────────────────────────────────────────────────────
--
-- `metrica` dice de dónde sale el progreso:
--   · manual     → lo apunta el admin en `progreso_manual`
--   · entradas   → entradas publicadas en `posts` dentro del periodo
--   · videos     → vídeos de YouTube que el bot anunció (`content_announcements`)
--   · registros  → cuentas nuevas en `profiles`, sin administradores
--   · premium    → altas Premium (`profiles.premium_since`) dentro del periodo
-- Lo automático se calcula al leer, en src/lib/objetivos.ts: guardar el
-- progreso sería garantizar que algún día no cuadre con los datos.
create table if not exists public.objetivos (
  id               uuid primary key default gen_random_uuid(),
  titulo           text not null check (length(trim(titulo)) > 0),
  metrica          text not null default 'manual'
                     check (metrica in ('manual', 'entradas', 'videos', 'registros', 'premium')),
  meta             numeric(12, 2) not null check (meta > 0),
  progreso_manual  numeric(12, 2) not null default 0 check (progreso_manual >= 0),
  desde            date not null,
  hasta            date not null,
  notas            text,
  archivado        boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (hasta >= desde)
);

alter table public.objetivos enable row level security;

-- ── 2. Plan de contenido ────────────────────────────────────────────────────
--
-- Una fila por pieza: un vídeo, un short, una entrada, una guía o una
-- publicación en Telegram. Sin `fecha` es una idea todavía sin día.
create table if not exists public.contenido_plan (
  id            uuid primary key default gen_random_uuid(),
  fecha         date,
  canal         text not null check (canal in ('youtube', 'web', 'telegram')),
  tipo          text not null
                  check (tipo in ('video', 'short', 'entrada', 'guia', 'publicacion')),
  titulo        text not null check (length(trim(titulo)) > 0),
  estado        text not null default 'idea'
                  check (estado in ('idea', 'guion', 'grabado', 'editado', 'programado', 'publicado')),
  enlace        text,
  notas         text,
  publicado_en  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.contenido_plan enable row level security;

create index if not exists contenido_plan_fecha_idx on public.contenido_plan (fecha);

-- ── 3. Diario del negocio ───────────────────────────────────────────────────
--
-- `animo` va de 1 (muy mal) a 5 (muy bien), y es opcional: es la cifra que se
-- analiza. `emocion` es la palabra que lo matiza (cansado no es lo mismo que
-- frustrado, aunque los dos sean un 2), también opcional; la lista vive en
-- src/lib/objetivos.ts. `ancla` fija la nota arriba: para la visión a un año
-- y el porqué, que conviene releer.
create table if not exists public.diario_notas (
  id           uuid primary key default gen_random_uuid(),
  fecha        date not null default current_date,
  texto        text not null check (length(trim(texto)) > 0),
  animo        smallint check (animo between 1 and 5),
  emocion      text,
  objetivo_id  uuid references public.objetivos (id) on delete set null,
  ancla        boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.diario_notas enable row level security;

create index if not exists diario_notas_fecha_idx on public.diario_notas (fecha desc);

-- Para quien ya creó la tabla antes de que existiera la columna.
alter table public.diario_notas add column if not exists emocion text;

-- ════════════════════════════════════════════════════════════════════════════
-- 05-10-2026 · Objetivos repetibles, historial, +1 y métricas nuevas
-- ════════════════════════════════════════════════════════════════════════════
--
-- Todo idempotente y sin borrar nada: se puede lanzar sobre una base que ya
-- tenga objetivos.

-- ── Repetición ──────────────────────────────────────────────────────────────
--
-- `no`: un solo periodo, de `desde` a `hasta`.
-- `semanal` / `mensual`: se renueva solo cada semana (lunes a domingo) o cada
-- mes natural, desde la semana o el mes de `desde`. `hasta` pasa a ser
-- opcional: vacío = indefinido.
alter table public.objetivos
  add column if not exists repeticion text not null default 'no';

alter table public.objetivos drop constraint if exists objetivos_repeticion_check;
alter table public.objetivos
  add constraint objetivos_repeticion_check check (repeticion in ('no', 'semanal', 'mensual'));

alter table public.objetivos alter column hasta drop not null;

-- Un objetivo de una sola vez sigue necesitando fecha de fin.
alter table public.objetivos drop constraint if exists objetivos_hasta_si_no_repite;
alter table public.objetivos
  add constraint objetivos_hasta_si_no_repite check (repeticion <> 'no' or hasta is not null);

-- ── Métricas nuevas ─────────────────────────────────────────────────────────
--
-- Se cuentan en el periodo:     entradas, videos, registros, premium, ingresos
-- Se leen como nivel alcanzado: miembros_telegram (canal gratuito),
--                               suscriptores_youtube
alter table public.objetivos drop constraint if exists objetivos_metrica_check;
alter table public.objetivos
  add constraint objetivos_metrica_check check (metrica in (
    'manual', 'entradas', 'videos', 'registros', 'premium', 'ingresos',
    'miembros_telegram', 'suscriptores_youtube'
  ));

-- ── Progreso manual por periodo ─────────────────────────────────────────────
--
-- Una fila por objetivo y periodo (`periodo` = primer día). Es lo que permite
-- ver «cumplido 4 de los últimos 6 meses» en un objetivo que apunta el admin:
-- con un único número, cada mes nuevo pisaría el anterior. El botón +1 escribe
-- aquí. Sustituye a `objetivos.progreso_manual`, que se deja por compatibilidad
-- y ya no se lee.
create table if not exists public.objetivo_registros (
  objetivo_id  uuid not null references public.objetivos (id) on delete cascade,
  periodo      date not null,
  valor        numeric(12, 2) not null default 0 check (valor >= 0),
  updated_at   timestamptz not null default now(),
  primary key (objetivo_id, periodo)
);

alter table public.objetivo_registros enable row level security;

-- Lo que ya se hubiera apuntado con el sistema anterior pasa a su periodo.
insert into public.objetivo_registros (objetivo_id, periodo, valor)
select id, desde, progreso_manual
from public.objetivos
where metrica = 'manual' and progreso_manual > 0
on conflict (objetivo_id, periodo) do nothing;

-- ── Fotos diarias de métricas externas ──────────────────────────────────────
--
-- Los suscriptores de YouTube solo se pueden leer «ahora»: sin guardar una
-- foto al día no habría con qué comparar ni historial. La toma el cron de las
-- 04:00 (telegram-sync). Los miembros de Telegram ya tienen la suya en
-- `telegram_channel_stats`.
create table if not exists public.metricas_diarias (
  clave   text not null,
  fecha   date not null,
  valor   numeric(14, 2) not null,
  primary key (clave, fecha)
);

alter table public.metricas_diarias enable row level security;
