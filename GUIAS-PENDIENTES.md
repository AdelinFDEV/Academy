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

Si se quiere seguir con esta serie, se vuelve a mirar el ranking con el comando de arriba y se apuntan aquí las que hayan entrado en el top 50 (por ejemplo, el 14-11-2026 asomaban Aster, Ondo, World Liberty Financial, Pump.fun, Internet Computer y Polkadot, entre los puestos 50 y 60).

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
