import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Footer from "@/components/Footer";
import BlogMobileMenu from "@/components/BlogMobileMenu";
import NavArticulosDropdown from "@/components/NavArticulosDropdown";
import NavEducacionDropdown from "@/components/NavEducacionDropdown";
import NavHerramientasDropdown from "@/components/NavHerramientasDropdown";
import LogoutButton from "@/components/LogoutButton";
import GlosarioClient from "./GlosarioClient";
import LiveCounter from "@/components/LiveCounter";

export const metadata: Metadata = {
  title: "Diccionario Cripto | AdelinBTC Academy",
  description: "Términos clave de criptomonedas y trading explicados de forma clara. Desde Bitcoin hasta DeFi.",
};

export default async function GlosarioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { count: usersCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });

  const initialSaved: string[] = [];
  if (user) {
    const { data } = await supabase
      .from("saved_terms")
      .select("term")
      .eq("user_id", user.id);
    initialSaved.push(...(data ?? []).map((r) => r.term));
  }

  return (
    <div className="blog-page">
      <div className="bg-ambient" />

      <nav className="blog-nav">
        <Link href="/" className="blog-brand">adelin<span>btc</span></Link>
        <LiveCounter />
        <div className="blog-nav-links">
          <NavArticulosDropdown />
          <NavEducacionDropdown />
          <NavHerramientasDropdown user={!!user} />
          {user ? (
            <>
              <Link href="/dashboard" className="btn-nav-cta">Ir a la academia →</Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="btn-nav-login">Iniciar sesión</Link>
              <Link href="/register" className="btn-nav-register">Registrarte</Link>
            </>
          )}
        </div>
        <BlogMobileMenu user={!!user} />
      </nav>

      <main className="blog-main glosario-page">
        <div className="glosario-header">
          <h1 className="glosario-title">Diccionario Cripto</h1>
          <p className="glosario-sub">
            Todos los términos que necesitas para entender el mercado crypto y el trading. Gratis, siempre actualizado.
          </p>
          {!user && (
            <p className="glosario-login-hint">
              <Link href="/login">Inicia sesión</Link> para guardar términos en tu dashboard.
            </p>
          )}
        </div>
        <GlosarioClient isLoggedIn={!!user} initialSaved={initialSaved} />
      </main>

      <Footer />
    </div>
  );
}
