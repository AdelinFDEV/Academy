-- Ejecutar en Supabase SQL Editor
--
-- Historial del canal de Telegram, para poder medir crecimiento.
--
-- Hace falta guardarlo nosotros: la API de bots solo devuelve el número de
-- miembros AHORA. No hay histórico, ni altas pasadas, ni bajas. Lo que no se
-- registre en el momento se pierde para siempre.

-- Cada alta y cada baja, según llegan por el update chat_member.
create table if not exists public.telegram_channel_events (
  id bigserial primary key,
  chat_id text not null,
  telegram_user_id bigint not null,
  username text,
  nombre text,
  -- 'join' | 'leave'
  action text not null,
  created_at timestamptz not null default now()
);

create index if not exists telegram_channel_events_fecha_idx
  on public.telegram_channel_events (chat_id, created_at desc);

-- Para cruzar quién del canal acabó siendo Premium.
create index if not exists telegram_channel_events_usuario_idx
  on public.telegram_channel_events (telegram_user_id);

alter table public.telegram_channel_events enable row level security;
-- Sin políticas: solo el backend (service_role) entra aquí.

-- Foto diaria del total de miembros. Los eventos solos no bastan: si el bot
-- está caído un rato, o alguien entró antes de montar esto, el recuento por
-- eventos se desviaría. La foto diaria es la fuente de verdad de la curva.
create table if not exists public.telegram_channel_stats (
  id bigserial primary key,
  chat_id text not null,
  fecha date not null,
  miembros integer not null,
  created_at timestamptz not null default now(),
  unique (chat_id, fecha)
);

create index if not exists telegram_channel_stats_fecha_idx
  on public.telegram_channel_stats (chat_id, fecha desc);

alter table public.telegram_channel_stats enable row level security;
