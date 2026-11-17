import Link from "next/link";
import { ArrowRight, Check, PenLine, Trophy } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import Firma from "@/components/foro/Firma";
import { aspectoDe, colorDe } from "@/components/foro/categorias";
import { ultimosHilos } from "@/lib/foro/datos/hilos";
import { foroALaVista } from "@/lib/foro/permisos";
import type { HiloEnListado } from "@/lib/foro/tipos";
// foro.css, por la firma (`Firma`); portada.css, todo lo demás de este bloque.
import "@/app/foro/foro.css";
import "@/app/foro/portada.css";

/**
 * Las últimas preguntas del foro, en la portada de la web, justo debajo de
 * las guías (pedido por el admin el 12-11-2026). Desde el 13-11-2026 van a la
 * izquierda, y a la derecha una invitación a preguntar: con una sola pregunta
 * el bloque se quedaba medio vacío.
 *
 * Solo sale para quien puede entrar al foro —todos cuando esté abierto, solo
 * el admin mientras está cerrado— y solo si hay algo que enseñar: sin
 * preguntas, la portada no lleva un bloque vacío. Si la lectura falla, el
 * bloque no sale y la portada sigue entera.
 *
 * Es contenido público, el mismo para todos: aquí no hay nada personal.
 */
export default async function ForoEnPortada({ conSesion }: { conSesion: boolean }) {
  if (!(await foroALaVista(conSesion))) return null;
  const hilos = await ultimosHilos(3).catch(() => []);
  if (hilos.length === 0) return null;
  return <BloqueForoEnPortada hilos={hilos} />;
}

/**
 * El bloque, ya con sus preguntas. Estilo «Cuaderno de estudio» (17-11-2026),
 * en el coral del foro. De `foro.css` solo se aprovecha la firma (`Firma`,
 * clases `fo-firma*`), que se recolorea para el papel claro en `portada.css`:
 * la tarjeta, la etiqueta de categoría y el sello son propios de este bloque.
 */
export function BloqueForoEnPortada({ hilos }: { hilos: HiloEnListado[] }) {
  return (
    <section className="fpo" aria-labelledby="fpo-titulo">
      <div className="fpo-inner">
        <header className="fpo-cabecera">
          <div>
            <p className="fpo-nota">Foro de la comunidad</p>
            <h2 id="fpo-titulo" className="fpo-titulo">
              Lo último que se ha <span className="fluor">preguntado</span>
            </h2>
          </div>
          <Tecla href="/foro" color="blanca" tamano="peq">
            Ver el foro <ArrowRight size={16} strokeWidth={2.8} aria-hidden="true" />
          </Tecla>
        </header>

        <div className="fpo-cuerpo">
          <ol className={`fpo-lista${hilos.length === 1 ? " fpo-lista--una" : ""}`}>
            {hilos.map((h) => {
              const { Icono } = aspectoDe(h.categoria.slug);
              return (
                <li key={h.id} style={colorDe(h.categoria.slug)}>
                  <Link href={`/foro/${h.id}-${h.slug}`} className={`fpo-hilo${h.resuelto ? " is-resuelto" : ""}`}>
                    <span className="fpo-meta">
                      <span className="fpo-cat">
                        <Icono size={13} strokeWidth={2.6} aria-hidden="true" />
                        {h.categoria.nombre}
                      </span>
                      {h.resuelto && (
                        <span className="fpo-resuelta">
                          <Check size={12} strokeWidth={3.4} aria-hidden="true" /> Resuelta
                        </span>
                      )}
                    </span>
                    <span className="fpo-pregunta">{h.titulo}</span>
                    {h.extracto && <span className="fpo-extracto">{h.extracto}</span>}
                    <span className="fpo-pie">
                      <Firma autor={h.autor} fecha={h.fecha} compacta />
                      <span className="fpo-respuestas">
                        <b>{h.respuestas}</b> {h.respuestas === 1 ? "respuesta" : "respuestas"}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>

          {/* La invitación: lo que llena el bloque y le da un porqué. */}
          <aside className="fpo-invita" aria-label="Participa en el foro">
            {/* Una conversación dibujada, en bucle: llega una pregunta, alguien
                escribe y llega la respuesta. Son rayas, no texto: es un adorno y
                no pone en boca de nadie algo que no ha dicho. */}
            <div className="fpo-chat" aria-hidden="true">
              <div className="fpo-burbuja fpo-burbuja--a">
                <i className="fpo-chat-cara" />
                <span><b /><b /></span>
              </div>
              <div className="fpo-burbuja fpo-burbuja--b">
                <span><b /><b /><b /></span>
                <i className="fpo-chat-cara fpo-chat-cara--b" />
              </div>
              <div className="fpo-burbuja fpo-burbuja--c">
                <i className="fpo-chat-cara fpo-chat-cara--c" />
                <span className="fpo-escribiendo"><em /><em /><em /></span>
              </div>
            </div>

            <p className="fpo-invita-titulo">¿Se te ha quedado una duda?</p>
            <p className="fpo-invita-texto">
              El foro es el sitio para preguntar lo que no te haya quedado claro de una guía o de un curso, y para
              ayudar a quien viene detrás.
            </p>
            <div className="fpo-invita-acciones">
              <Tecla href="/foro/preguntar" color="coral">
                <PenLine size={17} strokeWidth={2.6} aria-hidden="true" /> Hacer una pregunta
              </Tecla>
              <Link href="/foro/ranking" className="fpo-invita-enlace">
                <Trophy size={15} strokeWidth={2.4} aria-hidden="true" /> Ver el ranking
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
