# Informe · Curso «Seguridad cripto: protege tu dinero desde el primer día»

**Estado:** aprobado por adelantado por el admin el 08-11-2026 («lancemos el segundo curso completo… no esperes mi aprobación al terminar, publícalo»). Construido y publicado el mismo día. Sigue [`CURSOS.md`](../CURSOS.md).

## 1 · Título y promesa

**Seguridad cripto** — *Protege tu dinero desde el primer día.*

**Promesa honesta:** saber dónde y cómo guardar tus criptomonedas, cuidar tu seed phrase y reconocer las estafas más comunes antes de caer en ellas.

**Lo que NO hace:** no garantiza que nunca te roben (nadie puede), no recomienda ningún exchange ni ninguna wallet concreta, no es asesoramiento financiero ni jurídico.

## 2 · Público y nivel

- Nivel **básico**. Para quien va a comprar su primera cripto, o la tiene en un exchange sin saber muy bien qué significa.
- Premium, como todos los cursos.
- 5 módulos, 17 lecciones, unas 3 h 30 min.

## 3 · Paleta y logro

- **Color:** violeta `#a78bfa` (familia nueva: no se parece al turquesa de psicología ni al dorado de fiscalidad). Evoca la caja fuerte y la protección.
- **Logro:** «Caja Fuerte», con icono propio (un escudo con cerradura).

## 4 · Temario y fuentes

| Módulo | Lecciones | Fuentes principales |
|---|---|---|
| 1 · Cómo se pierde el dinero en cripto | Hackeos, estafas y errores · Lo que no se puede deshacer · Tu mapa de riesgos | Chainalysis 2025 Crypto Crime Report; FBI IC3 2024; FBI sobre Bybit (2025); EBA/ESMA/EIOPA 2022 |
| 2 · Dónde guardar tus criptomonedas | El exchange y la custodia · Hot wallet y cold wallet · La autocustodia · Cómo repartir | Mt. Gox (2014); FTX (2022-2023); MiCA art. 75 |
| 3 · Tu seed phrase y tus claves | Qué es una seed phrase · Cómo guardarla · Passphrase y herencia | BIP39 |
| 4 · Las estafas, una a una | Phishing y falso soporte · Inversiones falsas y chiringuitos · Permisos de tokens · Envenenamiento de direcciones y SIM swapping | CNMV (advertencias y nota de chiringuitos, 14-07-2026); Chainalysis (pig butchering); Microsoft (ice phishing, 2022); Etherscan; FBI sobre SIM swapping (2022); INCIBE |
| 5 · Tu plan de seguridad | Cuentas blindadas · Enviar y firmar sin errores · Si algo sale mal (y tu plan) | FBI; INCIBE 017; CNMV; EBA |

## 5 · Ejercicios

Por módulo, sobre su propia configuración: inventario de dónde tiene sus criptomonedas, revisión de su seed phrase, juego de «¿estafa o legítimo?», revisar y revocar permisos de tokens, activar 2FA con app y escribir su plan de seguridad.

## 6 · Exámenes

15 preguntas por módulo (salen 10), banco final de 40 (salen 25), mitad conocimiento y mitad casos. Reglas del aula de siempre.

## 7 · Código

- Términos nuevos del diccionario: autocustodia, SIM swapping, envenenamiento de direcciones, chiringuito financiero, pig butchering, aprobación de token, passphrase, esquema Ponzi, ingeniería social.
- Icono propio del logro en `src/lib/logros.tsx`.
- El aviso «formacion» de `DisclaimerRiesgo.tsx` se generaliza para que sirva a cualquier curso de formación (antes hablaba solo de emociones y trading).

## 8 · Fuentes

- Chainalysis, 2025 Crypto Crime Report — robos de 2024 (≈ 2.200 M$, +21 %; 43,8 % por claves privadas comprometidas): https://helpnetsecurity.com/?p=320044 · https://www.trmlabs.com/resources/blog/category-deep-dive-2-2-billion-was-stolen-in-crypto-related-hacks-in-2024
- Chainalysis — ingresos de estafas en 2024 (≈ 9.900 M$ estimación inicial; pig butchering +40 %): https://www.theblock.co/post/340858/funds-lost-in-pig-butchering-crypto-scams-soared-40-in-2024-chainalysis
- FBI IC3, Internet Crime Report 2024 — 9.300 M$ en fraudes con cripto, 5.800 M$ de estafas de inversión: https://dig.watch/?p=211260
- FBI, PSA 26-02-2025 sobre el robo a Bybit (≈ 1.500 M$, Corea del Norte / TraderTraitor): https://www.techtarget.com/searchsecurity/news/366619872/FBI-Lazarus-Group-behind-15-billion-ByBit-heist · https://www.incibe.es/index.php/en/incibe-cert/publications/cybersecurity-highlights/biggest-cryptocurrency-theft-history-hackers-steal-15-billion-bybit
- Mt. Gox (2014, ≈ 850.000 BTC): https://cointelegraph.com/news/details-of-mt-gox-s-bankruptcy-protection-filing
- FTX (quiebra 2022, condena de Bankman-Fried 2023): https://www.nbcnews.com/business/business-news/sam-bankman-fried-verdict-ftx-trial-rcna123158
- MiCA art. 75 (custodia y segregación de los criptoactivos de los clientes): https://www.esma.europa.eu/publications-and-data/interactive-single-rulebook/mica/article-75-providing-custody-and
- BIP39 (frases de 12 a 24 palabras de una lista de 2.048): https://blockchain-academy.hs-mittweida.de/2023/01/what-is-bip39-and-why-should-you-care/
- FBI sobre SIM swapping (2022: 1.611 denuncias y más de 68 M$ en 2021; no usar SMS como segundo factor): https://www.infosecurity-magazine.com/news/fbi-sim-swapping-attacks-surged/
- Microsoft, «ice phishing» (2022) y BadgerDAO (121 M$): https://thehackernews.com/2022/02/microsoft-warns-of-ice-phishing-threat.html
- Etherscan, transferencias de valor cero / envenenamiento de direcciones: https://etherscan-kb.onrender.com/zero-value-token-transfer-attack · https://www.elliptic.co/blockchain-basics/what-is-address-poisoning/
- CNMV, advertencias sobre chiringuitos financieros (nota del 14-07-2026, vía EFPA): https://www.efpa.es/descargas/BOLETIN-REGULATORIO-DE-EFPA-julio.pdf
- INCIBE: blog sobre cripto-robos y Línea de Ayuda 017: https://www.incibe.es/ciudadania/blog/cripto-robos-y-estafas-digitales-lo-que-debes-saber-antes-de-invertir-en
- EBA, ficha sobre fraudes y estafas con criptoactivos (2026, ES): https://www.eba.europa.eu/sites/default/files/2026-01/911f4244-9ffa-4326-9106-1f5e8d879b98/Factsheet%20on%20crypto%20fraud%20and%20scams_ES.pdf
- EBA, ESMA y EIOPA, advertencia conjunta (2022): https://www.esma.europa.eu/press-news/esma-news/eu-financial-regulators-warn-consumers-risks-crypto-assets
