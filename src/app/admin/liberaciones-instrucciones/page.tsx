export default function LiberacionesInstruccionesPage() {
  return (
    <div className="admin-guide-instructions">

      <div className="agi-hero">
        <div className="agi-hero-label">SOLO ADMIN · REFERENCIA INTERNA</div>
        <h1 className="agi-hero-title">Sistema de Liberaciones de Tokens</h1>
        <p className="agi-hero-sub">
          Instrucciones para Claude sobre cómo investigar, añadir y mantener tokens en la herramienta de vesting. Leer antes de incorporar cualquier token nuevo.
        </p>
      </div>

      {/* ── BLOQUE 1: FILOSOFÍA ── */}
      <section className="agi-section">
        <h2 className="agi-section-title">
          <span className="agi-section-num">01</span>
          Propósito de la herramienta
        </h2>
        <div className="agi-card">
          <p>La herramienta de <strong>Liberaciones de Tokens</strong> es una ventaja informacional para los usuarios premium. En cripto, los calendarios de vesting son información crítica — un unlock masivo puede impactar el precio días antes de que ocurra. Esta herramienta permite <strong>anticipar la presión vendedora</strong> token por token.</p>
          <ul className="agi-list">
            <li>Datos investigados manualmente por Claude desde whitepapers, docs oficiales y fuentes on-chain</li>
            <li>No depende de APIs externas — los datos viven en el archivo <code>tokenData.ts</code></li>
            <li>Actualización manual mensual o cuando hay cambios de governance que afecten el vesting</li>
            <li>Acceso: 2 tokens gratis (ARB, ZK), el resto premium</li>
          </ul>
        </div>
      </section>

      {/* ── BLOQUE 2: ARQUITECTURA ── */}
      <section className="agi-section">
        <h2 className="agi-section-title">
          <span className="agi-section-num">02</span>
          Arquitectura técnica
        </h2>
        <div className="agi-subsection">
          <h3 className="agi-subsection-title">Archivos clave</h3>
          <div className="agi-card agi-card--mono">
            <div className="agi-code-row">
              <span className="agi-code-path">src/app/herramientas/liberaciones/tokenData.ts</span>
              <span>Archivo central con TODOS los datos de tokens. Claude edita aquí.</span>
            </div>
            <div className="agi-code-row">
              <span className="agi-code-path">src/app/herramientas/liberaciones/page.tsx</span>
              <span>Página principal — listado de todos los tokens con próximo unlock.</span>
            </div>
            <div className="agi-code-row">
              <span className="agi-code-path">src/app/herramientas/liberaciones/LiberacionesClient.tsx</span>
              <span>Componente client de la página principal. Filtros y tabla.</span>
            </div>
            <div className="agi-code-row">
              <span className="agi-code-path">src/app/herramientas/liberaciones/[token]/page.tsx</span>
              <span>Página individual de cada token — gráficas, timeline, impacto.</span>
            </div>
            <div className="agi-code-row">
              <span className="agi-code-path">src/app/herramientas/liberaciones/[token]/TokenDetailClient.tsx</span>
              <span>Componente client del detalle de token. Recharts PieChart + BarChart.</span>
            </div>
          </div>
        </div>

        <div className="agi-subsection">
          <h3 className="agi-subsection-title">Estructura de datos — Token</h3>
          <div className="agi-card agi-card--mono">
            <div className="agi-table-def">
              <div className="agi-table-name">Token</div>
              <div className="agi-table-fields">
                id (slug URL) · symbol · name · color (hex) · bgGradient · totalSupply · tge (YYYY-MM-DD) · vestingEnd · category · description · keyRisk · allocations[] · schedules[] · isPremium
              </div>
            </div>
            <div className="agi-table-def">
              <div className="agi-table-name">TokenAllocation</div>
              <div className="agi-table-fields">
                name · pct (% del supply) · tokens (número absoluto) · color · schedule (texto descriptivo) · isActive (boolean — si sigue vesting)
              </div>
            </div>
            <div className="agi-table-def">
              <div className="agi-table-name">VestingSchedule</div>
              <div className="agi-table-fields">
                category · color · monthlyTokens (tokens/mes en lineal) · startDate · endDate · cliffDate? · cliffTokens?
              </div>
            </div>
          </div>
        </div>

        <div className="agi-subsection">
          <h3 className="agi-subsection-title">Lógica de eventos (auto-computada)</h3>
          <div className="agi-card">
            <p>Claude <strong>NO necesita listar cada evento mensual</strong>. La función <code>getUpcomingUnlocks(token, fromDate, months)</code> genera automáticamente los eventos recorriendo cada <code>VestingSchedule</code> mes a mes. Solo hay que definir correctamente el <code>startDate</code>, <code>endDate</code> y <code>monthlyTokens</code> de cada tranche.</p>
          </div>
        </div>
      </section>

      {/* ── BLOQUE 3: PROCESO DE INVESTIGACIÓN ── */}
      <section className="agi-section">
        <h2 className="agi-section-title">
          <span className="agi-section-num">03</span>
          Cómo investigar un token nuevo
        </h2>
        <div className="agi-steps">
          <div className="agi-step">
            <div className="agi-step-num">1</div>
            <div>
              <strong>Localizar el whitepaper / tokenomics oficial</strong>
              <p>Buscar en la web oficial del proyecto → sección «Tokenomics» o «Token Distribution». Alternativamente: blog oficial, Mirror.xyz o el documento de lanzamiento.</p>
            </div>
          </div>
          <div className="agi-step">
            <div className="agi-step-num">2</div>
            <div>
              <strong>Identificar los tramos de vesting</strong>
              <p>Extraer: (a) qué grupos reciben tokens, (b) qué porcentaje del supply total, (c) si hay cliff y cuánto dura, (d) cuánto tiempo dura el vesting lineal post-cliff.</p>
            </div>
          </div>
          <div className="agi-step">
            <div className="agi-step-num">3</div>
            <div>
              <strong>Calcular el monthlyTokens</strong>
              <p>Fórmula: <code>monthlyTokens = totalTokensEnTranche / mesesDeVesting</code>. Ejemplo: 2,694M ARB / 48 meses = 56,125,000/mes.</p>
            </div>
          </div>
          <div className="agi-step">
            <div className="agi-step-num">4</div>
            <div>
              <strong>Verificar con fuentes secundarias</strong>
              <p>Contrastar con TokenUnlocks.app, Vestlab.io o CryptoRank para confirmar fechas y cantidades. Si hay discrepancias, usar la fuente oficial del proyecto.</p>
            </div>
          </div>
          <div className="agi-step">
            <div className="agi-step-num">5</div>
            <div>
              <strong>Redactar keyRisk</strong>
              <p>Una frase concisa sobre el riesgo principal de presión vendedora para este token: quién libera, cuánto y con qué frecuencia.</p>
            </div>
          </div>
          <div className="agi-step">
            <div className="agi-step-num">6</div>
            <div>
              <strong>Añadir a tokenData.ts y actualizar FREE_TOKEN_IDS si aplica</strong>
              <p>Insertar el nuevo token en el array <code>TOKENS</code>. Por defecto <code>isPremium: true</code>. Solo añadir a <code>FREE_TOKEN_IDS</code> si el admin indica explícitamente que sea gratis.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── BLOQUE 4: REGLAS DE DATOS ── */}
      <section className="agi-section">
        <h2 className="agi-section-title">
          <span className="agi-section-num">04</span>
          Reglas de calidad de datos
        </h2>
        <div className="agi-card">
          <ul className="agi-list">
            <li><strong>Fechas absolutas:</strong> Siempre en formato <code>YYYY-MM-DD</code>. Nunca fechas relativas.</li>
            <li><strong>Tokens en número absoluto:</strong> El campo <code>monthlyTokens</code> es el número real de tokens (no en millones).</li>
            <li><strong>TGE preciso:</strong> Usar la fecha exacta del TGE, no aproximada. El cliff se calcula desde el TGE.</li>
            <li><strong>Colores coherentes:</strong> El color del token debe ser el color de marca oficial. El bgGradient usa ese color en versión oscura + navy.</li>
            <li><strong>Fuente siempre oficial:</strong> Si no hay datos públicos confirmados, NO añadir el campo. Mejor omitir que inventar.</li>
            <li><strong>isActive en allocations:</strong> Marcar <code>false</code> solo cuando ese tranche está completamente desbloqueado.</li>
            <li><strong>Actualización mensual:</strong> Revisar si algún token ha completado su vesting o si hay cambios de governance. Actualizar <code>vestingEnd</code> si aplica.</li>
          </ul>
        </div>
      </section>

      {/* ── BLOQUE 5: TOKENS ACTUALES ── */}
      <section className="agi-section">
        <h2 className="agi-section-title">
          <span className="agi-section-num">05</span>
          Tokens implementados y estado
        </h2>
        <div className="agi-card agi-card--mono">
          <div className="agi-table-def">
            <div className="agi-table-name">ARB · Arbitrum · Layer 2 · GRATIS</div>
            <div className="agi-table-fields">TGE: mar 2023 · Fin: mar 2027 · Mensual: ~92.6M ARB (equipo + inversores) · Fuente: arbitrum.foundation</div>
          </div>
          <div className="agi-table-def">
            <div className="agi-table-name">ZK · zkSync · Layer 2 · GRATIS</div>
            <div className="agi-table-fields">TGE: jun 2024 · Fin: jun 2028 · Mensual: ~194.2M ZK (inversores + equipo) · Fuente: zksync.io/tokenomics</div>
          </div>
          <div className="agi-table-def">
            <div className="agi-table-name">STRK · Starknet · Layer 2 · PREMIUM</div>
            <div className="agi-table-fields">TGE: feb 2024 · Fin: feb 2028 · Mensual: ~166.4M STRK (StarkWare + inversores + contributors) · Fuente: starknet.io</div>
          </div>
          <div className="agi-table-def">
            <div className="agi-table-name">SUI · Sui · Layer 1 · PREMIUM</div>
            <div className="agi-table-fields">TGE: may 2023 · Fin: may 2027 · Mensual: ~70.8M SUI (early contributors + inversores) · Fuente: sui.io/tokenomics</div>
          </div>
          <div className="agi-table-def">
            <div className="agi-table-name">WLD · Worldcoin · Identidad Web3 · PREMIUM</div>
            <div className="agi-table-fields">TGE: jul 2023 · Fin: jul 2027 · Mensual: ~64.7M WLD (inversores + TFH) · Fuente: worldcoin.org/blog/announcements</div>
          </div>
          <div className="agi-table-def">
            <div className="agi-table-name">JUP · Jupiter · DEX Aggregator · PREMIUM</div>
            <div className="agi-table-fields">TGE: ene 2024 · Fin: ene 2028 · Mensual: ~133.3M JUP (equipo + cold wallet) · Fuente: jup.ag/tokenomics</div>
          </div>
          <div className="agi-table-def">
            <div className="agi-table-name">APT · Aptos · Layer 1 · PREMIUM</div>
            <div className="agi-table-fields">TGE: oct 2022 · Fin: oct 2032 (long!) · Mensual: ~6M APT (contributors + fundación + inversores) · Fuente: aptoslabs.com</div>
          </div>
          <div className="agi-table-def">
            <div className="agi-table-name">TIA · Celestia · Modular Blockchain · PREMIUM</div>
            <div className="agi-table-fields">TGE: oct 2023 · Fin: oct 2026 · Mensual: ~11.2M TIA (core team) · Early backers: COMPLETADOS oct 2025 · Fuente: celestia.org</div>
          </div>
        </div>
      </section>

      {/* ── BLOQUE 6: CANDIDATOS PRÓXIMOS ── */}
      <section className="agi-section">
        <h2 className="agi-section-title">
          <span className="agi-section-num">06</span>
          Tokens candidatos para añadir
        </h2>
        <div className="agi-card">
          <p>Lista de tokens con vesting significativo que aún no están implementados. Priorizar por interés de la comunidad y relevancia del unlock.</p>
          <ul className="agi-list">
            <li><strong>SEI (Sei Network)</strong> — L1 orientada a trading, vesting multi-año activo</li>
            <li><strong>PYTH (Pyth Network)</strong> — Oracle, TGE nov 2023, vesting de equipo activo</li>
            <li><strong>ENA (Ethena)</strong> — Stablecoin USDe, TGE abr 2024, inversores en vesting</li>
            <li><strong>EIGEN (EigenLayer)</strong> — Restaking, TGE oct 2024, grandes unlocks pendientes</li>
            <li><strong>W (Wormhole)</strong> — Interoperabilidad, TGE mar 2024, inversores en vesting</li>
            <li><strong>ONDO (Ondo Finance)</strong> — RWA, vesting de equipo e inversores activo</li>
            <li><strong>AEVO (Aevo)</strong> — Options DEX, vesting pendiente</li>
          </ul>
        </div>
      </section>

      {/* ── BLOQUE 7: CHECKLIST ── */}
      <section className="agi-section">
        <h2 className="agi-section-title">
          <span className="agi-section-num">07</span>
          Checklist para Claude al añadir un token nuevo
        </h2>
        <div className="agi-checklist">
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Leer estas instrucciones antes de empezar</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Localizar fuente oficial de tokenomics (whitepaper, blog oficial)</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Verificar con TokenUnlocks.app o fuente secundaria</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Calcular monthlyTokens correctamente: total / meses</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Usar fechas absolutas en YYYY-MM-DD</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Definir color hex oficial del token y bgGradient oscuro</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Redactar description y keyRisk en español, tono informativo</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Marcar isPremium: true (salvo indicación del admin)</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Añadir entrada en la sección 05 de estas instrucciones con estado y fuente</span></label>
          <label className="agi-check-item"><input type="checkbox" readOnly /><span>Actualizar nav si el token debe aparecer en sección destacada</span></label>
        </div>
      </section>

    </div>
  );
}
