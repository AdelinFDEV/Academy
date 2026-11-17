import { ETIQUETA_TIPO, textoMovimiento, type Movimiento } from "@/lib/portfolio-movimientos";

/**
 * Los tres últimos movimientos de la cartera spot de altcoins, como un
 * registro de cuaderno: una línea por movimiento, con su fecha, el chip de
 * compra o venta y lo que hice escrito en primera persona.
 *
 * No hay que mantenerlo a mano: la API los apunta sola en
 * `portfolio_movimientos` cada vez que se abre, amplía, reduce o cierra una
 * posición (`src/lib/portfolio-movimientos.ts`). Solo el spot; el DCA no.
 *
 * Rehecho el 17-11-2026 con el estilo «Cuaderno de estudio» (antes eran
 * burbujas de chat). Va junto al reparto, dentro de la cartera spot.
 */

const DIA = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  timeZone: "Europe/Madrid",
});
const MES = new Intl.DateTimeFormat("es-ES", {
  month: "short",
  year: "numeric",
  timeZone: "Europe/Madrid",
});
const HORA = new Intl.DateTimeFormat("es-ES", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Madrid",
});

export default function UltimosMovimientos({ movimientos }: { movimientos: Movimiento[] }) {
  return (
    <section className="pv-movs" aria-labelledby="pv-movs-titulo">
      <header className="pv-bloque-cab">
        <div>
          <span className="pv-etiqueta">Cartera de altcoins</span>
          <h2 id="pv-movs-titulo" className="pv-h2">Últimos movimientos</h2>
        </div>
        <span className="pv-movs-auto">
          <span className="pv-latido" aria-hidden="true" />
          Se actualiza solo
        </span>
      </header>

      {movimientos.length === 0 ? (
        <p className="pv-movs-vacio">
          Todavía no hay movimientos apuntados. En cuanto compre o venda algo, aparecerá aquí.
        </p>
      ) : (
        <ol className="pv-movs-lista">
          {movimientos.map((m) => {
            const fecha = new Date(m.created_at);
            const venta = m.tipo === "reduccion" || m.tipo === "cierre";
            return (
              <li key={m.id} className={`pv-mov${venta ? " es-venta" : " es-compra"}`}>
                <time className="pv-mov-fecha" dateTime={m.created_at}>
                  <b>{DIA.format(fecha)}</b>
                  <span>{MES.format(fecha)}</span>
                  <small>{HORA.format(fecha)}</small>
                </time>
                <div className="pv-mov-cuerpo">
                  <span className="pv-mov-chips">
                    <span className="pv-mov-tipo">{ETIQUETA_TIPO[m.tipo]}</span>
                    <span className="pv-mov-moneda">{m.coin_symbol}</span>
                  </span>
                  <p className="pv-mov-texto">{textoMovimiento(m)}</p>
                  {m.nota && <p className="pv-mov-nota">{m.nota}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
