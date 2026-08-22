-- Ejecutar en Supabase SQL Editor
--
-- Chat directo usuario ↔ admin a través del bot.

-- Mapea el mensaje que le llega al admin con el usuario que lo escribió. Es lo
-- que permite que el admin conteste simplemente respondiendo (citando) ese
-- mensaje: del reply sacamos el message_id y de aquí a quién hay que enviárselo.
create table if not exists public.telegram_support_threads (
  id bigserial primary key,
  admin_message_id bigint not null unique,
  user_id uuid references public.profiles(id) on delete set null,
  telegram_user_id bigint not null,
  created_at timestamptz not null default now()
);

-- Para el corte antiflood: cuenta mensajes de un usuario en la última hora.
create index if not exists telegram_support_threads_usuario_idx
  on public.telegram_support_threads (telegram_user_id, created_at desc);

alter table public.telegram_support_threads enable row level security;
-- Sin políticas a propósito: RLS activo y ninguna política = nadie entra
-- salvo service_role, que se la salta. Igual que el resto de tablas del bot.

-- Idempotencia de los updates de Telegram. Telegram reintenta el mismo update
-- si tardamos en responder o si algo falla, y sin esto un reintento reenviaría
-- el mensaje al admin por duplicado. Mismo patrón que la tabla stripe_events.
create table if not exists public.telegram_events (
  update_id bigint primary key,
  created_at timestamptz not null default now()
);

alter table public.telegram_events enable row level security;

-- Esta tabla solo crece, así que conviene podarla de vez en cuando. Una semana
-- sobra: los reintentos de Telegram se agotan en cuestión de minutos.
create index if not exists telegram_events_created_idx
  on public.telegram_events (created_at);
