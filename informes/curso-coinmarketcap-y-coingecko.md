# Informe · Curso «Cómo leer CoinMarketCap y CoinGecko»

**Estado:** aprobado por adelantado por el admin el 12-11-2026 («no te pares en absoluto, confío en tu criterio… hazlos completos sin detenerte y súbelos a la web»; a la pregunta de qué hacer en Supabase respondió «subir y publicar»). Idea original del admin. Sigue [`CURSOS.md`](../CURSOS.md).

## 1 · Título y promesa

**Cómo leer CoinMarketCap y CoinGecko** — *Market cap, FDV, oferta, volumen y liquidez: qué dice cada cifra y qué esconde.*

**Promesa honesta:** entender cada número de las dos webs de datos más usadas del mercado cripto, saber de dónde sale, y tener un método de diez minutos para revisar cualquier moneda antes de poner dinero.

**Lo que NO hace:** no enseña a encontrar «la próxima moneda que se multiplica», no recomienda comprar ni vender nada, no es asesoramiento financiero. Es un curso independiente: no está afiliado a CoinMarketCap ni a CoinGecko, que se nombran solo para explicar cómo se leen.

## 2 · Público y nivel

- Nivel **básico**. Para quien abre CoinMarketCap o CoinGecko y solo entiende el precio.
- Premium, como todos los cursos.
- 5 módulos, 18 lecciones, unas 3 h 50 min.

## 3 · Paleta y logro

- **Color:** coral `#ff8a7a` (familia nueva: no se parece al turquesa, al violeta ni al dorado; no choca con el naranja del Diario `#ff9a4d` porque tira a rosa).
- **Logro:** «Ojo Clínico», con icono propio (una lupa sobre unas barras).

## 4 · Temario y fuentes

| Módulo | Lecciones | Fuentes principales |
|---|---|---|
| 1 · De dónde salen los números | Qué son (y qué no) los agregadores · Cómo se calcula el precio · La portada, columna a columna | Metodología y FAQ de CoinMarketCap; metodología, FAQ y «About» de CoinGecko; anuncio de la compra por Binance (2020) |
| 2 · Capitalización y oferta | El precio por moneda no dice nada · Oferta circulante, total y máxima · FDV y su relación con la capitalización · Desbloqueos y dilución | CMC «Supply» y «Market Capitalization»; CoinGecko «What is FDV»; Binance Research (mayo 2024); Keyrock (16.000 desbloqueos) |
| 3 · Volumen y liquidez | El volumen y su relación con la capitalización · Volumen falso y wash trading · Mercados, pares y profundidad · Slippage: cuánto puedes comprar de verdad | CMC «Volume», «Liquidity Score», «Confidence Indicator»; CoinGecko Trust Score; Bitwise (2019); Cong, Li, Tang y Yang (Management Science, 2023); Chainalysis (2025, citado por CMC) |
| 4 · La ficha de una moneda | La ficha, de arriba abajo · Gráficos, máximos y escalas · Contratos, redes y monedas falsas · Monedas muertas y sesgo de supervivencia | Metodología de CoinGecko (ATH); CMC «Ranking» y «Aggregate Rating»; CoinGecko Research (monedas fallidas, datos a 31-12-2025) |
| 5 · El mercado entero y tu método | Capitalización total y dominancia · Miedo, codicia y tendencias · Tu revisión en diez minutos | Páginas de CMC: Bitcoin Dominance, Altcoin Season Index, Fear and Greed Index |

## 5 · Ejercicios

Por módulo, sobre las webs reales y con una moneda que el alumno elija: comparar su precio en las dos webs y explicar la diferencia; calcular a mano su capitalización, su FDV y su ratio; mirar su pestaña de mercados y estimar el slippage de una orden; recorrer su ficha con una lista de comprobación; y, al final, la revisión completa de diez minutos por escrito.

## 6 · Exámenes

15 preguntas por módulo (salen 10), banco final de 40 (salen 25), mitad conocimiento y mitad casos prácticos. Prefijo de claves: `cm-`. Reglas del aula de siempre.

## 7 · Código

- Términos nuevos del diccionario (fichas detalladas): `fdv`, `volumen`, `liquidez`, `slippage`, `wash-trading`, `dominancia-de-bitcoin`, `libro-de-ordenes`, `spread`, `tokenomics`, `indice-de-miedo-y-codicia`.
- Icono propio del logro en `src/lib/logros.tsx` y motivo SVG de la portada en `PortadaCurso.tsx` (hasta que el admin genere la ilustración).
- Ningún bloque nuevo: se usan `pregunta`, `verdadero-falso`, `clasificar`, `ordenar` y `grafico`.

## 8 · Lo que se cuida al escribir

- **Ninguna cifra de mercado «de hoy»** (precio de bitcoin, capitalización total, dominancia): envejecen en horas. Los ejemplos van con monedas inventadas y números redondos, y se dice que son inventados; el alumno mira las cifras reales en la web.
- Las dos webs **cambian su metodología**: CoinGecko rehízo su Trust Score en mayo de 2026 y CMC normalizó el interés abierto el 29-05-2026. Se explica el concepto y se remite a la página de metodología, sin fijar pesos que no publican.
- CoinMarketCap **es propiedad de Binance** desde 2020: se dice, sin insinuar manipulación que nadie ha probado.

## 9 · Fuentes

**CoinMarketCap (fuente primaria, leída el 12-11-2026):**
- Metodologías de métricas (índice): https://support.coinmarketcap.com/hc/en-us/sections/360008888252-Metric-Methodologies — «Every minute, the various exchanges are queried for their most recent market data».
- Precio: https://support.coinmarketcap.com/hc/en-us/articles/360043395752-Price-Market-Pair-Cryptoasset — el precio de cada par se convierte a USD con sus precios de referencia; el de la moneda sale de un algoritmo sobre la distribución de precios de los exchanges; solo acepta precios de exchanges integrados; un asterisco (*) = precio excluido por no ser de libre mercado (retiradas o depósitos desactivados, restricción geográfica); dos (**) = par excluido del volumen por no cobrar comisión o dar incentivos; tres (***) = precio atípico.
- Volumen e interés abierto: https://support.coinmarketcap.com/hc/en-us/articles/360043395912-Volume-Open-Interest-Market-Pair-Cryptoasset-Exchange-Aggregate — volumen de la moneda = suma del spot de 24 h de todos los exchanges; volumen «reportado» frente a «ajustado» en los exchanges; cita a Cowles Foundation (> 70 % de volumen falso en 2019/2021) y a Chainalysis 2025 (wash trading estimado en 2.570 M$ en 2024, 0,035-0,046 % del volumen de los DEX); interés abierto normalizado a un solo lado desde el 29-05-2026.
- Oferta: https://support.coinmarketcap.com/hc/en-us/articles/360043396252-Supply-Circulating-Total-Max — las cuatro capitalizaciones (FDV = oferta máxima × precio; «Minted» = oferta total neta de quemas × precio; «Unlocked»; «Circulating» = float público × precio); se ordena por la circulante; la oferta circulante no es la desbloqueada; lo asignado a equipo e inversores privados no cuenta como circulante.
- Capitalización: https://support.coinmarketcap.com/hc/en-us/articles/360043836811-Market-Capitalization-Cryptoasset-Aggregate
- Ranking: https://support.coinmarketcap.com/hc/en-us/articles/360043836851-Ranking-Cryptoasset-Market-Pair-Exchange — no publica los pesos; niveles Top 200, 201+, sin rango (ordenadas por volumen) y «rehipotecadas» aparte.
- Liquidity Score: https://support.coinmarketcap.com/hc/en-us/articles/360043836931-Liquidity-Score-Market-Pair-Exchange — de 0 a 1.200; mide el slippage de órdenes de 100 a 10.000 $ sobre todo, y hasta 200.000 $ con menos peso; 0 = menos de 100 $ en el libro en algún lado.
- Web Traffic Factor: https://support.coinmarketcap.com/hc/en-us/articles/360043837171-Web-Traffic-Factor-Exchange
- Confidence Indicator: https://support.coinmarketcap.com/hc/en-us/articles/360044481772-Confidence-Indicator-Market-Pair — alta > 75 %, moderada 50-75 %, baja < 50 %.
- Aggregate Rating: https://support.coinmarketcap.com/hc/en-us/articles/13822353418139-Aggregate-Rating — media simple de valoraciones de terceros (TokenInsight, Certik, Xangle); no es la opinión de CMC.
- FAQ: https://coinmarketcap.com/faq/ — «Market Cap = Price X Circulating Supply»; definiciones de oferta circulante, total y máxima; el signo de interrogación = oferta no verificada; los mercados sin comisión se excluyen; el cambio de 24 h es una ventana móvil; datos en UTC.
- Fear and Greed Index: https://coinmarketcap.com/charts/fear-and-greed-index/ — de 0 a 100; cinco componentes (impulso del precio de las 10 mayores, volatilidad implícita de BTC y ETH, ratio put/call, peso de bitcoin frente a las stablecoins, datos propios de búsquedas); no publica los pesos.
- Altcoin Season Index: https://coinmarketcap.com/charts/altcoin-season-index/ — si el 75 % de las 100 primeras supera a bitcoin en 90 días, «altcoin season»; si el 25 % o menos, «bitcoin season»; excluye stablecoins y tokens envueltos.
- Bitcoin Dominance: https://coinmarketcap.com/charts/bitcoin-dominance/ — capitalización de bitcoin sobre la de todos los criptoactivos, stablecoins incluidas.

**CoinGecko (fuente primaria, leída el 12-11-2026):**
- Metodología: https://www.coingecko.com/en/methodology — precio = media ponderada por volumen (VWAP) de los tickers que quedan tras filtrar; hasta 600 tickers por moneda; atípicos por desviación absoluta mediana (MAD), o cambio > 100× si hay menos de tres tickers; capitalización = precio × oferta circulante; la circulante se resta de la total quitando lo bloqueado; si no puede verificarla, sale un guion; se excluyen los pares sin actualizar en más de 3 h; Trust Score de pares (spread y profundidad ±2 %, volumen, frecuencia) en verde, amarillo o rojo, y de exchanges del 1 al 10 (liquidez, regulación, ciberseguridad, incidentes, prueba de reservas); actualización «Basilisk» de mayo de 2026; fórmula del % de caída desde el máximo.
- FAQ: https://www.coingecko.com/en/faq — precio, volumen y capitalización se actualizan cada 1-10 minutos; Trust Score = liquidez de un par.
- FDV: https://www.coingecko.com/learn/what-is-fully-diluted-valuation-fdv-in-crypto — «Fully Diluted Valuation = Token Price X Total Supply»; cuanto más cerca de 1 el cociente capitalización/FDV, más cerca está la moneda de tener todo en circulación.
- About: https://www.coingecko.com/en/about — fundada el 8 de abril de 2014; se define como el mayor agregador independiente; Trust Score lanzado en mayo de 2019 contra el volumen falso.
- Monedas fallidas (CoinGecko Research, actualizado el 17-04-2026): https://www.coingecko.com/research/publications/how-many-cryptocurrencies-failed — de más de 25,2 millones de criptomonedas listadas en GeckoTerminal entre el 1-07-2021 y el 31-12-2025, 13,4 millones dejaron de negociarse (53,2 %); 11,6 millones murieron en 2025 (86,3 % de todas). Es GeckoTerminal (tokens de DEX), no las monedas listadas en CoinGecko.

**Estudios y terceros:**
- Binance compra CoinMarketCap (anuncio del 2-04-2020; seguiría operando como entidad independiente): https://www.theblock.co/news/deals/2020-04-02-binance-confirms-acquiring-coinmarketcap-60595 · https://cointelegraph.com/news/binance-announces-coinmarketcap-acquisition-cz-gives-the-scoop
- Bitwise Asset Management, informe a la SEC (marzo de 2019): analizó 81 exchanges y concluyó que en torno al 95 % del volumen de bitcoin declarado era falso o sin sentido económico; el mercado real rondaba los 273 M$ diarios: https://www.technologyreview.com/2019/03/26/1206/nearly-all-bitcoin-trades-are-fake-apparently/ · https://www.theblock.co/post/24941/bitwise-report-bitcoin-is-a-significantly-more-efficient-market-despite-95-fake-volume
- Cong, Li, Tang y Yang, «Crypto Wash Trading», *Management Science* 69(11), 2023 (NBER WP 30783): 29 exchanges centralizados; en los no regulados el wash trading superaba de media el 70 % del volumen declarado: https://www.nber.org/papers/w30783
- Binance Research, «Low Float & High FDV» (mayo de 2024): unos 155.000 M$ en tokens por desbloquear entre 2024 y 2030; los lanzados en 2024 tenían los cocientes capitalización/FDV más bajos de los últimos años: https://cryptobriefing.com/binance-research-token-unlocks-2030 (resumen de prensa; Binance es parte interesada).
- Keyrock, «From Locked to Liquidity: What 16,000+ Token Unlocks Teach Us»: el 90 % de los desbloqueos presiona el precio a la baja; los del equipo son los que más: https://keyrock.com/from-locked-to-liquidity-what-16000-token-unlocks-teach-us/ (Keyrock es un creador de mercado: estudio de parte, se cita como tal y sin la cifra del −25 %, que solo sale en resúmenes de prensa).
