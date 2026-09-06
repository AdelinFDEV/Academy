-- Portfolio DCA de Bitcoin: una fila por compra.
--
-- ── Por qué una tabla propia y no `portfolio_positions` ────────────────────
--
-- Esa tabla guarda UNA FILA POR MONEDA: al insertar una compra de algo que ya
-- se tiene, la API la fusiona con la existente y recalcula el precio medio.
-- Para el spot de altcoins es lo correcto — lo que se mira es «cuánto llevo en
-- SYRUP y a qué precio medio».
--
-- En un DCA es justo al revés: **el histórico ES el contenido**. Las 39 compras
-- semanales, con su fecha y el precio de aquel día, son lo que demuestra que la
-- estrategia se ha seguido de verdad. Fusionarlas dejaría una sola línea de
-- Bitcoin y borraría lo único que hay que enseñar.
--
-- ── Lo que NO se guarda ────────────────────────────────────────────────────
--
-- La cantidad de BTC no está aquí: es `importe / precio_btc`, y guardar un dato
-- derivado es garantizar que algún día no cuadre con sus dos operandos. Se
-- calcula al leer, en `src/lib/dca.ts`.
--
-- Los importes van en DÓLARES, como el Excel del que salen.

create table if not exists public.dca_compras (
  id          uuid primary key default gen_random_uuid(),
  fecha       date not null,
  -- Dólares aportados en esa compra.
  importe     numeric(12, 2) not null check (importe > 0),
  -- Precio de un BTC en dólares ese día.
  precio_btc  numeric(14, 2) not null check (precio_btc > 0),
  -- `realizada` o `pendiente`. El Excel tiene la columna ESTADO y hoy todas
  -- están realizadas, pero deja la puerta abierta a apuntar una compra
  -- planificada sin que cuente en los totales.
  estado      text not null default 'realizada'
                check (estado in ('realizada', 'pendiente')),
  notas       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Se lee siempre ordenado por fecha, que es como se cuenta la historia.
create index if not exists dca_compras_fecha_idx
  on public.dca_compras (fecha desc);

-- Dos compras el mismo día son posibles (un extra puntual), así que NO hay
-- restricción de unicidad por fecha. Si algún día se quisiera evitar el
-- duplicado por error, el sitio para hacerlo es la API, no aquí.

alter table public.dca_compras enable row level security;

-- Lectura: solo Premium y admin. El resumen público NO pasa por aquí — lo lee
-- el cliente de servicio desde el servidor y solo publica agregados, nunca las
-- filas (ver `src/lib/portfolio-publico.ts`).
drop policy if exists "Premium puede leer las compras DCA" on public.dca_compras;
create policy "Premium puede leer las compras DCA"
  on public.dca_compras for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('premium', 'admin')
    )
  );

-- Escritura: NINGUNA policy a propósito. Insertar, editar y borrar pasa solo
-- por la API con la clave de servicio, que además comprueba que quien llama es
-- admin. Sin policy de escritura, ni el usuario más premium puede tocar la
-- cartera de otro desde el navegador.

comment on table public.dca_compras is
  'Compras del DCA de Bitcoin de AdelinBTC. Una fila por aportación, importes en USD. La cantidad de BTC se calcula, no se guarda.';
