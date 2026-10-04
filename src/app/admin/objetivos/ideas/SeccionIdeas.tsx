"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CANALES, CANAL_EMOJI, ESTADOS, ESTADO_EMOJI, TIPOS, TIPO_EMOJI, type Canal, type ObjetivoConProgreso, type Pieza,
} from "@/lib/objetivos";
import { datosPieza, enviar, useEditor } from "../editor";

/**
 * Las ideas, una columna por canal. Una idea deja de estar aquí en cuanto le
 * pones día: pasa al calendario.
 */
export default function SeccionIdeas({ objetivos, ideas }: { objetivos: ObjetivoConProgreso[]; ideas: Pieza[] }) {
  const editor = useEditor(objetivos);
  const router = useRouter();
  const [programando, setProgramando] = useState<string | null>(null);

  async function programar(p: Pieza, fecha: string) {
    if (!fecha) return;
    const fallo = await enviar("pieza", p.id, { ...datosPieza(p), fecha });
    if (fallo) alert(fallo);
    else router.refresh();
    setProgramando(null);
  }

  return (
    <>
      <div className="obj-barra-seccion">
        <div>
          <h2 className="obj-titulo-seccion">💡 Ideas sin fecha</h2>
          <p className="obj-sub-seccion">
            Apunta todo lo que se te ocurra, aunque no sepas cuándo saldrá. Cuando le pongas día, pasa al calendario.
          </p>
        </div>
        <button className="obj-boton obj-boton--principal" onClick={() => editor.nuevaPieza("")}>＋ Nueva idea</button>
      </div>

      <div className="obj-columnas">
        {(Object.keys(CANALES) as Canal[]).map((canal) => {
          const delCanal = ideas.filter((p) => p.canal === canal);
          return (
            <section key={canal} className={`obj-columna obj-columna--${canal}`}>
              <header className="obj-columna-cabeza">
                <span className="obj-columna-emoji" aria-hidden="true">{CANAL_EMOJI[canal]}</span>
                <h3 className="obj-columna-titulo">{CANALES[canal]}</h3>
                <span className="obj-columna-total">{delCanal.length}</span>
                <button className="obj-columna-mas" onClick={() => editor.nuevaPieza("", canal)} aria-label={`Nueva idea para ${CANALES[canal]}`} title="Nueva idea">＋</button>
              </header>

              {delCanal.length === 0 ? (
                <button className="obj-columna-vacia" onClick={() => editor.nuevaPieza("", canal)}>
                  Sin ideas todavía.<br />＋ Apunta la primera
                </button>
              ) : (
                delCanal.map((p) => (
                  <div key={p.id} className="obj-idea">
                    <button className="obj-idea-abrir" onClick={() => editor.editarPieza(p)}>
                      <span className="obj-idea-titulo">{p.titulo}</span>
                      <span className="obj-idea-meta">
                        <span className="obj-chip"><span aria-hidden="true">{TIPO_EMOJI[p.tipo]}</span> {TIPOS[p.tipo]}</span>
                        <span className="obj-chip obj-chip--estado"><span aria-hidden="true">{ESTADO_EMOJI[p.estado]}</span> {ESTADOS[p.estado]}</span>
                      </span>
                      {p.notas && <span className="obj-idea-notas">{p.notas}</span>}
                    </button>
                    {programando === p.id ? (
                      <label className="obj-idea-programar">
                        <span>📅 ¿Qué día?</span>
                        <input type="date" className="obj-input" autoFocus onChange={(e) => programar(p, e.target.value)} />
                        <button type="button" className="obj-boton obj-boton--suave obj-boton--pequeno" onClick={() => setProgramando(null)}>✕</button>
                      </label>
                    ) : (
                      <button className="obj-idea-accion" onClick={() => setProgramando(p.id)}>📅 Ponerle día</button>
                    )}
                  </div>
                ))
              )}
            </section>
          );
        })}
      </div>

      {editor.modal}
    </>
  );
}
