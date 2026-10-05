import { PREMIUM_PRICE_EUR, precioEur } from "@/lib/stripe";

/**
 * El gran objetivo de la web: 1.000 €/mes de ingresos recurrentes solo con la
 * academia. Vive arriba de la pestaña Objetivos, con sus tres etapas como
 * paradas en el camino.
 *
 * MRR estimado = usuarios premium × precio. Sin administradores en ninguna
 * cifra, igual que /admin y /admin/premium.
 */

const META_MRR = 1000;
const PREMIUM_META = Math.ceil(META_MRR / PREMIUM_PRICE_EUR);

/** Conversión de referencia cuando aún no hay ninguna propia (registrado → premium). */
const CONVERSION_REFERENCIA = 0.05;

const ETAPAS = [
  { clave: "primero", emoji: "🌱", titulo: "Primer Premium", texto: "Tu primer suscriptor", objetivo: 1 },
  { clave: "diez", emoji: "🔥", titulo: "Club de los 10", texto: "10 usuarios premium", objetivo: 10 },
  { clave: "meta", emoji: "🏆", titulo: `Meta ${META_MRR.toLocaleString("es-ES")} €`, texto: `${PREMIUM_META} premium · ${META_MRR.toLocaleString("es-ES")} €/mes`, objetivo: PREMIUM_META },
];

function euros(n: number): string {
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

function numero(n: number): string {
  return n.toLocaleString("es-ES");
}

export default function MetaIngresos({ registrados, premium }: { registrados: number; premium: number }) {
  const mrr = premium * PREMIUM_PRICE_EUR;
  const pct = Math.min(100, (mrr / META_MRR) * 100);
  const conseguida = mrr >= META_MRR;
  const conversion = registrados ? premium / registrados : 0;
  const siguiente = ETAPAS.find((e) => premium < e.objetivo);
  const faltanSiguiente = siguiente ? siguiente.objetivo - premium : 0;

  // Cuántos registrados harían falta para la meta: con tu conversión si ya la
  // tienes, o con una de referencia del 5 % si aún no hay ningún premium.
  const tasa = conversion > 0 ? conversion : CONVERSION_REFERENCIA;
  const registradosMeta = Math.ceil(PREMIUM_META / tasa);
  const faltanRegistrados = Math.max(0, registradosMeta - registrados);

  return (
    <section className={`obj-mrr${conseguida ? " obj-mrr--conseguida" : ""}`} aria-label="El gran objetivo: 1.000 € al mes">
      <div className="obj-mrr-brillo" aria-hidden="true" />

      <header className="obj-mrr-cabeza">
        <span className="obj-mrr-ey">🏆 El gran objetivo</span>
        <h2 className="obj-mrr-titulo">
          {euros(META_MRR)} al mes <span>solo con la academia</span>
        </h2>
      </header>

      <div className="obj-mrr-cuerpo">
        <div className="obj-mrr-principal">
          <span className="obj-mrr-emoji" aria-hidden="true">💵</span>
          <div className="obj-mrr-cifras">
            <span className="obj-mrr-etiqueta">MRR estimado</span>
            <strong className="obj-mrr-valor">
              {euros(mrr)}<small>/mes</small>
            </strong>
            <span className="obj-mrr-sub">
              {premium} suscripci{premium === 1 ? "ón" : "ones"} premium × {precioEur(PREMIUM_PRICE_EUR)}
            </span>
          </div>
          <div className="obj-mrr-pct">
            <strong>{pct > 0 && pct < 10 ? pct.toFixed(1).replace(".", ",") : Math.round(pct)} %</strong>
            <span>del objetivo</span>
          </div>
        </div>

        <div className="obj-mrr-embudo" aria-label="Embudo de usuarios">
          <div><strong>{numero(registrados)}</strong><span>Registrados</span></div>
          <span className="obj-mrr-flecha" aria-hidden="true">›</span>
          <div><strong>{numero(registrados - premium)}</strong><span>Free</span></div>
          <span className="obj-mrr-flecha" aria-hidden="true">›</span>
          <div className="obj-mrr-embudo-premium"><strong>{numero(premium)}</strong><span>Premium</span></div>
          <div className="obj-mrr-conversion">
            <strong>{(conversion * 100).toLocaleString("es-ES", { maximumFractionDigits: 1 })} %</strong>
            <span>Conversión</span>
          </div>
        </div>
      </div>

      {/* El camino: la barra con las tres etapas como paradas en su sitio real */}
      <div className="obj-mrr-camino">
        <div className="obj-mrr-pista">
          <div className="obj-mrr-relleno" style={{ width: `${Math.max(pct, 0.8)}%` }} />
          {ETAPAS.map((e) => {
            const pos = Math.min(100, ((e.objetivo * PREMIUM_PRICE_EUR) / META_MRR) * 100);
            const hecha = premium >= e.objetivo;
            return (
              <span
                key={e.clave}
                className={`obj-mrr-parada${hecha ? " obj-mrr-parada--hecha" : ""}${siguiente?.clave === e.clave ? " obj-mrr-parada--siguiente" : ""}`}
                style={{ left: `${pos}%` }}
                title={`${e.titulo}: ${e.objetivo} premium · ${euros(e.objetivo * PREMIUM_PRICE_EUR)}/mes`}
              >
                <span aria-hidden="true">{e.emoji}</span>
              </span>
            );
          })}
        </div>
        <div className="obj-mrr-camino-pie">
          <span>0 €</span>
          <span>{euros(mrr)} de {euros(META_MRR)}</span>
          <span>{euros(META_MRR)}</span>
        </div>
      </div>

      {/* Qué falta, en una frase */}
      <p className="obj-mrr-falta">
        {conseguida ? (
          <>🎉 <strong>¡Objetivo conseguido!</strong> La academia ya genera {euros(mrr)} al mes.</>
        ) : (
          <>
            👉 Siguiente: <strong>{siguiente?.titulo}</strong>, te falta{faltanSiguiente === 1 ? "" : "n"}{" "}
            <strong>{faltanSiguiente} usuario{faltanSiguiente === 1 ? "" : "s"} premium</strong>.
            {" "}Para la meta necesitas {PREMIUM_META} premium: con {conversion > 0 ? "tu conversión actual" : "una conversión del 5 %"}{" "}
            serían unos <strong>{numero(registradosMeta)} registrados</strong>
            {faltanRegistrados > 0 ? ` (${numero(faltanRegistrados)} más que ahora)` : ""}.
          </>
        )}
      </p>

      <ol className="obj-mrr-etapas">
        {ETAPAS.map((e, i) => {
          const hecha = premium >= e.objetivo;
          const esSiguiente = siguiente?.clave === e.clave;
          const avance = Math.min(100, (premium / e.objetivo) * 100);
          return (
            <li
              key={e.clave}
              className={`obj-mrr-etapa${hecha ? " obj-mrr-etapa--hecha" : ""}${esSiguiente ? " obj-mrr-etapa--siguiente" : ""}`}
            >
              <span className="obj-mrr-etapa-num">{hecha ? "✓" : i + 1}</span>
              <span className="obj-mrr-etapa-emoji" aria-hidden="true">{e.emoji}</span>
              <div className="obj-mrr-etapa-cuerpo">
                <div className="obj-mrr-etapa-linea">
                  <strong>{e.titulo}</strong>
                  {hecha ? (
                    <span className="obj-mrr-etapa-estado obj-mrr-etapa-estado--ok">✅ Conseguido</span>
                  ) : esSiguiente ? (
                    <span className="obj-mrr-etapa-estado">👉 Siguiente</span>
                  ) : (
                    <span className="obj-mrr-etapa-estado obj-mrr-etapa-estado--off">🔒 Después</span>
                  )}
                </div>
                <span className="obj-mrr-etapa-texto">{e.texto}</span>
                <div className="obj-mrr-etapa-barra">
                  <div style={{ width: `${avance}%` }} />
                </div>
                <span className="obj-mrr-etapa-cifra">
                  {premium} / {e.objetivo} premium · {euros(e.objetivo * PREMIUM_PRICE_EUR)}/mes
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
