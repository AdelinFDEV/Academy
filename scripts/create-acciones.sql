-- ════════════════════════════════════════════════════════════════════════════
-- 13-11-2026 · /admin/acciones — publicar guías y cursos desde el panel
-- ════════════════════════════════════════════════════════════════════════════
--
-- Idempotente: se puede lanzar entero y más de una vez.

-- Las guías que el admin ha publicado desde el panel. Una guía nueva vive en el
-- código como borrador (`BORRADORES`, src/lib/guides.ts) y solo es pública si su
-- slug está aquí. Borrar la fila la devuelve a borrador.
--
-- Solo escribe y lee el servidor, con la clave de servicio: RLS activado, cero
-- policies y nada concedido a `anon` ni a `authenticated`.
create table if not exists public.guias_publicadas (
  slug      text primary key check (char_length(slug) between 1 and 120),
  publicada timestamptz not null default now()
);

alter table public.guias_publicadas enable row level security;
revoke all on public.guias_publicadas from anon, authenticated;

-- Todos los cursos con lo que hace falta para decidir si se pueden publicar:
-- cuántas lecciones tienen y cuántas siguen vacías, y sus preguntas. Se cuenta
-- aquí y no en el servidor para no traer el texto de las lecciones.
create or replace function public.acciones_cursos()
returns jsonb
language sql
stable
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'slug', c.slug,
    'titulo', c.titulo,
    'descripcion', c.descripcion,
    'published', c.published,
    'updated_at', c.updated_at,
    'modulos',   (select count(*) from public.curso_modulos m where m.curso_id = c.id),
    'lecciones', (select count(*) from public.curso_lecciones l join public.curso_modulos m on m.id = l.modulo_id where m.curso_id = c.id),
    'vacias',    (select count(*) from public.curso_lecciones l join public.curso_modulos m on m.id = l.modulo_id
                  where m.curso_id = c.id and (l.contenido is null or char_length(l.contenido) < 50)),
    'preguntas', (select count(*) from public.curso_preguntas p where p.curso_id = c.id)
  ) order by c.published, c.updated_at desc), '[]'::jsonb)
  from public.cursos c;
$$;

revoke all on function public.acciones_cursos() from public, anon, authenticated;
grant execute on function public.acciones_cursos() to service_role;
