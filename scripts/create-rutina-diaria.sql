-- Rutina diaria del admin + interruptor de avisos del bot.
--
-- Ejecutar en Supabase → SQL Editor. Es idempotente: se puede lanzar dos
-- veces sin romper nada.
--
-- Las dos tablas son de USO EXCLUSIVO DEL BOT: solo las toca el servidor con
-- la service_role key. Por eso llevan RLS activado y CERO políticas — así
-- ningún cliente con la clave pública puede leerlas ni escribirlas, ni
-- siquiera un usuario autenticado. Es justo lo que hace falta aquí: la rutina
-- del admin y el estado del interruptor no son asunto de nadie más.

-- ── 1. La rutina de cada día ────────────────────────────────────────────────
--
-- Una fila por día. `fecha` es la fecha EN RUMANÍA (no en UTC): es la que
-- vale, porque el mensaje sale a las 6:00 de la mañana de allí.
create table if not exists public.rutina_diaria (
  fecha         date primary key,
  -- A qué chat se mandó. Sirve para dos cosas: reescribir el mensaje al
  -- marcar una tarea, y comprobar que quien pulsa un botón es el dueño de esa
  -- rutina y no otra persona con el mismo id de mensaje.
  chat_id       bigint not null,
  message_id    bigint,
  youtube       boolean not null default false,
  entreno       boolean not null default false,
  trading       boolean not null default false,
  enviada_en    timestamptz not null default now(),
  completada_en timestamptz
);

alter table public.rutina_diaria enable row level security;

-- ── 2. Ajustes del bot (el botón de STOP) ───────────────────────────────────
--
-- Tabla clave/valor a propósito: hoy solo guarda si los avisos están pausados,
-- pero el día que haga falta otro interruptor no hay que migrar nada.
create table if not exists public.bot_ajustes (
  clave          text primary key,
  valor          text not null,
  actualizado_en timestamptz not null default now()
);

alter table public.bot_ajustes enable row level security;

-- Estado inicial: avisos encendidos. Si la fila no existe el código también
-- asume "encendido", así que esto es solo para que se vea en la tabla.
insert into public.bot_ajustes (clave, valor)
values ('avisos_pausados', '0')
on conflict (clave) do nothing;

-- ── 4. Noticias: resumen propio y votación toro/oso ─────────────────────────
--
-- resumen_ia guarda el texto que redacta Claude a partir del artículo. Se
-- genera al PROPONER la noticia, no al publicarla, para que el admin lea
-- exactamente lo que va a salir antes de decidir.
--
-- mensaje_canal_id y canal_chat_id hacen falta para repintar el marcador de
-- votos sobre el mensaje ya publicado.
alter table public.noticias add column if not exists resumen_ia text;
alter table public.noticias add column if not exists mensaje_canal_id bigint;
alter table public.noticias add column if not exists canal_chat_id text;

-- Un voto por persona y noticia: la clave primaria compuesta lo garantiza, y
-- permite cambiar de opinión (un upsert sobre la misma fila).
create table if not exists public.noticia_votos (
  noticia_id       bigint not null references public.noticias(id) on delete cascade,
  telegram_user_id bigint not null,
  voto             text not null check (voto in ('toro', 'oso')),
  created_at       timestamptz not null default now(),
  primary key (noticia_id, telegram_user_id)
);

alter table public.noticia_votos enable row level security;

create index if not exists noticia_votos_noticia_idx on public.noticia_votos (noticia_id);
