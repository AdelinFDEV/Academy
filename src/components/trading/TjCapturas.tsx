"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Camera, ChevronLeft, ChevronRight, ImagePlus, RefreshCw, Trash2, X } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import { sonar } from "@/lib/sonidos";
import type { Trade } from "./tjStats";
import { useSonidoVentana } from "./useSonidoVentana";
import { bloquearScroll } from "./useVentanaMovil";

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
 *
 * Estilo «Cuaderno de estudio» (17-11-2026): el hueco vacío es un recuadro de
 * trazo discontinuo donde soltar la imagen; la captura puesta, una foto
 * pegada con cinta, un poco torcida, que se hunde como una tecla al pulsarla.
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
    <svg className="djk-boceto" viewBox="0 0 280 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {[...velas, ...(tipo === "despues" ? despues : [])].map(([x, m1, c1, c2, m2, sube]) => (
        <g key={x} className={sube ? "es-sube" : "es-baja"}>
          <line x1={x} y1={m1} x2={x} y2={m2} strokeWidth="2.4" strokeLinecap="round" />
          <rect x={x - 7} y={c1} width="14" height={c2 - c1} rx="3" />
        </g>
      ))}
      <line className="es-marca" x1="150" y1="14" x2="150" y2="146" strokeWidth="2.4" strokeLinecap="round" />
      {tipo === "antes" && <path className="es-futuro" d="M162 76 C190 60 214 96 262 44" strokeWidth="2.6" strokeLinecap="round" />}
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

const aDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(String(lector.result));
    lector.onerror = () => reject(new Error("No se pudo leer la imagen"));
    lector.readAsDataURL(blob);
  });

/**
 * Reduce la captura y la pasa a WebP. Lanza con un mensaje que se puede enseñar.
 * Vale cualquier imagen que el navegador sepa abrir (17-11-2026): en el móvil la
 * foto llega de la galería o de la cámara, a veces en HEIC, y aquí se convierte;
 * el servidor la vuelve a comprobar y a recodificar.
 */
async function preparar(archivo: Blob): Promise<{ archivo: Blob; vista: string }> {
  if (archivo.type && !archivo.type.startsWith("image/")) throw new Error("Eso no es una imagen. Elige una foto o una captura.");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(archivo);
  } catch {
    throw new Error("No se pudo abrir la imagen. Prueba con una JPG, PNG o WebP.");
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

/** Una captura para la ventana de ampliar. */
interface Foto { src: string; titulo: string }

/**
 * La foto pegada con cinta: una tecla blanca (se hunde al pulsarla) con la
 * imagen y su pie escrito a mano. El giro lo pone su envoltorio, para que no
 * choque con el movimiento de la tecla.
 */
function Polaroid({ src, alt, pie, onAmpliar, perezosa }: { src: string; alt: string; pie: string; onAmpliar: () => void; perezosa?: boolean }) {
  return (
    <div className="djk-foto">
      <Tecla color="blanca" className="djk-ver" onClick={onAmpliar} aria-label={`Ampliar la captura: ${pie}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} {...(perezosa ? { loading: "lazy" as const, decoding: "async" as const } : {})} />
        <span className="djk-pie">{pie}</span>
      </Tecla>
    </div>
  );
}

function Hueco({
  tipo, src, guardada, onChange, onAmpliar,
}: {
  tipo: TipoCaptura;
  /** Lo que se enseña en el hueco: la imagen nueva o la guardada, o nada. */
  src: string | null;
  /** Hay una captura guardada en el servidor. */
  guardada: boolean;
  onChange: (p: CapturaPendiente) => void;
  onAmpliar: () => void;
}) {
  const campo = useRef<HTMLInputElement>(null);
  const id = useId();
  const [error, setError] = useState("");
  const [encima, setEncima] = useState(false);
  const { titulo, etiqueta, ayuda } = ROTULO[tipo];

  async function recibir(archivo: Blob | null | undefined) {
    if (!archivo) return;
    setError("");
    try {
      const lista = await preparar(archivo);
      onChange({ ...lista, quitar: false });
      sonar("elegir");
    } catch (err) {
      sonar("error");
      setError(err instanceof Error ? err.message : "No se pudo usar la imagen.");
    }
  }

  const imagenDe = (lista: DataTransferItemList | undefined) => {
    for (const item of Array.from(lista ?? [])) if (item.kind === "file" && item.type.startsWith("image/")) return item.getAsFile();
    return null;
  };

  return (
    <div className={`djk-hueco is-${tipo}`}>
      <div className="djk-rotulo">
        <span className={`dj-chip ${tipo === "antes" ? "dj-chip--azul" : "dj-chip--lila"}`}>{etiqueta}</span>
        <span className="djk-ayuda">{ayuda}</span>
      </div>

      <input
        ref={campo} id={id} type="file" accept="image/*" hidden
        onChange={(e) => { void recibir(e.target.files?.[0]); e.target.value = ""; }}
      />

      {src ? (
        <div className="djk-puesta">
          <Polaroid src={src} alt={`Captura: ${titulo}`} pie={titulo} onAmpliar={onAmpliar} />
          <div className="djk-acciones">
            <Tecla color="blanca" tamano="peq" className="dj-llana" onClick={() => campo.current?.click()}>
              <RefreshCw size={14} strokeWidth={2.8} aria-hidden="true" /> Cambiar
            </Tecla>
            <Tecla
              color="coral" tamano="peq" icono sonido="borrar" aria-label={`Quitar la captura: ${titulo}`} title="Quitar"
              onClick={() => onChange({ archivo: null, vista: null, quitar: guardada })}
            >
              <Trash2 size={16} strokeWidth={2.6} aria-hidden="true" />
            </Tecla>
          </div>
        </div>
      ) : (
        /* El hueco es la etiqueta del campo de archivo: pulsarlo abre el
           selector. Se puede enfocar para pegar con Ctrl+V. */
        <label
          htmlFor={id} tabIndex={0}
          className={`djk-soltar${encima ? " is-encima" : ""}`}
          aria-label={`Añadir la captura: ${titulo}`}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); campo.current?.click(); } }}
          onPaste={(e) => { const f = imagenDe(e.clipboardData?.items); if (f) { e.preventDefault(); void recibir(f); } }}
          onDragOver={(e) => { e.preventDefault(); setEncima(true); }}
          onDragLeave={() => setEncima(false)}
          onDrop={(e) => { e.preventDefault(); setEncima(false); void recibir(e.dataTransfer.files?.[0]); }}
        >
          <Boceto tipo={tipo} />
          <span className="djk-soltar-icono" aria-hidden="true"><ImagePlus size={24} strokeWidth={2.4} /></span>
          <strong>Añadir la captura</strong>
          <span className="djk-soltar-txt">
            <span className="djk-raton">Pulsa y pega con <kbd>Ctrl</kbd> + <kbd>V</kbd>, arrástrala o elige el archivo</span>
            <span className="djk-tactil">Tócalo para elegirla de tu galería o hacer una foto</span>
          </span>
          <span className="dj-nota djk-soltar-nota djk-raton" aria-hidden="true">{encima ? "¡suéltala!" : "suéltala aquí"}</span>
        </label>
      )}
      {error && (
        <div className="dj-aviso dj-aviso--error dj-aviso--peq" role="alert">
          <span className="ic" aria-hidden="true">×</span>
          <span>{error}</span>
        </div>
      )}
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
  const [ampliada, setAmpliada] = useState<number | null>(null);
  useSonidoVentana(ampliada != null);

  // Lo que enseña cada hueco: la imagen nueva, o la guardada si no se ha quitado.
  const huecos = TIPOS_CAPTURA.map((tipo) => {
    const version = capturaDe(editing, tipo);
    const guardada = editing && version ? urlCaptura(editing.id, tipo, version) : null;
    const p = pendientes[tipo];
    return { tipo, guardada, src: p.vista ?? (p.quitar ? null : guardada) };
  });
  // Solo las puestas se pueden ampliar y pasar de una a otra.
  const fotos: (Foto & { tipo: TipoCaptura })[] = huecos.flatMap((h) => (h.src ? [{ tipo: h.tipo, src: h.src, titulo: ROTULO[h.tipo].titulo }] : []));

  return (
    <fieldset className="djk">
      <legend className="djk-cab">
        <b aria-hidden="true"><Camera size={18} strokeWidth={2.6} /></b>
        <span>El gráfico, antes y después</span>
        <span className="dj-chip">Opcional</span>
      </legend>
      <p className="djk-sub">La memoria embellece las entradas. Una captura, no. Solo las ves tú.</p>
      <div className="djk-huecos">
        {huecos.map(({ tipo, guardada, src }, i) => [
          i > 0 && <span key="flecha" className="djk-flecha" aria-hidden="true"><ArrowRight size={18} strokeWidth={2.8} /></span>,
          <Hueco
            key={tipo}
            tipo={tipo}
            src={src}
            guardada={!!guardada}
            onChange={(p) => onChange({ ...pendientes, [tipo]: p })}
            onAmpliar={() => setAmpliada(Math.max(0, fotos.findIndex((f) => f.tipo === tipo)))}
          />,
        ])}
      </div>
      {ampliada != null && fotos.length > 0 && (
        <Ampliada fotos={fotos} inicio={Math.min(ampliada, fotos.length - 1)} onClose={() => setAmpliada(null)} />
      )}
    </fieldset>
  );
}

/**
 * La imagen en grande, en una ventana. Se cierra con Escape, con la tecla de
 * cerrar o pulsando fuera; con dos capturas, se pasa de una a otra con las
 * flechas (de la ventana o del teclado).
 */
function Ampliada({ fotos, inicio, onClose }: { fotos: Foto[]; inicio: number; onClose: () => void }) {
  const [i, setI] = useState(inicio);
  const n = fotos.length;
  const foto = fotos[Math.min(i, n - 1)];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
      else if (n > 1 && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
        e.stopPropagation();
        setI((x) => (x + (e.key === "ArrowRight" ? 1 : n - 1)) % n);
      }
    };
    const soltar = bloquearScroll();
    window.addEventListener("keydown", onKey, true);
    return () => {
      soltar();
      window.removeEventListener("keydown", onKey, true);
    };
  }, [onClose, n]);

  return createPortal(
    <div className="trading-journal djk-portal">
      <div className="dj-velo djk-velo" onClick={onClose}>
        <div className="dj-ventana djk-ampliada" role="dialog" aria-modal="true" aria-label={`Captura: ${foto.titulo}`} onClick={(e) => e.stopPropagation()}>
          <div className="djk-ampliada-cab">
            <div>
              <h3>{foto.titulo}</h3>
              {n > 1 && <span className="dj-etq">{i + 1} de {n}</span>}
            </div>
            <div className="djk-ampliada-teclas">
              {n > 1 && (
                <>
                  <Tecla color="blanca" tamano="peq" icono sonido="pestana" aria-label="Captura anterior" onClick={() => setI((x) => (x + n - 1) % n)}>
                    <ChevronLeft size={20} strokeWidth={2.8} aria-hidden="true" />
                  </Tecla>
                  <Tecla color="blanca" tamano="peq" icono sonido="pestana" aria-label="Captura siguiente" onClick={() => setI((x) => (x + 1) % n)}>
                    <ChevronRight size={20} strokeWidth={2.8} aria-hidden="true" />
                  </Tecla>
                </>
              )}
              <Tecla color="azul" tamano="peq" icono aria-label="Cerrar" onClick={onClose} autoFocus>
                <X size={20} strokeWidth={2.8} aria-hidden="true" />
              </Tecla>
            </div>
          </div>
          <div className="djk-ampliada-marco">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={foto.src} src={foto.src} alt={`Captura: ${foto.titulo}`} />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Las miniaturas en el detalle de una operación. No pinta nada si no hay ninguna. */
export function TjCapturasVista({ trade }: { trade: Trade }) {
  const [ampliada, setAmpliada] = useState<number | null>(null);
  useSonidoVentana(ampliada != null);
  const fotos: Foto[] = TIPOS_CAPTURA.flatMap((tipo) => {
    const version = capturaDe(trade, tipo);
    return version ? [{ src: urlCaptura(trade.id, tipo, version), titulo: ROTULO[tipo].titulo }] : [];
  });
  if (!fotos.length) return null;

  return (
    <div className="djk-vista">
      {fotos.map(({ src, titulo }, i) => (
        <Polaroid
          key={titulo} src={src} alt={`Captura de ${trade.pair}: ${titulo}`} pie={titulo} perezosa
          onAmpliar={() => setAmpliada(i)}
        />
      ))}
      {ampliada != null && <Ampliada fotos={fotos} inicio={ampliada} onClose={() => setAmpliada(null)} />}
    </div>
  );
}
