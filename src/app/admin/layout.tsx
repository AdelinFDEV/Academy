import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          adelin<span>btc</span>
          <small>Admin</small>
        </div>
        <nav className="admin-nav">
          <Link href="/admin">Panel</Link>
          <Link href="/admin/posts">Entradas</Link>
          <Link href="/admin/categories">Categorías</Link>
          <Link href="/admin/comments">Comentarios</Link>
        </nav>
        <div className="admin-sidebar-footer">
          <Link href="/dashboard" className="admin-nav-link-small">← Ver academia</Link>
          <LogoutButton />
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
