-- Carga inicial del DCA de Bitcoin: las 39 compras del Excel
-- «DCA Bitcoin.xlsx», del 24-11-2025 al 31-08-2026.
--
-- Ejecutar DESPUÉS de scripts/create-dca-compras.sql.
--
-- Comprobado contra el Excel antes de generarlo: 6.700,00 invertidos,
-- 0,09072686 BTC y precio medio 73.848,03. Con el precio objetivo de 200.000
-- del Excel salen 11.445,37 de ganancia y 18.145,37 de resultado — las mismas
-- cifras que las columnas I, J y K de la hoja.
--
-- Importes y precios en DÓLARES.
--
-- Es idempotente: si ya hay compras cargadas, no inserta nada. Así relanzarlo
-- por error no duplica la cartera.

insert into public.dca_compras (fecha, importe, precio_btc, estado)
select * from (values
  (date '2025-11-24', 200.00, 88376.59, 'realizada'),
  (date '2025-12-01', 200.00, 89502.60, 'realizada'),
  (date '2025-12-11', 200.00, 89988.00, 'realizada'),
  (date '2025-12-15', 200.00, 87580.00, 'realizada'),
  (date '2025-12-22', 200.00, 88000.00, 'realizada'),
  (date '2025-12-29', 200.00, 87920.00, 'realizada'),
  (date '2026-01-21', 200.00, 88452.00, 'realizada'),
  (date '2026-01-26', 200.00, 86624.00, 'realizada'),
  (date '2026-02-02', 200.00, 77600.00, 'realizada'),
  (date '2026-02-09', 200.00, 70820.00, 'realizada'),
  (date '2026-02-16', 200.00, 68625.00, 'realizada'),
  (date '2026-02-23', 200.00, 66698.00, 'realizada'),
  (date '2026-03-02', 200.00, 65922.00, 'realizada'),
  (date '2026-03-09', 200.00, 69178.00, 'realizada'),
  (date '2026-03-16', 200.00, 73607.00, 'realizada'),
  (date '2026-03-23', 200.00, 70906.00, 'realizada'),
  (date '2026-03-30', 200.00, 66683.00, 'realizada'),
  (date '2026-04-06', 200.00, 68909.00, 'realizada'),
  (date '2026-04-13', 200.00, 74505.00, 'realizada'),
  (date '2026-04-20', 200.00, 75854.00, 'realizada'),
  (date '2026-04-27', 200.00, 77302.00, 'realizada'),
  (date '2026-05-04', 200.00, 77850.00, 'realizada'),
  (date '2026-05-11', 200.00, 80120.00, 'realizada'),
  (date '2026-05-18', 200.00, 76450.00, 'realizada'),
  (date '2026-05-25', 200.00, 77620.00, 'realizada'),
  (date '2026-06-01', 200.00, 71624.00, 'realizada'),
  (date '2026-06-08', 200.00, 63754.00, 'realizada'),
  (date '2026-06-15', 200.00, 64957.00, 'realizada'),
  (date '2026-06-22', 100.00, 65034.00, 'realizada'),
  (date '2026-06-29', 100.00, 59860.00, 'realizada'),
  (date '2026-07-06', 100.00, 61934.00, 'realizada'),
  (date '2026-07-13', 100.00, 63042.00, 'realizada'),
  (date '2026-07-20', 100.00, 64199.00, 'realizada'),
  (date '2026-07-27', 100.00, 65358.00, 'realizada'),
  (date '2026-08-03', 100.00, 62706.00, 'realizada'),
  (date '2026-08-10', 100.00, 65003.00, 'realizada'),
  (date '2026-08-17', 100.00, 63260.00, 'realizada'),
  (date '2026-08-24', 100.00, 78976.00, 'realizada'),
  (date '2026-08-31', 100.00, 78414.00, 'realizada')
) as v(fecha, importe, precio_btc, estado)
where not exists (select 1 from public.dca_compras);

-- Comprobación. Debe devolver: 39 compras · 6700.00 invertidos ·
-- 0.09072686 BTC · 73848.03 de precio medio.
select
  count(*)                                            as compras,
  sum(importe)                                        as invertido,
  round(sum(importe / precio_btc), 8)                 as btc,
  round(sum(importe) / sum(importe / precio_btc), 2)  as precio_medio
from public.dca_compras
where estado = 'realizada';
