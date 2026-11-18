import Tecla from "@/components/cuaderno/Tecla";
import Anotacion from "@/components/cuaderno/Anotacion";
import SimboloEstudio from "@/components/cuaderno/SimboloEstudio";
import TarjetaEstudio from "@/components/cuaderno/TarjetaEstudio";
import CaritaFeliz from "@/components/cuaderno/CaritaFeliz";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, BookA, GraduationCap, Crown, ArrowRight } from "lucide-react";
import { herramienta, destinoPorRuta } from "@/lib/herramientas";
import "./hero-cuaderno.css";

/**
 * Las tres herramientas de pago, en las tarjetas del hero cuando hay sesión
 * (18-11-2026, pedido por el admin: «para que pueda acceder rápidamente»).
 * El orden es el de la mesa: izquierda, centro (delante) y derecha. El color
 * es el de su pieza en la barra (site-nav.css). El texto, corto y fiel a lo
 * que la herramienta hace (herramientas.ts).
 */
const MESA_CON_SESION = [
  { id: "portfolio", tema: "Portfolio", tono: "menta", texto: "Mis compras de este ciclo, con su rentabilidad en tiempo real." },
  { id: "diario", tema: "Diario", tono: "azul", texto: "Apunta tus operaciones y descubre cómo operas de verdad." },
  { id: "cursos", tema: "Cursos", tono: "lila", texto: "Módulo a módulo, con examen y certificado al final." },
] as const;

/**
 * La pegatina de cada herramienta (ESTILO.md, «Las pegatinas del cuaderno»),
 * asomando por la esquina de su tarjeta en lugar del icono. La que aún no
 * tiene pegatina lleva su icono. Las copias ligeras, en public/cuaderno/;
 * los originales del admin, en public/ (no se suben).
 */
const PEGATINAS: Partial<Record<(typeof MESA_CON_SESION)[number]["id"], string>> = {
  portfolio: "/cuaderno/portfolio-pegatina.webp",
  diario: "/cuaderno/diario-pegatina.webp",
  cursos: "/cuaderno/cursos-pegatina.webp",
};

/** La rentabilidad con su signo y coma decimal, como en el bloque de Premium. */
const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1).replace(".", ",")} %`;

/**
 * El hero de la portada con el estilo «Cuaderno de estudio» (17-11-2026).
 * Es la PRIMERA sección de prueba del nuevo diseño (TAREAS.md): el admin la
 * aprueba antes de pasar al resto. Referencia: disenos/version-o-equilibrio.html.
 *
 * · Lleva el único <h1> de la portada, con la consulta del `title`
 *   («formación en criptomonedas»): visible, nunca escondido.
 * · Las tres tarjetas enseñan cómo se aprende aquí: se giran al pulsarlas.
 *   Su contenido es real y está en el HTML aunque nadie las gire. Detrás,
 *   tres formas planas de la paleta: sin ellas eran papel blanco sobre un
 *   fondo vacío.
 * · Las pestañas de abajo son el índice del cuaderno: lo que hay en la
 *   academia, cada cosa con su color (ESTILO.md) y su cifra real, y llevan a
 *   su sección de la portada. Las cifras llegan contadas desde la página:
 *   aquí no se escribe ninguna a mano.
 * · Sin cifras de alumnos, estrellas ni testimonios: no hay datos que los
 *   respalden (se quitaron de /premium el 06-11-2026 por inventados).
 * · El altavoz para silenciar los sonidos vive en la barra (SiteNav), que
 *   sale en todas las páginas.
 * · Con sesión (18-11-2026) le habla a quien vuelve: saludo con su nombre,
 *   «Ir a mi dashboard» en vez de «Empezar gratis» y, en la mesa, sus tres
 *   herramientas (Diario, Portfolio y Cursos) en lugar de las tarjetas que
 *   giran. El <h1> no cambia. Sin sesión, que es lo que ve Google, el hero es
 *   el de siempre.
 */
export default function HeroCuaderno({ guias, terminos, cursos, sesion, portfolio }: {
  /** Guías publicadas. */
  guias: number;
  /** Términos del diccionario con página propia. */
  terminos: number;
  /** Cursos publicados: con 0, su pestaña no sale (tampoco sale su sección). */
  cursos: number;
  /** Quien mira, si ha iniciado sesión: su nombre de pila y si es Premium. */
  sesion?: { nombre: string; premium: boolean } | null;
  /**
   * La rentabilidad pública real del Portfolio Adelin (la misma que enseña el
   * bloque de Premium), para su tarjeta con sesión. Sin ella, su texto.
   */
  portfolio?: { rentabilidadPct: number; desdeAnio: number | null } | null;
}) {
  return (
    <section className="hc" aria-labelledby="hc-titulo">
      <div className="hc-inner">
        <div className="hc-texto">
          <p className="hc-nota">
            {sesion ? (
              sesion.nombre ? (
                <>
                  ¡Hola de nuevo,{" "}
                  <span className="hc-nota-nombre">
                    {sesion.nombre}
                    {/* El subrayado a mano, que se dibuja solo (hero-cuaderno.css). */}
                    <svg className="hc-nota-subrayado" viewBox="0 0 120 10" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                      <path pathLength={1} d="M2 6.5c14-3.2 26 2.6 40-.6s26-3.4 38-.4 26 1.6 38-1.8" />
                    </svg>
                  </span>
                  !
                </>
              ) : (
                "¡Hola de nuevo!"
              )
            ) : (
              "Educación cripto en español"
            )}
          </p>
          <h1 id="hc-titulo" className="hc-titulo">
            Formación en criptomonedas <span className="fluor">sin perderte</span>,{" "}
            <Anotacion tipo="circle" retraso={350}>paso a paso</Anotacion>
          </h1>
          {sesion ? (
            <>
              <p className="hc-lead">
                Todo tu cuaderno a un toque: tus guías, tus herramientas y tus cursos. Elige por
                dónde seguir hoy.
              </p>
              <div className="hc-acciones">
                <Tecla href="/dashboard" tamano="grande">Ir a mi dashboard</Tecla>
                <Tecla href="/guias" color="blanca" tamano="grande" className="hc-ver-cursos hc-ver-guias">Ver guías</Tecla>
              </div>
            </>
          ) : (
            <>
              <p className="hc-lead">
                Guías gratuitas con ejercicios y un quiz final, y cursos con un camino claro: módulo a
                módulo, examen a examen, hasta tu certificado.
              </p>
              <div className="hc-acciones">
                <Tecla href="/guias" tamano="grande">Empezar gratis</Tecla>
                <Tecla href="/cursos" color="blanca" tamano="grande" className="hc-ver-cursos">Ver cursos</Tecla>
              </div>
            </>
          )}
        </div>

        <div className="hc-mesa-caja">
          {/* La nota va encima de las tarjetas y apunta a ellas (pedido por el
              admin el 17-11-2026: a la izquierda señalaba a la nada, y el
              alumno tiene que verla). Un pósit con su celo y una flecha a mano. */}
          <p className={sesion ? "hc-pista hc-pista--sesion" : "hc-pista"} aria-hidden="true">
            <span className="hc-pista-celo" />
            <span className="hc-pista-titulo">{sesion ? "Tus herramientas" : "Así se aprende aquí"}</span>
            <span className="hc-pista-texto">{sesion ? "ábrelas desde aquí" : "toca una tarjeta y gírala"}</span>
            <SimboloEstudio tipo="flecha" color="naranja" giro={78} tamano={48} semilla={9} retraso={900} className="hc-pista-flecha" />
            {/* En el móvil, una carita feliz a su lado, como un emoji dibujado
                a mano (hero-cuaderno.css). No es un emoji de verdad: la web no
                los usa (ESTILO.md). Aparece con un saltito al verla. */}
            <CaritaFeliz className="hc-carita" retraso={1100} />
          </p>
          <div className="hc-mesa">
            <SimboloEstudio tipo="estrella" color="naranja" className="hc-garabato" tamano={46} semilla={5} retraso={700} />
            {sesion ? (
              MESA_CON_SESION.map((t, i) => {
                const h = herramienta(t.id);
                const Icono = h.icon;
                const destino = destinoPorRuta(h.premiumHref ?? h.paginaPublica ?? "/", { logueado: true, premium: sesion.premium });
                const pegatina = PEGATINAS[t.id];
                return (
                  <Link key={t.id} href={destino} className={`te hc-herr hc-herr--${t.tono} hc-t${i + 1}${pegatina ? " hc-herr--pegatina" : ""}`}>
                    <span className="te-cara hc-herr-cara">
                      {pegatina && (
                        <Image src={pegatina} alt="" width={300} height={300} className="hc-herr-pegatina" draggable={false} />
                      )}
                      <span className="hc-herr-arriba">
                        <span className="te-tema">{t.tema}</span>
                        {!sesion.premium && (
                          <span className="hc-herr-premium"><Crown size={11} strokeWidth={2.6} aria-hidden="true" /> Premium</span>
                        )}
                      </span>
                      {!pegatina && <span className="hc-herr-icono" aria-hidden="true"><Icono size={26} strokeWidth={2.1} /></span>}
                      <span className="hc-herr-nombre">{h.label}</span>
                      {t.id === "portfolio" && portfolio ? (
                        <>
                          {/* El dato real, que se mueve: la tarjeta dice algo en
                              vez de solo invitar (18-11-2026). */}
                          <span className={`hc-herr-cifra ${portfolio.rentabilidadPct >= 0 ? "is-sube" : "is-baja"}`}>
                            <span className="hc-herr-directo" aria-hidden="true" />
                            {pct(portfolio.rentabilidadPct)}
                          </span>
                          <span className="hc-herr-texto">
                            Rentabilidad real de la cartera{portfolio.desdeAnio ? `, desde ${portfolio.desdeAnio}` : ""}.
                          </span>
                        </>
                      ) : (
                        <span className="hc-herr-texto">{t.texto}</span>
                      )}
                      <span className="hc-herr-ir">
                        {sesion.premium ? "ábrelo" : "mira qué incluye"} <ArrowRight size={15} strokeWidth={2.4} aria-hidden="true" />
                      </span>
                    </span>
                  </Link>
                );
              })
            ) : (
              <>
              <TarjetaEstudio
                className="hc-t1"
                color="cielo"
                tema="Bitcoin"
                pregunta="¿Cuántos bitcoin habrá como máximo?"
                respuesta="21 millones"
                detalle="Lo fija el propio código de Bitcoin."
              />
              <TarjetaEstudio
                className="hc-t2"
                color="naranja"
                tema="Conceptos"
                pregunta="¿Qué es el halving?"
                respuesta="Mitad de bitcoin nuevo"
                detalle="Cada unos cuatro años, los mineros reciben la mitad de premio por bloque: salen menos bitcoin nuevos."
              />
              <TarjetaEstudio
                className="hc-t3"
                color="menta"
                tema="Estrategia"
                pregunta="¿Qué es hacer DCA?"
                respuesta="Comprar poco a poco"
                detalle="La misma cantidad cada cierto tiempo, pase lo que pase con el precio."
              />
              </>
            )}
          </div>
        </div>
      </div>

      {/* El índice del cuaderno: enlaces a las secciones de esta página. */}
      {/* El índice es para quien llega: con sesión ya sabes lo que hay dentro
          y el hero te lleva directo a tus herramientas (pedido por el admin el
          18-11-2026). */}
      {!sesion && (
        <nav className="hc-indice" aria-label="Qué hay en la academia">
          {/* La cabecera del índice: qué hay y qué hacer con ello. */}
          <div className="hc-indice-cabecera">
            <span className="hc-indice-titulo">Lo que te espera dentro</span>
            <span className="hc-indice-nota" aria-hidden="true">
              toca una y vas directo
              <SimboloEstudio tipo="flecha" color="naranja" giro={100} tamano={34} semilla={3} retraso={600} className="hc-indice-flecha" />
            </span>
          </div>
          <ul className="hc-indice-lista">
            <li>
              <a href="#guias" className="hc-ficha hc-ficha--cielo">
                <span className="hc-ficha-icono" aria-hidden="true"><BookOpen size={20} strokeWidth={2.2} /></span>
                <span className="hc-ficha-texto"><b>{guias}</b> guías gratis</span>
              </a>
            </li>
            <li>
              <a href="#diccionario" className="hc-ficha hc-ficha--amarillo">
                <span className="hc-ficha-icono" aria-hidden="true"><BookA size={20} strokeWidth={2.2} /></span>
                <span className="hc-ficha-texto"><b>{terminos}</b> términos explicados</span>
              </a>
            </li>
            {cursos > 0 && (
              <li>
                <a href="#cursos" className="hc-ficha hc-ficha--lila">
                  <span className="hc-ficha-icono" aria-hidden="true"><GraduationCap size={20} strokeWidth={2.2} /></span>
                  <span className="hc-ficha-texto"><b>{cursos}</b> {cursos === 1 ? "curso con certificado" : "cursos con certificado"}</span>
                </a>
              </li>
            )}
            <li>
              <a href="#premium" className="hc-ficha hc-ficha--naranja">
                <span className="hc-ficha-icono" aria-hidden="true"><Crown size={20} strokeWidth={2.2} /></span>
                <span className="hc-ficha-texto"><b>3</b> piezas Premium</span>
              </a>
            </li>
          </ul>
        </nav>
      )}
    </section>
  );
}
