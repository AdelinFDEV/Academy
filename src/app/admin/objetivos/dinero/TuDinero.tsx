"use client";

import { FUENTES, type Fuente, formatoES } from "@/lib/objetivos";
import type { DineroMes } from "@/lib/objetivosServidor";
import { nombreMes } from "../editor";

/**
 * «Tu dinero»: todo lo ingresado, por meses (cierre del día, Stripe, lo
 * apuntado a mano y los fijos). El primer bloque de la pestaña Dinero.
 *
 * Sin gráfica de ingresos por mes: la de «Ganancias y gastos», justo debajo,
 * ya los enseña junto a los gastos, y tener dos con los mismos datos solo
 * hacía la pestaña más larga.
 */

function euros(n: number): string {
  return formatoES(n, { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

const MEDALLAS = ["🥇", "🥈", "🥉"];

export default function TuDinero({ meses, hoy }: { meses: DineroMes[]; hoy: string }) {
  const mesActual = hoy.slice(0, 7);
  const [a, m] = mesActual.split("-").map(Number);
  const mesAnterior = new Date(Date.UTC(a, m - 2, 1)).toISOString().slice(0, 7);

  if (!meses.length) {
    return (
      <section className="crec-bloque crec-bloque--dinero">
        <h3 className="crec-bloque-titulo"><span aria-hidden="true">💶</span> Tu dinero</h3>
        <div className="obj-vacio-grande">
          <span className="obj-vacio-emoji" aria-hidden="true">💶</span>
          <strong>Empieza a apuntar lo que ganas</strong>
          <p>
            En el Calendario, pulsa el número de un día y ciérralo: productividad y dinero por fuente. Premium llega
            solo desde Stripe. Aquí verás tu mes récord, tu media y de dónde viene cada euro.
          </p>
        </div>
      </section>
    );
  }

  const total = meses.reduce((s, x) => s + x.total, 0);
  const este = meses.find((x) => x.mes === mesActual)?.total ?? 0;
  const anterior = meses.find((x) => x.mes === mesAnterior)?.total ?? 0;
  const record = meses.reduce((r, x) => (x.total > r.total ? x : r));
  const media = total / meses.length;
  const podio = [...meses].sort((x, y) => y.total - x.total).slice(0, 3).filter((x) => x.total > 0);

  const porFuente = (Object.keys(FUENTES) as Fuente[])
    .map((f) => ({ f, total: meses.reduce((s, x) => s + (x.porFuente[f] ?? 0), 0) }))
    .filter((x) => x.total > 0)
    .sort((x, y) => y.total - x.total);

  return (
    <section className="crec-bloque crec-bloque--dinero">
      <h3 className="crec-bloque-titulo"><span aria-hidden="true">💶</span> Tu dinero</h3>

      <div className="obj-tiles crec-tiles--dinero">
        <div className="obj-tile obj-tile--destacado">
          <span className="obj-tile-emoji" aria-hidden="true">💰</span>
          <span className="cp-card-label">Este mes</span>
          <strong className="cp-card-value">{euros(este)}</strong>
          <span className="cp-card-foot">
            {anterior > 0
              ? `${este >= anterior ? "📈 +" : "📉 "}${Math.round(((este - anterior) / anterior) * 100)} % frente a ${nombreMes(mesAnterior, true)}`
              : nombreMes(mesActual)}
          </span>
        </div>
        <div className="obj-tile obj-tile--record">
          <span className="obj-tile-emoji" aria-hidden="true">🏆</span>
          <span className="cp-card-label">Mejor mes</span>
          <strong className="cp-card-value">{euros(record.total)}</strong>
          <span className="cp-card-foot">
            {nombreMes(record.mes)}
            {record.mes === mesActual ? " · ¡es este!" : este > 0 ? ` · este mes vas al ${Math.round((este / record.total) * 100)} %` : ""}
          </span>
        </div>
        <div className="obj-tile">
          <span className="obj-tile-emoji" aria-hidden="true">📊</span>
          <span className="cp-card-label">Media mensual</span>
          <strong className="cp-card-value">{euros(media)}</strong>
          <span className="cp-card-foot">en {meses.length} mes{meses.length === 1 ? "" : "es"} con datos</span>
        </div>
        <div className="obj-tile">
          <span className="obj-tile-emoji" aria-hidden="true">🏦</span>
          <span className="cp-card-label">Total ganado</span>
          <strong className="cp-card-value">{euros(total)}</strong>
          <span className="cp-card-foot">desde {nombreMes(meses[0].mes)}</span>
        </div>
      </div>

      <div className="obj-graficas-fila">
        <figure className="obj-grafica">
          <figcaption className="obj-grafica-titulo">Tus mejores meses</figcaption>
          <ol className="crec-podio">
            {podio.map((x, i) => (
              <li key={x.mes} className={`crec-podio-puesto crec-podio-puesto--${i + 1}`}>
                <span className="crec-podio-medalla" aria-hidden="true">{MEDALLAS[i]}</span>
                <span className="crec-podio-mes">{nombreMes(x.mes)}</span>
                <strong>{euros(x.total)}</strong>
              </li>
            ))}
          </ol>
        </figure>

        <figure className="obj-grafica">
          <figcaption className="obj-grafica-titulo">De dónde viene tu dinero</figcaption>
          <div className="obj-mes-fuentes">
            {porFuente.map((x) => (
              <div key={x.f} className="obj-mes-fuente">
                <span className="obj-mes-fuente-nombre"><span aria-hidden="true">{FUENTES[x.f].emoji}</span> {FUENTES[x.f].texto}</span>
                <div className="obj-barra obj-barra--fina">
                  <div className="obj-barra-relleno obj-barra-relleno--ok" style={{ width: `${(x.total / porFuente[0].total) * 100}%` }} />
                </div>
                <strong>
                  {euros(x.total)} <small>{Math.round((x.total / total) * 100)} %</small>
                </strong>
              </div>
            ))}
          </div>
        </figure>
      </div>
    </section>
  );
}
