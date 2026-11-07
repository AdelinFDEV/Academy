import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { certificadosDelAlumno } from "@/lib/cursos";
import Certificado from "@/components/aula/Certificado";
import BotonImprimir from "@/components/aula/BotonImprimir";
import "@/components/vitrina-certificados.css";
import "../certificados.css";

type Props = { params: Promise<{ codigo: string }> };

export const metadata: Metadata = {
  title: "Tu certificado",
  robots: { index: false, follow: false },
};

/**
 * Un certificado de la vitrina, a tamaño completo y listo para «Guardar como
 * PDF». Solo lo abre su dueño: la lectura va con su sesión, y un código ajeno
 * da 404. La copia pública, sin descarga, es /cursos/verificar/<codigo>.
 */
export default async function CertificadoVitrinaPage({ params }: Props) {
  const { codigo } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/dashboard/certificados/${codigo}`)}`);

  const [cert] = await certificadosDelAlumno(user.id, codigo);
  if (!cert) notFound();

  return (
    <main className="dashboard-main">
      <div className="cv-detalle">
        <Link href="/dashboard/certificados" className="cv-volver">
          <ArrowLeft size={15} aria-hidden="true" /> Mis certificados
        </Link>
        <header className="cv-detalle-cab">
          <div>
            <h1 className="cv-detalle-titulo">{cert.curso.titulo}</h1>
            <p className="cv-detalle-sub">
              Pulsa «Descargar en PDF» y, en el diálogo de impresión, elige «Guardar como PDF». Sale en A4
              apaisado, con tu nota y el código que cualquiera puede comprobar.
            </p>
          </div>
          <div className="cv-acciones">
            <BotonImprimir className="cv-btn cv-btn--grande" />
            <Link href={`/cursos/verificar/${cert.codigo}`} className="cv-btn cv-btn--ghost">
              <ShieldCheck size={15} aria-hidden="true" /> Página de verificación
            </Link>
          </div>
        </header>
        <Certificado
          nombre={cert.nombre}
          curso={cert.curso.titulo}
          logro={cert.curso.logro}
          notaFinal={cert.nota_final}
          notaModulos={cert.nota_modulos}
          notaExamen={cert.nota_examen}
          fecha={cert.created_at}
          codigo={cert.codigo}
          color={cert.curso.color}
        />
      </div>
    </main>
  );
}
