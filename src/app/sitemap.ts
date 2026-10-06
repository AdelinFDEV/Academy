import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { GUIDES } from "@/lib/guides";
import { GLOSARIO_CON_PAGINA } from "@/lib/glosario";
import { SITE_URL } from "@/lib/site";
import type { PostCategoryRef } from "@/lib/types";

/**
 * Sitemap del sitio — punto 1 del plan SEO (ver SEO-PLAN.md).
 *
 * Next.js sirve este archivo como `/sitemap.xml`. Se regenera cada hora, que es
 * de sobra para un ritmo de una entrada cada 1-3 días y evita pegarle a Supabase
 * en cada rastreo de Google.
 *
 * Deliberadamente NO usa `@/lib/supabase/server`: ese cliente lee cookies, lo
 * que volvería la ruta dinámica y la ataría a una petición concreta. Aquí no hay
 * sesión que respetar — el sitemap es el mismo para todo el mundo.
 */
export const revalidate = 3600;

/**
 * Solo rutas públicas y indexables. Quedan fuera a propósito:
 *   - `/admin`, `/dashboard`, `/cuenta` — privadas.
 *   - `/calculadora`, `/portfolio`, `/herramientas/**` — redirigen a login o a
 *     premium, así que Google solo vería la redirección.
 *   - `/login`, `/register`, `/forgot-password`, `/auth/**`, `/mfa-challenge`,
 *     `/premium/gracias` — sin valor de búsqueda.
 *   - `/trading-en-directo` — solo admin.
 *   - `/logros` — está en `protectedRoutes` de `src/proxy.ts`, así que el
 *     middleware manda a login a quien no ha entrado. Ojo: la comprobación no
 *     se ve en su `page.tsx`, hay que mirar el middleware.
 *   - `/terminos` — es un stub que redirige a `/aviso-legal`. En el sitemap solo
 *     va el destino, nunca la redirección.
 */
const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "", priority: 1.0, changeFrequency: "daily" },
  { path: "/articulos", priority: 0.9, changeFrequency: "daily" },
  { path: "/guias", priority: 0.9, changeFrequency: "weekly" },
  { path: "/glosario", priority: 0.8, changeFrequency: "monthly" },
  // Punto 13: el tercer pilar por fin tiene URL indexable. La landing es
  // pública y responde 200 sin sesión; las herramientas con muro siguen fuera
  // del sitemap y bloqueadas en robots.txt.
  { path: "/herramientas", priority: 0.8, changeFrequency: "monthly" },
  { path: "/calculadora", priority: 0.7, changeFrequency: "monthly" },
  { path: "/trading-en-directo", priority: 0.7, changeFrequency: "monthly" },
  // Fichas públicas por herramienta: explican qué hay dentro sin abrir el
  // muro. La herramienta en sí sigue fuera del sitemap.
  { path: "/herramientas/portfolio", priority: 0.7, changeFrequency: "monthly" },
  { path: "/herramientas/diario", priority: 0.7, changeFrequency: "monthly" },
  // Estas dos viven en la raíz, no bajo /herramientas/, y es a propósito: sus
  // herramientas ocupan `/herramientas/radar` y `/herramientas/liberaciones`,
  // que están en robots.txt — y el bloqueo es POR PREFIJO, así que cualquier
  // URL que empiece igual habría quedado sin rastrear.
  { path: "/radar-diario", priority: 0.7, changeFrequency: "monthly" },
  { path: "/calendario-de-liberaciones", priority: 0.7, changeFrequency: "monthly" },
  { path: "/premium", priority: 0.7, changeFrequency: "monthly" },
  { path: "/aviso-legal", priority: 0.2, changeFrequency: "yearly" },
  { path: "/privacidad", priority: 0.2, changeFrequency: "yearly" },
  { path: "/cookies", priority: 0.2, changeFrequency: "yearly" },
];

type SitemapPost = {
  slug: string;
  created_at: string | null;
  updated_at: string | null;
  categories: PostCategoryRef | PostCategoryRef[] | null;
};

/** El join `categories(slug)` llega como objeto o como array según la consulta. */
function categorySlug(categories: SitemapPost["categories"]): string | null {
  const ref = Array.isArray(categories) ? categories[0] : categories;
  return ref?.slug ?? null;
}

async function fetchPosts(): Promise<SitemapPost[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Sin credenciales no se cae el build: se sirve el sitemap con las rutas
  // estáticas y las guías, que es mejor que devolver un 500.
  if (!url || !anonKey) return [];

  // Se prefiere la clave de servicio, y no por comodidad: la policy de `posts`
  // esconde las entradas premium a cualquiera que no lo sea, así que con la
  // clave anónima **el contenido de pago no entraría nunca en el sitemap** y
  // Google no llegaría a saber que existe. Aquí solo se piden slug y fechas
  // —nada de `content`—, y esto sigue sin leer cookies, que es lo que permite
  // a Next servir el sitemap estático.
  const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase
    .from("posts")
    .select("slug, created_at, updated_at, categories(slug)")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as SitemapPost[];
}

/**
 * Los cursos publicados, con su fecha de última edición. Sin ninguno, `/cursos`
 * sale con `noindex` y no entra aquí: un sitemap no debe apuntar a una página
 * que pide no indexarse. La policy de `cursos` deja leer los publicados con la
 * clave anónima. Si la tabla aún no existe, cuenta como que no hay ninguno.
 *
 * El aula (`/aula/**`) no entra nunca: exige sesión y está en robots.txt.
 */
async function fetchCursos(): Promise<{ slug: string; updated_at: string }[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return [];

  const supabase = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase
    .from("cursos")
    .select("slug, updated_at")
    .eq("published", true);

  return error || !data ? [] : data;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, cursos] = await Promise.all([fetchPosts(), fetchCursos()]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(
    ({ path, priority, changeFrequency }) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency,
      priority,
    })
  );

  const guideEntries: MetadataRoute.Sitemap = GUIDES.map((guide) => ({
    url: `${SITE_URL}/guias/${guide.slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  // Solo los términos con desarrollo largo: son los únicos que tienen página.
  // Un término sin `extended` ni siquiera existe como URL — ver
  // `src/app/glosario/[termino]/page.tsx`, que usa `dynamicParams = false`.
  const glosarioEntries: MetadataRoute.Sitemap = GLOSARIO_CON_PAGINA.map((t) => ({
    url: `${SITE_URL}/glosario/${t.slug}`,
    changeFrequency: "yearly",
    priority: 0.5,
  }));

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/post/${post.slug}`,
    lastModified: new Date(post.updated_at ?? post.created_at ?? Date.now()),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // Una categoría se "actualiza" cuando publica una entrada nueva, así que su
  // lastModified es la fecha de su entrada más reciente. Las categorías sin
  // ninguna entrada publicada no entran: su página saldría vacía.
  const categoryDates = new Map<string, number>();
  for (const post of posts) {
    const slug = categorySlug(post.categories);
    if (!slug) continue;
    const fecha = new Date(post.updated_at ?? post.created_at ?? Date.now()).getTime();
    categoryDates.set(slug, Math.max(categoryDates.get(slug) ?? 0, fecha));
  }

  const categoryEntries: MetadataRoute.Sitemap = [...categoryDates].map(
    ([slug, fecha]) => ({
      url: `${SITE_URL}/categoria/${slug}`,
      lastModified: new Date(fecha),
      changeFrequency: "weekly",
      priority: 0.6,
    })
  );

  // El catálogo de cursos entra solo en cuanto hay uno publicado, y con él la
  // ficha pública de cada curso, con su fecha real de edición.
  const cursoEntries: MetadataRoute.Sitemap = cursos.length
    ? [
        { url: `${SITE_URL}/cursos`, changeFrequency: "weekly", priority: 0.8 },
        ...cursos.map((c) => ({
          url: `${SITE_URL}/cursos/${c.slug}`,
          lastModified: new Date(c.updated_at),
          changeFrequency: "monthly" as const,
          priority: 0.8,
        })),
      ]
    : [];

  return [...staticEntries, ...guideEntries, ...glosarioEntries, ...postEntries, ...categoryEntries, ...cursoEntries];
}
