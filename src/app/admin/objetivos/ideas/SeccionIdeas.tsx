"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CANALES, CANAL_EMOJI, TIPOS, TIPOS_POR_CANAL, TIPO_EMOJI, hoyISO, type Canal, type Idea, type Tipo } from "@/lib/objetivos";
import { enviar, fechaCorta } from "../editor";
import "./ideas.css";

/**
 * Ideas: una columna por canal. En cada una, un campo para apuntar y la lista
 * de ideas con un tick para tacharlas cuando ya están hechas. Sin día ni
 * estado: eso es del calendario.
 *
 * El paso de una a otro es «📅 Planificar»: elige el día y el tipo, crea la
 * pieza en el calendario (en estado «idea») y tacha la idea. La idea
 * tachada se queda en «Hechas» por si se quiere recuperar.
 */

const AYUDA: Record<Canal, string> = {
  youtube: "Vídeos, shorts, directos…",
  web: "Entradas, guías, herramientas…",
  telegram: "Mensajes, encuestas, avisos…",
};

/** Minúsculas y sin tildes, para buscar. */
function normalizar(t: string): string {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function SeccionIdeas({ ideas, falta }: { ideas: Idea[]; falta: boolean }) {
  const [busqueda, setBusqueda] = useState("");

  if (falta) {
    return (
      <p className="ide-aviso">
        Falta actualizar la base de datos: ejecuta <code>scripts/create-objetivos.sql</code> en el SQL Editor de Supabase.
      </p>
    );
  }

  const q = normalizar(busqueda.trim());
  const visibles = q ? ideas.filter((i) => normalizar(i.texto).includes(q)) : ideas;

  return (
    <div className="ide">
      {ideas.length > 9 && (
        <input
          type="search"
          className="ide-buscar"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder={`Buscar entre ${ideas.length} ideas`}
          aria-label="Buscar ideas"
        />
      )}
      <div className="ide-columnas">
        {(Object.keys(CANALES) as Canal[]).map((canal) => (
          <Columna key={canal} canal={canal} ideas={visibles.filter((i) => i.canal === canal)} buscando={!!q} />
        ))}
      </div>
    </div>
  );
}

function Columna({ canal, ideas, buscando }: { canal: Canal; ideas: Idea[]; buscando: boolean }) {
  const router = useRouter();
  const [nueva, setNueva] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [verHechas, setVerHechas] = useState(false);
  const [planificada, setPlanificada] = useState<string | null>(null);

  const pendientes = ideas.filter((i) => !i.hecha);
  const hechas = ideas.filter((i) => i.hecha);

  async function anadir() {
    if (!nueva.trim() || guardando) return;
    setGuardando(true);
    setError("");
    const fallo = await enviar("idea", null, { texto: nueva, canal, hecha: false });
    setGuardando(false);
    if (fallo) return setError(fallo);
    setNueva("");
    router.refresh();
  }

  return (
    <section className={`ide-col ide-col--${canal}`}>
      <header className="ide-col-cabeza">
        <span className="ide-col-emoji" aria-hidden="true">{CANAL_EMOJI[canal]}</span>
        <div>
          <h3>{CANALES[canal]}</h3>
          <span>{pendientes.length ? `${pendientes.length} por hacer` : "Nada pendiente"}{hechas.length ? ` · ${hechas.length} hecha${hechas.length === 1 ? "" : "s"}` : ""}</span>
        </div>
      </header>

      <form
        className="ide-nueva"
        onSubmit={(e) => {
          e.preventDefault();
          anadir();
        }}
      >
        <textarea
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          onKeyDown={(e) => {
            // Enter guarda; Mayús + Enter, salto de línea.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              anadir();
            }
          }}
          placeholder={`＋ Idea para ${CANALES[canal]} · ${AYUDA[canal]}`}
          aria-label={`Nueva idea para ${CANALES[canal]}`}
          maxLength={5000}
          rows={1}
          disabled={guardando}
        />
        {nueva.trim() && (
          <button type="submit" className="ide-anadir" disabled={guardando}>
            {guardando ? "…" : "Añadir"}
          </button>
        )}
      </form>
      {error && <p className="ide-error">⚠️ {error}</p>}
      {planificada && (
        <p className="ide-planificada">
          📅 Planificada para el {fechaCorta(planificada)}.{" "}
          <Link href={`/admin/objetivos/calendario?vista=semana&semana=${planificada}`}>Verla en el calendario ›</Link>
        </p>
      )}

      {pendientes.length === 0 && hechas.length === 0 ? (
        <p className="ide-vacio">{buscando ? "Nada coincide aquí." : "Aún no hay ideas."}</p>
      ) : (
        <ul className="ide-lista">
          {pendientes.map((i) => <FilaIdea key={`${i.id}-${i.texto.length}`} idea={i} onPlanificada={setPlanificada} />)}
        </ul>
      )}

      {hechas.length > 0 && (
        <div className="ide-hechas">
          <button type="button" className="ide-hechas-boton" onClick={() => setVerHechas((v) => !v)} aria-expanded={verHechas}>
            {verHechas ? "▾" : "▸"} Hechas ({hechas.length})
          </button>
          {verHechas && (
            <ul className="ide-lista">
              {hechas.map((i) => <FilaIdea key={`${i.id}-${i.texto.length}`} idea={i} />)}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

function FilaIdea({ idea, onPlanificada }: { idea: Idea; onPlanificada?: (fecha: string) => void }) {
  const router = useRouter();
  const [hecha, setHecha] = useState(idea.hecha);
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(idea.texto);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const [planificando, setPlanificando] = useState(false);

  async function guardar(cambios: { texto?: string; hecha?: boolean }) {
    setOcupado(true);
    setError("");
    const fallo = await enviar("idea", idea.id, { texto: cambios.texto ?? idea.texto, canal: idea.canal, hecha: cambios.hecha ?? idea.hecha });
    setOcupado(false);
    if (fallo) {
      setError(fallo);
      setHecha(idea.hecha);
      return false;
    }
    router.refresh();
    return true;
  }

  async function alternar() {
    setHecha(!hecha);
    await guardar({ hecha: !hecha });
  }

  async function borrar() {
    if (!confirm("¿Borrar esta idea?")) return;
    setOcupado(true);
    const fallo = await enviar("idea", idea.id, null);
    setOcupado(false);
    if (fallo) return setError(fallo);
    router.refresh();
  }

  if (editando) {
    return (
      <li className="ide-fila ide-fila--editando">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={async (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (texto.trim() && (await guardar({ texto }))) setEditando(false);
            }
            if (e.key === "Escape") {
              setTexto(idea.texto);
              setEditando(false);
            }
          }}
          aria-label="Editar idea"
          maxLength={5000}
          autoFocus
        />
        {error && <span className="ide-error">⚠️ {error}</span>}
        <div className="ide-fila-acciones">
          <button type="button" className="ide-enlace ide-enlace--peligro" onClick={borrar} disabled={ocupado}>Borrar</button>
          <button type="button" className="ide-enlace" onClick={() => { setTexto(idea.texto); setEditando(false); }} disabled={ocupado}>Cancelar</button>
          <button
            type="button"
            className="ide-anadir"
            onClick={async () => {
              if (texto.trim() && (await guardar({ texto }))) setEditando(false);
            }}
            disabled={ocupado || !texto.trim()}
          >
            Guardar
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className={`ide-fila${hecha ? " ide-fila--hecha" : ""}`}>
      <button
        type="button"
        role="checkbox"
        aria-checked={hecha}
        className="ide-tick"
        onClick={alternar}
        disabled={ocupado}
        aria-label={hecha ? `Desmarcar: ${idea.texto}` : `Marcar como hecha: ${idea.texto}`}
      >
        {hecha ? "✓" : ""}
      </button>
      <button type="button" className="ide-fila-texto" onClick={() => setEditando(true)} title="Pulsa para editarla">
        {idea.texto}
      </button>
      {!hecha && onPlanificada && (
        <button type="button" className="ide-planificar" onClick={() => setPlanificando((v) => !v)} aria-expanded={planificando} title="Llevarla al calendario">
          📅<span> Planificar</span>
        </button>
      )}
      {error && <span className="ide-error">⚠️ {error}</span>}
      {planificando && onPlanificada && (
        <Planificar
          idea={idea}
          onCancelar={() => setPlanificando(false)}
          onHecho={(fecha) => {
            setPlanificando(false);
            setHecha(true);
            onPlanificada(fecha);
            router.refresh();
          }}
        />
      )}
    </li>
  );
}

/**
 * Convierte una idea en pieza del calendario. El título es la primera línea
 * (recortada); si la idea es más larga, entera va a las notas de la pieza
 * para no perder nada.
 */
function Planificar({ idea, onCancelar, onHecho }: { idea: Idea; onCancelar: () => void; onHecho: (fecha: string) => void }) {
  const tipos = TIPOS_POR_CANAL[idea.canal];
  const [fecha, setFecha] = useState(() => hoyISO());
  const [tipo, setTipo] = useState<Tipo>(tipos[0]);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");

  async function planificar() {
    if (!fecha || ocupado) return;
    setOcupado(true);
    setError("");
    const primera = idea.texto.trim().split("\n")[0].trim();
    const titulo = primera.length > 120 ? `${primera.slice(0, 117).trimEnd()}…` : primera;
    const fallo = await enviar("pieza", null, {
      titulo,
      canal: idea.canal,
      tipo,
      estado: "idea",
      fecha,
      enlace: "",
      notas: titulo === idea.texto.trim() ? "" : idea.texto.trim(),
    });
    if (fallo) {
      setOcupado(false);
      return setError(fallo);
    }
    // La pieza ya existe: si tachar la idea fallara, lo peor es verla aún en la lista.
    await enviar("idea", idea.id, { texto: idea.texto, canal: idea.canal, hecha: true });
    setOcupado(false);
    onHecho(fecha);
  }

  return (
    <div className="ide-plan" role="group" aria-label="Planificar en el calendario">
      <label className="ide-plan-campo">
        <span>Día</span>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} disabled={ocupado} />
      </label>
      {tipos.length > 1 && (
        <div className="ide-plan-tipos" role="radiogroup" aria-label="Tipo de pieza">
          {tipos.map((t) => (
            <button key={t} type="button" role="radio" aria-checked={tipo === t} className={tipo === t ? "ide-plan-tipo--activo" : ""} onClick={() => setTipo(t)} disabled={ocupado}>
              {TIPO_EMOJI[t]} {TIPOS[t]}
            </button>
          ))}
        </div>
      )}
      <div className="ide-fila-acciones">
        <button type="button" className="ide-enlace" onClick={onCancelar} disabled={ocupado}>Cancelar</button>
        <button type="button" className="ide-anadir" onClick={planificar} disabled={ocupado || !fecha}>
          {ocupado ? "…" : "📅 Al calendario"}
        </button>
      </div>
      {error && <span className="ide-error">⚠️ {error}</span>}
    </div>
  );
}
