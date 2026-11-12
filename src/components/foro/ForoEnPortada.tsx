import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Firma from "@/components/foro/Firma";
import { ultimosHilos } from "@/lib/foro/datos/hilos";
import { foroALaVista } from "@/lib/foro/permisos";
import "@/app/foro/foro.css";
import "@/app/foro/portada.css";

/**
 * Las dos últimas preguntas del foro, en la portada de la web, justo debajo
 * de las guías (pedido por el admin el 12-11-2026).
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
  const hilos = await ultimosHilos(2).catch(() => []);
  if (hilos.length === 0) return null;

  return (
    <section className="fpo" aria-labelledby="fpo-titulo">
      <div className="fpo-inner">
        <header className="fpo-cabecera">
          <div>
            <span className="fpo-antetitulo">Foro</span>
            <h2 id="fpo-titulo" className="fpo-titulo">Lo último que se ha preguntado</h2>
          </div>
          <Link href="/foro" className="fpo-todas">
            Ver el foro <ArrowRight size={15} strokeWidth={2.4} aria-hidden="true" />
          </Link>
        </header>

        <ol className="fpo-lista">
          {hilos.map((h) => (
            <li key={h.id}>
              <Link href={`/foro/${h.id}-${h.slug}`} className="fpo-hilo">
                <span className="fpo-meta">
                  <span className="fpo-categoria">{h.categoria.nombre}</span>
                  {h.resuelto && <span className="fo-sello fo-sello--resuelto">Resuelto</span>}
                </span>
                <span className="fpo-pregunta">{h.titulo}</span>
                <span className="fpo-pie">
                  <Firma autor={h.autor} fecha={h.fecha} compacta />
                  <span className="fpo-respuestas">
                    {h.respuestas} {h.respuestas === 1 ? "respuesta" : "respuestas"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
