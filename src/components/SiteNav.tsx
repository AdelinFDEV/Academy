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
        <LiveCounter />
        <span className="blog-nav-divider" aria-hidden="true" />
        <GuideSearch />
      </div>
      <BlogMobileMenu user={user} isPremium={isPremium} userName={userName} isAdmin={isAdmin} />
    </nav>
  );
}
