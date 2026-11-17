"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Send, X } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import { aspectoDe, colorDe } from "@/components/foro/categorias";
import { pedirForo } from "@/components/foro/pedir";
import { LIMITES } from "@/lib/foro/limites";
import { sonar } from "@/lib/sonidos";

type Subida = { id: string; vista: string | null; nombre: string };

const TIPOS = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * El formulario de una pregunta, en tres pasos numerados: la categoría (una
 * ficha por cada una, con su color), la pregunta y, si hacen falta, hasta 4
 * imágenes.
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
  const duda = useRef<HTMLTextAreaElement>(null);
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
      sonar("error");
      setError(`Como mucho ${LIMITES.imagenesPorPregunta} imágenes por pregunta.`);
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
      sonar("error");
      setError(r.mensaje);
      return;
    }
    sonar("guardado");
    router.push(`/foro/${r.id}-${r.slug}`);
  }

  return (
    <form className="fp-form fq-form" onSubmit={publicar}>
      <fieldset className="fq-paso">
        <legend>
          <span className="fq-paso-num" aria-hidden="true">1</span>
          ¿De qué va?
        </legend>
        <div className="fq-fichas">
          {categorias.map((c) => {
            const { Icono } = aspectoDe(c.slug);
            return (
              <label key={c.slug} className="fq-ficha" style={colorDe(c.slug)}>
                <input
                  type="radio"
                  name="categoria"
                  value={c.slug}
                  checked={categoria === c.slug}
                  onChange={() => {
                    // Las fichas se hunden como teclas: suenan como ellas.
                    sonar("tecla");
                    setCategoria(c.slug);
                  }}
                />
                <span className="fq-ficha-icono" aria-hidden="true"><Icono size={15} strokeWidth={2.5} /></span>
                {c.nombre}
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="fq-paso">
        <legend>
          <span className="fq-paso-num" aria-hidden="true">2</span>
          Tu pregunta
        </legend>

        <label className="fp-campo">
          <span>Título <small>— la pregunta, en una frase</small></span>
          <input
            type="text"
            className="fq-titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            maxLength={LIMITES.titulo.max * 2}
            placeholder="¿Cómo declaro las recompensas de staking?"
            autoComplete="off"
            enterKeyHint="next"
            // En el móvil, la tecla «Siguiente» del teclado pasa a la duda en
            // vez de enviar el formulario a medias.
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                duda.current?.focus();
              }
            }}
            required
          />
          <span className={`fp-contador${nTitulo > LIMITES.titulo.max ? " es-malo" : ""}`}>
            {nTitulo} / {LIMITES.titulo.max} · mínimo {LIMITES.titulo.min}
          </span>
        </label>

        <label className="fp-campo">
          <span>Tu duda <small>— con el contexto que haga falta para entenderla</small></span>
          <textarea
            ref={duda}
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
      </fieldset>

      <fieldset className="fq-paso">
        <legend>
          <span className="fq-paso-num" aria-hidden="true">3</span>
          Imágenes <small>— opcional</small>
        </legend>

        <div className="fq-imagenes">
          <div className="fp-fila fp-fila--entre">
            <span className="fq-nota">
              Hasta {LIMITES.imagenesPorPregunta}. JPG, PNG o WebP de 5 MB como mucho.
            </span>
            <Tecla
              color="blanca"
              tamano="peq"
              disabled={subiendo || enviando || imagenes.length >= LIMITES.imagenesPorPregunta}
              onClick={() => archivo.current?.click()}
            >
              <ImagePlus size={16} strokeWidth={2.6} aria-hidden="true" />
              {subiendo ? "Subiendo…" : "Añadir imagen"}
            </Tecla>
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
                  <Tecla
                    color="coral"
                    tamano="peq"
                    icono
                    className="fq-quitar"
                    disabled={enviando}
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
          <p className="fq-nota">
            Antes de subir una captura, comprueba que no se ve ninguna frase semilla, clave, saldo ni dato personal.
          </p>
        </div>
      </fieldset>

      {error && <p className="fp-error" role="alert">{error}</p>}

      <div className="fq-pie fp-fila fp-fila--entre">
        <span className="fq-nota">Se publicará al momento y será visible para cualquiera.</span>
        <Tecla type="submit" color="coral" tamano="grande" disabled={!listo}>
          <Send size={18} strokeWidth={2.6} aria-hidden="true" />
          {enviando ? "Publicando…" : "Publicar pregunta"}
        </Tecla>
      </div>
    </form>
  );
}
