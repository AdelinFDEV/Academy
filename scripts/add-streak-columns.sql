-- Ejecutar en Supabase SQL Editor
-- Añade columnas de racha y usuario destacado a profiles

alter table public.profiles
  add column if not exists current_streak  int  default 0  not null,
  add column if not exists max_streak      int  default 0  not null,
  add column if not exists last_seen       date,
  add column if not exists is_featured     boolean default false not null;
