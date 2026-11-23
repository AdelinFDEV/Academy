import Link from "next/link";
import { ArrowLeft, PenLine } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import BuscadorForo from "@/components/foro/BuscadorForo";
import MarcoForo from "@/components/foro/MarcoForo";
import TarjetaHilo from "@/components/foro/TarjetaHilo";
import type { BusquedaForo } from "@/lib/foro/tipos";
import "@/app/foro/listado.css";

/**
 * Los resultados del buscador del foro (`/foro/buscar?q=…`, 23-11-2026).
 *
 * Arriba, la caja con lo buscado; debajo, las preguntas que llevan TODAS las
 * palabras, primero las que las llevan en el título (marcadas), como
 * tarjetas del listado. Si no hay ninguna, la salida natural: preguntarlo.
 *
 * Lo buscado se pinta como texto (React lo escapa) y nunca se indexa.
 */
export default function VistaBuscar({ datos, conSesion, aviso }: { datos: BusquedaForo; conSesion: boolean; aviso: string | null }) {
  const n = datos.hilos.length;
  const buscado = datos.palabras.length > 0;

  return (
    <MarcoForo conSesion={conSesion}>
      <header className="fbc">
        <Link href="/foro" className="fbc-volver">
          <ArrowLeft size={15} strokeWidth={2.8} aria-hidden="true" /> Foro
        </Link>
        <h1 className="fbc-titulo">Buscar en el foro</h1>
        <BuscadorForo inicial={datos.consulta} enfocar={!buscado} />
      </header>

      {aviso && <p className="fo-aviso" role="status">{aviso}</p>}

      <section className="fbr" aria-labelledby="fbr-titulo">
        {!buscado ? (
          <div className="fo-vacio">
            <b id="fbr-titulo">Escribe lo que quieres encontrar</b>
            <p>Dos letras o más: una moneda, un concepto, un problema.</p>
          </div>
        ) : n === 0 ? (
          <div className="fo-vacio fbr-vacio">
            <b id="fbr-titulo">Nadie ha preguntado por «{datos.consulta}» todavía</b>
            <p>Prueba con menos palabras o con otras. Y si no está, pregúntalo: le servirá al siguiente.</p>
            <Tecla href="/foro/preguntar" color="coral">
              <PenLine size={17} strokeWidth={2.6} aria-hidden="true" />
              Hacer la pregunta
            </Tecla>
          </div>
        ) : (
          <>
            <div className="fo-seccion-cab">
              <h2 id="fbr-titulo" className="fo-seccion-titulo">
                {n === 1 ? "1 pregunta" : `${n} preguntas`} sobre «{datos.consulta}»
              </h2>
              <span className="fo-seccion-nota">{n >= 30 ? "las 30 más acertadas" : "las más acertadas, primero"}</span>
            </div>
            <ol className="fl-lista">
              {datos.hilos.map((h) => <TarjetaHilo key={h.id} h={h} />)}
            </ol>
            <p className="fbr-pie">
              ¿No es ninguna de estas? <Link href="/foro/preguntar">Haz tu pregunta</Link>.
            </p>
          </>
        )}
      </section>
    </MarcoForo>
  );
}
