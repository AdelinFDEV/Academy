import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import NovaMini from "@/components/NovaMini";
import { HERRAMIENTAS } from "@/lib/herramientas";
import { PREMIUM_PRICE_EUR, precioEur } from "@/lib/stripe";

/**
 * El «mini anuncio» de las guías: una llamada discreta a una de las piezas de
 * pago, colocada dentro de una guía gratuita. Las guías traen el tráfico de
 * Google; esto es lo que convierte ese tráfico en cuentas y en Premium.
 *
 * Reglas (el detalle, en /admin/guias-instrucciones, bloque «Mini anuncios»):
 *  · Nunca antes de la respuesta: el primero va, como pronto, tras la segunda
 *    sección. Google mide a quien vuelve al buscador porque le recibió un anuncio.
 *  · Como mucho dos por guía, y de productos distintos.
 *  · El producto se elige por el tema de la sección, no al azar.
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
    boton: "Ver cómo es el Portfolio",
    botonDentro: "Abrir el Portfolio",
    ...destinoDe("portfolio"),
  },
  cursos: {
    etiqueta: "Cursos con certificado",
    titulo: "¿Quieres aprenderlo paso a paso?",
    texto: "Los cursos de la academia van por módulos, con examen en cada uno y certificado al terminar.",
    puntos: [
      "Lecciones cortas con ejercicios dentro",
      "Examen por módulo y examen final",
      "Certificado con tu nombre y tu nota",
    ],
    boton: "Ver los cursos",
    botonDentro: "Ir a mis cursos",
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

export default function GuiaAnuncio({
  producto,
  estado,
  variante = "tarjeta",
}: {
  producto: ProductoAnuncio;
  estado: EstadoLector;
  /** «tarjeta»: entre secciones. «linea»: una franja fina, para el final de un párrafo largo. */
  variante?: "tarjeta" | "linea";
}) {
  const f = FICHAS[producto];
  const esPremium = estado === "premium";

  // A quien ya paga no se le vende: o se le abre la puerta, o nada.
  if (esPremium && !f.dentro) return null;

  const href = esPremium && f.dentro ? f.dentro : f.destino;
  const boton = esPremium && f.botonDentro ? f.botonDentro : f.boton;
  const precio = precioEur(PREMIUM_PRICE_EUR);
  const nota = esPremium ? "Incluido en tu Premium" : `Con Premium · ${precio}/mes · sin permanencia`;

  if (variante === "linea" || esPremium) {
    return (
      <aside className="gan gan--linea" aria-label={f.etiqueta}>
        <Link href={href} className="gan-linea">
          <span className="gan-etiqueta">{f.etiqueta}</span>
          <span className="gan-linea-texto">{esPremium ? f.titulo : f.texto}</span>
          <span className="gan-linea-ir">{boton} <ArrowRight size={15} aria-hidden="true" /></span>
        </Link>
      </aside>
    );
  }

  return (
    <aside className="gan" aria-label={f.etiqueta}>
      <div className="gan-tarjeta">
        {producto === "diario" && (
          <span className="gan-figura" aria-hidden="true"><NovaMini size={84} face="happy" /></span>
        )}
        <div className="gan-cuerpo">
          <span className="gan-etiqueta">{f.etiqueta}</span>
          <p className="gan-titulo">{f.titulo}</p>
          <p className="gan-texto">{f.texto}</p>
          <ul className="gan-puntos">
            {f.puntos.map((p) => (
              <li key={p}><Check size={15} strokeWidth={2.6} aria-hidden="true" />{p}</li>
            ))}
          </ul>
        </div>
        <div className="gan-accion">
          <Link href={href} className="gan-boton">{boton} <ArrowRight size={17} aria-hidden="true" /></Link>
          <span className="gan-nota">{nota}</span>
        </div>
      </div>
    </aside>
  );
}
