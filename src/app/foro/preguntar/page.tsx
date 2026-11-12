import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { avisoDeModo } from "@/components/foro/modo";
import VistaPreguntar from "@/components/foro/vistas/VistaPreguntar";
import { listado } from "@/lib/foro/datos/hilos";
import { entradaAlForo, motivoParaNoParticipar } from "@/lib/foro/permisos";

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

  return (
    <VistaPreguntar
      conSesion={usuarioId !== null}
      aviso={avisoDeModo(modo)}
      motivo={motivo}
      categorias={datos ? datos.categorias.map((c) => ({ slug: c.slug, nombre: c.nombre })) : []}
    />
  );
}
