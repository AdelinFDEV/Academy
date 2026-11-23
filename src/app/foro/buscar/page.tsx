import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { avisoDeModo } from "@/components/foro/modo";
import VistaBuscar from "@/components/foro/vistas/VistaBuscar";
import { buscar } from "@/lib/foro/datos/hilos";
import { entradaAlForo } from "@/lib/foro/permisos";

// Depende de lo que se busca y de lo publicado en ese momento: nunca desde la
// caché. Y nunca en un buscador: una página de resultados no es contenido.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Buscar en el foro",
  alternates: { canonical: "/foro/buscar" },
  robots: { index: false, follow: false },
};

export default async function BuscarPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const { visible, usuarioId, modo } = await entradaAlForo();
  if (!visible) notFound();

  const { q } = await searchParams;
  // `?q=a&q=b` llega como lista: se busca solo lo primero.
  const datos = await buscar(Array.isArray(q) ? q[0] : q);
  return <VistaBuscar datos={datos} conSesion={usuarioId !== null} aviso={avisoDeModo(modo)} />;
}
