import Tecla from "@/components/cuaderno/Tecla";
import Anotacion from "@/components/cuaderno/Anotacion";
import TarjetaEstudio from "@/components/cuaderno/TarjetaEstudio";
import "./hero-cuaderno.css";

/**
 * El hero de la portada con el estilo «Cuaderno de estudio» (17-11-2026).
 * Es la PRIMERA sección de prueba del nuevo diseño (TAREAS.md): el admin la
 * aprueba antes de pasar al resto. Referencia: disenos/version-o-equilibrio.html.
 *
 * · Lleva el único <h1> de la portada, con la consulta del `title`
 *   («formación en criptomonedas»): visible, nunca escondido.
 * · Las tres tarjetas enseñan cómo se aprende aquí: se giran al pulsarlas.
 *   Su contenido es real y está en el HTML aunque nadie las gire.
 * · Sin cifras de alumnos, estrellas ni testimonios: no hay datos que los
 *   respalden (se quitaron de /premium el 06-11-2026 por inventados).
 * · El altavoz para silenciar los sonidos vive en la barra (SiteNav), que
 *   sale en todas las páginas.
 */
export default function HeroCuaderno() {
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
          <p className="hc-flecha" aria-hidden="true">← gira las tarjetas: así se aprende aquí</p>
        </div>

        <div className="hc-mesa">
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
    </section>
  );
}
