import { Award } from "lucide-react";
import { SITE_URL } from "@/lib/site";
import { fechaLarga, formatoNota } from "@/lib/cursos-progreso";
import "./certificado.css";

/**
 * El certificado en sí. Lo pintan dos páginas: la del alumno, en el aula, y
 * la de verificación pública. Está pensado para imprimirse en A4 apaisado —
 * «Guardar como PDF» del navegador—, así que no depende de nada del aula.
 */
export default function Certificado({
  nombre,
  curso,
  logro,
  notaFinal,
  notaModulos,
  notaExamen,
  fecha,
  codigo,
  color,
  muestra = false,
}: {
  nombre: string;
  curso: string;
  logro: string;
  notaFinal: number;
  notaModulos: number;
  notaExamen: number;
  fecha: string;
  codigo: string;
  color: string;
  /** En la ficha pública: lleva la marca de agua «Muestra». */
  muestra?: boolean;
}) {
  const verificar = `${SITE_URL.replace(/^https?:\/\//, "")}/cursos/verificar/${codigo}`;
  return (
    <div className={`cert${muestra ? " cert--muestra" : ""}`} style={{ "--cert-acento": color } as React.CSSProperties}>
      <div className="cert-marco">
        <div className="cert-cab">
          <span className="cert-marca">AdelinBTC Academy</span>
          <span className="cert-sello" aria-hidden="true"><Award strokeWidth={1.8} /></span>
        </div>

        <p className="cert-kicker">Certificado de aprovechamiento</p>
        <p className="cert-otorga">Se certifica que</p>
        <h1 className="cert-nombre">{nombre}</h1>
        <p className="cert-otorga">ha completado y aprobado el curso</p>
        <h2 className="cert-curso">{curso}</h2>

        <div className="cert-notas">
          <div className="cert-nota-final">
            <span>Nota final</span>
            <strong>{formatoNota(notaFinal)}</strong>
            <span>sobre 10</span>
          </div>
          <div className="cert-desglose">
            <div><span>Media de los módulos (40 %)</span><strong>{formatoNota(notaModulos)}</strong></div>
            <div><span>Examen final (60 %)</span><strong>{formatoNota(notaExamen)}</strong></div>
            <div><span>Logro obtenido</span><strong>{logro}</strong></div>
          </div>
        </div>

        <div className="cert-pie">
          <div>
            <span>Fecha</span>
            <strong>{fechaLarga(new Date(fecha))}</strong>
          </div>
          <div>
            <span>Código de verificación</span>
            <strong className="cert-codigo">{codigo}</strong>
            <span className="cert-url">{verificar}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
