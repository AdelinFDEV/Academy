import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import PostsTable from "@/components/admin/PostsTable";

export default async function AdminPostsPage() {
  const supabase = await createClient();

  const [{ data: posts }, { data: categories }, { data: allReads }] = await Promise.all([
    supabase
      .from("posts")
      .select("id, title, slug, is_premium, is_featured, published, created_at, categories(name)")
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("user_posts").select("post_id").not("read_at", "is", null),
  ]);

  // Build read count map
  const readMap: Record<string, number> = {};
  (allReads ?? []).forEach((r) => {
    if (!r.post_id) return;
    readMap[r.post_id] = (readMap[r.post_id] ?? 0) + 1;
  });

  const postsWithReads = (posts ?? []).map((p) => ({
    ...p,
    categories: p.categories as unknown as { name: string } | null,
    reads: readMap[p.id] ?? 0,
  }));

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Entradas</h1>
          <p className="admin-page-subtitle">{postsWithReads.length} entradas en total</p>
        </div>
        <Link href="/admin/posts/new" className="btn-primary btn-small">
          + Nueva entrada
        </Link>
      </div>
      <PostsTable posts={postsWithReads} categories={categories ?? []} />
    </div>
  );
}
