import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { certificadosDelAlumno } from "@/lib/cursos";
import Certificado from "@/components/aula/Certificado";
import Tecla from "@/components/cuaderno/Tecla";
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
    <main className="dashboard-main cv-page">
      <header className="pn-cab tono-lila">
        <Tecla href="/dashboard/certificados" color="blanca" tamano="peq" className="pn-volver">
          <ArrowLeft size={14} strokeWidth={2.6} aria-hidden="true" /> Mis certificados
        </Tecla>
        <p className="pn-mano">tu certificado</p>
        <h1 className="pn-titulo">{cert.curso.titulo}</h1>
        <p className="pn-lead">
          Pulsa «Descargar en PDF» y, en el diálogo de impresión, elige «Guardar como PDF». Sale en A4
          apaisado, con tu nota y el código que cualquiera puede comprobar.
        </p>
        <div className="cv-acciones">
          <BotonImprimir color="lila" />
          <Tecla href={`/cursos/verificar/${cert.codigo}`} color="blanca">
            <ShieldCheck size={16} aria-hidden="true" /> Página de verificación
          </Tecla>
        </div>
      </header>

      {/* El certificado, sujeto con cinta a la hoja. Su diseño es suyo
          (components/aula/Certificado.tsx): aquí solo se enmarca. */}
      <div className="cv-detalle">
        <div className="cv-marco cv-marco--grande">
          <span className="cv-cinta cv-cinta--1" aria-hidden="true" />
          <span className="cv-cinta cv-cinta--2" aria-hidden="true" />
          <Certificado
            completo
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
      </div>
    </main>
  );
}
