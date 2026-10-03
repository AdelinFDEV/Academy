export default function GuiasInstruccionesPage() {
  return (
    <div className="admin-guide-instructions">

      <div className="agi-hero">
        <div className="agi-hero-label">SOLO ADMIN · REFERENCIA INTERNA</div>
        <h1 className="agi-hero-title">Sistema de Guías Interactivas</h1>
        <p className="agi-hero-sub">
          Instrucciones completas para construir, publicar y gestionar las guías de AdelinBTC Academy.
          Lee esto antes de crear cualquier guía nueva o si se pierde el contexto de la conversación.
        </p>
      </div>

      {/* ── BLOQUE 1: FILOSOFÍA ── */}
      <section className="agi-section">
        <h2 className="agi-section-title">
          <span className="agi-section-num">01</span>
          Filosofía y propósito
        </h2>
        <div className="agi-card">
          <p>Las guías son <strong>portales de aprendizaje independientes</strong> dentro de la web. No son artículos. Son experiencias completas: el alumno entra, aprende, interactúa, se puntúa y sale con un logro. La interactividad es <strong>primordial</strong> — sin ella, una guía no cumple su función.</p>
          <ul className="agi-list">
            <li>Temática exclusiva: <strong>criptomonedas y su ecosistema</strong> (Bitcoin, DeFi, NFTs, exchanges, wallets, trading, etc.)</li>
            <li>Cada guía es un componente React <strong>creado completamente por Claude</strong> a partir de un tema que da el admin</li>
            <li>El admin revisa la guía en HTML/preview y da luz verde antes de que se implemente</li>
            <li>Una vez publicada, la guía se puede <strong>editar desde el panel admin</strong> en la sección Guías</li>
          </ul>
        </div>
        <div className="agi-card" style={{ marginTop: "1rem" }}>
          <p className="agi-warning">⚠️ <strong>Cada guía nueva es siempre un componente React nuevo e independiente</strong> (archivo propio + CSS propio, ver bloque 03). Esto es al revés que las entradas del blog (<code>/admin/posts-instrucciones</code>), que nunca son componentes de código — son filas en Supabase. No mezclar los dos patrones. Decisión explícita del admin — detalle completo en <code>AGENTS.md</code>.</p>
        </div>
      </section>

      {/* ── BLOQUE 2: WORKFLOW ── */}
      <section className="agi-section">
        <h2 className="agi-section-title">
          <span className="agi-section-num">02</span>
          Flujo de creación — paso a paso
        </h2>
        <div className="agi-steps">
          <div className="agi-step">
            <div className="agi-step-num">1</div>
            <div>
              <strong>Admin da el tema</strong>
              <p>Ejemplo: «Crea una guía sobre qué es Bitcoin y cómo funciona la blockchain»</p>
            </div>
          </div>
          <div className="agi-step">
            <div className="agi-step-num">2</div>
            <div>
              <strong>Claude pregunta SIEMPRE: ¿guía GRATIS o PREMIUM?</strong>
              <p className="agi-warning" style={{ marginTop: 8 }}>⚠️ <strong>Paso obligatorio antes de escribir una sola línea.</strong> Claude nunca decide por su cuenta el tipo de acceso — se lo pregunta al admin. La respuesta cambia el paywall y qué usuarios pueden leer la guía completa (ver bloque 06). <strong>Gratis:</strong> el resto se desbloquea con registro gratuito. <strong>Premium:</strong> el resto solo se desbloquea con suscripción y rol premium.</p>
            </div>
          </div>
          <div className="agi-step">
            <div className="agi-step-num">3</div>
            <div>
              <strong>Claude construye la guía completa</strong>
              <p>Redacta el contenido, elige los componentes interactivos adecuados (quiz, flashcards, gráficas, calculadora si encaja), define secciones gratuitas vs premium, asigna dificultad y crea el badge de logro correspondiente.</p>
            </div>
          </div>
          <div className="agi-step">
            <div className="agi-step-num">4</div>
            <div>
              <strong>Admin revisa en preview</strong>
              <p>Claude muestra la guía. El admin la aprueba o solicita cambios. Sin aprobación explícita, no se implementa nada.</p>
            </div>
          </div>
          <div className="agi-step">
            <div className="agi-step-num">5</div>
            <div>
              <strong>Claude implementa</strong>
              <p>Crea <code>/src/app/guias/[slug]/page.tsx</code>, su <code>[slug].css</code> propio y los componentes interactivos que haga falta. Después añade la entrada de la guía en <code>src/lib/guides.ts</code> — y con eso ya está publicada. <strong>No hay que tocar Supabase</strong> (ver bloque 03).</p>
            </div>
          </div>
          <div className="agi-step">
            <div className="agi-step-num">6</div>
            <div>
              <strong>Admin publica desde el panel</strong>
              <p>La guía aparece en <code>/guias</code> y en el menú de Educación. Se puede despublicar o editar en cualquier momento desde <code>/admin/guias</code>.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── BLOQUE 3: ARQUITECTURA TÉCNICA ── */}
      <section className="agi-section">
        <h2 className="agi-section-title">
          <span className="agi-section-num">03</span>
          Arquitectura técnica
        </h2>

        <div className="agi-subsection">
          <h3 className="agi-subsection-title">URLs y rutas</h3>
          <div className="agi-card">
            <div className="agi-code-row"><span className="agi-code-path">/guias</span><span>Listado de todas las guías publicadas</span></div>
            <div className="agi-code-row"><span className="agi-code-path">/guias/[slug]</span><span>Guía individual — portal independiente</span></div>
            <div className="agi-code-row"><span className="agi-code-path">/admin/guias</span><span>Gestión de guías (editar, publicar, despublicar)</span></div>
          </div>
        </div>

        <div className="agi-subsection">
          <h3 className="agi-subsection-title">CSS — un archivo por guía, siempre</h3>
          <div className="agi-card">
            <p className="agi-warning">⚠️ Cada guía nueva lleva su propio archivo <code>src/app/guias/[slug]/[slug].css</code>, importado solo en esa guía — <strong>nunca</strong> en <code>guias.css</code> ni en <code>globals.css</code>. Regla completa y motivo en <code>AGENTS.md</code> → «Regla especial: cada guía nueva, su propio archivo CSS». Así <code>guias.css</code> se queda solo con lo que de verdad comparten todas las guías, y no vuelve a crecer sin control.</p>
          </div>
        </div>

        <div className="agi-subsection">
          <h3 className="agi-subsection-title">Dónde vive el catálogo de guías ⭐</h3>
          <div className="agi-card">
            <p className="agi-warning">⚠️ <strong>El catálogo de guías NO está en Supabase: está en el código.</strong> La fuente única de verdad es <code>src/lib/guides.ts</code> (array <code>GUIDES</code>). Publicar una guía nueva es añadir su objeto ahí — no hay que insertar ninguna fila en ninguna tabla.</p>
            <p style={{ marginTop: 12 }}>Todo lo demás se deriva solo de ese array, y por eso una guía nueva funciona entera sin tocar la base de datos:</p>
            <ul className="agi-list">
              <li><code>/guias</code> y la home leen <code>GUIDES</code> para pintar el listado y la guía destacada</li>
              <li><code>/api/guide-badge</code> valida el <code>badgeId</code> contra <code>GUIDES</code> — el badge de una guía nueva es válido automáticamente</li>
              <li><code>/api/guide-quiz-completion</code> valida el <code>slug</code> contra <code>GUIDES</code></li>
              <li><code>Badges.tsx</code> construye <code>GUIDE_BADGE_DEFS</code> desde <code>GUIDES</code>, así que el badge aparece solo en Logros</li>
            </ul>
          </div>
          <div className="agi-card agi-card--mono" style={{ marginTop: "1rem" }}>
            <div className="agi-table-def">
              <div className="agi-table-name">GuideMeta — campos de src/lib/guides.ts</div>
              <div className="agi-table-fields">
                slug · title · shortTitle · description · difficulty (básico|intermedio|avanzado) · type (free|premium) · sections · badge · badgeId · readTime · color · topics[] · tags[]
              </div>
            </div>
          </div>
          <div className="agi-card" style={{ marginTop: "1rem" }}>
            <p>⚠️ <strong>El último elemento del array es la guía destacada</strong> de la home (lo usa <code>GuidesHomeSection</code>). Añade siempre la guía nueva al final.</p>
          </div>
        </div>

        <div className="agi-subsection">
          <h3 className="agi-subsection-title">Tablas de Supabase que SÍ existen</h3>
          <div className="agi-card">
            <p>Son todas tablas de <strong>eventos por usuario</strong>, indexadas por <code>guide_slug</code> o por <code>badge_id</code>. No guardan la definición de la guía, así que <strong>no requieren registro previo</strong>: empiezan a llenarse solas en cuanto un usuario interactúa.</p>
          </div>
          <div className="agi-card agi-card--mono" style={{ marginTop: "1rem" }}>
            <div className="agi-table-def">
              <div className="agi-table-name">guide_likes · guide_saves · guide_shares</div>
              <div className="agi-table-fields">user_id · guide_slug — las escribe <code>GuideInteractions</code></div>
            </div>
            <div className="agi-table-def">
              <div className="agi-table-name">guide_visits</div>
              <div className="agi-table-fields">guide_slug — la escribe <code>GuideVisitTracker</code></div>
            </div>
            <div className="agi-table-def">
              <div className="agi-table-name">guide_quiz_completions</div>
              <div className="agi-table-fields">user_id · guide_slug · score · total — vía <code>/api/guide-quiz-completion</code></div>
            </div>
            <div className="agi-table-def">
              <div className="agi-table-name">user_badges</div>
              <div className="agi-table-fields">user_id · badge_id — vía <code>/api/guide-badge</code>. Compartida con los badges de racha y de artículos</div>
            </div>
          </div>
          <div className="agi-card" style={{ marginTop: "1rem" }}>
            <p className="agi-warning">⛔ <strong>Las tablas <code>guides</code>, <code>guide_sections</code>, <code>user_guide_progress</code> y <code>achievements</code> no existen y no se usan en ninguna parte del código.</strong> Aparecían en versiones anteriores de este manual como arquitectura prevista, pero el sistema se implementó finalmente sobre <code>src/lib/guides.ts</code>. Si lees esas tablas en algún sitio, está desactualizado.</p>
          </div>
        </div>

        <div className="agi-subsection">
          <h3 className="agi-subsection-title">Librerías de componentes visuales</h3>
          <div className="agi-card">
            <div className="agi-lib-row"><span className="agi-lib-name">Recharts</span><span>Gráficas principales (línea, barras, área). Animadas, responsivas.</span></div>
            <div className="agi-lib-row"><span className="agi-lib-name">Framer Motion</span><span>Animaciones de entrada al hacer scroll, transiciones de sección.</span></div>
            <div className="agi-lib-row"><span className="agi-lib-name">Lucide React</span><span>Ya instalado. Iconografía de guías.</span></div>
            <div className="agi-lib-row"><span className="agi-lib-name">@dnd-kit/core</span><span>Drag and drop simple cuando sea aplicable.</span></div>
          </div>
        </div>
      </section>

      {/* ── BLOQUE 4: DISEÑO ── */}
      <section className="agi-section">
        <h2 className="agi-section-title">
          <span className="agi-section-num">04</span>
          Sistema de diseño — identidad visual de guías
        </h2>
        <div className="agi-card">
          <p className="agi-warning">⚠️ Las guías tienen su propia identidad premium dentro de la web — <strong>oro + naranja + navy + blanco</strong>. El oro es el color dominante de las guías. El naranja aparece en puntos de acción e interacción. Nunca se mezclan con otros colores.</p>
        </div>

        <div className="agi-subsection">
          <h3 className="agi-subsection-title">Paleta completa de guías — 4 colores, cada uno con su rol</h3>
          <div className="agi-palette agi-palette--4col">
            <div className="agi-swatch agi-swatch--gold">
              <span className="agi-swatch-name">Oro</span>
              <span className="agi-swatch-var">--gold</span>
              <span className="agi-swatch-hex">#e6b455</span>
              <span className="agi-swatch-use">Color DOMINANTE de guías. Títulos en gradiente, eyebrows, CTAs principales, borders de cards, stats, badges de acceso premium, pills de características, sección titles. Es lo que hace que las guías se vean como un portal premium diferenciado.</span>
            </div>
            <div className="agi-swatch agi-swatch--orange">
              <span className="agi-swatch-name">Naranja</span>
              <span className="agi-swatch-var">--accent-orange</span>
              <span className="agi-swatch-hex">#ff6b2b</span>
              <span className="agi-swatch-use">Color de ACCIÓN e INTERACCIÓN. Botones de quiz (enviar, siguiente), respuesta seleccionada en flashcards, progreso de barra de sección, iconos de componentes interactivos, hover states dentro del contenido de la guía.</span>
            </div>
            <div className="agi-swatch agi-swatch--navy">
              <span className="agi-swatch-name">Navy</span>
              <span className="agi-swatch-var">--bg-dark / #060f1f</span>
              <span className="agi-swatch-hex">#0a1628 / #060f1f</span>
              <span className="agi-swatch-use">Fondos de página, cards y secciones. Usar gradientes entre #060f1f → #0a1628 → #0c1a2e para dar profundidad. El hero de /guias usa el fondo más oscuro (#060f1f) para máximo contraste con el oro.</span>
            </div>
            <div className="agi-swatch agi-swatch--white">
              <span className="agi-swatch-name">Blanco</span>
              <span className="agi-swatch-var">--text-primary / --text-secondary</span>
              <span className="agi-swatch-hex">#ffffff / #dce8f8</span>
              <span className="agi-swatch-use">Títulos y cuerpo de texto. El texto secundario (#dce8f8) para descripciones y párrafos de contenido de guía. Nunca negro, nunca gris neutro sobre fondo navy.</span>
            </div>
          </div>
        </div>

        <div className="agi-subsection">
          <h3 className="agi-subsection-title">Variables CSS disponibles para guías</h3>
          <div className="agi-card agi-card--mono">
            <div className="agi-table-def">
              <div className="agi-table-name">Oro</div>
              <div className="agi-table-fields">
                --gold: #e6b455 &nbsp;·&nbsp; --gold-soft: rgba(230,180,85,0.18) &nbsp;·&nbsp; --gold-glow: rgba(230,180,85,0.08) &nbsp;·&nbsp; --gold-border: rgba(230,180,85,0.25)
              </div>
            </div>
            <div className="agi-table-def">
              <div className="agi-table-name">Naranja (ya existía en la web)</div>
              <div className="agi-table-fields">
                --accent-orange: #ff6b2b &nbsp;·&nbsp; --accent-orange-soft: #ff8552 &nbsp;·&nbsp; --accent-orange-glow: rgba(255,107,43,0.15)
              </div>
            </div>
            <div className="agi-table-def">
              <div className="agi-table-name">Fondos</div>
              <div className="agi-table-fields">
                --bg-dark: #0a1628 &nbsp;·&nbsp; --bg-card: #112240 &nbsp;·&nbsp; fondo hero: #060f1f
              </div>
            </div>
          </div>
        </div>

        <div className="agi-subsection">
          <h3 className="agi-subsection-title">Estructura visual aprobada — replicar en cada guía</h3>
          <div className="agi-card">
            <p>Este es el sistema visual validado por el admin. Toda guía nueva debe seguir esta estructura:</p>
            <ul className="agi-list">
              <li><strong>Hero de guía:</strong> fondo <code>#060f1f → #0a1628</code>, glow dorado central radial, eyebrow en oro, título grande con última línea en gradiente oro, pills de características con fondo <code>gold-soft</code> y borde <code>gold-border</code></li>
              <li><strong>Cards de contenido:</strong> gradiente <code>#0f2040 → #0a1628</code>, borde <code>gold-border</code>, glow dorado en esquina superior derecha, border-radius 18–20px</li>
              <li><strong>CTA principal (empezar guía):</strong> gradiente <code>var(--gold) → #f5c842</code>, texto navy oscuro, font-weight 800</li>
              <li><strong>CTAs secundarios / interacciones (quiz, flashcards):</strong> color naranja <code>var(--accent-orange)</code></li>
              <li><strong>Separadores de sección:</strong> <code>border-top: 1px solid var(--gold-border)</code></li>
              <li><strong>Stats destacados:</strong> número grande en oro, label en text-muted, fondo gold-soft</li>
              <li><strong>Sección titles dentro de guía:</strong> texto en oro, uppercase, letter-spacing</li>
              <li><strong>Topics/pills informativos:</strong> fondo <code>rgba(255,255,255,0.04)</code>, borde <code>rgba(255,255,255,0.08)</code>, texto muted — para diferenciarlos de las pills de características</li>
            </ul>
          </div>
        </div>

        <div className="agi-subsection">
          <h3 className="agi-subsection-title">Layout</h3>
          <div className="agi-card">
            <ul className="agi-list">
              <li>Las guías ocupan <strong>todo el ancho disponible</strong> — portales independientes, no artículos en columna estrecha</li>
              <li>Contenido: <code>max-width: 1100px; margin: 0 auto</code></li>
              <li>Secciones alternas: fondos <code>#060f1f</code> y <code>#0a1628</code> para separar sin usar colores ajenos</li>
              <li>Imagen de cabecera: opcional. Full-width con overlay oscuro y título encima</li>
              <li>Índice (guías largas): sidebar sticky a izquierda en desktop, colapsable en móvil</li>
            </ul>
          </div>
        </div>

        <div className="agi-subsection">
          <h3 className="agi-subsection-title">Cierre obligatorio — toda guía termina igual</h3>
          <div className="agi-card">
            <p>
              Las tres últimas piezas de <code>src/app/guias/[slug]/page.tsx</code> son <strong>fijas y no negociables</strong>, siempre en este orden.
              Una guía sin ellas está incompleta:
            </p>
            <ul className="agi-list">
              <li><strong>1. Guías relacionadas</strong> — <code>&lt;GuiasRelacionadas slug={"{"}SLUG{"}"} /&gt;</code>, <strong>fuera del muro de registro</strong>: Googlebot entra sin sesión, y es el único enlace que reciben unas guías de otras</li>
              <li><strong>2. Interacciones</strong> — <code>&lt;GuideInteractions /&gt;</code> dentro de <code>section.gbc-section.gbc-interactions-section</code> (me gusta, guardar, compartir)</li>
              <li><strong>3. Footer</strong> — <code>&lt;Footer /&gt;</code></li>
            </ul>
            <div className="agi-card agi-card--mono">
              {`<GuiasRelacionadas slug={SLUG} />`}<br />
              <br />
              {`{/* ── Interacciones ── */}`}<br />
              {`<section className="gbc-section gbc-interactions-section">`}<br />
              {`  ...<GuideInteractions ... />`}<br />
              {`</section>`}<br />
              <br />
              {`<Footer />`}
            </div>
            <p>
              <strong>Antes de la asesoría eran otras tres.</strong> Entre las interacciones y el footer iba la banda de asesoría 1:1, que se retiró de toda la web
              el 4 de septiembre de 2026. El 3 de octubre se confirmó que la asesoría no vuelve. No la añadas a
              ninguna guía.
            </p>
          </div>
        </div>

        <div className="agi-subsection">
          <h3 className="agi-subsection-title">Dificultad — badge visual</h3>
          <div className="agi-card">
            <div className="agi-diff-row">
              <span className="agi-diff-badge agi-diff--basic">Básico</span>
              <span>Verde suave — primera vez que el usuario toca el tema</span>
            </div>
            <div className="agi-diff-row">
              <span className="agi-diff-badge agi-diff--intermediate">Intermedio</span>
              <span>Naranja — requiere haber leído guías básicas o tener noción del tema</span>
            </div>
            <div className="agi-diff-row">
              <span className="agi-diff-badge agi-diff--advanced">Avanzado</span>
              <span>Rojo suave — conceptos técnicos profundos</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── BLOQUE 5: COMPONENTES INTERACTIVOS ── */}
      <section className="agi-section">
        <h2 className="agi-section-title">
          <span className="agi-section-num">05</span>
          Inventario de componentes interactivos
        </h2>
        <p className="agi-section-intro">Claude elige qué componentes incluir según el tema. No se fuerza ningún componente — cada uno debe tener sentido pedagógico en la guía.</p>

        <div className="agi-components-grid">

          <div className="agi-comp-card">
            <div className="agi-comp-icon">📊</div>
            <div className="agi-comp-name">QuizBlock</div>
            <div className="agi-comp-desc">Preguntas de opción múltiple, verdadero/falso o completar huecos. Al enviarlo se guarda <code>score</code> / <code>total</code> en <code>guide_quiz_completions</code>, y si se acierta entero se desbloquea el badge de la guía.</div>
            <div className="agi-comp-rule">⚡ Obligatorio en toda guía. Al menos 3 preguntas por guía.</div>
          </div>

          <div className="agi-comp-card">
            <div className="agi-comp-icon">🃏</div>
            <div className="agi-comp-name">FlashcardDeck</div>
            <div className="agi-comp-desc">Tarjetas con concepto en el anverso y definición en el reverso. Se voltean con clic o swipe. Ideales para glosario de términos clave de la guía.</div>
            <div className="agi-comp-rule">Usar cuando la guía introduce 4+ términos nuevos.</div>
          </div>

          <div className="agi-comp-card">
            <div className="agi-comp-icon">📈</div>
            <div className="agi-comp-name">ChartBlock</div>
            <div className="agi-comp-desc">Gráficas con Recharts: línea (precio histórico), barras (comparativas), área (dominancia de mercado). Animadas al entrar en viewport. Si hay datos reales disponibles por API, se usan; si no, datos de ejemplo representativos con nota «Datos orientativos».</div>
            <div className="agi-comp-rule">Animar siempre. Nunca mostrar gráfica estática.</div>
          </div>

          <div className="agi-comp-card">
            <div className="agi-comp-icon">🧮</div>
            <div className="agi-comp-name">CalculatorBlock</div>
            <div className="agi-comp-desc">Calculadoras interactivas solo cuando añaden valor real: ROI de inversión, coste de minería, equivalencia entre satoshis y euros, etc. El usuario introduce valores y ve el resultado en tiempo real.</div>
            <div className="agi-comp-rule">Solo incluir si la calculadora es pedagógicamente relevante para el tema.</div>
          </div>

          <div className="agi-comp-card">
            <div className="agi-comp-icon">🎯</div>
            <div className="agi-comp-name">DragDropBlock</div>
            <div className="agi-comp-desc">Ejercicio de arrastrar y soltar: ordenar pasos de un proceso, emparejar conceptos con definiciones, clasificar elementos. Simple, sin complejidad visual innecesaria. Usando @dnd-kit.</div>
            <div className="agi-comp-rule">Máximo un DragDrop por guía. Solo si el contenido lo justifica.</div>
          </div>

          <div className="agi-comp-card">
            <div className="agi-comp-icon">📏</div>
            <div className="agi-comp-name">ProgressTracker</div>
            <div className="agi-comp-desc">Componente <code>GuideProgressBar</code>: barra de progreso de lectura en la parte superior, ligada al scroll. Es <strong>puramente visual y no persiste nada</strong>. Quien sí registra la visita es <code>GuideVisitTracker</code>, que escribe en <code>guide_visits</code>.</div>
            <div className="agi-comp-rule">Obligatorio en toda guía de más de 2 secciones.</div>
          </div>

        </div>
      </section>

      {/* ── BLOQUE 6: ACCESO Y PAYWALL ── */}
      <section className="agi-section">
        <h2 className="agi-section-title">
          <span className="agi-section-num">06</span>
          Sistema de acceso y paywall
        </h2>
        <div className="agi-access-grid">
          <div className="agi-access-card">
            <div className="agi-access-type">Guía FREE</div>
            <ul className="agi-list">
              <li>Primeras 1–2 secciones visibles para cualquier visitante (sin sesión)</li>
              <li>Para continuar: el usuario debe <strong>registrarse gratis</strong></li>
              <li>Paywall muestra CTA «Crea tu cuenta gratis para continuar»</li>
              <li>Una vez registrado, acceso completo a toda la guía</li>
            </ul>
          </div>
          <div className="agi-access-card agi-access-card--premium">
            <div className="agi-access-type">Guía PREMIUM</div>
            <ul className="agi-list">
              <li>Primeras 1–2 secciones visibles para cualquier visitante (sin sesión)</li>
              <li>Usuarios registrados (free) ven el paywall premium</li>
              <li>Para continuar: el usuario debe ser <strong>miembro Premium</strong></li>
              <li>Paywall muestra CTA «Hazte Premium para desbloquear»</li>
            </ul>
          </div>
        </div>
        <div className="agi-card" style={{ marginTop: '1rem' }}>
          <p><strong>Regla siempre activa:</strong> el primer bloque de texto de la primera sección siempre es visible, independientemente del tipo de guía. El paywall corta <em>después</em> de dar al usuario un vistazo real del contenido.</p>
        </div>
      </section>

      {/* ── BLOQUE 7: PUNTUACIÓN Y LOGROS ── */}
      <section className="agi-section">
        <h2 className="agi-section-title">
          <span className="agi-section-num">07</span>
          Puntuación y sistema de logros
        </h2>
        <div className="agi-card">
          <h3 className="agi-subsection-title" style={{ marginTop: 0 }}>Puntuación del quiz</h3>
          <ul className="agi-list">
            <li>Se registra como <code>score</code> sobre <code>total</code> (ej: 4 de 5) al enviar el quiz</li>
            <li>Se guarda en la tabla <code>guide_quiz_completions</code> vía <code>/api/guide-quiz-completion</code></li>
            <li>El endpoint valida el <code>guide_slug</code> contra <code>GUIDES</code>: si la guía no está en <code>src/lib/guides.ts</code>, devuelve 400 y no guarda nada</li>
            <li>Requiere sesión: sin usuario logueado responde 401</li>
          </ul>
        </div>
        <div className="agi-card" style={{ marginTop: '1rem' }}>
          <h3 className="agi-subsection-title" style={{ marginTop: 0 }}>Logros (Achievements)</h3>
          <ul className="agi-list">
            <li>Cada guía tiene un badge único que se desbloquea al <strong>acertar el quiz entero</strong> (todas las respuestas correctas)</li>
            <li>El badge se define <strong>en el código</strong>, con los campos <code>badge</code> (nombre) y <code>badgeId</code> del objeto de la guía en <code>src/lib/guides.ts</code> — no hay tabla de definiciones</li>
            <li><code>Badges.tsx</code> deriva <code>GUIDE_BADGE_DEFS</code> de <code>GUIDES</code>, así que el badge aparece en Logros automáticamente sin tocar ese archivo</li>
            <li>El desbloqueo se persiste en <code>user_badges</code> vía <code>/api/guide-badge</code>, que valida el <code>badgeId</code> contra <code>GUIDES</code></li>
            <li>El quiz llama a <code>saveGuideBadge(badgeId)</code> de <code>src/lib/guideBadge.ts</code>, que además dispara el popup de desbloqueo</li>
            <li>Convención de <code>badgeId</code>: <code>guide-[tema]</code> (ej. <code>guide-fiscalidad-cripto</code>)</li>
            <li>Los logros por racha de lectura de artículos son independientes y coexisten en la misma tabla</li>
          </ul>
        </div>
      </section>

      {/* ── BLOQUE 8: SEO DE UNA GUÍA ── */}
      <section className="agi-section">
        <h2 className="agi-section-title">
          <span className="agi-section-num">08</span>
          SEO — las cuatro cosas que hay que poner a mano
        </h2>
        <div className="agi-card">
          <p>Una guía es un <strong>componente propio</strong>, no una plantilla rellenada. Eso significa que nada de lo que hace el sitio por ti con una entrada ocurre aquí solo: <strong>cada guía tiene que traer su SEO puesto a mano</strong>.</p>
          <p className="agi-note">
            <strong>Olvidarlo no rompe nada visible.</strong> La guía se ve perfecta en el navegador y el fallo solo se nota semanas después, al mirar por qué no aparece en Google. Por eso <code>npm run check</code> comprueba las tres primeras y <strong>cancela el push</strong> si falta alguna.
          </p>
        </div>

        <div className="agi-subsection">
          <h3 className="agi-subsection-title">1 · La canónica, en su <code>metadata</code></h3>
          <div className="agi-card agi-card--mono">
            <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
{`export const metadata: Metadata = {
  alternates: { canonical: "/guias/tu-slug" },
  title: "…",
  description: "…",
};`}
            </pre>
          </div>
          <div className="agi-card" style={{ marginTop: "1rem" }}>
            <p><strong>Siempre en ruta relativa</strong>, nunca la URL entera: la resuelve el <code>metadataBase</code> del layout raíz. Y <strong>jamás en un <code>layout.tsx</code></strong> — en Next los metadatos del layout los heredan todas las rutas hijas, así que una canónica ahí le pondría la misma URL a media web.</p>
          </div>
        </div>

        <div className="agi-subsection">
          <h3 className="agi-subsection-title">2 · El JSON-LD: el muro y las migas de pan</h3>
          <div className="agi-card agi-card--mono">
            <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
{`import GuideBreadcrumbJsonLd from "@/components/GuideBreadcrumbJsonLd";

// Dentro del return, junto al <GuideVisitTracker>:
<GuideBreadcrumbJsonLd slug={SLUG} />`}
            </pre>
          </div>
          <div className="agi-card" style={{ marginTop: "1rem" }}>
            <p>Emite dos cosas: el <code>Article</code> de la guía, con <code>isAccessibleForFree</code> según el campo <code>muro</code> de <code>GUIDES</code> (<code>"registro"</code>, <code>"premium"</code> o <code>null</code> si se lee entera sin cuenta), y las migas. <strong>Rellena <code>muro</code> con la verdad</strong>: es lo que le dice a Google que la guía está cerrada a propósito y no es corta.</p>
            <p>El nombre que sale en las migas lo saca de <code>GUIDES</code>, no del <code>title</code> de la metadata — que es más corto a propósito. Es intencionado: el de <code>GUIDES</code> es el que se ve en <code>/guias</code>, y el dato estructurado <strong>tiene que coincidir con lo visible</strong> o Google lo trata como spam.</p>
          </div>
        </div>

        <div className="agi-subsection">
          <h3 className="agi-subsection-title">3 · El alta en <code>GUIDES</code></h3>
          <div className="agi-card">
            <p>Añadir la guía al array <code>GUIDES</code> de <code>src/lib/guides.ts</code>. <strong>El sitemap recorre ese array, no la carpeta <code>src/app/guias/</code></strong>: una guía con su <code>page.tsx</code> pero sin su entrada ahí <strong>es invisible para Google</strong>, y además no aparece en el listado.</p>
          </div>
        </div>

        <div className="agi-subsection">
          <h3 className="agi-subsection-title">4 · Los límites de título y descripción</h3>
          <div className="agi-card">
            <p>El layout raíz añade <code> | AdelinBTC</code> (12 caracteres) a cada título. Google corta sobre los 60, así que al título propio le quedan <strong>48</strong>. La descripción, <strong>160</strong>.</p>
            <p style={{ marginTop: "0.6rem" }}>Los del <code>openGraph</code> quedan fuera de ese límite a propósito: no llevan sufijo y las redes no cortan tan pronto. Pueden ser más largos y descriptivos.</p>
            <p className="agi-note">
              <strong>La palabra clave, delante.</strong> Lo que Google recorta es el final, así que una keyword al final desaparece justo cuando más falta hace. En agosto de 2026 hubo que reescribir los títulos de las 7 guías: el de fiscalidad llegaba a <strong>101 caracteres</strong>.
            </p>
          </div>
        </div>

        <div className="agi-subsection">
          <h3 className="agi-subsection-title">Enlaces dentro de la guía</h3>
          <div className="agi-card">
            <p>Enlaza al <strong>diccionario</strong> (<code>/glosario/&lt;slug&gt;</code>) la jerga que un principiante no domina, y a otras guías o entradas cuando el texto ya las menciona. <strong>El ancla tiene que ser una palabra que ya estaba escrita</strong> — nunca se añade una frase para colocar un enlace, ni se escribe «pincha aquí».</p>
            <p style={{ marginTop: "0.6rem" }}>Comprueba el destino antes: un término del diccionario <strong>sin <code>extended</code> devuelve 404</strong>, y una guía que no esté en <code>GUIDES</code> tampoco existe. Y nunca enlaces externos.</p>
          </div>
        </div>
      </section>

      {/* ── BLOQUE 9: INSTRUCCIONES PARA CLAUDE ── */}
      <section className="agi-section">
        <h2 className="agi-section-title">
          <span className="agi-section-num">09</span>
          Checklist para Claude al crear una guía nueva
        </h2>
        <div className="agi-checklist">
          <label className="agi-check-item"><input type="checkbox" readOnly /><span><strong>ANTES DE NADA: preguntar al admin si la guía es GRATIS o PREMIUM</strong> — nunca asumirlo</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Definir slug SEO-friendly: <code>/guias/[tema-especifico]</code></span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Establecer dificultad: Básico / Intermedio / Avanzado</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Aplicar el paywall correcto según la respuesta free/premium del admin (ver bloque 06)</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Identificar qué componentes interactivos son pertinentes para el tema</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Crear <code>src/app/guias/[slug]/[slug].css</code> propio — nunca añadir a <code>guias.css</code> ni a <code>globals.css</code></span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Redactar contenido completo (no esqueletos, no placeholders)</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Crear mínimo 3 preguntas de quiz relevantes y no triviales</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Usar SOLO colores: <code>--accent-orange</code>, navy (<code>--bg-dark</code>, <code>--bg-card</code>), blanco (<code>--text-primary</code>)</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Layout full-width con <code>max-width: 1100px</code> en contenido</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Definir qué secciones son gratuitas (primeras 1–2) y cuáles tienen paywall</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Crear el badge de logro: nombre + descripción + emoji</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span><strong>Cerrar la guía con el bloque obligatorio</strong>: <code>&lt;GuiasRelacionadas /&gt;</code> → interacciones → <code>&lt;Footer /&gt;</code> (ver bloque 04)</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Mostrar preview al admin y esperar aprobación antes de implementar</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span><strong>Añadir <code>alternates: {"{"} canonical: &quot;/guias/[slug]&quot; {"}"}</code></strong> a su <code>metadata</code> (bloque 08)</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span><strong>Añadir <code>&lt;GuideBreadcrumbJsonLd slug={"{"}SLUG{"}"} /&gt;</code></strong> dentro del <code>return</code> (bloque 08)</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span><code>title</code> de <strong>48 caracteres o menos</strong> y <code>description</code> de 160 o menos, con la keyword delante (bloque 08)</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span><strong>Añadir la entrada de la guía al final del array <code>GUIDES</code> en <code>src/lib/guides.ts</code></strong> — es lo único que hace falta para publicarla. <strong>Supabase no se toca</strong></span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Comprobar que <code>badgeId</code> sigue la convención <code>guide-[tema]</code> y que el <code>badge</code> tiene nombre</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Verificar que el paywall funciona para usuarios sin sesión, free y premium</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Pasar <code>npm run check &amp;&amp; npx tsc --noEmit</code> — el <code>check</code> verifica la canónica, las migas y el alta en <code>GUIDES</code> — y comprobar la guía en el navegador antes de dar por cerrada</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span><strong>Ofrecer la auditoría SEO</strong> — «¿empiezo la auditoría SEO de la guía?» — y si el admin dice que sí, ejecutar <code>AUDITORIA-SEO.md</code> entero sobre ella. Ojo en las guías: lo que Google ve es <strong>solo lo renderizado en el servidor</strong>, no lo que vive dentro de los componentes interactivos</span></label>
        </div>
      </section>

      {/* ── BLOQUE 10: GESTIÓN POST-PUBLICACIÓN ── */}
      <section className="agi-section">
        <h2 className="agi-section-title">
          <span className="agi-section-num">10</span>
          Gestión post-publicación
        </h2>
        <div className="agi-card">
          <p className="agi-warning">⚠️ <strong>El panel <code>/admin/guias</code> no existe.</strong> Se planteó en su día, pero el sistema acabó siendo enteramente de código, así que hoy las guías se gestionan editando archivos — no desde una interfaz.</p>
        </div>
        <div className="agi-card" style={{ marginTop: "1rem" }}>
          <p>Qué se toca para cada cambio:</p>
          <ul className="agi-list">
            <li><strong>Título, descripción, dificultad, tiempo de lectura, topics o tags</strong> → el objeto de esa guía en <code>src/lib/guides.ts</code></li>
            <li><strong>Cambiar de gratis a premium o al revés</strong> → el campo <code>type</code> en <code>src/lib/guides.ts</code> <em>y</em> la condición del paywall en el <code>page.tsx</code> de la guía (<code>!isPremium</code> para premium, <code>!isRegistered</code> para gratis)</li>
            <li><strong>Despublicar</strong> → quitar su entrada de <code>GUIDES</code>. La ruta <code>/guias/[slug]</code> seguirá existiendo y accesible por URL directa; para cortarla del todo hay que borrar o proteger la carpeta</li>
            <li><strong>Contenido, secciones o componentes interactivos</strong> → pedir a Claude que edite <code>/src/app/guias/[slug]/page.tsx</code> y sus componentes</li>
            <li><strong>Estilos de esa guía</strong> → su <code>[slug].css</code>, nunca <code>guias.css</code> ni <code>globals.css</code></li>
          </ul>
        </div>
        <div className="agi-card" style={{ marginTop: "1rem" }}>
          <p>Las <strong>estadísticas de uso</strong> sí están en Supabase y se pueden consultar por <code>guide_slug</code>: <code>guide_visits</code> (visitas), <code>guide_likes</code>, <code>guide_saves</code>, <code>guide_shares</code> y <code>guide_quiz_completions</code> (puntuaciones del quiz).</p>
        </div>
      </section>

    </div>
  );
}
