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
              <strong>Claude construye la guía completa</strong>
              <p>Redacta el contenido, elige los componentes interactivos adecuados (quiz, flashcards, gráficas, calculadora si encaja), define secciones gratuitas vs premium, asigna dificultad y crea el badge de logro correspondiente.</p>
            </div>
          </div>
          <div className="agi-step">
            <div className="agi-step-num">3</div>
            <div>
              <strong>Admin revisa en preview</strong>
              <p>Claude muestra la guía. El admin la aprueba o solicita cambios. Sin aprobación explícita, no se implementa nada.</p>
            </div>
          </div>
          <div className="agi-step">
            <div className="agi-step-num">4</div>
            <div>
              <strong>Claude implementa</strong>
              <p>Crea el archivo en <code>/src/app/guias/[slug]/page.tsx</code>, registra la guía en Supabase (tabla <code>guides</code>) y el badge en la tabla <code>achievements</code>.</p>
            </div>
          </div>
          <div className="agi-step">
            <div className="agi-step-num">5</div>
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
          <h3 className="agi-subsection-title">Tablas en Supabase</h3>
          <div className="agi-card agi-card--mono">
            <div className="agi-table-def">
              <div className="agi-table-name">guides</div>
              <div className="agi-table-fields">
                id · title · slug · description · difficulty (basic|intermediate|advanced) · is_premium (boolean) · cover_image · published (boolean) · badge_id · created_at · updated_at
              </div>
            </div>
            <div className="agi-table-def">
              <div className="agi-table-name">guide_sections</div>
              <div className="agi-table-fields">
                id · guide_id · title · order · is_free (boolean: primeras secciones gratis)
              </div>
            </div>
            <div className="agi-table-def">
              <div className="agi-table-name">user_guide_progress</div>
              <div className="agi-table-fields">
                id · user_id · guide_id · sections_completed (array) · quiz_score (0–10) · completed_at · badge_awarded (boolean)
              </div>
            </div>
            <div className="agi-table-def">
              <div className="agi-table-name">achievements</div>
              <div className="agi-table-fields">
                id · title · description · icon · guide_id (nullable) · type (guide_completion|streak|etc.)
              </div>
            </div>
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
          Sistema de diseño — reglas estrictas
        </h2>
        <div className="agi-card">
          <p className="agi-warning">⚠️ Las guías son portales independientes pero deben ser <strong>100% fieles a la identidad visual</strong> de AdelinBTC Academy. No se introduce ningún color, tipografía ni estilo ajeno.</p>
        </div>

        <div className="agi-subsection">
          <h3 className="agi-subsection-title">Paleta — SOLO estos tres colores</h3>
          <div className="agi-palette">
            <div className="agi-swatch agi-swatch--orange">
              <span className="agi-swatch-name">Naranja</span>
              <span className="agi-swatch-var">--accent-orange</span>
              <span className="agi-swatch-hex">#ff6b2b</span>
              <span className="agi-swatch-use">CTAs, badges activos, highlights, bordes de énfasis, iconos principales</span>
            </div>
            <div className="agi-swatch agi-swatch--navy">
              <span className="agi-swatch-name">Navy</span>
              <span className="agi-swatch-var">--bg-dark / --bg-card</span>
              <span className="agi-swatch-hex">#0a1628 / #112240</span>
              <span className="agi-swatch-use">Fondos de sección, cards, contenedores. Nunca usar blanco como fondo.</span>
            </div>
            <div className="agi-swatch agi-swatch--white">
              <span className="agi-swatch-name">Blanco</span>
              <span className="agi-swatch-var">--text-primary / --text-secondary</span>
              <span className="agi-swatch-hex">#ffffff / #dce8f8</span>
              <span className="agi-swatch-use">Texto principal y secundario. Nunca texto negro sobre fondo oscuro.</span>
            </div>
          </div>
        </div>

        <div className="agi-subsection">
          <h3 className="agi-subsection-title">Layout</h3>
          <div className="agi-card">
            <ul className="agi-list">
              <li>Las guías ocupan <strong>todo el ancho disponible</strong> — son portales independientes, no artículos en columna estrecha</li>
              <li>Usar <code>max-width: 1100px; margin: 0 auto</code> para el contenido legible</li>
              <li>Las secciones de guía pueden tener fondos alternos (navy oscuro / navy medio) para separar visualmente</li>
              <li>Imagen de cabecera: opcional. Si existe, ocupa el 100% del ancho con overlay oscuro y título encima</li>
              <li>Si la guía tiene índice (guías muy largas), va en un sidebar sticky a la izquierda en desktop, colapsable en móvil</li>
            </ul>
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
            <div className="agi-comp-desc">Preguntas de opción múltiple, verdadero/falso o completar huecos. Al finalizar el quiz completo de la guía, se calcula una puntuación 0–10 que se guarda en <code>user_guide_progress.quiz_score</code> y aparece en el perfil del alumno.</div>
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
            <div className="agi-comp-desc">Barra de progreso por secciones visible en la parte superior de la guía. Cada sección completada (scrolled + tiempo mínimo de lectura) se marca. El porcentaje se guarda en <code>user_guide_progress</code>.</div>
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
            <li>Escala de <strong>0 a 10</strong>, con un decimal (ej: 7.3)</li>
            <li>Fórmula: <code>(respuestas correctas / total preguntas) × 10</code></li>
            <li>Se guarda en <code>user_guide_progress.quiz_score</code> al enviar el quiz</li>
            <li>Si el usuario repite el quiz, se guarda la puntuación más alta</li>
            <li>Visible en el <strong>dashboard del usuario</strong> en una nueva sección «Mis Guías»</li>
          </ul>
        </div>
        <div className="agi-card" style={{ marginTop: '1rem' }}>
          <h3 className="agi-subsection-title" style={{ marginTop: 0 }}>Logros (Achievements)</h3>
          <ul className="agi-list">
            <li>Cada guía tiene un badge único que se desbloquea al <strong>completar la guía al 100%</strong> (todas las secciones leídas + quiz enviado)</li>
            <li>El badge se define en la tabla <code>achievements</code> con: nombre, descripción, icono, guide_id</li>
            <li>Al desbloquearse, aparece en el perfil del usuario en la sección «Logros»</li>
            <li>Claude crea el badge (nombre + descripción + emoji de icono) al crear la guía</li>
            <li>Los logros existentes por racha de lectura de artículos son independientes y coexisten</li>
          </ul>
        </div>
      </section>

      {/* ── BLOQUE 8: INSTRUCCIONES PARA CLAUDE ── */}
      <section className="agi-section">
        <h2 className="agi-section-title">
          <span className="agi-section-num">08</span>
          Checklist para Claude al crear una guía nueva
        </h2>
        <div className="agi-checklist">
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Definir slug SEO-friendly: <code>/guias/[tema-especifico]</code></span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Establecer dificultad: Básico / Intermedio / Avanzado</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Decidir si es guía FREE o PREMIUM</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Identificar qué componentes interactivos son pertinentes para el tema</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Redactar contenido completo (no esqueletos, no placeholders)</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Crear mínimo 3 preguntas de quiz relevantes y no triviales</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Usar SOLO colores: <code>--accent-orange</code>, navy (<code>--bg-dark</code>, <code>--bg-card</code>), blanco (<code>--text-primary</code>)</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Layout full-width con <code>max-width: 1100px</code> en contenido</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Definir qué secciones son gratuitas (primeras 1–2) y cuáles tienen paywall</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Crear el badge de logro: nombre + descripción + emoji</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Mostrar preview al admin y esperar aprobación antes de implementar</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Registrar la guía en Supabase tabla <code>guides</code> tras aprobación</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Insertar badge en tabla <code>achievements</code></span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Verificar que el paywall funciona para usuarios sin sesión, free y premium</span></label>
        </div>
      </section>

      {/* ── BLOQUE 9: GESTIÓN POST-PUBLICACIÓN ── */}
      <section className="agi-section">
        <h2 className="agi-section-title">
          <span className="agi-section-num">09</span>
          Gestión post-publicación
        </h2>
        <div className="agi-card">
          <p>Las guías publicadas se gestionan desde <strong><code>/admin/guias</code></strong> (pendiente de implementar cuando se cree la primera guía). Desde ahí el admin puede:</p>
          <ul className="agi-list">
            <li>Ver listado de guías con estado (publicada / borrador)</li>
            <li>Publicar o despublicar</li>
            <li>Cambiar dificultad, tipo de acceso (free/premium) y descripción</li>
            <li>Ver estadísticas: cuántos usuarios la han completado y puntuación media</li>
            <li>Para modificar el <em>contenido</em> interactivo, se pide a Claude que edite el archivo <code>/src/app/guias/[slug]/page.tsx</code></li>
          </ul>
        </div>
      </section>

    </div>
  );
}
