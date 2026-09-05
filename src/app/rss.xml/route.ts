import { createClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/site";
import type { PostCategoryRef } from "@/lib/types";

/**
 * Feed RSS del blog — punto 12 del plan SEO (ver SEO-PLAN.md).
 *
 * Next sirve este Route Handler como `/rss.xml`. Se regenera cada hora, igual
 * que el sitemap, que es de sobra para un ritmo de una entrada cada 1-3 días.
 *
 * Comparte dos decisiones con `src/app/sitemap.ts`, y por el mismo motivo:
 *
 *   · **Cliente anónimo, sin cookies.** Usar `@/lib/supabase/server` volvería la
 *     ruta dinámica y le pegaría a Supabase en cada petición. Aquí no hay sesión
 *     que respetar: el feed es idéntico para todo el mundo.
 *   · **Si faltan credenciales no se cae**, se sirve un feed vacío pero válido.
 *     Un 500 en el feed hace que los lectores lo den de baja.
 *
 * Van solo las **entradas**. Las guías y el diccionario no son novedades
 * periódicas —se actualizan, no se publican una tras otra—, y meterlas
 * republicaría lo mismo cada vez que se toca una coma.
 */
export const revalidate = 3600;

type FeedPost = {
  slug: string;
  title: string;
  excerpt: string | null;
  meta_description: string | null;
  cover_image: string | null;
  created_at: string;
  categories: PostCategoryRef | PostCategoryRef[] | null;
};

/** Los cinco caracteres que rompen un XML si van sueltos. */
function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** RSS 2.0 exige fechas en formato RFC 822, no ISO. */
function rfc822(fecha: string): string {
  return new Date(fecha).toUTCString();
}

function categoria(cats: FeedPost["categories"]): PostCategoryRef | null {
  return (Array.isArray(cats) ? cats[0] : cats) ?? null;
}

async function fetchPosts(): Promise<FeedPost[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return [];

  // Con la clave de servicio si la hay, para que las entradas premium también
  // se anuncien en el feed. El RSS **nunca lleva el cuerpo del artículo**: solo
  // título, extracto y enlace, así que anunciarlas no abre el muro — quien
  // pinche acabará en la página con el muro puesto.
  const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase
    .from("posts")
    .select("slug, title, excerpt, meta_description, cover_image, created_at, categories(name, slug)")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error || !data) return [];
  return data as FeedPost[];
}

export async function GET() {
  const posts = await fetchPosts();

  const items = posts
    .map((post) => {
      const url = `${SITE_URL}/post/${post.slug}`;
      // `PostCategoryRef` marca `name` como opcional: una entrada puede no
      // tener categoría, y entonces el <category> simplemente no se emite.
      const nombreCat = categoria(post.categories)?.name;
      // El resumen, nunca el artículo entero: el feed lleva a la web, no la
      // sustituye. Y así no hay dos copias del mismo texto circulando.
      const resumen = post.meta_description || post.excerpt || "";

      return `    <item>
      <title>${esc(post.title)}</title>
      <link>${esc(url)}</link>
      <guid isPermaLink="true">${esc(url)}</guid>
      <pubDate>${rfc822(post.created_at)}</pubDate>
      ${resumen ? `<description>${esc(resumen)}</description>` : ""}
      ${nombreCat ? `<category>${esc(nombreCat)}</category>` : ""}
      ${post.cover_image ? `<enclosure url="${esc(post.cover_image)}" type="image/webp" />` : ""}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AdelinBTC Academy</title>
    <link>${SITE_URL}</link>
    <description>Análisis de mercado, educación blockchain y herramientas para operar con criterio.</description>
    <language>es-ES</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      // Que las cachés intermedias lo respeten igual que Next.
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
