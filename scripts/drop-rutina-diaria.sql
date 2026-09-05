-- Retira la tabla de la rutina diaria del admin.
--
-- La rutina —el mensaje de las 21:00 con el resumen de la comunidad y las tres
-- tareas del día— se eliminó de la web y del bot el 06-09-2026 a petición del
-- admin. El código ya no la escribe ni la lee, así que la tabla se queda con el
-- histórico congelado y sin nadie que lo mire.
--
-- ⚠️  ESTO BORRA DATOS Y NO SE PUEDE DESHACER. Solo el histórico de qué días se
--     marcaron las tareas; no toca perfiles, suscripciones ni nada del negocio.
--     Si prefieres conservarlo, NO ejecutes este archivo: una tabla parada no
--     molesta ni consume cuota apreciable.
--
-- Antes de ejecutarlo, si quieres guardarte una copia:
--   select * from public.rutina_diaria order by fecha;
--   (y exportar el resultado a CSV desde el panel de Supabase)
--
-- NO toca `bot_ajustes`: ahí vive el interruptor de /stop y /arrancar, que
-- sigue en uso.

drop table if exists public.rutina_diaria;
