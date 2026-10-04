"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ANIMOS, ANIMO_EMOJI, EMOCIONES, EMOCION_EMOJI, METRICAS, type Emocion, type Nota, type ObjetivoConProgreso } from "@/lib/objetivos";
import { CamposNota, cifra, enviar, fechaCorta, nombreMes, notaVacia, sumarDias, useEditor } from "../editor";

type Props = { hoy: string; objetivos: ObjetivoConProgreso[]; notas: Nota[]; publicaciones: string[] };

const DIAS_GRAFICA = 60;
const SEMANAS = 12;
const POR_PAGINA = 12;

/** Dónde se guarda lo que estás escribiendo, en ESTE navegador, hasta que lo guardes. */
const CLAVE_BORRADOR = "adelinbtc:diario-borrador";

/** Las preguntas guía. Se añaden al texto; se pueden borrar o contestar como quieras. */
const PREGUNTAS = [
  "¿Qué ha funcionado esta semana?",
  "¿Qué te pesa ahora mismo?",
  "¿Qué cambiarías la semana que viene?",
  "¿De qué estás orgulloso?",
];

function media(valores: number[]): number | null {
  return valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : null;
}

/** El lunes de la semana de `fecha`. */
function lunesDe(fecha: string): string {
  const dia = (new Date(`${fecha}T00:00:00Z`).getUTCDay() + 6) % 7;
  return sumarDias(fecha, -dia);
}

/** Minúsculas y sin tildes: «animo» encuentra «ánimo». */
function normalizar(t: string): string {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Todo el análisis, a partir de las notas y de `hoy` (nunca de Date.now en el render). */
function analizar(notas: Nota[], hoy: string, publicaciones: string[], objetivos: ObjetivoConProgreso[]) {
  const conAnimo = notas.filter((n) => n.animo !== null) as (Nota & { animo: number })[];
  const desde30 = sumarDias(hoy, -29);
  const desde60 = sumarDias(hoy, -59);

  const ultimos30 = conAnimo.filter((n) => n.fecha >= desde30 && n.fecha <= hoy);
  const previos30 = conAnimo.filter((n) => n.fecha >= desde60 && n.fecha < desde30);
  const media30 = media(ultimos30.map((n) => n.animo));
  const mediaPrev = media(previos30.map((n) => n.animo));

  // Ánimo de cada día de los últimos 60: la media si ese día hay varias notas.
  const porDia = Array.from({ length: DIAS_GRAFICA }, (_, i) => {
    const fecha = sumarDias(hoy, i - DIAS_GRAFICA + 1);
    const valores = conAnimo.filter((n) => n.fecha === fecha).map((n) => n.animo);
    return { fecha, valor: media(valores) };
  });

  const reparto = ANIMOS.map((texto, i) => ({
    nivel: i + 1,
    texto,
    total: conAnimo.filter((n) => n.animo === i + 1).length,
  }));

  const mesActual = hoy.slice(0, 7);
  const meses = Array.from({ length: 6 }, (_, i) => {
    const [a, m] = mesActual.split("-").map(Number);
    const mes = new Date(Date.UTC(a, m - 1 - (5 - i), 1)).toISOString().slice(0, 7);
    const valores = conAnimo.filter((n) => n.fecha.startsWith(mes)).map((n) => n.animo);
    return { mes, valor: media(valores), notas: valores.length };
  });

  const emociones = (Object.keys(EMOCIONES) as Emocion[])
    .map((e) => {
      const deEsta = notas.filter((n) => n.emocion === e);
      return {
        emocion: e,
        total: deEsta.length,
        animo: media(deEsta.filter((n) => n.animo !== null).map((n) => n.animo as number)),
      };
    })
    .filter((e) => e.total > 0)
    .sort((a, b) => b.total - a.total);

  // Ánimo frente a lo publicado, semana a semana (lunes a domingo).
  const lunesHoy = lunesDe(hoy);
  const semanas = Array.from({ length: SEMANAS }, (_, i) => {
    const lunes = sumarDias(lunesHoy, (i - SEMANAS + 1) * 7);
    const domingo = sumarDias(lunes, 6);
    const enSemana = (f: string) => f >= lunes && f <= domingo;
    return {
      lunes,
      animo: media(conAnimo.filter((n) => enSemana(n.fecha)).map((n) => n.animo)),
      publicado: publicaciones.filter(enSemana).length,
    };
  });
  const conDato = semanas.filter((s) => s.animo !== null);
  const conPub = conDato.filter((s) => s.publicado > 0);
  const sinPub = conDato.filter((s) => s.publicado === 0);
  const comparacion =
    conPub.length >= 2 && sinPub.length >= 2
      ? {
          con: media(conPub.map((s) => s.animo as number)) as number,
          sin: media(sinPub.map((s) => s.animo as number)) as number,
          semanasCon: conPub.length,
          semanasSin: sinPub.length,
        }
      : null;

  // Ánimo por objetivo: con qué ánimo escribes de cada uno.
  const porObjetivo = objetivos
    .map((o) => {
      const deEste = conAnimo.filter((n) => n.objetivo_id === o.id);
      return { id: o.id, titulo: o.titulo, animo: media(deEste.map((n) => n.animo)), notas: deEste.length };
    })
    .filter((o) => o.notas > 0)
    .sort((a, b) => b.notas - a.notas);

  // Racha: días seguidos con alguna nota, terminando hoy o ayer.
  const dias = new Set(notas.map((n) => n.fecha));
  let racha = 0;
  let cursor = dias.has(hoy) ? hoy : sumarDias(hoy, -1);
  while (dias.has(cursor)) {
    racha++;
    cursor = sumarDias(cursor, -1);
  }

  return {
    media30, mediaPrev, porDia, reparto, meses, emociones, semanas, comparacion, porObjetivo, racha,
    notasMes: notas.filter((n) => n.fecha.startsWith(mesActual)).length,
    totalConAnimo: conAnimo.length,
  };
}

function nivel(v: number): number {
  return Math.min(5, Math.max(1, Math.round(v)));
}

function textoAnimo(v: number): string {
  return ANIMOS[nivel(v) - 1];
}

function emojiAnimo(v: number): string {
  return ANIMO_EMOJI[nivel(v) - 1];
}

function leerBorrador(): Record<string, string | boolean> | null {
  try {
    const crudo = window.localStorage.getItem(CLAVE_BORRADOR);
    return crudo ? (JSON.parse(crudo) as Record<string, string | boolean>) : null;
  } catch {
    return null;
  }
}

function escribirBorrador(datos: Record<string, string | boolean> | null) {
  try {
    if (datos && String(datos.texto).trim()) window.localStorage.setItem(CLAVE_BORRADOR, JSON.stringify(datos));
    else window.localStorage.removeItem(CLAVE_BORRADOR);
  } catch {
    // Navegación privada o almacenamiento bloqueado: se escribe igual, solo
    // que sin red de seguridad.
  }
}

export default function SeccionDiario({ hoy, objetivos, notas, publicaciones }: Props) {
  const router = useRouter();
  const editor = useEditor(objetivos);
  const [borrador, setBorrador] = useState<Record<string, string | boolean>>(() => notaVacia(hoy));
  const [recuperado, setRecuperado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState<Emocion | "">("");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const cargado = useRef(false);

  // Recupera lo que se quedó a medias. Va en un efecto y no en el estado
  // inicial porque el servidor no tiene localStorage: leerlo al pintar haría
  // que el HTML del servidor y el del navegador no coincidieran.
  useEffect(() => {
    if (cargado.current) return;
    cargado.current = true;
    const guardado = leerBorrador();
    if (guardado && String(guardado.texto).trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- es la lectura inicial de localStorage, una sola vez
      setBorrador({ ...notaVacia(hoy), ...guardado });
      setRecuperado(true);
    }
  }, [hoy]);

  const a = analizar(notas, hoy, publicaciones, objetivos);
  const anclas = notas.filter((n) => n.ancla);
  const q = normalizar(busqueda.trim());
  const filtradas = notas.filter(
    (n) => !n.ancla && (!filtro || n.emocion === filtro) && (!q || normalizar(n.texto).includes(q))
  );
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtradas.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);

  const maxReparto = Math.max(1, ...a.reparto.map((r) => r.total));
  const maxEmocion = Math.max(1, ...a.emociones.map((e) => e.total));
  const maxPublicado = Math.max(1, ...a.semanas.map((s) => s.publicado));
  const delta = a.media30 !== null && a.mediaPrev !== null ? a.media30 - a.mediaPrev : null;

  function cambiar(campo: string, valor: string | boolean) {
    setBorrador((b) => {
      const nuevo = { ...b, [campo]: valor };
      escribirBorrador(nuevo);
      return nuevo;
    });
  }

  function preguntar(pregunta: string) {
    const actual = String(borrador.texto).trimEnd();
    cambiar("texto", `${actual}${actual ? "\n\n" : ""}${pregunta}\n`);
  }

  function descartar() {
    if (!confirm("¿Descartar lo que llevas escrito?")) return;
    escribirBorrador(null);
    setBorrador(notaVacia(hoy));
    setRecuperado(false);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError("");
    const fallo = await enviar("nota", null, borrador);
    setGuardando(false);
    if (fallo) return setError(fallo);
    escribirBorrador(null);
    setBorrador(notaVacia(hoy));
    setRecuperado(false);
    router.refresh();
  }

  return (
    <>
      {/* ── Escribir ─────────────────────────────────────────────── */}
      <div className="obj-barra-seccion">
        <div>
          <h2 className="obj-titulo-seccion">📓 ¿Cómo va el proyecto hoy?</h2>
          <p className="obj-sub-seccion">Escribe sin filtro. Con el ánimo y la emoción, el diario te enseñará patrones que solos no se ven.</p>
        </div>
      </div>
      <form className="obj-diario" onSubmit={guardar}>
        {recuperado && (
          <p className="obj-recuperado">
            ♻️ Has recuperado lo que dejaste a medias.{" "}
            <button type="button" className="obj-enlace" onClick={descartar}>Descartarlo</button>
          </p>
        )}

        <div className="obj-preguntas">
          <span className="obj-etiqueta">💬 Si no sabes por dónde empezar</span>
          <div className="obj-preguntas-lista">
            {PREGUNTAS.map((p) => (
              <button type="button" key={p} className="obj-pregunta" onClick={() => preguntar(p)}>
                ＋ {p}
              </button>
            ))}
          </div>
        </div>

        <CamposNota d={borrador} cambiar={cambiar} objetivos={objetivos} filasTexto={8} autoFocus={false} />
        {error && <p className="auth-error">{error}</p>}
        <div className="obj-diario-acciones">
          <span className="obj-ayuda">
            🔒 Solo lo ves tú. Mientras escribes se guarda en este navegador, por si cierras la pestaña.
          </span>
          <button type="submit" className="obj-boton obj-boton--principal" disabled={guardando || !String(borrador.texto).trim()}>
            {guardando ? "Guardando…" : "💾 Guardar en el diario"}
          </button>
        </div>
      </form>

      {/* ── Análisis ─────────────────────────────────────────────── */}
      <h2 className="obj-titulo-seccion obj-titulo-seccion--espacio">📊 Cómo te has sentido</h2>

      {a.totalConAnimo === 0 ? (
        <div className="obj-vacio-grande">
          <span className="obj-vacio-emoji" aria-hidden="true">🌱</span>
          <strong>Tu análisis empieza con tu primera nota</strong>
          <p>
            Cuando escribas eligiendo cómo te sientes, aquí verás cómo evoluciona tu ánimo, qué emociones se repiten,
            cómo te sientes con cada objetivo y si estás mejor las semanas que publicas.
          </p>
        </div>
      ) : (
        <>
          <div className="obj-tiles">
            <div className="obj-tile obj-tile--destacado">
              <span className="obj-tile-emoji" aria-hidden="true">{a.media30 !== null ? emojiAnimo(a.media30) : "😶"}</span>
              <span className="cp-card-label">Ánimo, últimos 30 días</span>
              <strong className="cp-card-value">{a.media30 !== null ? cifra(a.media30) : "—"}</strong>
              <span className="cp-card-foot">
                {a.media30 !== null ? `${textoAnimo(a.media30)} de media` : "sin notas con ánimo"}
                {delta !== null && ` · ${delta >= 0 ? "+" : ""}${cifra(delta)} frente a los 30 anteriores`}
              </span>
            </div>
            <div className="obj-tile">
              <span className="obj-tile-emoji" aria-hidden="true">✍️</span>
              <span className="cp-card-label">Notas este mes</span>
              <strong className="cp-card-value">{a.notasMes}</strong>
              <span className="cp-card-foot">{nombreMes(hoy.slice(0, 7))}</span>
            </div>
            <div className="obj-tile">
              <span className="obj-tile-emoji" aria-hidden="true">{a.racha >= 7 ? "🔥" : a.racha ? "⚡" : "💤"}</span>
              <span className="cp-card-label">Días seguidos escribiendo</span>
              <strong className="cp-card-value">{a.racha}</strong>
              <span className="cp-card-foot">{a.racha >= 7 ? "¡racha de fuego!" : a.racha ? "sigue así" : "escribe hoy para empezar la racha"}</span>
            </div>
            <div className="obj-tile">
              <span className="obj-tile-emoji" aria-hidden="true">{a.emociones.length ? EMOCION_EMOJI[a.emociones[0].emocion] : "🫥"}</span>
              <span className="cp-card-label">Emoción más repetida</span>
              <strong className="cp-card-value obj-valor-texto">
                {a.emociones.length ? EMOCIONES[a.emociones[0].emocion] : "—"}
              </strong>
              <span className="cp-card-foot">
                {a.emociones.length ? `${a.emociones[0].total} nota${a.emociones[0].total === 1 ? "" : "s"}` : "aún sin emociones"}
              </span>
            </div>
          </div>

          {/* Ánimo frente a lo publicado */}
          <figure className="obj-grafica">
            <figcaption className="obj-grafica-titulo">¿Te sientes mejor las semanas que publicas? · últimas {SEMANAS} semanas</figcaption>
            {a.comparacion ? (
              <p className="obj-conclusion">
                {a.comparacion.con > a.comparacion.sin + 0.2 ? "🚀 " : a.comparacion.sin > a.comparacion.con + 0.2 ? "🤔 " : "⚖️ "}
                Las semanas que publicas, tu ánimo medio es{" "}
                <strong>{emojiAnimo(a.comparacion.con)} {cifra(a.comparacion.con)}</strong> ({textoAnimo(a.comparacion.con)}); las
                que no, <strong>{emojiAnimo(a.comparacion.sin)} {cifra(a.comparacion.sin)}</strong> ({textoAnimo(a.comparacion.sin)}). Sobre {a.comparacion.semanasCon} semanas con publicaciones y{" "}
                {a.comparacion.semanasSin} sin.
              </p>
            ) : (
              <p className="obj-conclusion">
                Faltan semanas para compararlo: hacen falta al menos dos con publicaciones y dos sin, con notas de ánimo.
              </p>
            )}
            <div className="obj-semanas">
              {a.semanas.map((s) => (
                <div
                  key={s.lunes}
                  className="obj-semanas-col"
                  data-tip={`Semana del ${fechaCorta(s.lunes)}: ${s.animo === null ? "sin ánimo" : `ánimo ${cifra(s.animo)}`} · ${s.publicado} publicado${s.publicado === 1 ? "" : "s"}`}
                >
                  <div className="obj-semanas-animo">
                    {s.animo !== null && (
                      <div className={`obj-dias-barra obj-nivel--${Math.round(s.animo)}`} style={{ height: `${(s.animo / 5) * 100}%` }} />
                    )}
                  </div>
                  <div className="obj-semanas-pub">
                    <div className="obj-semanas-pub-barra" style={{ height: `${(s.publicado / maxPublicado) * 100}%` }} />
                  </div>
                  <span className="obj-semanas-fecha">{fechaCorta(s.lunes)}</span>
                </div>
              ))}
            </div>
            <div className="obj-leyenda">
              <span><i className="obj-punto obj-nivel--4" /> Ánimo de la semana (arriba)</span>
              <span><i className="obj-punto obj-semanas-pub-barra" /> Lo publicado: entradas y vídeos (abajo)</span>
            </div>
          </figure>

          {/* Ánimo día a día */}
          <figure className="obj-grafica">
            <figcaption className="obj-grafica-titulo">Ánimo día a día · últimos {DIAS_GRAFICA} días</figcaption>
            <div className="obj-dias">
              <div className="obj-dias-eje" aria-hidden="true"><span>5</span><span>3</span><span>1</span></div>
              <div className="obj-dias-barras">
                {a.porDia.map((d) => (
                  <div
                    key={d.fecha}
                    className="obj-dias-col"
                    data-tip={d.valor === null ? `${fechaCorta(d.fecha)}: sin nota` : `${fechaCorta(d.fecha)}: ${emojiAnimo(d.valor)} ${cifra(d.valor)} · ${textoAnimo(d.valor)}`}
                  >
                    {d.valor !== null && (
                      <div className={`obj-dias-barra obj-nivel--${Math.round(d.valor)}`} style={{ height: `${(d.valor / 5) * 100}%` }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="obj-dias-fechas">
              <span>{fechaCorta(a.porDia[0].fecha)}</span>
              <span>hoy</span>
            </div>
          </figure>

          <div className="obj-graficas-fila">
            <figure className="obj-grafica">
              <figcaption className="obj-grafica-titulo">Reparto del ánimo · todas las notas</figcaption>
              {a.reparto.slice().reverse().map((r) => (
                <div key={r.nivel} className="obj-hbarra" data-tip={`${r.total} nota${r.total === 1 ? "" : "s"}`}>
                  <span className="obj-hbarra-etiqueta"><span className="obj-hbarra-emoji" aria-hidden="true">{ANIMO_EMOJI[r.nivel - 1]}</span> {r.texto}</span>
                  <div className="obj-hbarra-pista">
                    <div className={`obj-hbarra-relleno obj-nivel--${r.nivel}`} style={{ width: `${(r.total / maxReparto) * 100}%` }} />
                  </div>
                  <span className="obj-hbarra-valor">
                    {r.total}
                    <small>{Math.round((r.total / a.totalConAnimo) * 100)} %</small>
                  </span>
                </div>
              ))}
            </figure>

            <figure className="obj-grafica">
              <figcaption className="obj-grafica-titulo">Ánimo medio por mes</figcaption>
              <div className="obj-meses">
                {a.meses.map((m) => (
                  <div key={m.mes} className="obj-meses-col" data-tip={m.valor === null ? "sin notas" : `${cifra(m.valor)} en ${m.notas} nota${m.notas === 1 ? "" : "s"}`}>
                    <span className="obj-meses-valor">{m.valor === null ? "—" : cifra(m.valor)}</span>
                    <div className="obj-meses-pista">
                      {m.valor !== null && (
                        <div className={`obj-meses-barra obj-nivel--${Math.round(m.valor)}`} style={{ height: `${(m.valor / 5) * 100}%` }} />
                      )}
                    </div>
                    <span className="obj-meses-nombre">{nombreMes(m.mes, true)}</span>
                  </div>
                ))}
              </div>
            </figure>
          </div>

          <div className="obj-graficas-fila">
            <figure className="obj-grafica">
              <figcaption className="obj-grafica-titulo">Con qué ánimo escribes de cada objetivo</figcaption>
              {a.porObjetivo.length === 0 ? (
                <p className="obj-conclusion">Enlaza tus notas a un objetivo al escribirlas y aquí verás cómo te sientes con cada uno.</p>
              ) : (
                a.porObjetivo.map((o) => (
                  <div key={o.id} className="obj-hbarra">
                    <span className="obj-hbarra-etiqueta" title={o.titulo}><span className="obj-hbarra-emoji" aria-hidden="true">{emojiAnimo(o.animo as number)}</span> {o.titulo}</span>
                    <div className="obj-hbarra-pista">
                      <div className={`obj-hbarra-relleno obj-nivel--${Math.round(o.animo as number)}`} style={{ width: `${((o.animo as number) / 5) * 100}%` }} />
                    </div>
                    <span className="obj-hbarra-valor">
                      {cifra(o.animo as number)}
                      <small>{o.notas} nota{o.notas === 1 ? "" : "s"}</small>
                    </span>
                  </div>
                ))
              )}
            </figure>

            {a.emociones.length > 0 && (
              <figure className="obj-grafica">
                <figcaption className="obj-grafica-titulo">Emociones que más se repiten, y el ánimo con que aparecen</figcaption>
                {a.emociones.map((e) => (
                  <div key={e.emocion} className="obj-hbarra">
                    <span className="obj-hbarra-etiqueta"><span className="obj-hbarra-emoji" aria-hidden="true">{EMOCION_EMOJI[e.emocion]}</span> {EMOCIONES[e.emocion]}</span>
                    <div className="obj-hbarra-pista">
                      <div className="obj-hbarra-relleno obj-hbarra-relleno--neutro" style={{ width: `${(e.total / maxEmocion) * 100}%` }} />
                    </div>
                    <span className="obj-hbarra-valor">
                      {e.total}
                      <small>{e.animo !== null ? `${emojiAnimo(e.animo)} ${cifra(e.animo)}` : "sin ánimo"}</small>
                    </span>
                  </div>
                ))}
              </figure>
            )}
          </div>
        </>
      )}

      {/* ── Notas ────────────────────────────────────────────────── */}
      {anclas.length > 0 && (
        <>
          <h2 className="obj-titulo-seccion obj-titulo-seccion--espacio">📌 Fijadas</h2>
          <div className="obj-notas">
            {anclas.map((n) => <TarjetaNota key={n.id} n={n} objetivos={objetivos} onEditar={() => editor.editarNota(n)} />)}
          </div>
        </>
      )}

      <div className="obj-barra-seccion obj-barra-seccion--espacio">
        <h2 className="obj-titulo-seccion">📚 Tus notas</h2>
        <div className="obj-filtros">
          <input
            type="search"
            className="obj-filtro"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(1);
            }}
            placeholder="🔎 Buscar en tus notas"
            aria-label="Buscar en tus notas"
          />
          {a.emociones.length > 0 && (
            <select
              className="obj-filtro"
              value={filtro}
              onChange={(e) => {
                setFiltro(e.target.value as Emocion | "");
                setPagina(1);
              }}
              aria-label="Filtrar por emoción"
            >
              <option value="">Todas las emociones</option>
              {a.emociones.map((e) => <option key={e.emocion} value={e.emocion}>{EMOCION_EMOJI[e.emocion]} {EMOCIONES[e.emocion]}</option>)}
            </select>
          )}
        </div>
      </div>

      {visibles.length === 0 ? (
        <p className="obj-vacio">
          {q || filtro ? "🔎 No hay notas que coincidan." : "✍️ Todavía no has escrito nada. Empieza por cómo te sientes hoy con el proyecto."}
        </p>
      ) : (
        <>
          {(q || filtro) && <p className="obj-ayuda">{filtradas.length} nota{filtradas.length === 1 ? "" : "s"} encontrada{filtradas.length === 1 ? "" : "s"}</p>}
          <div className="obj-notas">
            {visibles.map((n) => <TarjetaNota key={n.id} n={n} objetivos={objetivos} onEditar={() => editor.editarNota(n)} />)}
          </div>
          {totalPaginas > 1 && (
            <nav className="cp-paginacion" aria-label="Páginas de notas">
              <button className="cp-pag-flecha" onClick={() => setPagina(paginaActual - 1)} disabled={paginaActual === 1} aria-label="Página anterior">‹</button>
              <span className="cp-pag-info">Página {paginaActual} de {totalPaginas} · {filtradas.length} notas</span>
              <button className="cp-pag-flecha" onClick={() => setPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas} aria-label="Página siguiente">›</button>
            </nav>
          )}
        </>
      )}

      {editor.modal}
    </>
  );
}

function TarjetaNota({ n, objetivos, onEditar }: { n: Nota; objetivos: ObjetivoConProgreso[]; onEditar: () => void }) {
  const objetivo = n.objetivo_id ? objetivos.find((o) => o.id === n.objetivo_id) : null;
  return (
    <button className={`obj-nota${n.ancla ? " obj-nota--ancla" : ""}${n.animo !== null ? ` obj-nota--animo-${n.animo}` : ""}`} onClick={onEditar}>
      <div className="obj-nota-top">
        {n.animo !== null ? (
          <span className="obj-nota-animo" title={ANIMOS[n.animo - 1]}>
            <span className="obj-nota-animo-emoji" aria-hidden="true">{ANIMO_EMOJI[n.animo - 1]}</span>
            <small>{ANIMOS[n.animo - 1]}</small>
          </span>
        ) : (
          <span className="obj-nota-animo obj-nota-animo--sin">
            <span className="obj-nota-animo-emoji" aria-hidden="true">📝</span>
          </span>
        )}
        <span className="obj-nota-fecha">{n.ancla ? "📌 Fijada · " : ""}{fechaCorta(n.fecha)}</span>
      </div>
      <p className="obj-nota-texto">{n.texto}</p>
      {(n.emocion || objetivo) && (
        <div className="obj-nota-pie">
          {n.emocion && <span className="obj-chip"><span aria-hidden="true">{EMOCION_EMOJI[n.emocion]}</span> {EMOCIONES[n.emocion]}</span>}
          {objetivo && <span className="obj-chip obj-chip--objetivo"><span aria-hidden="true">{METRICAS[objetivo.metrica].emoji}</span> {objetivo.titulo}</span>}
        </div>
      )}
    </button>
  );
}
