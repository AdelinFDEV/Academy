import { createAdminClient } from "@/lib/supabase/admin";
import { getChannelMemberCount, getChannelMembership } from "@/lib/telegram";
import { PREMIUM_PRICE_EUR } from "@/lib/stripe";
import Icon from "@/components/Icon";

// El estado de suscripción y los datos de Telegram no tienen GRANT SELECT para
// `authenticated` (ver /cuenta), así que todo se lee con el cliente admin. La
// ruta ya está protegida por el layout de /admin, que exige rol admin.
export const dynamic = "force-dynamic";

const DIA = 24 * 60 * 60 * 1000;

/** Comprobar la pertenencia al canal es una llamada a Telegram por persona.
 *  Con pocos Premium es instantáneo; a partir de aquí se omite para no dejar
 *  la página colgada esperando a la API. */
const MAX_COMPROBACIONES_CANAL = 40;

type Fila = {
  id: string;
  full_name: string | null;
  role: string;
  created_at: string;
  premium_since: string | null;
  telegram_user_id: number | null;
  telegram_username: string | null;
  telegram_linked_at: string | null;
  subscription_status: string | null;
  subscription_current_period_end: string | null;
  subscription_cancel_at_period_end: boolean | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  cancel_warning_period_end: string | null;
};

function fecha(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function diasHasta(iso: string | null): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / DIA);
}

/** Antigüedad en formato corto: "3 meses", "1 año 2 meses". */
function antiguedad(desde: string | null): string {
  if (!desde) return "—";
  const meses = Math.max(0, Math.floor((Date.now() - new Date(desde).getTime()) / (30.44 * DIA)));
  if (meses < 1) return "menos de 1 mes";
  if (meses < 12) return `${meses} ${meses === 1 ? "mes" : "meses"}`;
  const años = Math.floor(meses / 12);
  const resto = meses % 12;
  return `${años} ${años === 1 ? "año" : "años"}${resto ? ` ${resto} m` : ""}`;
}

/** Meses cobrados desde que es Premium, para estimar lo aportado. */
function mesesCobrados(desde: string | null): number {
  if (!desde) return 0;
  return Math.max(1, Math.floor((Date.now() - new Date(desde).getTime()) / (30.44 * DIA)) + 1);
}

function euros(n: number): string {
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

function pct(parte: number, total: number): string {
  if (!total) return "—";
  return `${Math.round((parte / total) * 100)}%`;
}

/**
 * Todo lo que depende de la fecha actual se calcula aquí, en una función de
 * módulo, y no en el cuerpo del componente: llamar a Date.now() durante el
 * render es una función impura y ESLint lo marca (regla react-hooks/purity).
 */
function calcularMetricas(todos: Fila[]) {
  const ahora = Date.now();
  const hace30 = ahora - 30 * DIA;

  const activos = todos.filter((f) => f.role === "premium" || f.role === "admin");
  const dePago = activos.filter((f) => f.role === "premium");
  const bajas = todos.filter((f) => f.role === "free" && f.premium_since);

  const altas30 = todos.filter(
    (f) => f.premium_since && new Date(f.premium_since).getTime() >= hace30
  ).length;

  const bajas30 = bajas.filter(
    (f) =>
      f.subscription_current_period_end &&
      new Date(f.subscription_current_period_end).getTime() >= hace30
  ).length;

  // Renovaciones que caen en los próximos 30 días y que NO están canceladas:
  // es el dinero que razonablemente va a entrar.
  const previstos30 =
    dePago.filter(
      (f) =>
        !f.subscription_cancel_at_period_end &&
        f.subscription_current_period_end &&
        new Date(f.subscription_current_period_end).getTime() <= ahora + 30 * DIA
    ).length * PREMIUM_PRICE_EUR;

  // Vida media: solo se puede medir sobre quien ya se fue. Con pocas bajas el
  // dato es ruido, así que se marca como no disponible por debajo de 3.
  const duraciones = bajas
    .filter((f) => f.premium_since && f.subscription_current_period_end)
    .map((f) =>
      Math.max(
        1,
        (new Date(f.subscription_current_period_end as string).getTime() -
          new Date(f.premium_since as string).getTime()) /
          (30.44 * DIA)
      )
    );
  const vidaMedia =
    duraciones.length >= 3
      ? duraciones.reduce((a, b) => a + b, 0) / duraciones.length
      : null;

  // Base del churn: quien podía darse de baja este mes (los que siguen + los
  // que ya se fueron en la ventana).
  const baseChurn = dePago.length + bajas30;

  return {
    activos,
    dePago,
    bajas,
    altas30,
    bajas30,
    previstos30,
    vidaMedia,
    churn: baseChurn > 0 ? bajas30 / baseChurn : null,
    ltv: vidaMedia !== null ? vidaMedia * PREMIUM_PRICE_EUR : null,
    ingresosTotales: todos.reduce(
      (suma, f) => suma + (f.premium_since ? mesesCobrados(f.premium_since) * PREMIUM_PRICE_EUR : 0),
      0
    ),
  };
}

/**
 * Quién renueva en los próximos 30 días, del más cercano al más lejano.
 * Se excluyen las canceladas: ese dinero no va a entrar.
 */
function ordenarPorVencimiento(dePago: Fila[]): Fila[] {
  const limite = Date.now() + 30 * DIA;
  return dePago
    .filter(
      (f) =>
        !f.subscription_cancel_at_period_end &&
        f.subscription_current_period_end &&
        new Date(f.subscription_current_period_end).getTime() <= limite
    )
    .sort(
      (a, b) =>
        new Date(a.subscription_current_period_end as string).getTime() -
        new Date(b.subscription_current_period_end as string).getTime()
    );
}

/** Altas Premium por mes en los últimos 6 meses, para la gráfica de barras. */
function altasPorMes(todos: Fila[]): { etiqueta: string; total: number }[] {
  const ahora = new Date();
  const meses: { etiqueta: string; total: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const ref = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    const fin = new Date(ahora.getFullYear(), ahora.getMonth() - i + 1, 1);
    const total = todos.filter((f) => {
      if (!f.premium_since) return false;
      const t = new Date(f.premium_since).getTime();
      return t >= ref.getTime() && t < fin.getTime();
    }).length;
    meses.push({ etiqueta: ref.toLocaleDateString("es-ES", { month: "short" }), total });
  }
  return meses;
}

function etiquetaEstado(f: Fila): { texto: string; clase: string } {
  if (f.role === "admin") return { texto: "Admin", clase: "cp-tag--admin" };
  if (f.subscription_cancel_at_period_end && f.subscription_status === "active") {
    return { texto: "Cancelada", clase: "cp-tag--warn" };
  }
  switch (f.subscription_status) {
    case "active":   return { texto: "Activa", clase: "cp-tag--ok" };
    case "trialing": return { texto: "En prueba", clase: "cp-tag--ok" };
    case "past_due": return { texto: "Pago pendiente", clase: "cp-tag--warn" };
    case "unpaid":   return { texto: "Impagada", clase: "cp-tag--bad" };
    case "canceled": return { texto: "Cancelada", clase: "cp-tag--bad" };
    // Sin estado de Stripe pero con rol premium = concedido a mano desde aquí.
    default:         return { texto: "Manual", clase: "cp-tag--manual" };
  }
}

export default async function AdminPremiumPage() {
  const admin = createAdminClient();

  const [{ data: perfiles }, { data: authData }, miembrosCanal] = await Promise.all([
    admin
      .from("profiles")
      // En una sola cadena literal a propósito: Supabase infiere el tipo de la
      // fila analizando este texto, y partirlo en trozos concatenados rompe la
      // inferencia y obliga a castear.
      .select("id, full_name, role, created_at, premium_since, telegram_user_id, telegram_username, telegram_linked_at, subscription_status, subscription_current_period_end, subscription_cancel_at_period_end, stripe_customer_id, stripe_subscription_id, cancel_warning_period_end")
      .order("premium_since", { ascending: true, nullsFirst: false }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
    getChannelMemberCount(),
  ]);

  const emails: Record<string, string> = {};
  (authData?.users ?? []).forEach((u) => {
    if (u.email) emails[u.id] = u.email;
  });

  const todos = (perfiles ?? []) as Fila[];
  const m = calcularMetricas(todos);
  const { activos, dePago, bajas } = m;
  const grafica = altasPorMes(todos);
  const registrados = todos.length;

  // Pertenencia real al canal, solo para los que tienen Telegram vinculado.
  const conTelegram = activos.filter((f) => f.telegram_user_id);
  const enCanal: Record<string, "dentro" | "fuera" | "desconocido"> = {};
  if (conTelegram.length <= MAX_COMPROBACIONES_CANAL) {
    const resultados = await Promise.all(
      conTelegram.map((f) => getChannelMembership(f.telegram_user_id as number))
    );
    conTelegram.forEach((f, i) => {
      enCanal[f.id] = resultados[i];
    });
  }

  const mrr = dePago.filter((f) => !f.subscription_cancel_at_period_end).length * PREMIUM_PRICE_EUR;
  const cancelan = activos.filter((f) => f.subscription_cancel_at_period_end).length;
  const dentro = Object.values(enCanal).filter((v) => v === "dentro").length;

  // El detalle de las dos métricas que piden acción, no solo lectura: saber
  // que hay "3 sin usar el canal" no sirve de nada si no sabes quiénes son.
  const fueraDelCanal = conTelegram.filter((f) => enCanal[f.id] === "fuera");
  const sinVincular = activos.filter((f) => !f.telegram_user_id);
  const renuevanPronto = ordenarPorVencimiento(dePago);

  // El bot también cuenta como miembro del canal.
  const previsto = conTelegram.length + 1;
  const descuadre = miembrosCanal !== null ? miembrosCanal - previsto : null;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Control Premium</h1>
          <p className="admin-page-subtitle">
            {activos.length} con acceso · {conTelegram.length} vinculados a Telegram · {bajas.length} bajas
          </p>
        </div>
      </div>

      {/* — Dinero — */}
      <h2 className="cp-group-title"><Icon name="trending" size={14} /> Dinero</h2>
      <div className="cp-cards">
        <div className="cp-card cp-card--destacada">
          <span className="cp-card-label">MRR</span>
          <strong className="cp-card-value">{euros(mrr)}</strong>
          <span className="cp-card-foot">ingreso recurrente al mes</span>
        </div>

        <div className="cp-card">
          <span className="cp-card-label">Previsto 30 días</span>
          <strong className="cp-card-value">{euros(m.previstos30)}</strong>
          <span className="cp-card-foot">renovaciones que tocan y no están canceladas</span>
        </div>

        <div className="cp-card">
          <span className="cp-card-label">Ingresos acumulados</span>
          <strong className="cp-card-value">{euros(m.ingresosTotales)}</strong>
          <span className="cp-card-foot">desde el alta de cada usuario</span>
        </div>

        <div className="cp-card">
          <span className="cp-card-label">LTV medio</span>
          <strong className="cp-card-value">{m.ltv !== null ? euros(m.ltv) : "—"}</strong>
          <span className="cp-card-foot">
            {m.ltv !== null
              ? `${m.vidaMedia?.toFixed(1)} meses de media`
              : "hacen falta 3 bajas para calcularlo"}
          </span>
        </div>
      </div>

      {/* — Comunidad — */}
      <h2 className="cp-group-title"><Icon name="users" size={14} /> Comunidad</h2>
      <div className="cp-cards">
        <div className="cp-card cp-card--destacada">
          <span className="cp-card-label">Premium activos</span>
          <strong className="cp-card-value">{dePago.length}</strong>
          <span className="cp-card-foot">
            {m.altas30 > 0 ? `+${m.altas30} en 30 días` : "sin altas este mes"}
            {cancelan > 0 ? ` · ${cancelan} se van` : ""}
          </span>
        </div>

        <div className="cp-card">
          <span className="cp-card-label">Conversión</span>
          <strong className="cp-card-value">{pct(dePago.length, registrados)}</strong>
          <span className="cp-card-foot">{dePago.length} de {registrados} registrados</span>
        </div>

        <div className="cp-card">
          <span className="cp-card-label">Con Telegram</span>
          <strong className="cp-card-value">{pct(conTelegram.length, activos.length)}</strong>
          <span className="cp-card-foot">{conTelegram.length} de {activos.length} han vinculado</span>
        </div>

        <div className={`cp-card${descuadre !== null && descuadre > 0 ? " cp-card--alerta" : ""}`}>
          <span className="cp-card-label">Dentro del canal</span>
          <strong className="cp-card-value">{miembrosCanal ?? "—"}</strong>
          <span className="cp-card-foot">
            {miembrosCanal === null
              ? "no se pudo consultar"
              : descuadre !== null && descuadre > 0
                ? `⚠ ${descuadre} de más — ¿aprobado a mano?`
                : `${dentro} premium usándolo + el bot`}
          </span>
        </div>
      </div>

      {/* — Salud — */}
      <h2 className="cp-group-title"><Icon name="activity" size={14} /> Salud</h2>
      <div className="cp-cards">
        <div className={`cp-card${m.churn !== null && m.churn > 0.1 ? " cp-card--alerta" : ""}`}>
          <span className="cp-card-label">Churn mensual</span>
          <strong className="cp-card-value">
            {m.churn !== null ? `${Math.round(m.churn * 100)}%` : "—"}
          </strong>
          <span className="cp-card-foot">
            {m.bajas30} baja{m.bajas30 === 1 ? "" : "s"} en 30 días
          </span>
        </div>

        <div className="cp-card">
          <span className="cp-card-label">Bajas totales</span>
          <strong className="cp-card-value">{bajas.length}</strong>
          <span className="cp-card-foot">fueron Premium y ya no</span>
        </div>

        {/* Se cuentan los dos casos: vinculados pero fuera, y los que ni
            siquiera vincularon. Ambos pagan sin usar la comunidad. Los
            "desconocido" quedan fuera del recuento a propósito: no se sabe. */}
        <div
          className={`cp-card${fueraDelCanal.length + sinVincular.length > 0 ? " cp-card--alerta" : ""}`}
        >
          <span className="cp-card-label">Pagan sin usarlo</span>
          <strong className="cp-card-value">{fueraDelCanal.length + sinVincular.length}</strong>
          <span className="cp-card-foot">
            {fueraDelCanal.length + sinVincular.length === 0
              ? "todos están en la comunidad"
              : "riesgo de baja — detalle abajo"}
          </span>
        </div>

        {/* Altas por mes: con pocos datos una gráfica grande engaña, así que
            van barras mínimas dentro de una tarjeta más. */}
        <div className="cp-card cp-card--grafica">
          <span className="cp-card-label">Altas por mes</span>
          <div className="cp-barras">
            {grafica.map((mes, i) => {
              const max = Math.max(...grafica.map((g) => g.total), 1);
              return (
                <div key={i} className="cp-barra-col" title={`${mes.total} altas`}>
                  <div className="cp-barra" style={{ height: `${(mes.total / max) * 100}%` }}>
                    {mes.total > 0 && <span className="cp-barra-num">{mes.total}</span>}
                  </div>
                  <span className="cp-barra-mes">{mes.etiqueta}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {descuadre !== null && descuadre > 0 && (
        <p className="cp-alerta">
          Hay <strong>{descuadre}</strong> miembro(s) en el canal que no corresponden a ningún Premium
          vinculado. Suele significar que se aprobó una solicitud a mano: el cron no los expulsará
          nunca, porque reconcilia desde la base de datos y a esa persona no la ve. La API de
          Telegram no permite listar los miembros de un canal, así que hay que localizarlo a mano
          desde la lista de suscriptores del canal.
        </p>
      )}

      {/* — Detalle accionable — */}
      {(renuevanPronto.length > 0 || fueraDelCanal.length > 0 || sinVincular.length > 0) && (
        <div className="cp-detalles">
          {renuevanPronto.length > 0 && (
            <div className="cp-detalle">
              <h3 className="cp-detalle-titulo">
                💶 Cobros en los próximos 30 días
                <span className="cp-detalle-total">
                  {euros(renuevanPronto.length * PREMIUM_PRICE_EUR)}
                </span>
              </h3>
              <ul className="cp-lista">
                {renuevanPronto.map((f) => {
                  const dias = diasHasta(f.subscription_current_period_end);
                  return (
                    <li key={f.id}>
                      <span className="cp-lista-nombre">{f.full_name ?? "Sin nombre"}</span>
                      <span className="cp-lista-dato">
                        {fecha(f.subscription_current_period_end)}
                        {dias !== null && <em> · en {dias} d</em>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {(fueraDelCanal.length > 0 || sinVincular.length > 0) && (
            <div className="cp-detalle cp-detalle--riesgo">
              <h3 className="cp-detalle-titulo">
                ⚠️ Pagan y no usan la comunidad
                <span className="cp-detalle-total">
                  {fueraDelCanal.length + sinVincular.length}
                </span>
              </h3>
              <p className="cp-detalle-hint">
                Los candidatos más claros a darse de baja: pagan por algo que no están usando.
                Un recordatorio a tiempo suele bastar.
              </p>
              <ul className="cp-lista">
                {fueraDelCanal.map((f) => (
                  <li key={f.id}>
                    <span className="cp-lista-nombre">{f.full_name ?? "Sin nombre"}</span>
                    <span className="cp-lista-dato">
                      {f.telegram_username ? (
                        <a
                          className="cp-tg"
                          href={`https://t.me/${f.telegram_username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          escribirle
                        </a>
                      ) : (
                        <em>vinculado, fuera del canal</em>
                      )}
                    </span>
                  </li>
                ))}
                {sinVincular.map((f) => (
                  <li key={f.id}>
                    <span className="cp-lista-nombre">{f.full_name ?? "Sin nombre"}</span>
                    <span className="cp-lista-dato"><em>sin vincular Telegram</em></span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* — Con acceso — */}
      <h2 className="cp-section-title">Con acceso ahora</h2>
      <div className="admin-table-wrap">
        <table className="admin-table cp-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Telegram</th>
              <th>Canal</th>
              <th>Estado</th>
              <th>Origen</th>
              <th>Renueva / hasta</th>
              <th>Restan</th>
              <th>Antigüedad</th>
              <th>Aportado</th>
            </tr>
          </thead>
          <tbody>
            {activos.length === 0 && (
              <tr><td colSpan={9} className="admin-empty">Todavía no hay usuarios Premium</td></tr>
            )}
            {activos.map((f) => {
              const estado = etiquetaEstado(f);
              const dias = diasHasta(f.subscription_current_period_end);
              const canal = enCanal[f.id];
              const avisado =
                f.cancel_warning_period_end &&
                f.subscription_current_period_end &&
                new Date(f.cancel_warning_period_end).getTime() ===
                  new Date(f.subscription_current_period_end).getTime();

              return (
                <tr key={f.id}>
                  <td className="users-table-name">
                    <div className="users-avatar">{(f.full_name ?? "?")[0].toUpperCase()}</div>
                    <div className="cp-user">
                      <span>{f.full_name ?? "Sin nombre"}</span>
                      <small>{emails[f.id] ?? "—"}</small>
                    </div>
                  </td>

                  <td>
                    {f.telegram_username ? (
                      <a
                        className="cp-tg"
                        href={`https://t.me/${f.telegram_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        @{f.telegram_username}
                      </a>
                    ) : f.telegram_user_id ? (
                      <span className="cp-muted">vinculado (sin @)</span>
                    ) : (
                      <span className="cp-muted">sin vincular</span>
                    )}
                  </td>

                  <td>
                    {!f.telegram_user_id ? (
                      <span className="cp-muted">—</span>
                    ) : canal === "dentro" ? (
                      <span className="cp-tag cp-tag--ok">dentro</span>
                    ) : canal === "fuera" ? (
                      <span className="cp-tag cp-tag--muted">fuera</span>
                    ) : (
                      // "desconocido" (Telegram no contestó) y "sin comprobar"
                      // (demasiados usuarios) se pintan igual: en ambos casos
                      // el dato no existe, y fingir uno sería peor que no darlo.
                      <span className="cp-muted" title="No se ha podido comprobar">sin datos</span>
                    )}
                  </td>

                  <td>
                    <span className={`cp-tag ${estado.clase}`}>{estado.texto}</span>
                    {avisado && <span className="cp-avisado" title="Ya se le avisó de que pierde el acceso">🔔</span>}
                  </td>

                  <td>
                    {f.role === "admin" ? (
                      <span className="cp-muted">—</span>
                    ) : f.stripe_subscription_id ? (
                      <span className="cp-origen">Stripe · {PREMIUM_PRICE_EUR}€/mes</span>
                    ) : (
                      <span className="cp-origen cp-origen--manual">Concedido a mano</span>
                    )}
                  </td>

                  <td className="users-table-date">{fecha(f.subscription_current_period_end)}</td>

                  <td className="users-table-num">
                    {dias === null ? (
                      <span className="cp-muted">—</span>
                    ) : (
                      <span className={dias <= 3 ? "cp-dias cp-dias--pocos" : "cp-dias"}>
                        {dias} d
                      </span>
                    )}
                  </td>

                  <td className="users-table-date">{antiguedad(f.premium_since)}</td>

                  <td className="users-table-num">
                    {f.premium_since && f.role !== "admin"
                      ? euros(mesesCobrados(f.premium_since) * PREMIUM_PRICE_EUR)
                      : <span className="cp-muted">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* — Bajas — */}
      {bajas.length > 0 && (
        <>
          <h2 className="cp-section-title">Bajas</h2>
          <p className="cp-section-hint">
            Fueron Premium y ya no lo son. Útil para saber a quién merece la pena recuperar.
          </p>
          <div className="admin-table-wrap">
            <table className="admin-table cp-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Telegram</th>
                  <th>Alta Premium</th>
                  <th>Fin de acceso</th>
                  <th>Duró</th>
                  <th>Aportó</th>
                </tr>
              </thead>
              <tbody>
                {bajas.map((f) => (
                  <tr key={f.id}>
                    <td className="users-table-name">
                      <div className="users-avatar">{(f.full_name ?? "?")[0].toUpperCase()}</div>
                      <div className="cp-user">
                        <span>{f.full_name ?? "Sin nombre"}</span>
                        <small>{emails[f.id] ?? "—"}</small>
                      </div>
                    </td>
                    <td>
                      {f.telegram_username ? (
                        <a className="cp-tg" href={`https://t.me/${f.telegram_username}`} target="_blank" rel="noopener noreferrer">
                          @{f.telegram_username}
                        </a>
                      ) : (
                        <span className="cp-muted">sin vincular</span>
                      )}
                    </td>
                    <td className="users-table-date">{fecha(f.premium_since)}</td>
                    <td className="users-table-date">{fecha(f.subscription_current_period_end)}</td>
                    <td className="users-table-date">{antiguedad(f.premium_since)}</td>
                    <td className="users-table-num">
                      {euros(mesesCobrados(f.premium_since) * PREMIUM_PRICE_EUR)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className="cp-nota">
        Las cifras de dinero son estimaciones a {PREMIUM_PRICE_EUR}€/mes sobre la antigüedad de cada
        usuario: no cuentan descuentos, impagos ni tarifas antiguas. Para la contabilidad real, el
        panel de Stripe.
      </p>
    </div>
  );
}
