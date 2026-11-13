# CURSOS PENDIENTES — lo que queremos lanzar

Aquí se apuntan los **cursos que queremos hacer en el futuro**: la idea, para quién es y qué le resuelve al alumno. No es el proceso de construcción, que está en [`CURSOS.md`](./CURSOS.md), ni el estado de lo que ya está en marcha, que está en [`TAREAS.md`](./TAREAS.md).

**Cómo se usa:**

- Una idea entra aquí cuando el admin la quiere tener en cuenta, aunque no tenga fecha.
- Cuando se decide hacerla, **se mueve a `TAREAS.md`** (con su informe en `informes/`, como manda `CURSOS.md`) y **se borra de aquí** en el mismo commit. Lo publicado no se queda en esta lista.
- Ningún curso se escribe sin informe aprobado. Las cifras y los datos que aparecen abajo son orientativos: se comprueban con fuente en el informe.

---

## Lo que ya hay (para no repetirlo)

Se mira en el repositorio, no se copia aquí la lista, que envejece:

```bash
ls scripts/cursos/
grep -h '"titulo"\|"published"' scripts/cursos/*/curso.json
```

A 13-11-2026: siete publicados (Bitcoin y DCA, Seguridad cripto, Cómo leer CoinMarketCap y CoinGecko, DeFi y stablecoins, Análisis técnico sin humo, Futuros y apalancamiento, Psicología del trading) y uno escrito en borrador (Fiscalidad cripto en España).

**El hueco que dejan:** el alumno aprende qué es bitcoin, cómo protegerlo, cómo leer las cifras, cómo funciona DeFi y cómo se opera. Pero no hay nada que le acompañe en **lo que hace con las manos la primera vez** (comprar, enviar, usar una cartera), ni en **cómo decidir qué comprar y cuánto** cuando sale de bitcoin. Las ideas de abajo van a esos dos huecos.

---

## Las ideas, por orden de prioridad

### 1. Tu primera compra de cripto, de principio a fin

| | |
|---|---|
| **Nivel** | Básico |
| **Para quién** | Quien nunca ha comprado o compró una vez «a ciegas» |
| **Qué le resuelve** | Los errores caros del primer día: pagar de más sin saberlo, enviar por la red equivocada, dejarlo todo en el exchange |

Módulos propuestos:

1. **Elegir dónde comprar.** Exchange, bróker, app del banco: qué es cada uno y qué comprobar antes de dar tus datos (registro y autorización en la UE, comisiones publicadas, cómo retirar).
2. **Abrir la cuenta.** Verificación de identidad, por qué la piden y qué datos no deberías dar nunca.
3. **Meter euros y comprar sin pagar de más.** Transferencia frente a tarjeta, comisión frente a diferencial (*spread*), orden a mercado frente a orden limitada. Con un ejemplo con números de cuánto se pierde en cada camino.
4. **Sacarlo a tu cartera.** Elegir la red, la dirección, el envío de prueba pequeño, cuánto tarda y qué se ve en un explorador de bloques.
5. **Lo que se apunta desde el primer día.** Qué guardar de cada compra para la declaración y para saber cuánto llevas invertido.

**Por qué es el primero:** es la duda más repetida del principiante, y es la puerta de entrada al resto. Conecta con *Seguridad cripto* (dónde guardarlo después), con *Bitcoin y DCA* (repetir la compra con un plan) y con *Fiscalidad* (qué apuntar).

**Cuidado al escribirlo:** no recomendar ningún exchange por su nombre. Se enseña a comprobar, no a elegir por el alumno.

**No repetir:** *Seguridad cripto* ya explica el exchange y la custodia (lección 2.1) y cómo enviar sin errores (5.2). Aquí se cuenta el recorrido práctico y se enlaza allí para el detalle.

---

### 2. Analizar un proyecto antes de comprarlo

| | |
|---|---|
| **Nivel** | Intermedio |
| **Para quién** | Quien quiere comprar algo que no es bitcoin y no sabe cómo distinguir un proyecto serio de uno vacío |
| **Qué le resuelve** | Un método para investigar una moneda en una tarde, con señales de alarma claras |

Módulos propuestos:

1. **Qué problema dice resolver** y si alguien lo usa de verdad.
2. **Tokenomics.** Quién tiene las monedas, cuándo se desbloquean y cuánta inflación hay por delante.
3. **El dinero de verdad.** Ingresos, comisiones y tesorería del proyecto, y dónde se consultan.
4. **El equipo, el código y las auditorías.** Qué se puede comprobar y qué no.
5. **Las señales de alarma y tu ficha de análisis.** Una plantilla para rellenar con cada proyecto.

**Por qué:** es el paso siguiente natural a *Cómo leer CoinMarketCap y CoinGecko*, que enseña las cifras pero no el juicio sobre el proyecto. Las guías de proyectos (Worldcoin, Render, Hyperliquid, XRP) servirían de ejemplos reales.

**Cuidado al escribirlo:** un método de análisis, nunca una lista de monedas que comprar.

---

### 3. Cartera propia y redes en la práctica: gas, puentes y exploradores

| | |
|---|---|
| **Nivel** | Básico-intermedio |
| **Para quién** | Quien ya tiene una cartera propia y quiere usarla sin miedo |
| **Qué le resuelve** | Lo que asusta de usar una cartera: elegir la red, pagar el gas, mover entre redes y saber qué ha pasado con una transacción |

Módulos propuestos:

1. **Redes y direcciones.** Por qué la misma dirección sirve en varias redes y qué pasa si envías por la equivocada.
2. **El gas.** Qué es, por qué cambia y cómo no pagar de más.
3. **Puentes.** Cómo se mueve un activo de una red a otra y por qué es uno de los puntos más atacados.
4. **Leer un explorador de bloques.** Seguir tu propia transacción paso a paso, y qué hacer si se queda atascada.
5. **Comisiones de red frente a comisiones del exchange.** Cuándo conviene retirar, por qué red y cuánto se va por el camino.

**Por qué:** *Seguridad cripto* enseña a guardar; este enseña a **usar**, que es donde se pierde el dinero una vez que la cartera ya está bien guardada. Prepara el terreno para *DeFi y stablecoins*.

**No repetir:** los permisos de tokens y el «enviar y firmar sin errores» ya están en *Seguridad cripto* (lecciones 4.3 y 5.2): se enlazan, no se vuelven a explicar.

---

### 4. Construir una cartera de inversión cripto

| | |
|---|---|
| **Nivel** | Intermedio |
| **Para quién** | Quien ya tiene algo de bitcoin y se pregunta qué más hacer, y cuánto |
| **Qué le resuelve** | Decidir cuánto poner en cripto, cómo repartirlo y cuándo tocarlo, con reglas escritas y no a impulsos |

Módulos propuestos:

1. **Cuánto de tu patrimonio.** El colchón primero, y la cripto como parte de un todo.
2. **Repartir de verdad.** Por qué diez altcoins no son diversificar, si todas caen a la vez.
3. **El papel de cada pieza.** Bitcoin, el resto y las stablecoins como reserva.
4. **Rebalancear y recoger beneficios.** Reglas por fechas o por porcentajes, y su efecto en los impuestos.
5. **Tu plan de cartera.** Por escrito, con lo que harías en una caída del 50 %.

**Por qué:** ninguno de los cursos actuales responde a «¿y ahora qué hago con mi dinero?». Se puede apoyar en el **Portfolio Adelin** como ejemplo real de una cartera con criterio, sin presentarlo como recomendación.

**Cuidado al escribirlo:** es lo más cercano a asesoramiento de toda la lista. Se enseña a construir un criterio propio, nunca a copiar una cartera. Tiene que pasar por el listón YMYL más alto.

---

## Ideas sueltas, para más adelante

Sin desarrollar todavía. Se apuntan para no perderlas; puede que alguna encaje mejor como guía que como curso.

- **Ciclos del mercado y macro**: halvings, liquidez, tipos de interés, ETF. Con mucho cuidado de no venderlo como forma de predecir el precio.
- **Staking**: de dónde sale el rendimiento, los riesgos y cómo tributa. Una parte ya está en *DeFi y stablecoins*.
- **Herencia y plan de contingencia**: qué pasa con tus criptomonedas si te pasa algo, y cómo dejarlo resuelto sin entregar tus claves. *Seguridad cripto* lo toca en una lección (3.3, «Passphrase y herencia»); daría para una guía que lo desarrolle entero.
- **La regulación europea para el inversor (MiCA)**: qué protege y qué no. Probablemente mejor como guía.

## Descartadas por solape

Para no volver a proponerlas sin mirar antes lo que ya hay:

- **Gestión del riesgo y tamaño de la posición.** Ya está repartida entre *Psicología del trading* (módulo 4: «Piensa en R», «El tamaño de posición te protege», «Muestra, ruido y rachas») y *Futuros y apalancamiento* («La asimetría de las pérdidas», «El tamaño lo decide el riesgo»). Un curso aparte repetiría esas lecciones.
