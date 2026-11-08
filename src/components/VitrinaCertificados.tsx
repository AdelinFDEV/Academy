import Link from "next/link";
import { Award, ArrowRight, Download, GraduationCap, Plus, ShieldCheck } from "lucide-react";
import { iconoCurso } from "@/lib/logros";
import { fechaLarga, formatoNota } from "@/lib/cursos-progreso";
import type { CertificadoVitrina } from "@/lib/cursos";
import Certificado from "@/components/aula/Certificado";
import "./vitrina-certificados.css";

/**
 * La vitrina de certificados del alumno. Dos formas, una sola pieza:
 *
 *  · `estante` — la portada del dashboard, debajo de la tarjeta del perfil:
 *    los certificados de verdad, enmarcados sobre una balda iluminada, y un
 *    hueco para el siguiente. Vacía, un mensaje y una MUESTRA con el nombre
 *    del alumno y el primer curso publicado (con la marca de agua «Muestra»).
 *  · `completa` — /dashboard/certificados: un resumen arriba y una ficha por
 *    certificado, con el certificado de verdad en su escaparate, la nota, el
 *    logro, el código y los botones de descarga y verificación (rehecha el
 *    08-11-2026). Vacía, enseña lo mismo que el estante vacío.
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
      <section className={`cv-estante${vacia ? " is-vacia" : ""}`} aria-labelledby="cv-estante-titulo">
        <span className="cv-foco" aria-hidden="true" />
        <span className="cv-terciopelo" aria-hidden="true" />

        {vacia ? (
          <div className="cv-estante-vacia">
            <div className="cv-estante-texto">
              <span className="cv-estante-kicker"><Award size={13} aria-hidden="true" /> Tu vitrina de certificados</span>
              <h2 id="cv-estante-titulo" className="cv-estante-titulo">
                Aquí aparecerán tus certificados, <span>con tu nombre</span>
              </h2>
              <p className="cv-estante-p">
                Cuando superes el examen final de un curso, tu certificado se guardará en esta vitrina para siempre:
                con tu nota, un código que cualquiera puede verificar y listo para descargar en PDF.
              </p>
              <ul className="cv-estante-lista">
                <li><ShieldCheck size={15} aria-hidden="true" /> Verificable con su código único</li>
                <li><Download size={15} aria-hidden="true" /> Descargable en PDF cuando quieras</li>
                <li><GraduationCap size={15} aria-hidden="true" /> Tuyo aunque cambies de plan</li>
              </ul>
              <Link href="/cursos" className="cv-btn cv-btn--oro">
                Conseguir mi primer certificado <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            {ejemplo && (
              <div className="cv-estante-muestra" aria-hidden="true">
                <span className="cv-muestra-etiqueta">Así se verá el tuyo</span>
                <div className="cv-marco">
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
                <span className="cv-balda-corta" />
              </div>
            )}
          </div>
        ) : (
          <>
            <header className="cv-estante-cab">
              <div>
                <span className="cv-estante-kicker"><Award size={13} aria-hidden="true" /> Tu vitrina de certificados</span>
                <h2 id="cv-estante-titulo" className="cv-estante-titulo">
                  {certificados.length} {certificados.length === 1 ? "certificado conseguido" : "certificados conseguidos"}
                </h2>
              </div>
              <Link href="/dashboard/certificados" className="cv-estante-enlace">
                Ver y descargar <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </header>

            <div className="cv-expositor">
              <ul className="cv-expositor-fila">
                {certificados.map((c) => (
                  <li key={c.codigo}>
                    <Link href={`/dashboard/certificados/${c.codigo}`} className="cv-pieza" title={`Ver y descargar: ${c.curso.titulo}`}>
                      <span className="cv-marco">
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
                        <span className="cv-brillo" aria-hidden="true" />
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
                      <Plus size={26} strokeWidth={1.5} />
                      <span>Tu próximo certificado</span>
                    </span>
                    <span className="cv-placa">
                      <strong>Hueco libre</strong>
                      <span>Aprueba otro curso</span>
                    </span>
                  </Link>
                </li>
              </ul>
              <span className="cv-balda" aria-hidden="true" />
            </div>
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
        <div><dt>Certificados</dt><dd>{certificados.length}</dd></div>
        <div><dt>Nota media</dt><dd>{formatoNota(media)}<small>/10</small></dd></div>
        <div><dt>El último</dt><dd className="is-texto">{fechaLarga(new Date(ultimo.created_at))}</dd></div>
        <div><dt>Verificables</dt><dd className="is-texto"><ShieldCheck size={16} aria-hidden="true" /> Todos, con su código</dd></div>
      </dl>

      <ul className="cv-galeria">
        {certificados.map((c) => (
          <li key={c.codigo} className="cv-ficha" style={{ "--cv-acento": c.curso.color } as React.CSSProperties}>
            {/* El escaparate: el certificado de verdad, enmarcado y con su foco. */}
            <Link href={`/dashboard/certificados/${c.codigo}`} className="cv-escaparate" aria-label={`Ver y descargar el certificado de ${c.curso.titulo}`}>
              <span className="cv-escaparate-foco" aria-hidden="true" />
              <span className="cv-marco">
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
                <span className="cv-brillo" aria-hidden="true" />
              </span>
            </Link>

            <div className="cv-ficha-cuerpo">
              <div className="cv-ficha-cab">
                <div>
                  <span className="cv-kicker">Certificado de aprovechamiento</span>
                  <h2 className="cv-curso">{c.curso.titulo}</h2>
                </div>
                <span className="cv-nota" aria-label={`Nota final ${formatoNota(c.nota_final)} sobre 10`}>
                  <strong>{formatoNota(c.nota_final)}</strong>
                  <small>/10</small>
                </span>
              </div>

              <div className="cv-chips">
                <span className="cv-chip cv-chip--logro"><span className="cv-chip-icono">{iconoCurso(c.curso.slug, 14)}</span> {c.curso.logro}</span>
                <span className="cv-chip">Emitido el {fechaLarga(new Date(c.created_at))}</span>
              </div>

              <div className="cv-codigo-fila">
                <span>Código</span>
                <strong className="cv-codigo">{c.codigo}</strong>
              </div>

              <div className="cv-acciones">
                <Link href={`/dashboard/certificados/${c.codigo}`} className="cv-btn">
                  <Download size={15} aria-hidden="true" /> Ver y descargar en PDF
                </Link>
                <Link href={`/cursos/verificar/${c.codigo}`} className="cv-btn cv-btn--ghost">
                  <ShieldCheck size={15} aria-hidden="true" /> Verificar
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
