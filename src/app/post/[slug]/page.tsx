import type { Metadata } from "next";
import { fechaLarga } from "@/lib/fechas";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, createAdminClientOpcional } from "@/lib/supabase/admin";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import Icon from "@/components/Icon";
import PostInteractions from "@/components/PostInteractions";
import SiteNav from "@/components/SiteNav";
import SocialLinks from "@/components/SocialLinks";
import PostCtaFinal from "@/components/PostCtaFinal";
import ReadingProgress from "@/components/ReadingProgress";
import TableOfContents from "@/components/TableOfContents";
import CommentForm from "@/components/CommentForm";
import JsonLd from "@/components/JsonLd";
import CategoriasNav from "@/components/CategoriasNav";
import { articleSchema, breadcrumbSchema } from "@/lib/schema";
import type { PostCategoryRef, CommentProfileRef } from "@/lib/types";
import { esAdmin, metadataDeBorrador } from "@/lib/borradores";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  // Las entradas premium las oculta la policy de `posts`, asi que sin este
  // lector la etiqueta de la pagina saldria vacia y Google veria un 404.
  const lector = createAdminClientOpcional() ?? supabase;

  const CAMPOS_META =
    "title, excerpt, cover_image, seo_title, meta_description, focus_keyword, created_at, updated_at";

  const { data: post } = await lector
    .from("posts")
    .select(CAMPOS_META)
    .eq("slug", slug)
    .eq("published", true)
    .single();

  // Si no está publicada, puede ser un borrador que el admin está revisando.
  // Ver `src/lib/borradores.ts`: el filtro de arriba no se toca, esto solo
  // añade un segundo intento sobre lo que iba a ser un 404 de todas formas.
  if (!post) {
    const { data: { user } } = await supabase.auth.getUser();
    if (await esAdmin(supabase, user?.id)) {
      const { data: borrador } = await lector
        .from("posts")
        .select(CAMPOS_META)
        .eq("slug", slug)
        .single();
      if (borrador) {
        return metadataDeBorrador(
          borrador.seo_title || borrador.title,
          borrador.meta_description || borrador.excerpt || undefined,
        );
      }
    }
  }

  // Sin entrada no hay canónica que declarar: la ruta acabará en notFound().
  if (!post) return { title: "Artículo no encontrado" };

  const seoTitle = post.seo_title || post.title;
  const description = post.meta_description || post.excerpt || undefined;

  return {
    title: seoTitle,
    description,
    keywords: post.focus_keyword ?? undefined,
    alternates: { canonical: `/post/${slug}` },
    openGraph: {
      type: "article",
      title: seoTitle,
      description,
      // Un OpenGraph de tipo `article` sin fechas ni autor deja a las redes
      // y a los agregadores sin saber si el texto es de hoy o de hace dos
      // años. El autor es la marca porque la tabla `posts` no guarda autor:
      // firmar con un nombre inventado sería peor que no firmar.
      publishedTime: post.created_at,
      modifiedTime: post.updated_at ?? post.created_at,
      authors: ["AdelinBTC Academy"],
      ...(post.cover_image ? { images: [{ url: post.cover_image }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description,
    },
  };
}


function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// El contenido ya es HTML (lo escribe Claude directamente, sin Markdown de por
// medio) — el índice se saca leyendo los <h2>/<h3> reales del artículo.
//
// Devuelve el índice Y el HTML con los `id` ya puestos, EN LA MISMA PASADA, que
// es justo lo que fallaba: una función calculaba un slug por encabezado para
// pintar el índice, y el cuerpo del artículo se volcaba tal cual, sin un solo
// `id`. Todos los enlaces de «En este artículo» apuntaban a anclas que no
// existían. No cantaba porque saltar a un ancla inexistente no da error: al
// pulsar sencillamente no pasa nada.
//
// Calcular las dos cosas a la vez es lo que impide que vuelvan a separarse.
function indexarArticulo(html: string) {
  const headings: { id: string; text: string; level: number }[] = [];
  const usados = new Map<string, number>();

  const conIds = html.replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (etiqueta, nivel: string, atributos: string, interior: string) => {
      const text = interior.replace(/<[^>]+>/g, "").trim();
      const propio = /\sid="([^"]*)"/i.exec(atributos)?.[1];
      let id = propio || slugify(text);

      // Un encabezado sin texto ni id no puede ser destino de nada.
      if (!id) return etiqueta;

      // Dos apartados titulados igual darían el mismo id, y el navegador
      // saltaría siempre al primero.
      const vistas = usados.get(id) ?? 0;
      usados.set(id, vistas + 1);
      if (vistas > 0) id = `${id}-${vistas + 1}`;

      headings.push({ id, text, level: Number(nivel) });

      const resto = atributos.replace(/\sid="[^"]*"/i, "");
      return `<h${nivel}${resto} id="${id}">${interior}</h${nivel}>`;
    }
  );

  return { headings, html: conIds };
}

function getYoutubeId(url: string) {
  const match = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/);
  return match?.[1] ?? null;
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  // ── Dos rondas de consultas, no seis ──────────────────────────────────────
  //
  // Antes esto era una cadena: sesión → entrada → perfil → comentarios →
  // comentario pendiente → relacionadas, cada una esperando a la anterior. Seis
  // viajes al servidor puestos en fila, y esta es la página que más tráfico de
  // búsqueda va a recibir (medido el 31-08-2026: 1.156 ms de TTFB en
  // producción, cuatro veces más que cualquier otra ruta).
  //
  // La clave es que casi nada depende de casi nada: la entrada se busca por su
  // slug y no necesita saber quién mira, y todo lo demás solo necesita el
  // usuario y el id de la entrada. Así que van en dos tandas paralelas.
  // La entrada se lee saltando RLS a propósito. La policy de `posts` esconde la
  // fila entera de una entrada premium a quien no lo es, y eso dejaba el muro
  // de pago inalcanzable: 404 para Google y para cualquier usuario free que
  // recibiera el enlace. El filtro de `published` se mantiene, así que los
  // borradores siguen sin verse, y el `content` se retira más abajo cuando no
  // hay acceso — antes de que nada llegue al navegador.
  const lector = createAdminClientOpcional() ?? supabase;

  const [{ data: { user } }, { data: publicada }] = await Promise.all([
    supabase.auth.getUser(),
    lector
      .from("posts")
      .select("*, categories(name, slug)")
      .eq("slug", slug)
      .eq("published", true)
      .single(),
  ]);

  // Si no está publicada, el admin puede estar revisando el borrador antes de
  // publicarlo — publicar manda un aviso a Telegram, así que no vale «publico
  // y miro». El porqué y las garantías, en `src/lib/borradores.ts`.
  let post = publicada;
  let esBorrador = false;
  if (!post && (await esAdmin(supabase, user?.id))) {
    const { data: borrador } = await lector
      .from("posts")
      .select("*, categories(name, slug)")
      .eq("slug", slug)
      .single();
    if (borrador) {
      post = borrador;
      esBorrador = true;
    }
  }

  if (!post) notFound();

  // Anti-spam: ¿el usuario ya tiene un comentario pendiente (en cualquier
  // entrada)? Se lee con el cliente admin porque la policy pública de
  // `comments` solo expone los aprobados. Si faltara la service key no se rompe
  // la página, que es pública; el trigger de la BD sigue bloqueando el doble
  // comentario de todas formas.
  const admin =
    user && process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : null;

  // Artículos relacionados: misma categoría, con reserva a los más recientes.
  // Con `lector`, para que una entrada premium también salga aquí con su
  // candado en vez de desaparecer del bloque.
  let relatedQuery = lector
    .from("posts")
    .select("id, title, slug, cover_image, is_premium, created_at, categories(name)")
    .eq("published", true)
    .neq("id", post.id)
    .order("created_at", { ascending: false })
    .limit(3);

  if (post.category_id) relatedQuery = relatedQuery.eq("category_id", post.category_id);

  const [
    profileRes,
    commentsRes,
    userPostRes,
    likeCountRes,
    userLikedRes,
    pendingRes,
    relatedRes,
  ] = await Promise.all([
    user
      ? supabase.from("profiles").select("full_name, role").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
    supabase
      .from("comments")
      .select("id, content, created_at, profiles(full_name, is_featured)")
      .eq("post_id", post.id)
      .eq("approved", true)
      .order("created_at", { ascending: true }),
    user
      ? supabase
          .from("user_posts")
          .select("saved, read_at")
          .eq("user_id", user.id)
          .eq("post_id", post.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("post_likes")
      .select("id", { count: "exact", head: true })
      .eq("post_id", post.id),
    user
      ? supabase
          .from("post_likes")
          .select("id")
          .eq("post_id", post.id)
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    admin && user
      ? admin
          .from("comments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("approved", false)
      : Promise.resolve({ count: 0 }),
    relatedQuery,
  ]);

  const profileData = profileRes.data;
  const role = profileData?.role ?? "free";
  const isPremium = role === "premium" || role === "admin";
  const isAdmin = role === "admin";
  const userName = profileData?.full_name || user?.email?.split("@")[0] || "Usuario";

  const hasAccess = !post.is_premium || isPremium;

  // Y aquí se cae el texto de pago, en cuanto se sabe que no toca. La página ya
  // solo pinta `post.content` si `hasAccess`, así que esto es un cinturón sobre
  // los tirantes: si algún día alguien añade otro sitio donde se use el
  // contenido, aquí ya no hay nada que filtrar.
  if (!hasAccess) post.content = null;

  const comments = commentsRes.data;
  const userPost = userPostRes.data as { saved: boolean; read_at: string | null } | null;
  const hasPendingComment = (pendingRes.count ?? 0) > 0;

  const initialLikes = (post.base_likes ?? 0) + (likeCountRes.count ?? 0);
  const initialLiked = !!userLikedRes.data;
  const initialShares = post.shares_count ?? 0;

  const youtubeId = post.youtube_url ? getYoutubeId(post.youtube_url) : null;
  const wordCount = post.content ? post.content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length : 0;
  const readingMinutes = Math.max(1, Math.round(wordCount / 200));
  const { headings, html: cuerpoConAnclas } = post.content
    ? indexarArticulo(post.content)
    : { headings: [], html: "" };

  // La reserva sigue siendo secuencial a propósito: solo salta cuando la
  // categoría no tiene ninguna otra entrada publicada, que es raro. Lanzarla
  // siempre en paralelo costaría una consulta de más en todas las visitas para
  // ahorrar un viaje en unas pocas.
  let related = relatedRes.data;

  if ((!related || related.length === 0) && post.category_id) {
    const fb = await supabase
      .from("posts")
      .select("id, title, slug, cover_image, is_premium, created_at, categories(name)")
      .eq("published", true)
      .neq("id", post.id)
      .order("created_at", { ascending: false })
      .limit(3);
    related = fb.data;
  }

  return (
    <div className="blog-page">
      <div className="bg-ambient" />

      <SiteNav user={!!user} isPremium={isPremium} userName={user ? userName : undefined} isAdmin={isAdmin} />

      {/* La barra mide ESTE elemento, no el documento: si midiera el scroll
          entero, los relacionados y el hilo de comentarios contarían como
          artículo y la barra llegaría al final estando a medio leer. Cuando la
          entrada está tras el muro el selector no encuentra nada y se cae al
          documento, que es el comportamiento de siempre. */}
      <ReadingProgress target="#cuerpo-articulo" minutos={readingMinutes} />

      {/* Los mismos escalones que las migas de pan de abajo, y en el mismo
          orden: Google exige que el dato estructurado se corresponda con lo que
          ve el visitante. Si algún día cambia una, cambia la otra. */}
      <JsonLd
        data={[
          articleSchema({
            slug,
            title: post.title,
            description: post.meta_description || post.excerpt,
            coverImage: post.cover_image,
            createdAt: post.created_at,
            updatedAt: post.updated_at,
            isPremium: post.is_premium,
          }),
          breadcrumbSchema([
            { name: "Inicio", path: "/" },
            { name: "Artículos", path: "/articulos" },
            ...((post.categories as PostCategoryRef | null)?.name
              ? [{
                  name: (post.categories as PostCategoryRef).name,
                  path: `/categoria/${(post.categories as PostCategoryRef).slug}`,
                }]
              : []),
            { name: post.title, path: `/post/${slug}` },
          ]),
        ]}
      />

      <main className="post-page">

        {/* Breadcrumb */}
        <nav className="post-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Inicio</Link>
          <span className="post-breadcrumb-sep">›</span>
          <Link href="/articulos">Artículos</Link>
          {(post.categories as PostCategoryRef | null)?.name && (
            <>
              <span className="post-breadcrumb-sep">›</span>
              <Link href={`/categoria/${(post.categories as PostCategoryRef).slug}`}>
                {(post.categories as PostCategoryRef).name}
              </Link>
            </>
          )}
          <span className="post-breadcrumb-sep">›</span>
          <span className="post-breadcrumb-current">{post.title}</span>
        </nav>

        {/* Solo lo ve el admin, y solo mientras la entrada siga sin publicar.
            Va arriba del todo y bien visible a propósito: lo peligroso de una
            vista previa es olvidar que lo es y darla por publicada. */}
        {esBorrador && (
          <p className="post-borrador" role="status">
            <strong>Borrador.</strong> Solo tú ves esta página, y lleva <code>noindex</code>.
            No está en el sitemap, ni en el RSS, ni en ningún listado.
          </p>
        )}

        {/* Header del post */}
        <div className="post-header">
          <div className="post-header-meta">
            {(post.categories as PostCategoryRef | null)?.name && (
              <span className="post-category">{(post.categories as PostCategoryRef).name}</span>
            )}
            {post.is_premium && <span className="post-category premium-cat">Premium</span>}
          </div>
          <h1 className="post-title">{post.title}</h1>
          {post.excerpt && <p className="post-lead">{post.excerpt}</p>}
          <div className="post-header-bottom">
            <div className="post-author-row">
              <span className="post-author">AdelinBTC</span>
              <span className="post-author-sep">·</span>
              <span className="post-date-full">{fechaLarga(post.created_at)}</span>
              <span className="post-author-sep">·</span>
              <span className="post-date-full">{readingMinutes} min de lectura</span>
            </div>
            <SocialLinks variant="post" />
          </div>
          <PostInteractions
            postId={post.id}
            postSlug={slug}
            commentsCount={comments?.length ?? 0}
            initialLikes={initialLikes}
            initialLiked={initialLiked}
            initialShares={initialShares}
            initialSaved={userPost?.saved ?? false}
            initialRead={!!userPost?.read_at}
            isLoggedIn={!!user}
            variant="post"
          />
        </div>

        {/* Arriba también, no solo al pie. Al final del artículo el que
            sigue leyendo ya ha decidido quedarse; arriba es donde el que llegó
            buscando una cosa concreta descubre que hay otras siete secciones. */}
        <CategoriasNav
          activa={(post.categories as PostCategoryRef | null)?.slug ?? null}
          titulo="Temas de la academia"
          variant="cabecera"
        />

        {/* Portada: vídeo de YouTube si existe, sino imagen estática */}
        {youtubeId ? (
          <div className="post-video">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
              title={post.title}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        ) : post.cover_image ? (
          <div className="post-cover">
            <img src={post.cover_image} alt={post.title} />
          </div>
        ) : null}

        {/* Contenido o paywall */}
        {hasAccess ? (
          <>

            <TableOfContents headings={headings} />

            <div
              id="cuerpo-articulo"
              className="post-content prose-content"
              dangerouslySetInnerHTML={{ __html: cuerpoConAnclas }}
            />

            {/* Las mismas acciones que arriba, pero AQUÍ es donde se usan:
                nadie guarda ni comparte algo que todavía no ha leído. La de la
                cabecera se queda porque da contexto social —cuánta gente lo ha
                encontrado útil— antes de invertir el tiempo en leerlo.

                `marksRead={false}`: marcar la entrada como leída es cosa de una
                sola barra, o cada visita dispara dos veces /api/user-posts. */}
            <div className="post-cierre-acciones">
              <span className="post-cierre-label">¿Te ha servido este artículo?</span>
              <PostInteractions
                postId={post.id}
                postSlug={slug}
                commentsCount={comments?.length ?? 0}
                initialLikes={initialLikes}
                initialLiked={initialLiked}
                initialShares={initialShares}
                initialSaved={userPost?.saved ?? false}
                initialRead={!!userPost?.read_at}
                isLoggedIn={!!user}
                variant="post"
                marksRead={false}
              />
            </div>

            {/* Cierre fijo: siempre hay un siguiente paso, sea quien sea el
                que lee. Antes los Premium terminaban el artículo sin nada. */}
            <PostCtaFinal logueado={!!user} esPremium={isPremium} />
          </>
        ) : !user ? (
          <div className="post-paywall">
            <div className="paywall-icon"><Icon name="lock" size={26} /></div>
            <h3>Crea tu cuenta para seguir leyendo</h3>
            <p>Este artículo es exclusivo. Regístrate gratis para acceder al contenido premium y al resto de la academia.</p>
            <div className="article-cta-actions">
              <Link href="/register" className="btn-primary" style={{ textDecoration: "none" }}>
                Regístrate gratis →
              </Link>
              <Link href="/login" className="cta-btn-secondary">Ya tengo cuenta</Link>
            </div>
          </div>
        ) : (
          <div className="post-paywall">
            <div className="paywall-icon"><Icon name="lock" size={26} /></div>
            <h3>Contenido exclusivo Premium</h3>
            <p>Este artículo es solo para miembros Premium. Desbloquea acceso ilimitado a todo el contenido.</p>
            <Link href="/dashboard" className="btn-primary" style={{ textDecoration: "none" }}>
              Hazte Premium →
            </Link>
          </div>
        )}

        {/* Artículos relacionados */}
        {related && related.length > 0 && (
          <div className="related-posts">
            <h2 className="related-title">Sigue leyendo</h2>
            <div className="related-grid">
              {related.map((rp) => (
                <Link key={rp.id} href={`/post/${rp.slug}`} className="related-card">
                  <div
                    className="related-card-image"
                    style={rp.cover_image ? { backgroundImage: `url(${rp.cover_image})` } : undefined}
                  >
                    {!rp.cover_image && <span className="related-card-placeholder"><Icon name="chart" size={28} /></span>}
                    {rp.is_premium && <span className="post-premium-badge">Premium</span>}
                  </div>
                  <div className="related-card-body">
                    {(rp.categories as PostCategoryRef | null)?.name && (
                      <span className="related-card-cat">{(rp.categories as PostCategoryRef).name}</span>
                    )}
                    <h3 className="related-card-title">{rp.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Quien llega desde Google termina el artículo sin saber que hay
            otras temáticas: la portada ya no las lista y `/articulos` no lo
            pisa nadie que entre por una entrada. Van antes de los comentarios,
            que es donde se decide adónde ir después. */}
        <CategoriasNav
          activa={(post.categories as PostCategoryRef | null)?.slug ?? null}
          titulo="Sigue explorando por temática"
        />

        {/* Comentarios */}
        <div id="comentarios" className="post-comments">
          <h2 className="comments-title">Comentarios ({comments?.length ?? 0})</h2>

          {user && hasAccess && <CommentForm postId={post.id} hasPending={hasPendingComment} />}

          {!user && (
            <div className="comments-register-cta">
              <p className="comments-register-cta-text">
                Únete a la comunidad y participa en la conversación.
              </p>
              <div className="comments-register-cta-actions">
                <Link href="/register" className="cta-btn-primary">Crear cuenta gratis →</Link>
                <Link href="/login" className="cta-btn-secondary">Ya tengo cuenta</Link>
              </div>
            </div>
          )}

          <div className="comments-list">
            {comments?.length === 0 && (
              <p className="comments-empty">Sé el primero en comentar.</p>
            )}
            {comments?.map((c) => (
              <div key={c.id} className="comment-item">
                <div className="comment-item-meta">
                  <span className="comment-author">
                    {(c.profiles as CommentProfileRef | null)?.full_name ?? "Usuario"}
                    {(c.profiles as CommentProfileRef | null)?.is_featured && (
                      <span className="featured-star" title="Usuario destacado — 30 días de racha">★</span>
                    )}
                  </span>
                  <span className="comment-item-date">{fechaLarga(c.created_at)}</span>
                </div>
                <p className="comment-item-content">{c.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Botones volver */}
        <div className="post-back-row">
          <Link href="/articulos" className="post-back-btn">
            ← Ver todos los artículos
          </Link>
          {user && (
            <Link href="/dashboard" className="post-back-btn">
              Ir a Academia →
            </Link>
          )}
        </div>

      </main>

      <Footer />
    </div>
  );
}
