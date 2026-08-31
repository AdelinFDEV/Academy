/**
 * Los términos del diccionario, en un solo sitio.
 *
 * Vivían dentro de `GlosarioClient.tsx`, que es un componente de cliente, así
 * que ni el sitemap ni ninguna página de servidor podían leerlos. Sacarlos aquí
 * es lo que permite el punto 7 del plan SEO: darle URL propia a cada término.
 *
 * ⚠️  El campo `term` es la CLAVE con la que se guardan los términos favoritos
 * de cada usuario (tabla `saved_terms`, vía `/api/terms`). Cambiar el texto de
 * un `term` deja huérfanos los guardados de todo el mundo. El `slug` sí se
 * puede tocar mientras no esté publicado; una vez indexado, cambiarlo obliga a
 * una redirección.
 */

export type GlosarioCategoria = "básicos" | "trading" | "defi" | "seguridad";

export interface GlosarioTerm {
  /** Clave de guardados y nombre visible. NO cambiar a la ligera. */
  term: string;
  /** Segmento de URL en /glosario/[termino]. */
  slug: string;
  category: GlosarioCategoria;
  /** La definición corta, la que se ve en el listado. */
  definition: string;
  /**
   * El desarrollo largo, en párrafos de HTML ya escrito (mismo vocabulario que
   * las entradas: <p>, <strong>, <em>, <ul>/<li>).
   *
   * **Un término SIN esto no tiene página propia.** No es un olvido: una URL
   * con 25 palabras es contenido escaso, y Google penaliza publicarlas en masa.
   * Se van abriendo por tandas conforme se escriben (ver SEO-PLAN.md, punto 7).
   */
  extended?: string;
  /** Otros términos con los que se explica mejor. Son slugs de esta misma lista. */
  seeAlso?: string[];
}

export const GLOSARIO: GlosarioTerm[] = [
  {
    term: "Altcoin",
    slug: "altcoin",
    category: "básicos",
    definition: "Cualquier criptomoneda que no sea Bitcoin. El término viene de 'alternative coin'. Ejemplos: Ethereum, Solana, XRP.",
    seeAlso: ["bitcoin","market-cap","stablecoin"],
    extended: "<p>«Altcoin» es la contracción de <em>alternative coin</em>: literalmente, cualquier criptomoneda que no sea Bitcoin. Nació cuando Bitcoin era prácticamente lo único que existía y todo lo demás se agrupaba en un cajón de sastre. Hoy ese cajón contiene desde redes con miles de millones en valor hasta proyectos que no llegan a la semana de vida.</p>\n<p>La palabra es útil para hablar del mercado en conjunto, porque las altcoins tienden a moverse a la vez y de forma más brusca que Bitcoin: <strong>amplifican tanto las subidas como las caídas</strong>. Cuando alguien dice que «las altcoins van con retraso», se refiere a que históricamente el dinero suele entrar primero en Bitcoin y solo después se reparte hacia el resto.</p>\n<p>El error típico es tratar «altcoin» como si fuera una categoría de inversión con sentido propio. No lo es: <strong>mete en el mismo saco a una red consolidada y a un token sin producto</strong>, y lo único que tienen en común es no ser Bitcoin. Es una etiqueta descriptiva, no un criterio para decidir dónde poner tu dinero. Antes de comprar cualquiera de ellas, lo relevante es qué hace, quién la mantiene y cómo se reparten sus tokens.</p>",
  },
  {
    term: "Bitcoin (BTC)",
    slug: "bitcoin",
    category: "básicos",
    definition: "La primera y más importante criptomoneda, creada en 2009 por Satoshi Nakamoto. Es descentralizada y tiene un suministro máximo de 21 millones de monedas.",
    seeAlso: ["blockchain","halving","hash-rate"],
    extended: "<p>Bitcoin es la primera criptomoneda y la que dio origen a todo lo demás. Se puso en marcha en enero de 2009 a partir de un documento publicado unos meses antes por alguien —persona o grupo— bajo el nombre de <strong>Satoshi Nakamoto</strong>, cuya identidad real sigue sin conocerse. El problema que resolvía era concreto: cómo enviar dinero por internet sin que haga falta un banco que confirme que no lo has gastado ya dos veces.</p>\n<p>Dos rasgos lo definen. El primero es que <strong>no hay nadie al mando</strong>: la red la mantienen miles de ordenadores repartidos por el mundo, y ninguna empresa ni gobierno puede apagarla, congelarte el saldo o emitir monedas nuevas por su cuenta. El segundo es el límite: <strong>nunca existirán más de 21 millones de bitcoins</strong>, y esa cifra está escrita en las reglas que todos los participantes verifican.</p>\n<p>La confusión más común es pensar que un bitcoin es indivisible y que, a los precios actuales, hay que comprar uno entero. No es así: se divide en 100 millones de partes llamadas <em>satoshis</em>, y comprar 20 € de bitcoin es tan normal como comprar 20 € de cualquier otra cosa.</p>",
  },
  {
    term: "Blockchain",
    slug: "blockchain",
    category: "básicos",
    definition: "Tecnología de registro distribuido donde las transacciones se agrupan en bloques encadenados de forma cronológica. Es inmutable y transparente.",
    seeAlso: ["bitcoin","smart-contract","hash-rate"],
    extended: "<p>Una blockchain es un registro de operaciones que, en lugar de guardarse en el servidor de una empresa, está copiado en miles de ordenadores a la vez. Las operaciones se agrupan en <strong>bloques</strong>, y cada bloque lleva dentro una huella del anterior, lo que los encadena en orden. De ahí el nombre: cadena de bloques.</p>\n<p>Esa huella es lo que hace el invento interesante. Si alguien altera una operación de hace un año, la huella de ese bloque cambia, y con ella la de todos los que vienen detrás. <strong>Falsificar un dato obliga a rehacer toda la cadena posterior</strong> y a convencer a la mayoría de la red de que su copia es la equivocada. En redes grandes eso es tan caro que en la práctica nadie lo intenta.</p>\n<p>Conviene desmontar dos ideas extendidas. La primera: blockchain no significa anónimo. En la mayoría de redes las operaciones son <strong>públicas y consultables por cualquiera</strong>; lo que no aparece es tu nombre, solo una dirección. La segunda: tampoco significa seguro por definición. La cadena garantiza que el registro no se toca, no que el proyecto que hay encima sea honesto o que tu dinero esté a salvo.</p>",
  },
  {
    term: "Halving",
    slug: "halving",
    category: "básicos",
    definition: "Evento programado cada ~4 años en Bitcoin donde la recompensa por minar un bloque se reduce a la mitad. Históricamente ha precedido grandes subidas de precio.",
    seeAlso: ["bitcoin","hash-rate","bull-market"],
    extended: "<p>Cada vez que se añade un bloque a la cadena de Bitcoin, quien lo consigue recibe una recompensa en bitcoins recién creados. Esa recompensa <strong>se parte por la mitad cada 210.000 bloques</strong>, que en la práctica son unos cuatro años. A ese recorte se le llama halving, y es la forma en la que Bitcoin va cerrando el grifo de emisión hasta llegar al tope de 21 millones.</p>\n<p>Importa porque cambia la oferta nueva que llega al mercado sin cambiar nada más: de un día para otro, <strong>aparecen la mitad de bitcoins nuevos que el día anterior</strong>. No es una decisión que tome nadie ni una noticia que sorprenda: está en el código desde el principio y la fecha aproximada se conoce con años de antelación.</p>\n<p>Aquí está el malentendido más caro. Se repite que «después del halving el precio sube», y históricamente ha habido subidas fuertes en los meses posteriores a cada uno. Pero <strong>han ocurrido cuatro halvings en toda la historia</strong>, y cuatro casos no son una regla: son cuatro casos. Además, al ser un evento conocido de antemano, el mercado ha tenido años para descontarlo. Tomarlo como una garantía de calendario es exactamente el tipo de razonamiento que deja a la gente comprando en el peor momento.</p>",
  },
  {
    term: "Market Cap",
    slug: "market-cap",
    category: "básicos",
    definition: "Capitalización de mercado: precio actual × suministro en circulación. Indica el tamaño relativo de una criptomoneda.",
    seeAlso: ["altcoin","whale","bitcoin"],
    extended: "<p>La capitalización de mercado, o <em>market cap</em>, es una multiplicación sencilla: <strong>precio actual × monedas en circulación</strong>. Sirve para comparar el tamaño de dos criptomonedas sin dejarte engañar por el precio por unidad, que por sí solo no dice nada.</p>\n<p>Ese es justo su mayor uso. Es habitual ver a alguien descartar una moneda «porque vale 40.000 €» y preferir otra «porque vale 0,02 €», como si la segunda tuviera más recorrido. No funciona así: <strong>una moneda a 0,02 € con un billón de unidades en circulación es mucho más grande</strong> que otra a 40.000 € con unas pocas. El precio unitario depende de cuántas unidades se decidieron emitir, que es una cifra arbitraria.</p>\n<p>Y una advertencia sobre lo que el market cap <em>no</em> es: no es el dinero que hay invertido en un proyecto. Es una foto teórica que asume que todas las monedas valen lo que vale la última operación. En proyectos con poca liquidez esa foto se rompe enseguida —vender una fracción del total hunde el precio mucho antes de llegar a esa cifra—. Conviene mirar también el <strong>volumen negociado</strong> y qué parte del suministro está realmente disponible y no bloqueada.</p>",
  },
  {
    term: "Wallet (Cartera)",
    slug: "wallet",
    category: "básicos",
    definition: "Software o dispositivo físico que almacena las claves privadas que dan acceso a tus criptomonedas. No almacena monedas, sino las claves para acceder a ellas.",
    seeAlso: ["clave-privada","seed-phrase","cold-wallet"],
    extended: "<p>Una wallet, o cartera, es lo que guarda las <strong>claves</strong> que dan acceso a tus criptomonedas. Y la frase importante es esa: guarda las claves, <strong>no las monedas</strong>. Las monedas nunca salen de la blockchain; lo que la cartera custodia es la prueba de que puedes moverlas.</p>\n<p>La distinción no es un tecnicismo. Explica por qué, si pierdes el móvil, no pierdes nada siempre que conserves tu frase de recuperación: instalas la cartera en otro dispositivo, la restauras y tus fondos siguen exactamente donde estaban. Y explica lo contrario: <strong>quien tenga tus claves tiene tus fondos</strong>, esté donde esté y sin necesidad de tocar tu teléfono.</p>\n<p>Hay dos familias. Las <em>hot wallets</em> están conectadas a internet —una app, una extensión del navegador— y son cómodas para el día a día. Las <em>cold wallets</em> son aparatos que guardan la clave sin conexión, y son las adecuadas para cantidades que no piensas mover.</p>\n<p>El error clásico de quien empieza es dejar todo en la cuenta de un exchange y llamar a eso «mi wallet». Ahí las claves no son tuyas, son de la plataforma: <strong>tienes un saldo apuntado a tu nombre, no el control del activo</strong>.</p>",
  },
  {
    term: "Exchange",
    slug: "exchange",
    category: "básicos",
    definition: "Plataforma donde se compran, venden e intercambian criptomonedas. Pueden ser centralizados (CEX) como Binance o descentralizados (DEX) como Uniswap.",
    seeAlso: ["dex","wallet","liquidacion"],
    extended: "<p>Un exchange es el sitio donde se compran, se venden y se cambian criptomonedas. Es la puerta de entrada para casi todo el mundo, porque es donde el dinero de toda la vida se convierte en cripto y al revés.</p>\n<p>Se dividen en dos tipos, y la diferencia entre ellos es quién guarda tus fondos. En un <strong>exchange centralizado (CEX)</strong> hay una empresa que custodia tus monedas, lleva un registro interno de quién tiene qué y te pide identificarte. Es cómodo, tiene atención al cliente y suele ser lo más fácil para empezar. En un <strong>exchange descentralizado (DEX)</strong> no hay custodia: operas desde tu propia cartera y el intercambio lo ejecuta un programa en la blockchain.</p>\n<p>La comodidad del centralizado tiene una contrapartida que conviene entender antes que después: mientras tus monedas están ahí, <strong>no son tuyas en el sentido técnico</strong>, son un apunte en la base de datos de una empresa. Si esa empresa quiebra, sufre un ataque o congela las retiradas, tu saldo depende de ella. De ahí el dicho de que un exchange es para operar, no para guardar. Lo que no vayas a mover en una temporada, mejor en tu propia cartera.</p>",
  },
  {
    term: "Gas",
    slug: "gas",
    category: "básicos",
    definition: "Tarifa pagada en ETH para ejecutar transacciones o contratos inteligentes en la red Ethereum. Varía según la congestión de la red.",
    seeAlso: ["smart-contract","blockchain","dex"],
    extended: "<p>El gas es lo que se paga por que la red ejecute algo por ti. Cada operación —enviar tokens, firmar un intercambio, interactuar con un contrato— consume recursos de miles de ordenadores, y esa comisión es lo que compensa el trabajo. El término viene de Ethereum, pero la idea se usa hoy para hablar de las comisiones de casi cualquier red.</p>\n<p>Lo desconcertante para quien empieza es que <strong>el precio no depende de cuánto dinero muevas</strong>. Enviar 10 € y enviar 100.000 € cuesta prácticamente lo mismo, porque lo que se paga es el esfuerzo de cómputo, no el importe. Lo que sí lo cambia todo es la <strong>congestión</strong>: cuando mucha gente quiere operar a la vez, se compite por entrar en el siguiente bloque y las comisiones se disparan.</p>\n<p>De ahí dos consecuencias prácticas. La primera es que las operaciones pequeñas pueden dejar de tener sentido en momentos de saturación: nadie paga 30 € de comisión por mover 20 €. La segunda es que <strong>hay que reservar siempre algo de la moneda nativa de la red</strong> para las comisiones. Es un tropiezo habitual: tener la cartera llena de tokens y no poder mover ninguno por no tener con qué pagar el gas.</p>",
  },
  {
    term: "Hash Rate",
    slug: "hash-rate",
    category: "básicos",
    definition: "Poder de cómputo total de una red blockchain. Mayor hash rate = red más segura y descentralizada.",
    seeAlso: ["bitcoin","halving","blockchain"],
    extended: "<p>El hash rate es la potencia de cálculo total que están dedicando a una red todos los equipos que la sostienen. Se mide en operaciones por segundo, y las cifras son tan grandes que se manejan con prefijos como <em>tera</em>, <em>peta</em> o <em>exa</em>.</p>\n<p>Es, básicamente, el indicador de seguridad de una red que funciona por minería. Para reescribir el historial de operaciones haría falta reunir más potencia que todo el resto junto y mantenerla el tiempo suficiente. <strong>Cuanto más alto es el hash rate, más caro resulta ese ataque</strong>, hasta el punto de dejar de ser rentable. Es una barrera económica antes que técnica.</p>\n<p>Como señal tiene una lectura útil: un hash rate que sube sostenidamente indica que sigue entrando inversión en equipos, y esa es una apuesta a años vista, no a una semana. Una caída brusca suele responder a algo concreto y verificable —una región que prohíbe la minería, un apagón, una subida del precio de la luz—.</p>\n<p>Lo que no conviene es convertirlo en un indicador de precio. Circula la idea de que «el precio sigue al hash rate», y la relación es mucho más floja y discutida de lo que sugiere esa frase: <strong>no es una herramienta para decidir cuándo comprar</strong>.</p>",
  },
  {
    term: "NFT",
    slug: "nft",
    category: "básicos",
    definition: "Token No Fungible. Activo digital único en blockchain que representa la propiedad de un ítem digital o físico. No es intercambiable 1:1 como las monedas.",
    seeAlso: ["blockchain","smart-contract","web3"],
    extended: "<p>NFT son las siglas de <em>Non-Fungible Token</em>: token no fungible. Fungible significa intercambiable por otro idéntico —un euro por otro euro, un bitcoin por otro bitcoin, y da igual cuál te toque—. Un NFT es lo contrario: <strong>cada unidad es distinguible del resto</strong> y tiene su propio identificador en la blockchain.</p>\n<p>Esa singularidad es lo único que aporta la tecnología: un registro público de quién posee una unidad concreta, que se puede transferir sin intermediario. Sirve para una imagen, sí, pero también para una entrada, una licencia, un dominio o un certificado.</p>\n<p>Y aquí hace falta ser preciso, porque es el punto donde más gente se confunde. <strong>Comprar un NFT normalmente no es comprar el archivo, ni los derechos de autor de la obra.</strong> Lo que se adquiere es una anotación en la cadena que apunta a ese contenido; en muchos proyectos la imagen ni siquiera está en la blockchain, sino en un servidor que alguien tiene que seguir pagando. Los derechos que obtienes son los que el proyecto haya decidido concederte por escrito, ni uno más.</p>\n<p>Después de la euforia de 2021 y del desplome posterior, la lección que queda es sencilla: la tecnología resuelve la propiedad de un identificador, no crea valor por sí sola.</p>",
  },
  {
    term: "Stablecoin",
    slug: "stablecoin",
    category: "básicos",
    definition: "Criptomoneda diseñada para mantener un precio estable, generalmente anclado al dólar (USDT, USDC). Útil para evitar la volatilidad sin salir del ecosistema crypto.",
    seeAlso: ["exchange","defi","altcoin"],
    extended: "<p>Una stablecoin es una criptomoneda diseñada para valer siempre lo mismo, casi siempre un dólar. Existe porque resuelve un problema muy concreto: <strong>poder salir de la volatilidad sin salir del ecosistema</strong>. Sin ellas, protegerse de una caída obligaría a vender a euros y sacar el dinero a un banco cada vez.</p>\n<p>Lo importante es cómo mantienen ese precio, porque no todas lo hacen igual y el riesgo cambia por completo. Las más usadas son las <strong>respaldadas por reservas</strong>: una empresa guarda dólares y deuda a corto plazo, y promete devolver un dólar por cada token emitido. Ahí el riesgo no es de mercado, es de confianza —depende de que esas reservas existan de verdad y sean accesibles—, y por eso las auditorías periódicas son la parte que hay que mirar.</p>\n<p>Hubo también stablecoins que mantenían el precio con algoritmos y sin reservas reales. El colapso de una de las mayores en 2022 borró decenas de miles de millones en días y dejó la enseñanza clara.</p>\n<p>Conclusión práctica: <strong>«estable» describe el objetivo, no una garantía</strong>. Una stablecoin puede perder su anclaje, y ha pasado. Cuando se usa para aparcar dinero, conviene saber quién la emite y con qué respaldo.</p>",
  },
  {
    term: "Web3",
    slug: "web3",
    category: "básicos",
    definition: "Visión de internet descentralizada basada en blockchain, donde los usuarios controlan sus propios datos y activos digitales sin depender de grandes empresas.",
    seeAlso: ["defi","nft","smart-contract"],
    extended: "<p>Web3 es el nombre que se le da a la idea de un internet donde el usuario controla sus datos y sus activos sin depender de unas pocas empresas. Se explica normalmente como la tercera etapa: una web inicial de páginas que solo se leían, una segunda de plataformas donde cualquiera publica pero los datos son de la plataforma, y una tercera construida sobre blockchain donde <strong>la cuenta es tuya y no de la empresa</strong>.</p>\n<p>La diferencia concreta está en el inicio de sesión. En una aplicación de las de siempre, tu cuenta vive en el servidor de alguien que puede suspenderla. En una aplicación web3 te identificas con tu propia cartera, y esa identidad y lo que hay asociado a ella te siguen aunque el proyecto cierre.</p>\n<p>Ahora la parte incómoda, porque el término se usa con mucha ligereza: <strong>es una aspiración, no una descripción de cómo funciona hoy internet</strong>. Buena parte de lo que se etiqueta como web3 depende de servidores, empresas y pasarelas tan centralizados como los de siempre, y una parte de lo que se vendió bajo esa palabra no tenía producto detrás. Merece la pena conocer el concepto, y conviene tratar la etiqueta con escepticismo: mirar qué hace el proyecto, no cómo se llama a sí mismo.</p>",
  },
  {
    term: "ATH",
    slug: "ath",
    category: "trading",
    definition: "All Time High. El precio más alto que ha alcanzado un activo en toda su historia. Importante nivel de referencia psicológica.",
    seeAlso: ["atl","bull-market","fomo"],
    extended: "<p>ATH son las siglas de <em>All Time High</em>: el precio más alto que ha alcanzado un activo en toda su historia. No es un nivel técnico calculado, es simplemente un récord.</p>\n<p>Su interés es más psicológico que otra cosa. Cuando un activo está en máximos históricos, <strong>no queda nadie que lo haya comprado más caro</strong>: absolutamente todos los que lo tienen están en ganancias. Eso elimina la presión vendedora de quien lleva tiempo esperando a recuperar lo invertido, y explica que los movimientos por encima del ATH a veces sean rápidos.</p>\n<p>El malentendido serio es leerlo como una señal, y funciona en las dos direcciones opuestas y contradictorias. Unos ven el máximo histórico como un techo del que hay que huir; otros, como confirmación de que hay que entrar. <strong>El ATH no dice nada sobre lo que va a pasar después</strong>: es un dato del pasado, y de hecho todo activo que ha subido de forma sostenida ha ido rompiendo su ATH una y otra vez.</p>\n<p>Sí conviene tener presente el reverso: comprar en máximos significa que <strong>cualquier caída te deja inmediatamente en pérdidas</strong>, sin ningún nivel de compra previo por debajo que te sostenga. No es un motivo para no hacerlo, es un motivo para saber en qué situación te pones.</p>",
  },
  {
    term: "ATL",
    slug: "atl",
    category: "trading",
    definition: "All Time Low. El precio más bajo registrado de un activo. Otro nivel de referencia clave para evaluar el recorrido de un proyecto.",
    seeAlso: ["ath","bear-market","soporte"],
    extended: "<p>ATL es <em>All Time Low</em>: el precio más bajo que ha tocado un activo desde que existe. Es el espejo del ATH.</p>\n<p>Se usa sobre todo para poner en contexto una caída. Saber que algo ha bajado un 60 % dice poco por sí solo; saber si ese precio está cerca de su mínimo histórico o todavía muy por encima cambia la lectura por completo.</p>\n<p>Donde hay que tener cuidado es en la conclusión fácil: «está en mínimos históricos, ya no puede bajar más». <strong>Sí puede.</strong> Un mínimo histórico solo significa que hoy es el punto más bajo hasta la fecha; mañana puede haber otro, y luego otro. Muchos proyectos han encadenado mínimos históricos durante años hasta desaparecer, y en el camino el precio siempre parecía «ya muy bajo».</p>\n<p>Hay además una asimetría que conviene entender: un activo puede subir sin límite teórico, pero <strong>solo puede caer hasta cero, y de ahí no vuelve</strong>. Por eso un mínimo histórico persistente merece la pregunta incómoda —qué ha cambiado en el proyecto— antes que la pregunta cómoda de si está barato.</p>",
  },
  {
    term: "Bear Market",
    slug: "bear-market",
    category: "trading",
    definition: "Mercado bajista. Período prolongado de caída de precios, generalmente superior al 20% desde máximos. Se caracteriza por pesimismo generalizado.",
    seeAlso: ["bull-market","fud","hodl"],
    extended: "<p>Un bear market, o mercado bajista, es un periodo prolongado de caída de precios. La convención más usada lo sitúa a partir de una <strong>caída del 20 % desde máximos</strong> que además se sostiene en el tiempo, no un mal día suelto.</p>\n<p>Lo que lo define no es solo el precio, es el ambiente. Baja el volumen, desaparecen los titulares, se vacían las comunidades y proyectos que parecían imprescindibles dejan de actualizarse. En cripto los mercados bajistas han sido históricamente <strong>más profundos y más largos</strong> que en bolsa: caídas del 70-80 % desde máximos y periodos de más de un año no son una anomalía.</p>\n<p>La confusión habitual es tratarlo como una fase que se identifica en el momento. No se identifica: se reconoce meses después, cuando ya está bien entrado. En tiempo real, una caída del 25 % es indistinguible del principio de algo mucho peor o de una corrección pasajera.</p>\n<p>La lección que suele quedar es menos glamurosa que las teorías de calendario: <strong>lo que decide cómo aguantas un mercado bajista es lo que hiciste antes de que empezara</strong> —cuánto pusiste y en qué—, no lo listo que seas cuando ya está cayendo.</p>",
  },
  {
    term: "Bull Market",
    slug: "bull-market",
    category: "trading",
    definition: "Mercado alcista. Período de subida sostenida de precios acompañado de optimismo y mayor adopción. Suele seguir a un halving de Bitcoin.",
    seeAlso: ["bear-market","fomo","ath"],
    extended: "<p>Un bull market, o mercado alcista, es un periodo sostenido de subida de precios acompañado de optimismo, entrada de dinero nuevo y más gente hablando del tema. Es el reverso del mercado bajista.</p>\n<p>En cripto tiene una característica que lo distingue: la subida no se reparte por igual. Suele empezar concentrada en Bitcoin y <strong>solo después el dinero se desplaza hacia el resto</strong>, con movimientos cada vez más bruscos según se baja en tamaño. De ahí la sensación de que «todo sube» en las fases finales, incluidos proyectos sin nada detrás.</p>\n<p>Y ahí está el peligro real, que es contraintuitivo. En un mercado alcista <strong>todo el mundo acierta</strong>: cualquier compra, elegida como sea, sale bien durante un tiempo. Eso hace que la gente confunda un mercado favorable con criterio propio, aumente el tamaño de sus posiciones justo cuando más caro está todo, y llegue al giro con más dinero expuesto que nunca.</p>\n<p>Como el bajista, tampoco se reconoce en el momento. La única parte del ciclo que se identifica con certeza es la que ya ha terminado.</p>",
  },
  {
    term: "DCA",
    slug: "dca",
    category: "trading",
    definition: "Dollar Cost Averaging. Estrategia de inversión que consiste en comprar una cantidad fija en intervalos regulares, sin importar el precio. Reduce el impacto de la volatilidad.",
    seeAlso: ["fomo","hodl","roi"],
    extended: "<p>DCA son las siglas de <em>Dollar Cost Averaging</em>, en español «promediar el coste». Consiste en comprar <strong>una cantidad fija cada cierto tiempo</strong> —por ejemplo, lo mismo cada mes— sin mirar el precio ni intentar elegir el momento.</p>\n<p>La mecánica hace algo elegante por sí sola: con una cantidad fija compras <strong>más unidades cuando el precio está bajo y menos cuando está alto</strong>, sin tener que decidirlo. El precio medio de tu compra acaba siendo más suave que si intentaras acertar con el momento.</p>\n<p>Su valor real, sin embargo, no es matemático sino de comportamiento. Elimina la peor decisión de todas —meter todo lo que tienes justo antes de una caída— y, sobre todo, <strong>te quita de encima la pregunta de si hoy es buen momento</strong>, que es la que lleva a la mayoría a comprar tarde y vender con miedo.</p>\n<p>Conviene ser claro con lo que no hace. El DCA <strong>no garantiza ganancias ni protege de perder dinero</strong>: si un activo cae de forma sostenida, comprar cada mes significa acumular pérdidas de forma ordenada. Reduce el riesgo de elegir mal el momento, no el riesgo de elegir mal el activo.</p>",
  },
  {
    term: "DYOR",
    slug: "dyor",
    category: "trading",
    definition: "Do Your Own Research (Haz tu propia investigación). Principio fundamental en crypto: nunca inviertas basándote solo en consejos de terceros.",
    seeAlso: ["fud","fomo","pump-and-dump"],
    extended: "<p>DYOR es <em>Do Your Own Research</em>: haz tu propia investigación. Es la advertencia más repetida del sector y significa que <strong>nadie debería poner dinero en algo porque se lo haya recomendado un tercero</strong>, por convincente que suene o por mucho que acertara la última vez.</p>\n<p>Existe porque en cripto no hay filtro previo. No hace falta permiso de nadie para lanzar un token, ni auditoría obligatoria, ni un folleto que alguien tenga que aprobar. Todo el trabajo de comprobación que en otros mercados hacen los reguladores recae aquí en quien compra.</p>\n<p>El problema es que la sigla se ha vaciado de contenido: se usa como coletilla al final de una recomendación, precisamente para eludir responsabilidad. «Compra esto, DYOR» no es investigar, es una promoción con un descargo legal pegado.</p>\n<p>Investigar de verdad es más aburrido y contesta preguntas concretas: <strong>qué problema resuelve el proyecto, quién lo mantiene y con qué nombres, cómo se reparten los tokens y qué parte tiene el equipo, si el código está publicado y auditado, y de qué vive</strong>. Si alguna de esas respuestas no aparece por ningún lado, esa ausencia ya es la respuesta.</p>",
  },
  {
    term: "FOMO",
    slug: "fomo",
    category: "trading",
    definition: "Fear Of Missing Out (Miedo a perderse algo). Emoción que lleva a comprar en máximos por el miedo a perder una subida. Uno de los errores más costosos en trading.",
    seeAlso: ["fud","bull-market","dca"],
    extended: "<p>FOMO es <em>Fear Of Missing Out</em>: el miedo a quedarse fuera. Es la sensación de urgencia que aparece cuando algo lleva días subiendo, todo el mundo habla de ello y se te mete la idea de que es tu última oportunidad.</p>\n<p>Merece figurar en un diccionario de trading porque <strong>es probablemente lo que más dinero ha costado a los inversores particulares</strong>, más que cualquier error de análisis. Y tiene una mecánica muy concreta: la atención llega tarde. Un activo empieza a subir, la subida genera titulares, los titulares atraen a gente nueva, y esa gente compra en el punto de máxima euforia. Por definición, <strong>el FOMO empuja a comprar cuando el precio ya ha subido</strong>, que es exactamente lo contrario de lo que uno diría que quiere hacer.</p>\n<p>La señal de alarma es reconocible por dentro: si estás a punto de comprar algo y lo que sientes es prisa —si tu razonamiento es «que se me escapa» y no «esto vale lo que cuesta»—, eso es FOMO, no una decisión.</p>\n<p>El antídoto no es la fuerza de voluntad, es quitarse la decisión de encima: <strong>decidir antes, en frío, qué comprarías y a qué ritmo</strong>. Es justo lo que resuelve el DCA.</p>",
  },
  {
    term: "FUD",
    slug: "fud",
    category: "trading",
    definition: "Fear, Uncertainty and Doubt (Miedo, incertidumbre y duda). Información negativa, a veces falsa, que genera pánico y caídas de precio.",
    seeAlso: ["fomo","dyor","bear-market"],
    extended: "<p>FUD son las siglas de <em>Fear, Uncertainty and Doubt</em>: miedo, incertidumbre y duda. Describe información negativa —a veces exagerada, a veces directamente falsa— que se difunde y provoca ventas por pánico.</p>\n<p>Como fenómeno es real: en un mercado que opera sin pausa y donde muchos participantes están apalancados, un rumor puede desencadenar ventas en cadena antes de que nadie confirme nada. Han existido campañas deliberadas para hundir un precio y comprar más abajo.</p>\n<p>Pero aquí hace falta una advertencia que casi nunca se da, y es más importante que la definición. <strong>La palabra se usa muchísimo más para silenciar críticas legítimas que para señalar manipulación real.</strong> En cuanto alguien pregunta por las reservas de un proyecto, por un reparto de tokens opaco o por una promesa incumplida, aparece la etiqueta «eso es FUD» y la conversación se cierra.</p>\n<p>La forma de distinguirlos es sencilla y no requiere ser experto: <strong>una crítica legítima se puede comprobar</strong> —señala un documento, una dirección, una fecha—. El FUD real es vago, urgente y anónimo. Si la respuesta a un dato verificable es una etiqueta en vez de otro dato, la señal no es tranquilizadora.</p>",
  },
  {
    term: "HODL",
    slug: "hodl",
    category: "trading",
    definition: "Hold On for Dear Life. Estrategia de mantener criptomonedas a largo plazo sin vender durante caídas. Viene de un error tipográfico que se viralizó en 2013.",
    seeAlso: ["dca","bear-market","bull-market"],
    extended: "<p>HODL nació de una errata. En diciembre de 2013, en pleno desplome, un usuario escribió en un foro que aguantaba —<em>holding</em>— y tecleó «hodl». El mensaje se hizo célebre y la palabra se quedó, reinterpretada después como <em>Hold On for Dear Life</em>.</p>\n<p>Describe la estrategia de mantener a largo plazo sin vender en las caídas. Detrás hay una idea razonable: la mayoría de los particulares obtienen peores resultados intentando entrar y salir que quedándose quietos, porque acaban vendiendo por miedo y recomprando por FOMO, sistemáticamente en el peor momento de ambos.</p>\n<p>Ahora la parte que la palabra oculta, y es la que importa. <strong>«Aguantar» solo tiene sentido si lo que tienes sobrevive.</strong> Bitcoin ha recuperado todas sus caídas hasta hoy; miles de proyectos de 2017 y 2021 no recuperaron nunca, y quien aguantó en ellos no fue paciente, se quedó atrapado.</p>\n<p>Convertido en identidad, HODL se vuelve una excusa para no revisar nunca una decisión y para tomarse cualquier duda como falta de fe. Mantener a largo plazo es una estrategia; <strong>negarse a mirar si algo ha cambiado no lo es</strong>.</p>",
  },
  {
    term: "Liquidación",
    slug: "liquidacion",
    category: "trading",
    definition: "Cierre forzado de una posición apalancada cuando las pérdidas alcanzan el margen disponible. El exchange vende automáticamente tus activos.",
    seeAlso: ["long-short","stop-loss","pnl"],
    extended: "<p>Una liquidación es el cierre forzoso de una posición apalancada cuando las pérdidas se comen la garantía que depositaste. No la decides tú: <strong>la ejecuta la plataforma automáticamente</strong> para no acabar debiéndote dinero, y cuando ocurre esos fondos ya no están.</p>\n<p>Es la consecuencia directa del apalancamiento. Operar con 10 veces tu capital significa que <strong>un movimiento del 10 % en tu contra basta para dejarte a cero</strong>; con 50 veces, basta un 2 %. Y ese 2 % en cripto es un rato cualquiera de un martes, no un acontecimiento.</p>\n<p>Hay un efecto de segundo orden que sorprende a quien empieza: las liquidaciones se alimentan entre sí. Cuando el precio alcanza una zona con muchas posiciones apalancadas, cerrarlas a la fuerza genera órdenes que empujan el precio todavía más en esa dirección, lo que liquida a los siguientes. Es lo que hay detrás de esas velas verticales que parecen no responder a ninguna noticia.</p>\n<p>Y el error de concepto más caro: creer que el <em>stop loss</em> te protege de esto. En un movimiento violento el precio puede saltarse tu nivel sin llegar a ejecutarse ahí, y <strong>la liquidación no admite negociación</strong>. La única variable que controlas de verdad es cuánto apalancamiento usas.</p>",
  },
  {
    term: "Long / Short",
    slug: "long-short",
    category: "trading",
    definition: "Long: apostar a que el precio sube (comprar). Short: apostar a que el precio baja (vender en corto). Conceptos básicos del trading con derivados.",
    seeAlso: ["liquidacion","stop-loss","pnl"],
    extended: "<p>Son las dos direcciones en las que se puede apostar. Ponerse <strong>largo</strong> (<em>long</em>) es apostar a que el precio sube: comprar barato para vender caro, lo que todo el mundo entiende por invertir. Ponerse <strong>corto</strong> (<em>short</em>) es apostar a que baja.</p>\n<p>El corto desconcierta porque parece vender algo que no tienes, y en esencia eso es: tomas prestado el activo, lo vendes al precio actual y te comprometes a devolverlo más adelante. Si para entonces ha bajado, lo recompras más barato y la diferencia es tu ganancia.</p>\n<p>La asimetría entre ambos es el dato que hay que grabarse. En un largo, <strong>lo máximo que puedes perder es lo que pusiste</strong>: el precio puede caer hasta cero y ahí se acaba. En un corto no hay techo: si el precio sube, tu pérdida crece con él, y <strong>no existe un límite teórico a cuánto puede subir algo</strong>.</p>\n<p>Por eso los cortos se liquidan con especial violencia en las subidas rápidas: cerrarlos obliga a comprar, y esas compras empujan el precio todavía más arriba, forzando el cierre de los siguientes. No son operaciones simétricas aunque se nombren juntas.</p>",
  },
  {
    term: "PnL",
    slug: "pnl",
    category: "trading",
    definition: "Profit and Loss (Ganancias y Pérdidas). Resultado financiero de tus operaciones. PnL realizado: ya cerrado. PnL no realizado: posición abierta.",
    seeAlso: ["roi","liquidacion","take-profit"],
    extended: "<p>PnL es <em>Profit and Loss</em>: ganancias y pérdidas. Es el resultado de tus operaciones, y se presenta siempre en dos versiones que conviene no confundir.</p>\n<p>El <strong>PnL no realizado</strong> es lo que ganas o pierdes sobre el papel en posiciones que siguen abiertas. Es un número que cambia cada segundo y que <strong>todavía no es dinero</strong>. El <strong>PnL realizado</strong> es lo que queda cuando cierras: eso sí es un resultado definitivo.</p>\n<p>La distinción parece obvia escrita, y es donde más gente tropieza. Es muy fácil sentirse en ganancias durante meses por una cifra verde en una pantalla que nunca llega a convertirse en nada, y también es fácil ver esa cifra evaporarse en una sola sesión.</p>\n<p>Dos apuntes prácticos. El primero: <strong>el PnL que muestra la plataforma suele ignorar las comisiones</strong> y, en operaciones con derivados, el coste de mantener la posición abierta; el resultado real es peor que el que ves. El segundo, y más incómodo: si tu PnL está en euros pero tu cartera está en cripto, tu resultado depende también de lo que haga esa moneda. Se puede ganar en una cuenta y perder en la otra a la vez.</p>",
  },
  {
    term: "Pump and Dump",
    slug: "pump-and-dump",
    category: "trading",
    definition: "Manipulación de mercado donde un grupo infla artificialmente el precio de un activo para luego vender masivamente, dejando pérdidas a los compradores tardíos.",
    seeAlso: ["dyor","fomo","whale"],
    extended: "<p>Un <em>pump and dump</em> es una manipulación en dos tiempos. Primero un grupo acumula un activo poco negociado y lo impulsa con compras coordinadas y promoción —el <strong>pump</strong>—. Cuando la subida atrae a suficiente gente de fuera, venden todo de golpe contra esas compras —el <strong>dump</strong>— y el precio se desploma.</p>\n<p>Funciona porque necesita muy poco. En un activo con poca liquidez, unas cuantas compras mueven el precio lo bastante como para que la subida sea la propia publicidad: el gráfico verde hace el trabajo de convencer.</p>\n<p>Las señales son casi siempre las mismas: un proyecto del que nadie hablaba hace una semana, una subida enorme sin ninguna noticia que la explique, mensajes idénticos repetidos por muchas cuentas, y una insistencia rara en la urgencia y en «no quedarse fuera».</p>\n<p>Conviene desmontar una idea peligrosa: la de que se puede participar y salir a tiempo. <strong>Quien organiza el esquema sabe cuándo va a vender y tú no</strong>, y para que él gane hace falta que alguien compre justo entonces. Ese alguien es quien entra por el gráfico. En muchos países esto es delito en mercados regulados; en cripto la persecución es mucho más irregular, lo que no lo hace menos dañino para quien lo sufre.</p>",
  },
  {
    term: "Resistencia",
    slug: "resistencia",
    category: "trading",
    definition: "Nivel de precio donde históricamente la presión vendedora detiene o revierte una subida. Zona clave en análisis técnico.",
    seeAlso: ["soporte","ath","stop-loss"],
    extended: "<p>Una resistencia es un nivel de precio en el que, históricamente, las subidas se han frenado o se han dado la vuelta. La explicación que se le da es que ahí aparece suficiente gente dispuesta a vender como para absorber a los que compran.</p>\n<p>Por qué se forman tiene una lógica de comportamiento bastante humana: en niveles donde mucha gente compró y luego vio caer el precio, al volver a ese punto abundan los que quieren salir <strong>sin pérdidas</strong>. Esa oferta acumulada es la que frena la subida.</p>\n<p>Hay una regla clásica que sí es útil conocer: <strong>si el precio la supera con claridad, esa resistencia tiende a convertirse en soporte</strong>. Quienes querían vender ahí ya vendieron, y el nivel pasa a actuar como suelo.</p>\n<p>Y ahora la advertencia, porque el análisis técnico se presenta a menudo con más certeza de la que tiene. <strong>Una resistencia no es una barrera física, es una zona</strong>, y se dibuja mirando hacia atrás. Sobre un gráfico pasado siempre se pueden trazar líneas que parecen haber funcionado; el mérito está en que funcionen hacia delante, y ahí los resultados son mucho más discutidos. Sirve para poner en contexto lo que ha pasado, no como bola de cristal.</p>",
  },
  {
    term: "ROI",
    slug: "roi",
    category: "trading",
    definition: "Return on Investment (Retorno sobre la inversión). Porcentaje de ganancia o pérdida sobre el capital invertido. ROI = (ganancia / inversión) × 100.",
    seeAlso: ["pnl","dca","take-profit"],
    extended: "<p>ROI es <em>Return on Investment</em>, retorno sobre la inversión: cuánto has ganado o perdido en porcentaje sobre lo que pusiste. La fórmula es <strong>(ganancia ÷ inversión) × 100</strong>. Si metiste 1.000 € y tienes 1.300 €, tu ROI es del 30 %.</p>\n<p>Se usa porque permite comparar cosas de tamaño distinto: 300 € de ganancia no significan nada hasta saber si venían de invertir 1.000 o 100.000.</p>\n<p>Dicho eso, es una cifra que se enseña con mucha alegría y casi siempre incompleta. Faltan tres cosas. La primera, <strong>el tiempo</strong>: un 30 % en un mes y un 30 % en cinco años son resultados incomparables, y sin el plazo el número no dice nada. La segunda, <strong>los costes</strong>: comisiones de compra, de venta, de retirada e impuestos, que salen justo de esa ganancia. La tercera, <strong>el riesgo asumido</strong>, que no aparece en la fórmula por ningún lado —un 50 % logrado con una apuesta que pudo acabar en cero no es mejor resultado que un 10 % tranquilo, aunque el número sea mayor—.</p>\n<p>Cuando veas un ROI espectacular sin plazo, sin costes y sin contexto de riesgo, lo que tienes delante no es un dato: <strong>es un titular</strong>.</p>",
  },
  {
    term: "Soporte",
    slug: "soporte",
    category: "trading",
    definition: "Nivel de precio donde históricamente la presión compradora detiene o revierte una caída. Si se rompe, suele convertirse en resistencia.",
    seeAlso: ["resistencia","atl","stop-loss"],
    extended: "<p>Un soporte es lo contrario de una resistencia: un nivel de precio donde, históricamente, las caídas se han frenado. La idea es que ahí aparece suficiente interés comprador como para detener la bajada.</p>\n<p>Se forman en zonas donde el precio ya rebotó antes, y en parte se cumplen porque mucha gente los está mirando: si un número redondo o un mínimo anterior está en todas las pantallas, se acumulan órdenes de compra justo ahí, y esas órdenes son las que producen el rebote. Tiene bastante de profecía autocumplida.</p>\n<p>Igual que con la resistencia, la regla clásica funciona al revés: <strong>un soporte que se rompe suele pasar a actuar como resistencia</strong> cuando el precio intenta volver.</p>\n<p>El error costoso es usarlo como red de seguridad. «Si baja, ahí tiene un soporte fuerte» es una de las frases que más caro salen, porque <strong>los soportes se rompen constantemente</strong>, y cuando lo hacen suelen romperse rápido: todo el que estaba comprando ahí sale a la vez. Un soporte describe dónde ha frenado el precio antes; no promete que vuelva a hacerlo.</p>",
  },
  {
    term: "Stop Loss",
    slug: "stop-loss",
    category: "trading",
    definition: "Orden automática para cerrar una posición con pérdida limitada cuando el precio cae a un nivel predeterminado. Herramienta esencial de gestión de riesgo.",
    seeAlso: ["take-profit","liquidacion","soporte"],
    extended: "<p>Un <em>stop loss</em> es una orden que cierra tu posición automáticamente si el precio llega a un nivel que decides de antemano. Sirve para poner un límite a lo que puedes perder en una operación sin tener que estar delante de la pantalla.</p>\n<p>Su valor no es tanto técnico como psicológico, y esto es lo que casi nunca se dice. La razón por la que las pérdidas pequeñas se convierten en grandes rara vez es no saber que había que vender: es <strong>no ser capaz de hacerlo</strong> mientras cae, esperando que se recupere. El stop loss toma esa decisión en frío, antes de que haya dinero y emociones de por medio.</p>\n<p>Tiene límites reales que hay que conocer. En movimientos bruscos el precio puede <strong>saltarse tu nivel</strong> y ejecutarse bastante más abajo, así que no garantiza el importe exacto de la pérdida. Y colocarlo demasiado cerca del precio actual hace que la volatilidad normal te saque de la operación una y otra vez, cada vez con una pérdida pequeña que sumadas no son pequeñas.</p>\n<p>Sobre todo: <strong>un stop loss puesto es un stop loss que se respeta</strong>. Moverlo hacia abajo porque «esta vez seguro que rebota» es exactamente la decisión que venía a evitar.</p>",
  },
  {
    term: "Take Profit",
    slug: "take-profit",
    category: "trading",
    definition: "Orden para cerrar una posición con ganancias cuando el precio alcanza un objetivo. Permite asegurar beneficios sin monitorear constantemente el mercado.",
    seeAlso: ["stop-loss","roi","pnl"],
    extended: "<p>Un <em>take profit</em> es la orden simétrica del stop loss: cierra la posición automáticamente cuando el precio alcanza un objetivo de ganancia que fijaste antes. Convierte un beneficio sobre el papel en dinero de verdad sin necesidad de estar vigilando.</p>\n<p>Se le presta mucha menos atención que al stop loss, y es un error, porque el problema que resuelve es igual de real. Cerrar en ganancias suena a la parte fácil, y no lo es: cuando algo sube, aparece la voz que dice que puede subir más, y <strong>mucha gente ve evaporarse un beneficio grande por no haber decidido nunca qué sería suficiente</strong>. Es el mismo mecanismo del stop loss, con el signo cambiado: sin una decisión tomada en frío, decide la emoción del momento.</p>\n<p>La contrapartida es honesta: fijar un objetivo significa <strong>renunciar a lo que venga después</strong>. Si el precio sigue subiendo tras cerrarte, esa subida ya no es tuya. Es el precio de la certeza, y quien no lo asuma acabará moviendo el objetivo hacia arriba cada vez, que es como no tenerlo.</p>\n<p>Una salida intermedia habitual es cerrar solo una parte al llegar al objetivo y dejar correr el resto. Asegura algo y mantiene la puerta abierta.</p>",
  },
  {
    term: "Whale",
    slug: "whale",
    category: "trading",
    definition: "Gran inversor con capacidad para mover el mercado. Generalmente alguien con más de 1.000 BTC o su equivalente. Sus movimientos influyen en el precio.",
    seeAlso: ["market-cap","pump-and-dump","liquidacion"],
    extended: "<p>Una <em>whale</em> —ballena— es un participante con una posición lo bastante grande como para mover el precio con sus propias operaciones. No hay un umbral oficial; suele hablarse de miles de bitcoins o su equivalente, y también de fondos, empresas y plataformas.</p>\n<p>Importan por una razón concreta que tiene que ver con la liquidez. En un mercado donde en un momento dado hay órdenes por unos pocos millones, <strong>una venta lo bastante grande se come todas las compras disponibles y el precio cae mientras se ejecuta</strong>. No hace falta manipulación ni mala intención: el tamaño solo ya mueve el mercado.</p>\n<p>Como las operaciones son públicas en la blockchain, ha surgido toda una industria de vigilarlas. Y ahí conviene bajar las expectativas: <strong>ver un movimiento no es saber qué significa</strong>. Buena parte de las transferencias grandes son traslados internos entre carteras de la misma plataforma, custodios reorganizando fondos o movimientos técnicos sin ninguna intención de comprar ni vender. Las alertas de «una ballena acaba de mover 2.000 BTC» suelen ser exactamente eso.</p>\n<p>Seguir a las ballenas para copiarlas tiene un fallo de raíz: <strong>no conoces su plazo, ni su coste de entrada, ni qué tiene cubierto en otro sitio</strong>. Ves un movimiento suelto y le inventas una historia.</p>",
  },
  {
    term: "DeFi",
    slug: "defi",
    category: "defi",
    definition: "Finanzas Descentralizadas. Ecosistema de aplicaciones financieras construidas sobre blockchain que operan sin intermediarios (bancos, brokers). Incluye préstamos, trading y más.",
  },
  {
    term: "DEX",
    slug: "dex",
    category: "defi",
    definition: "Exchange Descentralizado. Plataforma de intercambio de criptomonedas sin custodia central. Los usuarios operan directamente desde sus wallets (Uniswap, dYdX).",
  },
  {
    term: "Liquidity Pool",
    slug: "liquidity-pool",
    category: "defi",
    definition: "Fondo de criptomonedas bloqueadas en un smart contract que provee liquidez a un DEX. Los proveedores de liquidez ganan comisiones por las operaciones.",
  },
  {
    term: "Staking",
    slug: "staking",
    category: "defi",
    definition: "Bloquear criptomonedas para participar en la validación de transacciones (Proof of Stake) y ganar recompensas. Similar a un depósito bancario pero en crypto.",
  },
  {
    term: "Yield Farming",
    slug: "yield-farming",
    category: "defi",
    definition: "Estrategia de maximizar rendimientos moviendo fondos entre diferentes protocolos DeFi. Ofrece altas rentabilidades pero con riesgos significativos.",
  },
  {
    term: "Smart Contract",
    slug: "smart-contract",
    category: "defi",
    definition: "Contrato inteligente. Programa autoejecutado en blockchain que se activa cuando se cumplen condiciones predefinidas, sin necesidad de intermediarios.",
  },
  {
    term: "Clave Privada",
    slug: "clave-privada",
    category: "seguridad",
    definition: "Código único que da acceso y control total sobre tus criptomonedas. Nunca la compartas con nadie. Si la pierdes, pierdes tus fondos permanentemente.",
  },
  {
    term: "Seed Phrase",
    slug: "seed-phrase",
    category: "seguridad",
    definition: "Frase de recuperación de 12 o 24 palabras que genera tu wallet. Es el respaldo de tu clave privada. Guárdala offline y nunca la introduzcas en ningún sitio web.",
  },
  {
    term: "2FA",
    slug: "2fa",
    category: "seguridad",
    definition: "Autenticación de dos factores. Segunda capa de seguridad para acceder a exchanges. Usa una app como Google Authenticator en lugar de SMS, que es vulnerable.",
  },
  {
    term: "Phishing",
    slug: "phishing",
    category: "seguridad",
    definition: "Ataque donde los estafadores suplantan sitios web o emails legítimos para robar tus credenciales o seed phrase. Verifica siempre la URL antes de introducir datos.",
  },
  {
    term: "Cold Wallet",
    slug: "cold-wallet",
    category: "seguridad",
    definition: "Wallet sin conexión a internet (hardware wallet como Ledger o Trezor). La forma más segura de guardar grandes cantidades de crypto a largo plazo.",
  },
  {
    term: "Hot Wallet",
    slug: "hot-wallet",
    category: "seguridad",
    definition: "Wallet conectada a internet (app móvil, extensión de navegador). Cómoda para uso diario pero más vulnerable a ataques. No guardes grandes cantidades en ella.",
  },
];

/** Los que ya tienen desarrollo largo: son los únicos con página propia. */
export const GLOSARIO_CON_PAGINA = GLOSARIO.filter((t) => !!t.extended);

export function buscarTermino(slug: string): GlosarioTerm | undefined {
  return GLOSARIO.find((t) => t.slug === slug);
}

export const GLOSARIO_CATEGORIAS: { id: GlosarioCategoria; label: string }[] = [
  { id: "básicos", label: "Básicos" },
  { id: "trading", label: "Trading" },
  { id: "defi", label: "DeFi" },
  { id: "seguridad", label: "Seguridad" },
];
