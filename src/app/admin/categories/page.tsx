import { createClient } from "@/lib/supabase/server";
import CategoryManager from "@/components/admin/CategoryManager";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Categorías</h1>
      </div>
      <CategoryManager categories={categories ?? []} />
    </div>
  );
}
