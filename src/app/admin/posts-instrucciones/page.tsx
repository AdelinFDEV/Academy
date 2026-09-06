export default function PostsInstruccionesPage() {
  return (
    <div className="admin-guide-instructions">

      <div className="agi-hero">
        <div className="agi-hero-label">SOLO ADMIN · REFERENCIA INTERNA</div>
        <h1 className="agi-hero-title">Sistema de Entradas del Blog</h1>
        <p className="agi-hero-sub">
          Instrucciones para Claude sobre cómo redactar una entrada nueva a partir de un artículo o noticia que da el admin.
          Leer antes de escribir cualquier entrada nueva o si se pierde el contexto de la conversación.
        </p>
      </div>

      {/* ── BLOQUE 1: FILOSOFÍA ── */}
      <section className="agi-section">
        <h2 className="agi-section-title">
          <span className="agi-section-num">01</span>
          Filosofía y propósito
        </h2>
        <div className="agi-card">
          <p>Las entradas son <strong>artículos de lectura ágil</strong> (3–8 minutos), muy distintas de las guías: nada de minijuegos, quiz ni progreso — solo texto bien estructurado, cercano y fácil de seguir, con al menos un gráfico para hacer la lectura más amena. Pueden extenderse lo que el tema pida: lo que las separa de una guía no es la longitud, sino que <strong>se leen, no se recorren</strong>.</p>
          <ul className="agi-list">
            <li>El admin pasa un artículo o noticia (texto o link) como base — <strong>nunca se traduce ni se copia</strong>, siempre se reescribe entero con voz propia</li>
            <li>Cada entrada debe ser <strong>única e independiente</strong>: sin enlaces externos ni promociones del artículo original</li>
            <li>Público objetivo fijo: <strong>principiantes e intermedios</strong> en cripto — todo concepto técnico se explica al mencionarlo</li>
            <li>Todas las entradas siguen <strong>el mismo patrón</strong> de estructura, tono y metadatos descrito en esta página</li>
          </ul>
        </div>
        <div className="agi-card" style={{ marginTop: "1rem" }}>
          <p className="agi-warning">⚠️ <strong>Una entrada nunca es un componente de código.</strong> Es una fila nueva en la tabla <code>posts</code> de Supabase — jamás crear un archivo <code>.tsx</code> ni <code>.css</code> para una entrada. Así se publica sin desplegar código y sin que <code>globals.css</code> vuelva a crecer. Esto es justo al revés que las guías (bloque «Guías·Ref»), donde cada guía nueva <strong>sí</strong> es un componente React independiente con su propio CSS. Decisión explícita del admin — detalle completo en <code>AGENTS.md</code>.</p>
        </div>
      </section>

      {/* ── BLOQUE 2: PREGUNTAS OBLIGATORIAS ── */}
      <section className="agi-section">
        <h2 className="agi-section-title">
          <span className="agi-section-num">02</span>
          Preguntas obligatorias antes de escribir
        </h2>
        <div className="agi-card">
          <p className="agi-warning">⚠️ Estas tres preguntas se hacen <strong>siempre</strong>, antes de escribir una sola palabra del artículo. Nunca se asumen ni se dejan para después.</p>
        </div>
        <div className="agi-steps">
          <div className="agi-step">
            <div className="agi-step-num">1</div>
            <div>
              <strong>¿Qué categoría?</strong>
              <p>El admin da la categoría. Si no existe todavía, Claude la crea (ver bloque 06) y confirma que aparece correctamente en home, listado de artículos y páginas de categoría — es todo dinámico, no hace falta tocar código aparte de crear la fila.</p>
            </div>
          </div>
          <div className="agi-step">
            <div className="agi-step-num">2</div>
            <div>
              <strong>¿Free o Premium?</strong>
              <p>Define <code>is_premium</code>. Sin esta respuesta no se empieza a redactar.</p>
            </div>
          </div>
          <div className="agi-step">
            <div className="agi-step-num">3</div>
            <div>
              <strong>¿Imagen de portada?</strong>
              <p>El admin la da. Claude la sube a Supabase Storage (bucket <code>media</code>, mismo sistema que ya usa el panel) y guarda la URL pública resultante en <code>cover_image</code> — nunca se enlaza una imagen externa directamente.</p>
              <p className="agi-note">
                <strong>Regla desde el 31-08-2026: toda portada se convierte a WebP antes de subirla.</strong> Sin excepciones y sin preguntar — el admin da la imagen, Claude la optimiza. Ancho máximo <strong>1600 px</strong> y calidad <strong>82</strong>.
              </p>
              <p className="agi-note">
                <strong>Por qué.</strong> Las tres portadas de las entradas de fiscalidad llegaron en PNG pesando <strong>8 MB entre las tres</strong>; en WebP quedaron en <strong>904 KB</strong>, un 89 % menos y sin diferencia visible. Un PNG de 2,7 MB en la portada arruina la carga de la página mucho más de lo que la mejora cualquier optimización de servidor — y eso es justo lo que Google mide como experiencia real del visitante. El límite de 5 MB del panel deja pasar esos archivos: <strong>que entre no significa que valga</strong>.
              </p>
            </div>
          </div>
        </div>
        <div className="agi-card agi-card--mono" style={{ marginTop: "1rem" }}>
          <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
{`// La conversión, con sharp (ya viene con Next, no hay que instalar nada):
const webp = await sharp(original)
  .resize({ width: 1600, withoutEnlargement: true })
  .webp({ quality: 82 })
  .toBuffer();

// Y se sube con el nombre de siempre, cambiando la extensión:
//   \${Date.now()}-\${slug}.webp     ·     contentType: "image/webp"`}
          </pre>
        </div>
      </section>

      {/* ── BLOQUE 3: FLUJO DE TRABAJO ── */}
      <section className="agi-section">
        <h2 className="agi-section-title">
          <span className="agi-section-num">03</span>
          Flujo de creación — paso a paso
        </h2>
        <div className="agi-steps">
          <div className="agi-step">
            <div className="agi-step-num">1</div>
            <div>
              <strong>Admin pasa el artículo</strong>
              <p>Texto completo pegado, o un link. Si es un link, Claude confirma que puede leerlo (WebFetch). Si no se puede leer, se avisa y se investiga el tema en otras fuentes para escribir el artículo igualmente — nunca se inventa información.</p>
            </div>
          </div>
          <div className="agi-step">
            <div className="agi-step-num">2</div>
            <div>
              <strong>Claude hace las 3 preguntas obligatorias</strong>
              <p>Categoría, Free/Premium, imagen de portada (bloque 02). Sin las tres respuestas no se redacta nada.</p>
            </div>
          </div>
          <div className="agi-step">
            <div className="agi-step-num">3</div>
            <div>
              <strong>Claude redacta la entrada completa</strong>
              <p>Siguiendo el tono (bloque 04) y la estructura (bloque 05): título, extracto, contenido en HTML con mínimo un gráfico, y todos los campos SEO.</p>
            </div>
          </div>
          <div className="agi-step">
            <div className="agi-step-num">4</div>
            <div>
              <strong>Claude pasa el validador</strong>
              <p>
                <code>npm run check:contenido -- &lt;slug&gt;</code> comprueba contra Supabase todas las reglas de esta página: longitud, <code>seo_title</code> y <code>meta_description</code>, gráfico obligatorio, enlaces internos que existan de verdad, etiquetas permitidas y portada en WebP. <strong>Tiene que salir en verde.</strong> Es lo que evita depender de que alguien se acuerde de cada regla.
              </p>
            </div>
          </div>
          <div className="agi-step">
            <div className="agi-step-num">5</div>
            <div>
              <strong>Admin revisa</strong>
              <p>Claude muestra el borrador completo (título, extracto, contenido, categoría, free/premium). El admin aprueba o pide cambios. Sin aprobación explícita, no se publica nada.</p>
            </div>
          </div>
          <div className="agi-step">
            <div className="agi-step-num">6</div>
            <div>
              <strong>Claude publica</strong>
              <p>Inserta la fila en la tabla <code>posts</code> de Supabase directamente (Claude tiene acceso de servidor vía service role key — no hace falta editor en el panel ni SQL manual del admin). Por defecto <code>published = true</code>, salvo que el admin pida dejarlo en borrador.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── BLOQUE 4: TONO Y ESTILO ── */}
      <section className="agi-section">
        <h2 className="agi-section-title">
          <span className="agi-section-num">04</span>
          Tono y estilo — voz de AdelinBTC
        </h2>
        <div className="agi-card">
          <ul className="agi-list">
            <li>Lenguaje <strong>cercano</strong>, como explicándoselo a un amigo — nunca acartonado ni de manual técnico</li>
            <li>Todo concepto técnico se aclara en el momento en que aparece, con una analogía o ejemplo sencillo si ayuda</li>
            <li>Se puede usar primera persona / trato directo al lector («seguramente has visto…», «vamos a bajarle un poco a la intensidad»)</li>
            <li>Cierre cálido y personal — la web ya tiene un estilo de despedida reconocible, mantenerlo</li>
            <li>Extraer la información más relevante del artículo original, pero siempre reescrita y reestructurada — nunca es una traducción</li>
            <li><strong>Nunca</strong> incluir enlaces externos, menciones promocionales, ni CTAs del artículo original</li>
          </ul>
        </div>
        <div className="agi-subsection">
          <h3 className="agi-subsection-title">Ejemplo real ya publicado (referencia de tono)</h3>
          <div className="agi-card agi-card--mono">
            <p style={{ fontStyle: "italic", color: "var(--text-secondary)" }}>
              «Seguramente han visto los titulares que pintan un panorama un poco oscuro para MicroStrategy, la empresa famosa por apostar todo a Bitcoin. […] Sé que esto puede sonar alarmante, especialmente si seguimos de cerca el ecosistema, pero vamos a bajarle un poco a la intensidad y a explicarlo de forma clara, como siempre, entre amigos.»
            </p>
            <p style={{ fontStyle: "italic", color: "var(--text-secondary)", marginTop: "0.75rem" }}>
              «Muchas gracias por acompañarme hoy y dedicarle este tiempo a entender mejor lo que mueve los mercados. ¡Sigan educándose y analizando, que esa es nuestra mejor ventaja en este mundo! Un abrazo enorme, ¡seguimos en contacto!»
            </p>
          </div>
        </div>
      </section>

      {/* ── BLOQUE 5: ESTRUCTURA ── */}
      <section className="agi-section">
        <h2 className="agi-section-title">
          <span className="agi-section-num">05</span>
          Estructura de la entrada
        </h2>
        <div className="agi-card">
          <ul className="agi-list">
            <li><strong>Longitud: 500–1500 palabras</strong> (3–8 min). El rango es amplio a propósito: <strong>manda el tema, no la cifra</strong>. Una noticia concreta se despacha en 500; un tema que necesita contexto, matices o desmontar una confusión extendida puede irse a 1500 sin recortar nada de valor. <strong>Nunca rellenar para llegar, ni podar algo que aporta para no pasarse</strong></li>
            <li><strong>Mínimo un gráfico</strong> por entrada (ver HTML en bloque 08) — hace la lectura más entretenida y visual</li>
            <li>Subtítulos (<code>&lt;h2&gt;</code>) para separar bloques temáticos — nunca un muro de texto sin cortes</li>
            <li>Párrafos cortos (<code>&lt;p&gt;</code>), variar su longitud para dar ritmo — no todos del mismo tamaño</li>
            <li>Negrita (<code>&lt;strong&gt;</code>) en lo más importante de cada párrafo — cifras clave, conclusiones, nombres propios relevantes</li>
            <li>Usar <code>.prose-callout--tip</code> / <code>--info</code> / <code>--warning</code> (ver bloque 08) para destacar un dato o aviso puntual</li>
            <li>Extracto (<code>excerpt</code>): 1–2 frases que resuman el gancho del artículo, se muestra en las cards del listado</li>
          </ul>
        </div>
      </section>

      {/* ── BLOQUE 6: ESQUEMA REAL EN SUPABASE ── */}
      <section className="agi-section">
        <h2 className="agi-section-title">
          <span className="agi-section-num">06</span>
          Esquema real en Supabase
        </h2>
        <div className="agi-subsection">
          <div className="agi-card agi-card--mono">
            <div className="agi-table-def">
              <div className="agi-table-name">posts</div>
              <div className="agi-table-fields">
                id · title · slug · excerpt · content (HTML) · cover_image · youtube_url · category_id · is_premium (bool) · is_featured (bool) · published (bool) · seo_title · meta_description · focus_keyword · created_at · updated_at · base_likes · base_saves · shares_count
              </div>
            </div>
            <div className="agi-table-def">
              <div className="agi-table-name">categories</div>
              <div className="agi-table-fields">
                id · name · slug · created_at
              </div>
            </div>
          </div>
        </div>
        <div className="agi-card" style={{ marginTop: "1rem" }}>
          <p><strong>Importante:</strong> <code>content</code> es <strong>HTML final</strong>, escrito directamente por Claude — no hay Markdown ni ningún parser de por medio (se quitó a propósito: no tiene sentido una sintaxis simplificada pensada para que un humano escriba a mano, cuando quien redacta cada entrada es Claude). Se inserta tal cual con <code>dangerouslySetInnerHTML</code> en <code>post/[slug]/page.tsx</code>.</p>
          <p style={{ marginTop: "0.6rem" }}>Etiquetas disponibles y ya con estilo propio en <code>.prose-content</code> (globals.css): <code>h1–h4</code>, <code>p</code>, <code>strong</code>, <code>em</code>, <code>a</code>, <code>ul</code>/<code>ol</code>/<code>li</code>, <code>blockquote</code>, <code>pre</code>/<code>code</code>, <code>hr</code>, <code>table</code> (clase <code>.prose-table</code>), imágenes (clase <code>.prose-img</code>), callouts (<code>.prose-callout</code>), el gráfico de barras (<code>.prose-chart</code>) y las piezas para textos largos —<code>.prose-resumen</code>, <code>.prose-vs</code>, <code>.prose-dato</code>, <code>.prose-hitos</code> y <code>.prose-pasos</code>— todas en el bloque 08. Cualquier otra etiqueta se renderiza igualmente pero sin estilo propio garantizado — usar solo lo de esta lista.</p>
        </div>
      </section>

      {/* ── BLOQUE 7: CATEGORÍA NUEVA ── */}
      <section className="agi-section">
        <h2 className="agi-section-title">
          <span className="agi-section-num">07</span>
          Cómo crear una categoría nueva
        </h2>
        <div className="agi-card">
          <p>Las categorías son 100% dinámicas — se leen de la tabla <code>categories</code> en <strong>home, menú, listado de artículos y páginas <code>/categoria/[slug]</code></strong>. No hay ninguna lista hardcodeada que tocar en el código.</p>
          <p style={{ marginTop: "0.6rem" }}>Claude inserta la fila directamente en Supabase (vía service role key) con <code>name</code> y <code>slug</code> (slug en minúsculas, sin acentos, con guiones). En cuanto existe la fila, la categoría aparece sola en todos los sitios correspondientes — no hace falta ningún cambio de código adicional.</p>
        </div>
      </section>

      {/* ── BLOQUE 8: GRÁFICO Y CALLOUTS ── */}
      <section className="agi-section">
        <h2 className="agi-section-title">
          <span className="agi-section-num">08</span>
          Gráfico (obligatorio, mínimo 1 por entrada) y callouts
        </h2>
        <div className="agi-subsection">
          <h3 className="agi-subsection-title">Gráfico de barras — HTML a escribir directamente en <code>content</code></h3>
          <div className="agi-card agi-card--mono">
            <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
{`<div class="prose-chart">
  <div class="prose-chart-title">Dominancia de mercado</div>
  <div class="prose-chart-row">
    <span class="prose-chart-label">Bitcoin</span>
    <div class="prose-chart-track"><div class="prose-chart-fill" style="width:100%"></div></div>
    <span class="prose-chart-value">54%</span>
  </div>
  <div class="prose-chart-row">
    <span class="prose-chart-label">Ethereum</span>
    <div class="prose-chart-track"><div class="prose-chart-fill" style="width:33%"></div></div>
    <span class="prose-chart-value">18%</span>
  </div>
</div>`}
            </pre>
          </div>
          <div className="agi-card" style={{ marginTop: "1rem" }}>
            <ul className="agi-list">
              <li>El <code>width</code> de <code>.prose-chart-fill</code> es un porcentaje calculado a mano por Claude: <code>(valor / valor_más_alto) × 100</code></li>
              <li>Barras horizontales, 100% estático — sin JS de cliente, sin dependencias</li>
              <li>Usar para: comparativas de precio, reparto porcentual, ranking de valores — cualquier dato que se entienda mejor visualmente</li>
              <li><strong>Grafica la diferencia, no el total.</strong> En la ficha de <code>exchange</code> el primer gráfico comparaba «lo que queda de 1.000 €» con comisiones del 1,5 %, 0,5 % y 0,1 %: las tres barras salían casi idénticas (98,5 / 99,5 / 99,9) y escondían justo lo que se quería enseñar. Cambiado a graficar el <em>coste</em> (15 € / 5 € / 1 €), la diferencia se ve de un vistazo</li>
            </ul>
          </div>
        </div>

        {/* Piezas añadidas el 07-09-2026 al ampliar el diccionario. */}
        <div className="agi-subsection">
          <h3 className="agi-subsection-title">Piezas para textos largos — que no parezca un muro</h3>
          <div className="agi-card">
            <p>Un texto de más de 800 palabras en párrafos seguidos no lo lee nadie, y aquí no hay fotos que lo rompan: la academia no usa imágenes decorativas. Estas piezas ponen el aire, y todas <strong>aportan información</strong> — no son adorno.</p>
            <p style={{ marginTop: "0.6rem" }}><strong>La regla:</strong> si el bloque no dice nada que el párrafo no diga ya, sobra. Sirven para estructurar, no para decorar.</p>
          </div>
          <div className="agi-card agi-card--mono" style={{ marginTop: "1rem" }}>
            <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: "0.78rem", color: "var(--text-secondary)" }}>
{`<!-- Resumen de entrada: lo que se lleva quien no sigue leyendo -->
<div class="prose-resumen">
  <span class="prose-resumen-title">En veinte segundos</span>
  <p>…</p>
</div>

<!-- Comparación a dos columnas. data-tono: "favor" (verde) o "contra" (rojo) -->
<div class="prose-vs">
  <div class="prose-vs-lado prose-vs-lado--a">
    <p class="prose-vs-title">Centralizado</p>
    <p class="prose-vs-sub">CEX · custodia una empresa</p>
    <ul>
      <li data-tono="favor">Pagas con tarjeta</li>
      <li data-tono="contra">Te pide el DNI</li>
    </ul>
  </div>
  <div class="prose-vs-lado prose-vs-lado--b">…</div>
</div>

<!-- Una cifra que pare el ojo -->
<div class="prose-dato">
  <span class="prose-dato-cifra">504 €</span>
  <span class="prose-dato-texto">Lo que cuesta la diferencia en 36 aportaciones.</span>
</div>

<!-- Línea temporal -->
<div class="prose-hitos">
  <div class="prose-hito">
    <span class="prose-hito-fecha">2014 · Mt. Gox</span>
    <p>Desapareció con 850.000 BTC de sus clientes.</p>
  </div>
</div>

<!-- Pasos numerados (la numeración la pone el CSS) -->
<ol class="prose-pasos">
  <li><strong>Comprueba que puedes sacar el dinero.</strong> …</li>
</ol>`}
            </pre>
          </div>
        </div>
        <div className="agi-subsection">
          <h3 className="agi-subsection-title">Callouts — para destacar un dato o aviso puntual</h3>
          <div className="agi-card agi-card--mono">
            <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
{`<div class="prose-callout prose-callout--tip">
  <span class="prose-callout-icon">✅</span>
  <div class="prose-callout-body">Texto del aviso o dato destacado.</div>
</div>`}
            </pre>
          </div>
          <div className="agi-card" style={{ marginTop: "1rem" }}>
            <p>Variantes disponibles: <code>--info</code> (💡), <code>--tip</code> (✅), <code>--warning</code> (⚠️), <code>--danger</code> (🚨) — cambiar la clase y el emoji del icono según el caso.</p>
          </div>
        </div>
      </section>

      {/* ── BLOQUE 9: SEO ── */}
      <section className="agi-section">
        <h2 className="agi-section-title">
          <span className="agi-section-num">09</span>
          SEO — lo gestiona Claude siempre
        </h2>
        <div className="agi-card">
          <p>El admin no interviene en SEO salvo que quiera dar una keyword concreta. Por defecto, Claude rellena los tres campos pensando siempre en el público objetivo (principiante/intermedio):</p>
          <ul className="agi-list">
            <li><code>seo_title</code>: <strong>máximo 48 caracteres</strong>, claro, con la keyword principal <strong>al principio</strong> y sin clickbait vacío</li>
            <li><code>meta_description</code>: <strong>máximo 160 caracteres</strong>, 1–2 frases, responde «qué me llevo si leo esto» en lenguaje simple</li>
            <li><code>focus_keyword</code>: término de búsqueda realista para alguien que no es experto (evitar jerga que un principiante no buscaría en Google)</li>
          </ul>
          <p className="agi-note">
            <strong>De dónde salen esos dos números.</strong> Google corta el título del resultado sobre los <strong>60 caracteres</strong>, y a cada título el sitio le añade solo
            {" "}<code> | AdelinBTC</code> (12 caracteres). 60 − 12 = <strong>48 propios</strong>. La descripción se corta sobre los <strong>160</strong>.
            No es teórico: en agosto de 2026 <strong>las 8 entradas publicadas salían cortadas en Google</strong> — la peor, 92 caracteres — y hubo que reescribirlas todas.
          </p>
          <p className="agi-note">
            <strong>Pasarse no es un pecadillo estético:</strong> lo que Google recorta es siempre el final, así que si la keyword va al final desaparece justo lo que hace
            que alguien haga clic. Por eso la regla es keyword delante y coletillas fuera — «y por qué importa» se repetía en cuatro entradas y no aportaba ninguna búsqueda.
          </p>
        </div>
      </section>

      {/* ── BLOQUE 10: ENLAZADO INTERNO ── */}
      <section className="agi-section">
        <h2 className="agi-section-title">
          <span className="agi-section-num">10</span>
          Enlazado interno — obligatorio, 2 a 4 por entrada
        </h2>
        <div className="agi-card">
          <p><strong>Toda entrada nueva sale con entre 2 y 4 enlaces internos.</strong> No es opcional ni se deja para después: en agosto de 2026 hubo que repasar las 8 entradas publicadas porque 7 no tenían ni uno solo.</p>
          <p>A dónde enlazar, por orden de preferencia:</p>
          <ul className="agi-list">
            <li><strong>Al diccionario</strong>, <code>/glosario/&lt;slug&gt;</code> — todos los términos con desarrollo largo tienen página propia, y son el bloque de URLs indexables más grande del sitio. Es el destino natural para la jerga que un principiante no domina: <em>staking</em>, <em>gas</em>, <em>monedero</em>, <em>exchange</em>, <em>clave privada</em>…</li>
            <li><strong>A una guía</strong>, <code>/guias/&lt;slug&gt;</code> — cuando el concepto da para mucho más que una definición</li>
            <li><strong>A otra entrada</strong>, <code>/post/&lt;slug&gt;</code> — cuando el texto ya la menciona de forma natural. Si esa otra entrada habla de esta, mejor: los enlaces en los dos sentidos valen más que uno suelto</li>
          </ul>
          <p className="agi-note">
            <strong>La regla que decide si un enlace vale:</strong> el ancla tiene que ser una palabra que <strong>ya estaba</strong> en el texto. Nunca añadas una frase para poder colocar un enlace, ni escribas «pincha aquí»
            {" "}— el texto del enlace le dice a Google de qué va el destino, así que <code>&lt;a href=&quot;/glosario/staking&quot;&gt;validadores&lt;/a&gt;</code> sirve y <em>«más información aquí»</em> no sirve de nada.
          </p>
          <p className="agi-note">
            <strong>Comprueba el destino antes de escribirlo.</strong> Un término del diccionario solo tiene URL si tiene desarrollo largo en <code>src/lib/glosario.ts</code>; si no lo tiene, la ruta devuelve <strong>404</strong>. Y una guía solo existe si está en el array <code>GUIDES</code> de <code>src/lib/guides.ts</code>.
          </p>
          <p className="agi-note">
            <strong>Nunca enlaces externos.</strong> Esto no lo cambia: la regla de siempre sigue en pie, y el enlazado interno no es una excusa para colar un enlace fuera del sitio.
          </p>
        </div>
      </section>

      {/* ── BLOQUE 11: CHECKLIST ── */}
      <section className="agi-section">
        <h2 className="agi-section-title">
          <span className="agi-section-num">11</span>
          Checklist para Claude al crear una entrada nueva
        </h2>
        <div className="agi-checklist">
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Preguntar categoría, Free/Premium e imagen de portada — <strong>antes</strong> de redactar</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Leer el artículo original (WebFetch si es link) o investigar el tema si no se puede leer</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Redactar contenido 100% reescrito, tono cercano, sin enlaces externos ni promociones</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Estructurar en subtítulos y párrafos cortos, con negrita en lo importante</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Incluir mínimo un <code>.prose-chart</code> (bloque 08)</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Colocar <strong>2–4 enlaces internos</strong> sobre palabras que ya estén en el texto (bloque 10)</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Longitud entre <strong>500 y 1500 palabras</strong>, la que pida el tema</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Redactar <code>excerpt</code>, <code>seo_title</code>, <code>meta_description</code> y <code>focus_keyword</code></span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Si la categoría no existe, crearla en Supabase antes de asignarla</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span><strong>Convertir la portada a WebP</strong> (1600 px, calidad 82) antes de subirla a Supabase Storage (bucket <code>media</code>) y usar la URL pública en <code>cover_image</code></span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Pasar <code>npm run check:contenido -- &lt;slug&gt;</code> y que salga en verde</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span><strong>Ofrecer la auditoría SEO</strong> — «¿empiezo la auditoría SEO de la entrada?» — y si el admin dice que sí, ejecutar <code>AUDITORIA-SEO.md</code> entero sobre ella. Va <strong>antes</strong> de pedir la aprobación</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Mostrar el borrador completo al admin y esperar aprobación antes de publicar</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Insertar en la tabla <code>posts</code> tras la aprobación (<code>published = true</code> salvo que se pida borrador)</span></label>
        </div>
      </section>

    </div>
  );
}
