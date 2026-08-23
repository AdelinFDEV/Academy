-- El sistema de bienvenida (privada) del canal gratuito y su cola de
-- reintentos se eliminó del código (bienvenidaCanalFree, bienvenidaPrivadaFree,
-- apuntarBienvenidaPendiente, entregarBienvenidaPendiente). Esta tabla,
-- creada en scripts/create-rutina-diaria.sql, ya no la lee ni la escribe nada.
--
-- Comprobado antes de borrar: ninguna FK apunta a ella, ninguna vista ni
-- función de Postgres la referencia, y el código de la app no hace ninguna
-- consulta a "telegram_bienvenidas_pendientes" (grep sobre todo el repo).
--
-- Ejecutar a mano en el SQL Editor de Supabase.

drop table if exists public.telegram_bienvenidas_pendientes;
