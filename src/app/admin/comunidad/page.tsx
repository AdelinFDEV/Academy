import { createAdminClient } from "@/lib/supabase/admin";
import { getChannelMemberCount, getFreeChannelId, getFreeChannelUrl } from "@/lib/telegram";
import Icon from "@/components/Icon";
import AnunciarNovedadesBtn from "@/components/admin/AnunciarNovedadesBtn";

export const dynamic = "force-dynamic";

const DIA = 24 * 60 * 60 * 1000;

type Evento = {
  telegram_user_id: number;
  username: string | null;
  nombre: string | null;
  action: string;
  created_at: string;
};

type Foto = { fecha: string; miembros: number };

function fecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

function haceCuanto(iso: string): string {
  const horas = Math.floor((Date.now() - new Date(iso).getTime()) / (60 * 60 * 1000));
  if (horas < 1) return "hace un momento";
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return dias === 1 ? "ayer" : `hace ${dias} días`;
}

/** Todo lo que depende de la fecha, fuera del render (regla react-hooks/purity). */
function calcular(eventos: Evento[], fotos: Foto[]) {
  const ahora = Date.now();
  const desde = (dias: number) => ahora - dias * DIA;

  const enVentana = (e: Evento, dias: number) => new Date(e.created_at).getTime() >= desde(dias);
  const altas = (dias: number) => eventos.filter((e) => e.action === "join" && enVentana(e, dias)).length;
  const bajas = (dias: number) => eventos.filter((e) => e.action === "leave" && enVentana(e, dias)).length;

  const altas7 = altas(7);
  const altas30 = altas(30);
  const bajas7 = bajas(7);
  const bajas30 = bajas(30);

  // La curva se dibuja con las fotos diarias, no acumulando eventos: si el bot
  // se cae un rato, los eventos se pierden pero la foto del día siguiente
  // vuelve a cuadrar.
  const curva = [...fotos].sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(-30);

  return {
    altas7,
    altas30,
    bajas7,
    bajas30,
    neto30: altas30 - bajas30,
    // Cuánta gente de la que entró se acaba yendo. Por encima del 30% suele
    // significar que lo prometido y lo publicado no coinciden.
    abandono: altas30 > 0 ? bajas30 / altas30 : null,
    curva,
    ultimas: eventos.filter((e) => e.action === "join").slice(0, 12),
  };
}

export default async function AdminComunidadPage() {
  const admin = createAdminClient();
  const canal = getFreeChannelId();

  const [{ data: eventosData }, { data: fotosData }, miembros, { data: vinculados }] =
    await Promise.all([
      admin
        .from("telegram_channel_events")
        .select("telegram_user_id, username, nombre, action, created_at")
        .eq("chat_id", String(canal ?? ""))
        .order("created_at", { ascending: false })
        .limit(500),
      admin
        .from("telegram_channel_stats")
        .select("fecha, miembros")
        .eq("chat_id", String(canal ?? ""))
        .order("fecha", { ascending: false })
        .limit(60),
      getChannelMemberCount(canal ?? undefined),
      // Para cruzar quién del canal free acabó pagando.
      admin.from("profiles").select("telegram_user_id, role").not("telegram_user_id", "is", null),
    ]);

  const eventos = (eventosData ?? []) as Evento[];
  const fotos = (fotosData ?? []) as Foto[];
  const m = calcular(eventos, fotos);

  // Conversión: de los que entraron al canal gratuito, cuántos son Premium hoy.
  // Es la métrica que dice si el canal sirve para vender o solo para acumular
  // gente. Solo se ve a quien además vinculó su cuenta.
  const premiumPorTelegram = new Set(
    (vinculados ?? [])
      .filter((p) => p.role === "premium" || p.role === "admin")
      .map((p) => Number(p.telegram_user_id))
  );
  const entraron = new Set(eventos.filter((e) => e.action === "join").map((e) => e.telegram_user_id));
  const convertidos = [...entraron].filter((id) => premiumPorTelegram.has(id)).length;

  const maxCurva = Math.max(...m.curva.map((f) => f.miembros), 1);
  const sinDatos = eventos.length === 0 && fotos.length === 0;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Canal gratuito</h1>
          <p className="admin-page-subtitle">
            {canal ? (
              <a href={getFreeChannelUrl()} target="_blank" rel="noopener noreferrer" className="cp-tg">
                {/* El id es numérico; para leerlo se muestra el @ del enlace. */}
                @{getFreeChannelUrl().split("/").pop()}
              </a>
            ) : (
              "sin canal configurado"
            )}
            {" · "}
            {miembros !== null ? `${miembros} miembros ahora` : "no se pudo consultar"}
          </p>
        </div>
        {/* YouTube no avisa de nada: sin este botón, un vídeo nuevo espera al
            cron de las 04:00 para llegar al canal. */}
        <AnunciarNovedadesBtn />
      </div>

      {sinDatos && (
        <p className="cp-alerta">
          Todavía no hay historial. Telegram no guarda ni el pasado del canal ni quién entró antes,
          así que la serie empieza a construirse desde ahora: las altas se registran según ocurren y
          el total se fotografía una vez al día. En unos días esta pantalla tendrá curva.
        </p>
      )}

      {/* — Tamaño — */}
      <h2 className="cp-group-title"><Icon name="users" size={14} /> Tamaño</h2>
      <div className="cp-cards">
        <div className="cp-card cp-card--destacada">
          <span className="cp-card-label">Miembros ahora</span>
          <strong className="cp-card-value">{miembros ?? "—"}</strong>
          <span className="cp-card-foot">dato en vivo de Telegram</span>
        </div>

        <div className="cp-card">
          <span className="cp-card-label">Altas 7 días</span>
          <strong className="cp-card-value">{m.altas7}</strong>
          <span className="cp-card-foot">{m.bajas7} baja{m.bajas7 === 1 ? "" : "s"} en el mismo periodo</span>
        </div>

        <div className={`cp-card${m.neto30 < 0 ? " cp-card--alerta" : ""}`}>
          <span className="cp-card-label">Crecimiento 30 días</span>
          <strong className="cp-card-value">{m.neto30 >= 0 ? `+${m.neto30}` : m.neto30}</strong>
          <span className="cp-card-foot">{m.altas30} altas · {m.bajas30} bajas</span>
        </div>

        <div className={`cp-card${m.abandono !== null && m.abandono > 0.3 ? " cp-card--alerta" : ""}`}>
          <span className="cp-card-label">Abandono</span>
          <strong className="cp-card-value">
            {m.abandono !== null ? `${Math.round(m.abandono * 100)}%` : "—"}
          </strong>
          <span className="cp-card-foot">
            {m.abandono === null ? "sin altas que medir" : "de los que entran, se van"}
          </span>
        </div>
      </div>

      {/* — Negocio — */}
      <h2 className="cp-group-title"><Icon name="trending" size={14} /> Lo que aporta al negocio</h2>
      <div className="cp-cards">
        <div className="cp-card cp-card--destacada">
          <span className="cp-card-label">Convertidos a Premium</span>
          <strong className="cp-card-value">{convertidos}</strong>
          <span className="cp-card-foot">
            {entraron.size > 0
              ? `de ${entraron.size} que han entrado al canal`
              : "aún no hay altas registradas"}
          </span>
        </div>

        <div className="cp-card">
          <span className="cp-card-label">Tasa de conversión</span>
          <strong className="cp-card-value">
            {entraron.size > 0 ? `${Math.round((convertidos / entraron.size) * 100)}%` : "—"}
          </strong>
          <span className="cp-card-foot">del canal free a Premium</span>
        </div>

        <div className="cp-card cp-card--grafica">
          <span className="cp-card-label">Miembros (30 días)</span>
          {m.curva.length < 2 ? (
            <span className="cp-card-foot">Hacen falta al menos 2 días de datos.</span>
          ) : (
            <div className="cp-barras">
              {m.curva.map((f) => (
                <div key={f.fecha} className="cp-barra-col" title={`${fecha(f.fecha)}: ${f.miembros}`}>
                  <div className="cp-barra" style={{ height: `${(f.miembros / maxCurva) * 100}%` }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* — Últimas altas — */}
      <h2 className="cp-section-title">Últimos en unirse</h2>
      <p className="cp-section-hint">
        Solo aparece quien tenga @ público: Telegram no facilita el resto.
      </p>
      <div className="admin-table-wrap">
        <table className="admin-table cp-table">
          <thead>
            <tr>
              <th>Quién</th>
              <th>Telegram</th>
              <th>¿Es Premium?</th>
              <th>Cuándo</th>
            </tr>
          </thead>
          <tbody>
            {m.ultimas.length === 0 && (
              <tr><td colSpan={4} className="admin-empty">Todavía no se ha registrado ninguna alta</td></tr>
            )}
            {m.ultimas.map((e, i) => (
              <tr key={`${e.telegram_user_id}-${i}`}>
                <td className="users-table-name">
                  <div className="users-avatar">{(e.nombre ?? "?")[0].toUpperCase()}</div>
                  <span>{e.nombre ?? "Sin nombre"}</span>
                </td>
                <td>
                  {e.username ? (
                    <a
                      className="cp-tg"
                      href={`https://t.me/${e.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      @{e.username}
                    </a>
                  ) : (
                    <span className="cp-muted">sin @</span>
                  )}
                </td>
                <td>
                  {premiumPorTelegram.has(e.telegram_user_id) ? (
                    <span className="cp-tag cp-tag--ok">Premium</span>
                  ) : (
                    <span className="cp-muted">todavía no</span>
                  )}
                </td>
                <td className="users-table-date">{haceCuanto(e.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="cp-nota">
        La conversión solo ve a quien vinculó su cuenta de la Academy con Telegram: alguien puede
        haberse hecho Premium desde el canal sin vincular, y aquí no aparecería. Tómala como suelo,
        no como cifra exacta.
      </p>
    </div>
  );
}
