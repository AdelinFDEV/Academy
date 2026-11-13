-- ════════════════════════════════════════════════════════════════════════════
-- 13-11-2026 · Diario de Trading: capturas de antes y después de cada operación
-- ════════════════════════════════════════════════════════════════════════════
--
-- Cada operación puede llevar dos imágenes: el gráfico antes de entrar y
-- después de cerrar. Son opcionales.
--
--   · En `trades`, dos columnas que guardan CUÁNDO se subió cada una (null = no
--     hay). Sirven para saber si existe y para refrescar la imagen al cambiarla.
--   · Las imágenes van al bucket PRIVADO `diario-capturas`, ya recodificadas a
--     WebP por el servidor. El bucket va SIN policies: solo entra la clave de
--     servicio, desde `/api/trades/captura`. NO AÑADAS UNA POLICY A
--     `storage.objects` PARA ESTE BUCKET.
--
-- Idempotente: se puede lanzar entero y más de una vez.

alter table public.trades
  add column if not exists captura_antes   timestamptz,
  add column if not exists captura_despues timestamptz;

-- El peso y el tipo se limitan también aquí, por si fallara el servidor:
-- solo WebP ya recodificado, 2 MB como mucho.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('diario-capturas', 'diario-capturas', false, 2097152, array['image/webp'])
on conflict (id) do update
set public             = excluded.public,
    file_size_limit    = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
