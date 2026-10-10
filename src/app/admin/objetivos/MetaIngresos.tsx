import { FUENTES, FUENTES_FUERA_DE_META, type Fuente, formatoES } from "@/lib/objetivos";
import type { DineroMes } from "@/lib/objetivosServidor";

/**
 * El gran objetivo: 1.000 € al mes viviendo de esto. Vive arriba de la
 * pestaña Objetivos, con sus etapas como paradas en el camino.
 *
 * Mide TODO lo ingresado en el mes según el libro de dinero (`movimientos`):
 * Premium cobrado por Stripe, lo apuntado en el cierre del día (YouTube,
 * trading, asesorías…), lo apuntado a mano y los ingresos fijos. Antes solo
 * contaba Premium (suscriptores × precio), y lo demás que ganabas no sumaba.
 *
 * Menos el sueldo del trabajo actual (FUENTES_FUERA_DE_META): la meta es poder
 * dejarlo, así que contarlo sería engañarse. Se enseña aparte, sin sumar.
 *
 * El mes en curso está a medias, así que se enseña también a qué ritmo va:
 * lo variable se proyecta al mes entero y lo fijo se cuenta tal cual.
 */

const META = 1000;

const ETAPAS = [
  { clave: "cien", emoji: "🌱", titulo: "Primeros 100 €", texto: "Un mes con 100 € de ingresos", objetivo: 100 },
  { clave: "quinientos", emoji: "🔥", titulo: "Medio camino", texto: "Un mes con 500 € de ingresos", objetivo: 500 },
  { clave: "meta", emoji: "🏆", titulo: `Meta ${formatoES(META)} €`, texto: `Un mes con ${formatoES(META)} € de ingresos`, objetivo: META },
];

function euros(n: number): string {
  return formatoES(n, { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

function nombreMes(mes: string): string {
  return new Date(`${mes}-01T00:00:00Z`).toLocaleDateString("es-ES", { month: "long", timeZone: "UTC" });
}

function mesAnterior(mes: string): string {
  const [a, m] = mes.split("-").map(Number);
  return new Date(Date.UTC(a, m - 2, 1)).toISOString().slice(0, 7);
}

function sumarMeses(mes: string, n: number): string {
  const [a, m] = mes.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1 + n, 1)).toISOString().slice(0, 7);
}

/** Meses completos que entran en la tendencia: los últimos, nunca el que va a medias. */
const MESES_TENDENCIA = 6;
const MESES_MINIMOS = 3;

/**
 * A qué ritmo crecen tus ingresos: la recta que mejor encaja con los últimos
 * meses completos (mínimos cuadrados), con los meses sin nada a cero. Con
 * menos de tres meses no se dice nada: dos puntos son una línea, no una
 * tendencia. Devuelve cuánto sube cada mes y, si sube, en qué mes llegarías.
 */
function tendencia(meses: DineroMes[], mesActual: string): { n: number; porMes: number; llegada: string | null } | null {
  const primero = meses.find((m) => m.total > 0)?.mes;
  if (!primero) return null;
  const serie: number[] = [];
  for (let mes = sumarMeses(mesActual, -MESES_TENDENCIA); mes < mesActual; mes = sumarMeses(mes, 1)) {
    if (mes >= primero) serie.push(meses.find((m) => m.mes === mes)?.total ?? 0);
  }
  const n = serie.length;
  if (n < MESES_MINIMOS) return null;
  const mx = (n - 1) / 2;
  const my = serie.reduce((s, v) => s + v, 0) / n;
  const pendiente = serie.reduce((s, v, i) => s + (i - mx) * (v - my), 0) / serie.reduce((s, _, i) => s + (i - mx) ** 2, 0);
  // Dónde está la recta en el último mes completo, y cuántos meses le faltan.
  const ahora = my + pendiente * (n - 1 - mx);
  const llegada = pendiente > 0 && ahora < META ? sumarMeses(mesAnterior(mesActual), Math.ceil((META - ahora) / pendiente)) : null;
  return { n, porMes: pendiente, llegada };
}

/** El mes sin lo que no cuenta para la meta (el trabajo), también en sus fijos. */
function paraLaMeta(m: DineroMes): DineroMes {
  const porFuente = { ...m.porFuente };
  const fijosPorFuente = { ...m.fijosPorFuente };
  let total = m.total;
  let fijos = m.fijos;
  for (const f of FUENTES_FUERA_DE_META) {
    total -= porFuente[f] ?? 0;
    fijos -= fijosPorFuente[f] ?? 0;
    delete porFuente[f];
    delete fijosPorFuente[f];
  }
  return { ...m, total: Math.round(total * 100) / 100, fijos: Math.round(fijos * 100) / 100, porFuente, fijosPorFuente };
}

export default function MetaIngresos({ meses: todos, hoy }: { meses: DineroMes[]; hoy: string }) {
  const mesActual = hoy.slice(0, 7);
  const meses = todos.map(paraLaMeta);
  // Lo que queda fuera este mes, para enseñarlo sin sumarlo.
  const fuera = FUENTES_FUERA_DE_META.map((f) => ({ f, total: todos.find((m) => m.mes === mesActual)?.porFuente[f] ?? 0 })).filter((x) => x.total > 0);
  const vacio = (mes: string): DineroMes => ({ mes, total: 0, fijos: 0, porFuente: {}, fijosPorFuente: {}, dias: 0 });
  const este = meses.find((m) => m.mes === mesActual) ?? vacio(mesActual);
  const anterior = meses.find((m) => m.mes === mesAnterior(mesActual)) ?? vacio(mesAnterior(mesActual));

  // A este ritmo: lo variable, al mes entero; lo fijo ya está entero.
  const [a, m] = mesActual.split("-").map(Number);
  const diasMes = new Date(Date.UTC(a, m, 0)).getUTCDate();
  const dia = Number(hoy.slice(8, 10));
  const proyeccion = dia < diasMes ? Math.round(este.fijos + ((este.total - este.fijos) * diasMes) / dia) : este.total;

  // El mejor mes, contando el actual: las etapas se cumplen una vez y quedan.
  const mejor = meses.reduce<DineroMes | null>((x, y) => (!x || y.total > x.total ? y : x), null);
  const record = Math.max(mejor?.total ?? 0, este.total);

  const ritmo = tendencia(meses, mesActual);
  const pct = Math.min(100, (este.total / META) * 100);
  const conseguida = este.total >= META;
  const siguiente = ETAPAS.find((e) => record < e.objetivo);
  const fuentes = (Object.keys(FUENTES) as Fuente[])
    .map((f) => ({ f, total: este.porFuente[f] ?? 0 }))
    .filter((x) => x.total > 0)
    .sort((x, y) => y.total - x.total);

  return (
    <section className={`obj-mrr${conseguida ? " obj-mrr--conseguida" : ""}`} aria-label={`El gran objetivo: ${euros(META)} al mes`}>
      <div className="obj-mrr-brillo" aria-hidden="true" />

      <header className="obj-mrr-cabeza">
        <span className="obj-mrr-ey">🏆 El gran objetivo</span>
        <h2 className="obj-mrr-titulo">
          {euros(META)} al mes <span>sumando todo lo que ganas</span>
        </h2>
      </header>

      <div className="obj-mrr-cuerpo">
        <div className="obj-mrr-principal">
          <span className="obj-mrr-emoji" aria-hidden="true">💵</span>
          <div className="obj-mrr-cifras">
            <span className="obj-mrr-etiqueta">Ingresos de {nombreMes(mesActual)}</span>
            <strong className="obj-mrr-valor">{euros(este.total)}</strong>
            <span className="obj-mrr-sub">
              {dia < diasMes && este.total > 0 ? `A este ritmo, unos ${euros(proyeccion)} · ` : ""}
              {nombreMes(anterior.mes)}: {euros(anterior.total)}
            </span>
          </div>
          <div className="obj-mrr-pct">
            <strong>{pct > 0 && pct < 10 ? pct.toFixed(1).replace(".", ",") : Math.round(pct)} %</strong>
            <span>del objetivo</span>
          </div>
        </div>

        {/* De dónde viene lo de este mes */}
        <div className="obj-mrr-embudo" aria-label={`De dónde vienen los ingresos de ${nombreMes(mesActual)}`}>
          {fuentes.length ? (
            fuentes.map((x) => (
              <div key={x.f}>
                <strong>{euros(x.total)}</strong>
                <span>{FUENTES[x.f].emoji} {FUENTES[x.f].texto}</span>
              </div>
            ))
          ) : (
            <div>
              <strong>0 €</strong>
              <span>Nada aún este mes</span>
            </div>
          )}
          {fuera.map((x) => (
            <div key={x.f} className="obj-mrr-fuera" title="El sueldo del trabajo no cuenta: la meta es poder dejarlo">
              <strong>{euros(x.total)}</strong>
              <span>{FUENTES[x.f].emoji} {FUENTES[x.f].texto} · no cuenta</span>
            </div>
          ))}
        </div>
      </div>

      {/* El camino: la barra del mes con las etapas como paradas en su sitio real */}
      <div className="obj-mrr-camino">
        <div className="obj-mrr-pista">
          <div className="obj-mrr-relleno" style={{ width: `${Math.max(pct, 0.8)}%` }} />
          {ETAPAS.map((e) => (
            <span
              key={e.clave}
              className={`obj-mrr-parada${record >= e.objetivo ? " obj-mrr-parada--hecha" : ""}${siguiente?.clave === e.clave ? " obj-mrr-parada--siguiente" : ""}`}
              style={{ left: `${(e.objetivo / META) * 100}%` }}
              title={`${e.titulo}: ${euros(e.objetivo)} en un mes`}
            >
              <span aria-hidden="true">{e.emoji}</span>
            </span>
          ))}
        </div>
        {/* Solo los extremos: lo que llevas ya está en grande arriba, y en el centro pisaba la parada de los 500 € */}
        <div className="obj-mrr-camino-pie">
          <span>0 €</span>
          <span>{euros(META)}</span>
        </div>
      </div>

      {/* Qué falta, en una frase */}
      <p className="obj-mrr-falta">
        {conseguida ? (
          <>🎉 <strong>¡Objetivo conseguido!</strong> En {nombreMes(mesActual)} llevas {euros(este.total)}.</>
        ) : (
          <>
            {este.total > 0 ? (
              <>👉 Te faltan <strong>{euros(META - este.total)}</strong> este mes para los {euros(META)}.</>
            ) : (
              <>👉 Este mes aún no ha entrado nada que cuente para la meta.</>
            )}
            {dia < diasMes && este.total > 0 && (
              <>
                {" "}A este ritmo cerrarías {nombreMes(mesActual)} en unos <strong>{euros(proyeccion)}</strong>
                {proyeccion >= META ? ": vas camino de conseguirlo." : "."}
              </>
            )}
            {mejor && mejor.total > 0 && mejor.mes !== mesActual && ` Tu mejor mes: ${nombreMes(mejor.mes)} ${mejor.mes.slice(0, 4)}, con ${euros(mejor.total)}.`}
          </>
        )}
      </p>

      {/* A este paso: la tendencia de los últimos meses completos */}
      {ritmo && !conseguida && (
        <p className={`obj-mrr-ritmo${ritmo.llegada ? "" : " obj-mrr-ritmo--plano"}`}>
          {ritmo.llegada ? (
            <>
              📈 En los últimos {ritmo.n} meses tus ingresos suben unos <strong>{euros(ritmo.porMes)} al mes</strong>. A este paso
              llegarías a los {euros(META)} hacia <strong>{nombreMes(ritmo.llegada)} de {ritmo.llegada.slice(0, 4)}</strong>.
            </>
          ) : (
            <>
              ⚖️ En los últimos {ritmo.n} meses tus ingresos {ritmo.porMes < 0 ? `bajan unos ${euros(-ritmo.porMes)} al mes` : "no crecen"}: a este
              paso no llegas a los {euros(META)}. Lo que cambie la tendencia es lo que hay que buscar.
            </>
          )}
        </p>
      )}

      <ol className="obj-mrr-etapas">
        {ETAPAS.map((e, i) => {
          const hecha = record >= e.objetivo;
          const esSiguiente = siguiente?.clave === e.clave;
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
                  <div style={{ width: `${Math.min(100, (record / e.objetivo) * 100)}%` }} />
                </div>
                <span className="obj-mrr-etapa-cifra">
                  Mejor mes: {euros(record)} / {euros(e.objetivo)}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
