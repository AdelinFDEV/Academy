-- Ejecutar en Supabase SQL Editor
--
-- Aviso previo a perder el acceso Premium.
--
-- Guarda PARA QUÉ periodo se avisó, no un simple "ya avisado". Así el aviso
-- es idempotente (el cron corre a diario y no puede repetirlo) y a la vez
-- vuelve a funcionar solo si alguien reactiva y más adelante cancela otra vez:
-- entonces el periodo de fin es otro y no coincide con el guardado.

alter table public.profiles
  add column if not exists cancel_warning_period_end timestamptz;
