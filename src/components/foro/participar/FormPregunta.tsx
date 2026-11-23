"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import { aspectoDe, colorDe } from "@/components/foro/categorias";
import CategoriasMovil from "@/components/foro/CategoriasMovil";
import { pedirForo } from "@/components/foro/pedir";
import { LIMITES } from "@/lib/foro/limites";
import { sonar } from "@/lib/sonidos";
import EditorForo from "./EditorForo";
import PreguntasParecidas from "./PreguntasParecidas";
import SubirImagenes, { type Subida } from "./SubirImagenes";

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
        {/* En el móvil, la categoría se elige en la misma ventana que en el
            listado del foro (23-11-2026); en el ordenador, las fichas. */}
        <div className="fq-cat-movil">
          <CategoriasMovil
            etiqueta="Categoría de tu pregunta"
            nota="¿de qué va tu pregunta?"
            elegir={(slug) => { if (slug) setCategoria(slug); }}
            categorias={categorias.map((c) => {
              const { Icono } = aspectoDe(c.slug);
              return {
                slug: c.slug,
                nombre: c.nombre,
                activa: c.slug === categoria,
                estilo: colorDe(c.slug),
                icono: <Icono size={18} strokeWidth={2.5} />,
              };
            })}
          />
        </div>
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

        {/* Las que ya hay y se parecen a lo que está escribiendo. */}
        <PreguntasParecidas titulo={titulo} />

        <EditorForo
          campo={duda}
          valor={cuerpo}
          cambiar={setCuerpo}
          etiqueta={<>Tu duda <small>— con el contexto que haga falta para entenderla</small></>}
          filas={10}
          maximo={LIMITES.pregunta.max * 2}
          placeholder="Cuenta qué has hecho, qué esperabas y qué ha pasado. No publiques frases semilla, claves, teléfonos ni correos."
          bloqueado={enviando}
          requerido
          imagenes={imagenes}
          titulo={titulo}
        />
        <span className={`fp-contador${nCuerpo > LIMITES.pregunta.max ? " es-malo" : ""}`}>
          {nCuerpo} / {LIMITES.pregunta.max} · mínimo {LIMITES.pregunta.min}
        </span>
      </fieldset>

      <fieldset className="fq-paso">
        <legend>
          <span className="fq-paso-num" aria-hidden="true">3</span>
          Imágenes <small>— opcional</small>
        </legend>

        <div className="fq-imagenes">
          <SubirImagenes
            max={LIMITES.imagenesPorPregunta}
            imagenes={imagenes}
            setImagenes={setImagenes}
            subiendo={subiendo}
            setSubiendo={setSubiendo}
            setError={setError}
            bloqueado={enviando}
            nota={<>Hasta {LIMITES.imagenesPorPregunta}. JPG, PNG o WebP de 5 MB como mucho.</>}
          />
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
