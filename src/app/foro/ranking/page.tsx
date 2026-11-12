import type { Metadata } from "next";
import { notFound } from "next/navigation";
import VistaRanking from "@/components/foro/vistas/VistaRanking";
import { ranking } from "@/lib/foro/datos/ranking";
import { entradaAlForo } from "@/lib/foro/permisos";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { modo } = await entradaAlForo();
  return {
    title: "Ranking del foro",
    description: "Quién ayuda más en el foro: puntos del mes, respuestas elegidas y gracias recibidas.",
    alternates: { canonical: "/foro/ranking" },
    robots: modo === "abierto" ? undefined : { index: false, follow: false },
  };
}

export default async function RankingPage() {
  const { visible, usuarioId } = await entradaAlForo();
  if (!visible) notFound();
  return <VistaRanking ranking={await ranking()} conSesion={usuarioId !== null} />;
}
