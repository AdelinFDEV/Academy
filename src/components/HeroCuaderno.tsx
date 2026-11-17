import Tecla from "@/components/cuaderno/Tecla";
import Anotacion from "@/components/cuaderno/Anotacion";
import SimboloEstudio from "@/components/cuaderno/SimboloEstudio";
import TarjetaEstudio from "@/components/cuaderno/TarjetaEstudio";
import CaritaFeliz from "@/components/cuaderno/CaritaFeliz";
import "./hero-cuaderno.css";

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
 */
export default function HeroCuaderno({ guias, terminos, cursos }: {
  /** Guías publicadas. */
  guias: number;
  /** Términos del diccionario con página propia. */
  terminos: number;
  /** Cursos publicados: con 0, su pestaña no sale (tampoco sale su sección). */
  cursos: number;
}) {
  return (
    <section className="hc" aria-labelledby="hc-titulo">
      <div className="hc-inner">
        <div className="hc-texto">
          <p className="hc-nota">Educación cripto en español</p>
          <h1 id="hc-titulo" className="hc-titulo">
            Formación en criptomonedas <span className="fluor">sin perderte</span>,{" "}
            <Anotacion tipo="circle" retraso={350}>paso a paso</Anotacion>
          </h1>
          <p className="hc-lead">
            Guías gratuitas con ejercicios y un quiz final, y cursos con un camino claro: módulo a
            módulo, examen a examen, hasta tu certificado.
          </p>
          <div className="hc-acciones">
            <Tecla href="/guias" tamano="grande">Empezar gratis</Tecla>
            <Tecla href="/cursos" color="blanca" tamano="grande">Ver cursos</Tecla>
          </div>
        </div>

        <div className="hc-mesa-caja">
          {/* La nota va encima de las tarjetas y apunta a ellas (pedido por el
              admin el 17-11-2026: a la izquierda señalaba a la nada, y el
              alumno tiene que verla). Un pósit con su celo y una flecha a mano. */}
          <p className="hc-pista" aria-hidden="true">
            <span className="hc-pista-celo" />
            <span className="hc-pista-titulo">Así se aprende aquí</span>
            <span className="hc-pista-texto">toca una tarjeta y gírala</span>
            <SimboloEstudio tipo="flecha" color="naranja" giro={78} tamano={48} semilla={9} retraso={900} className="hc-pista-flecha" />
            {/* En el móvil, una carita feliz a su lado, como un emoji dibujado
                a mano (hero-cuaderno.css). No es un emoji de verdad: la web no
                los usa (ESTILO.md). Aparece con un saltito al verla. */}
            <CaritaFeliz className="hc-carita" retraso={1100} />
          </p>
          <div className="hc-mesa">
            <SimboloEstudio tipo="estrella" color="naranja" className="hc-garabato" tamano={46} semilla={5} retraso={700} />
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
              respuesta="Recompensa ÷ 2"
              detalle="Cada unos cuatro años, los mineros cobran la mitad por bloque."
            />
            <TarjetaEstudio
              className="hc-t3"
              color="menta"
              tema="Estrategia"
              pregunta="¿Qué es hacer DCA?"
              respuesta="Comprar poco a poco"
              detalle="La misma cantidad cada cierto tiempo, pase lo que pase con el precio."
            />
          </div>
        </div>
      </div>

      {/* El índice del cuaderno: enlaces a las secciones de esta página. */}
      <nav className="hc-indice" aria-label="Qué hay en la academia">
        <span className="hc-indice-rotulo" aria-hidden="true">en este cuaderno</span>
        <a href="#guias" className="hc-pestana hc-pestana--cielo">
          <b>{guias}</b> guías gratis
        </a>
        <a href="#diccionario" className="hc-pestana hc-pestana--amarillo">
          <b>{terminos}</b> términos explicados
        </a>
        {cursos > 0 && (
          <a href="#cursos" className="hc-pestana hc-pestana--lila">
            <b>{cursos}</b> {cursos === 1 ? "curso con certificado" : "cursos con certificado"}
          </a>
        )}
        <a href="#premium" className="hc-pestana hc-pestana--naranja">
          <b>3</b> piezas Premium
        </a>
      </nav>
    </section>
  );
}
