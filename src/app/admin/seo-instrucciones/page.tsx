import Link from "next/link";

/**
 * /admin/seo-instrucciones · Cómo se hace SEO en la academia, para cualquier
 * página: guía, término, curso, ficha de herramienta, hilo del foro o portada.
 *
 * Es el «cómo y por qué». El protocolo que se ejecuta fase a fase sobre una
 * guía terminada es AUDITORIA-SEO.md, y lo técnico de la plataforma (sitemap,
 * robots, canónicas) está en PLATAFORMA.md. Aquí no se repite: se enlaza.
 *
 * Lo que dice de Google está contrastado con su documentación oficial el
 * 13-11-2026 (enlaces al final). Si Google cambia algo, se corrige aquí y se
 * actualiza esa fecha: una regla de SEO sin fecha envejece sin avisar.
 */

const REVISADO = "13 de noviembre de 2026";

const INDICE = [
  ["google", "Cómo decide Google hoy"],
  ["confianza", "Confianza: YMYL y E-E-A-T"],
  ["metodo", "El método"],
  ["elementos", "Qué aplicar a cada página"],
  ["resultado", "El resultado en Google"],
  ["estructura", "Estructura y texto"],
  ["enlaces", "Enlazado interno"],
  ["datos", "Datos estructurados"],
  ["tecnica", "Lo técnico"],
  ["ia", "Respuestas con IA"],
  ["conversion", "Convertir sin perder posición"],
  ["prohibido", "Lo que no se hace"],
  ["medir", "Medir y corregir"],
  ["checklist", "Lista rápida"],
  ["fuentes", "Fuentes"],
] as const;

const FUENTES = [
  ["Guía de los sistemas de clasificación de Google", "https://developers.google.com/search/docs/appearance/ranking-systems-guide"],
  ["Crear contenido útil, fiable y pensado para las personas", "https://developers.google.com/search/docs/fundamentals/creating-helpful-content"],
  ["Guía para las funciones de IA generativa de la Búsqueda (mayo de 2026)", "https://developers.google.com/search/docs/fundamentals/ai-optimization-guide"],
  ["Las funciones de IA y tu sitio web", "https://developers.google.com/search/docs/appearance/ai-features"],
  ["Políticas de spam de la Búsqueda", "https://developers.google.com/search/docs/essentials/spam-policies"],
  ["Core Web Vitals y los resultados de búsqueda", "https://developers.google.com/search/docs/appearance/core-web-vitals"],
  ["Cómo genera Google los títulos de los resultados", "https://developers.google.com/search/docs/appearance/title-link"],
  ["Cómo genera Google los fragmentos (snippets)", "https://developers.google.com/search/docs/appearance/snippet"],
  ["Actualizaciones principales de la Búsqueda", "https://developers.google.com/search/docs/appearance/core-updates"],
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

export default function SeoInstruccionesPage() {
  return (
    <div className="admin-guide-instructions agi--seo">
      <div className="agi-hero">
        <div className="agi-hero-label">Referencia interna · revisado el {REVISADO}</div>
        <h1 className="agi-hero-title">Cómo se hace SEO aquí</h1>
        <p className="agi-hero-sub">
          El método para que cualquier página de la academia aparezca en Google: una guía, un término del diccionario,
          la ficha de un curso o de una herramienta, un hilo del foro. No son trucos. Es entender qué premia Google
          hoy y hacerlo siempre igual.
        </p>
      </div>

      <nav className="agi-indice" aria-label="Índice">
        {INDICE.map(([id, texto], i) => (
          <a key={id} href={`#${id}`}><span>{String(i + 1).padStart(2, "0")}</span>{texto}</a>
        ))}
      </nav>

      <Seccion id="google" n="01" titulo="Cómo decide Google hoy">
        <div className="agi-card">
          <p>Google hace tres cosas con una página, en este orden. Si falla una, las siguientes no ocurren:</p>
          <div className="agi-embudo">
            <div><b>1 · La rastrea</b><span>Su robot la encuentra por un enlace o por el sitemap, y la descarga</span></div>
            <div><b>2 · La indexa</b><span>Entiende de qué va y decide si merece guardarse</span></div>
            <div><b>3 · La clasifica</b><span>Para cada búsqueda, la ordena frente a las demás</span></div>
          </div>
          <p className="agi-note">Que una página cumpla todos los requisitos no garantiza que se indexe ni que se muestre: Google lo dice expresamente. Lo que sí se puede hacer es no darle motivos para descartarla.</p>
        </div>

        <div className="agi-card">
          <p><strong>Lo que pesa en la clasificación, según su propia documentación:</strong></p>
          <ul className="agi-list">
            <li><strong>Que responda a la búsqueda.</strong> Google interpreta la intención, no solo las palabras (sistemas BERT, RankBrain y de concordancia neuronal). La página que gana es la que resuelve lo que la persona quería, con el formato que esperaba.</li>
            <li><strong>Que sea contenido útil y original.</strong> Desde marzo de 2024, el sistema de «contenido útil» forma parte del núcleo del algoritmo: ya no es un filtro aparte, se aplica siempre. Premia lo que aporta información, análisis o experiencia propios, y hunde lo que resume a otros.</li>
            <li><strong>Que sea de fiar</strong>, sobre todo en temas de dinero (bloque 02).</li>
            <li><strong>Los enlaces.</strong> PageRank sigue siendo uno de los sistemas centrales: los enlaces que recibe una página, también los internos, le dicen a Google cuánto importa.</li>
            <li><strong>Las secciones cuentan por separado.</strong> El sistema de pasajes puede posicionar un apartado concreto de una página larga. Por eso cada sección tiene que entenderse sola.</li>
            <li><strong>Lo reciente</strong>, cuando la búsqueda lo pide (precios, normativa, novedades de un proyecto).</li>
            <li><strong>La experiencia de la página</strong>: que cargue rápido, no salte y se lea bien en el móvil (bloque 09).</li>
          </ul>
        </div>

        <div className="agi-card">
          <p><strong>Tres cosas que cambian cómo se plantea una web pequeña:</strong></p>
          <ul className="agi-list">
            <li><strong>Diversidad de sitios:</strong> Google no suele mostrar más de dos resultados del mismo sitio para una búsqueda. Dos páginas propias compitiendo por la misma consulta se estorban: <strong>una consulta, una página</strong>.</li>
            <li><strong>Las actualizaciones principales</strong> (en 2026 las hubo en marzo y en mayo) no castigan páginas sueltas: reevalúan el sitio entero. Los análisis publicados, que son de terceros y no de Google, coinciden en la dirección: subieron los especialistas con contenido original y experiencia demostrada; bajaron los agregadores, el contenido fino o hecho en serie con IA sin revisar, y las páginas de dinero sin autoría clara.</li>
            <li><strong>No hay arreglo rápido.</strong> Si una actualización baja al sitio, no hay nada que «reparar» esa semana: se mejora el contenido y se espera a la siguiente.</li>
          </ul>
        </div>
      </Seccion>

      <Seccion id="confianza" n="02" titulo="Confianza: YMYL y E-E-A-T">
        <div className="agi-card">
          <p>
            Google llama <strong>YMYL</strong> («tu dinero o tu vida») a los temas que pueden afectar a la salud, la
            estabilidad económica o la seguridad de alguien, y les exige más. <strong>Todo lo que publica la academia
            es YMYL</strong>: inversión, trading e impuestos.
          </p>
          <p>
            Para valorar esa fiabilidad usa el marco <strong>E-E-A-T</strong>: experiencia, conocimiento, autoridad y
            confianza. No es un factor de clasificación en sí, pero sus sistemas dan más peso a las señales que lo
            reflejan en temas YMYL. De los cuatro, Google dice que <strong>la confianza es el más importante</strong>.
          </p>
        </div>
        <div className="agi-tabla-envoltura">
          <table className="agi-tabla">
            <thead><tr><th>Señal</th><th>Cómo se demuestra aquí</th></tr></thead>
            <tbody>
              <tr><td><strong>Experiencia</strong></td><td>Se nota que quien escribe opera: ejemplos con operaciones reales, la cartera publicada, errores propios contados. Es lo único que un resumen hecho con IA no puede tener.</td></tr>
              <tr><td><strong>Conocimiento</strong></td><td>Cada afirmación técnica es correcta y cada cifra lleva su fuente y su fecha. Un error fácil de comprobar tumba la página entera.</td></tr>
              <tr><td><strong>Autoridad</strong></td><td>Autor con nombre y enlace a quién es; canal de YouTube e Instagram coherentes con la web; otras webs que enlazan o mencionan.</td></tr>
              <tr><td><strong>Confianza</strong></td><td>Riesgos contados, ninguna promesa de ganancia, descargo de responsabilidad, quién está detrás (aviso legal), fecha de última revisión, HTTPS y nada que engañe.</td></tr>
            </tbody>
          </table>
        </div>
        <div className="agi-card">
          <p><strong>Las tres preguntas de Google: quién, cómo y por qué.</strong></p>
          <ul className="agi-list">
            <li><strong>Quién</strong> lo ha creado: tiene que verse. Inventar autores o credenciales es engaño.</li>
            <li><strong>Cómo</strong> se ha hecho: Google no prohíbe usar IA, pero producir texto en masa sin supervisión ni aportación propia lo considera esfuerzo nulo. Aquí cada pieza se investiga, se contrasta y la aprueba el admin.</li>
            <li><strong>Por qué</strong> existe: para ayudar a quien lee. Si una página existe solo para captar una búsqueda, sobra.</li>
          </ul>
        </div>
      </Seccion>

      <Seccion id="metodo" n="03" titulo="El método">
        <p className="agi-section-intro">Los mismos nueve pasos para cualquier página. Para una guía, el protocolo detallado de cada paso es <code>AUDITORIA-SEO.md</code>.</p>
        <div className="agi-steps">
          <Paso n={1} titulo="Una consulta, escrita como la escribiría una persona">Se elige <strong>una</strong> búsqueda principal y dos o tres variantes. Se comprueba que ninguna otra página de la academia va ya a por ella: si la hay, se mejora esa en vez de crear otra.</Paso>
          <Paso n={2} titulo="La intención">¿Quiere una definición, una explicación, comparar, hacer algo? Se mira qué enseña Google para esa consulta: si todo son definiciones cortas, gana una definición; si son guías largas, una guía.</Paso>
          <Paso n={3} titulo="El hueco">Se leen los primeros resultados y se apunta qué les falta: un dato actual, un ejemplo con números, el ángulo español, una herramienta, la experiencia de alguien que lo ha hecho. Eso es lo que justifica la página.</Paso>
          <Paso n={4} titulo="La respuesta, arriba">Debajo del H1, en dos o tres frases, la respuesta completa. Luego se desarrolla. Nada se interpone: ni introducción, ni anuncio, ni vídeo.</Paso>
          <Paso n={5} titulo="La estructura">Un H1. Un H2 por cada pregunta que se haría el lector, en su orden. Párrafos cortos, listas y tablas donde ayuden a comparar.</Paso>
          <Paso n={6} titulo="El resultado en Google">Título, descripción y URL, pensados como un anuncio honesto de lo que hay dentro (bloque 05).</Paso>
          <Paso n={7} titulo="Los enlaces">Salientes al diccionario y a guías relacionadas; entrantes desde las páginas que ya hablan del tema (bloque 07). Una página sin enlaces que lleguen a ella casi no existe.</Paso>
          <Paso n={8} titulo="Lo técnico">Canónica, datos estructurados, sitemap, que el contenido salga del servidor y que cargue rápido (bloques 08 y 09).</Paso>
          <Paso n={9} titulo="Medir y volver">A las semanas, mirar con qué consultas aparece de verdad y ajustar (bloque 13). El SEO no se termina al publicar.</Paso>
        </div>
      </Seccion>

      <Seccion id="elementos" n="04" titulo="Qué aplicar a cada página">
        <div className="agi-tabla-envoltura">
          <table className="agi-tabla">
            <thead><tr><th>Página</th><th>Búsqueda que gana</th><th>Lo que no puede faltar</th><th>Dato estructurado</th></tr></thead>
            <tbody>
              <tr><td><strong>Guía</strong><br /><code>/guias/…</code></td><td>«qué es X», «cómo se hace Y»: explicaciones a fondo</td><td>El método entero y la auditoría de 18 fases. Es la principal fuente de tráfico</td><td><code>Article</code> + migas</td></tr>
              <tr><td><strong>Término</strong><br /><code>/glosario/…</code></td><td>«X significado», «qué significa X»: definiciones</td><td>La definición en la primera frase; ficha ampliada con ejemplo; enlaces a la guía que lo desarrolla</td><td><code>DefinedTerm</code> + migas</td></tr>
              <tr><td><strong>Curso</strong><br /><code>/cursos/…</code></td><td>«curso de X»</td><td>Temario, objetivos y a quién va dirigido, visibles sin cuenta. Nunca el texto de las lecciones</td><td><code>Course</code> + migas</td></tr>
              <tr><td><strong>Ficha de herramienta</strong><br /><code>/herramientas/…</code></td><td>«diario de trading», «portfolio cripto»</td><td>Qué hace de verdad, con capturas reales, precio y preguntas frecuentes visibles</td><td><code>WebApplication</code></td></tr>
              <tr><td><strong>Hilo del foro</strong><br /><code>/foro/…</code></td><td>Preguntas muy concretas, de cola larga</td><td>Solo se indexa con respuesta, 48 horas de vida y sin reportes</td><td><code>QAPage</code></td></tr>
              <tr><td><strong>Portada y listados</strong></td><td>La marca y «academia cripto»</td><td>Enlaces claros a cada sección; son las que reparten autoridad al resto</td><td><code>Organization</code>, <code>WebSite</code></td></tr>
            </tbody>
          </table>
        </div>
        <div className="agi-card">
          <p className="agi-note">Antes de escribir el dato estructurado de una página, se abre su código y se mira el que ya emite: los ayudantes están en <code>src/lib/schema.ts</code>. La tabla dice el tipo que le corresponde, no sustituye a comprobarlo.</p>
        </div>
      </Seccion>

      <Seccion id="resultado" n="05" titulo="El resultado en Google">
        <div className="agi-card">
          <p><strong>El título.</strong> Google construye el título del resultado a partir del <code>&lt;title&gt;</code>, del H1 y de otros textos destacados; si no encajan entre sí, escribe el suyo. Por eso <strong>el <code>title</code> y el H1 dicen lo mismo</strong> con palabras parecidas.</p>
          <ul className="agi-list">
            <li><strong>La consulta, delante.</strong> Lo que se corta es el final.</li>
            <li><strong>Google no fija un máximo de caracteres</strong>: corta según el ancho de la pantalla. La regla de la casa son <strong>48 caracteres</strong>, porque el layout añade « | AdelinBTC» y con unos 60 en total el título se ve entero en casi cualquier pantalla.</li>
            <li>Descriptivo y concreto. Ni lista de palabras clave, ni el mismo título en varias páginas.</li>
          </ul>
        </div>
        <div className="agi-card">
          <p><strong>La descripción.</strong> Google saca el fragmento sobre todo del contenido de la página, y usa la metadescripción cuando describe la página mejor que el propio texto. Cambia según la búsqueda.</p>
          <ul className="agi-list">
            <li>Única por página, de <strong>hasta 160 caracteres</strong> (regla de la casa: tampoco aquí Google fija un máximo).</li>
            <li>Dice qué va a encontrar el lector y por qué esta página y no otra. Sin promesas que el contenido no cumpla.</li>
            <li>Como el fragmento suele salir del texto, <strong>el primer párrafo importa tanto como la descripción</strong>.</li>
          </ul>
        </div>
        <div className="agi-card">
          <p><strong>La URL.</strong> Corta, en minúsculas, con guiones y con la palabra principal. No se cambia una vez publicada. Y antes de elegirla se compara con los <code>Disallow</code> de <code>robots.ts</code>, que bloquean por prefijo.</p>
        </div>
      </Seccion>

      <Seccion id="estructura" n="06" titulo="Estructura y texto">
        <div className="agi-card">
          <ul className="agi-list">
            <li><strong>Un solo H1</strong>, con la consulta. Los H2 son las preguntas del lector; los H3, sus partes. No se salta de nivel para conseguir un tamaño de letra.</li>
            <li><strong>Cada sección se entiende sola</strong>: empieza con su respuesta y nombra de qué habla, sin depender de «como vimos antes». Google puede enseñar esa sección suelta.</li>
            <li><strong>La palabra clave, donde es natural</strong>: título, H1, primer párrafo, algún H2 y la URL. Y sus variantes y sinónimos en el texto. Repetirla por repetirla es relleno de palabras clave, y está penalizado.</li>
            <li><strong>No hay longitud ideal.</strong> Google dice expresamente que no tiene un número de palabras preferido. Una definición puede ganar con 300 palabras y una guía necesitar 3.000.</li>
            <li><strong>Lo importante, en texto del servidor.</strong> Lo que solo aparece tras pulsar o dentro de un componente interactivo puede no leerse. Los acordeones y pestañas no son un problema si el texto está en el HTML.</li>
            <li><strong>Imágenes</strong> con <code>alt</code> que describe lo que se ve, en WebP, con ancho y alto declarados para que la página no salte.</li>
            <li><strong>La fecha de revisión</strong> se cambia solo cuando se ha cambiado contenido. Tocarla para parecer reciente no sirve, y Google lo dice.</li>
          </ul>
        </div>
      </Seccion>

      <Seccion id="enlaces" n="07" titulo="Enlazado interno">
        <div className="agi-card">
          <p>Para una web sin muchos enlaces externos, los internos son la palanca que sí se controla: reparten la autoridad y le explican a Google qué páginas son las importantes y de qué va cada una.</p>
          <ul className="agi-list">
            <li><strong>Diccionario:</strong> toda palabra técnica se enlaza a su ficha en su primera aparición. Si la ficha no existe, se crea antes de publicar. Es regla intocable.</li>
            <li><strong>De guía a guía:</strong> donde el texto ya menciona el tema de otra. Además, el bloque <code>GuiasRelacionadas</code> al final.</li>
            <li><strong>Hacia la página nueva:</strong> al publicar algo, se vuelve a las páginas que ya hablaban del tema y se enlaza desde ellas. Sin enlaces entrantes, una página es periférica para Google.</li>
            <li><strong>El ancla describe el destino</strong> y es una palabra que ya estaba en la frase. Nunca «pincha aquí» ni «más información».</li>
            <li><strong>Se comprueba el destino:</strong> un término sin ficha ampliada da 404, y una guía que no está en <code>GUIDES</code> no existe.</li>
            <li><strong>De lo gratuito a lo de pago:</strong> las guías enlazan a las fichas públicas de las herramientas y a los cursos. Así las páginas que venden reciben autoridad de las que atraen.</li>
            <li><strong>Enlaces externos:</strong> solo a fuentes oficiales cuando respaldan un dato. Los de pago o de afiliación, con <code>rel=&quot;sponsored&quot;</code>.</li>
          </ul>
        </div>
      </Seccion>

      <Seccion id="datos" n="08" titulo="Datos estructurados">
        <div className="agi-card">
          <p>Los datos estructurados (JSON-LD) le dicen a Google qué es una página sin que tenga que deducirlo, y permiten resultados enriquecidos. No suben posiciones por sí solos.</p>
          <ul className="agi-list">
            <li><strong>Solo lo que el visitante puede ver.</strong> Declarar en JSON-LD algo que no está en la página es spam de datos estructurados.</li>
            <li><strong>Con los ayudantes de <code>src/lib/schema.ts</code></strong>, no a mano: escapan bien el texto y mantienen un solo formato.</li>
            <li><strong>Migas de pan</strong> en toda página que cuelgue de un listado.</li>
          </ul>
        </div>
        <div className="agi-card">
          <p className="agi-warning"><strong>Las preguntas frecuentes ya no dan resultado enriquecido.</strong> Google retiró el resultado de FAQ de la Búsqueda el 7 de mayo de 2026, y el de «cómo hacer» (HowTo) en 2023. El marcado <code>FAQPage</code> que ya existe en algunas páginas no perjudica, pero no se añade a páginas nuevas esperando que se vea en Google. Las preguntas frecuentes siguen siendo útiles como contenido visible.</p>
        </div>
      </Seccion>

      <Seccion id="tecnica" n="09" titulo="Lo técnico">
        <p className="agi-section-intro">El detalle de cada punto, con sus trampas, está en <code>PLATAFORMA.md</code>. Aquí va lo que hay que saber siempre.</p>
        <div className="agi-tabla-envoltura">
          <table className="agi-tabla">
            <thead><tr><th>Punto</th><th>La regla</th></tr></thead>
            <tbody>
              <tr><td><strong>Canónica</strong></td><td>Una por página, en ruta relativa, en su <code>metadata</code>. <strong>Nunca en un <code>layout.tsx</code></strong>: la heredaría media web.</td></tr>
              <tr><td><strong>Sitemap</strong></td><td>Solo páginas públicas que responden 200. Nunca una que redirige o pide sesión.</td></tr>
              <tr><td><strong>robots.txt</strong></td><td>Bloquea por prefijo: una URL pública nueva no puede empezar igual que un <code>Disallow</code>.</td></tr>
              <tr><td><strong>Dominio</strong></td><td>Sin <code>www</code>, siempre. El <code>www</code> solo redirige.</td></tr>
              <tr><td><strong>Lo retirado</strong></td><td>Responde 410 (<code>src/lib/retiradas.ts</code>), no una redirección a la portada.</td></tr>
              <tr><td><strong>Indexación</strong></td><td>Para que algo no salga en Google se usa <code>noindex</code>. Bloquearlo en robots no lo impide.</td></tr>
              <tr><td><strong>Renderizado</strong></td><td>El contenido sale en el HTML del servidor. Lo que solo pinta el navegador es una apuesta.</td></tr>
            </tbody>
          </table>
        </div>
        <div className="agi-card">
          <p><strong>Core Web Vitals</strong>: las tres medidas de experiencia que Google recomienda cumplir, con sus umbrales oficiales.</p>
          <div className="agi-embudo agi-embudo--tres">
            <div><b>LCP · menos de 2,5 s</b><span>Lo que tarda en verse el elemento principal</span></div>
            <div><b>INP · menos de 200 ms</b><span>Lo que tarda la página en reaccionar a un toque</span></div>
            <div><b>CLS · menos de 0,1</b><span>Cuánto salta el contenido mientras carga</span></div>
          </div>
          <p className="agi-note">Google no dice cuánto pesan frente al contenido. Una página rápida y vacía no gana a una útil; pero entre dos útiles, la lenta pierde lectores. Se miden con datos reales en Search Console, informe «Core Web Vitals».</p>
        </div>
      </Seccion>

      <Seccion id="ia" n="10" titulo="Respuestas con IA">
        <div className="agi-card">
          <p>
            Google contesta cada vez más con resúmenes generados (AI Overviews y Modo IA), que enlazan a las páginas de
            las que salen. Para una búsqueda lanza por dentro varias consultas relacionadas a la vez (lo llama{" "}
            <em>query fan-out</em>) y arma la respuesta con lo que encuentra. Según su guía oficial de mayo de 2026:
          </p>
          <ul className="agi-list">
            <li><strong>Es el mismo SEO.</strong> Para salir ahí, la página tiene que estar indexada y poder mostrarse con fragmento. No hay una técnica aparte.</li>
            <li><strong>Lo que más influye a la larga es aportar un punto de vista propio</strong>, y no reciclar lo que ya está en internet. Un resumen de IA ya resume lo común: solo necesita citar a quien añade algo.</li>
            <li><strong>Cubrir el tema entero ayuda</strong>: como Google se hace varias preguntas relacionadas, la página que responde también a las siguientes dudas del lector tiene más opciones de ser citada.</li>
            <li><strong>Imágenes y vídeo propios</strong> suman.</li>
          </ul>
        </div>
        <div className="agi-card">
          <p><strong>Lo que Google dice que no hace falta</strong>, y aquí no se hace:</p>
          <ul className="agi-list">
            <li>Un archivo <code>llms.txt</code>: la Búsqueda de Google no lo usa.</li>
            <li>Partir el contenido en trocitos o reescribirlo «para la IA».</li>
            <li>Marcado especial para IA: no existe.</li>
            <li>Crear una página por cada variante de una búsqueda: es abuso de contenido a escala.</li>
            <li>Buscar menciones artificiales en otras webs.</li>
          </ul>
          <p className="agi-note">El tráfico desde estas respuestas se ve en Search Console, en el informe de rendimiento de IA generativa. Ninguna herramienta externa tiene acceso a los sistemas de Google: sus cifras de «visibilidad en IA» son estimaciones.</p>
        </div>
      </Seccion>

      <Seccion id="conversion" n="11" titulo="Convertir sin perder posición">
        <div className="agi-card">
          <p>La web tiene que vender, y vender mal cuesta posiciones. El orden es siempre el mismo: <strong>primero la respuesta, después la oferta</strong>.</p>
          <ul className="agi-list">
            <li><strong>Nada entre el H1 y la respuesta.</strong> Quien llega, recibe un anuncio y vuelve al buscador le está diciendo a Google que la página no servía.</li>
            <li><strong>Sin ventanas emergentes ni capas que tapen el contenido</strong>, sobre todo en el móvil.</li>
            <li><strong>La oferta va con el tema.</strong> En las guías, con <code>GuiaAnuncio</code> y sus reglas: <Link href="/admin/guias-instrucciones#anuncios">Guías, bloque «Anuncios internos»</Link>.</li>
            <li><strong>A quien ya tiene cuenta no se le pide que se registre</strong>, y a quien ya es Premium no se le vende.</li>
            <li><strong>Lo que se promete, existe.</strong> Antes de escribir qué hace una herramienta, se abre su código. Prometer una función que no hay es, además, lo que Google llama funcionalidad engañosa.</li>
            <li><strong>El contenido de pago no se enseña a Google y se esconde al visitante.</strong> Lo que ve el robot es lo que ve una persona sin sesión.</li>
          </ul>
        </div>
      </Seccion>

      <Seccion id="prohibido" n="12" titulo="Lo que no se hace">
        <p className="agi-section-intro">Las políticas de spam de Google que más cerca le quedan a una web como esta. Saltárselas puede sacar del índice al sitio entero, y desde mayo de 2026 valen también para las respuestas con IA.</p>
        <div className="agi-tabla-envoltura">
          <table className="agi-tabla">
            <thead><tr><th>Práctica</th><th>Qué es</th><th>Aquí significa</th></tr></thead>
            <tbody>
              <tr><td><strong>Contenido a escala</strong></td><td>Muchas páginas hechas para posicionar y no para ayudar, con IA o sin ella</td><td>No se generan guías o términos en serie. Cada pieza se investiga y se aprueba</td></tr>
              <tr><td><strong>Relleno de palabras clave</strong></td><td>Repetir términos para manipular</td><td>La palabra clave tiene techo; se escribe para quien lee</td></tr>
              <tr><td><strong>Páginas puerta</strong></td><td>Varias páginas casi iguales para variantes de una búsqueda</td><td>Una consulta, una página</td></tr>
              <tr><td><strong>Texto oculto</strong></td><td>Contenido solo para el robot</td><td>Nada en blanco sobre blanco ni fuera de pantalla. Acordeones y pestañas sí valen</td></tr>
              <tr><td><strong>Encubrimiento</strong></td><td>Enseñar una cosa a Google y otra al visitante</td><td>El mismo HTML para todos; lo personal se pide aparte</td></tr>
              <tr><td><strong>Spam de enlaces</strong></td><td>Comprar, vender o intercambiar enlaces para subir</td><td>No se compran enlaces. Los patrocinados, con <code>rel=&quot;sponsored&quot;</code></td></tr>
              <tr><td><strong>Afiliación sin valor</strong></td><td>Páginas de afiliado con texto copiado</td><td>Si algún día se recomienda un exchange, con análisis propio y aviso</td></tr>
              <tr><td><strong>Spam de usuarios</strong></td><td>Basura publicada por terceros en el sitio</td><td>El foro modera, y no indexa un hilo hasta que tiene respuesta</td></tr>
              <tr><td><strong>Funcionalidad engañosa</strong></td><td>Prometer una herramienta que no hace lo que dice</td><td>No se promete lo que el producto no hace</td></tr>
            </tbody>
          </table>
        </div>
        <div className="agi-card">
          <p>Y tres de la casa, que no son de Google pero cuestan igual: <strong>nunca prometer ganancias</strong>, <strong>nunca escribir un aviso legal a mano</strong> (va <code>DisclaimerRiesgo</code>) y <strong>nunca publicar sin el «sí» del admin</strong>.</p>
        </div>
      </Seccion>

      <Seccion id="medir" n="13" titulo="Medir y corregir">
        <div className="agi-tabla-envoltura">
          <table className="agi-tabla">
            <thead><tr><th>Dónde</th><th>Qué se mira</th><th>Qué se decide con ello</th></tr></thead>
            <tbody>
              <tr><td><strong>Search Console</strong> · Rendimiento</td><td>Consultas, impresiones, clics y posición de cada página</td><td>Qué buscan de verdad, y qué página reforzar</td></tr>
              <tr><td><strong>Search Console</strong> · Indexación</td><td>Qué páginas no están indexadas y por qué</td><td>Si hay un problema técnico o de calidad</td></tr>
              <tr><td><strong>Search Console</strong> · IA generativa</td><td>Apariciones y clics desde las respuestas con IA</td><td>Qué páginas cita Google</td></tr>
              <tr><td><strong>Analítica</strong> (<code>/admin</code>)</td><td>Visitas del canal Google, páginas de entrada, rebote, registros</td><td>Si la visita se queda y si se convierte</td></tr>
            </tbody>
          </table>
        </div>
        <div className="agi-card">
          <p><strong>Cómo leerlo:</strong></p>
          <ul className="agi-list">
            <li><strong>Muchas impresiones y pocos clics</strong>: el título o la descripción no convencen. Se reescriben.</li>
            <li><strong>Posición entre la 5 y la 20</strong>: está cerca. Se refuerza la sección que responde a esa consulta y se le dan enlaces internos.</li>
            <li><strong>Aparece por una consulta que no se buscaba</strong>: puede merecer su propia sección o su propia página.</li>
            <li><strong>Entra gente y se va enseguida</strong>: la respuesta no está arriba, o la página no es lo que el título prometía.</li>
            <li><strong>Dos páginas propias para la misma consulta</strong>: se funden en una.</li>
          </ul>
          <p className="agi-note">Los cambios tardan semanas en notarse. No se toca la misma página cada pocos días: se cambia, se anota la fecha y se espera.</p>
        </div>
        <div className="agi-card agi-card--mono">
          {`npm run check:seo -- guias/<slug> "<consulta principal>"   # la página servida`}<br />
          {`npm run check:glosario                                    # el texto de las fichas`}
        </div>
        <div className="agi-card">
          <p className="agi-warning"><strong>Salir en verde no es haber acabado.</strong> Los scripts cuentan lo que se puede contar, y aprueban una página que cumple todas las métricas y no responde a nada. El criterio está en el método; los scripts van al final, para confirmar.</p>
        </div>
      </Seccion>

      <Seccion id="checklist" n="14" titulo="Lista rápida">
        <div className="agi-checklist">
          <Punto>Una consulta principal, y ninguna otra página propia va a por ella</Punto>
          <Punto>El formato coincide con lo que Google enseña para esa consulta</Punto>
          <Punto>Tiene algo propio que los primeros resultados no tienen</Punto>
          <Punto>La respuesta está justo debajo del H1</Punto>
          <Punto>Un H1; los H2 son preguntas del lector; cada sección se entiende sola</Punto>
          <Punto>Cifras con fuente y fecha; riesgos contados; ninguna promesa</Punto>
          <Punto>Autor y fecha de revisión visibles</Punto>
          <Punto><code>title</code> de 48 caracteres con la consulta delante, coherente con el H1; descripción de 160</Punto>
          <Punto>Términos enlazados al diccionario; enlaces a guías relacionadas; destinos comprobados</Punto>
          <Punto>Al menos dos páginas ya publicadas enlazan a esta</Punto>
          <Punto>Canónica propia, datos estructurados con lo visible, dada de alta donde la recoge el sitemap</Punto>
          <Punto>El contenido esencial sale en el HTML del servidor</Punto>
          <Punto>Imágenes en WebP con <code>alt</code> y medidas; nada salta al cargar</Punto>
          <Punto>Ninguna oferta antes de la respuesta, y ninguna promesa que el producto no cumpla</Punto>
          <Punto>Fecha apuntada para revisarla en Search Console a las seis semanas</Punto>
        </div>
      </Seccion>

      <Seccion id="fuentes" n="15" titulo="Fuentes">
        <div className="agi-card">
          <p>Documentación oficial de Google Search Central, consultada el {REVISADO}. Lo que aquí se dice sobre los efectos de las actualizaciones de marzo y mayo de 2026 viene de análisis de terceros: Google no publica quién sube y quién baja.</p>
          <ul className="agi-list agi-fuentes">
            {FUENTES.map(([titulo, url]) => (
              <li key={url}><a href={url} target="_blank" rel="noopener noreferrer">{titulo}</a></li>
            ))}
          </ul>
        </div>
      </Seccion>
    </div>
  );
}
