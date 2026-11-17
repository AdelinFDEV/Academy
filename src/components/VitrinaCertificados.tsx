import Link from "next/link";
import { ArrowRight, Download, GraduationCap, Plus, ShieldCheck } from "lucide-react";
import { iconoCurso } from "@/lib/logros";
import { fechaLarga, formatoNota } from "@/lib/cursos-progreso";
import type { CertificadoVitrina } from "@/lib/cursos";
import Certificado from "@/components/aula/Certificado";
import Tecla from "@/components/cuaderno/Tecla";
import "./vitrina-certificados.css";

/**
 * La vitrina de certificados del alumno. Dos formas, una sola pieza:
 *
 *  · `estante` — la portada del dashboard: los certificados de verdad,
 *    sujetos con cinta adhesiva a una hoja del cuaderno, y un hueco punteado
 *    para el siguiente. Vacía, un mensaje y una MUESTRA con el nombre del
 *    alumno y el primer curso publicado (con la marca de agua «Muestra»).
 *  · `completa` — /dashboard/certificados: un resumen arriba y una ficha por
 *    certificado, con el certificado de verdad en su escaparate, la nota, el
 *    logro, el código y los botones de descarga y verificación (rehecha el
 *    08-11-2026). Vacía, enseña lo mismo que el estante vacío.
 *
 * Estilo «Cuaderno de estudio» desde el 17-11-2026, en lila (el color de los
 * cursos). El certificado en sí (`Certificado`) no se toca aquí: solo se
 * enmarca, sin depender de sus clases internas.
 *
 * Los datos los trae el servidor con `certificadosDelAlumno()` (solo los del
 * propio alumno, con su sesión). No exige Premium: lo ganado se queda.
 */

/** El curso con el que se pinta la muestra cuando la vitrina está vacía. */
export interface EjemploVitrina {
  titulo: string;
  logro: string;
  color: string;
  fecha: string;
}

export default function VitrinaCertificados({
  certificados,
  forma,
  nombre,
  ejemplo = null,
}: {
  certificados: CertificadoVitrina[];
  forma: "estante" | "completa";
  /** Para la muestra de la vitrina vacía: el nombre del alumno. */
  nombre?: string;
  /** Para la muestra de la vitrina vacía: el curso publicado con el que se hace. */
  ejemplo?: EjemploVitrina | null;
}) {
  if (forma === "estante") {
    const vacia = certificados.length === 0;
    return (
      <section className={`cv-estante pn-hoja${vacia ? " is-vacia" : ""}`} aria-labelledby="cv-estante-titulo">
        {vacia ? (
          <div className="cv-estante-vacia">
            <div className="cv-estante-texto">
              <p className="pn-mano">tu vitrina de certificados</p>
              <h2 id="cv-estante-titulo" className="cv-estante-titulo">
                Aquí aparecerán tus certificados, <span className="fluor">con tu nombre</span>
              </h2>
              <p className="cv-estante-p">
                Cuando superes el examen final de un curso, tu certificado se guardará en esta vitrina para siempre:
                con tu nota, un código que cualquiera puede verificar y listo para descargar en PDF.
              </p>
              <ul className="cv-estante-lista">
                <li><span className="tono-lila" aria-hidden="true"><ShieldCheck size={15} /></span> Verificable con su código único</li>
                <li><span className="tono-lila" aria-hidden="true"><Download size={15} /></span> Descargable en PDF cuando quieras</li>
                <li><span className="tono-lila" aria-hidden="true"><GraduationCap size={15} /></span> Tuyo aunque cambies de plan</li>
              </ul>
              <Tecla href="/cursos" color="lila">
                Conseguir mi primer certificado <ArrowRight size={16} strokeWidth={2.6} aria-hidden="true" />
              </Tecla>
            </div>
            {ejemplo && (
              <div className="cv-estante-muestra" aria-hidden="true">
                <span className="cv-muestra-etiqueta">así se verá el tuyo</span>
                <div className="cv-marco">
                  <span className="cv-cinta cv-cinta--1" />
                  <span className="cv-cinta cv-cinta--2" />
                  <Certificado
                    muestra
                    nombre={nombre || "Tu nombre aquí"}
                    curso={ejemplo.titulo}
                    logro={ejemplo.logro}
                    notaFinal={8.75}
                    notaModulos={8.4}
                    notaExamen={9}
                    fecha={ejemplo.fecha}
                    codigo="XXXXXXXXXX"
                    color={ejemplo.color}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <header className="cv-estante-cab">
              <div>
                <p className="pn-mano">tu vitrina de certificados</p>
                <h2 id="cv-estante-titulo" className="cv-estante-titulo">
                  {certificados.length} {certificados.length === 1 ? "certificado conseguido" : "certificados conseguidos"}
                </h2>
              </div>
              <Tecla href="/dashboard/certificados" color="lila" tamano="peq">
                Ver y descargar <ArrowRight size={14} aria-hidden="true" />
              </Tecla>
            </header>

            <ul className="cv-expositor">
              {certificados.map((c) => (
                <li key={c.codigo}>
                  <Link href={`/dashboard/certificados/${c.codigo}`} className="cv-pieza" title={`Ver y descargar: ${c.curso.titulo}`}>
                    <span className="cv-marco">
                      <span className="cv-cinta cv-cinta--1" aria-hidden="true" />
                      <Certificado
                        nombre={c.nombre}
                        curso={c.curso.titulo}
                        logro={c.curso.logro}
                        notaFinal={c.nota_final}
                        notaModulos={c.nota_modulos}
                        notaExamen={c.nota_examen}
                        fecha={c.created_at}
                        codigo={c.codigo}
                        color={c.curso.color}
                      />
                    </span>
                    <span className="cv-placa">
                      <strong>{c.curso.titulo}</strong>
                      <span>{fechaLarga(new Date(c.created_at))} · nota {formatoNota(c.nota_final)}</span>
                    </span>
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/cursos" className="cv-pieza cv-pieza--hueco">
                  <span className="cv-hueco" aria-hidden="true">
                    <Plus size={26} strokeWidth={2.4} />
                    <span>tu próximo certificado</span>
                  </span>
                  <span className="cv-placa">
                    <strong>Hueco libre</strong>
                    <span>Aprueba otro curso</span>
                  </span>
                </Link>
              </li>
            </ul>
          </>
        )}
      </section>
    );
  }

  // Vacía, la página completa enseña lo mismo que el estante: el mensaje y la muestra con su nombre.
  if (certificados.length === 0) {
    return <VitrinaCertificados certificados={certificados} forma="estante" nombre={nombre} ejemplo={ejemplo} />;
  }

  const media = certificados.reduce((t, c) => t + c.nota_final, 0) / certificados.length;
  const ultimo = certificados[0];

  return (
    <>
      <dl className="cv-resumen">
        <div className="tono-lila"><dt>Certificados</dt><dd>{certificados.length}</dd></div>
        <div className="tono-amarillo"><dt>Nota media</dt><dd>{formatoNota(media)}<small>/10</small></dd></div>
        <div className="tono-cielo"><dt>El último</dt><dd className="is-texto">{fechaLarga(new Date(ultimo.created_at))}</dd></div>
        <div className="tono-menta"><dt>Verificables</dt><dd className="is-texto"><ShieldCheck size={16} aria-hidden="true" /> Todos, con su código</dd></div>
      </dl>

      <ul className="cv-galeria">
        {certificados.map((c) => (
          <li key={c.codigo} className="cv-ficha pn-hoja">
            {/* El escaparate: el certificado de verdad, sujeto con cinta. */}
            <Link href={`/dashboard/certificados/${c.codigo}`} className="cv-escaparate" aria-label={`Ver y descargar el certificado de ${c.curso.titulo}`}>
              <span className="cv-marco">
                <span className="cv-cinta cv-cinta--1" aria-hidden="true" />
                <span className="cv-cinta cv-cinta--2" aria-hidden="true" />
                <Certificado
                  nombre={c.nombre}
                  curso={c.curso.titulo}
                  logro={c.curso.logro}
                  notaFinal={c.nota_final}
                  notaModulos={c.nota_modulos}
                  notaExamen={c.nota_examen}
                  fecha={c.created_at}
                  codigo={c.codigo}
                  color={c.curso.color}
                />
              </span>
            </Link>

            <div className="cv-ficha-cuerpo">
              <div className="cv-ficha-cab">
                <div>
                  <span className="pn-etiqueta">Certificado de aprovechamiento</span>
                  <h2 className="cv-curso">{c.curso.titulo}</h2>
                </div>
                <span className="cv-nota" aria-label={`Nota final ${formatoNota(c.nota_final)} sobre 10`}>
                  <strong>{formatoNota(c.nota_final)}</strong>
                  <small>/10</small>
                </span>
              </div>

              <div className="cv-chips">
                <span className="pn-chip tono-lila"><span className="cv-chip-icono" aria-hidden="true">{iconoCurso(c.curso.slug, 14)}</span> {c.curso.logro}</span>
                <span className="pn-chip tono-gris">Emitido el {fechaLarga(new Date(c.created_at))}</span>
              </div>

              <div className="cv-codigo-fila">
                <span className="pn-etiqueta">Código</span>
                <strong className="cv-codigo">{c.codigo}</strong>
              </div>

              <div className="cv-acciones">
                <Tecla href={`/dashboard/certificados/${c.codigo}`} color="lila" tamano="peq">
                  <Download size={15} aria-hidden="true" /> Ver y descargar en PDF
                </Tecla>
                <Tecla href={`/cursos/verificar/${c.codigo}`} color="blanca" tamano="peq">
                  <ShieldCheck size={15} aria-hidden="true" /> Verificar
                </Tecla>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
