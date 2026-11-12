/**
 * Datos estructurados (JSON-LD) — punto 6 del plan SEO (ver SEO-PLAN.md).
 *
 * Son las etiquetas que le dicen a Google QUÉ es cada página, en lugar de
 * dejar que lo deduzca del texto. Sin esto, un artículo y una página legal le
 * parecen la misma cosa: un documento con palabras.
 *
 * Dos reglas que conviene no romper:
 *
 *   1. **Nada que no se pueda ver en la página.** Google considera "spam de
 *      datos estructurados" describir cosas que el usuario no encuentra al
 *      entrar, y penaliza. Por eso aquí no hay `aggregateRating` inventado, ni
 *      autor con nombre falso, ni fechas de relleno.
 *   2. **Un solo sitio para las entidades compartidas.** La organización y el
 *      sitio se declaran UNA vez en el layout raíz, con un `@id` estable, y el
 *      resto de esquemas se limitan a apuntar a ese `@id`. Repetir el objeto
 *      entero en cada página engorda el HTML y hace que dos definiciones se
 *      puedan desincronizar.
 */
import { SITE_URL } from "@/lib/site";
import { INSTAGRAM_URL, YOUTUBE_URL } from "@/lib/contacto";
import { LEGAL } from "@/lib/legal";

/** Identificadores estables a los que apunta todo lo demás. */
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/** Tipo laxo a propósito: JSON-LD es un grafo abierto, no una forma fija. */
export type JsonLdNode = Record<string, unknown>;

/**
 * La organización. `sameAs` son los perfiles que confirman que la marca y las
 * cuentas son la misma entidad — es lo que permite a Google enlazarlas.
 */
export function organizationSchema(): JsonLdNode {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: LEGAL.marca,
    url: `${SITE_URL}/`,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/icon.png`,
      width: 512,
      height: 512,
    },
    email: LEGAL.email,
    // El canal, no el privado: sameAs declara los PERFILES oficiales de la
    // marca, y un chat de una persona no lo es.
    sameAs: [INSTAGRAM_URL, YOUTUBE_URL],
  };
}

/**
 * El sitio como obra.
 *
 * No lleva `SearchAction`: eso declara un buscador propio con una URL de
 * resultados, y el sitio no tiene ninguna. Declararlo sería describir algo que
 * no existe.
 */
export function websiteSchema(description: string): JsonLdNode {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: LEGAL.marca,
    description,
    inLanguage: "es-ES",
    publisher: { "@id": ORG_ID },
  };
}

/**
 * Una guía.
 *
 * `isAccessibleForFree: true` siempre: desde el 31-10-2026 toda guía se lee
 * entera sin cuenta, y es lo mismo que ve Googlebot. El quiz pide cuenta, pero
 * el quiz no es el texto de la guía.
 *
 * Sin fechas: `GUIDES` no las guarda, y una fecha inventada hace más daño que
 * una ausente (la misma regla que el sitemap).
 */
export function guideSchema(guia: {
  slug: string;
  title: string;
  description: string;
  /** La guía tiene su propio `opengraph-image.tsx`; si no, la genérica del sitio. */
  imagenPropia?: boolean;
}): JsonLdNode {
  const url = `${SITE_URL}/guias/${guia.slug}`;
  return {
    "@type": "Article",
    "@id": `${url}#article`,
    headline: guia.title,
    description: guia.description,
    image: guia.imagenPropia ? `${url}/opengraph-image` : `${SITE_URL}/opengraph-image`,
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    isPartOf: { "@id": WEBSITE_ID },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    inLanguage: "es-ES",
    isAccessibleForFree: true,
  };
}

/**
 * Una herramienta de pago del sitio como aplicación web — hoy, el Diario de
 * Trading en su ficha pública (10-11-2026).
 *
 * El precio va porque está a la vista en la ficha y sale de la misma constante
 * que cobra Stripe: no se escribe a mano. Sin `aggregateRating` ni `review`:
 * no hay valoraciones reales que enseñar, y declararlas sería spam. Eso hace
 * que Google no pinte estrellas; lo que sí gana es entender que la página es
 * un producto, no un artículo.
 */
export function webAppSchema(app: {
  path: string;
  name: string;
  description: string;
  /** Precio mensual en euros, el mismo número que cobra Stripe. */
  precioMensualEur: number;
}): JsonLdNode {
  const url = `${SITE_URL}${app.path}`;
  return {
    "@type": "WebApplication",
    "@id": `${url}#app`,
    name: app.name,
    description: app.description,
    url,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    inLanguage: "es-ES",
    publisher: { "@id": ORG_ID },
    isPartOf: { "@id": WEBSITE_ID },
    offers: {
      "@type": "Offer",
      price: app.precioMensualEur.toFixed(2),
      priceCurrency: "EUR",
      category: "subscription",
      url,
    },
  };
}

/**
 * Una lista ordenada de páginas del sitio — hoy, las guías en `/guias`.
 *
 * Se declara solo si esa misma lista está a la vista y en ese mismo orden: es
 * un resumen de lo que el visitante ve, no un catálogo paralelo.
 */
export function itemListSchema(
  nombre: string,
  items: { name: string; path: string }[]
): JsonLdNode {
  return {
    "@type": "ItemList",
    name: nombre,
    numberOfItems: items.length,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: `${SITE_URL}${item.path}`,
    })),
  };
}

/**
 * Un término del diccionario.
 *
 * `DefinedTerm` va dentro de un `DefinedTermSet` —el diccionario completo—
 * porque un término suelto, sin decir de qué glosario forma parte, le dice muy
 * poco a Google. La `description` es la definición corta y no el desarrollo
 * entero: es la que responde «qué es esto» en una línea.
 */
export function definedTermSchema(t: {
  term: string;
  slug: string;
  definition: string;
}): JsonLdNode {
  return {
    "@type": "DefinedTerm",
    "@id": `${SITE_URL}/glosario/${t.slug}#term`,
    name: t.term,
    description: t.definition,
    url: `${SITE_URL}/glosario/${t.slug}`,
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      "@id": `${SITE_URL}/glosario#set`,
      name: "Diccionario Cripto",
      url: `${SITE_URL}/glosario`,
    },
    inLanguage: "es-ES",
  };
}

/**
 * Migas de pan. `items` va de la raíz a la página actual, ambas incluidas.
 *
 * La ruta se pasa relativa y se resuelve aquí contra SITE_URL, por lo mismo
 * que las canónicas: el dominio se escribe en un solo sitio.
 */
export function breadcrumbSchema(items: { name: string; path: string }[]): JsonLdNode {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

/** Quien firma en el foro: solo su alias. No hay página de perfil que enlazar. */
type FirmaForo = { alias: string } | null;

/**
 * Un hilo del foro como `QAPage` (FORO.md §12).
 *
 * Solo lo que se ve en la página: la pregunta, sus respuestas publicadas con
 * su número de «me gusta», la elegida como `acceptedAnswer` y las demás como
 * `suggestedAnswer`, y las réplicas como `comment` de su respuesta. Nada
 * oculto ni retirado llega aquí: `datos/hilos.ts` ya solo lee lo publicado.
 *
 * El texto es de usuarios. `<JsonLd>` escapa cada `<` al escribirlo, así que
 * un `</script>` dentro de una pregunta no puede cerrar la etiqueta.
 */
export function qaPageSchema(hilo: {
  path: string;
  titulo: string;
  texto: string;
  fecha: string;
  autor: FirmaForo;
  respuestas: {
    id: string;
    texto: string;
    fecha: string;
    autor: FirmaForo;
    meGusta: number;
    esGanadora: boolean;
    replicas: { id: string; texto: string; fecha: string; autor: FirmaForo }[];
  }[];
}): JsonLdNode {
  const url = `${SITE_URL}${hilo.path}`;
  const persona = (a: FirmaForo) => (a ? { author: { "@type": "Person", name: a.alias } } : {});
  const respuesta = (r: (typeof hilo.respuestas)[number]): JsonLdNode => ({
    "@type": "Answer",
    text: r.texto,
    dateCreated: r.fecha,
    upvoteCount: r.meGusta,
    url: `${url}#r-${r.id}`,
    ...persona(r.autor),
    ...(r.replicas.length
      ? {
          comment: r.replicas.map((x) => ({
            "@type": "Comment",
            text: x.texto,
            dateCreated: x.fecha,
            url: `${url}#r-${x.id}`,
            ...persona(x.autor),
          })),
        }
      : {}),
  });

  const elegida = hilo.respuestas.find((r) => r.esGanadora);
  const demas = hilo.respuestas.filter((r) => !r.esGanadora);

  return {
    "@type": "QAPage",
    "@id": `${url}#qa`,
    url,
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: {
      "@type": "Question",
      name: hilo.titulo,
      text: hilo.texto,
      dateCreated: hilo.fecha,
      answerCount: hilo.respuestas.length,
      ...persona(hilo.autor),
      ...(elegida ? { acceptedAnswer: respuesta(elegida) } : {}),
      ...(demas.length ? { suggestedAnswer: demas.map(respuesta) } : {}),
    },
  };
}
