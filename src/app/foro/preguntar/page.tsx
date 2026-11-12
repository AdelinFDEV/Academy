import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import FormPregunta from "@/components/foro/participar/FormPregunta";
import Invitacion from "@/components/foro/participar/Invitacion";
import { avisoDeModo } from "@/components/foro/modo";
import { listado } from "@/lib/foro/datos/hilos";
import { entradaAlForo, motivoParaNoParticipar } from "@/lib/foro/permisos";
import "../preguntar.css";

export const dynamic = "force-dynamic";

// Un formulario no tiene nada que buscar: fuera del índice.
export const metadata: Metadata = {
  title: "Hacer una pregunta",
  alternates: { canonical: "/foro/preguntar" },
  robots: { index: false, follow: false },
};

/**
 * Hacer una pregunta. La página la ve cualquiera (así se entiende qué ofrece
 * el foro), pero el formulario solo sale para quien puede participar AHORA,
 * comprobado en el servidor. A los demás, el paso que les falta. Y aunque
 * alguien forzara el formulario, la API rechaza la publicación.
 */
export default async function PreguntarPage() {
  const { visible, usuarioId, modo } = await entradaAlForo();
  if (!visible) notFound();

  const motivo = usuarioId ? await motivoParaNoParticipar(usuarioId) : "sin_sesion";
  const datos = motivo === null ? await listado(null, 1) : null;
  const aviso = avisoDeModo(modo);

  return (
    <div className="blog-page">
      <SiteNav user={usuarioId !== null} />

      <main className="blog-main fo-main fq-main">
        <nav className="fo-migas" aria-label="Estás en">
          <Link href="/foro">Foro</Link>
        </nav>

        <header className="fo-cabecera">
          <h1 className="fo-titulo">Hacer una pregunta</h1>
          <p className="fo-entradilla">
            Una duda concreta y bien explicada recibe mejores respuestas. Antes de preguntar, mira si alguien ya la
            ha planteado.
          </p>
        </header>

        {aviso && <p className="fo-aviso" role="status">{aviso}</p>}

        {motivo === null && datos ? (
          <FormPregunta categorias={datos.categorias.map((c) => ({ slug: c.slug, nombre: c.nombre }))} />
        ) : (
          <Invitacion motivo={motivo} />
        )}

        <p className="fq-normas">
          Al publicar aceptas las <Link href="/foro/normas">normas del foro</Link>.
        </p>
      </main>

      <Footer />
    </div>
  );
}
