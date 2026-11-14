# GUÍAS PENDIENTES — lo que queremos lanzar

Aquí se apuntan las **guías que queremos hacer en el futuro**: el tema, la búsqueda que queremos ganar y qué le resuelve al lector. Cómo se monta una guía no está aquí: la fuente de verdad es el panel `/admin/guias-instrucciones`, y la auditoría SEO, [`AUDITORIA-SEO.md`](./AUDITORIA-SEO.md).

**Cómo se usa:**

- Una idea entra aquí cuando el admin la quiere tener en cuenta, aunque no tenga fecha.
- Cuando se empieza a montar, **se mueve a `TAREAS.md`** y **se borra de aquí** en el mismo commit. Lo publicado no se queda en esta lista.
- Todas las guías son **gratuitas** (desde el 31-10-2026). Una guía nueva lleva su `[slug].css`, su alta en `GUIDES` y la auditoría SEO, y no se publica sin el «sí» del admin.

Para ver las que ya existen:

```bash
grep -h '  slug: "' src/lib/guides.ts
```

---

## Formato de cada idea

```
### Título de trabajo

| | |
|---|---|
| **Búsqueda objetivo** | la consulta que queremos ganar en Google |
| **Para quién** | |
| **Qué le resuelve** | |
| **Enlaza con** | cursos, guías y fichas del diccionario relacionados |

Notas: rivales que ya la cubren, el hueco que dejan, datos que hay que comprobar.
```

---

## Criptomonedas por explicar — top 50 de CoinGecko

Una guía por moneda, poco a poco, como las de Worldcoin, Render, Hyperliquid y XRP. La lista sale del **top 50 por capitalización de CoinGecko a 13-11-2026**, quitando lo que no toca explicar. El ranking cambia cada día: antes de empezar una, se vuelve a mirar.

```bash
curl -s "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50"   | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>JSON.parse(d).forEach(c=>console.log(c.market_cap_rank,c.symbol.toUpperCase(),c.name)))"
```

**No queda ninguna.** Las 15 que quedaban se escribieron y auditaron el 14-11-2026 y están en `BORRADORES` (`src/lib/guides.ts`), a la espera de su portada y de que el admin las publique: Zcash, NEAR, Bitcoin Cash, Litecoin, Avalanche, Uniswap, Canton, Sui, Toncoin (ahora Gram), Hedera, Rain, Bittensor, Quant, Ethena y Aave. Lo que les falta está en `TAREAS.md`.

### Segunda tanda: del puesto 50 al 100 (CoinGecko, 15-11-2026)

Mismo criterio que la primera: fuera estables, tokens de exchange, memes y activos tradicionales tokenizados. Para ver el tramo, el comando de arriba con `per_page=100`. **El puesto es el de ese día** y cambia: antes de empezar una, se vuelve a mirar, y si la moneda ha caído mucho o el proyecto ha cambiado, se decide con el admin si sigue mereciendo guía.

Quedan **30 por explicar**, en el orden del ranking (dos de ellas, por verificar):

| Puesto | Proyecto | Símbolo | Qué es, en una línea | Nota |
|---|---|---|---|---|
| 54 | World Liberty Financial | WLFI | Token de gobierno del proyecto DeFi de la familia Trump, emisor de la estable USD1 | Tema político: datos y fuentes con cuidado; sin opinión |
| 55 | Ondo | ONDO | Protocolo que lleva bonos del Tesoro y acciones a la cadena; ONDO es su token de gobierno | Enlaza con la idea de guía sobre tokenización |
| 57 | Pump.fun | PUMP | Plataforma para lanzar memecoins; PUMP es el token de la plataforma, no un meme | Entra por decisión del admin (15-11-2026): se explica la plataforma y su riesgo, no se anuncia ningún meme |
| 59 | Aster | ASTER | Exchange descentralizado de futuros perpetuos en BNB Chain | Rival de Hyperliquid: enlazar su guía |
| 60 | Morpho | MORPHO | Protocolo de préstamos que optimiza y crea mercados de crédito sobre otros | Enlaza con Aave |
| 61 | Mantle | MNT | Capa 2 de Ethereum, muy ligada a Bybit | No es token de exchange, pero contar el vínculo |
| 62 | Sky (antes Maker) | SKY | Gobierno del emisor de DAI y USDS; sustituyó a MKR | La migración MKR → SKY es la pregunta típica |
| 63 | Polkadot | DOT | Red de cadenas conectadas (parachains) con seguridad compartida | |
| 64 | Internet Computer | ICP | Cadena que aloja webs y aplicaciones enteras en la red | |
| 65 | JUST | JST | Plataforma DeFi del ecosistema TRON (préstamos y estables) | Enlaza con TRON |
| 68 | Bitway | BTW | Token de gobierno de una plataforma de rendimiento, pagos y financiación sobre bitcoin | **Por verificar**: proyecto reciente y con poca información pública |
| 71 | Ethereum Classic | ETC | La cadena original de Ethereum que no aceptó el hard fork de 2016 | Ficha `hard-fork` |
| 72 | Arbitrum | ARB | La capa 2 de Ethereum más usada (rollup optimista) | Fichas `rollup`, `capa-2` |
| 74 | Venice | VVV | IA generativa privada: modelos abiertos sin guardar conversaciones; VVV da acceso a la API | |
| 75 | Polygon | POL | Red de Ethereum (antes MATIC) que se reconvirtió en ecosistema de cadenas | La migración MATIC → POL |
| 77 | Jupiter | JUP | Agregador de intercambios y perpetuos de Solana | Enlaza con Solana |
| 78 | Midnight | NIGHT | Cadena de privacidad del ecosistema Cardano, con pruebas de conocimiento cero | Enlaza con Cardano, Zcash y Monero |
| 80 | Kaspa | KAS | Prueba de trabajo con bloques en paralelo (GHOSTDAG) | |
| 81 | Pi Network | PI | La «minería desde el móvil»; red abierta en 2025 | Muy buscada en España; explicar las dudas sin sensacionalismo |
| 82 | Lighter | LIT | Exchange descentralizado de perpetuos con pruebas de conocimiento cero | Rival de Hyperliquid y Aster |
| 84 | Algorand | ALGO | Prueba de participación pura, con finalidad inmediata | |
| 86 | Cosmos Hub | ATOM | El «internet de cadenas»: el protocolo IBC y su centro | |
| 87 | Injective | INJ | Cadena hecha para finanzas y derivados, sobre Cosmos | |
| 89 | Beldex | BDX | Moneda de privacidad derivada de Monero, con mensajería y VPN propias | Enlaza con Monero; la misma norma europea le afecta |
| 91 | Pearl | PEARL | Prueba de trabajo útil: la minería sale del cálculo de IA en GPU | Muy reciente: comprobar que el proyecto funciona |
| 92 | LayerZero | ZRO | Protocolo de mensajería entre cadenas | Fichas `bridge`, `interoperabilidad` |
| 93 | XDC Network | XDC | Cadena empresarial para comercio internacional y financiación de exportaciones | |
| 95 | PancakeSwap | CAKE | El mayor exchange descentralizado de BNB Chain | Enlaza con BNB y Uniswap |
| 97 | Filecoin | FIL | Almacenamiento descentralizado pagado en FIL | |
| 99 | Pieverse | PIEVERSE | Proyecto de IA en BNB Chain; CoinGecko no publica descripción | **Por verificar**: si no hay un producto que explicar, se descarta |

**Fuera de este tramo, y por qué** (el mismo criterio de abajo):

- **Ya tienen guía o borrador:** Aave (51), Ethena (52), Worldcoin (70) y Render (79).
- **Estables:** USDD, BFUSD, USDGO, Open USD, GHO, Usual USD, EURC, TrueUSD y YLDS.
- **Tokens de exchange:** HTX DAO, Bitget Token, KuCoin y Gate.
- **Plataforma centralizada:** NEXO, la moneda de la casa de un servicio de préstamos y compraventa. Fuera por el mismo motivo que los exchanges (decidido por el admin el 15-11-2026).
- **Memes:** Pepe.
- **Activos tradicionales tokenizados:** Invesco USTB y Janus Henderson JAAA (fondos de deuda). Irían en la guía única sobre tokenización.

Asomaban justo detrás del 100, por si el ranking se mueve: Stacks, Ether.fi, Dash, Pyth Network, Flare y Aptos.

**Fuera de la lista, y por qué:**

- **Ya explicadas en la web**: Bitcoin (curso *Bitcoin y DCA*), XRP y Hyperliquid (tienen guía).
- **Estables**: USDT, USDC, USDS, USDe, DAI, USD1, RLUSD, PYUSD, USDG y USDF. Se explican en el curso *DeFi y stablecoins*, no una a una.
- **Tokens de exchange** (decidido por el admin el 13-11-2026): LEO Token, WhiteBIT Coin, Cronos y OKB. BNB es la única excepción y está en la lista. Son la moneda de la casa de un exchange; se explican, si hace falta, dentro de lo que cuenta de cada exchange, no como guía propia.
- **Memes**: Dogecoin, Shiba Inu, Pepe y MemeCore (una red hecha para memes, que CoinGecko clasifica como meme).
- **Activos tradicionales tokenizados**, que no son una criptomoneda propia sino un activo de fuera envuelto en un token: Figure HELOC (préstamos hipotecarios), Tether Gold y PAX Gold (oro), Ondo USDY y Circle USYC (deuda del Tesoro de EE. UU.) y Spiko Amundi (un fondo monetario en euros). Si interesan, darían para **una sola guía** sobre la tokenización de activos.

**Hechas el 13-11-2026, también en `BORRADORES`:** Ethereum, Solana, Cardano, Chainlink, BNB, TRON, Monero y Stellar.

---

## Otras ideas

Salen de repasar los cursos (13-11-2026): temas que encajan mejor como guía que como curso. Sin búsqueda objetivo todavía; se fija con la Fase 0 de la auditoría SEO al empezar.

### Qué pasa con tus criptomonedas si te pasa algo

| | |
|---|---|
| **Búsqueda objetivo** | por decidir (algo como «herencia criptomonedas») |
| **Para quién** | Quien guarda sus criptomonedas en una cartera propia |
| **Qué le resuelve** | Cómo dejar un plan para que su familia pueda recuperarlas sin entregarle hoy sus claves |
| **Enlaza con** | curso *Seguridad cripto* (lección 3.3, «Passphrase y herencia»), fichas `seed-phrase` y `clave-privada` |

Notas: el curso lo toca en una lección; aquí se desarrolla entero. Ojo con la parte legal de la herencia, que depende del país: se explica el plan práctico y se remite a un profesional para lo jurídico.

### MiCA: qué protege al inversor y qué no

| | |
|---|---|
| **Búsqueda objetivo** | por decidir (algo como «qué es MiCA») |
| **Para quién** | Quien compra en un exchange y quiere saber si está protegido |
| **Qué le resuelve** | Qué cambia con el reglamento europeo, cómo comprobar si un exchange está autorizado y qué riesgos siguen siendo suyos |
| **Enlaza con** | la idea de curso «Tu primera compra de cripto» (`CURSOS-PENDIENTES.md`), curso *Seguridad cripto* |

Notas: tema muy regulatorio y que cambia; cada dato, con la fuente oficial (EUR-Lex, ESMA, CNMV) y su fecha.
