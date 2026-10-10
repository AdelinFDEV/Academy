-- ⚠️  El nombre es histórico. La rutina diaria del admin se retiró el 06-09-2026
--     y su tabla `rutina_diaria` se borró el 03-10-2026; su `create table` se
--     quitó de aquí para que relanzar el archivo no la resucite. Lo que queda
--     crea `bot_ajustes` (el interruptor de /stop y /arrancar). Las noticias y
--     sus votos se retiraron el 10-10-2026 y su bloque se quitó por lo mismo.

-- Interruptor de avisos del bot.
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
