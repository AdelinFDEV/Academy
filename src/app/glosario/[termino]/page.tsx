import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import JsonLd from "@/components/JsonLd";
import { createClient } from "@/lib/supabase/server";
import { breadcrumbSchema, definedTermSchema } from "@/lib/schema";
import {
  GLOSARIO,
  GLOSARIO_CATEGORIAS,
  GLOSARIO_CON_PAGINA,
  buscarTermino,
} from "@/lib/glosario";

/**
 * Página propia de un término del diccionario — punto 7 del plan SEO.
 *
 * Solo existe para los términos que tienen desarrollo largo (`extended`). Los
 * que aún no lo tienen siguen viviendo únicamente en el listado de /glosario:
 * publicar una URL con 25 palabras es contenido escaso, y hacerlo en masa
 * arrastra al dominio entero. Se abren por tandas conforme se escriben.
 */

/** Solo los términos ya ampliados se prerrenderizan y existen como URL. */
export async function generateStaticParams() {
  return GLOSARIO_CON_PAGINA.map((t) => ({ termino: t.slug }));
}

/** Cualquier slug fuera de esa lista es un 404, no una página vacía. */
export const dynamicParams = false;

export async function generateMetadata(
  { params }: { params: Promise<{ termino: string }> }
): Promise<Metadata> {
  const { termino } = await params;
  const t = buscarTermino(termino);
  if (!t?.extended) return { title: "Término no encontrado" };

  // El título propio tiene un techo de 48 caracteres (ver AGENTS.md): el layout
  // raíz añade " | AdelinBTC". "Qué es X" cabe de sobra en todos los términos.
  return {
    // `seoTitle` gana cuando existe: hay términos que la gente busca con
    // artículo («que es un exchange») y otros que no, así que la plantilla se
    // deja como valor por defecto y se sobrescribe solo donde los datos de
    // Search Console dicen que compensa.
    title: t.seoTitle ?? `Qué es ${t.term}`,
    description: (t.seoDescription ?? t.definition).slice(0, 160),
    alternates: { canonical: `/glosario/${t.slug}` },
    openGraph: {
      type: "article",
      title: `Qué es ${t.term} en criptomonedas`,
      description: t.definition,
    },
  };
}

export default async function TerminoPage({
  params,
}: {
  params: Promise<{ termino: string }>;
}) {
  const { termino } = await params;
  const t = buscarTermino(termino);
  if (!t?.extended) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = user
    ? (await supabase.from("profiles").select("full_name, role").eq("id", user.id).single()).data
    : null;
  const role = profile?.role ?? "free";
  const isPremium = role === "premium" || role === "admin";
  const isAdmin = role === "admin";
  const userName = profile?.full_name || user?.email?.split("@")[0] || "Usuario";

  const etiquetaCat =
    GLOSARIO_CATEGORIAS.find((c) => c.id === t.category)?.label ?? t.category;

  // «Ver también» son los términos que el propio texto necesita para
  // entenderse. Se filtran contra los que ya tienen página: enlazar a una que
  // no existe daría un 404.
  const relacionados = (t.seeAlso ?? [])
    .map((slug) => GLOSARIO.find((x) => x.slug === slug))
    .filter((x): x is NonNullable<typeof x> => !!x?.extended);

  // Y para no dejar la página sin salida, el resto de su categoría.
  const mismaCategoria = GLOSARIO_CON_PAGINA.filter(
    (x) => x.category === t.category && x.slug !== t.slug && !relacionados.includes(x)
  ).slice(0, 6);

  return (
    <>
      <JsonLd
        data={[
          definedTermSchema(t),
          breadcrumbSchema([
            { name: "Inicio", path: "/" },
            { name: "Diccionario", path: "/glosario" },
            { name: t.term, path: `/glosario/${t.slug}` },
          ]),
        ]}
      />

      <SiteNav
        user={!!user}
        isPremium={isPremium}
        userName={user ? userName : undefined}
        isAdmin={isAdmin}
      />

      <main className="termino-page">
        {/* Las mismas migas que declara el JSON-LD, en el mismo orden. */}
        <nav className="termino-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Inicio</Link>
          <span className="termino-breadcrumb-sep">›</span>
          <Link href="/glosario">Diccionario</Link>
          <span className="termino-breadcrumb-sep">›</span>
          <span className="termino-breadcrumb-current">{t.term}</span>
        </nav>

        <header className="termino-header">
          <span className={`termino-cat termino-cat--${t.category}`}>{etiquetaCat}</span>
          <h1 className="termino-title">{t.term}</h1>
          <p className="termino-lead">{t.definition}</p>
        </header>

        <div
          className="termino-body prose-content"
          dangerouslySetInnerHTML={{ __html: t.extended }}
        />

        {relacionados.length > 0 && (
          <section className="termino-relacionados">
            <h2>Ver también</h2>
            <div className="termino-chips">
              {relacionados.map((r) => (
                <Link key={r.slug} href={`/glosario/${r.slug}`} className="termino-chip">
                  {r.term}
                </Link>
              ))}
            </div>
          </section>
        )}

        {mismaCategoria.length > 0 && (
          <section className="termino-relacionados">
            <h2>Más de {etiquetaCat}</h2>
            <div className="termino-chips">
              {mismaCategoria.map((r) => (
                <Link key={r.slug} href={`/glosario/${r.slug}`} className="termino-chip">
                  {r.term}
                </Link>
              ))}
            </div>
          </section>
        )}

        <p className="termino-volver">
          <Link href="/glosario">← Todos los términos del diccionario</Link>
        </p>
      </main>

      <Footer />
    </>
  );
}
