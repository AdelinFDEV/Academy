"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CANALES, CANAL_EMOJI, type Canal, type Idea } from "@/lib/objetivos";
import { enviar } from "../editor";
import "./ideas.css";

/**
 * Ideas: una columna por canal. En cada una, un campo para apuntar y la lista
 * de ideas con un tick para tacharlas cuando ya están hechas. Nada más: sin
 * día, sin estado y sin relación con el calendario.
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

      {pendientes.length === 0 && hechas.length === 0 ? (
        <p className="ide-vacio">{buscando ? "Nada coincide aquí." : "Aún no hay ideas."}</p>
      ) : (
        <ul className="ide-lista">
          {pendientes.map((i) => <FilaIdea key={`${i.id}-${i.texto.length}`} idea={i} />)}
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

function FilaIdea({ idea }: { idea: Idea }) {
  const router = useRouter();
  const [hecha, setHecha] = useState(idea.hecha);
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(idea.texto);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");

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
      {error && <span className="ide-error">⚠️ {error}</span>}
    </li>
  );
}
