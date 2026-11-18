import Link from "next/link";
import Image from "next/image";
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
              Lo último que se ha <span className="fpo-titulo-mano">preguntado</span>
            </h2>
          </div>
          <Tecla href="/foro" color="blanca" tamano="peq" className="fpo-ver">
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
                    {/* La pegatina del «?» pensativo: solo se ve en la pregunta
                        destacada, en el ordenador (portada.css). */}
                    <span className="fpo-garabatos fpo-garabatos--duda" aria-hidden="true">
                      <i className="fpo-g fpo-g--1">?</i>
                      <i className="fpo-g fpo-g--2">¿?</i>
                      <i className="fpo-g fpo-g--3">?</i>
                      <svg className="fpo-g-bombilla" viewBox="0 0 40 52">
                        <path d="M20 4c-9 0-15.5 6.6-15.5 15 0 5.8 3 9.5 6 12.4 1.7 1.7 2.6 3.6 2.6 5.9v1.7h13.8v-1.7c0-2.3.9-4.2 2.6-5.9 3-2.9 6-6.6 6-12.4C35.5 10.6 29 4 20 4z" />
                        <path d="M14 44.5h12M15.8 49h8.4" />
                      </svg>
                      <svg className="fpo-g-camino" viewBox="0 0 120 70">
                        <path d="M4 60c18-4 22-22 38-24s16 18 34 14 14-30 40-42" />
                      </svg>
                    </span>
                    <Image src="/cuaderno/pregunta-pegatina.webp" alt="" width={225} height={300} className="fpo-pegatina" draggable={false} />
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
                      {h.respuestas === 0 ? (
                        // Sin respuestas, una invitación a mano en vez de un «0».
                        <span className="fpo-primero">¡sé el primero en responder!</span>
                      ) : (
                        <span className="fpo-respuestas">
                          <b>{h.respuestas}</b> {h.respuestas === 1 ? "respuesta" : "respuestas"}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>

          {/* La invitación: lo que llena el bloque y le da un porqué. */}
          <aside className="fpo-invita" aria-label="Participa en el foro">
            {/* Una pegatina del cuaderno (18-11-2026; antes, una conversación de
                rayas en bucle): una burbuja que levanta la mano para preguntar y
                otra, detrás, que sonríe dispuesta a contestar. */}
            <div className="fpo-mano">
              <span className="fpo-garabatos fpo-garabatos--charla" aria-hidden="true">
                <svg className="fpo-g-bocadillo fpo-g-bocadillo--1" viewBox="0 0 60 46">
                  <path d="M8 5h44c3 0 5 2 5 5v18c0 3-2 5-5 5H26l-12 9 2-9H8c-3 0-5-2-5-5V10c0-3 2-5 5-5z" />
                </svg>
                <svg className="fpo-g-bocadillo fpo-g-bocadillo--2" viewBox="0 0 60 46">
                  <path d="M52 5H8c-3 0-5 2-5 5v18c0 3 2 5 5 5h26l12 9-2-9h8c3 0 5-2 5-5V10c0-3-2-5-5-5z" />
                </svg>
                <i className="fpo-g fpo-g--4">…</i>
                <i className="fpo-g fpo-g--5">!</i>
                <i className="fpo-g fpo-g--6">✦</i>
                <i className="fpo-g fpo-g--7">✦</i>
              </span>
              <Image src="/cuaderno/burbujas-pegatina.webp" alt="" width={360} height={339} className="fpo-mano-img" draggable={false} />
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
                <span className="fpo-invita-trofeo" aria-hidden="true">
                  <Trophy size={15} strokeWidth={2.4} />
                </span>
                Ver el ranking
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
