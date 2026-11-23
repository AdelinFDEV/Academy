"use client";

import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import { pedirForo } from "@/components/foro/pedir";
import { sonar } from "@/lib/sonidos";

export type Subida = { id: string; vista: string | null; nombre: string };

const TIPOS = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Añadir imágenes a un mensaje del foro (pregunta, respuesta o réplica).
 *
 * Se suben ANTES de publicar, en dos pasos (FORO.md §6.6): el servidor da una
 * dirección de un solo uso, el navegador sube ahí el archivo y el servidor lo
 * comprueba y lo vuelve a generar. Hasta que el mensaje se publica no las ve
 * nadie más. Lo que se compruebe aquí (tipo, peso, cuántas) es solo para
 * avisar antes: quien decide es el servidor.
 *
 * El estado vive en el formulario (`imagenes`, `subiendo`): este componente
 * pinta el botón, el selector oculto y las miniaturas con su «quitar».
 */
export default function SubirImagenes({
  max,
  imagenes,
  setImagenes,
  subiendo,
  setSubiendo,
  setError,
  bloqueado = false,
  nota,
}: {
  max: number;
  imagenes: Subida[];
  setImagenes: React.Dispatch<React.SetStateAction<Subida[]>>;
  subiendo: boolean;
  setSubiendo: (v: boolean) => void;
  setError: (m: string) => void;
  /** Mientras se publica: nada se toca. */
  bloqueado?: boolean;
  /** Texto pequeño junto al botón. */
  nota?: React.ReactNode;
}) {
  const archivo = useRef<HTMLInputElement>(null);

  async function subir(e: React.ChangeEvent<HTMLInputElement>) {
    const elegidos = Array.from(e.target.files ?? []);
    e.target.value = "";
    setError("");
    if (elegidos.length > max - imagenes.length) {
      sonar("error");
      setError(max === 1 ? "Solo se puede añadir una imagen." : `Como mucho ${max} imágenes.`);
      return;
    }
    setSubiendo(true);
    let subidas = 0;
    let fallo = "";
    for (const f of elegidos) {
      if (!TIPOS.includes(f.type)) {
        fallo = "Solo se pueden subir imágenes JPG, PNG o WebP.";
        break;
      }
      if (f.size > MAX_BYTES) {
        fallo = "Cada imagen puede pesar como mucho 5 MB.";
        break;
      }
      // 1 · Pedir permiso y una dirección de un solo uso.
      const permiso = await pedirForo<{ id: string; url: string }>("/api/foro/imagen/pedir", {});
      if (!permiso.ok) {
        fallo = permiso.mensaje;
        break;
      }
      // 2 · Subir el archivo ahí, directo al almacén privado.
      let subida: Response;
      try {
        subida = await fetch(permiso.url, { method: "PUT", headers: { "Content-Type": f.type }, body: f });
      } catch {
        fallo = "No se ha podido subir la imagen. Comprueba tu conexión.";
        break;
      }
      if (!subida.ok) {
        fallo = "No se ha podido subir la imagen.";
        break;
      }
      // 3 · El servidor la comprueba y la vuelve a generar.
      const lista = await pedirForo<{ id: string; vista: string | null }>("/api/foro/imagen/confirmar", { id: permiso.id });
      if (!lista.ok) {
        fallo = lista.mensaje;
        break;
      }
      setImagenes((antes) => [...antes, { id: lista.id, vista: lista.vista, nombre: f.name }]);
      subidas++;
    }
    // Un solo sonido por tanda: el error si algo falló, si no el de guardado.
    if (fallo) {
      sonar("error");
      setError(fallo);
    } else if (subidas > 0) {
      sonar("guardado");
    }
    setSubiendo(false);
  }

  return (
    <div className="fp-imagenes">
      <div className="fp-fila fp-fila--entre">
        {nota && <span className="fq-nota">{nota}</span>}
        <Tecla
          color="amarillo"
          tamano="peq"
          className="fp-imagenes-boton"
          disabled={subiendo || bloqueado || imagenes.length >= max}
          onClick={() => archivo.current?.click()}
        >
          <span className="fp-imagenes-icono" aria-hidden="true"><ImagePlus size={16} strokeWidth={2.6} /></span>
          {subiendo ? "Subiendo…" : imagenes.length ? `Añadir otra (${imagenes.length}/${max})` : "Añadir imagen"}
        </Tecla>
      </div>
      <input ref={archivo} type="file" accept={TIPOS.join(",")} multiple={max > 1} hidden onChange={subir} />
      {imagenes.length > 0 && (
        <ul className="fq-miniaturas">
          {imagenes.map((img) => (
            <li key={img.id}>
              {img.vista ? (
                // eslint-disable-next-line @next/next/no-img-element -- vista previa firmada y temporal del almacén privado
                <img src={img.vista} alt={`Vista previa de ${img.nombre}`} />
              ) : (
                <span className="fq-sin-vista">{img.nombre}</span>
              )}
              <Tecla
                color="coral"
                tamano="peq"
                icono
                className="fq-quitar"
                disabled={bloqueado}
                aria-label={`Quitar ${img.nombre}`}
                onClick={() => {
                  sonar("cerrar");
                  setImagenes((antes) => antes.filter((x) => x.id !== img.id));
                }}
              >
                <X size={18} strokeWidth={3} aria-hidden="true" />
              </Tecla>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
