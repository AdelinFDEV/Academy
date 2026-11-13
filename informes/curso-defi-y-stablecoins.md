# Informe previo — curso «DeFi y stablecoins»

**Fecha de la investigación:** 13-11-2026 · **Slug:** `defi-y-stablecoins` · **Color propuesto:** cian `#22d3ee` · **Logro:** «Rendimiento Real» · **Nivel:** intermedio · **Aviso:** `formacion`

Aprobación: el admin ordenó el 12-11-2026 hacer los cinco cursos sin esperar su visto bueno a cada informe. Este documento queda como registro de las fuentes.

**Sobre el color.** La idea inicial era un azul, pero el cobalto `#6f9bff` queda demasiado cerca del azul del Portfolio (`#4f9dff`). El cian `#22d3ee` se distingue de él y del turquesa de psicología (`#5ec8c4`), que es más verde y más apagado.

## 1 · Para quién es y qué promete

Para quien tiene stablecoins sin saber qué las respalda, o ha visto un «18 % anual» en un protocolo y quiere entender de dónde sale antes de depositar. El curso explica qué es una stablecoin y por qué algunas han perdido su paridad, qué es un protocolo DeFi por dentro —intercambios, pools, préstamos—, cómo se calcula la pérdida impermanente y una liquidación, de dónde sale un rendimiento y qué puede salir mal. **No recomienda ningún protocolo ni promete rentabilidades.** Promete que el alumno sabrá hacer, antes de depositar un euro, las preguntas que distinguen un rendimiento real de uno que paga con sus propios depósitos.

## 2 · Fuentes

### Stablecoins

| Fuente | Qué aporta | URL |
|---|---|---|
| Circle, comunicado de 13-03-2023 | 3.300 millones de dólares de las reservas de USDC estaban en Silicon Valley Bank, «about 8% of the USDC total reserve». Tras la intervención de las autoridades, el depósito quedó disponible y el desvío se cerró. | https://www.circle.com/pressroom/3-3-billion-of-usdc-reserve-risk-removed-dollar-de-peg-closes |
| Cointelegraph, The Block y otros (11-03-2023) | USDC llegó a cotizar en torno a 0,88 dólares durante el fin de semana. El 13 de marzo había vuelto a un rango de 0,99 a 1,01. | https://cointelegraph.com/news/usdc-depegs-as-circle-confirms-3-3b-stuck-with-silicon-valley-bank |
| Wiki de DefiLlama, Jump Crypto y prensa (mayo de 2022) | Colapso de TerraUSD (UST): Anchor pagaba cerca del 20 % y concentraba en torno al 75 % de la oferta de UST; ese rendimiento no salía de la actividad de préstamo. Entre el 7 y el 11 de mayo los depósitos de Anchor pasaron de unos 17.000 a unos 2.600 millones de dólares. UST y LUNA perdieron prácticamente todo su valor: más de 40.000 millones de dólares. | https://wiki.defillama.com/wiki/The_Great_Depegging · https://jumpcrypto.com/writing/the-depegging-of-ust/ |
| Motley Fool con datos de CoinMarketCap (02-11-2026) y Stablecoin Beat | Tamaño del mercado: en torno a 300.000 millones de dólares; USDT alrededor del 59 % y USDC del 24 %. Cifras que cambian a diario: el curso las da como orden de magnitud. | https://www.fool.com/research/largest-stablecoins/ |

### Regulación europea

| Fuente | Qué aporta | URL |
|---|---|---|
| ESMA, página sobre MiCA | El reglamento entró en vigor en junio de 2023 y es plenamente aplicable desde diciembre de 2024. Cláusula transitoria para proveedores ya existentes hasta el 1 de julio de 2026 como máximo. | https://www.esma.europa.eu/esmas-activities/digital-finance-and-innovation/markets-crypto-assets-regulation-mica |
| ESMA y Comisión Europea, 17-01-2025 | Orientación sobre las stablecoins que no cumplen MiCA: los supervisores nacionales debían asegurar el cumplimiento «as soon as possible, and no later than the end of Q1 2025». | https://www.esma.europa.eu/press-news/esma-news/esma-and-european-commission-publish-guidance-non-mica-compliant-arts-and-emts |
| Cointelegraph, Decrypt (marzo de 2025) | Las grandes plataformas retiraron USDT y otras stablecoins no autorizadas de la negociación al contado para clientes del Espacio Económico Europeo antes del 31-03-2025. | https://cointelegraph.com/news/binance-halt-spot-usdt-trading-eea-mica-compliance |

### Mecánica de los protocolos

Las fórmulas del creador de mercado automático (producto constante) y de la pérdida impermanente son matemática pública, y el curso las desarrolla con ejemplos propios. La comisión del 0,3 % es la de la versión clásica de Uniswap y se cita como ejemplo.

| Fuente | Qué aporta | URL |
|---|---|---|
| Aave, ayuda sobre liquidaciones (09-08-2024) | Factor de salud = (valor de la garantía × umbral de liquidación) ÷ deuda. Hay liquidación cuando baja de 1. Ejemplo de la propia página: 10.000 dólares en ETH, umbral del 80 % y 6.000 de deuda dan 1,333. Se liquida hasta el 50 % de la deuda, o el 100 % si el factor baja de 0,95. El liquidador cobra una bonificación a cargo de la garantía. | https://aave.com/help/borrowing/liquidations |

### Robos y fallos

| Fuente | Qué aporta | URL |
|---|---|---|
| Chainalysis, recogido por The Block (18-12-2025) | Robos de criptomonedas en 2025, de enero a principios de diciembre: más de 3.410 millones de dólares. El ataque a Bybit, 1.500 millones, supuso alrededor del 44 %. Robos a carteras personales: 713 millones, con 158.000 casos. Las pérdidas por ataques a protocolos DeFi se mantuvieron contenidas pese a recuperarse el valor depositado. | https://www.theblock.co/post/382477 |
| Chainalysis, informes anteriores (vía prensa) | 2022 fue el año récord, con unos 3.800 millones robados, en su mayor parte a protocolos DeFi. Dato secundario. | https://www.govinfosecurity.com/crypto-theft-in-2025-concentrated-in-fewer-larger-breaches-a-30331 |

### Fiscalidad en España

| Fuente | Qué aporta | URL |
|---|---|---|
| Cuatrecasas, 05-03-2025, sobre la consulta vinculante V0648-24 de la DGT | Los rendimientos obtenidos por depositar criptomonedas en protocolos «tendrán la consideración de rendimientos del capital mobiliario», valorados en euros el día en que se perciben, en la base del ahorro. Quien presta obtiene rendimientos del capital mobiliario por cesión de capitales propios. La DGT **no se pronuncia** sobre si recibir el token que representa la participación en un pool supone una ganancia patrimonial. | https://www.cuatrecasas.com/es/spain/fiscalidad/art/defi-dgt-analiza-diversas-cuestiones |
| DGT, consulta V1766-22 (vía Finreg360) | Las recompensas del staking se califican como rendimientos del capital mobiliario. | https://finreg360.com/alerta/la-direccion-general-de-tributos-se-pronuncia-respecto-a-la-fiscalidad-de-los-rendimientos-obtenidos-por-staking/ |

## 3 · Lo que NO se va a afirmar

- Que ninguna stablecoin sea «segura», ni qué proporción exacta de reservas tiene hoy cada emisor.
- Rendimientos actuales de ningún protocolo, ni el valor total depositado en DeFi a día de hoy (no se pudo verificar la cifra en la fuente primaria): se enseña al alumno a consultarlo.
- Que una auditoría garantice nada.
- El tratamiento fiscal de las operaciones sobre las que la DGT no se ha pronunciado. Se dice que no hay criterio y se remite a un asesor.
- Que MiCA cubra los protocolos plenamente descentralizados: se explica que el reglamento se dirige a emisores y proveedores de servicios.

## 4 · Estructura

5 módulos, 17 lecciones, 18 preguntas por banco de módulo y 40 en el final (25 por intento).

1. **Stablecoins** — qué son y para qué sirven · las respaldadas por reservas · las respaldadas por criptomonedas y las algorítmicas · cuando se pierde la paridad.
2. **Qué es DeFi** — de la plataforma al contrato · wallet, firmas y aprobaciones · gas, redes y puentes.
3. **Intercambios y pools** — cómo funciona un creador de mercado automático · aportar liquidez · la pérdida impermanente · deslizamiento y órdenes que se adelantan.
4. **Préstamos y rendimientos** — préstamos con garantía · liquidaciones y oráculos · de dónde sale el rendimiento.
5. **Riesgos y decisiones** — lo que puede salir mal · regulación e impuestos · tu lista antes de depositar.

## 5 · Términos nuevos del diccionario

`depeg`, `colateral`, `amm`, `perdida-impermanente`, `tvl`, `apy`, `bridge`, `oraculo`. Ya existen y se enlazan: `stablecoin`, `defi`, `dex`, `liquidity-pool`, `smart-contract`, `gas`, `staking`, `yield-farming`, `aprobacion-de-token`, `exploit`, `autocustodia`, `slippage`, `liquidez`, `liquidacion`, `esquema-ponzi`.

## 6 · Portada

Objeto: dos cilindros de cristal comunicados por un tubo fino, con un líquido luminoso que se reparte entre los dos, sobre una base de metal satinado. Detalle: una rejilla tenue de nodos conectados detrás. Color `#22d3ee`.
