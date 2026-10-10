-- Objetivos, plan de contenido y diario del negocio: /admin/objetivos.
--
-- Ejecutar en Supabase → SQL Editor. Es idempotente: se puede lanzar dos veces
-- sin romper nada.
--
-- ── Solo el admin, y solo desde el servidor ─────────────────────────────────
--
-- Es lo más personal del panel: objetivos, ideas y cómo se siente el admin con
-- su negocio. Las tres tablas llevan RLS activado y CERO políticas, igual que
-- `bot_ajustes`: con la clave anónima —la que va en el navegador de cualquiera—
-- no se puede ni leer ni escribir nada. Todo pasa por el servidor con la clave
-- de servicio, después de comprobar que la sesión es de un admin
-- (`requireAdmin` en la API, el layout de /admin en las páginas).
--
-- NO añadas una política «para que el admin pueda». Es exactamente el error
-- que PLATAFORMA.md describe para `portfolio_positions`.

-- ── 1. Objetivos ────────────────────────────────────────────────────────────
--
-- `metrica` dice de dónde sale el progreso:
--   · manual     → lo apunta el admin en `progreso_manual`
--   · entradas   → entradas publicadas en `posts` dentro del periodo
--   · videos     → vídeos de YouTube que el bot anunció (`content_announcements`)
--   · registros  → cuentas nuevas en `profiles`, sin administradores
--   · premium    → altas Premium (`profiles.premium_since`) dentro del periodo
-- Lo automático se calcula al leer, en src/lib/objetivos.ts: guardar el
-- progreso sería garantizar que algún día no cuadre con los datos.
create table if not exists public.objetivos (
  id               uuid primary key default gen_random_uuid(),
  titulo           text not null check (length(trim(titulo)) > 0),
  metrica          text not null default 'manual'
                     check (metrica in ('manual', 'entradas', 'videos', 'registros', 'premium')),
  meta             numeric(12, 2) not null check (meta > 0),
  progreso_manual  numeric(12, 2) not null default 0 check (progreso_manual >= 0),
  desde            date not null,
  hasta            date not null,
  notas            text,
  archivado        boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (hasta >= desde)
);

alter table public.objetivos enable row level security;

-- ── 2. Plan de contenido ────────────────────────────────────────────────────
--
-- Una fila por pieza: un vídeo, un short, una entrada, una guía o una
-- publicación en Telegram. Sin `fecha` es una idea todavía sin día.
create table if not exists public.contenido_plan (
  id            uuid primary key default gen_random_uuid(),
  fecha         date,
  canal         text not null check (canal in ('youtube', 'web', 'telegram')),
  tipo          text not null
                  check (tipo in ('video', 'short', 'entrada', 'guia', 'publicacion')),
  titulo        text not null check (length(trim(titulo)) > 0),
  estado        text not null default 'idea'
                  check (estado in ('idea', 'guion', 'grabado', 'editado', 'programado', 'publicado')),
  enlace        text,
  notas         text,
  publicado_en  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.contenido_plan enable row level security;

create index if not exists contenido_plan_fecha_idx on public.contenido_plan (fecha);

-- ── 3. Diario del negocio ───────────────────────────────────────────────────
--
-- `animo` va de 1 (muy mal) a 5 (muy bien), y es opcional: es la cifra que se
-- analiza. `emocion` es la palabra que lo matiza (cansado no es lo mismo que
-- frustrado, aunque los dos sean un 2), también opcional; la lista vive en
-- src/lib/objetivos.ts. `ancla` fija la nota arriba: para la visión a un año
-- y el porqué, que conviene releer.
create table if not exists public.diario_notas (
  id           uuid primary key default gen_random_uuid(),
  fecha        date not null default current_date,
  texto        text not null check (length(trim(texto)) > 0),
  animo        smallint check (animo between 1 and 5),
  emocion      text,
  objetivo_id  uuid references public.objetivos (id) on delete set null,
  ancla        boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.diario_notas enable row level security;

create index if not exists diario_notas_fecha_idx on public.diario_notas (fecha desc);

-- Para quien ya creó la tabla antes de que existiera la columna.
alter table public.diario_notas add column if not exists emocion text;

-- ════════════════════════════════════════════════════════════════════════════
-- 05-10-2026 · Objetivos repetibles, historial, +1 y métricas nuevas
-- ════════════════════════════════════════════════════════════════════════════
--
-- Todo idempotente y sin borrar nada: se puede lanzar sobre una base que ya
-- tenga objetivos.

-- ── Repetición ──────────────────────────────────────────────────────────────
--
-- `no`: un solo periodo, de `desde` a `hasta`.
-- `semanal` / `mensual`: se renueva solo cada semana (lunes a domingo) o cada
-- mes natural, desde la semana o el mes de `desde`. `hasta` pasa a ser
-- opcional: vacío = indefinido.
alter table public.objetivos
  add column if not exists repeticion text not null default 'no';

alter table public.objetivos drop constraint if exists objetivos_repeticion_check;
alter table public.objetivos
  add constraint objetivos_repeticion_check check (repeticion in ('no', 'semanal', 'mensual'));

alter table public.objetivos alter column hasta drop not null;

-- Un objetivo de una sola vez sigue necesitando fecha de fin.
alter table public.objetivos drop constraint if exists objetivos_hasta_si_no_repite;
alter table public.objetivos
  add constraint objetivos_hasta_si_no_repite check (repeticion <> 'no' or hasta is not null);

-- ── Métricas nuevas ─────────────────────────────────────────────────────────
--
-- Se cuentan en el periodo:     entradas, videos, registros, premium, ingresos
-- Se leen como nivel alcanzado: miembros_telegram (canal gratuito),
--                               suscriptores_youtube
alter table public.objetivos drop constraint if exists objetivos_metrica_check;
alter table public.objetivos
  add constraint objetivos_metrica_check check (metrica in (
    -- Lista COMPLETA a propósito, también en los bloques antiguos: al volver a
    -- ejecutar el script entero, una lista más corta chocaría con los objetivos
    -- que ya usan métricas nuevas y pararía el script. Al añadir una métrica,
    -- añádela aquí en TODOS los bloques (búscalos por objetivos_metrica_check).
    'manual', 'marca', 'entradas', 'videos', 'shorts', 'registros', 'premium', 'ingresos', 'beneficio',
    'miembros_telegram', 'suscriptores_youtube'
  ));

-- ── Progreso manual por periodo ─────────────────────────────────────────────
--
-- Una fila por objetivo y periodo (`periodo` = primer día). Es lo que permite
-- ver «cumplido 4 de los últimos 6 meses» en un objetivo que apunta el admin:
-- con un único número, cada mes nuevo pisaría el anterior. El botón +1 escribe
-- aquí. Sustituye a `objetivos.progreso_manual`, que se deja por compatibilidad
-- y ya no se lee.
create table if not exists public.objetivo_registros (
  objetivo_id  uuid not null references public.objetivos (id) on delete cascade,
  periodo      date not null,
  valor        numeric(12, 2) not null default 0 check (valor >= 0),
  updated_at   timestamptz not null default now(),
  primary key (objetivo_id, periodo)
);

alter table public.objetivo_registros enable row level security;

-- Lo que ya se hubiera apuntado con el sistema anterior pasa a su periodo.
insert into public.objetivo_registros (objetivo_id, periodo, valor)
select id, desde, progreso_manual
from public.objetivos
where metrica = 'manual' and progreso_manual > 0
on conflict (objetivo_id, periodo) do nothing;

-- ── Fotos diarias de métricas externas ──────────────────────────────────────
--
-- Los suscriptores de YouTube solo se pueden leer «ahora»: sin guardar una
-- foto al día no habría con qué comparar ni historial. La toma el cron de las
-- 04:00 (telegram-sync). Los miembros de Telegram ya tienen la suya en
-- `telegram_channel_stats`.
create table if not exists public.metricas_diarias (
  clave   text not null,
  fecha   date not null,
  valor   numeric(14, 2) not null,
  primary key (clave, fecha)
);

alter table public.metricas_diarias enable row level security;

-- ════════════════════════════════════════════════════════════════════════════
-- 05-10-2026 · Avances personales (gimnasio, salud, hábitos)
-- ════════════════════════════════════════════════════════════════════════════

-- `ambito`: los objetivos del negocio salen en la pestaña Objetivos, el
-- calendario y el resumen del diario; los personales, en «Avances personales»
-- dentro del diario. Mismo motor, distinto sitio.
alter table public.objetivos
  add column if not exists ambito text not null default 'negocio';

alter table public.objetivos drop constraint if exists objetivos_ambito_check;
alter table public.objetivos
  add constraint objetivos_ambito_check check (ambito in ('negocio', 'personal'));

-- `marca`: un valor que se apunta cada vez (80 kg en press banca, 82 kg de
-- peso…) y se quiere llevar a la meta. Puede ser hacia arriba o hacia abajo:
-- si la meta es menor que el punto de partida, el objetivo es bajar.
alter table public.objetivos drop constraint if exists objetivos_metrica_check;
alter table public.objetivos
  add constraint objetivos_metrica_check check (metrica in (
    -- Lista COMPLETA a propósito, también en los bloques antiguos: al volver a
    -- ejecutar el script entero, una lista más corta chocaría con los objetivos
    -- que ya usan métricas nuevas y pararía el script. Al añadir una métrica,
    -- añádela aquí en TODOS los bloques (búscalos por objetivos_metrica_check).
    'manual', 'marca', 'entradas', 'videos', 'shorts', 'registros', 'premium', 'ingresos', 'beneficio',
    'miembros_telegram', 'suscriptores_youtube'
  ));

-- Las marcas apuntadas, una por objetivo y día (apuntar dos veces el mismo
-- día corrige la anterior). Es el historial que se dibuja en la tarjeta.
create table if not exists public.objetivo_marcas (
  objetivo_id  uuid not null references public.objetivos (id) on delete cascade,
  fecha        date not null,
  valor        numeric(12, 2) not null,
  created_at   timestamptz not null default now(),
  primary key (objetivo_id, fecha)
);

alter table public.objetivo_marcas enable row level security;

-- ════════════════════════════════════════════════════════════════════════════
-- 05-10-2026 · Un solo diario para todo: etiqueta, fotos y ubicación
-- ════════════════════════════════════════════════════════════════════════════

-- `etiqueta`: de qué va la nota (negocio, gimnasio, salud…); la lista vive en
-- src/lib/objetivos.ts. `fotos`: rutas dentro del bucket privado `diario`.
-- `lugar`: lo que escribe el admin («Gimnasio»); `lat`/`lng`: si pulsó
-- «Usar mi ubicación».
alter table public.diario_notas add column if not exists etiqueta text;
alter table public.diario_notas add column if not exists fotos text[] not null default '{}';
alter table public.diario_notas add column if not exists lugar text;
alter table public.diario_notas add column if not exists lat numeric(9, 6);
alter table public.diario_notas add column if not exists lng numeric(9, 6);

-- Bucket PRIVADO para las fotos del diario. Sin políticas en storage.objects:
-- nadie con la clave anónima puede ni subir ni ver nada. Las sube el servidor
-- con la clave de servicio tras comprobar que es el admin, y las enseña con
-- enlaces firmados que caducan en una hora. Nunca el bucket público `media`.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('diario', 'diario', false, 4194304, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = false;

-- ════════════════════════════════════════════════════════════════════════════
-- 05-10-2026 · Cierre del día: productividad y dinero ganado
-- ════════════════════════════════════════════════════════════════════════════

-- Un día = una fila. `productividad`: 1 poco productivo · 2 normal · 3 muy
-- productivo. `nota`: una frase opcional de cómo fue.
create table if not exists public.dias_balance (
  fecha          date primary key,
  productividad  smallint check (productividad between 1 and 3),
  nota           text,
  updated_at     timestamptz not null default now()
);

alter table public.dias_balance enable row level security;

-- Lo ganado cada día, por fuente (premium, youtube, trading, asesorias,
-- otros; la lista vive en src/lib/objetivos.ts). Una fila por día y fuente:
-- volver a guardar el día sustituye sus cifras.
create table if not exists public.ingresos_dia (
  fecha    date not null,
  fuente   text not null,
  importe  numeric(12, 2) not null check (importe >= 0),
  primary key (fecha, fuente)
);

alter table public.ingresos_dia enable row level security;

-- ════════════════════════════════════════════════════════════════════════════
-- 05-10-2026 · Diario: intenciones
-- ════════════════════════════════════════════════════════════════════════════

-- Lo que el admin se propone, escrito a mano, para esta semana o este mes.
-- Sin números: los objetivos medibles siguen en `objetivos`. `desde` es el
-- lunes de la semana o el día 1 del mes al que pertenece.
create table if not exists public.diario_intenciones (
  id          uuid primary key default gen_random_uuid(),
  texto       text not null check (length(trim(texto)) between 1 and 200),
  horizonte   text not null check (horizonte in ('semana', 'mes')),
  desde       date not null,
  hecha       boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.diario_intenciones enable row level security;

create index if not exists diario_intenciones_desde_idx on public.diario_intenciones (desde desc);

-- ════════════════════════════════════════════════════════════════════════════
-- 05-10-2026 · Ideas: notas sueltas, sin calendario
-- ════════════════════════════════════════════════════════════════════════════

-- Una idea es texto y su canal (youtube, web o telegram), con un tick de
-- hecha para tacharla. Nada de día ni estado: no tiene relación con el
-- calendario; si llega a hacerse, se planea allí aparte.
create table if not exists public.ideas (
  id          uuid primary key default gen_random_uuid(),
  texto       text not null check (length(trim(texto)) between 1 and 5000),
  canal       text not null default 'youtube',
  hecha       boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.ideas enable row level security;

-- Para quien creó la tabla antes de que tuviera canal y tick.
alter table public.ideas add column if not exists canal text not null default 'youtube';
alter table public.ideas add column if not exists hecha boolean not null default false;
alter table public.ideas drop constraint if exists ideas_canal_check;
alter table public.ideas add constraint ideas_canal_check check (canal in ('youtube', 'web', 'telegram'));

create index if not exists ideas_created_idx on public.ideas (created_at desc);

-- Las ideas antiguas eran piezas del plan sin fecha: pasan a ser notas y
-- salen del plan. Idempotente: la segunda vez ya no queda ninguna sin fecha.
insert into public.ideas (texto, canal, created_at)
select trim(titulo || coalesce(E'\n\n' || nullif(trim(notas), ''), '')), canal, created_at
from public.contenido_plan
where fecha is null;

delete from public.contenido_plan where fecha is null;

-- ════════════════════════════════════════════════════════════════════════════
-- 05-10-2026 · Diario: lo que te afecta y lo que te motiva
-- ════════════════════════════════════════════════════════════════════════════

-- Factores marcados en cada nota (claves de FACTORES_NEGATIVOS y
-- FACTORES_MOTIVOS en src/lib/objetivos.ts). Son lo que permite contar qué
-- pesa más y cruzarlo con el ánimo.
alter table public.diario_notas add column if not exists negativos text[] not null default '{}';
alter table public.diario_notas add column if not exists motivos text[] not null default '{}';

-- ════════════════════════════════════════════════════════════════════════════
-- 06-10-2026 · Gastos de la empresa
-- ════════════════════════════════════════════════════════════════════════════

-- Lo que cuesta el proyecto. Con `recurrente`, el gasto cuenta todos los
-- meses desde el de `fecha` hasta el de `hasta` (vacío = sigue). Las
-- categorías viven en src/lib/objetivos.ts (CATEGORIAS_GASTO).
create table if not exists public.gastos (
  id          uuid primary key default gen_random_uuid(),
  fecha       date not null,
  concepto    text not null check (length(trim(concepto)) between 1 and 120),
  categoria   text not null default 'otros',
  importe     numeric(12, 2) not null check (importe > 0),
  recurrente  boolean not null default false,
  hasta       date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (hasta is null or hasta >= fecha)
);

alter table public.gastos enable row level security;

create index if not exists gastos_fecha_idx on public.gastos (fecha desc);

-- ════════════════════════════════════════════════════════════════════════════
-- 06-10-2026 · Un solo libro de movimientos: ingresos y gastos
-- ════════════════════════════════════════════════════════════════════════════

-- Todo el dinero de la empresa, una fila por movimiento. Escriben aquí el
-- cierre del día (origen 'cierre': una fila por fuente y día, que el cierre
-- sustituye al guardar) y el formulario de Crecimiento / Gastos (origen
-- 'manual': con concepto, y puntual o fijo cada mes). Así nada se cuenta dos
-- veces: hay una sola fuente de verdad.
--
-- `categoria`: la fuente si es ingreso (FUENTES) o la categoría si es gasto
-- (CATEGORIAS_GASTO), en src/lib/objetivos.ts.
create table if not exists public.movimientos (
  id          uuid primary key default gen_random_uuid(),
  tipo        text not null check (tipo in ('ingreso', 'gasto')),
  fecha       date not null,
  concepto    text check (concepto is null or length(trim(concepto)) between 1 and 120),
  categoria   text not null,
  importe     numeric(12, 2) not null check (importe > 0),
  recurrente  boolean not null default false,
  hasta       date,
  origen      text not null default 'manual' check (origen in ('cierre', 'manual')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (hasta is null or hasta >= fecha),
  -- Lo del cierre es por fuente y día, sin repetirse ni ser fijo.
  check (origen = 'manual' or (tipo = 'ingreso' and not recurrente))
);

alter table public.movimientos enable row level security;

create index if not exists movimientos_fecha_idx on public.movimientos (fecha desc);
create unique index if not exists movimientos_cierre_dia_fuente
  on public.movimientos (fecha, categoria) where origen = 'cierre';

-- Traspaso, idempotente: lo apuntado en los cierres y los gastos ya creados.
-- Las tablas viejas (ingresos_dia, gastos) se quedan como copia y ya no se
-- leen ni se escriben; se pueden borrar cuando se compruebe que todo cuadra.
insert into public.movimientos (tipo, fecha, categoria, importe, origen)
select 'ingreso', fecha, fuente, importe, 'cierre' from public.ingresos_dia
on conflict (fecha, categoria) where origen = 'cierre' do nothing;

insert into public.movimientos (id, tipo, fecha, concepto, categoria, importe, recurrente, hasta, origen, created_at)
select id, 'gasto', fecha, concepto, categoria, importe, recurrente, hasta, 'manual', created_at from public.gastos
on conflict (id) do nothing;

-- ════════════════════════════════════════════════════════════════════════════
-- 10-10-2026 · Métrica «Shorts»
-- ════════════════════════════════════════════════════════════════════════════

-- Los objetivos de YouTube se cuentan ya con la API (fecha real de subida):
-- `videos` son los largos y `shorts` los de 3 minutos o menos, que el bot no
-- anuncia y antes no contaban en ningún sitio.
alter table public.objetivos drop constraint if exists objetivos_metrica_check;
alter table public.objetivos
  add constraint objetivos_metrica_check check (metrica in (
    -- Lista COMPLETA a propósito, también en los bloques antiguos: al volver a
    -- ejecutar el script entero, una lista más corta chocaría con los objetivos
    -- que ya usan métricas nuevas y pararía el script. Al añadir una métrica,
    -- añádela aquí en TODOS los bloques (búscalos por objetivos_metrica_check).
    'manual', 'marca', 'entradas', 'videos', 'shorts', 'registros', 'premium', 'ingresos', 'beneficio',
    'miembros_telegram', 'suscriptores_youtube'
  ));

-- ════════════════════════════════════════════════════════════════════════════
-- 10-10-2026 · Los cobros de Premium salen de Stripe, no se apuntan a mano
-- ════════════════════════════════════════════════════════════════════════════

-- Antes Premium se apuntaba en el cierre del día y en paralelo se estimaba
-- (suscriptores × precio): dos cifras que no tenían por qué coincidir. Ahora
-- src/lib/cobrosStripe.ts copia aquí cada movimiento real del saldo de Stripe:
--   · cobro       → ingreso, fuente «premium» (importe bruto)
--   · comisión    → gasto, categoría «comisiones»
--   · devolución  → gasto, categoría «devoluciones»
-- `externo` es el id del movimiento en Stripe (con «:comision» para la
-- comisión): es lo que hace que sincronizar dos veces no duplique nada.
alter table public.movimientos add column if not exists externo text;
alter table public.movimientos drop constraint if exists movimientos_externo_key;
alter table public.movimientos add constraint movimientos_externo_key unique (externo);

-- Las reglas de `origen` se crearon sin nombre: se buscan por su definición.
do $$
declare r record;
begin
  for r in
    select conname from pg_constraint
    where conrelid = 'public.movimientos'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%origen%'
  loop
    execute format('alter table public.movimientos drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.movimientos
  add constraint movimientos_origen_check check (origen in ('cierre', 'manual', 'stripe')),
  -- Solo lo apuntado a mano puede repetirse cada mes; el cierre solo apunta ingresos.
  add constraint movimientos_origen_reglas check (
    (origen = 'manual' or not recurrente) and (origen <> 'cierre' or tipo = 'ingreso')
  ),
  -- Lo de Stripe siempre lleva su id, y nada más lo lleva.
  add constraint movimientos_externo_stripe check ((origen = 'stripe') = (externo is not null));

-- ════════════════════════════════════════════════════════════════════════════
-- 10-10-2026 · Métrica «Beneficio» (ingresos − gastos del libro de dinero)
-- ════════════════════════════════════════════════════════════════════════════
alter table public.objetivos drop constraint if exists objetivos_metrica_check;
alter table public.objetivos
  add constraint objetivos_metrica_check check (metrica in (
    -- Lista COMPLETA a propósito, también en los bloques antiguos: al volver a
    -- ejecutar el script entero, una lista más corta chocaría con los objetivos
    -- que ya usan métricas nuevas y pararía el script. Al añadir una métrica,
    -- añádela aquí en TODOS los bloques (búscalos por objetivos_metrica_check).
    'manual', 'marca', 'entradas', 'videos', 'shorts', 'registros', 'premium', 'ingresos', 'beneficio',
    'miembros_telegram', 'suscriptores_youtube'
  ));
