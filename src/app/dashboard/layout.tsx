import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import "./dashboard.css";

/**
 * El armazón de todo /dashboard (estilo «Cuaderno de estudio», 17-11-2026):
 * la barra del sitio, tal cual, y debajo el papel lavanda. Sin barras fijas ni
 * rail lateral: el admin no quiere nada que se quede anclado al hacer scroll.
 * La navegación del panel es el índice de /dashboard, que va con la página.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "free";
  const isPremium = role === "premium" || role === "admin";
  const isAdmin = role === "admin";
  const userName = profile?.full_name || user.email?.split("@")[0] || "Usuario";
  return (
    <div className="dash">
      <SiteNav user={true} isPremium={isPremium} userName={userName} isAdmin={isAdmin} />

      {children}
    </div>
  );
}
