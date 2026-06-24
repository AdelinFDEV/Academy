-- Ejecutar en Supabase SQL Editor
-- Fix 1: FK de comments.user_id → public.profiles
-- Permite que PostgREST resuelva el join comments → profiles
ALTER TABLE public.comments
  ADD CONSTRAINT comments_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Fix 2: Política de lectura pública en profiles
-- Necesaria para mostrar el nombre del autor en comentarios
-- y para que el panel admin pueda contar usuarios
CREATE POLICY "Profiles son de lectura pública"
  ON public.profiles FOR SELECT
  USING (true);
