import Link from "next/link";
import UserRoleButton from "@/components/admin/UserRoleButton";
import AdminMfaResetButton from "@/components/admin/AdminMfaResetButton";
import { PREMIUM_PRICE_EUR } from "@/lib/stripe";
import { PERIODOS, cargarAnalitica, periodoDe, type Comparada, type DiaTrafico, type Fila } from "@/lib/analitica";
import "./analitica.css";

/**
 * /admin · Analítica. Una sola página con lo que sirve para decidir: cuánta
 * gente llega y si va a más, de dónde, qué hace, cuántos se registran y pagan.
 * Los datos los prepara `src/lib/analitica.ts`; aquí solo se pintan.
 */
export const dynamic = "force-dynamic";

const ZONA = "Europe/Bucharest";
const nf = new Intl.NumberFormat("es-ES", { useGrouping: "always" } as Intl.NumberFormatOptions);
const num = (n: number) => nf.format(Math.round(n));
const euros = (n: number) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const precio = euros(PREMIUM_PRICE_EUR);
const paisNombre = new Intl.DisplayNames(["es"], { type: "region" });

function nombrePais(codigo: string) {
  if (codigo === "??") return "Sin dato";
  try {
    return paisNombre.of(codigo) ?? codigo;
  } catch {
    return codigo;
  }
}

const DISPOSITIVOS: Record<string, string> = { movil: "Móvil", tablet: "Tablet", escritorio: "Ordenador" };

function fecha(iso: string | null, conAno = false) {
  if (!iso) return "—";
  // `last_seen` es una fecha sin hora: se lee como mediodía UTC para que la zona no la mueva de día.
  const t = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00Z` : iso;
  return new Date(t).toLocaleDateString("es-ES", { day: "numeric", month: "short", ...(conAno ? { year: "numeric" } : {}), timeZone: ZONA });
}

function pct(parte: number, total: number) {
  if (!total) return "—";
  const v = (parte / total) * 100;
  return `${v < 10 && v > 0 ? v.toFixed(1).replace(".", ",") : Math.round(v)} %`;
}

/** Variación frente al periodo anterior, con su color. */
function Cambio({ c }: { c: Comparada }) {
  if (!c.antes && !c.ahora) return <span className="an-cambio an-cambio--igual">sin datos</span>;
  if (!c.antes) return <span className="an-cambio an-cambio--sube">nuevo</span>;
  const v = Math.round(((c.ahora - c.antes) / c.antes) * 100);
  const clase = v > 0 ? "sube" : v < 0 ? "baja" : "igual";
  return (
    <span className={`an-cambio an-cambio--${clase}`}>
      {v > 0 ? "▲" : v < 0 ? "▼" : "="} {Math.abs(v)} %
    </span>
  );
}

function Kpi({ titulo, valor, c, nota }: { titulo: string; valor: string; c?: Comparada; nota?: string }) {
  return (
    <div className="an-kpi">
      <span className="an-kpi-titulo">{titulo}</span>
      <strong className="an-kpi-valor">{valor}</strong>
      <span className="an-kpi-pie">
        {c && <Cambio c={c} />}
        {nota && <span>{nota}</span>}
      </span>
    </div>
  );
}

/** Lista con barra proporcional. */
function Barras({ filas, nombre = (s) => s, vacio = "Sin datos todavía" }: { filas: Fila[]; nombre?: (s: string) => string; vacio?: string }) {
  const total = filas.reduce((a, f) => a + f.n, 0);
  if (!total) return <p className="an-vacio">{vacio}</p>;
  const max = Math.max(...filas.map((f) => f.n));
  return (
    <ul className="an-barras">
      {filas.map((f) => (
        <li key={f.nombre}>
          <span className="an-barras-nombre">{nombre(f.nombre)}</span>
          <span className="an-barras-pista"><span style={{ width: `${(f.n / max) * 100}%` }} /></span>
          <span className="an-barras-n">{num(f.n)}</span>
          <span className="an-barras-pct">{pct(f.n, total)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Visitantes únicos por día (barras) y su media de 7 días (línea). */
function Grafico({ serie }: { serie: DiaTrafico[] }) {
  const W = 720, H = 200, PAD = 24;
  const max = Math.max(4, ...serie.map((d) => d.visitantes));
  const paso = (W - PAD) / serie.length;
  const y = (v: number) => H - PAD - (v / max) * (H - PAD * 2);
  const media = serie.map((_, i) => {
    const ventana = serie.slice(Math.max(0, i - 6), i + 1);
    return ventana.reduce((a, d) => a + d.visitantes, 0) / ventana.length;
  });
  const linea = media.map((m, i) => `${(PAD + paso * i + paso / 2).toFixed(1)},${y(m).toFixed(1)}`).join(" ");
  const etiquetas = [0, Math.floor(serie.length / 2), serie.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="an-grafico" role="img" aria-label="Visitantes únicos por día">
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line x1={PAD} x2={W} y1={y(max * f)} y2={y(max * f)} className="an-grafico-rejilla" />
          <text x={0} y={y(max * f) + 4} className="an-grafico-eje">{Math.round(max * f)}</text>
        </g>
      ))}
      {serie.map((d, i) => {
        const alto = H - PAD - y(d.visitantes);
        return (
          <rect key={d.dia} x={PAD + paso * i + paso * 0.15} y={y(d.visitantes)} width={paso * 0.7} height={Math.max(alto, d.visitantes ? 2 : 0)} rx={2} className="an-grafico-barra">
            <title>{`${fecha(d.dia)}: ${d.visitantes} visitantes · ${d.vistas} páginas`}</title>
          </rect>
        );
      })}
      <polyline points={linea} className="an-grafico-media" />
      {etiquetas.map((i) => (
        <text key={i} x={PAD + paso * i + paso / 2} y={H - 4} textAnchor="middle" className="an-grafico-eje">{fecha(serie[i]?.dia ?? null)}</text>
      ))}
    </svg>
  );
}

export default async function AnaliticaPage({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  const dias = periodoDe((await searchParams).dias);
  const a = await cargarAnalitica(dias);
  const t = a.trafico;

  const mediaDia = { ahora: a.visitas.ahora / dias, antes: a.visitas.antes / dias };
  const sinVisitas = a.visitas.ahora === 0 && a.visitas.antes === 0;
  const embudo = [
    { nombre: "Visitas", n: a.visitas.ahora, nota: "personas distintas cada día" },
    { nombre: "Registros", n: a.registros.ahora, nota: "cuentas nuevas" },
    { nombre: "Activados", n: a.activados, nota: "de esos registros, han usado algo" },
    { nombre: "Premium", n: a.altas.ahora, nota: "suscripciones nuevas" },
  ];

  return (
    <div className="admin-page an">
      <header className="an-cabecera">
        <div>
          <h1>Analítica</h1>
          <p>Últimos {dias} días, comparados con los {dias} anteriores. Sin contar tus propias visitas.</p>
        </div>
        <nav className="an-periodos" aria-label="Periodo">
          {PERIODOS.map((p) => (
            <Link key={p} href={`/admin?dias=${p}`} className={p === dias ? "activo" : undefined} aria-current={p === dias ? "page" : undefined}>
              {p} días
            </Link>
          ))}
        </nav>
      </header>

      {sinVisitas && (
        <p className="an-aviso">
          Aún no hay visitas registradas. La medición empieza cuando se ejecuta <code>scripts/create-analitica.sql</code> en Supabase y se despliega la web.
        </p>
      )}

      {/* ── 0 · Cómo está la academia hoy ── */}
      <section className="an-estado" aria-label="Estado actual">
        <div className="an-estado-cifra">
          <span>Usuarios totales</span>
          <strong>{num(a.totalUsuarios)}</strong>
          <small>cuentas registradas</small>
        </div>
        <div className="an-estado-cifra">
          <span>Usuarios Premium</span>
          <strong>{num(a.premium.activos)}</strong>
          <small>{pct(a.premium.activos, a.totalUsuarios)} de los usuarios</small>
        </div>
        <div className="an-estado-cifra an-estado-cifra--dinero">
          <span>Ingreso bruto al mes</span>
          <strong>{euros(a.premium.mrr)}</strong>
          <small>{num(a.premium.activos)} × {precio} con los Premium de hoy</small>
        </div>
      </section>

      {/* ── 1 · Lo esencial ── */}
      <section className="an-kpis">
        <Kpi titulo="Visitantes al día" valor={mediaDia.ahora.toFixed(1).replace(".", ",")} c={mediaDia} nota="de media" />
        <Kpi titulo="Visitas" valor={num(a.visitas.ahora)} c={a.visitas} />
        <Kpi titulo="Registros" valor={num(a.registros.ahora)} c={a.registros} nota={`${pct(a.registros.ahora, a.visitas.ahora)} de las visitas`} />
        <Kpi titulo="Premium nuevos" valor={num(a.altas.ahora)} c={a.altas} nota={`${pct(a.altas.ahora, a.registros.ahora)} de los registros`} />
      </section>

      {/* ── 2 · ¿Llega más gente? ── */}
      <section className="an-tarjeta">
        <div className="an-tarjeta-cab">
          <h2>Visitantes únicos por día</h2>
          <span className="an-leyenda"><i className="an-leyenda-barra" /> cada día <i className="an-leyenda-linea" /> media de 7 días</span>
        </div>
        <Grafico serie={a.serie} />
      </section>

      {/* ── 3 · De dónde llegan ── */}
      <h2 className="an-seccion">De dónde llegan</h2>
      <div className="an-rejilla">
        <section className="an-tarjeta">
          <h3>Canal</h3>
          <p className="an-ayuda">Cómo llegó cada visita a su primera página.</p>
          <Barras filas={t.canales} />
        </section>
        <section className="an-tarjeta">
          <h3>País</h3>
          <Barras filas={t.paises} nombre={nombrePais} />
        </section>
        <section className="an-tarjeta">
          <h3>Dispositivo</h3>
          <Barras filas={t.dispositivos} nombre={(s) => DISPOSITIVOS[s] ?? s} />
          <h3 className="an-h3-segundo">Sistema</h3>
          <Barras filas={t.sistemas} />
        </section>
        <section className="an-tarjeta">
          <h3>Campañas (UTM)</h3>
          <Barras filas={t.campanas} vacio="Ningún enlace con UTM todavía" />
          <h3 className="an-h3-segundo">Webs que enlazan</h3>
          <Barras filas={t.referentes} vacio="Ninguna todavía" />
        </section>
      </div>

      {/* ── 4 · Qué hacen ── */}
      <h2 className="an-seccion">Qué hacen en la web</h2>
      <section className="an-kpis an-kpis--pequenos an-kpis--tres">
        <Kpi titulo="Páginas vistas" valor={num(a.vistas.ahora)} c={a.vistas} />
        <Kpi titulo="Páginas por visita" valor={a.visitas.ahora ? (a.vistas.ahora / a.visitas.ahora).toFixed(1).replace(".", ",") : "—"} />
        <Kpi titulo="Usuarios con sesión" valor={num(t.con_sesion)} nota="entraron con su cuenta" />
      </section>
      <div className="an-rejilla">
        <section className="an-tarjeta">
          <h3>Páginas más vistas</h3>
          <Tabla filas={t.paginas} cabeceras={["Página", "Vistas", "Visitas"]} />
        </section>
        <section className="an-tarjeta">
          <h3>Páginas de entrada</h3>
          <p className="an-ayuda">La primera página que ve cada visita: tu escaparate real.</p>
          <Tabla filas={t.entradas} cabeceras={["Página", "Entradas"]} />
        </section>
      </div>

      {/* ── 5 · De visita a cliente ── */}
      <h2 className="an-seccion">De visita a cliente</h2>
      <section className="an-embudo">
        {embudo.map((e, i) => (
          <div key={e.nombre} className="an-embudo-paso">
            <span className="an-embudo-nombre">{e.nombre}</span>
            <strong>{num(e.n)}</strong>
            <span className="an-embudo-nota">{e.nota}</span>
            {i > 0 && <span className="an-embudo-pct">{pct(e.n, embudo[i - 1].n)} del paso anterior</span>}
          </div>
        ))}
      </section>

      {/* ── 6 · Uso de la academia ── */}
      <h2 className="an-seccion">Uso de la academia</h2>
      <section className="an-kpis an-kpis--uso">
        {a.uso.map((u) => (
          <Kpi key={u.clave} titulo={u.etiqueta} valor={num(u.ahora)} c={u} />
        ))}
      </section>
      <section className="an-tarjeta">
        <h3>Cursos, desde su publicación</h3>
        <div className="an-tabla-envoltura">
          <table className="an-tabla">
            <thead><tr><th>Curso</th><th>Empezados</th><th>Certificados</th><th>Terminan</th></tr></thead>
            <tbody>
              {a.cursos.map((c) => (
                <tr key={c.titulo}>
                  <td>{c.titulo}</td>
                  <td className="an-num">{num(c.inscritos)}</td>
                  <td className="an-num">{num(c.certificados)}</td>
                  <td className="an-num">{pct(c.certificados, c.inscritos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── 7 · Premium ── */}
      <h2 className="an-seccion">Premium</h2>
      <section className="an-kpis an-kpis--tres">
        <Kpi titulo="Tasa de bajas" valor={pct(a.bajas.ahora, a.premium.activos + a.bajas.ahora)} nota="de quien podía irse en el periodo" />
        <Kpi titulo="Bajas" valor={num(a.bajas.ahora)} c={a.bajas} nota="en el periodo" />
        <Kpi titulo="Cancelarán" valor={num(a.premium.cancelaciones)} nota="al acabar su mes pagado" />
      </section>

      {/* ── 8 · Usuarios ── */}
      <h2 className="an-seccion">Últimos usuarios</h2>
      <section className="an-tarjeta">
        <div className="an-tabla-envoltura">
          <table className="an-tabla an-tabla--usuarios">
            <thead>
              <tr><th>Usuario</th><th>Alta</th><th>Último acceso</th><th>Actividad</th><th>Rol</th><th>2FA</th></tr>
            </thead>
            <tbody>
              {a.usuarios.length === 0 && (
                <tr><td colSpan={6} className="an-vacio">Aún no hay usuarios.</td></tr>
              )}
              {a.usuarios.map((u) => (
                <tr key={u.id}>
                  <td>
                    <span className="an-usuario">{u.full_name || u.alias || "Sin nombre"}</span>
                    <span className="an-usuario-email">{u.email ?? "—"}</span>
                  </td>
                  <td>{fecha(u.created_at, true)}</td>
                  <td>{fecha(u.last_seen)}</td>
                  <td className="an-num">{u.acciones ? num(u.acciones) : <span className="an-tenue">nada aún</span>}</td>
                  <td><UserRoleButton userId={u.id} role={u.role} /></td>
                  <td>{u.dosPasos ? <AdminMfaResetButton userId={u.id} /> : <span className="an-tenue">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="an-ayuda">«Actividad»: cursos empezados, operaciones, quizzes, términos y guías guardados, y días del Diario. Pulsa el rol para pasar a alguien entre gratuito y Premium.</p>
      </section>
    </div>
  );
}

function Tabla({ filas, cabeceras }: { filas: Fila[]; cabeceras: string[] }) {
  if (!filas.length) return <p className="an-vacio">Sin datos todavía</p>;
  return (
    <div className="an-tabla-envoltura">
      <table className="an-tabla">
        <thead><tr>{cabeceras.map((c) => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.nombre}>
              <td className="an-ruta">{f.nombre}</td>
              <td className="an-num">{num(f.n)}</td>
              {cabeceras.length > 2 && <td className="an-num">{num(f.visitantes ?? 0)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
