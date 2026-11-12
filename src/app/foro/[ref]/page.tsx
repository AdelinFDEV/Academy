import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import HiloCompleto from "@/components/foro/HiloCompleto";
import ListadoHilos from "@/components/foro/ListadoHilos";
import { avisoDeModo } from "@/components/foro/modo";
import { hilo, listado } from "@/lib/foro/datos/hilos";
import { ranking } from "@/lib/foro/datos/ranking";
import { entradaAlForo } from "@/lib/foro/permisos";
import { breadcrumbSchema, qaPageSchema } from "@/lib/schema";

/**
 * `/foro/<ref>` son dos cosas, y se distinguen por la forma:
 *   · `12-como-guardo-mis-bitcoins` → el hilo 12 (empieza por su número);
 *   · `trading`                     → el listado de esa categoría.
 * Una categoría nunca empieza por un número seguido de guion, así que no se
 * pisan. Lo que no sea ninguna de las dos, 404.
 */

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ ref: string }>;
  searchParams: Promise<{ pagina?: string; orden?: string }>;
};

/** El número de hilo de una ref, o null si es otra cosa. */
function idDeHilo(ref: string): number | null {
  const m = /^(\d{1,15})(?:-[a-z0-9-]*)?$/.exec(ref);
  return m ? Number(m[1]) : null;
}

/** La primera frase del texto, para la descripción: sin saltos y sin cortar una palabra. */
function resumen(texto: string, max = 155): string {
  const limpio = texto.replace(/\s+/g, " ").trim();
  if (limpio.length <= max) return limpio;
  return `${limpio.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { visible, modo } = await entradaAlForo();
  if (!visible) return {};
  const { ref } = await params;
  const noIndexar = { index: false, follow: false };

  const id = idDeHilo(ref);
  if (id !== null) {
    const h = await hilo(id);
    if (!h) return { robots: noIndexar };
    return {
      title: h.titulo,
      description: resumen(h.texto),
      alternates: { canonical: `/foro/${h.id}-${h.slug}` },
      // Google espera: con respuesta, 48 horas publicado y sin reportes abiertos (FORO.md §12).
      robots: modo === "abierto" && h.indexable ? undefined : noIndexar,
    };
  }

  const datos = await listado(ref, 1);
  if (!datos?.categoria) return { robots: noIndexar };
  return {
    title: `${datos.categoria.nombre} · Foro`,
    description: resumen(datos.categoria.descripcion),
    alternates: { canonical: `/foro/${datos.categoria.slug}` },
    robots: modo === "abierto" ? undefined : noIndexar,
  };
}

export default async function ForoRefPage({ params, searchParams }: Props) {
  const { visible, usuarioId, modo } = await entradaAlForo();
  if (!visible) notFound();

  const [{ ref }, { pagina, orden }] = await Promise.all([params, searchParams]);
  const aviso = avisoDeModo(modo);
  const conSesion = usuarioId !== null;

  const id = idDeHilo(ref);
  if (id !== null) {
    const cual = orden === "recientes" ? "recientes" : "relevancia";
    const h = await hilo(id, cual);
    // Uno oculto o borrado responde igual que uno que nunca existió.
    if (!h) notFound();
    // Una sola URL por hilo: si el título de la URL no es el suyo, a la buena.
    if (ref !== `${h.id}-${h.slug}`) permanentRedirect(`/foro/${h.id}-${h.slug}`);
    return (
      <>
        {/* Solo con el foro abierto: con él cerrado esta página no existe para
            nadie más. Las migas replican las visibles (Foro / categoría). */}
        {modo === "abierto" && (
          <JsonLd
            data={[
              qaPageSchema({ path: `/foro/${h.id}-${h.slug}`, titulo: h.titulo, texto: h.texto, fecha: h.fecha, autor: h.autor, respuestas: h.respuestas }),
              breadcrumbSchema([
                { name: "Foro", path: "/foro" },
                { name: h.categoria.nombre, path: `/foro/${h.categoria.slug}` },
              ]),
            ]}
          />
        )}
        <HiloCompleto hilo={h} orden={cual} conSesion={conSesion} aviso={aviso} />
      </>
    );
  }

  const [datos, tablas] = await Promise.all([listado(ref, Number(pagina ?? "1")), ranking()]);
  if (!datos) notFound();
  return <ListadoHilos datos={datos} conSesion={conSesion} aviso={aviso} destacados={tablas.puntosDelMes.slice(0, 3)} />;
}
