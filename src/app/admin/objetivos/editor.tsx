"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ANIMOS,
  ANIMO_EMOJI,
  CANALES,
  CANAL_EMOJI,
  EMOCIONES,
  EMOCION_EMOJI,
  ESTADOS,
  ESTADO_EMOJI,
  ETIQUETAS,
  FACTORES_MOTIVOS,
  FACTORES_NEGATIVOS,
  METRICAS,
  REPETICIONES,
  REPETICION_EMOJI,
  TIPOS,
  TIPO_EMOJI,
  type Canal,
  type Estado,
  type Metrica,
  type Nota,
  type ObjetivoConProgreso,
  type Pieza,
  type Ritmo,
  formatoES,
} from "@/lib/objetivos";

/**
 * Lo que comparten las secciones de /admin/objetivos: fechas, etiquetas del
 * ritmo y el editor (la ventana para crear, editar y borrar).
 *
 * Sin <select> nativos a propósito: en Windows la lista desplegable sale con
 * fondo blanco y heredaba el texto claro del panel, así que no se leía nada.
 * Todas las elecciones son botones visibles, que además se entienden mejor.
 */

const DIA = 24 * 60 * 60 * 1000;

export const RITMO: Record<Ritmo, { texto: string; emoji: string; clase: string }> = {
  cumplido: { texto: "Cumplido", emoji: "✅", clase: "obj-ritmo--ok" },
  adelantado: { texto: "Por delante", emoji: "🚀", clase: "obj-ritmo--ok" },
  "en-ritmo": { texto: "En ritmo", emoji: "👍", clase: "obj-ritmo--neutro" },
  retrasado: { texto: "Por detrás", emoji: "⚠️", clase: "obj-ritmo--warn" },
  fallido: { texto: "No se llegó", emoji: "❌", clase: "obj-ritmo--bad" },
  pendiente: { texto: "Aún no empieza", emoji: "⏳", clase: "obj-ritmo--off" },
};

export const CANAL_CORTO: Record<Canal, string> = { youtube: "YT", web: "Web", telegram: "TG" };

export function diasEntre(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DIA);
}

export function sumarDias(fecha: string, dias: number): string {
  return new Date(Date.parse(`${fecha}T00:00:00Z`) + dias * DIA).toISOString().slice(0, 10);
}

export function nombreMes(mes: string, corto = false): string {
  const [a, m] = mes.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, 1)).toLocaleDateString("es-ES", {
    month: corto ? "short" : "long",
    ...(corto ? {} : { year: "numeric" }),
    timeZone: "UTC",
  });
}

export function mesVecino(mes: string, salto: number): string {
  const [a, m] = mes.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1 + salto, 1)).toISOString().slice(0, 7);
}

export function finDeMes(mes: string): string {
  const [a, m] = mes.split("-").map(Number);
  return new Date(Date.UTC(a, m, 0)).toISOString().slice(0, 10);
}

export function fechaCorta(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("es-ES", { day: "numeric", month: "short", timeZone: "UTC" });
}

/** Una cifra en español: «2,8», «1.250». Como mucho un decimal. */
export function cifra(n: number): string {
  return formatoES(n, { maximumFractionDigits: 1 });
}

// ── Fichas en blanco y helpers de piezas ─────────────────────────────────────

type Recurso = "objetivo" | "pieza" | "nota";
export type Datos = Record<string, string | boolean | string[]>;
type Edicion = { recurso: Recurso; id: string | null; datos: Datos };

export function objetivoVacio(mes: string): Datos {
  return { titulo: "", metrica: "manual", ambito: "negocio", repeticion: "no", meta: "", progreso_periodo: "0", marca_inicial: "", desde: `${mes}-01`, hasta: finDeMes(mes), notas: "", archivado: false };
}

export function piezaVacia(fecha: string): Datos {
  return { titulo: "", canal: "youtube", tipo: "video", estado: "idea", fecha, enlace: "", notas: "" };
}

export function notaVacia(hoy: string): Datos {
  return { texto: "", fecha: hoy, animo: "", emocion: "", etiqueta: "", fotos: [], lugar: "", lat: "", lng: "", objetivo_id: "", ancla: false, negativos: [], motivos: [] };
}

/** La ficha completa de una pieza, como la espera la API (que siempre recibe la ficha entera). */
export function datosPieza(p: Pieza): Datos {
  return {
    titulo: p.titulo, canal: p.canal, tipo: p.tipo, estado: p.estado,
    fecha: p.fecha ?? "", enlace: p.enlace ?? "", notas: p.notas ?? "",
  };
}

/** El paso siguiente del camino idea → … → publicado, o null si ya salió. */
export function siguienteEstado(estado: Estado): Estado | null {
  const orden = Object.keys(ESTADOS) as Estado[];
  const i = orden.indexOf(estado);
  return i >= 0 && i < orden.length - 1 ? orden[i + 1] : null;
}

/** Manda una ficha a la API. Devuelve el mensaje de error, o null si fue bien. */
export async function enviar(recurso: Recurso | "intencion" | "idea" | "movimiento", id: string | null, datos: Datos | null): Promise<string | null> {
  try {
    const url = `/api/admin/plan/${recurso}${id ? `/${id}` : ""}`;
    const res = await fetch(url, {
      method: datos === null ? "DELETE" : id ? "PATCH" : "POST",
      headers: datos === null ? undefined : { "Content-Type": "application/json" },
      body: datos === null ? undefined : JSON.stringify(datos),
    });
    if (res.ok) return null;
    const json: { error?: string } = await res.json().catch(() => ({}));
    return json.error || "No se pudo guardar.";
  } catch (err) {
    return err instanceof Error ? err.message : "No se pudo guardar.";
  }
}

// ── El editor ────────────────────────────────────────────────────────────────

const CABECERA: Record<Recurso, { emoji: string; nuevo: string; editar: string }> = {
  objetivo: { emoji: "🎯", nuevo: "Nuevo objetivo", editar: "Editar objetivo" },
  pieza: { emoji: "🗓️", nuevo: "Planear contenido", editar: "Editar contenido" },
  nota: { emoji: "📓", nuevo: "Nueva nota", editar: "Editar nota" },
};

/**
 * La ventana de edición. Cada sección la usa así:
 *
 *   const editor = useEditor(objetivos);
 *   …onClick={() => editor.editarPieza(p)}
 *   {editor.modal}
 */
export function useEditor(objetivos: ObjetivoConProgreso[], urlsFotos: Record<string, string> = {}) {
  const router = useRouter();
  const [edicion, setEdicion] = useState<Edicion | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  // Escape cierra, como cualquier ventana.
  useEffect(() => {
    if (!edicion) return;
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !guardando) setEdicion(null);
    };
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [edicion, guardando]);

  function abrir(recurso: Recurso, id: string | null, datos: Datos) {
    setError("");
    setEdicion({ recurso, id, datos });
  }

  function cambiar(campo: string, valor: string | boolean | string[]) {
    setEdicion((e) => (e ? { ...e, datos: { ...e.datos, [campo]: valor } } : e));
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!edicion) return;
    setGuardando(true);
    const fallo = await enviar(edicion.recurso, edicion.id, edicion.datos);
    setGuardando(false);
    if (fallo) return setError(fallo);
    setEdicion(null);
    router.refresh();
  }

  async function borrar() {
    if (!edicion?.id || !confirm("¿Borrarlo? No se puede deshacer.")) return;
    setGuardando(true);
    const fallo = await enviar(edicion.recurso, edicion.id, null);
    setGuardando(false);
    if (fallo) return setError(fallo);
    setEdicion(null);
    router.refresh();
  }

  const cab = edicion ? CABECERA[edicion.recurso] : null;

  const modal = edicion && cab && (
    <div className="obj-modal-fondo" onClick={() => !guardando && setEdicion(null)}>
      <form
        className="obj-modal"
        onSubmit={guardar}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="obj-modal-titulo"
      >
        <div className="obj-modal-cabeza">
          <span className="obj-modal-emoji" aria-hidden="true">{cab.emoji}</span>
          <h3 id="obj-modal-titulo" className="obj-modal-titulo">{edicion.id ? cab.editar : cab.nuevo}</h3>
          <button type="button" className="obj-modal-cerrar" onClick={() => setEdicion(null)} aria-label="Cerrar" disabled={guardando}>
            ✕
          </button>
        </div>

        <div className="obj-modal-cuerpo">
          {edicion.recurso === "objetivo" && <FormObjetivo d={edicion.datos} cambiar={cambiar} />}
          {edicion.recurso === "pieza" && <FormPieza d={edicion.datos} cambiar={cambiar} />}
          {edicion.recurso === "nota" && <CamposNota d={edicion.datos} cambiar={cambiar} objetivos={objetivos} urlsFotos={urlsFotos} />}
        </div>

        {error && <p className="obj-error">⚠️ {error}</p>}

        <div className="obj-modal-acciones">
          {edicion.id && (
            <button type="button" className="obj-borrar" onClick={borrar} disabled={guardando}>🗑️ Borrar</button>
          )}
          <button type="button" className="obj-boton obj-boton--suave" onClick={() => setEdicion(null)} disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" className="obj-boton obj-boton--principal" disabled={guardando}>
            {guardando ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );

  return {
    modal,
    nuevoObjetivo: (mes: string) => abrir("objetivo", null, objetivoVacio(mes)),
    /** Con `canal`, sugiere también el tipo que le pega: vídeo, entrada o publicación. */
    nuevaPieza: (fecha: string, canal?: Canal) =>
      abrir("pieza", null, {
        ...piezaVacia(fecha),
        ...(canal ? { canal, tipo: canal === "web" ? "guia" : canal === "telegram" ? "publicacion" : "video" } : {}),
      }),
    editarObjetivo: (o: ObjetivoConProgreso) =>
      abrir("objetivo", o.id, {
        titulo: o.titulo, metrica: o.metrica, ambito: o.ambito, repeticion: o.repeticion, meta: String(o.meta), progreso_periodo: String(o.actual),
        desde: o.desde, hasta: o.hasta ?? "", notas: o.notas ?? "", archivado: o.archivado,
      }),
    editarPieza: (p: Pieza) => abrir("pieza", p.id, datosPieza(p)),
    editarNota: (n: Nota) =>
      abrir("nota", n.id, {
        texto: n.texto, fecha: n.fecha, animo: n.animo === null ? "" : String(n.animo),
        emocion: n.emocion ?? "", etiqueta: n.etiqueta ?? "", fotos: n.fotos ?? [], lugar: n.lugar ?? "",
        lat: n.lat === null ? "" : String(n.lat), lng: n.lng === null ? "" : String(n.lng),
        objetivo_id: n.objetivo_id ?? "", ancla: n.ancla, negativos: n.negativos ?? [], motivos: n.motivos ?? [],
      }),
  };
}

// ── Piezas de formulario ─────────────────────────────────────────────────────

type FormProps = { d: Datos; cambiar: (campo: string, valor: string | boolean | string[]) => void };

type Opcion = { valor: string; emoji: string; texto: string; detalle?: string; tono?: string };

/**
 * Una elección entre opciones visibles: chips en fila, tarjetas en rejilla o
 * segmentos. Hace el trabajo de un <select>, pero se ve entera y se entiende
 * de un vistazo.
 */
export function Opciones({
  etiqueta,
  opciones,
  valor,
  onCambio,
  forma = "chips",
  permitirVacio = false,
}: {
  etiqueta: string;
  opciones: Opcion[];
  valor: string;
  onCambio: (v: string) => void;
  forma?: "chips" | "tarjetas" | "segmentos";
  permitirVacio?: boolean;
}) {
  return (
    <div className="obj-opciones-bloque">
      {etiqueta && <span className="obj-etiqueta">{etiqueta}</span>}
      <div className={`obj-opciones obj-opciones--${forma}`} role="radiogroup" aria-label={etiqueta || undefined}>
        {opciones.map((o) => {
          const activa = valor === o.valor;
          return (
            <button
              type="button"
              key={o.valor || "ninguno"}
              role="radio"
              aria-checked={activa}
              className={`obj-opcion${activa ? " obj-opcion--activa" : ""}${o.tono ? " obj-opcion--tono" : ""}`}
              style={o.tono ? ({ "--tono": o.tono } as React.CSSProperties) : undefined}
              onClick={() => onCambio(activa && permitirVacio ? "" : o.valor)}
            >
              <span className="obj-opcion-emoji" aria-hidden="true">{o.emoji}</span>
              <span className="obj-opcion-texto">
                {o.texto}
                {o.detalle && <small>{o.detalle}</small>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Lo que te ha afectado y lo que te ha motivado: chips que se marcan y
 * desmarcan, varios a la vez. Lo usan el escritorio del diario y la ventana
 * de edición de una nota.
 */
export function Factores({ d, cambiar }: FormProps) {
  const grupos = [
    { campo: "negativos", titulo: "😣 ¿Qué te ha afectado?", opciones: FACTORES_NEGATIVOS, tono: "mal" },
    { campo: "motivos", titulo: "🚀 ¿Qué te ha motivado?", opciones: FACTORES_MOTIVOS, tono: "bien" },
  ] as const;
  return (
    <div className="obj-factores">
      {grupos.map((g) => {
        const marcados = Array.isArray(d[g.campo]) ? (d[g.campo] as string[]) : [];
        return (
          <div key={g.campo} className={`obj-factores-grupo obj-factores-grupo--${g.tono}`}>
            <span className="obj-factores-titulo">{g.titulo}</span>
            <div className="obj-factores-lista">
              {(Object.entries(g.opciones) as [string, { texto: string; emoji: string }][]).map(([clave, f]) => {
                const activo = marcados.includes(clave);
                return (
                  <button
                    key={clave}
                    type="button"
                    aria-pressed={activo}
                    className={`obj-factor${activo ? " obj-factor--activo" : ""}`}
                    onClick={() => cambiar(g.campo, activo ? marcados.filter((x) => x !== clave) : [...marcados, clave])}
                  >
                    <span aria-hidden="true">{f.emoji}</span> {f.texto}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Campo({ etiqueta, children, ayuda }: { etiqueta: string; children: React.ReactNode; ayuda?: string }) {
  return (
    <label className="obj-campo">
      <span className="obj-etiqueta">{etiqueta}</span>
      {children}
      {ayuda && <small className="obj-campo-ayuda">{ayuda}</small>}
    </label>
  );
}

export function Interruptor({ activo, onCambio, children }: { activo: boolean; onCambio: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <button type="button" role="switch" aria-checked={activo} className={`obj-interruptor${activo ? " obj-interruptor--on" : ""}`} onClick={() => onCambio(!activo)}>
      <span className="obj-interruptor-pista" aria-hidden="true"><span /></span>
      <span>{children}</span>
    </button>
  );
}

const opcionesMetrica = (grupo: "yo" | "auto"): Opcion[] =>
  (Object.entries(METRICAS) as [Metrica, (typeof METRICAS)[Metrica]][])
    .filter(([, m]) => m.grupo === grupo)
    .map(([valor, m]) => ({ valor, emoji: m.emoji, texto: m.texto }));

function FormObjetivo({ d, cambiar }: FormProps) {
  const metrica = String(d.metrica) as Metrica;
  const esNuevo = !("progreso_periodo" in d) || d.marca_inicial !== undefined;
  const repite = d.repeticion !== "no";
  const esNivel = METRICAS[metrica]?.tipo === "nivel";
  const periodo = d.repeticion === "semanal" ? "semana" : d.repeticion === "mensual" ? "mes" : "periodo";

  return (
    <>
      <Campo etiqueta="¿Qué quieres conseguir?">
        <input className="obj-input obj-input--grande" value={String(d.titulo)} onChange={(e) => cambiar("titulo", e.target.value)} placeholder="Ej.: 4 vídeos al mes" required autoFocus />
      </Campo>

      <div className="obj-opciones-bloque">
        <span className="obj-etiqueta">¿Cómo se mide?</span>
        <div className="obj-medida">
          <span className="obj-medida-titulo">Lo apuntas tú</span>
          <Opciones etiqueta="" opciones={opcionesMetrica("yo")} valor={metrica} onCambio={(v) => cambiar("metrica", v)} forma="tarjetas" />
          <span className="obj-medida-titulo">Se cuenta solo con los datos de la web</span>
          <Opciones etiqueta="" opciones={opcionesMetrica("auto")} valor={metrica} onCambio={(v) => cambiar("metrica", v)} forma="tarjetas" />
        </div>
        <p className="obj-pista">
          <span aria-hidden="true">{METRICAS[metrica]?.emoji}</span> {METRICAS[metrica]?.ayuda}
        </p>
      </div>

      <Opciones
        etiqueta="¿Se repite?"
        forma="segmentos"
        opciones={(Object.keys(REPETICIONES) as (keyof typeof REPETICIONES)[]).map((k) => ({ valor: k, emoji: REPETICION_EMOJI[k], texto: REPETICIONES[k] }))}
        valor={String(d.repeticion)}
        onCambio={(v) => cambiar("repeticion", v)}
      />
      {repite && (
        <p className="obj-pista obj-pista--suave">
          🔁 Se renueva solo cada {periodo}. Cada {periodo} cerrado queda en el historial, para ver cuántas veces lo cumples.
        </p>
      )}

      <div className="obj-fila">
        <Campo etiqueta={esNivel ? "🏁 Llegar a" : repite ? `🏁 Meta cada ${periodo}` : "🏁 Meta"}>
          <input className="obj-input" type="number" min="0" step="any" value={String(d.meta)} onChange={(e) => cambiar("meta", e.target.value)} required />
        </Campo>
        {metrica === "marca" && esNuevo && (
          <Campo etiqueta="📏 Empiezo en" ayuda="Tu marca de hoy: el punto de partida">
            <input className="obj-input" type="number" step="any" value={String(d.marca_inicial ?? "")} onChange={(e) => cambiar("marca_inicial", e.target.value)} />
          </Campo>
        )}
        {metrica === "manual" && (
          <Campo etiqueta={`✍️ Llevo este ${periodo}`}>
            <input className="obj-input" type="number" min="0" step="any" value={String(d.progreso_periodo)} onChange={(e) => cambiar("progreso_periodo", e.target.value)} />
          </Campo>
        )}
      </div>

      <div className="obj-fila">
        <Campo etiqueta={repite ? "Empieza" : "Desde"}>
          <input className="obj-input" type="date" value={String(d.desde)} onChange={(e) => cambiar("desde", e.target.value)} required />
        </Campo>
        <Campo etiqueta={repite ? "Termina" : "Hasta"} ayuda={repite ? "Vacío = sin fin" : undefined}>
          <input className="obj-input" type="date" value={String(d.hasta)} onChange={(e) => cambiar("hasta", e.target.value)} required={!repite} />
        </Campo>
      </div>

      <Campo etiqueta="¿Por qué te importa? (opcional)">
        <textarea className="obj-input" rows={2} value={String(d.notas)} onChange={(e) => cambiar("notas", e.target.value)} placeholder="La tarjeta te lo recordará cuando flojees." />
      </Campo>

      <Interruptor activo={d.archivado === true} onCambio={(v) => cambiar("archivado", v)}>
        Archivado: sale de la vista principal
      </Interruptor>
    </>
  );
}

function FormPieza({ d, cambiar }: FormProps) {
  return (
    <>
      <Campo etiqueta="Título">
        <input className="obj-input obj-input--grande" value={String(d.titulo)} onChange={(e) => cambiar("titulo", e.target.value)} placeholder="Ej.: Vídeo sobre el halving" required autoFocus />
      </Campo>
      <Opciones
        etiqueta="Canal"
        forma="segmentos"
        opciones={(Object.keys(CANALES) as Canal[]).map((k) => ({ valor: k, emoji: CANAL_EMOJI[k], texto: CANALES[k] }))}
        valor={String(d.canal)}
        onCambio={(v) => cambiar("canal", v)}
      />
      <Opciones
        etiqueta="Tipo"
        opciones={(Object.keys(TIPOS) as (keyof typeof TIPOS)[]).map((k) => ({ valor: k, emoji: TIPO_EMOJI[k], texto: TIPOS[k] }))}
        valor={String(d.tipo)}
        onCambio={(v) => cambiar("tipo", v)}
      />
      <Opciones
        etiqueta="¿En qué punto está?"
        opciones={(Object.keys(ESTADOS) as Estado[]).map((k) => ({ valor: k, emoji: ESTADO_EMOJI[k], texto: ESTADOS[k] }))}
        valor={String(d.estado)}
        onCambio={(v) => cambiar("estado", v)}
      />
      <div className="obj-fila">
        <Campo etiqueta="📅 Día">
          <input className="obj-input" type="date" value={String(d.fecha)} onChange={(e) => cambiar("fecha", e.target.value)} required />
        </Campo>
        <Campo etiqueta="🔗 Enlace (opcional)">
          <input className="obj-input" type="url" value={String(d.enlace)} onChange={(e) => cambiar("enlace", e.target.value)} placeholder="https://" />
        </Campo>
      </div>
      <Campo etiqueta="Notas (opcional)">
        <textarea className="obj-input" rows={3} value={String(d.notas)} onChange={(e) => cambiar("notas", e.target.value)} placeholder="Guion, ideas sueltas, referencias…" />
      </Campo>
    </>
  );
}

/** Un color por área del diario, para reconocerla de un vistazo. */
export const TONO_AREA: Record<keyof typeof ETIQUETAS, string> = {
  dinero: "#22c55e",
  crecimiento: "#38bdf8",
  contenido: "#ff8a3d",
};

/** Los campos de una nota. Lo usan la ventana de edición y el escritorio del diario. */
export function CamposNota({ d, cambiar, objetivos, filasTexto = 6, autoFocus = true, urlsFotos = {} }: FormProps & {
  objetivos: ObjetivoConProgreso[];
  filasTexto?: number;
  autoFocus?: boolean;
  urlsFotos?: Record<string, string>;
}) {
  const activos = objetivos.filter((o) => !o.archivado);
  return (
    <>
      <textarea
        className="obj-diario-texto"
        rows={filasTexto}
        value={String(d.texto)}
        onChange={(e) => cambiar("texto", e.target.value)}
        placeholder="¿Qué ha pasado hoy con el proyecto? Dinero, crecimiento, contenido, cómo te sientes…"
        aria-label="Texto de la nota"
        required
        autoFocus={autoFocus}
      />

      <Opciones
        etiqueta="¿De qué va?"
        opciones={(Object.keys(ETIQUETAS) as (keyof typeof ETIQUETAS)[]).map((k) => ({ valor: k, emoji: ETIQUETAS[k].emoji, texto: ETIQUETAS[k].texto, tono: TONO_AREA[k] }))}
        valor={String(d.etiqueta ?? "")}
        onCambio={(v) => cambiar("etiqueta", v)}
        permitirVacio
      />

      <div className="obj-opciones-bloque">
        <span className="obj-etiqueta">¿Cómo te sientes?</span>
        <div className="obj-animos" role="radiogroup" aria-label="Ánimo">
          {ANIMOS.map((a, i) => {
            const v = String(i + 1);
            const activo = String(d.animo) === v;
            return (
              <button
                type="button"
                key={a}
                role="radio"
                aria-checked={activo}
                className={`obj-animo-boton obj-animo-boton--${i + 1}${activo ? " obj-animo-boton--activo" : ""}`}
                onClick={() => cambiar("animo", activo ? "" : v)}
              >
                <span className="obj-animo-boton-emoji" aria-hidden="true">{ANIMO_EMOJI[i]}</span>
                <span className="obj-animo-boton-texto">{a}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Opciones
        etiqueta="¿Qué emoción lo describe mejor?"
        opciones={(Object.keys(EMOCIONES) as (keyof typeof EMOCIONES)[]).map((k) => ({ valor: k, emoji: EMOCION_EMOJI[k], texto: EMOCIONES[k] }))}
        valor={String(d.emocion)}
        onCambio={(v) => cambiar("emocion", v)}
        permitirVacio
      />

      <Factores d={d} cambiar={cambiar} />

      <div className="obj-nota-dos">
        <FotosNota fotos={Array.isArray(d.fotos) ? d.fotos : []} urls={urlsFotos} onCambio={(f) => cambiar("fotos", f)} />
        <div className="obj-nota-col">
          <UbicacionNota d={d} cambiar={cambiar} />
          <Campo etiqueta="📅 Fecha">
            <input className="obj-input" type="date" value={String(d.fecha)} onChange={(e) => cambiar("fecha", e.target.value)} />
          </Campo>
        </div>
      </div>

      {activos.length > 0 && (
        <Opciones
          etiqueta="¿Va sobre algún objetivo?"
          opciones={[{ valor: "", emoji: "➖", texto: "Ninguno" }, ...activos.map((o) => ({ valor: o.id, emoji: METRICAS[o.metrica].emoji, texto: o.titulo }))]}
          valor={String(d.objetivo_id)}
          onCambio={(v) => cambiar("objetivo_id", v)}
        />
      )}

      <div className="obj-nota-fijar">
        <Interruptor activo={d.ancla === true} onCambio={(v) => cambiar("ancla", v)}>
          📌 Fijar arriba
        </Interruptor>
        <span className="obj-ayuda">Para lo que quieres releer: tu visión a un año, por qué haces esto.</span>
      </div>
    </>
  );
}

// ── Fotos de la nota ─────────────────────────────────────────────────────────

const MAX_FOTOS = 6;
const LADO_MAX = 1600;

/**
 * Reduce la foto en el navegador antes de subirla: WebP de 1.600 px como
 * mucho y calidad 0,82, la misma regla que las portadas de la web. Una foto
 * del móvil pasa de 3-8 MB a unos 300 KB, y además cabe en el límite de 4,5 MB
 * por petición de Vercel, que con la original se superaba.
 */
async function comprimir(archivo: File): Promise<Blob> {
  const imagen = await createImageBitmap(archivo);
  const escala = Math.min(1, LADO_MAX / Math.max(imagen.width, imagen.height));
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.round(imagen.width * escala);
  lienzo.height = Math.round(imagen.height * escala);
  lienzo.getContext("2d")?.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
  imagen.close();
  return new Promise((resolver, fallar) =>
    lienzo.toBlob((b) => (b ? resolver(b) : fallar(new Error("No se pudo procesar la foto."))), "image/webp", 0.82)
  );
}

export function FotosNota({ fotos, urls, onCambio }: { fotos: string[]; urls: Record<string, string>; onCambio: (f: string[]) => void }) {
  const [subiendo, setSubiendo] = useState(0);
  const [encima, setEncima] = useState(false);
  const [error, setError] = useState("");
  // Vista previa local de lo recién subido: aún no tiene enlace firmado.
  const [previas, setPrevias] = useState<Record<string, string>>({});
  const quedan = MAX_FOTOS - fotos.length;

  async function subir(lista: File[]) {
    const archivos = lista.filter((f) => f.type.startsWith("image/")).slice(0, quedan);
    if (!archivos.length) return;
    setError("");
    setSubiendo(archivos.length);
    const nuevas: string[] = [];
    for (const archivo of archivos) {
      try {
        const blob = await comprimir(archivo);
        const datos = new FormData();
        datos.append("foto", blob, "foto.webp");
        const res = await fetch("/api/admin/plan/foto", { method: "POST", body: datos });
        const json: { ruta?: string; error?: string } = await res.json().catch(() => ({}));
        if (!res.ok || !json.ruta) throw new Error(json.error || "No se pudo subir la foto.");
        nuevas.push(json.ruta);
        const ruta = json.ruta;
        // data: y no blob:, porque la CSP de la web solo permite imágenes
        // 'self', data: y https: (next.config.ts).
        const previa = await new Promise<string>((ok) => {
          const lector = new FileReader();
          lector.onload = () => ok(String(lector.result));
          lector.readAsDataURL(blob);
        });
        setPrevias((p) => ({ ...p, [ruta]: previa }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo subir la foto.");
      }
      setSubiendo((n) => n - 1);
    }
    if (nuevas.length) onCambio([...fotos, ...nuevas]);
  }

  const zona = quedan > 0 && (
    <label
      className={[
        "obj-fotos-zona",
        fotos.length ? "obj-fotos-zona--mini" : "",
        encima ? "obj-fotos-zona--encima" : "",
        subiendo ? "obj-fotos-zona--subiendo" : "",
      ].filter(Boolean).join(" ")}
      onDragOver={(e) => {
        e.preventDefault();
        setEncima(true);
      }}
      onDragLeave={() => setEncima(false)}
      onDrop={(e) => {
        e.preventDefault();
        setEncima(false);
        subir(Array.from(e.dataTransfer.files));
      }}
    >
      <input
        type="file"
        accept="image/*"
        multiple
        disabled={subiendo > 0}
        onChange={(e) => {
          const lista = Array.from(e.target.files ?? []);
          e.target.value = "";
          subir(lista);
        }}
      />
      <span className="obj-fotos-zona-icono" aria-hidden="true">{subiendo ? "⏳" : encima ? "📥" : "📷"}</span>
      {fotos.length ? (
        <span className="obj-fotos-zona-titulo">{subiendo ? "Subiendo…" : "Añadir"}</span>
      ) : (
        <>
          <span className="obj-fotos-zona-titulo">
            {subiendo ? `Subiendo ${subiendo} foto${subiendo === 1 ? "" : "s"}…` : encima ? "Suelta para añadir" : "Añade fotos"}
          </span>
          <span className="obj-fotos-zona-sub">Pulsa o arrastra aquí · hasta {MAX_FOTOS} · se comprimen solas</span>
        </>
      )}
    </label>
  );

  return (
    <div className="obj-opciones-bloque obj-fotos-bloque">
      <span className="obj-etiqueta">
        📷 Fotos {fotos.length > 0 && <span className="obj-etiqueta-dato">{fotos.length}/{MAX_FOTOS}</span>}
      </span>
      {fotos.length === 0 ? (
        zona
      ) : (
        <div className="obj-fotos">
          {fotos.map((f) => {
            const src = previas[f] ?? urls[f];
            return (
              <div key={f} className="obj-foto">
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element -- enlace firmado y privado: no pasa por el optimizador de Next
                  <img src={src} alt="" />
                ) : (
                  <span className="obj-foto-sin">📷</span>
                )}
                <button type="button" className="obj-foto-quitar" onClick={() => onCambio(fotos.filter((x) => x !== f))} aria-label="Quitar foto">
                  ✕
                </button>
              </div>
            );
          })}
          {zona}
        </div>
      )}
      {error && <p className="obj-error">⚠️ {error}</p>}
    </div>
  );
}

// ── Ubicación de la nota ─────────────────────────────────────────────────────

export function UbicacionNota({ d, cambiar }: FormProps) {
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState("");
  const tieneCoordenadas = String(d.lat ?? "") !== "" && String(d.lng ?? "") !== "";

  function usarUbicacion() {
    if (!navigator.geolocation) return setError("Este navegador no da la ubicación.");
    setBuscando(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        cambiar("lat", pos.coords.latitude.toFixed(6));
        cambiar("lng", pos.coords.longitude.toFixed(6));
        setBuscando(false);
      },
      () => {
        setError("No se pudo obtener la ubicación. Revisa el permiso del navegador.");
        setBuscando(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="obj-opciones-bloque">
      <span className="obj-etiqueta">📍 ¿Dónde estás?</span>
      <div className="obj-ubicacion">
        <input
          className="obj-input"
          value={String(d.lugar ?? "")}
          onChange={(e) => cambiar("lugar", e.target.value)}
          placeholder="Casa, oficina, estudio de grabación…"
          maxLength={120}
        />
        {tieneCoordenadas ? (
          <span className="obj-ubicacion-ok">
            <a href={`https://www.google.com/maps?q=${d.lat},${d.lng}`} target="_blank" rel="noopener noreferrer">🗺️ Ver en el mapa</a>
            <button type="button" className="obj-enlace" onClick={() => { cambiar("lat", ""); cambiar("lng", ""); }}>Quitar</button>
          </span>
        ) : (
          <button type="button" className="obj-boton obj-boton--suave obj-boton--pequeno" onClick={usarUbicacion} disabled={buscando}>
            {buscando ? "⏳ Buscando…" : "📍 Usar mi ubicación"}
          </button>
        )}
      </div>
      {error && <p className="obj-error">⚠️ {error}</p>}
    </div>
  );
}
