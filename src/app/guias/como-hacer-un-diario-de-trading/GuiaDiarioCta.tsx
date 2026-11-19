import Link from "next/link";
import { ArrowRight, Check, NotebookPen } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import TeclaPremium from "@/components/cuaderno/TeclaPremium";

/**
 * Las llamadas al Diario de Trading dentro de la guía «Cómo hacer un diario de
 * trading» (11-11-2026, pedidas por el admin: quien llega aquí tiene que saber
 * que existe el Diario, y registrarse).
 *
 * Cuatro tamaños, de menos a más:
 *   · «aviso»: una línea bajo el hero, para que se sepa desde arriba.
 *   · «banner»: tras los 5 pasos, una franja con el cuaderno y un botón.
 *   · «escaparate»: en «Dónde llevarlo», lo que hace el Diario y dos
 *     cifras de ejemplo de las que calcula.
 *   · «cierre»: tras el quiz, la última llamada, a todo lo ancho.
 *
 * El botón depende de quién mira: con Premium abre su diario; con cuenta sin
 * Premium va al pago; sin cuenta, a crear la cuenta gratis (y de ahí vuelve a
 * la ficha del Diario). Nunca se esconde que el Diario es de Premium.
 *
 * Todo lo que se promete aquí lo hace la herramienta de verdad
 * (src/components/trading/): no añadas nada sin comprobarlo antes. El Diario
 * calcula y enseña cifras; no da avisos ni consejos en frases, así que aquí
 * no se promete ninguno.
 */

export type EstadoLector = "premium" | "cuenta" | "anonimo";

const FICHA = "/herramientas/diario";
const REGISTRO = `/register?next=${encodeURIComponent(FICHA)}`;

/** Lo que hace el Diario, sin adornos. Revisado contra el código el 18-11-2026. */
const HACE = [
  "Calcula solo tu win rate, tus múltiplos de R y tu esperanza con cada operación",
  "Curva de capital, calendario y desglose por par, estrategia, día y hora",
  "Cruza cómo te sientes cada día con lo que ganas o pierdes",
  "Mide tu riesgo en % de la cuenta y marca cada operación que pasa del 2 %",
  "Compara lo que planeaste con lo que hiciste: objetivo conseguido y pérdida frente al stop",
];

/**
 * Dos cifras de «Riesgo y ejecución» tal como salen en la pestaña Análisis
 * (TjAnalysis.tsx: mismos nombres y mismas frases), con valores de ejemplo.
 */
const EJEMPLOS = [
  { tono: "is-ojo", nombre: "Objetivo conseguido", texto: "62 % del objetivo te llevas de media en tus ganadoras." },
  { tono: "is-bien", nombre: "Pérdida frente al stop", texto: "1,00×: pierdes lo que planeaste, ni un dólar más." },
];

/** La acción principal: una tecla naranja (ESTILO.md: una por bloque). */
function Boton({ estado, precio, grande = false }: { estado: EstadoLector; precio: string; grande?: boolean }) {
  const tamano = grande ? "grande" : "normal";
  if (estado === "premium") {
    return <Tecla href="/dashboard/trading" color="naranja" tamano={tamano} className="dtg-cta-btn">Abrir mi diario <ArrowRight size={18} aria-hidden="true" /></Tecla>;
  }
  if (estado === "cuenta") {
    // /api/checkout lleva al pago y vuelve solo (ver su ruta).
    return (
      <TeclaPremium tamano={tamano} className="dtg-cta-btn">Empezar mi diario · {precio}/mes</TeclaPremium>
    );
  }
  return <Tecla href={REGISTRO} color="naranja" tamano={tamano} className="dtg-cta-btn">Crear mi cuenta gratis <ArrowRight size={18} aria-hidden="true" /></Tecla>;
}

/** La secundaria, en el azul del Diario. */
function Secundario({ estado }: { estado: EstadoLector }) {
  if (estado === "premium") return null;
  return <Tecla href={FICHA} color="azul" tamano="peq" className="dtg-cta-link">Ver el Diario por dentro <ArrowRight size={14} aria-hidden="true" /></Tecla>;
}

/** La letra pequeña, siempre a la vista: qué es gratis y qué es de pago. */
function Nota({ estado, precio }: { estado: EstadoLector; precio: string }) {
  if (estado === "premium") return <p className="dtg-cta-nota">Ya lo tienes incluido en tu Premium.</p>;
  return (
    <p className="dtg-cta-nota">
      La cuenta es gratis y sin tarjeta. El Diario va con Premium: {precio} al mes, sin permanencia, junto al
      Portfolio Adelin y todos los cursos.
    </p>
  );
}

export default function GuiaDiarioCta({ variante, estado, precio }: {
  variante: "aviso" | "banner" | "escaparate" | "cierre";
  estado: EstadoLector;
  precio: string;
}) {
  if (variante === "aviso") {
    return (
      <Link href={estado === "premium" ? "/dashboard/trading" : FICHA} className="dtg-cta-aviso">
        <span className="dtg-cta-aviso-icono" aria-hidden="true"><NotebookPen size={16} /></span>
        <span>
          <strong>¿Prefieres que las cuentas se hagan solas?</strong> Conoce el Diario de Trading de la academia
        </span>
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    );
  }

  if (variante === "banner") {
    return (
      <aside className="dtg-cta-banner" aria-label="El Diario de Trading de la academia">
        <span className="dtg-cta-banner-icono" aria-hidden="true"><NotebookPen size={40} strokeWidth={2.2} /></span>
        <div className="dtg-cta-banner-texto">
          <span className="dtg-cta-ey">Hazlo con el Diario de la academia</span>
          <strong>Estos cinco pasos, hechos solos desde el primer día</strong>
          <p>Apuntas cada operación en un minuto. El Diario calcula las cifras y te enseña dónde ganas, dónde pierdes y si cumples tu plan.</p>
        </div>
        <div className="dtg-cta-banner-acciones">
          <Boton estado={estado} precio={precio} />
          <Secundario estado={estado} />
        </div>
      </aside>
    );
  }

  if (variante === "escaparate") {
    return (
      <aside className="dtg-cta-escaparate" aria-label="El Diario de Trading por dentro">
        <div className="dtg-cta-escaparate-lado">
          <span className="dtg-cta-escaparate-icono" aria-hidden="true"><NotebookPen size={72} strokeWidth={2} /></span>
          <div className="dtg-cta-ejemplos" aria-hidden="true">
            {EJEMPLOS.map(e => (
              <p key={e.nombre} className={`dtg-cta-ejemplo ${e.tono}`}>
                <span>{e.nombre}</span>
                {e.texto}
              </p>
            ))}
          </div>
        </div>
        <div className="dtg-cta-escaparate-texto">
          <span className="dtg-cta-ey">La herramienta de la academia</span>
          <h3>Tu diario de trading, con las cuentas ya hechas</h3>
          <p>
            El Diario de Trading de AdelinBTC Academy hace todo lo que explica esta guía sin una sola fórmula. Tú
            apuntas la operación y él pone las cifras al momento: tu acierto, tu esperanza, tu riesgo y cuánto te
            alejas de tu plan. Son cálculos sobre tus propios datos, no una IA que se lo imagina.
          </p>
          <ul>
            {HACE.map(h => <li key={h}><Check size={16} strokeWidth={2.6} aria-hidden="true" />{h}</li>)}
          </ul>
          <div className="dtg-cta-acciones">
            <Boton estado={estado} precio={precio} grande />
            <Secundario estado={estado} />
          </div>
          <Nota estado={estado} precio={precio} />
        </div>
      </aside>
    );
  }

  return (
    <aside className="dtg-cta-cierre" aria-label="Empieza tu diario">
      <span className="dtg-cta-cierre-icono" aria-hidden="true"><NotebookPen size={56} strokeWidth={2.2} /></span>
      <span className="dtg-cta-ey">Ya sabes cómo hacerlo</span>
      <h2>Tu próxima operación, ya en tu diario</h2>
      <p>
        {estado === "premium"
          ? "Ya sabes cómo hacer un diario de trading, y el tuyo te espera. Apunta la próxima operación y deja que las cifras hablen."
          : "Ya sabes cómo hacer un diario de trading. Crea tu cuenta y empieza a llevarlo con el Diario de la academia: las cifras se calculan solas desde la primera operación."}
      </p>
      <div className="dtg-cta-acciones is-centro">
        <Boton estado={estado} precio={precio} grande />
        <Secundario estado={estado} />
      </div>
      <Nota estado={estado} precio={precio} />
    </aside>
  );
}
