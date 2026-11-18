import Tecla from "@/components/cuaderno/Tecla";
import Anotacion from "@/components/cuaderno/Anotacion";
import SimboloEstudio from "@/components/cuaderno/SimboloEstudio";
import TrazoVisible from "@/components/cuaderno/TrazoVisible";
import TarjetaEstudio from "@/components/cuaderno/TarjetaEstudio";
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
/**
 * Un pósit de fondo con un gráfico de trading dibujado a rotulador: velas
 * verdes y rojas y una línea que sube con su flecha. Asoma por detrás de los
 * botones, hacia fuera a la izquierda, solo en pantallas anchas de ordenador
 * (hero-cuaderno.css). Decoración: oculto a los lectores de pantalla
 * (18-11-2026, pedido por el admin).
 */
function PositGrafico() {
  return (
    <span className="hc-posit-grafico" aria-hidden="true">
      <span className="hc-posit-grafico-celo" />
      <svg viewBox="0 0 120 110">
        <path className="hc-pg-eje" d="M12 8v88h100" />
        <path className="hc-pg-rejilla" d="M12 30h100M12 52h100M12 74h100" />
        <path className="hc-pg-vela hc-pg-vela--baja" d="M26 40v34M22 46h8v20h-8z" />
        <path className="hc-pg-vela hc-pg-vela--sube" d="M42 44v36M38 52h8v20h-8z" />
        <path className="hc-pg-vela hc-pg-vela--sube" d="M58 30v34M54 36h8v20h-8z" />
        <path className="hc-pg-vela hc-pg-vela--baja" d="M74 34v30M70 40h8v14h-8z" />
        <path className="hc-pg-vela hc-pg-vela--sube" d="M90 14v36M86 20h8v22h-8z" />
        <path className="hc-pg-linea" d="M16 84C30 80 34 70 46 72s16-14 28-16 16-14 24-24 8-12 12-18" />
        <path className="hc-pg-linea" d="M102 14l8 0-2 8" />
      </svg>
    </span>
  );
}

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
                    {/* El subrayado a mano: se dibuja solo cuando se ve (TrazoVisible, hero-cuaderno.css). */}
                    <TrazoVisible className="hc-nota-trazo" retraso={250}>
                      <svg className="hc-nota-subrayado" viewBox="0 0 120 10" preserveAspectRatio="none" focusable="false">
                        <path pathLength={1} d="M2 6.5c14-3.2 26 2.6 40-.6s26-3.4 38-.4 26 1.6 38-1.8" />
                      </svg>
                    </TrazoVisible>
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
                <PositGrafico />
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
                <PositGrafico />
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
          {/* Con sesión, en el móvil: garabatos de herramientas detrás del pósit
              (dos engranajes y una llave inglesa), suaves (18-11-2026). Redibujados el
              mismo día: engranajes con dientes de verdad (antes parecían un sol),
              una llave fija con su boca y un destornillador con su mango. */}
          {sesion && (
            <span className="hc-garabatos" aria-hidden="true">
              <svg className="hc-g hc-g--engranaje-1" viewBox="0 0 40 40"><path d="M32.2 14.9L32.9 17.2L36.8 17.4L36.8 22.6L32.9 22.8L32.2 25.1L31.1 27.1L33.7 30.0L30.0 33.7L27.1 31.1L25.1 32.2L22.8 32.9L22.6 36.8L17.4 36.8L17.2 32.9L14.9 32.2L12.9 31.1L10.0 33.7L6.3 30.0L8.9 27.1L7.8 25.1L7.1 22.8L3.2 22.6L3.2 17.4L7.1 17.2L7.8 14.9L8.9 12.9L6.3 10.0L10.0 6.3L12.9 8.9L14.9 7.8L17.2 7.1L17.4 3.2L22.6 3.2L22.8 7.1L25.1 7.8L27.1 8.9L30.0 6.3L33.7 10.0L31.1 12.9Z" /><circle cx="20" cy="20" r="5" /></svg>
              <svg className="hc-g hc-g--engranaje-2" viewBox="0 0 40 40"><path d="M32.2 14.9L32.9 17.2L36.8 17.4L36.8 22.6L32.9 22.8L32.2 25.1L31.1 27.1L33.7 30.0L30.0 33.7L27.1 31.1L25.1 32.2L22.8 32.9L22.6 36.8L17.4 36.8L17.2 32.9L14.9 32.2L12.9 31.1L10.0 33.7L6.3 30.0L8.9 27.1L7.8 25.1L7.1 22.8L3.2 22.6L3.2 17.4L7.1 17.2L7.8 14.9L8.9 12.9L6.3 10.0L10.0 6.3L12.9 8.9L14.9 7.8L17.2 7.1L17.4 3.2L22.6 3.2L22.8 7.1L25.1 7.8L27.1 8.9L30.0 6.3L33.7 10.0L31.1 12.9Z" /><circle cx="20" cy="20" r="5" /></svg>
              <svg className="hc-g hc-g--llave" viewBox="0 0 40 40">
                <path d="M35.5 11.3A7.5 7.5 0 1 1 28.7 4.5L26.9 6.3L33.7 13.1Z" />
                <path d="M24.6 18.7L9.4 33.9A2.35 2.35 0 0 1 6.1 30.6L21.3 15.4" />
              </svg>
              {/* Solo en el ordenador (18-11-2026, pedido por el admin): más
                  garabatos alrededor de las tarjetas: otro engranaje grande y
                  uno pequeño que engranan, un destornillador y una tuerca. */}
              <svg className="hc-g hc-g--pc hc-g--engranaje-3" viewBox="0 0 40 40"><path d="M32.2 14.9L32.9 17.2L36.8 17.4L36.8 22.6L32.9 22.8L32.2 25.1L31.1 27.1L33.7 30.0L30.0 33.7L27.1 31.1L25.1 32.2L22.8 32.9L22.6 36.8L17.4 36.8L17.2 32.9L14.9 32.2L12.9 31.1L10.0 33.7L6.3 30.0L8.9 27.1L7.8 25.1L7.1 22.8L3.2 22.6L3.2 17.4L7.1 17.2L7.8 14.9L8.9 12.9L6.3 10.0L10.0 6.3L12.9 8.9L14.9 7.8L17.2 7.1L17.4 3.2L22.6 3.2L22.8 7.1L25.1 7.8L27.1 8.9L30.0 6.3L33.7 10.0L31.1 12.9Z" /><circle cx="20" cy="20" r="5" /></svg>
              <svg className="hc-g hc-g--pc hc-g--engranaje-4" viewBox="0 0 40 40"><path d="M32.2 14.9L32.9 17.2L36.8 17.4L36.8 22.6L32.9 22.8L32.2 25.1L31.1 27.1L33.7 30.0L30.0 33.7L27.1 31.1L25.1 32.2L22.8 32.9L22.6 36.8L17.4 36.8L17.2 32.9L14.9 32.2L12.9 31.1L10.0 33.7L6.3 30.0L8.9 27.1L7.8 25.1L7.1 22.8L3.2 22.6L3.2 17.4L7.1 17.2L7.8 14.9L8.9 12.9L6.3 10.0L10.0 6.3L12.9 8.9L14.9 7.8L17.2 7.1L17.4 3.2L22.6 3.2L22.8 7.1L25.1 7.8L27.1 8.9L30.0 6.3L33.7 10.0L31.1 12.9Z" /><circle cx="20" cy="20" r="5" /></svg>
              <svg className="hc-g hc-g--pc hc-g--destornillador" viewBox="0 0 40 40">
                <path d="M36.8 8.8L26.8 18.8A4 4 0 0 1 21.2 13.2L31.2 3.2A4 4 0 0 1 36.8 8.8Z" />
                <path d="M28.6 8.6l2.8 2.8M25.8 11.4l2.8 2.8M21.2 18.8L10 30M10 30l-3.5 3.5M7.6 29.6l2.8 2.8" />
              </svg>
              <svg className="hc-g hc-g--pc hc-g--tuerca" viewBox="0 0 40 40">
                <path d="M20 5l13 7.5v15L20 35 7 27.5v-15z" />
                <circle cx="20" cy="20" r="5.5" />
              </svg>
            </span>
          )}
          <p className={sesion ? "hc-pista hc-pista--sesion" : "hc-pista"} aria-hidden="true">
            <span className="hc-pista-celo" />
            <span className="hc-pista-titulo">{sesion ? "Tus herramientas" : "Así se aprende aquí"}</span>
            <span className="hc-pista-texto">{sesion ? "ábrelas desde aquí" : "toca una tarjeta y gírala"}</span>
            <SimboloEstudio tipo="flecha" color="naranja" giro={78} tamano={48} semilla={9} retraso={900} className="hc-pista-flecha" />
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
                      {/* Un dibujito de lo que hace cada herramienta, a rotulador
                          (18-11-2026, pedido por el admin: el interior era soso).
                          El del portfolio sube o baja según la rentabilidad real. */}
                      <span className="hc-herr-dibujo" aria-hidden="true">
                        {t.id === "portfolio" ? (
                          <svg viewBox="0 0 120 50">
                            <path className="hc-hd-base" d="M4 46H116" />
                            {portfolio && portfolio.rentabilidadPct < 0 ? (
                              <>
                                <path className="hc-hd-area" d="M6 10L26 16L42 12L60 26L78 22L96 34L114 40V46H6Z" />
                                <path className="hc-hd-linea" d="M6 10L26 16L42 12L60 26L78 22L96 34L114 40" />
                                <circle className="hc-hd-punto" cx="114" cy="40" r="4" />
                              </>
                            ) : (
                              <>
                                <path className="hc-hd-area" d="M6 38L26 30L42 34L60 20L78 24L96 10L114 6V46H6Z" />
                                <path className="hc-hd-linea" d="M6 38L26 30L42 34L60 20L78 24L96 10L114 6" />
                                <circle className="hc-hd-punto" cx="114" cy="6" r="4" />
                              </>
                            )}
                          </svg>
                        ) : t.id === "diario" ? (
                          <svg viewBox="0 0 120 50">
                            <circle className="hc-hd-bien" cx="9" cy="9" r="6" /><path className="hc-hd-marca" d="M6 9l2.2 2.2L12.5 6.5" /><path className="hc-hd-renglon" d="M22 9H96" />
                            <circle className="hc-hd-mal" cx="9" cy="25" r="6" /><path className="hc-hd-marca" d="M6.5 22.5l5 5M11.5 22.5l-5 5" /><path className="hc-hd-renglon" d="M22 25H78" />
                            <circle className="hc-hd-bien" cx="9" cy="41" r="6" /><path className="hc-hd-marca" d="M6 41l2.2 2.2L12.5 38.5" /><path className="hc-hd-renglon" d="M22 41H106" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 120 50">
                            <path className="hc-hd-camino" d="M12 30C24 18 32 40 44 28s22-14 32-2 18 10 30-6" />
                            <circle className="hc-hd-hecho" cx="12" cy="30" r="6.5" />
                            <circle className="hc-hd-hecho" cx="44" cy="28" r="6.5" />
                            <circle className="hc-hd-falta" cx="76" cy="26" r="6.5" />
                            <path className="hc-hd-roseta" d="M106 8l3 6.2 6.8.9-5 4.7 1.3 6.7-6.1-3.3-6.1 3.3 1.3-6.7-5-4.7 6.8-.9z" />
                          </svg>
                        )}
                      </span>
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
