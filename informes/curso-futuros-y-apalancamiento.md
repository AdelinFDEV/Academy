# Informe previo — curso «Futuros y apalancamiento»

**Fecha de la investigación:** 13-11-2026 · **Slug:** `futuros-y-apalancamiento` · **Color propuesto:** rosa `#f472b6` · **Logro:** «Margen de Seguridad» · **Nivel:** intermedio · **Aviso:** `formacion`

Aprobación: el admin ordenó el 12-11-2026 hacer los cinco cursos sin esperar su visto bueno a cada informe («confío en tu criterio»). Este documento queda como registro de las fuentes.

## 1 · Para quién es y qué promete

Para quien ha oído hablar de «x10», «long», «short» o «liquidación» y quiere entender la mecánica antes de tocarla, o ya ha operado futuros y ha perdido sin saber bien por qué. **No enseña a ganar con futuros ni recomienda operarlos.** Promete una sola cosa: que el alumno sepa calcular, antes de abrir una posición, cuánto dinero arriesga, a qué precio se la cierran a la fuerza y cuánto le cuesta mantenerla. La conclusión honesta que recorre el curso es que la mayoría de los particulares pierde con productos apalancados, y que el dato viene de los supervisores.

Enlaza con el curso de psicología (sesgos, revenge trading) y con el Diario de Trading (tamaño de posición por riesgo, múltiplo R), sin repetirlos.

## 2 · Fuentes

### Supervisores

| Fuente | Qué aporta | URL |
|---|---|---|
| ESMA, nota de prensa de 27-03-2018 | Límites de apalancamiento en CFD para minoristas: de 30:1 a **2:1 en criptomonedas**. Cierre obligatorio al 50 % del margen mínimo. Protección de saldo negativo. Advertencia estandarizada. «74-89% of retail accounts typically lose money», con pérdidas medias por cliente de 1.600 a 29.000 €. | https://www.esma.europa.eu/press-news/esma-news/esma-agrees-prohibit-binary-options-and-restrict-cfds-protect-retail-investors |
| CNMV, Resolución de 11-07-2023 (BOE-A-2023-16394) | Primera parte: prohíbe la publicidad de CFD a minoristas y al público, los patrocinios y el uso de «personas de relevancia pública», la retribución por traer clientes, las cuentas demo y cursos gratuitos como reclamo. Segunda parte: a los demás instrumentos apalancados (futuros y opciones entre ellos), exige la garantía inicial de la resolución de 2019 y el cierre de la posición cuando los fondos caen por debajo de la mitad de esa garantía; incluye los derivados sobre criptoactivos. Aplicable desde el 03-08-2023. | https://www.boe.es/eli/es/res/2023/07/11/(1) |
| FCA (Reino Unido), nota de 06-10-2020 y PS20/10 | Prohíbe vender derivados y ETN sobre criptoactivos a minoristas desde el 06-01-2021. Motivos: sin base fiable de valoración, abuso de mercado, volatilidad extrema, comprensión insuficiente, sin necesidad de inversión legítima. Ahorro estimado para los minoristas: unos 53 millones de libras. | https://www.fca.org.uk/news/press-releases/fca-bans-sale-crypto-derivatives-retail-consumers |

### Mecánica de los contratos (documentación de plataforma)

Se usa la documentación pública de Binance por ser la plataforma de mayor volumen, **como ejemplo**: cada plataforma tiene sus propios parámetros y el curso lo dice.

| Fuente | Qué aporta | URL |
|---|---|---|
| Binance, «Introduction to Binance Futures Funding Rates» (act. 06-03-2026) | El funding es un pago periódico entre largos y cortos. Positivo: pagan los largos. Cada 8 horas por defecto (00:00, 08:00 y 16:00 UTC). Importe = valor nominal × tipo. Componente de interés fijo del 0,03 % diario (0,01 % por intervalo). La plataforma no cobra comisión sobre el funding. Si llega al tope, el intervalo puede bajar a una hora. | https://www.binance.com/en/support/faq/introduction-to-binance-futures-funding-rates-360033525031 |
| Binance, «Liquidation Protocols» (act. 04-01-2026) | La liquidación se dispara con el **precio de marca**, no con el último precio. Condición: garantía + PnL < margen de mantenimiento. Se cancelan las órdenes abiertas. Comisión de liquidación. Fondo de seguro que asume las posiciones en quiebra. Si no alcanza: desapalancamiento automático (ADL) contra posiciones contrarias con ganancia. | https://www.binance.com/en/support/faq/360033525271 |
| BitMEX, informe de derivados del T3 de 2025 | El funding fue positivo más del 92 % del tiempo en el trimestre; el nivel de referencia ronda el 0,01 % cada 8 horas. BitMEX es la plataforma que lanzó el contrato perpetuo, en 2016. | https://www.bitmex.com/blog/2025q3-derivatives-report |

### Datos de mercado

| Fuente | Qué aporta | URL |
|---|---|---|
| CoinGlass, recogido por The Block, Moneycontrol y otros (10/11-10-2025) | Mayor jornada de liquidaciones registrada: más de 19.000 millones de dólares y más de 1,6 millones de cuentas liquidadas en 24 horas, la gran mayoría posiciones largas. Desencadenante: anuncio de aranceles del 100 % a China. CoinGlass avisa de que la cifra real es probablemente mayor, porque no todas las plataformas informan de todo. | https://www.theblock.co/post/374266/crypto-liquidations-near-10-billion-in-historic-drawdown-following-trumps-100-tariffs-on-china |
| Galaxy Research, «Crypto's Most Violent Flash Crash Yet» | Análisis de la jornada: bitcoin cayó en torno a un 10 % dentro del día y ether algo más; se activó el desapalancamiento automático en varias plataformas; un activo usado como garantía llegó a cotizar muy por debajo de su valor dentro de una plataforma, que después anunció compensaciones. | https://www.galaxy.com/insights/research/cryptos-flash-crash-liquidation-binance-adl-auto-deleveraging |
| BitMEX, «State of Crypto Perpetual Swaps 2025» | La rentabilidad de cobrar funding con contado más corto cayó a mediados de 2025 hasta niveles parecidos a los de la deuda pública. | https://www.bitmex.com/blog/state-of-crypto-perps-2025 |
| CryptoQuant, recogido por Whale Alert | En 2025 los perpetuos movieron unos 61,8 billones de dólares frente a 18,6 billones del contado: en torno a tres cuartas partes del volumen de las plataformas. Dato secundario; el curso lo da como orden de magnitud. | https://whale-alert.io/stories/9c7941c063fa/Global-crypto-exchange-volume-reached-79T-in-2025-as-perpetual-futures-618T-far-outpaced-spot-186T-Binance-was-the-largest-contributor |
| Grayscale Research (diciembre de 2025), ya usado en el curso de bitcoin | Bitcoin ha caído un 10 % o más unas 50 veces desde 2010, unas tres al año. Sirve para medir cuántas veces al año salta una posición x10. | `informes/curso-bitcoin-y-dca.md` |

### Estudios

| Fuente | Qué aporta | URL |
|---|---|---|
| Chague, De-Losso y Giovannetti, «Day Trading for a Living?» | 19.646 personas empezaron a hacer day trading con futuros del índice brasileño entre 2013 y 2015. Solo 1.551 siguieron más de 300 sesiones; de ellas, el 97 % perdió dinero, el 1,1 % ganó más que el salario mínimo y el 0,5 % más que el sueldo inicial de un cajero de banco. No son criptomonedas: son futuros sobre un índice bursátil, y el curso lo advierte. | https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3423101 · https://econpapers.repec.org/paper/spawpaper/2019wpecon47.htm |

### España

- En 2022, Binance restringió futuros, derivados y tokens apalancados para residentes en España tras la actuación de la CNMV (MuyComputer, 04-07-2022: https://www.muycomputer.com/2022/07/04/binance-no-futuros-derivados-espana/). Fuente periodística; el curso lo cuenta como tal y sin afirmar el estado actual de cada plataforma.
- **Fiscalidad.** No se ha localizado una consulta vinculante de la DGT específica sobre futuros de criptomonedas. El curso se limita a lo seguro: las ganancias y pérdidas tributan en el IRPF, hay que conservar el historial completo de operaciones (incluidos funding y comisiones), y el caso concreto debe confirmarse con un asesor. Remite a la guía `/guias/fiscalidad-cripto-espana`.

## 3 · Lo que NO se va a afirmar

- Que exista un apalancamiento «seguro» o «recomendado».
- Parámetros de una plataforma como si fueran universales: margen de mantenimiento, comisiones y topes de funding se dan como ejemplos y se dice que cambian.
- Precios actuales de mercado. Todos los ejemplos son inventados y con cifras redondas.
- Que el funding o el interés abierto predigan el precio.
- El estado legal actual de una plataforma concreta en España.

## 4 · Estructura

5 módulos, 17 lecciones, 15 preguntas por módulo y 40 en el final (25 por intento).

1. **Qué es un futuro** — contado y derivados · con vencimiento y perpetuos · largo y corto.
2. **Apalancamiento y margen** — el apalancamiento en números · margen inicial y de mantenimiento · aislado y cruzado · la asimetría de las pérdidas.
3. **La liquidación** — el precio de liquidación · precio de marca · fondo de seguro y ADL · cascadas (10-10-2025).
4. **Lo que cuesta mantener una posición** — funding · comisiones sobre el nominal · interés abierto.
5. **Antes de abrir nada** — lo que dicen los datos y los supervisores · el tamaño lo decide el riesgo, no el multiplicador · cobertura y tu reglamento.

## 5 · Términos nuevos del diccionario

`contrato-perpetuo`, `funding-rate`, `margen`, `margen-cruzado`, `precio-de-marca`, `interes-abierto`, `cobertura`. Ya existen y se enlazan: `futuros`, `spot`, `apalancamiento`, `liquidacion`, `long-short`, `cfd`, `stop-loss`, `tamano-de-posicion`, `r-multiplo`, `volatilidad`, `liquidez`, `slippage`, `libro-de-ordenes`.

## 6 · Portada

Objeto: una balanza de precisión de cristal y metal satinado, muy desequilibrada, con un peso pequeño en un plato y uno grande en el otro. Detalle: una línea de precio tenue que cae en vertical por detrás. Color `#f472b6`.
