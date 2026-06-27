-- Ejecutar en Supabase SQL Editor
-- Añade campos SEO a la tabla posts

ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS seo_title         text,
ADD COLUMN IF NOT EXISTS meta_description  text,
ADD COLUMN IF NOT EXISTS focus_keyword     text;
