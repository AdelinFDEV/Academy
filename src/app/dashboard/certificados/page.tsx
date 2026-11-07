import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { certificadosDelAlumno } from "@/lib/cursos";
import VitrinaCertificados from "@/components/VitrinaCertificados";
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

        <VitrinaCertificados certificados={certificados} forma="completa" />
      </div>
    </main>
  );
}
