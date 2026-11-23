"use client";

import { useId, useRef, useState } from "react";
import { AtSign, Eye, PenLine } from "lucide-react";
import TextoBloques from "@/components/foro/TextoBloques";
import { pedirForo } from "@/components/foro/pedir";
import type { BloqueForo } from "@/lib/foro/tipos";
import { sonar } from "@/lib/sonidos";
import BarraFormato from "./BarraFormato";
import type { Subida } from "./SubirImagenes";

/**
 * El cuadro donde se escribe un mensaje del foro: pregunta, respuesta,
 * réplica o edición (23-11-2026). Una sola pieza para los cuatro, con:
 *
 *   · la barra de formato (negrita y listas);
 *   · las MENCIONES: al teclear «@» salen los alias de quienes escriben en el
 *     hilo; se elige con el dedo, con Tab o con Intro. Se puede mencionar a
 *     cualquiera escribiendo su alias entero; aquí solo se sugieren los del
 *     hilo, que ya están a la vista;
 *   · la VISTA PREVIA: la pestaña pide al servidor la misma estructura que
 *     pintará el hilo y la enseña con `TextoBloques`. Lo que se ve es lo que
 *     saldrá: negritas, listas, enlaces permitidos, menciones e imágenes.
 *
 * El texto sigue siendo texto plano en un `<textarea>`: el formato son
 * marcas, y quien decide si se publica es el servidor.
 */

/** La mención que se está tecleando justo antes del cursor, si la hay. */
function mencionEnCurso(texto: string, cursor: number): { desde: number; parte: string } | null {
  const m = /(?:^|[^A-Za-z0-9_.@/])@([A-Za-z][A-Za-z0-9_.]{0,19})?$/.exec(texto.slice(0, cursor));
  if (!m) return null;
  const parte = m[1] ?? "";
  return { desde: cursor - parte.length - 1, parte };
}

export default function EditorForo({
  valor,
  cambiar,
  etiqueta,
  etiquetaOculta = false,
  filas,
  maximo,
  placeholder,
  bloqueado = false,
  requerido = false,
  participantes = [],
  imagenes = [],
  titulo,
  campo: campoDeFuera,
}: {
  valor: string;
  cambiar: (v: string) => void;
  /** El nombre del cuadro. */
  etiqueta: React.ReactNode;
  /** Solo para lectores de pantalla (cuando ya hay un título encima). */
  etiquetaOculta?: boolean;
  filas: number;
  maximo: number;
  placeholder?: string;
  bloqueado?: boolean;
  requerido?: boolean;
  /** Alias que se sugieren al teclear «@». */
  participantes?: string[];
  /** Las imágenes ya subidas, para enseñarlas en la vista previa. */
  imagenes?: Subida[];
  /** En una pregunta: su título, para la vista previa. */
  titulo?: string;
  /** Si el formulario necesita enfocar el cuadro desde fuera. */
  campo?: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const propio = useRef<HTMLTextAreaElement>(null);
  const campo = campoDeFuera ?? propio;
  const id = useId();
  const idLista = `${id}-menciones`;

  const [vista, setVista] = useState<"escribir" | "previa">("escribir");
  const [previa, setPrevia] = useState<{ estado: "cargando" } | { estado: "lista"; bloques: BloqueForo[] } | { estado: "error"; mensaje: string }>({ estado: "cargando" });
  const [mencion, setMencion] = useState<{ desde: number; parte: string } | null>(null);
  const [activa, setActiva] = useState(0);

  // ── Menciones ──
  const sugeridos = mencion
    ? participantes
        .filter((a) => a.toLowerCase().startsWith(mencion.parte.toLowerCase()) && a.toLowerCase() !== mencion.parte.toLowerCase())
        .slice(0, 6)
    : [];
  const elegida = Math.min(activa, Math.max(0, sugeridos.length - 1));

  function mirarMencion() {
    const t = campo.current;
    if (!t || t.selectionStart !== t.selectionEnd) {
      setMencion(null);
      return;
    }
    const m = mencionEnCurso(t.value, t.selectionStart);
    setMencion(m);
    if (!m) setActiva(0);
  }

  function mencionar(alias: string) {
    const t = campo.current;
    if (!t || !mencion) return;
    const fin = t.selectionStart;
    const nuevo = `${valor.slice(0, mencion.desde)}@${alias} ${valor.slice(fin)}`;
    const cursor = mencion.desde + alias.length + 2;
    cambiar(nuevo);
    setMencion(null);
    setActiva(0);
    sonar("elegir");
    requestAnimationFrame(() => {
      t.focus();
      t.setSelectionRange(cursor, cursor);
    });
  }

  function alTeclear(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!sugeridos.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const paso = e.key === "ArrowDown" ? 1 : -1;
      setActiva((elegida + paso + sugeridos.length) % sugeridos.length);
    } else if ((e.key === "Enter" || e.key === "Tab") && !e.nativeEvent.isComposing) {
      e.preventDefault();
      mencionar(sugeridos[elegida]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setMencion(null);
    }
  }

  // ── Vista previa ──
  async function verPrevia() {
    sonar("tecla");
    setMencion(null);
    setVista("previa");
    setPrevia({ estado: "cargando" });
    if (valor.trim() === "") {
      setPrevia({ estado: "lista", bloques: [] });
      return;
    }
    const r = await pedirForo<{ bloques: BloqueForo[] }>("/api/foro/vista-previa", { cuerpo: valor });
    setPrevia(r.ok && Array.isArray(r.bloques) ? { estado: "lista", bloques: r.bloques } : { estado: "error", mensaje: r.ok ? "No se ha podido preparar la vista previa." : r.mensaje });
  }

  function escribir() {
    sonar("tecla");
    setVista("escribir");
    requestAnimationFrame(() => campo.current?.focus());
  }

  const enPrevia = vista === "previa";

  return (
    // Un div, no un label: dentro van botones, y en un label el primero de
    // ellos se quedaría con los clics del nombre.
    <div className="fp-campo fp-editor">
      <div className="fp-campo-cab">
        <label htmlFor={id} className={etiquetaOculta ? "sr-only" : undefined}>{etiqueta}</label>
        <div className="fp-editor-barra">
          {!enPrevia && <BarraFormato campo={campo} valor={valor} cambiar={cambiar} bloqueado={bloqueado} />}
          <div className="fp-pestanas" role="tablist" aria-label="Escribir o ver cómo queda">
            <button type="button" role="tab" aria-selected={!enPrevia} className={`fp-pestana${enPrevia ? "" : " is-activa"}`} onClick={escribir}>
              <PenLine size={14} strokeWidth={2.8} aria-hidden="true" /> Escribir
            </button>
            <button type="button" role="tab" aria-selected={enPrevia} className={`fp-pestana${enPrevia ? " is-activa" : ""}`} onClick={verPrevia} disabled={bloqueado}>
              <Eye size={15} strokeWidth={2.6} aria-hidden="true" /> Vista previa
            </button>
          </div>
        </div>
      </div>

      <textarea
        ref={campo}
        id={id}
        value={valor}
        onChange={(e) => { cambiar(e.target.value); requestAnimationFrame(mirarMencion); }}
        onKeyDown={alTeclear}
        onKeyUp={(e) => { if (!["ArrowDown", "ArrowUp", "Enter", "Tab", "Escape"].includes(e.key)) mirarMencion(); }}
        onClick={mirarMencion}
        onBlur={() => { /* Deja tiempo a que el toque en una sugerencia llegue. */ setTimeout(() => setMencion(null), 150); }}
        rows={filas}
        maxLength={maximo}
        placeholder={placeholder}
        // Oculto en la vista previa: un campo obligatorio que no se ve bloquearía el envío.
        required={requerido && !enPrevia}
        hidden={enPrevia}
        aria-controls={sugeridos.length ? idLista : undefined}
      />

      {!enPrevia && sugeridos.length > 0 && (
        <ul id={idLista} className="fp-menciones" role="listbox" aria-label="Mencionar a alguien del hilo">
          <li className="fp-menciones-nota" aria-hidden="true"><AtSign size={14} strokeWidth={2.8} /> mencionar a</li>
          {sugeridos.map((alias, i) => (
            <li key={alias} role="option" aria-selected={i === elegida}>
              <button
                type="button"
                className={`fp-mencion${i === elegida ? " is-activa" : ""}`}
                // En `pointerdown`, antes de que el cuadro pierda el foco.
                onPointerDown={(e) => { e.preventDefault(); mencionar(alias); }}
              >
                @{alias}
              </button>
            </li>
          ))}
        </ul>
      )}

      {enPrevia && (
        <div className="fp-previa" role="tabpanel" aria-label="Vista previa" aria-busy={previa.estado === "cargando"}>
          <p className="fp-previa-nota">así se verá</p>
          {titulo?.trim() && <p className="fp-previa-titulo">{titulo.trim()}</p>}
          {previa.estado === "cargando" && <p className="fp-previa-vacia">Preparando la vista previa…</p>}
          {previa.estado === "error" && <p className="fp-error" role="alert">{previa.mensaje}</p>}
          {previa.estado === "lista" &&
            (previa.bloques.length ? (
              <TextoBloques bloques={previa.bloques} />
            ) : (
              <p className="fp-previa-vacia">Todavía no has escrito nada.</p>
            ))}
          {imagenes.length > 0 && (
            <ul className="fp-previa-imagenes">
              {imagenes.map((img) => (
                <li key={img.id}>
                  {img.vista ? (
                    // eslint-disable-next-line @next/next/no-img-element -- vista previa firmada y temporal del almacén privado
                    <img src={img.vista} alt={`Vista previa de ${img.nombre}`} />
                  ) : (
                    <span>{img.nombre}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
