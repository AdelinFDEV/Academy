"use client";

import { useMemo, useState } from "react";
import { motion, LayoutGroup } from "framer-motion";
import { Check, X, RotateCcw } from "lucide-react";
import { Marco, barajarFijo } from "./comun";

/**
 * Minijuego de clasificar: cada tarjeta va a su grupo. Se juega con dos
 * toques —tarjeta y luego grupo—, que funciona igual con el dedo que con el
 * ratón; arrastrar en un móvil es más torpe y peor para la accesibilidad.
 *
 * datos: {
 *   titulo, instrucciones?,
 *   grupos: [{ id: "ahorro", nombre: "Base del ahorro" }, …],
 *   elementos: [{ texto: "Vender BTC por euros", grupo: "ahorro", explicacion? }, …]
 * }
 */

export interface DatosClasificar {
  titulo: string;
  instrucciones?: string;
  grupos: { id: string; nombre: string }[];
  elementos: { texto: string; grupo: string; explicacion?: string }[];
}

export function validarClasificar(d: unknown): d is DatosClasificar {
  const x = d as DatosClasificar;
  if (!x || !Array.isArray(x.grupos) || !Array.isArray(x.elementos) || x.grupos.length < 2) return false;
  const ids = new Set(x.grupos.map((g) => g.id));
  return x.elementos.length > 0 && x.elementos.every((e) => typeof e.texto === "string" && ids.has(e.grupo));
}

export default function Clasificar({ datos }: { datos: DatosClasificar }) {
  const elementos = useMemo(
    () => barajarFijo(datos.elementos.map((e, i) => ({ ...e, i })), datos.titulo),
    [datos],
  );
  const [colocados, setColocados] = useState<Record<number, string>>({});
  const [elegido, setElegido] = useState<number | null>(null);
  const [comprobado, setComprobado] = useState(false);

  const pendientes = elementos.filter((e) => colocados[e.i] === undefined);
  const aciertos = elementos.filter((e) => colocados[e.i] === e.grupo).length;

  function colocar(grupo: string) {
    if (elegido === null || comprobado) return;
    setColocados((c) => ({ ...c, [elegido]: grupo }));
    setElegido(null);
  }

  function devolver(i: number) {
    if (comprobado) return;
    setColocados((c) => {
      const copia = { ...c };
      delete copia[i];
      return copia;
    });
  }

  function reiniciar() {
    setColocados({});
    setElegido(null);
    setComprobado(false);
  }

  return (
    <Marco clase="juego" titulo={datos.titulo} subtitulo={datos.instrucciones ?? "Toca una tarjeta y después el grupo al que pertenece."}>
      <LayoutGroup>
        <div className="aula-clas-mazo" aria-label="Tarjetas por colocar">
          {pendientes.length === 0 && !comprobado && (
            <p className="aula-clas-vacio">Todas colocadas. Comprueba si aciertas.</p>
          )}
          {pendientes.map((e) => (
            <motion.button
              layout
              layoutId={`clas-${datos.titulo}-${e.i}`}
              key={e.i}
              type="button"
              className={`aula-clas-carta${elegido === e.i ? " is-elegida" : ""}`}
              onClick={() => setElegido(elegido === e.i ? null : e.i)}
              aria-pressed={elegido === e.i}
            >
              {e.texto}
            </motion.button>
          ))}
        </div>

        <div className="aula-clas-grupos" style={{ "--grupos": datos.grupos.length } as React.CSSProperties}>
          {datos.grupos.map((g) => (
            <div
              key={g.id}
              className={`aula-clas-grupo${elegido !== null ? " is-destino" : ""}`}
              onClick={() => colocar(g.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(ev) => (ev.key === "Enter" || ev.key === " ") && colocar(g.id)}
              aria-label={`Colocar en ${g.nombre}`}
            >
              <span className="aula-clas-grupo-nombre">{g.nombre}</span>
              <div className="aula-clas-grupo-cartas">
                {elementos
                  .filter((e) => colocados[e.i] === g.id)
                  .map((e) => {
                    const bien = e.grupo === g.id;
                    return (
                      <motion.button
                        layout
                        layoutId={`clas-${datos.titulo}-${e.i}`}
                        key={e.i}
                        type="button"
                        className={`aula-clas-carta is-colocada${comprobado ? (bien ? " is-buena" : " is-mala") : ""}`}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          devolver(e.i);
                        }}
                        title={comprobado && !bien && e.explicacion ? e.explicacion : undefined}
                      >
                        {comprobado && (bien ? <Check size={13} strokeWidth={3} aria-hidden="true" /> : <X size={13} strokeWidth={3} aria-hidden="true" />)}
                        {e.texto}
                      </motion.button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </LayoutGroup>

      {comprobado && (
        <div className={`aula-feedback ${aciertos === elementos.length ? "is-buena" : "is-mala"}`}>
          <strong>{aciertos} de {elementos.length} en su sitio.</strong>{" "}
          {aciertos === elementos.length ? "Perfecto." : "Las rojas están en el grupo equivocado."}
          {elementos.filter((e) => colocados[e.i] !== e.grupo && e.explicacion).length > 0 && (
            <ul className="aula-feedback-lista">
              {elementos
                .filter((e) => colocados[e.i] !== e.grupo && e.explicacion)
                .map((e) => (
                  <li key={e.i}><strong>{e.texto}:</strong> {e.explicacion}</li>
                ))}
            </ul>
          )}
        </div>
      )}

      <div className="aula-bloque-acciones">
        {!comprobado ? (
          <button type="button" className="aula-btn" disabled={pendientes.length > 0} onClick={() => setComprobado(true)}>
            Comprobar
          </button>
        ) : (
          <button type="button" className="aula-btn aula-btn--ghost" onClick={reiniciar}>
            <RotateCcw size={14} aria-hidden="true" /> Otra vez
          </button>
        )}
      </div>
    </Marco>
  );
}
