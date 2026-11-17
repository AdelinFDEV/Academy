import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import Footer from "@/components/Footer";
import Certificado from "@/components/aula/Certificado";
import Tecla from "@/components/cuaderno/Tecla";
import { createAdminClient } from "@/lib/supabase/admin";
import { sesionActual } from "@/lib/cursos";
import { fechaLarga, formatoNota } from "@/lib/cursos-progreso";
import "../../cursos.css";

type Props = { params: Promise<{ codigo: string }> };

/**
 * Verificación pública de un certificado: quien recibe uno puede comprobar
 * aquí, con el código, que lo emitió la academia y con qué nota. Estilo
 * «Cuaderno de estudio» (17-11-2026): el sello de «auténtico» en menta (lo
 * hecho, lo correcto), los datos en una ficha y el certificado, que conserva
 * su diseño y su paleta, enmarcado y sujeto con cinta.
 *
 * `noindex`: es la página de una persona concreta, no contenido para Google.
 * Ojo con el slug: `verificar` es una carpeta estática dentro de /cursos, así
 * que gana a `/cursos/[slug]` y ningún curso puede llamarse así.
 */
export const metadata: Metadata = {
  title: "Verificar certificado",
  robots: { index: false, follow: false },
};

export default async function VerificarPage({ params }: Props) {
  const { codigo } = await params;
  if (!/^[A-Z0-9]{10}$/.test(codigo)) notFound();

  const sesion = await sesionActual();
  const db = createAdminClient();
  const { data: cert } = await db
    .from("curso_certificados")
    .select("nombre, nota_final, nota_modulos, nota_examen, codigo, created_at, cursos(titulo, logro, color, slug)")
    .eq("codigo", codigo)
    .maybeSingle();
  if (!cert) notFound();
  const curso = (Array.isArray(cert.cursos) ? cert.cursos[0] : cert.cursos) as { titulo: string; logro: string; color: string; slug: string } | null;
  if (!curso) notFound();

  const datos = [
    { dt: "A nombre de", dd: cert.nombre },
    { dt: "Curso", dd: curso.titulo },
    { dt: "Nota final", dd: formatoNota(Number(cert.nota_final)) },
    { dt: "Emitido el", dd: fechaLarga(new Date(cert.created_at)) },
    { dt: "Código", dd: cert.codigo },
  ];

  return (
    <div className="blog-page cu-pagina">
      <SiteNav user={!!sesion} isPremium={sesion?.esPremium} userName={sesion?.nombre} isAdmin={sesion?.esAdmin} />
      <main className="cu cv" style={{ "--c": curso.color } as React.CSSProperties}>
        <nav className="cu-migas" aria-label="Migas de pan">
          <Link href="/">Inicio</Link>
          <span aria-hidden="true">/</span>
          <Link href="/cursos">Cursos</Link>
          <span aria-hidden="true">/</span>
          <span>Verificar certificado</span>
        </nav>

        <header className="cv-cab">
          <span className="cv-sello" aria-hidden="true"><Check size={34} strokeWidth={3.4} /></span>
          <div>
            <p className="cu-nota">Verificación pública</p>
            <h1 className="cu-titulo cv-titulo">
              Certificado <span className="fluor">auténtico</span>
            </h1>
            <p className="cv-ok">Emitido por AdelinBTC Academy.</p>
          </div>
        </header>

        <div className="cv-cuerpo">
          <dl className="cv-datos">
            {datos.map(({ dt, dd }) => (
              <div key={dt}>
                <dt>{dt}</dt>
                <dd>{dd}</dd>
              </div>
            ))}
          </dl>

          <div className="cu-marco cv-marco">
            <span className="cu-cinta cu-cinta--izq" aria-hidden="true" />
            <span className="cu-cinta cu-cinta--dcha" aria-hidden="true" />
            <Certificado
              nombre={cert.nombre}
              curso={curso.titulo}
              logro={curso.logro}
              notaFinal={Number(cert.nota_final)}
              notaModulos={Number(cert.nota_modulos)}
              notaExamen={Number(cert.nota_examen)}
              fecha={cert.created_at}
              codigo={cert.codigo}
              color={curso.color}
              completo
            />
          </div>
        </div>

        <p className="cv-pie">
          <Tecla href={`/cursos/${curso.slug}`} color="blanca">Ver el curso «{curso.titulo}»</Tecla>
        </p>
      </main>
      <Footer />
    </div>
  );
}
