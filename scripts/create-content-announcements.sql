-- Ejecutar en Supabase SQL Editor
--
-- Avisos automáticos al canal cuando hay guía, entrada o vídeo nuevo.
--
-- Esta tabla es lo que evita que el mismo contenido se anuncie dos veces: el
-- anunciador no lleva la cuenta de "por dónde iba", sino que pregunta si algo
-- ya se anunció. Así da igual cuántas veces se dispare (cron diario, al
-- publicar una entrada, o a mano desde el panel): el aviso sale una sola vez.

create table if not exists public.content_announcements (
  id bigserial primary key,
  -- 'guia' | 'entrada' | 'video'
  kind text not null,
  -- Identificador estable dentro de su tipo: slug de la guía o la entrada,
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

-- Lo mismo con las entradas ya publicadas. Las entradas y los vídeos tienen
-- además una ventana de recencia en el código (solo se anuncia lo de los
-- últimos días), pero sembrar aquí lo deja atado del todo.
insert into public.content_announcements (kind, ref)
select 'entrada', slug from public.posts where published = true
on conflict (kind, ref) do nothing;
