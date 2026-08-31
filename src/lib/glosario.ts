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
  },
  {
    term: "ATL",
    slug: "atl",
    category: "trading",
    definition: "All Time Low. El precio más bajo registrado de un activo. Otro nivel de referencia clave para evaluar el recorrido de un proyecto.",
  },
  {
    term: "Bear Market",
    slug: "bear-market",
    category: "trading",
    definition: "Mercado bajista. Período prolongado de caída de precios, generalmente superior al 20% desde máximos. Se caracteriza por pesimismo generalizado.",
  },
  {
    term: "Bull Market",
    slug: "bull-market",
    category: "trading",
    definition: "Mercado alcista. Período de subida sostenida de precios acompañado de optimismo y mayor adopción. Suele seguir a un halving de Bitcoin.",
  },
  {
    term: "DCA",
    slug: "dca",
    category: "trading",
    definition: "Dollar Cost Averaging. Estrategia de inversión que consiste en comprar una cantidad fija en intervalos regulares, sin importar el precio. Reduce el impacto de la volatilidad.",
  },
  {
    term: "DYOR",
    slug: "dyor",
    category: "trading",
    definition: "Do Your Own Research (Haz tu propia investigación). Principio fundamental en crypto: nunca inviertas basándote solo en consejos de terceros.",
  },
  {
    term: "FOMO",
    slug: "fomo",
    category: "trading",
    definition: "Fear Of Missing Out (Miedo a perderse algo). Emoción que lleva a comprar en máximos por el miedo a perder una subida. Uno de los errores más costosos en trading.",
  },
  {
    term: "FUD",
    slug: "fud",
    category: "trading",
    definition: "Fear, Uncertainty and Doubt (Miedo, incertidumbre y duda). Información negativa, a veces falsa, que genera pánico y caídas de precio.",
  },
  {
    term: "HODL",
    slug: "hodl",
    category: "trading",
    definition: "Hold On for Dear Life. Estrategia de mantener criptomonedas a largo plazo sin vender durante caídas. Viene de un error tipográfico que se viralizó en 2013.",
  },
  {
    term: "Liquidación",
    slug: "liquidacion",
    category: "trading",
    definition: "Cierre forzado de una posición apalancada cuando las pérdidas alcanzan el margen disponible. El exchange vende automáticamente tus activos.",
  },
  {
    term: "Long / Short",
    slug: "long-short",
    category: "trading",
    definition: "Long: apostar a que el precio sube (comprar). Short: apostar a que el precio baja (vender en corto). Conceptos básicos del trading con derivados.",
  },
  {
    term: "PnL",
    slug: "pnl",
    category: "trading",
    definition: "Profit and Loss (Ganancias y Pérdidas). Resultado financiero de tus operaciones. PnL realizado: ya cerrado. PnL no realizado: posición abierta.",
  },
  {
    term: "Pump and Dump",
    slug: "pump-and-dump",
    category: "trading",
    definition: "Manipulación de mercado donde un grupo infla artificialmente el precio de un activo para luego vender masivamente, dejando pérdidas a los compradores tardíos.",
  },
  {
    term: "Resistencia",
    slug: "resistencia",
    category: "trading",
    definition: "Nivel de precio donde históricamente la presión vendedora detiene o revierte una subida. Zona clave en análisis técnico.",
  },
  {
    term: "ROI",
    slug: "roi",
    category: "trading",
    definition: "Return on Investment (Retorno sobre la inversión). Porcentaje de ganancia o pérdida sobre el capital invertido. ROI = (ganancia / inversión) × 100.",
  },
  {
    term: "Soporte",
    slug: "soporte",
    category: "trading",
    definition: "Nivel de precio donde históricamente la presión compradora detiene o revierte una caída. Si se rompe, suele convertirse en resistencia.",
  },
  {
    term: "Stop Loss",
    slug: "stop-loss",
    category: "trading",
    definition: "Orden automática para cerrar una posición con pérdida limitada cuando el precio cae a un nivel predeterminado. Herramienta esencial de gestión de riesgo.",
  },
  {
    term: "Take Profit",
    slug: "take-profit",
    category: "trading",
    definition: "Orden para cerrar una posición con ganancias cuando el precio alcanza un objetivo. Permite asegurar beneficios sin monitorear constantemente el mercado.",
  },
  {
    term: "Whale",
    slug: "whale",
    category: "trading",
    definition: "Gran inversor con capacidad para mover el mercado. Generalmente alguien con más de 1.000 BTC o su equivalente. Sus movimientos influyen en el precio.",
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
