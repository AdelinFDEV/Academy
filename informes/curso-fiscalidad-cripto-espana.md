# Informe · Curso «Fiscalidad cripto en España»

**Fecha de la investigación: 14-11-2026.** El temario (7 módulos, 24 lecciones) lo aprobó el admin el 06-10-2026, antes de que existiera `CURSOS.md`; el 14-11-2026 pidió terminar el curso entero y dejarlo listo para publicar. Este informe se escribió entonces, para que cada afirmación del curso tenga su fuente y su URL. Sustituye a la investigación previa que no llegó a guardarse.

## Decisiones tomadas a partir de la investigación

Lo que cambia respecto al temario y a las cuatro lecciones que ya estaban escritas:

1. **DAC8 no está transpuesta en España.** El Proyecto de Ley 121/000060 caducó al disolverse las Cortes (RD 806/2026, BOE 06-10-2026) y la orden de los modelos 042, 172, 175 y 721 sigue en proyecto. La lección 1.3 decía lo contrario y se ha corregido. El curso habla de los modelos 172, 173 y 721 vigentes y presenta DAC8 como directiva en vigor en la Unión y pendiente en España.
2. **El FIFO en criptomonedas es criterio administrativo por analogía** (art. 37.2 LIRPF, pensado para valores; DGT V1604-18, V0525-25, V1550-25), no texto de la ley. Se enseña como el método que aplica la AEAT y que hay que usar, diciendo de dónde sale.
3. **La sentencia del TSJ del País Vasco (37/2025, de 09-01-2025)** anuló una liquidación con FIFO global por falta de cobertura en la norma foral y no fijó otro método. Bizkaia y Gipuzkoa ya han llevado el FIFO a su norma con efectos 01-01-2025. No se afirma el territorio concreto del caso.
4. **La regla de la recompra en criptomonedas no tiene consulta de la DGT.** Que no se aplica la de dos meses es sólido (las cripto no son «valores»); que se aplica la de un año (art. 33.5.e) es interpretación prudente y mayoritaria, discutida. La lección 5.2 deja de titularse «un año, no dos meses» y lo explica así.
5. **Airdrops:** la consulta es la V0648-24, no la V1948-21 (que trata recompensas promocionales de un exchange). Corregido en la lección 1.2.
6. **Staking:** rendimiento del capital mobiliario también para el validador (V1766-22, V2388-24); se imputa cuando es exigible, es decir, cuando la recompensa queda disponible (V0612-26). El staking líquido es una permuta al entrar y al salir (V0612-26).
7. **Robos y estafas:** autor desconocido, pérdida inmediata en la base general; deudor identificado, crédito y art. 14.2.k LIRPF. La denuncia no abre por sí sola el plazo de un año.
8. **Sanciones del modelo 721:** régimen general de los arts. 198 y 199 LGT (inferido del 720; la AEAT no lo dice expresamente para el 721).
9. **Autoliquidación rectificativa** en IRPF desde Renta 2024 (Orden HAC/242/2025); para 2023 y anteriores, complementaria o solicitud de rectificación.
10. **Examen final:** banco de 40 preguntas, salen 25 (`CURSOS.md` §8). **Orden en el catálogo:** 8 (el 1 lo tiene psicología).
11. **Donde no hay criterio publicado se dice que no lo hay** (minería en IRPF, hard forks, tokens LP, puentes, pérdida de claves, tarjeta cripto, gas como transmisión). El curso da la lectura prudente y la etiqueta como tal.

Paleta: dorado `#e6b455`. Logro: «Contribuyente Blindado». Aviso: `fiscal`. Sin código nuevo.

## Pendiente de recomprobar antes de cada campaña

- Estado de la transposición de DAC8 y de la orden de los modelos 042/172/175/721.
- Interés de demora (4,0625 % mientras no haya nueva Ley de Presupuestos).
- Límites de la obligación de declarar del ejercicio 2026 y fechas de la campaña de 2027.
- Firmeza de la STSJPV 37/2025.
- Leer en la web de la DGT las consultas marcadas como «dos fuentes secundarias» (V1604-18, V1550-25).

---

# Investigación A — Módulos 2 y 5 de «Fiscalidad cripto en España»

Fecha de la consulta de fuentes: 14-11-2026. Ámbito: IRPF, personas físicas, territorio común.

**Etiquetas.** `[P]` VERIFICADO EN FUENTE PRIMARIA (BOE, sede AEAT, boletín foral o texto íntegro de la sentencia leído hoy) · `[2S]` VERIFICADO EN DOS FUENTES SECUNDARIAS profesionales independientes · `[NV]` NO VERIFICADO.

**Aviso de método.** El buscador de la DGT (petete.tributos.hacienda.gob.es) no devuelve texto a una herramienta automática, así que **ninguna consulta de la DGT se ha leído en su web oficial**. Las que llevan `[2S]` están contrastadas con: (a) el artículo de D. Monteseirín (Subdirector de la AEAT) en *Cuadernos de Formación* del Instituto de Estudios Fiscales, vol. 31/2025, que lista número, fecha y criterio; (b) la transcripción literal que hace el TSJPV en su sentencia; (c) despachos (Cuatrecasas, GA-P, KPMG) o bases jurídicas (CEF, Primera Lectura, SuperContable). Antes de publicar conviene abrir a mano V1604-18, V0648-24 y V1550-25.

URL que se repiten:
- LIRPF consolidada (última actualización 11-11-2026): https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764
- Análisis de modificaciones de la LIRPF: https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764&tn=6
- Manual Renta 2025, monedas virtuales (inversor): https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c11-ganancias-perdidas-patrimoniales/monedas-virtuales/compra-venta-monedas-virtuales-tributacion-inversor.html
- Ayuda Renta Web 2025, monedas virtuales: https://sede.agenciatributaria.gob.es/Sede/Ayuda/25Presentacion/100/7_6_6_2/ganancias_perdidas_monedas_virtuales.html
- IEF, Monteseirín: https://www.ief.es/docs/destacados/publicaciones/revistas/cf/31_08.pdf

---

## MÓDULO 2

### 1. Valor de adquisición y de transmisión

**1.1 Regla general** `[P]`. Art. 34.1.a): la ganancia o pérdida es la diferencia entre valor de transmisión y de adquisición. Art. 35.1: el valor de adquisición es el importe real más «gastos y tributos inherentes a la adquisición, excluidos los intereses». Art. 35.2: el de transmisión es el importe real de la enajenación menos esos gastos y tributos «en cuanto resulten satisfechos por el transmitente»; vale el importe efectivo siempre que «no resulte inferior al normal de mercado, en cuyo caso prevalecerá éste». Fuente: BOE.

**1.2 Permuta cripto-cripto** `[P]`. Art. 37.1.h): diferencia entre el valor de adquisición de lo entregado y **el mayor** de (i) valor de mercado de lo entregado, (ii) valor de mercado de lo recibido. El Manual de Renta 2025 lo aplica expresamente al intercambio entre monedas virtuales y añade que el valor de adquisición de la moneda recibida es el que se tomó como valor de transmisión en la permuta. Consultas que lo sostienen: V0999-18 (18-04-2018), V1149-18 (08-05-2018), V1948-21 (21-06-2021), V2005-22 (20-09-2022), V2520-22 (07-12-2022) `[2S: IEF + Cuatrecasas]`.

**1.3 Qué cotización usar** `[2S]` con matiz. No hay cotización oficial. El criterio de V0999-18 que recogen Manual AEAT y doctrina es que el valor de mercado es el precio que acordarían sujetos independientes en el momento de la permuta, y que su acreditación es cuestión de hecho, por cualquier medio de prueba admitido en Derecho. La DGT **no impone** un exchange ni una hora concreta. El literal de V0999-18 no se ha podido leer hoy: no entrecomillarlo.

**1.4 Comisiones del exchange** `[2S]`. V1604-18 (11-06-2018): las comisiones de la casa de cambio aumentan el valor de adquisición y reducen el de transmisión, por tener relación directa con la operación y si las paga el contribuyente (IEF; Cuatrecasas, *Cuadernos de Derecho y Comercio* 2018). La ayuda de Renta Web 2025 dice lo mismo: son computables los gastos «directamente relacionados» `[P]`.

**1.5 Gas y comisión de retirada** `[2S]`. V0648-24 (11-04-2024): *trading fees*, *gas fees* y *withdrawal fees* son computables en los valores de adquisición y transmisión (art. 35) **solo si se originan por una compraventa o permuta** y guardan relación directa con ella (IEF + Primera Lectura). Sobre comisiones de *bridges* la DGT **no se pronunció** por falta de información. Sobre «otras comisiones», el propio IEF dice que hay que analizar caso por caso.

**1.6 Comisión pagada en cripto: ¿es en sí una transmisión?** `[NV]`. No he localizado consulta que diga que entregar ETH como gas es una transmisión autónoma con su ganancia o pérdida. Se deduce del art. 33.1 (sale un bien a cambio de un servicio), pero es **interpretación doctrinal**. Y una retirada o traspaso a wallet propia no ligado a compraventa queda fuera de lo que cubre V0648-24: su comisión no tiene criterio administrativo.

### 2. FIFO

**2.1 Base legal real** `[P]`. El art. 37.2 LIRPF solo dice FIFO para **valores** homogéneos (acciones, participaciones, IIC). **La ley no menciona criptomonedas**: la versión de 11-11-2026 no contiene ninguna letra sobre criptoactivos en los arts. 33 ni 37. El FIFO en cripto es **criterio administrativo por analogía**, no norma con rango de ley.

**2.2 Consultas** `[2S]`. V1604-18 (11-06-2018): las unidades o fracciones de bitcoin son «bienes homogéneos»; como la LIRPF «no establece una regla específica diferente», se aplica por remisión a los arts. 37.2 y 54.5 que se transmiten las adquiridas en primer lugar. Reiteran: V0975-22 (04-05-2022), V2005-22 (20-09-2022), V2520-22 (07-12-2022), V0648-24 (11-04-2024). Los párrafos de V1604-18 y V0975-22 están transcritos literalmente en la sentencia del TSJPV (ver 2.5).

**2.3 Por moneda y global entre plataformas** `[2S]`. V1604-18: que se compren y vendan en distintos exchanges «no constituye una circunstancia que altere la homogeneidad»; hay que contar todos los bitcoin «sin distinguir en función de las diferentes casas de cambio». V0975-22: el cálculo es independiente «para cada tipo de criptomoneda». **V1550-25 (03-09-2025)**: FIFO «sin distinguir por la plataforma» (SuperContable + Tirant Prime). La ayuda de Renta Web 2025 lo recoge: FIFO aunque las operaciones se hagan en distintas casas de cambio `[P]`. Ninguna consulta localizada habla expresamente de wallets de autocustodia; la lógica es la misma.

**2.4 Giro de 2025** `[2S]`. V0525-25 (28-03-2025): las criptomonedas **no son «valores homogéneos»** del art. 8 del Reglamento del IRPF (no son valores emitidos por una entidad), pero sí «bienes homogéneos» por fungibles, y se mantiene el FIFO (KPMG + Primera Lectura). Importa para el punto 6.

**2.5 La sentencia del TSJ del País Vasco: existe** `[P]` (texto íntegro leído, reproducción CEF del CENDOJ: https://www.fiscal-impuestos.com/sites/fiscal-impuestos.com/files/STSJPV-75-2024.pdf).
- **STSJ País Vasco, Sala de lo Contencioso-Administrativo, Sección 1.ª, n.º 37/2025, de 9 de enero de 2025, rec. 75/2024.** Ponente: Juan Alberto Fernández Fernández. ECLI:ES:TSJPV:2025:41 (el ECLI solo en secundarias `[2S]`).
- **Caso:** IRPF 2017, bitcoin y ether, cuantía 296.189,66 €. La Inspección aplicó FIFO global (wallets y exchanges juntos); los contribuyentes habían aplicado FIFO **por exchange**.
- **Qué resolvió:** estima el recurso y **anula la liquidación**. Las criptomonedas «malamente pueden subsumirse» en el art. 47.1 de la Norma Foral ni en el concepto reglamentario de valores homogéneos; extenderlo carece de cobertura en la Norma Foral (reserva de ley); y «no puede aplicarse al caso» el criterio de las consultas de la DGT.
- **Qué no resolvió:** no fija un método alternativo. Remite a la regla general (valor de transmisión menos valor de adquisición) y dice que la autoliquidación no puede revisarse con soluciones no amparadas por la norma foral. No valida el precio medio ni el LIFO.
- **Advertencia para citarla:** el texto anonimizado es incoherente sobre el territorio. Habla del TEAF y la NFGT «de Bizkaia», pero la demandada es la Diputación Foral de Gipuzkoa y la norma y el reglamento citados (NF 3/2014, DF 33/2014) son de Gipuzkoa. Cuatrecasas la atribuye a Gipuzkoa; GA-P, a Bizkaia. **No afirmar el territorio como hecho.**
- **Firmeza** `[NV]`: cabía casación (TS o el propio TSJPV, 30 días). No he encontrado auto de admisión ni sentencia del Supremo. GA-P (26-03-2025) la daba como «pendiente de firmeza».
- **Otras dos sentencias** (20-03-2025, ECLI:ES:TSJPV:2025:1078, y 22-04-2025, ECLI:ES:TSJPV:2025:1712) `[NV]`: una sola fuente secundaria.
- **Alcance:** interpreta normativa **foral**. No vincula a la AEAT ni a la DGT. El art. 37.2 LIRPF tiene redacción análoga, por eso es argumento alegable en territorio común, pero **la DGT reiteró el FIFO después** (V0525-25 y V1550-25) y la AEAT lo mantiene en el Manual 2025. En territorio común: **criterio administrativo vigente, discutido en la doctrina, sin jurisprudencia del Supremo.**

**2.6 Reacción foral: el FIFO ya está en la norma, con efectos 1-1-2025.**
- **Bizkaia** `[P]`: Norma Foral 6/2025, de 12 de diciembre (BOB 15-12-2025), disp. final segunda. Modifica la NF 13/2013: nuevo art. 47.1.p) (valoración), art. 47.2 (con «criptoactivos fungibles del mismo tipo, se considerará que los transmitidos […] son aquellos que adquirió en primer lugar») y nuevo art. 43.i): no se computan las pérdidas de criptoactivos fungibles si se adquieren activos del mismo tipo «dentro de los dos meses anteriores o posteriores». https://www.bizkaia.eus/documents/880307/15187815/ca_6_2025.pdf/b3f84d9e-89c2-d0d2-d378-7d46236f3c6c
- **Gipuzkoa** `[2S]`: Norma Foral 2/2025, de 24 de noviembre (BOG 28-11-2025). Mismo esquema: art. 47.1.e), art. 47.2 (FIFO), art. 43.i) (dos meses), efectos 1-1-2025 (vLex, CEF). Lefebvre dice «12 meses»: parece errata, pero confirmar en el BOG. https://vlex.es/vid/norma-foral-2-2025-1103338592
- **Álava y Navarra** `[NV]`.
- **Consecuencia:** la sentencia vale hoy para **ejercicios forales anteriores a 2025**. La diferencia foral viva en 2025-2026 es otra: **en Bizkaia y Gipuzkoa la recompra de cripto tiene regla expresa de dos meses**; en territorio común no hay regla expresa.

### 3. Imputación temporal

**3.1** `[P]`. Art. 14.1.c): se imputan al período en que tenga lugar la alteración patrimonial. Manual 2025: en el período en que se entregan las monedas, «con independencia» de cuándo se cobre.

**3.2** `[2S]`. V0808-18 (22-03-2018) y V2412-22 (22-11-2022): la alteración se produce con la entrega (teoría del título y el modo). El IEF cita V0808-18 en el texto y «V0818-18» en la bibliografía: es errata, la correcta es V0808-18.

**3.3 Ventas a plazo: el temario dice que «no aplican» y no es exacto.** V0808-18 deja a salvo la regla de operaciones a plazos, y la ayuda de Renta Web 2025 `[P]` dice que en operaciones a plazos puede optarse por imputar según sean exigibles los cobros. Art. 14.2.d): exige que entre la entrega y el último plazo pase **más de un año**. Lo correcto: es opcional, existe, y es irrelevante en la operativa normal de un exchange. (El IEF cita «14.2.c)»: errata.)

**3.4 Fracciones** `[2S]`. La DGT las define como bienes «computables por unidades o fracciones de unidades»: el FIFO se aplica a fracciones, consumiendo lotes parcialmente.

### 4. Wallets propias y tarjeta cripto

**4.1 Transferencia entre wallets propias** `[NV]` como criterio DGT. **No he localizado consulta que lo diga expresamente**; ni V0648-24 ni V1550-25 lo abordan. La no sujeción se apoya en el art. 33.1 (no cambia la composición del patrimonio) y en que la AEAT declara no sujetas la compra y la mera tenencia (Informador Renta 2025; V2012-21 y V2843-21 según IEF). En el curso: «consecuencia directa del art. 33.1», no «la DGT ha dicho».

**4.2 Tarjeta cripto** `[P de que no hay criterio]`. El artículo del IEF lo incluye en «aspectos sobre los que **no se ha pronunciado** la DGT». Opinión del autor: debe calificarse como venta de monedas virtuales, con ganancia o pérdida. Es doctrina cualificada, no consulta. Rankia atribuye el criterio a «V0935-25», pero esa consulta trata de un inmueble pagado en bitcoin a efectos de ITP: **no usar**.

---

## MÓDULO 5

### 5. Compensación

**5.1 Base del ahorro, art. 49.1** `[P]` (BOE + Manual 2025, cap. 12: https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c12-integracion-compensacion-rentas/reglas-integracion-compensacion-rentas/integracion-compensacion-rentas-base-imponible-ahorro.html). Orden:
1. Ganancias y pérdidas por transmisión se compensan entre sí; rendimientos del capital mobiliario del ahorro, entre sí.
2. Saldo negativo de ganancias y pérdidas: contra el saldo positivo de rendimientos del capital mobiliario del mismo año, con límite del **25 % de ese saldo positivo**. Y a la inversa.
3. El resto, en los **cuatro años siguientes**, en el mismo orden.
4. Pendientes de años anteriores (en Renta 2025: 2021-2024): primero contra el saldo positivo de **su misma clase**; después, cruzados, sin superar el 25 % **conjunto** con lo cruzado del propio ejercicio.
5. Art. 49.2: en la **cuantía máxima** que permita cada año; no puede hacerse fuera de plazo acumulándolas a pérdidas posteriores.

**5.2 Base general, art. 48** `[P]`. Las ganancias y pérdidas **no derivadas de transmisiones** se compensan entre sí; el saldo negativo, contra el saldo positivo de rendimientos e imputaciones con límite del 25 %; el resto, cuatro años. No hay comunicación entre base general y del ahorro (art. 47).

**5.3 El 25 % en 2025 y 2026** `[P]`. El BOE no registra ninguna modificación de los arts. 48 y 49 en 2025 ni en 2026; el Manual 2025 (17-03-2026) aplica el 25 %.

### 6. Regla de la recompra (art. 33.5)

**6.1 Texto** `[P]` (paráfrasis fiel; copiar el literal del BOE al maquetar). No se computan las pérdidas:
- **e)** de transmisiones de **elementos patrimoniales**, cuando el transmitente «vuelva a adquirirlos dentro del año siguiente a la fecha de dicha transmisión». Solo recompra **posterior**. La pérdida se integra «cuando se produzca la posterior transmisión del elemento patrimonial».
- **f)** de **valores o participaciones admitidos a negociación** en mercados secundarios oficiales, si se adquieren **valores homogéneos** en los **dos meses anteriores o posteriores**.
- **g)** de **valores o participaciones no admitidos a negociación**, si se adquieren valores homogéneos en el **año anterior o posterior**.
- Párrafo final: en f) y g), las pérdidas se integran «a medida que se transmitan los valores o participaciones que permanezcan en el patrimonio del contribuyente».

**6.2 ¿Cuál aplica a cripto? No hay criterio administrativo publicado** `[P de la ausencia en la AEAT; 2S de la ausencia en la DGT]`.
- La página del Manual 2025 sobre pérdidas que no se computan **no menciona las monedas virtuales**. La sección de monedas virtuales no menciona el art. 33.5. La ayuda de Renta Web 2025 tampoco.
- **No he localizado consulta de la DGT** que aplique la letra e), f) o g) a criptomonedas. Tres fuentes profesionales afirman que no existe (Pérez Pombo, 2023; rentaxml, 13-05-2026; marianosevilla.com). La atribución a V1766-22 que hace un TFG de la UNIR no se confirma: esa consulta trata del *staking*.
- **Antecedente clave** `[2S: iusAsesor/Informática Diaria 03-04-2023 + Legalmon]`: el programa de la AEAT para Renta 2022 incluyó una casilla «no imputación de pérdidas por recompra de monedas virtuales homogéneas» y **la versión final de la orden publicada en el BOE la eliminó**, sin explicación. La AEAT lo intentó y se echó atrás.
- **Estado doctrinal: discutido.** (i) f) y g) no aplican porque exigen «valores», y la V0525-25 niega que las cripto lo sean: posición sólida. (ii) Que aplique la e) lo sostiene parte de la doctrina (PwC, 11-02-2022: «de acuerdo con ciertas opiniones doctrinales, podría»); otra parte objeta que la e) exige volver a adquirir **el mismo** elemento («adquirirlos») y que extenderla a unidades fungibles distintas es analogía de una norma antiabuso (Pérez Pombo; Coello de Portugal). (iii) rentaxml concluye que hoy la pérdida se computa por la regla general.

**6.3 Mecánica si se aplica la e).** La pérdida se declara y cuantifica el año en que se genera, pero no se integra hasta la transmisión posterior del elemento recomprado (Manual 2025 `[P]`: https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c11-ganancias-perdidas-patrimoniales/ganancias-perdidas-patrimoniales-que-no-bi/perdidas-patrimoniales-que-no-se-tales.html). La integración «a medida que se transmitan» los homogéneos que quedan es literal de f) y g), **no de e)**; cómo casa la e) con el FIFO en un bien fungible no está resuelto por nadie `[NV]`.

### 7. Escala del ahorro

`[P]` Art. 66.1 (estatal) y art. 76 (autonómica), Manual 2025: 9,5 / 10,5 / 11,5 / 13,5 / 15 % cada una, con tramos 6.000 / 50.000 / 200.000 / 300.000 €. Suma: **19 / 21 / 23 / 27 / 30 %**. La Ley 7/2024, de 20 de diciembre (BOE-A-2024-26694), modificó los arts. 66, 76 y 93 con efectos 1-1-2025. **2026:** el BOE no registra ninguna norma de 2025 o 2026 que toque los arts. 66 o 76. A 14-11-2026, sin cambios. https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c15-calculo-impuesto-determinacion-cuotas-integras/gravamen-base-liquidable-ahorro/gravamen-estatal.html

Matiz: esa escala es la del **territorio común**; País Vasco y Navarra tienen la suya.

### 8. Planificación de fin de año

- **Aflorar pérdidas antes del 31-12** `[P]`: legítimo; se imputan por fecha de entrega (art. 14.1.c).
- **Repartir ganancias entre ejercicios** `[P]`: la escala es progresiva y anual; vender parte en diciembre y parte en enero es economía de opción.
- **Pérdidas que caducan** `[P]`: cuatro años y cuantía máxima obligatoria (art. 49.2). En Renta 2026 es el último año para las de 2022.
- **Realizar ganancias para absorber pérdidas a punto de caducar y recomprar**: no hay regla antiaplicación para ganancias; el coste se actualiza. Es lógica del sistema, sin fuente que lo diga `[NV]`.
- **Límite 1, recompra**: riesgo no resuelto en territorio común (6.2); regla expresa de dos meses en Bizkaia y Gipuzkoa desde 2025 (2.6).
- **Límite 2, conflicto en la aplicación de la norma** `[P]`, art. 15 LGT (https://www.boe.es/buscar/act.php?id=BOE-A-2003-23186): actos «notoriamente artificiosos o impropios» sin efectos relevantes distintos del ahorro fiscal; exige informe de la Comisión consultiva; se liquida la cuota eludida con intereses. Art. 16 (simulación): intereses y sanción. No he localizado ningún caso publicado en que se aplique a compraventas de cripto `[NV]`.


---

# Investigación B · Módulos 3 y 4 de «Fiscalidad cripto en España»

Cerrada el 14-11-2026. IRPF, personas físicas, territorio común.

## Cómo se ha verificado

- **Consultas DGT**: leídas en texto íntegro en la base oficial de la DGT (`petete.tributos.hacienda.gob.es`), consultando el buscador por número y por texto libre. Enlace a cada una: `https://petete.tributos.hacienda.gob.es/consultas/?num_consulta=VXXXX-AA` (el enlace abre el buscador con el número cargado). Los textos descargados están en `C:\Users\George\AppData\Local\Temp\claude\87bcff7fc40375e4\905c6c68-0f8f-4a5f-a662-3c92a7bcbbda\scratchpad\dgt\`.
- **Normas**: texto consolidado del BOE. LIRPF: https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764 · Ley 29/1987 (ISD): https://www.boe.es/buscar/act.php?id=BOE-A-1987-28141 · Ley 22/2009 (cesión de tributos): https://www.boe.es/buscar/act.php?id=BOE-A-2009-20375
- **«Sin criterio»** significa: búsqueda por texto libre en la base de la DGT sin resultados (términos probados entre paréntesis). No prueba que no exista nada con otra redacción.
- Etiquetas: **[P]** verificado en fuente primaria · **[2S]** dos fuentes secundarias · **[NV]** no verificado.
- No se ha buscado jurisprudencia (TEAC, TSJ, TS) ni normativa autonómica del ISD.

---

## MÓDULO 3 — Rentas que no son ventas

### 1. Staking

| Consulta | Fecha | Supuesto |
|---|---|---|
| V1766-22 | 26/07/2022 | El consultante actúa como **validador** (ETH) |
| V0648-24 | 11/04/2024 | Inversor que delega en un validador; comisiones y penalizaciones |
| V2388-24 | 21/11/2024 | Artista con staking al margen de su actividad |
| V1551-25 | 03/09/2025 | Staking como inversión |
| V0612-26 | 17/03/2026 | Staking en exchange, nativo y **líquido** |
| V5017-26 | 05/06/2026 | Staking; incluye IVA |

**1.1 Calificación [P].** Las recompensas son «rendimientos íntegros del capital mobiliario obtenidos por la cesión a terceros de capitales propios satisfechos en especie», art. 25.2 LIRPF, y van a la base del ahorro (arts. 46 y 49). Lo dicen las seis consultas.

**1.2 Valoración [P].** Valor de mercado en euros el día de la percepción (art. 43.1 LIRPF). Para lo cobrado en un mismo día se admite el cambio medio de ese día (V1766-22, V2388-24).

**1.3 Cuándo se devenga: matiz importante [P].** V0612-26 aplica el art. 14.1.a) (exigibilidad). En staking nativo, mientras la recompensa sea «una magnitud calculada internamente por el contrato inteligente» de la que no se puede disponer, no es exigible; se entiende obtenida cuando se acredita en un monedero del que el contribuyente puede disponer, que en el caso consultado era al hacer la reclamación (*claim*). No es exacto decir que siempre tributa «al generarse».

**1.4 Gastos [P].**
- No se deducen los gastos de administración y depósito del art. 26.1.a), porque los criptoactivos no son valores negociables (V1766-22, V0648-24, V1551-25).
- La comisión pagada al validador («comisión de acuñación») no es deducible, pero forma parte del valor de adquisición de las monedas recibidas si está directamente relacionada con ellas (V0648-24, art. 35.1).
- La penalización por desbloqueo anticipado es menor rendimiento íntegro (V0648-24).

**1.5 Retención [P].** Renta sujeta a retención en principio (art. 75.1.b RIRPF), pero si la recompensa viene del propio sistema no hay obligado a retener (art. 76 RIRPF) (V1766-22). No se pronuncia sobre el staking en un exchange.

**1.6 Valor de adquisición de lo recibido [P parcial].** Ninguna consulta de staking dice literalmente «el valor de adquisición es el valor por el que tributó». Se desprende de V0648-24 (la comisión «formará parte del valor de adquisición de los citados nuevos criptoactivos») y lo dice de forma expresa V5017-26, pero para las incorporaciones del art. 37.1.l), no para el staking. Redactarlo como consecuencia de los arts. 35 y 43, no como cita de una consulta.

**1.7 Si luego caen de precio [P en norma].** Ninguna consulta permite corregir el rendimiento ya devengado. La venta posterior da ganancia o pérdida patrimonial en la base del ahorro (V5017-26), y el saldo negativo de ganancias y pérdidas solo se compensa con rendimientos del capital mobiliario hasta el 25 % de su saldo positivo, con cuatro años para el resto (art. 49.1 LIRPF).

**1.8 Validar por cuenta propia: ¿actividad económica? [P].** No, en los casos analizados. El consultante de V1766-22 **era validador**, y la DGT descartó la actividad económica: se limita a mantener bloqueados criptoactivos, solo valida si el protocolo lo elige al azar y lo hace automáticamente con recursos mínimos. V2388-24: «ya actúe el consultante como validador propiamente dicho o como inversor», es capital mobiliario. V0612-26 lo extiende a la delegación. **Matiz:** la DGT recuerda que la ordenación de medios se valora «en cada caso concreto». No hay consulta sobre un operador con infraestructura que valide para terceros como negocio.

**1.9 Staking líquido [P].** V0612-26 (ETH por rETH): son «criptoactivos de distinto tipo»; tanto el cambio inicial como el inverso «constituyen permutas» con ganancia o pérdida en la base del ahorro (arts. 33.1, 34, 35 y 37.1.h). **La «V0612-26» que el repo cita por resúmenes existe y dice eso.** No se pronuncia sobre los tokens cuyo saldo crece (tipo stETH); el caso es un token que incorpora la recompensa en su precio.

**1.10 IVA [P].** Sin condición de empresario, no sujeto; para empresarios o profesionales, sujeto y exento (art. 20.Uno.18.º LIVA) (V5017-26).

### 2. Lending y cuentas «earn»

**2.1 Calificación [P].** V0648-24, apartado 5: los rendimientos por depositar criptoactivos para que la plataforma los preste, y también los generados por los criptoactivos entregados en garantía cuando uno es prestatario, son rendimientos del capital mobiliario del art. 25.2, base del ahorro. Apartado 2: igual para los rendimientos de *liquidity pools* y de plataformas de optimización, valorados el día de la percepción (art. 43.1).

**2.2 Lo que se paga por tomar prestado [P].** Las comisiones e intereses (*borrowing fees*) no son deducibles de los rendimientos del colateral (V0648-24).

**2.3 ¿Ceder las monedas es una transmisión? SIN CRITERIO EXPRESO.** V0648-24 califica los rendimientos y no analiza el depósito. Sobre los LP tokens dice que su obtención y reembolso es «cuestión que excede de la consulta planteada». Pero V0612-26 trata como permuta la entrega de ETH a cambio de un token representativo (rETH). **Discutido:** si el mismo razonamiento alcanza a aTokens, cTokens o LP tokens. Enseñarlo como riesgo, no como regla.

**2.4 Cuentas «earn» de un exchange.** Sin consulta propia (probados: «lending», «yield», «criptomonedas intereses préstamo»). V2005-22 (20/09/2022) recibió una pregunta sobre «plataformas para generar ingresos pasivos» y no se pronunció por falta de información. Lo más cercano: V0612-26, primer supuesto (staking en exchange).

### 3. Airdrops, promociones, referidos, cashback, forks

**3.1 Airdrops [P].** V0648-24, apartado 4: salvo relación laboral o actividad económica, se aplica el art. 37.1.l) («incorporaciones de bienes o derechos que no deriven de una transmisión»): ganancia patrimonial por el valor de mercado en euros, en el periodo en que se reciben, en la **base general** (arts. 45, 46 y 48). La definición de la DGT ya incluye el airdrop que «requiere que éstos participen en determinadas actividades promocionales».

**3.2 «Learn and earn» [P].** V1948-21 (21/06/2021) **no trata de airdrops**: son recompensas (ALGO, COMP, BAND) por compartir enlaces, ver vídeos y hacer tutoriales de un exchange. Mismo resultado: art. 37.1.l), base general.

**3.3 Tokens sin mercado [P].** V5017-26: monedas obtenidas por ver un anuncio diario en una app, sin red pública ni cotización. No es actividad económica; es art. 37.1.l) y base general, pero solo «en la medida en que los criptoactivos recibidos sean susceptibles de valoración económica y pueda determinarse su valor de mercado en euros». Fijar ese valor es cuestión de prueba. El valor de adquisición posterior es el valor integrado en la base general.

**3.4 Airdrop a un profesional [P].** V2388-24: los airdrops que un artista recibe de los *marketplaces* donde vende, en relación con su actividad, son rendimientos en especie de la actividad económica.

**3.5 Referidos, bono de bienvenida, cashback de tarjeta.** SIN CONSULTA específica (probados: «referidos», «cashback», «bono bienvenida», «promoción», «premio»). El art. 37.1.l) cabe por analogía con V1948-21; decir que es analogía. **[NV]**

**3.6 Hard forks.** SIN CRITERIO («fork» y «bifurcación» no devuelven nada). Varios resúmenes atribuyen a V0648-24 una clasificación de airdrops que incluye forks: **el texto oficial no la contiene.** **[NV]**

### 4. Minería y trading

**4.1 Minería, IVA [P].** V3625-16 (31/08/2016), V1748-18 (18/06/2018) y V1274-20 (06/05/2020): no sujeta, por falta de relación directa entre servicio y contraprestación (doctrina Tolsma, TJUE). Por eso no da derecho a deducir el IVA soportado.

**4.2 Minería, IAE [P].** V3625-16: actividad económica; se clasifica provisionalmente en el epígrafe 831.9, sección primera, «Otros servicios financieros n.c.o.p.». Las consultas de Tributos Locales posteriores (V2012-21, 06/07/2021; V2843-21, 16/11/2021; V0213-23, 09/02/2023) refieren el alta al caso en que se «preste servicios a terceros […] de minado». V2843-21 añade que estaría sujeto pero exento (art. 82.1.c TRLRHL).

**4.3 Minería, IRPF.** **No he encontrado consulta de la DGT que califique en IRPF las monedas minadas.** La calificación como actividad económica (art. 27.1, base general, gastos deducibles) es deducción a partir de las consultas de IAE. **[NV como criterio expreso]**. Tampoco he verificado el alta censal (modelo 036) ni los gastos concretos.

**4.4 Cuándo no es actividad económica [P].** V5017-26: la «minería» desde una app (ver un anuncio) no lo es; va por el art. 37.1.l).

**4.5 Trading con dinero propio [P].** IAE: comprar y vender «para sí mismo», sin intervenir en el mercado, no es actividad económica (V2012-21, V2843-21, V0213-23, V1543-25 de 26/08/2025). IVA: V0889-26 (22/04/2026), operativa P2P para aprovechar las fluctuaciones, no confiere la condición de empresario. **Matiz:** en IRPF la DGT parte de la premisa declarada por el consultante («al margen de una actividad económica»); no hay consulta que fije un umbral de volumen o frecuencia.

### 5. Donaciones y herencias

Sin consulta específica de cripto (probados: «criptomonedas donación», «herencia», «heredero», «donatario», «causante», «regalo»). Todo es norma general. **[P en norma]**

- **Donante.** Hay alteración patrimonial; el art. 34.1.a) incluye la transmisión lucrativa. El art. 36 toma como valor de transmisión el que resulte de las normas del ISD, sin exceder del de mercado. La ganancia va a la base del ahorro (art. 46.b).
- **Pérdida del donante.** No se computa: art. 33.5.c), «las debidas a transmisiones lucrativas por actos ínter vivos o a liberalidades».
- **Donatario.** ISD, art. 3.1.b) Ley 29/1987; base imponible, el valor de mercado (art. 9). Punto de conexión para bienes que no son inmuebles: la comunidad donde el donatario tenga su residencia habitual (art. 32.2.c Ley 22/2009), medida por el mayor número de días de los cinco años anteriores (art. 28.1.1.º.b).
- **Herencia.** Para el fallecido no hay ganancia ni pérdida (art. 33.3.b). El heredero paga ISD (art. 3.1.a); punto de conexión: residencia habitual del causante (art. 32.2.a Ley 22/2009). Su valor de adquisición es el que resulte de las normas del ISD, sin exceder del de mercado (art. 36).
- **Matices.** Que las criptomonedas sean «los demás bienes y derechos» a efectos del punto de conexión es la lectura natural, pero no la confirma ninguna consulta. Cómo se acredita el valor de mercado en el ISD: sin criterio. Bonificaciones autonómicas: no investigadas.

---

## MÓDULO 4 — Los casos difíciles

### 6. DeFi

Hay una sola consulta de DeFi propiamente dicha: **V0648-24 (11/04/2024)**, más **V0612-26 (17/03/2026)** para el staking líquido y **V2513-25 (16/12/2025)** para la migración de tokens. **[P]**

| Operación | Criterio | Fuente |
|---|---|---|
| Rendimientos de *liquidity pools* | Capital mobiliario, art. 25.2, base del ahorro, valor del día de percepción | V0648-24 ap. 2 |
| Optimizadores de rendimiento | Igual | V0648-24 ap. 2 |
| Intereses por prestar | Igual | V0648-24 ap. 5 |
| Rendimiento del colateral | Igual | V0648-24 ap. 5 |
| *Borrowing fees* | No deducibles | V0648-24 ap. 5 |
| *Trading fees* y *gas* de una compraventa o permuta | Computan en el valor de adquisición o de transmisión (art. 35) si guardan relación directa | V0648-24 ap. 1 |
| Comisión de retirada | Ligada a una venta o permuta: art. 35. Entre monederos propios: «irrelevante» | V0648-24 ap. 6 |
| Token de staking líquido | Permuta al entrar y al salir | V0612-26 |
| Cambio de un token por otro por reestructuración del proyecto | Permuta (art. 37.1.h) | V2513-25 |

**Sin criterio publicado:**
- Obtención y reembolso de **LP tokens**: «excede de la consulta planteada».
- **Bridges y wrapped tokens**: V0648-24 los describe, pero «no procede pronunciarse» sobre sus comisiones; no dice si envolver o puentear es permuta.
- **Depósito en un protocolo de préstamo** como transmisión, y tokens recibidos a cambio.
- **Pérdida impermanente.**
- **Liquidación del colateral.**
- Tokens de **gobernanza** y recompensas de *liquidity mining*.
- Derivados y perpetuos, stablecoins como categoría, *restaking*, tokens de saldo creciente.

(Probados: «DeFi», «wrapped», «bridge», «colateral», «liquidación», «token gobernanza», «stablecoin», «yield», «apalancamiento».)

**Corrección al temario.** «Lo que dijo la DGT en 2024» es exacto para V0648-24, pero en 2026 hay que añadir V0612-26: es el primer pronunciamiento que trata como permuta el cambio de una moneda por un token representativo.

### 7. NFT

**7.1 IVA [P].** V0486-22 (10/03/2022): lo que se transmite es el certificado digital, no el archivo; es un servicio prestado por vía electrónica y, si se localiza en territorio de aplicación del impuesto, tributa al 21 %. Reiterado en V2274-22 (27/10/2022), V1753-23 (15/06/2023, plataformas) y V0138-25 (12/02/2025). El 21 % no es universal: depende de las reglas de localización y de que el vendedor sea empresario o profesional.

**7.2 IRPF del creador [P].** V0138-25: los rendimientos por vender NFT en el ejercicio de la actividad son rendimientos de actividades económicas, base general. V2388-24: el gasto de acuñación exigido por la plataforma es deducible si se cumple la correlación con los ingresos.

**7.3 IRPF del coleccionista que revende.** Sin consulta específica («NFT ganancia patrimonial» no devuelve nada). Ganancia patrimonial por transmisión en la base del ahorro es la regla general, no un criterio publicado. Pagar un NFT con ETH es además una permuta del ETH (doctrina general de permutas). **[NV como criterio expreso]**

**7.4 Regalías.** Ninguna de las cinco consultas de NFT las menciona. **[NV]**

### 8. Robos, estafas, claves perdidas, plataformas quebradas

La DGT distingue dos supuestos, y de cuál se trate depende todo.

**8.1 Hay un deudor identificable: derecho de crédito [P].**
- V2603-15 (08/09/2015): transferencias a una plataforma de bitcoin con sede en Japón que quiebra en febrero de 2014 (no la nombra; es el patrón de Mt. Gox). El crédito no devuelto «no constituye de forma automática una pérdida patrimonial»; la pérdida es de base general (arts. 45 y 48).
- V1098-20 (28/04/2020): inversión con empresa chipriota y querella colectiva. Solo hay pérdida cuando concurra una circunstancia del art. 14.2.k).
- V1579-22 (30/06/2022): plataforma fraudulenta. «No puede considerarse que la presentación de la denuncia constituya el inicio de un procedimiento judicial que tenga por objeto la ejecución del crédito».
- V5346-26 (28/07/2026): autores identificados y causa penal abierta. La circunstancia 3.ª «se concreta en el procedimiento de ejecución forzosa». Sin concurso ni ejecución con un año transcurrido, no hay pérdida todavía.
- Art. 14.2.k) LIRPF: (1.º) quita en acuerdo de refinanciación o extrajudicial; (2.º) quita en convenio concursal, o conclusión del concurso sin cobro; (3.º) un año desde el inicio de un procedimiento judicial de ejecución del crédito. Si después se cobra, ganancia patrimonial en ese periodo. El texto consolidado sigue remitiendo a la Ley 22/2003.
- Lo recoge también el Manual de Renta 2025 de la AEAT: https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c11-ganancias-perdidas-patrimoniales/monedas-virtuales/compra-venta-monedas-virtuales-tributacion-inversor.html

**8.2 Autor desconocido: pérdida inmediata [P].** V0780-24 (17/04/2024), V1737-24 (15/07/2024), V1828-24 (01/08/2024), V1169-25 (01/07/2025, phishing que vacía la wallet, con hash de la operación) y V5387-26 (28/07/2026): si se desconoce la identidad del autor no hay derecho de crédito y «conceptualmente existiría una pérdida patrimonial». V5346-26 precisa que nace «en el momento en que se ha producido».

**8.3 Prueba [P].** El art. 33.5.a) excluye las pérdidas «no justificadas». La DGT **no dice que la denuncia baste**: remite a los medios de prueba admitidos en Derecho (art. 106.1 LGT) y deja la valoración a gestión e inspección.

**8.4 Base [P].** Siempre base general (arts. 45 y 48.b): se compensa con otras ganancias de la base general y, si el saldo es negativo, con el 25 % del saldo positivo de rendimientos e imputaciones, con cuatro años para el resto. **No se compensa con ganancias por ventas de cripto.** V1737-24 preguntaba justo si podía ir a la base del ahorro: no.

**8.5 Estafa sufrida antes de ser residente [P].** V3203-23 (12/12/2023): no se computa en el IRPF español.

**8.6 FTX, Celsius y concursos extranjeros.** Sin consulta. La regla es 8.1, pero el art. 14.2.k) remite a figuras de la ley concursal española; cómo encaja un procedimiento extranjero no está resuelto. **[NV]**

**8.7 Pérdida de claves o envío a una dirección errónea.** SIN CRITERIO (probados: «claves privadas», «contraseña», «monedero perdido», «extravío», «pérdida acceso», «dirección errónea», «error transferencia»). Extender 8.2 es analogía, y la prueba es el obstáculo. **[NV]**

**8.8 Token que vale cero y no se puede vender.** SIN CRITERIO («token valor cero», «sin liquidez», «exclusión cotización»). Con el art. 33.1 no hay pérdida sin alteración en la composición del patrimonio; que el desplome baste no lo ha dicho la DGT. **[NV]**

---

## Contraste con el repositorio

1. **Lección 01-02** (`scripts/cursos/fiscalidad-cripto-espana/lecciones/01-02-base-general-y-base-del-ahorro.html`): cita V1948-21 para «un airdrop gratuito». Esa consulta trata recompensas promocionales de un exchange; la de airdrops es V0648-24. El resultado (base general) es correcto; la cita, imprecisa.
2. **Misma lección**: «Lo que ganas minando como negocio → actividad económica» y «vender un NFT que compraste → base del ahorro» son correctos como regla general, pero sin consulta de IRPF que los respalde de forma expresa.
3. **Guía pública** (`src/app/guias/fiscalidad-cripto-espana/page.tsx`): el staking «se devenga al recibirlas» necesita el matiz de exigibilidad de V0612-26. «Minería: implica alta en Hacienda, IAE» se apoya en consultas de IAE, que en 2021-2023 hablan de minado como servicio a terceros. «Referidos […] o incluso como rendimiento en especie»: sin respaldo localizado.
4. **Lección de DeFi** (`scripts/cursos/defi-y-stablecoins/lecciones/05-02-regulacion-e-impuestos.html`): correcta; puede citar ya la fuente primaria en lugar de Cuatrecasas. «Lo recibido tiene, como coste, ese valor por el que tributó» no es cita literal de V0648-24. Y «ningún criterio publicado» sobre el token de participación debe matizarse con V0612-26.
5. **Glosario** (`src/lib/glosario.ts`): V0612-26 confirmada; puede quitarse «según los resúmenes publicados». V1828-24 es una estafa con autor desconocido; para el robo de una wallet encaja mejor V1169-25.
6. **Fecha de V1766-22**: 26/07/2022 según la DGT. La ficha de CEF (NFC083494) pone 20-06-2022 en la cabecera.


---

# Investigación C — Módulo 6 («Declarar, paso a paso») y actualización de la lección 1.3

Fecha de consulta de todas las fuentes: **14-11-2026**. Ámbito: IRPF, personas físicas, territorio común.

Etiquetas: **[P]** = verificado en fuente primaria (BOE, AEAT, Congreso) leída hoy · **[2S]** = verificado solo en dos fuentes secundarias · **[NV]** = no verificado.

Límite técnico que afecta a varias etiquetas: el texto consolidado del BOE de la LIRPF y de la LGT se corta al descargarlo (no se pudo leer el art. 96 ni el 95 bis LIRPF, ni el art. 199.5 ni la DA 18.ª LGT en el consolidado), y `hacienda.gob.es` rechazó la conexión. Donde pasó, se usó el Manual práctico de la AEAT o el modelo oficial publicado en el BOE, y se dice.

---

## 0 · ALERTA: lo que deja caducada a la lección 1.3

**La ley de transposición de DAC8 NO existe. El proyecto caducó el 6-10-2026.** La lección afirma que «la transposición se ha hecho con una ley que modifica […] la Ley General Tributaria —y que permite expresamente embargar criptoactivos—». Es falso a día de hoy.

- **[P]** El Proyecto de Ley 121/000060 (presentado el 05-06-2025) figura en el Congreso como **«Concluido por caducidad»** (06-10-2026 a 04-11-2026); la caducidad se publica en el BOCG, serie D, n.º 610, de 04-11-2026. Nunca pasó de la fase de informe en Comisión. No hay número de ley ni BOE.
  https://www.congreso.es/es/busqueda-de-iniciativas?p_p_id=iniciativas&p_p_lifecycle=0&p_p_state=normal&p_p_mode=view&_iniciativas_mode=mostrarDetalle&_iniciativas_legislatura=XV&_iniciativas_id=121/000060
- **[P]** Causa: Real Decreto 806/2026, de 5 de octubre, de disolución del Congreso y del Senado y convocatoria de elecciones (BOE 06-10-2026, BOE-A-2026-20742).
  https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-20742
- **[2S]** Elecciones el 29-11-2026 y constitución de las nuevas Cortes el 23-12-2026 (prensa jurídica que reproduce el decreto; no leí el articulado).
- **[P]** El embargo expreso de criptoactivos **no está en la LGT vigente**: los arts. 169 y 171 del texto consolidado siguen hablando de dinero, créditos, valores y «fondos, valores, títulos u otros bienes» en entidades de crédito o depositarias; no mencionan criptoactivos ni monedas virtuales. (Matiz: eso no significa que hoy sean inembargables —son «otros bienes»—; significa que la mención expresa y la obligación del proveedor de ejecutarlo iban en el proyecto caducado.)
  https://www.boe.es/buscar/act.php?id=BOE-A-2003-23186
- **[NV]** Artículo concreto de la LGT que el proyecto modificaba para el embargo: no pude abrir el texto del proyecto (BOCG-15-A-60-1). URL para comprobarlo: https://www.congreso.es/public_oficiales/L15/CONG/BOCG/A/BOCG-15-A-60-1.PDF
- **[NV]** Procedimiento de infracción de la Comisión Europea contra España por no transponer DAC8 (se cita el 30-01-2026): una sola fuente secundaria.

---

## 1 · DAC8 en España, estado a noviembre de 2026

| Pieza | Estado | Etiqueta |
|---|---|---|
| Directiva (UE) 2023/2226 (DAC8) | En vigor; plazo de transposición 31-12-2025, aplicación desde 01-01-2026 | [2S] (no abrí EUR-Lex hoy) |
| Ley de transposición | **No aprobada. Proyecto caducado** | [P] |
| Real Decreto de desarrollo (diligencia debida, arts. 37 ter, 39 bis, 42 quater RGAT) | Proyecto en audiencia pública (julio 2025). No consta publicado en BOE | [2S] para «no publicado» |
| Orden de los modelos 042, 172, 175 y 721 | **Proyecto**, en audiencia e información pública desde el 10-03-2026. No publicado en BOE | [P] para el proyecto; [2S] para «no publicado» |

**Qué dice el proyecto de orden (leído íntegro, 30 páginas)** — [P], pero es un borrador:

- Aprueba el **042** (censal del Registro de operadores de criptoactivos), el **172** («saldos en criptoactivos»), el **175** («proveedores de servicios de criptoactivos obligados a comunicar información») y el **721** («criptoactivos situados en el extranjero»), y modifica el 289.
- **El 175 sustituye al 173**: «el modelo 173 […] queda derogado para las declaraciones correspondientes al ejercicio 2026 y siguientes».
- Deroga las Órdenes HFP/887/2023 y HFP/886/2023 «con efecto para las declaraciones correspondientes al ejercicio 2026 y siguientes».
- Plazos: 172 y 175, **enero** del año siguiente; 721, **1 de enero a 31 de marzo**.
- Primera aplicación: ejercicio 2026, a presentar a partir de 2027.
- **Toda la orden se apoya en una «Ley XX/XX» y un «Real Decreto XX/XX» que no existen.** Sin ellos no puede aprobarse tal cual.
- Fuente: texto del proyecto (copia del PDF de la AEAT): https://www.fiscal-impuestos.com/sites/fiscal-impuestos.com/files/texto-proyecto_1.pdf · original (no accesible hoy): https://www.hacienda.gob.es/sgt/normativadoctrina/proyectos/09032026-proyecto-om-dac8.pdf

**Consecuencia práctica (INFERENCIA mía, no afirmación oficial):** mientras no haya ley, real decreto y orden, para el ejercicio 2026 siguen vigentes las Órdenes HFP/886/2023 y HFP/887/2023: los proveedores presentarían en enero de 2027 los modelos **172 y 173** de siempre y el contribuyente el **721 de «monedas virtuales»** hasta el 31-03-2027. La página del modelo 173 en la sede (actualizada el 06-11-2026) no anuncia ningún cambio. https://sede.agenciatributaria.gob.es/Sede/procedimientoini/GI54.shtml — **[NV]** como afirmación; conviene revisarlo en enero de 2027.

**[NV]** Si los datos de residentes en España que tengan cuenta en un exchange de otro Estado miembro que sí traspuso DAC8 llegarán a la AEAT en 2027 pese a la no transposición española. La directiva obliga al otro Estado a enviarlos, pero no encontré fuente oficial española que lo confirme.

---

## 2 · Obligación de declarar (Renta 2025, campaña 2026)

Fuente: Manual práctico de Renta 2025, AEAT — [P]
https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c01-campana-declaracion-renta/quienes-estan-obligados-presentar-declaracion-irpf/delimitacion-obligacion-declarar-irpf.html
Cuadro resumen: https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c01-campana-declaracion-renta/quienes-estan-obligados-presentar-declaracion-irpf/contribuyentes-no-obligados-declarar-cuadro-resumen.html

**Regla 1.ª** (no declara quien obtiene rentas *exclusivamente* de estas fuentes):

- Trabajo: **22.000 €** con un pagador (o si el segundo y siguientes no suman más de 1.500 €).
- Trabajo: **15.876 €** con más de un pagador (segundo y siguientes > 1.500 €), pensiones compensatorias, pagador no obligado a retener o tipo fijo de retención. Matiz 2025: para devengos del 1 al 22 de enero de 2025 el manual recoge 2.500 € en lugar de 1.500 €.
- Capital mobiliario y ganancias patrimoniales **sometidos a retención o ingreso a cuenta**: **1.600 €** conjuntos.
- Rentas inmobiliarias imputadas, Letras del Tesoro, subvenciones VPO y otras ayudas públicas: **1.000 €**.

**Regla 2.ª** (correctora): tampoco declara quien obtiene exclusivamente rendimientos del trabajo, del capital, de actividades económicas y **ganancias patrimoniales, sujetas o no a retención**, hasta **1.000 € conjuntos**, **y pérdidas patrimoniales inferiores a 500 €**.

**Lo que implica para nómina + cripto** — [P] en las reglas; la aplicación al caso es deducción directa del cuadro, la AEAT no pone un ejemplo con criptomonedas:

- La ganancia por vender o permutar cripto **no lleva retención**, así que no cabe en el límite de 1.600 € de la regla 1.ª. Quien la obtiene ya no tiene rentas «exclusivamente» de las fuentes de esa regla.
- Solo queda la regla 2.ª, cuyo tope de 1.000 € es para **todas** las rentas sumadas. Con una nómina normal se supera siempre.
- Por tanto: **nómina de 18.000 € + ganancia cripto de 50 € → obligado a declarar.** No existe un «mínimo exento» de ganancia.
- Pérdidas: con **pérdidas patrimoniales de 500 € o más** hay obligación (la AEAT lo lista como supuesto propio), aunque no haya ganancias.
- El staking (capital mobiliario sin retención) tampoco cabe en el límite de 1.600 €: mismo resultado.
- Los autónomos en RETA declaran siempre.

**[NV]** Texto literal del art. 96 LIRPF en el BOE (la página se corta). **[NV]** Cifras para el **ejercicio 2026**: la LIRPF se ha modificado más de diez veces en 2026 (última consolidación 11-11-2026) y no pude comprobar si el art. 96 ha cambiado. No dar cifras de 2026 hasta leerlo: https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764#a96
**[NV]** Consulta DGT que resuelva exactamente «nómina < 22.000 € + ganancia sin retención»: no encontrada.

---

## 3 · Calendario

Fuente: Orden HAC/277/2026, de 25 de marzo (BOE 27-03-2026, BOE-A-2026-7041) — [P]
https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-7041

- **Renta y Patrimonio 2025: del 8 de abril al 30 de junio de 2026** (art. 7).
- **Domiciliación: hasta el 25 de junio de 2026** (art. 12.3). Si solo se domicilia el segundo plazo, hasta el 30 de junio.
- **Fraccionamiento 60/40 sin intereses**: 60 % al presentar y 40 % **hasta el 5 de noviembre de 2026** (art. 11.5).
- Borrador y datos fiscales disponibles desde el 8 de abril (art. 5.2).
- **Renta 2026: fechas NO publicadas.** La orden sale cada año en marzo; la de 2026 saldrá hacia marzo de 2027. **[NV]** — no escribir fechas de 2027.
- Modelo 721 del ejercicio 2025: 1 de enero a 31 de marzo de 2026 — [P] (FAQ AEAT, ver punto 6).

---

## 4 · Renta Web / modelo 100, ejercicio 2025

Fuente principal: **modelo 100 oficial**, anexo de la Orden HAC/277/2026 (BOE-A-2026-7041, págs. 45903-45918), leído página a página — [P]
https://www.boe.es/boe/dias/2026/03/27/pdfs/BOE-A-2026-7041.pdf

**Apartado F2, «Ganancias y pérdidas patrimoniales derivadas de la transmisión o permuta de monedas virtuales por particulares»** (página 15 del modelo), base del ahorro:

| Casilla | Rótulo oficial |
|---|---|
| 1800 | Contribuyente titular de las monedas virtuales transmitidas |
| 1801 | Imputación temporal: X si opta por operaciones a plazos o precio aplazado |
| 1802 | Denominación de la moneda virtual que se transmite (bitcoins, ethereum, tether…) |
| 1803 | Identificación de lo recibido a cambio. Clave tipo de contraprestación |
| 1804 | Valor de transmisión |
| 1805 | Valor de transmisión destinado a constituir una renta vitalicia |
| 1806 | Valor de adquisición |
| 1807 / 1808 | Pérdida patrimonial obtenida / pérdida imputable a 2025 |
| 1809-1812 | Ganancia obtenida / exenta por reinversión en renta vitalicia / no exenta / imputable a 2025 |
| **1813** | Suma de **pérdidas** por transmisiones de monedas virtuales |
| **1814** | Suma de **ganancias** por transmisiones de monedas virtuales |

Matices:

- **No hay casilla de fecha ni casilla de gastos separada.** Los gastos y comisiones se incorporan a los valores de adquisición y de transmisión (ayuda de Renta Web 2025, AEAT — [P]): https://sede.agenciatributaria.gob.es/Sede/Ayuda/25Presentacion/100/7_6_6_2/ganancias_perdidas_monedas_virtuales.html
- **¿Se puede agrupar por moneda?** La AEAT dice que la ganancia o pérdida se **calcula** «de manera independiente para cada operación de venta de cada tipo de moneda» y con FIFO, incluso entre distintas casas de cambio [P]. El bloque del modelo se identifica por moneda + tipo de contraprestación y no pide fecha [P]. **No encontré ninguna frase de la AEAT que diga expresamente «puede agruparse» ni «debe ir operación a operación»: [NV].** Redactar así: «el cálculo es por operación; la pantalla pide moneda, contraprestación y valores».
- **Claves de contraprestación F / N / O / B** (moneda de curso legal / otra moneda virtual / otro activo virtual / bienes o servicios): la AEAT solo dice que se elige en un desplegable. Las letras salen de fuentes secundarias: **[2S]**. Comprobar en Renta Web antes de imprimirlas.
- **Permuta**: valor de transmisión = el mayor entre el valor de mercado de lo entregado y de lo recibido — [P] (Manual Renta 2025): https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c11-ganancias-perdidas-patrimoniales/monedas-virtuales/compra-venta-monedas-virtuales-tributacion-inversor.html

**Otras casillas** (rótulos [P]; que el staking o el airdrop vayan ahí es otra cuestión):

- **0033** «Rendimientos procedentes de rentas que tengan por causa la imposición de capitales y otros rendimientos del capital mobiliario a integrar en la base imponible del ahorro». La casilla existe [P]. Que el staking sea rendimiento del capital mobiliario lo sostiene la DGT en V1766-22 (26-07-2022), reiterada en V0648-24 y V0612-26: **[2S]** (Cuatrecasas, finReg360; no pude abrir la base de la DGT). Que la casilla correcta sea la 0033 y no la 0027: **[NV]** en fuente oficial.
- **0304** (ganancias) y **0305** (pérdidas): «Otras ganancias y/o pérdidas patrimoniales imputables a 2025», apartado F1, **base general** [P]. Que el **airdrop** sea ganancia no derivada de transmisión y vaya en la 0304: **[NV]** (no localicé hoy consulta DGT ni texto del manual).
- **Robo, estafa, plataforma quebrada**: el Manual de Renta 2025 dice que el impago **no es automáticamente pérdida**; se imputa por las reglas del crédito vencido y no cobrado (art. 14.2.k LIRPF: quita eficaz, convenio o conclusión del concurso, o un año desde el inicio del procedimiento judicial) y va a la **base general**, no a la del ahorro [P]. Por coherencia con el modelo sería la casilla **0305**: inferencia, **[NV]** como casilla. Consultas DGT citadas (V1098-20, V1579-22, V1828-24): **[2S]**.
- **Pérdidas pendientes de años anteriores (ahorro)**: casillas **0439 (2021), 0440 (2022), 0441 (2023) y 0442 (2024)**, con el anexo C.3 [P]. Compensación cruzada del saldo negativo de 2025 con rendimientos del capital mobiliario, límite 25 %: casillas 0436 y 0446 [P]. Confirma los cuatro años.
- Totales del año: ganancias del ahorro en la 0422 (incluye la 1814), pérdidas en la 0423 (incluye la 1813) [P].

**Datos fiscales de cripto.** La AEAT incluye **avisos** sobre monedas virtuales en los datos fiscales, no las operaciones volcadas en el borrador. Previsión para Renta 2025: **≈1.243.000 avisos** (presentación oficial de campaña de 08-04-2026, vista solo en el extracto del buscador, más prensa): **[2S]**. **[NV]** que el borrador precargue importes del 172/173; nada en la ayuda de Renta Web lo indica.

---

## 5 · Documentación y prueba

Fuente: LGT, texto consolidado BOE — https://www.boe.es/buscar/act.php?id=BOE-A-2003-23186

- **Prescripción: cuatro años** (art. 66), contados desde el día siguiente al fin del plazo reglamentario de declaración (art. 67.1) — [P]. Se interrumpe por cualquier actuación de la Administración con conocimiento formal del obligado (art. 68.1.a) — [P].
- **Pero el valor de adquisición hay que poder probarlo aunque la compra esté prescrita**: art. 70.3, la obligación de justificar la procedencia de datos con origen en periodos prescritos se mantiene durante el plazo de prescripción de las deudas afectadas — [P]. Regla práctica: conservar el justificante de cada compra **hasta cuatro años después de declarar su venta**.
- **Carga de la prueba**: art. 105.1, quien hace valer su derecho prueba los hechos constitutivos — [P]. El contribuyente prueba el coste; si no puede, la consecuencia habitual (valor de adquisición cero) es **[NV]**: no encontré fuente oficial que lo diga así para cripto.
- Art. 108.4: los datos que terceros suministran por obligación de información (172/173) se presumen ciertos, pero deben contrastarse si el contribuyente alega que son inexactos — [P]. Útil para «el exchange informó mal».
- **Exchange cerrado sin historial**: no hay criterio oficial específico: **[NV]**. Lo único firme es que valen los medios de prueba admitidos en Derecho (art. 106.1 LGT [P]): extractos bancarios, correos de confirmación, exploradores de bloques.
- **Herramientas de cálculo**: no encontré ninguna homologación, lista ni aval de la AEAT a software de terceros; quien firma el modelo 100 responde de él. Es una constatación negativa: **[NV]**. No escribir «la AEAT ha dicho que no homologa ninguna».

---

## 6 · Modelo 721

Fuentes: FAQ del modelo 721, AEAT (actualizadas el 08-09-2026) — [P] https://sede.agenciatributaria.gob.es/Sede/todas-gestiones/impuestos-tasas/declaraciones-informativas/modelo-721-decla-sobre-monedas-extranjero/preguntas-frecuentes-sobre-modelo-721.html · Orden HFP/886/2023 (BOE-A-2023-17429): https://www.boe.es/buscar/doc.php?id=BOE-A-2023-17429

- **Quién** [P]: residentes en España (personas físicas y jurídicas), establecimientos permanentes y entidades del art. 35.4 LGT que sean **titulares, beneficiarios, autorizados, con poder de disposición o titulares reales** a 31 de diciembre, o que lo hayan sido en cualquier momento del año. Herederos, desde la aceptación.
- **Dos requisitos acumulativos** [P]: (1) custodia por un tercero que salvaguarda claves privadas por cuenta ajena, y (2) que ese custodio **no sea residente en España ni establecimiento permanente en España**.
- **Autocustodia fuera** [P]: la FAQ dice que, «con independencia de si se trata de un "hot wallet" o de un "cold wallet"», las monedas cuyas claves privadas controla el titular no computan ni se informan. La guía lo dice bien.
- **Umbral** [P]: 50.000 € **conjuntos** a 31 de diciembre; superado, se informa de **todas** las monedas.
- **Plazo** [P]: 1 de enero a 31 de marzo. Primer ejercicio: 2023.
- **Años siguientes** [P]: solo si el saldo conjunto sube **más de 20.000 €** respecto del último declarado. Además, **siempre** hay que informar de las monedas cuya titularidad se extinguió antes del 31 de diciembre (matiz que la guía no recoge).
- **Qué se informa** [P]: datos del custodio (nombre, NIF si lo tiene, país, domicilio o web), cada moneda por separado, unidades y valoración en euros a 31 de diciembre. El **dinero fiat** en el exchange no va en el 721 (puede ir en el 720).
- **Valoración** [P, por remisión]: la FAQ solo dice «valoración en euros». El Manual de Patrimonio 2025 detalla, para el art. 39 bis RGAT, cotización a las 23:59 del 31 de diciembre en las principales plataformas o webs de seguimiento de precios o, en su defecto, estimación razonable. Que el art. 42 quater use idéntica regla: **[NV]** (no leí el artículo).
- **Exchange «extranjero»** [P]: está en el extranjero si el custodio **no está obligado a presentar el modelo 172** (DA 13.ª.6 LIRPF). La AEAT remite al **Registro de entidades del Banco de España** para ver la localización de los proveedores. **La AEAT no publica una lista por marcas.** Clasificar Binance, Coinbase, Kraken o Bit2Me: **[NV]**; no afirmarlo en el curso sin comprobar la entidad jurídica contratante.
- **Sanciones**: no hay régimen específico. La Ley 5/2022 reescribió la DA 18.ª LGT tras la STJUE de 27-01-2022 (C-788/19) y el texto resultante no contiene sanciones propias [P]: https://www.boe.es/buscar/doc.php?id=BOE-A-2022-3712 . Se aplica el régimen general [P en cifras]:
  - **Art. 198.1**: no presentar → **20 € por dato**, mínimo **300 €**, máximo **20.000 €**.
  - **Art. 198.2**: presentar fuera de plazo **sin requerimiento** → la mitad (10 €, 150 €, 10.000 €).
  - **Art. 199**: presentar con datos incompletos, inexactos o falsos → 150 € (ap. 2) y 200 € por dato no monetario (ap. 4). El ap. 5 (magnitudes monetarias: hasta el 2 %, mínimo 500 €) es **[NV]**: el texto se cortó.
  - **[NV]** Qué apartado aplica la AEAT en la práctica al 721.

---

## 7 · Impuesto sobre el Patrimonio e ITSGF

- **Valoración de las criptomonedas** [P]: valor de mercado en euros a 31 de diciembre. Base: **art. 24 de la Ley 19/1991** (cláusula residual «demás bienes y derechos»). **Matiz contra el encargo**: no localicé un artículo específico de cripto introducido por la Ley 11/2021; lo que esa ley creó fueron las obligaciones informativas. **[NV]** que la Ley 11/2021 tocara la valoración.
  https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/patrimonio-2025/c-3-determinacion-base-imponible/formacion-patrimonio-bruto/monedas-virtuales.html
- **Obligación de presentar el 714** [P] (Orden HAC/277/2026, art. 2, y AEAT): (a) si sale **cuota a ingresar**, o (b) si el valor de bienes y derechos supera **2.000.000 €** aunque la cuota sea cero; para este límite cuentan todos los bienes, exentos o no, **sin restar deudas**. Presentación solo electrónica. https://sede.agenciatributaria.gob.es/Sede/declaraciones-informativas-otros-impuestos-tasas/impuesto-sobre-patrimonio/quienes-estan-obligados-presentar-declaracion-ipatrimonio.html
- **Mínimo exento 2025** [P] (Manual Patrimonio 2025): general **700.000 €**. Propios: **Illes Balears 3.000.000 €**, **Comunitat Valenciana 1.000.000 €**, **Cataluña 500.000 €**, **Extremadura 500.000 €** (600.000-800.000 con discapacidad), La Rioja 700.000 €, Andalucía solo cifras especiales por discapacidad (1.250.000 / 1.500.000 €).
- **Bonificaciones 2025** [P]: mientras exista el ITSGF, **Andalucía, Galicia, Madrid, Cantabria, La Rioja y Murcia** aplican una bonificación **por diferencia** entre la cuota de Patrimonio y la del ITSGF, no un 100 % incondicional. Efecto: quien no llega al ITSGF sigue sin pagar; quien llega, paga a su comunidad lo que habría pagado al Estado. https://sede.agenciatributaria.gob.es/Sede/declaraciones-informativas-otros-impuestos-tasas/impuesto-sobre-patrimonio/calculo-impuesto-temporal-solidaridad-grandes-fortunas.html
- **[NV]** Bonificación de Extremadura en 2025, exención de 300.000 € de vivienda habitual (art. 4.9) y todo el cuadro autonómico de **2026**.
- **ITSGF** [P] (Ley 38/2022, art. 3): grava el patrimonio neto **superior a 3.000.000 €**; mínimo exento **700.000 €**; escala 0 % hasta 3.000.000 €, **1,7 %** hasta 5.347.998,03 €, **2,1 %** hasta 10.695.996,06 € y **3,5 %** en adelante; se deduce la cuota de Patrimonio efectivamente pagada; límite conjunto del 60 %. Nació para dos ejercicios y el RDL 8/2023 lo prorrogó «en tanto no se produzca la revisión de la tributación patrimonial»: **vigente en 2025 y, salvo cambio legal, en 2026**. Devengo el 31 de diciembre. https://www.boe.es/buscar/act.php?id=BOE-A-2022-22684
- **Modelo 718** [P]: plazo del 1 al 31 de julio (Orden HFP/587/2023); la Orden HAC/652/2026, de 26 de junio (BOE 29-06-2026), cambió el anexo para el ejercicio 2025. **[NV]** fecha final exacta de julio de 2026 (una fuente menciona el día 26). https://sede.agenciatributaria.gob.es/Sede/todas-noticias/2026/junio/29/modificacion-impuesto-temporal-solidaridad-grandes-fortunas.html

---

## 8 · Cambio de residencia: «exit tax» (art. 95 bis LIRPF)

- [P] El régimen grava la plusvalía latente de **«acciones o participaciones de cualquier tipo de entidad»**. Requisitos: residente en 10 de los 15 periodos anteriores, y valor de mercado conjunto superior a **4.000.000 €**, o participación superior al **25 %** con valor superior a **1.000.000 €**.
  https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c11-ganancias-perdidas-patrimoniales/regimen-especial-ganancias-patrimoniales-cambio-residencia/introduccion-ambito-aplicacion.html
- [P] El modelo 100 de 2025 lo confirma: el apartado F4 (casillas 0401-0412) solo pide «NIF de la sociedad emisora o fondo de inversión» y «valor de mercado de las acciones o participaciones».
- **Las criptomonedas no son acciones ni participaciones: el art. 95 bis no las alcanza.** Es lectura directa del ámbito objetivo [P]; **[NV]** una consulta DGT que lo diga expresamente para cripto.
- **[NV]** Tributación del ya no residente (IRNR) por ventas de cripto: no investigado con fuente primaria.

---

## 9 · Contradicciones con el material existente

**Lección 1.3**
1. «La transposición se ha hecho con una ley…» → **falso**: proyecto caducado el 06-10-2026.
2. «…y que permite expresamente embargar criptoactivos» → **no está en vigor**.
3. El aviso «con la orden ministerial todavía en tramitación» se queda corto: falta también la ley y el real decreto.
4. La tarjeta «Modelo 175 (en tramitación)» del ejercicio de clasificar puede quedarse, con ese rótulo.
5. «Con DAC8, desde 2026 lo hacen también las de toda la Unión»: cierto como directiva, pero España no la ha traspuesto; matizar.
6. Correcto y verificado: Orden HFP/887/2023 (172/173), Orden HFP/886/2023 (721), 50.000 €, cuatro años.

**Guía `fiscalidad-cripto-espana`**
1. **Sanciones del 721** («300 € tras requerimiento y 150 € por incompleto o con errores… 10 € por dato incorrecto»): mezcla dos artículos. Los 150 € / 10 € son la mitad del art. 198 por presentar tarde **sin** requerimiento; los datos incorrectos van por el art. 199 (200 € por dato). Faltan los máximos (20.000 / 10.000 €).
2. **Patrimonio**: «la obligación de declarar aparece cuando el patrimonio neto supera 700.000 €» es impreciso: hay obligación si sale cuota a ingresar o si el patrimonio **bruto** supera 2.000.000 €. Y «comunidades bonificadas al 100 %» ya no describe 2025: es bonificación por diferencia con el ITSGF.
3. «Primer ejercicio con intercambio DAC8: 2026» (contador) y «con DAC8 en marcha»: en España no hay norma de transposición.
4. Correcto: autocustodia fuera del 721, 20.000 €, plazos, «casillas 1800 y siguientes» (1800-1814 en 2025), campaña abril-junio.


---

# Investigación D — Módulo 7 «Cuando algo sale mal»

Consultado el 14-11-2026. Textos consolidados del BOE leídos directamente (no resúmenes). Fechas de «última actualización» que muestra el BOE: LGT 21-12-2024 · RGAT (RD 1065/2007) 07-10-2026 · Ley IRPF 11-11-2026 · RIRPF 07-10-2026 · Código Penal 09-04-2026 · Ley 39/2015 06-11-2024.

Etiquetas: **[P]** verificado en fuente primaria · **[2S]** dos fuentes secundarias · **[NV]** no verificado · **[INF]** inferencia mía a partir de texto primario (no lo dice la fuente con esas palabras).

URL base: LGT https://www.boe.es/buscar/act.php?id=BOE-A-2003-23186 · RGAT https://www.boe.es/buscar/act.php?id=BOE-A-2007-15984 · LIRPF https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764 · RIRPF https://www.boe.es/buscar/act.php?id=BOE-A-2007-6820 · CP https://www.boe.es/buscar/act.php?id=BOE-A-1995-25444 · Ley 39/2015 https://www.boe.es/buscar/act.php?id=BOE-A-2015-10565

---

## 1 · Arreglar una declaración ya presentada

**1.1 [P] La autoliquidación rectificativa es hoy la vía única en el IRPF, y se aplica desde el ejercicio 2024 (no 2023).** El art. 120.4 LGT (Ley 13/2023) crea la figura; el art. 67 bis RIRPF (introducido por la DF 4.ª del RD 117/2024) la hace obligatoria en IRPF; la implantación efectiva en el modelo 100 llega con la Orden HAC/242/2025 (BOE 14-03-2025, Renta 2024), cuyo preámbulo dice que «sustituirá […] el actual sistema dual de autoliquidación complementaria y solicitud de rectificación».
- Fuente: https://www.boe.es/buscar/act.php?id=BOE-A-2025-5049 · manual AEAT Renta 2024: https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2024/c01-campana-declaracion-renta/rectificacion-errores-omisiones-padecidos-declaraciones-presentadas.html
- Comprobación negativa: la Orden HAC/265/2024 (Renta 2023) no contiene la palabra «rectificativa», y la ayuda de la AEAT para Renta 2023 sigue hablando de «Solicitud de Rectificación» con la casilla 127: https://sede.agenciatributaria.gob.es/Sede/ayuda/consultas-informaticas/renta-ayuda-tecnica/renta-2023/modificacion-declaracion-presentada-renta-2023.html
- Matiz: para **ejercicios 2023 y anteriores** sigue el sistema dual: complementaria si el error fue a favor del contribuyente-pagó-de-menos (art. 122 LGT) y solicitud de rectificación si pagó de más (art. 120.3 LGT, arts. 126-128 RGAT). Un curso escrito en 2026 tiene que explicar los dos, porque quien regulariza 2022 o 2023 usa el antiguo.

**1.2 [P] Régimen de la rectificativa (art. 67 bis RIRPF).** Debe contener todos los datos (los que no cambian, los modificados y los nuevos). Se puede presentar mientras no haya prescrito el derecho de la Administración a liquidar o el derecho a solicitar la devolución; fuera de plazo es extemporánea. Si sale **más a ingresar o menos a devolver**, se le aplica el régimen de las complementarias (art. 122.2 LGT) y, por tanto, los recargos del art. 27. Si sale **a devolver**, la presentación equivale a solicitar la devolución; la AEAT tiene 6 meses desde el fin del plazo de declaración o, si ya pasó, desde la presentación de la rectificativa, y después abona intereses de demora.
- Excepción [P]: si el único motivo es que la norma aplicada vulnera otra de rango superior (Constitución, Derecho de la UE, tratado), se puede seguir usando la solicitud de rectificación del art. 120.3 LGT.

**1.3 [P] Cómo se hace en Renta Web (Renta 2025).** «Modificar declaración presentada» → hacer los cambios → marcar la **casilla 103** → si baja la devolución o sube el ingreso, elegir el tipo de rectificativa → «Presentar declaración». Renta Web arrastra el justificante y los importes ya ingresados o devueltos. La rectificativa pasa a ser «la última presentación del modelo/ejercicio/periodo» y no hay límite de número. Casillas nuevas de la Orden HAC/242/2025: 669 (ajuste por discrepancia de criterio) y 701 (distingue devolución derivada de la normativa de devolución de ingresos indebidos).
- https://sede.agenciatributaria.gob.es/Sede/ayuda/consultas-informaticas/renta-ayuda-tecnica/modificar-declaracion-presentada.html
- Matiz: el número de casilla cambia por campaña; cítese siempre con el ejercicio.

**1.4 [P] Plazo de cuatro años para pedir lo pagado de más.** Art. 66.c) LGT: prescribe a los cuatro años el derecho a solicitar devoluciones derivadas de la normativa del tributo y devoluciones de ingresos indebidos. Cómputo (art. 67.1): desde el día siguiente al ingreso indebido o, si se ingresó dentro del plazo de declaración, desde el día siguiente al fin de ese plazo. Art. 221 LGT regula la devolución de ingresos indebidos. El art. 126.2 RGAT impide pedir la rectificación mientras se tramita una comprobación sobre esa misma obligación (se alega dentro de ella).

**1.5 [P] Quien corrige voluntariamente no es sancionado.** Art. 179.3 LGT: quien regulariza o subsana voluntariamente no incurre en responsabilidad por las infracciones cometidas al presentar la declaración incorrecta, «sin perjuicio de lo previsto en el artículo 27».

---

## 2 · Recargos por declaración extemporánea (art. 27 LGT, redacción Ley 11/2021)

**2.1 [P] Texto literal vigente, art. 27.2:** «un porcentaje igual al 1 por ciento más otro 1 por ciento adicional por cada mes completo de retraso»; se calcula sobre el importe a ingresar y **excluye sanciones e intereses** devengados hasta la presentación. Pasados 12 meses: **15 %**, sin sanción, **con intereses de demora desde el día siguiente al término de los 12 meses** hasta la presentación.

**2.2 [P] Reducción del 25 % (art. 27.5)** si se ingresa el total del recargo en el plazo del art. 62.2 abierto con su notificación **y** se ingresa el total de la deuda de la autoliquidación al presentarla (o se cumple un aplazamiento con aval o seguro de caución solicitado al presentar). Matiz: un aplazamiento **sin** garantía no da derecho a la reducción según el tenor literal.

**2.3 [P] Requisito formal (art. 27.4):** la autoliquidación extemporánea debe identificar expresamente el período y contener solo datos de ese período. Si se «cuela» la renta omitida en la declaración de otro año, no hay recargo sino infracción leve (art. 191.6).

**2.4 [P] Exención poco conocida (art. 27.2, párrafos finales):** no hay recargo si el contribuyente regulariza, en otros períodos del mismo impuesto, hechos idénticos a los que la Administración ya le regularizó, dentro de los 6 meses siguientes a la notificación de esa liquidación, pagando todo, sin recurrir y sin que la liquidación haya llevado sanción.

**2.5 [P] Tipo de interés de demora:** art. 26.6 LGT = interés legal + 25 %, salvo que la LPGE fije otro. **4,0625 % en 2023, 2024, 2025 y 2026** (interés legal 3,25 %), por la DA 42.ª de la Ley 31/2022 prorrogada. La AEAT advierte de que rige «hasta que entre en vigor la LPGE para 2026».
- https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/guia-principales-novedades/otras-cuestiones-interes.html
- [NV] No he localizado en el BOE una LPGE 2026 aprobada; la sede de la AEAT sigue dando 4,0625 %. Recomprobar antes de publicar.

**2.6 Ejemplos (aritmética mía sobre el art. 27; [P] la regla, [INF] el cálculo).** Cuota a ingresar: 2.000 €.

| Retraso | Recargo | Importe | Con reducción del 25 % | Intereses |
|---|---|---|---|---|
| Menos de 1 mes completo | 1 % | 20 € | 15 € | no |
| 5 meses completos | 1 + 5 = 6 % | 120 € | 90 € | no |
| 11 meses completos | 12 % | 240 € | 180 € | no |
| 14 meses (más de 12) | 15 % | 300 € | 225 € | sí, solo desde el mes 12 |

Intereses del caso de 14 meses: Renta 2024, plazo hasta 30-06-2025, presentada el 15-09-2026. Se devengan del 01-07-2026 al 15-09-2026 = 77 días → 2.000 × 4,0625 % × 77/365 = **17,14 €** (un día arriba o abajo según cómo compute la AEAT el día de presentación). Total sin reducción: 2.317,14 €; con reducción: 2.242,14 €.

---

## 3 · Qué es «requerimiento previo» y qué son los avisos

**3.1 [P] Definición legal (art. 27.1 LGT):** «cualquier actuación administrativa realizada con conocimiento formal del obligado tributario conducente al reconocimiento, regularización, comprobación, inspección, aseguramiento o liquidación de la deuda tributaria». A partir de esa notificación, lo que se presente ya no va por recargos: la conducta entra en el art. 191.

**3.2 [P] Los avisos de Renta sobre monedas virtuales: cifras oficiales** (presentaciones de campaña de la AEAT, apartado «Se reiteran avisos sobre las siguientes fuentes de renta»):

| Campaña | Avisos «monedas virtuales» | Fuente |
|---|---|---|
| Renta 2021 (abril 2022) | 233.000 | https://sede.agenciatributaria.gob.es/static_files/Sede/Actualidad/Notas_prensa/2022/06-04-22_PRESENTACION_CAMPANYA_RENTA_2021.pdf |
| Renta 2022 (abril 2023) | 328.000 | https://sede.agenciatributaria.gob.es/static_files/Sede/Actualidad/Notas_prensa/2023/Presentacion_Campania_de_Renta_2022.pdf |
| Renta 2023 (abril 2024) | 948.000 | https://sede.agenciatributaria.gob.es/static_files/Sede/Actualidad/Notas_prensa/2024/CR_2023_presentacion.pdf |
| Renta 2024 (abril 2025) | 889.000 | https://sede.agenciatributaria.gob.es/static_files/Sede/Actualidad/Notas_prensa/2025/Presentacion_Campania_Renta_Patrimonio_2024.pdf |
| Renta 2025 (abril 2026) | 1.243.000 | https://sede.agenciatributaria.gob.es/static_files/Sede/Actualidad/Notas_prensa/2026/PRESENTACION_CAMPANA_DE_RENTA_Y_PATRIMONIO_2025.pdf |

- La cifra de «620.000» del encargo **no aparece** en ninguna presentación oficial. [NV] La de Renta 2020 (se suele citar 14.800) tampoco la he podido verificar; la presentación de 2022 solo dice que el número «es muy superior al del año anterior».
- Son avisos insertados en los datos fiscales, no cartas individuales.

**3.3 [INF] Un aviso no es un requerimiento.** Ninguna fuente primaria lo dice con esas palabras. Se deduce de: (a) la definición del art. 27.1 exige una actuación «conducente a» comprobar o liquidar una deuda concreta; (b) las Directrices 2026 describen estas campañas como medida «preventiva que incentive su correcta declaración» y cuyo objetivo es «facilitar el cumplimiento voluntario», y dicen que los avisos de IRPF sirven para que el contribuyente pueda «autocorregir» mediante autoliquidación rectificativa. Redáctese como interpretación y con la cautela de que una carta individual que pida datos o abra un procedimiento sí lo es: manda el contenido, no el nombre.

**3.4 [P] Directrices del Plan Anual de Control Tributario y Aduanero 2026** (Resolución de 11-03-2026, BOE 12-03-2026, BOE-A-2026-5843), apartado A.5.1 «Criptoactivos»: «en 2026 se impulsará la realización de actuaciones de control sobre contribuyentes que habiendo operado con ese tipo de activos no hayan declarado rentas o ganancias patrimoniales»; se intensificará la explotación de los modelos 172, 173 y 721 y «el análisis de perfiles de riesgo, mediante el uso de las herramientas de trazabilidad en blockchain», para detectar «patrimonios no justificados o rentas no declaradas»; cita expresamente los *wallets* no custodiados y las transferencias entre monederos personales como dificultad. En recaudación: se impulsarán los embargos sobre criptoactivos.
- https://www.boe.es/boe/dias/2026/03/12/pdfs/BOE-A-2026-5843.pdf
- Ojo: el texto habla de la «**futura** transposición de la DAC8» y de un **modelo 175** que sustituirá al 173 (ver contradicciones).

---

## 4 · Procedimientos, plazos y notificaciones

**4.1 [P] Verificación de datos (arts. 131-133 LGT).** Supuestos: defectos formales o errores aritméticos; datos que no coinciden con otras declaraciones o con los que tiene la AEAT; aplicación indebida patente de la norma; aclaración de un dato (no de actividades económicas). No impide una comprobación posterior (art. 133.2).

**4.2 [P] Comprobación limitada (arts. 136-140).** La AEAT examina lo declarado, los justificantes que pida, sus propios datos y registros; puede requerir a terceros. Termina con resolución expresa (liquidación provisional o «no procede regularizar»), caducidad o inicio de inspección. Efecto protector (art. 140.1): lo ya comprobado no puede regularizarse de nuevo salvo hechos nuevos derivados de actuaciones distintas.

**4.3 [P] Caducidad a los 6 meses (art. 104.1; arts. 133.1.d y 139.1.b).** Plazo máximo para notificar la resolución: 6 meses desde la notificación del inicio. Matices: no cuentan las dilaciones imputables al contribuyente ni las interrupciones justificadas (art. 104.2); basta un intento de notificación con el texto íntegro; y la caducidad **no** impide reabrir el procedimiento dentro del plazo de prescripción. Las actuaciones caducadas no interrumpen la prescripción (art. 104.5) [P en cuanto al artículo; no reproducido aquí].

**4.4 [P] Inspección (arts. 141 y ss.; plazo art. 150).** 18 meses con carácter general; 27 meses si la cifra de negocios alcanza el umbral de auditoría, hay grupo fiscal o se comprueba el Impuesto Complementario. Se cuenta desde la notificación del inicio hasta la notificación de la liquidación. Para un particular: 18.

**4.5 [P] Plazos de respuesta.**
- Requerimiento individualizado de información (art. 93 LGT; art. 55.2 RGAT): plazo «no inferior a 10 días» desde el día siguiente a la notificación. El art. 89 RGAT (10 días) es el de **subsanación** de solicitudes, no el de requerimientos de información.
- Días hábiles: art. 30.2 Ley 39/2015 (sábados, domingos y festivos excluidos).
- Ampliación (art. 91 RGAT): hasta la mitad del plazo, una sola vez, pedida **antes de los tres días previos** al vencimiento; se entiende concedida automáticamente salvo denegación expresa.
- Alegaciones a la propuesta de liquidación: 10 días en verificación de datos (art. 155.3 RGAT) y en comprobación limitada (art. 164.4 RGAT); 15 días en actas de disconformidad (art. 188.1 RGAT). Marco general: entre 10 y 15 días (art. 99.8 LGT).
- Recurso de reposición: un mes (art. 223.1 LGT). Reclamación económico-administrativa: un mes (art. 235.1 LGT). [NV aquí: que la reposición es potestativa y previa — art. 222 no releído.]
- Pago de una liquidación (art. 62.2 LGT): notificada del 1 al 15, hasta el día 20 del mes siguiente; del 16 a fin de mes, hasta el día 5 del segundo mes siguiente.

**4.6 [P] Notificaciones.** Las personas físicas eligen (art. 14.1 Ley 39/2015): no están obligadas a la notificación electrónica salvo que la elijan (art. 41.1) o actúen como colegiados/representantes de obligados. Si es obligatoria o elegida: se entiende practicada al acceder y **rechazada a los 10 días naturales** de la puesta a disposición sin acceso (art. 43.2); la AEAT cumple su plazo con la mera puesta a disposición (art. 104.2 LGT). En papel: dos intentos en el domicilio fiscal; si fallan, anuncio en el BOE y 15 días naturales para comparecer, tras los cuales se tiene por notificado (art. 112 LGT). Rechazar la carta equivale a notificación (art. 111.2).
- [NV] Detalle operativo de la DEHú y de la suscripción voluntaria en la sede de la AEAT: no leído en fuente; solo el marco legal.

---

## 5 · Sanciones

**5.1 [P] Art. 191 LGT (dejar de ingresar).** Base: la cuantía no ingresada. **Leve** (50 %): base ≤ 3.000 € o, siendo mayor, sin ocultación. **Grave** (50-100 %): base > 3.000 € y ocultación. **Muy grave** (100-150 %): medios fraudulentos. Ocultación (art. 184.2): no presentar declaración u omitir rentas, siempre que la deuda derivada de la ocultación supere el 10 % de la base de la sanción. En grave y muy grave el mínimo sube por comisión repetida (+5/+15/+25 puntos) y por perjuicio económico (+10/+15/+20/+25 puntos según supere el 10, 25, 50 o 75 %) (art. 187.1).

**5.2 [P] Reducciones (art. 188).** 65 % en actas con acuerdo; 30 % por conformidad; y **40 %** (Ley 11/2021; antes 25 %) sobre el importe ya reducido si se paga en el plazo del art. 62.2 y no se recurre ni la liquidación ni la sanción. El 40 % no se aplica a actas con acuerdo. En gestión, la conformidad se presume si no se recurre la liquidación (art. 187.1.d). Combinadas: se paga el 42 % de la sanción inicial.

**5.3 Ejemplos ([INF] cálculo).**
- Cuota no ingresada 2.000 € (leve): 1.000 € → 700 € con conformidad → **420 €** con pronto pago. El mismo error regularizado a los 5 meses por recargo: 120 € (90 €).
- Cuota 4.000 € con ocultación (grave), sin agravantes: 2.000 € → 1.400 → **840 €**. Con perjuicio económico superior al 75 % (+25 puntos = 75 %): 3.000 € → 2.100 → **1.260 €**. Además de la cuota y los intereses.

**5.4 [P] No atender requerimientos (art. 203).** Infracción grave. Para requerimientos ordinarios: 150 € el primero, 300 € el segundo, 600 € el tercero (art. 203.4). En inspección, quien no ejerce actividad económica: 1.000 €, 5.000 € y, al tercero, la mitad del importe de las operaciones requeridas con mínimo 10.000 y máximo 100.000 € (art. 203.6.a).

**5.5 [P] Modelo 721: no tiene régimen sancionador propio.** La DA 18.ª LGT (letra d, monedas virtuales en el extranjero) ya no contiene sanciones tras la Ley 5/2022; se aplican los arts. 198 y 199. La AEAT lo confirma expresamente para el 720 (https://sede.agenciatributaria.gob.es/Sede/todas-gestiones/impuestos-tasas/declaraciones-informativas/modelo-720-decla_____sobre-bienes-derechos-extranjero_/preguntas-frecuentes/sanciones-efectos.html); para el 721 es [INF] por compartir la misma DA 18.ª.
- No presentar (art. 198.1): **20 € por dato o conjunto de datos, mínimo 300 €, máximo 20.000 €**.
- Presentar tarde **sin requerimiento** (art. 198.2): la mitad → 10 € por dato, mínimo 150 €, máximo 10.000 €.
- Presentar incompleto o inexacto (art. 199): datos no monetarios, 200 € por dato (199.4); datos en magnitudes monetarias, hasta el 2 % de lo no declarado o mal declarado, mínimo 500 € (199.5). [NV] Cuál de los dos apartados aplica la AEAT al 721 en la práctica.

**5.6 [P] Declarar pérdidas improcedentes (art. 195).** Infracción grave: **15 %** del importe de las partidas a compensar en la base indebidamente acreditadas (50 % si son a deducir en la cuota). Es deducible de la sanción posterior del art. 191 cuando esas pérdidas se compensen.

---

## 6 · Prescripción

**6.1 [P]** Cuatro años (art. 66.a y b). Se cuenta desde el día siguiente al fin del plazo reglamentario de declaración (art. 67.1). Se interrumpe (art. 68.1) por cualquier acción de la Administración con conocimiento formal del obligado, por recursos y por **cualquier actuación fehaciente del propio obligado conducente a la liquidación** — es decir, presentar una complementaria o rectificativa reinicia los cuatro años de ese ejercicio. Interrumpido, el plazo empieza de cero (art. 68.6).

**6.2 Ejemplo [P plazo / INF fecha].** Renta 2022: plazo hasta el 30-06-2023 (campaña del 11 de abril al 30 de junio de 2023, manual AEAT 2022). Cómputo desde el 01-07-2023; último día para que la AEAT notifique: 30-06-2027, salvo interrupción.

**6.3 [P] Art. 66 bis.** La prescripción no afecta al derecho a comprobar e investigar (art. 115) hechos de ejercicios prescritos con efectos en no prescritos. El plazo de **10 años** del apartado 2 es solo para iniciar la comprobación de bases o cuotas compensadas o pendientes de compensar y deducciones. Aun pasados los 10 años, hay que aportar las autoliquidaciones donde constan (66 bis.3). Consecuencia práctica [INF]: el valor de adquisición de un bitcoin comprado en 2017 y vendido en 2026 se prueba en 2026-2030; guardar extractos sin fecha de caducidad.

---

## 7 · Delito fiscal (art. 305 CP)

**[P]** Cuota defraudada superior a **120.000 €**, por cada período impositivo en tributos periódicos (305.2.a). Pena: prisión de 1 a 5 años y multa del tanto al séxtuplo. Tipo agravado (305 bis): más de 600.000 €, organización criminal o interposición de personas/paraísos fiscales; prisión de 2 a 6 años. Prescripción (art. 131.1 CP): **5 años** el básico, **10** el agravado (pena máxima superior a 5 años). Regularización (305.4; art. 252 LGT): exige «completo reconocimiento **y pago**» antes de la notificación del inicio de actuaciones, de la querella o denuncia, o del conocimiento formal de diligencias; incluye cuota, intereses y recargos. Matiz: el delito prescribe a los 5 años aunque la deuda administrativa prescriba a los 4; el 305.4 permite regularizar también ese quinto año.

## 8 · Ganancias patrimoniales no justificadas (art. 39 LIRPF)

**[P]** Texto vigente (un solo párrafo; el antiguo apartado 2, ligado al modelo 720, está derogado): son ganancias no justificadas los bienes o derechos cuya tenencia, declaración o adquisición no se corresponda con la renta o patrimonio declarados. Se integran en la **base liquidable general** del período en que se descubran, «salvo que el contribuyente pruebe suficientemente que ha sido titular […] desde una fecha anterior a la del periodo de prescripción». Efecto: tributan a escala general (no al 19-30 % del ahorro) y la carga de la prueba es del contribuyente. Las Directrices 2026 las citan como objetivo en criptoactivos.

## 9 · Aplazamiento y fraccionamiento (art. 65 LGT)

**[P]** Se puede aplazar en voluntaria o ejecutiva si la situación económica impide transitoriamente pagar; la solicitud en voluntaria impide el período ejecutivo pero **devenga interés de demora** (65.5). Sin garantía hasta **50.000 €** de deuda conjunta: Orden HFP/311/2023, en vigor desde el 15-04-2023 (https://www.boe.es/buscar/act.php?id=BOE-A-2023-8119). Plazos (Instrucción 2/2023 del Departamento de Recaudación, modificada por la 3/2025 sin tocar estas cifras): resolución automatizada para personas físicas hasta **24 plazos mensuales** (12 las jurídicas), cuota mínima de 50 €; con aval o seguro de caución hasta 60 meses; inmueble urbano libre de cargas, 36; otras garantías, 24; dispensa, 12.
- https://sede.agenciatributaria.gob.es/static_files/Sede/Tema/Normativa/Regul_AEAT/Instrucciones/Instr_2_2023_AF.PDF
- Matiz: son topes de una instrucción interna, no un derecho; y el aplazamiento sin garantía hace perder la reducción del 25 % del recargo (punto 2.2).

---

## Contradicciones con lo ya escrito

1. **Guía, `page.tsx` línea 624 (sanciones del 721):** dice «300 € por no presentarlo tras requerimiento, 150 € por presentarlo incompleto o con errores, 20 € por dato omitido y 10 € por dato incorrecto». No coincide con los arts. 198-199: 20 €/dato con mínimo de 300 € es no presentar; 10 €/dato con mínimo de 150 € es presentar **tarde sin requerimiento**; lo incompleto o incorrecto va por el art. 199 (200 €/dato o hasta el 2 %, mínimo 500 €).
2. **Lección 01-03, línea 51:** afirma que la transposición de DAC8 «se ha hecho con una ley que modifica, entre otras, la Ley General Tributaria» y permite embargar criptoactivos. El texto consolidado de la LGT en el BOE muestra como última modificación el 21-12-2024 y no contiene la palabra «criptoactivo»; las Directrices de marzo de 2026 hablan de «futura transposición». Además anuncian un **modelo 175** que sustituye al 173. Revisar.
3. **Encargo:** la rectificativa de IRPF no arranca en Renta 2023 sino en Renta 2024; y el art. 89 RGAT no regula el plazo de los requerimientos.


---

