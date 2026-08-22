-- ============================================================================
--  COMUNIDAD PREMIUM EN TELEGRAM  —  ejecutar en Supabase SQL Editor
-- ----------------------------------------------------------------------------
--  Vincula la cuenta de la Academy con la cuenta de Telegram del usuario para
--  que un bot pueda aprobar/rechazar solicitudes de entrada al canal privado
--  y expulsar automáticamente a quien deje de ser Premium.
--
--  El vínculo (profiles.telegram_user_id) sólo lo escribe el backend con
--  service_role, nunca el cliente: si un usuario pudiera auto-asignarse un
--  telegram_user_id ajeno, podría colarse en el canal de otra persona.
-- ============================================================================

-- 1. Vínculo Telegram en profiles ---------------------------------------------
alter table public.profiles
  add column if not exists telegram_user_id  bigint,
  add column if not exists telegram_username text,
  add column if not exists telegram_linked_at timestamptz;

-- Una cuenta de Telegram sólo puede estar vinculada a un usuario de la Academy.
create unique index if not exists profiles_telegram_user_id_idx
  on public.profiles (telegram_user_id)
  where telegram_user_id is not null;

-- Lectura: el nombre de usuario y la fecha de vinculación se pueden mostrar en
-- /cuenta (igual que full_name o premium_since). El id numérico NO se expone:
-- no aporta nada a la UI y es el dato que usa el bot para actuar sobre Telegram.
grant select (telegram_username, telegram_linked_at)
  on public.profiles to authenticated;

-- Nadie escribe estas columnas desde el cliente: las pone el webhook del bot
-- (/api/telegram/webhook) y las quita /api/telegram/unlink, ambos con
-- service_role tras verificar la sesión. No se concede UPDATE a authenticated.

-- El backend con service_role conserva acceso total.
grant all on public.profiles to service_role;

-- 2. Tokens de un solo uso para el enlace de vinculación ----------------------
--    El usuario pulsa "Conectar Telegram" en /cuenta, generamos un token de
--    corta duración y se lo mandamos como deep-link (t.me/bot?start=token).
--    El bot lo recibe en /start y así sabe a qué usuario de Supabase vincular
--    esa cuenta de Telegram, sin pedir contraseñas ni compartir el user id.
create table if not exists public.telegram_link_tokens (
  token      text primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at    timestamptz
);

alter table public.telegram_link_tokens enable row level security;
-- Sin policies: sólo el service_role (que ignora RLS) puede leer/escribir.

-- 3. Auditoría de accesos al canal --------------------------------------------
--    Registro de aprobaciones, rechazos, expulsiones y (des)vinculaciones.
--    Útil para depurar por qué a alguien no le dejó entrar el bot.
create table if not exists public.telegram_access_log (
  id               bigint generated always as identity primary key,
  user_id          uuid references auth.users(id) on delete set null,
  telegram_user_id bigint,
  action           text not null, -- linked | unlinked | approved | declined | kicked
  reason           text,
  created_at       timestamptz not null default now()
);

alter table public.telegram_access_log enable row level security;
-- Sin policies: lectura/escritura sólo vía service_role.
