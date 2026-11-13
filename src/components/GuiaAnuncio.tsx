import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { HERRAMIENTAS } from "@/lib/herramientas";
import { PREMIUM_PRICE_EUR, precioEur } from "@/lib/stripe";

/**
 * El anuncio de las guías: la llamada a una de las piezas de pago, colocada
 * dentro de una guía gratuita. Las guías traen el tráfico de Google; esto es
 * lo que convierte ese tráfico en cuentas y en Premium.
 *
 * Reglas (el detalle, en /admin/guias-instrucciones, bloque «Anuncios»):
 *  · Dos por guía como mínimo: uno «compacto» un poco antes de la mitad y una
 *    «tarjeta» al final, antes del quiz. Mucha gente no llega al final.
 *  · De productos distintos, elegidos por el tema de la guía.
 *  · Nunca antes de la respuesta: el primero va, como pronto, tras la segunda
 *    sección. Google mide a quien vuelve al buscador porque le recibió un anuncio.
 *  · Siempre con su imagen (`public/anuncios/`) y con un botón que diga qué pasa al pulsarlo.
 *  · El botón lleva a la ficha pública, no al pago: aquí se despierta el
 *    interés; la venta la hace la ficha.
 *  · Nunca se esconde que es de pago: el precio va siempre a la vista.
 *
 * Los textos están comprobados contra el código de cada herramienta
 * (13-11-2026). No añadas una ventaja sin abrir la herramienta y verla.
 */

export type EstadoLector = "premium" | "cuenta" | "anonimo";
export type ProductoAnuncio = "diario" | "portfolio" | "cursos" | "premium";

type Ficha = {
  etiqueta: string;
  titulo: string;
  texto: string;
  puntos: string[];
  boton: string;
  /** Página pública que lo explica: adonde va quien aún no lo tiene. */
  destino: string;
  /** La herramienta en sí, para quien ya es Premium. Ausente = no se le enseña nada. */
  dentro?: string;
  botonDentro?: string;
};

const destinoDe = (id: string) => {
  const h = HERRAMIENTAS.find((x) => x.id === id);
  return { destino: h?.paginaPublica ?? "/premium", dentro: h?.premiumHref };
};

const FICHAS: Record<ProductoAnuncio, Ficha> = {
  diario: {
    etiqueta: "Diario de Trading",
    titulo: "Lleva la cuenta de tus operaciones sin una sola fórmula",
    texto: "Apuntas cada operación en un minuto. El Diario calcula tus cifras y Nova, su asistente, te avisa de lo que repites.",
    puntos: [
      "Win rate, múltiplos de R y curva de capital, calculados solos",
      "Avisos de riesgo alto, revancha y stops movidos",
      "Un objetivo cada lunes, según lo que más te cueste",
    ],
    boton: "Ver el Diario por dentro",
    botonDentro: "Abrir mi diario",
    ...destinoDe("diario"),
  },
  portfolio: {
    etiqueta: "Portfolio Adelin",
    titulo: "Mira qué compro yo este ciclo, y a qué precio",
    texto: "Mi cartera real en spot, publicada entera: cada compra con su precio de entrada y lo que lleva hoy.",
    puntos: [
      "Cada posición con su precio de entrada",
      "Rentabilidad con precios en vivo",
      "También las posiciones que van en pérdidas",
    ],
    boton: "Ver mi cartera real",
    botonDentro: "Abrir el Portfolio",
    ...destinoDe("portfolio"),
  },
  cursos: {
    etiqueta: "Cursos con certificado",
    titulo: "Aprende esto paso a paso, con examen y certificado",
    texto: "Los cursos de la academia van por módulos, con examen en cada uno y certificado al terminar.",
    puntos: [
      "Lecciones cortas con ejercicios dentro",
      "Examen por módulo y examen final",
      "Certificado con tu nombre y tu nota",
    ],
    boton: "Ver todos los cursos",
    botonDentro: "Seguir con mis cursos",
    ...destinoDe("cursos"),
  },
  premium: {
    etiqueta: "AdelinBTC Premium",
    titulo: "Todo lo de la academia, en una sola suscripción",
    texto: "Las guías son gratis y lo seguirán siendo. Premium añade las herramientas y la formación completa.",
    puntos: [
      "Diario de Trading con Nova",
      "Portfolio Adelin, mi cartera real",
      "Todos los cursos, con certificado",
    ],
    boton: "Ver qué incluye Premium",
    destino: "/premium",
  },
};

/**
 * La imagen de cada anuncio: una ilustración por pieza, en
 * `public/anuncios/<producto>.webp` (800 × 598, generadas por el admin el
 * 13-11-2026). No llevan texto ni cifras a propósito: el titular lo pone el
 * anuncio, y una cifra dibujada sería una promesa de rentabilidad.
 *
 * Para cambiar una, se sustituye el archivo con el mismo nombre y tamaño.
 */
function Figura({ producto }: { producto: ProductoAnuncio }) {
  return (
    <div className="gan-figura" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/anuncios/${producto}.webp`} alt="" width={800} height={598} loading="lazy" decoding="async" />
    </div>
  );
}

export default function GuiaAnuncio({
  producto,
  estado,
  variante = "tarjeta",
}: {
  producto: ProductoAnuncio;
  estado: EstadoLector;
  /** «compacto»: a media guía. «tarjeta»: el grande, al final, antes del quiz. */
  variante?: "tarjeta" | "compacto";
}) {
  const f = FICHAS[producto];
  const esPremium = estado === "premium";

  // A quien ya paga no se le vende: o se le abre la puerta, o nada.
  if (esPremium && !f.dentro) return null;

  const href = esPremium && f.dentro ? f.dentro : f.destino;
  const boton = esPremium && f.botonDentro ? f.botonDentro : f.boton;
  const nota = esPremium ? "Incluido en tu Premium" : `Con Premium · ${precioEur(PREMIUM_PRICE_EUR)}/mes · sin permanencia`;
  const compacto = variante === "compacto";

  return (
    <aside className={`gan gan--${producto}${compacto ? " gan--compacto" : ""}`} aria-label={f.etiqueta}>
      <div className="gan-tarjeta">
        <Figura producto={producto} />
        <div className="gan-cuerpo">
          <span className="gan-etiqueta">{f.etiqueta}</span>
          <p className="gan-titulo">{f.titulo}</p>
          <p className="gan-texto">{f.texto}</p>
          {!compacto && (
            <ul className="gan-puntos">
              {f.puntos.map((p) => (
                <li key={p}><Check size={16} strokeWidth={2.8} aria-hidden="true" />{p}</li>
              ))}
            </ul>
          )}
          <div className="gan-accion">
            <Link href={href} className="gan-boton">{boton} <ArrowRight size={18} aria-hidden="true" /></Link>
            <span className="gan-nota">{nota}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
