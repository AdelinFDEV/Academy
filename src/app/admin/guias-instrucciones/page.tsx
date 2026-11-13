import Link from "next/link";

/**
 * /admin/guias-instrucciones · La fuente de verdad de cómo se hace una guía.
 * AGENTS.md manda aquí antes de escribir una sola línea de una guía.
 *
 * Reescrita el 13-11-2026 con el objetivo a la vista: las guías son la puerta
 * de entrada desde Google y tienen que convertir esa visita en cuenta y en
 * Premium. Todo lo de SEO que no es propio de una guía vive en
 * /admin/seo-instrucciones, para no tener dos versiones de lo mismo.
 */

const INDICE = [
  ["objetivo", "Para qué sirve una guía"],
  ["tema", "Antes de escribir"],
  ["flujo", "El flujo, paso a paso"],
  ["anatomia", "Anatomía de una guía"],
  ["escritura", "Cómo se escribe"],
  ["anuncios", "Mini anuncios internos"],
  ["interactivos", "Piezas interactivas"],
  ["cuenta", "Cuenta, quiz y logro"],
  ["tecnica", "Arquitectura técnica"],
  ["diseno", "Diseño"],
  ["seo", "El SEO que lleva puesto"],
  ["checklist", "Lista de cierre"],
  ["despues", "Después de publicar"],
] as const;

function Seccion({ id, n, titulo, children }: { id: string; n: string; titulo: string; children: React.ReactNode }) {
  return (
    <section className="agi-section" id={id}>
      <h2 className="agi-section-title">
        <span className="agi-section-num">{n}</span>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Paso({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <div className="agi-step">
      <div className="agi-step-num">{n}</div>
      <div>
        <strong>{titulo}</strong>
        <p>{children}</p>
      </div>
    </div>
  );
}

function Punto({ children }: { children: React.ReactNode }) {
  return (
    <label className="agi-check-item">
      <input type="checkbox" readOnly />
      <span>{children}</span>
    </label>
  );
}

export default function GuiasInstruccionesPage() {
  return (
    <div className="admin-guide-instructions">
      <div className="agi-hero">
        <div className="agi-hero-label">Referencia interna · fuente de verdad</div>
        <h1 className="agi-hero-title">Cómo se hace una guía</h1>
        <p className="agi-hero-sub">
          Las guías son gratuitas y son lo que Google enseña de la academia. Cada una tiene dos trabajos: responder
          mejor que nadie a lo que alguien ha buscado, y presentarle, sin estorbar, lo que la academia vende. Léelo
          entero antes de empezar una guía nueva.
        </p>
      </div>

      <nav className="agi-indice" aria-label="Índice">
        {INDICE.map(([id, texto], i) => (
          <a key={id} href={`#${id}`}><span>{String(i + 1).padStart(2, "0")}</span>{texto}</a>
        ))}
      </nav>

      <Seccion id="objetivo" n="01" titulo="Para qué sirve una guía">
        <div className="agi-card">
          <p>
            La academia vive de tres piezas de pago: el <strong>Diario de Trading con Nova</strong>, el{" "}
            <strong>Portfolio Adelin</strong> y los <strong>Cursos</strong>. Nadie busca esas piezas en Google: busca
            «qué es XRP» o «cómo declarar criptomonedas». <strong>La guía es la respuesta a esa búsqueda, y el camino
            hacia lo demás.</strong>
          </p>
          <div className="agi-embudo">
            <div><b>1 · Google</b><span>Alguien busca una duda concreta</span></div>
            <div><b>2 · La guía</b><span>La resuelve entera, gratis y sin cuenta</span></div>
            <div><b>3 · La cuenta</b><span>El quiz y su logro piden registrarse</span></div>
            <div><b>4 · Premium</b><span>Un mini anuncio le enseña la pieza que le encaja</span></div>
          </div>
          <p>
            El orden no se negocia: <strong>primero se gana la visita, después se le ofrece algo</strong>. Una guía que
            vende antes de responder pierde al lector y, con él, la posición en Google.
          </p>
        </div>
        <div className="agi-card">
          <p><strong>Una guía está bien hecha si cumple las cuatro:</strong></p>
          <ul className="agi-list">
            <li><strong>Responde</strong> a una búsqueda real, y la respuesta está en el primer párrafo.</li>
            <li><strong>Aporta algo propio</strong> que no está en las diez primeras de Google: una herramienta, un dato contrastado, un ejemplo con números, la experiencia de quien opera.</li>
            <li><strong>Es de fiar</strong>: cada cifra con su fuente y su fecha, y los riesgos contados sin maquillaje. Todo el contenido de la academia es de dinero, y Google le aplica su listón más alto.</li>
            <li><strong>Lleva a algún sitio</strong>: al diccionario, a otra guía, a la cuenta gratuita y a una pieza de pago.</li>
          </ul>
        </div>
      </Seccion>

      <Seccion id="tema" n="02" titulo="Antes de escribir">
        <div className="agi-card">
          <p><strong>El tema.</strong> Sale de <code>GUIAS-PENDIENTES.md</code> o lo da el admin. Temática única: criptomonedas y su ecosistema.</p>
          <p><strong>La búsqueda.</strong> Antes de proponer nada se decide <strong>una</strong> consulta principal, escrita como la escribiría una persona («qué es render», «cómo declarar criptomonedas en España»), y se miran los primeros resultados de Google para esa consulta: qué responden, qué formato tienen y qué les falta. Lo que les falta es la guía. El método completo está en <Link href="/admin/seo-instrucciones#metodo">SEO, bloque «El método»</Link>.</p>
          <p><strong>Las fuentes.</strong> Se investiga antes de escribir. Por orden de peso: documentación oficial del proyecto y supervisores (ESMA, CNMV, AEAT, BOE), datos en cadena y exploradores, estudios con su año, y prensa especializada solo para hechos. Cada cifra que entre en la guía lleva su fuente y su fecha en el propio texto.</p>
        </div>
        <div className="agi-card">
          <p><strong>Lo que se le pregunta al admin antes de empezar</strong>, si no lo ha dicho:</p>
          <ul className="agi-list">
            <li>La consulta principal, si no está clara, y a quién va dirigida (quien empieza o quien ya opera).</li>
            <li>La <strong>foto de portada</strong>: toda guía lleva la suya.</li>
            <li>Qué pieza de pago encaja mejor con el tema, si hay duda (ver «Mini anuncios internos»).</li>
          </ul>
          <p className="agi-note">Ya no se pregunta si la guía es gratis o de pago: desde el 31-10-2026 <strong>todas son gratuitas</strong> y se leen enteras sin cuenta.</p>
        </div>
      </Seccion>

      <Seccion id="flujo" n="03" titulo="El flujo, paso a paso">
        <div className="agi-steps">
          <Paso n={1} titulo="Tema, consulta y fuentes">Se cierra la consulta principal, se miran los resultados de Google y se reúnen las fuentes. Sin esto no se escribe.</Paso>
          <Paso n={2} titulo="Esquema">Las secciones, en el orden en que el lector se hace las preguntas, con la pieza interactiva de cada una y dónde van los mini anuncios. El admin lo ve antes de que se escriba el cuerpo.</Paso>
          <Paso n={3} titulo="Términos del diccionario">Toda palabra técnica se enlaza al diccionario en su primera aparición. Las que no existan se crean ahora, con una definición buena (<code>PLANTILLA-DICCIONARIO.md</code>). Es una regla intocable y no espera a que nadie la pida.</Paso>
          <Paso n={4} titulo="Construcción">Su <code>page.tsx</code>, su <code>[slug].css</code>, sus piezas interactivas y su quiz, con el contenido completo: nada de esqueletos ni textos de relleno.</Paso>
          <Paso n={5} titulo="Auditoría SEO">Al terminar se pregunta siempre: «¿Empiezo la auditoría SEO de la guía?». Si el admin dice que sí, se ejecuta <code>AUDITORIA-SEO.md</code> entero. Si dice que no, se anota que queda sin auditar.</Paso>
          <Paso n={6} titulo="Aprobación">El admin la revisa y da el «sí» explícito. Sin él no se publica nada.</Paso>
          <Paso n={7} titulo="Publicación">Se añade al final de <code>GUIDES</code> y se despliega. Darla de alta y desplegar <strong>la publica</strong>: no hay paso intermedio para echarse atrás.</Paso>
          <Paso n={8} titulo="Seguimiento">A las dos y a las seis semanas se mira en Analítica y en Search Console cómo va (bloque 13).</Paso>
        </div>
      </Seccion>

      <Seccion id="anatomia" n="04" titulo="Anatomía de una guía">
        <p className="agi-section-intro">El orden de los bloques, de arriba abajo. Es el mismo en todas, para que el lector y Google sepan siempre dónde está cada cosa.</p>
        <div className="agi-tabla-envoltura">
          <table className="agi-tabla">
            <thead><tr><th>Bloque</th><th>Qué lleva</th><th>Por qué</th></tr></thead>
            <tbody>
              <tr><td><strong>Hero</strong></td><td>Un solo H1 con la consulta dentro, y debajo <strong>la respuesta en dos o tres frases</strong>. Dificultad, minutos de lectura y fecha de última revisión.</td><td>Quien llega de Google decide en segundos si se queda. La respuesta va antes que cualquier adorno.</td></tr>
              <tr><td><strong>Índice</strong></td><td>Enlaces a cada sección (<code>.gbc-index</code>).</td><td>Deja saltar a lo que uno busca, y Google usa esos saltos para llevar al lector al punto exacto.</td></tr>
              <tr><td><strong>Secciones</strong></td><td>Cada una responde a una pregunta. H2 escrito como la pregunta o como su respuesta, nunca un rótulo vacío («Introducción»).</td><td>Google puede posicionar una sección suelta, no solo la página entera.</td></tr>
              <tr><td><strong>Pieza interactiva</strong></td><td>Dentro de la sección que explica, nunca como relleno entre dos.</td><td>Es lo que una guía tiene y un artículo no. Y retiene.</td></tr>
              <tr><td><strong>Mini anuncio 1</strong></td><td>Opcional, en formato «línea», tras la sección que habla de lo que la pieza resuelve.</td><td>El interés está en su punto más alto justo ahí.</td></tr>
              <tr><td><strong>Riesgos</strong></td><td>Una sección propia con lo que puede salir mal.</td><td>Es contenido de dinero: callar los riesgos resta confianza al lector y a Google.</td></tr>
              <tr><td><strong>Mini anuncio 2</strong></td><td>En formato «tarjeta», después de todo el contenido y antes del quiz.</td><td>Quien ha llegado hasta aquí es quien más probablemente quiere seguir.</td></tr>
              <tr><td><strong>Quiz</strong></td><td>Con cuenta. Sin sesión, la invitación a registrarse con el nombre del logro.</td><td>Es el paso de visitante a usuario registrado.</td></tr>
              <tr><td><strong>Cierre fijo</strong></td><td><code>GuiasRelacionadas</code> → interacciones → <code>Footer</code>.</td><td>Las relacionadas son el único enlace que unas guías reciben de otras.</td></tr>
            </tbody>
          </table>
        </div>
        <div className="agi-card agi-card--mono">
          {`<GuiaAnuncio producto="…" estado={…} />   {/* antes del quiz */}`}<br />
          {`<section id="quiz" className="gbc-section">…</section>`}<br />
          {`<GuiasRelacionadas slug={SLUG} />`}<br />
          {`<section className="gbc-section gbc-interactions-section">…<GuideInteractions /></section>`}<br />
          {`<Footer />`}
        </div>
        <div className="agi-card">
          <p className="agi-warning"><strong>Lo que Google lee es lo que sale del servidor.</strong> El texto que solo aparece al pulsar, girar una tarjeta o mover un control dentro de un componente de cliente puede no contar. La explicación completa va siempre escrita en la sección; la pieza interactiva la refuerza, no la sustituye.</p>
        </div>
      </Seccion>

      <Seccion id="escritura" n="05" titulo="Cómo se escribe">
        <div className="agi-card">
          <ul className="agi-list">
            <li><strong>La respuesta, primero.</strong> Cada sección abre con la respuesta y luego la desarrolla. Nada de «en este apartado veremos».</li>
            <li><strong>Para alguien listo que no sabe del tema.</strong> Frases cortas, un ejemplo con números en cuanto aparece una idea abstracta, y cada palabra técnica enlazada al diccionario la primera vez.</li>
            <li><strong>Algo propio en cada guía.</strong> Un cálculo, una comparación, un caso real, un dato verificado en cadena. Resumir lo que ya dicen otros no posiciona: Google lo dice así en su guía oficial.</li>
            <li><strong>Cifras con fuente y fecha</strong> en el propio texto («a noviembre de 2026, según…»). Una cifra sin fecha envejece en silencio.</li>
            <li><strong>Sin promesas.</strong> Ni rentabilidades, ni «la mejor», ni «seguro». Se cuenta lo que es, lo que puede salir mal y para quién no es.</li>
            <li><strong>Sin relleno.</strong> No hay número mágico de palabras: Google no lo tiene. La guía dura lo que tarda en responder bien.</li>
            <li><strong>Sin emojis</strong> en títulos ni cuerpo. Los iconos, de Lucide.</li>
            <li><strong>Ángulo hispanohablante</strong>: euros, ejemplos y normativa que le sirvan a quien lee desde España o América.</li>
          </ul>
        </div>
      </Seccion>

      <Seccion id="anuncios" n="06" titulo="Mini anuncios internos">
        <div className="agi-card">
          <p>
            Son las llamadas a las piezas de pago dentro de una guía. Se hacen con un solo componente,{" "}
            <code>GuiaAnuncio</code> (<code>src/components/GuiaAnuncio.tsx</code>), para que todas las guías vendan con
            la misma voz y los mismos textos comprobados.
          </p>
          <div className="agi-card agi-card--mono">
            {`import GuiaAnuncio from "@/components/GuiaAnuncio";`}<br /><br />
            {`<GuiaAnuncio`}<br />
            {`  producto="diario"            // diario · portfolio · cursos · premium`}<br />
            {`  variante="tarjeta"           // tarjeta (por defecto) · linea`}<br />
            {`  estado={isPremium ? "premium" : isRegistered ? "cuenta" : "anonimo"}`}<br />
            {`/>`}
          </div>
        </div>

        <div className="agi-subsection">
          <h3 className="agi-subsection-title">Qué pieza encaja con cada tema</h3>
          <div className="agi-tabla-envoltura">
            <table className="agi-tabla">
              <thead><tr><th>Si la guía va de…</th><th>Se anuncia</th><th>Porque el lector se pregunta…</th></tr></thead>
              <tbody>
                <tr><td>Operar: trading, futuros, exchanges, gestión del riesgo</td><td><strong>Diario de Trading</strong> (<code>diario</code>)</td><td>«¿Y cómo sé si lo estoy haciendo bien?»</td></tr>
                <tr><td>Una criptomoneda o un proyecto concreto</td><td><strong>Portfolio Adelin</strong> (<code>portfolio</code>)</td><td>«¿Y tú qué compras?»</td></tr>
                <tr><td>Conceptos básicos: blockchain, wallets, seguridad</td><td><strong>Cursos</strong> (<code>cursos</code>)</td><td>«¿Por dónde sigo aprendiendo?»</td></tr>
                <tr><td>Temas transversales: fiscalidad, regulación</td><td><strong>Premium</strong> (<code>premium</code>)</td><td>«¿Qué más tiene esta academia?»</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="agi-subsection">
          <h3 className="agi-subsection-title">Las reglas</h3>
          <div className="agi-card">
            <ul className="agi-list">
              <li><strong>Nunca antes de la respuesta.</strong> El primero va, como pronto, después de la segunda sección. Ni en el hero ni justo debajo.</li>
              <li><strong>Dos como máximo</strong>, y de piezas distintas: una «línea» a mitad y una «tarjeta» antes del quiz. Con una guía corta, solo la tarjeta.</li>
              <li><strong>El botón lleva a la ficha pública</strong> de la pieza, no al pago. La guía despierta el interés; la ficha explica y vende.</li>
              <li><strong>El precio, siempre a la vista.</strong> Nunca se esconde que es de pago. El componente lo saca de <code>PREMIUM_PRICE_EUR</code>.</li>
              <li><strong>A quien ya es Premium no se le vende</strong>: ve un acceso directo a su herramienta, o nada. Lo decide el componente con <code>estado</code>.</li>
              <li><strong>Ni ventanas emergentes, ni barras que tapen el texto, ni cuentas atrás.</strong> Google penaliza lo que se interpone entre el lector y el contenido.</li>
              <li><strong>No se promete lo que la pieza no hace.</strong> Los textos del componente están comprobados contra el código. Para cambiarlos o añadir una ventaja, primero se abre la herramienta y se comprueba.</li>
              <li><strong>Nunca rentabilidades.</strong> El Portfolio enseña la cartera real, también lo que va en pérdidas; no se anuncia como una forma de ganar.</li>
            </ul>
          </div>
          <div className="agi-card">
            <p><strong>Además del componente</strong>, la mejor llamada es una frase dentro del propio texto, donde ya se habla del problema, con un enlace normal a la ficha: «…estas cuentas las hace solo el <em>Diario de Trading</em> de la academia». El ancla es el nombre de la pieza, nunca «pincha aquí».</p>
            <p className="agi-note">La guía del diario de trading tiene sus propias llamadas (<code>GuiaDiarioCta</code>), más grandes, porque la guía entera trata de lo que hace esa pieza. Es la excepción, no el modelo.</p>
          </div>
        </div>
      </Seccion>

      <Seccion id="interactivos" n="07" titulo="Piezas interactivas">
        <p className="agi-section-intro">Se elige la que ayuda a entender, no la que adorna. Las compartidas ya existen; las propias de un tema se crean dentro de la carpeta de la guía.</p>
        <div className="agi-components-grid">
          <div className="agi-comp-card">
            <div className="agi-comp-name">Quiz de la guía</div>
            <div className="agi-comp-desc">Un componente por guía (<code>Guide…Quiz.tsx</code>, en su carpeta). Cinco preguntas que obligan a haber entendido, no a recordar una palabra. Guarda la nota y, con todas acertadas, desbloquea el logro.</div>
            <div className="agi-comp-rule">Obligatorio. Con cinco preguntas, el logro pide 5 de 5.</div>
          </div>
          <div className="agi-comp-card">
            <div className="agi-comp-name">GuideFlipCards</div>
            <div className="agi-comp-desc">Tarjetas que se giran: una idea por delante y su explicación por detrás. Para mitos frente a realidad, o ventajas frente a riesgos.</div>
            <div className="agi-comp-rule">Lo importante va también en el texto: el reverso puede no leerlo Google.</div>
          </div>
          <div className="agi-comp-card">
            <div className="agi-comp-name">GuideSpotlightCards</div>
            <div className="agi-comp-desc">Tarjetas con foco al pasar el ratón, para listas cortas de usos, actores o características.</div>
            <div className="agi-comp-rule">De tres a seis tarjetas. Con más, una tabla.</div>
          </div>
          <div className="agi-comp-card">
            <div className="agi-comp-name">GuideHeroStats · GuideAnimatedStat</div>
            <div className="agi-comp-desc">Cifras destacadas, en el hero o dentro de una sección. Cada cifra, con su fuente y su fecha cerca.</div>
            <div className="agi-comp-rule">Solo cifras que se puedan sostener dentro de un año, o con su fecha bien visible.</div>
          </div>
          <div className="agi-comp-card">
            <div className="agi-comp-name">Gráficas (Recharts)</div>
            <div className="agi-comp-desc">Línea, barras o área. Si los datos son reales, con su fuente; si son un ejemplo, se dice: «datos orientativos».</div>
            <div className="agi-comp-rule">Un solo eje y una idea por gráfica.</div>
          </div>
          <div className="agi-comp-card">
            <div className="agi-comp-name">Calculadora o simulador propio</div>
            <div className="agi-comp-desc">Cuando el tema tiene una cuenta que el lector querría hacer con sus números (como <code>GuideDiarioCalc</code>). Es lo que más diferencia una guía de las de la competencia.</div>
            <div className="agi-comp-rule">Solo si la cuenta es útil de verdad. El resultado se explica en texto debajo.</div>
          </div>
          <div className="agi-comp-card">
            <div className="agi-comp-name">GuideVideoEmbed</div>
            <div className="agi-comp-desc">Un vídeo del canal, en modo de privacidad mejorada. Se carga solo al pulsar.</div>
            <div className="agi-comp-rule">Solo vídeos propios que traten justo ese tema.</div>
          </div>
          <div className="agi-comp-card">
            <div className="agi-comp-name">GuideProgressBar</div>
            <div className="agi-comp-desc">La barra de lectura de arriba. Es visual y no guarda nada.</div>
            <div className="agi-comp-rule">En toda guía.</div>
          </div>
        </div>
        <div className="agi-card">
          <p>Librerías instaladas: <strong>Recharts</strong> (gráficas), <strong>Framer Motion</strong> (animaciones de entrada) y <strong>Lucide</strong> (iconos). No se añade una dependencia para una sola guía sin preguntarlo antes.</p>
        </div>
      </Seccion>

      <Seccion id="cuenta" n="08" titulo="Cuenta, quiz y logro">
        <div className="agi-card">
          <p><strong>Toda guía se lee entera sin cuenta ni pago</strong>, piezas interactivas incluidas. Es lo mismo que ve Google, que entra sin sesión.</p>
          <ul className="agi-list">
            <li><strong>Lo único que pide cuenta gratuita es el quiz</strong>: guarda la nota y da el logro, y para eso hay que saber de quién es.</li>
            <li>En el <code>page.tsx</code>: <code>{"{isRegistered ? <GuideXxxQuiz /> : <GuideQuizCuenta slug={SLUG} />}"}</code> dentro de <code>section#quiz</code>. Nada más depende de la sesión, salvo el <code>estado</code> de los mini anuncios.</li>
            <li><code>GuideQuizCuenta</code> invita a registrarse con el nombre del logro y devuelve a la guía después.</li>
          </ul>
        </div>
        <div className="agi-card">
          <ul className="agi-list">
            <li>La nota se guarda en <code>guide_quiz_completions</code> por <code>/api/guide-quiz-completion</code>, que valida el <code>slug</code> contra <code>GUIDES</code>.</li>
            <li>El logro se define en el código: campos <code>badge</code> (nombre) y <code>badgeId</code> (<code>guide-[tema]</code>) de la guía en <code>GUIDES</code>. Aparece solo en Logros.</li>
            <li>Se desbloquea al acertar el quiz entero: el quiz llama a <code>saveGuideBadge(badgeId)</code>, que lo guarda en <code>user_badges</code> y lanza el aviso.</li>
          </ul>
        </div>
      </Seccion>

      <Seccion id="tecnica" n="09" titulo="Arquitectura técnica">
        <div className="agi-card">
          <p className="agi-warning"><strong>Una guía es código, no una fila en la base de datos.</strong> Cada guía es un componente propio en <code>src/app/guias/[slug]/</code>, y el catálogo es el array <code>GUIDES</code> de <code>src/lib/guides.ts</code>. Publicar no toca Supabase.</p>
          <div className="agi-code-row"><span className="agi-code-path">src/app/guias/[slug]/page.tsx</span><span>La guía. Componente de servidor.</span></div>
          <div className="agi-code-row"><span className="agi-code-path">src/app/guias/[slug]/[slug].css</span><span>Sus estilos propios. <strong>Nunca</strong> en <code>guias.css</code> ni en <code>globals.css</code>.</span></div>
          <div className="agi-code-row"><span className="agi-code-path">src/app/guias/[slug]/Guide…Quiz.tsx</span><span>Su quiz y sus piezas propias.</span></div>
          <div className="agi-code-row"><span className="agi-code-path">src/app/guias/guias.css</span><span>Solo lo que comparten todas (<code>gbc-</code>, <code>gan-</code>).</span></div>
          <div className="agi-code-row"><span className="agi-code-path">public/guias/[slug].webp</span><span>La portada: WebP, 1.600 px de ancho, calidad 82.</span></div>
          <div className="agi-code-row"><span className="agi-code-path">src/lib/guides.ts</span><span>El alta en <code>GUIDES</code>. Siempre <strong>al final</strong>: la portada enseña las últimas.</span></div>
        </div>
        <div className="agi-card agi-card--mono">
          <div className="agi-table-def">
            <div className="agi-table-name">GuideMeta · campos de GUIDES</div>
            <div className="agi-table-fields">slug · title · shortTitle · description · difficulty (básico | intermedio | avanzado) · sections · badge · badgeId · readTime · color · topics[] · tags[] · muro (null: se lee entera) · portada · imagenPropia?</div>
          </div>
        </div>
        <div className="agi-card">
          <p>De <code>GUIDES</code> sale todo lo demás, solo: el listado <code>/guias</code>, la portada, el sitemap, las guías relacionadas, los logros y la validación de las rutas del quiz.</p>
          <p>En Supabase solo hay <strong>lo que hace cada usuario</strong>, y se llena solo: <code>guide_likes</code>, <code>guide_saves</code>, <code>guide_shares</code>, <code>guide_quiz_completions</code> y <code>user_badges</code>. Las visitas las cuenta la medición de toda la web; la guía no añade nada para eso.</p>
        </div>
      </Seccion>

      <Seccion id="diseno" n="10" titulo="Diseño">
        <div className="agi-card">
          <p>Las guías tienen identidad propia dentro de la web: <strong>oro, naranja, navy y blanco</strong>. El oro manda; el naranja es para lo que se pulsa.</p>
        </div>
        <div className="agi-palette agi-palette--4col">
          <div className="agi-swatch agi-swatch--gold">
            <span className="agi-swatch-name">Oro</span>
            <span className="agi-swatch-var">--gold · #e6b455</span>
            <span className="agi-swatch-use">Dominante: antetítulos, títulos en degradado, bordes de tarjeta, cifras, pastillas.</span>
          </div>
          <div className="agi-swatch agi-swatch--orange">
            <span className="agi-swatch-name">Naranja</span>
            <span className="agi-swatch-var">--accent-orange · #ff6b2b</span>
            <span className="agi-swatch-use">Acción: botones, respuesta elegida, barra de progreso, botón del mini anuncio.</span>
          </div>
          <div className="agi-swatch agi-swatch--navy">
            <span className="agi-swatch-name">Navy</span>
            <span className="agi-swatch-var">#060f1f · #0a1628 · #0f2040</span>
            <span className="agi-swatch-use">Fondos. Secciones alternas entre los dos primeros para separar sin otro color.</span>
          </div>
          <div className="agi-swatch agi-swatch--white">
            <span className="agi-swatch-name">Blanco</span>
            <span className="agi-swatch-var">#ffffff · #dce8f8</span>
            <span className="agi-swatch-use">Títulos y cuerpo. Nunca gris neutro sobre navy.</span>
          </div>
        </div>
        <div className="agi-card">
          <ul className="agi-list">
            <li><strong>Ancho</strong>: la guía ocupa toda la pantalla; el contenido, <code>max-width: 1100px</code>; el texto corrido, 800 px.</li>
            <li><strong>Hero</strong>: fondo <code>#060f1f → #0a1628</code>, antetítulo en oro y la última línea del título en degradado oro.</li>
            <li><strong>Tarjetas</strong>: degradado <code>#0f2040 → #0a1628</code>, borde <code>--gold-border</code>, radio de 18 a 20 px.</li>
            <li><strong>Móvil primero</strong>: se comprueba a 375 px. Tablas y gráficas con su propio desplazamiento lateral; la página nunca se desborda.</li>
            <li><strong>Movimiento</strong>: entradas suaves al hacer scroll y nada que parpadee. Se respeta <code>prefers-reduced-motion</code>.</li>
          </ul>
        </div>
        <div className="agi-card">
          <div className="agi-diff-row"><span className="agi-diff-badge agi-diff--basic">Básico</span><span>Primera vez que se toca el tema.</span></div>
          <div className="agi-diff-row"><span className="agi-diff-badge agi-diff--intermediate">Intermedio</span><span>Pide haber leído las básicas o tener nociones.</span></div>
          <div className="agi-diff-row"><span className="agi-diff-badge agi-diff--advanced">Avanzado</span><span>Conceptos técnicos a fondo.</span></div>
        </div>
      </Seccion>

      <Seccion id="seo" n="11" titulo="El SEO que lleva puesto">
        <div className="agi-card">
          <p>Una guía es un componente propio, así que nada se pone solo. Estas cuatro cosas van a mano en cada guía, y <code>npm run check</code> cancela el <code>push</code> si falta alguna de las tres primeras. <strong>Todo lo demás de SEO</strong> (cómo clasifica Google, el método, los datos estructurados, lo prohibido) está en <Link href="/admin/seo-instrucciones">SEO</Link>.</p>
        </div>
        <div className="agi-card agi-card--mono">
          <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
{`export const metadata: Metadata = {
  alternates: { canonical: "/guias/tu-slug" },   // 1 · relativa, y nunca en un layout
  title: "…",                                     // 4 · la consulta delante, 48 caracteres
  description: "…",                               //     160 caracteres
};

<GuideBreadcrumbJsonLd slug={SLUG} />             // 2 · Article + migas, dentro del return`}
          </pre>
        </div>
        <div className="agi-card">
          <ul className="agi-list">
            <li><strong>1 · Canónica</strong> en su <code>metadata</code>, en ruta relativa. Jamás en un <code>layout.tsx</code>: la heredarían todas las rutas hijas.</li>
            <li><strong>2 · <code>GuideBreadcrumbJsonLd</code></strong>: emite el <code>Article</code> y las migas. El nombre lo saca de <code>GUIDES</code>, que es el que se ve en <code>/guias</code>: el dato estructurado tiene que coincidir con lo visible.</li>
            <li><strong>3 · El alta en <code>GUIDES</code></strong>: el sitemap recorre ese array, no la carpeta. Sin su entrada, la guía es invisible para Google.</li>
            <li><strong>4 · Título y descripción</strong>: el layout añade « | AdelinBTC» (12 caracteres), así que al título le quedan 48 antes de que Google lo corte en una pantalla normal. La consulta, delante.</li>
          </ul>
        </div>
      </Seccion>

      <Seccion id="checklist" n="12" titulo="Lista de cierre">
        <div className="agi-checklist">
          <Punto><strong>Consulta principal</strong> decidida y resultados de Google revisados antes de escribir</Punto>
          <Punto>Slug corto y descriptivo, y comprobado contra los <code>Disallow</code> de <code>robots.ts</code></Punto>
          <Punto><strong>Respuesta en el primer párrafo</strong>, con la consulta en el H1</Punto>
          <Punto>Cada H2 es una pregunta o su respuesta; un solo H1</Punto>
          <Punto>Al menos <strong>una cosa propia</strong> que no esté en los primeros resultados</Punto>
          <Punto>Cada cifra con su <strong>fuente y su fecha</strong>; sección de riesgos escrita</Punto>
          <Punto><strong>Términos técnicos enlazados al diccionario</strong> en su primera aparición; los que faltaban, creados</Punto>
          <Punto>Enlaces a otras guías donde el texto ya las menciona, con destino comprobado</Punto>
          <Punto><strong>Mini anuncios</strong>: uno o dos, con la pieza que encaja, ninguno antes de la segunda sección</Punto>
          <Punto>Quiz de cinco preguntas, envuelto con <code>GuideQuizCuenta</code> para quien no tiene sesión</Punto>
          <Punto>Logro con nombre y <code>badgeId</code> <code>guide-[tema]</code></Punto>
          <Punto>Su <code>[slug].css</code> propio; nada nuevo en <code>guias.css</code> ni en <code>globals.css</code></Punto>
          <Punto>Foto de portada en <code>public/guias/[slug].webp</code> y su ruta en <code>portada</code></Punto>
          <Punto>Cierre fijo: <code>GuiasRelacionadas</code> → interacciones → <code>Footer</code></Punto>
          <Punto>Canónica, <code>GuideBreadcrumbJsonLd</code>, título de 48 y descripción de 160</Punto>
          <Punto>Lo esencial está en el HTML del servidor, no solo dentro de una pieza interactiva</Punto>
          <Punto>Probada sin sesión (se lee entera, el quiz pide cuenta) y con sesión (el quiz guarda)</Punto>
          <Punto><code>npm run check &amp;&amp; npx tsc --noEmit</code> en verde</Punto>
          <Punto><strong>Auditoría SEO ofrecida</strong>, y hecha o anotada como pendiente</Punto>
          <Punto><strong>«Sí» explícito del admin</strong> antes de dar de alta en <code>GUIDES</code></Punto>
        </div>
      </Seccion>

      <Seccion id="despues" n="13" titulo="Después de publicar">
        <div className="agi-card">
          <p><strong>Qué mirar, y cuándo.</strong> Google tarda: lo normal es que una guía nueva se mueva durante semanas.</p>
          <ul className="agi-list">
            <li><strong>A los dos o tres días</strong>: que está indexada (Search Console, Inspección de URL).</li>
            <li><strong>A las dos semanas</strong>: en <Link href="/admin">Analítica</Link>, sus visitas en «Páginas más vistas» y en «Páginas de entrada», y de qué canal llegan.</li>
            <li><strong>A las seis semanas</strong>: en Search Console, con qué consultas aparece y en qué posición. Si sale entre los puestos 5 y 20 para una consulta, se refuerza la sección que la responde.</li>
            <li><strong>Cada seis meses</strong>, o cuando cambie el proyecto o la norma: se revisan las cifras y se actualiza la fecha de revisión solo si se ha cambiado algo de verdad.</li>
          </ul>
        </div>
        <div className="agi-card">
          <p><strong>Qué se toca para cada cambio:</strong></p>
          <ul className="agi-list">
            <li><strong>Título, descripción, dificultad, minutos, temas</strong>: su objeto en <code>GUIDES</code>.</li>
            <li><strong>Contenido o piezas</strong>: su <code>page.tsx</code> y sus componentes. Reescribir media guía es publicar otra página en la misma URL: se vuelve a ofrecer la auditoría SEO.</li>
            <li><strong>Portada</strong>: el archivo en <code>public/guias/</code> y el campo <code>portada</code>.</li>
            <li><strong>Retirar una guía</strong>: se quita de <code>GUIDES</code> y se borra su carpeta entera. Si Google ya la conocía, su URL se da de alta en <code>src/lib/retiradas.ts</code> para que responda 410.</li>
          </ul>
          <p className="agi-note">No hay panel para editar guías: se gestionan en el código. Las cifras de uso (me gusta, guardados, compartidos y notas del quiz) están en Supabase, por <code>guide_slug</code>.</p>
        </div>
      </Seccion>
    </div>
  );
}
