-- Ejecutar en Supabase SQL Editor para deshacer los cambios

ALTER TABLE public.watchlist 
DROP COLUMN IF EXISTS alert_above,
DROP COLUMN IF EXISTS alert_below;
