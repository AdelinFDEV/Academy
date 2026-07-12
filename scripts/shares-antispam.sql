-- Ejecutar en Supabase SQL Editor
-- ============================================================================
--  ANTI-SPAM DE COMPARTIDOS  —  un compartido cuenta como máximo una vez por
--  usuario (post_shares y guide_shares).
--
--  Problema que cierra: /api/shares y /api/guide-shares permitían inflar el
--  contador de compartidos sin límite y SIN necesidad de estar registrado
--  (un bot anónimo podía subir shares_count a cualquier número). A partir de
--  aquí el contador cuenta USUARIOS DISTINTOS que han compartido: con la
--  restricción unique, un mismo usuario no suma más de una vez, y la API exige
--  sesión para contar (los anónimos pueden compartir pero no incrementan).
--
--  Es idempotente: se puede correr varias veces sin problema.
-- ============================================================================

-- ── post_shares ─────────────────────────────────────────────────────────────
-- 1. Elimina duplicados previos de (user_id, post_id) dejando una sola fila.
--    Las filas anónimas (user_id null) se dejan como están (los NULL no chocan
--    con la restricción unique en Postgres).
delete from public.post_shares a
using public.post_shares b
where a.user_id is not null
  and a.user_id = b.user_id
  and a.post_id = b.post_id
  and a.ctid < b.ctid;

-- 2. Restricción unique (idempotente).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'post_shares_user_post_key'
  ) then
    alter table public.post_shares
      add constraint post_shares_user_post_key unique (user_id, post_id);
  end if;
end $$;

-- ── guide_shares ────────────────────────────────────────────────────────────
-- 1. Elimina duplicados previos de (user_id, guide_slug).
delete from public.guide_shares a
using public.guide_shares b
where a.user_id is not null
  and a.user_id = b.user_id
  and a.guide_slug = b.guide_slug
  and a.ctid < b.ctid;

-- 2. Restricción unique (idempotente).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'guide_shares_user_slug_key'
  ) then
    alter table public.guide_shares
      add constraint guide_shares_user_slug_key unique (user_id, guide_slug);
  end if;
end $$;

-- ── Verificación ─────────────────────────────────────────────────────────────
select conname, conrelid::regclass as tabla
from pg_constraint
where conname in ('post_shares_user_post_key', 'guide_shares_user_slug_key');
