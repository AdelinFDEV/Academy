import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ListadoHilos from "@/components/foro/ListadoHilos";
import { avisoDeModo } from "@/components/foro/modo";
import { listado } from "@/lib/foro/datos/hilos";
import { ranking } from "@/lib/foro/datos/ranking";
import { entradaAlForo } from "@/lib/foro/permisos";

// El modo del foro y lo publicado cambian en cualquier momento, y lo oculto
// no puede seguir sirviéndose: de momento, siempre recién hecho. La caché de
// lo público se afina en la fase de SEO (FORO.md §6.0, reglas 5 y 6).
export const dynamic = "force-dynamic";

const descripcion =
  "Foro de preguntas y respuestas sobre Bitcoin, criptomonedas, trading, seguridad e impuestos. Leer es libre.";

export async function generateMetadata(): Promise<Metadata> {
  const { modo } = await entradaAlForo();
  return {
    title: "Foro de criptomonedas",
    description: descripcion,
    alternates: { canonical: "/foro" },
    // Mientras no esté abierto, que Google no lo apunte.
    robots: modo === "abierto" ? undefined : { index: false, follow: false },
  };
}

export default async function ForoPage({ searchParams }: { searchParams: Promise<{ pagina?: string }> }) {
  const { visible, usuarioId, modo } = await entradaAlForo();
  if (!visible) notFound();

  const { pagina } = await searchParams;
  const [datos, tablas] = await Promise.all([listado(null, Number(pagina ?? "1")), ranking()]);
  if (!datos) notFound();

  return (
    <ListadoHilos
      datos={datos}
      conSesion={usuarioId !== null}
      aviso={avisoDeModo(modo)}
      destacados={tablas.puntosDelMes.slice(0, 3)}
    />
  );
}
