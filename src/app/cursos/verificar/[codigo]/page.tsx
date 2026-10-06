import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import Footer from "@/components/Footer";
import Certificado from "@/components/aula/Certificado";
import { createAdminClient } from "@/lib/supabase/admin";
import { sesionActual } from "@/lib/cursos";
import "../../../aula/aula.css";

type Props = { params: Promise<{ codigo: string }> };

/**
 * Verificación pública de un certificado: quien recibe uno puede comprobar
 * aquí, con el código, que lo emitió la academia y con qué nota.
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

  return (
    <div className="blog-page">
      <div className="bg-ambient" />
      <SiteNav user={!!sesion} isPremium={sesion?.esPremium} userName={sesion?.nombre} isAdmin={sesion?.esAdmin} />
      <main className="blog-main aula-verificar">
        <p className="aula-verificar-ok">
          <ShieldCheck size={18} aria-hidden="true" /> Certificado auténtico, emitido por AdelinBTC Academy.
        </p>
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
        />
        <p className="aula-verificar-pie">
          <Link href={`/cursos/${curso.slug}`}>Ver el curso «{curso.titulo}»</Link>
        </p>
      </main>
      <Footer />
    </div>
  );
}
