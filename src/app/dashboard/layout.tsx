import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardSidebar from "@/components/DashboardSidebar";

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
  const userName = profile?.full_name || user.email?.split("@")[0] || "Usuario";

  return (
    <div className="dash-layout">
      <DashboardSidebar role={role} userName={userName} />
      <div className="dash-content">
        <div className="bg-ambient" />
        {children}
      </div>
    </div>
  );
}
