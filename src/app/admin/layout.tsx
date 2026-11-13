import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import AdminNav from "@/components/admin/AdminNav";
import "./admin.css";

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
        <div className="admin-sidebar-top">
          <Link href="/admin" className="admin-brand" aria-label="Panel de administración">
            <span className="admin-brand-marca" aria-hidden="true">A</span>
            <span className="admin-brand-texto">
              <b>adelin<span>btc</span></b>
              <small>Panel de control</small>
            </span>
          </Link>
        </div>
        <p className="admin-nav-titulo">Secciones</p>
        <AdminNav />
        <div className="admin-sidebar-footer">
          <Link href="/" className="admin-nav-link-small">Ver la web</Link>
          <Link href="/dashboard" className="admin-nav-link-small">Mi dashboard</Link>
          <LogoutButton />
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
