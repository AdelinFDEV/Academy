import Link from "next/link";
import { ArrowRight, Check, Lock } from "lucide-react";
import NovaMini from "@/components/NovaMini";

/**
 * Las llamadas al Diario de Trading dentro de la guía «Cómo hacer un diario de
 * trading» (11-11-2026, pedidas por el admin: quien llega aquí tiene que saber
 * que existen el Diario y Nova, y registrarse).
 *
 * Cuatro tamaños, de menos a más:
 *   · «aviso»: una línea bajo el hero, para que se sepa desde arriba.
 *   · «banner»: tras los 5 pasos, una franja con Nova y un botón.
 *   · «escaparate»: en «Dónde llevarlo», Nova en grande, lo que hace y un
 *     ejemplo de sus avisos.
 *   · «cierre»: tras el quiz, la última llamada, a todo lo ancho.
 *
 * El botón depende de quién mira: con Premium abre su diario; con cuenta sin
 * Premium va al pago; sin cuenta, a crear la cuenta gratis (y de ahí vuelve a
 * la ficha del Diario). Nunca se esconde que el Diario es de Premium.
 *
 * Todo lo que se promete aquí lo hace la herramienta de verdad
 * (src/components/trading/): no añadas nada sin comprobarlo antes.
 */

export type EstadoLector = "premium" | "cuenta" | "anonimo";

const FICHA = "/herramientas/diario";
const REGISTRO = `/register?next=${encodeURIComponent(FICHA)}`;

/** Lo que hace el Diario, sin adornos. Revisado contra el código el 11-11-2026. */
const HACE = [
  "Calcula solo tu win rate, tus múltiplos de R y tu esperanza con cada operación",
  "Curva de capital, calendario y desglose por par, estrategia, día y hora",
  "Cruza cómo te sientes cada día con lo que ganas o pierdes",
  "Nova lee tu diario y te avisa de riesgo alto, revancha, stops movidos y rachas",
  "Cada lunes, un objetivo para la semana según lo que más te cueste",
];

/** Avisos tal como los da Nova (reglas de tjNova.ts, con cifras de ejemplo). */
const AVISOS = [
  { tono: "is-ojo", texto: "Tras una pérdida volviste a entrar a los 12 minutos. La próxima vez, date al menos 60 minutos de aire." },
  { tono: "is-bien", texto: "Hace una semana te hablé del stop, y lo has corregido: tus últimas pérdidas se quedan en lo planeado." },
];

function Boton({ estado, precio, grande = false }: { estado: EstadoLector; precio: string; grande?: boolean }) {
  const clase = `dtg-cta-btn${grande ? " is-grande" : ""}`;
  if (estado === "premium") {
    return <Link href="/dashboard/trading" className={clase}>Abrir mi diario <ArrowRight size={18} aria-hidden="true" /></Link>;
  }
  if (estado === "cuenta") {
    // /api/checkout lleva al pago y vuelve solo (ver su ruta).
    return (
      <Link href="/api/checkout" prefetch={false} className={clase}>
        <Lock size={15} aria-hidden="true" /> Empezar mi diario · {precio}/mes <ArrowRight size={18} aria-hidden="true" />
      </Link>
    );
  }
  return <Link href={REGISTRO} className={clase}>Crear mi cuenta gratis <ArrowRight size={18} aria-hidden="true" /></Link>;
}

function Secundario({ estado }: { estado: EstadoLector }) {
  if (estado === "premium") return null;
  return <Link href={FICHA} className="dtg-cta-link">Ver el Diario por dentro <ArrowRight size={14} aria-hidden="true" /></Link>;
}

/** La letra pequeña, siempre a la vista: qué es gratis y qué es de pago. */
function Nota({ estado, precio }: { estado: EstadoLector; precio: string }) {
  if (estado === "premium") return <p className="dtg-cta-nota">Ya lo tienes incluido en tu Premium.</p>;
  return (
    <p className="dtg-cta-nota">
      La cuenta es gratis y sin tarjeta. El Diario y Nova van con Premium: {precio} al mes, sin permanencia, junto al
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
        <NovaMini size={30} face="happy" />
        <span>
          <strong>¿Prefieres que las cuentas se hagan solas?</strong> Conoce a Nova y el Diario de Trading de la academia
        </span>
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    );
  }

  if (variante === "banner") {
    return (
      <aside className="dtg-cta-banner" aria-label="El Diario de Trading de la academia">
        <span className="dtg-cta-banner-nova"><NovaMini size={64} face="happy" sigue /></span>
        <div className="dtg-cta-banner-texto">
          <span className="dtg-cta-ey">Hazlo con el Diario de la academia</span>
          <strong>Estos cinco pasos, hechos solos desde el primer día</strong>
          <p>Apuntas cada operación en un minuto. El Diario calcula las cifras y Nova, tu asistente, te dice qué corregir.</p>
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
      <aside className="dtg-cta-escaparate" aria-label="Nova y el Diario de Trading">
        <span className="dtg-cta-escaparate-brillo" aria-hidden="true" />
        <div className="dtg-cta-escaparate-nova">
          <span className="dtg-cta-escaparate-halo" aria-hidden="true" />
          <NovaMini size={150} face="happy" sigue />
          <div className="dtg-cta-avisos" aria-hidden="true">
            {AVISOS.map(a => (
              <p key={a.texto} className={`dtg-cta-aviso-msg ${a.tono}`}>
                <span>Nova</span>
                {a.texto}
              </p>
            ))}
          </div>
        </div>
        <div className="dtg-cta-escaparate-texto">
          <span className="dtg-cta-ey">La herramienta de la academia</span>
          <h3>Conoce a Nova: tu diario, leído por ti cada día</h3>
          <p>
            El Diario de Trading de AdelinBTC Academy hace todo lo que explica esta guía sin una sola fórmula. Y
            dentro vive Nova, una asistente que repasa tus operaciones cada vez que apuntas algo y te cuenta lo
            importante en frases cortas. Son reglas sobre tus propios datos, no una IA que se lo imagina.
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
      <span className="dtg-cta-escaparate-brillo" aria-hidden="true" />
      <span className="dtg-cta-cierre-nova"><NovaMini size={96} face="celebrate" sigue /></span>
      <span className="dtg-cta-ey">Ya sabes cómo hacerlo</span>
      <h2>Tu próxima operación, ya en tu diario</h2>
      <p>
        {estado === "premium"
          ? "Ya sabes cómo hacer un diario de trading, y el tuyo te espera con Nova. Apunta la próxima operación y deja que las cifras hablen."
          : "Ya sabes cómo hacer un diario de trading. Crea tu cuenta y empieza a llevarlo con el Diario de la academia: las cifras se calculan solas y Nova te avisa de lo que importa desde la primera operación."}
      </p>
      <div className="dtg-cta-acciones is-centro">
        <Boton estado={estado} precio={precio} grande />
        <Secundario estado={estado} />
      </div>
      <Nota estado={estado} precio={precio} />
    </aside>
  );
}
