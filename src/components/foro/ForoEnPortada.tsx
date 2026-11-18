import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, HandHelping, MessageCircleQuestionMark, PenLine, Trophy } from "lucide-react";
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
      {/* Un tachón de rotulador coral encima de los botones, que cruza el
          borde de la hoja y se va hasta el borde de la web, con una
          estrellita donde empieza. Solo en el ordenador (portada.css;
          18-11-2026, pedido por el admin). */}
      <svg className="fpo-tachon" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true">
        <path d="M6 38C30 18 44 52 70 34s34-26 54-6 32 22 54 0 36-20 56 2 34 18 54-2 40-16 62-6 30 8 44 4" />
      </svg>
      <svg className="fpo-tachon-estrella" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.5l2.2 6.6 6.8.2-5.4 4.2 2 6.6L12 16.2l-5.6 3.9 2-6.6L3 9.3l6.8-.2z" />
      </svg>
      <div className="fpo-inner">
        <header className="fpo-cabecera">
          {/* El título invita a participar (18-11-2026, pedido por el admin):
              antes decía «Lo último que se ha preguntado», que solo describía.
              Debajo, los tres gestos del foro en tres pasos: preguntar,
              responder y, con lo que ayudas, subir en el ranking del mes (que
              cuenta respuestas elegidas y gracias: foro/ranking). */}
          <div className="fpo-cabecera-texto">
            <p className="fpo-nota">Foro de la comunidad</p>
            <h2 id="fpo-titulo" className="fpo-titulo">
              Aquí nadie se queda <span className="fpo-titulo-mano">con la duda</span>
            </h2>
            <p className="fpo-lead">
              Pregunta lo que no te haya quedado claro, echa una mano a quien empieza y sube en el ranking del mes.
            </p>
            <ol className="fpo-pasos" aria-label="Cómo se participa en el foro">
              <li className="fpo-paso fpo-paso--pregunta">
                <MessageCircleQuestionMark size={15} strokeWidth={2.6} aria-hidden="true" /> Pregunta
              </li>
              {/* Las rayitas a mano que unen un paso con el siguiente. */}
              <li className="fpo-raya" aria-hidden="true" />
              <li className="fpo-paso fpo-paso--responde">
                <HandHelping size={15} strokeWidth={2.6} aria-hidden="true" /> Ayuda
              </li>
              <li className="fpo-raya" aria-hidden="true" />
              <li className="fpo-paso fpo-paso--ranking">
                <Trophy size={15} strokeWidth={2.6} aria-hidden="true" /> <span className="fpo-paso-largo">Sube en el ranking</span><span className="fpo-paso-corto">Ranking</span>
              </li>
            </ol>
          </div>
          {/* «Ver el ranking», al lado de «Ver el foro» (18-11-2026, pedido por
              el admin; antes iba en la invitación de la derecha). */}
          <div className="fpo-cabecera-acciones">
            <Tecla href="/foro/ranking" color="blanca" tamano="peq" className="fpo-ver fpo-ver--ranking fpo-ver--arriba">
              <Trophy size={16} strokeWidth={2.6} aria-hidden="true" /> Ver el ranking
            </Tecla>
            <Tecla href="/foro" color="blanca" tamano="peq" className="fpo-ver">
              Ver el foro <ArrowRight size={16} strokeWidth={2.8} aria-hidden="true" />
            </Tecla>
          </div>
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

            {/* Título con «una duda» a mano y fluorescente, y el texto en dos
                notas con su icono: para qué sirve el foro, de un vistazo
                (18-11-2026, pedido por el admin). */}
            <p className="fpo-invita-titulo">
              ¿Se te ha quedado <span className="fpo-invita-mano">una duda</span>?
            </p>
            <ul className="fpo-invita-lista">
              <li>
                <span className="fpo-invita-icono" aria-hidden="true">
                  <MessageCircleQuestionMark size={16} strokeWidth={2.6} />
                </span>
                <span>
                  <b>Pregunta</b> lo que no te haya quedado claro de una guía o de un curso.
                </span>
              </li>
              <li>
                <span className="fpo-invita-icono fpo-invita-icono--ayuda" aria-hidden="true">
                  <HandHelping size={16} strokeWidth={2.6} />
                </span>
                <span>
                  <b>Ayuda</b> a quien viene detrás con lo que ya sabes.
                </span>
              </li>
            </ul>
            <div className="fpo-invita-acciones">
              <Tecla href="/foro/preguntar" color="coral">
                <PenLine size={17} strokeWidth={2.6} aria-hidden="true" /> Hacer una pregunta
              </Tecla>
            </div>
          </aside>
        </div>

        {/* En el móvil, «Ver el ranking» va al final de la sección y arriba solo
            queda «Ver el foro» (18-11-2026, pedido por el admin). En el
            ordenador no sale: allí va en la cabecera. */}
        <Tecla href="/foro/ranking" color="blanca" ancho className="fpo-ver fpo-ver--ranking fpo-ranking-abajo">
          <Trophy size={18} strokeWidth={2.6} aria-hidden="true" /> Ver el ranking
        </Tecla>
      </div>
    </section>
  );
}
