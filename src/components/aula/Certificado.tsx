import { Award, ShieldCheck } from "lucide-react";
import { SITE_URL } from "@/lib/site";
import { fechaLarga, formatoNota } from "@/lib/cursos-progreso";
import "./certificado.css";

/**
 * El certificado en sí. Lo pintan el aula, la verificación pública, la vitrina
 * del dashboard y, como muestra, la ficha del curso y el catálogo: un cambio
 * aquí cambia todos a la vez.
 *
 * Rehecho el 08-11-2026 para que sea más premium: una banda azul noche a la
 * izquierda con el medallón dorado, el logro y la nota; y a la derecha el
 * papel marfil con un fondo guilloché, el nombre en serif y el pie con la
 * fecha, el emisor y el código de verificación. Está pensado para imprimirse
 * en A4 apaisado («Guardar como PDF») y todo se mide en cqw, así que se ve
 * igual de proporcionado en miniatura que impreso.
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
  /** En las muestras: lleva la marca de agua «Muestra». */
  muestra?: boolean;
}) {
  const verificar = `${SITE_URL.replace(/^https?:\/\//, "")}/cursos/verificar/${codigo}`;
  return (
    <div className={`cert${muestra ? " cert--muestra" : ""}`} style={{ "--cert-acento": color } as React.CSSProperties}>
      <div className="cert-marco">
        {/* ── Banda izquierda: medallón, logro y nota ── */}
        <div className="cert-banda">
          <span className="cert-banda-marca">AdelinBTC<br />Academy</span>

          <div className="cert-medallon" aria-hidden="true">
            <span className="cert-cinta cert-cinta--i" />
            <span className="cert-cinta cert-cinta--d" />
            <span className="cert-roseta">
              <span className="cert-roseta-disco">
                <Award strokeWidth={1.6} />
              </span>
            </span>
          </div>

          <div className="cert-banda-logro">
            <span>Logro obtenido</span>
            <strong>{logro}</strong>
          </div>

          <div className="cert-banda-nota">
            <span>Nota final</span>
            <strong>{formatoNota(notaFinal)}</strong>
            <span>sobre 10</span>
          </div>
        </div>

        {/* ── Papel: el texto del certificado ── */}
        <div className="cert-papel">
          <p className="cert-kicker">
            <i aria-hidden="true" />Certificado de aprovechamiento<i aria-hidden="true" />
          </p>

          <div className="cert-cuerpo">
            <p className="cert-otorga">Se certifica que</p>
            <h1 className="cert-nombre">{nombre}</h1>
            <span className="cert-floron" aria-hidden="true" />
            <p className="cert-otorga">ha completado y aprobado el curso</p>
            <h2 className="cert-curso">{curso}</h2>
          </div>

          <div className="cert-desglose">
            <div><span>Media de los módulos · 40 %</span><strong>{formatoNota(notaModulos)}</strong></div>
            <div><span>Examen final · 60 %</span><strong>{formatoNota(notaExamen)}</strong></div>
          </div>

          <div className="cert-pie">
            <div>
              <span>Fecha de emisión</span>
              <strong>{fechaLarga(new Date(fecha))}</strong>
            </div>
            <div className="cert-emisor">
              <span className="cert-firma">AdelinBTC Academy</span>
              <span>Emisor del certificado</span>
            </div>
            <div className="cert-verif">
              <span className="cert-holo" aria-hidden="true"><ShieldCheck strokeWidth={1.8} /></span>
              <span className="cert-verif-texto">
                <span>Código de verificación</span>
                <strong className="cert-codigo">{codigo}</strong>
                <span className="cert-url">{verificar}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
