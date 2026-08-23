-- Ejecutar en Supabase SQL Editor
--
-- Embudo de noticias: el bot las propone por privado y el admin decide.

create table if not exists public.noticias (
  id bigserial primary key,
  fuente text not null,
  titulo text not null,
  resumen text,
  imagen text,
  -- Único: es lo que impide proponer dos veces la misma noticia, sin tener
  -- que llevar la cuenta de por dónde iba la última lectura del feed.
  enlace text not null unique,
  publicada_en timestamptz,
  -- 'pendiente' | 'publicada' | 'descartada'
  estado text not null default 'pendiente',
  -- Mensaje que se le envió al admin, para poder reescribirlo cuando decida
  -- y que no se quede con los botones puestos para siempre.
  mensaje_admin_id bigint,
  decidida_en timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists noticias_estado_idx on public.noticias (estado, created_at desc);

alter table public.noticias enable row level security;
-- Sin políticas: solo el backend (service_role) entra aquí.
