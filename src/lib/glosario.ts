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
  /**
   * Título de Google, cuando «Qué es {term}» no es como lo busca la gente.
   *
   * La plantilla por defecto vale para casi todos, pero no para todos: a
   * `exchange` la gente le pone artículo —Search Console registra «que es un
   * exchange»— y a otros no («Qué es un DYOR» sería incorrecto). Por eso es
   * opcional y solo se rellena donde los datos dicen que hace falta.
   *
   * ⚠️ Máximo **48 caracteres**: el layout raíz añade « | AdelinBTC», que son
   * 12 más, y Google corta sobre los 60. `npm run check` NO vigila este campo
   * —solo mira la metadata escrita en los `page.tsx`—, así que aquí el límite
   * lo aplica quien escribe.
   */
  seoTitle?: string;
  /**
   * Descripción de Google. Sin esto se usa la definición corta, que describe el
   * término pero no invita a entrar. En una ficha ampliada merece la pena
   * escribirla aparte. Máximo **160 caracteres**.
   */
  seoDescription?: string;
  /**
   * Preguntas frecuentes de la ficha. Se pintan al final del texto y además
   * emiten `FAQPage` en los datos estructurados.
   *
   * Para qué sirven de verdad: **cubrir la cola larga**. Quien empieza no
   * busca solo «qué es un exchange», busca «¿es seguro dejar mis criptos en un
   * exchange?» o «¿cuánto cobran por comprar?». Cada pregunta es una consulta
   * distinta que el texto corrido no cubre bien.
   *
   * ⚠️ Sobre el resultado enriquecido: desde 2023 Google **solo lo muestra a
   * webs oficiales de administración y salud**, así que aquí el desplegable de
   * preguntas en el buscador no va a salir. El valor está en el contenido
   * visible y en que el buscador entienda de qué responde la página — no en el
   * adorno. Se emite el esquema igualmente porque no cuesta nada y lo leen
   * también los asistentes de IA.
   *
   * La respuesta va en texto plano, sin HTML: el esquema no admite etiquetas y
   * tener dos versiones sería justo el descuadre que Google penaliza.
   */
  faq?: { q: string; a: string }[];
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
    faq: [
      {
        q: "¿Es seguro dejar mis criptomonedas en un exchange?",
        a:
          "Para operar y para cantidades pequeñas, sí. Para guardar a largo plazo, no es lo aconsejable: mientras están ahí, tus monedas son una anotación en el sistema de una empresa, no un activo bajo tu control. Si esa empresa quiebra o congela las retiradas, tu saldo depende de ella. Lo que no vayas a mover en meses debería estar en una cartera de la que solo tú tengas las claves.",
      },
      {
        q: "¿Cuál es el mejor exchange para empezar?",
        a:
          "No hay uno mejor para todo el mundo, y desconfía de quien te dé un nombre sin preguntarte nada. Lo que sí se puede decir es qué mirar: que puedas retirar el dinero sin fricción, que esté regulado en tu país, que las comisiones reales sean bajas contando el diferencial, y que exporte el histórico de operaciones para la declaración de la renta. Haz una retirada pequeña de prueba antes de meter una cantidad seria.",
      },
      {
        q: "¿Cuánto cuesta comprar criptomonedas en un exchange?",
        a:
          "Depende mucho de por dónde compres dentro de la misma plataforma. El botón rápido de la portada suele cobrar alrededor del 1,5 %, mientras que comprar desde el mercado puede bajar al 0,1 %. Sobre 1.000 euros son 15 euros frente a 1. Además hay dos costes que no se anuncian: el diferencial entre el precio de compra y el de venta, y la comisión fija por retirar.",
      },
      {
        q: "¿Qué diferencia hay entre un exchange y una wallet?",
        a:
          "Es la confusión más común al empezar. Un exchange es el sitio donde cambias euros por criptomonedas; una wallet es donde las guardas. Cuando dejas tus monedas en la plataforma, quien tiene las claves es la empresa, aunque el saldo aparezca a tu nombre. En una wallet propia las claves las tienes tú, y con ellas toda la responsabilidad de no perderlas.",
      },
      {
        q: "¿Tengo que dar mi DNI para usar un exchange?",
        a:
          "En los centralizados, sí. La normativa europea contra el blanqueo obliga a verificar la identidad de los clientes, así que te pedirán documento y normalmente una foto. En los descentralizados no hay registro ni verificación, porque no hay ninguna empresa detrás que pueda pedírtelo, pero a cambio tampoco hay a quién reclamar si algo sale mal.",
      },
      {
        q: "¿Hay que declarar a Hacienda lo que tengo en un exchange?",
        a:
          "Las ganancias, sí, y no solo cuando pasas el dinero al banco: cambiar una moneda por otra ya cuenta como venta a efectos fiscales. Además, si a 31 de diciembre tienes más de 50.000 euros en plataformas domiciliadas fuera de España, existe una declaración informativa específica que no paga impuestos pero cuya omisión sí tiene sanción.",
      },
    ],
    seoTitle: "Qué es un exchange de criptomonedas",
    seoDescription:
      "Qué es un exchange, la diferencia entre centralizado y descentralizado, lo que cuesta de verdad y qué espera Hacienda de ti si usas uno.",
    extended: "<div class=\"prose-resumen\"> <span class=\"prose-resumen-title\">En veinte segundos</span> <p>Un exchange es la puerta por la que el dinero del banco se convierte en criptomonedas. Hay dos tipos y lo que los separa es <strong>quién guarda tus monedas</strong>: una empresa, o tú.</p> <p>Lo que más dinero cuesta a los principiantes no son las comisiones anunciadas, sino el botón rápido de comprar. Y lo que más disgustos da es tratarlo como una cuenta bancaria.</p> </div>\n<p>Casi todo el mundo entra en cripto por la misma puerta. Ese sitio es un exchange, y entenderlo bien es lo primero que separa a quien opera con cabeza de quien va dando tumbos.</p>\n<p>La mayoría de las guías se quedan en «es como una bolsa de valores, pero de criptomonedas». Sirve como primera aproximación y se queda corta enseguida, porque en la bolsa tu bróker no puede quedarse con tus acciones si quiebra, y aquí sí puede pasar algo muy parecido con tus monedas. Esa diferencia es la que de verdad hay que entender.</p>\n<h2>Los dos tipos de exchange, y por qué la diferencia importa tanto</h2>\n<p>Hay dos familias, y lo que las separa no es el diseño ni las comisiones: es <strong>quién tiene la llave de tus monedas</strong>.</p>\n<div class=\"prose-vs\"> <div class=\"prose-vs-lado prose-vs-lado--a\"> <p class=\"prose-vs-title\">Centralizado</p> <p class=\"prose-vs-sub\">CEX · custodia una empresa</p> <ul> <li data-tono=\"favor\">Pagas con tarjeta o transferencia</li> <li data-tono=\"favor\">Hay atención al cliente si algo falla</li> <li data-tono=\"favor\">Recuperas el acceso si pierdes la contraseña</li> <li data-tono=\"contra\">Te pide el DNI y guarda tus datos</li> <li data-tono=\"contra\">Tus monedas dependen de que la empresa siga en pie</li> </ul> </div> <div class=\"prose-vs-lado prose-vs-lado--b\"> <p class=\"prose-vs-title\">Descentralizado</p> <p class=\"prose-vs-sub\">DEX · custodias tú</p> <ul> <li data-tono=\"favor\">Nadie puede congelar ni retener tus fondos</li> <li data-tono=\"favor\">No hay registro ni verificación de identidad</li> <li data-tono=\"favor\">Acceso a monedas que no llegan a los grandes</li> <li data-tono=\"contra\">Un error de dirección no tiene vuelta atrás</li> <li data-tono=\"contra\">No hay a quién reclamar: la responsabilidad es tuya</li> </ul> </div> </div>\n<p>En un <strong>exchange centralizado</strong> hay una empresa detrás que custodia los fondos de todos sus clientes y lleva un registro interno de quién tiene qué. Cuando compras, lo que ocurre en realidad es que el exchange apunta en su base de datos que ahora te debe esa cantidad.</p>\n<p>En un <strong>exchange descentralizado</strong>, o <a href=\"/glosario/dex\">DEX</a>, no hay custodia ni empresa que te deba nada: conectas tu propia cartera y el intercambio lo ejecuta un programa que vive en la blockchain. Nadie te pide el DNI porque no hay nadie a quien pedírtelo.</p>\n<p>Dicho en una frase: <strong>en el centralizado confías en una empresa; en el descentralizado confías en un programa</strong>. Ninguna de las dos confianzas es gratis, y conviene saber cuál estás dando.</p>\n<h2>Lo que cuesta de verdad usar un exchange</h2>\n<p>Aquí es donde a los principiantes se les escapa más dinero, y casi nunca por la comisión que sale anunciada. Hay tres costes, y solo uno se ve.</p>\n<p>El primero es la <strong>comisión de operación</strong>, el porcentaje que se lleva la plataforma por cada compra. El segundo es el <strong>diferencial</strong> entre el precio al que puedes comprar y aquel al que puedes vender en ese mismo momento: no aparece como comisión en ningún sitio, pero lo pagas igual. Y el tercero es el <strong>coste de retirar</strong>, que suele ser fijo y por eso castiga desproporcionadamente a quien mueve cantidades pequeñas.</p>\n<p>Con números se ve mejor. Esto es lo que se lleva la plataforma por la misma compra de 1.000 €, según por dónde la hagas:</p>\n<div class=\"prose-chart\"> <div class=\"prose-chart-title\">Lo que te cuesta comprar 1.000 € según cómo lo hagas</div> <div class=\"prose-chart-row\"> <span class=\"prose-chart-label\">Botón rápido con tarjeta (1,5 %)</span> <div class=\"prose-chart-track\"><div class=\"prose-chart-fill\" style=\"width:100%\"></div></div> <span class=\"prose-chart-value\">15 €</span> </div> <div class=\"prose-chart-row\"> <span class=\"prose-chart-label\">Compra normal (0,5 %)</span> <div class=\"prose-chart-track\"><div class=\"prose-chart-fill\" style=\"width:33%\"></div></div> <span class=\"prose-chart-value\">5 €</span> </div> <div class=\"prose-chart-row\"> <span class=\"prose-chart-label\">Desde el libro de órdenes (0,1 %)</span> <div class=\"prose-chart-track\"><div class=\"prose-chart-fill\" style=\"width:7%\"></div></div> <span class=\"prose-chart-value\">1 €</span> </div> </div>\n<div class=\"prose-dato\"> <span class=\"prose-dato-cifra\">504 €</span> <span class=\"prose-dato-texto\">Lo que se lleva la diferencia entre comprar al 1,5 % y al 0,1 % en un plan de <strong>36 aportaciones mensuales de 1.000 €</strong>. Es la misma compra, el mismo día y la misma moneda: cambia el botón que pulsas.</span> </div>\n<div class=\"prose-callout prose-callout--tip\"> <span class=\"prose-callout-icon\">&#9989;</span> <div class=\"prose-callout-body\">Si vas a comprar de forma periódica, busca en el menú la sección de trading o mercado en vez de usar el botón rápido de la portada. Es dos clics más y cuesta entre cinco y quince veces menos.</div> </div>\n<h2>El error típico: tratar el exchange como si fuera tu banco</h2>\n<p>Este es el que sale caro, y lo comete casi todo el mundo al principio: dejar ahí todo lo que se tiene, indefinidamente, porque «está seguro».</p>\n<p>El problema es de fondo, no de la plataforma que elijas. Mientras tus monedas están en un exchange, <strong>técnicamente no son tuyas</strong>: son una anotación en el sistema de una empresa que promete devolvértelas cuando las pidas. Mientras la empresa funcione, la promesa se cumple sin incidentes. Si quiebra, si sufre un ataque o si un juez congela sus cuentas, tu saldo entra en la misma cola que el de todos los demás clientes.</p>\n<p>No es teoría, y hay dos casos que lo enseñan mejor que cualquier explicación:</p>\n<div class=\"prose-hitos\"> <div class=\"prose-hito\"> <span class=\"prose-hito-fecha\">2014 · Mt. Gox</span> <p>Era el exchange que movía la mayor parte del bitcoin del mundo. Desapareció con unos <strong>850.000 BTC</strong> de sus clientes. Sus acreedores llevan más de una década esperando cobrar.</p> </div> <div class=\"prose-hito\"> <span class=\"prose-hito-fecha\">2022 · FTX</span> <p>El segundo exchange más grande del mundo pasó de estar valorado en <strong>32.000 millones de dólares</strong> a declararse en quiebra <strong>en menos de dos semanas</strong>. Sus usuarios veían el saldo en pantalla el día antes.</p> </div> </div>\n<p>De ahí sale la regla que repite todo el que lleva tiempo: <strong>es un sitio para operar, no para guardar</strong>. Lo que no vayas a mover en los próximos meses debería estar en una cartera tuya. Si la cantidad es importante, en una <a href=\"/glosario/cold-wallet\">cold wallet</a>; si no, al menos en una <a href=\"/glosario/hot-wallet\">hot wallet</a> de la que solo tú tengas la <a href=\"/glosario/seed-phrase\">frase semilla</a>. Y mientras tengas fondos ahí, ten el <a href=\"/glosario/2fa\">2FA</a> activado: la mayoría de los robos a particulares no son ataques a la plataforma, son cuentas concretas a las que alguien entró.</p>\n<h2>Lo que Hacienda espera si usas un exchange desde España</h2>\n<p>Esta parte no la vas a encontrar en la web de ningún exchange, y es la que más disgustos da.</p>\n<table class=\"prose-table\"> <thead> <tr><th>Lo que haces</th><th>Lo que ve Hacienda</th></tr> </thead> <tbody> <tr><td>Compras bitcoin con euros</td><td>Nada todavía. Comprar no tributa</td></tr> <tr><td>Cambias bitcoin por otra moneda</td><td><strong>Una venta.</strong> Tributa la ganancia aunque no saques el dinero</td></tr> <tr><td>Vendes y dejas los euros en la plataforma</td><td><strong>Una venta.</strong> Da igual que no llegue a tu banco</td></tr> <tr><td>Mueves monedas a tu propia cartera</td><td>Nada. No cambia de dueño</td></tr> </tbody> </table>\n<p>La primera sorpresa, entonces, es que <strong>cada cambio entre monedas ya es un hecho fiscal</strong>. Mucha gente lo descubre tras un año haciendo docenas de cambios, y entonces tiene que reconstruir el histórico entero.</p>\n<p>La segunda: para calcular la ganancia hay que aplicar el <strong>método FIFO</strong>, es decir, se considera que vendes primero las monedas que compraste primero. No puedes elegir el lote que más te convenga; lo explicamos con un ejemplo completo en <a href=\"/post/metodo-fifo-criptomonedas\">este artículo sobre el método FIFO</a>.</p>\n<p>Y la tercera, la que más se ignora: si tienes más de <strong>50.000 €</strong> en plataformas domiciliadas fuera de España a 31 de diciembre, existe una <strong>declaración informativa</strong> específica para eso. No paga impuestos por sí misma —es solo informar—, pero no presentarla tiene sanción. La mayoría de las plataformas conocidas no son españolas, así que esto aplica a más gente de la que cree. Está todo desarrollado en la <a href=\"/guias/fiscalidad-cripto-espana\">guía de fiscalidad cripto en España</a>.</p>\n<div class=\"prose-callout prose-callout--warning\"> <span class=\"prose-callout-icon\">&#9888;&#65039;</span> <div class=\"prose-callout-body\">Descárgate el histórico de operaciones <strong>cada año, antes de que acabe</strong>. Si una plataforma cierra o te bloquea la cuenta, recuperar tus movimientos pasados va de difícil a imposible, y sin ellos no puedes calcular lo que debes.</div> </div>\n<h2>Cómo elegir un exchange sin arrepentirte</h2>\n<p>Cuatro comprobaciones, por orden de importancia real y no por orden de lo que anuncian:</p>\n<ol class=\"prose-pasos\"> <li><strong>Comprueba que puedes sacar el dinero.</strong> Antes de meter una cantidad seria, haz una retirada pequeña de prueba y verifica que llega a tu banco. Es la única forma de saber que la salida funciona.</li> <li><strong>Mira la regulación en tu jurisdicción.</strong> En Europa, que esté registrado y sujeto a normativa cambia mucho lo que puedes reclamar si algo va mal.</li> <li><strong>Calcula las comisiones reales, no las anunciadas.</strong> Suma el coste de comprar, el de retirar y el diferencial. El «0 % de comisión» casi siempre está escondido en el diferencial.</li> <li><strong>Asegúrate de que exporta el histórico.</strong> Suena menor hasta la primera declaración de la renta.</li> </ol>\n<p>Y una advertencia sobre lo que <em>no</em> debe pesar en la decisión: el interés que te ofrezcan por dejar ahí tus monedas. Ese rendimiento sale de prestar tus fondos a alguien, y los exchange que más pagaban fueron, casi sin excepción, los que peor acabaron. Antes de aceptar cualquiera de esas ofertas, aplica el <a href=\"/glosario/dyor\">DYOR</a> de verdad: entiende de dónde sale ese dinero. Si no lo entiendes, ya tienes la respuesta.</p>",
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
    seeAlso: ["dex","smart-contract","staking"],
    extended: "<p>DeFi es la contracción de <em>Decentralized Finance</em>: finanzas descentralizadas. Agrupa las aplicaciones que ofrecen servicios financieros —prestar, tomar prestado, intercambiar, cubrir riesgo— <strong>sin una empresa en medio</strong>. Donde antes había un banco decidiendo, hay un programa publicado en una blockchain que ejecuta las reglas igual para todo el mundo.</p>\n<p>Las consecuencias prácticas son tres. No hace falta permiso ni papeleo: cualquiera con una cartera puede usarlo. Todo es <strong>auditable en público</strong>, incluidas las reservas de un protocolo, algo que en la banca tradicional no está a la vista de nadie. Y las piezas encajan entre sí, así que un servicio puede construirse encima de otro.</p>\n<p>Ahora la contrapartida, que es exactamente la misma frase leída al revés: <strong>si no hay intermediario, tampoco hay a quién reclamar</strong>. No existe departamento de atención al cliente, ni fondo de garantía de depósitos, ni forma de revertir una operación. Un fallo en el código no es un incidente que alguien te compense: es dinero que desaparece, y ha pasado muchas veces por cientos de millones.</p>\n<p>Conviene además desconfiar de los rendimientos anunciados. Un interés muy por encima de lo normal no viene de la nada: <strong>alguien lo está pagando</strong>, y saber quién y con qué es la única forma de entender qué riesgo estás asumiendo.</p>",
  },
  {
    term: "DEX",
    slug: "dex",
    category: "defi",
    definition: "Exchange Descentralizado. Plataforma de intercambio de criptomonedas sin custodia central. Los usuarios operan directamente desde sus wallets (Uniswap, dYdX).",
    seeAlso: ["exchange","liquidity-pool","wallet"],
    extended: "<p>Un DEX es un <em>exchange</em> descentralizado: una plataforma para intercambiar criptomonedas <strong>sin entregar la custodia a nadie</strong>. Operas directamente desde tu cartera y el intercambio lo ejecuta un contrato en la blockchain.</p>\n<p>La diferencia de fondo con un exchange normal es quién guarda tus fondos. En uno centralizado depositas y confías; en un DEX tus monedas no salen de tu cartera hasta el momento del intercambio. Eso elimina de golpe el riesgo de que la plataforma quiebre, congele las retiradas o sufra un robo interno.</p>\n<p>La mayoría no usa un libro de órdenes clásico, sino <strong>fondos de liquidez</strong>: no operas contra otra persona, sino contra un depósito común, y el precio lo calcula una fórmula según cuánto queda de cada moneda.</p>\n<p>Los riesgos, que son distintos y no menores. El <strong>deslizamiento</strong>: en un fondo con poca liquidez, tu propia operación mueve el precio y recibes menos de lo que esperabas. Los <strong>tokens falsos</strong>: cualquiera puede crear uno con el nombre de otro, así que la dirección del contrato es lo único fiable, nunca el nombre. Y que <strong>todo error es definitivo</strong> — una dirección mal puesta o una autorización firmada a la ligera no las deshace nadie.</p>",
  },
  {
    term: "Liquidity Pool",
    slug: "liquidity-pool",
    category: "defi",
    definition: "Fondo de criptomonedas bloqueadas en un smart contract que provee liquidez a un DEX. Los proveedores de liquidez ganan comisiones por las operaciones.",
    seeAlso: ["dex","yield-farming","defi"],
    extended: "<p>Un fondo de liquidez es un depósito de dos criptomonedas bloqueadas en un contrato para que otros puedan intercambiar entre ellas. Quien aporta ese dinero se llama proveedor de liquidez y cobra una parte de las comisiones de cada operación.</p>\n<p>Resuelve un problema real: sin él, para intercambiar harían falta un comprador y un vendedor coincidiendo en precio y momento. Con el fondo <strong>siempre hay contraparte</strong>, porque operas contra el depósito y una fórmula fija el precio.</p>\n<p>Y aquí está el concepto que más dinero cuesta por no entenderlo: la <strong>pérdida impermanente</strong>. Cuando el precio de una de las dos monedas se mueve mucho respecto a la otra, la fórmula reequilibra el fondo automáticamente, y acabas con más de la que ha bajado y menos de la que ha subido. El resultado es que <strong>puedes terminar con menos valor del que tendrías si simplemente te hubieras quedado quieto</strong>, aunque hayas cobrado comisiones todo ese tiempo.</p>\n<p>El nombre engaña: se llama «impermanente» porque desaparecería si los precios volvieran al punto de partida, y muchas veces no vuelven. Cuando retiras, la pérdida se hace permanente. No es una anomalía ni un fallo: es el funcionamiento normal del mecanismo.</p>",
  },
  {
    term: "Staking",
    slug: "staking",
    category: "defi",
    definition: "Bloquear criptomonedas para participar en la validación de transacciones (Proof of Stake) y ganar recompensas. Similar a un depósito bancario pero en crypto.",
    seeAlso: ["defi","yield-farming","blockchain"],
    extended: "<p>El staking consiste en bloquear criptomonedas para ayudar a validar las operaciones de una red que funciona por <em>Proof of Stake</em>, y recibir a cambio una recompensa. La red usa esos fondos bloqueados como garantía: quien valida mal puede perder parte de ellos, y ese castigo es lo que sustituye al gasto de electricidad de la minería.</p>\n<p>Se compara a menudo con un depósito bancario, y la comparación es cómoda pero engañosa en tres puntos que conviene tener claros.</p>\n<p>El primero: <strong>la recompensa se paga en la propia moneda</strong>. Un 6 % anual en un activo que cae un 40 % es una pérdida del 36 %, no una ganancia. El segundo: <strong>hay un periodo de bloqueo</strong>, que en algunas redes son días o semanas, y durante ese tiempo no puedes vender aunque el mercado se hunda. El tercero: existe el <em>slashing</em>, un castigo real por el que <strong>parte del capital puede desaparecer</strong> si el validador al que delegas se comporta mal o falla.</p>\n<p>Y una advertencia sobre la palabra. Muchas plataformas llaman «staking» a productos que no lo son: prestan tu dinero a terceros y te pagan un interés. Eso no es participar en la validación de una red, es <strong>asumir el riesgo de que quien lo tomó prestado no devuelva</strong>. Varias empresas que ofrecían justo eso quebraron en 2022.</p>",
  },
  {
    term: "Yield Farming",
    slug: "yield-farming",
    category: "defi",
    definition: "Estrategia de maximizar rendimientos moviendo fondos entre diferentes protocolos DeFi. Ofrece altas rentabilidades pero con riesgos significativos.",
    seeAlso: ["liquidity-pool","defi","staking"],
    extended: "<p>El <em>yield farming</em> consiste en mover fondos entre protocolos DeFi buscando el mayor rendimiento en cada momento: aportar liquidez aquí, prestar allá, aprovechar el reparto de tokens de un protocolo nuevo y salir cuando deja de compensar.</p>\n<p>Es, con diferencia, la actividad de más riesgo de las que aparecen en este diccionario, y merece explicarse por qué. Los rendimientos llamativos casi nunca vienen de comisiones reales: vienen de <strong>tokens nuevos que el protocolo emite para atraer dinero</strong>. Ese token tiene un precio mientras entra gente; cuando deja de entrar, cae, y con él el rendimiento anunciado. Muchas cifras de tres dígitos son exactamente eso.</p>\n<p>Los riesgos además se apilan. Al usar varios protocolos encadenados, <strong>estás expuesto al fallo de cualquiera de ellos</strong>: basta un error en uno para perder el conjunto. A eso se suman la pérdida impermanente de los fondos de liquidez y las comisiones de tanto movimiento, que se comen buena parte del margen.</p>\n<p>La regla que resume todo: <strong>un rendimiento anormalmente alto es el precio que paga alguien por asumir un riesgo que no ve</strong>. Si no puedes explicar de dónde sale el dinero que te pagan, la respuesta más probable es que salga del siguiente que entre.</p>",
  },
  {
    term: "Smart Contract",
    slug: "smart-contract",
    category: "defi",
    definition: "Contrato inteligente. Programa autoejecutado en blockchain que se activa cuando se cumplen condiciones predefinidas, sin necesidad de intermediarios.",
    seeAlso: ["blockchain","defi","gas"],
    extended: "<p>Un contrato inteligente es un programa guardado en una blockchain que se ejecuta solo cuando se cumplen las condiciones escritas en él. No necesita que nadie lo autorice ni supervise: si se da la condición, la consecuencia ocurre.</p>\n<p>Lo interesante no es la automatización —eso ya existía— sino que <strong>nadie puede impedir que se ejecute</strong>, ni siquiera quien lo escribió. Es lo que permite que dos desconocidos intercambien sin confiar el uno en el otro ni recurrir a un tercero.</p>\n<p>Ahora bien, la palabra «contrato» sugiere garantías que no existen. Un contrato inteligente <strong>no es un documento legal</strong>, no lo revisa ningún juez y no se puede apelar. Y «inteligente» tampoco: es código, y hace exactamente lo que dice, incluso cuando lo que dice no es lo que su autor quería.</p>\n<p>De ahí la consecuencia más dura del concepto: <strong>si tiene un fallo, ese fallo también se ejecuta</strong>, y como el contrato es inmutable, a menudo no se puede arreglar sobre la marcha. Casi todos los grandes robos de DeFi han sido esto —no alguien rompiendo la criptografía, sino aprovechando lo que el programa permitía—. Una auditoría reduce el riesgo, no lo elimina: han caído protocolos auditados por las mejores firmas.</p>",
  },
  {
    term: "Clave Privada",
    slug: "clave-privada",
    category: "seguridad",
    definition: "Código único que da acceso y control total sobre tus criptomonedas. Nunca la compartas con nadie. Si la pierdes, pierdes tus fondos permanentemente.",
    seeAlso: ["seed-phrase","wallet","cold-wallet"],
    extended: "<p>La clave privada es el número secreto que da control sobre unas criptomonedas concretas. Firmar con ella es lo único que la red acepta como prueba de que puedes moverlas. En cripto se dice que la propiedad no es un registro a tu nombre en ningún sitio: <strong>propiedad es tener la clave</strong>.</p>\n<p>Eso tiene dos consecuencias, y las dos son absolutas. <strong>Quien la consiga es el dueño</strong>, sin más trámite, sin que haya forma de demostrar que era tuya ni de recuperar nada. Y si la pierdes, <strong>nadie puede devolvértela</strong>: no hay «he olvidado mi contraseña», no hay soporte, no hay recuperación. Los fondos siguen ahí, visibles para siempre, y nadie volverá a moverlos.</p>\n<p>En la práctica no la manejas directamente —para eso está la frase de recuperación, que es la que hay que guardar—, pero entender qué es explica todas las reglas que vienen después.</p>\n<p>Y la regla no negociable, escrita sin rodeos: <strong>nadie legítimo te va a pedir nunca tu clave privada ni tu frase de recuperación.</strong> Ni tu exchange, ni el soporte técnico de una wallet, ni un administrador de un grupo, ni un supuesto empleado que te escribe por privado para ayudarte. Nadie. Cualquiera que te la pida, con la excusa que sea y por el canal que sea, te está robando.</p>",
  },
  {
    term: "Seed Phrase",
    slug: "seed-phrase",
    category: "seguridad",
    definition: "Frase de recuperación de 12 o 24 palabras que genera tu wallet. Es el respaldo de tu clave privada. Guárdala offline y nunca la introduzcas en ningún sitio web.",
    seeAlso: ["clave-privada","cold-wallet","phishing"],
    extended: "<p>La frase semilla son las 12 o 24 palabras que te muestra una cartera al crearla. De ellas se derivan todas tus claves privadas, así que <strong>esa lista de palabras es, literalmente, todo tu dinero</strong>. Quien la tenga puede reconstruir tu cartera entera en su propio dispositivo, en cualquier parte del mundo y sin tocar el tuyo.</p>\n<p>Por eso hay que perder el miedo a lo que sí es seguro: si se te rompe o te roban el móvil, no pasa nada mientras conserves la frase. La restauras en otro dispositivo y todo sigue ahí.</p>\n<p>Las reglas de cómo guardarla se resumen en una idea: <strong>que no toque nunca un dispositivo conectado</strong>. Escrita a mano en papel o grabada en metal, guardada en un sitio físico seguro, y a poder ser con una segunda copia en otro lugar por si hay un incendio o una inundación.</p>\n<p>Y las que nunca, sin excepciones: <strong>no la fotografíes</strong>, no la guardes en el móvil, ni en un correo, ni en tus notas, ni en la nube, ni en un gestor de contraseñas, ni se la mandes a nadie. Y sobre todo: <strong>no la escribas en ninguna página web</strong>. Ninguna aplicación legítima te pide la frase para «verificar», «sincronizar», «desbloquear» o «reclamar» nada. Esa petición, siempre, es un robo en curso.</p>",
  },
  {
    term: "2FA",
    slug: "2fa",
    category: "seguridad",
    definition: "Autenticación de dos factores. Segunda capa de seguridad para acceder a exchanges. Usa una app como Google Authenticator en lugar de SMS, que es vulnerable.",
    seeAlso: ["phishing","exchange","hot-wallet"],
    extended: "<p>La autenticación de dos factores añade un segundo paso al iniciar sesión: además de la contraseña, un código temporal que cambia cada pocos segundos. Sirve para que <strong>robarte la contraseña no baste para entrar en tu cuenta</strong>, y es lo mínimo imprescindible en cualquier exchange.</p>\n<p>Pero no todos los segundos factores valen lo mismo, y la diferencia importa mucho.</p>\n<p>El <strong>2FA por SMS es el más extendido y el más débil</strong>. Existe un ataque llamado <em>SIM swapping</em>: el atacante convence a tu operadora, con datos tuyos que ha recopilado, de que te ha pasado algo al móvil y de que hay que pasar tu número a otra tarjeta SIM. A partir de ese momento <strong>tus códigos le llegan a él</strong>, y tú te quedas sin línea sin entender por qué. No es teórico: se ha usado para vaciar cuentas repetidamente.</p>\n<p>Lo recomendable es una <strong>aplicación de códigos</strong>, que genera el número en tu propio dispositivo sin depender de la red telefónica, o mejor aún una llave física. Si tu exchange lo permite, conviene además desactivar el SMS como método de respaldo: dejarlo activo mantiene abierta la puerta que acabas de cerrar. Y guarda los códigos de recuperación fuera del móvil, porque si lo pierdes son la única entrada.</p>",
  },
  {
    term: "Phishing",
    slug: "phishing",
    category: "seguridad",
    definition: "Ataque donde los estafadores suplantan sitios web o emails legítimos para robar tus credenciales o seed phrase. Verifica siempre la URL antes de introducir datos.",
    seeAlso: ["seed-phrase","2fa","hot-wallet"],
    extended: "<p>El <em>phishing</em> es el engaño en el que alguien se hace pasar por un servicio legítimo —una web, un correo, un mensaje— para que introduzcas tus datos donde no debes. En cripto es, con diferencia, <strong>la forma en la que más gente pierde su dinero</strong>: mucho más que los fallos técnicos o los robos a exchanges.</p>\n<p>Funciona porque no ataca a la tecnología, ataca a las prisas. Las copias de webs conocidas son indistinguibles del original, y se colocan donde vas a mirar: <strong>anuncios pagados en el buscador</strong> por encima del resultado auténtico, dominios con una letra cambiada, o un mensaje privado que te «avisa» de que tu cuenta tiene un problema.</p>\n<p>La variante moderna ya ni siquiera pide contraseñas. Te lleva a una página que te invita a conectar tu cartera y firmar algo, y esa firma <strong>autoriza a vaciarte los fondos</strong> sin que tengas que entregar ninguna clave.</p>\n<p>Las defensas son aburridas y funcionan: <strong>llega siempre por tu propio marcador</strong>, nunca por un enlace ni por un anuncio. Desconfía por sistema de la urgencia, que es la herramienta principal del engaño. Y lee lo que firmas antes de aceptar. Sobre todo, interioriza esto: <strong>un mensaje que te contacta a ti primero, para avisarte de un problema o regalarte algo, es sospechoso por definición.</strong></p>",
  },
  {
    term: "Cold Wallet",
    slug: "cold-wallet",
    category: "seguridad",
    definition: "Wallet sin conexión a internet (hardware wallet como Ledger o Trezor). La forma más segura de guardar grandes cantidades de crypto a largo plazo.",
    seeAlso: ["hot-wallet","seed-phrase","clave-privada"],
    extended: "<p>Una cold wallet es una cartera que guarda tus claves <strong>sin conexión a internet</strong>, normalmente en un pequeño aparato dedicado. Cuando quieres mover fondos, la operación se firma dentro del dispositivo y sale ya firmada: la clave nunca pasa por el ordenador ni por el móvil.</p>\n<p>Eso es lo que la hace fuerte. Aunque tengas el ordenador infectado, el atacante no puede extraer una clave que no está ahí, y cualquier operación necesita que <strong>tú confirmes físicamente pulsando un botón</strong> en el aparato. Es la forma recomendada de guardar lo que no piensas mover a menudo.</p>\n<p>Dicho eso, hay tres malentendidos que conviene deshacer. El primero: <strong>el dispositivo no guarda tus monedas</strong>, guarda las claves. Si se rompe o lo pierdes, recuperas todo con tu frase de recuperación en otro; lo que no se puede recuperar sin la frase es nada, y por eso la frase sigue siendo lo importante.</p>\n<p>El segundo: <strong>no protege de firmar algo malo</strong>. Si te engañan para autorizar una operación fraudulenta, la aprobarás tú mismo, con tu botón. Por eso hay que leer en la pantalla del aparato lo que se está firmando.</p>\n<p>Y el tercero, práctico: <strong>cómprala siempre al fabricante</strong>, nunca de segunda mano ni en un vendedor cualquiera. Un dispositivo manipulado, o que viene «con la frase ya escrita», es una trampa conocida.</p>",
  },
  {
    term: "Hot Wallet",
    slug: "hot-wallet",
    category: "seguridad",
    definition: "Wallet conectada a internet (app móvil, extensión de navegador). Cómoda para uso diario pero más vulnerable a ataques. No guardes grandes cantidades en ella.",
    seeAlso: ["cold-wallet","phishing","wallet"],
    extended: "<p>Una hot wallet es una cartera conectada a internet: una aplicación del móvil, una extensión del navegador, un programa de escritorio. Es lo que casi todo el mundo usa a diario, y con razón, porque es cómoda e inmediata.</p>\n<p>Su punto débil es exactamente el que le da la comodidad: <strong>la clave está en un dispositivo conectado</strong>. Si ese dispositivo tiene un programa malicioso, o si en un descuido firmas algo en una web fraudulenta, no hay barrera física que te pare.</p>\n<p>La forma sensata de verlo es la cartera del bolsillo. Llevas encima lo que necesitas para el día a día y el resto lo tienes guardado en otro sitio. Traducido: <strong>en la hot wallet, solo lo que estarías dispuesto a perder</strong>; lo demás, en frío.</p>\n<p>Un par de hábitos que evitan la mayoría de los disgustos. <strong>Ten una cartera separada para experimentar</strong> con protocolos nuevos, sin nada de valor dentro, en vez de conectar la que tiene tus ahorros. Y <strong>revisa de vez en cuando las autorizaciones concedidas</strong>: al usar una aplicación le das permiso para gastar ciertos tokens, ese permiso se queda activo indefinidamente, y si el protocolo se ve comprometido meses después ese permiso sigue ahí. Revocar lo que ya no usas cuesta unos minutos.</p>",
  },
  {
    term: "Oferta Circulante",
    slug: "oferta-circulante",
    category: "básicos",
    definition: "Monedas de un proyecto que están realmente en el mercado, sin contar las bloqueadas o aún sin emitir. Es la cifra que multiplica al precio en el market cap.",
    seeAlso: ["market-cap","liberacion-de-tokens","vesting"],
    extended: "<p>La oferta circulante son las monedas de un proyecto que <strong>están de verdad en manos de gente y se pueden vender hoy</strong>. No incluye las que siguen bloqueadas por contrato, ni las reservadas al equipo, ni las que todavía no se han emitido.</p>\n<p>Importa porque es el número que multiplica al precio para dar la <a href=\"/glosario/market-cap\">capitalización de mercado</a>. Cambia la oferta y cambia todo el análisis: dos monedas al mismo precio pueden ser proyectos de tamaño completamente distinto según cuántas unidades haya sueltas.</p>\n<p>El error típico es confundirla con la <strong>oferta total</strong> o con la <strong>oferta máxima</strong>. Un proyecto puede tener 100 millones de monedas emitidas pero solo 10 millones circulando, porque las otras 90 están bloqueadas y se irán soltando durante años. Quien mira solo la circulante ve una capitalización pequeña y cree que hay muchísimo recorrido, sin darse cuenta de que la oferta se va a multiplicar por diez y de que cada moneda que entra presiona el precio a la baja.</p>\n<p>Por eso conviene mirar siempre las dos cifras juntas, y de paso el calendario de desbloqueos: una capitalización baja con el 90 % del suministro pendiente de liberar no es una oportunidad, es una cuenta atrás.</p>",
  },
  {
    term: "Liberación de Tokens",
    slug: "liberacion-de-tokens",
    category: "básicos",
    definition: "Momento en que monedas bloqueadas entran en circulación. Aumenta la oferta disponible y suele presionar el precio a la baja.",
    seeAlso: ["vesting","oferta-circulante","market-cap"],
    extended: "<p>Una liberación —o <em>unlock</em>— es el momento en que un paquete de monedas que estaba bloqueado por contrato <strong>pasa a estar disponible para vender</strong>. Las reparten proyectos que reservaron monedas para el equipo, los inversores iniciales o la tesorería, y que se comprometieron a no soltarlas de golpe.</p>\n<p>Importa por una razón muy simple: <strong>aparece oferta nueva que antes no existía</strong>. Si de repente se pueden vender millones de monedas que llevaban dos años inmovilizadas, y quienes las reciben entraron a un precio muy inferior al de hoy, la presión vendedora es real y previsible.</p>\n<p>Lo previsible es lo interesante. A diferencia de casi todo en cripto, <strong>las fechas están publicadas de antemano</strong>: se sabe qué día se libera cuánto. Consultarlo antes de comprar cuesta un minuto y evita entrar justo la semana en que el suministro disponible crece un 20 %.</p>\n<p>El error típico es dar por hecho que el precio se hunde siempre en la fecha exacta. No funciona así de mecánicamente: el mercado suele anticiparlo y a veces la caída llega antes, o no llega si hay demanda suficiente. La liberación no es una señal de venta automática — es un dato de contexto que conviene tener sobre la mesa, sobre todo cuando el paquete que entra es grande comparado con la <a href=\"/glosario/oferta-circulante\">oferta circulante</a>.</p>",
  },
  {
    term: "Vesting",
    slug: "vesting",
    category: "básicos",
    definition: "Calendario que bloquea monedas del equipo o de inversores y las va liberando poco a poco, para que no puedan venderlo todo de golpe.",
    seeAlso: ["liberacion-de-tokens","oferta-circulante","dyor"],
    extended: "<p>El vesting es el <strong>calendario de desbloqueo</strong> de las monedas reservadas al equipo, a los inversores iniciales o a la tesorería de un proyecto. En vez de recibirlas todas el primer día, las van recibiendo a plazos durante meses o años.</p>\n<p>Existe para alinear intereses. Si los fundadores pudieran vender todo el día del lanzamiento, nada les obligaría a seguir trabajando en el proyecto después. Con un vesting a cuatro años, su dinero depende de que el proyecto siga vivo dentro de cuatro años.</p>\n<p>Un calendario típico tiene dos piezas: el <strong><em>cliff</em></strong>, un periodo inicial en el que no se libera nada —normalmente un año—, y después una liberación gradual, mes a mes. Cuando se cumple el cliff entra de golpe el primer paquete, que suele ser el más grande y el que más se nota.</p>\n<p>El error típico es no mirarlo. Un proyecto puede parecer barato porque su <a href=\"/glosario/market-cap\">capitalización</a> es pequeña, y resultar que solo circula el 10 % de las monedas: el 90 % restante irá saliendo durante años. Antes de entrar a largo plazo, conviene saber cuánto suministro queda por liberar y en qué fechas — es información pública y está en la documentación del proyecto.</p>",
  },
  {
    term: "Inflación",
    slug: "inflacion",
    category: "básicos",
    definition: "La subida general de los precios. En cripto importa porque decide si la Reserva Federal sube o baja los tipos, y eso mueve el mercado entero.",
    seeAlso: ["halving", "oferta-circulante", "dca"],
    extended: "<p>La inflación es <strong>cuánto suben los precios de media en un año</strong>. Si un carro de la compra costaba 100 € y ahora cuesta 103 €, la inflación es del 3 %. Suena lejos de las criptomonedas, y es justo lo contrario: es el dato que más las mueve.</p>\n<p>El motivo está en la cadena que dispara. Los bancos centrales —sobre todo la Reserva Federal de Estados Unidos— tienen el encargo de mantener la inflación cerca del 2 %. Si se dispara, suben los tipos de interés para enfriar la economía. Y cuando el dinero se encarece, <strong>los inversores retiran capital de los activos de riesgo</strong>: primero de las acciones tecnológicas y, antes que de nada, de cripto. Cuando la inflación cede y los tipos bajan, el dinero vuelve.</p>\n<p>Por eso hay tres publicaciones que conviene tener en el calendario: el <strong>IPC</strong>, que mide los precios que paga el consumidor; el <strong>PCE</strong>, que es el que la Fed usa de verdad para su objetivo; y el <strong>IPP</strong>, que mide los precios mayoristas y se adelanta a los otros dos. Salen en fechas conocidas de antemano y suelen provocar movimientos bruscos en cuestión de minutos.</p>\n<p>El error típico es confundir dos cosas distintas: la inflación del euro o del dólar, que es esto, y la <em>inflación de un token</em>, que es que un proyecto emita monedas nuevas y diluya a quien ya las tiene. Son problemas parecidos —más unidades persiguiendo el mismo valor— pero no se miden igual ni se leen en los mismos sitios. Bitcoin, con su <a href=\"/glosario/halving\">halving</a>, está diseñado precisamente para reducir su propia emisión cada cuatro años.</p>",
  },
  {
    term: "Futuros",
    slug: "futuros",
    category: "trading",
    definition: "Contratos para especular con el precio sin poseer la moneda. Permiten ganar tanto si sube como si baja, y suelen usarse con apalancamiento.",
    seeAlso: ["apalancamiento","liquidacion","long-short"],
    extended: "<p>Un contrato de futuros es un acuerdo para <strong>apostar por el precio de una moneda sin llegar a tenerla</strong>. No compras Bitcoin: compras un contrato cuyo valor sigue al de Bitcoin. En cripto lo habitual son los <em>futuros perpetuos</em>, que no tienen fecha de vencimiento y se pueden mantener abiertos indefinidamente.</p>\n<p>Tienen dos atractivos. El primero es que se puede <a href=\"/glosario/long-short\">ganar también cuando el precio baja</a>, abriendo una posición corta. El segundo, y el más peligroso, es que permiten <a href=\"/glosario/apalancamiento\">apalancarse</a>: mover mucho más dinero del que tienes depositado.</p>\n<p>Ese segundo atractivo es el que arruina a la mayoría. Con futuros no solo puedes equivocarte de dirección: puedes <strong>acertar la dirección y perderlo todo igualmente</strong> si el precio se va en tu contra lo suficiente antes de darte la razón. Eso es una <a href=\"/glosario/liquidacion\">liquidación</a>, y cierra la posición sin preguntar.</p>\n<p>El error típico es empezar por aquí. Los futuros son una herramienta de gestión de riesgo que se usa cuando ya se tiene un método probado en spot; usarlos como atajo para multiplicar una cuenta pequeña es la forma más rápida y más común de quedarse sin ella.</p>",
  },
  {
    term: "Apalancamiento",
    slug: "apalancamiento",
    category: "trading",
    definition: "Operar con dinero prestado para mover una posición mayor que tu capital. Multiplica las ganancias y también las pérdidas.",
    seeAlso: ["liquidacion","futuros","stop-loss"],
    extended: "<p>El apalancamiento consiste en <strong>operar con más dinero del que has depositado</strong>. Con 100 € y apalancamiento x10 mueves una posición de 1.000 €: si el precio sube un 5 %, ganas 50 € en vez de 5.</p>\n<p>El problema es que la frase funciona igual de bien al revés. Con esa misma posición, <strong>una caída del 10 % se lleva tus 100 € enteros</strong>. El apalancamiento no mejora tus probabilidades de acertar: solo hace que cada movimiento del precio cuente mucho más, en las dos direcciones.</p>\n<p>Y hay un detalle que a mucha gente le pilla por sorpresa: no hace falta que el precio llegue a cero para perderlo todo. Cuando las pérdidas se acercan a lo depositado, el exchange cierra la posición automáticamente para no quedarse a deber — es la <a href=\"/glosario/liquidacion\">liquidación</a>. Puedes tener razón sobre a dónde va el precio y quedarte fuera antes de que llegue.</p>\n<p>El error típico es elegir el apalancamiento por lo que se quiere ganar en vez de por lo que se puede perder. La forma sensata de decidirlo es al revés: fija primero cuánto estás dispuesto a perder en esa operación, coloca el <a href=\"/glosario/stop-loss\">stop-loss</a> donde tu idea deje de tener sentido, y de ahí sale el tamaño. Si el número que sale es incómodamente pequeño, ese es el dato.</p>",
  },
  {
    term: "Tamaño de Posición",
    slug: "tamano-de-posicion",
    category: "trading",
    definition: "Cuánto dinero metes en una operación concreta. Se calcula desde lo que estás dispuesto a perder, no desde lo que quieres ganar.",
    seeAlso: ["stop-loss","apalancamiento","dca"],
    extended: "<p>El tamaño de posición es <strong>cuánto dinero pones en una operación concreta</strong>. Suena trivial y es, con diferencia, lo que más separa a quien sigue en el mercado dentro de dos años de quien no.</p>\n<p>Casi nadie se arruina por elegir mal la moneda. Se arruina por meter demasiado en una sola: una posición desproporcionada convierte un error normal —y los errores son inevitables— en un agujero del que la cuenta ya no se recupera.</p>\n<p>El cálculo va al revés de como lo hace la mayoría. No se parte de «quiero ganar X», sino de <strong>«estoy dispuesto a perder X en esta operación»</strong> —una cifra pequeña, típicamente entre el 1 % y el 2 % de la cuenta—. Con eso y con la distancia hasta tu <a href=\"/glosario/stop-loss\">stop-loss</a>, el tamaño sale solo: si arriesgas 20 € y tu stop está un 4 % por debajo de la entrada, la posición es de 500 €.</p>\n<p>La consecuencia útil es que <strong>una idea con el stop muy lejos obliga a una posición pequeña</strong>, y eso es correcto: cuanto menos claro tienes dónde te equivocas, menos deberías arriesgar. El error típico es hacerlo al contrario — poner el tamaño primero y colocar el stop donde «cabe», que es como se acaba moviéndolo cuando el precio lo alcanza.</p>",
  },
  {
    term: "Exploit",
    slug: "exploit",
    category: "seguridad",
    definition: "Aprovechar un fallo del código para hacer algo que no estaba previsto. No es robar una contraseña: es usar el sistema tal y como está escrito.",
    seeAlso: ["smart-contract","defi","dyor"],
    extended: "<p>Un exploit es <strong>aprovechar un fallo en el código para conseguir algo que no estaba previsto</strong>. La diferencia con lo que la mayoría imagina al oír «hackeo» es importante: casi nunca hay contraseñas robadas ni nadie entrando por la fuerza. El atacante usa el sistema tal y como está escrito — solo que ha encontrado un caso que el autor no pensó.</p>\n<p>Por eso en cripto es tan frecuente. Un <a href=\"/glosario/smart-contract\">contrato inteligente</a> hace exactamente lo que dice, incluso cuando lo que dice no es lo que su autor quería, y como es público, cualquiera puede leerlo buscando ese hueco. En <a href=\"/glosario/defi\">DeFi</a> además el hueco tiene dinero detrás desde el primer día.</p>\n<p>Los tres sitios donde más aparecen: en la <strong>lógica económica</strong> (el contrato calcula un precio o un saldo de una forma que se puede manipular), en los <strong>permisos</strong> (una función que debería poder llamar solo el dueño y puede llamar cualquiera) y en cómo un sistema <strong>identifica las cosas</strong>, que es de donde salen algunos de los más caros — el <a href=\"/post/injective-hackeo-2026\">hackeo de Injective</a> se llevó 4,9 millones por ahí.</p>\n<p>El error típico al leer la noticia es confundir dos cosas muy distintas: que falle <strong>una aplicación</strong> construida encima de una red, o que falle <strong>la red</strong>. Lo primero es habitual y afecta a quien usara esa aplicación; lo segundo es rarísimo. Cuando veas un titular, la primera pregunta es siempre esa — y casi siempre la respuesta está en el segundo párrafo, no en el titular.</p>",
  },
  {
    term: "Validador",
    slug: "validador",
    category: "básicos",
    definition: "Ordenador que comprueba las transacciones y las apunta en la blockchain. Deja monedas bloqueadas como fianza: si hace trampas, las pierde.",
    seeAlso: ["staking","blockchain","smart-contract"],
    extended: "<p>Un validador es <strong>un ordenador que comprueba las transacciones y las escribe en la <a href=\"/glosario/blockchain\">blockchain</a></strong>. Donde un banco tiene una entidad que decide qué apuntes son válidos, aquí hay cientos o miles de máquinas independientes que tienen que ponerse de acuerdo.</p>\n<p>Lo que impide que hagan trampas no es la confianza, es el dinero: para ser validador hay que <strong>dejar monedas bloqueadas como fianza</strong>. Si el validador se porta bien, cobra una comisión por cada bloque; si intenta colar algo falso, la red le quita parte de esa fianza. Es lo que hay detrás del <a href=\"/glosario/staking\">staking</a>: cuando delegas tus monedas, se las estás prestando como fianza a un validador a cambio de una parte de lo que gana.</p>\n<p>Hay un castigo intermedio que sorprende a mucha gente: un validador que simplemente <strong>deja de responder</strong> —se le cae el servidor, o no aplica a tiempo una actualización— queda apartado temporalmente. No ha hecho nada malo, pero mientras esté fuera no valida ni cobra, y quien delegó en él tampoco. Es lo que pasó en el <a href=\"/post/injective-hackeo-2026\">hackeo de Injective</a>: varios se quedaron fuera por no aplicar un parche a tiempo.</p>\n<p>El error típico es elegir validador por el porcentaje que anuncia. Lo que de verdad importa es <strong>cuánto tiempo lleva funcionando sin caerse</strong> y qué comisión se queda, porque un validador barato que se cae a menudo rinde menos que uno normal que no falla nunca.</p>",
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
