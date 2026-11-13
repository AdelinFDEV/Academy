import Link from "next/link";
import { ArrowRight, Check, MessagesSquare, PenLine, Trophy } from "lucide-react";
import Firma from "@/components/foro/Firma";
import { aspectoDe, colorDe } from "@/components/foro/categorias";
import { ultimosHilos } from "@/lib/foro/datos/hilos";
import { foroALaVista } from "@/lib/foro/permisos";
import type { HiloEnListado } from "@/lib/foro/tipos";
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
 * El bloque, ya con sus preguntas. Lleva `fo-pagina` para tener a mano los
 * colores y las tarjetas del foro (viven en esa clase, en `foro.css`): así la
 * portada enseña el foro con la misma cara que tiene dentro.
 */
export function BloqueForoEnPortada({ hilos }: { hilos: HiloEnListado[] }) {
  return (
    <section className="fpo fo-pagina" aria-labelledby="fpo-titulo">
      <span className="fpo-luz fpo-luz--violeta" aria-hidden="true" />
      <span className="fpo-luz fpo-luz--naranja" aria-hidden="true" />
      <div className="fpo-inner">
        <header className="fpo-cabecera">
          <div>
            <span className="fo-antetitulo">
              <MessagesSquare size={13} strokeWidth={2.4} aria-hidden="true" />
              Foro
            </span>
            <h2 id="fpo-titulo" className="fpo-titulo">Lo último que se ha <em>preguntado</em></h2>
          </div>
          <Link href="/foro" className="fpo-todas">
            Ver el foro
            <span className="fpo-todas-flecha" aria-hidden="true">
              <ArrowRight size={16} strokeWidth={2.6} />
            </span>
          </Link>
        </header>

        <div className="fpo-cuerpo">
        <ol className={`fpo-lista${hilos.length === 1 ? " fpo-lista--una" : ""}`}>
          {hilos.map((h) => {
            const { Icono } = aspectoDe(h.categoria.slug);
            return (
              <li key={h.id} style={colorDe(h.categoria.slug)}>
                <Link href={`/foro/${h.id}-${h.slug}`} className={`fpo-hilo fo-tarjeta${h.resuelto ? " is-resuelto" : ""}`}>
                  <span className="fpo-meta">
                    <span className="fo-cat">
                      <Icono size={12} strokeWidth={2.4} aria-hidden="true" />
                      {h.categoria.nombre}
                    </span>
                    {h.resuelto && (
                      <span className="fo-sello fo-sello--resuelto">
                        <Check size={10} strokeWidth={3.2} aria-hidden="true" /> Resuelta
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
          <svg className="fpo-invita-dibujo" viewBox="0 0 220 180" aria-hidden="true">
            <path d="M28 22h112a18 18 0 0 1 18 18v52a18 18 0 0 1-18 18H82l-30 24v-24H28a18 18 0 0 1-18-18V40a18 18 0 0 1 18-18Z" />
            <path d="M120 74h72a16 16 0 0 1 16 16v40a16 16 0 0 1-16 16h-8v20l-26-20h-38a16 16 0 0 1-16-16V90a16 16 0 0 1 16-16Z" />
          </svg>
          <span className="fpo-invita-sello">Comunidad</span>
          <p className="fpo-invita-titulo">¿Se te ha quedado <em>una duda</em>?</p>
          <p className="fpo-invita-texto">
            El foro es el sitio para preguntar lo que no te haya quedado claro de una guía o de un curso, y para
            ayudar a quien viene detrás.
          </p>
          <div className="fpo-invita-acciones">
            <Link href="/foro/preguntar" className="fpo-invita-boton">
              <PenLine size={16} strokeWidth={2.4} aria-hidden="true" /> Hacer una pregunta
            </Link>
            <Link href="/foro/ranking" className="fpo-invita-enlace">
              <Trophy size={15} strokeWidth={2.2} aria-hidden="true" /> Ver el ranking
            </Link>
          </div>
        </aside>
        </div>
      </div>
    </section>
  );
}
