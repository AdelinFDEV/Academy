-- ⚠️  El nombre es histórico. La rutina diaria del admin se retiró el 06-09-2026
--     y su tabla `rutina_diaria` se borró el 03-10-2026; su `create table` se
--     quitó de aquí para que relanzar el archivo no la resucite. Lo que queda
--     crea `bot_ajustes` (el interruptor de /stop y /arrancar) y
--     `noticia_votos`, que siguen vivas.

-- Interruptor de avisos del bot + votos de las noticias.
--
-- Ejecutar en Supabase → SQL Editor. Es idempotente: se puede lanzar dos
-- veces sin romper nada.
--
-- Las tablas son de USO EXCLUSIVO DEL BOT: solo las toca el servidor con
-- la service_role key. Por eso llevan RLS activado y CERO políticas — así
-- ningún cliente con la clave pública puede leerlas ni escribirlas, ni
-- siquiera un usuario autenticado. Es justo lo que hace falta aquí: el estado
-- del interruptor no es asunto de nadie más.

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
