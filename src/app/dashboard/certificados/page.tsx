import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { certificadosDelAlumno, cursoPorSlug, cursosPublicados } from "@/lib/cursos";
import VitrinaCertificados, { type EjemploVitrina } from "@/components/VitrinaCertificados";
import Tecla from "@/components/cuaderno/Tecla";
import { ArrowLeft } from "lucide-react";
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

  const [certificados, { data: perfil }] = await Promise.all([
    certificadosDelAlumno(user.id),
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
  ]);
  const nombre = perfil?.full_name || user.email?.split("@")[0] || undefined;

  // Vitrina vacía: una muestra con su nombre y el primer curso publicado.
  let ejemplo: EjemploVitrina | null = null;
  if (certificados.length === 0) {
    const [primero] = await cursosPublicados();
    const curso = primero ? await cursoPorSlug(primero.slug) : null;
    if (curso) ejemplo = { titulo: curso.curso.titulo, logro: curso.curso.logro, color: curso.curso.color, fecha: curso.curso.updated_at };
  }

  return (
    <main className="dashboard-main cv-page">
      <header className="pn-cab tono-lila">
        <Tecla href="/dashboard" color="blanca" tamano="peq" className="pn-volver">
          <ArrowLeft size={14} strokeWidth={2.6} aria-hidden="true" /> Mi panel
        </Tecla>
        <p className="pn-mano">tu vitrina</p>
        <h1 className="pn-titulo">
          Mis certificados
          {certificados.length > 0 && <span className="pn-cuenta tono-lila">{certificados.length}</span>}
        </h1>
        <p className="pn-lead">
          <strong>Lo que aprobaste, para siempre.</strong> Cada curso que apruebas deja aquí su certificado.
          Descárgalo en PDF cuando quieras: se queda en tu cuenta aunque cambies de plan, y cualquiera puede
          comprobar que es auténtico con su código.
        </p>
      </header>

      <VitrinaCertificados certificados={certificados} forma="completa" nombre={nombre} ejemplo={ejemplo} />
    </main>
  );
}
