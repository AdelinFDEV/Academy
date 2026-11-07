import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, ArrowRight, Download, ShieldCheck, GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { certificadosDelAlumno } from "@/lib/cursos";
import { iconoCurso } from "@/lib/logros";
import { fechaLarga, formatoNota } from "@/lib/cursos-progreso";
import "./certificados.css";

export const metadata: Metadata = {
  title: "Mis certificados",
  robots: { index: false, follow: false },
};

/**
 * La vitrina de certificados: todos los que el alumno ha ganado al aprobar el
 * examen final de un curso, para verlos y descargarlos cuando quiera.
 *
 * Vive en /dashboard y no en /aula a propósito: el aula exige Premium, y un
 * certificado ganado tiene que poder descargarse siempre, también si después
 * se cancela la suscripción. Lee con la sesión del alumno (solo los suyos).
 */
export default async function CertificadosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/certificados");

  const certificados = await certificadosDelAlumno(user.id);

  return (
    <main className="dashboard-main">
      <div className="imm cv-page">
        <div className="imm-backdrop" aria-hidden="true">
          <span className="imm-grid" />
          <span className="imm-orb imm-orb--1" />
          <span className="imm-orb imm-orb--2" />
        </div>

        <header className="imm-head">
          {certificados.length > 0 && <span className="imm-watermark" aria-hidden="true">{certificados.length}</span>}
          <span className="imm-eyebrow">
            <span className="imm-eyebrow-dot" aria-hidden="true" />
            Tu vitrina
          </span>
          <h1 className="imm-title">
            Mis certificados
            <span className="imm-title-grad">Lo que aprobaste, para siempre.</span>
          </h1>
          <p className="imm-sub">
            Cada curso que apruebas deja aquí su certificado. Descárgalo en PDF cuando quieras: se queda en tu
            cuenta aunque cambies de plan, y cualquiera puede comprobar que es auténtico con su código.
          </p>
        </header>

        {certificados.length === 0 ? (
          <section className="cv-vacio">
            <span className="cv-vacio-icono" aria-hidden="true"><Award size={30} strokeWidth={1.6} /></span>
            <h2>Tu vitrina está esperando su primer certificado</h2>
            <p>
              Aprueba el examen final de un curso y su certificado aparecerá aquí, con tu nota y su código de
              verificación, listo para descargar.
            </p>
            <Link href="/cursos" className="cv-btn">
              <GraduationCap size={16} aria-hidden="true" /> Ver los cursos
            </Link>
          </section>
        ) : (
          <ul className="cv-rejilla">
            {certificados.map((c) => (
              <li key={c.codigo} className="cv-tarjeta" style={{ "--cv-acento": c.curso.color } as React.CSSProperties}>
                <div className="cv-diploma" aria-hidden="true">
                  <span className="cv-diploma-marca">AdelinBTC Academy</span>
                  <span className="cv-diploma-sello">{iconoCurso(c.curso.slug, 26)}</span>
                  <span className="cv-diploma-nota">{formatoNota(c.nota_final)}</span>
                  <span className="cv-diploma-sobre">sobre 10</span>
                </div>
                <div className="cv-info">
                  <span className="cv-kicker">Certificado de aprovechamiento</span>
                  <h2 className="cv-curso">{c.curso.titulo}</h2>
                  <dl className="cv-datos">
                    <div><dt>Logro</dt><dd>{c.curso.logro}</dd></div>
                    <div><dt>Fecha</dt><dd>{fechaLarga(new Date(c.created_at))}</dd></div>
                    <div><dt>Código</dt><dd className="cv-codigo">{c.codigo}</dd></div>
                  </dl>
                  <div className="cv-acciones">
                    <Link href={`/dashboard/certificados/${c.codigo}`} className="cv-btn">
                      <Download size={15} aria-hidden="true" /> Ver y descargar
                    </Link>
                    <Link href={`/cursos/verificar/${c.codigo}`} className="cv-btn cv-btn--ghost">
                      <ShieldCheck size={15} aria-hidden="true" /> Verificar <ArrowRight size={13} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
