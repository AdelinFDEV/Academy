import Link from "next/link";
import { ArrowRight, Bookmark, Compass, Check } from "lucide-react";

/**
 * La llamada a la cuenta, arriba de cada ficha del diccionario.
 *
 * ── Dónde va, y por qué no más arriba ──────────────────────────────────────
 *
 * Debajo del título y la definición corta, nunca encima. Quien llega desde
 * Google buscando qué significa una palabra tiene que ver la respuesta antes
 * que una oferta; si lo primero es un banner, se vuelve al buscador y eso
 * Google lo mide. Así la definición responde en el primer vistazo y esto
 * aparece justo después, todavía sin hacer scroll en un portátil.
 *
 * ── Por qué la cuenta y no «ir al inicio» ──────────────────────────────────
 *
 * «Inicio» no es una llamada a la acción, es navegación: nadie la pulsa por lo
 * que le ofrece. La cuenta gratuita sí tiene un gancho, y además contextual —
 * **guardar términos** es una función que ya existe en esta misma página y que
 * solo funciona con sesión. Se pide algo ofreciendo algo.
 *
 * A quien ya ha entrado se le ofrece otra cosa. Enseñarle «crea tu cuenta» a
 * alguien que la tiene es la forma más rápida de parecer un robot.
 *
 * El vídeo del canal **no está aquí**: vive al final de la ficha, en
 * `TerminoVideo`. Dos ofertas juntas compiten y no gana ninguna.
 */

/** Lo que se lleva de verdad quien se registra. Nada que no exista ya. */
const VENTAJAS = [
  "Guarda los términos que vas aprendiendo",
  "Calculadoras de riesgo y de precio objetivo",
  "Watchlist con los precios de tus monedas",
];

export default function TerminoCta({
  termino,
  logueado,
}: {
  termino: string;
  logueado: boolean;
}) {
  if (logueado) {
    return (
      <aside className="tcta tcta--vuelto" aria-label="Sigue aprendiendo">
        <div>
          <p className="tcta-title">¿Te ha servido? Hay mucho más</p>
          <p className="tcta-sub">
            Las guías interactivas llevan estos conceptos a la práctica, con
            ejercicios y ejemplos reales.
          </p>
        </div>
        <Link href="/guias" className="tcta-btn">
          <Compass size={15} strokeWidth={2.2} aria-hidden="true" />
          Ver las guías
          <ArrowRight size={14} strokeWidth={2.4} aria-hidden="true" />
        </Link>
      </aside>
    );
  }

  return (
    <aside className="tcta" aria-label="Crear una cuenta gratuita">
      <div className="tcta-texto">
        <p className="tcta-title">
          Ya sabes qué es {termino}. Guárdalo y sigue.
        </p>
        <p className="tcta-sub">
          Crea tu cuenta gratis en menos de un minuto. Sin tarjeta y sin
          compromiso.
        </p>

        <ul className="tcta-ventajas">
          {VENTAJAS.map((v) => (
            <li key={v}>
              <Check size={13} strokeWidth={3} aria-hidden="true" />
              {v}
            </li>
          ))}
        </ul>
      </div>

      <div className="tcta-accion">
        <Link href="/register" className="tcta-btn">
          <Bookmark size={15} strokeWidth={2.2} aria-hidden="true" />
          Crear cuenta gratis
          <ArrowRight size={14} strokeWidth={2.4} aria-hidden="true" />
        </Link>
        <Link href="/login" className="tcta-ya">
          Ya tengo cuenta
        </Link>
      </div>
    </aside>
  );
}
