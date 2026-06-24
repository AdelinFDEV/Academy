import { createClient } from "@/lib/supabase/server";
import PostForm from "@/components/admin/PostForm";
import { notFound } from "next/navigation";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: post }, { data: categories }] = await Promise.all([
    supabase.from("posts").select("*").eq("id", id).single(),
    supabase.from("categories").select("id, name").order("name"),
  ]);

  if (!post) notFound();

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Editar entrada</h1>
      </div>
      <PostForm categories={categories ?? []} post={post} />
    </div>
  );
}
