import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, ShieldCheck } from "lucide-react";
import AulaShell from "@/components/aula/AulaShell";
import Certificado from "@/components/aula/Certificado";
import BotonImprimir from "@/components/aula/BotonImprimir";
import Tecla from "@/components/cuaderno/Tecla";
import { exigirAula } from "../../contexto";

type Props = { params: Promise<{ curso: string }> };

export const metadata: Metadata = { title: "Tu certificado" };

/**
 * El certificado del alumno. Sin certificado, a la portada del aula.
 *
 * El certificado en sí (Certificado.tsx, una hoja de cuaderno con la paleta
 * del curso) aquí solo se enmarca, pegado con cinta sobre la mesa. Al
 * imprimir, la regla de certificado.css deja solo el certificado.
 */
export default async function CertificadoPage({ params }: Props) {
  const { curso: slug } = await params;
  const ctx = await exigirAula(slug, `/aula/${slug}/certificado`);
  const cert = ctx.datos.certificado;
  if (!cert) redirect(`/aula/${slug}`);

  return (
    <AulaShell ctx={ctx} activo={{ certificado: true }}>
      <div className="aula-cert-pagina">
        <header className="aula-hoja aula-cert-cab">
          <span className="aula-pegatina" aria-hidden="true">
            <Award size={22} strokeWidth={2.4} />
          </span>
          <p className="aula-cert-logro">Logro desbloqueado: {ctx.curso.curso.logro}</p>
          <h1 className="aula-h1">
            Tu <span className="fluor">certificado</span>
          </h1>
          <p className="aula-lead">
            Descárgalo en PDF desde el diálogo de impresión. Cualquiera puede comprobar que es auténtico en la
            dirección que lleva al pie, con su código. Queda guardado en{" "}
            <Link href="/dashboard/certificados">tu vitrina de certificados</Link>, para descargarlo siempre que quieras.
          </p>
          <div className="aula-cert-acciones">
            <BotonImprimir />
            <Tecla href={`/cursos/verificar/${cert.codigo}`} color="blanca">
              <ShieldCheck size={17} strokeWidth={2.4} aria-hidden="true" /> Ver la página de verificación
            </Tecla>
          </div>
        </header>

        <div className="aula-cert-mesa">
          <div className="aula-cert-marco">
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
              completo
            />
          </div>
          <p className="aula-cert-nota" aria-hidden="true">ganado examen a examen</p>
        </div>
      </div>
    </AulaShell>
  );
}
