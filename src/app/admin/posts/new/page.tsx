import { createClient } from "@/lib/supabase/server";
import PostForm from "@/components/admin/PostForm";

export default async function NewPostPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("id, name").order("name");

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Nueva entrada</h1>
      </div>
      <PostForm categories={categories ?? []} />
    </div>
  );
}
