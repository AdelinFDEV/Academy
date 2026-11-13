"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Camera, ImagePlus, Trash2, X } from "lucide-react";
import type { Trade } from "./tjStats";

/**
 * Las capturas de una operación: el gráfico antes de entrar y después de
 * cerrar (13-11-2026). Opcionales las dos.
 *
 *   · `TjCapturasCampo`: los dos huecos del formulario. Se puede elegir un
 *     archivo, arrastrarlo o pegarlo con Ctrl+V.
 *   · `TjCapturasVista`: las miniaturas en el detalle de una operación, que se
 *     amplían al pulsarlas.
 *
 * Las imágenes se piden a `/api/trades/captura`, nunca a Storage: el bucket es
 * privado. Antes de subirla, el navegador reduce la captura (lado mayor de
 * 1.920 px, WebP): una captura de pantalla 4K pesa más de lo que admite el
 * servidor y no hace falta tanta resolución para leer un gráfico.
 */

export const TIPOS_CAPTURA = ["antes", "despues"] as const;
export type TipoCaptura = (typeof TIPOS_CAPTURA)[number];

const ROTULO: Record<TipoCaptura, { titulo: string; etiqueta: string; ayuda: string }> = {
  antes: { titulo: "Antes de entrar", etiqueta: "Antes", ayuda: "Lo que veías al pulsar el botón" },
  despues: { titulo: "Después de cerrar", etiqueta: "Después", ayuda: "Cómo acabó de verdad" },
};

/**
 * El boceto de fondo de cada hueco vacío: unas velas dibujadas que cuentan qué
 * captura va ahí. «Antes»: el precio llega a tu entrada y lo que viene es una
 * incógnita. «Después»: la misma entrada, y ya se ve lo que pasó.
 */
function Boceto({ tipo }: { tipo: TipoCaptura }) {
  // [x, mecha arriba, cuerpo arriba, cuerpo abajo, mecha abajo, sube]
  const velas: [number, number, number, number, number, boolean][] = [
    [22, 96, 104, 126, 134, false], [48, 88, 96, 118, 124, true], [74, 80, 90, 108, 116, true],
    [100, 86, 92, 112, 120, false], [126, 70, 78, 98, 104, true],
  ];
  const despues: typeof velas = [
    [176, 58, 64, 84, 90, true], [202, 44, 52, 72, 80, true], [228, 50, 56, 70, 76, false], [254, 30, 38, 60, 66, true],
  ];
  return (
    <svg className="tjk-boceto" viewBox="0 0 280 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {[...velas, ...(tipo === "despues" ? despues : [])].map(([x, m1, c1, c2, m2, sube]) => (
        <g key={x} className={sube ? "es-sube" : "es-baja"}>
          <line x1={x} y1={m1} x2={x} y2={m2} strokeWidth="2" />
          <rect x={x - 7} y={c1} width="14" height={c2 - c1} rx="2" />
        </g>
      ))}
      <line className="es-marca" x1="150" y1="14" x2="150" y2="146" strokeWidth="2" />
      {tipo === "antes" && <path className="es-futuro" d="M162 76 C190 60 214 96 262 44" strokeWidth="2.4" />}
    </svg>
  );
}

const COLUMNA: Record<TipoCaptura, "captura_antes" | "captura_despues"> = { antes: "captura_antes", despues: "captura_despues" };

/** Cuándo se subió la captura de una operación (sirve de versión), o null. */
export const capturaDe = (t: Trade | null, tipo: TipoCaptura): string | null => t?.[COLUMNA[tipo]] ?? null;

export const urlCaptura = (tradeId: string, tipo: TipoCaptura, version: string) =>
  `/api/trades/captura?id=${tradeId}&tipo=${tipo}&v=${encodeURIComponent(version)}`;

/** Lo que el formulario sabe de cada hueco mientras no se ha guardado. */
export interface CapturaPendiente {
  /** Imagen nueva, ya reducida, lista para subir. */
  archivo: Blob | null;
  /** La misma imagen como `data:`, para enseñarla sin subirla. */
  vista: string | null;
  /** Había una guardada y el usuario la ha quitado. */
  quitar: boolean;
}
export type CapturasPendientes = Record<TipoCaptura, CapturaPendiente>;
export const SIN_CAPTURAS: CapturasPendientes = {
  antes: { archivo: null, vista: null, quitar: false },
  despues: { archivo: null, vista: null, quitar: false },
};

const LADO_MAXIMO = 1920;
const FORMATOS = ["image/png", "image/jpeg", "image/webp"];

const aDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(String(lector.result));
    lector.onerror = () => reject(new Error("No se pudo leer la imagen"));
    lector.readAsDataURL(blob);
  });

/** Reduce la captura y la pasa a WebP. Lanza con un mensaje que se puede enseñar. */
async function preparar(archivo: Blob): Promise<{ archivo: Blob; vista: string }> {
  if (!FORMATOS.includes(archivo.type)) throw new Error("Solo se pueden subir imágenes JPG, PNG o WebP.");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(archivo);
  } catch {
    throw new Error("No se pudo abrir la imagen.");
  }
  const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.round(bitmap.width * escala);
  lienzo.height = Math.round(bitmap.height * escala);
  lienzo.getContext("2d")?.drawImage(bitmap, 0, 0, lienzo.width, lienzo.height);
  bitmap.close();
  const reducida = await new Promise<Blob | null>((resolve) => lienzo.toBlob(resolve, "image/webp", 0.86));
  if (!reducida) throw new Error("No se pudo preparar la imagen.");
  return { archivo: reducida, vista: await aDataUrl(reducida) };
}

function Hueco({
  tipo, guardada, pendiente, onChange, onAmpliar,
}: {
  tipo: TipoCaptura;
  /** Dirección de la captura ya guardada en el servidor, si la hay. */
  guardada: string | null;
  pendiente: CapturaPendiente;
  onChange: (p: CapturaPendiente) => void;
  onAmpliar: (src: string, titulo: string) => void;
}) {
  const campo = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [encima, setEncima] = useState(false);
  const { titulo, etiqueta, ayuda } = ROTULO[tipo];
  const src = pendiente.vista ?? (pendiente.quitar ? null : guardada);

  async function recibir(archivo: Blob | null | undefined) {
    if (!archivo) return;
    setError("");
    try {
      const lista = await preparar(archivo);
      onChange({ ...lista, quitar: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo usar la imagen.");
    }
  }

  const imagenDe = (lista: DataTransferItemList | undefined) => {
    for (const item of Array.from(lista ?? [])) if (item.kind === "file" && item.type.startsWith("image/")) return item.getAsFile();
    return null;
  };

  return (
    <div className={`tjk-hueco is-${tipo}`}>
      <div className="tjk-rotulo">
        <span className="tjk-etiqueta">{etiqueta}</span>
        <span className="tjk-ayuda">{ayuda}</span>
      </div>

      <input
        ref={campo} type="file" accept={FORMATOS.join(",")} hidden
        onChange={(e) => { void recibir(e.target.files?.[0]); e.target.value = ""; }}
      />

      {src ? (
        <div className="tjk-imagen">
          <button type="button" className="tjk-ver" onClick={() => onAmpliar(src, titulo)} aria-label={`Ampliar la captura: ${titulo}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`Captura: ${titulo}`} />
          </button>
          <div className="tjk-acciones">
            <button type="button" className="tj-btn" onClick={() => campo.current?.click()}>Cambiar</button>
            <button
              type="button" className="tj-icon-btn tone-loss" aria-label={`Quitar la captura: ${titulo}`} title="Quitar"
              onClick={() => onChange({ archivo: null, vista: null, quitar: !!guardada })}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button" className={`tjk-soltar${encima ? " is-encima" : ""}`}
          onClick={() => campo.current?.click()}
          onPaste={(e) => { const f = imagenDe(e.clipboardData?.items); if (f) { e.preventDefault(); void recibir(f); } }}
          onDragOver={(e) => { e.preventDefault(); setEncima(true); }}
          onDragLeave={() => setEncima(false)}
          onDrop={(e) => { e.preventDefault(); setEncima(false); void recibir(e.dataTransfer.files?.[0]); }}
        >
          <Boceto tipo={tipo} />
          <span className="tjk-soltar-icono" aria-hidden="true"><ImagePlus size={22} /></span>
          <strong>Añadir la captura</strong>
          <span>Pulsa y pega con <kbd>Ctrl</kbd> + <kbd>V</kbd>, arrástrala o elige el archivo</span>
        </button>
      )}
      {error && <p className="auth-error">{error}</p>}
    </div>
  );
}

/** Los dos huecos del formulario de una operación. */
export function TjCapturasCampo({
  editing, pendientes, onChange,
}: {
  editing: Trade | null;
  pendientes: CapturasPendientes;
  onChange: (p: CapturasPendientes) => void;
}) {
  const [ampliada, setAmpliada] = useState<{ src: string; titulo: string } | null>(null);
  return (
    <div className="tjk">
      <div className="tjk-cab">
        <span className="tjk-cab-icono" aria-hidden="true"><Camera size={18} /></span>
        <div>
          <span className="tjk-titulo">El gráfico, antes y después</span>
          <span className="tjk-sub">La memoria embellece las entradas. Una captura, no. Solo las ves tú.</span>
        </div>
        <span className="tjk-opcional">Opcional</span>
      </div>
      <div className="tjk-huecos">
        {TIPOS_CAPTURA.map((tipo, i) => {
          const version = capturaDe(editing, tipo);
          return [
            i > 0 && <span key="flecha" className="tjk-flecha" aria-hidden="true"><ArrowRight size={16} /></span>,
            <Hueco
              key={tipo}
              tipo={tipo}
              guardada={editing && version ? urlCaptura(editing.id, tipo, version) : null}
              pendiente={pendientes[tipo]}
              onChange={(p) => onChange({ ...pendientes, [tipo]: p })}
              onAmpliar={(src, titulo) => setAmpliada({ src, titulo })}
            />,
          ];
        })}
      </div>
      {ampliada && <Ampliada {...ampliada} onClose={() => setAmpliada(null)} />}
    </div>
  );
}

/** La imagen a pantalla completa. Se cierra con Escape, con la X o pulsando fuera. */
function Ampliada({ src, titulo, onClose }: { src: string; titulo: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } };
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.body.style.overflow = antes;
      window.removeEventListener("keydown", onKey, true);
    };
  }, [onClose]);

  return createPortal(
    <div className="tjk-velo" role="dialog" aria-modal="true" aria-label={`Captura: ${titulo}`} onClick={onClose}>
      <div className="tjk-velo-cab" onClick={(e) => e.stopPropagation()}>
        <span>{titulo}</span>
        <button type="button" className="tj-icon-btn" onClick={onClose} aria-label="Cerrar" autoFocus><X size={18} /></button>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`Captura: ${titulo}`} onClick={(e) => e.stopPropagation()} />
    </div>,
    document.body,
  );
}

/** Las miniaturas en el detalle de una operación. No pinta nada si no hay ninguna. */
export function TjCapturasVista({ trade }: { trade: Trade }) {
  const [ampliada, setAmpliada] = useState<{ src: string; titulo: string } | null>(null);
  const hay = TIPOS_CAPTURA.filter((tipo) => capturaDe(trade, tipo));
  if (!hay.length) return null;

  return (
    <div className="tjk-vista">
      {hay.map((tipo) => {
        const src = urlCaptura(trade.id, tipo, capturaDe(trade, tipo)!);
        const { titulo } = ROTULO[tipo];
        return (
          <figure key={tipo}>
            <button type="button" className="tjk-ver" onClick={() => setAmpliada({ src, titulo })} aria-label={`Ampliar la captura: ${titulo}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Captura de ${trade.pair}: ${titulo}`} loading="lazy" decoding="async" />
            </button>
            <figcaption>{titulo}</figcaption>
          </figure>
        );
      })}
      {ampliada && <Ampliada {...ampliada} onClose={() => setAmpliada(null)} />}
    </div>
  );
}
