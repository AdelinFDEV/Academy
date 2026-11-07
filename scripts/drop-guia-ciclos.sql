-- Ejecutar en Supabase SQL Editor. Ejecutado por el admin el 07-11-2026.
-- ============================================================================
--  RETIRADA DE LA GUÍA DE CICLOS DE BITCOIN  (07-11-2026)
--
--  La guía «¿Por qué ahora es el momento de comprar Bitcoin?»
--  (`ciclos-de-bitcoin`, badge «Cazador de Ciclos») se retiró de la web por
--  decisión del admin: su URL responde 410 (src/lib/retiradas.ts). Esto borra
--  lo que dejó en la base de datos. Antes de ejecutarlo solo había 26 visitas;
--  nadie la había guardado, ni hecho su quiz, ni tenía su badge.
--
--  Idempotente: se puede ejecutar entero más de una vez.
-- ============================================================================

delete from public.guide_visits where guide_slug = 'ciclos-de-bitcoin';
delete from public.guide_saves where guide_slug = 'ciclos-de-bitcoin';
delete from public.guide_likes where guide_slug = 'ciclos-de-bitcoin';
delete from public.guide_shares where guide_slug = 'ciclos-de-bitcoin';
delete from public.guide_quiz_completions where guide_slug = 'ciclos-de-bitcoin';
delete from public.user_badges where badge_id = 'guide-ciclos-bitcoin';
