-- Últimos movimientos del Portfolio Adelin (SOLO la cartera spot de altcoins).
--
-- `portfolio_positions` guarda una fila por moneda y la fusiona al comprar
-- más, así que de ella no se puede sacar «qué hice y cuándo». Esta tabla es el
-- diario de los movimientos: la API la escribe sola cada vez que el admin abre,
-- amplía, reduce o cierra una posición (`src/lib/portfolio-movimientos.ts`).
-- El DCA de Bitcoin NO escribe aquí: es otra cartera y tiene su propio histórico.
--
-- Se puede ejecutar entero y más de una vez sin romper nada.

create table if not exists public.portfolio_movimientos (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  tipo          text not null
                  check (tipo in ('apertura', 'ampliacion', 'reduccion', 'cierre')),
  coin_symbol   text not null,
  coin_name     text not null,
  coingecko_id  text,
  -- Precio en dólares del movimiento: el de compra, o el de mercado al vender.
  -- Puede ser nulo si CoinGecko no respondió al cerrar.
  precio        numeric,
  cantidad      numeric,
  nota          text
);

create index if not exists portfolio_movimientos_created_idx
  on public.portfolio_movimientos (created_at desc);

alter table public.portfolio_movimientos enable row level security;

-- Lectura: solo Premium y admin, igual que las posiciones.
drop policy if exists "Premium puede leer los movimientos" on public.portfolio_movimientos;
create policy "Premium puede leer los movimientos"
  on public.portfolio_movimientos for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('premium', 'admin')
    )
  );

-- Escritura: NINGUNA policy a propósito. Solo la API, con la clave de servicio
-- y tras comprobar que quien llama es admin.

comment on table public.portfolio_movimientos is
  'Movimientos de la cartera spot de altcoins de AdelinBTC. Los escribe la API al abrir, ampliar, reducir o cerrar una posición.';
