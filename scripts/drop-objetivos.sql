-- 13-11-2026 · Se retira /admin/objetivos entero (decisión del admin).
-- Borra las 12 tablas que solo usaba esa sección. Idempotente: se puede
-- lanzar entero y más de una vez. Ninguna otra tabla ni función depende de
-- ellas (comprobado en Supabase el 13-11-2026).
--
-- El bucket privado `diario` (fotos del diario del negocio, vacío) se borra
-- a mano desde Storage: Supabase no deja borrar buckets con SQL.

drop table if exists public.objetivo_registros cascade;
drop table if exists public.objetivo_marcas cascade;
drop table if exists public.diario_notas cascade;
drop table if exists public.objetivos cascade;
drop table if exists public.contenido_plan cascade;
drop table if exists public.ideas cascade;
drop table if exists public.diario_intenciones cascade;
drop table if exists public.metricas_diarias cascade;
drop table if exists public.dias_balance cascade;
drop table if exists public.ingresos_dia cascade;
drop table if exists public.gastos cascade;
drop table if exists public.movimientos cascade;
