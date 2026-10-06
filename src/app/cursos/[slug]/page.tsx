import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema, ORG_ID } from "@/lib/schema";
import { SITE_URL } from "@/lib/site";
import { cursoPorSlug, datosAlumno, sesionActual } from "@/lib/cursos";
import { estadoCurso } from "@/lib/cursos-progreso";
import FichaCurso from "./FichaCurso";
import "../../herramientas/detalle.css";
import "../cursos.css";

type Props = { params: Promise<{ slug: string }> };

/**
 * La ficha pública de un curso: lo que enseña, su temario completo, el
 * certificado y cómo se accede. Es la página que se indexa y la que vende.
 * Aquí se leen los datos; lo que se pinta está en `FichaCurso.tsx`.
 *
 * Un borrador solo lo ve el admin, con `noindex` y sin canónica, como las
 * entradas en vista previa.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sesion = await sesionActual();
  const c = await cursoPorSlug(slug, sesion?.esAdmin ?? false);
  if (!c) return { title: "Curso no encontrado" };
  const titulo = c.curso.titulo.length > 48 ? `${c.curso.titulo.slice(0, 47)}…` : c.curso.titulo;
  const descripcion = (c.curso.subtitulo ?? c.curso.descripcion ?? "").slice(0, 160);
  return {
    title: titulo,
    description: descripcion,
    ...(c.curso.published
      ? { alternates: { canonical: `/cursos/${slug}` } }
      : { robots: { index: false, follow: false } }),
    openGraph: c.curso.portada ? { images: [c.curso.portada] } : undefined,
  };
}

export default async function FichaCursoPage({ params }: Props) {
  const { slug } = await params;
  const sesion = await sesionActual();
  const c = await cursoPorSlug(slug, sesion?.esAdmin ?? false);
  if (!c) notFound();

  // Para el alumno Premium, su progreso. Al resto, la invitación.
  const alumno = sesion?.esPremium ? await datosAlumno(sesion.userId, c) : null;
  const progreso = alumno ? estadoCurso(c.modulos, alumno.completadas, alumno.intentos, { esAdmin: sesion?.esAdmin }) : null;
  const { curso, modulos } = c;

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Inicio", path: "/" },
            { name: "Cursos", path: "/cursos" },
            { name: curso.titulo, path: `/cursos/${slug}` },
          ]),
          {
            "@type": "Course",
            name: curso.titulo,
            description: curso.descripcion ?? curso.subtitulo ?? "",
            url: `${SITE_URL}/cursos/${slug}`,
            provider: { "@id": ORG_ID },
            inLanguage: "es",
            isAccessibleForFree: false,
            educationalLevel: curso.nivel,
            ...(curso.revisado && { dateModified: curso.revisado }),
            syllabusSections: modulos.map((m) => ({ "@type": "Syllabus", name: m.titulo, description: m.descripcion ?? "" })),
          },
        ]}
      />
      <FichaCurso c={c} sesion={sesion} alumno={alumno} progreso={progreso} />
    </>
  );
}
