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
import { INSTAGRAM_URL, TELEGRAM_ADELIN_URL, YOUTUBE_URL } from "@/lib/contacto";
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
    sameAs: [INSTAGRAM_URL, YOUTUBE_URL, TELEGRAM_ADELIN_URL],
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

export type ArticleInput = {
  slug: string;
  title: string;
  description?: string | null;
  coverImage?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  isPremium?: boolean;
};

/**
 * Una entrada del blog.
 *
 * `author` es la organización y no una persona porque la tabla `posts` no
 * guarda autor: inventar un nombre por entrada sería exactamente el tipo de
 * dato que no se puede verificar en la página.
 *
 * `isAccessibleForFree` en las premium es lo que evita que Google interprete
 * el muro de pago como cloaking — mostrarle a él un contenido y al visitante
 * otro. Declararlo es la forma admitida de decir «esto está detrás de un muro,
 * y lo sé».
 */
export function articleSchema(post: ArticleInput): JsonLdNode {
  const url = `${SITE_URL}/post/${post.slug}`;
  return {
    "@type": "Article",
    "@id": `${url}#article`,
    headline: post.title,
    ...(post.description ? { description: post.description } : {}),
    // Sin portada propia cae en la imagen genérica del sitio, que existe de
    // verdad (`src/app/opengraph-image.tsx`).
    image: post.coverImage || `${SITE_URL}/opengraph-image`,
    datePublished: post.createdAt,
    dateModified: post.updatedAt || post.createdAt,
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    isPartOf: { "@id": WEBSITE_ID },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    inLanguage: "es-ES",
    isAccessibleForFree: !post.isPremium,
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
