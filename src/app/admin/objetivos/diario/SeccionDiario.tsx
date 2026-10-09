"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ANIMOS, ANIMO_EMOJI, EMOCIONES, EMOCION_EMOJI, ETIQUETAS, FACTORES_MOTIVOS, FACTORES_NEGATIVOS, HORIZONTES, METRICAS, PRODUCTIVIDAD,
  type Balance, type Emocion, type Etiqueta, type Horizonte, type Intencion, type Nota, type ObjetivoConProgreso,
} from "@/lib/objetivos";
import { useCierreDia } from "../CierreDia";
import {
  type Datos, Factores, FotosNota, Interruptor, Opciones, TONO_AREA, UbicacionNota,
  cifra, enviar, fechaCorta, finDeMes, nombreMes, notaVacia, sumarDias, useEditor,
} from "../editor";
import { GraficaAnimo, MapaFactores, type FilaMapa, type PuntoAnimo } from "./GraficasSentir";
import "./diario.css";

/**
 * El diario: un sitio tranquilo para escribir.
 *
 * Tres vistas y nada más a la vez:
 * - Escribir: una hoja, el ánimo debajo y los detalles plegados. Al lado, lo
 *   que te propones esta semana y este mes.
 * - Releer: lo escrito, como un cuaderno, día a día.
 * - Cómo me siento: el análisis del ánimo, que sale de lo que escribes.
 */

type Props = {
  hoy: string;
  objetivos: ObjetivoConProgreso[];
  notas: Nota[];
  /** Enlaces firmados (1 h) de las fotos del bucket privado, por ruta. */
  urlsFotos: Record<string, string>;
  /** El cierre de hoy, si ya se hizo, y lo que Premium habría cobrado hoy. */
  balanceHoy?: Balance;
  premiumHoy: number;
  intenciones: Intencion[];
  /** La tabla de intenciones aún no existe: falta lanzar el SQL. */
  faltaIntenciones: boolean;
  lunes: string;
  /** Llegas desde el calendario (?nota=…): se abre «Releer» en esa nota. */
  notaInicial?: string;
};

type Vista = "escribir" | "releer" | "sentir";

const POR_PAGINA = 10;

/** Dónde se guarda lo que estás escribiendo, en ESTE navegador, hasta que lo guardes. */
const CLAVE_BORRADOR = "adelinbtc:diario-borrador";

/** Las preguntas guía. Una cambia cada día; las demás, a un toque. */
const PREGUNTAS = [
  "¿Qué tienes en la cabeza hoy?",
  "¿Qué ha funcionado esta semana?",
  "¿Qué te pesa ahora mismo?",
  "¿Qué cambiarías la semana que viene?",
  "¿De qué estás orgulloso?",
  "¿Qué harías si no tuvieras miedo a fallar?",
  "¿Qué te ha enseñado el día?",
];

function media(valores: number[]): number | null {
  return valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : null;
}

/** El lunes de la semana de `fecha`. */
function lunesDe(fecha: string): string {
  const dia = (new Date(`${fecha}T00:00:00Z`).getUTCDay() + 6) % 7;
  return sumarDias(fecha, -dia);
}

function fechaLarga(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
}

/** La hora a la que se escribió, en Rumanía. */
function hora(instante: string): string {
  return new Date(instante).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Bucharest" });
}

/** Minúsculas y sin tildes: «animo» encuentra «ánimo». */
function normalizar(t: string): string {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
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

function leerBorrador(): Datos | null {
  try {
    const crudo = window.localStorage.getItem(CLAVE_BORRADOR);
    return crudo ? (JSON.parse(crudo) as Datos) : null;
  } catch {
    return null;
  }
}

function escribirBorrador(datos: Datos | null) {
  try {
    if (datos && String(datos.texto).trim()) window.localStorage.setItem(CLAVE_BORRADOR, JSON.stringify(datos));
    else window.localStorage.removeItem(CLAVE_BORRADOR);
  } catch {
    // Navegación privada o almacenamiento bloqueado: se escribe igual, solo
    // que sin red de seguridad.
  }
}

export default function SeccionDiario(props: Props) {
  const { hoy, objetivos, notas, urlsFotos } = props;
  const [vista, setVista] = useState<Vista>(props.notaInicial ? "releer" : "escribir");
  const editor = useEditor(objetivos, urlsFotos);

  // Las tres cifras de la cabecera: racha, notas del mes y ánimo reciente.
  const dias = new Set(notas.map((n) => n.fecha));
  let racha = 0;
  for (let d = dias.has(hoy) ? hoy : sumarDias(hoy, -1); dias.has(d); d = sumarDias(d, -1)) racha++;
  const notasMes = notas.filter((n) => n.fecha.startsWith(hoy.slice(0, 7))).length;
  const animo30 = media(notas.filter((n) => n.animo !== null && n.fecha >= sumarDias(hoy, -29)).map((n) => n.animo as number));

  return (
    <div className="dia">
      <header className="dia-hero">
        <div className="dia-hero-textos">
          <span className="dia-hero-ey">📓 Tu diario</span>
          <h2 className="dia-hero-titulo">{fechaLarga(hoy)}</h2>
          <p className="dia-hero-sub">Un sitio solo para ti: lo que piensas del proyecto, lo que te propones y cómo te sientes.</p>
        </div>
        <div className="dia-hero-datos">
          <div className={`dia-hero-dato${racha >= 3 ? " dia-hero-dato--fuego" : ""}`}>
            <span aria-hidden="true">{racha >= 7 ? "🔥" : racha ? "⚡" : "💤"}</span>
            <strong>{racha}</strong>
            <small>{racha === 1 ? "día seguido" : "días seguidos"}</small>
          </div>
          <div className="dia-hero-dato">
            <span aria-hidden="true">✍️</span>
            <strong>{notasMes}</strong>
            <small>notas en {nombreMes(hoy.slice(0, 7), true)}</small>
          </div>
          <div className="dia-hero-dato">
            <span aria-hidden="true">{animo30 !== null ? emojiAnimo(animo30) : "😶"}</span>
            <strong>{animo30 !== null ? textoAnimo(animo30) : "—"}</strong>
            <small>ánimo, 30 días</small>
          </div>
        </div>
      </header>

      <nav className="dia-vistas" aria-label="Vistas del diario">
        {([
          ["escribir", "✍️", "Escribir", ""],
          ["releer", "📖", "Releer", notas.length ? String(notas.length) : ""],
          ["sentir", "🌤️", "Cómo me siento", ""],
        ] as const).map(([v, emoji, texto, cuenta]) => (
          <button
            key={v}
            type="button"
            className={`dia-vista${vista === v ? " dia-vista--activa" : ""}`}
            onClick={() => setVista(v)}
            aria-pressed={vista === v}
          >
            <span className="dia-vista-emoji" aria-hidden="true">{emoji}</span>
            {texto}
            {cuenta && <small>{cuenta}</small>}
          </button>
        ))}
      </nav>

      {vista === "escribir" && <Escribir {...props} onReleer={() => setVista("releer")} />}
      {vista === "releer" && <Releer hoy={hoy} notas={notas} objetivos={objetivos} urlsFotos={urlsFotos} onEditar={editor.editarNota} resaltar={props.notaInicial} />}
      {vista === "sentir" && <Sentir {...props} />}

      {editor.modal}
    </div>
  );
}

// ── Escribir ─────────────────────────────────────────────────────────────────

function Escribir({ hoy, objetivos, notas, urlsFotos, balanceHoy, premiumHoy, intenciones, faltaIntenciones, lunes, onReleer }: Props & { onReleer: () => void }) {
  const router = useRouter();
  const cierre = useCierreDia();
  const [borrador, setBorrador] = useState<Datos>(() => notaVacia(hoy));
  const [recuperado, setRecuperado] = useState(false);
  const [detalles, setDetalles] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardada, setGuardada] = useState(false);
  const [error, setError] = useState("");
  const cargado = useRef(false);
  const texto = useRef<HTMLTextAreaElement>(null);

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

  // La pregunta del día: la misma todo el día, otra mañana.
  const preguntaDelDia = PREGUNTAS[Number(hoy.replaceAll("-", "")) % PREGUNTAS.length];
  const escritoHoy = notas.filter((n) => n.fecha === hoy).length;
  const ultima = notas.find((n) => n.fecha < hoy);
  const fotos = Array.isArray(borrador.fotos) ? borrador.fotos : [];
  const cuantosDetalles = [
    borrador.etiqueta, borrador.emocion, borrador.objetivo_id, borrador.lugar || borrador.lat,
    fotos.length ? "fotos" : "", borrador.ancla === true ? "si" : "",
  ].filter(Boolean).length;
  const animo = String(borrador.animo);
  const palabras = String(borrador.texto).trim() ? String(borrador.texto).trim().split(/s+/).length : 0;
  const activos = objetivos.filter((o) => !o.archivado);

  function cambiar(campo: string, valor: string | boolean | string[]) {
    setGuardada(false);
    setBorrador((b) => {
      const nuevo = { ...b, [campo]: valor };
      escribirBorrador(nuevo);
      return nuevo;
    });
  }

  function preguntar(pregunta: string) {
    const actual = String(borrador.texto).trimEnd();
    cambiar("texto", `${actual}${actual ? "\n\n" : ""}${pregunta}\n`);
    texto.current?.focus();
  }

  function descartar() {
    if (!confirm("¿Descartar lo que llevas escrito?")) return;
    escribirBorrador(null);
    setBorrador(notaVacia(hoy));
    setRecuperado(false);
  }

  async function guardar() {
    if (!String(borrador.texto).trim() || guardando) return;
    setGuardando(true);
    setError("");
    const fallo = await enviar("nota", null, borrador);
    setGuardando(false);
    if (fallo) return setError(fallo);
    escribirBorrador(null);
    setBorrador(notaVacia(hoy));
    setRecuperado(false);
    setDetalles(false);
    setGuardada(true);
    router.refresh();
  }

  return (
    <div className="dia-escritorio">
      <form
        className="dia-hoja"
        onSubmit={(e) => {
          e.preventDefault();
          guardar();
        }}
      >
        <div className="dia-hoja-cabeza">
          <label className="dia-fecha">
            {borrador.fecha === hoy ? "Página de hoy" : `Página del ${fechaLarga(String(borrador.fecha))}`}
            <input
              className="dia-fecha-input"
              type="date"
              value={String(borrador.fecha)}
              max={hoy}
              onChange={(e) => e.target.value && cambiar("fecha", e.target.value)}
              aria-label="Día de esta página"
            />
          </label>
          {(guardando || guardada || palabras > 0 || escritoHoy > 0) && (
            <span className={`dia-estado${guardada ? " dia-estado--ok" : ""}`}>
              {guardando ? "Guardando…" : guardada ? "✓ Guardado en tu diario" : palabras ? "● Borrador a salvo en este navegador" : `Hoy ya has escrito ${escritoHoy} vez${escritoHoy === 1 ? "" : "es"}`}
            </span>
          )}
        </div>

        {recuperado && (
          <p className="dia-aviso">
            Has recuperado lo que dejaste a medias. <button type="button" className="dia-enlace" onClick={descartar}>Descartarlo</button>
          </p>
        )}

        <textarea
          ref={texto}
          className="dia-texto"
          value={String(borrador.texto)}
          onChange={(e) => cambiar("texto", e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              guardar();
            }
          }}
          placeholder={preguntaDelDia}
          aria-label="Escribe en tu diario"
          spellCheck
        />

        <div className="dia-sentir" role="radiogroup" aria-label="¿Cómo te sientes?">
          <span className="dia-sentir-pregunta">¿Cómo te sientes?</span>
          <div className="dia-sentir-opciones">
            {ANIMOS.map((a, i) => {
              const v = String(i + 1);
              const activo = animo === v;
              return (
                <button
                  key={a}
                  type="button"
                  role="radio"
                  aria-checked={activo}
                  title={a}
                  className={`dia-animo dia-animo--${i + 1}${activo ? " dia-animo--activo" : ""}`}
                  onClick={() => cambiar("animo", activo ? "" : v)}
                >
                  <span aria-hidden="true">{ANIMO_EMOJI[i]}</span>
                  <span className="dia-animo-texto">{a}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Factores d={borrador} cambiar={cambiar} />

        {detalles && (
          <div className="dia-detalles">
            <Opciones
              etiqueta="¿De qué va?"
              opciones={(Object.keys(ETIQUETAS) as Etiqueta[]).map((k) => ({ valor: k, emoji: ETIQUETAS[k].emoji, texto: ETIQUETAS[k].texto, tono: TONO_AREA[k] }))}
              valor={String(borrador.etiqueta ?? "")}
              onCambio={(v) => cambiar("etiqueta", v)}
              permitirVacio
            />
            <Opciones
              etiqueta="¿Qué emoción lo describe mejor?"
              opciones={(Object.keys(EMOCIONES) as Emocion[]).map((k) => ({ valor: k, emoji: EMOCION_EMOJI[k], texto: EMOCIONES[k] }))}
              valor={String(borrador.emocion)}
              onCambio={(v) => cambiar("emocion", v)}
              permitirVacio
            />
            <FotosNota fotos={fotos} urls={urlsFotos} onCambio={(f) => cambiar("fotos", f)} />
            <UbicacionNota d={borrador} cambiar={cambiar} />
            {activos.length > 0 && (
              <Opciones
                etiqueta="¿Va sobre algún objetivo?"
                opciones={[{ valor: "", emoji: "➖", texto: "Ninguno" }, ...activos.map((o) => ({ valor: o.id, emoji: METRICAS[o.metrica].emoji, texto: o.titulo }))]}
                valor={String(borrador.objetivo_id)}
                onCambio={(v) => cambiar("objetivo_id", v)}
              />
            )}
            <Interruptor activo={borrador.ancla === true} onCambio={(v) => cambiar("ancla", v)}>
              📌 Fijarla arriba al releer
            </Interruptor>
          </div>
        )}

        {error && <p className="obj-error">⚠️ {error}</p>}

        <div className="dia-hoja-pie">
          <button type="button" className="dia-mas" onClick={() => setDetalles((d) => !d)} aria-expanded={detalles}>
            {detalles ? "− Ocultar detalles" : `＋ Área, emoción, fotos, lugar${cuantosDetalles ? ` · ${cuantosDetalles}` : ""}`}
          </button>
          <span className="dia-privado">{palabras ? `${palabras} palabra${palabras === 1 ? "" : "s"} · ` : ""}🔒 Solo lo ves tú</span>
          <button type="submit" className="dia-guardar" disabled={guardando || !String(borrador.texto).trim()} title="Ctrl + Enter">
            {guardando ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>

      <aside className="dia-lado">
        <Intenciones hoy={hoy} lunes={lunes} intenciones={intenciones} falta={faltaIntenciones} />

        <section className="dia-bloque">
          <h3 className="dia-bloque-titulo">🌙 Hoy</h3>
          <button type="button" className="dia-cierre" onClick={() => cierre.abrir(hoy, balanceHoy, premiumHoy)}>
            {balanceHoy?.productividad ? (
              <>
                <span aria-hidden="true">{PRODUCTIVIDAD[balanceHoy.productividad].emoji}</span>
                <span>
                  {PRODUCTIVIDAD[balanceHoy.productividad].texto}
                  {balanceHoy.total > 0 && ` · ${cifra(balanceHoy.total)} €`}
                </span>
              </>
            ) : (
              <span>Cerrar el día: ¿productivo?, lo ganado y una nota</span>
            )}
            <span className="dia-cierre-flecha" aria-hidden="true">›</span>
          </button>
          {balanceHoy?.nota && <p className="dia-cierre-nota">📌 {balanceHoy.nota}</p>}
          <p className="dia-nota">Para cerrar otro día, pulsa su icono en el calendario.</p>
        </section>

        <section className="dia-bloque">
          <h3 className="dia-bloque-titulo">💬 Si no sabes por dónde empezar</h3>
          <ul className="dia-preguntas">
            {PREGUNTAS.filter((p) => p !== preguntaDelDia).slice(0, 4).map((p) => (
              <li key={p}>
                <button type="button" className="dia-pregunta" onClick={() => preguntar(p)}>{p}</button>
              </li>
            ))}
          </ul>
        </section>

        {ultima && (
          <section className="dia-bloque">
            <h3 className="dia-bloque-titulo">📖 La última vez · {fechaCorta(ultima.fecha)}</h3>
            <p className="dia-ultima">{ultima.texto}</p>
            <button type="button" className="dia-enlace" onClick={onReleer}>Releer el diario</button>
          </section>
        )}
      </aside>

      {cierre.modal}
    </div>
  );
}

// ── Intenciones ──────────────────────────────────────────────────────────────

function Intenciones({ hoy, lunes, intenciones, falta }: { hoy: string; lunes: string; intenciones: Intencion[]; falta: boolean }) {
  const router = useRouter();
  const [lista, setLista] = useState(intenciones);
  const [nuevas, setNuevas] = useState<Record<Horizonte, string>>({ semana: "", mes: "" });
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");

  // Cuando el servidor trae la lista nueva (tras guardar), manda la del servidor.
  const firma = intenciones.map((i) => `${i.id}:${i.hecha}`).join(",");
  const [firmaVista, setFirmaVista] = useState(firma);
  if (firma !== firmaVista) {
    setFirmaVista(firma);
    setLista(intenciones);
  }

  const desdeDe = (h: Horizonte) => (h === "semana" ? lunes : `${hoy.slice(0, 7)}-01`);
  const datos = (i: Intencion, cambios: Partial<Intencion> = {}): Datos => {
    const x = { ...i, ...cambios };
    return { texto: x.texto, horizonte: x.horizonte, desde: x.desde, hecha: x.hecha };
  };

  async function anadir(h: Horizonte) {
    const textoNuevo = nuevas[h].trim();
    if (!textoNuevo || ocupado) return;
    setOcupado(true);
    setError("");
    const fallo = await enviar("intencion", null, { texto: textoNuevo, horizonte: h, desde: desdeDe(h), hecha: false });
    setOcupado(false);
    if (fallo) return setError(fallo);
    setNuevas((n) => ({ ...n, [h]: "" }));
    router.refresh();
  }

  async function alternar(i: Intencion) {
    setError("");
    setLista((l) => l.map((x) => (x.id === i.id ? { ...x, hecha: !x.hecha } : x)));
    const fallo = await enviar("intencion", i.id, datos(i, { hecha: !i.hecha }));
    if (fallo) {
      setError(fallo);
      setLista((l) => l.map((x) => (x.id === i.id ? i : x)));
    } else router.refresh();
  }

  async function quitar(i: Intencion) {
    setError("");
    setLista((l) => l.filter((x) => x.id !== i.id));
    const fallo = await enviar("intencion", i.id, null);
    if (fallo) {
      setError(fallo);
      setLista(intenciones);
    } else router.refresh();
  }

  if (falta) {
    return (
      <section className="dia-bloque">
        <h3 className="dia-bloque-titulo">🎯 Lo que me propongo</h3>
        <p className="dia-nota">Falta crear la tabla: ejecuta <code>scripts/create-objetivos.sql</code> en el SQL Editor de Supabase.</p>
      </section>
    );
  }

  return (
    <section className="dia-bloque dia-intenciones">
      <h3 className="dia-bloque-titulo">🎯 Lo que me propongo</h3>
      {(Object.keys(HORIZONTES) as Horizonte[]).map((h) => {
        const deEste = lista.filter((i) => i.horizonte === h);
        const hechas = deEste.filter((i) => i.hecha).length;
        return (
          <div key={h} className="dia-intencion-grupo">
            <div className="dia-intencion-cabeza">
              <span>{HORIZONTES[h]}{h === "mes" ? ` · ${nombreMes(hoy.slice(0, 7), true)}` : ""}</span>
              {deEste.length > 0 && <small>{hechas} de {deEste.length}</small>}
            </div>
            {deEste.length > 0 && (
              <div className="dia-intencion-pista" aria-hidden="true">
                <div style={{ width: `${(hechas / deEste.length) * 100}%` }} />
              </div>
            )}
            <ul className="dia-intencion-lista">
              {deEste.map((i) => (
                <li key={i.id} className={`dia-intencion${i.hecha ? " dia-intencion--hecha" : ""}`}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={i.hecha}
                    className="dia-intencion-marca"
                    onClick={() => alternar(i)}
                    aria-label={i.hecha ? `Desmarcar: ${i.texto}` : `Marcar como hecha: ${i.texto}`}
                  >
                    {i.hecha ? "✓" : ""}
                  </button>
                  <span className="dia-intencion-texto">{i.texto}</span>
                  <button type="button" className="dia-intencion-quitar" onClick={() => quitar(i)} aria-label={`Quitar: ${i.texto}`} title="Quitar">✕</button>
                </li>
              ))}
            </ul>
            <form
              className="dia-intencion-nueva"
              onSubmit={(e) => {
                e.preventDefault();
                anadir(h);
              }}
            >
              <input
                value={nuevas[h]}
                onChange={(e) => setNuevas((n) => ({ ...n, [h]: e.target.value }))}
                placeholder={h === "semana" ? "＋ Esta semana quiero…" : "＋ Este mes quiero…"}
                maxLength={200}
                aria-label={`Nueva intención para ${HORIZONTES[h].toLowerCase()}`}
                disabled={ocupado}
              />
            </form>
          </div>
        );
      })}
      {error && <p className="obj-error">⚠️ {error}</p>}
    </section>
  );
}

// ── Releer ───────────────────────────────────────────────────────────────────

function Releer({ hoy, notas, objetivos, urlsFotos, onEditar, resaltar }: {
  hoy: string;
  notas: Nota[];
  objetivos: ObjetivoConProgreso[];
  urlsFotos: Record<string, string>;
  onEditar: (n: Nota) => void;
  /** La nota a la que se llega desde el calendario: su página, centrada y resaltada. */
  resaltar?: string;
}) {
  const [area, setArea] = useState<Etiqueta | "">("");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(() => {
    const i = notas.filter((n) => !n.ancla).findIndex((n) => n.id === resaltar);
    return i >= 0 ? Math.floor(i / POR_PAGINA) + 1 : 1;
  });
  const [encendida, setEncendida] = useState(resaltar);

  // Lleva la vista a la nota y apaga el resaltado al rato.
  useEffect(() => {
    if (!resaltar) return;
    document.getElementById(`nota-${resaltar}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = window.setTimeout(() => setEncendida(undefined), 3500);
    return () => window.clearTimeout(t);
  }, [resaltar]);

  const anclas = notas.filter((n) => n.ancla);
  const q = normalizar(busqueda.trim());
  const filtradas = notas.filter(
    (n) => !n.ancla && (!area || n.etiqueta === area) && (!q || normalizar(`${n.texto} ${n.lugar ?? ""}`).includes(q))
  );
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtradas.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);

  // Agrupadas por día, como las páginas de un cuaderno.
  const dias: { fecha: string; notas: Nota[] }[] = [];
  for (const n of visibles) {
    const ultimo = dias[dias.length - 1];
    if (ultimo?.fecha === n.fecha) ultimo.notas.push(n);
    else dias.push({ fecha: n.fecha, notas: [n] });
  }
  const areas = (Object.keys(ETIQUETAS) as Etiqueta[]).filter((e) => notas.some((n) => n.etiqueta === e));

  if (!notas.length) {
    return (
      <div className="dia-vacio">
        <span aria-hidden="true">📖</span>
        <p>Aún no has escrito nada. Lo que guardes aparecerá aquí, día a día, como en un cuaderno.</p>
      </div>
    );
  }

  return (
    <div className="dia-releer">
      <div className="dia-buscar">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setPagina(1);
          }}
          placeholder="Buscar en lo que has escrito"
          aria-label="Buscar en el diario"
        />
        {areas.length > 0 && (
          <div className="dia-areas" role="radiogroup" aria-label="Filtrar por área">
            {[["", "Todo"] as const, ...areas.map((e) => [e, `${ETIQUETAS[e].emoji} ${ETIQUETAS[e].texto}`] as const)].map(([valor, texto]) => (
              <button
                key={valor || "todo"}
                type="button"
                role="radio"
                aria-checked={area === valor}
                className={`dia-area${area === valor ? " dia-area--activa" : ""}`}
                onClick={() => {
                  setArea(valor);
                  setPagina(1);
                }}
              >
                {texto}
              </button>
            ))}
          </div>
        )}
      </div>

      {anclas.length > 0 && !q && !area && paginaActual === 1 && (
        <section className="dia-fijadas">
          <h3 className="dia-bloque-titulo">📌 Para releer siempre</h3>
          {anclas.map((n) => <Entrada key={n.id} n={n} objetivos={objetivos} urlsFotos={urlsFotos} onEditar={() => onEditar(n)} conFecha resaltada={n.id === encendida} />)}
        </section>
      )}

      {dias.length === 0 ? (
        <p className="dia-nota">No hay nada que coincida.</p>
      ) : (
        dias.map((d) => (
          <section key={d.fecha} className="dia-dia">
            <h3 className="dia-dia-fecha">
              {d.fecha === hoy ? "Hoy" : d.fecha === sumarDias(hoy, -1) ? "Ayer" : fechaLarga(d.fecha)}
              {d.fecha.slice(0, 4) !== hoy.slice(0, 4) && ` de ${d.fecha.slice(0, 4)}`}
            </h3>
            {d.notas.map((n) => <Entrada key={n.id} n={n} objetivos={objetivos} urlsFotos={urlsFotos} onEditar={() => onEditar(n)} resaltada={n.id === encendida} />)}
          </section>
        ))
      )}

      {totalPaginas > 1 && (
        <nav className="dia-paginas" aria-label="Páginas del diario">
          <button type="button" onClick={() => setPagina(paginaActual - 1)} disabled={paginaActual === 1}>‹ Más recientes</button>
          <span>{paginaActual} de {totalPaginas}</span>
          <button type="button" onClick={() => setPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas}>Anteriores ›</button>
        </nav>
      )}
    </div>
  );
}

function Entrada({ n, objetivos, urlsFotos, onEditar, conFecha = false, resaltada = false }: {
  n: Nota;
  objetivos: ObjetivoConProgreso[];
  urlsFotos: Record<string, string>;
  onEditar: () => void;
  conFecha?: boolean;
  resaltada?: boolean;
}) {
  const objetivo = n.objetivo_id ? objetivos.find((o) => o.id === n.objetivo_id) : null;
  const fotos = (n.fotos ?? []).filter((f) => urlsFotos[f]);
  const meta = [
    n.etiqueta ? `${ETIQUETAS[n.etiqueta].emoji} ${ETIQUETAS[n.etiqueta].texto}` : "",
    n.emocion ? `${EMOCION_EMOJI[n.emocion]} ${EMOCIONES[n.emocion]}` : "",
    n.lugar || n.lat !== null ? `📍 ${n.lugar || "Ubicación guardada"}` : "",
    objetivo ? `${METRICAS[objetivo.metrica].emoji} ${objetivo.titulo}` : "",
  ].filter(Boolean);

  return (
    <article id={`nota-${n.id}`} className={`dia-entrada${n.animo !== null ? ` dia-entrada--animo-${n.animo}` : ""}${resaltada ? " dia-entrada--resaltada" : ""}`}>
      <div className="dia-entrada-cabeza">
        {n.animo !== null && (
          <span className="dia-entrada-animo" title={`${ANIMOS[n.animo - 1]} (${n.animo}/5)`}>
            <span aria-hidden="true">{ANIMO_EMOJI[n.animo - 1]}</span> {ANIMOS[n.animo - 1]}
          </span>
        )}
        <span className="dia-entrada-hora">{conFecha ? fechaCorta(n.fecha) : hora(n.created_at)}</span>
        <button type="button" className="dia-enlace dia-entrada-editar" onClick={onEditar}>Editar</button>
      </div>
      <p className="dia-entrada-texto">{n.texto}</p>
      {((n.negativos?.length ?? 0) > 0 || (n.motivos?.length ?? 0) > 0) && (
        <div className="dia-entrada-factores">
          {(n.negativos ?? []).filter((f) => f in FACTORES_NEGATIVOS).map((f) => (
            <span key={f} className="dia-factor dia-factor--mal"><span aria-hidden="true">{FACTORES_NEGATIVOS[f].emoji}</span> {FACTORES_NEGATIVOS[f].texto}</span>
          ))}
          {(n.motivos ?? []).filter((f) => f in FACTORES_MOTIVOS).map((f) => (
            <span key={f} className="dia-factor dia-factor--bien"><span aria-hidden="true">{FACTORES_MOTIVOS[f].emoji}</span> {FACTORES_MOTIVOS[f].texto}</span>
          ))}
        </div>
      )}
      {fotos.length > 0 && (
        <div className="dia-entrada-fotos">
          {fotos.map((f) => (
            // eslint-disable-next-line @next/next/no-img-element -- enlace firmado y privado: no pasa por el optimizador de Next
            <img key={f} src={urlsFotos[f]} alt="" loading="lazy" />
          ))}
        </div>
      )}
      {meta.length > 0 && <p className="dia-entrada-meta">{meta.join("  ·  ")}</p>}
    </article>
  );
}

// ── Cómo me siento ───────────────────────────────────────────────────────────
//
// Solo tus sensaciones: el ánimo y lo que te afecta o te motiva. Pensado para
// años de datos: el periodo se elige, y los tramos son semanas en los cortos
// y meses en los largos, para que la gráfica siga leyéndose con 3 años.

type Rango = "3m" | "6m" | "1a" | "todo";
const RANGOS: Record<Rango, string> = { "3m": "3 meses", "6m": "6 meses", "1a": "1 año", todo: "Todo" };

type Tramo = { desde: string; hasta: string; etiqueta: string };

type Factor = { clave: string; texto: string; emoji: string; veces: number; animo: number | null; ultima: string | null };

/** Los tramos del periodo: semanas (3 y 6 meses) o meses (1 año y todo). */
function tramosDe(rango: Rango, hoy: string, primera: string): Tramo[] {
  if (rango === "3m" || rango === "6m") {
    const n = rango === "3m" ? 13 : 26;
    const lunesHoy = lunesDe(hoy);
    return Array.from({ length: n }, (_, i) => {
      const desde = sumarDias(lunesHoy, (i - n + 1) * 7);
      return { desde, hasta: sumarDias(desde, 6), etiqueta: fechaCorta(desde) };
    });
  }
  const [a, m] = hoy.slice(0, 7).split("-").map(Number);
  const mesDe = (salto: number) => new Date(Date.UTC(a, m - 1 + salto, 1)).toISOString().slice(0, 7);
  let n = 12;
  if (rango === "todo") {
    const [pa, pm] = primera.slice(0, 7).split("-").map(Number);
    n = Math.max(2, (a - pa) * 12 + (m - pm) + 1);
  }
  const variosAnos = n > 12 || mesDe(-(n - 1)).slice(0, 4) !== hoy.slice(0, 4);
  return Array.from({ length: n }, (_, i) => {
    const mes = mesDe(i - n + 1);
    return {
      desde: `${mes}-01`,
      hasta: finDeMes(mes),
      etiqueta: `${nombreMes(mes, true).replace(".", "")}${variosAnos ? ` ${mes.slice(2, 4)}` : ""}`,
    };
  });
}

function contarFactores<K extends string>(
  notas: Nota[],
  catalogo: Record<K, { texto: string; emoji: string }>,
  de: (n: Nota) => K[] | null | undefined
): Factor[] {
  return (Object.keys(catalogo) as K[])
    .map((clave) => {
      const conEste = notas.filter((n) => (de(n) ?? []).includes(clave));
      return {
        clave,
        texto: catalogo[clave].texto,
        emoji: catalogo[clave].emoji,
        veces: conEste.length,
        animo: media(conEste.filter((n) => n.animo !== null).map((n) => n.animo as number)),
        ultima: conEste[0]?.fecha ?? null,
      };
    })
    .filter((f) => f.veces > 0)
    .sort((x, y) => y.veces - x.veces || (x.animo ?? 3) - (y.animo ?? 3));
}

/** Qué parte de las notas de cada tramo menciona cada factor (0-1, o null si no hay notas). */
function mapaDe<K extends string>(factores: Factor[], porTramo: Nota[][], de: (n: Nota) => K[] | null | undefined): FilaMapa[] {
  return factores.slice(0, 6).map((f) => ({
    clave: f.clave,
    emoji: f.emoji,
    texto: f.texto,
    celdas: porTramo.map((ns) => (ns.length ? ns.filter((n) => (de(n) ?? []).includes(f.clave as K)).length / ns.length : null)),
  }));
}

function analizar(notas: Nota[], hoy: string, rango: Rango) {
  const primera = notas.length ? notas[notas.length - 1].fecha : hoy;
  const tramos = tramosDe(rango, hoy, primera);
  const desde = tramos[0].desde;
  const enRango = notas.filter((n) => n.fecha >= desde && n.fecha <= hoy);
  const conAnimo = enRango.filter((n) => n.animo !== null) as (Nota & { animo: number })[];

  // El periodo anterior de la misma duración, para comparar.
  const duracion = Math.round((Date.parse(`${hoy}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 86400000) + 1;
  const desdePrevio = sumarDias(desde, -duracion);
  const previas = notas.filter((n) => n.fecha >= desdePrevio && n.fecha < desde && n.animo !== null);

  const porTramo = tramos.map((t) => enRango.filter((n) => n.fecha >= t.desde && n.fecha <= t.hasta));
  const puntos: PuntoAnimo[] = tramos.map((t, i) => ({
    etiqueta: t.etiqueta,
    valor: media(porTramo[i].filter((n) => n.animo !== null).map((n) => n.animo as number)),
    notas: porTramo[i].length,
  }));

  const negativos = contarFactores(enRango, FACTORES_NEGATIVOS, (n) => n.negativos);
  const motivos = contarFactores(enRango, FACTORES_MOTIVOS, (n) => n.motivos);

  // Cómo has cambiado: la primera mitad de los tramos con notas frente a la segunda.
  const conNotas = tramos.map((_, i) => i).filter((i) => porTramo[i].length > 0);
  const mitad = Math.floor(conNotas.length / 2);
  const antes = conNotas.slice(0, mitad).flatMap((i) => porTramo[i]);
  const ahora = conNotas.slice(conNotas.length - mitad).flatMap((i) => porTramo[i]);
  const hayEvolucion = mitad >= 2;
  const parte = <K extends string>(ns: Nota[], clave: string, de: (n: Nota) => K[] | null | undefined) =>
    ns.length ? ns.filter((n) => (de(n) ?? []).includes(clave as K)).length / ns.length : 0;
  const cambio = <K extends string>(lista: Factor[], de: (n: Nota) => K[] | null | undefined) =>
    lista
      .map((f) => ({ ...f, antes: parte(antes, f.clave, de), ahora: parte(ahora, f.clave, de) }))
      .map((f) => ({ ...f, delta: f.ahora - f.antes }))
      .filter((f) => Math.abs(f.delta) >= 0.1)
      .sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));

  const emociones = (Object.keys(EMOCIONES) as Emocion[])
    .map((e) => {
      const deEsta = enRango.filter((n) => n.emocion === e);
      return { emocion: e, total: deEsta.length, animo: media(deEsta.filter((n) => n.animo !== null).map((n) => n.animo as number)) };
    })
    .filter((e) => e.total > 0)
    .sort((x, y) => y.total - x.total);

  const porArea = (Object.keys(ETIQUETAS) as Etiqueta[])
    .map((e) => {
      const deEsta = conAnimo.filter((n) => n.etiqueta === e);
      return { etiqueta: e, animo: media(deEsta.map((n) => n.animo)), notas: deEsta.length };
    })
    .filter((e) => e.notas > 0)
    .sort((x, y) => y.notas - x.notas);

  return {
    tramos,
    puntos,
    notas: enRango.length,
    conAnimo: conAnimo.length,
    animo: media(conAnimo.map((n) => n.animo)),
    animoPrevio: media(previas.map((n) => n.animo as number)),
    reparto: ANIMOS.map((texto, i) => ({ nivel: i + 1, texto, total: conAnimo.filter((n) => n.animo === i + 1).length })),
    negativos,
    motivos,
    mapaNegativos: mapaDe(negativos, porTramo, (n) => n.negativos),
    mapaMotivos: mapaDe(motivos, porTramo, (n) => n.motivos),
    evolucion: hayEvolucion
      ? {
          antes: media(antes.filter((n) => n.animo !== null).map((n) => n.animo as number)),
          ahora: media(ahora.filter((n) => n.animo !== null).map((n) => n.animo as number)),
          negativos: cambio(negativos, (n) => n.negativos),
          motivos: cambio(motivos, (n) => n.motivos),
        }
      : null,
    emociones,
    porArea,
    // Desde cuándo hay notas: para saber qué periodos tienen sentido.
    diasDeHistoria: Math.round((Date.parse(`${hoy}T00:00:00Z`) - Date.parse(`${primera}T00:00:00Z`)) / 86400000),
  };
}

/**
 * Lo que más te afecta y lo que más te motiva, lado a lado: cuántas veces
 * sale cada cosa y con qué ánimo escribes cuando aparece.
 */
function Sensaciones({ negativos, motivos, mediaGeneral }: { negativos: Factor[]; motivos: Factor[]; mediaGeneral: number | null }) {
  if (!negativos.length && !motivos.length) {
    return (
      <div className="dia-sens-vacio">
        <span aria-hidden="true">🧭</span>
        <p>
          Al escribir, marca bajo el ánimo <strong>qué te ha afectado</strong> y <strong>qué te ha motivado</strong>. Aquí verás
          qué pesa más en tu día a día y cómo cambia tu ánimo con cada cosa.
        </p>
      </div>
    );
  }

  const columnas = [
    { tipo: "mal", titulo: "😣 Lo que más te afecta", lista: negativos, vacio: "Nada marcado que te afecte en este periodo." },
    { tipo: "bien", titulo: "🚀 Lo que más te motiva", lista: motivos, vacio: "Nada marcado que te motive en este periodo." },
  ] as const;

  return (
    <section className="dia-sens">
      {columnas.map((c) => {
        const max = Math.max(1, ...c.lista.map((f) => f.veces));
        const top = c.lista[0];
        const diferencia = top?.animo != null && mediaGeneral !== null ? top.animo - mediaGeneral : null;
        return (
          <div key={c.tipo} className={`dia-sens-col dia-sens-col--${c.tipo}`}>
            <h3 className="dia-sens-titulo">{c.titulo}</h3>
            {top ? (
              <>
                <div className="dia-sens-top">
                  <span className="dia-sens-top-emoji" aria-hidden="true">{top.emoji}</span>
                  <div>
                    <strong>{top.texto}</strong>
                    <span>
                      Sale en {top.veces} nota{top.veces === 1 ? "" : "s"}
                      {top.animo !== null && ` · ánimo ${emojiAnimo(top.animo)} ${cifra(top.animo)}/5`}
                      {diferencia !== null && Math.abs(diferencia) >= 0.2 && ` (${diferencia > 0 ? "+" : ""}${cifra(diferencia)} sobre tu media)`}
                    </span>
                  </div>
                </div>
                <ol className="dia-sens-lista">
                  {c.lista.map((f) => (
                    <li key={f.clave} className="dia-sens-fila">
                      <span className="dia-sens-nombre"><span aria-hidden="true">{f.emoji}</span> {f.texto}</span>
                      <span className="dia-sens-pista"><span style={{ width: `${(f.veces / max) * 100}%` }} /></span>
                      <span className="dia-sens-veces">{f.veces}×</span>
                      <span className="dia-sens-animo" title={f.animo !== null ? `Ánimo medio esos días: ${cifra(f.animo)}/5` : "Sin ánimo marcado"}>
                        {f.animo !== null ? emojiAnimo(f.animo) : "·"}
                      </span>
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <p className="dia-nota">{c.vacio}</p>
            )}
          </div>
        );
      })}
    </section>
  );
}

function pct(v: number): string {
  return `${Math.round(v * 100)} %`;
}

function Sentir({ hoy, notas }: Props) {
  const historia = notas.length
    ? Math.round((Date.parse(`${hoy}T00:00:00Z`) - Date.parse(`${notas[notas.length - 1].fecha}T00:00:00Z`)) / 86400000)
    : 0;
  // Por defecto, el periodo que mejor enseña tu historia: un año si ya lo tienes.
  const [rango, setRango] = useState<Rango>(historia > 365 ? "1a" : historia > 120 ? "6m" : "3m");
  const a = analizar(notas, hoy, rango);
  const maxReparto = Math.max(1, ...a.reparto.map((r) => r.total));
  const maxEmocion = Math.max(1, ...a.emociones.map((e) => e.total));
  const delta = a.animo !== null && a.animoPrevio !== null ? a.animo - a.animoPrevio : null;
  const porTramo = rango === "3m" || rango === "6m" ? "semana" : "mes";

  if (!notas.length) {
    return (
      <div className="dia-vacio">
        <span aria-hidden="true">🌱</span>
        <p>Cuando escribas eligiendo cómo te sientes y qué te afecta o te motiva, aquí verás cómo evoluciona todo con el tiempo.</p>
      </div>
    );
  }

  // Lo que has cambiado, en frases.
  const ideas: { emoji: string; texto: string }[] = [];
  const ev = a.evolucion;
  if (ev?.antes != null && ev.ahora != null) {
    const d = ev.ahora - ev.antes;
    ideas.push({
      emoji: d >= 0.3 ? "📈" : d <= -0.3 ? "📉" : "⚖️",
      texto:
        Math.abs(d) < 0.3
          ? `Tu ánimo se mantiene estable: ${emojiAnimo(ev.antes)} ${cifra(ev.antes)} al principio del periodo y ${emojiAnimo(ev.ahora)} ${cifra(ev.ahora)} ahora.`
          : `Tu ánimo ha ${d > 0 ? "mejorado" : "bajado"}: de ${emojiAnimo(ev.antes)} ${cifra(ev.antes)} al principio del periodo a ${emojiAnimo(ev.ahora)} ${cifra(ev.ahora)} ahora.`,
    });
  }
  const menos = ev?.negativos.find((f) => f.delta < 0);
  const mas = ev?.negativos.find((f) => f.delta > 0);
  const motivaMas = ev?.motivos.find((f) => f.delta > 0);
  const motivaMenos = ev?.motivos.find((f) => f.delta < 0);
  if (menos) ideas.push({ emoji: "🌤️", texto: `${menos.emoji} «${menos.texto}» te afecta menos: estaba en el ${pct(menos.antes)} de tus notas y ahora en el ${pct(menos.ahora)}.` });
  if (mas) ideas.push({ emoji: "⚠️", texto: `${mas.emoji} «${mas.texto}» te afecta más que antes: del ${pct(mas.antes)} de tus notas al ${pct(mas.ahora)}.` });
  if (motivaMas) ideas.push({ emoji: "🚀", texto: `${motivaMas.emoji} «${motivaMas.texto}» te motiva cada vez más: del ${pct(motivaMas.antes)} de tus notas al ${pct(motivaMas.ahora)}.` });
  if (motivaMenos) ideas.push({ emoji: "🔋", texto: `${motivaMenos.emoji} «${motivaMenos.texto}» aparece menos como motivación: del ${pct(motivaMenos.antes)} al ${pct(motivaMenos.ahora)}.` });

  return (
    <div className="dia-sentir-vista">
      <div className="sen-barra">
        <div className="sen-rangos" role="radiogroup" aria-label="Periodo">
          {(Object.keys(RANGOS) as Rango[]).map((r) => (
            <button key={r} type="button" role="radio" aria-checked={rango === r} className={`sen-rango${rango === r ? " sen-rango--activo" : ""}`} onClick={() => setRango(r)}>
              {RANGOS[r]}
            </button>
          ))}
        </div>
        <span className="sen-barra-nota">Por {porTramo}s · {a.notas} nota{a.notas === 1 ? "" : "s"} en el periodo</span>
      </div>

      <div className="obj-tiles">
        <div className="obj-tile obj-tile--destacado">
          <span className="obj-tile-emoji" aria-hidden="true">{a.animo !== null ? emojiAnimo(a.animo) : "😶"}</span>
          <span className="cp-card-label">Ánimo medio · {RANGOS[rango].toLowerCase()}</span>
          <strong className="cp-card-value obj-valor-texto">{a.animo !== null ? textoAnimo(a.animo) : "—"}</strong>
          <span className="cp-card-foot">
            {a.animo !== null ? `${cifra(a.animo)} sobre 5` : "sin notas con ánimo"}
            {delta !== null && ` · ${delta >= 0 ? "+" : ""}${cifra(delta)} frente al periodo anterior`}
          </span>
        </div>
        <div className="obj-tile">
          <span className="obj-tile-emoji" aria-hidden="true">✍️</span>
          <span className="cp-card-label">Notas en el periodo</span>
          <strong className="cp-card-value">{a.notas}</strong>
          <span className="cp-card-foot">{a.conAnimo} con ánimo marcado</span>
        </div>
        <div className="obj-tile">
          <span className="obj-tile-emoji" aria-hidden="true">{a.negativos[0]?.emoji ?? "😣"}</span>
          <span className="cp-card-label">Lo que más te afecta</span>
          <strong className="cp-card-value obj-valor-texto">{a.negativos[0]?.texto ?? "—"}</strong>
          <span className="cp-card-foot">{a.negativos[0] ? `${a.negativos[0].veces} nota${a.negativos[0].veces === 1 ? "" : "s"}` : "nada marcado aún"}</span>
        </div>
        <div className="obj-tile">
          <span className="obj-tile-emoji" aria-hidden="true">{a.motivos[0]?.emoji ?? "🚀"}</span>
          <span className="cp-card-label">Lo que más te motiva</span>
          <strong className="cp-card-value obj-valor-texto">{a.motivos[0]?.texto ?? "—"}</strong>
          <span className="cp-card-foot">{a.motivos[0] ? `${a.motivos[0].veces} nota${a.motivos[0].veces === 1 ? "" : "s"}` : "nada marcado aún"}</span>
        </div>
      </div>

      <figure className="obj-grafica">
        <figcaption className="obj-grafica-titulo">📈 Cómo ha evolucionado tu ánimo · media por {porTramo}</figcaption>
        <GraficaAnimo puntos={a.puntos} />
      </figure>

      <div className="sen-cambios">
        <h3 className="dia-sens-titulo">💡 Cómo has cambiado</h3>
        {ideas.length ? (
          <ul>
            {ideas.map((i, n) => (
              <li key={n}><span aria-hidden="true">{i.emoji}</span> {i.texto}</li>
            ))}
          </ul>
        ) : (
          <p className="dia-nota">
            Aún no hay bastante para compararte contigo mismo: hacen falta al menos cuatro {porTramo}s con notas en el periodo. Prueba con un periodo más largo o sigue escribiendo.
          </p>
        )}
      </div>

      <Sensaciones negativos={a.negativos} motivos={a.motivos} mediaGeneral={a.animo} />

      {(a.mapaNegativos.length > 0 || a.mapaMotivos.length > 0) && (
        <div className="obj-graficas-fila">
          <figure className="obj-grafica">
            <figcaption className="obj-grafica-titulo">😣 Lo que te afecta, {porTramo} a {porTramo}</figcaption>
            <MapaFactores columnas={a.tramos.map((t) => t.etiqueta)} filas={a.mapaNegativos} tono="mal" />
          </figure>
          <figure className="obj-grafica">
            <figcaption className="obj-grafica-titulo">🚀 Lo que te motiva, {porTramo} a {porTramo}</figcaption>
            <MapaFactores columnas={a.tramos.map((t) => t.etiqueta)} filas={a.mapaMotivos} tono="bien" />
          </figure>
        </div>
      )}

      {a.conAnimo > 0 && (
        <div className="obj-graficas-fila">
          <figure className="obj-grafica">
            <figcaption className="obj-grafica-titulo">Reparto de tu ánimo · {RANGOS[rango].toLowerCase()}</figcaption>
            <div className="obj-filas-barra">
              {a.reparto.slice().reverse().map((r) => (
                <FilaBarra
                  key={r.nivel}
                  emoji={ANIMO_EMOJI[r.nivel - 1]}
                  etiqueta={r.texto}
                  pct={(r.total / maxReparto) * 100}
                  relleno={`obj-nivel--${r.nivel}`}
                  valor={String(r.total)}
                  detalle={`${Math.round((r.total / a.conAnimo) * 100)} %`}
                />
              ))}
            </div>
          </figure>

          {a.emociones.length > 0 ? (
            <figure className="obj-grafica">
              <figcaption className="obj-grafica-titulo">Emociones que más se repiten, y el ánimo con que aparecen</figcaption>
              <div className="obj-filas-barra">
                {a.emociones.map((e) => (
                  <FilaBarra
                    key={e.emocion}
                    emoji={EMOCION_EMOJI[e.emocion]}
                    etiqueta={EMOCIONES[e.emocion]}
                    pct={(e.total / maxEmocion) * 100}
                    relleno="obj-hbarra-relleno--neutro"
                    valor={`${e.total} nota${e.total === 1 ? "" : "s"}`}
                    detalle={e.animo !== null ? `${emojiAnimo(e.animo)} ${textoAnimo(e.animo)}` : "sin ánimo"}
                  />
                ))}
              </div>
            </figure>
          ) : a.porArea.length > 0 ? (
            <figure className="obj-grafica">
              <figcaption className="obj-grafica-titulo">Cómo te sientes con cada área del negocio</figcaption>
              <div className="obj-filas-barra">
                {a.porArea.map((e) => (
                  <FilaBarra
                    key={e.etiqueta}
                    emoji={ETIQUETAS[e.etiqueta].emoji}
                    etiqueta={ETIQUETAS[e.etiqueta].texto}
                    pct={((e.animo as number) / 5) * 100}
                    relleno={`obj-nivel--${Math.round(e.animo as number)}`}
                    valor={`${emojiAnimo(e.animo as number)} ${textoAnimo(e.animo as number)}`}
                    detalle={`${cifra(e.animo as number)}/5 · ${e.notas} nota${e.notas === 1 ? "" : "s"}`}
                  />
                ))}
              </div>
            </figure>
          ) : null}
        </div>
      )}
    </div>
  );
}

/**
 * Una fila de gráfica de barras: etiqueta y cifra arriba, en la misma línea, y
 * la barra debajo a todo el ancho. Así nada se apila ni se descuadra, quepa la
 * etiqueta que quepa. Las filas a cero se atenúan y no pintan barra.
 */
function FilaBarra({ emoji, etiqueta, pct, relleno, valor, detalle }: {
  emoji: string;
  etiqueta: string;
  pct: number;
  relleno: string;
  valor: string;
  detalle?: string;
}) {
  const cero = pct <= 0;
  return (
    <div className={`obj-fila-barra${cero ? " obj-fila-barra--cero" : ""}`}>
      <div className="obj-fila-barra-linea">
        <span className="obj-fila-barra-etiqueta" title={etiqueta}>
          <span className="obj-fila-barra-emoji" aria-hidden="true">{emoji}</span>
          <span className="obj-fila-barra-texto">{etiqueta}</span>
        </span>
        <span className="obj-fila-barra-valor">
          <strong>{valor}</strong>
          {detalle && <small>{detalle}</small>}
        </span>
      </div>
      <div className="obj-fila-barra-pista">
        {!cero && <div className={`obj-fila-barra-relleno ${relleno}`} style={{ width: `${Math.max(pct, 2)}%` }} />}
      </div>
    </div>
  );
}
