-- Cursos para alumnos Premium: contenido, progreso, exámenes y certificados.
--
-- ── Todo el contenido vive aquí, no en el código ──────────────────────────
--
-- Decisión del admin (06-10-2026): un curso son FILAS, como una entrada, y la
-- web solo tiene plantillas genéricas. Veinte cursos no añaden una línea de
-- código. No hay editor en /admin: las filas se insertan por SQL, y cada curso
-- se guarda además como script en `scripts/cursos/` para que tenga historial.
-- Cómo se escribe un curso: CURSOS.md, en la raíz del proyecto.
--
-- ── Dos clases de tabla ────────────────────────────────────────────────────
--
--  · CONTENIDO (cursos, módulos, lecciones, preguntas): lo escribe solo el
--    admin, por SQL. Ninguna tiene policy de escritura.
--  · ALUMNO (inscripciones, progreso, intentos, certificados): cada uno lee lo
--    suyo, y TAMPOCO tienen policy de escritura. Escribe la API con la clave
--    de servicio, porque es ella la que comprueba que es Premium, que el
--    módulo está desbloqueado y cuál es la nota. Si el navegador pudiera
--    insertar en `curso_intentos`, cualquiera se pondría un 10 desde la consola.
--
-- ── Las respuestas correctas no salen nunca ───────────────────────────────
--
-- `curso_preguntas` tiene RLS activado y NINGUNA policy: con la clave anónima
-- no devuelve ni una fila. Solo la lee el servidor, con la clave de servicio,
-- y al alumno le manda el enunciado y las opciones sin la solución.
-- No añadas una policy de lectura a esta tabla «para poder pintar el examen».
--
-- ── Se puede ejecutar más de una vez ──────────────────────────────────────
--
-- Todo va con `if not exists` / `drop policy if exists`, así que repetirlo no
-- rompe nada ni borra datos.

-- ════════════════════════════════════════════════════════════════════════
-- CONTENIDO
-- ════════════════════════════════════════════════════════════════════════

create table if not exists public.cursos (
  id           uuid primary key default gen_random_uuid(),
  -- La URL: /cursos/<slug>. No se cambia una vez publicado: es la clave del
  -- logro de todos los que lo aprobaron.
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  titulo       text not null,
  -- Una frase, para la tarjeta del catálogo.
  subtitulo    text,
  -- El párrafo que vende el curso en su ficha pública.
  descripcion  text,
  -- Lo que sabrá hacer el alumno al terminar: un array de frases cortas.
  objetivos    jsonb not null default '[]'::jsonb
                 check (jsonb_typeof(objetivos) = 'array'),
  nivel        text not null default 'básico'
                 check (nivel in ('básico', 'intermedio', 'avanzado')),
  portada      text,
  color        text not null default '#e6b455',
  -- Qué descargo de responsabilidad lleva: una variante de DisclaimerRiesgo.tsx.
  aviso        text not null default 'general'
                 check (aviso in ('general', 'fiscal', 'portfolio', 'directo', 'diario')),
  -- El nombre del logro que se gana al aprobar el examen final.
  logro        text not null,
  -- Cuántas preguntas salen en el examen final (del banco con modulo_id NULL).
  preguntas_final integer not null default 20 check (preguntas_final > 0),
  -- Fecha de la última revisión del contenido. En un curso fiscal es lo que
  -- dice al alumno si sigue vigente; se enseña en la ficha y en cada lección.
  revisado     date,
  -- Posición en el catálogo, de menor a mayor.
  orden        integer not null default 0,
  -- Lo único que separa un borrador de un curso visible.
  published    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.curso_modulos (
  id           uuid primary key default gen_random_uuid(),
  curso_id     uuid not null references public.cursos (id) on delete cascade,
  orden        integer not null,
  titulo       text not null,
  descripcion  text,
  -- Nota mínima del examen del módulo para desbloquear el siguiente (0-10).
  nota_minima  numeric(4, 2) not null default 5
                 check (nota_minima between 0 and 10),
  -- Cuántas preguntas salen en cada intento, sacadas al azar de su banco.
  preguntas_examen integer not null default 10 check (preguntas_examen > 0),
  unique (curso_id, orden)
);

create table if not exists public.curso_lecciones (
  id           uuid primary key default gen_random_uuid(),
  modulo_id    uuid not null references public.curso_modulos (id) on delete cascade,
  orden        integer not null,
  -- Único en toda la tabla: la URL es /aula/<curso>/<leccion>.
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  titulo       text not null,
  -- Una frase para el temario: qué te llevas de esta lección.
  resumen      text,
  -- HTML, con el vocabulario `.prose-*` de las entradas más los bloques
  -- interactivos del aula (`<div data-bloque="…">`). Ver CURSOS.md.
  contenido    text not null default '',
  -- Lo que se tarda en hacerla. De aquí salen el cronograma y el «te quedan».
  minutos      integer not null check (minutos > 0),
  unique (modulo_id, orden)
);

create table if not exists public.curso_preguntas (
  id           uuid primary key default gen_random_uuid(),
  curso_id     uuid not null references public.cursos (id) on delete cascade,
  -- NULL = pregunta del examen FINAL. Con valor, del examen de ese módulo.
  modulo_id    uuid references public.curso_modulos (id) on delete cascade,
  -- La lección que explica la respuesta: es la que se recomienda repasar a
  -- quien falla la pregunta.
  leccion_id   uuid references public.curso_lecciones (id) on delete set null,
  enunciado    text not null,
  -- Array de textos. Cada fallo resta 1 / (opciones − 1) de acierto, así que
  -- contestar al azar da de media un 0 sea cual sea el número de opciones.
  opciones     jsonb not null
                 check (jsonb_typeof(opciones) = 'array' and jsonb_array_length(opciones) >= 2),
  -- Índice (desde 0) de la opción correcta dentro de `opciones`.
  correcta     smallint not null check (correcta >= 0),
  -- Se enseña al corregir un examen aprobado: por qué la buena es la buena.
  explicacion  text,
  check (correcta < jsonb_array_length(opciones))
);

create index if not exists curso_modulos_curso_idx    on public.curso_modulos (curso_id, orden);
create index if not exists curso_lecciones_modulo_idx on public.curso_lecciones (modulo_id, orden);
create index if not exists curso_preguntas_examen_idx on public.curso_preguntas (curso_id, modulo_id);

-- ════════════════════════════════════════════════════════════════════════
-- ALUMNO
-- ════════════════════════════════════════════════════════════════════════

create table if not exists public.curso_inscripciones (
  user_id         uuid not null references auth.users (id) on delete cascade,
  curso_id        uuid not null references public.cursos (id) on delete cascade,
  -- El ritmo que elige el alumno: cada uno va a su aire. Con esto y los
  -- `minutos` de cada lección se calcula su cronograma. Se puede cambiar.
  minutos_semana  integer not null check (minutos_semana between 30 and 1200),
  -- El día que empezó: el origen del cronograma.
  created_at      timestamptz not null default now(),
  primary key (user_id, curso_id)
);

create table if not exists public.curso_progreso (
  user_id       uuid not null references auth.users (id) on delete cascade,
  leccion_id    uuid not null references public.curso_lecciones (id) on delete cascade,
  completada_at timestamptz not null default now(),
  primary key (user_id, leccion_id)
);

-- Un intento nace ABIERTO al entrar al examen, con sus preguntas ya sorteadas,
-- y se cierra al entregarlo. Guardar las preguntas evita dos trampas:
--   · recargar la página hasta que salgan las fáciles (mientras haya uno
--     abierto, se devuelve ese, con las mismas preguntas);
--   · contestar preguntas que no le tocaron (solo se corrigen las sorteadas).
create table if not exists public.curso_intentos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  curso_id     uuid not null references public.cursos (id) on delete cascade,
  -- NULL = intento del examen final.
  modulo_id    uuid references public.curso_modulos (id) on delete cascade,
  -- Las preguntas sorteadas, en el orden en que se enseñan.
  preguntas    uuid[] not null,
  estado       text not null default 'abierto' check (estado in ('abierto', 'entregado')),
  -- Lo que sigue se rellena al entregar, y lo calcula SIEMPRE el servidor.
  nota         numeric(4, 2) check (nota between 0 and 10),
  aciertos     integer check (aciertos >= 0),
  fallos       integer check (fallos >= 0),
  aprobado     boolean,
  -- { "<pregunta_id>": <opción elegida> }
  respuestas   jsonb,
  created_at   timestamptz not null default now(),
  entregado_at timestamptz,
  check (estado = 'abierto' or (nota is not null and aprobado is not null and respuestas is not null))
);

create index if not exists curso_intentos_alumno_idx
  on public.curso_intentos (user_id, curso_id, created_at desc);

-- Como mucho UN intento abierto por examen y alumno. El final tiene
-- modulo_id NULL, y en un índice único dos NULL no chocan: por eso el coalesce.
create unique index if not exists curso_intentos_un_abierto_idx
  on public.curso_intentos (user_id, curso_id, coalesce(modulo_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where estado = 'abierto';

-- El certificado. Es también lo que concede el LOGRO del curso: el logro no
-- va a `user_badges`, cuya policy deja insertar a cualquier usuario desde el
-- navegador. Esta tabla solo la escribe el servidor al aprobar el final.
create table if not exists public.curso_certificados (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  curso_id    uuid not null references public.cursos (id) on delete cascade,
  -- 40 % la media de los módulos + 60 % el examen final (decisión del admin).
  nota_final  numeric(4, 2) not null check (nota_final between 0 and 10),
  nota_modulos numeric(4, 2) not null check (nota_modulos between 0 and 10),
  nota_examen numeric(4, 2) not null check (nota_examen between 0 and 10),
  -- El nombre tal como estaba al aprobar: el certificado no cambia si
  -- después se edita el perfil.
  nombre      text not null,
  -- Código corto y público para verificar el certificado.
  codigo      text not null unique,
  created_at  timestamptz not null default now(),
  unique (user_id, curso_id)
);

-- ════════════════════════════════════════════════════════════════════════
-- RLS
-- ════════════════════════════════════════════════════════════════════════

alter table public.cursos              enable row level security;
alter table public.curso_modulos       enable row level security;
alter table public.curso_lecciones     enable row level security;
alter table public.curso_preguntas     enable row level security;
alter table public.curso_inscripciones enable row level security;
alter table public.curso_progreso      enable row level security;
alter table public.curso_intentos      enable row level security;
alter table public.curso_certificados  enable row level security;

-- El catálogo y el temario son públicos: es lo que vende el curso, y lo que
-- Google tiene que poder leer. Solo de cursos publicados.
drop policy if exists "Cursos publicados son públicos" on public.cursos;
create policy "Cursos publicados son públicos"
  on public.cursos for select
  using (published = true);

drop policy if exists "Módulos de cursos publicados son públicos" on public.curso_modulos;
create policy "Módulos de cursos publicados son públicos"
  on public.curso_modulos for select
  using (exists (
    select 1 from public.cursos c
    where c.id = curso_modulos.curso_id and c.published = true
  ));

-- El texto de las lecciones es de pago. El temario público (títulos y
-- minutos) lo lee el servidor con la clave de servicio SIN pedir `contenido`,
-- igual que los listados de entradas — ver `createAdminClientOpcional()`.
-- El aula también lee con la clave de servicio, porque además del Premium
-- comprueba que el módulo esté desbloqueado, y eso RLS no lo sabe.
drop policy if exists "Premium lee las lecciones" on public.curso_lecciones;
create policy "Premium lee las lecciones"
  on public.curso_lecciones for select
  using (
    exists (
      select 1 from public.curso_modulos m
      join public.cursos c on c.id = m.curso_id
      where m.id = curso_lecciones.modulo_id and c.published = true
    )
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('premium', 'admin')
    )
  );

-- curso_preguntas: SIN policies, a propósito. Ver la cabecera.

drop policy if exists "Cada alumno lee sus inscripciones" on public.curso_inscripciones;
create policy "Cada alumno lee sus inscripciones"
  on public.curso_inscripciones for select
  using (user_id = auth.uid());

drop policy if exists "Cada alumno lee su progreso" on public.curso_progreso;
create policy "Cada alumno lee su progreso"
  on public.curso_progreso for select
  using (user_id = auth.uid());

drop policy if exists "Cada alumno lee sus intentos" on public.curso_intentos;
create policy "Cada alumno lee sus intentos"
  on public.curso_intentos for select
  using (user_id = auth.uid());

drop policy if exists "Cada alumno lee sus certificados" on public.curso_certificados;
create policy "Cada alumno lee sus certificados"
  on public.curso_certificados for select
  using (user_id = auth.uid());

-- ════════════════════════════════════════════════════════════════════════
-- COLUMNAS AÑADIDAS DESPUÉS
-- ════════════════════════════════════════════════════════════════════════
--
-- `create table if not exists` no toca una tabla que ya existe, así que una
-- columna nueva NO llega a quien ejecutó una versión anterior de este script.
-- Cada columna que se añada a partir de ahora va también aquí, con
-- `add column if not exists`, para que volver a ejecutarlo la ponga.

-- 06-10-2026: el descargo de responsabilidad de cada curso.
alter table public.cursos
  add column if not exists aviso text not null default 'general'
    check (aviso in ('general', 'fiscal', 'portfolio', 'directo', 'diario'));

-- 06-10-2026: `updated_at` se mueve solo al editar un curso, o al editar uno de
-- sus módulos o lecciones. Es la fecha que lleva la ficha en el sitemap
-- (`lastModified`), y una fecha que no se mueve le diría a Google que nada
-- cambió. Sin trigger habría que acordarse de tocarla a mano en cada UPDATE.
create or replace function public.cursos_tocar_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists cursos_updated_at on public.cursos;
create trigger cursos_updated_at
  before update on public.cursos
  for each row execute function public.cursos_tocar_updated_at();

create or replace function public.cursos_tocar_desde_hijo()
returns trigger language plpgsql as $$
declare
  v_curso uuid;
begin
  if tg_table_name = 'curso_modulos' then
    v_curso := coalesce(new.curso_id, old.curso_id);
  else
    select m.curso_id into v_curso from public.curso_modulos m
    where m.id = coalesce(new.modulo_id, old.modulo_id);
  end if;
  update public.cursos set updated_at = now() where id = v_curso;
  return null;
end $$;

drop trigger if exists curso_modulos_toca_curso on public.curso_modulos;
create trigger curso_modulos_toca_curso
  after insert or update or delete on public.curso_modulos
  for each row execute function public.cursos_tocar_desde_hijo();

drop trigger if exists curso_lecciones_toca_curso on public.curso_lecciones;
create trigger curso_lecciones_toca_curso
  after insert or update or delete on public.curso_lecciones
  for each row execute function public.cursos_tocar_desde_hijo();

-- 06-10-2026: cada pregunta lleva una CLAVE estable ("m1-01", "final-07") que
-- pone quien escribe el curso. Es lo que deja al script de subida
-- (`scripts/subir-curso.mjs`) actualizar una pregunta corregida en vez de
-- borrarla y crear otra: los intentos guardan los id de sus preguntas, y un
-- id que desaparece deja la corrección de ese intento a medias.
alter table public.curso_preguntas add column if not exists clave text;
create unique index if not exists curso_preguntas_clave_idx
  on public.curso_preguntas (curso_id, clave);
