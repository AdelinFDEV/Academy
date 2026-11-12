import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import VistaMio from "@/components/foro/vistas/VistaMio";
import { loMio } from "@/lib/foro/datos/mio";
import { entradaAlForo } from "@/lib/foro/permisos";

// Es personal: nunca desde la caché, y nunca en un buscador.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Lo mío en el foro",
  alternates: { canonical: "/foro/mio" },
  robots: { index: false, follow: false },
};

export default async function MioPage() {
  const { visible, usuarioId } = await entradaAlForo();
  if (!visible) notFound();
  if (!usuarioId) redirect("/login?next=/foro/mio");
  return <VistaMio mio={await loMio(usuarioId)} />;
}
