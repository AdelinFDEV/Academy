-- Curso de psicología del trading (08-11-2026): logros de curso con categoría
-- propia (la primera, «Temple») y el aviso legal «formacion».
-- Ejecutar entero en el SQL Editor de Supabase. Se puede lanzar más de una vez.
--
-- Sin valor, el logro del curso sale en «Cursos», como hasta ahora. Con valor,
-- en su propia categoría de /dashboard/logros. La lista válida vive en
-- CATEGORIAS_LOGRO_CURSO (src/lib/logros.tsx) y en scripts/subir-curso.mjs.

alter table public.cursos add column if not exists logro_categoria text;

alter table public.cursos drop constraint if exists cursos_logro_categoria_check;
alter table public.cursos add constraint cursos_logro_categoria_check
  check (logro_categoria is null or logro_categoria in ('temple'));

-- El aviso «formacion» de DisclaimerRiesgo.tsx (cursos de trading no fiscales).
-- La restricción antigua se creó sin nombre propio: se borra la que mire «aviso».
do $$
declare r record;
begin
  for r in
    select conname from pg_constraint
    where conrelid = 'public.cursos'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%aviso%'
  loop
    execute format('alter table public.cursos drop constraint %I', r.conname);
  end loop;
end $$;
alter table public.cursos add constraint cursos_aviso_check
  check (aviso in ('general', 'fiscal', 'portfolio', 'directo', 'diario', 'formacion'));
