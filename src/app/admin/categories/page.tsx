import { createClient } from "@/lib/supabase/server";
import CategoryManager from "@/components/admin/CategoryManager";

export default async function CategoriesPage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: postRows }] = await Promise.all([
    supabase.from("categories").select("id, name, slug").order("name"),
    supabase.from("posts").select("category_id, published"),
  ]);

  // Count published posts per category
  const countMap: Record<string, number> = {};
  (postRows ?? []).filter((p) => p.published).forEach((p) => {
    if (!p.category_id) return;
    countMap[p.category_id] = (countMap[p.category_id] ?? 0) + 1;
  });

  const categoriesWithCount = (categories ?? []).map((c) => ({
    ...c,
    postCount: countMap[c.id] ?? 0,
  }));

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Categorías</h1>
          <p className="admin-page-subtitle">{categoriesWithCount.length} categorías</p>
        </div>
      </div>
      <CategoryManager categories={categoriesWithCount} />
    </div>
  );
}
