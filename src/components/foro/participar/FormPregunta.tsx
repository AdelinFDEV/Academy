"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { pedirForo } from "@/components/foro/pedir";
import { LIMITES } from "@/lib/foro/limites";

type Subida = { id: string; vista: string | null; nombre: string };

const TIPOS = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * El formulario de una pregunta: categoría, título, texto y hasta 4 imágenes.
 *
 * Las imágenes se suben ANTES de publicar, en dos pasos (FORO.md §6.6): el
 * servidor da una dirección de un solo uso, el navegador sube ahí el archivo
 * y el servidor lo comprueba y lo vuelve a generar. Hasta que la pregunta se
 * publica no las ve nadie más. Lo que se compruebe aquí (tipo, peso) es solo
 * para avisar antes: quien decide es el servidor.
 */
export default function FormPregunta({ categorias }: { categorias: { slug: string; nombre: string }[] }) {
  const router = useRouter();
  const archivo = useRef<HTMLInputElement>(null);
  const [categoria, setCategoria] = useState(categorias[0]?.slug ?? "");
  const [titulo, setTitulo] = useState("");
  const [cuerpo, setCuerpo] = useState("");
  const [imagenes, setImagenes] = useState<Subida[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const nTitulo = Array.from(titulo.trim()).length;
  const nCuerpo = Array.from(cuerpo.trim()).length;
  const listo =
    nTitulo >= LIMITES.titulo.min && nTitulo <= LIMITES.titulo.max &&
    nCuerpo >= LIMITES.pregunta.min && nCuerpo <= LIMITES.pregunta.max &&
    categoria !== "" && !subiendo && !enviando;

  async function subir(e: React.ChangeEvent<HTMLInputElement>) {
    const elegidos = Array.from(e.target.files ?? []);
    e.target.value = "";
    setError("");
    const hueco = LIMITES.imagenesPorPregunta - imagenes.length;
    if (elegidos.length > hueco) {
      setError(`Como mucho ${LIMITES.imagenesPorPregunta} imágenes por pregunta.`);
      return;
    }
    setSubiendo(true);
    for (const f of elegidos) {
      if (!TIPOS.includes(f.type)) {
        setError("Solo se pueden subir imágenes JPG, PNG o WebP.");
        break;
      }
      if (f.size > MAX_BYTES) {
        setError("Cada imagen puede pesar como mucho 5 MB.");
        break;
      }
      // 1 · Pedir permiso y una dirección de un solo uso.
      const permiso = await pedirForo<{ id: string; url: string }>("/api/foro/imagen/pedir", {});
      if (!permiso.ok) {
        setError(permiso.mensaje);
        break;
      }
      // 2 · Subir el archivo ahí, directo al almacén privado.
      let subida: Response;
      try {
        subida = await fetch(permiso.url, { method: "PUT", headers: { "Content-Type": f.type }, body: f });
      } catch {
        setError("No se ha podido subir la imagen. Comprueba tu conexión.");
        break;
      }
      if (!subida.ok) {
        setError("No se ha podido subir la imagen.");
        break;
      }
      // 3 · El servidor la comprueba y la vuelve a generar.
      const lista = await pedirForo<{ id: string; vista: string | null }>("/api/foro/imagen/confirmar", { id: permiso.id });
      if (!lista.ok) {
        setError(lista.mensaje);
        break;
      }
      setImagenes((antes) => [...antes, { id: lista.id, vista: lista.vista, nombre: f.name }]);
    }
    setSubiendo(false);
  }

  async function publicar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError("");
    const r = await pedirForo<{ id: number; slug: string }>("/api/foro/preguntar", {
      categoria,
      titulo,
      cuerpo,
      ...(imagenes.length ? { imagenes: imagenes.map((i) => i.id) } : {}),
    });
    if (!r.ok) {
      setEnviando(false);
      setError(r.mensaje);
      return;
    }
    router.push(`/foro/${r.id}-${r.slug}`);
  }

  return (
    <form className="fp-form fq-form" onSubmit={publicar}>
      <label className="fp-campo">
        <span>Categoría</span>
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)} required>
          {categorias.map((c) => <option key={c.slug} value={c.slug}>{c.nombre}</option>)}
        </select>
      </label>

      <label className="fp-campo">
        <span>Título <small>— la pregunta, en una frase</small></span>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          maxLength={LIMITES.titulo.max * 2}
          placeholder="¿Cómo declaro las recompensas de staking?"
          required
        />
        <span className={`fp-contador${nTitulo > LIMITES.titulo.max ? " es-malo" : ""}`}>
          {nTitulo} / {LIMITES.titulo.max} · mínimo {LIMITES.titulo.min}
        </span>
      </label>

      <label className="fp-campo">
        <span>Tu duda <small>— con el contexto que haga falta para entenderla</small></span>
        <textarea
          value={cuerpo}
          onChange={(e) => setCuerpo(e.target.value)}
          rows={10}
          maxLength={LIMITES.pregunta.max * 2}
          placeholder="Cuenta qué has hecho, qué esperabas y qué ha pasado. No publiques frases semilla, claves, teléfonos ni correos."
          required
        />
        <span className={`fp-contador${nCuerpo > LIMITES.pregunta.max ? " es-malo" : ""}`}>
          {nCuerpo} / {LIMITES.pregunta.max} · mínimo {LIMITES.pregunta.min}
        </span>
      </label>

      <div className="fq-imagenes">
        <div className="fp-fila fp-fila--entre">
          <span className="fq-imagenes-titulo">
            Imágenes <small>— opcional, hasta {LIMITES.imagenesPorPregunta}. JPG, PNG o WebP de 5 MB como mucho</small>
          </span>
          <button
            type="button"
            className="fp-btn"
            disabled={subiendo || enviando || imagenes.length >= LIMITES.imagenesPorPregunta}
            onClick={() => archivo.current?.click()}
          >
            {subiendo ? "Subiendo…" : "Añadir imagen"}
          </button>
        </div>
        <input ref={archivo} type="file" accept={TIPOS.join(",")} multiple hidden onChange={subir} />
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
                <button
                  type="button"
                  className="fp-accion"
                  disabled={enviando}
                  onClick={() => setImagenes((antes) => antes.filter((x) => x.id !== img.id))}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="fq-nota">
          Antes de subir una captura, comprueba que no se ve ninguna frase semilla, clave, saldo ni dato personal.
        </p>
      </div>

      {error && <p className="fp-error" role="alert">{error}</p>}

      <div className="fp-fila fp-fila--entre">
        <span className="fq-nota">Se publicará al momento y será visible para cualquiera.</span>
        <button type="submit" className="fp-btn fp-btn--firme" disabled={!listo}>
          {enviando ? "Publicando…" : "Publicar pregunta"}
        </button>
      </div>
    </form>
  );
}
