-- Retirada de herramientas (31-10-2026)
--
-- La web se queda con Diario de Trading, Portfolio Adelin, Predicción de
-- Precio y Logros. Se retiraron Watchlist, Liberaciones de Tokens, Radar
-- Diario, Mi Portfolio y la Calculadora de Riesgo. Solo dos de ellas
-- guardaban datos en la base:
--
--   · watchlist               → la Watchlist (vacía al retirarla).
--   · portfolio_transactions  → Mi Portfolio (3 operaciones de 1 usuario).
--
-- Ninguna vista, función ni clave externa dependía de ellas (comprobado antes
-- de escribir esto). Liberaciones, Radar y la Calculadora de Riesgo no tenían
-- tablas: leían datos externos o calculaban en el navegador.
--
-- Ejecutar DESPUÉS de desplegar el código que deja de usarlas: con el código
-- viejo en producción, la watchlist y Mi Portfolio fallarían al leerlas.
-- Se puede lanzar entero y más de una vez.

drop table if exists public.watchlist;
drop table if exists public.portfolio_transactions;
