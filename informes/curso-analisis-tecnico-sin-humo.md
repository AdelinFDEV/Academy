# Informe previo — curso «Análisis técnico sin humo»

**Fecha de la investigación:** 13-11-2026 · **Slug:** `analisis-tecnico-sin-humo` · **Color propuesto:** verde lima `#a3e635` · **Logro:** «Gráfico Limpio» · **Nivel:** intermedio · **Aviso:** `formacion`

Aprobación: el admin ordenó el 12-11-2026 hacer los cinco cursos sin esperar su visto bueno a cada informe. Este documento queda como registro de las fuentes.

## 1 · Para quién es y qué promete

Para quien abre un gráfico y no sabe qué está mirando, o lleva tiempo llenándolo de líneas e indicadores sin saber si sirven. El curso enseña a leer un gráfico —velas, tendencia, niveles, volumen, los indicadores más usados— y, en paralelo, lo que dice la investigación sobre cada herramienta. **No promete que el análisis técnico prediga el precio.** Promete que el alumno sabrá qué mide cada cosa, qué parte tiene respaldo, qué parte es humo y cómo comprobar por sí mismo si una regla ha funcionado.

La postura del curso, que sale de la evidencia: el análisis técnico no es magia ni es basura. Algunas reglas sencillas de tendencia han mostrado capacidad predictiva en mercados jóvenes como el de bitcoin; la mayoría de los patrones vistosos no la ha mostrado; y casi todo lo que parece funcionar deja de hacerlo al descontar costes, al probarlo fuera de la muestra o al contar cuántas reglas se probaron antes de dar con ella. Su utilidad más sólida no es predecir: es ordenar decisiones y definir el riesgo.

## 2 · Fuentes

### Qué dice la investigación, en general

| Fuente | Qué aporta | URL |
|---|---|---|
| Park e Irwin (2007), «What do we know about the profitability of technical analysis?», *Journal of Economic Surveys* 21(4) | Revisión de 95 estudios modernos: 56 con resultados positivos, 20 negativos y 19 mixtos. Advierten de que la mayoría tiene problemas de método: *data snooping*, elección de reglas a posteriori y dificultad para estimar riesgo y costes. | https://econpapers.repec.org/RePEc:bla:jecsur:v:21:y:2007:i:4:p:786-826 |
| Sullivan, Timmermann y White (1999), «Data-snooping, technical trading rule performance, and the bootstrap», *Journal of Finance* | Amplían las 26 reglas de Brock, Lakonishok y LeBaron (1992) y las aplican a cien años del Dow Jones corrigiendo el efecto de haber probado muchas. La mejor regla del periodo histórico no repite su resultado en los diez años posteriores. | https://bashtage.github.io/kevinsheppard.com/files/teaching/mfe/advanced-econometrics/Sullivan_Timmermann_White.pdf |
| Lo, Mamaysky y Wang (2000), «Foundations of Technical Analysis», *Journal of Finance* 55(4) | Automatizan el reconocimiento de diez patrones (hombro-cabeza-hombro, dobles techos…) en acciones de EE. UU. de 1962 a 1996. Conclusión: varios indicadores técnicos «aportan información incremental y pueden tener cierto valor práctico». Señalan que ver figuras en un gráfico está a menudo «en los ojos de quien mira». | https://web.mit.edu/~alo/www/Papers/techanal.html |
| Bailey, Borwein, López de Prado y Zhu (2014), «Pseudo-Mathematics and Financial Charlatanism», *Notices of the AMS* | El sobreajuste en las pruebas con datos pasados: probando un número modesto de configuraciones se obtiene con facilidad un resultado excelente que no se repite. Casi nadie informa de cuántas configuraciones probó. | https://scholarworks.wmich.edu/math_pubs/40/ |

### Niveles, órdenes y números redondos

| Fuente | Qué aporta | URL |
|---|---|---|
| Osler (2003), «Currency orders and exchange rate dynamics: an explanation for the predictive success of technical analysis», *Journal of Finance* 58(5) | Con datos reales de órdenes en divisas: las órdenes de toma de beneficios se agrupan en los números redondos y las de stop, justo más allá. Da una explicación mecánica de por qué soportes y resistencias en cifras redondas tienden a frenar el precio y por qué se acelera al superarlas. | https://ideas.repec.org/a/bla/jfinan/v58y2003i5p1791-1819.html |

### Con criptomonedas

| Fuente | Qué aporta | URL |
|---|---|---|
| Detzel, Liu, Strauss, Zhou y Zhu (2021), «Learning and predictability via technical analysis: Evidence from bitcoin and stocks with hard-to-value fundamentals», *Financial Management* 50(1) | Las ratios entre el precio y sus medias móviles predicen la rentabilidad diaria de bitcoin, dentro y fuera de la muestra. Lo mismo ocurre en acciones difíciles de valorar. Las cifras son antes de costes en la versión de trabajo. | https://ideas.repec.org/a/bla/finmgt/v50y2021i1p107-137.html |
| Hudson y Urquhart (2021), «Technical trading and cryptocurrencies», *Annals of Operations Research* 297 | Casi 15.000 reglas de cinco familias. Encuentran capacidad predictiva en varias criptomonedas; en bitcoin, no la encuentran en el periodo fuera de muestra. | https://centaur.reading.ac.uk/85715 |
| Grobys, Ahmed y Sapkota (2020), «Technical trading rules in the cryptocurrency market», *Finance Research Letters* 32 | Medias móviles sobre las once criptomonedas más negociadas, 2016-2018. La regla de la media de 20 días funciona; excluyendo bitcoin, un exceso de rentabilidad del 8,76 % anual. Periodo corto. | https://osuva.uwasa.fi/handle/11111/619 |
| Deprez y Frömmel (2024), «Are simple technical trading rules profitable in bitcoin markets?», *International Review of Economics & Finance* 93 | 75.360 reglas sencillas, con costes y corrección por pruebas múltiples: algunas carteras de reglas superan a comprar y mantener fuera de la muestra, sobre todo en relación riesgo-rentabilidad. | https://ideas.repec.org/a/eee/reveco/v93y2024ipbp858-874.html |

### Lo que no ha superado las pruebas

| Fuente | Qué aporta | URL |
|---|---|---|
| Marshall, Young y Rose (2006), «Candlestick technical trading strategies: Can they create value for investors?», *Journal of Banking & Finance* 30(8) | Las figuras de velas japonesas no aportan valor: no hay indicios de que quien las sigue supere al mercado. | https://econpapers.repec.org/RePEc:eee:jbfina:v:30:y:2006:i:8:p:2303-2323 |
| Batchelor y Ramyar (2006), «Magic numbers in the Dow», Cass Business School | Dow Jones, 1914-2002: las ratios entre tendencias sucesivas no se agrupan en torno a las proporciones de Fibonacci más de lo que cabría esperar por azar. | https://openaccess.city.ac.uk/16276/ |

### Origen de los indicadores

- **RSI:** J. Welles Wilder, *New Concepts in Technical Trading Systems* (1978). 14 periodos y niveles de 70 y 30 por convención.
- **MACD:** Gerald Appel, finales de los años setenta. Medias exponenciales de 12 y 26 periodos y señal de 9.
- **Bandas de Bollinger:** John Bollinger, años ochenta. Media de 20 periodos y dos desviaciones típicas.

## 3 · Lo que NO se va a afirmar

- Que una figura, un indicador o un nivel «funcione» sin decir en qué estudio, en qué periodo y con qué costes.
- Tasas de acierto de patrones. Las que circulan no tienen fuente comprobable.
- Que la evidencia favorable en bitcoin garantice nada: son periodos cortos, de un mercado joven y casi siempre alcista.
- Precios actuales ni niveles concretos de ninguna moneda. Todos los gráficos del curso son ejemplos inventados.

## 4 · Estructura

5 módulos, 17 lecciones, 18 preguntas por banco de módulo y 40 en el final (25 por intento).

1. **Qué es y qué no es** — qué es el análisis técnico y qué dice la evidencia · leer un gráfico de velas · temporalidades.
2. **La estructura del precio** — tendencia · soportes y resistencias · rupturas y falsas rupturas · el volumen.
3. **Indicadores** — medias móviles · RSI · MACD y bandas de Bollinger · por qué más indicadores no es mejor.
4. **El humo** — patrones chartistas y figuras de velas · Fibonacci, ondas y números mágicos · los sesgos de quien mira gráficos.
5. **Método** — backtesting y sobreajuste · de una idea a una regla · tu método en una página.

## 5 · Términos nuevos del diccionario

`vela-japonesa`, `tendencia`, `temporalidad`, `ruptura`, `media-movil`, `rsi`, `macd`, `backtesting`. Ya existen y se enlazan: `soporte`, `resistencia`, `volumen`, `stop-loss`, `take-profit`, `volatilidad`, `r-multiplo`, `esperanza-matematica`, `win-rate`, `sesgo-de-confirmacion`, `plan-de-trading`, `diario-de-trading`.

## 6 · Portada

Objeto: una única vela japonesa de cristal translúcido, alta, con su mecha de metal satinado, de la que se desprende una voluta de humo que se deshace. Detalle: una rejilla tenue de gráfico detrás. Color `#a3e635`.
