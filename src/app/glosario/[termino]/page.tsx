import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import TerminoCta from "@/components/TerminoCta";
import TerminoVideo from "@/components/TerminoVideo";
import GuardarTermino from "@/components/GuardarTermino";
import JsonLd from "@/components/JsonLd";
import Tecla from "@/components/cuaderno/Tecla";
import Anotacion from "@/components/cuaderno/Anotacion";
import MarcasEstudio from "@/components/marcas/MarcasEstudio";
import { createClient } from "@/lib/supabase/server";
import { vestirTexto } from "@/lib/marcas-texto";
import { breadcrumbSchema, definedTermSchema } from "@/lib/schema";
import {
  GLOSARIO_ALFABETICO,
  GLOSARIO_CATEGORIAS,
  GLOSARIO_CON_PAGINA,
  buscarTermino,
  numeroCromo,
} from "@/lib/glosario";
import PreguntaFrecuente from "./PreguntaFrecuente";
import "./ficha.css";

/**
 * Página propia de un término del diccionario — punto 7 del plan SEO.
 *
 * Solo existe para los términos que tienen desarrollo largo (`extended`). Los
 * que aún no lo tienen siguen viviendo únicamente en el listado de /glosario:
 * publicar una URL con 25 palabras es contenido escaso, y hacerlo en masa
 * arrastra al dominio entero. Se abren por tandas conforme se escriben.
 *
 * Estilo «Cuaderno de estudio» (17-11-2026), en el amarillo del diccionario:
 * la ficha es una ficha de estudio cómoda de leer, las preguntas frecuentes
 * son tarjetas que se abren y los «ver también», fichas de cartulina. Solo
 * cambió la presentación: el texto, los metadatos y el JSON-LD son los mismos.
 *
 * Y es el cuaderno de quien la ha estudiado (ESTILO.md, «Las marcas de estudio
 * en TODOS los textos explicativos»): la definición con rotulador amarillo, el
 * resumen y los avisos como pósits (`vestirTexto`, solo clases) y, en el
 * navegador, los trazos y símbolos por estructura (`MarcasEstudio`). Ni una
 * palabra cambia: se comprueba con el texto visible del HTML antes y después.
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

  // ¿Lo tiene ya guardado? Solo hace falta si hay sesión: el botón no se
  // enseña a quien no la tiene.
  let yaGuardado = false;
  if (user) {
    const { data } = await supabase
      .from("saved_terms")
      .select("id")
      .eq("user_id", user.id)
      .eq("term", t.term)
      .maybeSingle();
    yaGuardado = !!data;
  }

  const etiquetaCat =
    GLOSARIO_CATEGORIAS.find((c) => c.id === t.category)?.label ?? t.category;

  return (
    <div className="fe">
      <JsonLd
        data={[
          definedTermSchema(t),
          // FAQPage solo cuando hay preguntas de verdad en la página: declarar
          // un esquema que el visitante no ve es spam de datos estructurados y
          // Google lo penaliza.
          ...(t.faq?.length
            ? [{
                "@type": "FAQPage",
                mainEntity: t.faq.map((f) => ({
                  "@type": "Question",
                  name: f.q,
                  acceptedAnswer: { "@type": "Answer", text: f.a },
                })),
              }]
            : []),
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

      <main className="fe-main">
        {/* Las mismas migas que declara el JSON-LD, en el mismo orden. */}
        <nav className="fe-migas" aria-label="Estás en">
          <Link href="/">Inicio</Link>
          <span className="fe-migas-sep" aria-hidden="true">›</span>
          <Link href="/glosario">Diccionario</Link>
          <span className="fe-migas-sep" aria-hidden="true">›</span>
          <span className="fe-migas-actual">{t.term}</span>
        </nav>

        {/* La cabecera es el mismo CROMO del listado (20-11-2026, pedido por
            el admin: al entrar no casaba con el diccionario): el marco del
            color de su categoría; arriba, sobre el marco, la categoría, su
            número en el álbum, «Guardar» y el término en grande; abajo, la
            cartulina con la respuesta en una línea. */}
        <header className={`fe-cab fe-cab--${t.category}`}>
          <div className="fe-cab-top">
            <div className="fe-cab-datos">
              <span className="fe-cat">{etiquetaCat}</span>
              <span className="fe-num">
                Nº {numeroCromo(t.slug)}/{GLOSARIO_ALFABETICO.length}
              </span>
            </div>
            {/* Guardar es la única acción de esta página que necesita cuenta,
                así que es lo único que se le ofrece a quien ya la tiene. */}
            {user && (
              <GuardarTermino
                term={t.term}
                definition={t.definition}
                category={t.category}
                guardadoInicial={yaGuardado}
              />
            )}
          </div>
          <h1 className="fe-titulo">{t.term}</h1>
          <p className="fe-lead">
            <Anotacion tipo="highlight" color="var(--amarillo)" grosor={2} iteraciones={1} retraso={500}>
              {t.definition}
            </Anotacion>
          </p>
        </header>

        {/* La banda va DEBAJO de la definición corta: quien llega buscando qué
            significa una palabra tiene que ver la respuesta antes que una oferta.
            Si lo primero es un banner, se vuelve a Google — y eso Google lo mide. */}
        <TerminoCta
          termino={t.term}
          categoria={t.category}
          etiquetaCategoria={etiquetaCat}
          logueado={!!user}
        />

        {/* `termino-body` va PRIMERO en la clase: `npm run check:seo` acota el
            cuerpo de la ficha buscando `class="termino-body`. Lo mismo con
            `termino-faq` y `tvid`, que marcan su final. */}
        <div
          className="termino-body prose-content fe-texto"
          dangerouslySetInnerHTML={{ __html: vestirTexto(t.extended) }}
        />
        <MarcasEstudio selector=".fe .termino-body" clave={t.slug} conclusion />

        {t.faq && t.faq.length > 0 && (
          <section className="termino-faq fe-faq">
            <h2 className="fe-h2">Preguntas frecuentes</h2>
            {t.faq.map((f) => (
              <PreguntaFrecuente key={f.q} pregunta={f.q} respuesta={f.a} />
            ))}
          </section>
        )}

        {/* El vídeo va AQUÍ, al final. Quien ha llegado hasta el final de la
            ficha ya ha decidido que el sitio le sirve, y ese es el momento de
            pedirle otro paso — no el primer segundo. */}
        <TerminoVideo />

        <p className="fe-volver">
          <Tecla href="/glosario" color="blanca">
            ← Todos los términos del diccionario
          </Tecla>
        </p>
      </main>

      <Footer />
    </div>
  );
}
