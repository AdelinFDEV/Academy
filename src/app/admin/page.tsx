import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import Icon from "@/components/Icon";
import UserRoleButton from "@/components/admin/UserRoleButton";
import AdminMfaResetButton from "@/components/admin/AdminMfaResetButton";
import { PREMIUM_PRICE_EUR } from "@/lib/stripe";
import { PERIODOS, cargarAnalitica, periodoDe, type Comparada, type Fila } from "@/lib/analitica";
import GraficoVisitas from "./GraficoVisitas";
import "./analitica.css";

/**
 * /admin · Analítica. Una sola página con lo que sirve para decidir: cuánta
 * gente llega y si va a más, de dónde, qué hace, cuántos se registran y pagan.
 * Los datos los prepara `src/lib/analitica.ts`; aquí solo se pintan.
 *
 * Cada bloque lleva su color (`--c`), siempre el mismo, para orientarse de un
 * vistazo: tráfico naranja, origen azul, comportamiento violeta, embudo rosa,
 * academia verde, Premium oro.
 */
export const dynamic = "force-dynamic";

type Color = "naranja" | "azul" | "violeta" | "verde" | "oro" | "rosa" | "turquesa";
const color = (c: Color) => ({ "--c": `var(--c-${c})`, "--c-rgb": `var(--c-${c}-rgb)` }) as CSSProperties;

const ZONA = "Europe/Bucharest";
const nf = new Intl.NumberFormat("es-ES", { useGrouping: "always" } as Intl.NumberFormatOptions);
const num = (n: number) => nf.format(Math.round(n));
const dec = (n: number) => n.toFixed(1).replace(".", ",");
const euros = (n: number) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const paisNombre = new Intl.DisplayNames(["es"], { type: "region" });

function nombrePais(codigo: string) {
  if (codigo === "??") return "Sin dato";
  try {
    return paisNombre.of(codigo) ?? codigo;
  } catch {
    return codigo;
  }
}

const DISPOSITIVOS: Record<string, { nombre: string; tono: string }> = {
  movil: { nombre: "Móvil", tono: "#3b82f6" },
  escritorio: { nombre: "Ordenador", tono: "#c4820e" },
  tablet: { nombre: "Tablet", tono: "#8b6fe0" },
};

function fecha(iso: string | null, conAno = false) {
  if (!iso) return "—";
  // `last_seen` es una fecha sin hora: a mediodía UTC para que la zona no la mueva de día.
  const t = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00Z` : iso;
  return new Date(t).toLocaleDateString("es-ES", { day: "numeric", month: "short", ...(conAno ? { year: "numeric" } : {}), timeZone: ZONA });
}

function pct(parte: number, total: number) {
  if (!total) return "—";
  const v = (parte / total) * 100;
  return `${v < 10 && v > 0 ? dec(v) : Math.round(v)} %`;
}

/** Variación frente al periodo anterior. `alReves`: bajar es lo bueno (rebote, bajas). */
function Cambio({ c, alReves = false }: { c: Comparada; alReves?: boolean }) {
  if (!c.antes && !c.ahora) return <span className="an-cambio an-cambio--igual">sin datos</span>;
  if (!c.antes) return <span className="an-cambio an-cambio--igual">nuevo</span>;
  const v = Math.round(((c.ahora - c.antes) / c.antes) * 100);
  const bueno = alReves ? v < 0 : v > 0;
  const clase = v === 0 ? "igual" : bueno ? "bien" : "mal";
  return (
    <span className={`an-cambio an-cambio--${clase}`} title="Frente al periodo anterior">
      {v > 0 ? "▲" : v < 0 ? "▼" : "="} {Math.abs(v)} %
    </span>
  );
}

function Kpi({ titulo, valor, c, nota, alReves }: { titulo: string; valor: string; c?: Comparada; nota?: string; alReves?: boolean }) {
  return (
    <div className="an-kpi">
      <span className="an-kpi-titulo">{titulo}</span>
      <strong className="an-kpi-valor">{valor}</strong>
      <span className="an-kpi-pie">
        {c && <Cambio c={c} alReves={alReves} />}
        {nota && <span>{nota}</span>}
      </span>
    </div>
  );
}

/** Un bloque de la página, con su color, su icono y su título. */
function Bloque({ tono, icono, titulo, ayuda, children }: { tono: Color; icono: Parameters<typeof Icon>[0]["name"]; titulo: string; ayuda: string; children: ReactNode }) {
  return (
    <section className="an-bloque" style={color(tono)}>
      <header className="an-bloque-cab">
        <span className="an-bloque-icono"><Icon name={icono} size={18} /></span>
        <div>
          <h2>{titulo}</h2>
          <p>{ayuda}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

function Tarjeta({ titulo, ayuda, children, tono }: { titulo: string; ayuda?: string; children: ReactNode; tono?: Color }) {
  return (
    <div className="an-tarjeta" style={tono ? color(tono) : undefined}>
      <h3>{titulo}</h3>
      {ayuda && <p className="an-ayuda">{ayuda}</p>}
      {children}
    </div>
  );
}

/** Lista con barra proporcional: magnitud, un solo color. */
function Barras({ filas, nombre = (s) => s, vacio = "Sin datos todavía" }: { filas: Fila[]; nombre?: (s: string) => string; vacio?: string }) {
  const total = filas.reduce((a, f) => a + f.n, 0);
  if (!total) return <p className="an-vacio">{vacio}</p>;
  const max = Math.max(...filas.map((f) => f.n));
  return (
    <ul className="an-barras">
      {filas.map((f) => (
        <li key={f.nombre}>
          <span className="an-barras-nombre" title={nombre(f.nombre)}>{nombre(f.nombre)}</span>
          <span className="an-barras-pista"><span style={{ width: `${Math.max((f.n / max) * 100, 2)}%` }} /></span>
          <span className="an-barras-n">{num(f.n)}</span>
          <span className="an-barras-pct">{pct(f.n, total)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Qué es una ruta: guía, término del diccionario, curso… */
function tipoDeRuta(ruta: string): string {
  if (ruta === "/") return "Portada";
  if (ruta === "/guias" || ruta.startsWith("/guias/")) return "Guía";
  if (ruta === "/glosario" || ruta.startsWith("/glosario/")) return "Diccionario";
  if (ruta === "/cursos" || ruta.startsWith("/cursos/")) return "Curso";
  if (ruta === "/foro" || ruta.startsWith("/foro/")) return "Foro";
  if (ruta.startsWith("/herramientas/") || ruta === "/premium") return "Herramienta";
  return "Otra";
}

function TablaPaginas({ filas, cabeceras, conTipo = false }: { filas: Fila[]; cabeceras: string[]; conTipo?: boolean }) {
  if (!filas.length) return <p className="an-vacio">Sin datos todavía</p>;
  const max = Math.max(...filas.map((f) => f.n));
  return (
    <div className="an-tabla-envoltura">
      <table className="an-tabla">
        <thead><tr>{cabeceras.map((c) => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.nombre}>
              <td className="an-ruta">
                <span className="an-ruta-fondo" style={{ width: `${(f.n / max) * 100}%` }} />
                <span>{f.nombre}</span>
              </td>
              {conTipo && <td className="an-num"><span className="an-tipo">{tipoDeRuta(f.nombre)}</span></td>}
              <td className="an-num">{num(f.n)}</td>
              {!conTipo && cabeceras.length > 2 && <td className="an-num">{num(f.visitantes ?? 0)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AnaliticaPage({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  const dias = periodoDe((await searchParams).dias);
  const a = await cargarAnalitica(dias);
  const t = a.trafico;

  const mediaDia = { ahora: a.visitas.ahora / dias, antes: a.visitas.antes / dias };
  const sinVisitas = a.visitas.ahora === 0 && a.visitas.antes === 0;
  const totalDisp = t.dispositivos.reduce((s, d) => s + d.n, 0);
  const totalGoogle = t.google_tipos.reduce((s, f) => s + f.n, 0);
  const totalEntradas = t.canales.reduce((s, f) => s + f.n, 0);
  const maxHora = Math.max(1, ...a.horas.map((h) => h.n));
  const horaPunta = a.horas.reduce((m, h) => (h.n > m.n ? h : m), a.horas[0]);

  const embudo = [
    { nombre: "Visitas", n: a.visitas.ahora, nota: "personas distintas cada día" },
    { nombre: "Registros", n: a.registros.ahora, nota: "cuentas nuevas" },
    { nombre: "Activados", n: a.activados, nota: "han usado algo de la academia" },
    { nombre: "Premium", n: a.altas.ahora, nota: "suscripciones nuevas" },
  ];
  const maxEmbudo = Math.max(1, embudo[0].n);

  return (
    <div className="admin-page an">
      <header className="admin-page-header">
        <div>
          <h1>Analítica</h1>
          <p className="admin-page-subtitle">
            Hoy y los {dias - 1} días anteriores, frente al periodo previo. No cuenta tus visitas ni tus acciones de administrador.
          </p>
        </div>
        <nav className="an-periodos" aria-label="Periodo">
          {PERIODOS.map((p) => (
            <Link key={p} href={`/admin?dias=${p}`} className={p === dias ? "activo" : undefined} aria-current={p === dias ? "page" : undefined}>
              {p} días
            </Link>
          ))}
        </nav>
      </header>

      {a.faltaSql ? (
        <p className="an-aviso an-aviso--error">
          Falta ejecutar <code>scripts/create-analitica.sql</code> en Supabase: sin sus funciones, esta página no puede calcular nada.
        </p>
      ) : sinVisitas && (
        <p className="an-aviso">
          Aún no hay visitas en este periodo. Solo cuentan las de la web publicada: ni las tuyas, ni las de pruebas en local.
        </p>
      )}

      {/* ── Cómo está la academia hoy ── */}
      <section className="an-estado" aria-label="Estado actual">
        <div className="an-estado-cifra" style={color("azul")}>
          <span className="an-estado-icono"><Icon name="users" size={20} /></span>
          <span className="an-estado-titulo">Usuarios totales</span>
          <strong>{num(a.totalUsuarios)}</strong>
          <small>cuentas registradas</small>
        </div>
        <div className="an-estado-cifra" style={color("oro")}>
          <span className="an-estado-icono"><Icon name="crown" size={20} /></span>
          <span className="an-estado-titulo">Usuarios Premium</span>
          <strong>{num(a.premium.activos)}</strong>
          <small>
            {pct(a.premium.activos, a.totalUsuarios)} de los usuarios
            {a.premium.activos !== a.premium.dePago && ` · ${num(a.premium.dePago)} de pago`}
          </small>
        </div>
        <div className="an-estado-cifra" style={color("verde")}>
          <span className="an-estado-icono"><Icon name="trending" size={20} /></span>
          <span className="an-estado-titulo">Ingreso bruto al mes</span>
          <strong>{euros(a.premium.mrr)}</strong>
          <small>{num(a.premium.dePago)} suscripciones × {euros(PREMIUM_PRICE_EUR)}</small>
        </div>
      </section>

      {/* ── Tráfico ── */}
      <Bloque tono="naranja" icono="activity" titulo="Tráfico" ayuda="Cuánta gente llega, y si va a más.">
        <div className="an-kpis">
          <Kpi titulo="Visitantes al día" valor={dec(mediaDia.ahora)} c={mediaDia} nota="de media" />
          <Kpi titulo="Visitas" valor={num(a.visitas.ahora)} c={a.visitas} nota="personas por día" />
          <Kpi titulo="Páginas vistas" valor={num(a.vistas.ahora)} c={a.vistas} />
          <Kpi titulo="Rebote" valor={a.visitas.ahora ? `${Math.round(a.rebote.ahora)} %` : "—"} c={a.rebote} alReves nota="ven una página y se van" />
        </div>
        <div className="an-tarjeta">
          <div className="an-tarjeta-cab">
            <h3>Visitantes únicos por día</h3>
            <span className="an-leyenda"><i className="an-leyenda-barra" /> Visitantes <i className="an-leyenda-linea" /> Media de 7 días</span>
          </div>
          <GraficoVisitas serie={a.serie} />
        </div>
      </Bloque>

      {/* ── Origen ── */}
      <Bloque tono="azul" icono="globe" titulo="De dónde llegan" ayuda="El origen de cada visita: canal, país y dispositivo.">
        <div className="an-rejilla">
          <Tarjeta titulo="Canal" ayuda="Cómo llegó cada visita a su primera página.">
            <Barras filas={t.canales} />
          </Tarjeta>
          <Tarjeta titulo="País" tono="turquesa">
            <Barras filas={t.paises} nombre={nombrePais} />
          </Tarjeta>
          <Tarjeta titulo="Dispositivo">
            {totalDisp ? (
              <>
                <div className="an-partes" role="img" aria-label="Reparto por dispositivo">
                  {t.dispositivos.map((d) => (
                    <span key={d.nombre} style={{ flexGrow: d.n, background: DISPOSITIVOS[d.nombre]?.tono }} title={`${DISPOSITIVOS[d.nombre]?.nombre ?? d.nombre}: ${num(d.n)}`} />
                  ))}
                </div>
                <ul className="an-partes-leyenda">
                  {t.dispositivos.map((d) => (
                    <li key={d.nombre}>
                      <i style={{ background: DISPOSITIVOS[d.nombre]?.tono }} />
                      {DISPOSITIVOS[d.nombre]?.nombre ?? d.nombre}
                      <b>{pct(d.n, totalDisp)}</b>
                      <small>{num(d.n)}</small>
                    </li>
                  ))}
                </ul>
              </>
            ) : <p className="an-vacio">Sin datos todavía</p>}
            <h3 className="an-h3-segundo">Sistema</h3>
            <Barras filas={t.sistemas} />
          </Tarjeta>
          <Tarjeta titulo="Campañas (UTM)" tono="violeta">
            <Barras filas={t.campanas} vacio="Ningún enlace con UTM todavía" />
            <h3 className="an-h3-segundo">Webs que enlazan</h3>
            <Barras filas={t.referentes} vacio="Ninguna todavía" />
          </Tarjeta>
        </div>
      </Bloque>

      {/* ── Google ── */}
      <Bloque tono="turquesa" icono="search" titulo="Lo que trae Google" ayuda="Visitas que entraron desde el buscador por su cuenta, sin anuncios ni enlaces con UTM: lo que ya está posicionado.">
        <div className="an-rejilla">
          <Tarjeta titulo="Páginas que más entran desde Google" ayuda={`${num(totalGoogle)} ${totalGoogle === 1 ? "entrada" : "entradas"} desde Google en este periodo${totalEntradas ? `, el ${pct(totalGoogle, totalEntradas)} de todas` : ""}.`}>
            {t.google.length ? (
              <TablaPaginas filas={t.google} cabeceras={["Página", "Tipo", "Entradas"]} conTipo />
            ) : <p className="an-vacio">Google todavía no ha traído ninguna visita en este periodo</p>}
          </Tarjeta>
          <Tarjeta titulo="Por tipo de página" ayuda="Si lo que posiciona son las guías, el diccionario o los cursos.">
            <Barras filas={t.google_tipos} vacio="Sin entradas desde Google todavía" />
          </Tarjeta>
        </div>
      </Bloque>

      {/* ── Comportamiento ── */}
      <Bloque tono="violeta" icono="compass" titulo="Qué hacen en la web" ayuda="Por dónde entran, qué leen y a qué hora.">
        <div className="an-kpis an-kpis--tres">
          <Kpi titulo="Páginas por visita" valor={a.visitas.ahora ? dec(a.vistas.ahora / a.visitas.ahora) : "—"} />
          <Kpi titulo="Usuarios con sesión" valor={num(t.con_sesion)} nota="navegaron con su cuenta" />
          <Kpi titulo="Hora punta" valor={a.vistas.ahora ? `${String(horaPunta.hora).padStart(2, "0")}:00` : "—"} nota="hora de Rumanía" />
        </div>
        <div className="an-tarjeta">
          <h3>Actividad por hora</h3>
          <p className="an-ayuda">Páginas vistas en cada hora del día (hora de Rumanía). Sirve para elegir cuándo publicar.</p>
          <div className="an-horas" role="img" aria-label="Páginas vistas por hora del día">
            {a.horas.map((h) => (
              <div key={h.hora} className="an-hora" title={`${String(h.hora).padStart(2, "0")}:00 · ${num(h.n)} páginas`}>
                <span className="an-hora-barra" style={{ height: `${(h.n / maxHora) * 100}%` }} />
                <span className="an-hora-etiqueta">{h.hora % 3 === 0 ? String(h.hora).padStart(2, "0") : ""}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="an-rejilla">
          <Tarjeta titulo="Páginas más vistas">
            <TablaPaginas filas={t.paginas} cabeceras={["Página", "Vistas", "Visitas"]} />
          </Tarjeta>
          <Tarjeta titulo="Páginas de entrada" ayuda="La primera página que ve cada visita: tu escaparate real.">
            <TablaPaginas filas={t.entradas} cabeceras={["Página", "Entradas"]} />
          </Tarjeta>
        </div>
      </Bloque>

      {/* ── Embudo ── */}
      <Bloque tono="rosa" icono="filter" titulo="De visita a cliente" ayuda="Cuántos pasan de cada paso al siguiente, en este periodo.">
        <div className="an-tarjeta an-embudo">
          {embudo.map((e, i) => (
            <div key={e.nombre} className="an-embudo-fila">
              <div className="an-embudo-texto">
                <b>{e.nombre}</b>
                <small>{e.nota}</small>
              </div>
              <div className="an-embudo-pista">
                <span style={{ width: `${Math.max((e.n / maxEmbudo) * 100, e.n ? 3 : 0)}%`, opacity: 1 - i * 0.17 }} />
              </div>
              <strong>{num(e.n)}</strong>
              <span className="an-embudo-pct">{i === 0 ? "" : pct(e.n, embudo[i - 1].n)}</span>
            </div>
          ))}
          <p className="an-ayuda">El porcentaje es sobre el paso anterior. «Activados»: registros del periodo que ya han empezado un curso, apuntado una operación, hecho un quiz o guardado algo.</p>
        </div>
      </Bloque>

      {/* ── Academia ── */}
      <Bloque tono="verde" icono="book" titulo="Uso de la academia" ayuda="Lo que hacen tus usuarios con cursos, Diario y guías.">
        <div className="an-kpis an-kpis--uso">
          {a.uso.map((u) => (
            <Kpi key={u.clave} titulo={u.etiqueta} valor={num(u.ahora)} c={u} />
          ))}
        </div>
        <div className="an-tarjeta">
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
                    <td className="an-num">
                      <span className="an-medidor"><span style={{ width: `${c.inscritos ? Math.min((c.certificados / c.inscritos) * 100, 100) : 0}%` }} /></span>
                      {pct(c.certificados, c.inscritos)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Bloque>

      {/* ── Premium ── */}
      <Bloque tono="oro" icono="crown" titulo="Premium" ayuda="Altas, bajas y lo que está por venir.">
        <div className="an-kpis">
          <Kpi titulo="Altas" valor={num(a.altas.ahora)} c={a.altas} nota={`${pct(a.altas.ahora, a.registros.ahora)} de los registros`} />
          <Kpi titulo="Bajas" valor={num(a.bajas.ahora)} c={a.bajas} alReves nota="en el periodo" />
          <Kpi titulo="Tasa de bajas" valor={pct(a.bajas.ahora, a.premium.activos + a.bajas.ahora)} nota="de quien podía irse" />
          <Kpi titulo="Cancelarán" valor={num(a.premium.cancelaciones)} nota="al acabar su mes pagado" />
        </div>
      </Bloque>

      {/* ── Usuarios ── */}
      <Bloque tono="azul" icono="users" titulo="Últimos usuarios" ayuda="Los 30 registros más recientes y lo que han hecho.">
        <div className="an-tarjeta">
          <div className="an-tabla-envoltura">
            <table className="an-tabla an-tabla--usuarios">
              <thead>
                <tr><th>Usuario</th><th>Alta</th><th>Último acceso</th><th>Actividad</th><th>Rol</th><th>2FA</th></tr>
              </thead>
              <tbody>
                {a.usuarios.length === 0 && (
                  <tr><td colSpan={6} className="an-vacio">Aún no hay usuarios.</td></tr>
                )}
                {a.usuarios.map((u) => {
                  const nombre = u.full_name || u.alias || "Sin nombre";
                  return (
                    <tr key={u.id}>
                      <td>
                        <span className="an-usuario">
                          <span className="an-usuario-inicial" aria-hidden="true">{nombre[0].toUpperCase()}</span>
                          <span>
                            <b>{nombre}</b>
                            <small>{u.email ?? "—"}</small>
                          </span>
                        </span>
                      </td>
                      <td>{fecha(u.created_at, true)}</td>
                      <td>{fecha(u.last_seen)}</td>
                      <td className="an-num">{u.acciones ? <span className="an-pastilla">{num(u.acciones)}</span> : <span className="an-tenue">nada aún</span>}</td>
                      <td><UserRoleButton userId={u.id} role={u.role} /></td>
                      <td>{u.dosPasos ? <AdminMfaResetButton userId={u.id} /> : <span className="an-tenue">—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="an-ayuda">«Actividad»: cursos empezados, lecciones, operaciones, días del Diario, quizzes y términos o guías guardados. Pulsa el rol para pasar a alguien entre gratuito y Premium.</p>
        </div>
      </Bloque>
    </div>
  );
}
