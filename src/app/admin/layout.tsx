import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import AdminNav from "@/components/admin/AdminNav";
import Tecla from "@/components/cuaderno/Tecla";
import InterruptorSonido from "@/components/cuaderno/InterruptorSonido";
import { AVATAR_ADMIN } from "@/lib/perfilPublico";
import "./admin.css";

/**
 * El panel de administración, estilo «Cuaderno de estudio» (ESTILO.md): fondo
 * lavanda, la portada del cuaderno a la izquierda (en el móvil, una barra
 * arriba) y cada sección con su color. Solo entra el admin.
 */
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
    <div className="ad">
      <aside className="ad-lateral">
        <div className="ad-lateral-cabeza">
          <Link href="/admin" className="ad-marca" aria-label="Panel de administración">
            {/* eslint-disable-next-line @next/next/no-img-element -- estático, 256 px, ya optimizado */}
            <img src={AVATAR_ADMIN.src ?? ""} alt="" width={44} height={44} className="ad-marca-foto" />
            <span className="ad-marca-texto">
              <b>adelin<span>btc</span></b>
              <small>Panel de control</small>
            </span>
          </Link>
          <span className="ad-sonido"><InterruptorSonido /></span>
        </div>
        <p className="ad-nav-titulo">Secciones</p>
        <AdminNav />
        <div className="ad-lateral-pie">
          <Tecla href="/" color="blanca" tamano="peq" ancho>Ver la web</Tecla>
          <Tecla href="/dashboard" color="blanca" tamano="peq" ancho>Mi dashboard</Tecla>
          <LogoutButton tecla={{ color: "blanca", tamano: "peq", ancho: true }} />
        </div>
      </aside>
      <main className="ad-principal">{children}</main>
    </div>
  );
}
