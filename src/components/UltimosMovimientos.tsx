import { ETIQUETA_TIPO, textoMovimiento, type Movimiento } from "@/lib/portfolio-movimientos";

/**
 * Los tres últimos movimientos de la cartera spot de altcoins, arriba del
 * Portfolio Adelin, escritos como mensajes.
 *
 * No hay que mantenerlo a mano: la API los apunta sola en
 * `portfolio_movimientos` cada vez que se abre, amplía, reduce o cierra una
 * posición (`src/lib/portfolio-movimientos.ts`). Solo el spot; el DCA no.
 */

const FECHA = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
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
      <header className="pv-movs-cabecera">
        <div>
          <span className="pv-etiqueta">Cartera de altcoins</span>
          <h2 id="pv-movs-titulo" className="pv-movs-titulo">Últimos movimientos</h2>
        </div>
        <span className="pv-movs-auto">
          <span className="pv-vivo-punto" aria-hidden="true" />
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
                <span className="pv-mov-avatar" aria-hidden="true">A</span>
                <div className="pv-mov-burbuja">
                  <div className="pv-mov-meta">
                    <strong>Adelin</strong>
                    <span className="pv-mov-tipo">{ETIQUETA_TIPO[m.tipo]} · {m.coin_symbol}</span>
                  </div>
                  <p className="pv-mov-texto">{textoMovimiento(m)}</p>
                  {m.nota && <p className="pv-mov-nota">{m.nota}</p>}
                  <time className="pv-mov-fecha" dateTime={m.created_at}>
                    {FECHA.format(fecha)} · {HORA.format(fecha)}
                    <svg viewBox="0 0 16 11" width="15" height="10" aria-hidden="true">
                      <path d="M1 5.5l3 3L10.5 2M6 8.5l1 1L14.5 2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </time>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
