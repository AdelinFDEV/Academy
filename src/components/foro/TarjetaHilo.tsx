import Link from "next/link";
import { ArrowRight, Check, Pin, Users } from "lucide-react";
import Firma from "@/components/foro/Firma";
import { aspectoDe, colorDe } from "@/components/foro/categorias";
import type { HiloEnListado } from "@/lib/foro/tipos";

/**
 * Una pregunta en una lista: la tarjeta de papel con la pestaña del color de
 * su categoría. La usan el listado del foro y el buscador, que además marca
 * en el título lo que coincide con lo buscado (`tituloMarcado`).
 *
 * Los estilos son los de `listado.css` (`.fl-hilo`): quien la use, los carga.
 */
export default function TarjetaHilo({ h }: { h: HiloEnListado }) {
  const { Icono } = aspectoDe(h.categoria.slug);
  const estado = h.resuelto ? "resuelto" : h.respuestas > 0 ? "con" : "sin";
  return (
    <li style={colorDe(h.categoria.slug)}>
      <article className={`fl-hilo is-${estado}`}>
        {/* La cifra que se mira primero: cuántas respuestas tiene. */}
        <div className="fl-marcador" aria-hidden="true">
          {h.resuelto ? <Check size={22} strokeWidth={3.4} /> : <b>{h.respuestas}</b>}
          <span>{h.resuelto ? "resuelta" : h.respuestas === 1 ? "respuesta" : "respuestas"}</span>
        </div>

        <div className="fl-contenido">
          <div className="fl-etiquetas">
            <Link href={`/foro/${h.categoria.slug}`} className="fo-cat">
              <Icono size={13} strokeWidth={2.6} aria-hidden="true" />
              {h.categoria.nombre}
            </Link>
            {h.fijado && (
              <span className="fo-sello"><Pin size={12} strokeWidth={2.8} aria-hidden="true" /> Fijada</span>
            )}
            {h.resuelto && (
              <span className="fo-sello fo-sello--resuelto">
                <Check size={12} strokeWidth={3.4} aria-hidden="true" />
                {h.respuestas} {h.respuestas === 1 ? "respuesta" : "respuestas"}
              </span>
            )}
          </div>

          {/* El enlace del título cubre la tarjeta entera (`::after`). */}
          <h3 className="fl-titulo">
            <Link href={`/foro/${h.id}-${h.slug}`}>
              {h.tituloMarcado
                ? h.tituloMarcado.map((t, i) => (t.marca ? <mark key={i} className="fl-marca">{t.texto}</mark> : t.texto))
                : h.titulo}
              {/* El marcador de la izquierda es solo visual: su dato, para el lector de pantalla. */}
              <span className="sr-only">
                {" "}({h.resuelto ? "resuelta, " : ""}{h.respuestas} {h.respuestas === 1 ? "respuesta" : "respuestas"})
              </span>
            </Link>
          </h3>
          {h.extracto && <p className="fl-extracto">{h.extracto}</p>}

          <div className="fl-pie">
            <Firma autor={h.autor} fecha={h.fecha} compacta />
            {h.yoTambien > 0 && (
              <span className="fl-misma-duda">
                <Users size={14} strokeWidth={2.5} aria-hidden="true" />
                {h.yoTambien} con la misma duda
              </span>
            )}
          </div>
        </div>

        <ArrowRight className="fl-flecha" size={20} strokeWidth={2.6} aria-hidden="true" />
      </article>
    </li>
  );
}
