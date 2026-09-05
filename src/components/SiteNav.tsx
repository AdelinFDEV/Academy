import Link from "next/link";
import LiveCounter from "@/components/LiveCounter";
import GuideSearch from "@/components/GuideSearch";
import BlogMobileMenu from "@/components/BlogMobileMenu";

interface Props {
  user: boolean;
  isPremium?: boolean;
  userName?: string;
  isAdmin?: boolean;
}

// Nav compartido por todas las páginas del sitio (marca, contador de
// usuarios, buscador de guías y menú). Antes estaba duplicado línea por
// línea en 20 archivos distintos.
export default function SiteNav({ user, isPremium, userName, isAdmin }: Props) {
  return (
    <nav className="blog-nav">
      <Link href="/" className="blog-brand">
        adelin<span>btc</span>
      </Link>
      <div className="blog-nav-center">
        {/* Aquí estuvo un enlace suelto a /herramientas entre el 05 y el
            06-09-2026. Se retiró: la barra ya lleva el contador y el buscador,
            y a las herramientas se llega desde el menú, desde la banda del hero
            y desde el sidebar de la portada. No hace falta una cuarta puerta
            compitiendo por el mismo espacio. */}
        <LiveCounter />
        <span className="blog-nav-divider" aria-hidden="true" />
        <GuideSearch />
      </div>
      <BlogMobileMenu user={user} isPremium={isPremium} userName={userName} isAdmin={isAdmin} />
    </nav>
  );
}
