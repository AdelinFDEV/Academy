import type { Metadata } from "next";
import { notFound } from "next/navigation";
import VistaNormas from "@/components/foro/vistas/VistaNormas";
import { entradaAlForo } from "@/lib/foro/permisos";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { modo } = await entradaAlForo();
  return {
    title: "Normas del foro",
    description: "Las normas de la comunidad del foro: qué se puede publicar, qué no y cómo se modera.",
    alternates: { canonical: "/foro/normas" },
    robots: modo === "abierto" ? undefined : { index: false, follow: false },
  };
}

/** Las normas de la comunidad (FORO.md §13). El texto vive en `VistaNormas`. */
export default async function NormasPage() {
  const { visible, usuarioId } = await entradaAlForo();
  if (!visible) notFound();
  return <VistaNormas conSesion={usuarioId !== null} />;
}
