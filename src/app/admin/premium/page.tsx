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
  const activos = todos.filter((f) => f.role === "premium" || f.role === "admin");
  // Tuvo Premium alguna vez y ya no lo tiene: son las bajas.
  const bajas = todos.filter((f) => f.role === "free" && f.premium_since);

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

  const dePago = activos.filter((f) => f.role === "premium");
  const mrr = dePago.filter((f) => !f.subscription_cancel_at_period_end).length * PREMIUM_PRICE_EUR;
  const cancelan = activos.filter((f) => f.subscription_cancel_at_period_end).length;
  const ingresosTotales = todos.reduce(
    (suma, f) => suma + (f.premium_since ? mesesCobrados(f.premium_since) * PREMIUM_PRICE_EUR : 0),
    0
  );

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

      {/* — Resumen — */}
      <div className="cp-cards">
        <div className="cp-card">
          <span className="cp-card-label"><Icon name="crown" size={14} /> Premium activos</span>
          <strong className="cp-card-value">{dePago.length}</strong>
          <span className="cp-card-foot">{cancelan > 0 ? `${cancelan} no renovarán` : "ninguna baja prevista"}</span>
        </div>

        <div className="cp-card">
          <span className="cp-card-label"><Icon name="trending" size={14} /> MRR estimado</span>
          <strong className="cp-card-value">{euros(mrr)}</strong>
          <span className="cp-card-foot">a {PREMIUM_PRICE_EUR}€/mes</span>
        </div>

        <div className="cp-card">
          <span className="cp-card-label"><Icon name="chart" size={14} /> Ingresos acumulados</span>
          <strong className="cp-card-value">{euros(ingresosTotales)}</strong>
          <span className="cp-card-foot">estimado desde el alta de cada uno</span>
        </div>

        <div className={`cp-card${descuadre !== null && descuadre > 0 ? " cp-card--alerta" : ""}`}>
          <span className="cp-card-label"><Icon name="users" size={14} /> Miembros del canal</span>
          <strong className="cp-card-value">{miembrosCanal ?? "—"}</strong>
          <span className="cp-card-foot">
            {miembrosCanal === null
              ? "no se pudo consultar"
              : descuadre === null
                ? ""
                : descuadre > 0
                  ? `⚠ ${descuadre} de más — ¿aprobado a mano?`
                  : `${conTelegram.length} vinculados + el bot`}
          </span>
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
