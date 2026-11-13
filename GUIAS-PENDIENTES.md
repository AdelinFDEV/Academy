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

**Quedan 19.** Puesto en el ranking de ese día, y el grupo al que pertenece, para poder agruparlas o enlazarlas entre sí:

| # | Moneda | Grupo | Nota |
|---|---|---|---|
| 4 | BNB (BNB) | Token de exchange · plataforma | La única de un exchange que tendrá guía (decisión del admin, 13-11-2026): es de Binance, pero también mueve su propia red (BNB Chain) |
| 8 | TRON (TRX) | Plataforma de contratos | Muy usada para mover USDT |
| 11 | Zcash (ZEC) | Privacidad | Dentro por decisión del admin. Explicar su situación en la UE, con fuente y fecha |
| 13 | Monero (XMR) | Privacidad | Dentro por decisión del admin. Igual que Zcash: explicar con fuente por qué muchos exchanges europeos la han retirado |
| 19 | Stellar (XLM) | Pagos | Pariente de XRP: enlazar con su guía |
| 21 | NEAR Protocol (NEAR) | Plataforma de contratos | |
| 23 | Bitcoin Cash (BCH) | Pagos | Nació de una división de Bitcoin |
| 24 | Litecoin (LTC) | Pagos | |
| 25 | Avalanche (AVAX) | Plataforma de contratos | |
| 26 | Uniswap (UNI) | DeFi (intercambio) | Enlazar con el curso *DeFi y stablecoins* |
| 27 | Canton (CC) | Plataforma para instituciones | Poco explicada en español: buen hueco |
| 28 | Sui (SUI) | Plataforma de contratos | |
| 29 | Gram, antes Toncoin (GRAM) | Plataforma de contratos | La red de Telegram. CoinGecko la lista ya como «Gram»: comprobar el cambio de nombre y de símbolo |
| 32 | Hedera (HBAR) | Plataforma de contratos | |
| 34 | Rain (RAIN) | DeFi (opciones y mercados de predicción) | Reciente y con subida rápida en el ranking: comprobar que sigue arriba antes de dedicarle una guía |
| 38 | Bittensor (TAO) | Inteligencia artificial | |
| 41 | Quant (QNT) | Infraestructura (interoperabilidad) | |
| 46 | Ethena (ENA) | DeFi | El token del protocolo; su dólar sintético (USDe) es una de las estables excluidas |
| 50 | Aave (AAVE) | DeFi (préstamos) | Enlazar con el curso *DeFi y stablecoins* |

**Fuera de la lista, y por qué:**

- **Ya explicadas en la web**: Bitcoin (curso *Bitcoin y DCA*), XRP y Hyperliquid (tienen guía).
- **Estables**: USDT, USDC, USDS, USDe, DAI, USD1, RLUSD, PYUSD, USDG y USDF. Se explican en el curso *DeFi y stablecoins*, no una a una.
- **Tokens de exchange** (decidido por el admin el 13-11-2026): LEO Token, WhiteBIT Coin, Cronos y OKB. BNB es la única excepción y está en la lista. Son la moneda de la casa de un exchange; se explican, si hace falta, dentro de lo que cuenta de cada exchange, no como guía propia.
- **Memes**: Dogecoin, Shiba Inu, Pepe y MemeCore (una red hecha para memes, que CoinGecko clasifica como meme).
- **Activos tradicionales tokenizados**, que no son una criptomoneda propia sino un activo de fuera envuelto en un token: Figure HELOC (préstamos hipotecarios), Tether Gold y PAX Gold (oro), Ondo USDY y Circle USYC (deuda del Tesoro de EE. UU.) y Spiko Amundi (un fondo monetario en euros). Si interesan, darían para **una sola guía** sobre la tokenización de activos.

**Hechas el 13-11-2026, a la espera de que el admin las publique desde `/admin/acciones`:** Ethereum, Solana, Cardano y Chainlink (están en `BORRADORES`, `src/lib/guides.ts`). **Siguiente tanda de cuatro:** se eligen de la parte alta de la tabla, mezclando grupos para que no salgan cuatro plataformas de contratos seguidas. El volumen de búsqueda real de cada una se mira en la Fase 0 de la auditoría SEO antes de elegir.

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
