-- Ejecutar en Supabase SQL Editor
-- ============================================================================
--  ANTI-SPAM DE COMPARTIDOS  —  un compartido cuenta como máximo una vez por
--  usuario (guide_shares; hasta el 10-10-2026 también post_shares).
--
--  Problema que cierra: /api/guide-shares permitía inflar el
--  contador de compartidos sin límite y SIN necesidad de estar registrado
--  (un bot anónimo podía subir shares_count a cualquier número). A partir de
--  aquí el contador cuenta USUARIOS DISTINTOS que han compartido: con la
--  restricción unique, un mismo usuario no suma más de una vez, y la API exige
--  sesión para contar (los anónimos pueden compartir pero no incrementan).
--
--  Es idempotente: se puede correr varias veces sin problema.
-- ============================================================================

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
