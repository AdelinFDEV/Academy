import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, Copy } from "lucide-react";
import AulaShell from "@/components/aula/AulaShell";
import Certificado from "@/components/aula/Certificado";
import BotonImprimir from "@/components/aula/BotonImprimir";
import { exigirAula } from "../../contexto";

type Props = { params: Promise<{ curso: string }> };

export const metadata: Metadata = { title: "Tu certificado" };

/** El certificado del alumno. Sin certificado, a la portada del aula. */
export default async function CertificadoPage({ params }: Props) {
  const { curso: slug } = await params;
  const ctx = await exigirAula(slug, `/aula/${slug}/certificado`);
  const cert = ctx.datos.certificado;
  if (!cert) redirect(`/aula/${slug}`);

  return (
    <AulaShell ctx={ctx} activo={{ certificado: true }}>
      <div className="aula-cert-pagina">
        <header className="aula-cert-cab">
          <span className="aula-kicker"><Award size={14} aria-hidden="true" /> Logro desbloqueado: {ctx.curso.curso.logro}</span>
          <h1 className="aula-h1">Tu certificado</h1>
          <p className="aula-lead">
            Descárgalo en PDF desde el diálogo de impresión. Cualquiera puede comprobar que es auténtico en la
            dirección que lleva al pie, con su código.
          </p>
          <div className="aula-cert-acciones">
            <BotonImprimir />
            <Link href={`/cursos/verificar/${cert.codigo}`} className="aula-btn aula-btn--ghost">
              <Copy size={15} aria-hidden="true" /> Ver la página de verificación
            </Link>
          </div>
        </header>
        <Certificado
          nombre={cert.nombre}
          curso={ctx.curso.curso.titulo}
          logro={ctx.curso.curso.logro}
          notaFinal={cert.nota_final}
          notaModulos={cert.nota_modulos}
          notaExamen={cert.nota_examen}
          fecha={cert.created_at}
          codigo={cert.codigo}
          color={ctx.curso.curso.color}
        />
      </div>
    </AulaShell>
  );
}
