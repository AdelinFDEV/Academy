/**
 * Tipos compartidos para las formas que devuelven los joins de Supabase.
 *
 * El cliente de Supabase no puede inferir bien la forma de un join anidado
 * (`select("..., categories(name, slug)")`) sin tipos generados de la base de
 * datos, así que devuelve algo demasiado laxo. Antes se resolvía con `as any`
 * repartido por medio proyecto, lo que apagaba el chequeo de tipos justo en el
 * punto donde más útil es: al leer campos de un objeto que puede venir vacío.
 *
 * Estos alias describen únicamente los campos que el código consume. No
 * pretenden reflejar la tabla entera.
 */

/** Join `categories(name, slug)` en las consultas de posts. */
export type PostCategoryRef = {
  name?: string | null;
  slug?: string | null;
};

/** Join `profiles(full_name, is_featured)` en las consultas de comentarios. */
export type CommentProfileRef = {
  full_name?: string | null;
  is_featured?: boolean | null;
};

/**
 * Comentario tal y como lo consultan las pantallas de admin, con sus dos joins.
 * Coincide con el tipo que ya usaba `CommentManager` internamente.
 */
export type AdminComment = {
  id: string;
  content: string;
  approved: boolean;
  created_at: string;
  profiles: { full_name: string | null } | null;
  posts: { title: string; slug: string } | null;
};
