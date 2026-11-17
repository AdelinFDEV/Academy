import Link from "next/link";
import IndiceApuntes from "../IndiceApuntes";
import "../apuntes.css";

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
  ["anuncios", "Anuncios internos"],
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
        <h1 className="agi-hero-title">Cómo se hace <span className="fluor">una guía</span></h1>
        <p className="agi-hero-sub">
          Las guías son gratuitas y son lo que Google enseña de la academia. Cada una tiene dos trabajos: responder
          mejor que nadie a lo que alguien ha buscado, y presentarle, sin estorbar, lo que la academia vende. Léelo
          entero antes de empezar una guía nueva.
        </p>
      </div>

      <div className="agi-cuaderno">
      <IndiceApuntes items={INDICE} />
      <div className="agi-hojas">

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
            <div><b>4 · Premium</b><span>Dos anuncios le enseñan la pieza que le encaja</span></div>
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
            <li>Qué pieza de pago encaja mejor con el tema, si hay duda (ver «Anuncios internos»).</li>
          </ul>
          <p className="agi-note">Ya no se pregunta si la guía es gratis o de pago: desde el 31-10-2026 <strong>todas son gratuitas</strong> y se leen enteras sin cuenta.</p>
        </div>
      </Seccion>

      <Seccion id="flujo" n="03" titulo="El flujo, paso a paso">
        <div className="agi-steps">
          <Paso n={1} titulo="Tema, consulta y fuentes">Se cierra la consulta principal, se miran los resultados de Google y se reúnen las fuentes. Sin esto no se escribe.</Paso>
          <Paso n={2} titulo="Esquema">Las secciones, en el orden en que el lector se hace las preguntas, con la pieza interactiva de cada una y dónde van los dos anuncios. El admin lo ve antes de que se escriba el cuerpo.</Paso>
          <Paso n={3} titulo="Términos del diccionario">Toda palabra técnica se enlaza al diccionario en su primera aparición. Las que no existan se crean ahora, con una definición buena (<code>PLANTILLA-DICCIONARIO.md</code>). Es una regla intocable y no espera a que nadie la pida.</Paso>
          <Paso n={4} titulo="Construcción">Su <code>page.tsx</code>, su <code>[slug].css</code>, sus piezas interactivas y su quiz, con el contenido completo: nada de esqueletos ni textos de relleno.</Paso>
          <Paso n={5} titulo="Auditoría SEO">Al terminar se ejecuta siempre <code>AUDITORIA-SEO.md</code> entero, sin preguntar (pedido por el admin el 14-11-2026). El borrador queda listo para publicar, con SEO y todo, a falta solo de la portada.</Paso>
          <Paso n={6} titulo="Alta como borrador">Se da de alta en <code>BORRADORES</code> (<code>src/lib/guides.ts</code>), con su consulta y la fecha de su auditoría, y se despliega. <strong>Nunca directamente en <code>GUIDES</code></strong>. Desplegada así, solo la ve el admin: no sale en listados ni en el sitemap, y su URL da 404 a los demás.</Paso>
          <Paso n={7} titulo="Publicación, por el admin">El admin la revisa en <Link href="/admin/acciones">Acciones</Link> y pulsa «Publicar». Desde ese momento es pública e indexable, sin desplegar nada. Publicar es siempre un gesto suyo.</Paso>
          <Paso n={8} titulo="Ascenso">En la siguiente sesión, la guía ya publicada se mueve de <code>BORRADORES</code> al final de <code>GUIDES</code>. Con eso entra en la vitrina de Logros. El buscador de guías ya la enseña desde que se publica (<code>/api/guias/publicadas</code>).</Paso>
          <Paso n={9} titulo="Seguimiento">A las dos y a las seis semanas se mira en Analítica y en Search Console cómo va (bloque 13).</Paso>
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
              <tr><td><strong>Anuncio 1</strong></td><td><strong>Obligatorio.</strong> Formato «compacto», un poco antes de la mitad de la guía y nunca antes de la segunda sección. Con su imagen y su botón.</td><td>Mucha gente no llega al final: si el único anuncio está abajo, la mayoría no lo ve nunca.</td></tr>
              <tr><td><strong>Riesgos</strong></td><td>Una sección propia con lo que puede salir mal.</td><td>Es contenido de dinero: callar los riesgos resta confianza al lector y a Google.</td></tr>
              <tr><td><strong>Anuncio 2</strong></td><td><strong>Obligatorio.</strong> Formato «tarjeta», el grande, después de todo el contenido y antes del quiz. De una pieza distinta a la del primero.</td><td>Quien ha llegado hasta aquí es quien más probablemente quiere seguir.</td></tr>
              <tr><td><strong>Quiz</strong></td><td>Con cuenta. Sin sesión, la invitación a registrarse con el nombre del logro.</td><td>Es el paso de visitante a usuario registrado.</td></tr>
              <tr><td><strong>Cierre fijo</strong></td><td><code>GuiasRelacionadas</code> → interacciones → <code>Footer</code>.</td><td>Las relacionadas son el único enlace que unas guías reciben de otras.</td></tr>
            </tbody>
          </table>
        </div>
        <div className="agi-card agi-card--mono">
          {`<GuiaAnuncio producto="…" variante="compacto" estado={…} />   {/* un poco antes de la mitad */}`}<br />
          {`…`}<br />
          {`<GuiaAnuncio producto="…" estado={…} />   {/* el grande, antes del quiz */}`}<br />
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

      <Seccion id="anuncios" n="06" titulo="Anuncios internos">
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
            {`  variante="compacto"          // compacto (a media guía) · tarjeta (al final, por defecto)`}<br />
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
              <li><strong>Dos como mínimo, en todas las guías</strong> (pedido por el admin el 13-11-2026): un «compacto» un poco antes de la mitad y una «tarjeta» al final, antes del quiz. Es por quien no lee el artículo entero. De piezas distintas, para no repetir el mismo mensaje.</li>
              <li><strong>Siempre con imagen y con un botón que se vea.</strong> Nada de franjas de una línea: el anuncio lleva su imagen, un titular y un botón naranja que dice qué pasa al pulsarlo. La imagen la pone el componente: una ilustración por pieza, en <code>public/anuncios/</code>, sin texto ni cifras dentro.</li>
              <li><strong>Un tercero solo si la guía es muy larga</strong> (más de diez secciones), y nunca dos seguidos sin al menos dos secciones entre ellos.</li>
              <li><strong>El botón lleva a la ficha pública</strong> de la pieza, no al pago. La guía despierta el interés; la ficha explica y vende.</li>
              <li><strong>El precio, siempre a la vista.</strong> Nunca se esconde que es de pago. El componente lo saca de <code>PREMIUM_PRICE_EUR</code>.</li>
              <li><strong>A quien ya es Premium no se le vende</strong>: ve el mismo anuncio, pero con el botón que le abre su herramienta y «Incluido en tu Premium». El de Premium en sí no se le enseña. Lo decide el componente con <code>estado</code>.</li>
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
          <div className="agi-code-row"><span className="agi-code-path">src/lib/guides.ts</span><span>El alta: primero en <code>BORRADORES</code>; tras publicarla el admin, al final de <code>GUIDES</code>.</span></div>
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
          <p>Las guías visten el estilo de toda la web, el <strong>«Cuaderno de estudio»</strong>: fondo lavanda claro, hojas de papel con canto, teclas que se hunden y tres letras (Fraunces para titulares y cifras, Nunito para leer y pulsar, Caveat para las notas a mano). La fuente de verdad es <code>ESTILO.md</code>, y el sistema de piezas, <code>disenos/sistema.html</code>: lo que una guía necesite y no esté allí, se añade allí primero.</p>
          <p>Cada sección de la web tiene su color, y <strong>el de las guías es el cielo</strong>. Los demás colores no adornan: significan algo.</p>
        </div>
        <div className="agi-card">
          <p><strong>Toda guía lleva marcas de estudio</strong> (decidido el 17-11-2026, referencia: la guía de Ethereum): tiene que parecer el cuaderno de alguien que la ha estudiado a fondo. Lo más importante de cada sección se marca con <code>Anotacion</code> y un código de colores fijo —amarillo rotulador la idea clave, naranja rodeado lo que no te puedes saltar, azul subrayado un concepto, coral un error o un riesgo, menta la conclusión, lila lo que entra en el quiz, corchete al margen un párrafo-resumen—, con símbolos dibujados (<code>SimboloEstudio</code>, <code>Llave</code>) y las cajas de nota o aviso como <code>Postit</code>. Como mucho dos o tres trazos animados por pantalla. <strong>Nunca se cambia una palabra del texto</strong>: se comprueba con el texto visible antes y después y con <code>check:seo</code>. Una guía nueva se escribe ya con sus marcas. El detalle, en <code>ESTILO.md</code>, «Las marcas de estudio».</p>
        </div>
        <div className="agi-palette agi-palette--4col">
          <div className="agi-swatch" style={{ "--muestra": "var(--cielo)" } as React.CSSProperties}>
            <span className="agi-swatch-name">Cielo</span>
            <span className="agi-swatch-var">--cielo · -o · -s</span>
            <span className="agi-swatch-use">El de la guía: antetítulos a mano, chips, rótulos de las piezas, cifras, cabeceras de tabla, avisos de dato y mazos de relacionadas.</span>
          </div>
          <div className="agi-swatch" style={{ "--muestra": "var(--naranja)" } as React.CSSProperties}>
            <span className="agi-swatch-name">Naranja</span>
            <span className="agi-swatch-var">--naranja · -o · -s</span>
            <span className="agi-swatch-use">La acción principal: una sola tecla naranja por bloque (el botón del anuncio, «Siguiente pregunta»).</span>
          </div>
          <div className="agi-swatch" style={{ "--muestra": "linear-gradient(90deg, var(--menta) 50%, var(--coral) 50%)" } as React.CSSProperties}>
            <span className="agi-swatch-name">Menta · Coral</span>
            <span className="agi-swatch-var">--menta · --coral</span>
            <span className="agi-swatch-use">Acierto y fallo, «sí» y «no»: lo que está bien y lo que es un error o un riesgo serio.</span>
          </div>
          <div className="agi-swatch" style={{ "--muestra": "var(--amarillo)" } as React.CSSProperties}>
            <span className="agi-swatch-name">Amarillo</span>
            <span className="agi-swatch-var">--amarillo · -o · -s</span>
            <span className="agi-swatch-use">El rotulador del titular, el logro del quiz, las citas (un pósit) y el descargo de riesgo.</span>
          </div>
        </div>
        <div className="agi-card">
          <ul className="agi-list">
            <li><strong>Base</strong>: todo cuelga de <code>.gbc-wrap</code> (fondo <code>--fondo</code>, texto <code>--tinta</code>, <code>color-scheme: light</code>). Las piezas comunes están en <code>src/app/guias/guias.css</code>; lo propio de cada guía, en su <code>[slug].css</code> con su prefijo. Las variables del diseño antiguo (<code>--gold</code>, <code>--text-primary</code>, <code>--bg-card</code>…) no se usan.</li>
            <li><strong>Hero</strong>: la nota a mano (<code>gbc-hero-ey</code>), el H1 con su última línea en rotulador amarillo (<code>gbc-hero-gold</code>, nombre heredado), la respuesta escrita en una hoja de cuaderno rayada (<code>gbc-respuesta</code>), chips cielo (<code>gbc-pill</code>) y, si las hay, las cifras en fichas de papel (<code>GuideHeroStats</code>).</li>
            <li><strong>Índice y secciones</strong>: el índice es una tira de chips en una hoja, <strong>no fija</strong>. Cada sección se separa con una raya discontinua; su antetítulo (<code>gbc-ey</code>) va a mano en cielo y su título (<code>gbc-title</code>), en Fraunces 800. Texto corrido a 18 px; enlaces subrayados a boli azul.</li>
            <li><strong>Hojas de papel</strong>: una pieza interactiva, una tarjeta o una tabla es papel con radio de 22 a 28 px y canto sólido <code>0 6px 0 var(--gris-o)</code>, sin bordes finos. Su rótulo va arriba, como chip cielo en mayúsculas. Dentro, sub-tarjetas con canto de 4 px. Esquinas siempre redondeadas.</li>
            <li><strong>Avisos</strong> (<code>gbc-box</code>): borde de 3 px y fondo suave de su color; cielo por defecto (un dato), <code>--red</code> en coral (riesgo o error) y <code>--green</code> en menta (lo que está bien). <code>--gold</code> es el nombre antiguo del de cielo. El descargo es siempre <code>DisclaimerRiesgo</code>, vestido de aviso amarillo.</li>
            <li><strong>Tablas y gráficas</strong>: la tabla, en <code>gbc-tabla-caja</code> (cabecera cielo, filas separadas por 2 px de gris, desplazamiento lateral propio). Las gráficas, en <code>gbc-chart-wrap</code>, con los hex de la paleta (Recharts no entiende <code>var()</code> en todos sus props), ejes en gris y sin degradados brillantes.</li>
            <li><strong>Botones</strong>: todos son <code>Tecla</code>. Un conmutador («Bitcoin | Monero») son teclas pequeñas: la elegida en cielo y las demás blancas, con <code>aria-pressed</code>. Campos y deslizadores como en el sistema: borde de 3 px, foco azul, pista gruesa y tirador cielo con canto.</li>
            <li><strong>Cifras</strong>: grandes, en Fraunces 800 con números tabulares. Verde y rojo (<code>--sube</code>, <code>--baja</code>) <strong>solo en cifras con signo</strong>; un estado bueno o malo que no es una cifra va en menta o coral.</li>
            <li><strong>Piezas comunes</strong>: <code>GuideFlipCards</code> (papel delante, cielo suave detrás), <code>GuideSpotlightCards</code> (fichas numeradas), el quiz (cada respuesta es una tecla con su letra, también con A-D e Intro; la correcta pasa a menta y la fallada a coral), <code>GuiasRelacionadas</code> (mazos cielo, como en la portada) y <code>GuiaAnuncio</code> (tarjeta de producto del color de su pieza, con su tecla naranja).</li>
            <li><strong>Sonidos</strong> (<code>src/lib/sonidos.ts</code>): las teclas hacen su clic solas y las tarjetas suenan al girar. El quiz suena <code>acierto</code> o <code>fallo</code> al comprobar, y <code>logro</code> con el confeti al acertarlo entero; los minijuegos, igual. Un simulador por pasos suena <code>avance</code>, y una casilla, <code>interruptor</code>. Deslizadores, escribir y pasar el ratón no suenan, y nada suena sin que la persona haga algo.</li>
            <li><strong>Nada anclado</strong>: sin barra de lectura, sin índice fijo y sin avisos pegados arriba al hacer scroll.</li>
            <li><strong>Ancho</strong>: el contenido, <code>max-width: 1100px</code>; el texto corrido, 760 px.</li>
            <li><strong>Móvil primero</strong>: se comprueba a 360 px. Tablas y gráficas con su propio desplazamiento lateral; la página nunca se desborda.</li>
            <li><strong>Movimiento</strong>: con gracia y rebote, nada que parpadee y siempre con su <code>prefers-reduced-motion</code>. Las cifras que cuentan salen ya escritas en el HTML: la cuenta es un adorno, no el dato.</li>
            <li><strong>Sin emojis</strong>, sin negro puro, sin dorados ni brillos.</li>
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
            <li><strong>3 · El alta en <code>guides.ts</code></strong> (<code>BORRADORES</code>, y después <code>GUIDES</code>): el sitemap sale de ahí, no de la carpeta. Sin su entrada, la guía es invisible para Google.</li>
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
          <Punto><strong>Dos anuncios</strong>: uno compacto antes de la mitad y la tarjeta antes del quiz, de piezas distintas, ninguno antes de la segunda sección</Punto>
          <Punto>Quiz de cinco preguntas, envuelto con <code>GuideQuizCuenta</code> para quien no tiene sesión</Punto>
          <Punto>Logro con nombre y <code>badgeId</code> <code>guide-[tema]</code></Punto>
          <Punto>Su <code>[slug].css</code> propio; nada nuevo en <code>guias.css</code> ni en <code>globals.css</code></Punto>
          <Punto>Foto de portada en <code>public/guias/[slug].webp</code> y su ruta en <code>portada</code></Punto>
          <Punto>Cierre fijo: <code>GuiasRelacionadas</code> → interacciones → <code>Footer</code></Punto>
          <Punto>Canónica, <code>GuideBreadcrumbJsonLd</code>, título de 48 y descripción de 160</Punto>
          <Punto>Lo esencial está en el HTML del servidor, no solo dentro de una pieza interactiva</Punto>
          <Punto>Probada sin sesión (se lee entera, el quiz pide cuenta) y con sesión (el quiz guarda)</Punto>
          <Punto><code>npm run check &amp;&amp; npx tsc --noEmit</code> en verde</Punto>
          <Punto><strong>Auditoría SEO hecha</strong> entera (Fases 0 a 17), con su informe</Punto>
          <Punto>Dada de alta en <code>BORRADORES</code>, con <code>lista</code>, <code>consulta</code> y <code>auditada</code>. <strong>La publica el admin</strong> desde Acciones</Punto>
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
            <li><strong>Retirar una guía</strong>: si aún está en <code>BORRADORES</code>, «Volver a borrador» en Acciones. Si ya está en <code>GUIDES</code>, se quita de <code>GUIDES</code> y se borra su carpeta entera. Si Google ya la conocía, su URL se da de alta en <code>src/lib/retiradas.ts</code> para que responda 410.</li>
          </ul>
          <p className="agi-note">No hay panel para editar guías: se gestionan en el código. Las cifras de uso (me gusta, guardados, compartidos y notas del quiz) están en Supabase, por <code>guide_slug</code>.</p>
        </div>
      </Seccion>
      </div>
      </div>
    </div>
  );
}
