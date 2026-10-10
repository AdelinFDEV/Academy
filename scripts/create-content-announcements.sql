-- Ejecutar en Supabase SQL Editor
--
-- Avisos automáticos al canal cuando hay guía o vídeo nuevo.
--
-- Esta tabla es lo que evita que el mismo contenido se anuncie dos veces: el
-- anunciador no lleva la cuenta de "por dónde iba", sino que pregunta si algo
-- ya se anunció. Así da igual cuántas veces se dispare (cron diario o a mano
-- desde el panel): el aviso sale una sola vez.

create table if not exists public.content_announcements (
  id bigserial primary key,
  -- 'guia' | 'video' (hasta el 10-10-2026 también 'entrada')
  kind text not null,
  -- Identificador estable dentro de su tipo: slug de la guía,
  -- id del vídeo de YouTube.
  ref text not null,
  announced_at timestamptz not null default now(),
  unique (kind, ref)
);

alter table public.content_announcements enable row level security;
-- Sin políticas: solo el backend (service_role) escribe y lee aquí.

-- ── Semilla ──────────────────────────────────────────────────────────────────
-- Sin esto, la primera ejecución anunciaría DE GOLPE las 7 guías que ya
-- existen. Se marcan como ya anunciadas para que solo salgan las próximas.
insert into public.content_announcements (kind, ref) values
  ('guia', 'que-es-la-blockchain'),
  ('guia', 'ciclos-de-bitcoin'),
  ('guia', 'worldcoin'),
  ('guia', 'render'),
  ('guia', 'hyperliquid'),
  ('guia', 'xrp'),
  ('guia', 'fiscalidad-cripto-espana')
on conflict (kind, ref) do nothing;
