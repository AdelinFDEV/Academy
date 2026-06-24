import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Footer from "@/components/Footer";
import Icon from "@/components/Icon";
import ArticulosClient from "./ArticulosClient";

export const metadata: Metadata = {
  title: "Artículos | AdelinBTC Academy",
  description: "Todos los análisis, guías y publicaciones de AdelinBTC Academy.",
};

export default async function ArticulosPage() {
  const supabase = await createClient();

  const [{ data: posts }, { data: categories }] = await Promise.all([
    supabase
      .from("posts")
      .select("id, title, slug, excerpt, cover_image, is_premium, created_at, categories(name, slug)")
      .eq("published", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("categories")
      .select("name, slug")
      .order("name", { ascending: true }),
  ]);

  return (
    <div className="blog-page">
      <div className="bg-ambient" />

      <nav className="blog-nav">
        <Link href="/" className="blog-brand">adelin<span>btc</span></Link>
        <div className="blog-nav-links">
          <Link href="/" className="btn-nav-back">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Volver
          </Link>
        </div>
      </nav>

      <main className="articulos-page">
        <div className="articulos-layout">
          <ArticulosClient
            posts={(posts ?? []) as any}
            categories={categories ?? []}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
