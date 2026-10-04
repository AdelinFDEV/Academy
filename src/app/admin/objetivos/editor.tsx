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

export function cifra(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

// ── Fichas en blanco y helpers de piezas ─────────────────────────────────────

type Recurso = "objetivo" | "pieza" | "nota";
type Datos = Record<string, string | boolean>;
type Edicion = { recurso: Recurso; id: string | null; datos: Datos };

export function objetivoVacio(mes: string): Datos {
  return { titulo: "", metrica: "manual", repeticion: "no", meta: "", progreso_periodo: "0", desde: `${mes}-01`, hasta: finDeMes(mes), notas: "", archivado: false };
}

export function piezaVacia(fecha: string): Datos {
  return { titulo: "", canal: "youtube", tipo: "video", estado: "idea", fecha, enlace: "", notas: "" };
}

export function notaVacia(hoy: string): Datos {
  return { texto: "", fecha: hoy, animo: "", emocion: "", objetivo_id: "", ancla: false };
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
export async function enviar(recurso: Recurso, id: string | null, datos: Datos | null): Promise<string | null> {
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
export function useEditor(objetivos: ObjetivoConProgreso[]) {
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

  function cambiar(campo: string, valor: string | boolean) {
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
          {edicion.recurso === "nota" && <CamposNota d={edicion.datos} cambiar={cambiar} objetivos={objetivos} />}
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
        ...(canal ? { canal, tipo: canal === "web" ? "entrada" : canal === "telegram" ? "publicacion" : "video" } : {}),
      }),
    editarObjetivo: (o: ObjetivoConProgreso) =>
      abrir("objetivo", o.id, {
        titulo: o.titulo, metrica: o.metrica, repeticion: o.repeticion, meta: String(o.meta), progreso_periodo: String(o.actual),
        desde: o.desde, hasta: o.hasta ?? "", notas: o.notas ?? "", archivado: o.archivado,
      }),
    editarPieza: (p: Pieza) => abrir("pieza", p.id, datosPieza(p)),
    editarNota: (n: Nota) =>
      abrir("nota", n.id, {
        texto: n.texto, fecha: n.fecha, animo: n.animo === null ? "" : String(n.animo),
        emocion: n.emocion ?? "", objetivo_id: n.objetivo_id ?? "", ancla: n.ancla,
      }),
  };
}

// ── Piezas de formulario ─────────────────────────────────────────────────────

type FormProps = { d: Datos; cambiar: (campo: string, valor: string | boolean) => void };

type Opcion = { valor: string; emoji: string; texto: string; detalle?: string };

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
              className={`obj-opcion${activa ? " obj-opcion--activa" : ""}`}
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

function Campo({ etiqueta, children, ayuda }: { etiqueta: string; children: React.ReactNode; ayuda?: string }) {
  return (
    <label className="obj-campo">
      <span className="obj-etiqueta">{etiqueta}</span>
      {children}
      {ayuda && <small className="obj-campo-ayuda">{ayuda}</small>}
    </label>
  );
}

function Interruptor({ activo, onCambio, children }: { activo: boolean; onCambio: (v: boolean) => void; children: React.ReactNode }) {
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
        <Campo etiqueta="📅 Día" ayuda="Vacío = idea sin fecha">
          <input className="obj-input" type="date" value={String(d.fecha)} onChange={(e) => cambiar("fecha", e.target.value)} />
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

/** Los campos de una nota. Lo usan la ventana de edición y el escritorio del diario. */
export function CamposNota({ d, cambiar, objetivos, filasTexto = 6, autoFocus = true }: FormProps & {
  objetivos: ObjetivoConProgreso[];
  filasTexto?: number;
  autoFocus?: boolean;
}) {
  const activos = objetivos.filter((o) => !o.archivado);
  return (
    <>
      <textarea
        className="obj-diario-texto"
        rows={filasTexto}
        value={String(d.texto)}
        onChange={(e) => cambiar("texto", e.target.value)}
        placeholder="¿Cómo te sientes con el proyecto? ¿Qué ha funcionado, qué te pesa, qué quieres conseguir?"
        aria-label="Texto de la nota"
        required
        autoFocus={autoFocus}
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

      {activos.length > 0 && (
        <Opciones
          etiqueta="¿Va sobre algún objetivo?"
          opciones={[{ valor: "", emoji: "➖", texto: "Ninguno" }, ...activos.map((o) => ({ valor: o.id, emoji: METRICAS[o.metrica].emoji, texto: o.titulo }))]}
          valor={String(d.objetivo_id)}
          onCambio={(v) => cambiar("objetivo_id", v)}
        />
      )}

      <div className="obj-fila obj-fila--centrada">
        <Campo etiqueta="📅 Fecha">
          <input className="obj-input" type="date" value={String(d.fecha)} onChange={(e) => cambiar("fecha", e.target.value)} />
        </Campo>
        <Interruptor activo={d.ancla === true} onCambio={(v) => cambiar("ancla", v)}>
          📌 Fijar arriba: tu visión, tu porqué
        </Interruptor>
      </div>
    </>
  );
}
