import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClientOpcional } from "@/lib/supabase/admin";

/**
 * Navegador por temáticas, para ponerlo al pie de cualquier página de lectura.
 *
 * Nace de un agujero real: desde el 07-09-2026 la portada dejó de listar las
 * categorías y la única navegación por temática vive en `/articulos`. Quien
 * llega a una entrada desde Google —que es casi todo el mundo— no pasa por
 * ahí: terminaba el artículo viendo el nombre de SU categoría y nada más, sin
 * forma de saber que existen otras siete.
 *
 * Es un componente de servidor: sale en el HTML inicial, así que los enlaces
 * los ve Google y tejen el enlazado interno entre entradas y listados.
 *
 * Las entradas se cuentan con `createAdminClientOpcional()`. Con el cliente
 * normal, la policy de `posts` esconde las premium y una temática que solo
 * tenga entradas de pago contaría cero y desaparecería del navegador.
 */
export default async function CategoriasNav({
  activa,
  titulo = "Explora por temática",
}: {
  /** Slug de la temática en la que ya está el visitante, si la hay. */
  activa?: string | null;
  titulo?: string;
}) {
  const supabase = await createClient();
  const lector = createAdminClientOpcional() ?? supabase;

  const [{ data: categorias }, { data: publicadas }] = await Promise.all([
    supabase.from("categories").select("id, name, slug").order("name", { ascending: true }),
    lector.from("posts").select("category_id").eq("published", true),
  ]);

  if (!categorias || categorias.length === 0) return null;

  const conteo: Record<string, number> = {};
  publicadas?.forEach((p) => {
    if (p.category_id) conteo[p.category_id] = (conteo[p.category_id] ?? 0) + 1;
  });

  // Una temática sin entradas es un enlace a una pantalla vacía. No se pinta.
  const conEntradas = categorias.filter((c) => (conteo[c.id] ?? 0) > 0);
  if (conEntradas.length === 0) return null;

  const total = publicadas?.length ?? 0;

  return (
    <nav className="cat-nav" aria-label="Temáticas del blog">
      <span className="cat-nav-titulo">{titulo}</span>
      <div className="cat-nav-lista">
        <Link href="/articulos" className="cat-nav-chip">
          Todas
          <span className="cat-nav-cifra">{total}</span>
        </Link>
        {conEntradas.map((cat) => {
          const esActiva = cat.slug === activa;
          return (
            <Link
              key={cat.slug}
              href={`/categoria/${cat.slug}`}
              className={`cat-nav-chip${esActiva ? " is-activa" : ""}`}
              aria-current={esActiva ? "page" : undefined}
            >
              {cat.name}
              <span className="cat-nav-cifra">{conteo[cat.id]}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
