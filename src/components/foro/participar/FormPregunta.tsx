"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import { aspectoDe, colorDe } from "@/components/foro/categorias";
import { pedirForo } from "@/components/foro/pedir";
import { LIMITES } from "@/lib/foro/limites";
import { sonar } from "@/lib/sonidos";
import BarraFormato from "./BarraFormato";
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
  const idDuda = useId();
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

        {/* Un div, no un label: la barra de formato lleva botones. */}
        <div className="fp-campo">
          <span className="fp-campo-cab">
            <label htmlFor={idDuda}>Tu duda <small>— con el contexto que haga falta para entenderla</small></label>
            <BarraFormato campo={duda} valor={cuerpo} cambiar={setCuerpo} bloqueado={enviando} />
          </span>
          <textarea
            ref={duda}
            id={idDuda}
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
        </div>
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
