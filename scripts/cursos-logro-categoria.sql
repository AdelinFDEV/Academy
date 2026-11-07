-- Curso de psicología del trading (08-11-2026): aviso legal «formacion»
-- y retirada de la categoría de logro «Temple».
-- Ejecutar entero en el SQL Editor de Supabase. Se puede lanzar más de una vez.
--

-- La categoría propia de logro («Temple») se retiró el 08-11-2026: los logros
-- de todos los cursos van juntos en «Cursos». Se borra la columna.
alter table public.cursos drop constraint if exists cursos_logro_categoria_check;
alter table public.cursos drop column if exists logro_categoria;

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
