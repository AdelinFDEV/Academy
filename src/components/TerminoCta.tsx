import { ArrowRight, Bookmark, Check } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";

/**
 * La llamada a crear cuenta, arriba de cada ficha del diccionario.
 *
 * ── El diseño: la colección de cromos (20-11-2026) ─────────────────────────
 *
 * El diccionario es un álbum de cromos (glosario.css), así que la oferta
 * también: arriba, un abanico de tres cromos; el de delante es el término
 * que se acaba de leer, en el color de su categoría, y los otros dos están
 * boca abajo con su «?», los que faltan. Una nota a mano dice «tu colección
 * empieza aquí». Debajo, el titular, las ventajas en fila y los botones.
 * Guardar términos existe de verdad (se ven en el dashboard): no promete un
 * álbum que no hay.
 *
 * ── Dónde va, y por qué no más arriba ──────────────────────────────────────
 *
 * Debajo del título y la definición corta, nunca encima. Quien llega desde
 * Google buscando qué significa una palabra tiene que ver la respuesta antes
 * que una oferta; si lo primero es un banner, se vuelve al buscador y eso
 * Google lo mide.
 *
 * ── Por qué la cuenta y no «ir al inicio» ──────────────────────────────────
 *
 * La cuenta gratuita tiene un gancho contextual: **guardar términos** es una
 * función que existe en esta misma página y que solo funciona con sesión.
 *
 * ── Y a quien ya tiene cuenta, NADA ────────────────────────────────────────
 *
 * Ya convirtió: cualquier bloque ahí solo compite con lo que ha venido a leer.
 * Lo único que sí le sirve —guardar el término— es un botón junto al título:
 * ver `GuardarTermino`. El vídeo del canal vive al final, en `TerminoVideo`.
 */

/** Lo que se lleva de verdad quien se registra. Nada que no exista ya. */
const VENTAJAS = [
  "Guarda los términos que aprendes",
  "El quiz de cada guía, con su logro",
  "La calculadora de precio, sin límite",
];

export default function TerminoCta({
  termino,
  categoria,
  etiquetaCategoria,
  logueado,
}: {
  termino: string;
  /** El id de la categoría (`defi`…): da el color al cromo de delante. */
  categoria: string;
  /** Cómo se escribe la categoría («DeFi»). */
  etiquetaCategoria: string;
  logueado: boolean;
}) {
  if (logueado) return null;

  return (
    <aside className="tcta" aria-label="Crear una cuenta gratuita">
      {/* El abanico de cromos: decoración, el texto lo dice todo. */}
      <div className="tcta-coleccion" aria-hidden="true">
        <span className="tcta-cromo tcta-cromo--dorso tcta-cromo--1">?</span>
        <span className="tcta-cromo tcta-cromo--dorso tcta-cromo--2">?</span>
        <span className={`tcta-cromo tcta-cromo--frente tcta-cromo--${categoria}`}>
          <span className="tcta-cromo-cat">{etiquetaCategoria}</span>
          <span className="tcta-cromo-nombre">{termino}</span>
          <span className="tcta-cromo-carton" />
        </span>
        <span className="tcta-nota">tu colección empieza aquí</span>
      </div>

      <div className="tcta-texto">
        <p className="tcta-title">Guarda «{termino}» y empieza tu colección</p>
        <p className="tcta-sub">Cuenta gratis en menos de un minuto. Sin tarjeta y sin compromiso.</p>

        <ul className="tcta-ventajas">
          {VENTAJAS.map((v) => (
            <li key={v}>
              <Check size={14} strokeWidth={3.4} aria-hidden="true" />
              {v}
            </li>
          ))}
        </ul>

        <div className="tcta-accion">
          <Tecla href="/register">
            <Bookmark size={16} strokeWidth={2.6} aria-hidden="true" />
            Crear cuenta gratis
            <ArrowRight size={16} strokeWidth={2.8} aria-hidden="true" />
          </Tecla>
          <Tecla href="/login" color="blanca" tamano="peq">
            Ya tengo cuenta
          </Tecla>
        </div>
      </div>
    </aside>
  );
}
